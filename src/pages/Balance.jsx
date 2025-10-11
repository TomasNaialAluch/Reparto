import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';
import { useGestionSemanal } from '../firebase/hooks';
import { formatCurrency } from '../utils/money';

export default function Balance() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const { semanaActiva, loading, getHistorialSemanas, getSemanaById } = useGestionSemanal(user?.uid);
  const [balanceData, setBalanceData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [coeficientes, setCoeficientes] = useState({
    mercaderia: 0,
    embutidos: 0
  });
  const [historialSemanas, setHistorialSemanas] = useState([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

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

  const calcularIngresosEstimados = () => {
    if (!balanceData) return 0;
    
    const ingresosMercaderia = balanceData.inventarioMercaderia * coeficientes.mercaderia;
    const ingresosEmbutidos = balanceData.inventarioEmbutidos * coeficientes.embutidos;
    
    return ingresosMercaderia + ingresosEmbutidos;
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

  const cerrarSemana = async () => {
    if (!window.confirm('¿Está seguro que desea cerrar esta semana? Los datos quedarán guardados y se iniciará una nueva semana.')) {
      return;
    }

    try {
      // Scroll suave hacia arriba antes de cerrar
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Pequeño delay para que se vea el scroll
      setTimeout(async () => {
        // Aquí iría la lógica para cerrar la semana
        // Por ahora solo navegamos de vuelta
        navigate('/gestion-semanal');
      }, 300);
    } catch (err) {
      console.error('Error al cerrar semana:', err);
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
    <div className="container-fluid mt-4 px-lg-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <button 
                className="btn btn-primary btn-lg me-3"
                onClick={volverAtras}
                style={{ fontSize: '1.1rem', padding: '10px 20px' }}
              >
                ← Volver a Gestión Semanal
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
                <i className="fas fa-history me-1"></i>
                {mostrarHistorial ? 'Ocultar' : 'Historial'}
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
                  className="btn btn-sm btn-outline-secondary"
                  onClick={volverASemanaActual}
                >
                  <i className="fas fa-arrow-left me-1"></i>
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
                <h5 className="mb-0">
                  <i className="fas fa-history me-2"></i>
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
                          className="card h-100 cursor-pointer border-primary"
                          onClick={() => seleccionarSemana(semana.id)}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '2px solid #007bff'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="card-body">
                            <h6 className="card-title text-primary">
                              <i className="fas fa-calendar-week me-2"></i>
                              Semana del {new Date(semana.fechaInicio).toLocaleDateString('es-AR')}
                            </h6>
                            <p className="card-text small text-muted mb-2">
                              <strong>Cerrada:</strong> {new Date(semana.fechaCierre).toLocaleDateString('es-AR')}
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="badge bg-secondary">
                                <i className="fas fa-eye me-1"></i>
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
                <h6 className="mb-0">💰 Gastos</h6>
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
                <h6 className="mb-0">👨‍💼 Empleados</h6>
              </div>
              <div className="card-body text-center py-2">
                {balanceData.saldoPendiente > 0 ? (
                  <h5 className="text-warning mb-0">
                    <strong>⚠️ {formatCurrency(balanceData.saldoPendiente)}</strong>
                  </h5>
                ) : (
                  <h5 className="text-success mb-0">
                    <strong>✅ Pagado</strong>
                  </h5>
                )}
              </div>
            </div>
          </div>

          {/* DEUDAS DE CLIENTES */}
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-primary">
              <div className="card-header bg-primary text-white py-1">
                <h6 className="mb-0">🧾 Deudas por Cobrar</h6>
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
                <h6 className="mb-0">📦 Inventario</h6>
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
                <h6 className="mb-0">📊 Resumen Ejecutivo</h6>
              </div>
              <div className="card-body py-3">
                <div className="row">
                  {/* INGRESOS ESTIMADOS - BLOQUE IZQUIERDA */}
                  <div className="col-md-6">
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
            className="btn btn-danger btn-lg"
            style={{ fontSize: '1.3rem', padding: '15px 50px' }}
            onClick={cerrarSemana}
          >
            🔒 CERRAR SEMANA Y GUARDAR
          </button>
        </div>
      </div>

    </div>
  );
}
