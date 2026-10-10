import { useState, useMemo, useEffect } from 'react';
import { normalizarNombre } from '../../utils/nombres';
import { IconX, IconPlus, IconEdit } from './icons';

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
  // Editor del corte: { corte, modo: 'editar' | 'archivar', nombre, categoria, paso: 'form' | 'confirmar' }
  const [edicion, setEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [arrastrando, setArrastrando] = useState(null); // id del corte que se está arrastrando
  const [sobreCategoria, setSobreCategoria] = useState(null);
  const [verArchivados, setVerArchivados] = useState(false);
  // '' = todas · SIN_CATEGORIA = los que no tienen · cualquier otro valor = esa categoría
  const SIN_CATEGORIA = '__sin';
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (edicion) setEdicion(null);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, edicion]);

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

  const abrirEditor = (corte, extra = {}) => setEdicion({
    corte, modo: 'editar', nombre: corte.nombre, categoria: corte.categoria || '', paso: 'form', ...extra,
  });

  const confirmarEdicion = async () => {
    if (!edicion || guardando) return;
    const { corte, modo } = edicion;
    setGuardando(true);
    try {
      if (modo === 'archivar') {
        await archivarCorte(corte.id);
        addNotification(`Corte "${corte.nombre}" archivado`, 'success');
      } else {
        if (edicion.nombre.trim() !== corte.nombre) {
          const r = await renombrarCorte(corte.id, edicion.nombre);
          if (!r.ok) {
            addNotification(r.motivo, 'warning');
            setEdicion({ ...edicion, paso: 'form' });
            return;
          }
        }
        if (edicion.categoria.trim() !== (corte.categoria || '')) {
          await cambiarCategoria(corte.id, edicion.categoria);
        }
        addNotification('Cambios guardados', 'success');
      }
      setEdicion(null);
    } catch (e) {
      addNotification('No se pudo guardar el cambio', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Soltar un corte arrastrado sobre una categoría: abre el editor ya en el paso de confirmación
  const soltarEnCategoria = (categoria) => {
    const corte = cortes.find((c) => c.id === arrastrando);
    setArrastrando(null);
    setSobreCategoria(null);
    if (!corte) return;
    const destino = categoria === SIN_CATEGORIA ? '' : categoria;
    if (destino === (corte.categoria || '')) return;
    abrirEditor(corte, { categoria: destino, paso: 'confirmar' });
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
                  style={arrastrando ? { borderStyle: 'dashed', borderColor: '#6A8899', background: sobreCategoria === k ? 'rgba(106,136,153,0.18)' : undefined } : undefined}
                  onClick={() => setFiltroCategoria(filtroCategoria === k ? '' : k)}
                  onDragOver={(e) => { if (arrastrando) { e.preventDefault(); setSobreCategoria(k); } }}
                  onDragLeave={() => setSobreCategoria(null)}
                  onDrop={(e) => { e.preventDefault(); soltarEnCategoria(k); }}
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
            return (
              <div
                key={c.id}
                draggable={c.activo !== false}
                onDragStart={(e) => { setArrastrando(c.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.nombre); }}
                onDragEnd={() => { setArrastrando(null); setSobreCategoria(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 22px', borderBottom: '1px solid #eef1f3',
                  cursor: c.activo !== false ? 'grab' : 'default', opacity: arrastrando === c.id ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.activo === false ? '#9ca3af' : '#212529' }}>{c.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                    {c.categoria ? `${c.categoria} · ` : 'Sin categoría · '}
                    {veces > 0 ? `${veces} ${veces === 1 ? 'compra' : 'compras'}` : 'Sin compras'}
                  </div>
                </div>
                {c.activo === false ? (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => reactivarCorte(c.id)}>Reactivar</button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                      onClick={() => abrirEditor(c)}
                      title="Editar nombre y categoría"
                    >
                      <IconEdit size={13} /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEdicion({ corte: c, modo: 'archivar', nombre: c.nombre, categoria: c.categoria || '', paso: 'confirmar' })}
                      title="Archivar: deja de ofrecerse al cargar"
                    >
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

      {edicion && (() => {
        const { corte, modo, paso } = edicion;
        const nombreNuevo = edicion.nombre.trim();
        const categoriaNueva = edicion.categoria.trim();
        const cambioNombre = nombreNuevo !== corte.nombre;
        const cambioCategoria = categoriaNueva !== (corte.categoria || '');
        const hayCambios = cambioNombre || cambioCategoria;
        const categoriaEsNueva = !!categoriaNueva && !categorias.includes(categoriaNueva);
        const etiqueta = { fontSize: '0.66rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' };
        const campo = { width: '100%', border: '1px solid #ced4da', borderRadius: '8px', padding: '8px 12px', fontSize: '0.9rem', outline: 'none' };
        const Resumen = ({ titulo, antes, despues }) => (
          <div style={{ padding: '10px 12px', background: '#f4f7f9', borderRadius: '10px', borderLeft: '3px solid #6A8899', marginBottom: '8px' }}>
            <div style={etiqueta}>{titulo}</div>
            <div style={{ fontSize: '0.9rem' }}>
              <span style={{ color: '#9ca3af', textDecoration: 'line-through' }}>{antes}</span>
              <span style={{ margin: '0 8px', color: '#6A8899' }}>→</span>
              <strong>{despues}</strong>
            </div>
          </div>
        );

        return (
          <>
            <div
              onClick={() => !guardando && setEdicion(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1060 }}
            />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(460px, 94vw)', maxHeight: '88vh', background: '#fff', borderRadius: '16px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.22)', zIndex: 1061, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #dde2e6' }}>
                <div style={{ ...etiqueta, marginBottom: '2px' }}>
                  {modo === 'archivar' ? 'Archivar corte' : paso === 'confirmar' ? 'Confirmar cambios' : 'Editar corte'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>{corte.nombre}</div>
              </div>

              <div style={{ padding: '16px 22px', overflowY: 'auto' }}>
                {modo === 'archivar' ? (
                  <div style={{ fontSize: '0.88rem', color: '#495057', lineHeight: 1.5 }}>
                    <strong>{corte.nombre}</strong> dejará de ofrecerse al cargar mercadería.
                    Las compras anteriores se conservan tal cual, y podés reactivarlo cuando quieras
                    desde <em>Ver archivados</em>.
                  </div>
                ) : paso === 'form' ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={etiqueta}>Nombre del corte</div>
                      <input
                        type="text"
                        autoFocus
                        value={edicion.nombre}
                        onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                        placeholder="Nombre"
                        style={campo}
                      />
                    </div>

                    <div>
                      <div style={etiqueta}>Categoría</div>
                      <div style={{ fontSize: '0.76rem', color: '#6c757d', marginBottom: '8px' }}>
                        Elegí una, arrastrá el corte a una categoría o escribí una nueva.
                      </div>

                      {/* Ficha arrastrable del corte */}
                      <div
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', corte.nombre); e.dataTransfer.effectAllowed = 'move'; }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', marginBottom: '10px',
                          background: '#fff', border: '1px solid #6A8899', borderRadius: '10px', cursor: 'grab',
                          fontWeight: 600, fontSize: '0.88rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        <span style={{ color: '#9ca3af', letterSpacing: '-2px' }}>⋮⋮</span>
                        {nombreNuevo || corte.nombre}
                      </div>

                      <div className="gs-cortes-chips" style={{ marginTop: 0 }}>
                        {categorias.map((k) => {
                          const activa = categoriaNueva === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              className={`gs-chip${activa ? ' activo' : ''}`}
                              style={sobreCategoria === `ed:${k}` ? { background: 'rgba(106,136,153,0.25)', borderColor: '#6A8899' } : undefined}
                              onClick={() => setEdicion({ ...edicion, categoria: activa ? '' : k })}
                              onDragOver={(e) => { e.preventDefault(); setSobreCategoria(`ed:${k}`); }}
                              onDragLeave={() => setSobreCategoria(null)}
                              onDrop={(e) => { e.preventDefault(); setSobreCategoria(null); setEdicion({ ...edicion, categoria: k }); }}
                            >
                              {k}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className={`gs-chip${!categoriaNueva ? ' activo' : ''}`}
                          onClick={() => setEdicion({ ...edicion, categoria: '' })}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => { e.preventDefault(); setEdicion({ ...edicion, categoria: '' }); }}
                        >
                          Sin categoría
                        </button>
                      </div>

                      <input
                        type="text"
                        value={edicion.categoria}
                        onChange={(e) => setEdicion({ ...edicion, categoria: e.target.value })}
                        placeholder="…o escribí una categoría nueva"
                        style={{ ...campo, marginTop: '10px' }}
                      />
                      {categoriaEsNueva && (
                        <div style={{ fontSize: '0.74rem', color: '#7a5000', marginTop: '6px' }}>
                          Se va a crear la categoría nueva <strong>«{categoriaNueva}»</strong>.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.85rem', color: '#495057', marginBottom: '12px' }}>
                      Revisá los cambios antes de guardar:
                    </div>
                    {cambioNombre && <Resumen titulo="Nombre" antes={corte.nombre} despues={nombreNuevo || '(vacío)'} />}
                    {cambioCategoria && (
                      <Resumen
                        titulo="Categoría"
                        antes={corte.categoria || 'Sin categoría'}
                        despues={categoriaNueva || 'Sin categoría'}
                      />
                    )}
                    {cambioNombre && (
                      <div style={{ fontSize: '0.76rem', color: '#7a5000', marginTop: '4px' }}>
                        El cambio de nombre afecta al catálogo y a las cargas nuevas. Las entradas ya
                        cargadas conservan el nombre con el que se guardaron.
                      </div>
                    )}
                    {categoriaEsNueva && (
                      <div style={{ fontSize: '0.76rem', color: '#7a5000', marginTop: '4px' }}>
                        «{categoriaNueva}» es una categoría nueva: aparecerá como filtro.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ padding: '12px 22px', borderTop: '1px solid #dde2e6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {modo === 'editar' && paso === 'confirmar' && (
                  <button type="button" className="btn btn-sm btn-outline-secondary me-auto" disabled={guardando} onClick={() => setEdicion({ ...edicion, paso: 'form' })}>
                    Volver
                  </button>
                )}
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={guardando} onClick={() => setEdicion(null)}>
                  Cancelar
                </button>
                {modo === 'archivar' ? (
                  <button type="button" className="btn btn-sm btn-warning" disabled={guardando} onClick={confirmarEdicion}>
                    {guardando ? 'Archivando…' : 'Archivar corte'}
                  </button>
                ) : paso === 'form' ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={!hayCambios || !nombreNuevo}
                    onClick={() => setEdicion({ ...edicion, paso: 'confirmar' })}
                  >
                    Revisar cambios
                  </button>
                ) : (
                  <button type="button" className="btn btn-sm btn-success" disabled={guardando || !hayCambios || !nombreNuevo} onClick={confirmarEdicion}>
                    {guardando ? 'Guardando…' : 'Confirmar y guardar'}
                  </button>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </>
  );
}
