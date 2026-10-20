import React, { useEffect, useRef, useState } from 'react';
import { codigoReferencia } from '../utils/cuentaContacto';
import { descargarTicketPdf, descargarTicketPng, imprimirTicket } from '../utils/exportarTicket';

// Boleta de ingreso de mercadería con aspecto de TICKET: papel angosto con borde dentado,
// tipografía monoespaciada y datos que dan confianza de que quedó registrado
// (sello, código de referencia, fecha y hora de carga, marca de modificación).

const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace";

const dinero = (n) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(n || 0);

const fechaHora = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
};

const Linea = () => (
  <div style={{ borderTop: '1px dashed #9aa5ad', margin: '10px 0' }} />
);

const Fila = ({ etiqueta, valor, fuerte }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: fuerte ? '0.95rem' : '0.82rem', fontWeight: fuerte ? 700 : 400 }}>
    <span style={{ color: fuerte ? '#212529' : '#5f6b73' }}>{etiqueta}</span>
    <span style={{ textAlign: 'right', color: '#212529' }}>{valor}</span>
  </div>
);

const IconoSvg = ({ children }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONOS = {
  imprimir: (
    <IconoSvg>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </IconoSvg>
  ),
  imagen: (
    <IconoSvg>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </IconoSvg>
  ),
  pdf: (
    <IconoSvg>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <polyline points="9 15 12 18 15 15" />
    </IconoSvg>
  ),
};

/** Botones para imprimir el ticket o descargarlo como imagen / PDF. */
const AccionesTicket = ({ nodoRef, compra }) => {
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState('');
  const nombre = `comprobante-${compra.proveedor || compra.subtitulo || 'ingreso'}-${codigoReferencia(compra.entradaId)}`;

  const ejecutar = async (clave, fn) => {
    if (ocupado || !nodoRef.current) return;
    setError('');
    setOcupado(clave);
    try {
      await fn(nodoRef.current, nombre);
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el comprobante. Probá de nuevo');
    } finally {
      setOcupado('');
    }
  };

  const boton = (clave, etiqueta, fn, principal) => (
    <button
      key={clave}
      type="button"
      disabled={!!ocupado}
      onClick={() => ejecutar(clave, fn)}
      style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        padding: '9px 10px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
        border: principal ? '1px solid #6A8899' : '1px solid rgba(106,136,153,0.45)',
        background: principal ? '#6A8899' : '#fff',
        color: principal ? '#fff' : '#3a5060',
        opacity: ocupado && ocupado !== clave ? 0.55 : 1,
      }}
    >
      {ICONOS[clave]} {ocupado === clave ? 'Generando…' : etiqueta}
    </button>
  );

  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {boton('imprimir', 'Imprimir', imprimirTicket, true)}
        {boton('imagen', 'Imagen', descargarTicketPng, false)}
        {boton('pdf', 'PDF', descargarTicketPdf, false)}
      </div>
      {error && <div style={{ color: '#b45309', fontSize: '0.78rem', marginTop: '6px', textAlign: 'center' }}>{error}</div>}
    </div>
  );
};

