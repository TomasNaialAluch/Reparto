// Pedidos para armar: bloques por nombre en columnas, como el cuaderno.
// Cada renglón se tacha con un toque; cuando están todos tachados el pedido pasa a "armado".
import { useMemo, useState } from 'react';
import { normalizarNombre } from '../../utils/nombres';
import { IconPlus, IconX } from '../gestionSemanal/icons';

const chipBase = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
  fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--color-primary-border)',
  background: 'var(--color-primary-soft)', color: '#3a5060', cursor: 'pointer',
};

const ESTADOS = {
  pendiente: { texto: 'pendiente', fondo: '#fef3c7', color: '#92400e' },
  armado: { texto: 'armado', fondo: '#dcfce7', color: '#166534' },
  entregado: { texto: 'entregado', fondo: '#e5e7eb', color: '#4b5563' },
};

const Bloque = ({ pedido, acciones }) => {
  const [texto, setTexto] = useState('');
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);
  const renglones = pedido.renglones || [];
  const hechos = renglones.filter((r) => r.hecha).length;
  const estado = ESTADOS[pedido.estado] || ESTADOS.pendiente;
  const entregado = pedido.estado === 'entregado';

  const agregar = async () => {
    if (!texto.trim()) return;
    const t = texto;
    setTexto('');
    try {
      await acciones.agregarRenglon(pedido.id, t);
    } catch (err) {
      console.error(err);
      setTexto(t);
    }
  };

  return (
    <div
      style={{
        background: '#fff', border: '1px solid var(--color-primary-border)', borderRadius: 12,
        padding: '10px 12px', opacity: entregado ? 0.6 : 1,
        borderLeft: `4px solid ${pedido.estado === 'armado' ? '#16a34a' : 'var(--color-primary-border)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontWeight: 800, color: '#333', minWidth: 0, wordBreak: 'break-word' }}>
          {pedido.cliente}
          {pedido.origen === 'whatsapp' && <span title="Llegó por WhatsApp" style={{ marginLeft: 6 }}>💬</span>}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, borderRadius: 999, padding: '1px 8px', background: estado.fondo, color: estado.color }}>
          {estado.texto}
        </span>
      </div>
      {renglones.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{hechos}/{renglones.length} armados</div>
      )}

      <div style={{ marginTop: 6 }}>
        {renglones.map((r) => (
          <div
            key={r.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--color-primary-soft)' }}
          >
            <button
              type="button"
              onClick={() => !entregado && acciones.alternarRenglon(pedido.id, r.id)}
              title={r.hecha ? 'Destachar' : 'Tachar'}
              style={{
                flex: 1, textAlign: 'left', border: 'none', background: 'none', padding: '5px 0', fontSize: '0.92rem',
                color: r.hecha ? '#b91c1c' : '#333', textDecoration: r.hecha ? 'line-through' : 'none',
                textDecorationThickness: r.hecha ? '2px' : undefined, opacity: r.hecha ? 0.7 : 1,
                cursor: entregado ? 'default' : 'pointer', wordBreak: 'break-word',
              }}
            >
              {r.texto}
            </button>
            {!entregado && (
              <button
                type="button"
                aria-label="Quitar renglón"
                onClick={() => acciones.quitarRenglon(pedido.id, r.id)}
                style={{ border: 'none', background: 'none', color: '#d1d5db', padding: 2 }}
              >
                <IconX size={11} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!entregado && (
        <input
          type="text"
          value={texto}
          placeholder="12 b pata  ⏎"
          autoComplete="off"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
          style={{
            width: '100%', marginTop: 8, padding: '5px 9px', borderRadius: 8, fontSize: '0.88rem',
            border: '1px dashed var(--color-primary-border)', outline: 'none', background: 'transparent',
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
        {confirmaBorrar ? (
          <span style={{ fontSize: '0.78rem', color: '#6c757d' }}>
            ¿Borrar el pedido?{' '}
            <button type="button" onClick={() => acciones.eliminarPedido(pedido.id)} style={{ border: 'none', background: 'none', fontWeight: 700, color: '#b91c1c' }}>
              Sí
            </button>
            {' · '}
            <button type="button" onClick={() => setConfirmaBorrar(false)} style={{ border: 'none', background: 'none', color: '#6c757d' }}>
              no
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmaBorrar(true)}
            style={{ border: 'none', background: 'none', color: '#d1d5db', fontSize: '0.76rem', padding: 0 }}
          >
            borrar
          </button>
        )}
        {pedido.estado === 'armado' && (
          <button type="button" style={{ ...chipBase, background: 'var(--color-primary)', color: '#fff', padding: '2px 12px' }} onClick={() => acciones.marcarEntregado(pedido.id, true)}>
            Marcar entregado
          </button>
        )}
        {entregado && (
          <button type="button" style={{ ...chipBase, background: '#fff', padding: '2px 12px' }} onClick={() => acciones.marcarEntregado(pedido.id, false)}>
            Reabrir
          </button>
        )}
      </div>
    </div>
  );
};

const PedidosBloque = ({ datos, clientes, buscarExacto }) => {
  const { pedidos, loading, error, crearPedido } = datos;
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [verEntregados, setVerEntregados] = useState(false);

  const activos = pedidos.filter((p) => p.estado !== 'entregado');
  const entregados = pedidos.filter((p) => p.estado === 'entregado');
  const faltan = activos.filter((p) => p.estado === 'pendiente').length;

  const consulta = normalizarNombre(nombre);
  const sugeridos = useMemo(() => {
    if (!consulta) return [];
    return clientes.filter((c) => normalizarNombre(c.nombre).includes(consulta)).slice(0, 6);
  }, [consulta, clientes]);

  const crear = async (nombrePedido, clienteId = null) => {
    const limpio = String(nombrePedido || '').trim();
    if (!limpio) return;
    try {
      const contacto = clienteId ? null : buscarExacto(limpio);
      await crearPedido({ cliente: limpio, clienteId: clienteId || contacto?.id || null });
      setNombre('');
      setMostrarForm(false);
      setErrorForm('');
    } catch (err) {
      console.error(err);
      setErrorForm('No se pudo crear el pedido');
    }
  };

  return (
    <section className="hoy-zona">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: '#3a5060', flex: 1 }}>
          Pedidos para armar
          {pedidos.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, color: '#6c757d' }}>
              {faltan > 0 ? `${faltan} por armar` : 'todo armado'}
            </span>
          )}
        </div>
        {!mostrarForm && (
          <button type="button" style={chipBase} onClick={() => setMostrarForm(true)}>
            <IconPlus size={13} /> Nuevo pedido
          </button>
        )}
      </div>

      {mostrarForm && (
        <div style={{ background: 'var(--color-primary-soft)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <input
            autoFocus
            type="text"
            className="form-control"
            placeholder="Nombre (cliente, zona…) y Enter"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrorForm(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); crear(nombre); }
              if (e.key === 'Escape') { setMostrarForm(false); setNombre(''); }
            }}
          />
          {sugeridos.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {sugeridos.map((c) => (
                <button key={c.id} type="button" style={{ ...chipBase, background: '#fff' }} onClick={() => crear(c.nombre, c.id)}>
                  {c.nombre}
                </button>
              ))}
            </div>
          )}
          {errorForm && <div style={{ color: '#b45309', fontSize: '0.82rem', marginTop: 6 }}>{errorForm}</div>}
          <div style={{ marginTop: 8 }}>
            <button type="button" style={{ ...chipBase, background: '#fff' }} onClick={() => { setMostrarForm(false); setNombre(''); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <div className="alert alert-warning">No se pudieron cargar los pedidos: {error}</div>}

      {loading ? (
        <div style={{ color: '#9ca3af', padding: '8px 0' }}>Cargando…</div>
      ) : activos.length === 0 && entregados.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '0.88rem', padding: '6px 0 4px' }}>
          Sin pedidos para este día. Sumá uno con <strong>Nuevo pedido</strong>.
        </div>
      ) : (
        <div className="hoy-pedidos">
          {activos.map((p) => <Bloque key={p.id} pedido={p} acciones={datos} />)}
        </div>
      )}

      {entregados.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--color-primary-soft)', paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => setVerEntregados((v) => !v)}
            style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
          >
            {verEntregados ? '▾' : '▸'} Entregados ({entregados.length})
          </button>
          {verEntregados && (
            <div className="hoy-pedidos" style={{ marginTop: 8 }}>
              {entregados.map((p) => <Bloque key={p.id} pedido={p} acciones={datos} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PedidosBloque;
