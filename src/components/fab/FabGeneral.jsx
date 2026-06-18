import React, { useEffect, useRef, useState } from 'react';
import FabTriggerButton from './FabTriggerButton';
import FabGoalButton from './FabGoalButton';
import FabModalShell from './FabModalShell';
import { useFabPhysics } from './hooks/useFabPhysics';
import { activeFabTheme } from './themes';
import { initMundialCache } from './themes/mundial/mundialCache';
import { FAB_TRIGGER_SIZE } from './constants';

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

  const handleTriggerClick = (e) => {
    if (isScoring || ballStored) return;
    e.preventDefault();
    e.stopPropagation();
    setIsPanelOpen(true);
    kickOnClick();
  };

  const handleGoalClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isScoring || !goalRef.current) return;

    const goal = goalCenter(goalRef.current);

    if (!ballStored) {
      setIsPanelOpen(false);
      setIsScoring(true);
      shootBallTo(goal, () => {
        setBallStored(true);
        setIsScoring(false);
      });
      return;
    }

    setIsScoring(true);
    releaseBallFrom(goal, getRestPosition(), () => {
      setBallStored(false);
      setIsScoring(false);
    });
  };

  const closePanel = () => setIsPanelOpen(false);

  useEffect(() => {
    initMundialCache();
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
