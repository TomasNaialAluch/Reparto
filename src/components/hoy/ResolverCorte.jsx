// Decisión sobre un texto sin reconocer: "es uno existente" o "crear corte nuevo".
// Es un componente controlado; lo usan el panel rápido de la tarjeta y el modal de ingreso.
// Elegir un corte existente se hace con buscador + filtro por categoría (el catálogo puede ser largo).
import { useMemo, useState } from 'react';
import { normalizarNombre } from '../../utils/nombres';
import { formatKg } from '../../utils/pesadas';

const etiqueta = {
  fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em',
};

const toggle = (activo) => ({
  border: '1px solid var(--color-primary-border)', borderRadius: 999, padding: '4px 12px',
  fontSize: '0.8rem', fontWeight: 600,
  background: activo ? 'var(--color-primary)' : '#fff',
  color: activo ? '#fff' : '#3a5060',
});

const chipCategoria = (activo) => ({
  border: '1px solid var(--color-primary-border)', borderRadius: 999, padding: '2px 10px',
  fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap',
  background: activo ? 'var(--color-primary-soft)' : '#fff',
  color: '#3a5060',
  boxShadow: activo ? 'inset 0 0 0 1px var(--color-primary)' : 'none',
});

const ResolverCorte = ({
  pendiente, catalogo, categorias = [], habituales = [], proveedor = '', decision, onChange,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const set = (cambios) => onChange({ ...decision, ...cambios });

  const elegido = catalogo.find((c) => c.id === decision.corteId) || null;
  const aliasRedundante = elegido && normalizarNombre(elegido.nombre) === normalizarNombre(pendiente.texto);

  // Lista filtrada: sugeridos primero, después el catálogo en su orden
  const resultados = useMemo(() => {
    const q = normalizarNombre(busqueda);
    const sugeridos = new Set(pendiente.candidatos || []);
    const veces = new Map(habituales.map((h) => [h.corte.id, h.veces]));
    const puntaje = (c) => (sugeridos.has(c.nombre) ? 1e6 : 0) + (veces.get(c.id) || 0);
    return catalogo
      .filter((c) => (!categoria || c.categoria === categoria)
        && (!q || (c.nombreNormalizado || '').includes(q)
          || (c.alias || []).some((a) => normalizarNombre(a).includes(q))))
      .sort((a, b) => puntaje(b) - puntaje(a));
  }, [busqueda, categoria, catalogo, pendiente.candidatos, habituales]);

  const idsHabituales = useMemo(() => new Set(habituales.map((h) => h.corte.id)), [habituales]);
  // Pista sutil: lo que ese proveedor suele traer (solo cuando todavía no hay nada elegido)
  const pistaHabituales = habituales.slice(0, 4);

  const elegir = (corte) => {
    set({ corteId: corte.id });
    setBusqueda('');
  };

  const crearConLoEscrito = () => {
    set({ modo: 'nuevo', nombreNuevo: busqueda.trim() || pendiente.texto || '' });
  };

  const onBusquedaKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (resultados[0]) elegir(resultados[0]);
    }
  };

  const esSugerido = (c) => (pendiente.candidatos || []).includes(c.nombre);

  return (
    <div style={{ border: '1px solid var(--color-primary-border)', borderRadius: 12, padding: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: '#333' }}>«{pendiente.texto}»</div>
        <div style={{ fontSize: '0.82rem', color: '#6c757d' }}>
          {formatKg(pendiente.kg)} · {pendiente.cantidad} {pendiente.cantidad === 1 ? 'pesada' : 'pesadas'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button type="button" style={toggle(decision.modo === 'existente')} onClick={() => set({ modo: 'existente' })}>
          Es uno existente
        </button>
        <button type="button" style={toggle(decision.modo === 'nuevo')} onClick={() => set({ modo: 'nuevo' })}>
          Crear corte nuevo
        </button>
      </div>

      {decision.modo === 'existente' ? (
        <div style={{ marginTop: 10 }}>
          {elegido ? (
            // Ya elegido: se muestra compacto, con opción de cambiar
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              border: '1px solid var(--color-primary)', background: 'var(--color-primary-soft)',
              borderRadius: 10, padding: '8px 12px',
            }}>
              <span style={{ fontWeight: 700, color: '#3a5060' }}>
                ✔ {elegido.nombre}
                {elegido.categoria ? <span style={{ fontWeight: 500, color: '#6c757d' }}> · {elegido.categoria}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => set({ corteId: '' })}
                style={{ border: 'none', background: 'none', color: '#6c757d', fontSize: '0.8rem', fontWeight: 600 }}
              >
                cambiar
              </button>
            </div>
          ) : (
            <>
              <div style={etiqueta}>Buscar corte</div>
              <input
                type="text"
                autoFocus
                className="form-control form-control-sm"
                placeholder="Escribí para filtrar…"
                value={busqueda}
                autoComplete="off"
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={onBusquedaKeyDown}
              />

              {pistaHabituales.length > 0 && !busqueda && (
                <div style={{ marginTop: 6, fontSize: '0.76rem', color: '#9ca3af', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <span>{proveedor ? `De ${proveedor} suelen entrar:` : 'Suelen entrar:'}</span>
                  {pistaHabituales.map((h) => (
                    <button
                      key={h.corte.id}
                      type="button"
                      onClick={() => elegir(h.corte)}
                      style={{
                        border: 'none', background: 'var(--color-primary-soft)', color: '#3a5060',
                        borderRadius: 999, padding: '1px 9px', fontSize: '0.76rem', fontWeight: 600,
                      }}
                    >
                      {h.corte.nombre}
                    </button>
                  ))}
                </div>
              )}

              {categorias.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                  <button type="button" style={chipCategoria(!categoria)} onClick={() => setCategoria('')}>Todas</button>
                  {categorias.map((c) => (
                    <button key={c} type="button" style={chipCategoria(categoria === c)} onClick={() => setCategoria(categoria === c ? '' : c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <div style={{
                marginTop: 8, maxHeight: 170, overflowY: 'auto',
                border: '1px solid var(--color-primary-soft)', borderRadius: 10,
              }}>
                {resultados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => elegir(c)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, padding: '7px 12px', border: 'none', background: 'transparent', textAlign: 'left',
                      borderBottom: '1px solid var(--color-primary-soft)', fontSize: '0.9rem', color: '#333',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontWeight: esSugerido(c) ? 700 : 500 }}>
                      {c.nombre}
                      {esSugerido(c) ? <span style={{ color: '#166534', fontSize: '0.72rem', marginLeft: 6 }}>sugerido</span> : null}
                      {!esSugerido(c) && idsHabituales.has(c.id)
                        ? <span style={{ color: '#9ca3af', fontSize: '0.72rem', marginLeft: 6 }}>habitual</span> : null}
                    </span>
                    {c.categoria ? <span style={{ color: '#9ca3af', fontSize: '0.74rem' }}>{c.categoria}</span> : null}
                  </button>
                ))}
                {resultados.length === 0 && (
                  <div style={{ padding: '10px 12px', fontSize: '0.86rem', color: '#6c757d' }}>
                    Ningún corte coincide.{' '}
                    <button
                      type="button"
                      onClick={crearConLoEscrito}
                      style={{ border: 'none', background: 'none', color: 'var(--color-primary-dark)', fontWeight: 700, padding: 0 }}
                    >
                      Crear «{(busqueda.trim() || pendiente.texto)}» como corte nuevo
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
                {resultados.length} {resultados.length === 1 ? 'corte' : 'cortes'} · Enter elige el primero
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 10, marginTop: 10 }}>
          <div>
            <div style={etiqueta}>Nombre</div>
            <input
              className="form-control form-control-sm"
              value={decision.nombreNuevo}
              onChange={(e) => set({ nombreNuevo: e.target.value })}
            />
          </div>
          <div>
            <div style={etiqueta}>Categoría</div>
            <input
              className="form-control form-control-sm"
              list="hoy-categorias-cortes"
              value={decision.categoria}
              onChange={(e) => set({ categoria: e.target.value })}
              placeholder="Opcional"
            />
            <datalist id="hoy-categorias-cortes">
              {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>
      )}

      {decision.modo === 'existente' && elegido && !aliasRedundante && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: '0.82rem', color: '#3a5060' }}>
          <input
            type="checkbox"
            checked={decision.recordar}
            onChange={(e) => set({ recordar: e.target.checked })}
          />
          Recordar «{pendiente.texto}» como {elegido.nombre} para la próxima
        </label>
      )}
    </div>
  );
};

export default ResolverCorte;
