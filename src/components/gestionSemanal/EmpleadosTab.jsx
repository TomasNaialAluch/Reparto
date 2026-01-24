import { useState, useEffect, useRef } from 'react';
import { DIAS_SEMANA, EMPLEADOS_DEFAULT, getDiaActual } from './constants';
import { formatCurrency } from '../../utils/money';
import PrintDocument from '../PrintDocument';

export default function EmpleadosTab({ 
  semanaActiva, 
  gestionarEmpleado,
  agregarAdelanto,
  eliminarAdelanto,
  addNotification 
}) {
  const [formEmpleado, setFormEmpleado] = useState({
    nombre: 'Jorge',
    nombreOtro: '',
    sueldoSemanal: ''
  });

  const [formAdelanto, setFormAdelanto] = useState({
    empleado: '',
    dia: getDiaActual(),
    monto: '',
    descripcion: ''
  });

  const [editingSueldoId, setEditingSueldoId] = useState(null);
  const [tempSueldoValue, setTempSueldoValue] = useState('');
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState({});
  const [hoverTimeout, setHoverTimeout] = useState({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const botonAdelantoRef = useRef(null);
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [empleadoAsistencia, setEmpleadoAsistencia] = useState(null);
  const [diasTrabajadosTemp, setDiasTrabajadosTemp] = useState([]);

  useEffect(() => {
    if (semanaActiva?.empleados && semanaActiva.empleados.length > 0) {
      if (!formAdelanto.empleado || !semanaActiva.empleados.find(emp => emp.nombre === formAdelanto.empleado)) {
        setFormAdelanto(prev => ({
          ...prev,
          empleado: semanaActiva.empleados[0].nombre
        }));
      }
    }
  }, [semanaActiva?.empleados]);

  const handleAgregarEmpleado = async () => {
    try {
      const nombre = formEmpleado.nombre === 'Otro' 
        ? formEmpleado.nombreOtro 
        : formEmpleado.nombre;

      if (!nombre || !formEmpleado.sueldoSemanal) {
        addNotification('Complete todos los campos', 'warning');
        return;
      }

      await gestionarEmpleado({
        nombre,
        sueldoSemanal: parseFloat(formEmpleado.sueldoSemanal)
      });

      setFormEmpleado({
        nombre: 'Jorge',
        nombreOtro: '',
        sueldoSemanal: ''
      });

      addNotification('Empleado configurado', 'success');
    } catch (err) {
      addNotification('Error al configurar empleado', 'error');
    }
  };

  const handleAgregarAdelanto = async () => {
    try {
      if (!formAdelanto.monto) {
        addNotification('Debe ingresar un monto', 'warning');
        return;
      }

      await agregarAdelanto({
        empleado: formAdelanto.empleado,
        dia: formAdelanto.dia,
        monto: parseFloat(formAdelanto.monto),
        descripcion: formAdelanto.descripcion
      });

      setFormAdelanto({
        empleado: formAdelanto.empleado,
        dia: getDiaActual(),
        monto: '',
        descripcion: ''
      });

      addNotification('Adelanto registrado', 'success');
    } catch (err) {
      addNotification('Error al registrar adelanto', 'error');
    }
  };

  // Función para calcular sueldo con descuentos por faltas
  const calcularSueldoConDescuentos = (empleado) => {
    const diasTrabajadosEmpleado = empleado.diasTrabajados || DIAS_SEMANA;
    const diasFaltados = DIAS_SEMANA.filter(dia => !diasTrabajadosEmpleado.includes(dia));
    const sueldoPorDia = empleado.sueldoSemanal / DIAS_SEMANA.length;
    const descuentoPorFaltas = diasFaltados.length * sueldoPorDia;
    
    return {
      sueldoOriginal: empleado.sueldoSemanal,
      diasTrabajados: diasTrabajadosEmpleado,
      diasFaltados,
      descuentoPorFaltas,
      sueldoFinal: empleado.sueldoSemanal - descuentoPorFaltas
    };
  };

  const calcularDeudaEmpleado = (empleado) => {
    const adelantos = semanaActiva?.adelantos || [];
    const totalAdelantos = adelantos
      .filter(a => a.empleado === empleado.nombre)
      .reduce((sum, a) => sum + a.monto, 0);
    
    const { sueldoFinal } = calcularSueldoConDescuentos(empleado);
    
    return sueldoFinal - totalAdelantos;
  };

  const iniciarEdicionSueldo = (empleado) => {
    setEditingSueldoId(empleado.nombre);
    setTempSueldoValue(empleado.sueldoSemanal.toString());
  };

  const guardarSueldoEditado = async (empleado) => {
    try {
      const nuevoSueldo = parseFloat(tempSueldoValue);
      
      if (isNaN(nuevoSueldo) || nuevoSueldo < 0) {
        addNotification('El sueldo debe ser un número válido y positivo', 'warning');
        return;
      }

      await gestionarEmpleado({
        ...empleado,
        sueldoSemanal: nuevoSueldo
      });

      setEditingSueldoId(null);
      setTempSueldoValue('');
      addNotification('Sueldo actualizado correctamente', 'success');
    } catch (err) {
      addNotification('Error al actualizar sueldo', 'error');
    }
  };

  const cancelarEdicionSueldo = () => {
    setEditingSueldoId(null);
    setTempSueldoValue('');
  };

  const handleMouseEnter = (empleado) => {
    if (hoverTimeout[empleado]) {
      clearTimeout(hoverTimeout[empleado]);
    }
    
    const timeout = setTimeout(() => {
      setTooltipVisible(prev => ({ ...prev, [empleado]: true }));
    }, 2000);
    
    setHoverTimeout(prev => ({ ...prev, [empleado]: timeout }));
  };

  const handleMouseLeave = (empleado) => {
    if (hoverTimeout[empleado]) {
      clearTimeout(hoverTimeout[empleado]);
      setHoverTimeout(prev => ({ ...prev, [empleado]: null }));
    }
    
    setTooltipVisible(prev => ({ ...prev, [empleado]: false }));
  };

  const handleImprimirEmpleado = (empleadoNombre) => {
    if (!semanaActiva) return;
    
    const empleado = semanaActiva.empleados?.find(emp => emp.nombre === empleadoNombre);
    const adelantosEmpleado = semanaActiva.adelantos?.filter(adel => adel.empleado === empleadoNombre) || [];
    
    if (!empleado) return;
    
    const empleadoData = {
      empleado: empleado,
      adelantos: adelantosEmpleado,
      fechaInicio: semanaActiva.fechaInicio,
      tipo: 'empleado'
    };
    
    setPrintData(empleadoData);
    setShowPrintModal(true);
  };

  // Función para abrir modal de asistencia
  const abrirModalAsistencia = (empleado) => {
    const diasTrabajados = empleado.diasTrabajados || DIAS_SEMANA;
    setEmpleadoAsistencia(empleado);
    setDiasTrabajadosTemp([...diasTrabajados]);
    setShowAsistenciaModal(true);
  };

  // Función para guardar días trabajados
  const guardarDiasTrabajados = async () => {
    if (!empleadoAsistencia) return;
    
    try {
      await gestionarEmpleado({
        ...empleadoAsistencia,
        diasTrabajados: diasTrabajadosTemp
      });
      
      addNotification('Días trabajados actualizados', 'success');
      setShowAsistenciaModal(false);
      setEmpleadoAsistencia(null);
    } catch (err) {
      addNotification('Error al actualizar días trabajados', 'error');
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-lg-5">
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Configurar Empleado</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Empleado:</label>
                <select 
                  className="form-select form-select-lg"
                  value={formEmpleado.nombre}
                  onChange={(e) => setFormEmpleado({...formEmpleado, nombre: e.target.value})}
                >
                  {EMPLEADOS_DEFAULT.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                  <option value="Otro">Otro...</option>
                </select>
              </div>

              {formEmpleado.nombre === 'Otro' && (
                <div className="mb-3">
                  <input 
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Nombre del empleado"
                    value={formEmpleado.nombreOtro}
                    onChange={(e) => setFormEmpleado({...formEmpleado, nombreOtro: e.target.value})}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Sueldo Semanal:</label>
                <input 
                  type="number"
                  className="form-control form-control-lg"
                  placeholder="0"
                  value={formEmpleado.sueldoSemanal}
                  onChange={(e) => setFormEmpleado({...formEmpleado, sueldoSemanal: e.target.value})}
                />
              </div>

              <button 
                className="btn btn-success btn-lg w-100"
                onClick={handleAgregarEmpleado}
              >
                ✅ Configurar
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-warning">
              <h5 className="mb-0">Registrar Adelanto</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Empleado:</label>
                <select 
                  className="form-select form-select-lg"
                  value={formAdelanto.empleado}
                  onChange={(e) => setFormAdelanto({...formAdelanto, empleado: e.target.value})}
                >
                  {semanaActiva?.empleados && semanaActiva.empleados.length > 0 ? (
                    semanaActiva.empleados.map(emp => (
                      <option key={emp.nombre} value={emp.nombre}>{emp.nombre}</option>
                    ))
                  ) : (
                    EMPLEADOS_DEFAULT.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Día:</label>
                <select 
                  className="form-select form-select-lg"
                  value={formAdelanto.dia}
                  onChange={(e) => setFormAdelanto({...formAdelanto, dia: e.target.value})}
                >
                  {DIAS_SEMANA.map(dia => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Monto:</label>
                <input 
                  type="number"
                  className="form-control form-control-lg"
                  placeholder="0"
                  value={formAdelanto.monto}
                  onChange={(e) => setFormAdelanto({...formAdelanto, monto: e.target.value})}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Descripción (opcional):</label>
                <input 
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="ej: nafta, adelanto, etc."
                  value={formAdelanto.descripcion}
                  onChange={(e) => setFormAdelanto({...formAdelanto, descripcion: e.target.value})}
                />
              </div>

              <button 
                ref={botonAdelantoRef}
                className="btn btn-warning btn-lg w-100"
                onClick={handleAgregarAdelanto}
              >
                💵 Registrar Adelanto
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card mb-3" data-section="resumen-empleados">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Resumen de Empleados</h5>
            </div>
            <div className="card-body">
              {semanaActiva?.empleados && semanaActiva.empleados.length > 0 && (
                <div className="row mb-3">
                  <div className="col-12">
                    <div className="card border-primary">
                      <div className="card-body text-center py-3">
                        <h6 className="text-muted mb-2">Gasto Total en Sueldos Semanales</h6>
                        <h3 className="text-primary mb-1">
                          <strong>{formatCurrency(semanaActiva.empleados.reduce((sum, emp) => {
                            const { sueldoFinal } = calcularSueldoConDescuentos(emp);
                            return sum + sueldoFinal;
                          }, 0))}</strong>
                        </h3>
                        <small className="text-muted">
                          {semanaActiva.empleados.length} empleado{semanaActiva.empleados.length !== 1 ? 's' : ''} configurado{semanaActiva.empleados.length !== 1 ? 's' : ''}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!semanaActiva?.empleados || semanaActiva.empleados.length === 0 ? (
                <p className="text-muted text-center">No hay empleados configurados</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Empleado</th>
                        <th>Sueldo Semanal</th>
                        <th>Adelantos</th>
                        <th>Debe Cobrar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semanaActiva.empleados.map((emp, index) => {
                        const deuda = calcularDeudaEmpleado(emp);
                        const adelantos = semanaActiva?.adelantos || [];
                        const totalAdelantos = adelantos
                          .filter(a => a.empleado === emp.nombre)
                          .reduce((sum, a) => sum + a.monto, 0);
                        const isEditing = editingSueldoId === emp.nombre;
                        
                        return (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <strong>{emp.nombre}</strong>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => abrirModalAsistencia(emp)}
                                  title="Configurar días trabajados"
                                  style={{ 
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    lineHeight: '1'
                                  }}
                                >
                                  📅
                                </button>
                                {(emp.diasTrabajados && emp.diasTrabajados.length < DIAS_SEMANA.length) && (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                    {DIAS_SEMANA.length - emp.diasTrabajados.length} falta
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    style={{ width: '120px' }}
                                    value={tempSueldoValue}
                                    onChange={(e) => setTempSueldoValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        guardarSueldoEditado(emp);
                                      } else if (e.key === 'Escape') {
                                        cancelarEdicionSueldo();
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => guardarSueldoEditado(emp)}
                                    title="Guardar"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={cancelarEdicionSueldo}
                                    title="Cancelar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <span
                                    onClick={() => iniciarEdicionSueldo(emp)}
                                    style={{ 
                                      cursor: 'pointer', 
                                      textDecoration: 'underline',
                                      color: '#0d6efd'
                                    }}
                                    title="Click para editar sueldo"
                                  >
                                    {formatCurrency(emp.sueldoSemanal)}
                                  </span>
                                  {(() => {
                                    const { sueldoFinal, diasFaltados } = calcularSueldoConDescuentos(emp);
                                    if (diasFaltados.length > 0) {
                                      return (
                                        <div className="small text-danger">
                                          → {formatCurrency(sueldoFinal)} 
                                          <small className="text-muted"> (descuento: {diasFaltados.length} día{diasFaltados.length > 1 ? 's' : ''})</small>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </td>
                            <td className="text-danger">{formatCurrency(totalAdelantos)}</td>
                            <td className="text-success"><strong>{formatCurrency(deuda)}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Historial de Adelantos</h5>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {!semanaActiva?.adelantos || semanaActiva.adelantos.length === 0 ? (
                <p className="text-muted text-center">No hay adelantos registrados</p>
              ) : (
                <div className="row">
                  {(() => {
                    const adelantosPorEmpleado = {};
                    semanaActiva.adelantos.forEach((adelanto, index) => {
                      if (!adelantosPorEmpleado[adelanto.empleado]) {
                        adelantosPorEmpleado[adelanto.empleado] = [];
                      }
                      adelantosPorEmpleado[adelanto.empleado].push({ ...adelanto, originalIndex: index });
                    });

                    const empleadosConAdelantos = Object.keys(adelantosPorEmpleado);

                    return empleadosConAdelantos.map(empleado => {
                      const totalAdelantos = adelantosPorEmpleado[empleado].reduce((sum, adelanto) => sum + adelanto.monto, 0);
                      const empleadoData = semanaActiva.empleados?.find(emp => emp.nombre === empleado);
                      const sueldoSemanal = empleadoData?.sueldoSemanal || 0;
                      const pagoCompleto = totalAdelantos >= sueldoSemanal;
                      const isExpanded = empleadoExpandido === empleado;
                      
                      return (
                        <div key={empleado} className="col-lg-4 col-md-6 col-sm-6 mb-4">
                          <div 
                            className={`card card-transition smooth-hover ${pagoCompleto ? 'border-success' : 'border-warning'} ${isExpanded ? 'shadow card-expand' : ''}`}
                            style={{ 
                              cursor: 'pointer',
                              transform: isExpanded ? 'translateY(-2px)' : 'translateY(0)',
                              position: 'relative'
                            }}
                            onClick={() => setEmpleadoExpandido(isExpanded ? null : empleado)}
                            onMouseEnter={() => handleMouseEnter(empleado)}
                            onMouseLeave={() => handleMouseLeave(empleado)}
                          >
                            {tooltipVisible[empleado] && (
                              <div 
                                className="position-absolute fade-in"
                                style={{
                                  top: '-40px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: 'rgba(0,0,0,0.8)',
                                  color: 'white',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  whiteSpace: 'nowrap',
                                  zIndex: 1000,
                                  pointerEvents: 'none'
                                }}
                              >
                                {isExpanded ? 'Click para cerrar' : 'Click para expandir'}
                                <div 
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderTop: '6px solid rgba(0,0,0,0.8)'
                                  }}
                                ></div>
                              </div>
                            )}
                            <div className={`card-header ${pagoCompleto ? 'bg-success' : 'bg-warning'} text-dark py-3`}>
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="mb-2 fw-bold">
                                    {empleado}
                                    {pagoCompleto && <span className="ms-2">✅</span>}
                                  </h6>
                                  <button 
                                    className="btn btn-sm btn-light"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImprimirEmpleado(empleado);
                                    }}
                                    title={`Imprimir comprobante de ${empleado}`}
                                    style={{ 
                                      fontSize: '0.7rem',
                                      padding: '4px 8px'
                                    }}
                                  >
                                    <i className="fas fa-print me-1"></i>
                                    Imprimir
                                  </button>
                                </div>
                                <div className="text-end">
                                  <div className="fw-bold small">
                                    {adelantosPorEmpleado[empleado].length} adelanto{adelantosPorEmpleado[empleado].length !== 1 ? 's' : ''}
                                  </div>
                                  <div className="fw-bold small" style={{ color: '#fff' }}>
                                    Total: {formatCurrency(totalAdelantos)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div 
                              className="card-body p-3"
                              style={{
                                maxHeight: isExpanded ? '500px' : '0',
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: isExpanded ? 1 : 0,
                                padding: isExpanded ? '0.75rem' : '0'
                              }}
                            >
                              {isExpanded && adelantosPorEmpleado[empleado].map((adelanto, index) => (
                                <div 
                                  key={index} 
                                  className="card mb-2 border-warning-subtle fade-in"
                                  style={{
                                    animationDelay: `${index * 0.05}s`
                                  }}
                                >
                                  <div className="card-body py-2 px-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <div className="fw-bold small">{adelanto.dia}</div>
                                        {adelanto.descripcion && (
                                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            {adelanto.descripcion}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-end">
                                        <div className="text-danger fw-bold small">
                                          {formatCurrency(adelanto.monto)}
                                        </div>
                                        <button 
                                          className="btn btn-sm btn-danger"
                                          style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarAdelanto(adelanto.originalIndex);
                                          }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPrintModal && printData && (
        <PrintDocument
          data={printData}
          type="empleado"
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
        />
      )}

      {/* Modal de Asistencia */}
      {showAsistenciaModal && empleadoAsistencia && (
        <div 
          className="modal show d-block" 
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onClick={() => setShowAsistenciaModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Días Trabajados - {empleadoAsistencia.nombre}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAsistenciaModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Marca los días que <strong>NO</strong> trabajó (se descontará del sueldo)
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => {
                    const estaTrabajado = diasTrabajadosTemp.includes(dia);
                    return (
                      <button
                        key={dia}
                        className={`btn ${estaTrabajado ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => {
                          if (estaTrabajado) {
                            setDiasTrabajadosTemp(prev => prev.filter(d => d !== dia));
                          } else {
                            setDiasTrabajadosTemp(prev => [...prev, dia]);
                          }
                        }}
                      >
                        {dia} {estaTrabajado ? '✓' : '✕'}
                      </button>
                    );
                  })}
                </div>
                
                {diasTrabajadosTemp.length < DIAS_SEMANA.length && (
                  <div className="mt-3 alert alert-warning">
                    <strong>Días faltados:</strong> {DIAS_SEMANA.filter(d => !diasTrabajadosTemp.includes(d)).join(', ')}
                    <br />
                    <strong>Descuento:</strong> {formatCurrency(
                      (DIAS_SEMANA.length - diasTrabajadosTemp.length) * 
                      (empleadoAsistencia.sueldoSemanal / DIAS_SEMANA.length)
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAsistenciaModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={guardarDiasTrabajados}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

