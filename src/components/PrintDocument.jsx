import React, { useRef } from 'react';
import { formatCurrency } from '../utils/money';

const PrintDocument = ({ data, type, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Impresión - Mi Reparto</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.5cm 2cm;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 10px;
            font-size: 8pt;
            line-height: 1.3;
            color: #000;
          }
          
          .print-header {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 5px;
            padding-bottom: 3px;
            border-bottom: 2px solid #000;
          }
          
          .print-date {
            text-align: right;
            font-size: 7pt;
            color: #666;
            margin-bottom: 5px;
          }
          
          .print-section {
            margin: 5px 0;
          }
          
          .print-section-title {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 2px;
            color: #333;
          }
          
          .print-item {
            margin: 2px 0;
            padding-left: 10px;
            font-size: 7pt;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3px 0;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 3px 6px;
            text-align: left;
            font-size: 7pt;
          }
          
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .print-table td.number {
            text-align: right;
          }
          
          .print-subtotal {
            background-color: #f8f9fa;
            padding: 4px 6px;
            margin: 5px 0;
            border-left: 3px solid #007bff;
            font-weight: bold;
            font-size: 8pt;
          }
          
          .print-total {
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
            margin: 8px 0;
            padding: 6px;
            background-color: #e9ecef;
            border: 2px solid #000;
          }
          
          .print-message {
            text-align: center;
            font-size: 8pt;
            margin: 5px 0;
            padding: 4px;
            background-color: #fff3cd;
            border: 1px solid #ffc107;
          }
          
          .status-paid {
            color: green;
            font-weight: bold;
          }
          
          .status-pending {
            color: red;
            font-weight: bold;
          }
          
          .status-partial {
            color: orange;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const renderRepartoContent = () => {
    const { clientes, fecha } = data;
    
    const subtotal = clientes.reduce((sum, c) => sum + (c.billAmount || 0), 0);
    const totalPagado = clientes.reduce((sum, c) => sum + (c.paymentAmount || 0), 0);
    const totalPendiente = subtotal - totalPagado;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Lista de Reparto
        </div>
        
        <div className="print-date">
          Fecha: {new Date(fecha).toLocaleDateString('es-AR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '45%' }}>Cliente</th>
              <th style={{ width: '25%' }}>Monto</th>
              <th style={{ width: '25%' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente, index) => {
              const pagado = cliente.paymentAmount || 0;
              const monto = cliente.billAmount || 0;
              let estado = 'Pendiente';
              let estadoClass = 'status-pending';
              
              if (pagado >= monto) {
                estado = 'Pagado';
                estadoClass = 'status-paid';
              } else if (pagado > 0) {
                estado = `Parcial (${formatCurrency(monto - pagado)} pend.)`;
                estadoClass = 'status-partial';
              }
              
              return (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{cliente.clientName}</td>
                  <td className="number">{formatCurrency(monto)}</td>
                  <td className={estadoClass}>{estado}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="print-subtotal">
          <div>Total del Día: {formatCurrency(subtotal)}</div>
          <div>Total Cobrado: {formatCurrency(totalPagado)}</div>
          <div>Total Pendiente: {formatCurrency(totalPendiente)}</div>
        </div>
        
        {totalPendiente > 0 ? (
          <div className="print-message">
            Quedan {clientes.filter(c => (c.paymentAmount || 0) < (c.billAmount || 0)).length} clientes con pagos pendientes
          </div>
        ) : (
          <div className="print-message" style={{ backgroundColor: '#d4edda', borderColor: '#28a745' }}>
            ¡Todos los clientes han pagado!
          </div>
        )}
        
      </div>
    );
  };

  const renderTransferenciaContent = () => {
    const {
      nombreCliente,
      transferencias,
      boletas,
      totalTransferencias,
      totalBoletas,
      saldoFinal
    } = data;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Resumen de Transferencias
        </div>
        
        <div className="print-date">
          Fecha: {new Date().toLocaleDateString('es-AR')}
        </div>
        
        <div className="print-section">
          <div className="print-section-title">Cliente: {nombreCliente}</div>
        </div>
        
        {/* Transferencias Recibidas */}
        {transferencias && transferencias.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Transferencias Recibidas:</div>
            {transferencias.map((t, i) => (
              <div key={i} className="print-item">
                {t.descripcion || `Transferencia ${i + 1}`}: {formatCurrency(parseFloat(t.monto) || 0)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Transferencias: {formatCurrency(totalTransferencias || 0)}
            </div>
          </div>
        )}
        
        {/* Boletas */}
        {boletas && boletas.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Boletas Vendidas:</div>
            {boletas.map((b, i) => (
              <div key={i} className="print-item">
                Boleta {i + 1} ({b.fecha}): {formatCurrency(parseFloat(b.monto) || 0)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Boletas: {formatCurrency(totalBoletas || 0)}
            </div>
          </div>
        )}
        
        {/* Saldo Final */}
        <div className="print-total">
          {saldoFinal > 0 ? (
            <>
              <div>Saldo a favor del cliente: {formatCurrency(saldoFinal)}</div>
              <div style={{ fontSize: '8pt', marginTop: '3px' }}>
                Le debes {formatCurrency(saldoFinal)} a {nombreCliente}
              </div>
            </>
          ) : saldoFinal < 0 ? (
            <>
              <div>Saldo a tu favor: {formatCurrency(Math.abs(saldoFinal))}</div>
              <div style={{ fontSize: '8pt', marginTop: '3px' }}>
                {nombreCliente} te debe {formatCurrency(Math.abs(saldoFinal))}
              </div>
            </>
          ) : (
            <>
              <div>Saldo Final: {formatCurrency(0)}</div>
              <div style={{ fontSize: '8pt', marginTop: '3px' }}>
                Cuentas saldadas
              </div>
            </>
          )}
        </div>
        
      </div>
    );
  };

  const renderSaldoContent = () => {
    const { 
      clientName, 
      boletas, 
      ventas, 
      plataFavor, 
      efectivo, 
      cheques, 
      transferencias,
      totalBoletas,
      totalIngresos,
      finalBalance
    } = data;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Resumen de Cuenta
        </div>
        
        <div className="print-date">
          Fecha: {new Date().toLocaleDateString('es-AR')}
        </div>
        
        <div className="print-section">
          <div className="print-section-title">Cliente: {clientName}</div>
        </div>
        
        {/* Boletas */}
        {boletas && boletas.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Boletas Vendidas por {clientName}:</div>
            {boletas.map((b, i) => (
              <div key={i} className="print-item">
                Boleta {i + 1}: {b.date} - {formatCurrency(parseFloat(b.amount) || 0)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Boletas: {formatCurrency(totalBoletas || 0)}
            </div>
          </div>
        )}
        
        {/* Ventas */}
        {ventas && ventas.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Ventas a {clientName}:</div>
            {ventas.map((v, i) => (
              <div key={i} className="print-item">
                Venta {i + 1}: {v.date} - {formatCurrency(parseFloat(v.amount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        {/* Plata a Favor */}
        {plataFavor && plataFavor.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Plata a Favor:</div>
            {plataFavor.map((p, i) => (
              <div key={i} className="print-item">
                {formatCurrency(parseFloat(p.amount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        {/* Efectivo */}
        {efectivo && efectivo.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Pagos en Efectivo:</div>
            {efectivo.map((e, i) => (
              <div key={i} className="print-item">
                {formatCurrency(parseFloat(e.amount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        {/* Cheques */}
        {cheques && cheques.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Cheques:</div>
            {cheques.map((c, i) => (
              <div key={i} className="print-item">
                Cheque {c.id}: {formatCurrency(parseFloat(c.amount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        {/* Transferencias */}
        {transferencias && transferencias.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Transferencias:</div>
            {transferencias.map((t, i) => (
              <div key={i} className="print-item">
                {formatCurrency(parseFloat(t.amount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        <div className="print-subtotal">
          Total Ingresos del Usuario: {formatCurrency(totalIngresos || 0)}
        </div>
        
        <div className="print-total">
          {finalBalance > 0 ? (
            <>
              <div>Saldo Final: {formatCurrency(finalBalance)}</div>
              <div style={{ fontSize: '8pt', marginTop: '3px' }}>
                {clientName} te debe {formatCurrency(finalBalance)}
              </div>
            </>
          ) : finalBalance < 0 ? (
            <>
              <div>Saldo Final: {formatCurrency(Math.abs(finalBalance))}</div>
              <div style={{ fontSize: '8pt', marginTop: '3px' }}>
                Tú le debes {formatCurrency(Math.abs(finalBalance))} a {clientName}
              </div>
            </>
          ) : (
            <>
              <div>Saldo Final: {formatCurrency(0)}</div>
              <div style={{ fontSize: '8pt', marginTop: '3px' }}>
                Cuentas saldadas
              </div>
            </>
          )}
        </div>
        
      </div>
    );
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Vista Previa de Impresión</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {type === 'reparto' ? renderRepartoContent() : 
             type === 'transferencia' ? renderTransferenciaContent() : 
             renderSaldoContent()}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <i className="fas fa-print me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDocument;

