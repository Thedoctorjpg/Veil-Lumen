import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const port = Number(process.argv.find((a, i) => process.argv[i - 1] === "--port") || 5173);

const server = createServer(async (req, res) => {
  let path = req.url?.split("?")[0] || "/";
  if (path === "/") path = "/index.html";
  const filePath = join(ROOT, path.replace(/^\//, ""));
  try {
    const s = await stat(filePath);
    if (!s.isFile()) throw new Error("not file");
    const ext = extname(filePath);
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log("");
  console.log("  Veil Lumen — Dev Preview");
  console.log("  ────────────────────────");
  console.log(`  Local:   http://127.0.0.1:${port}`);
  console.log(`  Network: http://localhost:${port}`);
  console.log("");
  console.log("  Press Ctrl+C to stop");
  console.log("");
});