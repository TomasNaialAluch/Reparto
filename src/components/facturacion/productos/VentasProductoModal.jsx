import { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/money';
import { IconX, IconChart, IconMoney } from '../../gestionSemanal/icons';
import { obtenerVentasPeriodoActual } from './estadisticasProducto';

const Tarjeta = ({ Icon, label, valor, sub }) => (
  <div style={{
    flex: 1, background: '#f8f9fa', borderRadius: '10px', padding: '16px 18px',
    borderLeft: '3px solid #6A8899', display: 'flex', alignItems: 'center', gap: '14px', minWidth: '180px',
  }}>
    <span style={{ display: 'flex', color: '#6A8899', flexShrink: 0 }}><Icon size={24} /></span>
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#212529', lineHeight: 1.15 }}>
        {valor}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </div>
  </div>
);

export default function VentasProductoModal({ producto, onClose }) {
  const [granularidad, setGranularidad] = useState('semana'); // 'semana' | 'mes'

  const { label, kilos, totalPlata, ventas } = useMemo(
    () => obtenerVentasPeriodoActual(producto.descripcion, granularidad),
    [producto.descripcion, granularidad]
  );

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(560px, 95vw)',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        zIndex: 1051,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Ventas del producto
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
              {producto.descripcion}
            </div>
          </div>
          <button onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#6c757d' }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 22px' }}>
          {/* Toggle Semana / Mes */}
          <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px', marginBottom: '16px', maxWidth: '220px' }}>
            {[['semana', 'Semana actual'], ['mes', 'Mes actual']].map(([val, txt]) => (
              <button key={val} onClick={() => setGranularidad(val)}
                style={{
                  flex: 1, border: 'none', borderRadius: '8px', padding: '6px 10px',
                  fontSize: '0.75rem', fontWeight: granularidad === val ? 600 : 400,
                  background: granularidad === val ? 'white' : 'transparent',
                  color: granularidad === val ? '#212529' : '#6c757d',
                  boxShadow: granularidad === val ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>
                {txt}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '10px' }}>
            {label} · {ventas} venta{ventas !== 1 ? 's' : ''}
          </div>

          {/* Tarjetas de resultado */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Tarjeta
              Icon={IconChart}
              label="Kilos vendidos"
              valor={kilos.toFixed(kilos % 1 === 0 ? 0 : 1)}
            />
            <Tarjeta
              Icon={IconMoney}
              label="Total en pesos"
              valor={formatCurrency(totalPlata)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
