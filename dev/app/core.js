import { BOOKS, QUOTES, quoteById } from './quotes.js';
export const STORAGE_KEY = 'hatcheat.progress.v1';
export const TURNS_PER_CARD = 100;
export const initialState = () => ({ version:1, turns:0, collection:[], book:'random', sound:true });
export const canGive = text => typeof text === 'string' && text.trim().length > 0;

// Reconstruct a whitelist instead of spreading unknown persisted keys. Drafts never enter this model.
export function normalizeState(value) {
  const clean = initialState();
  if (!value || typeof value !== 'object' || value.version !== 1) return clean;
  if (Number.isInteger(value.turns) && value.turns >= 0 && value.turns < TURNS_PER_CARD) clean.turns = value.turns;
  if (Array.isArray(value.collection)) clean.collection = value.collection.filter(id => typeof id === 'string' && quoteById(id));
  if (BOOKS.some(book => book.id === value.book)) clean.book = value.book;
  if (typeof value.sound === 'boolean') clean.sound = value.sound;
  return clean;
}
export function readState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { state:initialState(), status:'ok' };
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return { state:initialState(), status:'invalid' };
    return { state:normalizeState(data), status:'ok' };
  } catch (error) {
    return { state:initialState(), status:error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state))); return true; }
  catch { return false; }
}
export function pickQuote(state, random = Math.random) {
  const pool = QUOTES.filter(q => state.book === 'random' || q.book === state.book);
  // Start a fresh random cycle after each full set, including when a book is fixed.
  const poolIds = new Set(pool.map(q => q.id));
  const collected = state.collection.filter(id => poolIds.has(id));
  const cycleLength = collected.length % pool.length;
  const currentCycle = new Set(collected.slice(collected.length - cycleLength));
  const available = pool.filter(q => !currentCycle.has(q.id));
  const withoutPrevious = available.filter(q => q.id !== state.collection.at(-1));
  const choices = withoutPrevious.length ? withoutPrevious : available;
  const sample = random();
  const index = Number.isFinite(sample) ? Math.max(0, Math.min(choices.length - 1, Math.floor(sample * choices.length))) : 0;
  return choices[index];
}
export function grindOnce(value, random = Math.random) {
  const state = normalizeState(value);
  if (state.turns < TURNS_PER_CARD - 1) return { state:{ ...state, turns:state.turns + 1 }, quote:null };
  const quote = pickQuote(state, random);
  return { state:{ ...state, turns:0, collection:[...state.collection, quote.id] }, quote };
}

const INK_MESSAGES = {
  20: ['좋아요. 첫 스무 바퀴를 갈았어요.', '먹빛이 조금씩 짙어지고 있어요.', '해치가 곁에서 응원하고 있어요.', '천천히, 지금처럼 갈아 주세요.'],
  40: ['벌써 마흔 바퀴예요. 잘하고 있어요.', '먹빛이 한층 더 깊어졌어요.', '해치가 반가운 눈으로 보고 있어요.', '차분히 이어 가고 있네요.'],
  60: ['절반을 훌쩍 넘었어요.', '해치가 곧 한 구절을 가져올 거예요.', '먹빛이 충분히 깊어졌어요.', '좋은 속도예요. 함께 이어 가요.'],
  80: ['거의 다 왔어요. 조금만 더요.', '거의 다 왔어요. 해치가 기다려요.', '거의 다 왔어요. 한 구절이 가까워요.', '거의 다 왔어요. 마지막 스무 바퀴예요.']
};
export function inkMilestone(turns) {
  return turns >= 80 ? 80 : turns >= 60 ? 60 : turns >= 40 ? 40 : turns >= 20 ? 20 : 0;
}
export function inkReaction(turns, random = Math.random) {
  const milestone = inkMilestone(turns);
  if (!milestone) return { stage:0, message:'' };
  const messages = INK_MESSAGES[milestone];
  const sample = random();
  const index = Number.isFinite(sample) ? Math.max(0, Math.min(messages.length - 1, Math.floor(sample * messages.length))) : 0;
  return { stage:Math.min(milestone, 60), message:messages[index] };
}

// Net angular travel rejects back-and-forth scrubbing; allow a small hand-drawn closing gap.
export class CircularGesture {
  constructor() { this.reset(); }
  reset() { this.previous = null; this.travel = 0; }
  move(x, y) {
    const radius = Math.hypot(x, y);
    if (!Number.isFinite(radius) || radius < .18 || radius > .96) { this.reset(); return 0; }
    const angle = Math.atan2(y, x);
    if (this.previous === null) { this.previous = angle; return 0; }
    let delta = Math.atan2(Math.sin(angle - this.previous), Math.cos(angle - this.previous));
    this.previous = angle;
    if (Math.abs(delta) > Math.PI / 2) { this.travel = 0; return 0; }
    this.travel += delta;
    if (Math.abs(this.travel) < Math.PI * 2 - Math.PI / 6 - 1e-8) return 0;
    // Subtract a whole revolution, so the closing allowance is not gained on every lap.
    this.travel -= Math.sign(this.travel) * Math.PI * 2;
    return 1;
  }
}

// One in-memory lifecycle. An aborted animation cannot complete or resurrect an old draft.
export class GivingRitual {
  constructor() { this.status = 'writing'; this.draft = ''; this.generation = 0; }
  begin(text) {
    if (this.status === 'giving' || !canGive(text)) return null;
    this.draft = text; this.status = 'giving';
    return ++this.generation;
  }
  complete(token) {
    if (token !== this.generation || this.status !== 'giving') return false;
    this.draft = ''; this.status = 'done'; return true;
  }
  fail(token) {
    if (token !== this.generation || this.status !== 'giving') return null;
    const draft = this.draft;
    this.draft = ''; this.status = 'writing';
    return draft;
  }
  clear() { this.generation++; this.draft = ''; this.status = 'writing'; }
}
