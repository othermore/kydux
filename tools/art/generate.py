#!/usr/bin/env python3
"""Have a service draw an image from a prompt file (plan, phase 4; D72).

    tools/art/generate.py tools/art/prompts/<name>.md [--dry-run]

A prompt file is Markdown with a front matter between two `---` lines, each line
`key: value` (a value that reads as JSON is taken as JSON):

- `candidate`: the folder under art/raw/ the image goes to;
- `service`: `gemini`, `retrodiffusion` or `pixellab`;
- for Gemini, `model`; for Retro Diffusion, `prompt_style`, `width`, `height`
  and its other fields; for PixelLab, `endpoint` (`create-image-pixflux`,
  `create-tileset`, `create-character-with-4-directions`...), `prompt_field`
  (the body's field the prompt goes in, `description` unless it says) and
  the endpoint's fields.

The prompt is the file's words. The images land in art/raw/<candidate>/ as
<name>.png (<name>-2.png...; an animation also as <name>.gif, and its png a strip
of its frames), beside <name>.json with the service, the model,
the fields, the prompt, the date and what the service said it cost; a service
that answers with more than images (a tileset's tiles, a character's frames)
has its whole answer kept in <name>.answer.json. art/raw/ is not committed.

The keys are read from the environment or from ~/.config/kydux/secrets.env:
GEMINI_API_KEY, RETRO_DIFFUSION_API_KEY (or RETRODIFUSSION_API_KEY) and
PIXELLAB_API_KEY, and never printed. A service's web login is never used.
"""

import argparse
import base64
import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "art" / "raw"
SECRETS = Path.home() / ".config" / "kydux" / "secrets.env"
#: How long a service's background job is waited for, and how often it is asked.
WAIT_S = 600
POLL_S = 5


class ArtError(RuntimeError):
    """A prompt that cannot be sent, or an answer with no image."""


def secret(*names: str) -> str:
    """The first of `names` set in the environment or in secrets.env."""
    for name in names:
        if os.environ.get(name):
            return os.environ[name]
    if SECRETS.is_file():
        found = {}
        for line in SECRETS.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.split("=", 1)
                found[key.strip()] = value.strip().strip("\"'")
        for name in names:
            if found.get(name):
                return found[name]
    raise ArtError(f"none of {', '.join(names)} in the environment or in {SECRETS}")


