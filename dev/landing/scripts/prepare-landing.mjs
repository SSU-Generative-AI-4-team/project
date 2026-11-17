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
// 구조화 데이터(JSON-LD). 팝업(<template>) 내용은 검색엔진·AI가 본문으로 읽지 않으므로 FAQ로도 싣는다.
// 답변은 팝업 원문에서 뽑아 랜딩 문구와 어긋나지 않게 한다.
const appUrl = 'https://emotion-incinerator-app.vercel.app/';
const questions = { 'm-write': '해칫에는 무엇을 어떻게 적나요?', 'm-give': '적은 글을 해치에게 건네면 어떻게 되나요?',
  'm-end': '건넨 뒤에는 무엇이 남나요?', 'm-ink': '먹 갈기와 필사첩은 무엇인가요?',
  'm-data': '적은 글은 어디로 가나요?', 'm-not': '해칫이 하지 않는 것은 무엇인가요?' };
const decode = text => text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const faq = [...html.matchAll(/<template id="(m-[a-z]+)"[^>]*>([\s\S]*?)<\/template>/g)].filter(m => questions[m[1]]).map(([, id, body]) => {
  const answer = decode(body.replace(/<figure[\s\S]*?<\/figure>/g, '').replace(/<b>요약<\/b>/g, '')
    .replace(/<tr><th>([\s\S]*?)<\/th><td>([\s\S]*?)<\/td><\/tr>/g, ' $1: $2.').replace(/<thead>[\s\S]*?<\/thead>/g, '')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/\.\./g, '.').trim();
  return { '@type': 'Question', name: questions[id], acceptedAnswer: { '@type': 'Answer', text: answer } };
});
const description = html.match(/<meta name="description" content="([^"]+)">/)[1];
const jsonLd = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'Organization', '@id': `${origin}/#org`, name: '해칫 운영팀', url: `${origin}/`, logo: `${origin}/assets/hatcheat/haechi_yellow.png` },
  { '@type': 'WebSite', '@id': `${origin}/#site`, name: '해칫', alternateName: ['hatch eat', 'Hatcheat'], url: `${origin}/`, inLanguage: 'ko-KR', publisher: { '@id': `${origin}/#org` } },
  { '@type': 'WebApplication', '@id': `${appUrl}#app`, name: '해칫', alternateName: 'hatch eat', url: appUrl, description,
    applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', browserRequirements: 'JavaScript 필요', inLanguage: 'ko-KR',
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: 0, priceCurrency: 'KRW' },
    image: `${origin}/assets/hatcheat/haechi_16x9.png`, publisher: { '@id': `${origin}/#org` } },
  { '@type': 'FAQPage', '@id': `${origin}/#faq`, inLanguage: 'ko-KR', mainEntity: faq },
] };
html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n</head>`);
for (const path of ['index.html', 'v2/index.html', 'v3/index.html']) await writeFile(join(root, path), html);
console.log('Prepared current Hatcheat landing at /, /v2, /v3.');
