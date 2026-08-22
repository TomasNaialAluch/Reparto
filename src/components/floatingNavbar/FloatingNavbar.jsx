import React, { useEffect, useState } from 'react';
import { NAV_ITEMS } from '../../config/navItems';
import { NAV_CONTEXTUAL } from '../../config/navContextual';
import FloatingNavbarItem from './FloatingNavbarItem';
import FloatingNavbarHomeButton from './FloatingNavbarHomeButton';
import { useActiveRoute } from './useActiveRoute';
import './FloatingNavbar.css';

// Secciones de primer nivel (con path propio) van sueltas en la barra.
// El panel "Más" (Herramientas, Gestión, submenu de Gestión Semanal) está
// desactivado por ahora — FloatingNavbarMore queda en el código para cuando
// se retome (ver README-NAVBAR-GLASS-ROADMAP.md, Fase 3).
const TOP_LEVEL_ITEMS = NAV_ITEMS.filter((item) => !!item.path);

// Home ya muestra las secciones como tarjetas — la barra ahí es redundante.
const HIDDEN_ON = ['/'];

const FloatingNavbar = () => {
  const { pathname, isItemActive, isContextualItemActive } = useActiveRoute();
  const contextual = NAV_CONTEXTUAL[pathname];

  // Modo global "prestado" dentro de una página con contextual (ver
  // README-NAVBAR-CONTEXTUAL.md). Es un detalle de presentación de la barra,
  // no algo que tenga sentido guardar en la URL.
  const [showGlobal, setShowGlobal] = useState(false);

  // Al entrar a una página nueva siempre arranca en SU modo default
  // (contextual si lo tiene), no en el estado en que quedó la barra antes.
  useEffect(() => {
    setShowGlobal(false);
  }, [pathname]);

  if (HIDDEN_ON.includes(pathname)) {
    return null;
  }

  if (contextual && !showGlobal) {
    return (
      <nav className="floating-navbar" aria-label="Navegación de sección">
        <FloatingNavbarHomeButton onClick={() => setShowGlobal(true)} />
        {contextual.items.map((item) => (
          <FloatingNavbarItem
            key={item.key}
            item={{ ...item, path: `${pathname}?${contextual.paramKey}=${item.key}` }}
            active={isContextualItemActive(item, contextual.paramKey, contextual.defaultKey)}
          />
        ))}
      </nav>
    );
  }

  return (
    <nav className="floating-navbar" aria-label="Navegación principal">
      {TOP_LEVEL_ITEMS.map((item) => (
        <FloatingNavbarItem
          key={item.path}
          item={item}
          active={isItemActive(item)}
          onClick={() => setShowGlobal(false)}
        />
      ))}
    </nav>
  );
};

export default FloatingNavbar;
