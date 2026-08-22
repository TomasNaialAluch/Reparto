import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  FAB_TRIGGER_SIZE,
  FAB_PHYSICS_DEFAULTS,
  FAB_INITIAL_OFFSET,
  FAB_FLOOR_OFFSET,
} from '../constants';

const clampPosition = (pos, size = FAB_TRIGGER_SIZE) => {
  const maxX = Math.max(0, window.innerWidth - size);
  const maxY = Math.max(0, window.innerHeight - size - FAB_FLOOR_OFFSET);
  return {
    x: Math.min(maxX, Math.max(0, pos.x)),
    y: Math.min(maxY, Math.max(0, pos.y)),
  };
};

const initialPosition = () =>
  clampPosition({
    x: window.innerWidth - FAB_TRIGGER_SIZE - FAB_INITIAL_OFFSET.right,
    y: window.innerHeight - FAB_TRIGGER_SIZE - FAB_INITIAL_OFFSET.bottom,
  });

const easeInCubic = (t) => t * t * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Motor de física del FAB: rebotes, piques automáticos y transform en el DOM.
 * @param {{ physics?: object, pauseAutoKick?: boolean }} options
 */
export function useFabPhysics({ physics: physicsOverrides = {}, pauseAutoKick = false } = {}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const physics = useMemo(() => ({ ...FAB_PHYSICS_DEFAULTS, ...physicsOverrides }), []);

  const ballRef = useRef(null);
  const positionRef = useRef(initialPosition());
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const isBouncingRef = useRef(false);
  const isPausedRef = useRef(false);
  const spinRef = useRef(0);
  const animateRafRef = useRef(null);
  const [kickFlash, setKickFlash] = useState(false);

  const applyTransform = useCallback((opacity = 1) => {
    const el = ballRef.current;
    if (!el) return;
    const { x, y } = positionRef.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${spinRef.current}deg)`;
    el.style.opacity = String(opacity);
  }, []);

  const kick = useCallback((power = 1, upwardBias = false) => {
    if (isPausedRef.current) return;

    const angle = Math.random() * Math.PI * 2;
    const speed = (6 + Math.random() * 14) * power;
    velocityRef.current = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + (upwardBias ? -6 - Math.random() * 8 : 0),
    };
    spinRef.current += (Math.random() - 0.5) * 120;
    isBouncingRef.current = true;
    setKickFlash(true);
    setTimeout(() => setKickFlash(false), 180);
  }, []);

  const kickOnClick = useCallback(() => {
    kick(physics.clickKickPower, true);
  }, [kick, physics.clickKickPower]);

  const shootBallTo = useCallback(
    (target, onComplete) => {
      if (animateRafRef.current) return;

      isPausedRef.current = true;
      isBouncingRef.current = false;
      velocityRef.current = { vx: 0, vy: 0 };

      const start = { ...positionRef.current };
      const startTime = performance.now();
      const duration = 650;

      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const e = easeInCubic(t);

        positionRef.current = {
          x: start.x + (target.x - start.x) * e,
          y: start.y + (target.y - start.y) * e,
        };
        spinRef.current += 12 * (1 - t);
        applyTransform(1 - t * 0.95);

        if (t < 1) {
          animateRafRef.current = requestAnimationFrame(step);
        } else {
          animateRafRef.current = null;
          applyTransform(0);
          onComplete?.();
        }
      };

      animateRafRef.current = requestAnimationFrame(step);
    },
    [applyTransform]
  );

  /** Suelta la pelota desde el arco hacia la posición de reposo. */
  const releaseBallFrom = useCallback(
    (from, to, onComplete) => {
      if (animateRafRef.current) return;

      isPausedRef.current = true;
      isBouncingRef.current = false;
      velocityRef.current = { vx: 0, vy: 0 };
      positionRef.current = { ...from };

      const startTime = performance.now();
      const duration = 550;

      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const e = easeOutCubic(t);

        positionRef.current = {
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
        };
        spinRef.current *= 0.92;
        applyTransform(e);

        if (t < 1) {
          animateRafRef.current = requestAnimationFrame(step);
        } else {
          animateRafRef.current = null;
          isPausedRef.current = false;
          kick(physics.autoKickPower * 0.6, true);
          onComplete?.();
        }
      };

      applyTransform(0);
      animateRafRef.current = requestAnimationFrame(step);
    },
    [applyTransform, kick, physics.autoKickPower]
  );

  const getRestPosition = useCallback(
    () =>
      clampPosition({
        x: window.innerWidth - FAB_TRIGGER_SIZE - FAB_INITIAL_OFFSET.right,
        y: window.innerHeight - FAB_TRIGGER_SIZE - FAB_INITIAL_OFFSET.bottom,
      }),
    []
  );

  useEffect(() => {
    applyTransform();

    let rafId;
    const tick = () => {
      if (isBouncingRef.current && !isPausedRef.current) {
        const pos = positionRef.current;
        const vel = velocityRef.current;
        pos.x += vel.vx;
        pos.y += vel.vy;
        vel.vx *= physics.friction;
        vel.vy *= physics.friction;
        spinRef.current += vel.vx * 0.4;

        const maxX = window.innerWidth - FAB_TRIGGER_SIZE;
        const maxY = window.innerHeight - FAB_TRIGGER_SIZE - FAB_FLOOR_OFFSET;

        if (pos.x <= 0) {
          pos.x = 0;
          vel.vx = Math.abs(vel.vx) * physics.bounceDamp;
        } else if (pos.x >= maxX) {
          pos.x = maxX;
          vel.vx = -Math.abs(vel.vx) * physics.bounceDamp;
        }
        if (pos.y <= 0) {
          pos.y = 0;
          vel.vy = Math.abs(vel.vy) * physics.bounceDamp;
        } else if (pos.y >= maxY) {
          pos.y = maxY;
          vel.vy = -Math.abs(vel.vy) * physics.bounceDamp;
        }

        if (
          Math.abs(vel.vx) < physics.stopThreshold &&
          Math.abs(vel.vy) < physics.stopThreshold &&
          pos.y >= maxY - 2
        ) {
          vel.vx = 0;
          vel.vy = 0;
          isBouncingRef.current = false;
        }

        applyTransform();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      if (!isPausedRef.current) {
        positionRef.current = clampPosition(positionRef.current);
        applyTransform();
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [applyTransform, physics]);

  useEffect(() => {
    if (pauseAutoKick) return undefined;

    const scheduleAutoKick = () => {
      const delay =
        physics.autoKickMinMs +
        Math.random() * (physics.autoKickMaxMs - physics.autoKickMinMs);
      return setTimeout(() => {
        if (!isPausedRef.current) {
          kick(physics.autoKickPower, true);
        }
        timerId = scheduleAutoKick();
      }, delay);
    };

    let timerId = scheduleAutoKick();
    return () => clearTimeout(timerId);
  }, [kick, pauseAutoKick, physics]);

  return { ballRef, kickFlash, kickOnClick, shootBallTo, releaseBallFrom, getRestPosition };
}
