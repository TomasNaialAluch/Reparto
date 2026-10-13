// Hoja del día: renglones de cuaderno con hora y alarma opcionales.
// Ver README-PAGINA-HOY.md (sección 8, Agenda) y README-ROADMAP-HOY.md (Fases 4 y 5).
import { useMemo, useState } from 'react';
import { parsearTarea, fechaCorta } from '../../utils/agenda';
import { IconTrash } from '../gestionSemanal/icons';

const Check = ({ hecha, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
    style={{
      width: 20, height: 20, borderRadius: 6, flexShrink: 0, padding: 0, lineHeight: 1,
      border: `1.5px solid ${hecha ? 'var(--color-primary)' : 'var(--color-primary-border)'}`,
      background: hecha ? 'var(--color-primary)' : '#fff', color: '#fff', fontSize: '0.8rem',
    }}
  >
    {hecha ? '✓' : ''}
  </button>
);

const Campana = ({ activa, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={activa ? 'Alarma prendida' : 'Alarma apagada'}
    style={{
      border: 'none', background: 'none', padding: 2, fontSize: '0.95rem', lineHeight: 1,
      opacity: activa ? 1 : 0.3, filter: activa ? 'none' : 'grayscale(1)',
    }}
  >
    🔔
  </button>
);

const Renglon = ({ tarea, onHecha, onAlarma, onEliminar, extra }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const borrar = async () => {
    setBorrando(true);
    try {
      await onEliminar(tarea);
    } catch (err) {
      console.error(err);
      setBorrando(false);
      setConfirmando(false);
    }
  };

  if (confirmando) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8,
          background: '#fef2f2', borderBottom: '1px solid var(--color-primary-soft)',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', color: '#7f1d1d', wordBreak: 'break-word' }}>
          ¿Borrar «{tarea.texto}»?
        </span>
        <button
          type="button"
          disabled={borrando}
          onClick={borrar}
          style={{
            border: 'none', background: '#dc2626', color: '#fff', borderRadius: 999,
            padding: '2px 12px', fontSize: '0.78rem', fontWeight: 700,
          }}
        >
          {borrando ? 'Borrando…' : 'Borrar'}
        </button>
        <button
          type="button"
          disabled={borrando}
          onClick={() => setConfirmando(false)}
          style={{
            border: '1px solid var(--color-primary-border)', background: '#fff', color: '#3a5060',
            borderRadius: 999, padding: '2px 12px', fontSize: '0.78rem', fontWeight: 600,
          }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 2px',
      borderBottom: '1px solid var(--color-primary-soft)',
    }}
  >
    <Check hecha={tarea.hecha} onClick={() => onHecha(tarea)} />
    <span
      style={{
        width: 46, flexShrink: 0, fontSize: '0.8rem', fontWeight: 700,
        color: tarea.hora ? '#3a5060' : '#d1d5db',
      }}
    >
      {tarea.hora || '— —'}
    </span>
    <span
      style={{
        flex: 1, minWidth: 0, fontSize: '0.92rem', wordBreak: 'break-word',
        color: tarea.hecha ? '#9ca3af' : '#333', textDecoration: tarea.hecha ? 'line-through' : 'none',
      }}
    >
      {tarea.texto}
    </span>
    {extra}
    {tarea.hora && !tarea.hecha && <Campana activa={!!tarea.alarma} onClick={() => onAlarma(tarea)} />}
    <button
      type="button"
      aria-label="Borrar tarea"
      title="Borrar"
      onClick={() => setConfirmando(true)}
      style={{ border: 'none', background: 'none', color: '#9ca3af', padding: 4, lineHeight: 1 }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
    >
      <IconTrash size={14} />
    </button>
  </div>
  );
};

const AgendaBloque = ({ agenda, esHoy, hoy }) => {
  const {
    tareas, pendientesAnteriores, loading,
    agregarTarea, alternarHecha, alternarAlarma, moverAFecha, eliminarTarea,
  } = agenda;
  const [linea, setLinea] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const parseado = useMemo(() => parsearTarea(linea), [linea]);
  const pendientes = tareas.filter((t) => !t.hecha).length;

  const pedirPermisoNotificaciones = () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch { /* sin soporte: la alarma igual avisa dentro de la página */ }
  };

  const agregar = async () => {
    if (!parseado.texto || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await agregarTarea({ texto: parseado.texto, hora: parseado.hora });
      if (parseado.hora) pedirPermisoNotificaciones();
      setLinea('');
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Probá de nuevo');
    } finally {
      setGuardando(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregar();
    }
  };

  const alternarAlarmaConPermiso = (t) => {
    if (!t.alarma) pedirPermisoNotificaciones();
    alternarAlarma(t.id, !t.alarma);
  };

  return (
    <section className="hoy-zona">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: '#3a5060' }}>Agenda</div>
        {pendientes > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d' }}>
            {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'}
          </span>
        )}
      </div>

      <input
        type="text"
        value={linea}
        placeholder="Anotá algo… (10 sacar vtv camioneta)"
        autoComplete="off"
        disabled={guardando}
        onChange={(e) => { setLinea(e.target.value); setError(''); }}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: '0.92rem',
          border: '1px solid var(--color-primary-border)', outline: 'none',
        }}
      />
      <div style={{ fontSize: '0.74rem', minHeight: 18, marginTop: 4, color: '#9ca3af' }}>
        {parseado.texto
          ? <>→ {parseado.hora ? <strong style={{ color: '#3a5060' }}>{parseado.hora}</strong> : 'sin hora'} · {parseado.texto} · Enter agrega</>
          : 'Con hora al principio queda ordenada y con alarma: 10 llamar a Sur · 16:30 pagar flete'}
      </div>
      {error && <div style={{ color: '#b45309', fontSize: '0.8rem' }}>{error}</div>}

      <div style={{ marginTop: 6 }}>
        {loading ? (
          <div style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '8px 0' }}>Cargando…</div>
        ) : tareas.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: '0.86rem', padding: '10px 0 4px' }}>
            Nada anotado para este día.
          </div>
        ) : (
          tareas.map((t) => (
            <Renglon
              key={t.id}
              tarea={t}
              onHecha={(x) => alternarHecha(x.id, !x.hecha)}
              onAlarma={alternarAlarmaConPermiso}
              onEliminar={(x) => eliminarTarea(x.id)}
            />
          ))
        )}
      </div>

      {esHoy && pendientesAnteriores.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quedaron de días anteriores
          </div>
          {pendientesAnteriores.map((t) => (
            <Renglon
              key={t.id}
              tarea={t}
              onHecha={(x) => alternarHecha(x.id, !x.hecha)}
              onAlarma={() => {}}
              onEliminar={(x) => eliminarTarea(x.id)}
              extra={(
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>{fechaCorta(t.fecha)}</span>
                  <button
                    type="button"
                    onClick={() => moverAFecha(t.id, hoy)}
                    style={{
                      border: '1px solid var(--color-primary-border)', background: '#fff', color: '#3a5060',
                      borderRadius: 999, padding: '0 8px', fontSize: '0.72rem', fontWeight: 600,
                    }}
                  >
                    pasar a hoy
                  </button>
                </span>
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default AgendaBloque;