def read_prompt(path: Path) -> tuple[dict, str]:
    """A prompt file's fields and its words."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ArtError(f"{path.name}: a prompt file opens with its front matter between --- lines")
    head, _, body = text[4:].partition("\n---\n")
    fields: dict = {}
    for line in head.splitlines():
        if not line.strip():
            continue
        if ":" not in line:
            raise ArtError(f"{path.name}: cannot read {line!r}")
        key, value = (part.strip() for part in line.split(":", 1))
        try:
            fields[key] = json.loads(value)
        except json.JSONDecodeError:
            fields[key] = value
    for needed in ("candidate", "service"):
        if needed not in fields:
            raise ArtError(f"{path.name}: a prompt file says its {needed}")
    if fields["service"] not in SERVICES:
        raise ArtError(f"{path.name}: the service is one of {', '.join(SERVICES)}")
    return fields, body.strip()


def _http(method: str, url: str, headers: dict, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    if data is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        detail = error.read()[:500].decode(errors="replace")
        raise ArtError(f"{method} {url}: {error.code} {detail}") from error


def gemini(fields: dict, prompt: str) -> tuple[list[bytes], dict]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=secret("GEMINI_API_KEY"))
    answer = client.models.generate_content(
        model=fields.get("model", "gemini-3.1-flash-image"),
        contents=prompt,
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )
    images = [
        part.inline_data.data
        for candidate in answer.candidates or []
        for part in ((candidate.content and candidate.content.parts) or [])
        if part.inline_data
    ]
    usage = answer.usage_metadata
    reasons = [str(c.finish_reason) for c in answer.candidates or []]
    return images, {"tokens": getattr(usage, "total_token_count", None), "finish": reasons}


def retrodiffusion(fields: dict, prompt: str) -> tuple[list[bytes], dict]:
    key = secret("RETRO_DIFFUSION_API_KEY", "RETRODIFUSSION_API_KEY")
    url = "https://api.retrodiffusion.ai/v2/inferences"
    body = {k: v for k, v in fields.items() if k not in ("candidate", "service")}
    body.setdefault("num_images", 1)
    if prompt:
        body["prompt"] = prompt
    headers = {"X-RD-Token": key, "Idempotency-Key": str(uuid.uuid4())}
    accepted = _http("POST", url, headers, body)
    result = accepted
    if "task_id" in accepted:
        deadline = time.monotonic() + WAIT_S
        while True:
            result = _http("GET", f"{url}/tasks/{accepted['task_id']}", {"X-RD-Token": key})
            if result.get("status") in ("succeeded", "failed", "canceled"):
                break
            if time.monotonic() > deadline:
                raise ArtError("Retro Diffusion did not answer in time")
            time.sleep(POLL_S)
        if result.get("status") != "succeeded":
            raise ArtError(f"Retro Diffusion: {result.get('status')} {result.get('error', '')}")
        result = result.get("result", result)
    images = [base64.b64decode(b) for b in result.get("base64_images", [])]
    cost = {
        k: result.get(k) for k in ("balance_cost", "remaining_balance", "model") if k in result
    }
    return images, cost


def _pixellab_images(answer: object) -> list[bytes]:
    """Every base64 image in a PixelLab answer, however deep."""
    found: list[bytes] = []
    if isinstance(answer, dict):
        if answer.get("type") == "base64" and isinstance(answer.get("base64"), str):
            found.append(base64.b64decode(answer["base64"]))
        else:
            for value in answer.values():
                found.extend(_pixellab_images(value))
    elif isinstance(answer, list):
        for value in answer:
            found.extend(_pixellab_images(value))
    return found


def pixellab(fields: dict, prompt: str) -> tuple[list[bytes], dict]:
    key = secret("PIXELLAB_API_KEY")
    base = "https://api.pixellab.ai/v2"
    headers = {"Authorization": f"Bearer {key}"}
    endpoint = fields.get("endpoint", "create-image-pixflux")
    skip = ("candidate", "service", "endpoint", "prompt_field")
    body = {k: v for k, v in fields.items() if k not in skip}
    if prompt:
        body[fields.get("prompt_field", "description")] = prompt
    answer = _http("POST", f"{base}/{endpoint}", headers, body)
    job = answer.get("background_job_id") or (answer.get("data") or {}).get("background_job_id")
    if job:
        deadline = time.monotonic() + WAIT_S
        while True:
            status = _http("GET", f"{base}/background-jobs/{job}", headers)
            state = status.get("status") or (status.get("data") or {}).get("status")
            if state in ("completed", "succeeded", "failed", "error"):
                answer = status
                break
            if time.monotonic() > deadline:
                raise ArtError("PixelLab did not answer in time")
            time.sleep(POLL_S)
        if state not in ("completed", "succeeded"):
            raise ArtError(f"PixelLab: {state} {json.dumps(status)[:300]}")
    # A tileset is made by the job and fetched by its id; its tiles are the images.
    tileset = _find(answer, "tileset_id")
    if tileset and not _pixellab_images(answer):
        answer = _http("GET", f"{base}/tilesets/{tileset}", headers)
    balance = _http("GET", f"{base}/balance", headers)
    return _pixellab_images(answer), {"answer": answer, "balance": balance}


def _find(answer: object, key: str) -> str | None:
    """The first value of `key` in an answer, however deep."""
    if isinstance(answer, dict):
        if isinstance(answer.get(key), str):
            return answer[key]
        for value in answer.values():
            found = _find(value, key)
            if found:
                return found
    elif isinstance(answer, list):
        for value in answer:
            found = _find(value, key)
            if found:
                return found
    return None


SERVICES = {"gemini": gemini, "retrodiffusion": retrodiffusion, "pixellab": pixellab}


def generate(path: Path, raw: Path = RAW, services: dict | None = None) -> list[Path]:
    """Draw the images of a prompt file into raw/<candidate>/, with their record."""
    fields, prompt = read_prompt(path)
    draw = (services or SERVICES)[fields["service"]]
    images, said = draw(fields, prompt)
    if not images:
        raise ArtError(
            f"{path.name}: the service answered with no image ({said.get('finish', '')})"
        )
    folder = raw / fields["candidate"]
    folder.mkdir(parents=True, exist_ok=True)
    written = []
    for index, data in enumerate(images, 1):
        name = path.stem if index == 1 else f"{path.stem}-{index}"
        if data[:4] == b"GIF8":
            # An animation is kept as it came, and as a strip of its frames.
            (folder / f"{name}.gif").write_bytes(data)
        target = folder / f"{name}.png"
        target.write_bytes(_as_png(data))
        written.append(target)
    answer = said.pop("answer", None)
    if answer is not None:
        trimmed = json.loads(json.dumps(answer), object_hook=_drop_base64)
        (folder / f"{path.stem}.answer.json").write_text(
            json.dumps(trimmed, indent=2), encoding="utf-8"
        )
    record = {
        "service": fields["service"],
        "fields": {k: v for k, v in fields.items() if k != "candidate"},
        "prompt": prompt,
        "date": datetime.date.today().isoformat(),
        "said": said,
        "images": [p.name for p in written],
    }
    (folder / f"{path.stem}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    return written


def _drop_base64(node: dict) -> dict:
    if node.get("type") == "base64" and "base64" in node:
        return {**node, "base64": f"<{len(node['base64'])} characters>"}
    return node


def _as_png(data: bytes) -> bytes:
    """An image as PNG: Gemini answers in JPEG, which the cutting tool reads as well,
    but every raw image is kept in one format."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return data
    import io

    from PIL import Image

    out = io.BytesIO()
    image = Image.open(io.BytesIO(data))
    frames = getattr(image, "n_frames", 1)
    if frames > 1:
        strip = Image.new("RGBA", (image.width * frames, image.height))
        for index in range(frames):
            image.seek(index)
            strip.paste(image.convert("RGBA"), (index * image.width, 0))
        strip.save(out, "PNG")
    else:
        image.convert("RGBA").save(out, "PNG")
    return out.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Have a service draw an image from a prompt file."
    )
    parser.add_argument("prompt", type=Path, nargs="+")
    parser.add_argument("--dry-run", action="store_true", help="read the files, send nothing")
    args = parser.parse_args()
    failed = 0
    for path in args.prompt:
        try:
            if args.dry_run:
                fields, words = read_prompt(path)
                print(json.dumps(fields), "\n", words)
                continue
            started = time.monotonic()
            for written in generate(path):
                print(written.relative_to(REPO), f"({time.monotonic() - started:.0f} s)")
        except ArtError as error:
            # One prompt that fails does not stop the others.
            print(f"generate: {error}", file=sys.stderr)
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
