// Piezas de interfaz compartidas de Pedidos, con la estética NEWLOOK (ver README-NEWLOOK.md):
// flat, bordes #d3d9de, acento izquierdo para estado, pills semitransparentes, texto muted #6c757d.
import { estadoVisual } from '../../utils/pedidosEstados';
import { COLORES } from './colores';

/** Label chico en mayúsculas (patrón "eyebrow" del NEWLOOK). */
export const Eyebrow = ({ children, style }) => (
  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: COLORES.muted, textTransform: 'uppercase', letterSpacing: '0.06em', ...style }}>
    {children}
  </div>
);

export const Punto = ({ color, halo }) => (
  <span
    aria-hidden
    style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block', background: color,
      boxShadow: halo ? `0 0 0 3px ${halo}` : 'none',
    }}
  />
);

/** Pill de estado con punto: el color sale siempre de la tabla única de estados. */
export const PillEstado = ({ estado, children }) => {
  const e = estadoVisual(estado);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
        fontSize: '0.72rem', fontWeight: 600, background: e.fondo, color: e.color, whiteSpace: 'nowrap',
      }}
    >
      <Punto color={e.acento} />
      {children || e.texto}
    </span>
  );
};

/** Pill suave para contadores y datos (ámbar = pendiente de atención). */
export const Pill = ({ children, fondo = 'rgba(255,209,102,0.35)', color = '#7a5000', style }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, background: fondo, color, ...style,
    }}
  >
    {children}
  </span>
);

/** Botón de acción dentro de una card: sin relleno, solo borde (regla del NEWLOOK). */
export const BotonGhost = ({ children, onClick, color = COLORES.aceroOscuro, borde = '#ccd3d9', style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: `1px solid ${borde}`, borderRadius: 8, padding: '5px 12px', background: 'transparent', color,
      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', ...style,
    }}
  >
    {children}
  </button>
);

/** Botón principal: fondo acero; deshabilitado se pinta a mano (no con el estilo del navegador). */
export const BotonPrimario = ({ children, onClick, disabled, style }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    style={{
      border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: '0.85rem',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: disabled ? '#e9ecef' : COLORES.acero, color: disabled ? '#9ca3af' : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.15s', ...style,
    }}
  >
    {children}
  </button>
);

/** Estado de conexión: punto con halo + título y detalle, con borde izquierdo del mismo color. */
export const IndicadorConexion = ({ conectado, detalle, onClick }) => {
  const acento = conectado ? '#28a745' : '#adb5bd';
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 12,
        border: `1px solid ${COLORES.borde}`, borderLeft: `3px solid ${acento}`, padding: '7px 14px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Punto color={acento} halo={conectado ? 'rgba(40,167,69,0.15)' : null} />
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: COLORES.texto }}>
          {conectado ? 'WhatsApp conectado' : 'WhatsApp sin conectar'}
        </div>
        <div style={{ fontSize: '0.68rem', color: COLORES.muted }}>
          {detalle || (conectado ? 'Enviando y recibiendo' : 'Ver qué falta')}
        </div>
      </div>
    </div>
  );
};

/** Estado vacío: ícono, una frase y, si hace falta, la salida (sin ilustraciones). */
export const VacioEstado = ({ icono, titulo, detalle, accion }) => (
  <div style={{ textAlign: 'center', padding: '28px 12px', color: COLORES.muted }}>
    {icono && <div style={{ marginBottom: 8, opacity: 0.7 }}>{icono}</div>}
    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: COLORES.aceroOscuro }}>{titulo}</div>
    {detalle && <div style={{ fontSize: '0.78rem', marginTop: 2 }}>{detalle}</div>}
    {accion && <div style={{ marginTop: 12 }}>{accion}</div>}
  </div>
);
