// "Hoy": a quién se le escribe hoy, a qué hora y cómo viene cada uno, con el resumen del día y los próximos días.
// Sin el envío automático conectado, el estado de cada cliente es "Programado": es la agenda de lo que va a salir.
import { useMemo } from 'react';
import { GRUPOS_RESUMEN } from '../../utils/pedidosEstados';
import { sumarDias } from '../../utils/pesadas';
import {
  DIAS, aplicarVariables, diaSemana, normalizarTelefonoAR, tocaEnFecha,
} from '../../utils/whatsapp';
import { IconCalendar } from '../gestionSemanal/icons';
import EnvioCard from './EnvioCard';
import { COLORES } from './colores';
import { BotonGhost, Eyebrow, Punto, VacioEstado } from './ui';

const cantidad = (n) => `${n} ${n === 1 ? 'cliente' : 'clientes'}`;

const estadoDe = (prog, fecha, mensajes, tieneNumero) => {
  if (!tieneNumero) return 'sinNumero';
  const deHoy = mensajes.filter((m) => m.clienteId === prog.clienteId && m.fecha === fecha);
  if (deHoy.some((m) => m.direccion === 'entrante')) return 'contesto';
  const saliente = deHoy.find((m) => m.direccion === 'saliente');
  if (saliente?.estado === 'fallido') return 'fallido';
  if (['enviado', 'entregado', 'leido'].includes(saliente?.estado)) return saliente.estado;
  return 'programado';
};

const detalleDe = (estado, prog, fecha, mensajes) => {
  if (estado === 'sinNumero') return 'Cargá un WhatsApp válido para que salga';
  if (estado === 'contesto') {
    const respuesta = mensajes.find((m) => m.clienteId === prog.clienteId && m.fecha === fecha && m.direccion === 'entrante');
    return `Contestó: "${respuesta?.texto || ''}"`;
  }
  return aplicarVariables(prog.mensaje, { nombre: prog.cliente });
};

const HoyTocaTab = ({
  fecha, programaciones, clientesPorId, mensajes, onRevisar, onCorregir, onIrAProgramacion,
}) => {
  const items = useMemo(
    () => programaciones
      .filter((p) => tocaEnFecha(p, fecha))
      .sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')))
      .map((p) => {
        const tel = normalizarTelefonoAR(clientesPorId[p.clienteId]?.contacto?.telefono);
        const estado = estadoDe(p, fecha, mensajes, !!tel);
        return { prog: p, estado, detalle: detalleDe(estado, p, fecha, mensajes) };
      }),
    [programaciones, fecha, clientesPorId, mensajes]
  );

  const proximos = useMemo(
    () => [1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const f = sumarDias(fecha, i);
        return { fecha: f, n: programaciones.filter((p) => tocaEnFecha(p, f)).length };
      })
      .filter((d) => d.n > 0)
      .slice(0, 5),
    [programaciones, fecha]
  );

  const accionDe = (item) => {
    if (item.estado === 'contesto') {
      return <BotonGhost onClick={onRevisar} color="#1a5c2a" borde="#28a745">Revisar</BotonGhost>;
    }
    if (item.estado === 'sinNumero') {
      return <BotonGhost onClick={() => onCorregir(item.prog.clienteId)} color="#8b1c26" borde="#dc3545">Corregir</BotonGhost>;
    }
    return null;
  };

  return (
    <div className="pedidos-hoy-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <Eyebrow style={{ marginBottom: 2 }}>Salen hoy · {cantidad(items.length)}</Eyebrow>
        {items.length === 0 ? (
          <VacioEstado
            icono={<IconCalendar size={28} />}
            titulo="Hoy no sale ningún mensaje"
            detalle="Elegí los días y la hora de cada cliente en Programación."
            accion={<BotonGhost onClick={onIrAProgramacion}>Ir a Programación</BotonGhost>}
          />
        ) : items.map((item) => (
          <EnvioCard
            key={item.prog.id}
            hora={item.prog.hora}
            cliente={item.prog.cliente}
            detalle={item.detalle}
            estado={item.estado}
            accion={accionDe(item)}
          />
        ))}
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ background: COLORES.gris, borderRadius: 8, padding: '10px 12px' }}>
          <Eyebrow style={{ marginBottom: 8 }}>Resumen del día</Eyebrow>
          {GRUPOS_RESUMEN.map((g) => (
            <div key={g.clave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: 5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#495057' }}>
                <Punto color={g.acento} />{g.texto}
              </span>
              <b style={{ fontWeight: 700, color: COLORES.texto }}>{items.filter((i) => g.estados.includes(i.estado)).length}</b>
            </div>
          ))}
        </div>

        <div>
          <Eyebrow style={{ marginBottom: 8 }}>Próximos días</Eyebrow>
          {proximos.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: COLORES.muted }}>No hay nada programado esta semana.</div>
          )}
          {proximos.map((d) => (
            <div key={d.fecha} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: COLORES.muted, marginBottom: 5 }}>
              <span>{DIAS.find((x) => x.n === diaSemana(d.fecha))?.corto} {Number(d.fecha.slice(8))}</span>
              <span>{cantidad(d.n)}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default HoyTocaTab;
