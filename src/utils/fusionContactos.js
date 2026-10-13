// Fusión de contactos duplicados (ej. "Carniceria Lopes" y "Carnicería López").
//
// El contacto que se QUEDA (`destino`) absorbe al duplicado (`origen`):
//  - todas las entradas de mercadería (de TODAS las semanas, también las cerradas), pesadas,
//    vínculos de saldo a favor y saldos de clientes pasan a apuntar al destino;
//  - el nombre viejo queda como alias del destino, así si alguien lo vuelve a escribir
//    igual se reconoce como el mismo contacto;
//  - el duplicado se archiva (no se borra) con `fusionadoEn` para poder rastrearlo.
// Orden pensado para que, si se corta a mitad, se pueda volver a correr sin perder datos:
// primero lo aditivo (alias), después las referencias y al final se archiva el duplicado.
import {
  collection, doc, getDocs, query, where, updateDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizarNombre } from './nombres';

const clavesDe = (c) => new Set([c.nombreNormalizado, ...(c.alias || []).map(normalizarNombre)].filter(Boolean));

/**
 * @param {object} origen   contacto duplicado (se archiva)
 * @param {object} destino  contacto que se queda
 * @param {string} nombreFinal nombre con el que queda el destino (bien escrito)
 * @param {Array}  contactos todos los contactos (para validar que el nombre final no choque)
 * @returns {Promise<{ok:boolean, motivo?:string, entradas?:number, pesadas?:number, saldos?:number, vinculaciones?:number}>}
 */
export const fusionarContactos = async (origen, destino, nombreFinal, contactos = []) => {
  if (!origen?.id || !destino?.id) return { ok: false, motivo: 'Faltan contactos' };
  if (origen.id === destino.id) return { ok: false, motivo: 'No se puede fusionar un contacto consigo mismo' };

  const nombre = String(nombreFinal || destino.nombre || '').trim().replace(/\s+/g, ' ');
  if (!nombre) return { ok: false, motivo: 'El nombre es obligatorio' };
  const claveNombre = normalizarNombre(nombre);
  const choque = contactos.find((c) => c.id !== origen.id && c.id !== destino.id
    && (c.nombreNormalizado === claveNombre || (c.alias || []).some((a) => normalizarNombre(a) === claveNombre)));
  if (choque) return { ok: false, motivo: `Ya existe otro contacto llamado "${choque.nombre}"` };

  // Claves por las que el origen podía aparecer en datos viejos (sin id).
  const clavesOrigen = clavesDe(origen);
  const nombresOrigen = new Set([origen.nombre, ...(origen.alias || [])].filter(Boolean));

  // 1) Destino: nombre final + alias (nombres del origen y el nombre anterior del destino) + datos.
  const aliasSet = new Map();
  const sumarAlias = (a) => {
    const k = normalizarNombre(a);
    if (k && k !== claveNombre && !aliasSet.has(k)) aliasSet.set(k, String(a).trim());
  };
  (destino.alias || []).forEach(sumarAlias);
  [origen.nombre, ...(origen.alias || []), destino.nombre].forEach(sumarAlias);

  const cambiosDestino = {
    nombre,
    nombreNormalizado: claveNombre,
    alias: [...aliasSet.values()],
    roles: {
      proveedor: !!(destino.roles?.proveedor || origen.roles?.proveedor),
      cliente: !!(destino.roles?.cliente || origen.roles?.cliente),
    },
    activo: true,
    updatedAt: serverTimestamp(),
  };
  if (!destino.contacto?.telefono && origen.contacto?.telefono) cambiosDestino['contacto.telefono'] = origen.contacto.telefono;
  if (!destino.notas && origen.notas) cambiosDestino.notas = origen.notas;
  await updateDoc(doc(db, 'contactos', destino.id), cambiosDestino);

  const resultado = { ok: true, entradas: 0, pesadas: 0, saldos: 0, vinculaciones: 0 };

  // 2) Semanas (todas): entradas del origen pasan al destino. Una transacción por semana.
  const semanas = await getDocs(collection(db, 'gestion_semanal'));
  for (const s of semanas.docs) {
    const mercaderia = s.data().mercaderia || [];
    const toca = (e) => (e.proveedorId
      ? e.proveedorId === origen.id
      : clavesOrigen.has(normalizarNombre(e.proveedor)));
    if (!mercaderia.some(toca)) continue;
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'gestion_semanal', s.id);
      const fresco = (await tx.get(ref)).data() || {};
      let n = 0;
      const nueva = (fresco.mercaderia || []).map((e) => {
        if (!toca(e)) return e;
        n += 1;
        return {
          ...e,
          proveedor: nombre,
          proveedorId: destino.id,
          proveedorOriginal: e.proveedorOriginal || e.proveedor || origen.nombre,
        };
      });
      if (n > 0) { tx.update(ref, { mercaderia: nueva }); resultado.entradas += n; }
    });
  }

  // 3) Pesadas: por id y por nombre (las viejas pueden no tener id).
  const vistas = new Set();
  const consultas = [
    query(collection(db, 'pesadas'), where('proveedorId', '==', origen.id)),
    ...[...nombresOrigen].map((n) => query(collection(db, 'pesadas'), where('proveedor', '==', n))),
  ];
  for (const q of consultas) {
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      if (vistas.has(d.id)) continue;
      vistas.add(d.id);
      const data = d.data();
      if (data.proveedorId && data.proveedorId !== origen.id) continue;
      await updateDoc(d.ref, { proveedor: nombre, proveedorId: destino.id, updatedAt: serverTimestamp() });
      resultado.pesadas += 1;
    }
  }

  // 4) Vínculos de saldo a favor (guardan el proveedor solo por nombre).
  const vinc = await getDocs(collection(db, 'saldoProveedorVinculaciones'));
  for (const d of vinc.docs) {
    if (!clavesOrigen.has(normalizarNombre(d.data().proveedor))) continue;
    await updateDoc(d.ref, { proveedor: nombre });
    resultado.vinculaciones += 1;
  }

  // 5) Saldos de clientes vinculados al contacto duplicado.
  const saldos = await getDocs(query(collection(db, 'clientBalances'), where('contactoId', '==', origen.id)));
  for (const d of saldos.docs) {
    await updateDoc(d.ref, { contactoId: destino.id });
    resultado.saldos += 1;
  }

  // 6) Por último, el duplicado se archiva (conserva el historial y apunta a quién lo absorbió).
  await updateDoc(doc(db, 'contactos', origen.id), {
    activo: false,
    fusionadoEn: destino.id,
    fusionadoEnNombre: nombre,
    updatedAt: serverTimestamp(),
  });

  return resultado;
};
