import { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrency, parseCurrencyValue } from '../../utils/money';
import { getLocalDateString } from '../../utils/date';
import { useSaldoProveedor, DescuentoSaldoProveedor } from '../saldoProveedor';

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

  // Valores mostrados en los inputs (sin formato mientras se escribe)
  const [valoresInput, setValoresInput] = useState({
    efectivo: '',
    transferencia: '',
    cheques: ''
  });

  // Estado LOCAL: selecciones y configuración de pagos (NO se guarda en Firebase)
  const [pagosBoletasLocal, setPagosBoletasLocal] = useState({});
  
  // Estado COMPARTIDO: solo boletas pagadas (SÍ se guarda en Firebase para que otros usuarios lo vean)
  const [boletasPagadas, setBoletasPagadas] = useState({});

  // Hook para manejar saldos a favor de proveedores
  const {
    obtenerSaldoAFavor,
    obtenerSaldoAFavorPorBoletas,
    obtenerInfoSaldo,
    aplicarDescuento,
    quitarDescuento,
    obtenerDescuentoAplicado,
    calcularTotalConDescuento,
    calcularTotalGeneralConDescuentos,
    limpiarTodosLosDescuentos
  } = useSaldoProveedor();

  // Refs para sincronización periódica
  const syncIntervalRef = useRef(null);
  const isInitialLoad = useRef(true);
  const isSyncingRef = useRef(false); // Evitar sincronizaciones simultáneas

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

  // Cargar estado COMPARTIDO desde Firebase (solo boletas pagadas y dinero disponible)
  useEffect(() => {
    if (!semanaActiva?.pagosProveedoresEstado) {
      isInitialLoad.current = false;
      return;
    }

    const estado = semanaActiva.pagosProveedoresEstado;
    
    // Solo cargar en la carga inicial o si realmente cambió el estado desde Firebase
    if (isInitialLoad.current) {
      // Cargar dinero disponible
      if (estado.dineroDisponible) {
        const nuevoDinero = {
          efectivo: estado.dineroDisponible.efectivo?.toString() || '',
          transferencia: estado.dineroDisponible.transferencia?.toString() || '',
          cheques: estado.dineroDisponible.cheques?.toString() || ''
        };
        setDineroDisponible(nuevoDinero);
        // Mostrar formato al cargar
        setValoresInput({
          efectivo: nuevoDinero.efectivo ? formatearNumeroInput(nuevoDinero.efectivo) : '',
          transferencia: nuevoDinero.transferencia ? formatearNumeroInput(nuevoDinero.transferencia) : '',
          cheques: nuevoDinero.cheques ? formatearNumeroInput(nuevoDinero.cheques) : ''
        });
      }
      
      // Cargar solo las boletas pagadas (estado compartido)
      if (estado.boletasPagadas) {
        setBoletasPagadas(estado.boletasPagadas);
      }
      
      isInitialLoad.current = false;
    } else {
      // En cargas posteriores, solo actualizar si viene de otro usuario (comparar timestamps)
      // Por ahora, solo actualizar boletas pagadas si cambió
      if (estado.boletasPagadas) {
        setBoletasPagadas(prev => {
          const nuevoEstado = estado.boletasPagadas;
          // Solo actualizar si realmente cambió
          if (JSON.stringify(prev) !== JSON.stringify(nuevoEstado)) {
            return nuevoEstado;
          }
          return prev;
        });
      }
    }
  }, [semanaActiva?.pagosProveedoresEstado]);

  // Inicializar estado LOCAL si no existen (solo para nuevas boletas)
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const nuevasBoletas = obtenerBoletas();
    if (nuevasBoletas.length > 0) {
      setPagosBoletasLocal(prev => {
        const nuevosPagos = { ...prev };
        let hayCambios = false;
        
        nuevasBoletas.forEach(boleta => {
          if (!nuevosPagos[boleta.id]) {
            nuevosPagos[boleta.id] = {
              seleccionada: false,
              efectivo: '',
              transferencia: '',
              cheques: '',
              montoPersonalizado: '' // Monto personalizado para ajustes
            };
            hayCambios = true;
          }
        });
        
        return hayCambios ? nuevosPagos : prev;
      });
    }
  }, [semanaActiva?.mercaderia]);

  // Ref para rastrear el último estado sincronizado
  const lastSyncedStateRef = useRef(null);

  // Función para sincronizar estado COMPARTIDO a Firebase (solo boletas pagadas y dinero disponible)
  const sincronizarEstadoCompartido = useCallback(async () => {
    // Evitar sincronizaciones simultáneas
    if (isSyncingRef.current) {
      return;
    }

    const estadoActual = JSON.stringify({
      dinero: dineroDisponible,
      pagadas: boletasPagadas
    });

    // Solo sincronizar si el estado realmente cambió
    if (lastSyncedStateRef.current === estadoActual) {
      return;
    }

    isSyncingRef.current = true;
    try {
      await guardarEstadoPagosProveedores({
        dineroDisponible: {
          efectivo: parseFloat(dineroDisponible.efectivo) || 0,
          transferencia: parseFloat(dineroDisponible.transferencia) || 0,
          cheques: parseFloat(dineroDisponible.cheques) || 0
        },
        boletasPagadas: boletasPagadas, // Solo guardar las pagadas
        lastUpdated: new Date().toISOString()
      });
      
      lastSyncedStateRef.current = estadoActual;
    } catch (err) {
      console.error('Error al sincronizar estado:', err);
      addNotification('Error al sincronizar estado', 'error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [dineroDisponible, boletasPagadas, guardarEstadoPagosProveedores, addNotification]);

  // Sincronización periódica cada 10 segundos (solo estado compartido)
  useEffect(() => {
    if (isInitialLoad.current) return;

    // Limpiar intervalo anterior si existe
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Sincronizar inmediatamente cuando cambia el dinero disponible o boletas pagadas (con debounce)
    const timeoutId = setTimeout(() => {
      sincronizarEstadoCompartido();
    }, 500); // Debounce de 500ms

    // Configurar sincronización periódica cada 10 segundos
    syncIntervalRef.current = setInterval(() => {
      sincronizarEstadoCompartido();
    }, 10000); // Cada 10 segundos

    return () => {
      clearTimeout(timeoutId);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [dineroDisponible.efectivo, dineroDisponible.transferencia, dineroDisponible.cheques, boletasPagadas, sincronizarEstadoCompartido]);

  // Obtener monto a pagar de una boleta (personalizado o costo total)
  const obtenerMontoAPagar = (boleta) => {
    const montoPersonalizado = pagosBoletasLocal[boleta.id]?.montoPersonalizado;
    if (montoPersonalizado && montoPersonalizado !== '') {
      return parseFloat(montoPersonalizado) || boleta.costoTotal;
    }
    return boleta.costoTotal;
  };

  // Formatear número con separadores de miles para mostrar
  const formatearNumeroInput = (valor) => {
    if (!valor || valor === '') return '';
    const numero = parseCurrencyValue(valor);
    if (numero === 0) return '';
    // Formatear con separadores de miles (puntos) sin decimales para inputs
    return numero.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  };

  // Convertir número a palabras en español
  const numeroAPalabras = (valor) => {
    if (!valor || valor === '' || valor === '0') return '';
    
    const numero = parseCurrencyValue(valor);
    if (numero === 0) return '';
    
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    const convertirGrupo = (num) => {
      if (num === 0) return '';
      if (num === 100) return 'cien';
      
      let resultado = '';
      const c = Math.floor(num / 100);
      const d = Math.floor((num % 100) / 10);
      const u = num % 10;
      
      if (c > 0) {
        resultado += centenas[c] + ' ';
      }
      
      if (d === 1) {
        resultado += especiales[u] + ' ';
      } else if (d > 1) {
        resultado += decenas[d];
        if (u > 0) {
          resultado += ' y ' + unidades[u];
        }
        resultado += ' ';
      } else if (u > 0) {
        resultado += unidades[u] + ' ';
      }
      
      return resultado.trim();
    };
    
    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      const resto = numero % 1000000;
      let resultado = '';
      
      if (millones === 1) {
        resultado = 'un millón ';
      } else {
        resultado = convertirGrupo(millones) + 'millones ';
      }
      
      if (resto > 0) {
        resultado += convertirGrupo(Math.floor(resto / 1000)) + (Math.floor(resto / 1000) === 1 ? 'mil ' : Math.floor(resto / 1000) > 0 ? 'mil ' : '');
        resultado += convertirGrupo(resto % 1000);
      }
      
      return resultado.trim() + ' pesos';
    } else if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      const resto = numero % 1000;
      let resultado = '';
      
      if (miles === 1) {
        resultado = 'mil ';
      } else {
        resultado = convertirGrupo(miles) + 'mil ';
      }
      
      if (resto > 0) {
        resultado += convertirGrupo(resto);
      }
      
      return resultado.trim() + ' pesos';
    } else {
      return convertirGrupo(numero) + 'pesos';
    }
  };

  // Manejar cambio en campos de dinero disponible - solo números, sin formato mientras escribe
  const manejarCambioDinero = (campo, valor) => {
    // Solo permitir números (0-9)
    const soloNumeros = valor.replace(/[^\d]/g, '');
    
    // Actualizar ambos estados
    setDineroDisponible(prev => ({
      ...prev,
      [campo]: soloNumeros
    }));
    
    setValoresInput(prev => ({
      ...prev,
      [campo]: soloNumeros
    }));
  };

  // Manejar cuando el input pierde el foco - mostrar formato
  const manejarBlurDinero = (campo) => {
    const valor = dineroDisponible[campo] || '';
    // Mostrar formato cuando pierde el foco
    if (valor) {
      setValoresInput(prev => ({
        ...prev,
        [campo]: formatearNumeroInput(valor)
      }));
    }
  };

  // Manejar cuando el input recibe el foco - mostrar solo números sin formato
  const manejarFocusDinero = (campo) => {
    const valor = dineroDisponible[campo] || '';
    // Mostrar solo números cuando está enfocado para escribir fácilmente
    setValoresInput(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Función helper para obtener el estado completo de una boleta (local + compartido)
  const obtenerEstadoBoleta = (boletaId) => {
    const estadoLocal = pagosBoletasLocal[boletaId] || {};
    const estaPagada = boletasPagadas[boletaId] || false;
    return {
      ...estadoLocal,
      pagada: estaPagada
    };
  };

  // Calcular totales
  const calcularTotales = () => {
    const totalEfectivo = parseFloat(dineroDisponible.efectivo) || 0;
    const totalTransferencia = parseFloat(dineroDisponible.transferencia) || 0;
    const totalCheques = parseFloat(dineroDisponible.cheques) || 0;
    const totalDisponible = totalEfectivo + totalTransferencia + totalCheques;

    // Total de TODAS las boletas (seleccionadas y no seleccionadas)
    const totalTodasLasBoletas = boletas.reduce((sum, b) => sum + obtenerMontoAPagar(b), 0);

    const boletasSeleccionadas = boletas.filter(b => {
      const estadoLocal = pagosBoletasLocal[b.id] || {};
      const estaPagada = boletasPagadas[b.id] || false;
      return estadoLocal.seleccionada && !estaPagada; // Excluir las que están marcadas como pagadas
    });
    
    // Calcular totales por proveedor (para aplicar descuentos)
    const totalesPorProveedor = {};
    boletasSeleccionadas.forEach(b => {
      if (!totalesPorProveedor[b.proveedor]) {
        totalesPorProveedor[b.proveedor] = 0;
      }
      totalesPorProveedor[b.proveedor] += obtenerMontoAPagar(b);
    });
    
    // Calcular totales con descuentos aplicados
    const { totalOriginal, totalDescuentos, totalFinal } = calcularTotalGeneralConDescuentos(totalesPorProveedor);
    const totalAPagar = totalFinal; // Total después de descuentos
    const totalAPagarSinDescuentos = totalOriginal; // Total original sin descuentos

    const totalEfectivoUsado = boletasSeleccionadas.reduce((sum, b) => {
      return sum + (parseFloat(pagosBoletasLocal[b.id]?.efectivo) || 0);
    }, 0);

    const totalTransferenciaUsada = boletasSeleccionadas.reduce((sum, b) => {
      return sum + (parseFloat(pagosBoletasLocal[b.id]?.transferencia) || 0);
    }, 0);

    const totalChequesUsados = boletasSeleccionadas.reduce((sum, b) => {
      return sum + (parseFloat(pagosBoletasLocal[b.id]?.cheques) || 0);
    }, 0);

    const totalUsado = totalEfectivoUsado + totalTransferenciaUsada + totalChequesUsados;

    return {
      totalDisponible,
      totalTodasLasBoletas,
      totalAPagar, // Con descuentos aplicados
      totalAPagarSinDescuentos, // Sin descuentos
      totalDescuentos, // Total de descuentos aplicados
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

  // Actualizar pago de boleta (estado LOCAL)
  const actualizarPagoBoleta = (boletaId, campo, valor) => {
    setPagosBoletasLocal(prev => ({
      ...prev,
      [boletaId]: {
        ...prev[boletaId],
        [campo]: valor
      }
    }));
  };

  // Toggle selección de boleta (estado LOCAL - no se guarda en Firebase)
  const toggleSeleccionBoleta = (boletaId) => {
    setPagosBoletasLocal(prev => ({
      ...prev,
      [boletaId]: {
        ...prev[boletaId],
        seleccionada: !prev[boletaId]?.seleccionada
      }
    }));
  };

  // Toggle estado pagada de boleta (estado COMPARTIDO - se guarda en Firebase)
  const togglePagadaBoleta = (boletaId) => {
    const nuevoEstadoPagada = !boletasPagadas[boletaId];
    
    // Actualizar estado compartido (se sincronizará automáticamente)
    setBoletasPagadas(prev => ({
      ...prev,
      [boletaId]: nuevoEstadoPagada
    }));
    
    // Si se marca como pagada, deseleccionar automáticamente (estado local)
    if (nuevoEstadoPagada) {
      setPagosBoletasLocal(prev => ({
        ...prev,
        [boletaId]: {
          ...prev[boletaId],
          seleccionada: false
        }
      }));
    }
  };

  // Marcar todas las boletas de un proveedor como pagadas
  const marcarTodasPagadasProveedor = (proveedor) => {
    const boletasProveedor = boletas.filter(b => b.proveedor === proveedor);
    
    // Verificar si todas las boletas ya están marcadas como pagadas
    const todasPagadas = boletasProveedor.every(boleta => boletasPagadas[boleta.id]);
    
    const nuevasPagadas = { ...boletasPagadas };
    const nuevosPagosLocal = { ...pagosBoletasLocal };
    
    boletasProveedor.forEach(boleta => {
      if (todasPagadas) {
        // Si todas están pagadas, desmarcarlas
        nuevasPagadas[boleta.id] = false;
      } else {
        // Si no todas están pagadas, marcarlas todas como pagadas
        nuevasPagadas[boleta.id] = true;
        // Deseleccionar todas al marcarlas como pagadas
        if (nuevosPagosLocal[boleta.id]) {
          nuevosPagosLocal[boleta.id] = {
            ...nuevosPagosLocal[boleta.id],
            seleccionada: false
          };
        } else {
          nuevosPagosLocal[boleta.id] = {
            seleccionada: false,
            efectivo: '',
            transferencia: '',
            cheques: '',
            montoPersonalizado: ''
          };
        }
      }
    });
    
    setBoletasPagadas(nuevasPagadas);
    setPagosBoletasLocal(nuevosPagosLocal);
  };

  // Seleccionar todas las boletas de un proveedor (solo las que no están pagadas)
  // Funciona como toggle: si todas están seleccionadas, las deselecciona
  const seleccionarTodasProveedor = (proveedor) => {
    const boletasProveedor = boletas.filter(b => {
      return b.proveedor === proveedor && !boletasPagadas[b.id];
    });
    
    // Verificar si todas las boletas ya están seleccionadas
    const todasSeleccionadas = boletasProveedor.every(boleta => {
      const estadoLocal = pagosBoletasLocal[boleta.id];
      return estadoLocal?.seleccionada === true;
    });
    
    setPagosBoletasLocal(prev => {
      const nuevosPagos = { ...prev };
      boletasProveedor.forEach(boleta => {
        if (todasSeleccionadas) {
          // Si todas están seleccionadas, deseleccionarlas
          if (nuevosPagos[boleta.id]) {
            nuevosPagos[boleta.id] = {
              ...nuevosPagos[boleta.id],
              seleccionada: false
            };
          } else {
            nuevosPagos[boleta.id] = {
              seleccionada: false,
              efectivo: '',
              transferencia: '',
              cheques: '',
              montoPersonalizado: ''
            };
          }
        } else {
          // Si no todas están seleccionadas, seleccionarlas todas
          if (nuevosPagos[boleta.id]) {
            nuevosPagos[boleta.id] = {
              ...nuevosPagos[boleta.id],
              seleccionada: true
            };
          } else {
            nuevosPagos[boleta.id] = {
              seleccionada: true,
              efectivo: '',
              transferencia: '',
              cheques: '',
              montoPersonalizado: ''
            };
          }
        }
      });
      return nuevosPagos;
    });
  };

  // Marcar/desmarcar medio de pago disponible para una boleta
  const toggleMedioPagoDisponible = (boletaId, metodoPago) => {
    const boleta = boletas.find(b => b.id === boletaId);
    if (!boleta) return;

    const montoAPagar = obtenerMontoAPagar(boleta);
    const pago = pagosBoletasLocal[boletaId] || {};
    const medioActivo = pago[`${metodoPago}Disponible`] || false;
    
    setPagosBoletasLocal(prev => {
      const nuevoEstado = {
        ...prev[boletaId],
        seleccionada: true,
        [`${metodoPago}Disponible`]: !medioActivo
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

  // Calcular cuánto falta para pagar las boletas seleccionadas
  const calcularFaltante = () => {
    const boletasSeleccionadas = boletas.filter(b => {
      const estadoLocal = pagosBoletasLocal[b.id] || {};
      const estaPagada = boletasPagadas[b.id] || false;
      return estadoLocal.seleccionada && !estaPagada; // Excluir las que están marcadas como pagadas
    });
    
    // Usar el total con descuentos aplicados (ya calculado en calcularTotales)
    const totalBoletasSeleccionadas = totales.totalAPagar; // Ya incluye descuentos
    const totalDisponible = totales.totalDisponible;
    const faltante = totalBoletasSeleccionadas - totalDisponible;
    
    return {
      totalBoletas: totalBoletasSeleccionadas, // Con descuentos aplicados
      totalBoletasSinDescuentos: totales.totalAPagarSinDescuentos, // Sin descuentos
      totalDescuentos: totales.totalDescuentos, // Total de descuentos
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
    const boletasSeleccionadas = boletas.filter(b => {
      const estadoLocal = pagosBoletasLocal[b.id] || {};
      const estaPagada = boletasPagadas[b.id] || false;
      return estadoLocal.seleccionada && !estaPagada;
    });
    
    if (boletasSeleccionadas.length === 0) {
      addNotification('Seleccione al menos una boleta para pagar', 'warning');
      return;
    }

    // Validar que los pagos no excedan el disponible (considerando descuentos)
    // El totalAPagar ya incluye los descuentos aplicados
    if (totales.totalUsado > totales.totalDisponible) {
      addNotification('El total usado excede el dinero disponible', 'error');
      return;
    }

    // Validar que cada boleta tenga pago completo o parcial válido
    // Considerar descuentos por proveedor al validar
    for (const boleta of boletasSeleccionadas) {
      const pago = pagosBoletasLocal[boleta.id] || {};
      const efectivo = parseFloat(pago.efectivo) || 0;
      const transferencia = parseFloat(pago.transferencia) || 0;
      const cheques = parseFloat(pago.cheques) || 0;
      const totalPago = efectivo + transferencia + cheques;
      const montoAPagar = obtenerMontoAPagar(boleta);
      
      // Obtener el descuento aplicado para este proveedor
      const descuento = obtenerDescuentoAplicado(boleta.proveedor);
      const montoAPagarConDescuento = Math.max(0, montoAPagar - descuento);

      if (totalPago > montoAPagarConDescuento) {
        addNotification(`El pago de ${boleta.proveedor} excede el monto de la boleta (considerando descuentos)`, 'error');
        return;
      }
    }

    // Procesar cada pago
    try {
      for (const boleta of boletasSeleccionadas) {
        const pago = pagosBoletasLocal[boleta.id] || {};
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

      // Resetear estado LOCAL de boletas procesadas (preservar montoPersonalizado si existe)
      const nuevosPagosLocal = { ...pagosBoletasLocal };
      boletasSeleccionadas.forEach(boleta => {
        if (nuevosPagosLocal[boleta.id]) {
          const montoPersonalizado = nuevosPagosLocal[boleta.id].montoPersonalizado;
          nuevosPagosLocal[boleta.id] = {
            seleccionada: false,
            efectivo: '',
            transferencia: '',
            cheques: '',
            montoPersonalizado: montoPersonalizado || '' // Preservar monto personalizado si existe
          };
        }
      });
      setPagosBoletasLocal(nuevosPagosLocal);

      // Sincronizar estado compartido (dinero disponible se sincroniza automáticamente)
      // Las boletas pagadas se sincronizan automáticamente cuando se marcan

      // Limpiar descuentos aplicados después de procesar
      limpiarTodosLosDescuentos();

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

  // Calcular total de boletas seleccionadas por proveedor
  const totalSeleccionadasPorProveedor = (proveedor) => {
    const boletasProv = boletasPorProveedor[proveedor] || [];
    return boletasProv
      .filter(b => {
        const estadoLocal = pagosBoletasLocal[b.id] || {};
        const estaPagada = boletasPagadas[b.id] || false;
        return estadoLocal.seleccionada && !estaPagada;
      })
      .reduce((sum, b) => sum + obtenerMontoAPagar(b), 0);
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
                type="text"
                className="form-control form-control-lg"
                placeholder="0"
                value={valoresInput.efectivo || ''}
                onChange={(e) => manejarCambioDinero('efectivo', e.target.value)}
                onFocus={() => manejarFocusDinero('efectivo')}
                onBlur={() => manejarBlurDinero('efectivo')}
                inputMode="numeric"
              />
              {dineroDisponible.efectivo && parseCurrencyValue(dineroDisponible.efectivo) > 0 && (
                <small className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                  {numeroAPalabras(dineroDisponible.efectivo)}
                </small>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Transferencia:</label>
              <input 
                type="text"
                className="form-control form-control-lg"
                placeholder="0"
                value={valoresInput.transferencia || ''}
                onChange={(e) => manejarCambioDinero('transferencia', e.target.value)}
                onFocus={() => manejarFocusDinero('transferencia')}
                onBlur={() => manejarBlurDinero('transferencia')}
                inputMode="numeric"
              />
              {dineroDisponible.transferencia && parseCurrencyValue(dineroDisponible.transferencia) > 0 && (
                <small className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                  {numeroAPalabras(dineroDisponible.transferencia)}
                </small>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Cheques:</label>
              <input 
                type="text"
                className="form-control form-control-lg"
                placeholder="0"
                value={valoresInput.cheques || ''}
                onChange={(e) => manejarCambioDinero('cheques', e.target.value)}
                onFocus={() => manejarFocusDinero('cheques')}
                onBlur={() => manejarBlurDinero('cheques')}
                inputMode="numeric"
              />
              {dineroDisponible.cheques && parseCurrencyValue(dineroDisponible.cheques) > 0 && (
                <small className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                  {numeroAPalabras(dineroDisponible.cheques)}
                </small>
              )}
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
              <strong className="text-muted">Total de boletas seleccionadas:</strong>
              <div className="text-primary fs-3 fw-bold">{formatCurrency(totales.totalAPagarSinDescuentos || totales.totalAPagar)}</div>
              {totales.totalDescuentos > 0 && (
                <>
                  <small className="text-muted d-block mt-1">Descuentos aplicados:</small>
                  <div className="text-success fs-4 fw-bold">- {formatCurrency(totales.totalDescuentos)}</div>
                  <small className="text-muted d-block mt-2">Total final a pagar:</small>
                  <div className="text-primary fs-3 fw-bold">{formatCurrency(totales.totalAPagar)}</div>
                </>
              )}
            </div>
            
            <div className="mb-3 pb-2 border-bottom">
              <strong className="text-muted">Dinero disponible:</strong>
              <div className="text-success fs-4 fw-bold">{formatCurrency(faltante.totalDisponible)}</div>
            </div>

            {faltante.tieneFaltante ? (
              <div className="alert alert-danger mb-2">
                <strong>⚠️ FALTA:</strong>
                <div className="fs-3 fw-bold">{formatCurrency(faltante.faltante)}</div>
                <small>No tienes suficiente dinero para pagar las boletas seleccionadas</small>
              </div>
            ) : (
              <div className="alert alert-success mb-2">
                <strong>✓ Suficiente:</strong>
                <div className="fs-5">Tienes dinero suficiente para pagar las boletas seleccionadas</div>
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
              {totales.totalDescuentos > 0 ? (
                <>
                  <div className="text-muted fs-5 text-decoration-line-through">
                    {formatCurrency(totales.totalAPagarSinDescuentos)}
                  </div>
                  <div className="text-danger fs-4">
                    {formatCurrency(totales.totalAPagar)}
                  </div>
                  <small className="text-success">
                    Descuento aplicado: -{formatCurrency(totales.totalDescuentos)}
                  </small>
                </>
              ) : (
                <>
                  <div className="text-danger fs-4">{formatCurrency(totales.totalAPagar)}</div>
                  <small className="text-muted">Solo boletas marcadas para pagar</small>
                </>
              )}
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
              <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0">📋 Seleccionar boletas a pagar</h5>
                {boletas.length > 0 && (() => {
                  const pendientes = boletas.filter(b => !boletasPagadas[b.id]).length;
                  return pendientes > 0 ? (
                    <span className="badge bg-warning text-dark" title="Boletas sin marcar como pagadas">
                      {pendientes} de {boletas.length} pendientes
                    </span>
                  ) : (
                    <span className="badge bg-success" title="Todas las boletas marcadas como pagadas">
                      ✓ Todas pagadas
                    </span>
                  );
                })()}
              </div>
              <div className="card-body">
                {Object.entries(boletasPorProveedor).map(([proveedor, boletasProv]) => {
                  const totalBoletas = totalPorProveedor(proveedor);
                  const totalSeleccionadas = totalSeleccionadasPorProveedor(proveedor);
                  
                  // Obtener las boletas seleccionadas del proveedor (solo las no pagadas)
                  const boletasSeleccionadas = boletasProv.filter(boleta => {
                    const estadoLocal = pagosBoletasLocal[boleta.id];
                    return estadoLocal?.seleccionada === true && !boletasPagadas[boleta.id];
                  });
                  
                  // Obtener saldo a favor SOLO si hay boletas seleccionadas vinculadas
                  const saldoAFavor = boletasSeleccionadas.length > 0 
                    ? obtenerSaldoAFavorPorBoletas(proveedor, boletasSeleccionadas)
                    : 0;
                  
                  const descuentoAplicado = obtenerDescuentoAplicado(proveedor);
                  const tieneDescuento = descuentoAplicado > 0;
                  
                  // Verificar si todas las boletas (no pagadas) están seleccionadas
                  const boletasNoPagadas = boletasProv.filter(b => !boletasPagadas[b.id]);
                  const todasSeleccionadas = boletasNoPagadas.length > 0 && boletasNoPagadas.every(boleta => {
                    const estadoLocal = pagosBoletasLocal[boleta.id];
                    return estadoLocal?.seleccionada === true;
                  });
                  
                  // Verificar si todas las boletas están marcadas como pagadas
                  const todasPagadas = boletasProv.length > 0 && boletasProv.every(boleta => boletasPagadas[boleta.id]);
                  
                  return (
                  <div key={proveedor} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <strong>{proveedor}</strong>
                        <span className="badge bg-secondary" title={`Total de boletas: ${formatCurrency(totalBoletas)}`}>
                          {formatCurrency(totalBoletas)}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => seleccionarTodasProveedor(proveedor)}
                          title={todasSeleccionadas ? "Deseleccionar todas las boletas" : "Seleccionar todas las boletas de este proveedor"}
                        >
                          {todasSeleccionadas ? '✗ Deseleccionar todas' : '✓ Seleccionar todas'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => marcarTodasPagadasProveedor(proveedor)}
                          title={todasPagadas ? "Desmarcar todas las boletas como pagadas" : "Marcar todas las boletas como pagadas"}
                        >
                          {todasPagadas ? '✗ Desmarcar todas pagadas' : '💰 Marcar todas pagadas'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Componente de descuento por saldo a favor */}
                    {totalSeleccionadas > 0 && (
                      <DescuentoSaldoProveedor
                        nombreProveedor={proveedor}
                        saldoAFavor={saldoAFavor}
                        descuentoAplicado={descuentoAplicado}
                        tieneDescuento={tieneDescuento}
                        onAplicarDescuento={aplicarDescuento}
                        onQuitarDescuento={quitarDescuento}
                        totalBoletasSeleccionadas={totalSeleccionadas}
                      />
                    )}
                    
                    <div className="row g-2">
                      {boletasProv.map(boleta => {
                        const estadoLocal = pagosBoletasLocal[boleta.id] || {};
                        const montoAPagar = obtenerMontoAPagar(boleta);
                        const estaPagada = boletasPagadas[boleta.id] || false;

                        return (
                          <div key={boleta.id} className="col-md-4 col-sm-6">
                            <div 
                              className={`card h-100 ${estadoLocal.seleccionada ? 'border-success' : 'border-secondary'} ${estaPagada ? 'bg-light' : ''}`} 
                              style={{ fontSize: '0.85rem', opacity: estaPagada ? 0.5 : 1, cursor: estaPagada ? 'pointer' : 'default' }}
                              onClick={estaPagada ? (e) => {
                                // Si el clic fue en un checkbox, input o label, no desmarcar
                                if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.closest('.form-check')) {
                                  return;
                                }
                                togglePagadaBoleta(boleta.id);
                              } : undefined}
                              title={estaPagada ? 'Clic para desmarcar como pagada' : ''}
                            >
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-1 mb-1">
                                      <span className="badge bg-primary" style={{ fontSize: '0.7rem', opacity: estaPagada ? 0.6 : 1 }}>{boleta.dia}</span>
                                      <strong style={{ fontSize: '0.85rem', opacity: estaPagada ? 0.5 : 1, color: estaPagada ? '#6c757d' : 'inherit' }}>{boleta.proveedor}</strong>
                                    </div>
                                    <div className="fw-bold text-success" style={{ fontSize: '0.9rem', opacity: estaPagada ? 0.5 : 1 }}>
                                      {formatCurrency(montoAPagar)}
                                    </div>
                                  </div>
                                  <div className="d-flex flex-column gap-2 align-items-end" style={{ opacity: estaPagada ? 0.7 : 1 }}>
                                    <div className="form-check d-flex align-items-center gap-1">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={estadoLocal.seleccionada || false}
                                        onChange={() => toggleSeleccionBoleta(boleta.id)}
                                        disabled={estaPagada}
                                        id={`select-${boleta.id}`}
                                        title="Seleccionar para pagar"
                                        style={{ opacity: estaPagada ? 0.5 : 1 }}
                                      />
                                      <label className="form-check-label" htmlFor={`select-${boleta.id}`} style={{ fontSize: '0.7rem', cursor: estaPagada ? 'not-allowed' : 'pointer', opacity: estaPagada ? 0.6 : 1 }}>
                                        Seleccionar
                                      </label>
                                    </div>
                                    <div className="form-check d-flex align-items-center gap-1">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={estaPagada}
                                        onChange={() => togglePagadaBoleta(boleta.id)}
                                        id={`paid-${boleta.id}`}
                                        title="Marcar como pagada"
                                      />
                                      <label className="form-check-label" htmlFor={`paid-${boleta.id}`} style={{ fontSize: '0.7rem', cursor: 'pointer' }}>
                                        {estaPagada ? <span className="text-success">✓ Pagada</span> : 'Marcar pagada'}
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Sección inferior: Boletas seleccionadas en detalle */}
            {boletas.filter(b => {
              const estadoLocal = pagosBoletasLocal[b.id] || {};
              const estaPagada = boletasPagadas[b.id] || false;
              return estadoLocal.seleccionada && !estaPagada; // Solo mostrar las seleccionadas que no están pagadas
            }).length > 0 && (
              <div className="card">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">💳 Configurar pagos de boletas seleccionadas</h5>
                </div>
                <div className="card-body">
                  <>
                    {Object.entries(boletasPorProveedor).map(([proveedor, boletasProv]) => {
                      const boletasSeleccionadas = boletasProv.filter(b => {
                        const estadoLocal = pagosBoletasLocal[b.id] || {};
                        const estaPagada = boletasPagadas[b.id] || false;
                        return estadoLocal.seleccionada && !estaPagada; // Solo mostrar las seleccionadas que no están pagadas
                      });
                      if (boletasSeleccionadas.length === 0) return null;
                      
                      return (
                        <div key={proveedor} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">
                            <strong>{proveedor}</strong>
                            <span className="badge bg-secondary ms-2">
                              {boletasSeleccionadas.length} boleta{boletasSeleccionadas.length > 1 ? 's' : ''}
                            </span>
                          </h6>
                        </div>
                        <div className="row">
                          {boletasSeleccionadas.map(boleta => {
                            const pago = pagosBoletasLocal[boleta.id] || {};
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
                                      <div className="fs-4 fw-bold mt-2 text-success">
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
