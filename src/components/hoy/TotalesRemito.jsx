// Totales por corte con verificación contra el remito.
// El remito puede cargarse por corte, solo como total general, o las dos cosas.
// La comparación se hace con lo pesado (kg reales); la diferencia queda a la vista.
import { useEffect, useMemo, useState } from 'react';
import { formatKg, parseKg, redondearKg } from '../../utils/pesadas';
import { normalizarNombre } from '../../utils/nombres';

const TOLERANCIA_KG = 0.05;

/** Input numérico que confirma al salir del campo o con Enter. */
const NumeroInput = ({ valor, onConfirmar, placeholder = '—', deshabilitado = false }) => {
  const [texto, setTexto] = useState(valor === null || valor === undefined ? '' : String(valor).replace('.', ','));
  useEffect(() => {
    setTexto(valor === null || valor === undefined ? '' : String(valor).replace('.', ','));
  }, [valor]);

  const confirmar = () => {
    const limpio = texto.trim();
    if (limpio === '') {
      if (valor !== null && valor !== undefined) onConfirmar(null);
      return;
    }
    const n = parseKg(limpio);
    if (Number.isNaN(n) || n < 0) {
      setTexto(valor === null || valor === undefined ? '' : String(valor).replace('.', ','));
      return;
    }
    if (n !== valor) onConfirmar(redondearKg(n));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      placeholder={placeholder}
      disabled={deshabilitado}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{
        width: 82, textAlign: 'right', fontSize: '0.85rem', padding: '2px 6px', borderRadius: 7,
        border: '1px solid var(--color-primary-border)', background: deshabilitado ? 'transparent' : '#fff',
      }}
    />
  );
};

const estadoDiferencia = (pesado, remito) => {
  if (remito === null || remito === undefined) return null;
  const d = redondearKg(pesado - remito);
  if (Math.abs(d) < TOLERANCIA_KG) return { tipo: 'ok', texto: '✔ coincide', color: '#166534', d: 0 };
  if (d > 0) return { tipo: 'sobra', texto: `+${formatKg(d)}`, color: '#b45309', d };
  return { tipo: 'falta', texto: `−${formatKg(Math.abs(d))}`, color: '#b91c1c', d };
};

