import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../../utils/money';
import { IconX, IconHistory, IconCheck } from '../../gestionSemanal/icons';

const th = {
  textAlign: 'left', padding: '6px 8px', fontSize: '0.64rem', fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid #d3d9de', whiteSpace: 'nowrap',
};

const td = {
  padding: '7px 8px', fontSize: '0.78rem', color: '#212529',
  whiteSpace: 'nowrap',
};

export default function HistorialPrecioClienteModal({ clienteNombre, productoLabel, historial, onSeleccionar, onClose }) {
  const [seleccionado, setSeleccionado] = useState(0);
  const filaRefs = useRef([]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSeleccionado(prev => Math.min(prev + 1, historial.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSeleccionado(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (historial[seleccionado]) onSeleccionar(historial[seleccionado].precioUnit);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seleccionado, historial, onSeleccionar, onClose]);

  useEffect(() => {
    filaRefs.current[seleccionado]?.scrollIntoView({ block: 'nearest' });
  }, [seleccionado]);

  return createPortal(
    <>
      {/* Click afuera cierra sin elegir nada */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1070 }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(400px, 92vw)', background: 'white', borderRadius: '12px',
        boxShadow: '0 20px 44px rgba(0,0,0,0.26)', border: '1px solid #d3d9de',
        zIndex: 1071, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historial de precio · {clienteNombre || 'Cliente'}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {productoLabel || 'Producto'}
            </div>
          </div>
          <button onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', color: '#6c757d', flexShrink: 0 }}>
            <IconX size={13} />
          </button>
        </div>

        <div style={{ maxHeight: '280px', overflowY: 'auto', overflowX: 'auto' }}>
          {historial.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '24px', color: '#9ca3af', textAlign: 'center' }}>
              <IconHistory size={20} />
              <span style={{ fontSize: '0.78rem' }}>Elegí un cliente y un producto para ver precios anteriores.</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
                  <th style={th}>Comprobante</th>
                  <th style={{ ...th, textAlign: 'right' }}>$ Unit.</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}
                    ref={(el) => { filaRefs.current[i] = el; }}
                    onClick={() => setSeleccionado(i)}
                    onDoubleClick={() => onSeleccionar(h.precioUnit)}
                    style={{
                      cursor: 'pointer',
                      background: seleccionado === i ? '#6A8899' : 'transparent',
                      color: seleccionado === i ? 'white' : '#212529',
                    }}
                  >
                    <td style={td}>{new Date(h.fecha).toLocaleDateString('es-AR')}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{h.cantidad}</td>
                    <td style={td}>{h.numeroFactura}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(h.precioUnit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '0.66rem', color: '#9ca3af' }}>
            ↑↓ para moverte · Esc para cerrar
          </span>
          <button
            onClick={() => historial[seleccionado] && onSeleccionar(historial[seleccionado].precioUnit)}
            disabled={historial.length === 0}
            className="d-inline-flex align-items-center gap-2"
            style={{
              border: 'none', borderRadius: '8px', padding: '7px 14px',
              background: historial.length === 0 ? '#e9ecef' : '#6A8899',
              color: historial.length === 0 ? '#9ca3af' : 'white',
              fontWeight: 700, fontSize: '0.78rem',
              cursor: historial.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <IconCheck size={13} /> Usar precio
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
