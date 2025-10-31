import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/money';

export const ModalCargaRapidaPrecios = ({
  isOpen,
  onClose,
  paquete,
  proveedores,
  onGuardar
}) => {
  const [preciosPorProveedor, setPreciosPorProveedor] = useState({});
  const [notasPorProveedor, setNotasPorProveedor] = useState({});
  const [fechaComprobante, setFechaComprobante] = useState('');

  // Inicializar fecha cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      const fecha = hoy.toISOString().split('T')[0];
      setFechaComprobante(fecha);
    }
  }, [isOpen]);

  if (!isOpen || !paquete || !proveedores || proveedores.length === 0) return null;

  const actualizarPrecio = (proveedorId, corteIndex, value) => {
    setPreciosPorProveedor(prev => ({
      ...prev,
      [proveedorId]: {
        ...prev[proveedorId],
        [corteIndex]: value
      }
    }));
  };

  const actualizarNota = (proveedorId, nota) => {
    setNotasPorProveedor(prev => ({
      ...prev,
      [proveedorId]: nota
    }));
  };

  const calcularTotal = (proveedorId) => {
    const precios = preciosPorProveedor[proveedorId] || {};
    return Object.values(precios).reduce((sum, precio) => sum + (parseFloat(precio) || 0), 0);
  };

  const calcularProgreso = (proveedorId) => {
    const precios = preciosPorProveedor[proveedorId] || {};
    const totalProductos = paquete.productos?.length || 0;
    const completados = Object.values(precios).filter(p => p && parseFloat(p) > 0).length;
    return {
      completados,
      total: totalProductos,
      porcentaje: totalProductos > 0 ? Math.round((completados / totalProductos) * 100) : 0
    };
  };

  const handleGuardar = async () => {
    // Guardar todos los proveedores que tengan al menos un precio
    let guardados = 0;
    const promesas = [];

    proveedores.forEach(proveedor => {
      const precios = preciosPorProveedor[proveedor.id] || {};
      const productosValidos = paquete.productos
        .map((p, idx) => ({
          nombre: p.nombre,
          precio: parseFloat(precios[idx] || '0') || 0
        }))
        .filter(p => p.precio > 0);

      if (productosValidos.length > 0) {
        promesas.push(
          onGuardar(proveedor.id, precios, notasPorProveedor[proveedor.id] || '')
            .then(resultado => {
              if (resultado) guardados++;
            })
        );
      }
    });

    if (promesas.length === 0) {
      alert('Debes ingresar al menos un precio en algún proveedor');
      return;
    }

    await Promise.all(promesas);

    if (guardados > 0) {
      alert(`✅ Se guardaron correctamente ${guardados} lista(s) de precios`);
    }

    // Limpiar y cerrar
    setPreciosPorProveedor({});
    setNotasPorProveedor({});
    onClose();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header" style={{ backgroundColor: '#A9D6E5', borderBottom: 'none' }}>
            <h5 className="modal-title text-white">
              <i className="fas fa-bolt me-2"></i>
              Carga Rápida Masiva: {paquete.nombre}
            </h5>
            <div className="d-flex align-items-center gap-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={fechaComprobante}
                onChange={(e) => setFechaComprobante(e.target.value)}
                style={{ width: '150px' }}
              />
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
          </div>
          
          <div className="modal-body" style={{ backgroundColor: '#f8f9fa', maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Ingresa los precios para todos los proveedores. Cada proveedor es independiente.
            </div>

            {/* Grid de proveedores */}
            <div className="row g-3">
              {proveedores.map((proveedor) => {
                const progreso = calcularProgreso(proveedor.id);
                const total = calcularTotal(proveedor.id);
                
                return (
                  <div key={proveedor.id} className="col-md-6 col-xl-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header bg-white pb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0 fw-bold">{proveedor.nombre}</h6>
                          {progreso.porcentaje === 100 && (
                            <i className="fas fa-check-circle text-success"></i>
                          )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">{progreso.completados}/{progreso.total}</small>
                          <strong className="text-success">{formatCurrency(total)}</strong>
                        </div>
                      </div>
                      
                      <div className="card-body p-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {/* Grid de precios pequeños */}
                        <div className="row g-2">
                          {paquete.productos.map((corte, idx) => (
                            <div key={idx} className="col-6">
                              <div className="small text-muted mb-1">{corte.nombre}</div>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">$</span>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  placeholder="0"
                                  value={preciosPorProveedor[proveedor.id]?.[idx] || ''}
                                  onChange={(e) => actualizarPrecio(proveedor.id, idx, e.target.value)}
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Notas */}
                        <div className="mt-3">
                          <textarea
                            className="form-control form-control-sm"
                            rows="2"
                            placeholder="Notas..."
                            value={notasPorProveedor[proveedor.id] || ''}
                            onChange={(e) => actualizarNota(proveedor.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-success btn-lg"
              onClick={handleGuardar}
            >
              <i className="fas fa-save me-2"></i>
              Guardar Todos los Precios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
