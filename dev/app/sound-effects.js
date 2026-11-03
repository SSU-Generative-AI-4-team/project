const CUES = new Set(['paper-fold','paper-glide','haechi-bite','settle','ink-grind','page-open','card-reveal']);

// Only fixed cue names cross this boundary. Neither audio backend receives user text.
export function createSoundEffects({ enabled = true, native = window.hatcheatNativeFeedback } = {}) {
  let context, ready = Promise.resolve(), blocked = true, generation = 0;
  let grinding = false, grindToken = 0, grindTimer = 0, grindSource = null, grindGain = null;
  const buffers = new Map(), active = new Set(), lastPlayed = new Map();
  const callNative = (name, value) => { try { native?.[name](value); } catch { /* Effects are optional. */ } };
  function load(name) {
    if (!buffers.has(name)) {
      const pending = fetch(new URL(`./assets/audio/${name}.wav`, document.baseURI))
        .then(response => { if (!response.ok) throw Error('Sound unavailable'); return response.arrayBuffer(); })
        .then(data => context.decodeAudioData(data))
        .catch(() => { buffers.delete(name); return null; });
      buffers.set(name,pending);
    }
    return buffers.get(name);
  }
  function unlock() {
    if (!enabled) return;
    blocked = false;
    if (native) { callNative('prepare'); return; }
    try {
      if (!context || context.state === 'closed') {
        context = new (window.AudioContext || window.webkitAudioContext)(); buffers.clear();
      }
      // Call resume in the input handler, before image loads or animation promises.
      ready = context.state === 'running' ? Promise.resolve() : context.resume().catch(() => {});
      for (const cue of CUES) void load(cue);
    } catch { blocked = true; }
  }
  function stop() {
    stopGrinding(true);
    generation++; lastPlayed.clear(); callNative('stop');
    for (const source of active) { try { source.stop(); source.disconnect(); } catch { /* Already ended. */ } }
    active.clear();
  }
  function stopGrinding(immediate = false) {
    clearTimeout(grindTimer); grindTimer = 0;
    if (!grinding && !grindSource) return;
    grinding = false; grindToken++; callNative('stopGrinding');
    if (grindSource) {
      const source = grindSource, gain = grindGain;
      grindSource = grindGain = null;
      try {
        if (immediate) source.stop();
        else {
          gain.gain.cancelScheduledValues(context.currentTime);
          gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
          gain.gain.linearRampToValueAtTime(0, context.currentTime + .045);
          source.stop(context.currentTime + .05);
        }
      } catch { try { source.stop(); } catch { /* Already stopped. */ } }
    }
  }
  function grindFor(milliseconds) {
    if (!enabled || blocked) return;
    clearTimeout(grindTimer);
    grindTimer = setTimeout(stopGrinding, milliseconds);
    if (grinding) return;
    grinding = true;
    const token = ++grindToken;
    if (native) { callNative('startGrinding'); return; }
    if (!context) return;
    void Promise.all([load('ink-grind'),ready]).then(([buffer]) => {
      if (!buffer || !grinding || token !== grindToken || !enabled || blocked || context.state !== 'running') return;
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.loop = true;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(1, context.currentTime + .035);
      source.connect(gain).connect(context.destination);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      grindSource = source; grindGain = gain; source.start();
    }).catch(() => {});
  }
  function suspend() {
    stop(); blocked = true; callNative('suspend');
    if (context && context.state !== 'closed') void context.suspend().catch(() => {});
  }
  function play(name) {
    if (!enabled || blocked || !CUES.has(name)) return;
    const requested = performance.now();
    if (requested - (lastPlayed.get(name) ?? -Infinity) < 110) return;
    lastPlayed.set(name,requested);
    if (native) { callNative('play',name); return; }
    if (!context) return;
    const token = generation;
    void Promise.all([load(name),ready]).then(([buffer]) => {
      // A late download/resume must not replay a previous screen or an old gesture.
      if (!buffer || token !== generation || !enabled || blocked || context.state !== 'running' || performance.now()-requested > 400) return;
      if (active.size >= 3) { const oldest = active.values().next().value; oldest.stop(); active.delete(oldest); }
      const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
      source.onended = () => { active.delete(source); source.disconnect(); };
      active.add(source); source.start();
    }).catch(() => {});
  }
  return { unlock, play, grindFor, stopGrinding, stop, suspend, setEnabled(value) { enabled = Boolean(value); if (!enabled) suspend(); } };
}
