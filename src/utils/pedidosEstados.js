// Tabla única de estados de Pedidos: acento de la card, punto, y colores del pill.
// Todas las pantallas leen de acá para que un estado se vea igual en todos lados.
// Colores según README-NEWLOOK.md (pills con 8–12 % de opacidad; acento izquierdo para el estado).

export const ESTADOS = {
  programado: { texto: 'Programado', acento: '#adb5bd', fondo: 'rgba(108,117,125,0.1)', color: '#495057' },
  enviado: { texto: 'Enviado', acento: '#6A8899', fondo: 'rgba(106,136,153,0.12)', color: '#3a5060' },
  entregado: { texto: 'Entregado', acento: '#6A8899', fondo: 'rgba(106,136,153,0.12)', color: '#3a5060' },
  leido: { texto: 'Leído', acento: '#28a745', fondo: 'rgba(40,167,69,0.1)', color: '#1a5c2a' },
  contesto: { texto: 'Contestó', acento: '#28a745', fondo: 'rgba(40,167,69,0.1)', color: '#1a5c2a' },
  sinResponder: { texto: 'Sin responder', acento: '#FFD166', fondo: 'rgba(255,209,102,0.25)', color: '#7a5000' },
  sinNumero: { texto: 'Sin WhatsApp', acento: '#dc3545', fondo: 'rgba(220,53,69,0.1)', color: '#8b1c26' },
  fallido: { texto: 'Falló', acento: '#dc3545', fondo: 'rgba(220,53,69,0.1)', color: '#8b1c26' },
  salteado: { texto: 'Salteado', acento: '#d3d9de', fondo: 'rgba(108,117,125,0.1)', color: '#6c757d' },
};

export const estadoVisual = (clave) => ESTADOS[clave] || ESTADOS.programado;

/** Grupos del "Resumen del día": cada estado cuenta en uno solo. */
export const GRUPOS_RESUMEN = [
  { clave: 'enviados', texto: 'Enviados', acento: '#6A8899', estados: ['enviado', 'entregado'] },
  { clave: 'contestaron', texto: 'Contestaron', acento: '#28a745', estados: ['leido', 'contesto'] },
  { clave: 'porSalir', texto: 'Por salir', acento: '#adb5bd', estados: ['programado'] },
  { clave: 'fallaron', texto: 'Con problemas', acento: '#dc3545', estados: ['fallido', 'sinNumero', 'sinResponder'] },
];
