import { useState } from 'react';
import { DIAS_SEMANA, getDiaActual } from './constants';
import { formatCurrency } from '../../utils/money';

export default function ClientesTab({ 
  semanaActiva, 
  agregarBoletaCliente,
  eliminarBoletaCliente,
  actualizarCliente,
  eliminarCliente,
  addNotification 
}) {
  const [expandedClientes, setExpandedClientes] = useState({});
  const [editingClientes, setEditingClientes] = useState(null);
  const [tempClientesData, setTempClientesData] = useState({});
  
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    dia: getDiaActual(),
    monto: ''
  });

  const toggleExpandedClientes = (index) => {
    if (editingClientes !== null) {
      cancelEditingClientes();
    }
    setExpandedClientes(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        return {};
      } else {
        return { [index]: true };
      }
    });
  };

  const startEditingClientes = (index, cliente) => {
    setEditingClientes(index);
    setTempClientesData({
      nombre: cliente.nombre,
      boletas: [...cliente.boletas]
    });
  };

  const cancelEditingClientes = () => {
    setEditingClientes(null);
    setTempClientesData({});
  };

  const saveEditingClientes = async (index) => {
    try {
      await actualizarCliente(index, tempClientesData);
      addNotification('Cliente actualizado', 'success');
      setEditingClientes(null);
      setTempClientesData({});
      setExpandedClientes({});
    } catch (error) {
      addNotification('Error al actualizar cliente', 'error');
      console.error(error);
    }
  };

  const updateBoleta = (boletaIndex, field, value) => {
    setTempClientesData(prev => ({
      ...prev,
      boletas: prev.boletas.map((boleta, index) => 
        index === boletaIndex ? { ...boleta, [field]: value } : boleta
      )
    }));
  };

  const eliminarBoletaEnEdicion = (boletaIndex) => {
    setTempClientesData(prev => ({
      ...prev,
      boletas: prev.boletas.filter((_, index) => index !== boletaIndex)
    }));
  };

  const agregarBoletaEnEdicion = () => {
    setTempClientesData(prev => ({
      ...prev,
      boletas: [...prev.boletas, { dia: getDiaActual(), monto: 0 }]
    }));
  };

  const handleAgregarBoleta = async () => {
    try {
      if (!formCliente.nombre || !formCliente.monto) {
        addNotification('Complete todos los campos', 'warning');
        return;
      }

      await agregarBoletaCliente(formCliente.nombre, {
        dia: formCliente.dia,
        monto: parseFloat(formCliente.monto)
      });

      setFormCliente({
        nombre: formCliente.nombre,
        dia: getDiaActual(),
        monto: ''
      });

      addNotification('Boleta registrada', 'success');
    } catch (err) {
      addNotification('Error al registrar boleta', 'error');
    }
  };

  const calcularDeudaCliente = (cliente) => {
    if (!cliente.boletas) return 0;
    return cliente.boletas.reduce((sum, b) => sum + b.monto, 0);
  };

  const handleEliminarCliente = async (e, clienteIndex) => {
    e.stopPropagation();
    const cliente = semanaActiva?.clientesCuenta?.[clienteIndex];
    if (!cliente || !eliminarCliente) return;
    try {
      await eliminarCliente(clienteIndex);
      addNotification('Cliente eliminado', 'success');
      setExpandedClientes({});
      setEditingClientes(null);
    } catch (err) {
      addNotification('Error al eliminar cliente', 'error');
      console.error(err);
    }
  };

  return (
    <div className="row">
      <div className="col-lg-5" data-tab="clientes">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Registrar Boleta</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Nombre del Cliente:</label>
              <input 
                type="text"
                className="form-control form-control-lg"
                placeholder="Nombre completo"
                value={formCliente.nombre}
                onChange={(e) => setFormCliente({...formCliente, nombre: e.target.value})}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Día:</label>
              <select 
                className="form-select form-select-lg"
                value={formCliente.dia}
                onChange={(e) => setFormCliente({...formCliente, dia: e.target.value})}
              >
                {DIAS_SEMANA.map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Monto de la Boleta:</label>
              <input 
                type="number"
                className="form-control form-control-lg"
                placeholder="0"
                value={formCliente.monto}
                onChange={(e) => setFormCliente({...formCliente, monto: e.target.value})}
              />
            </div>

            <button 
              className="btn btn-success btn-lg w-100"
              onClick={handleAgregarBoleta}
            >
              ✅ Agregar Boleta
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-7">
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Clientes con Cuenta Corriente</h5>
          </div>
          <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {!semanaActiva?.clientesCuenta || semanaActiva.clientesCuenta.length === 0 ? (
              <p className="text-muted text-center">No hay clientes con cuenta</p>
            ) : (
              <div className="row">
                {semanaActiva.clientesCuenta.map((cliente, clienteIndex) => {
                  const deuda = calcularDeudaCliente(cliente);
                  const isExpanded = expandedClientes[clienteIndex];
                  
                  return (
                    <div key={clienteIndex} className={`mb-3 card-transition ${editingClientes === clienteIndex ? 'col-12 card-expand' : 'col-lg-6 col-md-12'}`}>
                      <div 
                        className={`card border-primary h-100 ${editingClientes !== clienteIndex ? 'smooth-hover' : ''}`}
                        style={{ cursor: editingClientes === clienteIndex ? 'default' : 'pointer' }}
                        onClick={() => editingClientes === clienteIndex ? null : toggleExpandedClientes(clienteIndex)}
                      >
                        {!isExpanded ? (
                          <div className="card-body p-2 text-center">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">
                                <strong>{cliente.nombre}</strong>
                              </h6>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={(e) => handleEliminarCliente(e, clienteIndex)}
                                title="Eliminar cliente"
                              >
                                ✕
                              </button>
                            </div>
                            <h5 className="text-danger mb-1">
                              <strong>{formatCurrency(deuda)}</strong>
                            </h5>
                            <small className="text-muted">
                              {cliente.boletas.length} boletas
                            </small>
                          </div>
                        ) : (
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                {editingClientes === clienteIndex ? (
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    style={{width: '200px'}}
                                    value={tempClientesData.nombre}
                                    onChange={(e) => setTempClientesData(prev => ({...prev, nombre: e.target.value}))}
                                  />
                                ) : (
                                  <h6 className="mb-1">
                                    <strong>{cliente.nombre}</strong>
                                  </h6>
                                )}
                              </div>
                              <div className="d-flex gap-1">
                                {editingClientes === clienteIndex ? (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-success"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditingClientes(clienteIndex);
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingClientes();
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-warning"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingClientes(clienteIndex, cliente);
                                      }}
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => handleEliminarCliente(e, clienteIndex)}
                                      title="Eliminar cliente"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-2">
                              <span className="badge bg-danger fs-6">
                                Debe: {editingClientes === clienteIndex ? 
                                  formatCurrency(tempClientesData.boletas?.reduce((sum, b) => sum + b.monto, 0) || 0) :
                                  formatCurrency(deuda)
                                }
                              </span>
                            </div>
                            
                            {editingClientes === clienteIndex ? (
                              <div className="fade-in">
                                <table className="table table-sm mb-0">
                                  <thead>
                                    <tr>
                                      <th>Día</th>
                                      <th>Monto</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tempClientesData.boletas.map((boleta, i) => (
                                      <tr key={i}>
                                        <td>
                                          <select 
                                            className="form-select form-select-sm" 
                                            value={boleta.dia}
                                            onChange={(e) => updateBoleta(i, 'dia', e.target.value)}
                                          >
                                            {DIAS_SEMANA.map(dia => (
                                              <option key={dia} value={dia}>{dia}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td>
                                          <input 
                                            type="number" 
                                            className="form-control form-control-sm" 
                                            value={boleta.monto}
                                            onChange={(e) => updateBoleta(i, 'monto', parseFloat(e.target.value) || 0)}
                                          />
                                        </td>
                                        <td>
                                          <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              eliminarBoletaEnEdicion(i);
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <button 
                                  className="btn btn-sm btn-outline-primary mt-2 w-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    agregarBoletaEnEdicion();
                                  }}
                                >
                                  + Agregar Boleta
                                </button>
                              </div>
                            ) : (
                              <div>
                                <table className="table table-sm mb-0">
                                  <thead>
                                    <tr>
                                      <th>Día</th>
                                      <th className="text-end">Monto</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cliente.boletas.map((boleta, boletaIndex) => (
                                      <tr key={boletaIndex}>
                                        <td>{boleta.dia}</td>
                                        <td className="text-end">{formatCurrency(boleta.monto)}</td>
                                        <td>
                                          <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              eliminarBoletaCliente(cliente.nombre, boletaIndex);
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


