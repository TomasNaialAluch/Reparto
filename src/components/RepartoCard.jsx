import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

const RepartoCard = ({ reparto, onDelete, onEdit, onPrint }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // Calcular total del reparto (nueva estructura)
  const totalReparto = reparto.total || reparto.clientes?.reduce((sum, client) => sum + parseFloat(client.billAmount || 0), 0) || 0;
  
  // Contar clientes pagados vs pendientes
  const clientesPagados = reparto.clientes?.filter(client => client.paymentStatus === 'paid').length || 0;
  const clientesPendientes = reparto.clientes?.filter(client => client.paymentStatus === 'pending').length || 0;

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
              Reparto {formatDate(reparto.date)}
            </h6>
            <small className="text-muted">
              {reparto.cantidad || reparto.clientes?.length || 0} clientes • {formatCurrency(totalReparto)}
            </small>
          </div>
          <div className="d-flex align-items-center">
            <span className={`badge ${clientesPendientes > 0 ? 'bg-warning' : 'bg-success'} me-2`}>
              {clientesPagados}/{reparto.cantidad || reparto.clientes?.length || 0}
            </span>
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }}></i>
          </div>
        </div>
      </div>

      {/* Contenido Expandido */}
      {isExpanded && (
        <div className="card-body p-3" style={{ borderTop: '1px solid #dee2e6' }}>
          {/* Resumen del Reparto */}
          <div className="mb-3">
            <div className="row text-center">
              <div className="col-6">
                <small className="text-muted">Total</small>
                <div className="fw-bold">{formatCurrency(totalReparto)}</div>
              </div>
              <div className="col-6">
                <small className="text-muted">Clientes</small>
                <div className="fw-bold">{reparto.cantidad || reparto.clientes?.length || 0}</div>
              </div>
            </div>
            <div className="row text-center mt-2">
              <div className="col-6">
                <small className="text-success">Pagados</small>
                <div className="text-success fw-bold">{clientesPagados}</div>
              </div>
              <div className="col-6">
                <small className="text-warning">Pendientes</small>
                <div className="text-warning fw-bold">{clientesPendientes}</div>
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="mb-3">
            <h6 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Clientes:</h6>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {reparto.clientes?.map((client, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div>
                    <small className="fw-bold">{client.clientName}</small>
                    <br />
                    <small className="text-muted">{formatCurrency(client.billAmount)}</small>
                  </div>
                  <span className={`badge badge-sm ${
                    client.paymentStatus === 'paid' ? 'bg-success' : 
                    client.paymentStatus === 'partial' ? 'bg-warning' : 'bg-secondary'
                  }`}>
                    {client.paymentStatus === 'paid' ? 'Pagado' : 
                     client.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-primary flex-fill"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(reparto);
              }}
            >
              <i className="fas fa-edit me-1"></i>
              Editar
            </button>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(reparto);
              }}
              title="Imprimir reparto"
            >
              <i className="fas fa-print"></i>
            </button>
            <button 
              className="btn btn-sm btn-outline-danger flex-fill"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              title="Eliminar reparto permanentemente"
            >
              <i className="fas fa-trash me-1"></i>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación personalizado */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(reparto.id);
          setShowDeleteModal(false);
        }}
        title="Eliminar Reparto"
        message={`¿Estás seguro de que querés eliminar el reparto del ${formatDate(reparto.date)}?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
      />
    </div>
  );
};

export default RepartoCard;
