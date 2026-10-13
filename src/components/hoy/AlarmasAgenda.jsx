// Alarmas de la agenda: avisa a la hora de cada renglón con campana.
// Funciona mientras la página Hoy esté abierta (no es una notificación push con la app cerrada).
// Ver README-ROADMAP-HOY.md, Fase 5.
import { useEffect, useRef, useState } from 'react';
import { minutosDelDia } from '../../utils/agenda';

const CADA_MS = 15000;
// Una tarea cuya hora pasó hace más que esto igual avisa (se abrió la página tarde), pero lo dice.
const TOLERANCIA_MIN = 5;

const sonar = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.28].forEach((retraso) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + retraso);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + retraso + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + retraso + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + retraso);
      osc.stop(ctx.currentTime + retraso + 0.25);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* el navegador puede bloquear el audio hasta que haya interacción */ }
};

const notificarSistema = (tarea) => {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`🔔 ${tarea.hora} · Agenda`, { body: tarea.texto, tag: `agenda-${tarea.id}` });
    }
  } catch { /* sin soporte */ }
};

const AlarmasAgenda = ({ agendaHoy }) => {
  const { tareas, marcarAvisada, alternarHecha, posponer } = agendaHoy;
  const [activas, setActivas] = useState([]);
  const tareasRef = useRef(tareas);
  const disparadas = useRef(new Set());

  useEffect(() => { tareasRef.current = tareas; }, [tareas]);

  useEffect(() => {
    const revisar = () => {
      const ahora = new Date();
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      const nuevas = tareasRef.current.filter((t) => (
        t.alarma && t.hora && !t.hecha && !t.avisadaAt
        && !disparadas.current.has(`${t.id}-${t.hora}`)
        && minutosDelDia(t.hora) <= minutosAhora
      ));
      if (nuevas.length === 0) return;
      nuevas.forEach((t) => {
        disparadas.current.add(`${t.id}-${t.hora}`);
        marcarAvisada(t.id).catch((err) => console.error(err));
        notificarSistema(t);
      });
      sonar();
      setActivas((prev) => [
        ...prev,
        ...nuevas.map((t) => ({
          ...t,
          tarde: minutosAhora - minutosDelDia(t.hora) > TOLERANCIA_MIN,
        })),
      ]);
    };
    revisar();
    const intervalo = setInterval(revisar, CADA_MS);
    return () => clearInterval(intervalo);
  }, [marcarAvisada]);

  const quitar = (id) => setActivas((prev) => prev.filter((t) => t.id !== id));

  if (activas.length === 0) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 1080, display: 'flex',
        flexDirection: 'column', gap: 8, width: 'min(340px, calc(100vw - 24px))',
      }}
    >
      {activas.map((t) => (
        <div
          key={t.id}
          style={{
            background: '#fff', border: '1px solid #fcd34d', borderLeft: '4px solid #f59e0b',
            borderRadius: 12, padding: '10px 12px', boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e' }}>
            🔔 {t.hora}{t.tarde ? ' · ya pasó la hora' : ''}
          </div>
          <div style={{ fontWeight: 700, color: '#333', margin: '2px 0 8px', wordBreak: 'break-word' }}>{t.texto}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 999, fontWeight: 600 }}
              onClick={() => { alternarHecha(t.id, true); quitar(t.id); }}
            >
              Listo
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: 999 }}
              onClick={() => { posponer(t.id, 10); quitar(t.id); }}
            >
              Posponer 10 min
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ color: '#6c757d' }}
              onClick={() => quitar(t.id)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlarmasAgenda;
