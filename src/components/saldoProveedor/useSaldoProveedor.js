import { useState, useMemo } from 'react';
import { useClientBalances } from '../../firebase/hooks';
import { parseCurrencyValue } from '../../utils/money';

/**
 * Hook personalizado para manejar saldos a favor de proveedores
 * Busca en "Saldo Clientes" la cuenta más reciente del proveedor
 * y calcula el saldo a favor basado en todos los ingresos menos las boletas
 */
export const useSaldoProveedor = () => {
  const { balances, loading } = useClientBalances();
  
  // Estado para descuentos aplicados por proveedor
  // Formato: { "Tito": 400000, "OtroProveedor": 50000 }
  const [descuentosAplicados, setDescuentosAplicados] = useState({});

  /**
   * Normaliza un nombre para comparación (elimina espacios extra, convierte a minúsculas)
   * @param {string} nombre - Nombre a normalizar
   * @returns {string} - Nombre normalizado
   */
  const normalizarNombre = (nombre) => {
    if (!nombre) return '';
    return nombre
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .normalize('NFD') // Normalizar acentos
      .replace(/[\u0300-\u036f]/g, ''); // Eliminar diacríticos
  };

  /**
   * Obtiene el saldo más reciente de un proveedor
   * Busca la cuenta con la fecha más reciente para ese proveedor
   * @param {string} nombreProveedor - Nombre del proveedor a buscar
   * @returns {object|null} - Objeto con saldo a favor o null si no existe
   */
  const obtenerSaldoMasReciente = useMemo(() => {
    return (nombreProveedor) => {
      if (!balances || !nombreProveedor) return null;

      const nombreProveedorNormalizado = normalizarNombre(nombreProveedor);

      // Filtrar balances del proveedor
      const balancesProveedor = balances
        .filter(balance => {
          const nombreClienteNormalizado = normalizarNombre(balance.clientName);
          return nombreClienteNormalizado === nombreProveedorNormalizado;
        })
        .map(balance => {
          // Calcular totales si no existen en la base de datos
          const totalBoletas = balance.totalBoletas || 
            balance.boletas?.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0) || 0;
          
          const totalVentas = balance.totalVentas || 
            balance.ventas?.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0) || 0;
          
          const totalPlata = balance.totalPlata || 
            balance.plataFavor?.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0) || 0;
          
          const totalEfectivo = balance.totalEfectivo || 
            balance.efectivo?.reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0) || 0;
          
          const totalCheque = balance.totalCheque || 
            balance.cheques?.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0) || 0;
          
          const totalTransferencia = balance.totalTransferencia || 
            balance.transferencias?.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0) || 0;
          
          const totalIngresos = balance.totalIngresos || 
            (totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia);
          
          const finalBalance = balance.finalBalance || 
            (totalIngresos - totalBoletas);

          return {
            id: balance.id,
            fecha: balance.date,
            totalBoletas,
            totalVentas,
            totalPlata,
            totalEfectivo,
            totalCheque,
            totalTransferencia,
            totalIngresos,
            finalBalance, // Si es positivo, está a favor del usuario
            fechaTimestamp: balance.date ? new Date(balance.date).getTime() : 0
          };
        });

      if (balancesProveedor.length === 0) return null;

      // Ordenar por fecha (más reciente primero) y tomar el primero
      const saldoMasReciente = balancesProveedor.sort((a, b) => 
        b.fechaTimestamp - a.fechaTimestamp
      )[0];

      // Solo retornar si hay saldo a favor (finalBalance > 0)
      if (saldoMasReciente.finalBalance > 0) {
        return {
          ...saldoMasReciente,
          saldoAFavor: saldoMasReciente.finalBalance
        };
      }

      return null;
    };
  }, [balances]);

  /**
   * Obtiene el saldo a favor disponible para un proveedor
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {number} - Monto del saldo a favor (0 si no existe)
   */
  const obtenerSaldoAFavor = (nombreProveedor) => {
    const saldo = obtenerSaldoMasReciente(nombreProveedor);
    
    // Debug temporal
    if (nombreProveedor && balances) {
      const nombreNormalizado = normalizarNombre(nombreProveedor);
      const nombresEnBalances = balances.map(b => ({
        original: b.clientName,
        normalizado: normalizarNombre(b.clientName),
        finalBalance: b.finalBalance || (b.totalIngresos || 0) - (b.totalBoletas || 0)
      }));
      
      console.log('🔍 Buscando saldo para proveedor:', nombreProveedor);
      console.log('📋 Nombres normalizados en balances:', nombresEnBalances);
      console.log('💰 Saldo encontrado:', saldo);
    }
    
    return saldo?.saldoAFavor || 0;
  };

  /**
   * Obtiene información completa del saldo más reciente
   * @param {string} nombreProveedor - Nombre del proveedor
   * @returns {object|null} - Información completa del saldo o null
   */
  const obtenerInfoSaldo = (nombreProveedor) => {
    return obtenerSaldoMasReciente(nombreProveedor);
  };

  /**
   * Aplica un descuento para un proveedor
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
    loading,
    
    // Funciones para obtener información
    obtenerSaldoAFavor,
    obtenerInfoSaldo,
    
    // Funciones para manejar descuentos
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
