import { useState, useMemo } from 'react';
import { IconSearch, IconPlus, IconUsers } from '../../gestionSemanal/icons';

const th = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: '0.66rem',
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #d3d9de',
  whiteSpace: 'nowrap',
};

const td = {
  padding: '9px 12px',
  fontSize: '0.82rem',
  color: '#212529',
  borderBottom: '1px solid #e1e5e9',
  whiteSpace: 'nowrap',
};

export default function ClientesList({ clientes, loading, onSelectCliente, onAddNew, onSeedDemo }) {
  const [busqueda, setBusqueda] = useState('');

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c =>
      c.razonSocial?.toLowerCase().includes(q) ||
      c.nroDoc?.toLowerCase().includes(q) ||
      c.domicilio?.toLowerCase().includes(q) ||
      String(c.codigo || '').includes(q)
    );
  }, [clientes, busqueda]);

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
            placeholder="Buscar por razón social, código o domicilio..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '8px',
              border: '1px solid #ccd3d9',
              fontSize: '0.82rem',
              outline: 'none',
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
                <th style={th}>Código</th>
                <th style={th}>Razón Social</th>
                <th style={th}>Condición IVA</th>
                <th style={th}>Domicilio</th>
                <th style={th}>Provincia</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '24px' }}>Cargando clientes…</td></tr>
              )}
              {!loading && clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '32px', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <IconUsers size={26} />
                      {busqueda ? 'No se encontraron clientes.' : 'Todavía no hay clientes cargados.'}
                      {!busqueda && onSeedDemo && (
                        <button
                          onClick={onSeedDemo}
                          style={{
                            border: '1px dashed #ccd3d9', borderRadius: '8px', padding: '5px 12px',
                            background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          + Cargar cliente de ejemplo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && clientesFiltrados.map(cliente => (
                <tr
                  key={cliente.id}
                  onClick={() => onSelectCliente(cliente)}
                  style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,136,153,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...td, color: '#6A8899', fontWeight: 600 }}>{cliente.codigo}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{cliente.razonSocial}</td>
                  <td style={td}>{cliente.condicionIVA || '—'}</td>
                  <td style={td}>{cliente.domicilio || <span style={{ color: '#adb5bd' }}>&lt;no informado&gt;</span>}</td>
                  <td style={td}>{cliente.provincia || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '10px' }}>
        Total: {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}.
      </div>
    </div>
  );
}
