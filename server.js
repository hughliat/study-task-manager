import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const allowedFiles = new Set(['index.html', 'src/app.js', 'src/styles.css', 'src/tasks.js']);
const port = Number(process.env.PORT || 4178);
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!allowedFiles.has(relative)) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(path.join(root, relative));
    res.writeHead(200, { 'Content-Type': mime[path.extname(relative)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'" });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(400); res.end('Bad request'); }
});
server.on('error', error => { console.error(`启动失败：${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`学习任务管理器：http://127.0.0.1:${port}`));
