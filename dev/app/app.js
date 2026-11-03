import { STORAGE_KEY, readState, saveState, normalizeState, canGive, grindOnce, inkMilestone, inkReaction, CircularGesture, GivingRitual } from './core.js';
import { BOOKS, quoteById, bookName } from './quotes.js';
import { playGiving } from './giving-animation.js';
import { createInkMotion } from './ink-motion.js';
import { createSoundEffects } from './sound-effects.js';
import { createUIMotion } from './ui-motion.js';

const $ = id => document.getElementById(id);
let storage;
try { storage = window.hatcheatNativeStorage || window.localStorage; } catch { /* The app remains usable in memory. */ }
const loaded = readState(storage);
let state = loaded.state;
let currentView = 'write', saved = loaded.status === 'ok', pointer = null, activeAnimation, toastTimer;
const gesture = new CircularGesture(), ritual = new GivingRitual();
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const effects = createSoundEffects({ enabled:state.sound });
const uiMotion = createUIMotion(motion);
const draft = $('draft');
const views = ['write','giving','done','ink','library'];
const warning = '이 브라우저에 저장할 수 없어요. 먹 진행과 필사첩은 창을 닫으면 사라질 수 있어요.';

function notify(message) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3600);
}
function storageNotice(message = '') { $('storage-notice').textContent = message; $('storage-notice').hidden = !message; }
function persist(next) {
  state = normalizeState(next); saved = saveState(storage, state);
  storageNotice(saved ? '' : warning);
  updateProgress();
}
function focusHeading(id) { requestAnimationFrame(() => $(id)?.focus({ preventScroll:true })); }
function showView(name, { focus = true } = {}) {
  if (ritual.status === 'giving' && name !== 'giving') return;
  effects.stop(); uiMotion.stop();
  currentView = name;
  for (const view of views) $(`${view}-view`).hidden = view !== name;
  document.body.classList.toggle('is-writing', name === 'write' && document.activeElement === draft);
  document.querySelectorAll('.tabbar button').forEach(button => {
    if (button.dataset.view === name || (name === 'done' && button.dataset.view === 'write')) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
    button.disabled = name === 'giving';
  });
  $('settings-open').disabled = name === 'giving';
  stopGesture();
  if (name === 'library') renderLibrary();
  if (name === 'ink') updateProgress();
  if (name !== 'giving') uiMotion.enter($(`${name}-view`));
  if (focus) focusHeading(`${name === 'write' ? 'write' : name === 'library' ? 'library' : name}-title`);
  window.scrollTo({ top:0, behavior:'instant' });
}
function updateInput() { $('give').disabled = !canGive(draft.value) || ritual.status === 'giving'; }
function clearPrivateContent() {
  ritual.clear(); activeAnimation?.cancel(); activeAnimation = null;
  draft.value = ''; draft.readOnly = false; draft.blur();
  $('write-error').hidden = true; updateInput();
  if (currentView === 'giving' || currentView === 'done') showView('write', { focus:false });
  document.body.classList.remove('is-writing');
}
function imageReady(image) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('image timeout')); }, 5000);
    const cleanup = () => { clearTimeout(timeout); image.removeEventListener('load', success); image.removeEventListener('error', failure); };
    const success = () => { cleanup(); image.naturalWidth ? resolve() : reject(new Error('empty image')); };
    const failure = () => { cleanup(); reject(new Error('image unavailable')); };
    if (image.complete && image.naturalWidth) { success(); return; }
    image.addEventListener('load', success, { once:true }); image.addEventListener('error', failure, { once:true });
    // A failed <img> stays failed even after the connection recovers. Retry its original URL.
    if (image.complete) image.src = image.src;
  });
}
async function giveNote(event) {
  event.preventDefault();
  const token = ritual.begin(draft.value);
  if (token === null) return;
  effects.unlock();
  $('write-error').hidden = true; draft.readOnly = true; draft.blur(); updateInput();
  showView('giving'); $('giving-status').textContent = '한지를 곱게 접고 있어요.';
  try {
    if (!motion.matches) {
      await Promise.all(['ritual-waiting','eating-haechi','ritual-resting'].map(id => imageReady($(id))));
      if (token !== ritual.generation) return;
      if (!motion.matches) {
        activeAnimation = playGiving($('giving-scene'), message => {
          if (token === ritual.generation) $('giving-status').textContent = message;
        }, cue => { if (token === ritual.generation) effects.play(cue); });
        await activeAnimation.finished;
      }
    }
    if (!ritual.complete(token)) return;
    activeAnimation?.cancel(); activeAnimation = null;
    draft.value = ''; draft.readOnly = false; updateInput();
    if (navigator.vibrate) navigator.vibrate(20);
    showView('done');
    effects.play('settle');
  } catch {
    if (token !== ritual.generation) return;
    activeAnimation?.cancel(); activeAnimation = null;
    const preserved = ritual.fail(token);
    if (preserved === null) return;
    draft.value = preserved; draft.readOnly = false;
    showView('write'); updateInput();
    $('write-error').textContent = '해치가 아직 받지 못했어요. 적은 글은 그대로 있으니 한 번 더 건네 주세요.';
    $('write-error').hidden = false;
  }
}
$('writing-form').addEventListener('submit', giveNote);
draft.addEventListener('input', () => { $('write-error').hidden = true; updateInput(); });
draft.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.isComposing) {
    event.preventDefault(); endWriting(); focusHeading('write-title');
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.isComposing) {
    event.preventDefault(); if (canGive(draft.value)) $('writing-form').requestSubmit();
  }
});
draft.addEventListener('focus', () => { document.body.classList.add('is-writing'); });
draft.addEventListener('blur', () => { if (!canGive(draft.value)) document.body.classList.remove('is-writing'); });
function endWriting() { draft.blur(); document.body.classList.remove('is-writing'); }
$('writing-done').addEventListener('click', () => { endWriting(); focusHeading('write-title'); });
$('finish').addEventListener('click', () => { ritual.clear(); showView('write'); });
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  effects.unlock(); showView(button.dataset.view); effects.play('page-open');
}));

