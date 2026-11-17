// Estilos del Catálogo de Pedidos (precios, promociones y preguntas frecuentes), con los tokens del NEWLOOK.
import { COLORES } from '../colores';

export const INPUT = {
  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: '0.88rem', background: '#fff',
  border: '1px solid #ccd3d9', color: COLORES.texto,
};

export const ETIQUETA_CAMPO = { fontSize: '0.74rem', fontWeight: 600, color: COLORES.muted };

/** Card plana con acento izquierdo del color del estado. */
export const card = (acento = COLORES.borde) => ({
  background: '#fff', border: `1px solid ${COLORES.borde}`, borderLeft: `3px solid ${acento}`,
  borderRadius: 12, padding: '10px 14px',
});

export const CAJA_GRIS = {
  background: COLORES.gris, border: `1px solid ${COLORES.borde}`, borderRadius: 12, padding: '12px 14px',
};

/** Colores de cada estado de promoción (misma gama que la tabla única de estados). */
export const ESTADOS_PROMO = {
  vigente: { texto: 'Vigente', acento: '#28a745', fondo: 'rgba(40,167,69,0.1)', color: '#1a5c2a' },
  programada: { texto: 'Programada', acento: '#6A8899', fondo: 'rgba(106,136,153,0.12)', color: '#3a5060' },
  vencida: { texto: 'Vencida', acento: '#d3d9de', fondo: 'rgba(108,117,125,0.1)', color: '#6c757d' },
  apagada: { texto: 'Apagada', acento: '#d3d9de', fondo: 'rgba(108,117,125,0.1)', color: '#6c757d' },
};
