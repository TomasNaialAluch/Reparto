import { useState } from 'react';
import { DIAS_SEMANA, PROVEEDORES, CORTES_CARNE, getDiaActual } from './constants';
import { formatCurrency } from '../../utils/money';
import ConfirmModal from '../ConfirmModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function MercaderiaTab({ 
  semanaActiva, 
  agregarMercaderia, 
  eliminarMercaderia, 
  actualizarMercaderia,
  addNotification 
}) {
  const [expandedMercaderia, setExpandedMercaderia] = useState({});
  const [editingMercaderia, setEditingMercaderia] = useState(null);
  const [tempMercaderiaData, setTempMercaderiaData] = useState({});
  const [showDeleteCorteModal, setShowDeleteCorteModal] = useState(false);
  const [corteToDelete, setCorteToDelete] = useState(null);
  
  const [formMercaderia, setFormMercaderia] = useState({
    dia: getDiaActual(),
    proveedor: 'Catriel',
    proveedorOtro: '',
    cortes: {}
  });
  
  const [nuevoCorte, setNuevoCorte] = useState('');
  const [mostrarInputNuevoCorte, setMostrarInputNuevoCorte] = useState(false);

  const toggleExpandedMercaderia = (index) => {
    if (editingMercaderia !== null) {
      cancelEditingMercaderia();
    }
    setExpandedMercaderia(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        return {};
      } else {
        return { [index]: true };
      }
    });
  };

  const startEditingMercaderia = (index, entrada) => {
    setEditingMercaderia(index);
    setTempMercaderiaData({
      dia: entrada.dia,
      proveedor: entrada.proveedor,
      cortes: [...entrada.cortes]
    });
  };

  const cancelEditingMercaderia = () => {
    setEditingMercaderia(null);
    setTempMercaderiaData({});
  };

  const saveEditingMercaderia = async (index) => {
    try {
      await actualizarMercaderia(index, tempMercaderiaData);
      addNotification('Mercadería actualizada', 'success');
      setEditingMercaderia(null);
      setTempMercaderiaData({});
      setExpandedMercaderia({});
    } catch (error) {
      addNotification('Error al actualizar mercadería', 'error');
      console.error(error);
    }
  };

  const updateCorte = (corteIndex, field, value) => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: prev.cortes.map((corte, index) => 
        index === corteIndex ? { ...corte, [field]: value } : corte
      )
    }));
  };

  const eliminarCorteEnEdicion = (corteIndex) => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: prev.cortes.filter((_, index) => index !== corteIndex)
    }));
  };

  const confirmarEliminarCorte = (entradaIndex, corteIndex) => {
    const corte = semanaActiva.mercaderia[entradaIndex].cortes[corteIndex];
    setCorteToDelete({ entradaIndex, corteIndex, corte });
    setShowDeleteCorteModal(true);
  };

  const eliminarCorteDeMercaderia = async () => {
    if (!semanaActiva?.mercaderia || !corteToDelete) return;
    
    try {
      const { entradaIndex, corteIndex } = corteToDelete;
      const nuevaMercaderia = [...semanaActiva.mercaderia];
      nuevaMercaderia[entradaIndex].cortes = nuevaMercaderia[entradaIndex].cortes.filter((_, index) => index !== corteIndex);
      
      if (nuevaMercaderia[entradaIndex].cortes.length === 0) {
        nuevaMercaderia.splice(entradaIndex, 1);
      }
      
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), { 
        mercaderia: nuevaMercaderia 
      });
      addNotification('Corte eliminado exitosamente', 'success');
      setShowDeleteCorteModal(false);
      setCorteToDelete(null);
    } catch (error) {
      console.error('Error al eliminar corte:', error);
      addNotification('Error al eliminar el corte', 'error');
    }
  };

  const agregarCorteEnEdicion = () => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: [...prev.cortes, { corte: 'Nuevo Corte', kg: 0, precioKg: 0 }]
    }));
  };

  const agregarNuevoCorte = () => {
    const corteTrimmed = nuevoCorte.trim();
    if (!corteTrimmed) {
      addNotification('Ingrese un nombre para el nuevo corte', 'warning');
      return;
    }

    if (formMercaderia.cortes[corteTrimmed]) {
      addNotification('Este corte ya existe', 'warning');
      return;
    }

    setFormMercaderia(prev => ({
      ...prev,
      cortes: {
        ...prev.cortes,
        [corteTrimmed]: { kg: '', precioKg: '' }
      }
    }));

    setNuevoCorte('');
    setMostrarInputNuevoCorte(false);
    addNotification(`Corte "${corteTrimmed}" agregado`, 'success');
  };

  const eliminarCorteDelFormulario = (corte) => {
    setFormMercaderia(prev => {
      const nuevosCortes = { ...prev.cortes };
      delete nuevosCortes[corte];
      return {
        ...prev,
        cortes: nuevosCortes
      };
    });
  };

  const handleAgregarMercaderia = async () => {
    try {
      const cortesConDatos = Object.entries(formMercaderia.cortes)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([corte, datos]) => ({ 
          corte, 
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      if (cortesConDatos.length === 0) {
        addNotification('Debe ingresar al menos un corte con kilos', 'warning');
        return;
      }

      const proveedor = formMercaderia.proveedor === 'Otro' 
        ? formMercaderia.proveedorOtro 
        : formMercaderia.proveedor;

      if (!proveedor) {
        addNotification('Debe especificar un proveedor', 'warning');
        return;
      }

      await agregarMercaderia({
        dia: formMercaderia.dia,
        proveedor,
        cortes: cortesConDatos
      });

      setFormMercaderia({
        dia: formMercaderia.dia,
        proveedor: 'Catriel',
        proveedorOtro: '',
        cortes: {}
      });

      addNotification('Mercadería agregada', 'success');
    } catch (err) {
      addNotification('Error al agregar mercadería', 'error');
    }
  };

  const calcularTotalesMercaderia = () => {
    if (!semanaActiva?.mercaderia) return { porCorte: {}, total: 0 };

    const porCorte = {};
    let total = 0;

    semanaActiva.mercaderia.forEach(entrada => {
      entrada.cortes.forEach(({ corte, kg }) => {
        porCorte[corte] = (porCorte[corte] || 0) + kg;
        total += kg;
      });
    });

    return { porCorte, total };
  };

  return (
    <div className="row">
      <div className="col-lg-5" data-tab="mercaderia">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Agregar Mercadería (Carne)</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Día de la semana:</label>
              <select 
                className="form-select form-select-lg"
                value={formMercaderia.dia}
                onChange={(e) => setFormMercaderia({...formMercaderia, dia: e.target.value})}
              >
                {DIAS_SEMANA.map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Proveedor:</label>
              <select 
                className="form-select form-select-lg"
                value={formMercaderia.proveedor}
                onChange={(e) => setFormMercaderia({...formMercaderia, proveedor: e.target.value})}
              >
                {PROVEEDORES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
                <option value="Otro">Otro...</option>
              </select>
            </div>

            {formMercaderia.proveedor === 'Otro' && (
              <div className="mb-3">
                <input 
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Nombre del proveedor"
                  value={formMercaderia.proveedorOtro}
                  onChange={(e) => setFormMercaderia({...formMercaderia, proveedorOtro: e.target.value})}
                />
              </div>
            )}

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0">Cortes (kg y precio por kg):</label>
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => setMostrarInputNuevoCorte(!mostrarInputNuevoCorte)}
                >
                  {mostrarInputNuevoCorte ? '✕ Cancelar' : '➕ Agregar Corte'}
                </button>
              </div>

              {mostrarInputNuevoCorte && (
                <div className="card mb-3 border-success">
                  <div className="card-body p-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre del nuevo corte (ej: Bife de chorizo, Asado, etc.)"
                        value={nuevoCorte}
                        onChange={(e) => setNuevoCorte(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            agregarNuevoCorte();
                          }
                        }}
                      />
                      <button
                        className="btn btn-success"
                        onClick={agregarNuevoCorte}
                      >
                        ✅ Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                {CORTES_CARNE.map(corte => {
                  const esPersonalizado = !CORTES_CARNE.includes(corte);
                  return (
                    <div key={corte} className="col-lg-4 col-md-6 mb-3">
                      <div className={`card h-100 ${esPersonalizado ? 'border-success' : ''}`}>
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{corte}</label>
                            {esPersonalizado && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                onClick={() => eliminarCorteDelFormulario(corte)}
                                title="Eliminar corte"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">Kg</span>
                              <input 
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.1"
                                value={formMercaderia.cortes[corte]?.kg || ''}
                                onChange={(e) => setFormMercaderia({
                                  ...formMercaderia,
                                  cortes: { 
                                    ...formMercaderia.cortes, 
                                    [corte]: {
                                      ...formMercaderia.cortes[corte],
                                      kg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">$/Kg</span>
                              <input 
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.01"
                                value={formMercaderia.cortes[corte]?.precioKg || ''}
                                onChange={(e) => setFormMercaderia({
                                  ...formMercaderia,
                                  cortes: { 
                                    ...formMercaderia.cortes, 
                                    [corte]: {
                                      ...formMercaderia.cortes[corte],
                                      precioKg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Object.keys(formMercaderia.cortes)
                  .filter(corte => !CORTES_CARNE.includes(corte))
                  .map(corte => (
                    <div key={corte} className="col-lg-4 col-md-6 mb-3">
                      <div className="card h-100 border-success">
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                              {corte}
                              <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>Personalizado</span>
                            </label>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                              onClick={() => eliminarCorteDelFormulario(corte)}
                              title="Eliminar corte"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">Kg</span>
                              <input 
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.1"
                                value={formMercaderia.cortes[corte]?.kg || ''}
                                onChange={(e) => setFormMercaderia({
                                  ...formMercaderia,
                                  cortes: { 
                                    ...formMercaderia.cortes, 
                                    [corte]: {
                                      ...formMercaderia.cortes[corte],
                                      kg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">$/Kg</span>
                              <input 
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.01"
                                value={formMercaderia.cortes[corte]?.precioKg || ''}
                                onChange={(e) => setFormMercaderia({
                                  ...formMercaderia,
                                  cortes: { 
                                    ...formMercaderia.cortes, 
                                    [corte]: {
                                      ...formMercaderia.cortes[corte],
                                      precioKg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <button 
              className="btn btn-success btn-lg w-100"
              onClick={handleAgregarMercaderia}
            >
              ✅ Agregar Entrada
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-7">
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Entradas de la Semana</h5>
          </div>
          <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {!semanaActiva?.mercaderia || semanaActiva.mercaderia.length === 0 ? (
              <p className="text-muted text-center">No hay entradas registradas</p>
            ) : (
              <div className="row">
                {semanaActiva.mercaderia.map((entrada, index) => {
                  const totalKilos = entrada.cortes.reduce((sum, corte) => sum + corte.kg, 0);
                  const costoTotal = entrada.cortes.reduce((sum, corte) => sum + (corte.kg * (corte.precioKg || 0)), 0);
                  const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
                  const isExpanded = expandedMercaderia[index];
                  
                  return (
                    <div key={index} className={`mb-3 card-transition ${editingMercaderia === index ? 'col-12 card-expand' : 'col-lg-4 col-md-6 col-sm-6'}`}>
                      <div 
                        className={`card border-primary h-100 ${editingMercaderia !== index ? 'smooth-hover' : ''}`}
                        style={{ cursor: editingMercaderia === index ? 'default' : 'pointer' }}
                        onClick={() => editingMercaderia === index ? null : toggleExpandedMercaderia(index)}
                      >
                        {!isExpanded ? (
                          <div className="card-body p-2 text-center">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">
                                <span className="badge bg-primary">{entrada.dia}</span>
                                {' '}
                                <strong>{entrada.proveedor}</strong>
                              </h6>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  eliminarMercaderia(index);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                            <h5 className="text-primary mb-1">
                              <strong>{totalKilos} kg</strong>
                            </h5>
                            {costoPromedioKg > 0 && (
                              <h6 className="text-success mb-1" style={{ fontSize: '0.9rem' }}>
                                <strong>${costoPromedioKg.toFixed(2)}/kg</strong>
                              </h6>
                            )}
                            <small className="text-muted">
                              {entrada.cortes.length} tipos de corte
                            </small>
                          </div>
                        ) : (
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                {editingMercaderia === index ? (
                                  <div className="d-flex gap-2 align-items-center">
                                    <select 
                                      className="form-select form-select-sm" 
                                      style={{width: 'auto'}}
                                      value={tempMercaderiaData.dia}
                                      onChange={(e) => setTempMercaderiaData(prev => ({...prev, dia: e.target.value}))}
                                    >
                                      {DIAS_SEMANA.map(dia => (
                                        <option key={dia} value={dia}>{dia}</option>
                                      ))}
                                    </select>
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm" 
                                      style={{width: '120px'}}
                                      value={tempMercaderiaData.proveedor}
                                      onChange={(e) => setTempMercaderiaData(prev => ({...prev, proveedor: e.target.value}))}
                                    />
                                  </div>
                                ) : (
                                  <h6 className="mb-1">
                                    <span className="badge bg-primary">{entrada.dia}</span>
                                    {' '}
                                    <strong>{entrada.proveedor}</strong>
                                  </h6>
                                )}
                              </div>
                              <div className="d-flex gap-1">
                                {editingMercaderia === index ? (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-success"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditingMercaderia(index);
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingMercaderia();
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
                                        startEditingMercaderia(index, entrada);
                                      }}
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarMercaderia(index);
                                      }}
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {editingMercaderia === index ? (
                              <div className="fade-in">
                                <div className="row g-2">
                                  {tempMercaderiaData.cortes.map((corte, i) => (
                                    <div key={i} className="col-md-3 col-sm-6">
                                      <div className="border rounded p-2 position-relative">
                                        <button 
                                          className="btn btn-sm btn-danger position-absolute"
                                          style={{ top: '2px', right: '2px', padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarCorteEnEdicion(i);
                                          }}
                                          title="Eliminar corte"
                                        >
                                          ✕
                                        </button>
                                        <input 
                                          type="text" 
                                          className="form-control form-control-sm mb-1" 
                                          value={corte.corte}
                                          onChange={(e) => updateCorte(i, 'corte', e.target.value)}
                                          placeholder="Nombre del corte"
                                        />
                                        <div className="input-group input-group-sm mb-1">
                                          <span className="input-group-text" style={{fontSize: '0.75rem'}}>Kg</span>
                                          <input 
                                            type="number" 
                                            className="form-control" 
                                            value={corte.kg}
                                            onChange={(e) => updateCorte(i, 'kg', parseFloat(e.target.value) || 0)}
                                            step="0.1"
                                            placeholder="0"
                                          />
                                        </div>
                                        <div className="input-group input-group-sm">
                                          <span className="input-group-text" style={{fontSize: '0.75rem'}}>$/Kg</span>
                                          <input 
                                            type="number" 
                                            className="form-control" 
                                            value={corte.precioKg || 0}
                                            onChange={(e) => updateCorte(i, 'precioKg', parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                            placeholder="0"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="col-md-3 col-sm-6">
                                    <button 
                                      className="btn btn-outline-primary w-100 h-100 d-flex align-items-center justify-content-center"
                                      style={{ minHeight: '80px' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        agregarCorteEnEdicion();
                                      }}
                                    >
                                      <span style={{ fontSize: '2rem' }}>+</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-3 pt-2 border-top">
                                  <div className="d-flex justify-content-between">
                                    <strong>Total:</strong>
                                    <strong className="text-primary fs-5">
                                      {tempMercaderiaData.cortes.reduce((sum, corte) => sum + corte.kg, 0).toFixed(1)} kg
                                    </strong>
                                  </div>
                                  {tempMercaderiaData.cortes.some(c => c.precioKg && c.precioKg > 0) && (
                                    <>
                                      <div className="d-flex justify-content-between mt-1">
                                        <strong>Costo Total:</strong>
                                        <strong className="text-success">
                                          ${tempMercaderiaData.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0).toFixed(2)}
                                        </strong>
                                      </div>
                                      <div className="d-flex justify-content-between mt-1">
                                        <strong>Costo Promedio:</strong>
                                        <strong className="text-info">
                                          ${tempMercaderiaData.cortes.reduce((sum, c) => sum + c.kg, 0) > 0 ? 
                                            (tempMercaderiaData.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0) / 
                                             tempMercaderiaData.cortes.reduce((sum, c) => sum + c.kg, 0)).toFixed(2) : '0.00'}/kg
                                        </strong>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <ul className="list-unstyled mb-0 small">
                                  {entrada.cortes.map((corte, i) => (
                                    <li key={i} className="mb-1 d-flex justify-content-between align-items-center">
                                      <div>
                                        • {corte.corte}: <strong>{corte.kg} kg</strong>
                                        {corte.precioKg ? (
                                          <span className="text-muted"> (${corte.precioKg}/kg = ${(corte.kg * corte.precioKg).toFixed(2)})</span>
                                        ) : null}
                                      </div>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmarEliminarCorte(index, i);
                                        }}
                                        title="Eliminar corte"
                                      >
                                        ✕
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 pt-2 border-top">
                                  <div className="d-flex justify-content-between">
                                    <strong>Total:</strong>
                                    <strong className="text-primary">
                                      {totalKilos} kg
                                    </strong>
                                  </div>
                                  {entrada.cortes.some(c => c.precioKg) && (
                                    <>
                                      <div className="d-flex justify-content-between mt-1">
                                        <strong>Costo Total:</strong>
                                        <strong className="text-success">
                                          ${entrada.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0).toFixed(2)}
                                        </strong>
                                      </div>
                                      <div className="d-flex justify-content-between mt-1">
                                        <strong>Costo Promedio:</strong>
                                        <strong className="text-info">
                                          ${costoPromedioKg.toFixed(2)}/kg
                                        </strong>
                                      </div>
                                    </>
                                  )}
                                </div>
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

        {semanaActiva?.mercaderia && semanaActiva.mercaderia.length > 0 && (
          <div className="card mt-3 border-success">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Totales Semanales</h5>
            </div>
            <div className="card-body">
              {(() => {
                const { porCorte, total } = calcularTotalesMercaderia();
                return (
                  <>
                    <div className="row">
                      {Object.entries(porCorte).map(([corte, kg]) => (
                        <div key={corte} className="col-6 mb-2">
                          <strong>{corte}:</strong> {kg.toFixed(1)} kg
                        </div>
                      ))}
                    </div>
                    <hr />
                    <h4 className="text-center mb-0">
                      <strong>TOTAL: {total.toFixed(1)} kg</strong>
                    </h4>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteCorteModal}
        onClose={() => {
          setShowDeleteCorteModal(false);
          setCorteToDelete(null);
        }}
        onConfirm={eliminarCorteDeMercaderia}
        title="Eliminar Corte"
        message={`¿Estás seguro de que querés eliminar el corte "${corteToDelete?.corte?.corte}"?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
      />
    </div>
  );
}


