import React from 'react';
import { formatCurrency } from '../utils/money';

const PrintReparto = ({ clientes, date }) => {
  if (!clientes || clientes.length === 0) return null;

  const subtotal = clientes.reduce((sum, cliente) => sum + (cliente.billAmount || 0), 0);
  const totalPendiente = clientes.reduce((sum, cliente) => {
    const pagado = cliente.paymentAmount || 0;
    return sum + (cliente.billAmount - pagado);
  }, 0);

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
        Clientes del Día - {date}
      </h2>

      {/* Tabla de clientes */}
      <table style={{ 
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>
              Cliente
            </th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
              Monto
            </th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente, index) => (
            <tr key={cliente.id || index}>
              <td style={{ border: '1px solid #000', padding: '4px' }}>
                {cliente.clientName}
              </td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                {formatCurrency(cliente.billAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ 
        borderTop: '1px solid #000',
        paddingTop: '8px',
        textAlign: 'right'
      }}>
        <div style={{ fontSize: '12px', marginBottom: '2px' }}>
          <strong>Subtotal: {formatCurrency(subtotal)}</strong>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
          Total Pendiente: {formatCurrency(totalPendiente)}
        </div>
      </div>
    </div>
  );
};

export default PrintReparto;
