import { useCallback, useRef, useState } from 'react';

// Base baja a propósito: PrintDocument (usado adentro de una ventana) es un modal
// compartido con toda la app y usa zIndex fijo 1050/1051. Mientras las ventanas de
// factura se muevan en un rango bajo ese valor, el modal de impresión siempre queda
// arriba sin tener que tocar PrintDocument.jsx.
const Z_BASE = 900;

export default function useFacturaWindows() {
  const [ventanas, setVentanas] = useState([]);
  const zRef = useRef(Z_BASE);

  const siguienteZ = () => {
    zRef.current += 1;
    return zRef.current;
  };

  // Si la factura ya tiene una ventana abierta, la enfoca/restaura en vez de duplicarla.
  const abrirVentana = useCallback((facturaId = null) => {
    setVentanas(prev => {
      if (facturaId) {
        const existente = prev.find(v => v.facturaId === facturaId);
        if (existente) {
          const z = siguienteZ();
          return prev.map(v => v.key === existente.key ? { ...v, minimized: false, zIndex: z } : v);
        }
      }
      const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const z = siguienteZ();
      return [...prev, { key, facturaId, vista: facturaId ? 'ver' : 'form', minimized: false, zIndex: z }];
    });
  }, []);

  const cerrarVentana = useCallback((key) => {
    setVentanas(prev => prev.filter(v => v.key !== key));
  }, []);

  const minimizarVentana = useCallback((key) => {
    setVentanas(prev => prev.map(v => v.key === key ? { ...v, minimized: true } : v));
  }, []);

  const restaurarVentana = useCallback((key) => {
    const z = siguienteZ();
    setVentanas(prev => prev.map(v => v.key === key ? { ...v, minimized: false, zIndex: z } : v));
  }, []);

  const enfocarVentana = useCallback((key) => {
    const z = siguienteZ();
    setVentanas(prev => prev.map(v => v.key === key ? { ...v, zIndex: z } : v));
  }, []);

  const actualizarVentana = useCallback((key, cambios) => {
    setVentanas(prev => prev.map(v => v.key === key ? { ...v, ...cambios } : v));
  }, []);

  return {
    ventanas,
    abrirVentana,
    cerrarVentana,
    minimizarVentana,
    restaurarVentana,
    enfocarVentana,
    actualizarVentana,
  };
}
