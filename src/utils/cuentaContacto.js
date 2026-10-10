// Cuenta de un contacto como proveedor, CALCULADA desde los datos que ya existen:
//  - compras: entradas de mercadería (gestion_semanal[].mercaderia[]) de todas las semanas
//  - pagos:   marca "pagada" por boleta (pagosProveedoresEstado.boletasPagadas)
//  - saldos a favor: saldoProveedorVinculaciones
// No guarda nada: así siempre coincide con lo que muestra Pagos a Proveedores.
import { normalizarNombre } from './nombres';
import { idBoleta } from './boletas';

export const kgDeEntrada = (entrada) =>
  (entrada?.cortes || []).reduce((s, c) => s + (Number(c.kg) || 0), 0);

export const costoDeEntrada = (entrada) =>
  (entrada?.cortes || []).reduce((s, c) => s + (Number(c.kg) || 0) * (Number(c.precioKg) || 0), 0);

/** Código corto para citar una boleta ("#Q9AB3K"). */
export const codigoReferencia = (entradaId) =>
  (entradaId ? `#${String(entradaId).replace(/^ent_/, '').slice(-6).toUpperCase()}` : '—');

/**
 * @param {object} contacto       { id, nombre, nombreNormalizado, alias }
 * @param {Array}  semanas        documentos de gestion_semanal
 * @param {Array}  vinculaciones  documentos de saldoProveedorVinculaciones
 */
export const calcularCuenta = (contacto, semanas = [], vinculaciones = []) => {
  const claves = new Set([contacto.nombreNormalizado, ...(contacto.alias || []).map(normalizarNombre)]);
  const esDelContacto = (entrada) => (entrada.proveedorId
    ? entrada.proveedorId === contacto.id
    : claves.has(normalizarNombre(entrada.proveedor)));

  const compras = [];
  semanas.forEach((semana) => {
    const pagadas = semana.pagosProveedoresEstado?.boletasPagadas || {};
    (semana.mercaderia || []).forEach((entrada, index) => {
      if (!esDelContacto(entrada)) return;
      compras.push({
        semanaId: semana.id,
        semanaInicio: semana.fechaInicio || null,
        semanaCerrada: semana.cerrada === true,
        index,
        entradaId: entrada.id || null,
        dia: entrada.dia,
        proveedor: entrada.proveedor,
        timestamp: entrada.timestamp || null,
        modificadoEn: entrada.modificadoEn || null,
        cortes: entrada.cortes || [],
        kg: kgDeEntrada(entrada),
        costo: costoDeEntrada(entrada),
        pagada: pagadas[idBoleta(entrada, index)] === true,
      });
    });
  });

  compras.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));

  const idsDelContacto = new Set(compras.map((c) => c.entradaId).filter(Boolean));
  const saldosAFavor = vinculaciones
    .filter((v) => claves.has(normalizarNombre(v.proveedor))
      || (v.entradaIds || []).some((id) => idsDelContacto.has(id)))
    .map((v) => ({
      id: v.id,
      monto: Number(v.saldoAFavor) || 0,
      fecha: v.fechaSaldoCliente || v.fechaCreacion?.toDate?.().toISOString() || null,
      semanaId: v.semanaId || null,
      resuelta: !!(v.entradaIds && v.entradaIds.length),
    }))
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));

  const suma = (lista, campo) => lista.reduce((s, c) => s + c[campo], 0);

  // Precios por kg muy fuera de lo normal para este proveedor (más de 8 veces la mediana):
  // casi siempre es un error de tipeo (un cero de más, o el total cargado como precio por kg).
  const preciosPorKg = compras.filter((c) => c.kg > 0 && c.costo > 0).map((c) => c.costo / c.kg).sort((a, b) => a - b);
  const mediana = preciosPorKg.length ? preciosPorKg[Math.floor(preciosPorKg.length / 2)] : 0;
  compras.forEach((c) => {
    c.precioAtipico = mediana > 0 && c.kg > 0 && c.costo / c.kg > mediana * 8;
  });
  const pendientes = compras.filter((c) => !c.pagada);
  const pagadas = compras.filter((c) => c.pagada);
  // Solo la semana en curso es "deuda" confiable: es lo que se paga y marca en Pagos a
  // Proveedores. En semanas cerradas la falta de marca suele ser porque se saldó fuera de la
  // app, por eso se informa aparte como "sin marcar" y no se suma a lo que se debe.
  const pendientesActual = pendientes.filter((c) => !c.semanaCerrada);
  const sinMarcar = pendientes.filter((c) => c.semanaCerrada);

  return {
    compras,
    saldosAFavor,
    totales: {
      entradas: compras.length,
      kg: suma(compras, 'kg'),
      comprado: suma(compras, 'costo'),
      pagado: suma(pagadas, 'costo'),
      pendiente: suma(pendientesActual, 'costo'),
      entradasPendientes: pendientesActual.length,
      sinMarcar: suma(sinMarcar, 'costo'),
      entradasSinMarcar: sinMarcar.length,
      sinPrecio: compras.filter((c) => c.costo === 0).length,
      atipicas: compras.filter((c) => c.precioAtipico).length,
    },
  };
};




