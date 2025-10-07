import React, { useState, useRef } from 'react';

const ClientRow = ({ 
  reparto, 
  onPaymentChange, 
  onAmountChange, 
  onDelete,
  formatCurrency 
}) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editingAmount, setEditingAmount] = useState('');
  const clickTimerRef = useRef(null);

  const handlePaymentClick = () => {
    if (clickTimerRef.current === null) {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        const newStatus = reparto.paymentStatus === 'pending' ? 'paid' : 'pending';
        const newAmount = newStatus === 'paid' ? reparto.billAmount : 0;
        onPaymentChange(reparto.id, newStatus, newAmount);
      }, 200);
    }
  };

  const handlePaymentDoubleClick = (e) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setIsEditingAmount(true);
    setEditingAmount(reparto.paymentAmount || '');
  };

  const handleAmountSubmit = () => {
    const amount = parseFloat(editingAmount);
    if (!isNaN(amount) && amount >= 0) {
      const status = amount >= reparto.billAmount ? 'paid' : amount > 0 ? 'partial' : 'pending';
      onPaymentChange(reparto.id, status, amount);
    }
    setIsEditingAmount(false);
  };

  const handleAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAmountSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingAmount(false);
    }
  };

  const handleAmountBlur = () => {
    handleAmountSubmit();
  };

  const handleAmountDoubleClick = () => {
    setIsEditingAmount(true);
    setEditingAmount(reparto.billAmount);
  };

  const handleAmountKeyDownEdit = (e) => {
    if (e.key === 'Enter') {
      const amount = parseFloat(editingAmount);
      if (!isNaN(amount) && amount > 0) {
        onAmountChange(reparto.id, amount);
      }
      setIsEditingAmount(false);
    } else if (e.key === 'Escape') {
      setIsEditingAmount(false);
    }
  };

  const renderPaymentCell = () => {
    if (isEditingAmount) {
      return (
        <input
          type="number"
          step="0.01"
          className="payment-input form-control"
          value={editingAmount}
          onChange={(e) => setEditingAmount(e.target.value)}
          onBlur={handleAmountBlur}
          onKeyDown={handleAmountKeyDown}
          autoFocus
          style={{ width: '80px' }}
        />
      );
    }

    if (reparto.paymentStatus === 'paid') {
      return (
        <span className="paid" style={{ fontWeight: 'bold', color: '#E63946' }}>
          ✓
        </span>
      );
    } else if (reparto.paymentStatus === 'partial') {
      return formatCurrency(reparto.paymentAmount);
    } else {
      return '';
    }
  };

  const renderAmountCell = () => {
    if (isEditingAmount && editingAmount === reparto.billAmount) {
      return (
        <input
          type="number"
          step="0.01"
          className="payment-input form-control"
          value={editingAmount}
          onChange={(e) => setEditingAmount(e.target.value)}
          onKeyDown={handleAmountKeyDownEdit}
          autoFocus
          style={{ width: '80px' }}
        />
      );
    }

    return (
      <span 
        onDoubleClick={handleAmountDoubleClick}
        style={{ cursor: 'pointer' }}
        title="Doble clic para editar"
      >
        {formatCurrency(reparto.billAmount)}
      </span>
    );
  };

  return (
    <tr>
      <td>{reparto.clientName}</td>
      <td>{reparto.address || ''}</td>
      <td>{renderAmountCell()}</td>
      <td 
        style={{ cursor: 'pointer' }}
        onClick={handlePaymentClick}
        onDoubleClick={handlePaymentDoubleClick}
        title="Clic para marcar pago completo; Doble clic para ingresar monto parcial"
      >
        {renderPaymentCell()}
      </td>
      <td className="no-print text-center">
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => onDelete(reparto.id)}
          title="Eliminar cliente"
        >
          🗑️
        </button>
      </td>
    </tr>
  );
};

export default ClientRow;


