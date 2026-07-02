import { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../../../../utils/money';
import { IconSearch, IconChevronDown, IconReceipt, IconPrinter } from '../../../gestionSemanal/icons';
import PrintDocument from '../../../PrintDocument';

const PAGE_SIZE = 8;

const th = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.66rem', fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #d3d9de', whiteSpace: 'nowrap',
};

const td = {
  padding: '9px 10px', fontSize: '0.82rem', color: '#212529',
  borderBottom: '1px solid #e1e5e9', whiteSpace: 'nowrap',
};

export default function VentasList({ ventas, cliente, onSelectVenta }) {
  const [busqueda, setBusqueda] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('desc'); // 'desc' = más recientes primero
  const [pagina, setPagina] = useState(1);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => { setPagina(1); }, [busqueda, ordenFecha]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const base = q
      ? ventas.filter(v => v.numero.toLowerCase().includes(q) || v.tipo.toLowerCase().includes(q))
      : ventas;
    return [...base].sort((a, b) =>
      ordenFecha === 'desc' ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)
    );
  }, [ventas, busqueda, ordenFecha]);

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
  const todasFiltradasSeleccionadas = filtradas.length > 0 && filtradas.every(v => seleccionadas.has(v.id));
  const toggleSeleccionarTodas = () => setSeleccionadas(prev => {
    if (todasFiltradasSeleccionadas) {
      const next = new Set(prev);
      filtradas.forEach(v => next.delete(v.id));
      return next;
    }
    const next = new Set(prev);
    filtradas.forEach(v => next.add(v.id));
    return next;
  });

  const ventasSeleccionadas = ventas.filter(v => seleccionadas.has(v.id));
  const totalSeleccionado = ventasSeleccionadas.reduce((sum, v) => sum + v.total, 0);

  return (
    <div>
      {/* Búsqueda + imprimir seleccionadas */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd', display: 'flex' }}>
            <IconSearch size={14} />
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° de comprobante o tipo..."
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
      </div>

      {/* Tabla */}
      <div style={{ border: '1px solid #d3d9de', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ ...th, width: '32px' }}>
                <input type="checkbox" checked={todasFiltradasSeleccionadas} onChange={toggleSeleccionarTodas}
                  disabled={filtradas.length === 0} style={{ cursor: filtradas.length === 0 ? 'default' : 'pointer' }} />
              </th>
              <th style={th}>N° Comprobante</th>
              <th style={th}>Tipo</th>
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
              <th style={{ ...th, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '28px', borderBottom: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <IconReceipt size={22} />
                    {busqueda ? 'No se encontraron ventas.' : 'Este cliente todavía no tiene ventas registradas.'}
                  </div>
                </td>
              </tr>
            )}
            {paginadas.map(venta => (
              <tr key={venta.id}
                style={{ cursor: 'pointer', transition: 'background 0.12s', background: seleccionadas.has(venta.id) ? 'rgba(106,136,153,0.06)' : 'transparent' }}
                onMouseEnter={(e) => { if (!seleccionadas.has(venta.id)) e.currentTarget.style.background = 'rgba(106,136,153,0.04)'; }}
                onMouseLeave={(e) => { if (!seleccionadas.has(venta.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={td} onClick={(e) => { e.stopPropagation(); toggleSeleccion(venta.id); }}>
                  <input type="checkbox" checked={seleccionadas.has(venta.id)} onChange={() => toggleSeleccion(venta.id)} />
                </td>
                <td style={{ ...td, color: '#6A8899', fontWeight: 600 }} onClick={() => onSelectVenta(venta)}>{venta.numero}</td>
                <td style={td} onClick={() => onSelectVenta(venta)}>{venta.tipo}</td>
                <td style={td} onClick={() => onSelectVenta(venta)}>{new Date(venta.fecha).toLocaleDateString('es-AR')}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }} onClick={() => onSelectVenta(venta)}>{formatCurrency(venta.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filtradas.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: '#6c757d' }}>
          <span>
            {filtradas.length} venta{filtradas.length !== 1 ? 's' : ''} · página {paginaSegura} de {totalPaginas}
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
          data={{ ventas: ventasSeleccionadas, total: totalSeleccionado, clienteNombre: cliente?.razonSocial }}
          type="ventasResumen"
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
