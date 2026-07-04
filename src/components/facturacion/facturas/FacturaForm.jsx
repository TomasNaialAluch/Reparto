import { useState, useMemo, useRef, useEffect } from 'react';
import { formatCurrency } from '../../../utils/money';
import { getLocalDateString } from '../../../utils/date';
import { TIPOS_FACTURA, FACTURA_VACIA } from '../constants';
import { IconX, IconHistory } from '../../gestionSemanal/icons';
import FormSection from '../clientes/FormSection';
import HistorialPrecioClienteModal from './HistorialPrecioClienteModal';
import { obtenerHistorialPrecio } from './historialPreciosDemo';

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

// Estilos compactos de la tabla de ítems (Opción D — README-FACTURACION-ITEMS-UX.md).
const th = {
  textAlign: 'left', padding: '7px 8px', fontSize: '0.63rem', fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid #d3d9de', whiteSpace: 'nowrap',
};
const td = {
  padding: '6px 8px', fontSize: '0.8rem', color: '#212529',
  borderBottom: '1px solid #eef1f3', verticalAlign: 'middle',
};
const cellInput = {
  width: '100%', border: '1px solid #ccd3d9', borderRadius: '6px', padding: '5px 7px',
  fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
};

const emptyItem = () => ({ codigo: '', descripcion: '', cantidad: '', precioUnit: '' });
const isEmptyItem = (it) =>
  !String(it?.cantidad ?? '').trim() && !String(it?.codigo ?? '').trim() &&
  !String(it?.descripcion ?? '').trim() && !String(it?.precioUnit ?? '').trim();

const calcularPrTotal = (item) => (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnit) || 0);

