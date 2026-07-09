import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../../utils/money';
import { IconX, IconPrinter } from '../../gestionSemanal/icons';
import pieFactura from '../../../assets/facturacion/pie-factura.png';

// Componente de impresión dedicado a Facturas — separado a propósito de PrintDocument.jsx
// (que es genérico y lo comparten Reparto/Transferencias/Lista de Precios/Empleados/Ventas).
// Ver README-FACTURACION-IMPRESION.md: acá la imagen de pie ("pie-factura.png", recortada
// del PDF de referencia que mandó el usuario) va abajo tal cual, y los datos de la factura
// (número, fecha, cliente, ítems, totales) se arman arriba en HTML/CSS normal — no hay
// posiciones absolutas, así que una factura de 20 ítems empuja la imagen más abajo sin romper
// nada (a diferencia del sistema de referencia, que tiene la imagen y los campos en coordenadas
// fijas pensadas para pocos ítems).
export default function FacturaPrintDocument({ data, onClose }) {
  const printRef = useRef();

  const {
    numeroFormateado, clienteNombre, fecha, items,
    subtotal, total, ivaPct, totalImpreso, redondeoAplicado,
  } = data;
  const totalFinal = totalImpreso ?? total;

  const styles = `
    @page { size: A4 portrait; margin: 1.5cm 2cm; }
    body { font-family: 'Arial', sans-serif; margin: 0; padding: 15px; font-size: 11pt; line-height: 1.4; color: #000; }
    .fp-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
    .fp-header .fp-numero { font-size: 16pt; font-weight: bold; }
    .fp-header .fp-fecha { font-size: 9pt; color: #666; }
    .fp-cliente { font-size: 12pt; font-weight: bold; margin-bottom: 10px; }
    .fp-table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }
    .fp-table th, .fp-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 10pt; }
    .fp-table th { background-color: #f0f0f0; font-weight: bold; }
    .fp-table td.num, .fp-table th.num { text-align: right; }
    .fp-totales { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; margin-bottom: 10px; }
    .fp-totales .fp-linea { font-size: 10pt; }
    .fp-totales .fp-total { font-size: 14pt; font-weight: bold; margin-top: 6px; padding: 10px 14px; background-color: #e9ecef; border: 2px solid #000; }
    .fp-pie { display: block; width: 100%; max-width: 620px; margin: 28px auto 0; }
  `;

  const renderContent = () => (
    <div ref={printRef}>
      <div className="fp-header">
        <span className="fp-numero">{numeroFormateado || 'Factura'}</span>
        <span className="fp-fecha">Fecha: {fecha ? new Date(fecha).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</span>
      </div>

      <div className="fp-cliente">Cliente: {clienteNombre}</div>

      {items && items.length > 0 && (
        <table className="fp-table">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Descripción</th>
              <th className="num">Pr. Unit.</th>
              <th className="num">Pr. Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.cantidad}</td>
                <td>{item.descripcion}</td>
                <td className="num">{formatCurrency(parseFloat(item.precioUnit) || 0)}</td>
                <td className="num">{formatCurrency(item.prTotal || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="fp-totales">
        <div className="fp-linea">Subtotal: {formatCurrency(subtotal || 0)}</div>
        <div className="fp-linea">IVA ({ivaPct || 0}%): {formatCurrency((total || 0) - (subtotal || 0))}</div>
        {redondeoAplicado > 0 && (
          <div className="fp-linea">Redondeo: +{formatCurrency(redondeoAplicado)}</div>
        )}
        <div className="fp-total">Total: {formatCurrency(totalFinal || 0)}</div>
      </div>

      <img src={pieFactura} alt="" className="fp-pie" />
    </div>
  );

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Impresión - Factura</title>
        <style>${styles}</style>
      </head>
      <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2050 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(700px, 94vw)', maxHeight: '90vh', background: 'white', borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', zIndex: 2051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vista previa</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>Impresión</div>
          </div>
          <button onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#6c757d' }}>
            <IconX size={16} />
          </button>
        </div>

        <div className="pd-preview" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fafbfc' }}>
          <div style={{ background: 'white', border: '1px solid #e1e5e9', borderRadius: '8px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #212529', paddingBottom: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{numeroFormateado || 'Factura'}</span>
              <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>Fecha: {fecha ? new Date(fecha).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px' }}>Cliente: {clienteNombre}</div>

            {items && items.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 14px' }}>
                <thead>
                  <tr>
                    <th style={previewTh}>Cant.</th>
                    <th style={previewTh}>Descripción</th>
                    <th style={{ ...previewTh, textAlign: 'right' }}>Pr. Unit.</th>
                    <th style={{ ...previewTh, textAlign: 'right' }}>Pr. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td style={previewTd}>{item.cantidad}</td>
                      <td style={previewTd}>{item.descripcion}</td>
                      <td style={{ ...previewTd, textAlign: 'right' }}>{formatCurrency(parseFloat(item.precioUnit) || 0)}</td>
                      <td style={{ ...previewTd, textAlign: 'right' }}>{formatCurrency(item.prTotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.8rem' }}>Subtotal: {formatCurrency(subtotal || 0)}</div>
              <div style={{ fontSize: '0.8rem' }}>IVA ({ivaPct || 0}%): {formatCurrency((total || 0) - (subtotal || 0))}</div>
              {redondeoAplicado > 0 && (
                <div style={{ fontSize: '0.8rem' }}>Redondeo: +{formatCurrency(redondeoAplicado)}</div>
              )}
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '6px', padding: '10px 14px', background: '#e9ecef', border: '2px solid #212529', borderRadius: '6px' }}>
                Total: {formatCurrency(totalFinal || 0)}
              </div>
            </div>

            <img src={pieFactura} alt="" style={{ display: 'block', width: '100%', maxWidth: '460px', margin: '20px auto 0' }} />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handlePrint}
            className="d-inline-flex align-items-center justify-content-center gap-2"
            style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
            <IconPrinter size={14} /> Imprimir
          </button>
        </div>
      </div>
      {/* renderContent() no se monta visualmente — solo existe para que printRef.current.innerHTML
          tenga el HTML "limpio" (sin los estilos de la vista previa en pantalla) que se manda a la
          ventana de impresión real. */}
      <div style={{ display: 'none' }}>{renderContent()}</div>
    </>,
    document.body
  );
}

const previewTh = {
  textAlign: 'left', padding: '6px 8px', fontSize: '0.7rem', fontWeight: 700,
  color: '#495057', background: '#f8f9fa', border: '1px solid #d3d9de',
};

const previewTd = {
  padding: '7px 8px', fontSize: '0.78rem', color: '#212529', border: '1px solid #e1e5e9',
};
