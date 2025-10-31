import React from 'react';

export const ModalNuevoProveedor = ({ 
  isOpen, 
  onClose, 
  nombre, 
  contacto, 
  onNombreChange, 
  onContactoChange, 
  onGuardar 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-plus-circle me-2"></i>
              Nuevo Proveedor
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                Nombre del Proveedor <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={nombre}
                onChange={(e) => onNombreChange(e.target.value)}
                placeholder="Ej: Distribuidora ABC"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nombre.trim()) {
                    onGuardar();
                  }
                }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Contacto (opcional)</label>
              <input
                type="text"
                className="form-control"
                value={contacto}
                onChange={(e) => onContactoChange(e.target.value)}
                placeholder="Teléfono, email, etc."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nombre.trim()) {
                    onGuardar();
                  }
                }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={onGuardar}>
              <i className="fas fa-save me-2"></i>
              Crear Proveedor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


