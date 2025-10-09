import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/money';

const EditRepartoModal = ({ isOpen, onClose, reparto, onSave }) => {
  const [formData, setFormData] = useState({
    date: '',
    clients: []
  });

  // Cargar datos del reparto cuando se abre el modal
  useEffect(() => {
    if (isOpen && reparto) {
      setFormData({
        date: reparto.date || new Date().toISOString().split('T')[0],
        clients: reparto.clients || []
      });
    }
  }, [isOpen, reparto]);

  // Funciones para manejar clientes
  const addCliente = () => {
    setFormData(prev => ({
      ...prev,
      clients: [...prev.clients, {
        id: Date.now().toString() + Math.random(),
        clientName: '',
        billAmount: 0,
        paymentStatus: 'pending',
        paymentAmount: 0,
        address: ''
      }]
    }));
  };

  const removeCliente = (index) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index)
    }));
  };

  const updateCliente = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.map((cliente, i) => 
        i === index ? { ...cliente, [field]: value } : cliente
      )
    }));
  };

  const handleSave = () => {
    // Validar que haya al menos un cliente
    if (formData.clients.length === 0) {
      alert('Debe agregar al menos un cliente');
      return;
    }

    // Validar que todos los clientes tengan nombre y monto
    const clientesInvalidos = formData.clients.some(cliente => 
      !cliente.clientName.trim() || cliente.billAmount <= 0
    );

    if (clientesInvalidos) {
      alert('Todos los clientes deben tener nombre y monto válido');
      return;
    }

    const repartoData = {
      ...formData,
      clients: formData.clients.map(cliente => ({
        ...cliente,
        clientName: cliente.clientName.trim(),
        billAmount: parseFloat(cliente.billAmount)
      }))
    };

    onSave(reparto.id, repartoData);
    onClose();
  };

  // Calcular totales
  const totalReparto = formData.clients.reduce((sum, cliente) => sum + (parseFloat(cliente.billAmount) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Editar Reparto - {reparto?.date}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Fecha del Reparto */}
            <div className="mb-3">
              <label className="form-label">Fecha del Reparto</label>
              <input 
                type="date" 
                className="form-control" 
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required 
              />
            </div>

            {/* Clientes */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Clientes ({formData.clients.length})</h6>
                <button type="button" className="btn btn-primary btn-sm" onClick={addCliente}>
                  <i className="fas fa-plus me-1"></i>
                  Agregar Cliente
                </button>
              </div>

              {formData.clients.length === 0 ? (
                <div className="text-center text-muted py-3">
                  <i className="fas fa-users fa-2x mb-2"></i>
                  <p>No hay clientes agregados</p>
                  <small>Haz clic en "Agregar Cliente" para comenzar</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Nombre del Cliente</th>
                        <th>Dirección</th>
                        <th>Monto</th>
                        <th>Estado de Pago</th>
                        <th width="80">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.clients.map((cliente, index) => (
                        <tr key={cliente.id || index}>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={cliente.clientName}
                              onChange={(e) => updateCliente(index, 'clientName', e.target.value)}
                              placeholder="Nombre del cliente"
                              required 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={cliente.address}
                              onChange={(e) => updateCliente(index, 'address', e.target.value)}
                              placeholder="Dirección (opcional)"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              step="0.01" 
                              className="form-control form-control-sm" 
                              value={cliente.billAmount}
                              onChange={(e) => updateCliente(index, 'billAmount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              required 
                            />
                          </td>
                          <td>
                            <select 
                              className="form-control form-control-sm"
                              value={cliente.paymentStatus}
                              onChange={(e) => updateCliente(index, 'paymentStatus', e.target.value)}
                            >
                              <option value="pending">Pendiente</option>
                              <option value="partial">Parcial</option>
                              <option value="paid">Pagado</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeCliente(index)}
                              title="Eliminar cliente"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resumen */}
              {formData.clients.length > 0 && (
                <div className="mt-3 p-3 bg-light rounded">
                  <div className="row text-center">
                    <div className="col-6">
                      <small className="text-muted">Total Clientes</small>
                      <div className="fw-bold">{formData.clients.length}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Total Reparto</small>
                      <div className="fw-bold text-primary">{formatCurrency(totalReparto)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRepartoModal;