export default function FacturaForm({ factura, clientes, productos, onSave, onCancel, onClienteChange, onError }) {
  const esNueva = !factura;

  const [formData, setFormData] = useState(() => ({
    ...FACTURA_VACIA,
    ...factura,
    fecha: factura?.fecha || getLocalDateString(),
    items: factura?.items?.length ? factura.items : FACTURA_VACIA.items,
  }));

  const [busquedaCliente, setBusquedaCliente] = useState(factura?.clienteNombre || '');
  const [codigoCliente, setCodigoCliente] = useState(() => {
    if (!factura?.clienteId) return '';
    const cliente = clientes.find(c => c.id === factura.clienteId);
    return cliente ? String(cliente.codigo) : '';
  });
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [historialModal, setHistorialModal] = useState(null); // { itemIndex } | null

  // Opción D: solo la fila `editingIndex` muestra inputs; el resto es texto plano.
  const [editingIndex, setEditingIndex] = useState(esNueva ? 0 : null);

  const clienteRef = useRef(null);
  // Refs por índice, pero solo la fila en edición monta inputs y setea sus refs.
  const itemRefs = useRef([]); // itemRefs.current[i] = { cantidad, codigo, descripcion, precioUnit }
  const editingRowRef = useRef(null); // el <tr> que está en edición (para el blur-collapse)
  const editSnapshotRef = useRef(null); // valores de la fila al empezar a editarla (para Esc → revert)
  const historialOpenRef = useRef(false); // evita que abrir el modal colapse la fila por blur
  // Suprime el blur-collapse mientras se mueve el foco de una fila a otra (Tab / click en otra fila).
  // Necesario porque el setTimeout del blur puede correr antes del rAF que reenfoca la fila nueva.
  const suppressBlurRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target)) setDropdownAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Snapshot inicial de la fila que arranca en edición (factura nueva).
  useEffect(() => {
    if (esNueva && formData.items[0]) editSnapshotRef.current = { ...formData.items[0] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase();
    if (!q) return clientes.slice(0, 6);
    return clientes.filter(c => c.razonSocial?.toLowerCase().includes(q)).slice(0, 6);
  }, [clientes, busquedaCliente]);

  const aplicarCliente = (cliente) => {
    setFormData(prev => ({ ...prev, clienteId: cliente.id, clienteNombre: cliente.razonSocial }));
    setBusquedaCliente(cliente.razonSocial);
    setCodigoCliente(String(cliente.codigo));
    onClienteChange?.(cliente.razonSocial);
  };

  const seleccionarCliente = (cliente) => {
    aplicarCliente(cliente);
    setDropdownAbierto(false);
  };

  const escribirCliente = (valor) => {
    setBusquedaCliente(valor);
    setDropdownAbierto(true);
    setCodigoCliente('');
    setFormData(prev => ({ ...prev, clienteId: null, clienteNombre: valor }));
    onClienteChange?.(valor);
  };

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const updateItem = (index, field, value) => setFormData(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));

  // Entrar a editar una fila: snapshot para Esc + foco al campo pedido (rAF, ya montado el input).
  // suppressBlurRef evita que el blur síncrono de la fila anterior (al desmontarse) dispare un
  // collapse antes de que el rAF de abajo termine de mover el foco a la fila nueva.
  const enterEditRow = (index, field = 'cantidad') => {
    suppressBlurRef.current = true;
    editSnapshotRef.current = { ...(formData.items[index] ?? emptyItem()) };
    setEditingIndex(index);
    requestAnimationFrame(() => {
      itemRefs.current[index]?.[field]?.focus();
      suppressBlurRef.current = false;
    });
  };

  // Colapsar la fila activa dejando lo tipeado (commit as-is, como Odoo). Sin validar acá.
  const collapseEdit = () => {
    editSnapshotRef.current = null;
    setEditingIndex(null);
  };

  // Esc: si la fila arrancó vacía la elimina; si tenía datos, revierte al snapshot.
  const cancelEdit = () => {
    const idx = editingIndex;
    if (idx == null) return;
    const snap = editSnapshotRef.current;
    if (snap && !isEmptyItem(snap)) {
      setFormData(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? snap : it) }));
    } else if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    } else {
      setFormData(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? emptyItem() : it) }));
    }
    editSnapshotRef.current = null;
    setEditingIndex(null);
  };

  const addItemAndEdit = () => {
    suppressBlurRef.current = true;
    const idx = formData.items.length;
    setFormData(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
    editSnapshotRef.current = emptyItem();
    setEditingIndex(idx);
    requestAnimationFrame(() => {
      itemRefs.current[idx]?.cantidad?.focus();
      suppressBlurRef.current = false;
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    editSnapshotRef.current = null;
    setEditingIndex(null);
  };

  const openHistorial = (itemIndex) => {
    historialOpenRef.current = true;
    document.activeElement?.blur?.();
    setHistorialModal({ itemIndex });
  };
  const closeHistorial = () => {
    historialOpenRef.current = false;
    setHistorialModal(null);
  };

  // Blur de un input de la fila activa → si el foco salió de la fila, colapsa. Con guardas.
  const handleActiveBlur = () => {
    if (suppressBlurRef.current) return; // transición de fila en curso (Tab/click a otra fila)
    setTimeout(() => {
      if (suppressBlurRef.current) return;
      if (historialOpenRef.current) return; // el modal robó el foco, no colapsar
      if (editingRowRef.current && !editingRowRef.current.contains(document.activeElement)) {
        collapseEdit();
      }
    }, 0);
  };

  // Esc en cualquier campo de la fila activa (burbujea al <tr>).
  const handleRowKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  };

  // Cód. Cliente + Tab → autocompleta razón social y foco a la Cantidad del primer ítem.
  const handleCodigoClienteKeyDown = (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const cliente = clientes.find(c => String(c.codigo) === codigoCliente.trim());
    if (cliente) aplicarCliente(cliente);
    enterEditRow(0, 'cantidad');
  };

  // Código de ítem + Tab → autocompleta descripción y salta directo a Pr.Unit (saltea Descripción).
  const handleCodigoItemKeyDown = (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const codigo = e.target.value.trim();
    const producto = productos.find(p => String(p.codigo) === codigo);
    if (producto) updateItem(editingIndex, 'descripcion', producto.descripcion);
    itemRefs.current[editingIndex]?.precioUnit?.focus();
  };

  // Pr.Unit: "+" abre historial de precios; Tab avanza a la fila siguiente (crea una si era la última).
  const handlePrecioUnitKeyDown = (e) => {
    if (e.key === '+') { e.preventDefault(); openHistorial(editingIndex); return; }
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const esUltima = editingIndex === formData.items.length - 1;
    if (esUltima) addItemAndEdit();
    else enterEditRow(editingIndex + 1, 'cantidad');
  };

  const itemEnHistorial = historialModal ? formData.items[historialModal.itemIndex] : null;
  const historialFilas = itemEnHistorial
    ? obtenerHistorialPrecio(formData.clienteId, itemEnHistorial.descripcion || itemEnHistorial.codigo)
    : [];

  const elegirPrecioHistorial = (precioUnit) => {
    const idx = historialModal.itemIndex;
    updateItem(idx, 'precioUnit', String(precioUnit));
    closeHistorial();
    requestAnimationFrame(() => itemRefs.current[idx]?.precioUnit?.focus());
  };

  const subtotal = formData.items.reduce((sum, item) => sum + calcularPrTotal(item), 0);
  const total = subtotal * (1 + (parseFloat(formData.ivaPct) || 0) / 100);

  const handleGuardar = () => {
    if (!formData.clienteNombre.trim()) { onError?.('Ingresá o seleccioná un cliente'); return; }
    const itemsValidos = formData.items.filter(i => i.descripcion.trim() && calcularPrTotal(i) > 0);
    if (itemsValidos.length === 0) { onError?.('Agregá al menos un ítem con cantidad y precio'); return; }

    const items = itemsValidos.map(i => ({ ...i, prTotal: calcularPrTotal(i) }));
    const subtotalFinal = items.reduce((sum, i) => sum + i.prTotal, 0);
    const totalFinal = subtotalFinal * (1 + (parseFloat(formData.ivaPct) || 0) / 100);

    onSave({ ...formData, items, subtotal: subtotalFinal, total: totalFinal });
  };

  const dashIfEmpty = (v) => (String(v ?? '').trim() ? v : <span style={{ color: '#c8ced3' }}>—</span>);

  return (
    <div>
      <FormSection
        label="Comprobante"
        right={
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6c757d', whiteSpace: 'nowrap' }}>
            {new Date(formData.fecha).toLocaleDateString('es-AR')}
          </span>
        }
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Field label="Cód. Cliente" flex={0.6}>
            <input type="text" style={inputStyle} value={codigoCliente}
              onChange={(e) => setCodigoCliente(e.target.value)}
              onKeyDown={handleCodigoClienteKeyDown}
              placeholder="Código" />
          </Field>
          <div ref={clienteRef} style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '5px' }}>
              Razón Social del Cliente
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
        </div>
      </FormSection>

      <FormSection label="Ítems">
        <div style={{ border: '1px solid #d3d9de', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                <tr>
                  <th style={{ ...th, width: '62px', textAlign: 'right' }}>Cant.</th>
                  <th style={{ ...th, width: '82px' }}>Código</th>
                  <th style={th}>Descripción</th>
                  <th style={{ ...th, width: '132px', textAlign: 'right' }}>Pr. Unit.</th>
                  <th style={{ ...th, width: '104px', textAlign: 'right' }}>Pr. Total</th>
                  <th style={{ ...th, width: '40px' }} />
                </tr>
              </thead>
              <tbody>
                {formData.items.length === 0 && (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '18px' }}>Sin ítems. Usá "Agregar ítem".</td></tr>
                )}
                {formData.items.map((item, i) => {
                  const isEditing = i === editingIndex;
                  const prTotal = calcularPrTotal(item);

                  if (isEditing) {
                    const rowRefs = (itemRefs.current[i] ??= {});
                    return (
                      <tr key={i} ref={editingRowRef} onKeyDown={handleRowKeyDown} style={{ background: 'rgba(106,136,153,0.07)' }}>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <input ref={(el) => { rowRefs.cantidad = el; }}
                            type="text" inputMode="decimal" placeholder="0" value={item.cantidad}
                            onChange={(e) => updateItem(i, 'cantidad', e.target.value)}
                            onBlur={handleActiveBlur}
                            style={{ ...cellInput, textAlign: 'right' }} />
                        </td>
                        <td style={td}>
                          <input ref={(el) => { rowRefs.codigo = el; }}
                            type="text" placeholder="Cód." value={item.codigo}
                            onChange={(e) => updateItem(i, 'codigo', e.target.value)}
                            onKeyDown={handleCodigoItemKeyDown}
                            onBlur={handleActiveBlur}
                            style={cellInput} />
                        </td>
                        <td style={td}>
                          <input ref={(el) => { rowRefs.descripcion = el; }}
                            type="text" placeholder="Descripción" value={item.descripcion}
                            onChange={(e) => updateItem(i, 'descripcion', e.target.value)}
                            onBlur={handleActiveBlur}
                            style={cellInput} />
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input ref={(el) => { rowRefs.precioUnit = el; }}
                              type="text" inputMode="decimal" placeholder="0" value={item.precioUnit}
                              onChange={(e) => updateItem(i, 'precioUnit', e.target.value)}
                              onKeyDown={handlePrecioUnitKeyDown}
                              onBlur={handleActiveBlur}
                              title="Tecla + para ver el historial de precios de este cliente"
                              style={{ ...cellInput, textAlign: 'right' }} />
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openHistorial(i)}
                              title="Historial de precios de este producto para este cliente (tecla +)"
                              className="d-inline-flex align-items-center justify-content-center"
                              style={{ flex: '0 0 auto', border: '1px solid #dee2e6', borderRadius: '6px', width: '26px', height: '28px', background: 'white', color: '#6A8899', cursor: 'pointer' }}>
                              <IconHistory size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(prTotal)}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeItem(i)}
                            title="Eliminar ítem"
                            className="d-inline-flex align-items-center justify-content-center"
                            style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: 0 }}>
                            <IconX size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={i}
                      style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,136,153,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ ...td, textAlign: 'right' }} onClick={() => enterEditRow(i, 'cantidad')}>{dashIfEmpty(item.cantidad)}</td>
                      <td style={td} onClick={() => enterEditRow(i, 'codigo')}>{dashIfEmpty(item.codigo)}</td>
                      <td style={{ ...td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => enterEditRow(i, 'descripcion')}>{dashIfEmpty(item.descripcion)}</td>
                      <td style={{ ...td, textAlign: 'right' }} onClick={() => enterEditRow(i, 'precioUnit')}>
                        {String(item.precioUnit ?? '').trim() ? formatCurrency(parseFloat(item.precioUnit) || 0) : <span style={{ color: '#c8ced3' }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }} onClick={() => enterEditRow(i, 'cantidad')}>{formatCurrency(prTotal)}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                          title="Eliminar ítem"
                          className="d-inline-flex align-items-center justify-content-center"
                          style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: 0 }}>
                          <IconX size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <AddBtn onClick={addItemAndEdit} label="Agregar ítem" />
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
            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              IVA ({formData.ivaPct || 0}%): {formatCurrency(total - subtotal)}
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

      {historialModal && (
        <HistorialPrecioClienteModal
          clienteNombre={formData.clienteNombre}
          productoLabel={itemEnHistorial?.descripcion || itemEnHistorial?.codigo}
          historial={historialFilas}
          onSeleccionar={elegirPrecioHistorial}
          onClose={closeHistorial}
        />
      )}
    </div>
  );
}
