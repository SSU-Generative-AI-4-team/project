// 랜딩·개인정보처리방침 페이지의 Google 애널리틱스 4(→ Google Ads)와 Meta 픽셀.
// 이벤트 이름 앞에 landing_ 을 붙이고, 모든 이벤트에 surface: 'landing'을 넣어 웹앱(web_)·iOS 앱(app_)과 구분한다.
// ID가 비어 있으면 아무것도 불러오거나 보내지 않는다.
// 체험 창에 적은 글은 읽지 않는다. 클릭된 버튼의 종류만 보낸다.
(function () {
  var IDS = { ga4: 'G-SHN7J0CFX6', metaPixel: '' };
  var META_EVENTS = { cta_click: 'LandingCtaClick', demo_give: 'LandingDemoGive', share: 'LandingShare' };
  var debug = /(?:^|[?&])analytics=debug(?:&|$)/.test(location.search);
  if (!IDS.ga4 && !IDS.metaPixel) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !debug) return;

  function loadScript(src) {
    var script = document.createElement('script');
    script.async = true; script.src = src; document.head.appendChild(script);
  }
  if (IDS.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', IDS.ga4, debug ? { surface: 'landing', debug_mode: true } : { surface: 'landing' });
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(IDS.ga4));
  }
  if (IDS.metaPixel) {
    var fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    fbq('set', 'autoConfig', false, IDS.metaPixel);
    fbq('init', IDS.metaPixel);
    fbq('track', 'PageView');
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
  }

  function track(name, params) {
    params = params || {}; params.surface = 'landing';
    try {
      if (IDS.ga4) window.gtag('event', 'landing_' + name, params);
      if (IDS.metaPixel && META_EVENTS[name]) window.fbq('trackCustom', META_EVENTS[name], params);
    } catch (e) { /* 측정 실패는 페이지 동작을 막지 않는다. */ }
  }

  // 캡처 단계에서 듣는다. 페이지 스크립트가 버튼 상태를 바꾸기 전의 클릭을 본다.
  // 비활성 버튼(글이 비어 있는 '해치에게 건네기')은 클릭 이벤트가 나지 않는다.
  document.addEventListener('click', function (event) {
    var el = event.target.closest && event.target.closest('button, a');
    if (!el) return;
    if (el.classList.contains('launch')) {
      track('cta_click', { cta_location: el.id === 'hero-cta' ? 'hero' : el.id === 'end-cta' ? 'end' : el.closest('#mbar') ? 'mobile_bar' : 'header' });
    } else if (el.id === 'give') {
      track('demo_give');
    } else if (el.id === 'share') {
      track('share', { method: navigator.share ? 'share_sheet' : 'copy_link', content_type: 'landing' });
    } else if (el.dataset.modal) {
      track('select_content', { content_type: 'feature_card', content_id: el.dataset.modal });
    } else if (el.classList.contains('line') && !el.classList.contains('is-eaten')) {
      track('select_content', { content_type: 'example_line', content_id: 'line-' + Array.prototype.indexOf.call(document.querySelectorAll('.line'), el) });
    } else if (el.getAttribute('href') === '/privacy') {
      track('privacy_click');
    }
  }, true);
})();