function updateProgress() {
  $('turn-count').textContent = state.turns; $('turn-progress').value = state.turns;
  $('ink-pool').style.setProperty('--ink-darkness', String(.35 + state.turns / 100 * .62));
  const speech = $('ink-reaction');
  const milestone = inkMilestone(state.turns);
  if (speech.dataset.milestone !== String(milestone)) {
    const previousMilestone = speech.dataset.milestone;
    const reaction = inkReaction(state.turns);
    const haechi = $('ink-haechi');
    if (haechi.dataset.stage !== String(reaction.stage)) {
      haechi.src = reaction.stage ? `./assets/haechi/haechi_grind_${reaction.stage}.png` : './assets/haechi/haechi_sit.png';
      haechi.alt = reaction.stage ? '먹을 가는 동안 응원하며 웃는 해치' : '벼루 곁에서 함께 쉬는 해치';
      haechi.dataset.stage = String(reaction.stage);
    }
    speech.hidden = !reaction.message;
    speech.textContent = reaction.message;
    speech.dataset.milestone = String(milestone);
    if (previousMilestone !== undefined && milestone) uiMotion.reaction(haechi, speech);
  }
  $('current-book').textContent = bookName(state.book);
  $('card-count').textContent = `${state.collection.length}장`;
}
function finishTurn() {
  if (currentView !== 'ink' || document.querySelector('dialog[open]')) return;
  const result = grindOnce(state); persist(result.state);
  uiMotion.ripple($('ink-pool'));
  if (navigator.vibrate) navigator.vibrate(8);
  if (result.quote) { stopGesture(); openQuote(result.quote, true); }
}
$('grind-once').addEventListener('click', () => {
  if (currentView !== 'ink' || document.querySelector('dialog[open]')) return;
  effects.unlock();
  if (pointer !== null) stopGesture();
  finishTurn();
  if (!$('quote-dialog').open) { inkMotion.turn(); effects.grindFor(900); }
});
const stone = $('inkstone');
const inkMotion = createInkMotion(stone, $('grinding-surface'), $('ink-stick'), motion);
function stopGesture({ settle = false } = {}) {
  const previous = pointer; pointer = null; gesture.reset(); lastContact = null; effects.stopGrinding();
  if (previous !== null && stone.hasPointerCapture(previous)) stone.releasePointerCapture(previous);
  if (settle) inkMotion.end(); else inkMotion.stop();
}
let lastContact = null;
function samplePointer(event) {
  const samples = event.getCoalescedEvents?.() || [];
  for (const sample of samples.length ? samples : [event]) {
    if (pointer === null) break; // A completed quote may have ended this gesture.
    const { x,y } = inkMotion.follow(sample.clientX, sample.clientY);
    if (lastContact && Math.hypot(x-lastContact.x,y-lastContact.y) > .025) effects.grindFor(140);
    lastContact = { x,y };
    if (gesture.move(x,y)) finishTurn();
  }
}
stone.addEventListener('pointerdown', event => {
  if (pointer !== null || !event.isPrimary || event.button !== 0 || currentView !== 'ink' || document.querySelector('dialog[open]')) return;
  effects.unlock();
  event.preventDefault(); pointer = event.pointerId; gesture.reset(); lastContact = null;
  stone.setPointerCapture(pointer); inkMotion.start(); samplePointer(event);
});
stone.addEventListener('pointermove', event => { if (event.pointerId === pointer) { event.preventDefault(); samplePointer(event); } });
stone.addEventListener('pointerup', event => {
  if (event.pointerId !== pointer) return;
  samplePointer(event);
  if (pointer !== null) stopGesture({ settle:true });
});
for (const name of ['pointercancel','lostpointercapture']) stone.addEventListener(name, event => {
  if (event.pointerId === pointer) stopGesture();
});
addEventListener('resize', () => { stopGesture(); if (currentView === 'ink') inkMotion.resize(); });
addEventListener('scroll', () => { if (pointer !== null) stopGesture(); }, { passive:true });

