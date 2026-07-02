import React, { useRef, useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyValue } from '../utils/money';
import { IconX, IconPrinter } from './gestionSemanal/icons';

const PrintDocument = ({ data, type, onClose }) => {
  const printRef = useRef();
  const modalBodyRef = useRef();
  const [showTopIndicator, setShowTopIndicator] = useState(false);
  const [showBottomIndicator, setShowBottomIndicator] = useState(true);
  const [anchoImpresion, setAnchoImpresion] = useState('completo');
  const esEmpleado = type === 'empleado' || type === 'empleados';

  useEffect(() => {
    const modalBody = modalBodyRef.current;
    if (!modalBody) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = modalBody;
      
      // Mostrar indicador superior solo si no está en la parte superior
      setShowTopIndicator(scrollTop > 10);
      
      // Mostrar indicador inferior solo si no está en la parte inferior
      setShowBottomIndicator(scrollTop < scrollHeight - clientHeight - 10);
    };

    modalBody.addEventListener('scroll', handleScroll);
    
    // Verificar estado inicial
    handleScroll();

    return () => {
      modalBody.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getStylesForType = (printType, ancho = 'completo') => {
    const esMitad = ancho === 'mitad';
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
        ${esMitad ? 'max-width: 50%;' : ''}
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

    const duplicadoExtra = ancho === 'duplicado' ? `
      @page { size: A4 landscape; margin: 1cm 1.2cm; }
      body { padding: 0; margin: 0; }
      .duplicado-wrapper {
        display: flex;
        flex-direction: row;
        width: 100%;
        min-height: 100%;
        gap: 0;
      }
      .duplicado-half {
        flex: 1;
        overflow: hidden;
        padding: 6px 10px;
        box-sizing: border-box;
        font-size: 8.5pt;
        line-height: 1.3;
      }
      .duplicado-half .print-header { font-size: 12pt; margin-bottom: 6px; padding-bottom: 4px; }
      .duplicado-half .print-date { font-size: 8pt; margin-bottom: 6px; }
      .duplicado-half .print-section-title { font-size: 9.5pt; margin-bottom: 4px; }
      .duplicado-half .print-item { font-size: 8.5pt; margin: 2px 0; padding-left: 10px; }
      .duplicado-half .print-subtotal { padding: 4px 8px; margin: 4px 0; font-size: 8.5pt; }
      .duplicado-half .print-total { font-size: 10pt; padding: 7px; margin: 7px 0; }
      .duplicado-cut {
        width: 0;
        border-left: 1.5px dashed #bbb;
        margin: 0 6px;
        flex-shrink: 0;
        position: relative;
      }
      .duplicado-cut::before {
        content: '✂';
        position: absolute;
        top: 0;
        left: -7px;
        font-size: 9pt;
        color: #aaa;
      }
    ` : '';

    return printType === 'empleado' ? empleadoStyles : baseStyles + duplicadoExtra;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = printRef.current.innerHTML;
    const styles = getStylesForType(type, anchoImpresion);

    let body;
    if (anchoImpresion === 'duplicado') {
      body = `
        <div class="duplicado-wrapper">
          <div class="duplicado-half">${content}</div>
          <div class="duplicado-cut"></div>
          <div class="duplicado-half">${content}</div>
        </div>
      `;
    } else {
      body = content;
    }

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
        ${body}
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
          Resumen de Transferencia
        </div>
        
        <div className="print-date">
          Fecha: {new Date().toLocaleDateString('es-AR')}
        </div>
        
        <div className="print-section">
          <div className="print-section-title">Cliente: {nombreCliente}</div>
        </div>
        
        {/* Transferencias */}
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
        
        {/* Balance */}
        <div className="print-section">
          <div className="print-total">
            Balance Final: {formatCurrency(saldoFinal || 0)}
          </div>
          <div className="print-item" style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>
            {(() => {
              const saldo = saldoFinal || 0;
              if (saldo > 0) {
                return `Le debes ${formatCurrency(saldo)} a ${nombreCliente}`;
              } else if (saldo < 0) {
                return `${nombreCliente} te debe ${formatCurrency(Math.abs(saldo))}`;
              } else {
                return 'Las cuentas están saldadas. No hay deudas pendientes.';
              }
            })()}
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
      deudas,
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
          Resumen de Cuenta con {clientName}
        </div>
        
        <div className="print-date">
          Fecha: {new Date().toLocaleDateString('es-AR')}
        </div>
        
        <div className="print-section">
          <div className="print-section-title">Cliente: {clientName}</div>
        </div>
        
        {/* Deuda */}
        {deudas && deudas.length > 0 && (
          <div className="print-section">
            <div className="print-section-title" style={{ color: '#dc3545' }}>Deuda pendiente:</div>
            {deudas.map((d, i) => (
              <div key={i} className="print-item">
                Deuda {i + 1}{d.date ? `: ${d.date}` : ''} - {formatCurrency(parseCurrencyValue(d.amount))}
              </div>
            ))}
            <div className="print-subtotal" style={{ borderLeft: '3px solid #dc3545', paddingLeft: '16px' }}>
              Total Deuda: {formatCurrency(deudas.reduce((sum, d) => sum + parseCurrencyValue(d.amount), 0))}
            </div>
          </div>
        )}

        {/* Boletas */}
        {boletas && boletas.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Boletas Vendidas por {clientName}:</div>
            {boletas.map((b, i) => (
              <div key={i} className="print-item">
                Boleta {i + 1}: {b.date} - {formatCurrency(parseCurrencyValue(b.amount))}
              </div>
            ))}
            <div className="print-subtotal">
              Total Boletas: {formatCurrency(boletas.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0))}
            </div>
          </div>
        )}
        
        {/* Ventas */}
        {ventas && ventas.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Ventas a {clientName}:</div>
            {ventas.map((v, i) => (
              <div key={i} className="print-item">
                {v.date}: {formatCurrency(parseCurrencyValue(v.amount))}
              </div>
            ))}
            <div className="print-subtotal">
              Total Ventas: {formatCurrency(ventas.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0))}
            </div>
          </div>
        )}
        
        {/* Plata a favor */}
        {plataFavor && plataFavor.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Plata a Favor:</div>
            {plataFavor.map((p, i) => (
              <div key={i} className="print-item">
                Plata {i + 1}{p.date ? `: ${p.date}` : ''} - {formatCurrency(parseCurrencyValue(p.amount))}
              </div>
            ))}
            <div className="print-subtotal">
              Total Plata a Favor: {formatCurrency(plataFavor.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0))}
            </div>
          </div>
        )}

        {/* Efectivo */}
        {efectivo && efectivo.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Pagos en Efectivo:</div>
            {efectivo.map((e, i) => (
              <div key={i} className="print-item">
                {e.date}: {formatCurrency(parseCurrencyValue(e.amount))}
              </div>
            ))}
            <div className="print-subtotal">
              Total Efectivo: {formatCurrency(efectivo.reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0))}
            </div>
          </div>
        )}

        {/* Cheques */}
        {cheques && cheques.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Pagos con Cheque:</div>
            {cheques.map((c, i) => (
              <div key={i} className="print-item">
                Cheque {c.id}: {formatCurrency(parseCurrencyValue(c.amount))}
              </div>
            ))}
            <div className="print-subtotal">
              Total Cheques: {formatCurrency(cheques.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0))}
            </div>
          </div>
        )}

        {/* Transferencias */}
        {transferencias && transferencias.length > 0 && (
          <div className="print-section">
            <div className="print-section-title">Pagos por Transferencia:</div>
            {transferencias.map((t, i) => (
              <div key={i} className="print-item">
                {t.date}: {formatCurrency(parseCurrencyValue(t.amount))}
              </div>
            ))}
            <div className="print-subtotal">
              Total Transferencias: {formatCurrency(transferencias.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0))}
            </div>
          </div>
        )}

        {/* Resumen de Pagos */}
        <div className="print-section">
          <div className="print-subtotal">
            Total Ingresos: {formatCurrency((
              (ventas?.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0) || 0) +
              (plataFavor?.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0) || 0) +
              (efectivo?.reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0) || 0) +
              (cheques?.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0) || 0) +
              (transferencias?.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0) || 0)
            ))}
          </div>
        </div>
        
        {/* Balance Final */}
        <div className="print-section">
          <div className="print-total">
            Balance Final: {formatCurrency((
              ((ventas?.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0) || 0) +
               (plataFavor?.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0) || 0) +
               (efectivo?.reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0) || 0) +
               (cheques?.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0) || 0) +
               (transferencias?.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0) || 0)) -
              (boletas?.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0) || 0) -
              (deudas?.reduce((sum, d) => sum + parseCurrencyValue(d.amount), 0) || 0)
            ))}
          </div>
          <div className="print-item" style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>
            {(() => {
              const totalBoletasCalc = boletas?.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0) || 0;
              const totalDeudasCalc = deudas?.reduce((sum, d) => sum + parseCurrencyValue(d.amount), 0) || 0;
              const totalIngresosCalc = (
                (ventas?.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0) || 0) +
                (plataFavor?.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0) || 0) +
                (efectivo?.reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0) || 0) +
                (cheques?.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0) || 0) +
                (transferencias?.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0) || 0)
              );
              
              const balanceCorrecto = totalIngresosCalc - totalBoletasCalc - totalDeudasCalc;
              
              if (balanceCorrecto > 0) {
                return `${clientName} te debe ${formatCurrency(balanceCorrecto)}`;
              } else if (balanceCorrecto < 0) {
                return `Tú le debes ${formatCurrency(Math.abs(balanceCorrecto))} a ${clientName}`;
              } else {
                return 'Las cuentas están saldadas. No hay deudas pendientes.';
              }
            })()}
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
    
    // Calcular con descuentos por faltas
    const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasTrabajados = empleado.diasTrabajados || DIAS_SEMANA;
    const diasFaltados = DIAS_SEMANA.filter(dia => !diasTrabajados.includes(dia));
    const sueldoPorDia = empleado.sueldoSemanal / DIAS_SEMANA.length;
    const descuentoPorFaltas = diasFaltados.length * sueldoPorDia;
    const totalSueldo = empleado.sueldoSemanal - descuentoPorFaltas; // Sueldo con descuentos
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
            <strong>Sueldo Semanal:</strong> {formatCurrency(empleado.sueldoSemanal)}
            {descuentoPorFaltas > 0 && (
              <span style={{ color: '#dc3545' }}>
                {' '}(Descuento: -{formatCurrency(descuentoPorFaltas)})
              </span>
            )}
          </div>
          {diasFaltados.length > 0 && (
            <div className="print-section">
              <div className="print-section-title">Descuentos por Inasistencias</div>
              {diasFaltados.map((dia, index) => (
                <div key={index} className="print-item" style={{ color: '#dc3545' }}>
                  Falta {dia}: -{formatCurrency(sueldoPorDia)}
                </div>
              ))}
              <div className="print-subtotal" style={{ color: '#dc3545' }}>
                Total Descuento: -{formatCurrency(descuentoPorFaltas)}
              </div>
            </div>
          )}
          <div className="print-item">
            <strong>Sueldo a Pagar:</strong> {formatCurrency(totalSueldo)}
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

  const renderListaPreciosContent = () => {
    const { tipo, proveedor, fecha, productos = [], notas, total, contacto, nombrePronelis } = data || {};
    
    // Formulario vacío para que el proveedor llene a mano
    if (tipo === 'formularioVacio') {
      return (
        <div ref={printRef}>
          <div className="print-header">
            Formulario de Cotización
          </div>
          
          <div className="print-date">
            Fecha: {new Date(fecha).toLocaleDateString('es-AR')}
          </div>
          
          <div className="print-section">
            <div className="print-section-title">Datos del Proveedor</div>
            <div className="print-item">
              <strong>Nombre:</strong> _______________________________________
            </div>
            <div className="print-item">
              <strong>Contacto:</strong> _______________________________________
            </div>
          </div>
          
          <div className="print-section">
            <div className="print-section-title">Lista de Precios</div>
            <div className="print-table">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '65%' }}>Producto</th>
                    <th style={{ width: '30%', textAlign: 'center' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td style={{ border: '1px solid #000', minHeight: '30px' }}>___________________________</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center' }}>$__________</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="print-message">
            <p><strong>Por favor completar y devolver este formulario</strong></p>
            <p>Gracias por su colaboración</p>
          </div>
        </div>
      );
    }
    
    // Formulario con datos del proveedor específico
    if (tipo === 'formularioManual') {
      return (
        <div ref={printRef}>
          <div className="print-header">
            Formulario de Cotización para {proveedor}
          </div>
          
          <div className="print-date">
            Fecha: {new Date(fecha).toLocaleDateString('es-AR')}
          </div>
          
          <div className="print-section">
            <div className="print-section-title">Datos del Proveedor</div>
            <div className="print-item">
              <strong>Nombre:</strong> {proveedor}
            </div>
            {contacto && (
              <div className="print-item">
                <strong>Contacto:</strong> {contacto}
              </div>
            )}
          </div>
          
          <div className="print-section">
            <div className="print-section-title">Lista de Precios</div>
            <div className="print-table">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '65%' }}>Producto</th>
                    <th style={{ width: '30%', textAlign: 'center' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td style={{ border: '1px solid #000', minHeight: '30px' }}>___________________________</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center' }}>$__________</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="print-message">
            <p><strong>Por favor completar y devolver este formulario</strong></p>
            <p>Gracias por su colaboración</p>
          </div>
        </div>
      );
    }
    
    // Comprobante de lista guardada
    return (
      <div ref={printRef}>
        <div className="print-header">
          Lista de Precios - {proveedor}
        </div>
        
        <div className="print-date">
          Fecha: {new Date(fecha).toLocaleDateString('es-AR')}
        </div>
        
        <div className="print-section">
          <div className="print-section-title">Proveedor: {proveedor}</div>
          {nombrePronelis && (
            <div className="print-item">
              <strong>Paquete/Prónelis:</strong> {nombrePronelis}
            </div>
          )}
        </div>
        
        {/* Productos */}
        {productos && productos.length > 0 && (
          <div className="print-section">
            <div className="print-table">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Producto</th>
                    <th style={{ width: '40%', textAlign: 'right' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto, index) => (
                    <tr key={index}>
                      <td>{producto.nombre}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(producto.precio)}</td>
                    </tr>
                  ))}
                  <tr className="table-success">
                    <td><strong>TOTAL</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{formatCurrency(total || productos.reduce((sum, p) => sum + p.precio, 0))}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Notas */}
        {notas && (
          <div className="print-section">
            <div className="print-section-title">Notas</div>
            <div className="print-item">
              {notas}
            </div>
          </div>
        )}
        
        {/* Mensaje final */}
        <div className="print-message">
          <p><strong>Comprobante generado automáticamente</strong></p>
          <p>Lista de precios proporcionada por {proveedor}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(680px, 96vw)',
          maxHeight: '92vh',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          zIndex: 1051,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Vista previa
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
              Impresión
            </div>
          </div>
          <button onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#6c757d' }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Body — contenido de impresión con indicadores de scroll */}
        <div
          ref={modalBodyRef}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', position: 'relative' }}
        >
          {/* Indicador scroll arriba */}
          {showTopIndicator && (
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              display: 'flex', justifyContent: 'center', marginBottom: '8px',
              pointerEvents: 'none',
            }}>
              <span style={{ background: 'rgba(106,136,153,0.9)', color: 'white', fontSize: '0.7rem', fontWeight: 600, padding: '3px 12px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                ↑ más arriba
              </span>
            </div>
          )}

          {type === 'reparto'       ? renderRepartoContent()      :
           type === 'transferencia' ? renderTransferenciaContent() :
           type === 'empleados'     ? renderEmpleadosContent()     :
           type === 'empleado'      ? renderEmpleadoContent()      :
           type === 'listaPrecios'  ? renderListaPreciosContent()  :
           renderSaldoContent()}

          {/* Indicador scroll abajo */}
          {showBottomIndicator && (
            <div style={{
              position: 'sticky', bottom: 0, zIndex: 10,
              display: 'flex', justifyContent: 'center', marginTop: '8px',
              pointerEvents: 'none',
            }}>
              <span style={{ background: 'rgba(106,136,153,0.9)', color: 'white', fontSize: '0.7rem', fontWeight: 600, padding: '3px 12px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                ↓ hay más abajo
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Selector de ancho — segmented control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              Formato
            </span>
            {(() => {
              const opciones = esEmpleado
                ? [['completo', '📄 Hoja completa'], ['mitad', '✂️ Media hoja']]
                : [['completo', '📄 Hoja completa'], ['mitad', '✂️ Media hoja'], ['duplicado', '📋 Media hoja x2']];
              const idx = opciones.findIndex(([val]) => val === anchoImpresion);
              const sliderPct = idx < 0 ? 0 : (idx / opciones.length) * 100;
              return (
                <div style={{ position: 'relative', display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px', flex: 1 }}>
                  <div style={{
                    position: 'absolute', top: '3px', bottom: '3px',
                    left: `calc(${sliderPct}% + 3px)`,
                    width: `calc(${100 / opciones.length}% - 4px)`,
                    background: 'white', borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                    transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
                    pointerEvents: 'none', zIndex: 0,
                  }} />
                  {opciones.map(([val, label]) => (
                    <button key={val} onClick={() => setAnchoImpresion(val)}
                      style={{ position: 'relative', zIndex: 1, flex: 1, border: 'none', borderRadius: '8px', padding: '5px 6px', fontSize: '0.72rem', fontWeight: anchoImpresion === val ? 600 : 400, background: 'transparent', color: anchoImpresion === val ? '#212529' : '#6c757d', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {label}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Botones Cancelar / Imprimir */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handlePrint}
              className="d-inline-flex align-items-center justify-content-center gap-2"
              style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
              <IconPrinter size={15} />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintDocument;