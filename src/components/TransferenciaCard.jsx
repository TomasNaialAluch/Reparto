import React, { useState } from 'react';

const TransferenciaCard = ({ transferencia, onDelete, onEdit, onPrint }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const formatCurrency = (value) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);

  const formatDate = (dateString) => {
    if (dateString && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const saldo = transferencia.saldoFinal || 0;
  const totalItems = (transferencia.transferencias?.length || 0) + (transferencia.boletas?.length || 0);
  const esAFavor = saldo > 0;
  const saldado = saldo === 0;

  const accentColor = esAFavor ? '#28a745' : saldado ? '#6c757d' : '#dc3545';
  const pillBg    = esAFavor ? 'rgba(40,167,69,0.1)'  : saldado ? 'rgba(108,117,125,0.1)' : 'rgba(220,53,69,0.1)';
  const pillColor = esAFavor ? '#28a745' : saldado ? '#6c757d' : '#dc3545';

  return (
    <div style={{
      borderRadius: '12px', background: 'white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderLeft: `3px solid ${accentColor}`,
      marginBottom: '8px', overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div onClick={() => setIsExpanded(!isExpanded)}
        style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {transferencia.nombreCliente}
          </div>
          <div style={{ fontSize: '0.71rem', color: '#9ca3af', marginTop: '2px' }}>
            {formatDate(transferencia.fecha)} · {totalItems} {totalItems === 1 ? 'transacción' : 'transacciones'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
          {/* Pill de saldo — draggable */}
          <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); setIsDragging(true); e.dataTransfer.setData('text/plain', Math.abs(saldo).toString()); e.dataTransfer.effectAllowed = 'copy'; }}
            onDragEnd={(e) => { e.stopPropagation(); setIsDragging(false); }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Arrastrá este monto al campo de transferencia"
            style={{
              background: pillBg, color: pillColor,
              fontWeight: 700, fontSize: '0.78rem',
              padding: '3px 10px', borderRadius: '999px',
              cursor: isDragging ? 'grabbing' : 'grab',
              opacity: isDragging ? 0.5 : 1,
              transition: 'opacity 0.2s', userSelect: 'none',
            }}>
            {formatCurrency(Math.abs(saldo))}
          </div>
          {/* Chevron SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Cuerpo expandible con max-height transition */}
      <div style={{
        maxHeight: isExpanded ? '600px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6' }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
            {[
              { label: 'Transferencias', value: formatCurrency(transferencia.totalTransferencias || 0), color: '#3a5060', bg: 'rgba(106,136,153,0.07)' },
              { label: 'Boletas',        value: formatCurrency(transferencia.totalBoletas || 0),        color: '#e6a817', bg: 'rgba(230,168,23,0.08)' },
              { label: 'Saldo',          value: formatCurrency(Math.abs(saldo)),                        color: pillColor, bg: pillBg },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.64rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Indicador quién debe a quién */}
          <div style={{
            borderLeft: `3px solid ${accentColor}`,
            background: '#f8f9fa', borderRadius: '6px',
            padding: '7px 10px', marginBottom: '10px', fontSize: '0.75rem', color: '#6c757d',
          }}>
            {esAFavor
              ? <>Le debés <strong style={{ color: '#28a745' }}>{formatCurrency(saldo)}</strong> a {transferencia.nombreCliente}</>
              : saldado
              ? <strong>Cuentas saldadas</strong>
              : <>{transferencia.nombreCliente} te debe <strong style={{ color: '#dc3545' }}>{formatCurrency(Math.abs(saldo))}</strong></>}
          </div>

          {/* Detalle de items */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Detalle</div>
            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {transferencia.transferencias?.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', background: 'rgba(106,136,153,0.08)', borderLeft: '2px solid rgba(106,136,153,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#3a5060' }}>{t.descripcion || `Transferencia ${i + 1}`}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3a5060' }}>{formatCurrency(parseFloat(t.monto) || 0)}</span>
                </div>
              ))}
              {transferencia.boletas?.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', background: 'rgba(230,168,23,0.08)', borderLeft: '2px solid rgba(230,168,23,0.35)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#856404' }}>Boleta {i + 1} · {b.fecha}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e6a817' }}>{formatCurrency(parseFloat(b.monto) || 0)}</span>
                </div>
              ))}
              {!transferencia.transferencias?.length && !transferencia.boletas?.length && (
                <div style={{ textAlign: 'center', padding: '10px 0', color: '#9ca3af', fontSize: '0.75rem' }}>Sin transacciones registradas</div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(transferencia); }}
              style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid #6A8899', background: 'transparent', color: '#3a5060', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              Editar
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPrint(transferencia); }} title="Imprimir"
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer' }}>
              <i className="fas fa-print" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(transferencia.id); }}
              style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid rgba(220,53,69,0.35)', background: 'transparent', color: '#dc3545', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferenciaCard;
