import React, { useRef } from 'react';
import { formatCurrency } from '../utils/money';

const PrintDocument = ({ data, type, onClose }) => {
  const printRef = useRef();

  const getStylesForType = (printType) => {
    // Estilos por defecto para todas las impresiones
    const baseStyles = `
      @page {
        size: A4 portrait;
        margin: 1.5cm 2cm;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 15px;
        font-size: 11pt;
        line-height: 1.4;
        color: #000;
      }
      
      .print-header {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 2px solid #000;
      }
      
      .print-date {
        text-align: right;
        font-size: 9pt;
        color: #666;
        margin-bottom: 10px;
      }
      
      .print-section {
        margin: 10px 0;
      }
      
      .print-section-title {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 8px;
        color: #333;
      }
      
      .print-item {
        margin: 4px 0;
        padding-left: 15px;
        font-size: 10pt;
      }
      
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
      }
      
      .print-table th,
      .print-table td {
        border: 1px solid #000;
        padding: 6px 8px;
        text-align: left;
        font-size: 10pt;
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
        padding: 8px 12px;
        margin: 10px 0;
        border-left: 3px solid #007bff;
        font-weight: bold;
        font-size: 11pt;
      }
      
      .print-total {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin: 15px 0;
        padding: 12px;
        background-color: #e9ecef;
        border: 2px solid #000;
      }
      
      .print-message {
        text-align: center;
        font-size: 10pt;
        margin: 10px 0;
        padding: 8px;
        background-color: #fff3cd;
        border: 1px solid #ffc107;
      }
      
      .status-paid {
        color: green;
        font-weight: bold;
      }
      
      .status-pending {
        color: orange;
        font-weight: bold;
      }
      
      .text-end {
        text-align: right;
      }
      
      .text-muted {
        color: #777;
      }
    `;

    // Estilos específicos para empleados (compactos, alineados a la izquierda)
    const empleadoStyles = `
      @page {
        size: A4 portrait;
        margin: 0.5cm 1cm;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 10px;
        font-size: 8pt;
        line-height: 1.2;
        color: #000;
        max-width: 50%;
      }
      
      .print-header {
        text-align: left;
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #000;
      }
      
      .print-date {
        text-align: left;
        font-size: 7pt;
        color: #666;
        margin-bottom: 8px;
      }
      
      .print-section {
        margin: 5px 0;
        border-top: 1px solid #eee;
        padding-top: 5px;
      }
      
      .print-section-title {
        font-size: 9pt;
        font-weight: bold;
        margin-bottom: 4px;
        color: #333;
      }
      
      .print-item {
        margin: 2px 0;
        padding-left: 10px;
        font-size: 8pt;
      }
      
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      
      .print-table th,
      .print-table td {
        border: 1px solid #000;
        padding: 10px 12px;
        text-align: left;
        font-size: 11pt;
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
        padding: 4px 8px;
        margin: 3px 0;
        border-left: 2px solid #007bff;
        font-weight: bold;
        font-size: 8pt;
      }
      
      .print-total {
        font-size: 10pt;
        font-weight: bold;
        text-align: left;
        margin: 5px 0;
        padding: 6px;
        background-color: #e9ecef;
        border: 1px solid #000;
        max-width: 200px;
      }
      
      .print-message {
        text-align: center;
        font-size: 11pt;
        margin: 15px 0;
        padding: 12px;
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
      }
      
      .status-paid {
        color: green;
        font-weight: bold;
      }
      
      .status-pending {
        color: orange;
        font-weight: bold;
      }
      
      .text-end {
        text-align: right;
      }
      
      .text-muted {
        color: #777;
      }
    `;

    return printType === 'empleado' ? empleadoStyles : baseStyles;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = printRef.current.innerHTML;
    const styles = getStylesForType(type);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Impresión - Mi Reparto</title>
        <style>
          ${styles}
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const renderRepartoContent = () => {
    const { clientes, fecha } = data;
    
    const subtotal = clientes.reduce((sum, c) => sum + (c.billAmount || 0), 0);
    const totalPagado = clientes.reduce((sum, c) => sum + (c.paymentAmount || 0), 0);
    const totalPendiente = subtotal - totalPagado;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Resumen de Reparto
        </div>
        
        <div className="print-date">
          Fecha: {new Date(fecha).toLocaleDateString('es-AR')}
        </div>
        
        {/* Clientes */}
        {clientes && clientes.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Clientes</div>
            {clientes.map((cliente, i) => (
              <div key={i} className="print-item">
                {cliente.clientName}: {formatCurrency(parseFloat(cliente.billAmount) || 0)} - 
                Pagado: {formatCurrency(parseFloat(cliente.paymentAmount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        {/* Totales */}
        <div className="print-section">
          <div className="print-section-title">Totales</div>
          <div className="print-subtotal">
            Subtotal: {formatCurrency(subtotal)}
          </div>
          <div className="print-subtotal">
            Total Pagado: {formatCurrency(totalPagado)}
          </div>
          <div className="print-total">
            Total Pendiente: {formatCurrency(totalPendiente)}
          </div>
        </div>
      </div>
    );
  };

  const renderTransferenciaContent = () => {
    const { 
      clientName, 
      transferencias, 
      tickets, 
      totalTransferencias,
      totalTickets,
      balance
    } = data;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Resumen de Transferencia
        </div>
        
        <div className="print-date">
          Fecha: {new Date().toLocaleDateString('es-AR')}
        </div>
        
        <div className="print-section">
          <div className="print-section-title">Cliente: {clientName}</div>
        </div>
        
        {/* Transferencias */}
        {transferencias && transferencias.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Transferencias Recibidas:</div>
            {transferencias.map((t, i) => (
              <div key={i} className="print-item">
                {t.descripcion}: {formatCurrency(parseFloat(t.monto) || 0)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Transferencias: {formatCurrency(totalTransferencias || 0)}
            </div>
          </div>
        )}
        
        {/* Tickets */}
        {tickets && tickets.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Tickets Vendidos:</div>
            {tickets.map((t, i) => (
              <div key={i} className="print-item">
                {t.fecha}: {formatCurrency(parseFloat(t.monto) || 0)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Tickets: {formatCurrency(totalTickets || 0)}
            </div>
          </div>
        )}
        
        {/* Balance */}
        <div className="print-section">
          <div className="print-total">
            Balance Final: {formatCurrency(balance || 0)}
          </div>
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
                {v.date}: {formatCurrency(parseFloat(v.amount) || 0)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Ventas: {formatCurrency(ventas.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0))}
            </div>
          </div>
        )}
        
        {/* Plata a favor */}
        {plataFavor && plataFavor.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Plata a Favor:</div>
            {plataFavor.map((p, i) => (
              <div key={i} className="print-item">
                {p.date}: {formatCurrency(parseFloat(p.amount) || 0)}
              </div>
            ))}
          </div>
        )}
        
        {/* Ingresos */}
        <div className="print-section">
          <div className="print-section-title">Ingresos:</div>
          {efectivo > 0 && (
            <div className="print-item">
              Efectivo: {formatCurrency(efectivo)}
            </div>
          )}
          {cheques > 0 && (
            <div className="print-item">
              Cheques: {formatCurrency(cheques)}
            </div>
          )}
          {transferencias > 0 && (
            <div className="print-item">
              Transferencias: {formatCurrency(transferencias)}
            </div>
          )}
          <div className="print-subtotal">
            Total Ingresos: {formatCurrency(totalIngresos || 0)}
          </div>
        </div>
        
        {/* Balance Final */}
        <div className="print-section">
          <div className="print-total">
            Balance Final: {formatCurrency(finalBalance || 0)}
          </div>
        </div>
      </div>
    );
  };

  const renderEmpleadosContent = () => {
    const { empleados = [], adelantos = [], fechaInicio } = data || {};
    
    // Calcular totales
    const totalSueldos = empleados.reduce((sum, emp) => sum + (emp.sueldoSemanal || 0), 0);
    const totalAdelantos = adelantos.reduce((sum, adel) => sum + adel.monto, 0);
    const saldoPendiente = totalAdelantos - totalSueldos;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Comprobante de Empleados
        </div>
        
        <div className="print-date">
          Semana del {new Date(fechaInicio).toLocaleDateString('es-AR')}
        </div>
        
        {/* Resumen general */}
        <div className="print-section">
          <div className="print-section-title">Resumen General</div>
          <div className="print-table">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td><strong>Total Sueldos Semanales:</strong></td>
                  <td><strong>{formatCurrency(totalSueldos)}</strong></td>
                </tr>
                <tr>
                  <td><strong>Total Adelantos:</strong></td>
                  <td><strong>{formatCurrency(totalAdelantos)}</strong></td>
                </tr>
                <tr className={saldoPendiente >= 0 ? 'table-success' : 'table-warning'}>
                  <td><strong>Saldo Pendiente:</strong></td>
                  <td><strong>{formatCurrency(Math.abs(saldoPendiente))} {saldoPendiente >= 0 ? '(A favor del empleado)' : '(Debe el empleado)'}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Detalle de empleados */}
        <div className="print-section">
          <div className="print-section-title">Detalle de Empleados</div>
          <div className="print-table">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Sueldo Semanal</th>
                  <th>Adelantos</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((empleado, index) => {
                  const adelantosEmpleado = adelantos.filter(a => a.empleado === empleado.nombre);
                  const totalAdelantosEmpleado = adelantosEmpleado.reduce((sum, a) => sum + a.monto, 0);
                  const saldoEmpleado = totalAdelantosEmpleado - empleado.sueldoSemanal;
                  const estaPagado = totalAdelantosEmpleado >= empleado.sueldoSemanal;
                  
                  return (
                    <tr key={index}>
                      <td><strong>{empleado.nombre}</strong></td>
                      <td>{formatCurrency(empleado.sueldoSemanal)}</td>
                      <td>{formatCurrency(totalAdelantosEmpleado)}</td>
                      <td className={saldoEmpleado >= 0 ? 'text-success' : 'text-warning'}>
                        {formatCurrency(Math.abs(saldoEmpleado))} {saldoEmpleado >= 0 ? '(A favor)' : '(Debe)'}
                      </td>
                      <td>
                        <span className={`badge ${estaPagado ? 'bg-success' : 'bg-warning'}`}>
                          {estaPagado ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Detalle de adelantos */}
        {adelantos.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Detalle de Adelantos</div>
            <div className="print-table">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Día</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {adelantos.map((adelanto, index) => (
                    <tr key={index}>
                      <td><strong>{adelanto.empleado}</strong></td>
                      <td>{adelanto.dia}</td>
                      <td>{adelanto.descripcion}</td>
                      <td>{formatCurrency(adelanto.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Mensaje final */}
        <div className="print-message">
          <p><strong>Comprobante generado automáticamente</strong></p>
          <p>Este documento resume la situación de empleados y adelantos para la semana correspondiente.</p>
        </div>
        
      </div>
    );
  };

  const renderEmpleadoContent = () => {
    const { empleado, adelantos = [], fechaInicio } = data || {};
    
    // Validar que tenemos datos del empleado
    if (!empleado) {
      return <div>Error: No se encontraron datos del empleado</div>;
    }
    
    // Calcular totales para este empleado específico
    const totalSueldo = empleado.sueldoSemanal || 0;
    const totalAdelantos = adelantos.reduce((sum, adel) => sum + adel.monto, 0);
    const saldoPendiente = totalAdelantos - totalSueldo;
    const estaPagado = totalAdelantos >= totalSueldo;
    
    return (
      <div ref={printRef}>
        <div className="print-header">
          Comprobante de {empleado.nombre}
        </div>
        
        <div className="print-date">
          Semana del {new Date(fechaInicio).toLocaleDateString('es-AR')}
        </div>
        
        {/* Información del empleado */}
        <div className="print-section">
          <div className="print-item">
            <strong>Sueldo Semanal:</strong> {formatCurrency(totalSueldo)}
          </div>
          {!estaPagado && (
            <div className="print-item" style={{ color: '#d63384', fontWeight: 'bold' }}>
              <strong>Falta Pagar:</strong> {formatCurrency(Math.abs(saldoPendiente))}
            </div>
          )}
          {estaPagado && totalAdelantos > totalSueldo && (
            <div className="print-item" style={{ color: '#198754', fontWeight: 'bold' }}>
              <strong>A Favor:</strong> {formatCurrency(Math.abs(saldoPendiente))}
            </div>
          )}
        </div>
        
        {/* Detalle de adelantos */}
        {adelantos.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Pagos por Día</div>
            {adelantos.map((adelanto, index) => (
              <div key={index} className="print-item">
                {adelanto.dia} - {adelanto.descripcion || 'Adelanto'}: {formatCurrency(adelanto.monto)}
              </div>
            ))}
            <div className="print-subtotal">
              Total Pagado: {formatCurrency(totalAdelantos)}
            </div>
          </div>
        )}
        
        {/* Estado final */}
        <div className="print-section">
          <div className="print-total">
            {estaPagado ? '✅ PAGADO COMPLETAMENTE' : '⚠️ PENDIENTE DE PAGO'}
          </div>
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
             type === 'empleados' ? renderEmpleadosContent() :
             type === 'empleado' ? renderEmpleadoContent() :
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