import React from 'react';
import { formatCurrency, parseCurrencyValue } from '../utils/money';

const PrintSaldoCliente = ({ cliente }) => {
  if (!cliente) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      maxHeight: '50vh',
      overflow: 'hidden'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '15px',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        Resumen de Cuenta - {cliente.clientName}
      </h2>

      {/* Boletas */}
      {cliente.boletas && cliente.boletas.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Boletas:</strong>
          <div style={{ marginLeft: '10px' }}>
            {cliente.boletas.map((b, i) => (
              <div key={i} style={{ fontSize: '11px' }}>
                {formatDate(b.date)} - {formatCurrency(parseCurrencyValue(b.amount))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagos */}
      {cliente.efectivo && cliente.efectivo.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Pagos en Efectivo:</strong>
          <div style={{ marginLeft: '10px' }}>
            {cliente.efectivo.map((p, i) => (
              <div key={i} style={{ fontSize: '11px' }}>
                {formatDate(p.date)} - {formatCurrency(parseCurrencyValue(p.amount))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plata a Favor */}
      {cliente.plataFavor && cliente.plataFavor.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Plata a Favor:</strong>
          <div style={{ marginLeft: '10px' }}>
            {cliente.plataFavor.map((p, i) => (
              <div key={i} style={{ fontSize: '11px' }}>
                {formatDate(p.date)} - {formatCurrency(parseCurrencyValue(p.amount))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saldo Final */}
      <div style={{ 
        borderTop: '1px solid #000',
        paddingTop: '8px',
        marginTop: '10px',
        textAlign: 'center'
      }}>
        <strong style={{ fontSize: '14px' }}>
          Saldo Final: {formatCurrency(cliente.finalBalance || 0)}
        </strong>
      </div>
    </div>
  );
};

export default PrintSaldoCliente;
