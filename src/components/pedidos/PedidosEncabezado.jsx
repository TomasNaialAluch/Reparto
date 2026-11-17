// Encabezado de Pedidos, igual al de Hoy: línea chica en mayúsculas y título grande.
// Escritorio: estado de la conexión a la derecha. Celular: hamburguesa a la izquierda y alta de cliente a la derecha.
import { IconMenu, IconUserPlus } from '../gestionSemanal/icons';
import { COLORES } from './colores';
import { Eyebrow, IndicadorConexion } from './ui';

const titulo = (extra) => ({
  margin: '2px 0 0', fontWeight: 800, color: '#212529', lineHeight: 1.15, wordBreak: 'break-word', ...extra,
});

const BotonCircular = ({ children, onClick, etiqueta, primario }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={etiqueta}
    style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: primario ? 'none' : `1px solid ${COLORES.borde}`,
      background: primario ? COLORES.acero : '#fff',
      color: primario ? '#fff' : COLORES.aceroOscuro,
    }}
  >
    {children}
  </button>
);

const PedidosEncabezado = ({ titulo: texto, conectado, onMenu, onNuevo, onIrAConexion }) => (
  <>
    <div
      className="pedidos-solo-escritorio"
      style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}
    >
      <div style={{ minWidth: 0 }}>
        <Eyebrow>Pedidos por WhatsApp</Eyebrow>
        <h1 style={titulo({ fontSize: '1.6rem' })}>{texto}</h1>
      </div>
      <IndicadorConexion conectado={conectado} onClick={onIrAConexion} />
    </div>

    <div className="pedidos-solo-celular" style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <BotonCircular etiqueta="Abrir el menú de Pedidos" onClick={onMenu}><IconMenu size={18} /></BotonCircular>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Eyebrow>Pedidos por WhatsApp</Eyebrow>
        <h1 style={titulo({ fontSize: '1.3rem' })}>{texto}</h1>
      </div>
      <BotonCircular etiqueta="Nuevo cliente" onClick={onNuevo} primario><IconUserPlus size={18} /></BotonCircular>
    </div>
  </>
);

export default PedidosEncabezado;
