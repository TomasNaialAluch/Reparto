import {
  IconTruck,
  IconUsers,
  IconBank,
  IconChart,
  IconSettings,
  IconClipboard,
  IconReceipt,
} from '../components/gestionSemanal/icons';

export const NAV_ITEMS = [
  {
    path: '/reparto',
    label: 'Mi Reparto',
    desc: 'Clientes del día y repartos guardados',
    Icon: IconTruck,
  },
  {
    path: '/saldo-clientes',
    label: 'Saldo Clientes',
    desc: 'Calculá y guardá saldos de clientes',
    Icon: IconUsers,
  },
  {
    path: '/transferencias',
    label: 'Transferencias',
    desc: 'Transferencias vs boletas vendidas',
    Icon: IconBank,
  },
  {
    path: '/gestion-semanal',
    key: 'gestion-semanal',
    label: 'Gestión Semanal',
    desc: 'Gestión semanal y cierre de caja',
    Icon: IconChart,
    submenu: [
      { path: '/balance', label: 'Balance' },
    ],
  },
  {
    path: '/facturacion',
    label: 'Facturación',
    desc: 'Generá y gestioná tus facturas',
    Icon: IconReceipt,
  },
  {
    key: 'herramientas',
    label: 'Herramientas',
    desc: 'Dólar, asistente, precios y más',
    Icon: IconSettings,
    submenu: [
      { path: '/dolar',           label: 'DolarHoy' },
      { path: '/asistente',       label: 'Asistente' },
      { path: '/contador',        label: 'Contador' },
      { path: '/lista-precios',   label: 'Lista de Precios' },
      { path: '/precios-clientes',label: 'Precios Clientes' },
    ],
  },
  {
    key: 'gestion',
    label: 'Gestión',
    desc: 'Deudas y libro de cheques',
    Icon: IconClipboard,
    submenu: [
      { path: '/gestion-deudas',  label: 'Deudas' },
      { path: '/libro-cheques',   label: 'Libro de Cheques' },
    ],
  },
];
