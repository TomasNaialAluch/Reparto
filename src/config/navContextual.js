import {
  IconBox,
  IconLayers,
  IconUsers,
  IconWallet,
  IconCheque,
  IconCreditCard,
} from '../components/gestionSemanal/icons';

/**
 * Set contextual de la FloatingNavbar por ruta. Si una ruta no tiene entrada
 * acá, la barra se queda en modo global (NAV_ITEMS de navItems.js) — esto es
 * el caso normal, no una excepción a manejar.
 *
 * `paramKey` es el query param que la página y la barra comparten como fuente
 * de verdad del tab activo (ver README-NAVBAR-CONTEXTUAL.md, "Sincronización").
 *
 * Los íconos son los mismos que ya usa GestionSemanal.jsx en su selector de
 * tabs interno (gestionSemanal/icons.jsx) — no se duplica el lenguaje visual.
 */
export const NAV_CONTEXTUAL = {
  '/gestion-semanal': {
    paramKey: 'tab',
    defaultKey: 'mercaderia',
    items: [
      { key: 'mercaderia', label: 'Mercadería', Icon: IconBox },
      { key: 'embutidos', label: 'Embutidos', Icon: IconLayers },
      { key: 'empleados', label: 'Empleados', Icon: IconUsers },
      { key: 'gastos', label: 'Gastos', Icon: IconWallet },
      { key: 'clientes', label: 'Clientes', Icon: IconCheque },
      { key: 'pagos-proveedores', label: 'Pagos Prov.', Icon: IconCreditCard },
    ],
  },
};
