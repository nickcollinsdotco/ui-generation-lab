// Records the transitions.dev UI generation animation to video, frame by frame.
//
// The runtime animates with requestAnimationFrame, performance.now and setTimeout,
// so this runs the page on Playwright's fake clock and advances it one frame at a
// time. Output is smooth no matter how slow the machine is.
//
// Source is either a scene in scenes/<name>/index.html or a live URL. For a URL
// without --selector, a Chrome window opens so you can Alt+click the element.
//
// Usage:
//   node render.mjs <scene|url> [options]
//
// Options:
//   --selector <css>     element to generate (scene default: [data-generate]; URL default: pick in a window)
//   --mode <m>           skeleton | skeleton-texts (default skeleton-texts)
//   --size <WxH>         viewport in CSS px (default 1080x1350 for scenes, 1440x900 for URLs)
//   --scale <n>          device pixel ratio; output is size × scale (default 1)
//   --ig                 Instagram portrait: 720x900 at 1.5 = 1080x1350
//   --reel               Reels/Stories: 720x1280 at 1.5 = 1080x1920
//   --fps <n>            default 60
//   --duration <ms>      drawing time, 1600–3600 (default 2400)
//   --lead <ms>          blank time before the build starts (default 400)
//   --hold <ms>          time on the finished UI at the end (default 1200)
//   --done <text>        last step label, e.g. "Pricing card ready"
//   --wait <ms>          extra real-time wait after load for live pages (default 1500)
//   --alpha              scenes only: also export transparent .mov (ProRes 4444) and .webm
//   --out <name>         output file name without extension (default: scene name or host)
//
// Output goes to out/<name>.mp4 (H.264, plays everywhere, Instagram-ready).
import { chromium } from "playwright-core";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [src, ...rest] = process.argv.slice(2);
if (!src) {
  console.error("Usage: node render.mjs <scene|url> [--selector css] [--mode skeleton-texts] [--size 1080x1350] ...");
  process.exit(1);
}
const args = {};
for (let i = 0; i < rest.length; i++) {
  const k = rest[i].replace(/^--/, "");
  if (k === "alpha") args.alpha = true;
  else if (k === "ig") Object.assign(args, { size: "720x900", scale: "1.5" });
  else if (k === "reel") Object.assign(args, { size: "720x1280", scale: "1.5" });
  else args[k] = rest[++i];
}

const isUrl = /^https?:\/\//.test(src);
const fps = Number(args.fps || 60);
const duration = Number(args.duration || 2400);
const lead = Number(args.lead ?? 400);
const hold = Number(args.hold ?? 1200);
const scale = Number(args.scale || 1);
const [width, height] = (args.size || (isUrl ? "1440x900" : "1080x1350")).split("x").map(Number);
const name = args.out || (isUrl ? new URL(src).hostname.replace(/^www\./, "") : src);
const target = isUrl ? src : pathToFileURL(resolve(here, "scenes", src, "index.html")).href;
if (!isUrl && !existsSync(fileURLToPath(target))) {
  console.error(`No scene at scenes/${src}/index.html`);
  process.exit(1);
}

const outDir = resolve(here, "out");
const frames = resolve(outDir, `.frames-${name}`);
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const launch = (headless) => chromium.launch({ headless, executablePath: process.env.CHROME_PATH, channel: process.env.CHROME_PATH ? undefined : "chrome" });

