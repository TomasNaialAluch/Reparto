import React, { useState } from 'react';

const TransferenciaCard = ({ transferencia, onDelete, onEdit, onPrint }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    // Si la fecha ya está en formato YYYY-MM-DD, usarla directamente
    if (dateString && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Si no, crear la fecha normalmente
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const saldo = transferencia.saldoFinal || 0;
  const totalItems = (transferencia.transferencias?.length || 0) + (transferencia.boletas?.length || 0);

  return (
    <div 
      className={`card mb-3 ${isExpanded ? 'expanded' : 'collapsed'}`} 
      style={{ 
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid #dee2e6'
      }}
    >
      {/* Header de la Card (siempre visible) */}
      <div className="card-header p-3" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {transferencia.nombreCliente}
            </h6>
            <small className="text-muted">
              {formatDate(transferencia.fecha)} • {totalItems} transacciones
            </small>
          </div>
          <div className="d-flex align-items-center">
            <span 
              className={`badge ${saldo > 0 ? 'bg-success' : saldo < 0 ? 'bg-danger' : 'bg-secondary'} me-2`}
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                setIsDragging(true);
                // Guardar el valor numérico del saldo en el evento de drag
                e.dataTransfer.setData('text/plain', Math.abs(saldo).toString());
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={(e) => {
                e.stopPropagation();
                setIsDragging(false);
              }}
              onMouseDown={(e) => {
                // Prevenir que el click del header expanda/contraiga cuando se arrastra el badge
                e.stopPropagation();
              }}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: isDragging ? 0.5 : 1,
                transition: 'opacity 0.2s',
                userSelect: 'none'
              }}
              title="Arrastra este monto al campo de transferencia"
            >
              {formatCurrency(Math.abs(saldo))}
            </span>
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }}></i>
          </div>
        </div>
      </div>

      {/* Contenido Expandido */}
      {isExpanded && (
        <div className="card-body p-3" style={{ borderTop: '1px solid #dee2e6' }}>
          {/* Resumen */}
          <div className="mb-3">
            <div className="row text-center">
              <div className="col-4">
                <small className="text-success">Transferencias</small>
                <div className="fw-bold text-success">
                  {formatCurrency(transferencia.totalTransferencias || 0)}
                </div>
              </div>
              <div className="col-4">
                <small className="text-warning">Boletas</small>
                <div className="fw-bold text-warning">
                  {formatCurrency(transferencia.totalBoletas || 0)}
                </div>
              </div>
              <div className="col-4">
                <small className="text-muted">Saldo</small>
                <div className={`fw-bold ${saldo > 0 ? 'text-success' : saldo < 0 ? 'text-danger' : 'text-secondary'}`}>
                  {formatCurrency(Math.abs(saldo))}
                </div>
              </div>
            </div>
          </div>

          {/* Indicador de quién debe a quién */}
          <div className="alert alert-sm p-2 mb-3" style={{ 
            backgroundColor: saldo > 0 ? '#d4edda' : saldo < 0 ? '#f8d7da' : '#d1ecf1',
            border: `1px solid ${saldo > 0 ? '#28a745' : saldo < 0 ? '#dc3545' : '#0dcaf0'}`,
            fontSize: '0.85rem'
          }}>
            {saldo > 0 ? (
              <strong>✅ Le debes {formatCurrency(saldo)} a {transferencia.nombreCliente}</strong>
            ) : saldo < 0 ? (
              <strong>⚠️ {transferencia.nombreCliente} te debe {formatCurrency(Math.abs(saldo))}</strong>
            ) : (
              <strong>✓ Cuentas saldadas</strong>
            )}
          </div>

          {/* Detalles de Transacciones */}
          <div className="mb-3">
            <h6 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Detalle:</h6>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              
              {/* Transferencias */}
              {transferencia.transferencias?.map((t, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-success">🏦 {t.descripcion || `Transferencia ${index + 1}`}</small>
                  </div>
                  <div>
                    <small className="text-success fw-bold">{formatCurrency(parseFloat(t.monto) || 0)}</small>
                  </div>
                </div>
              ))}

              {/* Boletas */}
              {transferencia.boletas?.map((b, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold text-warning">📄 Boleta {index + 1} ({b.fecha})</small>
                  </div>
                  <div>
                    <small className="text-warning fw-bold">{formatCurrency(parseFloat(b.monto) || 0)}</small>
                  </div>
                </div>
              ))}

              {(!transferencia.transferencias?.length && !transferencia.boletas?.length) && (
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
                onEdit(transferencia);
              }}
            >
              <i className="fas fa-edit me-1"></i>
              Editar
            </button>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(transferencia);
              }}
              title="Imprimir transferencia"
            >
              <i className="fas fa-print"></i>
            </button>
            <button 
              className="btn btn-sm btn-outline-danger flex-fill"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transferencia.id);
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

export default TransferenciaCard;

