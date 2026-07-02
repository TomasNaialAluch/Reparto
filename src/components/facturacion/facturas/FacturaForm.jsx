import { useState, useMemo, useRef, useEffect } from 'react';
import { formatCurrency } from '../../../utils/money';
import { getLocalDateString } from '../../../utils/date';
import { useClientesFacturacion, useProductosFacturacion } from '../../../firebase/hooks';
import { TIPOS_FACTURA, FACTURA_VACIA } from '../constants';
import { IconX } from '../../gestionSemanal/icons';
import FormSection from '../clientes/FormSection';

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

const calcularPrTotal = (item) => (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnit) || 0);

export default function FacturaForm({ factura, onSave, onCancel }) {
  const esNueva = !factura;
  const { clientes } = useClientesFacturacion();
  const { productos } = useProductosFacturacion();

  const [formData, setFormData] = useState(() => ({
    ...FACTURA_VACIA,
    ...factura,
    fecha: factura?.fecha || getLocalDateString(),
    items: factura?.items?.length ? factura.items : FACTURA_VACIA.items,
  }));

  const [busquedaCliente, setBusquedaCliente] = useState(factura?.clienteNombre || '');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const clienteRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target)) setDropdownAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase();
    if (!q) return clientes.slice(0, 6);
    return clientes.filter(c => c.razonSocial?.toLowerCase().includes(q)).slice(0, 6);
  }, [clientes, busquedaCliente]);

  const seleccionarCliente = (cliente) => {
    setFormData(prev => ({ ...prev, clienteId: cliente.id, clienteNombre: cliente.razonSocial }));
    setBusquedaCliente(cliente.razonSocial);
    setDropdownAbierto(false);
  };

  const escribirCliente = (valor) => {
    setBusquedaCliente(valor);
    setDropdownAbierto(true);
    // Si el usuario tipea libre (ej: "Consumidor Final") sin elegir de la lista, no queda vinculado a un cliente real.
    setFormData(prev => ({ ...prev, clienteId: null, clienteNombre: valor }));
  };

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const updateItem = (index, field, value) => setFormData(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));

  // Si el código escrito coincide con un producto existente, autocompleta la descripción.
  const handleBlurCodigo = (index, codigo) => {
    const producto = productos.find(p => String(p.codigo) === codigo.trim());
    if (producto) updateItem(index, 'descripcion', producto.descripcion);
  };

  const addItem = () => setFormData(prev => ({
    ...prev,
    items: [...prev.items, { codigo: '', descripcion: '', cantidad: '', precioUnit: '' }],
  }));

  const removeItem = (index) => setFormData(prev => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index),
  }));

  const subtotal = formData.items.reduce((sum, item) => sum + calcularPrTotal(item), 0);
  const total = subtotal * (1 + (parseFloat(formData.ivaPct) || 0) / 100);

  const handleGuardar = () => {
    if (!formData.clienteNombre.trim()) { alert('Ingresá o seleccioná un cliente'); return; }
    const itemsValidos = formData.items.filter(i => i.descripcion.trim() && calcularPrTotal(i) > 0);
    if (itemsValidos.length === 0) { alert('Agregá al menos un ítem con cantidad y precio'); return; }

    const items = itemsValidos.map(i => ({ ...i, prTotal: calcularPrTotal(i) }));
    const subtotalFinal = items.reduce((sum, i) => sum + i.prTotal, 0);
    const totalFinal = subtotalFinal * (1 + (parseFloat(formData.ivaPct) || 0) / 100);

    onSave({ ...formData, items, subtotal: subtotalFinal, total: totalFinal });
  };

  return (
    <div>
      <FormSection label="Comprobante">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div ref={clienteRef} style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '5px' }}>
              Cliente
            </label>
            <input type="text" style={inputStyle} value={busquedaCliente}
              onChange={(e) => escribirCliente(e.target.value)}
              onFocus={() => setDropdownAbierto(true)}
              placeholder="Buscar cliente o escribir Consumidor Final" />
            {dropdownAbierto && clientesFiltrados.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: 'white', border: '1px solid #d3d9de', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 5, maxHeight: '180px', overflowY: 'auto',
              }}>
                {clientesFiltrados.map(c => (
                  <div key={c.id} onClick={() => seleccionarCliente(c)}
                    style={{ padding: '8px 12px', fontSize: '0.82rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,136,153,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ color: '#6A8899', fontWeight: 600 }}>{c.codigo}</span> · {c.razonSocial}
                  </div>
                ))}
              </div>
            )}
          </div>
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

      <FormSection label="Ítems">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          {formData.items.map((item, i) => (
            <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Cant." value={item.cantidad}
                onChange={(e) => updateItem(i, 'cantidad', e.target.value)}
                style={{ flex: '0 0 70px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <input type="text" placeholder="Código" value={item.codigo}
                onChange={(e) => updateItem(i, 'codigo', e.target.value)}
                onBlur={(e) => handleBlurCodigo(i, e.target.value)}
                style={{ flex: '0 0 90px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <input type="text" placeholder="Descripción" value={item.descripcion}
                onChange={(e) => updateItem(i, 'descripcion', e.target.value)}
                style={{ flex: 2, minWidth: '140px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <input type="number" placeholder="Pr.Unit." value={item.precioUnit}
                onChange={(e) => updateItem(i, 'precioUnit', e.target.value)}
                style={{ flex: '0 0 100px', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px 8px', fontSize: '0.82rem', outline: 'none' }} />
              <span style={{ flex: '0 0 100px', fontSize: '0.82rem', fontWeight: 600, textAlign: 'right', color: '#212529' }}>
                {formatCurrency(calcularPrTotal(item))}
              </span>
              {formData.items.length > 1 && <RemoveBtn onClick={() => removeItem(i)} />}
            </div>
          ))}
        </div>
        <AddBtn onClick={addItem} label="Agregar ítem" />
      </FormSection>

      <FormSection label="Totales">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="% IVA" flex={0.5}>
            <input type="number" style={inputStyle} value={formData.ivaPct}
              onChange={(e) => update('ivaPct', e.target.value)} />
          </Field>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              Subtotal: {formatCurrency(subtotal)}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#212529' }}>
              Total: {formatCurrency(total)}
            </div>
          </div>
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
          {esNueva ? 'Crear Factura' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
