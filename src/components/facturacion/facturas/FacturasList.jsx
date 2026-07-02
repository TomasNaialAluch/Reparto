import { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../../../utils/money';
import { formatearComprobante } from '../constants';
import { IconSearch, IconPlus, IconReceipt, IconChevronDown, IconPrinter } from '../../gestionSemanal/icons';
import PrintDocument from '../../PrintDocument';

const PAGE_SIZE = 8;

const th = {
  textAlign: 'left', padding: '8px 12px', fontSize: '0.66rem', fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #d3d9de', whiteSpace: 'nowrap',
};

const td = {
  padding: '9px 12px', fontSize: '0.82rem', color: '#212529',
  borderBottom: '1px solid #e1e5e9', whiteSpace: 'nowrap',
};

export default function FacturasList({ facturas, loading, onSelectFactura, onAddNew }) {
  const [busqueda, setBusqueda] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('desc'); // 'desc' = más recientes primero
  const [pagina, setPagina] = useState(1);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => { setPagina(1); }, [busqueda, ordenFecha]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const base = q
      ? facturas.filter(f =>
          f.clienteNombre?.toLowerCase().includes(q) ||
          formatearComprobante(f.tipo, f.numero).toLowerCase().includes(q)
        )
      : facturas;
    return [...base].sort((a, b) =>
      ordenFecha === 'desc' ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)
    );
  }, [facturas, busqueda, ordenFecha]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE);

  const toggleOrden = () => setOrdenFecha(prev => (prev === 'desc' ? 'asc' : 'desc'));

  const toggleSeleccion = (id) => setSeleccionadas(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // El checkbox del header opera sobre TODAS las filtradas (no solo la página actual),
  // así se puede imprimir un resumen de una búsqueda entera con muchos resultados.
  const todasFiltradasSeleccionadas = filtradas.length > 0 && filtradas.every(f => seleccionadas.has(f.id));
  const toggleSeleccionarTodas = () => setSeleccionadas(prev => {
    if (todasFiltradasSeleccionadas) {
      const next = new Set(prev);
      filtradas.forEach(f => next.delete(f.id));
      return next;
    }
    const next = new Set(prev);
    filtradas.forEach(f => next.add(f.id));
    return next;
  });

  const facturasSeleccionadas = facturas.filter(f => seleccionadas.has(f.id));
  const totalSeleccionado = facturasSeleccionadas.reduce((sum, f) => sum + f.total, 0);

  return (
    <div>
      {/* Búsqueda + nueva factura + imprimir seleccionadas */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd', display: 'flex' }}>
            <IconSearch size={14} />
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o comprobante..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
              border: '1px solid #ccd3d9', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#6A8899'; e.target.style.boxShadow = '0 0 0 0.2rem rgba(106,136,153,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#ccd3d9'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <button
          onClick={() => setShowPrint(true)}
          disabled={seleccionadas.size === 0}
          className="d-inline-flex align-items-center gap-2"
          style={{
            border: '1px solid #ccd3d9', borderRadius: '8px', padding: '8px 14px',
            background: 'transparent', color: seleccionadas.size === 0 ? '#adb5bd' : '#3a5060',
            fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap',
            cursor: seleccionadas.size === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
          }}
        >
          <IconPrinter size={13} /> Imprimir {seleccionadas.size > 0 ? `(${seleccionadas.size})` : ''}
        </button>
        <button
          onClick={onAddNew}
          className="d-inline-flex align-items-center gap-2"
          style={{
            border: 'none', borderRadius: '8px', padding: '8px 16px',
            background: '#6A8899', color: 'white', fontWeight: 600, fontSize: '0.82rem',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#506878'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#6A8899'; }}
        >
          <IconPlus size={14} /> Nueva Factura
        </button>
      </div>

      {/* Tabla */}
      <div style={{ border: '1px solid #d3d9de', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '480px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
              <tr>
                <th style={{ ...th, width: '32px' }}>
                  <input type="checkbox" checked={todasFiltradasSeleccionadas} onChange={toggleSeleccionarTodas}
                    disabled={filtradas.length === 0} style={{ cursor: filtradas.length === 0 ? 'default' : 'pointer' }} />
                </th>
                <th style={th}>
                  <button onClick={toggleOrden}
                    className="d-inline-flex align-items-center gap-1"
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit' }}
                    title={ordenFecha === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
                  >
                    Fecha
                    <span style={{ display: 'flex', transform: ordenFecha === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <IconChevronDown size={11} />
                    </span>
                  </button>
                </th>
                <th style={th}>Comprobante</th>
                <th style={th}>Cliente</th>
                <th style={{ ...th, textAlign: 'right' }}>Total $</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '24px' }}>Cargando facturas…</td></tr>
              )}
              {!loading && filtradas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '32px', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <IconReceipt size={26} />
                      {busqueda ? 'No se encontraron facturas.' : 'Todavía no hay facturas cargadas.'}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && paginadas.map(factura => (
                <tr
                  key={factura.id}
                  style={{ cursor: 'pointer', transition: 'background 0.12s', background: seleccionadas.has(factura.id) ? 'rgba(106,136,153,0.06)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!seleccionadas.has(factura.id)) e.currentTarget.style.background = 'rgba(106,136,153,0.04)'; }}
                  onMouseLeave={(e) => { if (!seleccionadas.has(factura.id)) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={td} onClick={(e) => { e.stopPropagation(); toggleSeleccion(factura.id); }}>
                    <input type="checkbox" checked={seleccionadas.has(factura.id)} onChange={() => toggleSeleccion(factura.id)} />
                  </td>
                  <td style={td} onClick={() => onSelectFactura(factura)}>{new Date(factura.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={{ ...td, color: '#6A8899', fontWeight: 600 }} onClick={() => onSelectFactura(factura)}>{formatearComprobante(factura.tipo, factura.numero)}</td>
                  <td style={{ ...td, fontWeight: 600 }} onClick={() => onSelectFactura(factura)}>{factura.clienteNombre}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }} onClick={() => onSelectFactura(factura)}>{formatCurrency(factura.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {filtradas.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: '#6c757d' }}>
          <span>
            {filtradas.length} factura{filtradas.length !== 1 ? 's' : ''} · página {paginaSegura} de {totalPaginas}
            {seleccionadas.size > 0 && ` · ${seleccionadas.size} seleccionada${seleccionadas.size !== 1 ? 's' : ''}`}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={paginaSegura === 1}
              style={{
                border: '1px solid #ccd3d9', borderRadius: '7px', padding: '5px 12px',
                background: 'transparent', color: paginaSegura === 1 ? '#adb5bd' : '#3a5060',
                fontSize: '0.75rem', fontWeight: 600, cursor: paginaSegura === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ‹ Anterior
            </button>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura === totalPaginas}
              style={{
                border: '1px solid #ccd3d9', borderRadius: '7px', padding: '5px 12px',
                background: 'transparent', color: paginaSegura === totalPaginas ? '#adb5bd' : '#3a5060',
                fontSize: '0.75rem', fontWeight: 600, cursor: paginaSegura === totalPaginas ? 'not-allowed' : 'pointer',
              }}
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}

      {showPrint && (
        <PrintDocument
          data={{
            facturas: facturasSeleccionadas.map(f => ({ ...f, numeroFormateado: formatearComprobante(f.tipo, f.numero) })),
            total: totalSeleccionado,
          }}
          type="facturasResumen"
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
