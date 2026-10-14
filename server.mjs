/* =========================================================
   server.mjs · 本地静态服务器（无需依赖）
   用法： node server.mjs [端口]
   ========================================================= */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 8787);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const target = normalize(join(ROOT, p));
    if (!target.startsWith(ROOT)) { res.writeHead(403).end('403'); return; }
    const info = await stat(target);
    if (info.isDirectory()) {
      const idx = join(target, 'index.html');
      const body = await readFile(idx);
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' }).end(body);
      return;
    }
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }).end(body);
  } catch (err) {
    if (err && err.code === 'ENOENT') { res.writeHead(404, { 'Content-Type': MIME['.html'] }).end('<h1>404 · 此处无路</h1>'); return; }
    res.writeHead(500).end('500 ' + (err && err.message));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`一枝桂赏月宴 · 本地已开张 → http://${HOST}:${PORT}/`);
});
