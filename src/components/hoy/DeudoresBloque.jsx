// Deudores: quién debe y cuánto, juntando a mano, Mi Reparto y Saldo en una sola lista.
// Un mismo contacto aparece una vez, con el total y de dónde viene. "cobrar" agrega "cobrar a …" a la agenda.
import { useMemo, useState } from 'react';
import { calcularDeudores, ORIGENES } from '../../utils/deudores';
import { formatCurrency } from '../../utils/money';
import { normalizarNombre } from '../../utils/nombres';
import { useDeudores } from '../../hooks/useDeudores';

const COLOR_ORIGEN = {
  mano: { fondo: '#ede9fe', color: '#5b21b6' },
  reparto: { fondo: '#dbeafe', color: '#1e40af' },
  saldo: { fondo: '#fef3c7', color: '#92400e' },
};

const DeudoresBloque = ({ buscarExacto, agenda }) => {
  const fuentes = useDeudores();
  const [abierto, setAbierto] = useState(null);
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const deudores = useMemo(
    () => (fuentes.loading ? [] : calcularDeudores(fuentes, buscarExacto)),
    [fuentes, buscarExacto]
  );

  const q = normalizarNombre(busqueda);
  const visibles = q ? deudores.filter((d) => normalizarNombre(d.nombre).includes(q)) : deudores;
  const total = deudores.reduce((t, d) => t + d.total, 0);

  const cobrarA = async (d) => {
    const texto = `cobrar a ${d.nombre}`;
    const yaEsta = agenda.tareas.some((t) => !t.hecha && normalizarNombre(t.texto) === normalizarNombre(texto));
    if (yaEsta) {
      setAviso(`«${texto}» ya está en la agenda`);
    } else {
      try {
        await agenda.agregarTarea({ texto });
        setAviso(`Agregado a la agenda: ${texto}`);
      } catch (err) {
        console.error(err);
        setAviso('No se pudo agregar a la agenda');
      }
    }
    setTimeout(() => setAviso(''), 3000);
  };

  return (
    <section className="hoy-zona">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: '#3a5060', flex: 1 }}>Deudores</div>
        {deudores.length > 0 && (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c' }}>{formatCurrency(total)}</span>
        )}
      </div>

      {deudores.length > 6 && (
        <input
          type="text"
          value={busqueda}
          placeholder="Buscar…"
          autoComplete="off"
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%', marginBottom: 6, padding: '4px 9px', borderRadius: 8, fontSize: '0.85rem',
            border: '1px dashed var(--color-primary-border)', outline: 'none', background: 'transparent',
          }}
        />
      )}

      {fuentes.loading ? (
        <div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Cargando…</div>
      ) : deudores.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Nadie debe nada.</div>
      ) : (
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {visibles.map((d) => (
            <div key={d.clave} style={{ borderBottom: '1px solid var(--color-primary-soft)', padding: '5px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setAbierto(abierto === d.clave ? null : d.clave)}
                  style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 'none', background: 'none', padding: 0, fontSize: '0.9rem', color: '#333' }}
                >
                  <span style={{ wordBreak: 'break-word' }}>{d.nombre}</span>
                  <span style={{ marginLeft: 6, display: 'inline-flex', gap: 3 }}>
                    {d.partes.map((p) => (
                      <span
                        key={p.origen}
                        style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 999, padding: '0 6px', background: COLOR_ORIGEN[p.origen].fondo, color: COLOR_ORIGEN[p.origen].color }}
                      >
                        {ORIGENES[p.origen]}
                      </span>
                    ))}
                  </span>
                </button>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#b91c1c', whiteSpace: 'nowrap' }}>{formatCurrency(d.total)}</span>
                <button
                  type="button"
                  title="Agregar «cobrar a …» a la agenda"
                  aria-label={`Agregar cobrar a ${d.nombre} a la agenda`}
                  onClick={() => cobrarA(d)}
                  style={{ border: '1px solid var(--color-primary-border)', background: 'var(--color-primary-soft)', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, padding: '1px 8px', color: '#3a5060' }}
                >
                  cobrar
                </button>
              </div>
              {abierto === d.clave && (
                <div style={{ marginTop: 3, paddingLeft: 4, fontSize: '0.78rem', color: '#6c757d' }}>
                  {d.partes.map((p) => (
                    <div key={p.origen}>
                      {ORIGENES[p.origen]}: {formatCurrency(p.monto)}
                      {p.detalles.length > 0 && ` · ${[...new Set(p.detalles)].sort().join(', ')}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {aviso && <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#166534' }}>{aviso}</div>}
    </section>
  );
};

export default DeudoresBloque;
