// Paso previo a ingresar una pesada a Mercadería:
//   1) "Revisar cortes": resuelve los textos que no se reconocieron (una decisión por texto)
//   2) "Precios": $/kg opcional por corte, con aviso si se aleja mucho del habitual
// Ver README-PESADAS-CARGA-RAPIDA.md, sección 6.
import { useEffect, useMemo, useState } from 'react';
import ResolverCorte from './ResolverCorte';
import {
  cortesHabituales, decisionCompleta, decisionInicial, habitualesParecidos,
} from '../../utils/cortes';
import { estaResuelto, formatKg, totalesPesada } from '../../utils/pesadas';
import { normalizarNombre } from '../../utils/nombres';
import { FACTOR_PRECIO_ATIPICO } from '../../hooks/usePreciosReferencia';

const IngresarMercaderiaModal = ({
  pesada, pendientes, autoResueltos, catalogo, categorias, referenciaPara,
  usoCortesDe, usoGlobalCortes, historialListo, onCancelar, onConfirmar,
}) => {
  const [decisiones, setDecisiones] = useState({});
  const [precios, setPrecios] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [avisado, setAvisado] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !guardando) onCancelar(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onCancelar, guardando]);

  const decisionDe = (p) => decisiones[p.textoNorm] || decisionInicial(p, catalogo);
  const todasResueltas = pendientes.every((p) => decisionCompleta(decisionDe(p)));

  // Vista previa de los totales con las decisiones aplicadas (sin tocar nada guardado)
  const cortesFinales = useMemo(() => {
    const items = (pesada.pesadas || []).map((it) => {
      if (estaResuelto(it)) return it;
      const clave = normalizarNombre(it.texto || it.corte);
      const auto = autoResueltos[clave];
      if (auto) return { ...it, corteId: auto.corteId, corte: auto.corte };
      const dec = decisiones[clave];
      const pend = pendientes.find((p) => p.textoNorm === clave);
      const d = dec || (pend ? decisionInicial(pend, catalogo) : null);
      if (d && decisionCompleta(d)) {
        const nombre = d.modo === 'nuevo' ? d.nombreNuevo.trim() : catalogo.find((c) => c.id === d.corteId)?.nombre;
        return { ...it, corteId: d.corteId || `nuevo:${clave}`, corte: nombre };
      }
      return it;
    });
    return totalesPesada(items).cortes;
  }, [pesada.pesadas, autoResueltos, decisiones, pendientes, catalogo]);

  // Avisos: cortes que nunca entraron de este proveedor (según el historial de Mercadería).
  // No bloquean: sirven para detectar un corte mal elegido o un error de carga.
  const habituales = useMemo(
    () => (historialListo ? cortesHabituales(usoCortesDe(pesada.proveedorId || null, pesada.proveedor), catalogo) : []),
    [historialListo, usoCortesDe, pesada.proveedorId, pesada.proveedor, catalogo]
  );

  /** Pista sutil: qué corte podría ser, según lo que ese proveedor suele traer. */
  const pistaPara = (nombre) => {
    const parecidos = habitualesParecidos(nombre, habituales).slice(0, 2).map((h) => h.corte.nombre);
    if (parecidos.length > 0) return `¿Será ${parecidos.join(' o ')}? Suele entrar de ${pesada.proveedor}.`;
    const top = habituales.slice(0, 3).map((h) => h.corte.nombre);
    if (top.length > 0) return `De ${pesada.proveedor} suelen entrar: ${top.join(', ')}.`;
    return '';
  };

  const { primeraCompra, avisosCorte } = useMemo(() => {
    if (!historialListo) return { primeraCompra: false, avisosCorte: {} };
    const uso = usoCortesDe(pesada.proveedorId || null, pesada.proveedor);
    if (!uso) return { primeraCompra: true, avisosCorte: {} };
    const avisos = {};
    cortesFinales.forEach((c) => {
      if (c.pendiente) return;
      const clave = normalizarNombre(c.corte);
      if (uso[clave]) return;
      avisos[c.corte] = { kg: c.kg, enOtros: (usoGlobalCortes[clave] || 0) > 0 };
    });
    return { primeraCompra: false, avisosCorte: avisos };
  }, [cortesFinales, historialListo, usoCortesDe, usoGlobalCortes, pesada.proveedor, pesada.proveedorId]);
  const listaAvisos = Object.entries(avisosCorte);

  const atipicos = cortesFinales.filter((c) => {
    const precio = Number(String(precios[c.corte] ?? '').replace(',', '.'));
    if (!(precio > 0) || c.pendiente) return false;
    const ref = referenciaPara(pesada.proveedorId || null, pesada.proveedor, c.corte);
    return ref && precio > ref * FACTOR_PRECIO_ATIPICO;
  });

  const confirmar = async () => {
    if (!todasResueltas) {
      setError('Resolvé todos los cortes marcados antes de ingresar');
      return;
    }
    if (atipicos.length > 0 && !avisado) {
      setAvisado(true);
      setError('Hay precios muy por encima del habitual. Revisalos o tocá de nuevo para ingresar igual.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const decisionesFinales = Object.fromEntries(pendientes.map((p) => [p.textoNorm, decisionDe(p)]));
      await onConfirmar({ decisiones: decisionesFinales, precios });
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo ingresar. Probá de nuevo');
      setGuardando(false);
    }
  };

  return (
    <>
      <div onClick={() => !guardando && onCancelar()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1060 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(620px, 94vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: '#fff', borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1061, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Ingresar a Mercadería
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
            {pesada.proveedor} · {pesada.dia || ''}
          </div>
        </div>

        <div style={{ padding: '14px 20px', overflowY: 'auto' }}>
          {(primeraCompra || listaAvisos.length > 0) && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
              padding: '10px 12px', marginBottom: 14, fontSize: '0.86rem', color: '#92400e',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Revisá antes de ingresar</div>
              {primeraCompra && (
                <div>Es la primera vez que se ingresa mercadería de <strong>{pesada.proveedor}</strong>.</div>
              )}
              {listaAvisos.map(([nombre, a]) => (
                <div key={nombre}>
                  Nunca entró <strong>{nombre}</strong> de {pesada.proveedor}
                  {a.enOtros ? ' (sí entró de otros proveedores)' : ' (ni de ningún otro proveedor)'}
                  {' · '}{formatKg(a.kg)}.
                  {pistaPara(nombre) ? (
                    <div style={{ fontSize: '0.78rem', color: '#a16207', opacity: 0.85 }}>{pistaPara(nombre)}</div>
                  ) : null}
                </div>
              ))}
              {listaAvisos.length > 0 && (
                <div style={{ marginTop: 4, color: '#a16207' }}>
                  Si es correcto, ingresalo igual. Si no, cancelá y corregí el corte en la pesada.
                </div>
              )}
            </div>
          )}

          {pendientes.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700, color: '#3a5060' }}>Revisar cortes</div>
                <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                  {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {pendientes.map((p) => (
                  <ResolverCorte
                    key={p.textoNorm}
                    pendiente={p}
                    catalogo={catalogo}
                    categorias={categorias}
                    habituales={habituales}
                    proveedor={pesada.proveedor}
                    decision={decisionDe(p)}
                    onChange={(d) => { setDecisiones((prev) => ({ ...prev, [p.textoNorm]: d })); setError(''); }}
                  />
                ))}
              </div>
            </>
          )}

          <div style={{ fontWeight: 700, color: '#3a5060', marginTop: pendientes.length > 0 ? 18 : 0 }}>
            Precios <span style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.8rem' }}>(opcional, se puede completar en Mercadería)</span>
          </div>
          <table className="table table-sm" style={{ marginTop: 6, marginBottom: 0, fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ color: '#6c757d', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th>Corte</th>
                <th style={{ textAlign: 'right' }}>Kg</th>
                <th style={{ textAlign: 'right', width: 130 }}>$ / kg</th>
              </tr>
            </thead>
            <tbody>
              {cortesFinales.map((c) => {
                const ref = c.pendiente ? null : referenciaPara(pesada.proveedorId || null, pesada.proveedor, c.corte);
                const marcado = atipicos.some((a) => a.corte === c.corte);
                return (
                  <tr key={c.corte}>
                    <td>
                      {c.corte}{c.pendiente ? <span style={{ color: '#b45309' }}> ⚠</span> : null}
                      {avisosCorte[c.corte] ? (
                        <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
                          ⚠ nunca entró de {pesada.proveedor}
                          {pistaPara(c.corte) ? <span style={{ color: '#9ca3af' }}> · {pistaPara(c.corte)}</span> : null}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatKg(c.kg)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="form-control form-control-sm"
                        style={{ textAlign: 'right', borderColor: marcado ? '#f59e0b' : undefined }}
                        placeholder={ref ? `~ ${Math.round(ref)}` : '0'}
                        value={precios[c.corte] ?? ''}
                        onChange={(e) => { setPrecios((prev) => ({ ...prev, [c.corte]: e.target.value })); setAvisado(false); setError(''); }}
                        disabled={c.pendiente}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #f3f4f6' }}>
          {error && <div style={{ color: '#b45309', fontSize: '0.84rem', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={guardando} onClick={onCancelar}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={guardando || !todasResueltas}
              onClick={confirmar}
              style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 600, borderRadius: 8 }}
            >
              {guardando ? 'Ingresando…' : (avisado && atipicos.length > 0 ? 'Ingresar igual' : 'Confirmar e ingresar')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IngresarMercaderiaModal;