// ---------------------------------------------------------------- ventas y saldos
const aNumero = (v) => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
};

const clavesDe = (contacto) =>
  new Set([contacto.nombreNormalizado, ...(contacto.alias || []).map(normalizarNombre)]);

/**
 * Lo que se le vendió a un contacto (ventas dentro de sus saldos) y sus saldos.
 * Hoy una venta es solo monto por fecha: no hay detalle de cortes ni kg.
 */
export const calcularVentasYSaldos = (contacto, saldos = []) => {
  const claves = clavesDe(contacto);
  const propios = saldos.filter((sd) => (sd.contactoId
    ? sd.contactoId === contacto.id
    : claves.has(normalizarNombre(sd.clientName))));

  const lista = propios.map((sd) => ({
    id: sd.id,
    fecha: sd.date || null,
    saldoFinal: aNumero(sd.finalBalance),
    totalVentas: aNumero(sd.totalVentas),
    totalBoletas: aNumero(sd.totalBoletas),
    ventas: (sd.ventas || []).map((v) => ({ fecha: v.date || null, monto: aNumero(v.amount) })),
  })).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));

  return {
    saldos: lista,
    totalVendido: lista.reduce((t, sd) => t + sd.totalVentas, 0),
    cantidadSaldos: lista.length,
    conVentas: lista.filter((sd) => sd.totalVentas > 0).length,
  };
};

/** Otras apariciones del contacto por nombre: facturas, deudas personales y cheques. */
export const buscarReferencias = (contacto, { facturas = [], personas = [], movimientos = [], cheques = [] } = {}) => {
  const claves = clavesDe(contacto);
  const coincide = (n) => claves.has(normalizarNombre(n));

  const facturasDe = facturas.filter((f) => coincide(f.clienteNombre));
  const personaIds = new Set(personas.filter((p) => coincide(p.nombre)).map((p) => p.id));
  const movs = movimientos.filter((m) => personaIds.has(m.personaId));
  const saldoDeuda = movs.reduce(
    (t, m) => t + ((m.tipo === 'suma' || m.tipo === 'deuda') ? aNumero(m.monto) : -aNumero(m.monto)), 0
  );
  const chequesDe = cheques.filter((c) => coincide(c.librador) || coincide(c.endosadoA));

  return {
    facturas: facturasDe.length,
    totalFacturado: facturasDe.reduce((t, f) => t + aNumero(f.subtotal ?? f.total), 0),
    deuda: personaIds.size ? { movimientos: movs.length, saldo: saldoDeuda } : null,
    cheques: chequesDe.length,
  };
};

/** Nombres que aparecen en saldos pero no corresponden a ningún contacto (ni alias). */
export const nombresSinContacto = (contactos = [], saldos = []) => {
  const conocidos = new Set();
  contactos.forEach((c) => clavesDe(c).forEach((k) => conocidos.add(k)));
  const mapa = new Map();
  saldos.forEach((sd) => {
    if (sd.contactoId) return;
    const clave = normalizarNombre(sd.clientName);
    if (!clave || conocidos.has(clave)) return;
    if (!mapa.has(clave)) mapa.set(clave, { clave, nombre: String(sd.clientName).trim(), saldos: 0, ventas: 0 });
    const it = mapa.get(clave);
    it.saldos += 1;
    it.ventas += aNumero(sd.totalVentas);
  });
  return [...mapa.values()].sort((a, b) => b.saldos - a.saldos);
};

