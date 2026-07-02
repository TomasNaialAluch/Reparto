import { useState } from 'react';
import { formatCurrency } from '../../../utils/money';
import { formatearComprobante } from '../constants';
import { IconReceipt, IconEdit, IconPrinter } from '../../gestionSemanal/icons';
import PrintDocument from '../../PrintDocument';

const th = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.66rem', fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #d3d9de', whiteSpace: 'nowrap',
};

const td = {
  padding: '9px 10px', fontSize: '0.82rem', color: '#212529',
  borderBottom: '1px solid #e1e5e9', whiteSpace: 'nowrap',
};

export default function FacturaDetalle({ factura, onEdit }) {
  const [showPrint, setShowPrint] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', color: '#6A8899' }}><IconReceipt size={20} /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212529' }}>{formatearComprobante(factura.tipo, factura.numero)}</div>
            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>{factura.clienteNombre} · {new Date(factura.fecha).toLocaleDateString('es-AR')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setShowPrint(true)}
            title="Imprimir"
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: '1px solid #ccd3d9', borderRadius: '8px', padding: '7px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <IconPrinter size={13} />
          </button>
          <button onClick={onEdit}
            className="d-inline-flex align-items-center gap-2"
            style={{
              border: 'none', borderRadius: '8px', padding: '7px 14px',
              background: '#6A8899', color: 'white', fontWeight: 600, fontSize: '0.78rem',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#506878'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#6A8899'; }}
          >
            <IconEdit size={12} /> Editar
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #d3d9de', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={th}>Cant.</th>
              <th style={th}>Código</th>
              <th style={th}>Descripción</th>
              <th style={{ ...th, textAlign: 'right' }}>Pr. Unit.</th>
              <th style={{ ...th, textAlign: 'right' }}>Pr. Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item, i) => (
              <tr key={i}>
                <td style={td}>{item.cantidad}</td>
                <td style={td}>{item.codigo || '—'}</td>
                <td style={{ ...td, fontWeight: 600 }}>{item.descripcion}</td>
                <td style={{ ...td, textAlign: 'right' }}>{formatCurrency(item.precioUnit)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{formatCurrency(item.prTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>Subtotal: {formatCurrency(factura.subtotal)}</div>
          <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>IVA ({factura.ivaPct}%): {formatCurrency(factura.total - factura.subtotal)}</div>
        </div>
      </div>

      <div style={{
        background: '#f8f9fa', borderRadius: '10px', padding: '12px 16px',
        borderLeft: '3px solid #6A8899', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.82rem', color: '#6c757d', fontWeight: 600 }}>Total</span>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#212529' }}>{formatCurrency(factura.total)}</span>
      </div>

      {showPrint && (
        <PrintDocument
          data={{ ...factura, numeroFormateado: formatearComprobante(factura.tipo, factura.numero) }}
          type="factura"
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
