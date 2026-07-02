import { useState, useMemo } from 'react';
import { IconSearch, IconPlus, IconBox } from '../../gestionSemanal/icons';

const th = {
  textAlign: 'left', padding: '8px 12px', fontSize: '0.66rem', fontWeight: 600,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #d3d9de', whiteSpace: 'nowrap',
};

const td = {
  padding: '9px 12px', fontSize: '0.82rem', color: '#212529',
  borderBottom: '1px solid #e1e5e9', whiteSpace: 'nowrap',
};

export default function ProductosList({ productos, loading, onSelectProducto, onAddNew }) {
  const [busqueda, setBusqueda] = useState('');

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(p =>
      p.descripcion?.toLowerCase().includes(q) || String(p.codigo || '').includes(q)
    );
  }, [productos, busqueda]);

  return (
    <div>
      {/* Header: búsqueda + agregar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd', display: 'flex' }}>
            <IconSearch size={14} />
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por descripción o código..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
              border: '1px solid #ccd3d9', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#6A8899'; e.target.style.boxShadow = '0 0 0 0.2rem rgba(106,136,153,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#ccd3d9'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
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
          <IconPlus size={14} /> Agregar Nuevo
        </button>
      </div>

      {/* Tabla */}
      <div style={{ border: '1px solid #d3d9de', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '480px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
              <tr>
                <th style={{ ...th, width: '80px' }}>Código</th>
                <th style={th}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={2} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '24px' }}>Cargando productos…</td></tr>
              )}
              {!loading && productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '32px', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <IconBox size={26} />
                      {busqueda ? 'No se encontraron productos.' : 'Todavía no hay productos cargados.'}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && productosFiltrados.map(producto => (
                <tr
                  key={producto.id}
                  onClick={() => onSelectProducto(producto)}
                  style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,136,153,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...td, color: '#6A8899', fontWeight: 600 }}>{producto.codigo}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{producto.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '10px' }}>
        Total: {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}.
      </div>
    </div>
  );
}
