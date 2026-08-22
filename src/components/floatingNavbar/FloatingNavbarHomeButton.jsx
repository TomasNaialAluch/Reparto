import React from 'react';

const HomeIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 9.5 12 3l9 6.5" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </svg>
);

/**
 * Botón fijo a la izquierda de la barra en modo contextual (ver
 * README-NAVBAR-CONTEXTUAL.md). Alterna la barra al modo global (Mi Reparto,
 * Saldo Clientes, etc.) sin salir de la página en la que estás.
 */
const FloatingNavbarHomeButton = ({ onClick }) => (
  <button
    type="button"
    className="floating-navbar-item floating-navbar-home-button"
    aria-label="Ver todas las secciones"
    onClick={onClick}
  >
    <span className="floating-navbar-item-icon">
      <HomeIcon />
    </span>
  </button>
);

export default FloatingNavbarHomeButton;
