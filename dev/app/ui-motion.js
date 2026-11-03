// Short, cancellable presentation effects. Never read or copy the writing field.
export function createUIMotion(preference) {
  const groups = new Map();
  function cancel(group) {
    for (const animation of groups.get(group) || []) animation.cancel();
    groups.delete(group);
  }
  function animate(group, element, frames, options = {}) {
    if (preference.matches || !element) return;
    try {
      const animation = element.animate(frames,{duration:320,easing:'cubic-bezier(.16,1,.3,1)',fill:'both',...options});
      if (!groups.has(group)) groups.set(group,new Set());
      groups.get(group).add(animation);
      void animation.finished.then(() => animation.cancel(),() => {}).finally(() => {
        groups.get(group)?.delete(animation);
        if (groups.get(group)?.size === 0) groups.delete(group);
      });
    } catch { /* Decorative motion must not block an action. */ }
  }
  return {
    cancel,
    stop() { for (const group of [...groups.keys()]) cancel(group); },
    enter(view) {
      cancel('view');
      animate('view',view.querySelector('.intro, .library-heading'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}]);
      if (view.id === 'write-view') animate('view',view.querySelector('.companion img'),[
        {transform:'translateY(0) rotate(0deg)'},
        {transform:'translateY(-3px) rotate(-.7deg)',offset:.5},
        {transform:'translateY(0) rotate(0deg)'}
      ],{duration:4200,iterations:2,easing:'ease-in-out'});
      if (view.id === 'done-view') {
        animate('view',view.querySelector('.companion img'),[{transform:'translateY(-5px) scale(1.015)'},{transform:'translateY(0) scale(1)'}],{duration:650});
        animate('view',view.querySelector('.speech'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{delay:160,duration:400});
      }
    },
    ripple(pool) {
      cancel('ink');
      pool.querySelectorAll('.ink-ripple').forEach((ring,index) => animate('ink',ring,[
        {opacity:0,transform:'scale(.25)'}, {opacity:.6,transform:'scale(.4)',offset:.16}, {opacity:0,transform:'scale(1.3)'}
      ],{duration:720,delay:index*120,easing:'ease-out'}));
    },
    reaction(haechi, speech) {
      cancel('reaction');
      animate('reaction',haechi,[{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:380});
      animate('reaction',speech,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:320});
    },
    dialog(dialog, isNew = false) {
      cancel('dialog');
      animate('dialog',dialog,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:260});
      if (isNew) {
        animate('dialog',dialog.querySelector('.quote-sheet'),[{opacity:0,transform:'translateY(18px) rotate(-1.4deg)'},{opacity:1,transform:'translateY(0) rotate(0deg)'}],{duration:560,delay:90});
        animate('dialog',dialog.querySelector('.seal'),[{opacity:0,transform:'rotate(-4deg) scale(1.28)'},{opacity:1,transform:'rotate(-4deg) scale(1)'}],{duration:240,delay:430});
      }
    }
  };
}
