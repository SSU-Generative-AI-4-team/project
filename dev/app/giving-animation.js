// This scene receives no note text. It only moves a blank sheet and the approved character poses.
export const GIVING_DURATION = 5200;

export function playGiving(scene, onPhase, onCue = () => {}) {
  const find = id => scene.querySelector(`#${id}`);
  const paper = find('folded-paper'), mouth = find('mouth-target');
  const paperRect = paper.getBoundingClientRect(), mouthRect = mouth.getBoundingClientRect();
  // Percent translations follow the paper size, so resizing keeps the sheet aimed at the mouth.
  const dx = (mouthRect.left - paperRect.left - paperRect.width / 2) / paperRect.width * 100;
  const dy = (mouthRect.top - paperRect.top - paperRect.height * .75) / paperRect.height * 100;
  const move = (x,y,angle,scale) => `translate(${x}%,${y}%) rotate(${angle}deg) scale(${scale})`;
  const animations = [], timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };
  const cancel = () => { clearTimers(); animations.forEach(animation => animation.cancel()); };
  const animate = (element, frames) => {
    const animation = element.animate(frames, { duration:GIVING_DURATION, fill:'both', easing:'linear' });
    // If a later animation cannot start, cancelling earlier ones must not leave rejected promises.
    void animation.finished.catch(() => {});
    animations.push(animation);
  };
  const soft = 'cubic-bezier(.4,0,.2,1)';
  try {
    animate(paper, [
      { offset:0, transform:move(0,14,-5,.98), opacity:0, easing:soft },
      { offset:.04, transform:move(0,0,-5,1), opacity:1, easing:soft },
      { offset:.25, transform:move(0,-8,-3,.88), opacity:1, easing:soft },
      { offset:.36, transform:move(dx*.4-8,dy*.55,4,.68), opacity:1, easing:soft },
      { offset:.48, transform:move(dx,dy,-4,.42), opacity:1, easing:soft },
      { offset:.54, transform:move(dx,dy-2,0,.36), opacity:1, easing:soft },
      { offset:.62, transform:move(dx+2,dy-8,0,.34), opacity:0 },
      { offset:1, transform:move(dx+2,dy-8,0,.34), opacity:0 }
    ]);
    animate(find('paper-flap'), [
      { offset:0, transform:'rotateX(0deg)' },
      { offset:.10, transform:'rotateX(0deg)', easing:soft },
      { offset:.22, transform:'rotateX(-172deg)', easing:soft },
      { offset:.25, transform:'rotateX(-180deg)' },
      { offset:1, transform:'rotateX(-180deg)' }
    ]);
    animate(find('paper-crease'), [
      { offset:0, opacity:0 }, { offset:.09, opacity:.6 },
      { offset:.22, opacity:.25 }, { offset:1, opacity:.25 }
    ]);
    animate(find('paper-sheet'), [
      { offset:0, clipPath:'inset(0% 0 0 0)' },
      { offset:.50, clipPath:'inset(0% 0 0 0)', easing:soft },
      { offset:.62, clipPath:'inset(100% 0 0 0)' },
      { offset:1, clipPath:'inset(100% 0 0 0)' }
    ]);
    animate(find('paper-shadow'), [
      { offset:0, opacity:0, transform:'scale(.8)' },
      { offset:.08, opacity:1, transform:'scale(1)' },
      { offset:.22, opacity:.5, transform:'scale(.7)', easing:soft },
      { offset:.43, opacity:0, transform:'scale(.3)' },
      { offset:1, opacity:0, transform:'scale(.3)' }
    ]);
    animate(find('ritual-waiting'), [
      { offset:0, opacity:1 }, { offset:.485, opacity:1 },
      { offset:.486, opacity:0 }, { offset:1, opacity:0 }
    ]);
    animate(find('eating-haechi'), [
      { offset:0, opacity:0 }, { offset:.46, opacity:0 }, { offset:.485, opacity:1 },
      { offset:.885, opacity:1 }, { offset:.886, opacity:0 }, { offset:1, opacity:0 }
    ]);
    animate(find('ritual-resting'), [
      { offset:0, opacity:0 }, { offset:.845, opacity:0 },
      { offset:.885, opacity:1 }, { offset:1, opacity:1 }
    ]);
    animate(find('ritual-actor'), [
      { offset:0, transform:'translateY(0%) rotate(0deg) scale(1)', easing:soft },
      { offset:.22, transform:'translateY(-.6%) rotate(-.5deg) scale(1.008)', easing:soft },
      { offset:.44, transform:'translateY(1.4%) rotate(1deg) scale(1.015,.985)', easing:soft },
      { offset:.51, transform:'translateY(.4%) rotate(-.6deg) scale(1.025,.975)', easing:soft },
      { offset:.57, transform:'translateY(-.8%) rotate(.3deg) scale(.99,1.012)', easing:soft },
      { offset:.63, transform:'translateY(.4%) rotate(-.3deg) scale(1.018,.984)', easing:soft },
      { offset:.69, transform:'translateY(-.5%) rotate(.2deg) scale(.994,1.008)', easing:soft },
      { offset:.75, transform:'translateY(.2%) rotate(-.2deg) scale(1.012,.99)', easing:soft },
      { offset:.82, transform:'translateY(0%) rotate(0deg) scale(1)', easing:soft },
      { offset:.92, transform:'translateY(.6%) rotate(-.5deg) scale(1)', easing:soft },
      { offset:1, transform:'translateY(0%) rotate(0deg) scale(1)' }
    ]);
    // One shared clock keeps the fold, bite, expression and body movement in step.
    const startTime = document.timeline.currentTime;
    animations.forEach(animation => { animation.startTime = startTime; });
    for (const [at, message] of [[.26,'접힌 한지를 건네고 있어요.'], [.50,'해치가 꼭꼭 받아먹고 있어요.']]) {
      timers.push(setTimeout(() => onPhase(message), GIVING_DURATION * at));
    }
    for (const [at, cue] of [[.10,'paper-fold'],[.26,'paper-glide'],[.51,'haechi-bite'],[.63,'haechi-bite'],[.75,'haechi-bite']]) {
      timers.push(setTimeout(() => onCue(cue), GIVING_DURATION * at));
    }
    return {
      finished:Promise.all(animations.map(animation => animation.finished)),
      cancel,
      finish() { clearTimers(); animations.forEach(animation => animation.finish()); }
    };
  } catch (error) { cancel(); throw error; }
}
