import React, { useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString } from '../utils/date';
import { IconX } from './gestionSemanal/icons';

const ModalSection = ({ label, children, action }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
      {action}
    </div>
    {children}
  </div>
);

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

const EditTransferenciaModal = ({ isOpen, onClose, transferencia, onSave }) => {
  const [formData, setFormData] = useState({
    nombreCliente: '',
    transferencias: [{ descripcion: '', monto: '' }],
    boletas: [{ fecha: '', monto: '' }]
  });

  useEffect(() => {
    if (isOpen && transferencia) {
      setFormData({
        nombreCliente: transferencia.nombreCliente || '',
        transferencias: transferencia.transferencias?.length > 0
          ? transferencia.transferencias.map(t => ({ descripcion: t.descripcion || '', monto: formatCurrencyNoSymbol(parseFloat(t.monto) || 0) }))
          : [{ descripcion: '', monto: '' }],
        boletas: transferencia.boletas?.length > 0
          ? transferencia.boletas.map(b => ({ fecha: b.fecha || '', monto: formatCurrencyNoSymbol(parseFloat(b.monto) || 0) }))
          : [{ fecha: getLocalDateString(), monto: '' }]
      });
    }
  }, [isOpen, transferencia]);

  const handleCurrencyBlur = (updateFn) => (e) => {
    const num = parseCurrencyValue(e.target.value);
    if (Number.isFinite(num)) updateFn(formatCurrencyNoSymbol(num));
  };

  const addTransferenciaRow = () => setFormData(p => ({ ...p, transferencias: [...p.transferencias, { descripcion: '', monto: '' }] }));
  const updateTransferenciaRow = (i, field, value) => setFormData(p => ({ ...p, transferencias: p.transferencias.map((t, idx) => idx === i ? { ...t, [field]: value } : t) }));
  const removeTransferenciaRow = (i) => { if (formData.transferencias.length > 1) setFormData(p => ({ ...p, transferencias: p.transferencias.filter((_, idx) => idx !== i) })); };

  const addBoleta = () => setFormData(p => ({ ...p, boletas: [...p.boletas, { fecha: getLocalDateString(), monto: '' }] }));
  const updateBoleta = (i, field, value) => setFormData(p => ({ ...p, boletas: p.boletas.map((b, idx) => idx === i ? { ...b, [field]: value } : b) }));
  const removeBoleta = (i) => { if (formData.boletas.length > 1) setFormData(p => ({ ...p, boletas: p.boletas.filter((_, idx) => idx !== i) })); };

  const totalTransferencias = formData.transferencias.reduce((s, t) => s + parseCurrencyValue(t.monto), 0);
  const totalBoletas = formData.boletas.reduce((s, b) => s + parseCurrencyValue(b.monto), 0);
  const saldoFinal = totalTransferencias - totalBoletas;

  const accentColor = saldoFinal > 0 ? '#28a745' : saldoFinal < 0 ? '#dc3545' : '#dee2e6';
  const pillBg     = saldoFinal > 0 ? 'rgba(40,167,69,0.1)' : saldoFinal < 0 ? 'rgba(220,53,69,0.1)' : '#e9ecef';
  const pillColor  = saldoFinal > 0 ? '#28a745' : saldoFinal < 0 ? '#dc3545' : '#6c757d';

  const handleSave = () => {
    if (!formData.nombreCliente.trim()) { alert('Ingrese el nombre del cliente'); return; }
    const hasValidData = formData.transferencias.some(t => t.descripcion.trim() || parseCurrencyValue(t.monto) > 0) ||
                         formData.boletas.some(b => b.fecha && parseCurrencyValue(b.monto) > 0);
    if (!hasValidData) { alert('Debe agregar al menos una transferencia o boleta válida'); return; }

    onSave(transferencia.id, {
      nombreCliente: formData.nombreCliente.trim(),
      transferencias: formData.transferencias.filter(t => parseCurrencyValue(t.monto) > 0).map(t => ({ descripcion: t.descripcion.trim(), monto: parseCurrencyValue(t.monto).toString() })),
      boletas: formData.boletas.filter(b => b.fecha && parseCurrencyValue(b.monto) > 0).map(b => ({ fecha: b.fecha, monto: parseCurrencyValue(b.monto).toString() })),
      totalTransferencias, totalBoletas, saldoFinal,
      fecha: transferencia.fecha || getLocalDateString()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.35)' }}>
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', margin: '0 16px', transform: 'translateY(0)' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #dde2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Editar transferencia
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#212529' }}>
              {transferencia?.nombreCliente}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#e9ecef', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: '#6c757d', flexShrink: 0 }}>
            <IconX size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>

          {/* Nombre */}
          <ModalSection label="Cliente">
            <input type="text" className="form-control" placeholder="Nombre del cliente"
              value={formData.nombreCliente}
              onChange={(e) => setFormData(p => ({ ...p, nombreCliente: e.target.value }))}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }} />
          </ModalSection>

          {/* Transferencias */}
          <ModalSection label="Transferencias Recibidas" action={<AddBtn onClick={addTransferenciaRow} label="Agregar" />}>
            <div style={{ fontSize: '0.7rem', color: '#6c757d', marginBottom: '8px' }}>Dinero que el cliente te envió</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {formData.transferencias.map((t, i) => (
                <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '8px', borderLeft: '2px solid rgba(106,136,153,0.35)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="text" placeholder="Descripción"
                    value={t.descripcion} onChange={(e) => updateTransferenciaRow(i, 'descripcion', e.target.value)}
                    style={{ flex: 2, border: '1px solid #dee2e6', borderRadius: '6px', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }} />
                  <input type="text" placeholder="Monto"
                    value={t.monto} onChange={(e) => updateTransferenciaRow(i, 'monto', e.target.value)}
                    onBlur={handleCurrencyBlur((val) => updateTransferenciaRow(i, 'monto', val))}
                    style={{ flex: 1, border: '1px solid #dee2e6', borderRadius: '6px', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }} />
                  {formData.transferencias.length > 1 && <RemoveBtn onClick={() => removeTransferenciaRow(i)} />}
                </div>
              ))}
            </div>
          </ModalSection>

          {/* Boletas */}
          <ModalSection label="Boletas Vendidas" action={<AddBtn onClick={addBoleta} label="Agregar" />}>
            <div style={{ fontSize: '0.7rem', color: '#6c757d', marginBottom: '8px' }}>Dinero que le debés al cliente</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {formData.boletas.map((b, i) => (
                <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '8px', borderLeft: '2px solid rgba(230,168,23,0.35)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="date"
                    value={b.fecha} onChange={(e) => updateBoleta(i, 'fecha', e.target.value)}
                    style={{ flex: 2, border: '1px solid #dee2e6', borderRadius: '6px', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }} />
                  <input type="text" placeholder="Monto"
                    value={b.monto} onChange={(e) => updateBoleta(i, 'monto', e.target.value)}
                    onBlur={handleCurrencyBlur((val) => updateBoleta(i, 'monto', val))}
                    style={{ flex: 1, border: '1px solid #dee2e6', borderRadius: '6px', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }} />
                  {formData.boletas.length > 1 && <RemoveBtn onClick={() => removeBoleta(i)} />}
                </div>
              ))}
            </div>
          </ModalSection>

          {/* Resumen en tiempo real */}
          <div style={{ background: '#f8f9fa', borderRadius: '10px', borderLeft: `3px solid ${accentColor}`, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Resumen</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e9ecef', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              {[
                { label: 'Transferencias', value: formatCurrency(totalTransferencias), color: '#3a5060' },
                { label: 'Boletas',        value: formatCurrency(totalBoletas),        color: '#e6a817' },
                { label: 'Saldo',          value: formatCurrency(Math.abs(saldoFinal)), color: pillColor },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'white', padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                {saldoFinal > 0 ? `Le debés a ${formData.nombreCliente || 'el cliente'}` : saldoFinal < 0 ? `${formData.nombreCliente || 'El cliente'} te debe` : 'Cuentas saldadas'}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: pillColor, background: pillBg, padding: '3px 12px', borderRadius: '999px' }}>
                {formatCurrency(Math.abs(saldoFinal))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #dde2e6', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransferenciaModal;
