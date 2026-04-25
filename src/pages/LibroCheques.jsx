import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  updateDoc, orderBy, query, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLocalDateString } from '../utils/date';

const COLLECTION = 'libroCheques';

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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
  };

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
        {!showForm && (
          <button className="btn btn-primary" onClick={() => {
            setForm(emptyForm(String(siguienteNumero())));
            setShowForm(true);
          }}>
            + Nuevo Cheque
          </button>
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
