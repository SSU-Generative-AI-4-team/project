// 웹앱(브라우저)과 iOS 앱이 함께 쓰는 측정 모듈.
// 웹앱: Google 애널리틱스 4(→ Google Ads 전환 가져오기) + Meta 픽셀을 직접 불러온다.
// iOS 앱: 태그를 불러오지 않고, 네이티브 SDK(Firebase·Meta)로 이벤트를 넘긴다(HatcheatAnalytics.swift).
// 이벤트 이름 앞에 web_ / app_ 을 붙이고, 모든 이벤트에 surface 값을 넣어 랜딩(landing_)과도 구분한다.
// 원문·글자 수·입력값은 보내지 않는다. 파라미터는 아래 허용 목록의 고정 값(화면·책·카드 ID 등)만 통과한다.
export const IDS = { ga4: 'G-3WJ72DFX0W', metaPixel: '' }; // 웹앱 전용. iOS 앱의 ID는 Xcode 쪽 설정에 있다.

// Meta에는 CPA 최적화에 쓸 행동만 보낸다(맞춤 전환으로 등록해서 쓴다).
const META_EVENTS = { give_note:'GiveNote', quote_unlock:'QuoteUnlock', ink_start:'InkStart', pwa_install:'PwaInstall' };
const PARAM_KEYS = new Set(['screen_name', 'book', 'card_count', 'content_type', 'content_id', 'enabled']);

let surface = null; // null(꺼짐) | 'web' | 'app'
const debug = /(?:^|[?&])analytics=debug(?:&|$)/.test(location.search);

function safeParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (!PARAM_KEYS.has(key)) continue;
    if (typeof value === 'number' || typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'string' && /^[\w-]{1,40}$/.test(value)) out[key] = value;
  }
  return out;
}
function loadScript(src) {
  const script = document.createElement('script');
  script.async = true; script.src = src; document.head.append(script);
}
function startGoogle(id) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { surface:'web', ...(debug ? { debug_mode:true } : {}) });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}
function startMeta(id) {
  // Meta 기본 코드의 대기열과 같다. 스크립트가 오기 전 호출도 쌓아 둔다.
  const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
  // 자동 이벤트 설정(버튼 문구·페이지 메타데이터 자동 수집)을 끈다.
  fbq('set', 'autoConfig', false, id);
  fbq('init', id);
  fbq('track', 'PageView');
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
}

export function initAnalytics() {
  if (window.hatcheatNativeStorage) {
    // iOS 앱: 네이티브 쪽이 analytics 통로를 열었을 때(=SDK 설정이 있을 때)만 보낸다.
    surface = window.webkit?.messageHandlers?.analytics ? 'app' : null;
    return surface === 'app';
  }
  if (!IDS.ga4 && !IDS.metaPixel) return false;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !debug) return false;
  if (IDS.ga4) startGoogle(IDS.ga4);
  if (IDS.metaPixel) startMeta(IDS.metaPixel);
  surface = 'web';
  return true;
}

export function track(name, params = {}) {
  if (!surface) return;
  const clean = { ...safeParams(params), surface };
  const ga = `${surface}_${name}`;
  const meta = META_EVENTS[name] && (surface === 'app' ? 'App' : 'Web') + META_EVENTS[name];
  try {
    if (surface === 'app') { window.webkit.messageHandlers.analytics.postMessage(JSON.stringify({ ga, meta:meta || null, params:clean })); return; }
    if (IDS.ga4) window.gtag('event', ga, clean);
    if (IDS.metaPixel && meta) window.fbq('trackCustom', meta, clean);
  } catch { /* 측정 실패는 앱 동작을 막지 않는다. */ }
}
