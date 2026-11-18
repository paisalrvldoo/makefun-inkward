// Pointer events keep touch coordinates in the same canvas space as the brush.
export function createTouch(input, point) {
  const fingers = new Map();
  let gesture = null;
  return {
    down(event) {
      input.touch = true;
      const p = point(event);
      fingers.set(event.pointerId, { start: p, point: p });
      if (fingers.size === 1 && !gesture) return true;
      if (fingers.size === 2 && !gesture) {
        const points = [...fingers.values()].map(f => f.point);
        gesture = { time: event.timeStamp, valid: true, point: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 } };
        input.paintEvents.push({ type: 'end', point: { ...input.pointer } });
        input.painting = false; input.clicks.length = 0;
      } else if (gesture) gesture.valid = false;
      return false;
    },
    move(event) {
      const finger = fingers.get(event.pointerId);
      if (!finger) return false;
      finger.point = point(event);
      if (gesture && Math.hypot(finger.point.x - finger.start.x, finger.point.y - finger.start.y) > 24) gesture.valid = false;
      return !gesture && fingers.size === 1;
    },
    up(event) {
      const paint = !gesture && fingers.has(event.pointerId);
      this.move(event); fingers.delete(event.pointerId);
      if (!fingers.size && gesture) {
        if (event.type !== 'pointercancel' && gesture.valid && event.timeStamp - gesture.time <= 220) input.splashes.push(gesture.point);
        gesture = null;
      } else if (event.type === 'pointercancel' && gesture) gesture.valid = false;
      return paint;
    },
    clear() { fingers.clear(); gesture = null; },
  };
}
