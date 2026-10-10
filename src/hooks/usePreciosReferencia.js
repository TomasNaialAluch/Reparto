// Precio por kg "habitual" de cada corte, calculado del historial de compras.
// Sirve para detectar errores de tipeo en el precio (un cero de más, o el número del
// campo vecino pegado dentro de "$/Kg").
//
// Referencia = mediana (no se deja arrastrar por los propios errores):
//   1) del proveedor para ese corte, si tiene al menos 3 compras con precio;
//   2) de todos los proveedores para ese corte, si hay al menos 5.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizarNombre } from '../utils/nombres';

/** Un precio más de este múltiplo de la referencia se considera sospechoso. */
export const FACTOR_PRECIO_ATIPICO = 3;

const mediana = (valores) => {
  const orden = [...valores].sort((a, b) => a - b);
  return orden[Math.floor(orden.length / 2)];
};

export const usePreciosReferencia = () => {
  const [semanas, setSemanas] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gestion_semanal'), (snap) => {
      setSemanas(snap.docs.map((d) => d.data()));
    }, () => {});
    return () => unsub();
  }, []);

  const tablas = useMemo(() => {
    const porProveedorCorte = {};
    const porCorte = {};
    semanas.forEach((s) => (s.mercaderia || []).forEach((e) => {
      const claves = [];
      if (e.proveedorId) claves.push(`id:${e.proveedorId}`);
      claves.push(`n:${normalizarNombre(e.proveedor)}`);
      (e.cortes || []).forEach((c) => {
        const precio = Number(c.precioKg);
        if (!(precio > 0)) return;
        const corte = normalizarNombre(c.corte);
        (porCorte[corte] = porCorte[corte] || []).push(precio);
        claves.forEach((k) => {
          const clave = `${k}|${corte}`;
          (porProveedorCorte[clave] = porProveedorCorte[clave] || []).push(precio);
        });
      });
    }));
    const resultado = { proveedorCorte: {}, corte: {}, usoProveedor: {}, usoGlobal: {} };
    Object.entries(porProveedorCorte).forEach(([k, v]) => { if (v.length >= 3) resultado.proveedorCorte[k] = mediana(v); });
    Object.entries(porCorte).forEach(([k, v]) => { if (v.length >= 5) resultado.corte[k] = mediana(v); });

    // Cuántas veces se compró cada corte (con o sin precio): global y por proveedor.
    semanas.forEach((s) => (s.mercaderia || []).forEach((e) => {
      const claves = [];
      if (e.proveedorId) claves.push(`id:${e.proveedorId}`);
      claves.push(`n:${normalizarNombre(e.proveedor)}`);
      (e.cortes || []).forEach((c) => {
        const corte = normalizarNombre(c.corte);
        if (!corte) return;
        resultado.usoGlobal[corte] = (resultado.usoGlobal[corte] || 0) + 1;
        claves.forEach((k) => {
          const uso = (resultado.usoProveedor[k] = resultado.usoProveedor[k] || {});
          uso[corte] = (uso[corte] || 0) + 1;
        });
      });
    }));
    return resultado;
  }, [semanas]);

  /** { corteNormalizado: veces } para ese proveedor, o null si nunca se le compró nada. */
  const usoCortesDe = useCallback((proveedorId, proveedorNombre) => {
    const porId = proveedorId ? tablas.usoProveedor[`id:${proveedorId}`] : null;
    const porNombre = tablas.usoProveedor[`n:${normalizarNombre(proveedorNombre)}`];
    if (!porId && !porNombre) return null;
    const unido = { ...(porNombre || {}) };
    Object.entries(porId || {}).forEach(([k, v]) => { unido[k] = Math.max(unido[k] || 0, v); });
    return unido;
  }, [tablas]);

  /** Precio habitual del corte para ese proveedor (o null si no hay datos suficientes). */
  const referenciaPara = useCallback((proveedorId, proveedorNombre, corte) => {
    const c = normalizarNombre(corte);
    if (!c) return null;
    if (proveedorId && tablas.proveedorCorte[`id:${proveedorId}|${c}`]) return tablas.proveedorCorte[`id:${proveedorId}|${c}`];
    const porNombre = tablas.proveedorCorte[`n:${normalizarNombre(proveedorNombre)}|${c}`];
    if (porNombre) return porNombre;
    return tablas.corte[c] || null;
  }, [tablas]);

  return { referenciaPara, usoCortesDe, usoGlobalCortes: tablas.usoGlobal };
};

