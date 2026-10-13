// Serves this folder on http://localhost:4400 (or the next free port) and opens a page in your browser.
// The runtime is an ES module, so pages need http; double-clicking the HTML file won't work.
//
// Usage: node preview.mjs [path]   e.g. node preview.mjs scenes/pricing  (default: demo)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { resolve, extname, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json", ".mp4": "video/mp4" };

const server = createServer(async (req, res) => {
  let path = resolve(root, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!path.startsWith(root + sep) && path !== root) return res.writeHead(403).end();
  if (!extname(path)) path = resolve(path, "index.html");
  try {
    const body = await readFile(path);
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
let port = 4400;
server.on("error", (e) => { if (e.code !== "EADDRINUSE") throw e; server.listen(++port); });
server.listen(port, () => {
  const url = `http://localhost:${port}/${(process.argv[2] || "demo").replaceAll("\\", "/").replace(/^\/|\/$/g, "")}/`;
  console.log(`${url}\nCtrl+C to stop.`);
  if (!process.env.NO_OPEN) exec(process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`);
});
