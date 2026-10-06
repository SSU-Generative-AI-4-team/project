/* Hallmark · component: paper combustion · P4 H4 E4 S5 R4 V4 */
// Ephemeral visual only: never persists or transmits the supplied text.
export function createBurnEffect(host, input) {
  let frame = 0, layer, canvas, context, paper, resolveRun;
  const clear = () => {
    cancelAnimationFrame(frame);
    layer?.remove();
    layer = canvas = context = paper = null;
    const done = resolveRun;
    resolveRun = null;
    done?.();
  };
  return {
    cancel: clear,
    start() {
      clear();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
      layer = document.createElement('div');
      layer.className = 'burn-scene';
      layer.setAttribute('aria-hidden', 'true');
      paper = document.createElement('div');
      paper.className = 'burn-paper';
      const words = document.createElement('div');
      words.className = 'burn-words';
      words.textContent = input.value;
      words.style.transform = `translateY(${-input.scrollTop}px)`;
      paper.append(words);
      canvas = document.createElement('canvas');
      canvas.className = 'burn-fire';
      layer.append(paper, canvas);
      host.append(layer);
      context = canvas.getContext('2d');
      if (!context) { clear(); return Promise.resolve(); }
      const style = getComputedStyle(host);
      const color = name => style.getPropertyValue(name).trim();
      const colors = { red:color('--fire-red'), orange:color('--fire-orange'), gold:color('--fire-gold'), core:color('--fire-core'), ash:color('--fire-ash'), char:color('--fire-char'), scorch:color('--fire-scorch'), smoke:color('--fire-smoke') };
      let width, height;
      const resize = () => {
        width = host.clientWidth; height = host.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const particles = [], smoke = [];
      // Smooth, seeded turbulence prevents synchronized sine-wave flame tips.
      const seed = Math.random() * 1000;
      const hash = n => { const v = Math.sin(n * 127.1 + seed) * 43758.5453; return v - Math.floor(v); };
      const noise = t => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
      const tongues = Array.from({length: Math.max(16, Math.ceil(width / 13))}, (_, i) => ({
        x:(i + hash(i * 7)) / Math.max(16, Math.ceil(width / 13)), phase:hash(i + 200) * 80,
        size: .65 + hash(i + 400) * .85
      }));
      const start = performance.now();
      let previous = start, emission = 0, smokeEmission = 0;
      const edge = (x, progress) => height + 22 - progress * (height + 72)
        + (noise(x * .016) - .5) * 44 + (noise(x * .08) - .5) * 12
        + (noise(x * .27) - .5) * 4;
      const traceEdge = (progress, offset = 0) => {
        context.beginPath();
        for (let x = 0; x <= width + 3; x += 3) {
          const y = edge(x, progress) + offset;
          if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
      };
      return new Promise(resolve => {
        resolveRun = resolve;
        const draw = now => {
          try {
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) { clear(); return; }
            const elapsed = now - start, dt = Math.min((now - previous) / 1000, .05);
            previous = now;
            if (elapsed >= 4100) { clear(); return; }
            if (width !== host.clientWidth || height !== host.clientHeight) resize();
            const progress = Math.max(0, Math.min(1, (elapsed - 250) / 2750));
            const strength = Math.min(1, elapsed / 350) * Math.max(0, Math.min(1, (3300 - elapsed) / 450));
            const outline = ['0 0', '100% 0'];
            for (let x = width; x >= 0; x -= 4) outline.push(`${x}px ${edge(x, progress)}px`);
            outline.push(`0 ${edge(0, progress)}px`);
            paper.style.clipPath = `polygon(${outline.join(',')})`;
            paper.style.opacity = progress >= 1 ? '0' : '1';
            context.clearRect(0, 0, width, height);
            // Scorch stays on the surviving paper, ahead of the burning edge.
            if (progress < 1) {
              context.save();
              traceEdge(progress); context.lineTo(width, 0); context.lineTo(0, 0); context.closePath(); context.clip();
              for (let x = 0; x < width; x += 4) {
                const y = edge(x, progress), depth = 13 + noise(x * .09) * 13;
                const char = context.createLinearGradient(0, y - depth, 0, y + 1);
                char.addColorStop(0, 'transparent'); char.addColorStop(.4, colors.scorch);
                char.addColorStop(.8, colors.char); char.addColorStop(1, colors.char);
                context.fillStyle = char; context.fillRect(x, y - depth, 4.5, depth + 2);
              }
              context.restore();
            }
            if (strength > 0) {
              smokeEmission += dt * 19 * strength;
              while (smokeEmission >= 1 && smoke.length < 45) {
                smokeEmission--;
                const x = Math.random() * width;
                smoke.push({x, y:edge(x, progress) - 12, age:0, life:1.1 + Math.random() * .7, radius:8 + Math.random() * 12, drift:(Math.random() - .5) * 18});
              }
            }
            // Sparse translucent smoke expands and curls as it rises.
            for (let i = smoke.length - 1; i >= 0; i--) {
              const p = smoke[i]; p.age += dt;
              if (p.age >= p.life) { smoke.splice(i, 1); continue; }
              p.y -= dt * 30; p.x += (p.drift + (noise(p.age * 2 + i) - .5) * 22) * dt;
              const radius = p.radius + p.age * 21;
              const haze = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
              haze.addColorStop(0, colors.smoke); haze.addColorStop(1, 'transparent');
              context.globalAlpha = Math.sin(Math.PI * p.age / p.life) * .11 * Math.min(1, (4100 - elapsed) / 500);
              context.fillStyle = haze; context.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
            }
            context.globalAlpha = 1;
            if (strength > 0) {
              // Independent ribbons: dark orange envelope, gold body, hot narrow core.
              for (const tongue of tongues) {
                const time = elapsed / 1000, phase = tongue.phase;
                const x = tongue.x * width + (noise(time * 2 + phase) - .5) * 15;
                const base = edge(x, progress);
                const pulse = noise(time * 5 + phase + 100);
                const tall = (22 + pulse * 62) * tongue.size * strength;
                const lean = (noise(time * 3 + phase + 300) - .5) * 36;
                const curl = (noise(time * 6 + phase + 600) - .5) * 25;
                for (let band = 0; band < 3; band++) {
                  const scale = [1, .73, .38][band];
                  const h = tall * scale, w = (7 + pulse * 7) * tongue.size * scale;
                  const tip = x + lean * scale;
                  const flame = context.createLinearGradient(x, base + 5, tip, base - h);
                  flame.addColorStop(0, band === 2 ? colors.core : colors.gold);
                  flame.addColorStop(.35, band === 2 ? colors.gold : colors.orange);
                  flame.addColorStop(.8, band === 0 ? colors.red : colors.orange);
                  flame.addColorStop(1, 'transparent');
                  context.globalAlpha = strength * [ .42, .65, .85 ][band];
                  context.fillStyle = flame;
                  context.beginPath(); context.moveTo(x - w, base + 5);
                  context.bezierCurveTo(x - w * 1.5, base - h * .28, tip + curl - w, base - h * .65, tip, base - h);
                  context.bezierCurveTo(tip + curl + w * .4, base - h * .55, x + w * 1.4, base - h * .2, x + w, base + 5);
                  context.fill();
                }
              }
              // Fine discontinuous embers, rather than a solid neon outline.
              context.globalAlpha = strength * .8;
              for (let x = 0; x < width; x += 3) {
                if (noise(x * .2 + elapsed * .002) < .38) continue;
                context.fillStyle = noise(x) > .7 ? colors.core : colors.orange;
                context.fillRect(x, edge(x, progress) - 1, 3, 1 + noise(x + 30) * 2);
              }
              emission += dt * 38 * strength;
              while (emission >= 1 && particles.length < 100) {
                emission--;
                const x = Math.random() * width;
                particles.push({ x, y:edge(x, progress), vx:(Math.random() - .5) * 32, vy:-(25 + Math.random() * 65), life:0, duration:.5 + Math.random() * 1.1, size:.6 + Math.random() * 2, ash:Math.random() > .5 });
              }
            }
            for (let i = particles.length - 1; i >= 0; i--) {
              const p = particles[i]; p.life += dt;
              if (p.life >= p.duration) { particles.splice(i, 1); continue; }
              p.x += (p.vx + Math.sin(now * .003 + i) * 8) * dt; p.y += p.vy * dt;
              context.globalAlpha = (1 - p.life / p.duration) * Math.min(1, (4100 - elapsed) / 450);
              context.fillStyle = p.ash ? colors.ash : colors.gold;
              context.save(); context.translate(p.x, p.y); context.rotate(p.life * 3);
              context.fillRect(-p.size / 2, -p.size / 2, p.size, p.ash ? p.size * 1.8 : p.size);
              context.restore();
            }
            context.globalAlpha = 1;
            frame = requestAnimationFrame(draw);
          } catch { clear(); }
        };
        frame = requestAnimationFrame(draw);
      });
    }
  };
}
