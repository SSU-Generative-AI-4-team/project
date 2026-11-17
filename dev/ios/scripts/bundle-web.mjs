import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { BOOKS, QUOTES } from '../../app/quotes.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fileURLToPath(new URL('../../app/', import.meta.url));
const output = join(root, 'Hatcheat/Web');
await rm(output, { recursive:true, force:true });
await mkdir(join(output, 'assets'), { recursive:true });
// Explicit allowlist excludes local-only fonts, tests, service workers and server code.
for (const asset of ['haechi', 'audio', 'haechi-logo.png', 'hatcheat-192.png', 'hanji.jpg', 'GowunDodum-Regular.woff2', 'GowunDodum-OFL.txt']) {
  await cp(join(source, 'assets', asset), join(output, 'assets', asset), { recursive:true });
}
await cp(join(source, 'styles.css'), join(output, 'styles.css'));
const tokens = (await readFile(join(source, 'hatcheat-tokens.css'), 'utf8'))
  .replace(/^@font-face \{ font-family:Yeongnam;.*\n/gm, '')
  .replace('--font-body:Yeongnam,', '--font-body:');
await writeFile(join(output, 'hatcheat-tokens.css'), tokens);
const html = (await readFile(join(source, 'index.html'), 'utf8'))
  .replace(/.*<link rel="(?:manifest|preload)".*\n/g, '')
  .replace('<script type="module" src="./app.js"></script>', '<script defer src="./app.bundle.js"></script>')
  .replace('href="./" class="wordmark"', 'href="./index.html" class="wordmark"')
  .replace('이 브라우저에 저장해요. 브라우저 데이터를 지우면 필사첩도 사라져요.', '이 기기에 저장해요. 앱을 삭제하면 필사첩도 사라져요.');
await writeFile(join(output, 'index.html'), html);
await writeFile(join(output, 'catalog.json'), JSON.stringify({ books:BOOKS.map(b => b.id), quotes:QUOTES.map(q => q.id) }));
await build({ entryPoints:[join(source, 'app.js')], outfile:join(output, 'app.bundle.js'), bundle:true, format:'iife', target:'safari17', charset:'utf8', minify:true });
console.log('Bundled Hatcheat for offline iOS use.');
