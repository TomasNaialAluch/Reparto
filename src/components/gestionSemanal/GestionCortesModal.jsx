import { useState, useMemo, useEffect } from 'react';
import { normalizarNombre } from '../../utils/nombres';
import { IconX, IconPlus, IconCheck, IconEdit } from './icons';

/**
 * Gestión del catálogo de cortes: ver (con cuántas veces se compró cada uno), crear,
 * renombrar y archivar. Renombrar cambia el catálogo; las entradas ya cargadas conservan
 * el nombre con el que se guardaron.
 */
export default function GestionCortesModal({
  isOpen, onClose, cortes, usoGlobal, categorias = [], crearCorte, renombrarCorte, cambiarCategoria,
  archivarCorte, reactivarCorte, addNotification,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [categoriaEditada, setCategoriaEditada] = useState('');
  const [verArchivados, setVerArchivados] = useState(false);
  // '' = todas · SIN_CATEGORIA = los que no tienen · cualquier otro valor = esa categoría
  const SIN_CATEGORIA = '__sin';
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const q = normalizarNombre(busqueda);
  const lista = useMemo(() => cortes
    .filter((c) => (verArchivados ? c.activo === false : c.activo !== false))
    .filter((c) => !q || c.nombreNormalizado.includes(q))
    .filter((c) => !filtroCategoria
      || (filtroCategoria === SIN_CATEGORIA ? !c.categoria : c.categoria === filtroCategoria))
    .sort((a, b) => (usoGlobal[b.nombreNormalizado] || 0) - (usoGlobal[a.nombreNormalizado] || 0)
      || (a.nombre || '').localeCompare(b.nombre || '', 'es')),
  [cortes, verArchivados, q, usoGlobal, filtroCategoria]);

  // Cantidad por categoría (sobre los cortes del listado actual: activos o archivados)
  const enListado = cortes.filter((c) => (verArchivados ? c.activo === false : c.activo !== false));
  const cantidadDe = (k) => enListado.filter((c) => (k === SIN_CATEGORIA ? !c.categoria : c.categoria === k)).length;
  const hayCortesSinCategoria = cantidadDe(SIN_CATEGORIA) > 0;

  const cantArchivados = cortes.filter((c) => c.activo === false).length;
  const existente = q ? cortes.find((c) => c.nombreNormalizado === q) : null;

  if (!isOpen) return null;

  const crear = async () => {
    try {
      const r = await crearCorte(busqueda, filtroCategoria === SIN_CATEGORIA ? '' : filtroCategoria);
      addNotification(r.creado ? `Corte "${r.nombre}" creado` : `"${r.nombre}" ya existía`, r.creado ? 'success' : 'info');
      setBusqueda('');
      setVerArchivados(false);
    } catch (e) {
      addNotification(e.message || 'No se pudo crear el corte', 'error');
    }
  };

  const guardarNombre = async (id) => {
    const actual = cortes.find((c) => c.id === id);
    if (actual && nombreEditado.trim() !== actual.nombre) {
      const r = await renombrarCorte(id, nombreEditado);
      if (!r.ok) { addNotification(r.motivo, 'warning'); return; }
    }
    if (actual && categoriaEditada.trim() !== (actual.categoria || '')) {
      await cambiarCategoria(id, categoriaEditada);
    }
    setEditandoId(null);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(520px, 95vw)', maxHeight: '88vh', background: '#fff', borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #dde2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Gestión
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>Cortes</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}
          >
            <IconX size={14} />
          </button>
        </div>

        <datalist id="gs-categorias-cortes">
          {categorias.map((k) => <option key={k} value={k} />)}
        </datalist>
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #dde2e6' }}>
          <input
            type="text"
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q && !existente) crear(); }}
            placeholder="Buscar o escribir un corte nuevo…"
            style={{ width: '100%', border: '1px solid #ced4da', borderRadius: '8px', padding: '8px 12px', fontSize: '0.9rem', outline: 'none' }}
          />
          {(categorias.length > 0 || hayCortesSinCategoria) && (
            <div className="gs-cortes-chips">
              <button
                type="button"
                className={`gs-chip${filtroCategoria === '' ? ' activo' : ''}`}
                onClick={() => setFiltroCategoria('')}
              >
                Todos ({enListado.length})
              </button>
              {categorias.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`gs-chip${filtroCategoria === k ? ' activo' : ''}`}
                  onClick={() => setFiltroCategoria(filtroCategoria === k ? '' : k)}
                >
                  {k} ({cantidadDe(k)})
                </button>
              ))}
              {hayCortesSinCategoria && (
                <button
                  type="button"
                  className={`gs-chip${filtroCategoria === SIN_CATEGORIA ? ' activo' : ''}`}
                  onClick={() => setFiltroCategoria(filtroCategoria === SIN_CATEGORIA ? '' : SIN_CATEGORIA)}
                >
                  Sin categoría ({cantidadDe(SIN_CATEGORIA)})
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: '120px' }}>
          {lista.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
              {q ? `Sin resultados para "${busqueda.trim()}".` : 'No hay cortes.'}
            </div>
          ) : lista.map((c) => {
            const veces = usoGlobal[c.nombreNormalizado] || 0;
            const editando = editandoId === c.id;
            return (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 22px', borderBottom: '1px solid #eef1f3' }}
              >
                {editando ? (
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      autoFocus
                      value={nombreEditado}
                      onChange={(e) => setNombreEditado(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') guardarNombre(c.id);
                        if (e.key === 'Escape') { e.stopPropagation(); setEditandoId(null); }
                      }}
                      placeholder="Nombre"
                      style={{ flex: '1 1 130px', minWidth: 0, border: '1px solid #ced4da', borderRadius: '8px', padding: '5px 10px', fontSize: '0.88rem' }}
                    />
                    <input
                      type="text"
                      list="gs-categorias-cortes"
                      value={categoriaEditada}
                      onChange={(e) => setCategoriaEditada(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') guardarNombre(c.id);
                        if (e.key === 'Escape') { e.stopPropagation(); setEditandoId(null); }
                      }}
                      placeholder="Categoría"
                      style={{ flex: '1 1 110px', minWidth: 0, border: '1px solid #ced4da', borderRadius: '8px', padding: '5px 10px', fontSize: '0.88rem' }}
                    />
                  </div>
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.activo === false ? '#9ca3af' : '#212529' }}>{c.nombre}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {c.categoria ? `${c.categoria} · ` : 'Sin categoría · '}
                      {veces > 0 ? `${veces} ${veces === 1 ? 'compra' : 'compras'}` : 'Sin compras'}
                    </div>
                  </div>
                )}
                {editando ? (
                  <>
                    <button type="button" className="btn btn-sm btn-success" onClick={() => guardarNombre(c.id)} title="Guardar"><IconCheck size={13} /></button>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditandoId(null)} title="Cancelar"><IconX size={13} /></button>
                  </>
                ) : c.activo === false ? (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => reactivarCorte(c.id)}>Reactivar</button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => { setEditandoId(c.id); setNombreEditado(c.nombre); setCategoriaEditada(c.categoria || ''); }}
                      title="Renombrar"
                    >
                      <IconEdit size={13} />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => archivarCorte(c.id)} title="Archivar: deja de ofrecerse al cargar">
                      Archivar
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid #dde2e6', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {q && !existente ? (
            <button type="button" className="btn btn-sm btn-success d-inline-flex align-items-center gap-2" onClick={crear}>
              <IconPlus size={13} /> Crear corte "{busqueda.trim()}"
            </button>
          ) : <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{existente && !verArchivados && existente.activo === false ? 'Está archivado.' : ''}</span>}
          {cantArchivados > 0 && (
            <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => setVerArchivados((v) => !v)}>
              {verArchivados ? 'Ver activos' : `Ver archivados (${cantArchivados})`}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
