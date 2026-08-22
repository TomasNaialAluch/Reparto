import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useActiveRoute } from './useActiveRoute';

const MoreIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

/**
 * Botón "Más" + panel glass con las secciones que no tienen lugar propio en la
 * barra (Herramientas, Gestión, y el submenu de las que sí lo tienen, como
 * Gestión Semanal -> Balance).
 *
 * El backdrop y el panel se montan con un portal a document.body: el navbar
 * tiene `transform` (para centrarse), y un ancestro con transform vuelve
 * "position: fixed" de sus hijos relativo a ESE ancestro en vez del viewport
 * — sin el portal, el panel quedaría atrapado dentro de la cajita del navbar.
 */
const FloatingNavbarMore = ({ items }) => {
  const [open, setOpen] = useState(false);
  const { isItemActive } = useActiveRoute();
  const hasActive = items.some((item) => isItemActive(item));

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className={`floating-navbar-item floating-navbar-more-trigger${hasActive ? ' active' : ''}`}
        aria-expanded={open}
        aria-label="Más secciones"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="floating-navbar-item-icon"><MoreIcon /></span>
        <span className="floating-navbar-item-label">Más</span>
      </button>

      {open && createPortal(
        <>
          <div
            className="floating-navbar-more-backdrop"
            onClick={close}
            role="presentation"
          />
          <div className="floating-navbar-more-panel" role="menu" aria-label="Más secciones">
            {items.map((item) => (
              <div key={item.key || item.path} className="floating-navbar-more-group">
                <div className="floating-navbar-more-group-title">
                  <item.Icon size={16} />
                  {item.path ? (
                    <Link to={item.path} onClick={close}>{item.label}</Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
                <div className="floating-navbar-more-group-links">
                  {item.submenu.map((sub) => (
                    <Link key={sub.path} to={sub.path} onClick={close}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default FloatingNavbarMore;