function renderLibrary() {
  const list = $('card-list'); list.replaceChildren();
  $('library-empty').hidden = state.collection.length > 0;
  [...state.collection].reverse().forEach((id, index) => {
    const quote = quoteById(id), li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button'; button.className = 'library-card';
    const meta = document.createElement('span'); meta.className = 'card-meta';
    const book = document.createElement('span'), number = document.createElement('span');
    book.textContent = bookName(quote.book); number.textContent = `${state.collection.length-index}번째 장`;
    meta.append(book,number);
    const meaning = document.createElement('span'); meaning.className = 'card-meaning'; meaning.textContent = quote.meaning;
    const original = document.createElement('span'); original.className = 'card-original'; original.lang = 'zh-Hant'; original.textContent = quote.original;
    button.append(meta,meaning,original); button.addEventListener('click', () => openQuote(quote));
    li.append(button); list.append(li);
  });
  updateProgress();
}
function openQuote(quote, isNew = false) {
  effects.stop(); uiMotion.stop();
  $('quote-title').textContent = isNew ? '해치가 한 구절을 옮겨 적었어요.' : '해치가 옮겨 적은 한 구절';
  $('quote-book').textContent = `${bookName(quote.book)} · ${quote.chapter}`;
  $('quote-original').textContent = quote.original; $('quote-reading').textContent = quote.reading; $('quote-meaning').textContent = quote.meaning;
  $('quote-source').href = quote.source;
  $('quote-saved').textContent = saved ? (isNew ? '필사첩에 한 장을 넣었어요.' : '이 기기에 보관된 필사 카드예요.') : '기기에 저장하지 못했어요. 지금은 이 창에서만 볼 수 있어요.';
  $('quote-dialog').showModal(); $('quote-title').focus();
  uiMotion.dialog($('quote-dialog'),isNew);
  effects.play(isNew ? 'card-reveal' : 'page-open');
}
$('quote-library').addEventListener('click', () => { $('quote-dialog').close(); showView('library'); });

