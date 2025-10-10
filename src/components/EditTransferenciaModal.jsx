import React, { useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';

const EditTransferenciaModal = ({ isOpen, onClose, transferencia, onSave }) => {
  const [formData, setFormData] = useState({
    nombreCliente: '',
    transferencias: [{ descripcion: '', monto: '' }],
    boletas: [{ fecha: '', monto: '' }]
  });

  // Cargar datos de la transferencia cuando se abre el modal
  useEffect(() => {
    if (isOpen && transferencia) {
      setFormData({
        nombreCliente: transferencia.nombreCliente || '',
        transferencias: transferencia.transferencias?.length > 0 
          ? transferencia.transferencias.map(t => ({
              descripcion: t.descripcion || '',
              monto: formatCurrencyNoSymbol(parseFloat(t.monto) || 0)
            }))
          : [{ descripcion: '', monto: '' }],
        boletas: transferencia.boletas?.length > 0 
          ? transferencia.boletas.map(b => ({
              fecha: b.fecha || '',
              monto: formatCurrencyNoSymbol(parseFloat(b.monto) || 0)
            }))
          : [{ fecha: new Date().toISOString().split('T')[0], monto: '' }]
      });
    }
  }, [isOpen, transferencia]);

  // Funciones helper para formato de moneda
  const handleCurrencyBlur = (e) => {
    let num = parseCurrencyValue(e.target.value);
    if (!isNaN(num)) {
      e.target.value = formatCurrencyNoSymbol(num);
    }
  };

  const handleCurrencyFocus = (e) => {
    let val = e.target.value.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim();
    e.target.value = val;
  };

  // Funciones para Transferencias
  const addTransferenciaRow = () => {
    setFormData(prev => ({
      ...prev,
      transferencias: [...prev.transferencias, { descripcion: '', monto: '' }]
    }));
  };

  const updateTransferenciaRow = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      transferencias: prev.transferencias.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    }));
  };

  const removeTransferenciaRow = (index) => {
    if (formData.transferencias.length > 1) {
      setFormData(prev => ({
        ...prev,
        transferencias: prev.transferencias.filter((_, i) => i !== index)
      }));
    }
  };

  // Funciones para Boletas
  const addBoleta = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      boletas: [...prev.boletas, { fecha: today, monto: '' }]
    }));
  };

  const updateBoleta = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      boletas: prev.boletas.map((b, i) => 
        i === index ? { ...b, [field]: value } : b
      )
    }));
  };

  const removeBoleta = (index) => {
    if (formData.boletas.length > 1) {
      setFormData(prev => ({
        ...prev,
        boletas: prev.boletas.filter((_, i) => i !== index)
      }));
    }
  };

  // Calcular totales
  const totalTransferencias = formData.transferencias.reduce((sum, t) => sum + parseCurrencyValue(t.monto), 0);
  const totalBoletas = formData.boletas.reduce((sum, b) => sum + parseCurrencyValue(b.monto), 0);
  const saldoFinal = totalTransferencias - totalBoletas;

  const handleSave = () => {
    if (!formData.nombreCliente.trim()) {
      alert('Ingrese el nombre del cliente');
      return;
    }

    // Validar que haya al menos una transferencia o boleta con datos
    const hasValidData = formData.transferencias.some(t => t.descripcion.trim() || parseCurrencyValue(t.monto) > 0) ||
                         formData.boletas.some(b => b.fecha && parseCurrencyValue(b.monto) > 0);

    if (!hasValidData) {
      alert('Debe agregar al menos una transferencia o boleta válida');
      return;
    }

    const transferenciaData = {
      nombreCliente: formData.nombreCliente.trim(),
      transferencias: formData.transferencias
        .filter(t => parseCurrencyValue(t.monto) > 0)
        .map(t => ({
          descripcion: t.descripcion.trim(),
          monto: parseCurrencyValue(t.monto).toString()
        })),
      boletas: formData.boletas
        .filter(b => b.fecha && parseCurrencyValue(b.monto) > 0)
        .map(b => ({
          fecha: b.fecha,
          monto: parseCurrencyValue(b.monto).toString()
        })),
      totalTransferencias: totalTransferencias,
      totalBoletas: totalBoletas,
      saldoFinal: saldoFinal,
      fecha: transferencia.fecha || new Date().toISOString().split('T')[0]
    };

    onSave(transferencia.id, transferenciaData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Editar Transferencia: {transferencia?.nombreCliente}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Nombre del Cliente */}
            <div className="mb-3">
              <label className="form-label fw-bold">Nombre del Cliente</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ingrese el nombre del cliente"
                value={formData.nombreCliente}
                onChange={(e) => setFormData(prev => ({ ...prev, nombreCliente: e.target.value }))}
                required 
              />
            </div>

            <hr />

            {/* Transferencias Recibidas */}
            <div className="mb-3">
              <h6 className="fw-bold text-primary">Transferencias Recibidas</h6>
              <small className="text-muted d-block mb-2">Dinero que el cliente te envió</small>
              
              {formData.transferencias.map((t, index) => (
                <div key={index} className="row mb-2">
                  <div className="col-6">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Descripción"
                      value={t.descripcion}
                      onChange={(e) => updateTransferenciaRow(index, 'descripcion', e.target.value)}
                    />
                  </div>
                  <div className="col-5">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Monto (AR$)"
                      value={t.monto}
                      onChange={(e) => updateTransferenciaRow(index, 'monto', e.target.value)}
                      onBlur={handleCurrencyBlur}
                      onFocus={handleCurrencyFocus}
                    />
                  </div>
                  <div className="col-1">
                    {formData.transferencias.length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeTransferenciaRow(index)}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={addTransferenciaRow}
              >
                + Agregar Transferencia
              </button>
            </div>

            <hr />

            {/* Boletas Vendidas */}
            <div className="mb-3">
              <h6 className="fw-bold text-warning">Boletas Vendidas al Cliente</h6>
              <small className="text-muted d-block mb-2">Dinero que le debes al cliente</small>
              
              {formData.boletas.map((b, index) => (
                <div key={index} className="row mb-2">
                  <div className="col-6">
                    <input 
                      type="date" 
                      className="form-control form-control-sm"
                      value={b.fecha}
                      onChange={(e) => updateBoleta(index, 'fecha', e.target.value)}
                    />
                  </div>
                  <div className="col-5">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Monto (AR$)"
                      value={b.monto}
                      onChange={(e) => updateBoleta(index, 'monto', e.target.value)}
                      onBlur={handleCurrencyBlur}
                      onFocus={handleCurrencyFocus}
                    />
                  </div>
                  <div className="col-1">
                    {formData.boletas.length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeBoleta(index)}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={addBoleta}
              >
                + Agregar Boleta
              </button>
            </div>

            <hr />

            {/* Resumen de Saldo */}
            <div className="card bg-light">
              <div className="card-body p-3">
                <h6 className="card-title mb-3">Resumen</h6>
                
                <div className="row text-center mb-2">
                  <div className="col-4">
                    <small className="text-success d-block">Transferencias</small>
                    <strong className="text-success">{formatCurrency(totalTransferencias)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-warning d-block">Boletas</small>
                    <strong className="text-warning">{formatCurrency(totalBoletas)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Saldo</small>
                    <strong className={saldoFinal > 0 ? 'text-success' : saldoFinal < 0 ? 'text-danger' : 'text-secondary'}>
                      {formatCurrency(Math.abs(saldoFinal))}
                    </strong>
                  </div>
                </div>

                <div className="alert alert-sm p-2 mb-0 mt-2" style={{ 
                  backgroundColor: saldoFinal > 0 ? '#d4edda' : saldoFinal < 0 ? '#f8d7da' : '#d1ecf1',
                  border: `1px solid ${saldoFinal > 0 ? '#28a745' : saldoFinal < 0 ? '#dc3545' : '#0dcaf0'}`,
                  fontSize: '0.85rem'
                }}>
                  {saldoFinal > 0 ? (
                    <strong>✅ Le debes {formatCurrency(saldoFinal)} a {formData.nombreCliente || 'este cliente'}</strong>
                  ) : saldoFinal < 0 ? (
                    <strong>⚠️ {formData.nombreCliente || 'Este cliente'} te debe {formatCurrency(Math.abs(saldoFinal))}</strong>
                  ) : (
                    <strong>✓ Cuentas saldadas - No hay diferencia</strong>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              <i className="fas fa-save me-2"></i>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransferenciaModal;

