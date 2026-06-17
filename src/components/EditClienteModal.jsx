import React, { useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString } from '../utils/date';
import { useGestionSemanal } from '../firebase/hooks';
import { IconX } from './gestionSemanal/icons';

/* ── Sub-componentes (mismos patrones que FormSection del formulario principal) ── */

const ModalSection = ({ label, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
    </div>
    {children}
  </div>
);

const ToggleSwitch = ({ id, label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer' }}
    onClick={() => onChange(!checked)}>
    <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: checked ? '#6A8899' : '#dee2e6', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: checked ? '18px' : '2px', transition: 'left 0.2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
    <span style={{ fontSize: '0.85rem', color: '#212529', margin: 0 }}>{label}</span>
  </div>
);

const InputRow = ({ children }) => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
    {children}
  </div>
);

const RemoveBtn = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="d-inline-flex align-items-center justify-content-center"
    style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
    <IconX size={14} />
  </button>
);

const AddBtn = ({ onClick, children }) => (
  <button type="button" onClick={onClick}
    style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer', marginBottom: '8px', marginRight: '6px', transition: 'all 0.15s' }}>
    {children}
  </button>
);

/* ── Componente principal ── */

const EditClienteModal = ({ isOpen, onClose, cliente, onSave }) => {
  const { semanaActiva } = useGestionSemanal('shared');
  const [formData, setFormData] = useState({
    clientName: '',
    boletas: [{ date: '', amount: '' }],
    ventas: [],
    plataFavor: [],
    deudas: [],
    efectivo: [],
    cheques: [],
    transferencias: []
  });
  const [showSections, setShowSections] = useState({
    ventas: false, plataFavor: false, deuda: false,
    efectivo: false, cheques: false, transferencias: false
  });
  const [showMercaderiaModal, setShowMercaderiaModal] = useState(false);

  useEffect(() => {
    if (isOpen && cliente) {
      setFormData({
        clientName: cliente.nombreCliente || '',
        boletas: cliente.boletas?.length > 0 ? cliente.boletas : [{ date: '', amount: '' }],
        ventas: cliente.ventas || [],
        plataFavor: cliente.plataFavor || [],
        deudas: cliente.deudas || [],
        efectivo: cliente.efectivo || [],
        cheques: cliente.cheques || [],
        transferencias: cliente.transferencias || []
      });
      setShowSections({
        ventas: (cliente.ventas?.length || 0) > 0,
        plataFavor: (cliente.plataFavor?.length || 0) > 0,
        deuda: (cliente.deudas?.length || 0) > 0,
        efectivo: (cliente.efectivo?.length || 0) > 0,
        cheques: (cliente.cheques?.length || 0) > 0,
        transferencias: (cliente.transferencias?.length || 0) > 0
      });
    }
  }, [isOpen, cliente]);

  const handleCurrencyBlur = (e) => {
    const num = parseCurrencyValue(e.target.value);
    if (!isNaN(num)) e.target.value = formatCurrencyNoSymbol(num);
  };
  const handleCurrencyFocus = (e) => {
    e.target.value = e.target.value.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim();
  };

  const addItem = (arrayName, defaultItem) =>
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], defaultItem] }));
  const removeItem = (arrayName, index) =>
    setFormData(prev => ({ ...prev, [arrayName]: prev[arrayName].filter((_, i) => i !== index) }));
  const updateItem = (arrayName, index, field, value) =>
    setFormData(prev => ({ ...prev, [arrayName]: prev[arrayName].map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const addBoleta      = () => addItem('boletas',       { date: getLocalDateString(), amount: '' });
  const addVenta       = () => addItem('ventas',        { date: getLocalDateString(), amount: '' });
  const addPlataFavor  = () => addItem('plataFavor',    { date: getLocalDateString(), amount: '' });
  const addDeuda       = () => addItem('deudas',        { date: getLocalDateString(), amount: '' });
  const addEfectivo    = () => addItem('efectivo',      { date: getLocalDateString(), amount: '' });
  const addCheque      = () => addItem('cheques',       { date: getLocalDateString(), id: '', amount: '' });
  const addTransferencia = () => addItem('transferencias', { date: getLocalDateString(), amount: '' });

  const toggleSection = (key, addFn, currentArray) => (val) => {
    setShowSections(prev => ({ ...prev, [key]: val }));
    if (val && currentArray.length === 0) addFn();
  };

  const obtenerBoletasMercaderia = () => {
    if (!semanaActiva?.mercaderia || !formData.clientName.trim()) return [];
    return semanaActiva.mercaderia
      .filter(e => e.proveedor === formData.clientName.trim())
      .map((e, index) => ({
        id: `mercaderia-${index}`, index,
        dia: e.dia, proveedor: e.proveedor,
        costoTotal: e.cortes.reduce((s, c) => s + (c.kg * (c.precioKg || 0)), 0),
        cortes: e.cortes,
        timestamp: e.timestamp || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const vincularBoletaMercaderia = (boleta) => {
    if (formData.boletas.some(b => b.mercaderiaIndex !== undefined && b.mercaderiaIndex === boleta.index)) {
      alert('Esta boleta de mercadería ya está vinculada');
      return;
    }
    setFormData(prev => ({
      ...prev,
      boletas: [...prev.boletas, {
        date: boleta.timestamp ? boleta.timestamp.split('T')[0] : getLocalDateString(),
        amount: formatCurrencyNoSymbol(boleta.costoTotal),
        mercaderiaIndex: boleta.index,
        esDeMercaderia: true
      }]
    }));
  };

  // Calcular balance en tiempo real
  const calcBalance = () => {
    const totalBoletas       = formData.boletas.filter(b => b.date && b.amount).reduce((s, b) => s + parseCurrencyValue(b.amount), 0);
    const totalVentas        = showSections.ventas        ? formData.ventas.filter(v => v.date && v.amount).reduce((s, v) => s + parseCurrencyValue(v.amount), 0) : 0;
    const totalPlata         = showSections.plataFavor    ? formData.plataFavor.filter(p => p.amount).reduce((s, p) => s + parseCurrencyValue(p.amount), 0) : 0;
    const totalDeuda         = showSections.deuda         ? formData.deudas.filter(d => d.amount).reduce((s, d) => s + parseCurrencyValue(d.amount), 0) : 0;
    const totalEfectivo      = showSections.efectivo      ? formData.efectivo.filter(e => e.amount).reduce((s, e) => s + parseCurrencyValue(e.amount), 0) : 0;
    const totalCheque        = showSections.cheques       ? formData.cheques.filter(c => c.id && c.amount).reduce((s, c) => s + parseCurrencyValue(c.amount), 0) : 0;
    const totalTransferencia = showSections.transferencias? formData.transferencias.filter(t => t.amount).reduce((s, t) => s + parseCurrencyValue(t.amount), 0) : 0;
    const totalPagos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
    return { totalBoletas, totalPagos, totalDeuda, finalBalance: totalPagos - totalBoletas - totalDeuda };
  };

  const handleSave = () => {
    if (!formData.clientName.trim()) { alert('Ingrese el nombre del cliente'); return; }
    const boletasFiltradas        = formData.boletas.filter(b => b.date && b.amount);
    const ventasFiltradas         = showSections.ventas         ? formData.ventas.filter(v => v.date && v.amount) : [];
    const plataFiltrada           = showSections.plataFavor     ? formData.plataFavor.filter(p => p.amount) : [];
    const deudasFiltradas         = showSections.deuda          ? formData.deudas.filter(d => d.amount) : [];
    const efectivoFiltrado        = showSections.efectivo       ? formData.efectivo.filter(e => e.amount) : [];
    const chequesFiltrados        = showSections.cheques        ? formData.cheques.filter(c => c.id && c.amount) : [];
    const transferenciasFiltradas = showSections.transferencias ? formData.transferencias.filter(t => t.amount) : [];
    const totalBoletas       = boletasFiltradas.reduce((s, b) => s + parseCurrencyValue(b.amount), 0);
    const totalVentas        = ventasFiltradas.reduce((s, v) => s + parseCurrencyValue(v.amount), 0);
    const totalPlata         = plataFiltrada.reduce((s, p) => s + parseCurrencyValue(p.amount), 0);
    const totalDeuda         = deudasFiltradas.reduce((s, d) => s + parseCurrencyValue(d.amount), 0);
    const totalEfectivo      = efectivoFiltrado.reduce((s, e) => s + parseCurrencyValue(e.amount), 0);
    const totalCheque        = chequesFiltrados.reduce((s, c) => s + parseCurrencyValue(c.amount), 0);
    const totalTransferencia = transferenciasFiltradas.reduce((s, t) => s + parseCurrencyValue(t.amount), 0);
    const totalPagos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
    onSave(cliente.id, {
      clientName: formData.clientName.trim(),
      boletas: boletasFiltradas, ventas: ventasFiltradas, plataFavor: plataFiltrada,
      deudas: deudasFiltradas, efectivo: efectivoFiltrado, cheques: chequesFiltrados,
      transferencias: transferenciasFiltradas,
      totalBoletas, totalVentas, totalPlata, totalDeuda, totalEfectivo, totalCheque, totalTransferencia,
      totalIngresos: totalPagos, finalBalance: totalPagos - totalBoletas - totalDeuda,
      date: getLocalDateString()
    });
    onClose();
  };

  if (!isOpen) return null;

  const { totalBoletas, totalPagos, totalDeuda, finalBalance } = calcBalance();
  const esAFavor = finalBalance > 0;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />

      {/* Panel modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(640px, 95vw)',
        maxHeight: '90vh',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        zIndex: 1051,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #dde2e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Editar cliente
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
              {cliente?.nombreCliente}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#e9ecef', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#6c757d', transition: 'background 0.15s' }}>
            <IconX size={14} />
          </button>
        </div>

        {/* Body con scroll */}
        <div style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>

          {/* Nombre */}
          <ModalSection label="Datos del cliente">
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: '5px' }}>
              Nombre
            </label>
            <input type="text" className="form-control" value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }} required />
          </ModalSection>

          {/* Deuda */}
          <ModalSection label="Deuda">
            <ToggleSwitch label="Tiene Deuda pendiente" checked={showSections.deuda}
              onChange={toggleSection('deuda', addDeuda, formData.deudas)} />
            {showSections.deuda && (
              <div style={{ marginTop: '10px' }}>
                {formData.deudas.map((item, i) => (
                  <InputRow key={i}>
                    <input type="date" className="form-control" value={item.date || ''} onChange={(e) => updateItem('deudas', i, 'date', e.target.value)} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updateItem('deudas', i, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                    <RemoveBtn onClick={() => removeItem('deudas', i)} />
                  </InputRow>
                ))}
                <AddBtn onClick={addDeuda}>+ Agregar Deuda</AddBtn>
              </div>
            )}
          </ModalSection>

          {/* Boletas */}
          <ModalSection label="Boletas">
            {formData.boletas.map((boleta, i) => (
              <InputRow key={i}>
                <input type="date" className="form-control" value={boleta.date} onChange={(e) => updateItem('boletas', i, 'date', e.target.value)} disabled={boleta.esDeMercaderia} />
                <input type="text" className="form-control" placeholder="Monto (AR$)" value={boleta.amount} onChange={(e) => updateItem('boletas', i, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} disabled={boleta.esDeMercaderia} />
                {boleta.esDeMercaderia && (
                  <span style={{ fontSize: '0.72rem', background: 'rgba(23,162,184,0.12)', color: '#17a2b8', padding: '3px 7px', borderRadius: '6px', flexShrink: 0 }}>📦</span>
                )}
                <RemoveBtn onClick={() => removeItem('boletas', i)} />
              </InputRow>
            ))}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <AddBtn onClick={addBoleta}>+ Boleta Manual</AddBtn>
              {formData.clientName.trim() && semanaActiva?.mercaderia && (
                <AddBtn onClick={() => setShowMercaderiaModal(true)}>📦 Vincular Mercadería</AddBtn>
              )}
            </div>
          </ModalSection>

          {/* Ajustes */}
          <ModalSection label="Ajustes">
            <ToggleSwitch label="Le vendió algo" checked={showSections.ventas}
              onChange={toggleSection('ventas', addVenta, formData.ventas)} />
            {showSections.ventas && (
              <div style={{ marginTop: '10px' }}>
                {formData.ventas.map((v, i) => (
                  <InputRow key={i}>
                    <input type="date" className="form-control" value={v.date} onChange={(e) => updateItem('ventas', i, 'date', e.target.value)} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={v.amount} onChange={(e) => updateItem('ventas', i, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                    <RemoveBtn onClick={() => removeItem('ventas', i)} />
                  </InputRow>
                ))}
                <AddBtn onClick={addVenta}>+ Agregar Venta</AddBtn>
              </div>
            )}
          </ModalSection>

          {/* Pagos recibidos */}
          <ModalSection label="Pagos Recibidos">
            <ToggleSwitch label="Plata a Favor" checked={showSections.plataFavor}
              onChange={toggleSection('plataFavor', addPlataFavor, formData.plataFavor)} />
            {showSections.plataFavor && (
              <div style={{ marginTop: '10px' }}>
                {formData.plataFavor.map((p, i) => (
                  <InputRow key={i}>
                    <input type="date" className="form-control" value={p.date} onChange={(e) => updateItem('plataFavor', i, 'date', e.target.value)} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={p.amount} onChange={(e) => updateItem('plataFavor', i, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                    <RemoveBtn onClick={() => removeItem('plataFavor', i)} />
                  </InputRow>
                ))}
                <AddBtn onClick={addPlataFavor}>+ Agregar</AddBtn>
              </div>
            )}

            <ToggleSwitch label="Pago en Efectivo" checked={showSections.efectivo}
              onChange={toggleSection('efectivo', addEfectivo, formData.efectivo)} />
            {showSections.efectivo && (
              <div style={{ marginTop: '10px' }}>
                {formData.efectivo.map((e, i) => (
                  <InputRow key={i}>
                    <input type="date" className="form-control" value={e.date} onChange={(ev) => updateItem('efectivo', i, 'date', ev.target.value)} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={e.amount} onChange={(ev) => updateItem('efectivo', i, 'amount', ev.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                    <RemoveBtn onClick={() => removeItem('efectivo', i)} />
                  </InputRow>
                ))}
                <AddBtn onClick={addEfectivo}>+ Agregar</AddBtn>
              </div>
            )}

            <ToggleSwitch label="Pago con Cheque" checked={showSections.cheques}
              onChange={toggleSection('cheques', addCheque, formData.cheques)} />
            {showSections.cheques && (
              <div style={{ marginTop: '10px' }}>
                {formData.cheques.map((c, i) => (
                  <InputRow key={i}>
                    <input type="date" className="form-control" value={c.date} onChange={(e) => updateItem('cheques', i, 'date', e.target.value)} />
                    <input type="text" className="form-control" maxLength="4" placeholder="4 dígitos" value={c.id} onChange={(e) => updateItem('cheques', i, 'id', e.target.value)} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={c.amount} onChange={(e) => updateItem('cheques', i, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                    <RemoveBtn onClick={() => removeItem('cheques', i)} />
                  </InputRow>
                ))}
                <AddBtn onClick={addCheque}>+ Agregar</AddBtn>
              </div>
            )}

            <ToggleSwitch label="Pago por Transferencia" checked={showSections.transferencias}
              onChange={toggleSection('transferencias', addTransferencia, formData.transferencias)} />
            {showSections.transferencias && (
              <div style={{ marginTop: '10px' }}>
                {formData.transferencias.map((t, i) => (
                  <InputRow key={i}>
                    <input type="date" className="form-control" value={t.date} onChange={(e) => updateItem('transferencias', i, 'date', e.target.value)} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={t.amount} onChange={(e) => updateItem('transferencias', i, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                    <RemoveBtn onClick={() => removeItem('transferencias', i)} />
                  </InputRow>
                ))}
                <AddBtn onClick={addTransferencia}>+ Agregar</AddBtn>
              </div>
            )}
          </ModalSection>

          {/* Balance en tiempo real */}
          <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '14px 16px', borderLeft: `3px solid ${esAFavor ? '#28a745' : finalBalance < 0 ? '#dc3545' : '#dee2e6'}` }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Balance en tiempo real
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Total Boletas</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e6a817' }}>{formatCurrency(totalBoletas)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Total Pagos</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#28a745' }}>{formatCurrency(totalPagos)}</div>
              </div>
              {totalDeuda > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Total Deuda</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#dc3545' }}>{formatCurrency(totalDeuda)}</div>
                </div>
              )}
            </div>
            <div style={{ paddingTop: '10px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                {esAFavor ? `${formData.clientName || 'El cliente'} te debe` : finalBalance < 0 ? `Le debés a ${formData.clientName || 'el cliente'}` : 'Saldado'}
              </span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: esAFavor ? '#28a745' : finalBalance < 0 ? '#dc3545' : '#6c757d',
                background: esAFavor ? 'rgba(40,167,69,0.1)' : finalBalance < 0 ? 'rgba(220,53,69,0.1)' : '#e9ecef',
                padding: '4px 12px', borderRadius: '999px' }}>
                {formatCurrency(Math.abs(finalBalance))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #dde2e6', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}>
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Sub-modal mercadería */}
      {showMercaderiaModal && (
        <>
          <div onClick={() => setShowMercaderiaModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1060 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(560px, 92vw)', maxHeight: '80vh', background: 'white',
            borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
            zIndex: 1061, display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #dde2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#212529' }}>📦 Vincular Boleta de Mercadería</span>
              <button type="button" onClick={() => setShowMercaderiaModal(false)}
                className="d-inline-flex align-items-center justify-content-center"
                style={{ border: 'none', background: '#e9ecef', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#6c757d' }}>
                <IconX size={12} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
              {!formData.clientName.trim() ? (
                <div style={{ background: 'rgba(255,193,7,0.12)', borderLeft: '3px solid #ffc107', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#856404' }}>
                  Ingresá el nombre del cliente primero
                </div>
              ) : obtenerBoletasMercaderia().length === 0 ? (
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#6c757d' }}>
                  No hay boletas disponibles para <strong>{formData.clientName}</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {obtenerBoletasMercaderia().map((boleta) => {
                    const yaVinculada = formData.boletas.some(b => b.mercaderiaIndex !== undefined && b.mercaderiaIndex === boleta.index);
                    return (
                      <div key={boleta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: yaVinculada ? '#f8f9fa' : 'white', border: `1px solid ${yaVinculada ? '#e9ecef' : '#dde2e6'}` }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(106,136,153,0.15)', color: '#3a5060', padding: '2px 7px', borderRadius: '999px', fontWeight: 600 }}>{boleta.dia}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{boleta.proveedor}</span>
                            {yaVinculada && <span style={{ fontSize: '0.65rem', background: 'rgba(40,167,69,0.12)', color: '#28a745', padding: '2px 6px', borderRadius: '4px' }}>✓ Vinculada</span>}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>{boleta.cortes.length} corte{boleta.cortes.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#28a745', marginBottom: '6px' }}>{formatCurrency(boleta.costoTotal)}</div>
                          {!yaVinculada && (
                            <button onClick={() => vincularBoletaMercaderia(boleta)}
                              style={{ border: '1px solid #6A8899', borderRadius: '8px', padding: '4px 12px', background: 'transparent', color: '#3a5060', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                              Vincular
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #dde2e6' }}>
              <button onClick={() => setShowMercaderiaModal(false)}
                style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EditClienteModal;
