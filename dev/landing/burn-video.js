// Shared, locally hosted footage. No user text is sent to a media service.
export function createVideoCutscene(host, source) {
  let active;
  const cancel = () => active?.finish(false);
  return {
    cancel,
    start() {
      cancel();
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      if (motion.matches) return Promise.resolve(true);
      const asset = new URL(source, location.href);
      if (asset.origin !== location.origin || !asset.pathname.startsWith('/assets/')) return Promise.resolve(false);
      const video = document.createElement('video');
      video.className = 'burn-cutscene';
      video.muted = true; video.playsInline = true; video.preload = 'auto';
      video.setAttribute('aria-hidden', 'true');
      video.src = asset.href;
      host.append(video);
      return new Promise(resolve => {
        let settled = false, timer;
        const motionChanged = e => { if (e.matches) finish(true); };
        const finish = success => {
          if (settled) return;
          settled = true; clearTimeout(timer);
          motion.removeEventListener?.('change', motionChanged);
          video.onended = video.onerror = null;
          video.pause(); video.removeAttribute('src'); video.load(); video.remove();
          if (active?.video === video) active = null;
          resolve(success);
        };
        active = {video, finish};
        motion.addEventListener?.('change', motionChanged);
        video.onended = () => finish(true);
        video.onerror = () => finish(false);
        timer = setTimeout(() => finish(false), 10000);
        try { video.play()?.catch(() => finish(false)); } catch { finish(false); }
      });
    }
  };
}
