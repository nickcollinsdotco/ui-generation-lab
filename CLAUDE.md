# UI generation lab

Turns UI into "agent is generating this" videos with the `transitions-ui-generation` skill (`.claude/skills/`). README.md is the user guide; keep it in step with any change to commands or flags.

## "Make a scene called X from <figma link>"

1. Read the frame with the Figma MCP (`get_design_context` + `get_screenshot`).
2. Write `scenes/X/index.html`: one self-contained file, plain HTML/CSS, real text, inline SVG icons. The runtime traces DOM structure, so never use an image of the UI (photos and avatars as images are fine).
3. Mark the element to animate with `data-generate` (value = variant: omit for `ui`; `text` for headlines, `small-text` for eyebrows/captions, `image` on a wrapper around an `<img>`, never the `<img>`). Headline + copy + photo: mark each separately with `data-generate-delay` stagger, not one `auto` block (letter fades are sequential, so long text drags). Design for a 720×900 viewport (`--ig` renders it at 1.5× = 1080×1350): body fills the viewport, element centred, about 420px wide or less, with ~140px clear below for the `skeleton-texts` log. If the design is too wide for that, say so and suggest `--mode skeleton`.
4. Screenshot the scene (Playwright, `channel: "chrome"`) and compare it with the Figma screenshot. Fix differences before handing back.

## "Render X" / "render X for Instagram"

`node render.mjs X --ig` (Reels/Stories: `--reel`). Afterwards pull 3–5 frames with ffmpeg and look at them before saying it's done.

## Rules

- Don't change timings in `lib/`; they come from the skill. `lib/` holds `ui-generation.*` and `text-image-generation.*` from the skill. `demo/` is the skill's demos with paths pointed at `../lib/`: `demo.html` → `index.html`, `demo-text.html` → `text.html`, `demo-editorial.html` → `editorial.html`, `demo/*.jpg` → `img/`.
- `render.mjs` inlines `ui-generation.js` and swaps its `./text-image-generation.js` import for a blob URL; if upstream changes that import line, render throws and needs updating.
- Scenes and the demo need http (ES modules): `node preview.mjs <path>`.
