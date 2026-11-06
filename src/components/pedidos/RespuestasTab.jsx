// Respuestas: lo que contestan los clientes. Cada una se revisa y se pasa a pedido de hoy.
// Hasta conectar WhatsApp, las respuestas se cargan a mano con "Simular respuesta" para probar el recorrido.
import { useState } from 'react';
import { parsearRenglones } from '../../utils/whatsapp';
import { ETIQUETAS, chip, input, tarjeta } from './estilos';

const hora = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const RespuestaNueva = ({ mensaje, onPasarAPedido, onDescartar }) => {
  const [texto, setTexto] = useState(mensaje.texto);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const renglones = parsearRenglones(texto);

  const pasar = async () => {
    if (renglones.length === 0) { setError('No hay nada para pasar a pedido.'); return; }
    setTrabajando(true);
    setError('');
    try {
      await onPasarAPedido(mensaje, renglones);
    } catch (err) {
      console.error(err);
      setError('No se pudo crear el pedido.');
      setTrabajando(false);
    }
  };

  return (
    <div style={{ ...tarjeta, borderLeft: '4px solid #f59e0b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ fontWeight: 800, color: '#333', flex: 1 }}>{mensaje.cliente || 'Sin identificar'}</div>
        {mensaje.origen === 'whatsapp' && <span title="Llegó por WhatsApp">💬</span>}
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{hora(mensaje.creada)}</span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 4 }}>
        Un renglón por línea (o separados con “;”). Corregí lo que haga falta antes de pasarlo.
      </div>
      <textarea
        rows={Math.min(8, Math.max(2, texto.split('\n').length))}
        style={{ ...input, width: '100%', resize: 'vertical' }}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {error && <div style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" style={chip(true)} disabled={trabajando} onClick={pasar}>
          Pasar a pedido de hoy ({renglones.length})
        </button>
        <button type="button" style={chip()} disabled={trabajando} onClick={() => onDescartar(mensaje.id)}>Descartar</button>
      </div>
    </div>
  );
};

const RespuestasTab = ({ clientes, nuevos, resueltos, onSimular, onPasarAPedido, onDescartar }) => {
  const [clienteId, setClienteId] = useState('');
  const [texto, setTexto] = useState('');
  const [verResueltos, setVerResueltos] = useState(false);

  const simular = async () => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente || !texto.trim()) return;
    await onSimular(cliente, texto);
    setTexto('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontWeight: 800, color: '#333', marginBottom: 8 }}>
          Para revisar {nuevos.length > 0 && <span style={ETIQUETAS.aviso}>{nuevos.length}</span>}
        </div>
        {nuevos.length === 0 && <div style={{ color: '#6b7280' }}>No hay respuestas nuevas.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nuevos.map((m) => (
            <RespuestaNueva key={m.id} mensaje={m} onPasarAPedido={onPasarAPedido} onDescartar={onDescartar} />
          ))}
        </div>
      </div>

      <div style={{ ...tarjeta, background: 'var(--color-primary-soft)' }}>
        <div style={{ fontWeight: 800, color: '#333', marginBottom: 4 }}>Simular una respuesta (para probar)</div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8 }}>
          Mientras WhatsApp no esté conectado, así se prueba el recorrido completo hasta el pedido en Hoy.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select style={input} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Elegí el cliente…</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <textarea
            rows={3} style={{ ...input, resize: 'vertical' }} value={texto}
            placeholder={'5 kg lomo\n3 kg bondiola'} onChange={(e) => setTexto(e.target.value)}
          />
          <div>
            <button type="button" style={chip(true)} disabled={!clienteId || !texto.trim()} onClick={simular}>
              Agregar a la bandeja
            </button>
          </div>
        </div>
      </div>

      {resueltos.length > 0 && (
        <div>
          <button type="button" style={chip()} onClick={() => setVerResueltos((v) => !v)}>
            {verResueltos ? 'Ocultar' : 'Ver'} ya revisadas ({resueltos.length})
          </button>
          {verResueltos && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {resueltos.slice(0, 30).map((m) => (
                <div key={m.id} style={{ ...tarjeta, opacity: 0.7, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, flex: 1, minWidth: 120 }}>{m.cliente}</div>
                  <span style={m.estado === 'procesado' ? ETIQUETAS.ok : ETIQUETAS.neutra}>
                    {m.estado === 'procesado' ? 'pasó a pedido' : 'descartada'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RespuestasTab;