const TotalesRemito = ({ totales, remito, remitoPorCorte, soloLectura, onGuardar }) => {
  const [mostrar, setMostrar] = useState(false);
  const [nuevo, setNuevo] = useState({ corte: '', kg: '' });

  const porCorte = useMemo(() => remitoPorCorte || {}, [remitoPorCorte]);
  const hayRemito = remito?.totalKg != null || Object.keys(porCorte).length > 0;
  const verRemito = mostrar || hayRemito;

  // Filas: lo pesado + lo que figura en el remito y no se pesó
  const filas = useMemo(() => {
    const vistas = new Set();
    const lista = totales.cortes.map((c) => {
      const key = normalizarNombre(c.corte);
      vistas.add(key);
      return { key, corte: c.corte, cantidad: c.cantidad, kg: c.kg, pendiente: c.pendiente, remito: porCorte[key]?.kg ?? null };
    });
    Object.entries(porCorte).forEach(([key, v]) => {
      if (!vistas.has(key)) lista.push({ key, corte: v.corte, cantidad: 0, kg: 0, pendiente: false, remito: v.kg, soloRemito: true });
    });
    return lista;
  }, [totales.cortes, porCorte]);

  const sumaRemitoPorCorte = useMemo(() => {
    const valores = Object.values(porCorte).map((v) => Number(v.kg) || 0);
    return valores.length ? redondearKg(valores.reduce((a, b) => a + b, 0)) : null;
  }, [porCorte]);
  const totalRemito = remito?.totalKg ?? sumaRemitoPorCorte;
  const diferenciaTotal = estadoDiferencia(totales.kg, totalRemito);

  const guardarCorte = (fila, kg) => {
    const copia = { ...porCorte };
    if (kg === null) delete copia[fila.key];
    else copia[fila.key] = { corte: fila.corte, kg };
    onGuardar({ porCorte: copia });
  };

  const agregarSoloRemito = () => {
    const nombre = nuevo.corte.trim();
    const kg = parseKg(nuevo.kg);
    if (!nombre || Number.isNaN(kg) || !(kg > 0)) return;
    onGuardar({ porCorte: { ...porCorte, [normalizarNombre(nombre)]: { corte: nombre, kg: redondearKg(kg) } } });
    setNuevo({ corte: '', kg: '' });
  };

  return (
    <div style={{ marginTop: 12 }}>
      {!verRemito && !soloLectura && (
        <button
          type="button"
          onClick={() => setMostrar(true)}
          style={{
            border: '1px solid var(--color-primary-border)', background: 'var(--color-primary-soft)', color: '#3a5060',
            borderRadius: 999, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8,
          }}
        >
          Verificar con remito
        </button>
      )}

      <table className="table table-sm" style={{ marginBottom: 0, fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ color: '#6c757d', fontSize: '0.72rem', textTransform: 'uppercase' }}>
            <th style={{ fontWeight: 600 }}>Corte</th>
            <th style={{ fontWeight: 600, textAlign: 'right' }}>Pes.</th>
            <th style={{ fontWeight: 600, textAlign: 'right' }}>Kg</th>
            {verRemito && <th style={{ fontWeight: 600, textAlign: 'right' }}>Remito</th>}
            {verRemito && <th style={{ fontWeight: 600, textAlign: 'right' }}>Dif.</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const dif = estadoDiferencia(f.kg, f.remito);
            return (
              <tr key={`${f.pendiente ? 't' : 'c'}:${f.key}`}>
                <td>
                  {f.corte}
                  {f.pendiente ? <span style={{ color: '#b45309' }}> ⚠</span> : null}
                  {f.soloRemito ? <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}> (no pesado)</span> : null}
                </td>
                <td style={{ textAlign: 'right' }}>{f.cantidad}</td>
                <td style={{ textAlign: 'right' }}>{formatKg(f.kg)}</td>
                {verRemito && (
                  <td style={{ textAlign: 'right' }}>
                    <NumeroInput valor={f.remito} deshabilitado={soloLectura} onConfirmar={(kg) => guardarCorte(f, kg)} />
                  </td>
                )}
                {verRemito && (
                  <td style={{ textAlign: 'right', color: dif?.color, fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {dif ? dif.texto : '—'}
                  </td>
                )}
              </tr>
            );
          })}
          <tr style={{ fontWeight: 800 }}>
            <td>Total</td>
            <td style={{ textAlign: 'right' }}>{totales.cantidad}</td>
            <td style={{ textAlign: 'right' }}>{formatKg(totales.kg)}</td>
            {verRemito && (
              <td style={{ textAlign: 'right' }}>
                <NumeroInput
                  valor={remito?.totalKg ?? null}
                  placeholder={sumaRemitoPorCorte !== null ? String(sumaRemitoPorCorte).replace('.', ',') : '—'}
                  deshabilitado={soloLectura}
                  onConfirmar={(kg) => onGuardar({ totalKg: kg })}
                />
              </td>
            )}
            {verRemito && (
              <td style={{ textAlign: 'right', color: diferenciaTotal?.color, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {diferenciaTotal ? diferenciaTotal.texto : '—'}
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {verRemito && !soloLectura && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: '#9ca3af' }}>Figura en el remito y no se pesó:</span>
          <input
            type="text"
            placeholder="Corte"
            value={nuevo.corte}
            onChange={(e) => setNuevo((p) => ({ ...p, corte: e.target.value }))}
            style={{ width: 110, fontSize: '0.8rem', padding: '2px 6px', borderRadius: 7, border: '1px solid var(--color-primary-border)' }}
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Kg"
            value={nuevo.kg}
            onChange={(e) => setNuevo((p) => ({ ...p, kg: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarSoloRemito(); } }}
            style={{ width: 62, textAlign: 'right', fontSize: '0.8rem', padding: '2px 6px', borderRadius: 7, border: '1px solid var(--color-primary-border)' }}
          />
          <button
            type="button"
            onClick={agregarSoloRemito}
            style={{ border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: 7, fontSize: '0.8rem', padding: '2px 10px' }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default TotalesRemito;
