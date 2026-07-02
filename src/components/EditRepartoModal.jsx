import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/money';
import { getLocalDateString, formatDateWithWeekday } from '../utils/date';
import { IconX, IconUsers, IconPlus } from './gestionSemanal/icons';

/* ── Sub-componentes ── */

const ModalSection = ({ label, children, action }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
      {action}
    </div>
    {children}
  </div>
);

const statusPill = (status) => {
  const map = {
    paid:    { label: 'Pagado',    bg: 'rgba(40,167,69,0.12)',   color: '#28a745' },
    partial: { label: 'Parcial',   bg: 'rgba(230,168,23,0.12)',  color: '#e6a817' },
    pending: { label: 'Pendiente', bg: 'rgba(108,117,125,0.1)',  color: '#6c757d' },
  };
  return map[status] || map.pending;
};

/* ── Componente principal ── */

const EditRepartoModal = ({ isOpen, onClose, reparto, onSave }) => {
  const [formData, setFormData] = useState({ date: '', clients: [] });

  useEffect(() => {
    if (isOpen && reparto) {
      setFormData({
        date: reparto.date || getLocalDateString(),
        clients: (reparto.clientes || reparto.clients || []).map(c => ({
          ...c,
          billAmount: c.billAmount != null ? String(c.billAmount) : ''
        }))
      });
    }
  }, [isOpen, reparto]);

  const addCliente = () => setFormData(prev => ({
    ...prev,
    clients: [...prev.clients, {
      id: Date.now().toString() + Math.random(),
      clientName: '', billAmount: '',
      paymentStatus: 'pending', paymentAmount: 0, address: ''
    }]
  }));

  const removeCliente = (index) => setFormData(prev => ({
    ...prev, clients: prev.clients.filter((_, i) => i !== index)
  }));

  const updateCliente = (index, field, value) => setFormData(prev => ({
    ...prev,
    clients: prev.clients.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, [field]: value };
      // Sincronizar paymentAmount con el status
      if (field === 'paymentStatus') {
        if (value === 'paid') updated.paymentAmount = parseFloat(c.billAmount) || 0;
        if (value === 'pending') updated.paymentAmount = 0;
      }
      // Sincronizar billAmount: si se cambia el monto y el status es paid, actualizar paymentAmount
      if (field === 'billAmount' && c.paymentStatus === 'paid') {
        updated.paymentAmount = parseFloat(value) || 0;
      }
      return updated;
    })
  }));

  const handleSave = () => {
    if (formData.clients.length === 0) { alert('Debe agregar al menos un cliente'); return; }
    if (formData.clients.some(c => !c.clientName.trim() || parseFloat(c.billAmount) <= 0 || isNaN(parseFloat(c.billAmount)))) {
      alert('Todos los clientes deben tener nombre y monto válido'); return;
    }
    const mapped = formData.clients.map(c => ({
      ...c, clientName: c.clientName.trim(), billAmount: parseFloat(c.billAmount)
    }));
    onSave(reparto.id, { ...formData, clientes: mapped, clients: mapped });
    onClose();
  };

  const totalReparto = formData.clients.reduce((s, c) => s + (parseFloat(c.billAmount) || 0), 0);
  const pagados      = formData.clients.filter(c => c.paymentStatus === 'paid').length;
  const parciales    = formData.clients.filter(c => c.paymentStatus === 'partial').length;
  const pendientes   = formData.clients.filter(c => c.paymentStatus === 'pending').length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(700px, 96vw)',
        maxHeight: '90vh',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        zIndex: 1051,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #dde2e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Editar reparto
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
              {formatDateWithWeekday(reparto?.date)}
            </div>
          </div>
          <button onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#dde2e6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#6c757d' }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>

          {/* Fecha */}
          <ModalSection label="Fecha">
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: '5px' }}>
              Fecha del Reparto
            </label>
            <input type="date" className="form-control"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              style={{ borderRadius: '8px', fontSize: '0.9rem', maxWidth: '200px' }}
              required />
          </ModalSection>

          {/* Clientes */}
          <ModalSection
            label={`Clientes (${formData.clients.length})`}
            action={
              <button onClick={addCliente}
                className="d-inline-flex align-items-center gap-1"
                style={{ border: '1px dashed #ccd3d9', borderRadius: '8px', padding: '3px 10px', background: 'transparent', color: '#6c757d', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <IconPlus size={11} /> Agregar
              </button>
            }
          >
            {formData.clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#6c757d' }}>
                <div style={{ marginBottom: '6px', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
                  <IconUsers size={28} />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>Sin clientes</div>
                <div style={{ fontSize: '0.72rem', color: '#8a939c', marginTop: '3px' }}>Usá "+ Agregar" para sumar clientes</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.clients.map((cliente, index) => {
                  const sp = statusPill(cliente.paymentStatus);
                  return (
                    <div key={cliente.id || index} style={{
                      borderRadius: '10px', padding: '10px 12px',
                      background: '#f8f9fa',
                      borderLeft: `3px solid ${sp.color}`,
                      display: 'flex', flexDirection: 'column', gap: '8px',
                    }}>
                      {/* Fila 1: nombre + eliminar */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="text" className="form-control form-control-sm"
                          value={cliente.clientName}
                          onChange={(e) => updateCliente(index, 'clientName', e.target.value)}
                          placeholder="Nombre del cliente"
                          style={{ borderRadius: '7px', flex: 2 }} />
                        <input type="text" className="form-control form-control-sm"
                          value={cliente.address || ''}
                          onChange={(e) => updateCliente(index, 'address', e.target.value)}
                          placeholder="Dirección (opcional)"
                          style={{ borderRadius: '7px', flex: 2 }} />
                        <button onClick={() => removeCliente(index)}
                          className="d-inline-flex align-items-center justify-content-center"
                          style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
                          <IconX size={16} />
                        </button>
                      </div>

                      {/* Fila 2: monto + estado */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.65rem', color: '#6c757d', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Monto Boleta</label>
                          <input type="number" step="0.01" className="form-control form-control-sm"
                            value={cliente.billAmount}
                            onChange={(e) => updateCliente(index, 'billAmount', e.target.value)}
                            placeholder="0.00"
                            style={{ borderRadius: '7px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.65rem', color: '#6c757d', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Estado</label>
                          <select className="form-control form-control-sm"
                            value={cliente.paymentStatus}
                            onChange={(e) => updateCliente(index, 'paymentStatus', e.target.value)}
                            style={{ borderRadius: '7px', background: sp.bg, color: sp.color, fontWeight: 600, border: `1px solid ${sp.color}30` }}>
                            <option value="pending">Pendiente</option>
                            <option value="partial">Parcial</option>
                            <option value="paid">Pagado</option>
                          </select>
                        </div>
                        {cliente.paymentStatus === 'partial' && (
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.65rem', color: '#e6a817', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Monto Pagado</label>
                            <input type="number" step="0.01" className="form-control form-control-sm"
                              value={cliente.paymentAmount || ''}
                              onChange={(e) => updateCliente(index, 'paymentAmount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              max={parseFloat(cliente.billAmount) || undefined}
                              style={{ borderRadius: '7px', borderColor: '#e6a817' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ModalSection>

          {/* Resumen en tiempo real */}
          {formData.clients.length > 0 && (
            <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '12px 16px', borderLeft: '3px solid #6A8899' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Resumen
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Total</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#6A8899' }}>{formatCurrency(totalReparto)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Pagados</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#28a745' }}>{pagados}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Parcial</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: parciales > 0 ? '#e6a817' : '#6c757d' }}>{parciales}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d' }}>Pendientes</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: pendientes > 0 ? '#dc3545' : '#6c757d' }}>{pendientes}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #dde2e6', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ccd3d9', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </>
  );
};

export default EditRepartoModal;
