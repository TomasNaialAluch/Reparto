import { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrency } from '../../utils/money';
import { getLocalDateString } from '../../utils/date';

export default function PagosProveedoresTab({ 
  semanaActiva, 
  agregarPagoProveedor, 
  eliminarPagoProveedor,
  guardarEstadoPagosProveedores,
  addNotification 
}) {
  // Dinero disponible
  const [dineroDisponible, setDineroDisponible] = useState({
    efectivo: '',
    transferencia: '',
    cheques: ''
  });

  // Estado de pagos para cada boleta
  const [pagosBoletas, setPagosBoletas] = useState({});

  // Refs para debounce
  const saveTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Obtener todas las entradas de mercadería (boletas)
  const obtenerBoletas = () => {
    if (!semanaActiva?.mercaderia) return [];
    
    return semanaActiva.mercaderia.map((entrada, index) => {
      const costoTotal = entrada.cortes.reduce((sum, c) => 
        sum + (c.kg * (c.precioKg || 0)), 0
      );
      
      return {
        id: `boleta-${index}`,
        index,
        dia: entrada.dia,
        proveedor: entrada.proveedor,
        costoTotal,
        cortes: entrada.cortes,
        timestamp: entrada.timestamp || new Date().toISOString()
      };
    });
  };

  const boletas = obtenerBoletas();

  // Cargar estado desde Firebase
  useEffect(() => {
    if (semanaActiva?.pagosProveedoresEstado) {
      const estado = semanaActiva.pagosProveedoresEstado;
      
      if (estado.dineroDisponible) {
        setDineroDisponible({
          efectivo: estado.dineroDisponible.efectivo?.toString() || '',
          transferencia: estado.dineroDisponible.transferencia?.toString() || '',
          cheques: estado.dineroDisponible.cheques?.toString() || ''
        });
      }
      
      if (estado.pagosBoletas) {
        setPagosBoletas(estado.pagosBoletas);
      }
      
      isInitialLoad.current = false;
    } else {
      // Si no hay estado guardado, inicializar
      isInitialLoad.current = false;
    }
  }, [semanaActiva?.pagosProveedoresEstado]);

  // Inicializar pagos si no existen
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const nuevasBoletas = obtenerBoletas();
    if (nuevasBoletas.length > 0) {
      setPagosBoletas(prev => {
        const nuevosPagos = { ...prev };
        let hayCambios = false;
        
        nuevasBoletas.forEach(boleta => {
          if (!nuevosPagos[boleta.id]) {
            nuevosPagos[boleta.id] = {
              seleccionada: false,
              efectivo: '',
              transferencia: '',
              cheques: '',
              montoPersonalizado: '', // Monto personalizado para ajustes
              pagada: false
            };
            hayCambios = true;
          }
        });
        
        return hayCambios ? nuevosPagos : prev;
      });
    }
  }, [semanaActiva?.mercaderia]);

  // Función para guardar estado en Firebase con debounce
  const guardarEstado = useCallback(async (dinero, pagos) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await guardarEstadoPagosProveedores({
          dineroDisponible: {
            efectivo: parseFloat(dinero.efectivo) || 0,
            transferencia: parseFloat(dinero.transferencia) || 0,
            cheques: parseFloat(dinero.cheques) || 0
          },
          pagosBoletas: pagos,
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error al guardar estado:', err);
        addNotification('Error al guardar estado', 'error');
      }
    }, 1000); // Debounce de 1 segundo
  }, [guardarEstadoPagosProveedores, addNotification]);

  // Ref para rastrear el último estado guardado
  const lastSavedStateRef = useRef(null);

  // Guardar cuando cambie el dinero disponible o los pagos de boletas
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const currentState = JSON.stringify({
      dinero: dineroDisponible,
      pagos: pagosBoletas
    });
    
    // Solo guardar si el estado realmente cambió
    if (lastSavedStateRef.current !== currentState) {
      lastSavedStateRef.current = currentState;
      guardarEstado(dineroDisponible, pagosBoletas);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dineroDisponible.efectivo, dineroDisponible.transferencia, dineroDisponible.cheques, pagosBoletas, guardarEstado]);

  // Obtener monto a pagar de una boleta (personalizado o costo total)
  const obtenerMontoAPagar = (boleta) => {
    const montoPersonalizado = pagosBoletas[boleta.id]?.montoPersonalizado;
    if (montoPersonalizado && montoPersonalizado !== '') {
      return parseFloat(montoPersonalizado) || boleta.costoTotal;
    }
    return boleta.costoTotal;
  };

  // Calcular totales
  const calcularTotales = () => {
    const totalEfectivo = parseFloat(dineroDisponible.efectivo) || 0;
    const totalTransferencia = parseFloat(dineroDisponible.transferencia) || 0;
    const totalCheques = parseFloat(dineroDisponible.cheques) || 0;
    const totalDisponible = totalEfectivo + totalTransferencia + totalCheques;

    // Total de TODAS las boletas (seleccionadas y no seleccionadas)
    const totalTodasLasBoletas = boletas.reduce((sum, b) => sum + obtenerMontoAPagar(b), 0);

    const boletasSeleccionadas = boletas.filter(b => pagosBoletas[b.id]?.seleccionada);
    const totalAPagar = boletasSeleccionadas.reduce((sum, b) => sum + obtenerMontoAPagar(b), 0);

    const totalEfectivoUsado = boletasSeleccionadas.reduce((sum, b) => {
      return sum + (parseFloat(pagosBoletas[b.id]?.efectivo) || 0);
    }, 0);

    const totalTransferenciaUsada = boletasSeleccionadas.reduce((sum, b) => {
      return sum + (parseFloat(pagosBoletas[b.id]?.transferencia) || 0);
    }, 0);

    const totalChequesUsados = boletasSeleccionadas.reduce((sum, b) => {
      return sum + (parseFloat(pagosBoletas[b.id]?.cheques) || 0);
    }, 0);

    const totalUsado = totalEfectivoUsado + totalTransferenciaUsada + totalChequesUsados;

    return {
      totalDisponible,
      totalTodasLasBoletas,
      totalAPagar,
      totalUsado,
      totalEfectivo,
      totalTransferencia,
      totalCheques,
      totalEfectivoUsado,
      totalTransferenciaUsada,
      totalChequesUsados,
      disponible: {
        efectivo: totalEfectivo - totalEfectivoUsado,
        transferencia: totalTransferencia - totalTransferenciaUsada,
        cheques: totalCheques - totalChequesUsados
      }
    };
  };

  const totales = calcularTotales();

  // Actualizar pago de boleta
  const actualizarPagoBoleta = (boletaId, campo, valor) => {
    setPagosBoletas(prev => ({
      ...prev,
      [boletaId]: {
        ...prev[boletaId],
        [campo]: valor
      }
    }));
  };

  // Toggle selección de boleta
  const toggleSeleccionBoleta = (boletaId) => {
    setPagosBoletas(prev => ({
      ...prev,
      [boletaId]: {
        ...prev[boletaId],
        seleccionada: !prev[boletaId]?.seleccionada,
        pagada: false
      }
    }));
  };

  // Marcar/desmarcar medio de pago disponible para una boleta
  const toggleMedioPagoDisponible = (boletaId, metodoPago) => {
    const boleta = boletas.find(b => b.id === boletaId);
    if (!boleta) return;

    const montoAPagar = obtenerMontoAPagar(boleta);
    const pago = pagosBoletas[boletaId] || {};
    const medioActivo = pago[`${metodoPago}Disponible`] || false;
    
    setPagosBoletas(prev => {
      const nuevoEstado = {
        ...prev[boletaId],
        seleccionada: true,
        [`${metodoPago}Disponible`]: !medioActivo,
        pagada: false
      };

      // Si se desactiva un medio, limpiar su monto
      if (medioActivo) {
        nuevoEstado[metodoPago] = '';
      } else {
        // Si se activa y es el único medio disponible, asignar todo el monto
        const otrosMedios = ['efectivo', 'transferencia', 'cheques'].filter(m => m !== metodoPago);
        const otrosDisponibles = otrosMedios.filter(m => prev[boletaId]?.[`${m}Disponible`]);
        
        if (otrosDisponibles.length === 0) {
          // Es el único medio, asignar todo
          nuevoEstado[metodoPago] = montoAPagar.toFixed(2);
        } else {
          // Hay otros medios, distribuir equitativamente
          const mediosDisponibles = [...otrosDisponibles, metodoPago];
          const montoPorMedio = montoAPagar / mediosDisponibles.length;
          
          mediosDisponibles.forEach(medio => {
            nuevoEstado[medio] = montoPorMedio.toFixed(2);
          });
        }
      }

      return {
        ...prev,
        [boletaId]: nuevoEstado
      };
    });
  };

  // Calcular cuánto falta para pagar todas las boletas
  const calcularFaltante = () => {
    const totalTodasLasBoletas = boletas.reduce((sum, b) => sum + obtenerMontoAPagar(b), 0);
    const totalDisponible = totales.totalDisponible;
    const faltante = totalTodasLasBoletas - totalDisponible;
    
    return {
      totalBoletas: totalTodasLasBoletas,
      totalDisponible,
      faltante,
      tieneFaltante: faltante > 0
    };
  };

  const faltante = calcularFaltante();

  // Auto-distribuir pago
  const autoDistribuirPago = (boletaId) => {
    const disponible = totales.disponible;
    const boleta = boletas.find(b => b.id === boletaId);
    if (!boleta) return;
    
    const montoTotal = obtenerMontoAPagar(boleta);

    let efectivo = 0;
    let transferencia = 0;
    let cheques = 0;
    let restante = montoTotal;

    // Prioridad: Efectivo -> Transferencia -> Cheques
    if (disponible.efectivo > 0 && restante > 0) {
      efectivo = Math.min(disponible.efectivo, restante);
      restante -= efectivo;
    }
    if (disponible.transferencia > 0 && restante > 0) {
      transferencia = Math.min(disponible.transferencia, restante);
      restante -= transferencia;
    }
    if (disponible.cheques > 0 && restante > 0) {
      cheques = Math.min(disponible.cheques, restante);
      restante -= cheques;
    }

    actualizarPagoBoleta(boletaId, 'efectivo', efectivo > 0 ? efectivo.toFixed(2) : '');
    actualizarPagoBoleta(boletaId, 'transferencia', transferencia > 0 ? transferencia.toFixed(2) : '');
    actualizarPagoBoleta(boletaId, 'cheques', cheques > 0 ? cheques.toFixed(2) : '');
  };

  // Validar y procesar pagos
  const procesarPagos = async () => {
    const boletasSeleccionadas = boletas.filter(b => pagosBoletas[b.id]?.seleccionada);
    
    if (boletasSeleccionadas.length === 0) {
      addNotification('Seleccione al menos una boleta para pagar', 'warning');
      return;
    }

    // Validar que los pagos no excedan el disponible
    if (totales.totalUsado > totales.totalDisponible) {
      addNotification('El total usado excede el dinero disponible', 'error');
      return;
    }

    // Validar que cada boleta tenga pago completo o parcial válido
    for (const boleta of boletasSeleccionadas) {
      const pago = pagosBoletas[boleta.id];
      const efectivo = parseFloat(pago.efectivo) || 0;
      const transferencia = parseFloat(pago.transferencia) || 0;
      const cheques = parseFloat(pago.cheques) || 0;
      const totalPago = efectivo + transferencia + cheques;
      const montoAPagar = obtenerMontoAPagar(boleta);

      if (totalPago > montoAPagar) {
        addNotification(`El pago de ${boleta.proveedor} excede el monto de la boleta`, 'error');
        return;
      }
    }

    // Procesar cada pago
    try {
      for (const boleta of boletasSeleccionadas) {
        const pago = pagosBoletas[boleta.id];
        const efectivo = parseFloat(pago.efectivo) || 0;
        const transferencia = parseFloat(pago.transferencia) || 0;
        const cheques = parseFloat(pago.cheques) || 0;
        const totalPago = efectivo + transferencia + cheques;

        if (totalPago > 0) {
          // Crear un pago por cada método de pago usado
          if (efectivo > 0) {
            await agregarPagoProveedor({
              fecha: getLocalDateString(),
              proveedor: boleta.proveedor,
              monto: efectivo,
              metodoPago: 'Efectivo',
              descripcion: `Pago boleta ${boleta.dia} - ${boleta.proveedor}`,
              boletaIndex: boleta.index
            });
          }
          if (transferencia > 0) {
            await agregarPagoProveedor({
              fecha: getLocalDateString(),
              proveedor: boleta.proveedor,
              monto: transferencia,
              metodoPago: 'Transferencia',
              descripcion: `Pago boleta ${boleta.dia} - ${boleta.proveedor}`,
              boletaIndex: boleta.index
            });
          }
          if (cheques > 0) {
            await agregarPagoProveedor({
              fecha: getLocalDateString(),
              proveedor: boleta.proveedor,
              monto: cheques,
              metodoPago: 'Cheque',
              descripcion: `Pago boleta ${boleta.dia} - ${boleta.proveedor}`,
              boletaIndex: boleta.index
            });
          }

          // Marcar como pagada
          actualizarPagoBoleta(boleta.id, 'pagada', true);
        }
      }

      // Limpiar dinero disponible usado y resetear boletas pagadas
      const nuevoDinero = {
        efectivo: totales.disponible.efectivo.toString(),
        transferencia: totales.disponible.transferencia.toString(),
        cheques: totales.disponible.cheques.toString()
      };
      setDineroDisponible(nuevoDinero);

      // Resetear estado de boletas pagadas
      const nuevosPagos = { ...pagosBoletas };
      boletasSeleccionadas.forEach(boleta => {
        if (nuevosPagos[boleta.id]) {
          nuevosPagos[boleta.id] = {
            seleccionada: false,
            efectivo: '',
            transferencia: '',
            cheques: '',
            pagada: false
          };
        }
      });
      setPagosBoletas(nuevosPagos);

      // Guardar estado final
      await guardarEstadoPagosProveedores({
        dineroDisponible: {
          efectivo: parseFloat(nuevoDinero.efectivo) || 0,
          transferencia: parseFloat(nuevoDinero.transferencia) || 0,
          cheques: parseFloat(nuevoDinero.cheques) || 0
        },
        pagosBoletas: nuevosPagos,
        lastUpdated: new Date().toISOString()
      });

      addNotification('Pagos procesados correctamente', 'success');
    } catch (err) {
      addNotification('Error al procesar los pagos', 'error');
    }
  };

  // Agrupar boletas por proveedor
  const boletasPorProveedor = boletas.reduce((acc, boleta) => {
    if (!acc[boleta.proveedor]) {
      acc[boleta.proveedor] = [];
    }
    acc[boleta.proveedor].push(boleta);
    return acc;
  }, {});

  const totalPorProveedor = (proveedor) => {
    return boletasPorProveedor[proveedor]?.reduce((sum, b) => sum + obtenerMontoAPagar(b), 0) || 0;
  };

  return (
    <div className="row">
      {/* Panel izquierdo: Dinero disponible y resumen */}
      <div className="col-lg-4" data-tab="pagos-proveedores">
        <div className="card mb-3">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">💰 Dinero Disponible</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Efectivo:</label>
              <input 
                type="number"
                className="form-control form-control-lg"
                placeholder="0"
                value={dineroDisponible.efectivo}
                onChange={(e) => setDineroDisponible({...dineroDisponible, efectivo: e.target.value})}
                step="0.01"
                min="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Transferencia:</label>
              <input 
                type="number"
                className="form-control form-control-lg"
                placeholder="0"
                value={dineroDisponible.transferencia}
                onChange={(e) => setDineroDisponible({...dineroDisponible, transferencia: e.target.value})}
                step="0.01"
                min="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Cheques:</label>
              <input 
                type="number"
                className="form-control form-control-lg"
                placeholder="0"
                value={dineroDisponible.cheques}
                onChange={(e) => setDineroDisponible({...dineroDisponible, cheques: e.target.value})}
                step="0.01"
                min="0"
              />
            </div>

            <div className="alert alert-info mb-0">
              <strong>Total Disponible:</strong> {formatCurrency(totales.totalDisponible)}
            </div>
          </div>
        </div>

        {/* Resumen de pagos */}
        <div className="card mb-3">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">📊 Resumen</h5>
          </div>
          <div className="card-body">
            <div className="mb-3 pb-2 border-bottom">
              <strong className="text-muted">Total de todas las boletas:</strong>
              <div className="text-primary fs-3 fw-bold">{formatCurrency(faltante.totalBoletas)}</div>
            </div>
            
            <div className="mb-3 pb-2 border-bottom">
              <strong className="text-muted">Dinero disponible:</strong>
              <div className="text-success fs-4 fw-bold">{formatCurrency(faltante.totalDisponible)}</div>
            </div>

            {faltante.tieneFaltante ? (
              <div className="alert alert-danger mb-2">
                <strong>⚠️ FALTA:</strong>
                <div className="fs-3 fw-bold">{formatCurrency(faltante.faltante)}</div>
                <small>No tienes suficiente dinero para pagar todas las boletas</small>
              </div>
            ) : (
              <div className="alert alert-success mb-2">
                <strong>✓ Suficiente:</strong>
                <div className="fs-5">Tienes dinero suficiente para pagar todas las boletas</div>
                {faltante.faltante < 0 && (
                  <small className="text-muted">
                    Sobra: {formatCurrency(Math.abs(faltante.faltante))}
                  </small>
                )}
              </div>
            )}

            <hr />
            <div className="mb-2">
              <strong>Total a Pagar (seleccionadas):</strong>
              <div className="text-danger fs-4">{formatCurrency(totales.totalAPagar)}</div>
              <small className="text-muted">Solo boletas marcadas para pagar</small>
            </div>
            <div className="mb-2">
              <strong>Total Usado:</strong>
              <div className="text-info fs-5">{formatCurrency(totales.totalUsado)}</div>
            </div>
            <hr />
            <div className="mb-1">
              <small className="text-muted">Efectivo usado:</small>
              <div>{formatCurrency(totales.totalEfectivoUsado)}</div>
            </div>
            <div className="mb-1">
              <small className="text-muted">Transferencia usada:</small>
              <div>{formatCurrency(totales.totalTransferenciaUsada)}</div>
            </div>
            <div className="mb-1">
              <small className="text-muted">Cheques usados:</small>
              <div>{formatCurrency(totales.totalChequesUsados)}</div>
            </div>
            <hr />
            <div className="mb-1">
              <small className="text-muted">Efectivo disponible:</small>
              <div className={totales.disponible.efectivo < 0 ? 'text-danger' : ''}>
                {formatCurrency(totales.disponible.efectivo)}
              </div>
            </div>
            <div className="mb-1">
              <small className="text-muted">Transferencia disponible:</small>
              <div className={totales.disponible.transferencia < 0 ? 'text-danger' : ''}>
                {formatCurrency(totales.disponible.transferencia)}
              </div>
            </div>
            <div className="mb-1">
              <small className="text-muted">Cheques disponibles:</small>
              <div className={totales.disponible.cheques < 0 ? 'text-danger' : ''}>
                {formatCurrency(totales.disponible.cheques)}
              </div>
            </div>
          </div>
        </div>

        {/* Botón procesar */}
        <button 
          className="btn btn-success btn-lg w-100"
          onClick={procesarPagos}
          disabled={totales.totalAPagar === 0}
        >
          ✅ Procesar Pagos
        </button>
      </div>

      {/* Panel derecho: Boletas */}
      <div className="col-lg-8">
        {boletas.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-muted">
              <p>No hay boletas de mercadería registradas</p>
            </div>
          </div>
        ) : (
          <>
            {/* Sección superior: Todas las boletas en formato compacto */}
            <div className="card mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">📋 Seleccionar boletas a pagar</h5>
              </div>
              <div className="card-body">
                {Object.entries(boletasPorProveedor).map(([proveedor, boletasProv]) => (
                  <div key={proveedor} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>{proveedor}</strong>
                      <span className="badge bg-secondary">
                        {formatCurrency(totalPorProveedor(proveedor))}
                      </span>
                    </div>
                    <div className="row g-2">
                      {boletasProv.map(boleta => {
                        const pago = pagosBoletas[boleta.id] || {};
                        const montoAPagar = obtenerMontoAPagar(boleta);
                        const totalPago = (parseFloat(pago.efectivo) || 0) + 
                                         (parseFloat(pago.transferencia) || 0) + 
                                         (parseFloat(pago.cheques) || 0);
                        const estaPagada = totalPago >= montoAPagar && totalPago > 0;

                        return (
                          <div key={boleta.id} className="col-md-4 col-sm-6">
                            <div className={`card h-100 ${pago.seleccionada ? 'border-success' : 'border-secondary'} ${estaPagada ? 'bg-light' : ''}`} style={{ fontSize: '0.85rem' }}>
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-1 mb-1">
                                      <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>{boleta.dia}</span>
                                      <strong style={{ fontSize: '0.85rem' }}>{boleta.proveedor}</strong>
                                    </div>
                                    <div className="text-success fw-bold" style={{ fontSize: '0.9rem' }}>
                                      {formatCurrency(montoAPagar)}
                                    </div>
                                    {estaPagada && (
                                      <small className="text-success">✓ Pagada</small>
                                    )}
                                  </div>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={pago.seleccionada || false}
                                      onChange={() => toggleSeleccionBoleta(boleta.id)}
                                      disabled={estaPagada}
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
                ))}
              </div>
            </div>

            {/* Sección inferior: Boletas seleccionadas en detalle */}
            {boletas.filter(b => pagosBoletas[b.id]?.seleccionada).length > 0 && (
              <div className="card">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">💳 Configurar pagos de boletas seleccionadas</h5>
                </div>
                <div className="card-body">
                  <>
                    {Object.entries(boletasPorProveedor).map(([proveedor, boletasProv]) => {
                      const boletasSeleccionadas = boletasProv.filter(b => pagosBoletas[b.id]?.seleccionada);
                      if (boletasSeleccionadas.length === 0) return null;

                      return (
                        <div key={proveedor} className="mb-4">
                        <h6 className="mb-3">
                          <strong>{proveedor}</strong>
                          <span className="badge bg-secondary ms-2">
                            {boletasSeleccionadas.length} boleta{boletasSeleccionadas.length > 1 ? 's' : ''}
                          </span>
                        </h6>
                        <div className="row">
                          {boletasSeleccionadas.map(boleta => {
                            const pago = pagosBoletas[boleta.id] || {};
                            const montoAPagar = obtenerMontoAPagar(boleta);
                            const totalPago = (parseFloat(pago.efectivo) || 0) + 
                                             (parseFloat(pago.transferencia) || 0) + 
                                             (parseFloat(pago.cheques) || 0);
                            const pendiente = montoAPagar - totalPago;
                            const tieneMontoPersonalizado = pago.montoPersonalizado && pago.montoPersonalizado !== '';

                            return (
                              <div key={boleta.id} className="col-lg-6 mb-4">
                                <div className="card border-success h-100">
                                  <div className="card-header bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <span className="badge bg-primary">{boleta.dia}</span>
                                        {' '}
                                        <strong>{boleta.proveedor}</strong>
                                      </div>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => toggleSeleccionBoleta(boleta.id)}
                                      >
                                        ✕ Deseleccionar
                                      </button>
                                    </div>
                                  </div>
                                  <div className="card-body">
                                    <div className="mb-3">
                                      <div className="d-flex align-items-center gap-2 mb-2">
                                        <label className="form-label mb-0 fw-bold" style={{ minWidth: '100px' }}>
                                          Monto a pagar:
                                        </label>
                                        <input
                                          type="number"
                                          className="form-control"
                                          style={{ width: '150px' }}
                                          placeholder={boleta.costoTotal.toFixed(2)}
                                          value={pago.montoPersonalizado || ''}
                                          onChange={(e) => actualizarPagoBoleta(boleta.id, 'montoPersonalizado', e.target.value)}
                                          step="0.01"
                                          min="0"
                                        />
                                      </div>
                                      <div>
                                        <small className="text-muted">
                                          Calculado: {formatCurrency(boleta.costoTotal)}
                                          {tieneMontoPersonalizado && (
                                            <span className="text-info ms-2">
                                              (Ajustado: {formatCurrency(montoAPagar)})
                                            </span>
                                          )}
                                        </small>
                                      </div>
                                      <div className={`fs-4 fw-bold mt-2 ${tieneMontoPersonalizado ? 'text-info' : 'text-success'}`}>
                                        {formatCurrency(montoAPagar)}
                                      </div>
                                    </div>

                                    {/* Selección de medios de pago disponibles */}
                                    <div className="mb-3">
                                      <label className="form-label fw-bold">Medios de pago disponibles:</label>
                                      <div className="d-flex gap-3">
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={pago.efectivoDisponible || false}
                                            onChange={() => toggleMedioPagoDisponible(boleta.id, 'efectivo')}
                                            id={`efectivo-${boleta.id}`}
                                          />
                                          <label className="form-check-label" htmlFor={`efectivo-${boleta.id}`}>
                                            💵 Efectivo
                                          </label>
                                        </div>
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={pago.transferenciaDisponible || false}
                                            onChange={() => toggleMedioPagoDisponible(boleta.id, 'transferencia')}
                                            id={`transferencia-${boleta.id}`}
                                          />
                                          <label className="form-check-label" htmlFor={`transferencia-${boleta.id}`}>
                                            🏦 Transferencia
                                          </label>
                                        </div>
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={pago.chequesDisponible || false}
                                            onChange={() => toggleMedioPagoDisponible(boleta.id, 'cheques')}
                                            id={`cheques-${boleta.id}`}
                                          />
                                          <label className="form-check-label" htmlFor={`cheques-${boleta.id}`}>
                                            📝 Cheques
                                          </label>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Campos de montos (solo si hay medios seleccionados) */}
                                    {(pago.efectivoDisponible || pago.transferenciaDisponible || pago.chequesDisponible) && (
                                      <>
                                        <div className="mb-3">
                                          <button
                                            className="btn btn-outline-primary w-100"
                                            onClick={() => autoDistribuirPago(boleta.id)}
                                          >
                                            🔄 Auto-distribuir equitativamente
                                          </button>
                                        </div>

                                        {pago.efectivoDisponible && (
                                          <div className="mb-3">
                                            <label className="form-label fw-bold">💵 Efectivo:</label>
                                            <input
                                              type="number"
                                              className="form-control"
                                              placeholder="0"
                                              value={pago.efectivo || ''}
                                              onChange={(e) => actualizarPagoBoleta(boleta.id, 'efectivo', e.target.value)}
                                              step="0.01"
                                              min="0"
                                            />
                                          </div>
                                        )}

                                        {pago.transferenciaDisponible && (
                                          <div className="mb-3">
                                            <label className="form-label fw-bold">🏦 Transferencia:</label>
                                            <input
                                              type="number"
                                              className="form-control"
                                              placeholder="0"
                                              value={pago.transferencia || ''}
                                              onChange={(e) => actualizarPagoBoleta(boleta.id, 'transferencia', e.target.value)}
                                              step="0.01"
                                              min="0"
                                            />
                                          </div>
                                        )}

                                        {pago.chequesDisponible && (
                                          <div className="mb-3">
                                            <label className="form-label fw-bold">📝 Cheques:</label>
                                            <input
                                              type="number"
                                              className="form-control"
                                              placeholder="0"
                                              value={pago.cheques || ''}
                                              onChange={(e) => actualizarPagoBoleta(boleta.id, 'cheques', e.target.value)}
                                              step="0.01"
                                              min="0"
                                            />
                                          </div>
                                        )}

                                        <div className="mt-3 pt-3 border-top">
                                          <div className="d-flex justify-content-between mb-2">
                                            <strong>Total asignado:</strong>
                                            <strong className={totalPago > montoAPagar ? 'text-danger' : 'text-success'}>
                                              {formatCurrency(totalPago)}
                                            </strong>
                                          </div>
                                          {pendiente > 0 && (
                                            <div className="d-flex justify-content-between text-muted">
                                              <span>Pendiente:</span>
                                              <span>{formatCurrency(pendiente)}</span>
                                            </div>
                                          )}
                                          {pendiente < 0 && (
                                            <div className="text-danger">
                                              ⚠️ Excede el monto de la boleta
                                            </div>
                                          )}
                                          {pendiente === 0 && totalPago > 0 && (
                                            <div className="text-success">
                                              ✓ Pago completo
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </div>
                      );
                    })}
                  </>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
