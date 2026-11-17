// Escritorio: bloque gris unificado con pestañas y panel blanco conectado (como Transferencias y Gestión Semanal).
// El indicador blanco desliza con layoutId y el contenido entra desde el lado hacia donde se avanza.
// En celular el CSS oculta la fila de pestañas y quita el marco: el contenido va directo (ver Pedidos.css).
import { AnimatePresence, motion } from 'framer-motion';
import { COLORES } from './colores';
import { Pill } from './ui';

const variantes = {
  initial: (dir) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -40, opacity: 0 }),
};

const PedidosTabs = ({ pestanas, activa, onCambiar, contadores = {}, direccion, children }) => (
  <div className="pedidos-bloque">
    <div className="pedidos-tabrow" role="tablist">
      {pestanas.map((pestana) => {
        const { clave, titulo } = pestana;
        const Icono = pestana.Icono;
        const on = activa === clave;
        return (
          <button
            key={clave}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onCambiar(clave)}
            style={{
              position: 'relative', flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
              padding: '9px 6px', fontSize: '0.8rem', fontWeight: on ? 600 : 400, whiteSpace: 'nowrap',
              color: on ? '#212529' : COLORES.muted, borderRadius: '9px 9px 0 0', transition: 'color 0.2s',
            }}
          >
            {on && (
              <motion.div
                layoutId="pedidos-tab-indicator"
                style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: '9px 9px 0 0', zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icono size={14} />
              {titulo}
              {contadores[clave] > 0 && <Pill>{contadores[clave]}</Pill>}
            </span>
          </button>
        );
      })}
    </div>

    <div className="pedidos-panel" style={{ overflow: 'hidden' }}>
      <AnimatePresence mode="wait" custom={direccion} initial={false}>
        <motion.div
          key={activa}
          custom={direccion}
          variants={variantes}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
);

export default PedidosTabs;
