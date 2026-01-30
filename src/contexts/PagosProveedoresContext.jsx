import React, { createContext, useContext, useMemo } from 'react';
import { useGestionSemanal } from '../firebase/hooks';

/**
 * Context para manejar el estado de Pagos a Proveedores
 * Proporciona una fuente única de verdad para el estado de las boletas pagadas
 * sin duplicar datos - lee directamente de Firebase
 */
const PagosProveedoresContext = createContext();

/**
 * Hook para consumir el contexto
 * Lanza error si se usa fuera del Provider
 */
export const usePagosProveedores = () => {
  const context = useContext(PagosProveedoresContext);
  if (!context) {
    throw new Error('usePagosProveedores debe usarse dentro de PagosProveedoresProvider');
  }
  return context;
};

/**
 * Provider del contexto de Pagos a Proveedores
 * Envuelve los componentes que necesitan acceso al estado de boletas pagadas
 */
export const PagosProveedoresProvider = ({ children }) => {
  // Obtener la semana activa desde Firebase
  const { semanaActiva, loading } = useGestionSemanal('shared');

  /**
   * Obtiene todas las boletas pagadas del estado compartido
   * @returns {Object} - Objeto con boletaId: true/false
   */
  const obtenerBoletasPagadas = useMemo(() => {
    return semanaActiva?.pagosProveedoresEstado?.boletasPagadas || {};
  }, [semanaActiva?.pagosProveedoresEstado?.boletasPagadas]);

  /**
   * Verifica si una boleta específica está marcada como pagada
   * @param {string} boletaId - ID de la boleta (ej: "boleta-0")
   * @returns {boolean} - true si está pagada, false si no
   */
  const estaPagada = (boletaId) => {
    if (!boletaId) return false;
    const pagadas = semanaActiva?.pagosProveedoresEstado?.boletasPagadas || {};
    return pagadas[boletaId] === true;
  };

  /**
   * Obtiene el dinero disponible del estado compartido
   * @returns {Object} - { efectivo, transferencia, cheques }
   */
  const obtenerDineroDisponible = useMemo(() => {
    return semanaActiva?.pagosProveedoresEstado?.dineroDisponible || {
      efectivo: 0,
      transferencia: 0,
      cheques: 0
    };
  }, [semanaActiva?.pagosProveedoresEstado?.dineroDisponible]);

  /**
   * Obtiene todas las boletas de mercadería de la semana activa
   * @returns {Array} - Array de entradas de mercadería
   */
  const obtenerBoletas = useMemo(() => {
    if (!semanaActiva?.mercaderia) return [];
    
    return semanaActiva.mercaderia.map((entrada, index) => {
      const costoTotal = entrada.cortes.reduce((sum, c) => 
        sum + (c.kg * (c.precioKg || 0)), 0
      );
      
      const boletaId = `boleta-${index}`;
      
      return {
        id: boletaId,
        index,
        dia: entrada.dia,
        proveedor: entrada.proveedor,
        costoTotal,
        cortes: entrada.cortes,
        timestamp: entrada.timestamp || new Date().toISOString(),
        estaPagada: estaPagada(boletaId) // Incluir estado de pago
      };
    });
  }, [semanaActiva?.mercaderia, semanaActiva?.pagosProveedoresEstado?.boletasPagadas]);

  /**
   * Obtiene boletas de un proveedor específico
   * @param {string} nombreProveedor - Nombre del proveedor
   * @param {boolean} incluirPagadas - Si incluir o no las boletas pagadas (default: true)
   * @returns {Array} - Array de boletas filtradas por proveedor
   */
  const obtenerBoletasPorProveedor = (nombreProveedor, incluirPagadas = true) => {
    if (!nombreProveedor) return [];
    
    const todasLasBoletas = obtenerBoletas;
    
    return todasLasBoletas.filter(boleta => {
      const coincideProveedor = boleta.proveedor.trim().toLowerCase() === 
                                nombreProveedor.trim().toLowerCase();
      
      if (!incluirPagadas) {
        return coincideProveedor && !boleta.estaPagada;
      }
      
      return coincideProveedor;
    });
  };

  /**
   * Obtiene estadísticas de un proveedor
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {Object} - { totalBoletas, boletasPagadas, boletasPendientes, montoTotal, montoPagado, montoPendiente }
   */
  const obtenerEstadisticasProveedor = (nombreProveedor) => {
    if (!nombreProveedor) {
      return {
        totalBoletas: 0,
        boletasPagadas: 0,
        boletasPendientes: 0,
        montoTotal: 0,
        montoPagado: 0,
        montoPendiente: 0
      };
    }

    const boletasProveedor = obtenerBoletasPorProveedor(nombreProveedor, true);
    
    const stats = {
      totalBoletas: boletasProveedor.length,
      boletasPagadas: 0,
      boletasPendientes: 0,
      montoTotal: 0,
      montoPagado: 0,
      montoPendiente: 0
    };

    boletasProveedor.forEach(boleta => {
      stats.montoTotal += boleta.costoTotal;
      
      if (boleta.estaPagada) {
        stats.boletasPagadas++;
        stats.montoPagado += boleta.costoTotal;
      } else {
        stats.boletasPendientes++;
        stats.montoPendiente += boleta.costoTotal;
      }
    });

    return stats;
  };

  /**
   * Obtiene todos los proveedores únicos de la semana activa
   * @returns {Array} - Array de nombres de proveedores únicos
   */
  const obtenerProveedores = useMemo(() => {
    if (!semanaActiva?.mercaderia) return [];
    
    const proveedoresSet = new Set();
    semanaActiva.mercaderia.forEach(entrada => {
      if (entrada.proveedor) {
        proveedoresSet.add(entrada.proveedor);
      }
    });
    
    return Array.from(proveedoresSet).sort();
  }, [semanaActiva?.mercaderia]);

  /**
   * Obtiene lista de pagos realizados de la semana
   * @returns {Array} - Array de pagos registrados
   */
  const obtenerPagosRealizados = useMemo(() => {
    return semanaActiva?.pagosProveedores || [];
  }, [semanaActiva?.pagosProveedores]);

  /**
   * Obtiene pagos realizados a un proveedor específico
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {Array} - Array de pagos del proveedor
   */
  const obtenerPagosPorProveedor = (nombreProveedor) => {
    if (!nombreProveedor) return [];
    
    const pagos = obtenerPagosRealizados;
    
    return pagos.filter(pago => 
      pago.proveedor?.trim().toLowerCase() === nombreProveedor.trim().toLowerCase()
    );
  };

  // Valor del contexto que se expone
  const contextValue = {
    // Estado
    semanaActiva,
    loading,
    boletasPagadas: obtenerBoletasPagadas,
    dineroDisponible: obtenerDineroDisponible,
    boletas: obtenerBoletas,
    proveedores: obtenerProveedores,
    pagosRealizados: obtenerPagosRealizados,
    
    // Funciones para consultar estado
    estaPagada,
    obtenerBoletasPagadas: () => obtenerBoletasPagadas,
    obtenerDineroDisponible: () => obtenerDineroDisponible,
    obtenerBoletas: () => obtenerBoletas,
    obtenerBoletasPorProveedor,
    obtenerEstadisticasProveedor,
    obtenerProveedores: () => obtenerProveedores,
    obtenerPagosRealizados: () => obtenerPagosRealizados,
    obtenerPagosPorProveedor
  };

  return (
    <PagosProveedoresContext.Provider value={contextValue}>
      {children}
    </PagosProveedoresContext.Provider>
  );
};

export default PagosProveedoresContext;
