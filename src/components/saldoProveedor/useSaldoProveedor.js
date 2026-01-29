import { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { parseCurrencyValue } from '../../utils/money';

/**
 * Hook personalizado para manejar saldos a favor de proveedores
 * 
 * NUEVA LÓGICA:
 * - Las vinculaciones se guardan SOLO cuando se crea/guarda un saldo cliente con boletas vinculadas
 * - El descuento solo aplica si las boletas seleccionadas en Pagos a Proveedores están vinculadas en Saldo Clientes
 * - No se arrastran valores de semanas anteriores o ya pagados
 */
export const useSaldoProveedor = () => {
  // Estado para descuentos aplicados por proveedor (solo en memoria, no se guarda)
  // Formato: { "Tito": 400000, "OtroProveedor": 50000 }
  const [descuentosAplicados, setDescuentosAplicados] = useState({});
  
  // Estado para vinculaciones cargadas desde Firebase
  const [vinculaciones, setVinculaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios en tiempo real de las vinculaciones
  useEffect(() => {
    const collectionRef = collection(db, 'saldoProveedorVinculaciones');
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const vinculacionesData = [];
        snapshot.forEach((doc) => {
          vinculacionesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setVinculaciones(vinculacionesData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error al cargar vinculaciones:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Guarda una vinculación cuando se crea/guarda un saldo cliente con boletas vinculadas
   * Se llama desde SaldoClientes.jsx cuando se guarda un saldo cliente
   * 
   * @param {object} datos - Datos del saldo cliente guardado
   * @param {string} datos.saldoClienteId - ID del documento de saldo cliente en Firebase
   * @param {string} datos.proveedor - Nombre del proveedor/cliente
   * @param {array} datos.boletasVinculadas - Array de boletas con mercaderiaIndex
   * @param {number} datos.saldoAFavor - Saldo a favor calculado (finalBalance si es positivo)
   * @param {object} datos.detalleSaldo - Detalle completo del saldo (ventas, plata, efectivo, etc.)
   * @returns {Promise<string>} - ID del documento de vinculación creado
   */
  const guardarVinculacionSaldoCliente = async (datos) => {
    try {
      // Extraer solo las boletas que tienen mercaderiaIndex (vinculadas de mercadería)
      const boletasConMercaderia = (datos.boletasVinculadas || []).filter(
        boleta => boleta.mercaderiaIndex !== undefined && boleta.esDeMercaderia === true
      );

      // Si no hay boletas vinculadas de mercadería, no guardar vinculación
      if (boletasConMercaderia.length === 0) {
        console.log('ℹ️ No hay boletas vinculadas de mercadería, no se guarda vinculación');
        return null;
      }

      // Si el saldo a favor no es positivo, no guardar vinculación
      if (!datos.saldoAFavor || datos.saldoAFavor <= 0) {
        console.log('ℹ️ No hay saldo a favor positivo, no se guarda vinculación');
        return null;
      }

      // Extraer los índices de mercadería de las boletas vinculadas
      const indicesMercaderia = boletasConMercaderia.map(b => b.mercaderiaIndex);

      // Crear documento de vinculación
      const vinculacionData = {
        saldoClienteId: datos.saldoClienteId,
        proveedor: datos.proveedor,
        boletasVinculadas: indicesMercaderia, // Array de índices de mercadería
        saldoAFavor: datos.saldoAFavor,
        detalleSaldo: {
          totalVentas: datos.detalleSaldo?.totalVentas || 0,
          totalPlata: datos.detalleSaldo?.totalPlata || 0,
          totalEfectivo: datos.detalleSaldo?.totalEfectivo || 0,
          totalCheque: datos.detalleSaldo?.totalCheque || 0,
          totalTransferencia: datos.detalleSaldo?.totalTransferencia || 0,
          totalIngresos: datos.detalleSaldo?.totalIngresos || 0,
          totalBoletas: datos.detalleSaldo?.totalBoletas || 0
        },
        fechaCreacion: serverTimestamp(),
        fechaSaldoCliente: datos.fechaSaldoCliente || new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'saldoProveedorVinculaciones'), vinculacionData);
      console.log('✅ Vinculación guardada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al guardar vinculación:', error);
      throw error;
    }
  };

  /**
   * Obtiene el saldo a favor disponible para un proveedor basado en las boletas seleccionadas
   * Solo retorna saldo si las boletas seleccionadas están vinculadas en algún saldo cliente
   * 
   * @param {string} nombreProveedor - Nombre del proveedor
   * @param {array} boletasSeleccionadas - Array de objetos boleta con { index, id, ... }
   * @returns {number} - Monto del saldo a favor disponible (0 si no hay vinculación)
   */
  const obtenerSaldoAFavorPorBoletas = (nombreProveedor, boletasSeleccionadas = []) => {
    if (!nombreProveedor || !boletasSeleccionadas || boletasSeleccionadas.length === 0) {
      return 0;
    }

    // Obtener los índices de las boletas seleccionadas
    const indicesSeleccionados = boletasSeleccionadas.map(b => b.index).filter(idx => idx !== undefined);

    if (indicesSeleccionados.length === 0) {
      return 0;
    }

    // Buscar vinculaciones que:
    // 1. Coincidan con el proveedor
    // 2. Tengan al menos una boleta vinculada que esté en las seleccionadas
    const vinculacionesRelevantes = vinculaciones.filter(vinculacion => {
      // Comparar nombres (normalizados para evitar problemas de mayúsculas/espacios)
      const nombreVinculacion = (vinculacion.proveedor || '').trim().toLowerCase();
      const nombreProveedorNormalizado = (nombreProveedor || '').trim().toLowerCase();
      
      if (nombreVinculacion !== nombreProveedorNormalizado) {
        return false;
      }

      // Verificar si alguna boleta vinculada está en las seleccionadas
      const boletasVinculadas = vinculacion.boletasVinculadas || [];
      const hayInterseccion = boletasVinculadas.some(idxVinculado => 
        indicesSeleccionados.includes(idxVinculado)
      );

      return hayInterseccion;
    });

    if (vinculacionesRelevantes.length === 0) {
      return 0;
    }

    // Si hay múltiples vinculaciones, tomar la más reciente
    // Ordenar por fechaCreacion (más reciente primero)
    vinculacionesRelevantes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaSaldoCliente || 0);
      const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaSaldoCliente || 0);
      return fechaB - fechaA;
    });

    // Retornar el saldo a favor de la vinculación más reciente
    const vinculacionMasReciente = vinculacionesRelevantes[0];
    return vinculacionMasReciente.saldoAFavor || 0;
  };

  /**
   * Obtiene el saldo a favor disponible para un proveedor (versión simplificada para compatibilidad)
   * Esta función se usa cuando no se tienen las boletas seleccionadas aún
   * 
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {number} - Monto del saldo a favor disponible (0 si no hay vinculación)
   */
  const obtenerSaldoAFavor = (nombreProveedor) => {
    if (!nombreProveedor) return 0;

    // Buscar vinculaciones del proveedor
    const vinculacionesProveedor = vinculaciones.filter(vinculacion => {
      const nombreVinculacion = (vinculacion.proveedor || '').trim().toLowerCase();
      const nombreProveedorNormalizado = (nombreProveedor || '').trim().toLowerCase();
      return nombreVinculacion === nombreProveedorNormalizado;
    });

    if (vinculacionesProveedor.length === 0) {
      return 0;
    }

    // Retornar el saldo de la vinculación más reciente
    vinculacionesProveedor.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaSaldoCliente || 0);
      const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaSaldoCliente || 0);
      return fechaB - fechaA;
    });

    return vinculacionesProveedor[0]?.saldoAFavor || 0;
  };

  /**
   * Obtiene información completa de la vinculación más reciente para un proveedor
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {object|null} - Información completa de la vinculación o null
   */
  const obtenerInfoSaldo = (nombreProveedor) => {
    if (!nombreProveedor) return null;

    const vinculacionesProveedor = vinculaciones.filter(vinculacion => {
      const nombreVinculacion = (vinculacion.proveedor || '').trim().toLowerCase();
      const nombreProveedorNormalizado = (nombreProveedor || '').trim().toLowerCase();
      return nombreVinculacion === nombreProveedorNormalizado;
    });

    if (vinculacionesProveedor.length === 0) {
      return null;
    }

    vinculacionesProveedor.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaSaldoCliente || 0);
      const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaSaldoCliente || 0);
      return fechaB - fechaA;
    });

    return vinculacionesProveedor[0];
  };

  /**
   * Aplica un descuento para un proveedor (solo en memoria)
   * @param {string} nombreProveedor - Nombre del proveedor
   * @param {number} monto - Monto del descuento a aplicar
   */
  const aplicarDescuento = (nombreProveedor, monto) => {
    setDescuentosAplicados(prev => ({
      ...prev,
      [nombreProveedor]: monto
    }));
  };

  /**
   * Quita el descuento aplicado para un proveedor
   * @param {string} nombreProveedor - Nombre del proveedor
   */
  const quitarDescuento = (nombreProveedor) => {
    setDescuentosAplicados(prev => {
      const nuevos = { ...prev };
      delete nuevos[nombreProveedor];
      return nuevos;
    });
  };

  /**
   * Obtiene el descuento aplicado para un proveedor
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {number} - Monto del descuento aplicado (0 si no hay)
   */
  const obtenerDescuentoAplicado = (nombreProveedor) => {
    return descuentosAplicados[nombreProveedor] || 0;
  };

  /**
   * Verifica si hay un descuento aplicado para un proveedor
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {boolean} - true si hay descuento aplicado
   */
  const tieneDescuentoAplicado = (nombreProveedor) => {
    return !!descuentosAplicados[nombreProveedor];
  };

  /**
   * Calcula el total con descuentos aplicados
   * @param {number} totalBoletas - Total de boletas seleccionadas
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {object} - Objeto con total original, descuento y total final
   */
  const calcularTotalConDescuento = (totalBoletas, nombreProveedor) => {
    const descuento = obtenerDescuentoAplicado(nombreProveedor);
    const totalFinal = Math.max(0, totalBoletas - descuento);
    
    return {
      totalOriginal: totalBoletas,
      descuento,
      totalFinal
    };
  };

  /**
   * Calcula el total general con todos los descuentos aplicados
   * @param {object} totalesPorProveedor - Objeto con totales por proveedor { "Tito": 4807930, ... }
   * @returns {object} - Objeto con total original, total descuentos y total final
   */
  const calcularTotalGeneralConDescuentos = (totalesPorProveedor) => {
    let totalOriginal = 0;
    let totalDescuentos = 0;

    Object.entries(totalesPorProveedor).forEach(([proveedor, total]) => {
      totalOriginal += total;
      totalDescuentos += obtenerDescuentoAplicado(proveedor);
    });

    const totalFinal = Math.max(0, totalOriginal - totalDescuentos);

    return {
      totalOriginal,
      totalDescuentos,
      totalFinal
    };
  };

  /**
   * Limpia todos los descuentos aplicados
   */
  const limpiarTodosLosDescuentos = () => {
    setDescuentosAplicados({});
  };

  return {
    // Estado
    descuentosAplicados,
    vinculaciones,
    loading,
    
    // Funciones para guardar vinculaciones (llamar desde Saldo Clientes)
    guardarVinculacionSaldoCliente,
    
    // Funciones para obtener información
    obtenerSaldoAFavor,
    obtenerSaldoAFavorPorBoletas, // Nueva función principal
    obtenerInfoSaldo,
    
    // Funciones para manejar descuentos (solo en memoria)
    aplicarDescuento,
    quitarDescuento,
    obtenerDescuentoAplicado,
    tieneDescuentoAplicado,
    
    // Funciones de cálculo
    calcularTotalConDescuento,
    calcularTotalGeneralConDescuentos,
    
    // Utilidades
    limpiarTodosLosDescuentos
  };
};
