import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  updateDoc, orderBy, query, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLocalDateString } from '../utils/date';

const COLLECTION = 'libroCheques';
const MAX_BULK_CHEQUES = 2000;

const emptyForm = (numero = '') => ({
  numeroInterno: numero,
  fechaEntrada: getLocalDateString(),
  librador: '',
  banco: '',
  nroCheque: '',
  fechaCheque: '',
  importe: '',
  fechaSalida: '',
  endosadoA: '',
});

const emptyBulkShared = () => ({
  fechaEntrada: getLocalDateString(),
  librador: '',
  banco: '',
  fechaCheque: '',
  importe: '',
  fechaSalida: '',
  endosadoA: '',
});

/** Rango numérico consecutivo; respeta ceros a la izquierda según el primer valor. */
function expandConsecutiveNumbers(firstStr, countRaw) {
  const t = String(firstStr || '').trim();
  const count = Math.min(
    MAX_BULK_CHEQUES,
    Math.max(1, parseInt(String(countRaw), 10) || 0)
  );
  if (!t) return { items: [], error: 'Ingresá el primer N° de cheque.' };
  if (!/^\d+$/.test(t)) {
    return {
      items: [],
      error: 'En modo rango el primer N° debe ser solo dígitos. Para otros formatos usá "Lista".',
    };
  }
  const width = t.length;
  const start = parseInt(t, 10);
  if (Number.isNaN(start)) return { items: [], error: '~N° inválido.' };
  const items = [];
  for (let i = 0; i < count; i++) {
    const v = start + i;
    const padded = String(v).padStart(width, '0');
    items.push(padded.length > width ? String(v) : padded);
  }
  return { items, error: null };
}

