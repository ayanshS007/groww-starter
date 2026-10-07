// Verifies the build is one self-contained dist/index.html (README 6.2):
// all JS/CSS inlined, no external resource URLs, viewport meta, < 16 MB.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const fail = (msg) => {
  console.error(`check-dist: ${msg}`);
  process.exit(1);
};

const files = readdirSync(dist, { recursive: true }).filter((f) => statSync(join(dist, f)).isFile());
const stray = files.filter((f) => /\.(js|mjs|css)$/.test(f));
if (stray.length) fail(`expected everything inlined, found ${stray.join(', ')}`);

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const bytes = Buffer.byteLength(html);
if (bytes >= 16 * 1024 * 1024) fail(`index.html is ${bytes} bytes (limit 16 MB)`);
if (/<script[^>]*\ssrc=/i.test(html)) fail('found <script src=…>; scripts must be inlined');
if (/<link[^>]*rel=["']?stylesheet/i.test(html)) fail('found <link rel=stylesheet>; CSS must be inlined');
const external = html.match(/\s(?:src|href)=["']?(?:https?:)?\/\/[^"'\s>]+/gi);
if (external) fail(`external resource URLs: ${external.join(', ')}`);
if (/@import\s+url\(/i.test(html) || /url\(\s*["']?https?:/i.test(html)) fail('CSS loads a remote resource');
if (!html.includes('viewport-fit=cover')) fail('missing viewport meta with viewport-fit=cover');

console.log(`check-dist: OK, single-file dist/index.html (${(bytes / 1024).toFixed(1)} KB), files: ${files.join(', ')}`);
