import React, { useState } from 'react';
import { formatCurrency } from '../utils/money';

const ClienteRow = ({ cliente, onUpdate, onDelete }) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editingAmount, setEditingAmount] = useState(cliente.billAmount.toString());
  const [paymentAmount, setPaymentAmount] = useState(cliente.paymentAmount || 0);
  const [paymentStatus, setPaymentStatus] = useState(cliente.paymentStatus || 'pending');

  // Manejar edición de monto
  const handleAmountEdit = () => {
    setIsEditingAmount(true);
    setEditingAmount(cliente.billAmount.toString());
  };

  const handleAmountSave = () => {
    const newAmount = parseFloat(editingAmount);
    if (!isNaN(newAmount) && newAmount > 0) {
      onUpdate(cliente.id, { billAmount: newAmount });
    }
    setIsEditingAmount(false);
  };

  const handleAmountCancel = () => {
    setEditingAmount(cliente.billAmount.toString());
    setIsEditingAmount(false);
  };

  // Manejar pagos
  const handlePaymentClick = () => {
    if (paymentStatus === 'pending') {
      setPaymentStatus('paid');
      setPaymentAmount(cliente.billAmount);
      onUpdate(cliente.id, { 
        paymentStatus: 'paid', 
        paymentAmount: cliente.billAmount 
      });
    } else {
      setPaymentStatus('pending');
      setPaymentAmount(0);
      onUpdate(cliente.id, { 
        paymentStatus: 'pending', 
        paymentAmount: 0 
      });
    }
  };

  const handlePaymentDoubleClick = () => {
    const partialAmount = prompt('Ingrese el monto del pago parcial:', paymentAmount);
    if (partialAmount !== null) {
      const amount = parseFloat(partialAmount);
      if (!isNaN(amount) && amount >= 0 && amount <= cliente.billAmount) {
        setPaymentAmount(amount);
        setPaymentStatus(amount === cliente.billAmount ? 'paid' : 'partial');
        onUpdate(cliente.id, { 
          paymentStatus: amount === cliente.billAmount ? 'paid' : 'partial',
          paymentAmount: amount 
        });
      }
    }
  };

  // Calcular saldo pendiente
  const saldoPendiente = cliente.billAmount - (cliente.paymentAmount || 0);

  return (
    <tr>
      <td>{cliente.clientName}</td>
      <td>{cliente.address || ''}</td>
      <td 
        style={{ cursor: 'pointer' }} 
        onClick={handleAmountEdit}
        title="Clic para editar monto"
      >
        {isEditingAmount ? (
          <input
            type="number"
            step="0.01"
            value={editingAmount}
            onChange={(e) => setEditingAmount(e.target.value)}
            onBlur={handleAmountSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAmountSave();
              if (e.key === 'Escape') handleAmountCancel();
            }}
            className="form-control form-control-sm"
            autoFocus
          />
        ) : (
          formatCurrency(cliente.billAmount)
        )}
      </td>
      <td 
        style={{ cursor: 'pointer' }}
        onClick={handlePaymentClick}
        onDoubleClick={handlePaymentDoubleClick}
        title="Clic para marcar pago completo; Doble clic para monto parcial"
      >
        {paymentStatus === 'paid' ? (
          <span className="text-success">✓</span>
        ) : paymentStatus === 'partial' ? (
          formatCurrency(paymentAmount)
        ) : (
          ''
        )}
      </td>
      <td className="no-print text-center">
        <button 
          className="btn btn-sm btn-link text-danger p-0"
          onClick={() => onDelete(cliente.id)}
          title="Eliminar cliente"
        >
          ❌
        </button>
      </td>
    </tr>
  );
};

export default ClienteRow;