// Live URL without --selector: open a visible window and let the user Alt+click the element.
// Cookies and logins from that window carry over to the recording.
let storageState;
if (isUrl && !args.selector) {
  const picker = await launch(false);
  const ctx = await picker.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();
  await p.goto(src, { waitUntil: "load" });
  p.setDefaultTimeout(0);
  console.log("A Chrome window opened. Close any popups, then Alt+click the part of the page to animate.");
  args.selector = await p.evaluate(() => new Promise((done) => {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #2563eb;background:rgb(37 99 235/.12);border-radius:4px;transition:all 60ms";
    const tip = document.createElement("div");
    tip.textContent = "Alt+click the part to animate · normal clicks work as usual";
    tip.style.cssText = "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:8px 14px;border-radius:8px;background:#111;color:#fff;font:13px system-ui;pointer-events:none";
    document.documentElement.append(box, tip);
    const ok = (el) => el && el !== document.body && el !== document.documentElement && el !== box && el !== tip;
    const selectorFor = (el) => {
      const parts = [];
      for (; el && el !== document.body; el = el.parentElement) {
        if (el.id && document.querySelectorAll("#" + CSS.escape(el.id)).length === 1) { parts.unshift("#" + CSS.escape(el.id)); break; }
        const same = [...el.parentElement.children].filter((c) => c.tagName === el.tagName);
        parts.unshift(el.tagName.toLowerCase() + (same.length > 1 ? `:nth-of-type(${same.indexOf(el) + 1})` : ""));
      }
      return (parts[0].startsWith("#") ? "" : "body > ") + parts.join(" > ");
    };
    let picked = null;
    const show = (el) => {
      if (!ok(el)) { box.style.display = "none"; return; }
      const r = el.getBoundingClientRect();
      Object.assign(box.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    };
    const select = (el) => {
      picked = el; show(el);
      const r = el.getBoundingClientRect();
      tip.textContent = `Selected ${Math.round(r.width)}×${Math.round(r.height)} · ↑ bigger · ↓ smaller · Enter to record · Esc to cancel`;
    };
    addEventListener("mousemove", (e) => { if (!picked) show(e.altKey ? document.elementFromPoint(e.clientX, e.clientY) : null); }, true);
    addEventListener("click", (e) => {
      if (!e.altKey) return;
      e.preventDefault(); e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (ok(el)) select(el);
    }, true);
    addEventListener("keydown", (e) => {
      if (!picked) return;
      if (e.key === "ArrowUp" && ok(picked.parentElement)) select(picked.parentElement);
      else if (e.key === "ArrowDown" && picked.firstElementChild) select(picked.firstElementChild);
      else if (e.key === "Enter") done(selectorFor(picked));
      else if (e.key === "Escape") { picked = null; show(null); tip.textContent = "Alt+click the part to animate · normal clicks work as usual"; }
      else return;
      e.preventDefault(); e.stopPropagation();
    }, true);
  }));
  storageState = await ctx.storageState();
  await picker.close();
  console.log(`Picked: ${args.selector}\n(re-run with --selector '${args.selector}' to skip picking)`);
}

const browser = await launch(true);
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale, storageState });
await page.clock.install();
await page.goto(target, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
if (isUrl) await page.waitForTimeout(Number(args.wait ?? 1500));
await page.clock.pauseAt(Date.now() + 1000);

// Inject the runtime unless the scene already loads it.
const hasRuntime = await page.evaluate(() => !!window.UIGeneration);
if (!hasRuntime) {
  await page.addStyleTag({ content: readFileSync(resolve(here, "lib/ui-generation.css"), "utf8") });
  await page.addScriptTag({ type: "module", content: readFileSync(resolve(here, "lib/ui-generation.js"), "utf8") });
  await page.waitForFunction(() => !!window.UIGeneration);
}

// Comma selectors match in document order, so try [data-generate] on its own first.
const selector = args.selector || (isUrl ? null : ["[data-generate]", "body > *:not(script)"]);
if (!selector) {
  console.error("Live URLs need --selector, e.g. --selector \".pricing-card\"");
  process.exit(1);
}
const opts = { mode: args.mode || "skeleton-texts", duration, delay: lead, ...(args.done ? { done: args.done } : {}) };
const found = await page.evaluate(({ selector, opts }) => {
  const el = [selector].flat().map((s) => document.querySelector(s)).find(Boolean);
  if (!el) return false;
  el.scrollIntoView({ block: "center" });
  // CSS animations (the step dot pulse) run on real time; pause them and seek per frame.
  window.__starts = new Map();
  window.__seek = (now) => {
    for (const a of document.getAnimations()) {
      if (!window.__starts.has(a)) { window.__starts.set(a, now); a.pause(); }
      a.currentTime = now - window.__starts.get(a);
    }
  };
  window.UIGeneration.generate(el, opts);
  return true;
}, { selector, opts });
if (!found) {
  console.error(`Nothing matches ${selector}`);
  process.exit(1);
}

const total = Math.ceil(((lead + duration * 1.09 + hold) / 1000) * fps);
const step = 1000 / fps;
for (let f = 0; f < total; f++) {
  if (f > 0) await page.clock.runFor(step);
  await page.evaluate((now) => window.__seek(now), f * step);
  await page.screenshot({ path: resolve(frames, `${String(f).padStart(5, "0")}.png`), omitBackground: !!args.alpha });
  if (f % fps === 0) process.stdout.write(`\r${f}/${total} frames`);
}
await browser.close();

const input = ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", resolve(frames, "%05d.png")];
const mp4 = resolve(outDir, `${name}.mp4`);
execFileSync("ffmpeg", [...input, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-movflags", "+faststart", mp4]);
const made = [mp4];
if (args.alpha) {
  const mov = resolve(outDir, `${name}.mov`);
  const webm = resolve(outDir, `${name}.webm`);
  execFileSync("ffmpeg", [...input, "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", "-alpha_bits", "16", "-vendor", "apl0", mov]);
  execFileSync("ffmpeg", [...input, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "18", "-b:v", "0", "-row-mt", "1", "-auto-alt-ref", "0", webm]);
  made.push(mov, webm);
}
rmSync(frames, { recursive: true, force: true });
console.log(`\r${width * scale}x${height * scale}, ${total} frames @ ${fps}fps\n${made.join("\n")}`);
