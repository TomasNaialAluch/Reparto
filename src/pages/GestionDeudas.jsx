import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/money';
import { getLocalDateString } from '../utils/date';

const COL_PERSONAS = 'deudaPersonas';
const COL_MOVIMIENTOS = 'deudaMovimientos';

const GestionDeudas = () => {
  const [personas, setPersonas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personaActiva, setPersonaActiva] = useState(null); // { id, nombre, tipo }

  // Form nueva persona
  const [showFormPersona, setShowFormPersona] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [guardandoPersona, setGuardandoPersona] = useState(false);

  // Form nuevo movimiento
  const [showFormMov, setShowFormMov] = useState(null); // 'deuda' | 'pago'
  const [formMov, setFormMov] = useState({ monto: '', fecha: getLocalDateString(), descripcion: '' });
  const [guardandoMov, setGuardandoMov] = useState(false);

  // Cargar personas
  useEffect(() => {
    const q = query(collection(db, COL_PERSONAS), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setPersonas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  // Cargar movimientos
  useEffect(() => {
    const q = query(collection(db, COL_MOVIMIENTOS), orderBy('fecha', 'asc'));
    return onSnapshot(q, snap => {
      setMovimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Calcular saldo de una persona
  // suma → aumenta saldo (nos deben más / le pagamos a ellos)
  // resta → reduce saldo (nos pagaron / les debemos más)
  const calcularSaldo = (personaId) => {
    return movimientos
      .filter(m => m.personaId === personaId)
      .reduce((acc, m) => {
        return (m.tipo === 'suma' || m.tipo === 'deuda') ? acc + m.monto : acc - m.monto;
      }, 0);
  };

  const movimientosDePersona = (personaId) =>
    movimientos.filter(m => m.personaId === personaId)
      .sort((a, b) => (a.fecha > b.fecha ? 1 : -1));

  const ultimoMovimiento = (personaId) => {
    const movs = movimientosDePersona(personaId);
    return movs[movs.length - 1] || null;
  };

  // Agregar persona
  const agregarPersona = async () => {
    if (!nombreNuevo.trim()) return;
    setGuardandoPersona(true);
    await addDoc(collection(db, COL_PERSONAS), {
      nombre: nombreNuevo.trim(),
      createdAt: serverTimestamp(),
    });
    setNombreNuevo('');
    setShowFormPersona(false);
    setGuardandoPersona(false);
  };

  const eliminarPersona = async (personaId) => {
    if (!window.confirm('¿Eliminar esta persona y todos sus movimientos?')) return;
    // Eliminar movimientos
    const movs = movimientos.filter(m => m.personaId === personaId);
    await Promise.all(movs.map(m => deleteDoc(doc(db, COL_MOVIMIENTOS, m.id))));
    await deleteDoc(doc(db, COL_PERSONAS, personaId));
    setPersonaActiva(null);
  };

  // Agregar movimiento
  const agregarMovimiento = async () => {
    if (!formMov.monto || !personaActiva) return;
    setGuardandoMov(true);
    await addDoc(collection(db, COL_MOVIMIENTOS), {
      personaId: personaActiva.id,
      tipo: showFormMov, // 'suma' | 'resta'
      monto: parseFloat(formMov.monto) || 0,
      fecha: formMov.fecha,
      descripcion: formMov.descripcion,
      createdAt: serverTimestamp(),
    });
    setFormMov({ monto: '', fecha: getLocalDateString(), descripcion: '' });
    setShowFormMov(null);
    setGuardandoMov(false);
  };

  const eliminarMovimiento = async (movId) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    await deleteDoc(doc(db, COL_MOVIMIENTOS, movId));
  };

  // ── VISTA DETALLE ────────────────────────────────────────────────────────────
  if (personaActiva) {
    const saldo = calcularSaldo(personaActiva.id);
    const movs = movimientosDePersona(personaActiva.id);
    const esNosDebenTipo = saldo >= 0;

    return (
      <div className="container mt-4" style={{ maxWidth: 700 }}>
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setPersonaActiva(null); setShowFormMov(null); }}>
            ← Volver
          </button>
          <div>
            <h3 className="mb-0">{personaActiva.nombre}</h3>
            <span className={`badge ${esNosDebenTipo ? 'bg-success' : 'bg-danger'}`}>
              {esNosDebenTipo ? 'Nos debe' : 'Le debemos'}
            </span>
          </div>
        </div>

        {/* Saldo */}
        <div className={`card mb-4 border-${saldo === 0 ? 'success' : saldo > 0 ? 'warning' : 'success'}`}>
          <div className="card-body text-center py-4">
            <small className="text-muted d-block mb-1">
              {saldo === 0 ? 'Saldo saldado' : saldo > 0 ? (esNosDebenTipo ? 'Nos debe' : 'Debemos') : 'A favor'}
            </small>
            <div className={`display-5 fw-bold ${saldo === 0 ? 'text-success' : saldo > 0 ? 'text-danger' : 'text-success'}`}>
              {formatCurrency(Math.abs(saldo))}
            </div>
            {saldo === 0 && <div className="text-success mt-2">✓ Deuda saldada</div>}
          </div>
        </div>

        {/* Botones acción */}
        <div className="d-flex gap-2 mb-4">
          <button
            className={`btn flex-fill ${showFormMov === 'suma' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setShowFormMov(showFormMov === 'suma' ? null : 'suma')}
          >
            ➕ Suma al saldo
          </button>
          <button
            className={`btn flex-fill ${showFormMov === 'resta' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setShowFormMov(showFormMov === 'resta' ? null : 'resta')}
          >
            ➖ Resta del saldo
          </button>
        </div>

        {/* Ayuda contextual */}
        {!showFormMov && (
          <div className="alert alert-light py-2 mb-3" style={{ fontSize: '0.8rem' }}>
            <strong>➕ Suma:</strong> me deben algo nuevo / le pagué algo a ellos &nbsp;·&nbsp;
            <strong>➖ Resta:</strong> me pagaron / les debo algo nuevo
          </div>
        )}

        {/* Form movimiento */}
        {showFormMov && (
          <div className={`card mb-4 border-${showFormMov === 'suma' ? 'danger' : 'success'}`}>
            <div className={`card-header ${showFormMov === 'suma' ? 'bg-danger' : 'bg-success'} text-white d-flex justify-content-between align-items-center`}>
              <h6 className="mb-0">
                {showFormMov === 'suma' ? '➕ Suma al saldo' : '➖ Resta del saldo'}
              </h6>
              <small style={{ opacity: 0.85 }}>
                {showFormMov === 'suma'
                  ? 'Ej: me debe algo nuevo, le pagué a él'
                  : 'Ej: me pagó, les debo algo nuevo'}
              </small>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-5">
                  <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Monto</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={formMov.monto}
                    onChange={e => setFormMov(p => ({ ...p, monto: e.target.value }))}
                    min="0"
                    autoFocus
                  />
                </div>
                <div className="col-4">
                  <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formMov.fecha}
                    onChange={e => setFormMov(p => ({ ...p, fecha: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Descripción <span className="text-muted fw-normal">(opcional)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Pago parcial, Mercadería, Préstamo..."
                    value={formMov.descripcion}
                    onChange={e => setFormMov(p => ({ ...p, descripcion: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && formMov.monto && agregarMovimiento()}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button
                  className={`btn ${showFormMov === 'suma' ? 'btn-danger' : 'btn-success'}`}
                  onClick={agregarMovimiento}
                  disabled={guardandoMov || !formMov.monto}
                >
                  {guardandoMov ? 'Guardando...' : '✓ Guardar'}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setShowFormMov(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Historial */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">📋 Historial de movimientos</h6>
          </div>
          <div className="card-body p-0">
            {movs.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">Sin movimientos aún</p>
            ) : (
              <>
                {/* Saldo acumulado running */}
                {(() => {
                  let acum = 0;
                  return (
                    <table className="table table-sm mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Descripción</th>
                          <th className="text-end">Monto</th>
                          <th className="text-end">Saldo</th>
                          <th style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {movs.map(m => {
                          acum += m.tipo === 'deuda' ? m.monto : -m.monto;
                          return (
                            <tr key={m.id}>
                              <td style={{ whiteSpace: 'nowrap' }}>{m.fecha}</td>
                              <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {m.descripcion || ((m.tipo === 'suma' || m.tipo === 'deuda') ? 'Suma' : 'Resta')}
                              </td>
                              <td className={`text-end fw-bold ${(m.tipo === 'suma' || m.tipo === 'deuda') ? 'text-danger' : 'text-success'}`}>
                                {(m.tipo === 'suma' || m.tipo === 'deuda') ? '+' : '-'}{formatCurrency(m.monto)}
                              </td>
                              <td className={`text-end ${acum > 0 ? 'text-danger' : acum < 0 ? 'text-success' : 'text-muted'}`}
                                style={{ fontSize: '0.85rem' }}>
                                {formatCurrency(Math.abs(acum))}
                              </td>
                              <td>
                                <button
                                  className="btn btn-link text-danger p-0"
                                  style={{ fontSize: '1rem' }}
                                  onClick={() => eliminarMovimiento(m.id)}
                                  title="Eliminar"
                                >×</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={2}><strong>Saldo total</strong></td>
                          <td colSpan={2} className={`text-end fw-bold fs-6 ${saldo > 0 ? 'text-danger' : saldo < 0 ? 'text-success' : 'text-muted'}`}>
                            {formatCurrency(Math.abs(saldo))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarPersona(personaActiva.id)}>
            🗑 Eliminar a {personaActiva.nombre}
          </button>
        </div>
      </div>
    );
  }

  // ── VISTA PRINCIPAL: LISTA DE PERSONAS ──────────────────────────────────────
  const nosDebenPersonas = personas.filter(p => calcularSaldo(p.id) > 0);
  const debemosPersonas  = personas.filter(p => calcularSaldo(p.id) < 0);
  const saldadasPersonas = personas.filter(p => calcularSaldo(p.id) === 0);

  const renderCards = (lista, mostrarBotonAgregar = false) => (
    <div className="row g-3">
      {lista.map(p => {
        const saldo = calcularSaldo(p.id);
        const ultimo = ultimoMovimiento(p.id);
        const cantMovs = movimientos.filter(m => m.personaId === p.id).length;
        return (
          <div key={p.id} className="col-sm-6 col-md-4">
            <div
              className="card h-100 border-0 shadow-sm"
              style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              onClick={() => setPersonaActiva(p)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ height: 4, background: saldo === 0 ? '#198754' : saldo > 0 ? '#dc3545' : '#ffc107', borderRadius: '8px 8px 0 0' }} />
              <div className="card-body">
                <h5 className="card-title mb-1">{p.nombre}</h5>
                <div className={`fs-4 fw-bold ${saldo === 0 ? 'text-success' : saldo > 0 ? 'text-danger' : 'text-warning'}`}>
                  {saldo === 0 ? '✓ Saldado' : formatCurrency(Math.abs(saldo))}
                </div>
                {ultimo && (
                  <small className="text-muted d-block mt-1">
                    Último mov: {ultimo.fecha}
                    {ultimo.descripcion ? ` · ${ultimo.descripcion}` : ''}
                  </small>
                )}
                <small className="text-muted">{cantMovs} movimiento{cantMovs !== 1 ? 's' : ''}</small>
              </div>
              <div className="card-footer bg-transparent border-0 text-end">
                <small className="text-primary">Ver detalle →</small>
              </div>
            </div>
          </div>
        );
      })}

      {mostrarBotonAgregar && (
        <div className="col-sm-6 col-md-4">
          <div
            className="card h-100 d-flex align-items-center justify-content-center"
            style={{ cursor: 'pointer', minHeight: 120, border: '2px dashed #dee2e6' }}
            onClick={() => setShowFormPersona(true)}
          >
            <div className="text-muted text-center py-3">
              <div style={{ fontSize: '2rem' }}>+</div>
              <small>Agregar persona</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">📋 Gestión de Deudas</h2>
          <small className="text-muted">{personas.length} personas registradas</small>
        </div>
      </div>

      {/* Form nueva persona (modal simple) */}
      {showFormPersona && (
        <div className="card mb-4 border-primary">
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0">+ Nueva Persona</h6>
          </div>
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-7">
                <label className="form-label fw-bold">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Juan"
                  value={nombreNuevo}
                  onChange={e => setNombreNuevo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarPersona()}
                  autoFocus
                />
                <small className="text-muted">La categoría (nos debe / le debemos) se asigna automáticamente según los movimientos.</small>
              </div>
              <div className="col-md-5">
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={agregarPersona} disabled={guardandoPersona || !nombreNuevo.trim()}>
                    {guardandoPersona ? '...' : '✓ Agregar'}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => { setShowFormPersona(false); setNombreNuevo(''); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <>
          <h5 className="mb-3 text-danger">💰 Nos deben</h5>
          {renderCards(nosDebenPersonas, true)}

          {debemosPersonas.length > 0 && (
            <>
              <hr className="my-4" />
              <h5 className="mb-3 text-warning">⚠️ Les debemos</h5>
              {renderCards(debemosPersonas)}
            </>
          )}

          {saldadasPersonas.length > 0 && (
            <>
              <hr className="my-4" />
              <h5 className="mb-3 text-success">✓ Saldados</h5>
              {renderCards(saldadasPersonas)}
            </>
          )}

          {personas.length === 0 && (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '3rem' }}>📋</div>
              <p>No hay personas registradas. Agregá la primera.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GestionDeudas;
