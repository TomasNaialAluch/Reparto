import { useState } from 'react';
import { IconEdit, IconHistory } from '../../gestionSemanal/icons';
import FormSection from './FormSection';
import HistorialVentasModal from './HistorialVentasModal';

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

export default function ClienteDetalle({ cliente, onEdit }) {
  const [showHistorial, setShowHistorial] = useState(false);

  if (!cliente) return null;

  return (
    <div>
      {/* Header con nombre + acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Código {cliente.codigo}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#212529' }}>
            {cliente.razonSocial}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setShowHistorial(true)}
            className="d-inline-flex align-items-center gap-2"
            style={{
              border: '1px solid #ccd3d9', borderRadius: '8px', padding: '8px 16px',
              background: 'transparent', color: '#3a5060', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,136,153,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <IconHistory size={13} /> Historial de Ventas
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
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <ReadField label="Tipo Doc." value={cliente.tipoDoc} flex={0.6} />
          <ReadField label="N° Documento" value={cliente.nroDoc} flex={0.9} />
          <ReadField label="Condición IVA" value={cliente.condicionIVA} flex={1.2} />
        </div>
      </FormSection>

      <FormSection label="Domicilio y contacto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ReadField label="Domicilio" value={cliente.domicilio} />
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <ReadField label="Localidad" value={cliente.localidad} />
            <ReadField label="Provincia" value={cliente.provincia} />
            <ReadField label="País" value={cliente.pais} flex={0.7} />
            <ReadField label="Cód. Postal" value={cliente.codigoPostal} flex={0.5} />
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <ReadField label="Teléfono / WhatsApp" value={cliente.telefono} />
            <ReadField label="Responsable / contacto" value={cliente.contacto} />
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <ReadField label="E-mail" value={cliente.email} />
            <ReadField label="Página Web" value={cliente.web} />
          </div>
          {cliente.observaciones && <ReadField label="Observaciones" value={cliente.observaciones} />}
        </div>
      </FormSection>

      {showHistorial && (
        <HistorialVentasModal cliente={cliente} onClose={() => setShowHistorial(false)} />
      )}
    </div>
  );
}
