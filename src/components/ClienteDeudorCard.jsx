import React, { useState } from 'react';

const ClienteDeudorCard = ({ cliente, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Función para formatear montos a moneda argentina
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcular total de deuda
  const totalDeuda = cliente.saldoFinal || 0;
  
  // Contar transacciones
  const totalBoletas = cliente.boletas?.length || 0;
  const totalVentas = cliente.ventas?.length || 0;
  const totalPagos = (cliente.efectivo?.length || 0) + 
                    (cliente.cheques?.length || 0) + 
                    (cliente.transferencias?.length || 0);

  return (
    <div className={`card mb-3 ${isExpanded ? 'expanded' : 'collapsed'}`} 
         style={{ 
           transition: 'all 0.3s ease',
           cursor: 'pointer',
           border: '1px solid #dee2e6'
         }}>
      
      {/* Header de la Card (siempre visible) */}
      <div className="card-header p-3" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {cliente.nombreCliente}
            </h6>
            <small className="text-muted">
              {formatDate(cliente.fecha)} • {totalBoletas + totalVentas} transacciones
            </small>
          </div>
          <div className="d-flex align-items-center">
            <span className={`badge ${totalDeuda > 0 ? 'bg-danger' : 'bg-success'} me-2`}>
              {formatCurrency(totalDeuda)}
            </span>
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }}></i>
          </div>
        </div>
      </div>

      {/* Contenido Expandido */}
      {isExpanded && (
        <div className="card-body p-3" style={{ borderTop: '1px solid #dee2e6' }}>
          {/* Resumen del Cliente */}
          <div className="mb-3">
            <div className="row text-center">
              <div className="col-6">
                <small className="text-muted">Total Deuda</small>
                <div className={`fw-bold ${totalDeuda > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(totalDeuda)}
                </div>
              </div>
              <div className="col-6">
                <small className="text-muted">Transacciones</small>
                <div className="fw-bold">{totalBoletas + totalVentas + totalPagos}</div>
              </div>
            </div>
            <div className="row text-center mt-2">
              <div className="col-4">
                <small className="text-warning">Boletas/Ventas</small>
                <div className="text-warning fw-bold">{totalBoletas + totalVentas}</div>
              </div>
              <div className="col-4">
                <small className="text-info">Pagos</small>
                <div className="text-info fw-bold">{totalPagos}</div>
              </div>
              <div className="col-4">
                <small className="text-muted">Estado</small>
                <div className={`fw-bold ${totalDeuda > 0 ? 'text-danger' : 'text-success'}`}>
                  {totalDeuda > 0 ? 'Deudor' : 'Al día'}
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de Transacciones */}
          <div className="mb-3">
            <h6 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Detalle de Transacciones:</h6>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              
              {/* Boletas */}
              {cliente.boletas?.map((boleta, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-warning">📄 Boleta</small>
                    <br />
                    <small className="text-muted">{boleta.date} - {formatCurrency(boleta.amount)}</small>
                  </div>
                </div>
              ))}

              {/* Ventas */}
              {cliente.ventas?.map((venta, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-warning">💰 Venta</small>
                    <br />
                    <small className="text-muted">{venta.date} - {formatCurrency(venta.amount)}</small>
                  </div>
                </div>
              ))}

              {/* Efectivo */}
              {cliente.efectivo?.map((pago, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-success">💵 Efectivo</small>
                    <br />
                    <small className="text-muted">{pago.date} - {formatCurrency(pago.amount)}</small>
                  </div>
                </div>
              ))}

              {/* Cheques */}
              {cliente.cheques?.map((cheque, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-info">📋 Cheque</small>
                    <br />
                    <small className="text-muted">{cheque.date} - {formatCurrency(cheque.amount)}</small>
                  </div>
                </div>
              ))}

              {/* Transferencias */}
              {cliente.transferencias?.map((transfer, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-primary">🏦 Transferencia</small>
                    <br />
                    <small className="text-muted">{transfer.date} - {formatCurrency(transfer.amount)}</small>
                  </div>
                </div>
              ))}

              {(!cliente.boletas?.length && !cliente.ventas?.length && !cliente.efectivo?.length && !cliente.cheques?.length && !cliente.transferencias?.length) && (
                <div className="text-center text-muted py-2">
                  <small>No hay transacciones registradas</small>
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-primary flex-fill"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(cliente);
              }}
            >
              <i className="fas fa-edit me-1"></i>
              Editar
            </button>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                window.print();
              }}
              title="Imprimir saldo"
            >
              <i className="fas fa-print"></i>
            </button>
            <button 
              className="btn btn-sm btn-outline-danger flex-fill"
              onClick={(e) => {
                e.stopPropagation();
                // Eliminar directamente sin confirmación
                onDelete(cliente.id);
              }}
            >
              <i className="fas fa-trash me-1"></i>
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDeudorCard;
