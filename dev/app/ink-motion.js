// Presentation only. Counting receives the same unsmoothed contact point that the ink follows.
export function createInkMotion(stone, surface, stick, motion) {
  const tau = Math.PI * 2, period = 900, stiffness = 40;
  const rest = { x:.95, y:.93, tilt:-10 };
  const position = { ...rest }, target = { ...rest }, velocity = { x:0, y:0, tilt:0 };
  let geometry, frame = 0, lastTime = 0, dragging = false, orbit = null;

  function measure() {
    const bounds = stone.getBoundingClientRect(), area = surface.getBoundingClientRect();
    const width = stone.clientWidth, height = stone.clientHeight;
    if (!width || !height) return false;
    geometry = {
      width, height, left:area.left, top:area.top, areaWidth:area.width, areaHeight:area.height,
      cx:(area.left + area.width/2 - bounds.left - stone.clientLeft)/width,
      cy:(area.top + area.height/2 - bounds.top - stone.clientTop)/height,
      rx:area.width/2/width, ry:area.height/2/height
    };
    return true;
  }
  function render() {
    stick.style.transform = `translate3d(${(position.x-rest.x)*geometry.width}px, ${(position.y-rest.y)*geometry.height}px, 0) translate(-50%, -90%) rotate(${position.tilt}deg)`;
  }
  function aim(x, y) {
    target.x = geometry.cx + x*geometry.rx;
    target.y = geometry.cy + y*geometry.ry;
    target.tilt = -10 + x*4;
  }
  function schedule() {
    if (frame) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    // Keep a delayed frame from jumping ahead after a busy main thread.
    const dt = Math.min(Math.max((time-lastTime)/1000, 0), .032);
    lastTime = time;
    if (orbit) {
      orbit.angle = Math.min(orbit.end, orbit.angle + dt*1000/period*tau);
      aim(Math.cos(orbit.angle)*.84, Math.sin(orbit.angle)*.84);
      if (orbit.angle >= orbit.end) orbit = null;
    }
    let settled = true;
    for (const axis of ['x','y','tilt']) {
      // Exact critically damped spring: continuous position and velocity at any refresh rate.
      const offset = position[axis]-target[axis], decay = Math.exp(-stiffness*dt);
      const step = (velocity[axis]+stiffness*offset)*dt;
      position[axis] = target[axis] + (offset+step)*decay;
      velocity[axis] = (velocity[axis]-stiffness*step)*decay;
      const tolerance = axis === 'tilt' ? .02 : .0004;
      if (Math.abs(position[axis]-target[axis]) > tolerance || Math.abs(velocity[axis]) > tolerance*stiffness) settled = false;
    }
    if (settled && !orbit) {
      Object.assign(position, target); velocity.x = velocity.y = velocity.tilt = 0;
      if (!dragging) stone.classList.remove('is-grinding');
    } else frame = requestAnimationFrame(tick);
    render();
  }
  function stop() {
    cancelAnimationFrame(frame); frame = 0; orbit = null; dragging = false;
    Object.assign(target, position); velocity.x = velocity.y = velocity.tilt = 0;
    stone.classList.remove('is-grinding');
  }
  return {
    start() {
      measure(); orbit = null; dragging = true;
      stone.classList.add('is-grinding');
    },
    follow(clientX, clientY) {
      const x = (clientX-geometry.left-geometry.areaWidth/2)/(geometry.areaWidth/2);
      const y = (clientY-geometry.top-geometry.areaHeight/2)/(geometry.areaHeight/2);
      // Keep the drawn ink and its counted contact point on the same surface.
      const scale = Math.max(1, Math.hypot(x,y)/.92);
      const contact = { x:x/scale, y:y/scale };
      aim(contact.x, contact.y);
      if (motion.matches) { Object.assign(position, target); render(); }
      else schedule();
      return contact;
    },
    end() {
      dragging = false;
      if (!frame) stone.classList.remove('is-grinding');
    },
    turn() {
      if (motion.matches) return;
      if (!orbit) {
        if (!measure()) return;
        const angle = Math.atan2((position.y-geometry.cy)/geometry.ry, (position.x-geometry.cx)/geometry.rx);
        orbit = { angle, end:angle+tau };
      } else orbit.end = orbit.angle+tau;
      dragging = false; stone.classList.add('is-grinding'); schedule();
    },
    resize() { stop(); if (measure()) render(); },
    stop
  };
}
