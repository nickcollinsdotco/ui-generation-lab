# UI generation lab

Turns UI into "agent is generating this" videos with the `transitions-ui-generation` skill (`.claude/skills/`). See README.md for commands.

- Scenes live in `scenes/<name>/index.html`: one self-contained HTML file, real text and inline SVG (the runtime traces DOM structure, so never use a screenshot of UI). Mark the animated element with `data-generate`. Leave empty space around it for `skeleton-texts` panels.
- Building a scene from Figma: use the Figma MCP (`get_design_context` + `get_screenshot`), then rewrite the output as plain HTML/CSS. Compare a screenshot of the scene against Figma before rendering.
- Render with `node render.mjs <scene|url> [flags]`. Don't change `lib/` timings; they come from the skill.
- After a render, pull 3–5 frames with ffmpeg and look at them before reporting it done.
