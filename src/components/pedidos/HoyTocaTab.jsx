// "Hoy toca": a quién se le escribe hoy, a qué hora, y cómo viene cada uno.
// Con el envío automático conectado, el estado sale solo de los mensajes; hasta entonces es la agenda.
import { useMemo } from 'react';
import { diaDeFecha, fechaLarga, sumarDias } from '../../utils/pesadas';
import {
  DIAS, aplicarVariables, diaSemana, normalizarTelefonoAR, tocaEnFecha,
} from '../../utils/whatsapp';
import { ETIQUETAS, aviso, tarjeta } from './estilos';

const estadoDe = (prog, fecha, mensajes, conectado) => {
  const deHoy = mensajes.filter((m) => m.clienteId === prog.clienteId && m.fecha === fecha);
  if (deHoy.some((m) => m.direccion === 'entrante')) return { texto: 'contestó', estilo: ETIQUETAS.ok };
  const saliente = deHoy.find((m) => m.direccion === 'saliente');
  if (saliente?.estado === 'fallido') return { texto: 'falló el envío', estilo: ETIQUETAS.error };
  if (saliente) return { texto: saliente.estado, estilo: ETIQUETAS.ok };
  if (conectado) return { texto: 'programado', estilo: ETIQUETAS.neutra };
  return { texto: 'sin envío automático', estilo: ETIQUETAS.neutra };
};

const HoyTocaTab = ({ fecha, programaciones, clientesPorId, mensajes, conectado, onIrAConexion }) => {
  const tocanHoy = useMemo(
    () => programaciones
      .filter((p) => tocaEnFecha(p, fecha))
      .sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || ''))),
    [programaciones, fecha]
  );

  const semana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const f = sumarDias(fecha, i);
      return { fecha: f, dia: diaDeFecha(f), cantidad: programaciones.filter((p) => tocaEnFecha(p, f)).length };
    }),
    [programaciones, fecha]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!conectado && (
        <div style={aviso}>
          El envío automático todavía no está conectado, así que por ahora esta lista es solo la agenda de a quién le toca.{' '}
          <button
            type="button" onClick={onIrAConexion}
            style={{ background: 'none', border: 'none', padding: 0, color: '#92400e', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Ver qué falta
          </button>
        </div>
      )}

      <div>
        <div style={{ fontWeight: 800, color: '#333', marginBottom: 8, textTransform: 'capitalize' }}>
          {fechaLarga(fecha)} · {tocanHoy.length} {tocanHoy.length === 1 ? 'cliente' : 'clientes'}
        </div>
        {tocanHoy.length === 0 && <div style={{ color: '#6b7280' }}>Hoy no hay mensajes programados.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tocanHoy.map((p) => {
            const cliente = clientesPorId[p.clienteId];
            const tel = normalizarTelefonoAR(cliente?.contacto?.telefono);
            const estado = estadoDe(p, fecha, mensajes, conectado);
            return (
              <div key={p.id} style={{ ...tarjeta, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, color: '#3a5060', minWidth: 52 }}>{p.hora}</div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 800, color: '#333' }}>{p.cliente}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                    {aplicarVariables(p.mensaje, { nombre: p.cliente })}
                  </div>
                </div>
                {!tel && <span style={ETIQUETAS.error}>falta WhatsApp</span>}
                <span style={estado.estilo}>{estado.texto}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 800, color: '#333', marginBottom: 8 }}>Próximos 7 días</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
          {semana.map((s) => (
            <div key={s.fecha} style={{ ...tarjeta, textAlign: 'center', padding: '8px 6px' }}>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700 }}>
                {DIAS.find((d) => d.n === diaSemana(s.fecha))?.corto} {s.fecha.slice(8)}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.cantidad ? '#3a5060' : '#cbd5e1' }}>{s.cantidad}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HoyTocaTab;
