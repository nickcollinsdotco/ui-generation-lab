# UI generation lab

Makes videos of the [transitions.dev](https://transitions.dev) **UI generation** animation: a dotted wireframe traced from a real piece of UI, then the real UI revealed, as if an AI agent were building it.

You can animate two kinds of source:

- **A live webpage**: any URL. You click the part you want.
- **A Figma design**: Claude rebuilds the frame as a small HTML page (a "scene"), then you record that.

Videos land in the `out/` folder as MP4.

Keep this repo **private**. The licence allows using the animation in your own work but not republishing the library.

---

## 0. Open a terminal in this folder

Use any one of these:
- **VS Code / Cursor:** File → Open Folder → `ui-generation-lab`, then Terminal → New Terminal.
- **Windows Explorer:** open `Documents\GITHUB\ui-generation-lab`, right-click empty space → **Open in Terminal**.

Every command below is typed in that terminal. First time only:

```sh
npm install
```

## 1. See the demo first

```sh
npm run demo
```

Your browser opens the creator's demo (three cards). Use the buttons at the top: **Skeleton**, **Skeleton + generation texts**, **Replay**. Press `Ctrl+C` in the terminal to stop it.

These are the two modes you can record:
- `skeleton`: the drawing, then the reveal.
- `skeleton-texts` (default): the same, plus an agent log, CSS being written and a step line beside the card. Needs empty space around the element.

## 2. Video of a live webpage

**Step 1.** Copy the URL from your browser's address bar.

**Step 2.** Run, with your URL:

```sh
npm run render -- https://yoursite.com/pricing
```

**Step 3.** A Chrome window opens on that page. A black label at the top says *"Alt+click the part to animate"*.
- Close any cookie banner or popup with normal clicks first. Your choices carry into the video.
- Hold **Alt** and move the mouse: a blue box shows what you'd pick.
- **Alt+click** the part you want (a card, a pricing table, a hero section).
- You probably landed on something small, like a line of text. Press **↑** to grow the selection to the containing box, and **↓** to shrink it back. Keep pressing until the blue box wraps the whole card.
- Press **Enter**. (`Esc` starts over.)

Don't navigate to another page in that window. To use a different page, run the command again with its URL.

**Step 4.** The window closes and recording runs (about 20–60 s). The terminal prints where the video is:

```
out/yoursite.com.mp4
```

It also prints the selector you picked, e.g. `--selector '#pricing > div:nth-of-type(2)'`. Add that to the command next time to skip picking:

```sh
npm run render -- https://yoursite.com/pricing --selector "#pricing > div:nth-of-type(2)" --mode skeleton
```

Tips:
- **Pick something that fits on screen.** The default window is 1440×900.
- **Busy page?** Use `--mode skeleton`. The side texts only show where there's empty space.
- **Page loads slowly?** Add `--wait 4000`.
- **Sites behind a login** won't work. The recording window isn't logged in, though popups you close carry over. Use a scene instead (section 3, from a screenshot or the HTML).

## 3. Video of a Figma design

The animation traces the real structure (boxes, text, icons). A flat image of the design gives it nothing to trace, so Claude rebuilds the Figma frame as HTML first. This uses the Figma connector, which is already connected to your Claude account.

**Step 1.** In Figma, right-click the frame (e.g. your card) → **Copy/Paste as** → **Copy link to selection**.

**Step 2.** Start Claude Code in this folder (`claude` in the terminal, or open the folder in T3 Code) and paste:

```
Make a scene called pricing from this Figma frame: <paste link>
```

`CLAUDE.md` tells Claude the rules: one HTML file in `scenes/pricing/index.html`, real text and SVG icons, the card marked as the thing to animate, an Instagram-sized page with room around it. Claude compares its build to the Figma screenshot before handing it back.

**Step 3.** Check it looks right:

```sh
npm run preview -- scenes/pricing
```

Your browser opens the scene. If something's off, tell Claude what ("the button should be green", "the icon is missing").

**Step 4.** Record:

```sh
npm run render -- pricing --ig --done "Pricing card ready"
```

The video is `out/pricing.mp4`: 1080×1350, Instagram portrait. Use `--reel` instead for 1080×1920.

Or skip the commands and just tell Claude: *"render pricing for Instagram"*.

## 4. Options

Add any of these after the URL or scene name.

| Option | Default | What it does |
| --- | --- | --- |
| `--mode skeleton` | `skeleton-texts` | Drawing only, no side texts. |
| `--ig` / `--reel` | — | Instagram portrait (1080×1350) / Reels & Stories (1080×1920). |
| `--size 1280x720 --scale 1.5` | URL 1440×900, scene 1080×1350 | Custom size: window size in px × scale = video size. Higher scale = sharper text. |
| `--done "Card ready"` | `Ready` | Last step label in `skeleton-texts`. |
| `--duration 3200` | 2400 | Slower or faster drawing, in ms (1600–3600). |
| `--hold 2000` | 1200 | How long the finished UI stays on screen at the end (ms). |
| `--lead 0` | 400 | Blank time before the build starts (ms). |
| `--fps 30` | 60 | Halves render time. Fine for drafts. |
| `--selector "<css>"` | pick by clicking | Skip the picking window. |
| `--wait 4000` | 1500 | Extra load time for slow live pages (ms). |
| `--alpha` | off | Scenes only. Also makes transparent `.mov` + `.webm` to lay over other footage. |
| `--out name` | site / scene name | Output file name. |

## What's in here

| Path | What it is |
| --- | --- |
| `demo/` | The creator's demo page (`npm run demo`). |
| `scenes/<name>/index.html` | One page per design to animate. `scenes/example` is a sample. |
| `out/` | Your videos. Not committed to git. |
| `render.mjs` | The recorder. Plays the page on a fake clock, one frame at a time, so video is smooth however slow the computer is. |
| `preview.mjs` | Local web server for the demo and scenes. |
| `lib/` | The animation runtime (`ui-generation.js` / `.css`). |
| `.claude/skills/transitions-ui-generation/` | The skill itself. Claude reads it here. Hidden folder: it starts with a dot. |

## Updating the skill

Ask Claude: *"update the transitions-ui-generation skill from GitHub and copy the runtime into lib/ and demo/"*.
