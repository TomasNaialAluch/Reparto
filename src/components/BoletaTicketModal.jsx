import React, { useEffect, useRef } from 'react';
import { codigoReferencia } from '../utils/cuentaContacto';

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

/** Papel del ticket (reutilizable: modal, tarjeta expandida, ficha). */
export const BoletaTicket = ({ compra, innerRef, sombra = 'drop-shadow(0 12px 24px rgba(0,0,0,0.25))' }) => {
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
    <div ref={innerRef} style={{ filter: sombra, fontFamily: MONO }}>
            <div style={sierra(true)} />
            <div style={{ background: '#fff', padding: '14px 20px', color: '#212529' }}>
              {/* Encabezado */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.95rem' }}>COMPROBANTE DE INGRESO</div>
                <div style={{ fontSize: '0.72rem', color: '#5f6b73', marginTop: '2px' }}>Mercadería · Carne</div>
              </div>

              <Linea />

              <Fila etiqueta="Proveedor" valor={<strong>{compra.proveedor}</strong>} />
              <Fila etiqueta="Día" valor={compra.dia || '—'} />
              <Fila etiqueta="Cargada" valor={fechaHora(compra.timestamp)} />
              <Fila etiqueta="Referencia" valor={<strong>{codigoReferencia(compra.entradaId)}</strong>} />

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
  );
};

/**
 * Props:
 *  - isOpen, onClose
 *  - compra: { proveedor, dia, timestamp, modificadoEn, cortes, kg, costo, pagada, entradaId }
 */
const BoletaTicketModal = ({ isOpen, onClose, compra }) => {
  const ticketRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !compra) return null;

  const imprimir = () => {
    if (!ticketRef.current) return;
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante ${codigoReferencia(compra.entradaId)}</title>
      <style>body{margin:0;padding:16px;background:#fff;display:flex;justify-content:center}@page{margin:8mm}</style></head>
      <body>${ticketRef.current.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

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
          <BoletaTicket compra={compra} innerRef={ticketRef} />

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={imprimir}
              style={{ flex: 1, border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 700, background: '#6A8899', color: '#fff', cursor: 'pointer' }}
            >
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.5)', borderRadius: '10px', padding: '10px', fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoletaTicketModal;