for (const book of BOOKS) {
  const label = document.createElement('label'); label.className = 'book-option';
  const input = document.createElement('input'); input.type = 'radio'; input.name = 'book'; input.value = book.id;
  const text = document.createElement('span'), small = document.createElement('small');
  text.textContent = book.name; small.textContent = book.detail; text.append(small); label.append(input,text);
  input.addEventListener('change', () => persist({ ...state, book:book.id }));
  $('book-options').append(label);
}
function openSettings() {
  effects.stop(); uiMotion.stop(); stopGesture(); endWriting();
  document.querySelectorAll('[name=book]').forEach(input => input.checked = input.value === state.book);
  $('sound-toggle').checked = state.sound; $('settings-dialog').showModal(); $('settings-title').focus();
  uiMotion.dialog($('settings-dialog'));
}
$('settings-open').addEventListener('click', openSettings);
$('book-shortcut').addEventListener('click', openSettings);
$('sound-toggle').addEventListener('change', event => {
  persist({ ...state, sound:event.target.checked }); effects.setEnabled(state.sound);
  if (state.sound) { effects.unlock(); effects.play('paper-fold'); }
});
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('close', () => { effects.stop(); uiMotion.cancel('dialog'); });
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
}

motion.addEventListener('change', event => { if (event.matches) { activeAnimation?.finish(); stopGesture(); uiMotion.stop(); effects.stop(); } });
addEventListener('pagehide', () => { clearPrivateContent(); stopGesture(); uiMotion.stop(); effects.suspend(); });
addEventListener('pageshow', event => { if (event.persisted) clearPrivateContent(); });
function leaveApp() {
  const hadDraft = canGive(draft.value);
  clearPrivateContent(); stopGesture(); uiMotion.stop(); effects.suspend();
  if (hadDraft) notify('앱을 벗어나 적던 원문을 지웠어요.');
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leaveApp(); });
addEventListener('hatcheat:background', leaveApp);
addEventListener('hatcheat:audio-interrupted', () => effects.suspend());
addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  const refreshed = readState(storage); state = refreshed.state; saved = refreshed.status === 'ok';
  effects.setEnabled(state.sound);
  if ($('settings-dialog').open) $('sound-toggle').checked = state.sound;
  updateProgress(); if (currentView === 'library') renderLibrary();
});
function updateOnline() { $('offline').hidden = navigator.onLine; }
addEventListener('online',updateOnline); addEventListener('offline',updateOnline); updateOnline();
if (loaded.status !== 'ok') storageNotice(loaded.status === 'invalid' ? '저장된 진행을 읽지 못해 새 필사첩으로 열었어요.' : warning);
showView('write',{ focus:false }); updateProgress();

function offlineStatus(status) {
  const messages = {
    preparing:'오프라인 사용을 준비하고 있어요.',
    ready:'오프라인에서도 사용할 준비가 됐어요.',
    failed:'오프라인 준비를 마치지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'
  };
  $('offline-status').textContent = messages[status];
  $('offline-retry').hidden = status !== 'failed';
}
async function prepareOffline() {
  offlineStatus('preparing');
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const watch = worker => {
      const update = () => {
        if (registration.active?.state === 'activated' || worker?.state === 'activated') offlineStatus('ready');
        else if (!worker || worker.state === 'redundant') offlineStatus('failed');
      };
      worker?.addEventListener('statechange', update);
      update();
    };
    registration.onupdatefound = () => watch(registration.installing);
    watch(registration.installing || registration.waiting || registration.active);
  } catch { offlineStatus('failed'); }
}
$('offline-retry').addEventListener('click', prepareOffline);
if (window.hatcheatNativeStorage) offlineStatus('ready');
else if ('serviceWorker' in navigator) void prepareOffline();
else $('offline-status').textContent = '이 브라우저에서는 인터넷에 연결된 상태로 이용해 주세요.';
