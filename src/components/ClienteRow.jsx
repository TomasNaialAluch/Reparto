import React, { useState } from 'react';
import { formatCurrency } from '../utils/money';

const paymentStyle = (status) => ({
  paid:    { bg: 'rgba(40,167,69,0.07)',   border: '#28a745' },
  partial: { bg: 'rgba(230,168,23,0.08)',  border: '#e6a817' },
  pending: { bg: 'white',                  border: '#f3f4f6' },
})[status] || { bg: 'white', border: '#f3f4f6' };

const ClienteRow = ({ cliente, onUpdate, onDelete }) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editingAmount, setEditingAmount] = useState(cliente.billAmount.toString());
  const [paymentAmount, setPaymentAmount] = useState(cliente.paymentAmount || 0);
  const [paymentStatus, setPaymentStatus] = useState(cliente.paymentStatus || 'pending');

  const handleAmountSave = () => {
    const newAmount = parseFloat(editingAmount);
    if (!isNaN(newAmount) && newAmount > 0) onUpdate(cliente.id, { billAmount: newAmount });
    setIsEditingAmount(false);
  };

  const handlePaymentClick = () => {
    const nextStatus = paymentStatus === 'pending' ? 'paid' : 'pending';
    const nextAmount = nextStatus === 'paid' ? cliente.billAmount : 0;
    setPaymentStatus(nextStatus);
    setPaymentAmount(nextAmount);
    onUpdate(cliente.id, { paymentStatus: nextStatus, paymentAmount: nextAmount });
  };

  const handlePaymentDoubleClick = () => {
    const partialAmount = prompt('Monto del pago parcial:', paymentAmount);
    if (partialAmount !== null) {
      const amount = parseFloat(partialAmount);
      if (!isNaN(amount) && amount >= 0 && amount <= cliente.billAmount) {
        const st = amount === cliente.billAmount ? 'paid' : 'partial';
        setPaymentAmount(amount);
        setPaymentStatus(st);
        onUpdate(cliente.id, { paymentStatus: st, paymentAmount: amount });
      }
    }
  };

  const ps = paymentStyle(paymentStatus);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
      gap: '8px',
      alignItems: 'center',
      padding: '8px',
      borderRadius: '8px',
      background: ps.bg,
      borderLeft: `3px solid ${ps.border}`,
      transition: 'background 0.15s',
    }}>

      {/* Nombre */}
      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {cliente.clientName}
      </div>

      {/* Dirección */}
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {cliente.address || '—'}
      </div>

      {/* Monto (editable) */}
      <div onClick={() => { setIsEditingAmount(true); setEditingAmount(cliente.billAmount.toString()); }}
        style={{ cursor: 'pointer' }} title="Clic para editar">
        {isEditingAmount ? (
          <input
            type="number" step="0.01" value={editingAmount} autoFocus
            onChange={(e) => setEditingAmount(e.target.value)}
            onBlur={handleAmountSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAmountSave(); if (e.key === 'Escape') setIsEditingAmount(false); }}
            style={{ width: '100%', border: '1px solid #6A8899', borderRadius: '6px', padding: '3px 6px', fontSize: '0.8rem', outline: 'none' }}
          />
        ) : (
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#212529' }}>
            {formatCurrency(cliente.billAmount)}
          </span>
        )}
      </div>

      {/* Pago */}
      <div
        onClick={handlePaymentClick}
        onDoubleClick={handlePaymentDoubleClick}
        title="Clic = pago completo · Doble clic = parcial"
        style={{ cursor: 'pointer', textAlign: 'center' }}
      >
        {paymentStatus === 'paid' ? (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(40,167,69,0.12)', color: '#28a745', padding: '3px 8px', borderRadius: '999px' }}>✓ Pagado</span>
        ) : paymentStatus === 'partial' ? (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(230,168,23,0.12)', color: '#e6a817', padding: '3px 8px', borderRadius: '999px' }}>{formatCurrency(paymentAmount)}</span>
        ) : (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'rgba(108,117,125,0.1)', color: '#6c757d', padding: '3px 10px', borderRadius: '999px' }}>Pendiente</span>
        )}
      </div>

      {/* Eliminar */}
      <button
        onClick={() => onDelete(cliente.id)}
        className="no-print"
        title="Eliminar"
        style={{ border: 'none', background: 'transparent', color: '#dc3545', fontSize: '1rem', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>
        ×
      </button>
    </div>
  );
};

export default ClienteRow;
