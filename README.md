# UI generation lab

A playground for the [transitions.dev](https://transitions.dev) **UI generation** skill: the "an agent is building this UI" animation. A dotted wireframe is traced from the element's real structure, then the real UI is revealed. This repo turns it into video.

- `.claude/skills/transitions-ui-generation/`: the skill. Claude Code picks it up automatically in this folder.
- `lib/`: the runtime (`ui-generation.js`, `ui-generation.css`), copied from the skill.
- `scenes/<name>/index.html`: one page per thing you want to animate.
- `render.mjs`: records a scene or a live URL to `out/<name>.mp4`.

Keep this repo **private**. The licence allows use in your own work but not republishing the library.

## Setup (once)

Needs Node, ffmpeg and Google Chrome. All three are already on this machine.

```sh
npm install
```

## Try it

```sh
node render.mjs example                        # scenes/example → out/example.mp4
npx serve .claude/skills/transitions-ui-generation   # creator's demo, open /demo.html
```

## Video of a live webpage

1. Open the page in Chrome. Right-click the part you want built (a card, pricing table, hero) → **Inspect**. Find a selector for it, e.g. `#pricing`, `.hero-card`, `[data-testid="plan-pro"]`.
   - Pick an element that fits on screen. Don't use `body`; the overlay is drawn inside the element's parent.
2. Render:
   ```sh
   node render.mjs https://yoursite.com --selector ".hero-card" --size 1440x900 --scale 2
   ```
3. Watch `out/yoursite.com.mp4`. If it's the wrong element, change the selector and run it again.

Live-page tips:
- Cookie banners and popups show up in the video. Accept them in a scene copy instead, or pick a page without one.
- If content loads late, add `--wait 4000`.
- `skeleton-texts` mode places the log and code panels only where the page is empty. On busy pages use `--mode skeleton`.

## Video of a Figma design

The runtime traces real DOM (boxes, text, icons), so the design has to become HTML. A flat screenshot won't work.

1. In Figma, select the frame → right-click → **Copy link to selection**.
2. In Claude Code, in this folder, say:
   > Build scenes/pricing/index.html from <figma link>. Plain HTML and CSS in one file, real text and SVG icons, no images of UI. Mark the main card with `data-generate`. Body is 1080×1350, card centred, with room around it for the generation texts.
   
   Claude uses the Figma MCP to read the design and write the scene.
3. Check it: open `scenes/pricing/index.html` in Chrome and compare it to Figma.
4. Render:
   ```sh
   node render.mjs pricing --done "Pricing card ready" --scale 2
   ```
5. Use `out/pricing.mp4`.

## Options

| Flag | Default | What it does |
| --- | --- | --- |
| `--selector <css>` | scenes: `[data-generate]` | Element to build. Required for URLs. |
| `--mode` | `skeleton-texts` | `skeleton` = drawing only; `skeleton-texts` adds the agent log, CSS panel and step line. |
| `--size WxH` | scenes 1080x1350, URLs 1440x900 | Viewport in CSS px. 1080x1350 = IG portrait, 1080x1920 = Reels/Stories. |
| `--scale` | 1 | Pixel ratio. `2` gives sharper text; output = size × 2. Use with a half-size viewport for IG, e.g. `--size 540x675 --scale 2`. |
| `--duration` | 2400 | Drawing time in ms (1600–3600). Total build ≈ ×1.09. |
| `--lead` / `--hold` | 400 / 1200 | Blank time before, and time on the finished UI after, in ms. |
| `--done "<text>"` | Ready | Final step label. |
| `--fps` | 60 | 30 renders twice as fast for drafts. |
| `--alpha` | off | Also exports transparent `.mov` (ProRes) and `.webm`, for laying over other footage. Give the scene a transparent body background. |
| `--out <name>` | scene / host | Output file name. |

## How it records

The animation runs on `requestAnimationFrame` and timers, so `render.mjs` puts the page on Playwright's fake clock and moves it forward one frame at a time, screenshotting each frame. Video is perfectly smooth however slow the machine is. Frames are stitched with ffmpeg.

## Updating the skill

```sh
npx skills add Jakubantalik/transitions.dev
```
or download `skills/transitions-ui-generation/` again from the GitHub repo. Then copy `ui-generation.js` and `ui-generation.css` into `lib/`.
