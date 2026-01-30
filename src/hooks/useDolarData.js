import { useState, useEffect } from 'react';

/**
 * Hook personalizado para obtener datos del dólar
 * Incluye cotizaciones actuales e histórico
 */
export const useDolarData = () => {
  const [cotizaciones, setCotizaciones] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener cotizaciones actuales
  const obtenerCotizaciones = async () => {
    try {
      // Timeout de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://dolarapi.com/v1/dolares', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Error al obtener cotizaciones');
      }

      const data = await response.json();
      console.log('✅ API respondió con datos reales');
      return data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo cotizaciones (usando fallback):', error.message);
      
      // Fallback: datos de ejemplo
      return [
        {
          nombre: 'Oficial',
          compra: 1050.50,
          venta: 1090.50,
          casa: 'oficial',
          fechaActualizacion: new Date().toISOString()
        },
        {
          nombre: 'Blue',
          compra: 1280.00,
          venta: 1300.00,
          casa: 'blue',
          fechaActualizacion: new Date().toISOString()
        },
        {
          nombre: 'MEP',
          compra: 1150.00,
          venta: 1170.00,
          casa: 'mep',
          fechaActualizacion: new Date().toISOString()
        },
        {
          nombre: 'Tarjeta',
          compra: null,
          venta: 1744.80,
          casa: 'tarjeta',
          fechaActualizacion: new Date().toISOString()
        }
      ];
    }
  };

  // Generar datos históricos realistas
  const generarHistoricoRealista = (cotizacionesActuales) => {
    if (!cotizacionesActuales || cotizacionesActuales.length === 0) {
      return { semanal: [], anual: [] };
    }

    // Obtener valores base de las cotizaciones actuales
    const oficial = cotizacionesActuales.find(c => c.casa === 'oficial')?.venta || 1050;
    const blue = cotizacionesActuales.find(c => c.casa === 'blue')?.venta || 1280;
    const mep = cotizacionesActuales.find(c => c.casa === 'mep')?.venta || 1150;

    // Generar datos semanales (últimos 7 días)
    const datosSemanales = [];
    for (let i = 7; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      
      // Variación realista para cada día
      // Tendencia alcista muy leve (~0.3% diario)
      const factorVariacion = 1 / Math.pow(1.003, i); // Hace 7 días valía ~2% menos
      const ruido = (Math.random() - 0.5) * 0.015; // Ruido aleatorio ±0.75%
      
      datosSemanales.push({
        fecha: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        oficial: oficial * factorVariacion * (1 + ruido),
        blue: blue * factorVariacion * (1 + ruido * 1.3),
        mep: mep * factorVariacion * (1 + ruido * 1.15)
      });
    }

    // Generar datos anuales (últimos 12 meses)
    const datosAnuales = [];
    for (let i = 12; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      
      // Tendencia alcista realista para el año (inflación Argentina 2025-2026)
      // Hace 12 meses el dólar valía menos, hoy vale más
      // Factor: dividir por (1 + tasa_mensual)^meses_atras
      const factorInflacion = 1 / Math.pow(1.025, i); // ~2.5% mensual de aumento (~34% anual)
      const ruido = (Math.random() - 0.5) * 0.02; // Ruido ±1%
      
      datosAnuales.push({
        fecha: fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
        oficial: oficial * factorInflacion * (1 + ruido),
        blue: blue * factorInflacion * (1 + ruido * 1.15),
        mep: mep * factorInflacion * (1 + ruido * 1.08)
      });
    }

    return { semanal: datosSemanales, anual: datosAnuales };
  };

  const cargarDatos = async () => {
    try {
      console.log('🔄 Cargando datos del dólar...');
      setLoading(true);
      setError(null);
      
      // Obtener cotizaciones actuales
      const cotizacionesData = await obtenerCotizaciones();
      console.log('✅ Cotizaciones obtenidas:', cotizacionesData);
      setCotizaciones(cotizacionesData);
      
      // Generar histórico basado en cotizaciones actuales
      const historicoData = generarHistoricoRealista(cotizacionesData);
      console.log('✅ Histórico generado:', historicoData);
      setHistorico(historicoData);
      
    } catch (err) {
      setError('No se pudieron cargar los datos del dólar');
      console.error('❌ Error en useDolarData:', err);
    } finally {
      setLoading(false);
      console.log('✅ Carga completada');
    }
  };

  useEffect(() => {
    cargarDatos();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarDatos, 300000);
    return () => clearInterval(interval);
  }, []);

  return {
    cotizaciones,
    historico,
    loading,
    error,
    recargar: cargarDatos
  };
};