/** Papel del ticket (reutilizable: modal, tarjeta expandida, ficha). `acciones` agrega los botones de imprimir/descargar. */
export const BoletaTicket = ({ compra, innerRef, acciones = false, sombra = 'drop-shadow(0 12px 24px rgba(0,0,0,0.25))' }) => {
  const propioRef = useRef(null);
  const nodoRef = innerRef || propioRef;
  const promedio = compra.kg > 0 ? compra.costo / compra.kg : 0;
  const sinPrecios = compra.costo === 0;

  // Borde dentado (sierra) arriba y abajo, dibujado con gradientes.
  const sierra = (arriba) => ({
    height: '10px',
    background: arriba
      ? 'linear-gradient(135deg, transparent 5px, #fff 0) -5px 0, linear-gradient(225deg, transparent 5px, #fff 0) -5px 0'
      : 'linear-gradient(315deg, transparent 5px, #fff 0) -5px 0, linear-gradient(45deg, transparent 5px, #fff 0) -5px 0',
    backgroundSize: '10px 10px',
    backgroundRepeat: 'repeat-x',
  });

  return (
    <>
    <div ref={nodoRef} style={{ filter: sombra, fontFamily: MONO }}>
            <div style={sierra(true)} />
            <div style={{ background: '#fff', padding: '14px 20px', color: '#212529' }}>
              {/* Encabezado */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.95rem' }}>COMPROBANTE DE INGRESO</div>
                <div style={{ fontSize: '0.72rem', color: '#5f6b73', marginTop: '2px' }}>{compra.subtitulo || 'Mercadería · Carne'}</div>
              </div>

              <Linea />

              {compra.proveedor && <Fila etiqueta="Proveedor" valor={<strong>{compra.proveedor}</strong>} />}
              <Fila etiqueta="Día" valor={compra.dia || '—'} />
              <Fila etiqueta="Cargada" valor={fechaHora(compra.timestamp)} />
              {compra.entradaId && <Fila etiqueta="Referencia" valor={<strong>{codigoReferencia(compra.entradaId)}</strong>} />}

              <Linea />

              {/* Detalle */}
              {(compra.cortes || []).map((c, i) => {
                const sub = (Number(c.kg) || 0) * (Number(c.precioKg) || 0);
                return (
                  <div key={i} style={{ marginBottom: '8px', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 700 }}>{c.corte}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5f6b73' }}>
                      <span>
                        {(Number(c.kg) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })} kg
                        {c.precioKg ? ` × ${dinero(c.precioKg)}` : ''}
                      </span>
                      <span style={{ color: '#212529' }}>{c.precioKg ? dinero(sub) : 'sin precio'}</span>
                    </div>
                  </div>
                );
              })}

              <Linea />

              <Fila etiqueta="TOTAL KG" valor={`${compra.kg.toLocaleString('es-AR', { minimumFractionDigits: 2 })} kg`} fuerte />
              <Fila etiqueta="TOTAL $" valor={sinPrecios ? 'sin precios' : dinero(compra.costo)} fuerte />
              {!sinPrecios && <Fila etiqueta="Prom./kg" valor={dinero(promedio)} />}

              <Linea />

              {/* Estado y sello */}
              {!compra.sinEstadoPago && (
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <div style={{
                  display: 'inline-block', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em',
                  padding: '3px 12px', borderRadius: '4px',
                  background: compra.pagada ? 'rgba(40,167,69,0.14)' : compra.semanaCerrada ? 'rgba(108,117,125,0.14)' : 'rgba(230,168,23,0.18)',
                  color: compra.pagada ? '#1a5c2a' : compra.semanaCerrada ? '#5f6b73' : '#7a5000',
                }}>
                  {compra.pagada ? 'PAGADA' : compra.semanaCerrada ? 'SIN MARCAR COMO PAGADA' : 'PENDIENTE DE PAGO'}
                </div>
              </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 4px' }}>
                <div style={{
                  transform: 'rotate(-4deg)', border: '2px solid #1f8a3a', color: '#1f8a3a', borderRadius: '6px',
                  padding: '4px 12px', fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.25,
                }}>
                  ✓ REGISTRADO
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.02em' }}>{fechaHora(compra.timestamp)}</div>
                </div>
              </div>

              {compra.modificadoEn && (
                <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#7a5000', marginTop: '6px' }}>
                  Modificada el {fechaHora(compra.modificadoEn)}
                </div>
              )}
              <div style={{ textAlign: 'center', fontSize: '0.64rem', color: '#9aa5ad', marginTop: '8px' }}>
                Comprobante interno · no válido como factura
              </div>
            </div>
            <div style={sierra(false)} />
    </div>
    {acciones && <AccionesTicket nodoRef={nodoRef} compra={compra} />}
    </>
  );
};

/**
 * Props:
 *  - isOpen, onClose
 *  - compra: { proveedor, dia, timestamp, modificadoEn, cortes, kg, costo, pagada, entradaId }
 */
const BoletaTicketModal = ({ isOpen, onClose, compra }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !compra) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1070 }}
      />
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1071, overflowY: 'auto',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 12px', pointerEvents: 'none',
      }}>
        <div style={{ width: 'min(380px, 100%)', pointerEvents: 'auto' }}>
          <BoletaTicket compra={compra} acciones />

          <button
            type="button"
            onClick={onClose}
            style={{ width: '100%', marginTop: '8px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '10px', padding: '9px', fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
};

export default BoletaTicketModal;



