import React from 'react';

export const ModalSeleccionProveedores = ({ 
  isOpen, 
  onClose, 
  paquete,
  proveedores,
  proveedoresSeleccionados,
  onToggleProveedor,
  onImprimir
}) => {
  if (!isOpen || !paquete) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="fas fa-print me-2"></i>
              Imprimir Formularios - {paquete.nombre}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Selecciona los proveedores para los cuales deseas imprimir formularios de cotización.
            </div>

            {paquete.productos && paquete.productos.length > 0 && (
              <div className="mb-3">
                <small className="text-muted">
                  <strong>Productos en este paquete:</strong> {paquete.productos.map(p => p.nombre).join(', ')}
                </small>
              </div>
            )}

            <div className="list-group">
              {proveedores.map((proveedor) => (
                <div 
                  key={proveedor.id} 
                  className={`list-group-item ${proveedoresSeleccionados.includes(proveedor.id) ? 'active' : ''}`}
                  onClick={() => onToggleProveedor(proveedor.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input me-3"
                      type="checkbox"
                      checked={proveedoresSeleccionados.includes(proveedor.id)}
                      onChange={() => onToggleProveedor(proveedor.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{proveedor.nombre}</h6>
                      {proveedor.contacto && (
                        <small className="text-muted">
                          <i className="fas fa-phone me-1"></i>
                          {proveedor.contacto}
                        </small>
                      )}
                    </div>
                    {proveedoresSeleccionados.includes(proveedor.id) && (
                      <i className="fas fa-check-circle text-white"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {proveedoresSeleccionados.length > 0 && (
              <div className="alert alert-success mt-3">
                <i className="fas fa-check me-2"></i>
                {proveedoresSeleccionados.length} proveedor(es) seleccionado(s)
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={onImprimir}
              disabled={proveedoresSeleccionados.length === 0}
            >
              <i className="fas fa-print me-2"></i>
              Imprimir {proveedoresSeleccionados.length > 0 && `(${proveedoresSeleccionados.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


