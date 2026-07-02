import { useState } from 'react';
import { formatCurrency } from '../../../../utils/money';
import { TIPOS_FACTURA } from '../../constants';
import { IconX } from '../../../gestionSemanal/icons';
import FormSection from '../FormSection';
import { calcularSubtotal, calcularTotalVenta } from './ventasDemo';

const Field = ({ label, children, flex = 1 }) => (
  <div style={{ flex, minWidth: '140px' }}>
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

const AddBtn = ({ onClick, label }) => (
  <button type="button" onClick={onClick}
    style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer' }}>
    + {label}
  </button>
);

const RemoveBtn = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="d-inline-flex align-items-center justify-content-center"
    style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
    <IconX size={14} />
  </button>
);

export default function VentaForm({ venta, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => ({ ...venta }));

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const updateItem = (index, field, value) => setFormData(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));

  const addItem = () => setFormData(prev => ({
    ...prev,
    items: [...prev.items, { producto: '', cantidad: '', precioUnit: '' }],
  }));

  const removeItem = (index) => setFormData(prev => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index),
  }));

  const totalActual = calcularTotalVenta(formData.items);

  const handleGuardar = () => {
    if (!formData.numero.trim()) { alert('Ingresá el número de comprobante'); return; }
    if (formData.items.length === 0) { alert('Agregá al menos un producto'); return; }
    const items = formData.items.map(item => ({ ...item, subtotal: calcularSubtotal(item) }));
    onSave({ ...formData, items, total: calcularTotalVenta(items) });
  };

  return (
    <div>
      <FormSection label="Comprobante">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Field label="N° Comprobante" flex={1.4}>
            <input type="text" style={inputStyle} value={formData.numero}
              onChange={(e) => update('numero', e.target.value)} placeholder="0001-00000000" />
          </Field>
          <Field label="Tipo" flex={1}>
            <select style={inputStyle} value={formData.tipo} onChange={(e) => update('tipo', e.target.value)}>
              {TIPOS_FACTURA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Fecha" flex={1}>
            <input type="date" style={inputStyle} value={formData.fecha}
              onChange={(e) => update('fecha', e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection label="Productos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          {formData.items.map((item, i) => (
            <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Producto" value={item.producto}
                onChange={(e) => updateItem(i, 'producto', e.target.value)}
                style={{ flex: 2, minWidth: '120px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <input type="text" placeholder="Cantidad (ej: 5 kg)" value={item.cantidad}
                onChange={(e) => updateItem(i, 'cantidad', e.target.value)}
                style={{ flex: 1, minWidth: '110px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <input type="number" placeholder="Precio unit." value={item.precioUnit}
                onChange={(e) => updateItem(i, 'precioUnit', e.target.value)}
                style={{ flex: 1, minWidth: '100px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <span style={{ flex: 1, minWidth: '90px', fontSize: '0.82rem', fontWeight: 600, textAlign: 'right', color: '#212529' }}>
                {formatCurrency(calcularSubtotal(item))}
              </span>
              {formData.items.length > 1 && <RemoveBtn onClick={() => removeItem(i)} />}
            </div>
          ))}
        </div>
        <AddBtn onClick={addItem} label="Agregar producto" />
      </FormSection>

      <div style={{
        background: '#f8f9fa', borderRadius: '10px', padding: '12px 16px',
        borderLeft: '3px solid #6A8899', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '18px',
      }}>
        <span style={{ fontSize: '0.82rem', color: '#6c757d', fontWeight: 600 }}>Total</span>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#212529' }}>{formatCurrency(totalActual)}</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleGuardar}
          style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
