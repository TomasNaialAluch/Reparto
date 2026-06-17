import React, { useState } from 'react';
import { formatDateSafe } from '../utils/date';
import { parseCurrencyValue } from '../utils/money';
import { IconEdit, IconPrinter, IconTrash, IconChevronDown, IconBox } from './gestionSemanal/icons';

const ClienteDeudorCard = ({ cliente, onDelete, onEdit, onPrint }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const totalDeuda = cliente.saldoFinal || cliente.finalBalance || 0;
  const esAFavor = totalDeuda > 0;

  const totalBoletasAmount   = cliente.totalBoletas      || cliente.boletas?.reduce((s, b) => s + parseCurrencyValue(b.amount), 0) || 0;
  const totalVentasAmount    = cliente.totalVentas       || cliente.ventas?.reduce((s, v) => s + parseCurrencyValue(v.amount), 0) || 0;
  const totalPlataAmount     = cliente.totalPlata        || cliente.plataFavor?.reduce((s, p) => s + parseCurrencyValue(p.amount), 0) || 0;
  const totalEfectivoAmount  = cliente.totalEfectivo     || cliente.efectivo?.reduce((s, p) => s + parseCurrencyValue(p.amount), 0) || 0;
  const totalChequeAmount    = cliente.totalCheque       || cliente.cheques?.reduce((s, c) => s + parseCurrencyValue(c.amount), 0) || 0;
  const totalTransAmount     = cliente.totalTransferencia|| cliente.transferencias?.reduce((s, t) => s + parseCurrencyValue(t.amount), 0) || 0;
  const totalIngresosAmount  = cliente.totalIngresos     || (totalVentasAmount + totalPlataAmount + totalEfectivoAmount + totalChequeAmount + totalTransAmount);

  const totalBoletas = cliente.boletas?.length || 0;
  const totalVentas  = cliente.ventas?.length  || 0;
  const totalPagos   = (cliente.plataFavor?.length || 0)
                     + (cliente.efectivo?.length   || 0)
                     + (cliente.cheques?.length    || 0)
                     + (cliente.transferencias?.length || 0);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      nombreCliente: cliente.nombreCliente,
      saldoFinal: totalDeuda
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const accentColor  = esAFavor ? '#28a745' : '#dc3545';
  const amountBg     = esAFavor ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)';
  const amountColor  = esAFavor ? '#1a5c2a' : '#8b1c26';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        borderRadius: '12px',
        background: 'white',
        border: '1px solid #d3d9de',
        borderLeft: `3px solid ${accentColor}`,
        marginBottom: '8px',
        overflow: 'hidden',
        cursor: 'grab',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '11px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529', lineHeight: 1.2, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cliente.nombreCliente}
          </div>
          <div style={{ fontSize: '0.71rem', color: '#6c757d' }}>
            {formatDateSafe(cliente.fecha)} · {totalBoletas + totalVentas} transacciones
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: amountBg, color: amountColor, fontWeight: 700, fontSize: '0.8rem', padding: '3px 10px', borderRadius: '999px', marginBottom: '2px' }}>
              {formatCurrency(Math.abs(totalDeuda))}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#6c757d', textAlign: 'center' }}>
              {esAFavor ? 'A tu favor' : 'Debo'}
            </div>
          </div>
          <span className="d-inline-flex" style={{ color: '#6c757d', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)', flexShrink: 0 }}>
            <IconChevronDown size={14} />
          </span>
        </div>
      </div>

      <div style={{
        maxHeight: isExpanded ? '700px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #dde2e6' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', margin: '12px 0' }}>
            {[
              { label: 'Boletas/Ventas', value: totalBoletas + totalVentas, color: '#e6a817' },
              { label: 'Pagos',          value: totalPagos,                 color: '#6A8899' },
              { label: 'Estado',         value: esAFavor ? 'A favor' : 'Debo', color: accentColor },
            ].map(({ label, value, color }, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '6px 0', borderRight: i < 2 ? '1px solid #dde2e6' : 'none' }}>
                <div style={{ fontSize: '0.67rem', color: '#6c757d', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', border: '1px solid #dde2e6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: totalChequeAmount + totalEfectivoAmount + totalTransAmount > 0 ? '8px' : 0 }}>
              <div>
                <div style={{ fontSize: '0.67rem', color: '#6c757d' }}>Total Boletas</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e6a817' }}>{formatCurrency(totalBoletasAmount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.67rem', color: '#6c757d' }}>Total Ingresos</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#28a745' }}>{formatCurrency(totalIngresosAmount)}</div>
              </div>
            </div>
            {(totalChequeAmount + totalEfectivoAmount + totalTransAmount > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', paddingTop: '8px', borderTop: '1px solid #dde2e6' }}>
                {[
                  { label: 'Cheques',       value: totalChequeAmount,   color: '#17a2b8' },
                  { label: 'Efectivo',      value: totalEfectivoAmount, color: '#6A8899' },
                  { label: 'Transferencia', value: totalTransAmount,    color: '#6c757d' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.64rem', color: '#6c757d' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color }}>{formatCurrency(value)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Detalle de Transacciones
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>

              {cliente.boletas?.map((boleta, i) => (
                <TransaccionRow key={`b-${i}`} tipo="Boleta" monto={parseCurrencyValue(boleta.amount)} fecha={boleta.date}
                  bg="rgba(255,209,102,0.12)" color="#e6a817"
                  badge={boleta.esDeMercaderia ? <IconBox size={10} /> : null} formatCurrency={formatCurrency} />
              ))}
              {cliente.ventas?.map((v, i) => (
                <TransaccionRow key={`v-${i}`} tipo="Venta" monto={parseCurrencyValue(v.amount)} fecha={v.date}
                  bg="rgba(255,209,102,0.12)" color="#e6a817" formatCurrency={formatCurrency} />
              ))}
              {cliente.plataFavor?.map((p, i) => (
                <TransaccionRow key={`p-${i}`} tipo="Plata a favor" monto={parseCurrencyValue(p.amount)} fecha={p.date}
                  bg="rgba(40,167,69,0.08)" color="#28a745" formatCurrency={formatCurrency} />
              ))}
              {cliente.efectivo?.map((p, i) => (
                <TransaccionRow key={`e-${i}`} tipo="Efectivo" monto={parseCurrencyValue(p.amount)}
                  bg="rgba(40,167,69,0.08)" color="#28a745" formatCurrency={formatCurrency} />
              ))}
              {cliente.cheques?.map((c, i) => (
                <TransaccionRow key={`c-${i}`} tipo={`Cheque${c.id ? ` #${c.id}` : ''}`} monto={parseCurrencyValue(c.amount)}
                  bg="rgba(23,162,184,0.08)" color="#17a2b8" formatCurrency={formatCurrency} />
              ))}
              {cliente.transferencias?.map((t, i) => (
                <TransaccionRow key={`t-${i}`} tipo="Transferencia" monto={parseCurrencyValue(t.amount)}
                  bg="rgba(108,117,125,0.08)" color="#6c757d" formatCurrency={formatCurrency} />
              ))}

              {!cliente.boletas?.length && !cliente.ventas?.length && !cliente.plataFavor?.length &&
               !cliente.efectivo?.length && !cliente.cheques?.length && !cliente.transferencias?.length && (
                <div style={{ textAlign: 'center', color: '#6c757d', padding: '8px', fontSize: '0.75rem' }}>
                  Sin transacciones registradas
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <ActionBtn onClick={(e) => { e.stopPropagation(); onEdit(cliente); }} borderColor="#6A8899" color="#3a5060">
              <IconEdit size={12} /> Editar
            </ActionBtn>
            <button
              onClick={(e) => { e.stopPropagation(); onPrint(cliente); }}
              title="Imprimir"
              className="d-inline-flex align-items-center justify-content-center"
              style={{ border: '1px solid #ccd3d9', borderRadius: '8px', padding: '6px 11px', background: 'transparent', color: '#6c757d', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <IconPrinter size={13} />
            </button>
            <ActionBtn onClick={(e) => { e.stopPropagation(); onDelete(cliente.id); }} borderColor="#dc3545" color="#dc3545">
              <IconTrash size={12} /> Eliminar
            </ActionBtn>
          </div>

        </div>
      </div>
    </div>
  );
};

const TransaccionRow = ({ tipo, monto, fecha, bg, color, badge, formatCurrency }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', background: bg }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color }}>{tipo}</span>
      {badge && <span style={{ display: 'inline-flex', color: '#6A8899' }} title="Mercadería">{badge}</span>}
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#212529' }}>{formatCurrency(monto)}</div>
      {fecha && <div style={{ fontSize: '0.64rem', color: '#6c757d' }}>{fecha}</div>}
    </div>
  </div>
);

const ActionBtn = ({ onClick, borderColor, color, children }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '6px 10px',
      background: 'transparent', color, fontSize: '0.78rem', fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
    }}
  >
    {children}
  </button>
);

export default ClienteDeudorCard;
