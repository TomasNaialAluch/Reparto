import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { IconChevronDown, IconTrash, IconX } from '../gestionSemanal/icons';
import ResolverCorte from './ResolverCorte';
import TotalesRemito from './TotalesRemito';
import { decisionCompleta, decisionInicial, reconocerCorte } from '../../utils/cortes';
import {
  estaResuelto, etiquetaItem, formatKg, parseKg, pendientesDe, totalesPesada,
} from '../../utils/pesadas';
import { normalizarNombre } from '../../utils/nombres';

const LIMITE_KG = 5000;
const MotionDiv = motion.div;

const estilos = {
  card: (activa) => ({
    background: '#fff',
    borderRadius: 14,
    border: `1px solid ${activa ? 'var(--color-primary)' : 'var(--color-primary-border)'}`,
    borderLeft: `4px solid ${activa ? 'var(--color-primary)' : 'var(--color-primary-border)'}`,
    overflow: 'hidden',
    transition: 'border-color .25s ease, box-shadow .25s ease',
    boxShadow: activa ? '0 6px 20px rgba(80, 104, 120, 0.12)' : '0 0 0 rgba(0,0,0,0)',
  }),
  header: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
    cursor: 'pointer', userSelect: 'none',
  },
  pill: {
    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999,
    background: 'var(--color-primary-soft)', color: '#3a5060',
  },
  pillAviso: {
    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
    background: '#fef3c7', color: '#92400e',
  },
  label: { fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    width: '100%', padding: '7px 10px', borderRadius: 9, fontSize: '0.95rem', fontWeight: 600,
    border: '1px solid var(--color-primary-border)', outline: 'none', background: '#fff',
  },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
    fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--color-primary-border)',
    background: 'var(--color-primary-soft)', color: '#3a5060',
  },
};

/** Cómo se ve lo que se está escribiendo, antes de guardar. */
const describir = (rec, texto) => {
  if (!rec) return { nombre: texto ? `«${texto}»` : '', ok: false, nota: '' };
  if (['exacto', 'alias', 'parcial'].includes(rec.match)) {
    return { nombre: rec.corte, ok: true, nota: rec.match === 'parcial' || rec.match === 'alias' ? ` (${texto})` : '' };
  }
  if (rec.match === 'dudoso') {
    return { nombre: `«${texto}»`, ok: false, nota: `¿${rec.candidatos.join(' / ')}?` };
  }
  return { nombre: `«${texto}»`, ok: false, nota: 'sin reconocer, se valida al ingresar' };
};

