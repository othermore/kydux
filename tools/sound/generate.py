#!/usr/bin/env python3
"""Have Lyria compose a piece of music from a prompt file (plan, phase 4).

    tools/sound/generate.py tools/sound/prompts/<name>.md

A prompt file is Markdown with a front matter between two `---` lines:
`model` (`lyria-3-clip-preview` for a clip of about thirty seconds,
`lyria-3.5` for a whole piece) and nothing else needed; the words are the
prompt. The music lands in art/raw/sound/<name>.mp3 beside <name>.json with
the model, the prompt and the date. art/raw/ is not committed. The key is
GEMINI_API_KEY, read as tools/art/generate.py reads it, never printed.
"""

import datetime
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools" / "art"))
from generate import ArtError, secret  # noqa: E402

OUT = REPO / "art" / "raw" / "sound"
EXTENSIONS = {"audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav"}


def read_prompt(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ArtError(f"{path.name}: a prompt file opens with its front matter between --- lines")
    head, _, body = text[4:].partition("\n---\n")
    fields = {}
    for line in head.splitlines():
        if ":" in line:
            key, value = (part.strip() for part in line.split(":", 1))
            fields[key] = value
    return fields, body.strip()


def compose(path: Path, out: Path = OUT) -> Path:
    from google import genai

    fields, prompt = read_prompt(path)
    model = fields.get("model", "lyria-3-clip-preview")
    client = genai.Client(api_key=secret("GEMINI_API_KEY"))
    answer = client.models.generate_content(model=model, contents=prompt)
    parts = [p for c in answer.candidates or [] for p in ((c.content and c.content.parts) or [])]
    audio = [p.inline_data for p in parts if p.inline_data]
    if not audio:
        raise ArtError(f"{path.name}: Lyria answered with no music")
    out.mkdir(parents=True, exist_ok=True)
    target = out / f"{path.stem}.{EXTENSIONS.get(audio[0].mime_type, 'bin')}"
    target.write_bytes(audio[0].data)
    record = {
        "model": model,
        "prompt": prompt,
        "date": datetime.date.today().isoformat(),
        "said": [p.text for p in parts if p.text],
        "tokens": getattr(answer.usage_metadata, "total_token_count", None),
    }
    (out / f"{path.stem}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    return target


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        for name in sys.argv[1:]:
            print(compose(Path(name)).relative_to(REPO))
    except ArtError as error:
        print(f"sound: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
