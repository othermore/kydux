# Developer documentation

Kydux is part of the [Kidux](https://kidux.org) family.

| Document | What it is |
|---|---|
| `draft.md` | The game as first sketched: what it is, how a level plays, the course, the art. |
| `plan.md` | The plan: the stack, how the game works, the layout, the development model, every phase. |
| `sprint-<n>.md` | Each sprint, piece by piece, with its acceptance test. A sprint's document is written before the sprint and kept as it was written; what was decided differently while building is in the decision log. |
| `story.md` | The story: the school, its places and characters, the spells, the wizard's way through the chapters, the tone. Lessons and levels are written from it. |
| `course.md` | The course: every chapter's lessons and levels in order, the idea each teaches and the API it unlocks, the challenges, and the world features each chapter needs. |
| `architecture.md` | The parts, the pinned versions, and the decision log, the one place decisions are recorded. |
| `dev-environment.md` | Setting a machine up, running the game, trying it from another computer, checking, pushing. |

## How a sprint is made

Two agents work on Kydux, with no shared context between them; the owner
carries every message from one to the other, tests what is built, and
alone pushes, publishes or deploys.

- **The designer** writes the story and the course, takes the decisions
  into `architecture.md`'s log, writes each sprint in `sprint-<n>.md`
  (its decisions, the findings it answers, the pieces with every number
  to measure, the Gemini budget, the owner's acceptance test, the
  hand-over and the prompt for the programmer), reviews the sprint once
  it is built, and fixes by itself only what is small and safe.
- **The programmer** builds what the sprint's document says, in its
  order, one local commit a piece with `ci/check.sh` and the browser
  tests of the files the piece touches green before each, and the whole
  `ci/check.sh --e2e` once, before the sprint's last commit (the owner,
  2026-11-09); it ends with a report for the owner and a prompt for the
  designer: the commits, what differs from the plan and why, what to
  look at with care, what is left open.
