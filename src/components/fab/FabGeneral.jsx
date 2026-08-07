import React, { useEffect, useRef, useState } from 'react';
import FabTriggerButton from './FabTriggerButton';
import FabGoalButton from './FabGoalButton';
import FabModalShell from './FabModalShell';
import { useFabPhysics } from './hooks/useFabPhysics';
import { activeFabTheme } from './themes';
import {
  FAB_TRIGGER_SIZE,
  FAB_IDLE_STORE_MS,
  FAB_PEEK_INTERVAL_MS,
  FAB_PEEK_DURATION_MS,
} from './constants';

const goalCenter = (goalEl) => {
  const rect = goalEl.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - FAB_TRIGGER_SIZE / 2,
    y: rect.top + rect.height / 2 - FAB_TRIGGER_SIZE / 2,
  };
};

/**
 * FAB General — botón flotante global con física de rebote y panel temático.
 */
const FabGeneral = ({ theme = activeFabTheme }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [ballStored, setBallStored] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const goalRef = useRef(null);

  const { ballRef, kickFlash, kickOnClick, shootBallTo, releaseBallFrom, getRestPosition } =
    useFabPhysics({
      physics: theme.physics,
      pauseAutoKick: isPanelOpen || isScoring || ballStored,
    });

  const { Icon, iconSrc, iconSize, accentColor, iconColor, triggerBackground } = theme.trigger;
  const Panel = theme.Panel;

  // Refs espejo del estado — los timers de auto-guardado/asomo viven minutos,
  // así que no pueden confiar en los `ballStored`/`isScoring` capturados por
  // closure en el momento en que se agendó el setTimeout (quedarían viejos).
  const ballStoredRef = useRef(ballStored);
  const isScoringRef = useRef(isScoring);
  const isPeekingRef = useRef(false);
  const idleTimerRef = useRef(null);
  const peekTimerRef = useRef(null);
  const peekBackTimerRef = useRef(null);

  useEffect(() => { ballStoredRef.current = ballStored; }, [ballStored]);
  useEffect(() => { isScoringRef.current = isScoring; }, [isScoring]);

  const clearAutoTimers = () => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(peekTimerRef.current);
    clearTimeout(peekBackTimerRef.current);
    idleTimerRef.current = null;
    peekTimerRef.current = null;
    peekBackTimerRef.current = null;
  };

  const scheduleIdleStore = () => {
    idleTimerRef.current = setTimeout(doAutoStore, FAB_IDLE_STORE_MS);
  };

  const schedulePeekCycle = () => {
    peekTimerRef.current = setTimeout(doAutoPeek, FAB_PEEK_INTERVAL_MS);
  };

  /** Guarda la pelota sola en el arco — mismo mecanismo que el click manual. */
  function doAutoStore() {
    if (isScoringRef.current || ballStoredRef.current || !goalRef.current) return;

    const goal = goalCenter(goalRef.current);
    setIsPanelOpen(false);
    setIsScoring(true);
    shootBallTo(goal, () => {
      ballStoredRef.current = true;
      setBallStored(true);
      setIsScoring(false);
      isPeekingRef.current = false;
      schedulePeekCycle();
    });
  }

  /** Asoma la pelota un rato para recordar que existe, y se re-guarda sola. */
  function doAutoPeek() {
    if (isScoringRef.current || !ballStoredRef.current || !goalRef.current) return;

    const goal = goalCenter(goalRef.current);
    isPeekingRef.current = true;
    setIsScoring(true);
    releaseBallFrom(goal, getRestPosition(), () => {
      ballStoredRef.current = false;
      setBallStored(false);
      setIsScoring(false);
      peekBackTimerRef.current = setTimeout(() => {
        if (isPeekingRef.current) doAutoStore();
      }, FAB_PEEK_DURATION_MS);
    });
  }

  /** Cualquier toque del usuario (pelota o arco) reinicia el reloj de inactividad. */
  const registerTouch = () => {
    clearAutoTimers();
    isPeekingRef.current = false;
  };

  const handleTriggerClick = (e) => {
    if (isScoring || ballStored) return;
    e.preventDefault();
    e.stopPropagation();
    registerTouch();
    setIsPanelOpen(true);
    kickOnClick();
    scheduleIdleStore();
  };

  const handleGoalClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isScoring || !goalRef.current) return;
    registerTouch();

    const goal = goalCenter(goalRef.current);

    if (!ballStored) {
      setIsPanelOpen(false);
      setIsScoring(true);
      shootBallTo(goal, () => {
        ballStoredRef.current = true;
        setBallStored(true);
        setIsScoring(false);
        schedulePeekCycle();
      });
      return;
    }

    setIsScoring(true);
    releaseBallFrom(goal, getRestPosition(), () => {
      ballStoredRef.current = false;
      setBallStored(false);
      setIsScoring(false);
      scheduleIdleStore();
    });
  };

  const closePanel = () => setIsPanelOpen(false);

  useEffect(() => {
    theme.initCache?.();
  }, [theme]);

  // Arranca el reloj de inactividad al montar; se reinicia con cada toque.
  useEffect(() => {
    scheduleIdleStore();
    return clearAutoTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <FabTriggerButton
        ballRef={ballRef}
        ariaLabel={theme.ariaLabel}
        kickFlash={kickFlash}
        stored={ballStored}
        accentColor={accentColor}
        triggerBackground={triggerBackground ?? (iconSrc ? accentColor : 'white')}
        iconColor={iconColor}
        onClick={handleTriggerClick}
      >
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            width={iconSize}
            height={iconSize}
            draggable={false}
            style={{ objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
          />
        ) : (
          Icon && <Icon size={iconSize} />
        )}
      </FabTriggerButton>

      <FabGoalButton
        ref={goalRef}
        accentColor={accentColor}
        ballStored={ballStored}
        onClick={handleGoalClick}
        disabled={isScoring}
      />

      {isPanelOpen && !ballStored && (
        <FabModalShell
          eyebrow={theme.modal.eyebrow}
          title={theme.modal.title}
          titleId={theme.modal.titleId}
          accentColor={accentColor}
          onClose={closePanel}
          footer={
            theme.footer ? (
              <button
                type="button"
                onClick={closePanel}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: theme.footer.background ?? accentColor,
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {theme.footer.label}
              </button>
            ) : null
          }
        >
          <Panel accentColor={accentColor} onClose={closePanel} />
        </FabModalShell>
      )}
    </>
  );
};

export default FabGeneral;
