import { useState, useEffect, useRef } from 'react';
import { DIAS_SEMANA, TIPOS_EMBUTIDOS, getDiaActual } from './constants';
import { formatCurrency } from '../../utils/money';
import ConfirmModal from '../ConfirmModal';

export default function EmbutidosTab({ 
  semanaActiva, 
  agregarEmbutidos, 
  eliminarEmbutidos, 
  actualizarEmbutidos,
  getConfiguracionesUsuario,
  guardarConfiguracionesUsuario,
  addNotification,
  user
}) {
  const [expandedEmbutidos, setExpandedEmbutidos] = useState({});
  const [editingEmbutidos, setEditingEmbutidos] = useState(null);
  const [tempEmbutidosData, setTempEmbutidosData] = useState({});
  const [tiposEmbutidosPersonalizados, setTiposEmbutidosPersonalizados] = useState([]);
  const [nuevoTipoEmbutido, setNuevoTipoEmbutido] = useState('');
  const [mostrarInputNuevoTipo, setMostrarInputNuevoTipo] = useState(false);
  const nuevoTipoInputRef = useRef(null);
  const agregarEntradaBtnRef = useRef(null);
  
  const [showWarningPrecios, setShowWarningPrecios] = useState(false);
  const [preciosHighlight, setPreciosHighlight] = useState(new Set());

  const [formEmbutidos, setFormEmbutidos] = useState({
    dia: getDiaActual(),
    embutidos: {}
  });

  useEffect(() => {
    const cargarTiposPersonalizados = async () => {
      if (user?.uid) {
        try {
          const configs = await getConfiguracionesUsuario();
          if (configs?.tiposEmbutidosPersonalizados) {
            setTiposEmbutidosPersonalizados(configs.tiposEmbutidosPersonalizados);
          }
        } catch (error) {
          console.error('Error cargando tipos personalizados:', error);
        }
      }
    };
    cargarTiposPersonalizados();
  }, [user?.uid, getConfiguracionesUsuario]);

  const agregarTipoEmbutidoPersonalizado = async () => {
    const tipoTrimmed = nuevoTipoEmbutido.trim();
    if (!tipoTrimmed) {
      addNotification('Ingrese un nombre para el nuevo tipo', 'warning');
      return;
    }

    const todosLosTipos = [...TIPOS_EMBUTIDOS, ...tiposEmbutidosPersonalizados];
    if (todosLosTipos.includes(tipoTrimmed)) {
      addNotification('Este tipo ya existe', 'warning');
      return;
    }

    const nuevosPersonalizados = [...tiposEmbutidosPersonalizados, tipoTrimmed];
    setTiposEmbutidosPersonalizados(nuevosPersonalizados);
    
    try {
      await guardarConfiguracionesUsuario({
        tiposEmbutidosPersonalizados: nuevosPersonalizados
      });
      addNotification(`Tipo "${tipoTrimmed}" agregado exitosamente`, 'success');
      setNuevoTipoEmbutido('');
      setMostrarInputNuevoTipo(false);
    } catch (error) {
      console.error('Error guardando tipo personalizado:', error);
      addNotification('Error al guardar el tipo personalizado', 'error');
    }
  };

  const getTodosLosTiposEmbutidos = () => {
    return [...TIPOS_EMBUTIDOS, ...tiposEmbutidosPersonalizados];
  };

  const toggleExpandedEmbutidos = (index) => {
    if (editingEmbutidos !== null) {
      cancelEditingEmbutidos();
    }
    setExpandedEmbutidos(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        return {};
      } else {
        return { [index]: true };
      }
    });
  };

  const startEditingEmbutidos = (index, entrada) => {
    setEditingEmbutidos(index);
    setTempEmbutidosData({
      dia: entrada.dia,
      embutidos: [...entrada.embutidos]
    });
  };

  const cancelEditingEmbutidos = () => {
    setEditingEmbutidos(null);
    setTempEmbutidosData({});
  };

  const saveEditingEmbutidos = async (index) => {
    try {
      await actualizarEmbutidos(index, tempEmbutidosData);
      addNotification('Embutidos actualizados', 'success');
      setEditingEmbutidos(null);
      setTempEmbutidosData({});
      setExpandedEmbutidos({});
    } catch (error) {
      addNotification('Error al actualizar embutidos', 'error');
      console.error(error);
    }
  };

  const updateEmbutido = (embutidoIndex, field, value) => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: prev.embutidos.map((embutido, index) => 
        index === embutidoIndex ? { ...embutido, [field]: value } : embutido
      )
    }));
  };

  const eliminarEmbutidoEnEdicion = (embutidoIndex) => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: prev.embutidos.filter((_, index) => index !== embutidoIndex)
    }));
  };

  const agregarEmbutidoEnEdicion = () => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: [...prev.embutidos, { tipo: 'Nuevo Tipo', kg: 0, precioKg: 0 }]
    }));
  };

  const handleAgregarEmbutidos = async (forzarSinPrecios = false) => {
    try {
      const embutidosConDatos = Object.entries(formEmbutidos.embutidos)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([tipo, datos]) => ({ 
          tipo, 
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      if (embutidosConDatos.length === 0) {
        addNotification('Debe ingresar al menos un tipo de embutido con kilos', 'warning');
        return;
      }

      if (!forzarSinPrecios) {
        const sinPrecio = embutidosConDatos.filter(e => !e.precioKg || e.precioKg === 0);
        if (sinPrecio.length > 0) {
          setShowWarningPrecios(true);
          return;
        }
      }

      await agregarEmbutidos({
        dia: formEmbutidos.dia,
        embutidos: embutidosConDatos
      });

      setFormEmbutidos({
        dia: formEmbutidos.dia,
        embutidos: {}
      });

      addNotification('Embutidos agregados', 'success');
    } catch (err) {
      addNotification('Error al agregar embutidos', 'error');
    }
  };

  const calcularTotalesEmbutidos = () => {
    if (!semanaActiva?.embutidos) return { porTipo: {}, total: 0 };

    const porTipo = {};
    let total = 0;

    semanaActiva.embutidos.forEach(entrada => {
      entrada.embutidos.forEach(({ tipo, kg }) => {
        porTipo[tipo] = (porTipo[tipo] || 0) + kg;
        total += kg;
      });
    });

    return { porTipo, total };
  };

  const handleCloseWarningPrecios = () => {
    setShowWarningPrecios(false);
    const sinPrecio = Object.entries(formEmbutidos.embutidos)
      .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0 && (!datos.precioKg || parseFloat(datos.precioKg) === 0))
      .map(([tipo]) => tipo);
    if (sinPrecio.length > 0) {
      const nombres = new Set(sinPrecio);
      setPreciosHighlight(new Set());
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPreciosHighlight(nombres);
          setTimeout(() => setPreciosHighlight(new Set()), 1000);
        });
      });
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (nuevoTipoInputRef.current && e.target === nuevoTipoInputRef.current) return;
    if (e.target === agregarEntradaBtnRef.current) return;
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    handleAgregarEmbutidos();
  };

  return (
    <>
    <div className="row">
      <div className="col-lg-5" data-tab="embutidos">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Agregar Embutidos</h5>
          </div>
          <div className="card-body" onKeyDown={handleFormKeyDown}>
            <div className="mb-3">
              <label className="form-label fw-bold">Día de la semana:</label>
              <select 
                className="form-select form-select-lg"
                value={formEmbutidos.dia}
                onChange={(e) => setFormEmbutidos({...formEmbutidos, dia: e.target.value})}
              >
                {DIAS_SEMANA.map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0">Embutidos (kg y precio por kg):</label>
                <button 
                  className="btn btn-sm btn-outline-success"
                  onClick={() => setMostrarInputNuevoTipo(!mostrarInputNuevoTipo)}
                >
                  {mostrarInputNuevoTipo ? '✕ Cancelar' : '➕ Agregar Tipo'}
                </button>
              </div>
              
              {mostrarInputNuevoTipo && (
                <div className="card mb-3 border-success">
                  <div className="card-body p-3">
                    <div className="input-group">
                      <input 
                        ref={nuevoTipoInputRef}
                        type="text"
                        className="form-control"
                        placeholder="Nombre del nuevo tipo de embutido"
                        value={nuevoTipoEmbutido}
                        onChange={(e) => setNuevoTipoEmbutido(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarTipoEmbutidoPersonalizado();
                          }
                        }}
                      />
                      <button 
                        className="btn btn-success"
                        onClick={agregarTipoEmbutidoPersonalizado}
                      >
                        ✅ Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                {getTodosLosTiposEmbutidos().map(tipo => {
                  const esPersonalizado = tiposEmbutidosPersonalizados.includes(tipo);
                  return (
                    <div key={tipo} className="col-lg-4 col-md-6 mb-3">
                      <div className={`card h-100 ${esPersonalizado ? 'border-success' : ''}`}>
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{tipo}</label>
                            {esPersonalizado && (
                              <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>Personalizado</span>
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
                                value={formEmbutidos.embutidos[tipo]?.kg || ''}
                                onChange={(e) => setFormEmbutidos({
                                  ...formEmbutidos,
                                  embutidos: { 
                                    ...formEmbutidos.embutidos, 
                                    [tipo]: {
                                      ...formEmbutidos.embutidos[tipo],
                                      kg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className={`input-group input-group-sm${preciosHighlight.has(tipo) ? ' precio-alert-highlight' : ''}`}>
                              <span className="input-group-text">$/Kg</span>
                              <input 
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.01"
                                value={formEmbutidos.embutidos[tipo]?.precioKg || ''}
                                onChange={(e) => setFormEmbutidos({
                                  ...formEmbutidos,
                                  embutidos: { 
                                    ...formEmbutidos.embutidos, 
                                    [tipo]: {
                                      ...formEmbutidos.embutidos[tipo],
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
              </div>
            </div>

            <button 
              ref={agregarEntradaBtnRef}
              type="button"
              className="btn btn-success btn-lg w-100"
              onClick={handleAgregarEmbutidos}
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
            {!semanaActiva?.embutidos || semanaActiva.embutidos.length === 0 ? (
              <p className="text-muted text-center">No hay entradas registradas</p>
            ) : (
              <div className="row">
                {semanaActiva.embutidos.map((entrada, index) => {
                  const totalKilos = entrada.embutidos.reduce((sum, emb) => sum + emb.kg, 0);
                  const costoTotal = entrada.embutidos.reduce((sum, emb) => sum + (emb.kg * (emb.precioKg || 0)), 0);
                  const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
                  const isExpanded = expandedEmbutidos[index];
                  
                  return (
                    <div key={index} className={`mb-3 card-transition ${editingEmbutidos === index ? 'col-12 card-expand' : 'col-md-4 col-sm-6'}`}>
                      <div 
                        className={`card border-primary h-100 ${editingEmbutidos !== index ? 'smooth-hover' : ''}`}
                        style={{ cursor: editingEmbutidos === index ? 'default' : 'pointer' }}
                        onClick={() => editingEmbutidos === index ? null : toggleExpandedEmbutidos(index)}
                      >
                        {!isExpanded ? (
                          <div className="card-body p-2 text-center">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">
                                <span className="badge bg-primary">{entrada.dia}</span>
                              </h6>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  eliminarEmbutidos(index);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                            <h5 className="text-primary mb-1">
                              <strong>{Math.round(totalKilos)} kg</strong>
                            </h5>
                            {costoTotal > 0 && (
                              <h6 className="text-success mb-1" style={{ fontSize: '0.9rem' }}>
                                <strong>{formatCurrency(costoTotal)}</strong>
                                {costoPromedioKg > 0 && (
                                  <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.85rem' }}>
                                    ({formatCurrency(costoPromedioKg)}/kg)
                                  </span>
                                )}
                              </h6>
                            )}
                            <small className="text-muted">
                              {entrada.embutidos.length} tipos de embutidos
                            </small>
                          </div>
                        ) : (
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                {editingEmbutidos === index ? (
                                  <div className="d-flex gap-2 align-items-center">
                                    <select 
                                      className="form-select form-select-sm" 
                                      style={{width: 'auto'}}
                                      value={tempEmbutidosData.dia}
                                      onChange={(e) => setTempEmbutidosData(prev => ({...prev, dia: e.target.value}))}
                                    >
                                      {DIAS_SEMANA.map(dia => (
                                        <option key={dia} value={dia}>{dia}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <h6 className="mb-1">
                                    <span className="badge bg-primary">{entrada.dia}</span>
                                  </h6>
                                )}
                              </div>
                              <div className="d-flex gap-1">
                                {editingEmbutidos === index ? (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-success"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditingEmbutidos(index);
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingEmbutidos();
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
                                        startEditingEmbutidos(index, entrada);
                                      }}
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarEmbutidos(index);
                                      }}
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {editingEmbutidos === index ? (
                              <div className="fade-in">
                                <div className="row g-2">
                                  {tempEmbutidosData.embutidos.map((emb, i) => (
                                    <div key={i} className="col-md-3 col-sm-6">
                                      <div className="border rounded p-2 position-relative">
                                        <button 
                                          className="btn btn-sm btn-danger position-absolute"
                                          style={{ top: '2px', right: '2px', padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarEmbutidoEnEdicion(i);
                                          }}
                                          title="Eliminar embutido"
                                        >
                                          ✕
                                        </button>
                                        <input 
                                          type="text" 
                                          className="form-control form-control-sm mb-1" 
                                          value={emb.tipo}
                                          onChange={(e) => updateEmbutido(i, 'tipo', e.target.value)}
                                          placeholder="Tipo de embutido"
                                        />
                                        <div className="input-group input-group-sm mb-1">
                                          <span className="input-group-text" style={{fontSize: '0.75rem'}}>Kg</span>
                                          <input 
                                            type="number" 
                                            className="form-control" 
                                            value={emb.kg}
                                            onChange={(e) => updateEmbutido(i, 'kg', parseFloat(e.target.value) || 0)}
                                            step="0.1"
                                            placeholder="0"
                                          />
                                        </div>
                                        <div className="input-group input-group-sm">
                                          <span className="input-group-text" style={{fontSize: '0.75rem'}}>$/Kg</span>
                                          <input 
                                            type="number" 
                                            className="form-control" 
                                            value={emb.precioKg || 0}
                                            onChange={(e) => updateEmbutido(i, 'precioKg', parseFloat(e.target.value) || 0)}
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
                                        agregarEmbutidoEnEdicion();
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
                                      {tempEmbutidosData.embutidos.reduce((sum, emb) => sum + emb.kg, 0).toFixed(2)} kg
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <ul className="list-unstyled mb-0 small">
                                  {entrada.embutidos.map((emb, i) => (
                                    <li key={i} className="mb-1">
                                      • {emb.tipo}: <strong>{emb.kg.toFixed(2)} kg</strong>
                                      {emb.precioKg ? (
                                        <span className="text-muted"> (${emb.precioKg}/kg = ${(emb.kg * emb.precioKg).toFixed(2)})</span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 pt-2 border-top">
                                  <div className="d-flex justify-content-between">
                                    <strong>Total:</strong>
                                    <strong className="text-primary">
                                      {totalKilos.toFixed(2)} kg
                                    </strong>
                                  </div>
                                  {entrada.embutidos.some(e => e.precioKg) && (
                                    <div className="d-flex justify-content-between mt-1">
                                      <strong>Costo Total:</strong>
                                      <strong className="text-success">
                                        ${entrada.embutidos.reduce((sum, e) => sum + (e.kg * (e.precioKg || 0)), 0).toFixed(2)}
                                      </strong>
                                    </div>
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

        {semanaActiva?.embutidos && semanaActiva.embutidos.length > 0 && (
          <div className="card mt-3 border-success">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Totales Semanales</h5>
            </div>
            <div className="card-body">
              {(() => {
                const { porTipo, total } = calcularTotalesEmbutidos();
                return (
                  <>
                    <div className="row">
                      {Object.entries(porTipo).map(([tipo, kg]) => (
                        <div key={tipo} className="col-6 mb-2">
                          <strong>{tipo}:</strong> {kg.toFixed(2)} kg
                        </div>
                      ))}
                    </div>
                    <hr />
                    <h4 className="text-center mb-0">
                      <strong>TOTAL: {total.toFixed(2)} kg</strong>
                    </h4>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      isOpen={showWarningPrecios}
      onClose={handleCloseWarningPrecios}
      onConfirm={() => handleAgregarEmbutidos(true)}
      title="⚠️ Faltan los precios"
      message="Hay embutidos sin precio por kg. Registrar los precios es clave para calcular tus costos. ¿Querés ingresar igual sin los precios?"
      confirmText="Ingresar sin precios"
      cancelText="Volver a completar"
      confirmButtonClass="btn-warning"
    />
    </>
  );
}


