// Deudores unificados: quién le debe plata al negocio, juntando tres orígenes en una sola lista.
//  - 'mano':    deudaPersonas + deudaMovimientos (Gestión de Deudas)
//  - 'reparto': clientes de Mi Reparto con pago pendiente o parcial
//  - 'saldo':   último saldo de cada cliente en clientBalances, si es a favor del negocio (> 0)
// Es solo lectura: cobrar se hace en el origen y el cuadro se actualiza solo.
import { normalizarNombre } from './nombres';

export const ORIGENES = {
  mano: 'a mano',
  reparto: 'reparto',
  saldo: 'saldo',
};

const aNumero = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
};

const MARGEN = 0.005;

/**
 * @param {object} fuentes  { personas, movimientos, repartos, saldos }
 * @param {Function} buscarExacto  nombre → contacto|null (para unir un mismo contacto)
 * @returns {Array<{ clave, nombre, contactoId, total, partes: [{ origen, monto, detalles }] }>}
 *          ordenado de mayor a menor deuda
 */
export const calcularDeudores = ({ personas = [], movimientos = [], repartos = [], saldos = [] }, buscarExacto) => {
  const mapa = new Map();

  const sumar = (nombre, origen, monto, detalle) => {
    const limpio = String(nombre || '').trim();
    if (!limpio || !(monto > MARGEN)) return;
    const contacto = buscarExacto ? buscarExacto(limpio) : null;
    const clave = contacto ? `c:${contacto.id}` : `n:${normalizarNombre(limpio)}`;
    if (!mapa.has(clave)) {
      mapa.set(clave, { clave, nombre: contacto?.nombre || limpio, contactoId: contacto?.id || null, total: 0, partes: [] });
    }
    const item = mapa.get(clave);
    item.total += monto;
    const parte = item.partes.find((p) => p.origen === origen);
    if (parte) {
      parte.monto += monto;
      if (detalle) parte.detalles.push(detalle);
    } else {
      item.partes.push({ origen, monto, detalles: detalle ? [detalle] : [] });
    }
  };

  // A mano
  personas.forEach((p) => {
    const saldo = movimientos
      .filter((m) => m.personaId === p.id)
      .reduce((t, m) => t + ((m.tipo === 'suma' || m.tipo === 'deuda') ? aNumero(m.monto) : -aNumero(m.monto)), 0);
    sumar(p.nombre, 'mano', saldo);
  });

  // Mi Reparto
  repartos.forEach((r) => {
    (r.clientes || []).forEach((c) => {
      const falta = aNumero(c.billAmount) - aNumero(c.paymentAmount);
      sumar(c.clientName, 'reparto', falta, r.date || null);
    });
  });

  // Saldo: solo el último saldo de cada cliente (los anteriores ya quedaron incluidos)
  const ultimos = new Map();
  saldos.forEach((sd) => {
    const clave = sd.contactoId ? `c:${sd.contactoId}` : `n:${normalizarNombre(sd.clientName)}`;
    const actual = ultimos.get(clave);
    if (!actual || String(sd.date || '') >= String(actual.date || '')) ultimos.set(clave, sd);
  });
  ultimos.forEach((sd) => sumar(sd.clientName, 'saldo', aNumero(sd.finalBalance), sd.date || null));

  return [...mapa.values()].sort((a, b) => b.total - a.total);
};