const PesadaCard = ({
  pesada, activa, onActivar, onAgregar, onQuitar, onEliminar, onResolverTexto, onIngresar,
  onGuardarRemito, onCambiarEstado, onDescartar, onHabilitarReingreso, entradaEliminada = false,
  cortesCatalogo, categorias = [], bloqueado = false,
}) => {
  const [corte, setCorte] = useState('');
  const [kg, setKg] = useState('');
  const [corteActual, setCorteActual] = useState(null); // { texto, rec } de la última carga
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resolviendo, setResolviendo] = useState(null); // pendiente que se está resolviendo acá mismo
  const [decision, setDecision] = useState(null);
  const [confirmaReingreso, setConfirmaReingreso] = useState(false);
  const corteRef = useRef(null);
  const reducirMovimiento = useReducedMotion();
  // La tarjeta conserva su ancho de "activa" hasta que termina de cerrarse el cuerpo.
  const [abierta, setAbierta] = useState(activa);
  useEffect(() => { if (activa) setAbierta(true); }, [activa]);
  const kgRef = useRef(null);

  const items = useMemo(() => pesada.pesadas || [], [pesada.pesadas]);
  const totales = useMemo(() => totalesPesada(items), [items]);
  const pendientes = useMemo(() => pendientesDe(items), [items]);
  const ingresada = pesada.estado === 'ingresada';
  const cerrada = pesada.estado === 'cerrada';
  const soloLectura = ingresada || cerrada;

  // Corte vigente: el que se fijó, o el de la última pesada cargada
  const actual = useMemo(() => {
    if (corteActual) return corteActual;
    const ultimo = items[items.length - 1];
    if (!ultimo) return null;
    return {
      texto: ultimo.texto || ultimo.corte || '',
      rec: {
        corteId: ultimo.corteId || null,
        corte: ultimo.corte || null,
        match: ultimo.match || 'exacto',
        candidatos: ultimo.candidatos || [],
      },
    };
  }, [corteActual, items]);

  // Corte efectivo: lo escrito en el campo o, si está vacío, el de la última carga.
  const texto = corte.trim() || actual?.texto || '';
  const rec = useMemo(() => {
    if (corte.trim()) return reconocerCorte(corte, cortesCatalogo);
    return actual?.rec || null;
  }, [corte, cortesCatalogo, actual]);
  const kgNum = kg.trim() ? parseKg(kg) : null;

  const agregar = async () => {
    setMensaje('');
    if (!texto || !rec) {
      setMensaje('Falta el corte');
      corteRef.current?.focus();
      return;
    }
    if (kgNum === null || Number.isNaN(kgNum) || !(kgNum > 0)) {
      setMensaje('Ingresá los kg (mayor a 0)');
      kgRef.current?.focus();
      return;
    }
    if (kgNum > LIMITE_KG) {
      setMensaje(`${formatKg(kgNum)} parece mucho. Revisá el número`);
      return;
    }

    setGuardando(true);
    try {
      await onAgregar(pesada.id, {
        texto,
        corteId: rec.corteId,
        corte: rec.corte,
        kg: kgNum,
        match: rec.match,
        candidatos: rec.candidatos,
      });
      setCorteActual({ texto, rec });
      setCorte(texto);
      setKg('');
      setTimeout(() => kgRef.current?.focus(), 0);
    } catch (err) {
      console.error(err);
      setMensaje('No se pudo guardar. Probá de nuevo');
    } finally {
      setGuardando(false);
    }
  };

  const onCorteKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (corte.trim() || actual) kgRef.current?.focus();
    }
  };

  const onKgKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setKg('');
      setCorte('');
      setCorteActual(null);
      setMensaje('');
      corteRef.current?.focus();
    }
  };

  const deshacer = () => {
    const ultimo = items[items.length - 1];
    if (ultimo) onQuitar(pesada.id, ultimo);
  };

  const abrirResolver = (item) => {
    const clave = normalizarNombre(item.texto || item.corte);
    const pend = pendientes.find((p) => p.textoNorm === clave);
    if (!pend) return;
    setResolviendo(pend);
    setDecision(decisionInicial(pend, cortesCatalogo));
  };

  const aplicarResolver = async () => {
    if (!resolviendo || !decisionCompleta(decision)) return;
    try {
      await onResolverTexto(pesada, resolviendo, decision);
      setResolviendo(null);
      setDecision(null);
    } catch (err) {
      console.error(err);
      setMensaje(err.message || 'No se pudo resolver el corte');
    }
  };

  const vista = (() => {
    if (!texto) {
      return (
        <span style={{ color: '#9ca3af' }}>
          Escribí el corte, Enter, los kg y Enter
        </span>
      );
    }
    const d = describir(rec, texto);
    const kgTxt = kgNum && !Number.isNaN(kgNum) ? ` · ${formatKg(kgNum)}` : '';
    return (
      <span style={{ color: d.ok ? '#166534' : '#92400e', fontWeight: 600 }}>
        → {d.nombre}{d.nota}{kgTxt} {d.ok ? '✔' : '⚠'}
      </span>
    );
  })();

  // ----- Minimizar solo al sacar el mouse -----
  // Se minimiza ~0,5 s después de que el mouse sale de la tarjeta, salvo que haya algo a medias
  // (kg o corte sin guardar), se esté resolviendo un corte o haya un modal abierto.
  const corteEscrito = normalizarNombre(corte);
  const hayTrabajoSinGuardar = kg.trim() !== ''
    || (corteEscrito !== '' && corteEscrito !== normalizarNombre(actual?.texto || ''));
  const puedeMinimizar = activa && !guardando && !resolviendo && !hayTrabajoSinGuardar && !bloqueado;
  const puedeMinimizarRef = useRef(puedeMinimizar);
  const temporizadorRef = useRef(null);

  useEffect(() => { puedeMinimizarRef.current = puedeMinimizar; }, [puedeMinimizar]);
  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  const alSalirElMouse = (e) => {
    if (e.pointerType !== 'mouse' || !activa) return;
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(() => {
      if (puedeMinimizarRef.current) onActivar(null);
    }, 500);
  };
  const alEntrarElMouse = () => clearTimeout(temporizadorRef.current);

  const sinKg = items.length === 0;

  return (
    <div
      className={activa || abierta ? 'pesada-card pesada-card--activa' : 'pesada-card'}
      style={estilos.card(activa)}
      onPointerLeave={alSalirElMouse}
      onPointerEnter={alEntrarElMouse}
    >
      <div style={estilos.header} onClick={() => onActivar(activa ? null : pesada.id)}>
        <span style={{ display: 'inline-flex', transform: activa ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#6c757d' }}>
          <IconChevronDown size={14} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pesada.proveedor}
          </div>
          {pesada.remito?.numero ? (
            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Remito {pesada.remito.numero}</div>
          ) : null}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, color: '#3a5060' }}>{formatKg(totales.kg)}</div>
          <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>
            {totales.cantidad} {totales.cantidad === 1 ? 'pesada' : 'pesadas'}
          </div>
        </div>
        {pendientes.length > 0 && !ingresada && (
          <span style={estilos.pillAviso}>⚠ {pendientes.length}</span>
        )}
        <span style={estilos.pill}>{pesada.estado || 'abierta'}</span>
      </div>

      <AnimatePresence initial={false} onExitComplete={() => setAbierta(false)}>
      {activa && (
        <MotionDiv
          key="cuerpo"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={reducirMovimiento ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
        <div className="pesada-cuerpo" style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--color-primary-soft)' }}>
          <div className="pesada-col-carga">
            {ingresada ? (
              <div style={{ marginTop: 12 }}>
                <div style={estilos.chip}>✔ Ingresada a Mercadería</div>
                {entradaEliminada && (
                  <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: '6px 10px' }}>
                    La entrada de Mercadería ya no existe.
                    <button
                      type="button"
                      onClick={() => onHabilitarReingreso(pesada)}
                      style={{ marginLeft: 8, border: 'none', background: 'none', fontWeight: 700, color: '#92400e', textDecoration: 'underline' }}
                    >
                      Habilitar para ingresar de nuevo
                    </button>
                  </div>
                )}
                {!entradaEliminada && (
                  <div style={{ marginTop: 8, fontSize: '0.76rem', color: '#9ca3af' }}>
                    {confirmaReingreso ? (
                      <>
                        ¿Se eliminó la entrada en Mercadería?{' '}
                        <button
                          type="button"
                          onClick={() => { setConfirmaReingreso(false); onHabilitarReingreso(pesada); }}
                          style={{ border: 'none', background: 'none', fontWeight: 700, color: '#3a5060', textDecoration: 'underline' }}
                        >
                          Sí, habilitar
                        </button>
                        {' · '}
                        <button
                          type="button"
                          onClick={() => setConfirmaReingreso(false)}
                          style={{ border: 'none', background: 'none', color: '#6c757d' }}
                        >
                          no
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmaReingreso(true)}
                        style={{ border: 'none', background: 'none', color: '#9ca3af', padding: 0, textDecoration: 'underline' }}
                      >
                        ¿Se eliminó la entrada? Habilitar de nuevo
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : cerrada ? (
              <div style={{ marginTop: 12 }}>
                <div style={estilos.chip}>🔒 Pesada cerrada</div>
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => onCambiarEstado(pesada, 'abierta')}
                    style={{ ...estilos.chip, background: '#fff' }}
                  >
                    Reabrir para seguir pesando
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) auto', gap: 8, alignItems: 'end' }}>
                  <div>
                    <div style={estilos.label}>Corte</div>
                    <input
                      ref={corteRef}
                      autoFocus
                      type="text"
                      value={corte}
                      placeholder={actual?.texto || 'lomo'}
                      autoComplete="off"
                      style={{ ...estilos.input, marginTop: 3 }}
                      onChange={(e) => { setCorte(e.target.value); setMensaje(''); }}
                      onKeyDown={onCorteKeyDown}
                      disabled={guardando}
                    />
                  </div>
                  <div>
                    <div style={estilos.label}>Kg</div>
                    <input
                      ref={kgRef}
                      type="text"
                      inputMode="decimal"
                      value={kg}
                      placeholder="0,00"
                      autoComplete="off"
                      style={{ ...estilos.input, marginTop: 3, textAlign: 'right' }}
                      onChange={(e) => { setKg(e.target.value); setMensaje(''); }}
                      onKeyDown={onKgKeyDown}
                      disabled={guardando}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Agregar pesada"
                    title="Agregar (Enter)"
                    disabled={guardando}
                    onClick={agregar}
                    style={{
                      width: 38, height: 36, borderRadius: 9, border: 'none', fontSize: '1.2rem', fontWeight: 700,
                      background: 'var(--color-primary)', color: '#fff', lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>
                <div style={{ fontSize: '0.84rem', marginTop: 8, minHeight: 20 }}>{vista}</div>
                {mensaje && <div style={{ color: '#b45309', fontSize: '0.82rem', marginTop: 6 }}>{mensaje}</div>}
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 8 }}>
                  El corte queda fijo entre pesadas · Esc cambia de corte
                </div>
              </div>
            )}
          </div>

          <div className="pesada-col-detalle">
            {/* Totales por corte */}
            {totales.cortes.length > 0 && (
              <TotalesRemito
                totales={totales}
                remito={pesada.remito}
                remitoPorCorte={pesada.remitoPorCorte}
                soloLectura={ingresada}
                onGuardar={(datos) => onGuardarRemito(pesada, datos)}
              />
            )}

            {pendientes.length > 0 && !ingresada && (
              <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: '6px 10px' }}>
                {pendientes.length} {pendientes.length === 1 ? 'corte sin validar' : 'cortes sin validar'}.
                Se revisan al ingresar a Mercadería, o tocá un ⚠ para resolverlo ahora.
              </div>
            )}

            {resolviendo && (
              <div style={{ marginTop: 10 }}>
                <ResolverCorte
                  pendiente={resolviendo}
                  catalogo={cortesCatalogo}
                  categorias={categorias}
                  decision={decision}
                  onChange={setDecision}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    style={{ ...estilos.chip, background: 'var(--color-primary)', color: '#fff', opacity: decisionCompleta(decision) ? 1 : 0.5 }}
                    disabled={!decisionCompleta(decision)}
                    onClick={aplicarResolver}
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    style={{ ...estilos.chip, background: '#fff' }}
                    onClick={() => { setResolviendo(null); setDecision(null); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Pesadas cargadas (la última arriba) */}
            {items.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={estilos.label}>Cargadas</div>
                  {!soloLectura && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={deshacer}>
                      ↶ Deshacer última
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 6 }}>
                  {[...items].reverse().map((it) => {
                    const resuelto = estaResuelto(it);
                    const escrito = it.texto && normalizarNombre(it.texto) !== normalizarNombre(it.corte || '');
                    return (
                      <div
                        key={it.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--color-primary-soft)', fontSize: '0.88rem' }}
                      >
                        <span style={{ color: '#9ca3af', width: 44 }}>{it.hora}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          {etiquetaItem(it)}
                          {resuelto && escrito ? <span style={{ color: '#9ca3af' }}> ({it.texto})</span> : null}
                        </span>
                        <span style={{ fontWeight: 700 }}>{formatKg(it.kg)}</span>
                        {resuelto ? (
                          <span style={{ color: '#166534', width: 18, textAlign: 'center' }}>✔</span>
                        ) : (
                          <button
                            type="button"
                            title="Resolver este corte"
                            onClick={() => !ingresada && abrirResolver(it)}
                            style={{ border: 'none', background: '#fef3c7', color: '#92400e', borderRadius: 6, width: 22, fontSize: '0.8rem', padding: 0 }}
                          >
                            ⚠
                          </button>
                        )}
                        {!soloLectura && (
                          <button
                            type="button"
                            aria-label="Quitar pesada"
                            onClick={() => onQuitar(pesada.id, it)}
                            style={{ border: 'none', background: 'none', color: '#9ca3af', padding: 2 }}
                          >
                            <IconX size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Acciones */}
            {!ingresada && cerrada && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" style={{ ...estilos.chip, background: '#fff', color: '#9a3412' }} onClick={() => onDescartar(pesada)}>
                  Descartar
                </button>
                <button
                  type="button"
                  style={{ ...estilos.chip, background: 'var(--color-primary)', color: '#fff' }}
                  onClick={() => onIngresar(pesada)}
                >
                  Ingresar a Mercadería
                </button>
              </div>
            )}
            {!ingresada && !cerrada && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {sinKg ? (
                  <>
                    <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>Todavía no se pesó nada.</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onEliminar(pesada)}>
                      <IconTrash size={13} /> Eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                      {pendientes.length > 0 ? 'Vas a revisar los cortes sin validar al ingresar.' : 'Todo reconocido.'}
                    </span>
                    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" style={{ ...estilos.chip, background: '#fff', color: '#9a3412' }} onClick={() => onDescartar(pesada)}>
                        Descartar
                      </button>
                      <button type="button" style={{ ...estilos.chip, background: '#fff' }} onClick={() => onCambiarEstado(pesada, 'cerrada')}>
                        Cerrar pesada
                      </button>
                      <button
                        type="button"
                        style={{ ...estilos.chip, background: 'var(--color-primary)', color: '#fff' }}
                        onClick={() => onIngresar(pesada)}
                      >
                        Ingresar a Mercadería
                      </button>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        </MotionDiv>
      )}
      </AnimatePresence>
    </div>
  );
};

export default PesadaCard;
