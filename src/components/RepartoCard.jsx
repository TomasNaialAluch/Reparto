import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { formatDateSafe } from '../utils/date';

const RepartoCard = ({ reparto, onDelete, onEdit, onPrint }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatCurrency = (value) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value);

  const totalReparto      = reparto.total || reparto.clientes?.reduce((s, c) => s + parseFloat(c.billAmount || 0), 0) || 0;
  const cantidadClientes  = reparto.cantidad || reparto.clientes?.length || 0;
  const clientesPagados   = reparto.clientes?.filter(c => c.paymentStatus === 'paid').length    || 0;
  const clientesPendientes= reparto.clientes?.filter(c => c.paymentStatus === 'pending').length  || 0;
  const clientesParciales = reparto.clientes?.filter(c => c.paymentStatus === 'partial').length  || 0;

  const todoPagado   = clientesPendientes === 0 && clientesParciales === 0 && cantidadClientes > 0;
  const accentColor  = todoPagado ? '#28a745' : '#e6a817';
  const countBg      = todoPagado ? 'rgba(40,167,69,0.1)'  : 'rgba(230,168,23,0.12)';
  const countColor   = todoPagado ? '#1a5c2a'              : '#7a5000';

  // Estado de pago por cliente
  const paymentPill = (status) => {
    const map = {
      paid:    { label: 'Pagado',   bg: 'rgba(40,167,69,0.12)',   color: '#28a745' },
      partial: { label: 'Parcial',  bg: 'rgba(230,168,23,0.12)',  color: '#e6a817' },
      pending: { label: 'Pendiente',bg: 'rgba(108,117,125,0.1)',  color: '#6c757d' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 600, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '999px' }}>
        {s.label}
      </span>
    );
  };

  return (
    <>
      <div style={{
        borderRadius: '12px', background: 'white',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
        marginBottom: '8px', overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease',
      }}>

        {/* ── Header ── */}
        <div onClick={() => setIsExpanded(!isExpanded)}
          style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', userSelect: 'none' }}>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#212529', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Reparto {formatDateSafe(reparto.date)}
            </div>
            <div style={{ fontSize: '0.71rem', color: '#6c757d' }}>
              {cantidadClientes} {cantidadClientes === 1 ? 'cliente' : 'clientes'} · {formatCurrency(totalReparto)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: countBg, color: countColor, fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', marginBottom: '2px' }}>
                {clientesPagados}/{cantidadClientes} pagados
              </div>
              {clientesPendientes > 0 && (
                <div style={{ fontSize: '0.67rem', color: '#9ca3af', textAlign: 'center' }}>
                  {clientesPendientes} pendiente{clientesPendientes !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* ── Cuerpo expandible ── */}
        <div style={{ maxHeight: isExpanded ? '600px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)' }}>
          <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f3f4f6' }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', margin: '12px 0' }}>
              {[
                { label: 'Total',      value: formatCurrency(totalReparto), color: '#212529', small: true },
                { label: 'Clientes',   value: cantidadClientes,             color: '#212529' },
                { label: 'Pagados',    value: clientesPagados,              color: '#28a745' },
                { label: 'Pendientes', value: clientesPendientes,           color: clientesPendientes > 0 ? '#e6a817' : '#9ca3af' },
              ].map(({ label, value, color, small }, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '6px 0', borderRight: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ fontSize: '0.67rem', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: small ? '0.72rem' : '0.85rem', color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Lista de clientes */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Clientes
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {reparto.clientes?.map((client, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderRadius: '8px',
                    background: client.paymentStatus === 'paid'    ? 'rgba(40,167,69,0.06)'  :
                                client.paymentStatus === 'partial'  ? 'rgba(230,168,23,0.08)' : '#f8f9fa',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#212529' }}>{client.clientName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{formatCurrency(client.billAmount)}</div>
                    </div>
                    {paymentPill(client.paymentStatus)}
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={(e) => { e.stopPropagation(); onEdit(reparto); }}
                style={{ flex: 1, border: '1px solid #6A8899', borderRadius: '8px', padding: '6px 10px', background: 'transparent', color: '#3a5060', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <i className="fas fa-edit" style={{ fontSize: '0.72rem' }}></i> Editar
              </button>
              <button onClick={(e) => { e.stopPropagation(); onPrint(reparto); }} title="Imprimir"
                style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '6px 11px', background: 'transparent', color: '#6c757d', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                <i className="fas fa-print"></i>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                style={{ flex: 1, border: '1px solid #dc3545', borderRadius: '8px', padding: '6px 10px', background: 'transparent', color: '#dc3545', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <i className="fas fa-trash" style={{ fontSize: '0.72rem' }}></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { onDelete(reparto.id); setShowDeleteModal(false); }}
        title="Eliminar Reparto"
        message={`¿Eliminás el reparto del ${formatDateSafe(reparto.date)}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
      />
    </>
  );
};

export default RepartoCard;
