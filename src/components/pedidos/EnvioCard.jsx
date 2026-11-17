// Una fila de "Hoy": hora, cliente, mensaje en una línea, estado con punto y, si corresponde, una acción.
// El acento izquierdo comunica el estado (regla del NEWLOOK). Misma fila en escritorio y celular.
import { estadoVisual } from '../../utils/pedidosEstados';
import { COLORES } from './colores';
import { PillEstado } from './ui';

const EnvioCard = ({ hora, cliente, detalle, estado, accion }) => (
  <div
    className="pedidos-fila"
    style={{
      display: 'flex', alignItems: 'center', gap: '6px 12px', background: '#fff', borderRadius: 12,
      border: `1px solid ${COLORES.borde}`, borderLeft: `3px solid ${estadoVisual(estado).acento}`,
      padding: '10px 12px',
    }}
  >
    <div style={{ fontWeight: 700, color: COLORES.aceroOscuro, minWidth: 44 }}>{hora}</div>
    <div style={{ flex: '1 1 150px', minWidth: 0 }}>
      <div style={{ fontWeight: 700, color: COLORES.texto, wordBreak: 'break-word' }}>{cliente}</div>
      <div style={{ fontSize: '0.78rem', color: COLORES.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {detalle}
      </div>
    </div>
    <PillEstado estado={estado} />
    {accion}
  </div>
);

export default EnvioCard;
