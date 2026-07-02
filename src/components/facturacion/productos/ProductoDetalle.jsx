import { useState } from 'react';
import { IconEdit, IconChart } from '../../gestionSemanal/icons';
import FormSection from '../clientes/FormSection';
import VentasProductoModal from './VentasProductoModal';

const ReadField = ({ label, value, flex = 1 }) => (
  <div style={{ flex, minWidth: '160px' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '4px' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.86rem', color: value ? '#212529' : '#adb5bd' }}>
      {value || '<no informado>'}
    </div>
  </div>
);

export default function ProductoDetalle({ producto, onEdit }) {
  const [showVentas, setShowVentas] = useState(false);

  if (!producto) return null;

  return (
    <div>
      {/* Header con nombre + acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Código {producto.codigo}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#212529' }}>
            {producto.descripcion}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setShowVentas(true)}
            className="d-inline-flex align-items-center gap-2"
            style={{
              border: '1px solid #ccd3d9', borderRadius: '8px', padding: '8px 16px',
              background: 'transparent', color: '#3a5060', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,136,153,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <IconChart size={13} /> Ventas
          </button>
          <button onClick={onEdit}
            className="d-inline-flex align-items-center gap-2"
            style={{
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              background: '#6A8899', color: 'white', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#506878'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#6A8899'; }}
          >
            <IconEdit size={13} /> Editar
          </button>
        </div>
      </div>

      <FormSection label="Identificación">
        <ReadField label="Descripción" value={producto.descripcion} />
      </FormSection>

      {showVentas && (
        <VentasProductoModal producto={producto} onClose={() => setShowVentas(false)} />
      )}
    </div>
  );
}