function parseListaNumeros(text) {
  const parts = String(text || '')
    .split(/\r?\n|[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const n of parts) {
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.slice(0, MAX_BULK_CHEQUES);
}

const formatImporte = (val) => {
  if (!val && val !== 0) return '';
  const num = parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(num);
};

const parseImporte = (val) => {
  if (!val) return 0;
  return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
};

const LibroCheques = () => {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkShared, setBulkShared] = useState(emptyBulkShared);
  const [bulkModoNumeros, setBulkModoNumeros] = useState('rango');
  const [bulkPrimerNro, setBulkPrimerNro] = useState('');
  const [bulkCantidad, setBulkCantidad] = useState('10');
  const [bulkListaTexto, setBulkListaTexto] = useState('');
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');
  const [filtroEndosado, setFiltroEndosado] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('numero', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCheques(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const siguienteNumero = () => {
    if (cheques.length === 0) return 1;
    return Math.max(...cheques.map(c => c.numero || 0)) + 1;
  };

  const previewBulkNumeros = useMemo(() => {
    if (bulkModoNumeros === 'rango') {
      return expandConsecutiveNumbers(bulkPrimerNro, bulkCantidad);
    }
    const items = parseListaNumeros(bulkListaTexto);
    if (items.length === 0) return { items: [], error: 'Ingresá al menos un N° de cheque (línea, coma o punto y coma).' };
    return { items, error: null };
  }, [bulkModoNumeros, bulkPrimerNro, bulkCantidad, bulkListaTexto]);

  const guardar = async () => {
    if (!form.librador.trim() && !form.nroCheque.trim()) return;
    setGuardando(true);
    try {
      const datos = {
        ...form,
        importe: parseImporte(form.importe),
        updatedAt: serverTimestamp(),
      };
      if (editId) {
        await updateDoc(doc(db, COLLECTION, editId), {
          ...datos,
          numero: parseInt(form.numeroInterno) || 0,
        });
        setEditId(null);
      } else {
        const siguiente = siguienteNumero();
        await addDoc(collection(db, COLLECTION), {
          ...datos,
          numero: parseInt(form.numeroInterno) || siguiente,
          createdAt: serverTimestamp(),
        });
      }
      setForm(emptyForm());
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
    setGuardando(false);
  };

  const guardarMasivo = async () => {
    const { items: numeros, error: prevError } = previewBulkNumeros;
    if (prevError || numeros.length === 0) return;
    if (!bulkShared.librador.trim() && !bulkShared.banco.trim()) {
      window.alert('Completá al menos Librador o Banco (datos comunes del lote).');
      return;
    }
    if (!window.confirm(`¿Registrar ${numeros.length} cheques en el libro?`)) return;

    setGuardando(true);
    try {
      const importeVal = parseImporte(bulkShared.importe);
      const baseFields = {
        fechaEntrada: bulkShared.fechaEntrada,
        librador: bulkShared.librador,
        banco: bulkShared.banco,
        fechaCheque: bulkShared.fechaCheque || '',
        importe: importeVal,
        fechaSalida: bulkShared.fechaSalida || '',
        endosadoA: bulkShared.endosadoA || '',
        updatedAt: serverTimestamp(),
      };

      let nextInternal = siguienteNumero();
      const batchSize = 450;
      let batch = writeBatch(db);
      let ops = 0;

      for (const nroCheque of numeros) {
        const ref = doc(collection(db, COLLECTION));
        batch.set(ref, {
          ...baseFields,
          numeroInterno: String(nextInternal),
          nroCheque,
          numero: nextInternal,
          createdAt: serverTimestamp(),
        });
        nextInternal += 1;
        ops += 1;
        if (ops >= batchSize) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();

      setShowBulkForm(false);
      setBulkShared(emptyBulkShared());
      setBulkPrimerNro('');
      setBulkCantidad('10');
      setBulkListaTexto('');
      setBulkModoNumeros('rango');
      window.alert(`Se guardaron ${numeros.length} cheques.`);
    } catch (e) {
      console.error(e);
      window.alert('No se pudo guardar el lote. Revisá la consola o la conexión.');
    }
    setGuardando(false);
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este cheque?')) return;
    await deleteDoc(doc(db, COLLECTION, id));
  };

  const editar = (cheque) => {
    setForm({
      numeroInterno: cheque.numero ? String(cheque.numero) : '',
      fechaEntrada: cheque.fechaEntrada || '',
      librador: cheque.librador || '',
      banco: cheque.banco || '',
      nroCheque: cheque.nroCheque || '',
      fechaCheque: cheque.fechaCheque || '',
      importe: cheque.importe ? String(cheque.importe) : '',
      fechaSalida: cheque.fechaSalida || '',
      endosadoA: cheque.endosadoA || '',
    });
    setEditId(cheque.id);
    setShowBulkForm(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
  };

  const cancelarBulk = () => {
    setShowBulkForm(false);
    setBulkShared(emptyBulkShared());
    setBulkPrimerNro('');
    setBulkCantidad('10');
    setBulkListaTexto('');
    setBulkModoNumeros('rango');
  };

  const fb = (campo) => (e) => setBulkShared((p) => ({ ...p, [campo]: e.target.value }));

  // Opciones únicas para filtros
  const bancos = [...new Set(cheques.map(c => c.banco).filter(Boolean))].sort();
  const endosados = [...new Set(cheques.map(c => c.endosadoA).filter(Boolean))].sort();

  // Filtrar
  const chequesFiltrados = cheques.filter(c => {
    const texto = busqueda.toLowerCase();
    const matchBusqueda = !texto ||
      (c.librador || '').toLowerCase().includes(texto) ||
      (c.banco || '').toLowerCase().includes(texto) ||
      (c.nroCheque || '').toString().includes(texto) ||
      (c.endosadoA || '').toLowerCase().includes(texto);
    const matchBanco = !filtroBanco || c.banco === filtroBanco;
    const matchEndosado = !filtroEndosado || c.endosadoA === filtroEndosado;
    return matchBusqueda && matchBanco && matchEndosado;
  });

  const totalImporte = chequesFiltrados.reduce((s, c) => s + (c.importe || 0), 0);

  const f = (campo) => (e) => setForm(p => ({ ...p, [campo]: e.target.value }));

  return (
    <div className="container-fluid mt-3 px-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="mb-0">📒 Libro de Cheques</h2>
          <small className="text-muted">{cheques.length} cheques registrados</small>
        </div>
        {!showForm && !showBulkForm && (
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowBulkForm(false);
                setForm(emptyForm(String(siguienteNumero())));
                setShowForm(true);
              }}
            >
              + Nuevo Cheque
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => {
                cancelar();
                setBulkShared(emptyBulkShared());
                setBulkPrimerNro('');
                setBulkCantidad('10');
                setBulkListaTexto('');
                setBulkModoNumeros('rango');
                setShowBulkForm(true);
              }}
            >
              📋 Carga masiva
            </button>
          </div>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card mb-4 border-primary">
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0">{editId ? `✏️ Editando cheque` : `+ Nuevo Cheque (N° ${siguienteNumero()})`}</h6>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-4 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}># Interno</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Auto"
                  value={form.numeroInterno}
                  onChange={f('numeroInterno')}
                  min="1"
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Fecha Entrada</label>
                <input type="date" className="form-control form-control-sm" value={form.fechaEntrada} onChange={f('fechaEntrada')} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Librador / Endosante</label>
                <input type="text" className="form-control form-control-sm" placeholder="Ej: Roque" value={form.librador} onChange={f('librador')} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Banco</label>
                <input type="text" className="form-control form-control-sm" placeholder="Ej: Galicia" value={form.banco} onChange={f('banco')} />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>N° Cheque</label>
                <input type="text" className="form-control form-control-sm" placeholder="Ej: 9579" value={form.nroCheque} onChange={f('nroCheque')} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Fecha de Cheque</label>
                <input type="date" className="form-control form-control-sm" value={form.fechaCheque} onChange={f('fechaCheque')} />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Importe</label>
                <input type="number" className="form-control form-control-sm" placeholder="0" value={form.importe} onChange={f('importe')} min="0" step="0.01" />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Fecha Salida</label>
                <input type="date" className="form-control form-control-sm" value={form.fechaSalida} onChange={f('fechaSalida')} />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Endosado a</label>
                <input type="text" className="form-control form-control-sm" placeholder="Ej: Tito" value={form.endosadoA} onChange={f('endosadoA')} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-success btn-sm"
                onClick={guardar}
                disabled={guardando || (!form.librador.trim() && !form.nroCheque.trim())}
              >
                {guardando ? 'Guardando...' : editId ? '✓ Actualizar' : '✓ Guardar'}
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={cancelar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Carga masiva — mismo lote: fecha entrada, librador, banco, importe/fechas compartidas */}
      {showBulkForm && !editId && (
        <div className="card mb-4 border-success">
          <div className="card-header bg-success text-white">
            <h6 className="mb-0">📋 Carga masiva de cheques</h6>
          </div>
          <div className="card-body">
            <p className="small text-muted mb-3">
              Completá los datos que comparten todos los cheques. Después indicá los N° con un rango consecutivo o una lista (uno por línea; también podés separar con coma).
            </p>
            <div className="row g-2 mb-3">
              <div className="col-6 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Fecha entrada</label>
                <input type="date" className="form-control form-control-sm" value={bulkShared.fechaEntrada} onChange={fb('fechaEntrada')} />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Librador / Endosante</label>
                <input type="text" className="form-control form-control-sm" placeholder="Ej: Roque" value={bulkShared.librador} onChange={fb('librador')} />
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Banco</label>
                <input type="text" className="form-control form-control-sm" placeholder="Ej: Galicia" value={bulkShared.banco} onChange={fb('banco')} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Fecha de cheque</label>
                <input type="date" className="form-control form-control-sm" value={bulkShared.fechaCheque} onChange={fb('fechaCheque')} />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Importe</label>
                <input type="number" className="form-control form-control-sm" placeholder="0" value={bulkShared.importe} onChange={fb('importe')} min="0" step="0.01" />
              </div>
              <div className="col-6 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Fecha salida</label>
                <input type="date" className="form-control form-control-sm" value={bulkShared.fechaSalida} onChange={fb('fechaSalida')} />
              </div>
              <div className="col-12 col-md-1">
                <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Endosado a</label>
                <input type="text" className="form-control form-control-sm" value={bulkShared.endosadoA} onChange={fb('endosadoA')} />
              </div>
            </div>

            <div className="btn-group btn-group-sm mb-3" role="group">
              <button
                type="button"
                className={`btn ${bulkModoNumeros === 'rango' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setBulkModoNumeros('rango')}
              >
                Rango consecutivo
              </button>
              <button
                type="button"
                className={`btn ${bulkModoNumeros === 'lista' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setBulkModoNumeros('lista')}
              >
                Lista de números
              </button>
            </div>

            {bulkModoNumeros === 'rango' ? (
              <div className="row g-2 mb-3">
                <div className="col-6 col-md-3">
                  <label className="form-label fw-bold small">Primer N° cheque (solo dígitos)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ej: 00012345"
                    value={bulkPrimerNro}
                    onChange={(e) => setBulkPrimerNro(e.target.value)}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label fw-bold small">Cantidad</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="1"
                    max={MAX_BULK_CHEQUES}
                    value={bulkCantidad}
                    onChange={(e) => setBulkCantidad(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label fw-bold small">Un N° por línea (o separados por coma)</label>
                <textarea
                  className="form-control form-control-sm font-monospace"
                  rows={6}
                  placeholder={'1234567\n1234570\n1234581'}
                  value={bulkListaTexto}
                  onChange={(e) => setBulkListaTexto(e.target.value)}
                />
              </div>
            )}

            {previewBulkNumeros.error && (
              <div className="alert alert-warning py-2 small mb-2">{previewBulkNumeros.error}</div>
            )}
            {!previewBulkNumeros.error && previewBulkNumeros.items.length > 0 && (
              <div className="border rounded p-2 mb-3 bg-light" style={{ maxHeight: '220px', overflow: 'auto' }}>
                <div className="small text-muted mb-1">
                  Vista previa: <strong>{previewBulkNumeros.items.length}</strong> cheques
                  {previewBulkNumeros.items.length >= MAX_BULK_CHEQUES && (
                    <span className="text-danger"> (máx. {MAX_BULK_CHEQUES})</span>
                  )}
                </div>
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th># int. (asignado al guardar)</th>
                      <th>N° cheque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewBulkNumeros.items.slice(0, 40).map((nro, i) => (
                      <tr key={`${nro}-${i}`}>
                        <td className="text-muted">{siguienteNumero() + i}</td>
                        <td className="fw-bold">{nro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewBulkNumeros.items.length > 40 && (
                  <small className="text-muted">… y {previewBulkNumeros.items.length - 40} filas más</small>
                )}
              </div>
            )}

            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={guardarMasivo}
                disabled={
                  guardando ||
                  !!previewBulkNumeros.error ||
                  previewBulkNumeros.items.length === 0
                }
              >
                {guardando ? 'Guardando…' : `✓ Guardar ${previewBulkNumeros.items.length || 0} cheques`}
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelarBulk}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="🔍 Buscar por librador, banco, N° cheque, endosado..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={filtroBanco} onChange={e => setFiltroBanco(e.target.value)}>
                <option value="">Todos los bancos</option>
                {bancos.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={filtroEndosado} onChange={e => setFiltroEndosado(e.target.value)}>
                <option value="">Todos los endosados</option>
                {endosados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="col-md-2 text-end">
              <span className="badge bg-secondary">{chequesFiltrados.length} resultados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total */}
      {chequesFiltrados.length > 0 && (
        <div className="alert alert-info py-2 mb-3 d-flex justify-content-between align-items-center">
          <span>Total importe ({chequesFiltrados.length} cheques):</span>
          <strong className="fs-5">{formatImporte(totalImporte)}</strong>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Cargando...</p>
        </div>
      ) : chequesFiltrados.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: '3rem' }}>📒</div>
          <p>{cheques.length === 0 ? 'No hay cheques registrados. Agregá el primero.' : 'No hay resultados para los filtros aplicados.'}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-bordered table-hover" style={{ fontSize: '0.82rem' }}>
            <thead className="table-dark" style={{ position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th style={{ width: '100px' }}>Fecha Entrada</th>
                <th>Librador / Endosante</th>
                <th>Banco</th>
                <th style={{ width: '90px' }}>N° Cheque</th>
                <th style={{ width: '100px' }}>Fecha Cheque</th>
                <th style={{ width: '130px' }}>Importe</th>
                <th style={{ width: '100px' }}>Fecha Salida</th>
                <th>Endosado a Favor De</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {chequesFiltrados.map((c) => (
                <tr key={c.id} className={editId === c.id ? 'table-warning' : ''}>
                  <td className="text-muted fw-bold text-center">{c.numero}</td>
                  <td>{c.fechaEntrada || ''}</td>
                  <td className="fw-bold">{c.librador || ''}</td>
                  <td>{c.banco || ''}</td>
                  <td className="text-center">{c.nroCheque || ''}</td>
                  <td className={(() => {
                    if (!c.fechaCheque) return '';
                    const hoy = new Date();
                    const fecha = new Date(c.fechaCheque + 'T00:00:00');
                    const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
                    if (diff < 0) return 'text-danger';
                    if (diff <= 7) return 'text-warning fw-bold';
                    return '';
                  })()}>
                    {c.fechaCheque || ''}
                    {(() => {
                      if (!c.fechaCheque) return null;
                      const hoy = new Date();
                      const fecha = new Date(c.fechaCheque + 'T00:00:00');
                      const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
                      if (diff < 0) return <small className="d-block text-danger">vencido</small>;
                      if (diff === 0) return <small className="d-block text-warning">hoy</small>;
                      if (diff <= 7) return <small className="d-block text-warning">{diff}d</small>;
                      return null;
                    })()}
                  </td>
                  <td className="text-end fw-bold">{c.importe ? formatImporte(c.importe) : ''}</td>
                  <td>{c.fechaSalida || ''}</td>
                  <td>{c.endosadoA || ''}</td>
                  <td>
                    <div className="d-flex gap-1 justify-content-center">
                      <button
                        className="btn btn-xs btn-outline-secondary p-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => editar(c)}
                        title="Editar"
                      >✏️</button>
                      <button
                        className="btn btn-xs btn-outline-danger p-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => eliminar(c.id)}
                        title="Eliminar"
                      >×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LibroCheques;
