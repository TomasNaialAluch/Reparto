// Piezas chicas del Catálogo: selector segmentado, interruptor, campo con etiqueta y vista previa de WhatsApp.
import { COLORES } from '../colores';
import { Eyebrow } from '../ui';
import { CAJA_GRIS, ETIQUETA_CAMPO } from './estilosCatalogo';

/** Control segmentado (patrón NEWLOOK): fondo gris, opción activa en blanco. */
export const Segmentado = ({ opciones, valor, onCambiar }) => (
  <div role="tablist" style={{ display: 'inline-flex', gap: 2, background: '#e9ecef', borderRadius: 10, padding: 3, flexWrap: 'wrap' }}>
    {opciones.map((o) => {
      const on = o.clave === valor;
      return (
        <button
          key={o.clave}
          type="button"
          role="tab"
          aria-selected={on}
          onClick={() => onCambiar(o.clave)}
          style={{
            border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer',
            fontWeight: on ? 600 : 400, background: on ? '#fff' : 'transparent', color: on ? '#212529' : COLORES.muted,
            boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s',
          }}
        >
          {o.titulo}
        </button>
      );
    })}
  </div>
);

/** Interruptor accesible: se anuncia como "switch" y se maneja con el teclado. */
export const Interruptor = ({ activo, onCambiar, etiqueta, deshabilitado }) => (
  <button
    type="button"
    role="switch"
    aria-checked={activo}
    aria-label={etiqueta}
    disabled={deshabilitado}
    onClick={() => onCambiar(!activo)}
    style={{
      width: 36, height: 20, borderRadius: 999, border: 'none', padding: 2, flexShrink: 0,
      background: activo ? COLORES.acero : '#ced4da', cursor: deshabilitado ? 'not-allowed' : 'pointer',
      opacity: deshabilitado ? 0.5 : 1, transition: 'background 0.15s', display: 'inline-flex',
      justifyContent: activo ? 'flex-end' : 'flex-start',
    }}
  >
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', display: 'block' }} />
  </button>
);

export const Campo = ({ etiqueta, children, style }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
    <span style={ETIQUETA_CAMPO}>{etiqueta}</span>
    {children}
  </label>
);

/** Cómo le llega el texto al cliente. Es una burbuja simple, sin imitar la app de WhatsApp. */
export const VistaPrevia = ({ texto, titulo = 'Así lo recibe el cliente' }) => (
  <div style={CAJA_GRIS}>
    <Eyebrow style={{ marginBottom: 8 }}>{titulo}</Eyebrow>
    <div
      style={{
        background: '#fff', border: `1px solid ${COLORES.borde}`, borderRadius: '10px 10px 10px 2px',
        padding: '8px 10px', fontSize: '0.82rem', color: COLORES.texto, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}
    >
      {texto}
    </div>
  </div>
);

/** Aviso corto dentro del panel (error o nota). */
export const Nota = ({ children, tipo = 'info' }) => {
  const colores = {
    info: { borde: COLORES.borde, fondo: COLORES.gris, color: COLORES.muted },
    error: { borde: 'rgba(220,53,69,0.4)', fondo: 'rgba(220,53,69,0.06)', color: '#8b1c26' },
  }[tipo];
  return (
    <div style={{ border: `1px solid ${colores.borde}`, background: colores.fondo, color: colores.color, borderRadius: 10, padding: '8px 12px', fontSize: '0.78rem' }}>
      {children}
    </div>
  );
};
