import React, { useEffect, useMemo, useState } from 'react';
import { calcularCuenta, calcularVentasYSaldos, buscarReferencias } from '../utils/cuentaContacto';
import BoletaTicketModal from './BoletaTicketModal';
import { IconX, IconEdit } from './gestionSemanal/icons';

const C = {
  primary: '#6A8899',
  primarySoft: 'rgba(106,136,153,0.1)',
  text: '#212529',
  muted: '#6c757d',
  faint: '#9ca3af',
  border: '#dde2e6',
  danger: '#dc3545',
  green: '#28a745',
};

const dinero = (n) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(n || 0);

const fecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const FILTROS = [['todas', 'Todas'], ['pendientes', 'Sin pagar'], ['pagadas', 'Pagadas']];
const SEMANAS_INICIALES = 6;

/**
 * Ficha de un contacto: qué se le compró, cuánto se le debe y qué ya se pagó.
 * La cuenta se calcula en el momento desde los datos existentes (ver utils/cuentaContacto).
 */
const FichaContactoModal = ({
  contacto, semanas, vinculaciones, saldos = [], facturas = [], personas = [], movimientos = [], cheques = [],
  cargando, onClose, onEditar,
}) => {
  const [seccion, setSeccion] = useState('compras');
  const [filtro, setFiltro] = useState('todas');
  const [verTodas, setVerTodas] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !ticket) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, ticket]);

  const cuenta = useMemo(
    () => (contacto ? calcularCuenta(contacto, semanas, vinculaciones) : null),
    [contacto, semanas, vinculaciones]
  );

  const ventas = useMemo(
    () => (contacto ? calcularVentasYSaldos(contacto, saldos) : null),
    [contacto, saldos]
  );
  const referencias = useMemo(
    () => (contacto ? buscarReferencias(contacto, { facturas, personas, movimientos, cheques }) : null),
    [contacto, facturas, personas, movimientos, cheques]
  );

  const porSemana = useMemo(() => {
    if (!cuenta) return [];
    const visibles = cuenta.compras.filter((c) => (filtro === 'pendientes' ? !c.pagada : filtro === 'pagadas' ? c.pagada : true));
    const mapa = new Map();
    visibles.forEach((c) => {
      if (!mapa.has(c.semanaId)) mapa.set(c.semanaId, { semanaId: c.semanaId, inicio: c.semanaInicio, cerrada: c.semanaCerrada, compras: [] });
      mapa.get(c.semanaId).compras.push(c);
    });
    return [...mapa.values()].sort((a, b) => String(b.inicio || '').localeCompare(String(a.inicio || '')));
  }, [cuenta, filtro]);

  if (!contacto) return null;
  const t = cuenta?.totales;
  const semanasMostradas = verTodas ? porSemana : porSemana.slice(0, SEMANAS_INICIALES);

  const Kpi = ({ etiqueta, valor, color, nota }) => (
    <div style={{ flex: '1 1 130px', background: '#f8f9fa', borderRadius: '10px', padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{etiqueta}</div>
      <div style={{ fontWeight: 700, fontSize: '1.02rem', color: C.text, marginTop: '2px' }}>{valor}</div>
      {nota && <div style={{ fontSize: '0.68rem', color: C.muted }}>{nota}</div>}
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(720px, 96vw)', maxHeight: '92vh', background: '#fff', borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Ficha
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: C.text }}>{contacto.nombre}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
              {contacto.roles?.proveedor && <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 9px', borderRadius: '999px', background: C.primarySoft, color: '#3a5060' }}>Proveedor</span>}
              {contacto.roles?.cliente && <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 9px', borderRadius: '999px', background: C.primarySoft, color: '#3a5060' }}>Cliente</span>}
              {contacto.contacto?.telefono && <span style={{ fontSize: '0.74rem', color: C.muted }}>{contacto.contacto.telefono}</span>}
              {(contacto.alias || []).length > 0 && <span style={{ fontSize: '0.72rem', color: C.faint }}>También: {contacto.alias.join(', ')}</span>}
            </div>
            {contacto.notas && <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '6px' }}>{contacto.notas}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onEditar}
              style={{ border: `1px solid ${C.border}`, background: 'transparent', borderRadius: '8px', padding: '6px 10px', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600 }}
            >
              <IconEdit size={13} /> Editar
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}
            >
              <IconX size={14} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 22px 20px' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '30px', color: C.muted }}>Calculando cuenta…</div>
          ) : (
            <>
              {/* Resumen */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <Kpi
                  etiqueta="Debo (semana en curso)"
                  valor={dinero(t.pendiente)}
                  color={t.pendiente > 0 ? C.danger : C.green}
                  nota={t.entradasPendientes > 0 ? `${t.entradasPendientes} ${t.entradasPendientes === 1 ? 'boleta' : 'boletas'} sin pagar` : 'Al día'}
                />
                <Kpi etiqueta="Pagado" valor={dinero(t.pagado)} color={C.green} nota="Boletas marcadas como pagadas" />
                <Kpi etiqueta="Total comprado" valor={dinero(t.comprado)} color={C.primary} nota={`${Math.round(t.kg)} kg · ${t.entradas} ${t.entradas === 1 ? 'entrada' : 'entradas'}`} />
              </div>

              {t.atipicas > 0 && (
                <div style={{ background: 'rgba(220,53,69,0.08)', color: '#8b1c26', borderRadius: '8px', padding: '7px 11px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {t.atipicas === 1 ? '1 boleta tiene' : `${t.atipicas} boletas tienen`} un precio por kg muy fuera de lo normal
                  (posible error de tipeo). Está marcada en la lista y distorsiona los totales.
                </div>
              )}

              {t.entradasSinMarcar > 0 && (
                <div style={{ background: '#f1f3f5', color: C.muted, borderRadius: '8px', padding: '7px 11px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {t.entradasSinMarcar} {t.entradasSinMarcar === 1 ? 'boleta' : 'boletas'} de semanas cerradas ({dinero(t.sinMarcar)}) no figuran como pagadas.
                  No se cuentan como deuda: es probable que se hayan saldado sin marcarlas en la app.
                </div>
              )}

              {t.sinPrecio > 0 && (
                <div style={{ background: 'rgba(255,209,102,0.18)', color: '#7a5000', borderRadius: '8px', padding: '7px 11px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {t.sinPrecio} {t.sinPrecio === 1 ? 'boleta sin precios' : 'boletas sin precios'}: no suman al total hasta cargarlos.
                </div>
              )}

              {cuenta.saldosAFavor.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Saldos a favor vinculados
                  </div>
                  {cuenta.saldosAFavor.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: 'rgba(40,167,69,0.07)', marginBottom: '4px', fontSize: '0.82rem' }}>
                      <span style={{ color: C.muted }}>
                        {fecha(s.fecha)}{!s.resuelta && <span style={{ color: '#7a5000' }}> · sin vincular a una boleta exacta</span>}
                      </span>
                      <strong style={{ color: '#1a5c2a' }}>{dinero(s.monto)}</strong>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.68rem', color: C.faint }}>
                    Informativo: el descuento se aplica al elegir las boletas en Pagos Proveedores.
                  </div>
                </div>
              )}

              {/* Secciones */}
              <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px', marginBottom: '14px' }}>
                {[['compras', 'Le compré'], ['ventas', 'Le vendí y saldos'], ['otros', 'Otros']].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSeccion(k)}
                    style={{
                      flex: 1, border: 'none', borderRadius: '8px', padding: '6px 8px', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer',
                      fontWeight: seccion === k ? 600 : 400, background: seccion === k ? '#fff' : 'transparent',
                      boxShadow: seccion === k ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', color: seccion === k ? C.text : C.muted,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {seccion === 'compras' && (
              <>
              {/* Mercadería que le compré */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Mercadería que le compré
                </div>
                <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                  {FILTROS.map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setFiltro(k); setVerTodas(false); }}
                      style={{
                        border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer',
                        fontWeight: filtro === k ? 600 : 400, background: filtro === k ? '#fff' : 'transparent',
                        boxShadow: filtro === k ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', color: filtro === k ? C.text : C.muted,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {porSemana.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: C.faint, fontSize: '0.85rem', background: '#f8f9fa', borderRadius: '10px' }}>
                  {t.entradas === 0 ? 'Todavía no hay mercadería cargada para este contacto.' : 'No hay boletas en este filtro.'}
                </div>
              ) : (
                semanasMostradas.map((sem) => {
                  const kgSem = sem.compras.reduce((s, c) => s + c.kg, 0);
                  const costoSem = sem.compras.reduce((s, c) => s + c.costo, 0);
                  return (
                    <div key={sem.semanaId} style={{ marginBottom: '10px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '7px 12px', background: '#f8f9fa', fontSize: '0.76rem' }}>
                        <span style={{ fontWeight: 600, color: '#3a5060' }}>
                          Semana del {fecha(sem.inicio)}{!sem.cerrada && <span style={{ color: C.green, marginLeft: '6px' }}>· en curso</span>}
                        </span>
                        <span style={{ color: C.muted }}>{Math.round(kgSem)} kg · {dinero(costoSem)}</span>
                      </div>
                      {sem.compras.map((c, i) => (
                        <button
                          key={`${c.entradaId || c.index}-${i}`}
                          type="button"
                          onClick={() => setTicket(c)}
                          title="Ver comprobante"
                          style={{
                            width: '100%', textAlign: 'left', border: 'none', borderTop: `1px solid ${C.border}`, background: '#fff',
                            padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.primarySoft; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >
                          <span style={{ minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.84rem', color: C.text }}>{c.dia}</span>
                            <span style={{ marginLeft: '8px', fontSize: '0.74rem', color: C.faint }}>
                              {c.cortes.slice(0, 3).map((x) => x.corte).join(', ')}{c.cortes.length > 3 ? ` +${c.cortes.length - 3}` : ''}
                            </span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.8rem', color: C.muted }}>{Math.round(c.kg)} kg</span>
                            <strong style={{ fontSize: '0.84rem', color: c.precioAtipico ? C.danger : (c.costo ? C.text : '#7a5000') }}>
                              {c.precioAtipico && <span title="Precio por kg muy fuera de lo normal: revisar" style={{ marginRight: '4px' }}>⚠</span>}
                              {c.costo ? dinero(c.costo) : 'sin precios'}
                            </strong>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                              background: c.pagada ? 'rgba(40,167,69,0.12)' : c.semanaCerrada ? 'rgba(108,117,125,0.12)' : 'rgba(230,168,23,0.15)',
                              color: c.pagada ? '#1a5c2a' : c.semanaCerrada ? '#6c757d' : '#7a5000',
                            }}>
                              {c.pagada ? 'Pagada' : c.semanaCerrada ? 'Sin marcar' : 'Pendiente'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}

              {!verTodas && porSemana.length > SEMANAS_INICIALES && (
                <button
                  type="button"
                  onClick={() => setVerTodas(true)}
                  style={{ width: '100%', border: `1px dashed ${C.border}`, background: 'transparent', borderRadius: '8px', padding: '8px', color: C.primary, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Mostrar las {porSemana.length - SEMANAS_INICIALES} semanas anteriores
                </button>
              )}
              </>
              )}

              {seccion === 'ventas' && ventas && (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <Kpi etiqueta="Total vendido" valor={dinero(ventas.totalVendido)} color={C.primary} nota={`${ventas.conVentas} ${ventas.conVentas === 1 ? 'saldo con ventas' : 'saldos con ventas'}`} />
                    <Kpi etiqueta="Saldos hechos" valor={String(ventas.cantidadSaldos)} color={C.faint} nota="En Saldo Proveedores" />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: C.faint, marginBottom: '10px' }}>
                    Las ventas se guardan como monto por fecha, sin detalle de cortes ni kg.
                  </div>
                  {ventas.saldos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: C.faint, fontSize: '0.85rem', background: '#f8f9fa', borderRadius: '10px' }}>
                      No hay saldos con este nombre todavía.
                    </div>
                  ) : (
                    ventas.saldos.map((sd) => (
                      <div key={sd.id} style={{ border: `1px solid ${C.border}`, borderRadius: '10px', padding: '8px 12px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.84rem', color: C.text }}>{fecha(sd.fecha)}</span>
                          <span style={{
                            fontSize: '0.66rem', fontWeight: 700, padding: '2px 9px', borderRadius: '999px',
                            background: sd.saldoFinal > 0 ? 'rgba(40,167,69,0.12)' : sd.saldoFinal < 0 ? 'rgba(220,53,69,0.1)' : 'rgba(108,117,125,0.12)',
                            color: sd.saldoFinal > 0 ? '#1a5c2a' : sd.saldoFinal < 0 ? '#8b1c26' : C.muted,
                          }}>
                            {sd.saldoFinal > 0 ? `A favor ${dinero(sd.saldoFinal)}` : sd.saldoFinal < 0 ? `Debo ${dinero(Math.abs(sd.saldoFinal))}` : 'Saldado'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: C.muted, marginTop: '3px' }}>
                          {sd.totalVentas > 0 ? `Le vendí ${dinero(sd.totalVentas)}` : 'Sin ventas'}
                          {sd.totalBoletas > 0 && <> · Sus boletas {dinero(sd.totalBoletas)}</>}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {seccion === 'otros' && referencias && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.74rem', color: C.faint }}>
                    Otras pantallas donde aparece este nombre. Se cruzan por nombre; no se modificó ningún dato.
                  </div>
                  {[
                    ['Facturación', referencias.facturas > 0
                      ? `${referencias.facturas} ${referencias.facturas === 1 ? 'factura' : 'facturas'} · ${dinero(referencias.totalFacturado)}`
                      : 'Sin facturas'],
                    ['Deudas personales', referencias.deuda
                      ? `${referencias.deuda.movimientos} movimientos · saldo ${dinero(referencias.deuda.saldo)}`
                      : 'Sin movimientos'],
                    ['Libro de cheques', referencias.cheques > 0
                      ? `${referencias.cheques} ${referencias.cheques === 1 ? 'cheque' : 'cheques'}`
                      : 'Sin cheques'],
                  ].map(([titulo, detalle]) => (
                    <div key={titulo} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '0.84rem' }}>
                      <span style={{ fontWeight: 600, color: C.text }}>{titulo}</span>
                      <span style={{ color: C.muted }}>{detalle}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BoletaTicketModal
        isOpen={!!ticket}
        onClose={() => setTicket(null)}
        compra={ticket ? { ...ticket, proveedor: contacto.nombre } : null}
      />
    </>
  );
};

export default FichaContactoModal;




