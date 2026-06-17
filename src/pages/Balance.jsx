import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';
import { useGestionSemanal } from '../firebase/hooks';
import { formatCurrency } from '../utils/money';
import ConfirmModal from '../components/ConfirmModal';
import { styles } from '../components/gestionSemanal/styles';
import {
  IconMoney, IconUsers, IconCheque, IconBox, IconChart, IconWarning, IconCheck,
  IconSettings, IconRefresh, IconChevronDown, IconLock, IconHistory, IconEye,
  IconFilter, IconArrowLeft, IconInfo, IconX, IconCalendar
} from '../components/gestionSemanal/icons';

export default function Balance() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const { semanaActiva, loading, getHistorialSemanas, getSemanaById, getConfiguracionesUsuario, guardarConfiguracionesUsuario, cerrarSemana: cerrarSemanaHook, crearNuevaSemana } = useGestionSemanal(user?.uid);
  const [balanceData, setBalanceData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCerrarSemanaModal, setShowCerrarSemanaModal] = useState(false);
  const [coeficientes, setCoeficientes] = useState({
    mercaderia: 0,
    embutidos: 0
  });
  const [historialSemanas, setHistorialSemanas] = useState([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [expandirResumen, setExpandirResumen] = useState(false);
  const [valoresDefecto, setValoresDefecto] = useState({
    mercaderia: 2500,
    embutidos: 1800
  });
  
  // Estados para filtro de proveedores
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [mostrarModalProveedores, setMostrarModalProveedores] = useState(false);

  // Obtener lista de proveedores únicos de la semana
  const obtenerProveedoresDisponibles = () => {
    const semanaAData = semanaSeleccionada || semanaActiva;
    if (!semanaAData?.mercaderia) return [];
    
    const proveedores = [...new Set(semanaAData.mercaderia.map(entrada => entrada.proveedor))];
    return proveedores.sort();
  };

  // Manejar selección de proveedores
  const toggleProveedor = (proveedor) => {
    setProveedoresSeleccionados(prev => 
      prev.includes(proveedor) 
        ? prev.filter(p => p !== proveedor)
        : [...prev, proveedor]
    );
  };

  // Seleccionar todos los proveedores
  const seleccionarTodosProveedores = () => {
    setProveedoresSeleccionados(obtenerProveedoresDisponibles());
  };

  // Deseleccionar todos los proveedores
  const deseleccionarTodosProveedores = () => {
    setProveedoresSeleccionados([]);
  };

  useEffect(() => {
    if (semanaActiva) {
      calcularBalance();
    }
    
    // Scroll suave al cargar la página
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [semanaActiva]);

  // Cargar configuraciones del usuario desde la base de datos
  useEffect(() => {
    const cargarConfiguraciones = async () => {
      if (user?.uid) {
        try {
          const configs = await getConfiguracionesUsuario();
          if (configs) {
            setValoresDefecto({
              mercaderia: configs.gananciaDefectoMercaderia || 2500,
              embutidos: configs.gananciaDefectoEmbutidos || 1800
            });
            
            // Aplicar valores por defecto si los coeficientes están en 0
            if (coeficientes.mercaderia === 0 && coeficientes.embutidos === 0) {
              setCoeficientes({
                mercaderia: configs.gananciaDefectoMercaderia || 2500,
                embutidos: configs.gananciaDefectoEmbutidos || 1800
              });
            }
          } else {
            // Si no hay configuraciones, aplicar valores por defecto
            if (coeficientes.mercaderia === 0 && coeficientes.embutidos === 0) {
              setCoeficientes(valoresDefecto);
            }
          }
        } catch (error) {
          console.error('Error cargando configuraciones:', error);
          // En caso de error, aplicar valores por defecto
          if (coeficientes.mercaderia === 0 && coeficientes.embutidos === 0) {
            setCoeficientes(valoresDefecto);
          }
        }
      }
    };

    cargarConfiguraciones();
  }, [user?.uid]);

  // Cargar historial de semanas cerradas
  const cargarHistorial = async () => {
    try {
      const historial = await getHistorialSemanas();
      setHistorialSemanas(historial);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  // Seleccionar una semana del historial
  const seleccionarSemana = async (semanaId) => {
    try {
      const semana = await getSemanaById(semanaId);
      setSemanaSeleccionada(semana);
      calcularBalance(semana);
      setMostrarHistorial(false);
    } catch (error) {
      console.error('Error al cargar semana:', error);
    }
  };

  // Volver a la semana actual
  const volverASemanaActual = () => {
    setSemanaSeleccionada(null);
    if (semanaActiva) {
      calcularBalance();
    }
  };

  // Guardar configuraciones cuando cambien los valores por defecto
  const guardarValoresDefecto = async (nuevosValores) => {
    try {
      await guardarConfiguracionesUsuario({
        gananciaDefectoMercaderia: nuevosValores.mercaderia,
        gananciaDefectoEmbutidos: nuevosValores.embutidos
      });
      console.log('✅ Valores por defecto guardados');
    } catch (error) {
      console.error('Error guardando valores por defecto:', error);
    }
  };

  const calcularIngresosEstimados = () => {
    if (!balanceData) return 0;
    
    const ingresosMercaderia = balanceData.inventarioMercaderia * coeficientes.mercaderia;
    const ingresosEmbutidos = balanceData.inventarioEmbutidos * coeficientes.embutidos;
    
    return ingresosMercaderia + ingresosEmbutidos;
  };

  // Calcular costo promedio general de toda la mercadería
  const calcularCostoPromedioGeneral = () => {
    const semanaAData = semanaSeleccionada || semanaActiva;
    if (!semanaAData?.mercaderia) return 0;

    let costoTotal = 0;
    let totalKilos = 0;

    // Filtrar por proveedores seleccionados si hay alguno seleccionado
    const mercaderiaFiltrada = proveedoresSeleccionados.length > 0 
      ? semanaAData.mercaderia.filter(entrada => proveedoresSeleccionados.includes(entrada.proveedor))
      : semanaAData.mercaderia;

    mercaderiaFiltrada.forEach(entrada => {
      entrada.cortes.forEach(corte => {
        if (corte.precioKg && corte.precioKg > 0) {
          costoTotal += corte.kg * corte.precioKg;
          totalKilos += corte.kg;
        }
      });
    });

    return totalKilos > 0 ? costoTotal / totalKilos : 0;
  };

  // Calcular costo promedio por cada corte
  const calcularCostosPromedioPorCorte = () => {
    const semanaAData = semanaSeleccionada || semanaActiva;
    if (!semanaAData?.mercaderia) return {};

    const cortesAcumulados = {};

    // Filtrar por proveedores seleccionados si hay alguno seleccionado
    const mercaderiaFiltrada = proveedoresSeleccionados.length > 0 
      ? semanaAData.mercaderia.filter(entrada => proveedoresSeleccionados.includes(entrada.proveedor))
      : semanaAData.mercaderia;

    // Acumular datos por tipo de corte
    mercaderiaFiltrada.forEach(entrada => {
      entrada.cortes.forEach(corte => {
        if (corte.precioKg && corte.precioKg > 0) {
          if (!cortesAcumulados[corte.corte]) {
            cortesAcumulados[corte.corte] = {
              totalKilos: 0,
              costoTotal: 0
            };
          }
          cortesAcumulados[corte.corte].totalKilos += corte.kg;
          cortesAcumulados[corte.corte].costoTotal += corte.kg * corte.precioKg;
        }
      });
    });

    // Calcular promedios
    const promedios = {};
    Object.entries(cortesAcumulados).forEach(([corte, datos]) => {
      if (datos.totalKilos > 0) {
        promedios[corte] = datos.costoTotal / datos.totalKilos;
      }
    });

    return promedios;
  };

  // Calcular costo promedio general de embutidos
  const calcularCostoPromedioGeneralEmbutidos = () => {
    const semanaAData = semanaSeleccionada || semanaActiva;
    if (!semanaAData?.embutidos) return 0;

    let costoTotal = 0;
    let totalKilos = 0;

    semanaAData.embutidos.forEach(entrada => {
      entrada.embutidos.forEach(embutido => {
        if (embutido.precioKg && embutido.precioKg > 0) {
          costoTotal += embutido.kg * embutido.precioKg;
          totalKilos += embutido.kg;
        }
      });
    });

    return totalKilos > 0 ? costoTotal / totalKilos : 0;
  };

  // Calcular costo promedio por cada tipo de embutido
  const calcularCostosPromedioPorEmbutido = () => {
    const semanaAData = semanaSeleccionada || semanaActiva;
    if (!semanaAData?.embutidos) return {};

    const embutidosAcumulados = {};

    // Acumular datos por tipo de embutido
    semanaAData.embutidos.forEach(entrada => {
      entrada.embutidos.forEach(embutido => {
        if (embutido.precioKg && embutido.precioKg > 0) {
          if (!embutidosAcumulados[embutido.tipo]) {
            embutidosAcumulados[embutido.tipo] = {
              totalKilos: 0,
              costoTotal: 0
            };
          }
          embutidosAcumulados[embutido.tipo].totalKilos += embutido.kg;
          embutidosAcumulados[embutido.tipo].costoTotal += embutido.kg * embutido.precioKg;
        }
      });
    });

    // Calcular promedios
    const promedios = {};
    Object.entries(embutidosAcumulados).forEach(([tipo, datos]) => {
      if (datos.totalKilos > 0) {
        promedios[tipo] = datos.costoTotal / datos.totalKilos;
      }
    });

    return promedios;
  };

  const calcularBalance = (semana = null) => {
    const semanaAData = semana || semanaActiva;
    if (!semanaAData) return;

    // Calcular gastos totales
    const gastosTotales = semanaAData.gastos?.reduce((sum, gasto) => sum + gasto.monto, 0) || 0;

    // Calcular sueldos totales
    const sueldosTotales = semanaAData.empleados?.reduce((sum, emp) => sum + emp.sueldoSemanal, 0) || 0;

    // Calcular adelantos totales
    const adelantosTotales = semanaAData.adelantos?.reduce((sum, adelanto) => sum + adelanto.monto, 0) || 0;

    // Calcular deudas de clientes
    const deudasClientes = semanaAData.clientesCuenta?.reduce((sum, cliente) => {
      return sum + (cliente.boletas?.reduce((clienteSum, boleta) => clienteSum + boleta.monto, 0) || 0);
    }, 0) || 0;

    // Calcular inventario (aproximado por peso)
    const totalMercaderia = semanaAData.mercaderia?.reduce((sum, entrada) => {
      return sum + entrada.cortes.reduce((corteSum, corte) => corteSum + corte.kg, 0);
    }, 0) || 0;

    const totalEmbutidos = semanaAData.embutidos?.reduce((sum, entrada) => {
      return sum + entrada.embutidos.reduce((embSum, emb) => embSum + emb.kg, 0);
    }, 0) || 0;

    setBalanceData({
      gastos: gastosTotales,
      sueldos: sueldosTotales,
      adelantos: adelantosTotales,
      deudasClientes: deudasClientes,
      inventarioMercaderia: totalMercaderia,
      inventarioEmbutidos: totalEmbutidos,
      saldoPendiente: sueldosTotales - adelantosTotales
    });
  };

  const volverAtras = () => {
    // Scroll suave hacia arriba antes de navegar
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Pequeño delay para que se vea el scroll
    setTimeout(() => {
      navigate('/gestion-semanal');
    }, 300);
  };

  const handleCerrarSemanaClick = () => {
    setShowCerrarSemanaModal(true);
  };

  const cerrarSemana = async () => {
    try {
      console.log('🔒 Cerrando semana actual...');
      
      // Cerrar la semana actual
      await cerrarSemanaHook();
      console.log('✅ Semana cerrada exitosamente');
      
      // Crear una nueva semana
      console.log('📝 Creando nueva semana...');
      await crearNuevaSemana();
      console.log('✅ Nueva semana creada exitosamente');
      
      // Scroll suave hacia arriba antes de navegar
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Pequeño delay para que se vea el scroll y luego navegar
      setTimeout(() => {
        navigate('/gestion-semanal');
      }, 300);
    } catch (err) {
      console.error('❌ Error al cerrar semana:', err);
      alert('Error al cerrar la semana. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!semanaActiva) {
    return (
      <div className="container mt-5 text-center">
        <h3>No hay datos de la semana actual</h3>
        <button className="btn btn-primary mt-3" onClick={volverAtras}>
          Volver a Gestión Semanal
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 px-lg-5 gs-content" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <style>{styles}</style>
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <button 
                className="btn btn-primary btn-lg me-3 d-inline-flex align-items-center gap-2"
                onClick={volverAtras}
                style={{ fontSize: '1.1rem', padding: '10px 20px' }}
              >
                <IconArrowLeft size={18} /> Volver a Gestión Semanal
              </button>
            </div>
            <h2 className="mb-0 text-center flex-grow-1">Balance Semanal</h2>
            <div className="d-flex align-items-center" style={{ width: '200px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => {
                  if (mostrarHistorial) {
                    setMostrarHistorial(false);
                  } else {
                    cargarHistorial();
                    setMostrarHistorial(true);
                  }
                }}
                style={{ 
                  fontWeight: '600',
                  padding: '0.5rem 1rem'
                }}
              >
                <span className="d-inline-flex align-items-center gap-2">
                  <IconHistory size={14} />
                  {mostrarHistorial ? 'Ocultar' : 'Historial'}
                </span>
              </button>
            </div>
          </div>
          
          <div className="alert alert-info mt-3">
            <strong>
              {semanaSeleccionada ? 'Semana del historial:' : 'Semana actual:'}
            </strong> {new Date((semanaSeleccionada || semanaActiva).fechaInicio).toLocaleDateString('es-AR')}
            {semanaSeleccionada && (
              <span className="ms-2">
                <button 
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                  onClick={volverASemanaActual}
                >
                  <IconArrowLeft size={13} />
                  Volver a semana actual
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Historial de semanas */}
      {mostrarHistorial && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0 d-inline-flex align-items-center gap-2">
                  <IconHistory size={13} />
                  Historial de Semanas Cerradas
                </h5>
              </div>
              <div className="card-body">
                {historialSemanas.length === 0 ? (
                  <p className="text-muted mb-0">No hay semanas cerradas en el historial.</p>
                ) : (
                  <div className="row">
                    {historialSemanas.map((semana) => (
                      <div key={semana.id} className="col-lg-4 col-md-6 mb-3">
                        <div 
                          className="card h-100 border-primary"
                          onClick={() => seleccionarSemana(semana.id)}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div className="card-body">
                            <h6 className="card-title text-primary d-inline-flex align-items-center gap-2">
                              <IconCalendar size={14} />
                              Semana del {new Date(semana.fechaInicio).toLocaleDateString('es-AR')}
                            </h6>
                            <p className="card-text small text-muted mb-2 mt-1">
                              <strong>Cerrada:</strong> {new Date(semana.fechaCierre).toLocaleDateString('es-AR')}
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                                <IconEye size={12} />
                                Ver Balance
                              </span>
                              <small className="text-muted">
                                {semana.mercaderia?.length || 0} mercaderías • {semana.empleados?.length || 0} empleados
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {balanceData && (
        <div className="row">
          {/* GASTOS */}
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white py-1">
                <h6 className="mb-0 d-inline-flex align-items-center gap-2"><IconMoney size={13} /> Gastos</h6>
              </div>
              <div className="card-body text-center py-2">
                <h5 className="text-danger mb-0">
                  <strong>{formatCurrency(balanceData.gastos)}</strong>
                </h5>
              </div>
            </div>
          </div>

          {/* EMPLEADOS Y SUELDOS */}
          <div className="col-lg-3 col-md-6 mb-3">
            <div className={`card ${balanceData.saldoPendiente > 0 ? 'border-warning' : 'border-success'}`}>
              <div className={`card-header ${balanceData.saldoPendiente > 0 ? 'bg-warning text-dark' : 'bg-success text-white'} py-1`}>
                <h6 className="mb-0 d-inline-flex align-items-center gap-2"><IconUsers size={13} /> Empleados</h6>
              </div>
              <div className="card-body text-center py-2">
                {balanceData.saldoPendiente > 0 ? (
                  <h5 className="text-warning mb-0 d-inline-flex align-items-center justify-content-center gap-2">
                    <IconWarning size={16} /> <strong>{formatCurrency(balanceData.saldoPendiente)}</strong>
                  </h5>
                ) : (
                  <h5 className="text-success mb-0 d-inline-flex align-items-center justify-content-center gap-2">
                    <IconCheck size={16} /> <strong>Pagado</strong>
                  </h5>
                )}
              </div>
            </div>
          </div>

          {/* DEUDAS DE CLIENTES */}
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-primary">
              <div className="card-header bg-primary text-white py-1">
                <h6 className="mb-0 d-inline-flex align-items-center gap-2"><IconCheque size={13} /> Deudas por Cobrar</h6>
              </div>
              <div className="card-body text-center py-2">
                <h5 className="text-primary mb-0">
                  <strong>{formatCurrency(balanceData.deudasClientes)}</strong>
                </h5>
              </div>
            </div>
          </div>

          {/* INVENTARIO */}
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-secondary">
              <div className="card-header bg-secondary text-white py-1">
                <h6 className="mb-0 d-inline-flex align-items-center gap-2"><IconBox size={13} /> Inventario</h6>
              </div>
              <div className="card-body text-center py-2">
                <h5 className="text-secondary mb-0">
                  <strong>{(balanceData.inventarioMercaderia + balanceData.inventarioEmbutidos).toFixed(0)} kg</strong>
                </h5>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESUMEN FINAL */}
      {balanceData && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-dark">
              <div className="card-header bg-dark text-white py-2">
                <h6 className="mb-0 d-inline-flex align-items-center gap-2"><IconChart size={13} /> Resumen Ejecutivo</h6>
              </div>
              <div className="card-body py-3">
                <div className="row">
                  {/* INGRESOS ESTIMADOS - BLOQUE IZQUIERDA */}
                  <div className="col-md-6">
                    {/* COSTO PROMEDIO GENERAL */}
                    {calcularCostoPromedioGeneral() > 0 && (
                      <div className="mb-4">
                        <div className="bg-light border rounded p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-muted mb-0">Costo Promedio de Mercadería</h6>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2"
                                onClick={() => setMostrarModalProveedores(true)}
                                title="Seleccionar proveedores para el promedio"
                              >
                                <IconFilter size={13} />
                                Proveedores
                              </button>
                              <button 
                                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                                onClick={() => setExpandirResumen(!expandirResumen)}
                              >
                                <span className="d-inline-flex" style={{ transform: expandirResumen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)' }}>
                                  <IconChevronDown size={13} />
                                </span>
                                {expandirResumen ? 'Contraer' : 'Expandir'}
                              </button>
                            </div>
                          </div>

                          {/* Indicador de proveedores seleccionados */}
                          {proveedoresSeleccionados.length > 0 && (
                            <div className="mb-2">
                              <small className="text-info d-inline-flex align-items-center gap-1 flex-wrap">
                                <IconFilter size={12} />
                                Filtrado por {proveedoresSeleccionados.length} proveedor{proveedoresSeleccionados.length !== 1 ? 'es' : ''}: 
                                <strong className="ms-1">{proveedoresSeleccionados.join(', ')}</strong>
                                <button 
                                  className="btn btn-link btn-sm p-0 ms-2 d-inline-flex align-items-center text-danger"
                                  onClick={() => setProveedoresSeleccionados([])}
                                  title="Limpiar filtro"
                                >
                                  <IconX size={13} />
                                </button>
                              </small>
                            </div>
                          )}
                          <h4 className="text-success mb-1">
                            <strong>${calcularCostoPromedioGeneral().toFixed(2)}/kg</strong>
                          </h4>
                          <small className="text-muted">
                            {proveedoresSeleccionados.length > 0 
                              ? `Promedio ponderado de ${proveedoresSeleccionados.length} proveedor${proveedoresSeleccionados.length !== 1 ? 'es' : ''} seleccionado${proveedoresSeleccionados.length !== 1 ? 's' : ''}`
                              : 'Promedio ponderado de todos los cortes'
                            }
                          </small>
                          
                          {/* COSTO PROMEDIO DE EMBUTIDOS */}
                          {calcularCostoPromedioGeneralEmbutidos() > 0 && (
                            <div className="mt-3 pt-2 border-top">
                              <h6 className="text-muted mb-1">Costo Promedio de Embutidos</h6>
                              <h5 className="text-info mb-1">
                                <strong>${calcularCostoPromedioGeneralEmbutidos().toFixed(2)}/kg</strong>
                              </h5>
                              <small className="text-muted">Promedio ponderado de todos los embutidos</small>
                            </div>
                          )}
                          
                          {/* SECCIÓN EXPANDIDA - COSTOS POR CORTE Y EMBUTIDOS */}
                          <div 
                            className={`mt-3 pt-2 border-top ${expandirResumen ? 'expand-section' : 'collapse-section'}`}
                            style={{
                              maxHeight: expandirResumen ? '500px' : '0',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease-in-out',
                              opacity: expandirResumen ? 1 : 0
                            }}
                          >
                            <small className="text-muted d-block mb-2">Costos promedio por tipo:</small>
                            
                            {/* CORTES DE CARNE */}
                            {Object.keys(calcularCostosPromedioPorCorte()).length > 0 && (
                              <div className="mb-3">
                                <small className="text-muted fw-bold d-block mb-1">Cortes de Carne:</small>
                                <div className="row g-1">
                                  {Object.entries(calcularCostosPromedioPorCorte()).map(([corte, precioPromedio]) => (
                                    <div key={corte} className="col-6">
                                      <small className="text-dark">
                                        <strong>{corte}:</strong> ${precioPromedio.toFixed(2)}/kg
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* EMBUTIDOS */}
                            {Object.keys(calcularCostosPromedioPorEmbutido()).length > 0 && (
                              <div className="mb-3">
                                <small className="text-muted fw-bold d-block mb-1">Embutidos:</small>
                                <div className="row g-1">
                                  {Object.entries(calcularCostosPromedioPorEmbutido()).map(([tipo, precioPromedio]) => (
                                    <div key={tipo} className="col-6">
                                      <small className="text-dark">
                                        <strong>{tipo}:</strong> ${precioPromedio.toFixed(2)}/kg
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {Object.keys(calcularCostosPromedioPorCorte()).length === 0 && 
                             Object.keys(calcularCostosPromedioPorEmbutido()).length === 0 && (
                              <small className="text-muted">No hay datos de precios disponibles</small>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* GANANCIA MÍNIMA NECESARIA */}
                    {balanceData && (
                      <div className="mb-4">
                        <div className="bg-light border rounded p-3">
                          <h6 className="text-muted mb-2">Ganancia Mínima Necesaria</h6>
                          <h4 className="text-warning mb-1">
                            <strong>${((balanceData.sueldos + balanceData.gastos) / (balanceData.inventarioMercaderia + balanceData.inventarioEmbutidos)).toFixed(2)}/kg</strong>
                          </h4>
                          <small className="text-muted">
                            Para cubrir sueldos (${balanceData.sueldos.toLocaleString()}) + gastos (${balanceData.gastos.toLocaleString()})
                          </small>
                          <div className="mt-2">
                            <small className="text-muted">
                              <strong>Total a cubrir:</strong> ${(balanceData.sueldos + balanceData.gastos).toLocaleString()} ÷ {(balanceData.inventarioMercaderia + balanceData.inventarioEmbutidos).toFixed(0)}kg
                            </small>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* CONFIGURACIÓN DE VALORES POR DEFECTO */}
                    <div className="mb-4">
                      <div className="bg-light border rounded p-3">
                        <h6 className="text-muted mb-3 d-inline-flex align-items-center gap-2"><IconSettings size={14} /> Configuración de Ganancia por Defecto</h6>
                        <div className="row">
                          <div className="col-6">
                            <label className="form-label small">
                              <strong>Mercadería - Valor por defecto</strong>
                            </label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm"
                              value={valoresDefecto.mercaderia}
                              onChange={async (e) => {
                                const nuevosValores = {
                                  ...valoresDefecto, 
                                  mercaderia: parseFloat(e.target.value) || 0
                                };
                                setValoresDefecto(nuevosValores);
                                await guardarValoresDefecto(nuevosValores);
                              }}
                              placeholder="Ej: 2500"
                            />
                            <small className="text-muted">Valor inicial para carne</small>
                          </div>
                          <div className="col-6">
                            <label className="form-label small">
                              <strong>Embutidos - Valor por defecto</strong>
                            </label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm"
                              value={valoresDefecto.embutidos}
                              onChange={async (e) => {
                                const nuevosValores = {
                                  ...valoresDefecto, 
                                  embutidos: parseFloat(e.target.value) || 0
                                };
                                setValoresDefecto(nuevosValores);
                                await guardarValoresDefecto(nuevosValores);
                              }}
                              placeholder="Ej: 1800"
                            />
                            <small className="text-muted">Valor inicial para embutidos</small>
                          </div>
                        </div>
                        <div className="mt-2">
                          <button 
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                            onClick={() => setCoeficientes(valoresDefecto)}
                          >
                            <IconRefresh size={13} /> Aplicar Valores por Defecto
                          </button>
                        </div>
                      </div>
                    </div>


                    <h6 className="text-success mb-2">Ingresos Estimados</h6>
                    <small className="text-muted d-block mb-3">
                      <strong>Ganancia por kilogramo:</strong> ¿Cuánto ganas por cada kilo que vendés?
                    </small>
                    
                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label small">
                          <strong>Mercadería - Ganancia $/kg</strong>
                        </label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={coeficientes.mercaderia}
                          onChange={(e) => setCoeficientes({
                            ...coeficientes, 
                            mercaderia: parseFloat(e.target.value) || 0
                          })}
                          placeholder="Ej: 2500"
                        />
                        <small className="text-muted">Ganancia por kilo de carne</small>
                      </div>
                      <div className="col-6">
                        <label className="form-label small">
                          <strong>Embutidos - Ganancia $/kg</strong>
                        </label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={coeficientes.embutidos}
                          onChange={(e) => setCoeficientes({
                            ...coeficientes, 
                            embutidos: parseFloat(e.target.value) || 0
                          })}
                          placeholder="Ej: 1800"
                        />
                        <small className="text-muted">Ganancia por kilo de embutidos</small>
                      </div>
                    </div>
                    
                    <div className="border-top pt-2">
                      <div className="row text-center mb-3">
                        <div className="col-6">
                          <h6 className="text-muted mb-1">Subtotal Mercadería</h6>
                          <h4 className="text-success mb-1">
                            <strong>{formatCurrency(balanceData.inventarioMercaderia * coeficientes.mercaderia)}</strong>
                          </h4>
                          <small className="text-muted">
                            {balanceData.inventarioMercaderia.toFixed(0)}kg × ${coeficientes.mercaderia}
                          </small>
                        </div>
                        <div className="col-6">
                          <h6 className="text-muted mb-1">Subtotal Embutidos</h6>
                          <h4 className="text-success mb-1">
                            <strong>{formatCurrency(balanceData.inventarioEmbutidos * coeficientes.embutidos)}</strong>
                          </h4>
                          <small className="text-muted">
                            {balanceData.inventarioEmbutidos.toFixed(0)}kg × ${coeficientes.embutidos}
                          </small>
                        </div>
                      </div>
                      
                      <div className="text-center border-top pt-3">
                        <h3 className="text-success mb-1">
                          <strong>TOTAL: {formatCurrency(calcularIngresosEstimados())}</strong>
                        </h3>
                        <h6 className="text-muted">
                          Ingresos estimados totales
                        </h6>
                      </div>
                    </div>
                  </div>

                  {/* GANANCIA NETA - BLOQUE DERECHA */}
                  <div className="col-md-6">
                    <h6 className="text-dark mb-3">Ganancia Neta Aproximada</h6>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-success">Ingresos Estimados:</span>
                        <strong className="text-success">{formatCurrency(calcularIngresosEstimados())}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-danger">- Gastos:</span>
                        <span className="text-danger">{formatCurrency(balanceData.gastos)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-warning">- Sueldos:</span>
                        <span className="text-warning">{formatCurrency(balanceData.sueldos)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Ganancia Neta:</h5>
                        <h4 className={`mb-0 ${(calcularIngresosEstimados() - balanceData.gastos - balanceData.sueldos) >= 0 ? 'text-success' : 'text-danger'}`}>
                          <strong>{formatCurrency(calcularIngresosEstimados() - balanceData.gastos - balanceData.sueldos)}</strong>
                        </h4>
                      </div>
                    </div>
                    
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN CERRAR SEMANA */}
      <div className="row mb-5">
        <div className="col-12 text-center">
          <button 
            className="btn btn-danger btn-lg d-inline-flex align-items-center gap-2"
            style={{ fontSize: '1.3rem', padding: '15px 50px' }}
            onClick={handleCerrarSemanaClick}
          >
            <IconLock size={20} /> CERRAR SEMANA Y GUARDAR
          </button>
        </div>
      </div>

      {/* Modal de confirmación para cerrar semana */}
      <ConfirmModal
        isOpen={showCerrarSemanaModal}
        onClose={() => setShowCerrarSemanaModal(false)}
        onConfirm={cerrarSemana}
        title="Cerrar Semana"
        message="¿Está seguro que desea cerrar esta semana? Los datos quedarán guardados y se iniciará una nueva semana."
        confirmText="Aceptar"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
      />

      {/* Modal de selección de proveedores */}
      {mostrarModalProveedores && (
        <div 
          className="modal show d-block" 
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onClick={() => setMostrarModalProveedores(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: '550px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-content"
              style={{
                animation: 'slideDown 0.3s ease-out',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div 
                className="modal-header border-0 pb-0 text-white"
                style={{ backgroundColor: '#6A8899' }}
              >
                <h5 className="modal-title fw-bold d-inline-flex align-items-center gap-2">
                  <IconFilter size={17} />
                  Seleccionar Proveedores
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setMostrarModalProveedores(false)}
                  aria-label="Close"
                ></button>
              </div>
              
              <div className="modal-body pt-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <p className="text-muted mb-3">
                  Elegí los proveedores para calcular el promedio de mercadería
                </p>
                
                {/* Botones de selección masiva */}
                <div className="d-flex gap-2 mb-3">
                  <button 
                    className="btn btn-success btn-sm flex-fill d-inline-flex align-items-center justify-content-center gap-2"
                    onClick={seleccionarTodosProveedores}
                  >
                    <IconCheck size={14} />
                    Todos
                  </button>
                  <button 
                    className="btn btn-danger btn-sm flex-fill d-inline-flex align-items-center justify-content-center gap-2"
                    onClick={deseleccionarTodosProveedores}
                  >
                    <IconX size={14} />
                    Ninguno
                  </button>
                </div>

                {/* Lista de proveedores */}
                <div className="d-flex flex-column gap-2">
                  {obtenerProveedoresDisponibles().map(proveedor => {
                    const isSelected = proveedoresSeleccionados.includes(proveedor);
                    return (
                      <div 
                        key={proveedor} 
                        className={`card ${isSelected ? 'border-success' : ''}`}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: isSelected ? '#d1f4e0' : 'white'
                        }}
                        onClick={() => toggleProveedor(proveedor)}
                      >
                        <div className="card-body py-2 px-3">
                          <div className="form-check mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <label 
                              className="form-check-label fw-bold w-100"
                              style={{ cursor: 'pointer' }}
                            >
                              {proveedor}
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de selección */}
                {proveedoresSeleccionados.length > 0 && (
                  <div className="alert alert-info mt-3 mb-0">
                    <small className="fw-bold d-flex align-items-center gap-1 mb-1">
                      <IconInfo size={13} />
                      Seleccionados ({proveedoresSeleccionados.length}):
                    </small>
                    <div className="d-flex flex-wrap gap-1">
                      {proveedoresSeleccionados.map(proveedor => (
                        <span key={proveedor} className="badge bg-info">
                          {proveedor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {obtenerProveedoresDisponibles().length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-warning mb-2 d-flex justify-content-center"><IconWarning size={32} /></div>
                    <p className="text-muted mb-0">No hay proveedores disponibles</p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setMostrarModalProveedores(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  onClick={() => setMostrarModalProveedores(false)}
                >
                  <IconCheck size={14} />
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideDown {
              from {
                transform: translateY(-50px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

    </div>
  );
}
