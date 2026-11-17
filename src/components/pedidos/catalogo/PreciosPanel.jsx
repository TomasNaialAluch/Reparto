// Precios por kilo que el bot manda cuando el cliente pide "precios" (opción 3 del menú).
// Los cortes salen del catálogo de Mercadería; acá solo se les pone precio y si están disponibles.
// Se guarda solo, al salir del campo o al apretar Enter.
import { useEffect, useMemo, useState } from 'react';
import { normalizarNombre } from '../../../utils/nombres';
import { parsearPrecio, textoPrecios } from '../../../utils/pedidosBot';
import { IconSearch } from '../../gestionSemanal/icons';
import { COLORES } from '../colores';
import { Eyebrow, Pill, VacioEstado } from '../ui';
import { INPUT, card } from './estilosCatalogo';
import { Interruptor, Nota, VistaPrevia } from './piezas';

const fechaCorta = (f) => {
  const [, m, d] = String(f || '').split('-');
  return m && d ? `${Number(d)}/${Number(m)}` : '';
};

const FilaPrecio = ({ corte, guardado, onGuardar }) => {
  const [texto, setTexto] = useState(guardado?.precioKg ? String(guardado.precioKg) : '');
  const [error, setError] = useState('');
  const [estado, setEstado] = useState(''); // '' | 'guardando' | 'guardado'
  const disponible = guardado ? guardado.disponible !== false : true;

  // Si el precio cambia desde otro lado (otra pestaña o persona), el campo lo refleja.
  useEffect(() => { setTexto(guardado?.precioKg ? String(guardado.precioKg) : ''); }, [guardado?.precioKg]);

  const guardar = async (nuevoTexto, nuevoDisponible) => {
    const precio = parsearPrecio(nuevoTexto);
    if (Number.isNaN(precio)) { setError('Poné un precio válido, por ejemplo 12500.'); return; }
    setError('');
    setEstado('guardando');
    try {
      await onGuardar(corte.id, { corte: corte.nombre, precioKg: precio, disponible: nuevoDisponible });
      setEstado('guardado');
      setTimeout(() => setEstado(''), 1500);
    } catch (e) {
      console.error(e);
      setError('No se pudo guardar. Probá de nuevo.');
      setEstado('');
    }
  };

  const alSalir = () => {
    if (!texto.trim()) { setError(''); return; } // vacío = sin precio, no se guarda nada
    if (parsearPrecio(texto) === guardado?.precioKg) return;
    guardar(texto, disponible);
  };

  const sinPrecio = !guardado?.precioKg;

  return (
    <div style={card(sinPrecio ? '#d3d9de' : disponible ? '#28a745' : '#adb5bd')}>
      <div className="pedidos-fila" style={{ display: 'flex', alignItems: 'center', gap: 12, rowGap: 8 }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontWeight: 600, color: COLORES.texto, fontSize: '0.9rem' }}>{corte.nombre}</div>
          <div style={{ fontSize: '0.72rem', color: COLORES.muted }}>
            {sinPrecio ? 'Sin precio: el bot no lo manda' : `Actualizado el ${fechaCorta(guardado.actualizado)}`}
          </div>
        </div>
        <div style={{ width: 150, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: 7, color: COLORES.muted, fontSize: '0.88rem' }}>$</span>
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Precio por kilo de ${corte.nombre}`}
            value={texto}
            placeholder="por kg"
            onChange={(e) => { setTexto(e.target.value); setError(''); }}
            onBlur={alSalir}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{ ...INPUT, paddingLeft: 22, textAlign: 'right' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 108 }}>
          <Interruptor
            activo={disponible}
            etiqueta={`${corte.nombre} disponible`}
            deshabilitado={sinPrecio}
            onCambiar={(v) => guardar(String(guardado.precioKg), v)}
          />
          <span style={{ fontSize: '0.75rem', color: COLORES.muted }}>{disponible ? 'Disponible' : 'Sin stock'}</span>
        </div>
        <div style={{ width: 62, textAlign: 'right' }}>
          {estado === 'guardando' && <span style={{ fontSize: '0.72rem', color: COLORES.muted }}>Guardando</span>}
          {estado === 'guardado' && <Pill fondo="rgba(40,167,69,0.1)" color="#1a5c2a">Listo</Pill>}
        </div>
      </div>
      {error && <div style={{ color: '#8b1c26', fontSize: '0.74rem', marginTop: 6 }}>{error}</div>}
    </div>
  );
};

const PreciosPanel = ({ cortes, cargandoCortes, precios, actualizado, onGuardar }) => {
  const [buscar, setBuscar] = useState('');
  const porCorte = useMemo(() => Object.fromEntries(precios.map((p) => [p.id, p])), [precios]);

  const visibles = useMemo(() => {
    const q = normalizarNombre(buscar);
    return q ? cortes.filter((c) => normalizarNombre(c.nombre).includes(q)) : cortes;
  }, [cortes, buscar]);

  const conPrecio = precios.filter((p) => p.precioKg > 0).length;

  if (!cargandoCortes && cortes.length === 0) {
    return (
      <VacioEstado
        titulo="Todavía no hay cortes"
        detalle="Los cortes se cargan desde Mercadería. Cuando existan, acá les ponés el precio."
      />
    );
  }

  return (
    <div className="pedidos-hoy-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: 8, color: COLORES.muted }}><IconSearch size={14} /></span>
            <input
              type="search"
              value={buscar}
              placeholder="Buscar un corte"
              aria-label="Buscar un corte"
              onChange={(e) => setBuscar(e.target.value)}
              style={{ ...INPUT, paddingLeft: 30 }}
            />
          </div>
          <Pill fondo="rgba(106,136,153,0.12)" color={COLORES.aceroOscuro}>{conPrecio} de {cortes.length} con precio</Pill>
        </div>

        {visibles.map((c) => (
          <FilaPrecio key={c.id} corte={c} guardado={porCorte[c.id]} onGuardar={onGuardar} />
        ))}
        {visibles.length === 0 && !cargandoCortes && (
          <VacioEstado titulo="Ningún corte coincide" detalle="Probá con otra palabra." />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'start' }}>
        <VistaPrevia texto={textoPrecios(precios, actualizado)} titulo="Así se manda por WhatsApp" />
        <Nota>
          <Eyebrow style={{ marginBottom: 4 }}>Cómo funciona</Eyebrow>
          El bot manda solo los cortes con precio y disponibles, ordenados por nombre, con la fecha de la última actualización.
        </Nota>
      </div>
    </div>
  );
};

export default PreciosPanel;
