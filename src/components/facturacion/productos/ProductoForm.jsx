import { useState } from 'react';
import { PRODUCTO_VACIO } from '../constants';
import FormSection from '../clientes/FormSection';

const Field = ({ label, children, flex = 1 }) => (
  <div style={{ flex, minWidth: '160px' }}>
    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '5px' }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccd3d9',
  fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
};

export default function ProductoForm({ producto, onSave, onCancel }) {
  const esNuevo = !producto;
  const [formData, setFormData] = useState(() => ({ ...PRODUCTO_VACIO, ...producto }));

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleGuardar = () => {
    if (!formData.descripcion.trim()) {
      alert('Ingresá la descripción del producto');
      return;
    }
    onSave(formData);
  };

  return (
    <div>
      <FormSection label="Identificación">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Field label="Descripción" flex={2.5}>
            <input type="text" style={inputStyle} value={formData.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Nombre del producto o servicio" autoFocus={esNuevo} />
          </Field>
          {!esNuevo && (
            <Field label="Código" flex={0.6}>
              <input type="text" style={{ ...inputStyle, background: '#f8f9fa', color: '#6c757d' }} value={formData.codigo || ''} readOnly />
            </Field>
          )}
        </div>
      </FormSection>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleGuardar}
          style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
          {esNuevo ? 'Crear Producto' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
