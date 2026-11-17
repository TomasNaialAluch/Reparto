// Celular: menú lateral que entra por la izquierda con overlay y blur (patrón de modales del NEWLOOK).
// Lista las secciones con su contador, el estado de la conexión y el alta de cliente.
// En escritorio el wrapper se oculta por CSS y las secciones se eligen con las pestañas.
import { useEffect } from 'react';
import { IconUserPlus, IconX } from '../gestionSemanal/icons';
import { COLORES } from './colores';
import { Eyebrow, IndicadorConexion, Pill, BotonPrimario } from './ui';

const PedidosMenuLateral = ({ abierto, onCerrar, pestanas, activa, onElegir, contadores = {}, conectado, onNuevo, onIrAConexion }) => {
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  return (
    <div className="pedidos-solo-celular">
      <div className={`pedidos-drawer-overlay${abierto ? ' pedidos-drawer-overlay--abierto' : ''}`} onClick={onCerrar} />
      <aside
        className={`pedidos-drawer${abierto ? ' pedidos-drawer--abierto' : ''}`}
        aria-label="Secciones de Pedidos"
        inert={!abierto}
      >
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow style={{ marginBottom: 2 }}>Pedidos</Eyebrow>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>WhatsApp</div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el menú"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORES.muted }}
          >
            <IconX size={14} />
          </button>
        </div>

        <nav style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflowY: 'auto' }}>
          {pestanas.map((pestana) => {
            const { clave, titulo } = pestana;
            const Icono = pestana.Icono;
            const on = activa === clave;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => onElegir(clave)}
                aria-current={on ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 10, border: 'none',
                  textAlign: 'left', cursor: 'pointer', fontSize: '0.92rem', minHeight: 44,
                  background: on ? 'var(--color-primary-soft)' : 'transparent',
                  color: on ? COLORES.aceroOscuro : '#495057', fontWeight: on ? 700 : 500,
                }}
              >
                <Icono size={18} />
                <span style={{ flex: 1 }}>{titulo}</span>
                {contadores[clave] > 0 && <Pill>{contadores[clave]}</Pill>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <IndicadorConexion conectado={conectado} onClick={onIrAConexion} />
          <BotonPrimario onClick={onNuevo} style={{ width: '100%', padding: '11px' }}>
            <IconUserPlus size={16} /> Nuevo cliente
          </BotonPrimario>
        </div>
      </aside>
    </div>
  );
};

export default PedidosMenuLateral;
