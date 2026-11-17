import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const design = fileURLToPath(new URL('../../../Design/', import.meta.url));
const origin = 'https://emotion-incinerator-sepia.vercel.app';
let html = await readFile(join(design, 'frontend/landing.html'), 'utf8');
const images = [...new Set([...html.matchAll(/(?:src|href|content)="(\.\.\/(?:brand|asset)\/[^"<>]+)"/g)].map(m => m[1]))];
images.push('../asset/hanji%20texture%20background.jpg');
await mkdir(join(root, 'assets/hatcheat'), { recursive:true });
for (const source of images) {
  const relative = decodeURIComponent(source.replace('../', ''));
  const name = relative.split('/').at(-1).replaceAll(' ', '-');
  await cp(join(design, relative), join(root, 'assets/hatcheat', name));
  html = html.replaceAll(source, `/assets/hatcheat/${name}`);
}
// Public distribution uses OFL fonts; supplied Yeongnam files stay local.
html = html.replace(/<link[^>]+https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?/g, '');
html = html.replace(/,url\('\.\.\/brand\/font\/[^']+'\) format\('opentype'\)/g, '');
html = html.replace('\n<style>\n', `\n<style>\n@font-face{font-family:'Gowun Dodum';src:url('/assets/hatcheat/GowunDodum-Regular.woff2') format('woff2');font-weight:400;font-display:swap}\n`);
for (const name of ['GowunDodum-Regular.woff2', 'GowunDodum-OFL.txt']) {
  await cp(join(root, '../app/assets', name), join(root, 'assets/hatcheat', name));
}
html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")([^\"]+)(">)/g, (_, before, path, after) => before + origin + path + after);
html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${origin}/">`);
if (!html.includes('property="og:url"')) html = html.replace('</head>', `<meta property="og:url" content="${origin}/">\n</head>`);
html = html.replace('</head>', `<link rel="canonical" href="${origin}/">\n</head>`);
// GA4·Meta 픽셀 측정. ID는 /analytics.js에 있다.
html = html.replace('</head>', '<script defer src="/analytics.js"></script>\n</head>');
html = html.replace(' · 문의 〔팀 메일 주소〕', '');
// Keep the policy reachable from every published landing alias.
html = html.replace(
  '<span>모든 마음을 기록해 둘 필요는 없다.</span></div>',
  '<span>모든 마음을 기록해 둘 필요는 없다.</span><a href="/privacy" style="color:var(--color-primary);white-space:nowrap">개인정보처리방침</a></div>'
);
for (const path of ['index.html', 'v2/index.html', 'v3/index.html']) await writeFile(join(root, path), html);
console.log('Prepared current Hatcheat landing at /, /v2, /v3.');
