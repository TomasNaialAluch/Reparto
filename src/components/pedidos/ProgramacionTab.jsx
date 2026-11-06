// Programación: a qué clientes se les escribe, qué días, a qué hora y con qué mensaje.
// El WhatsApp del cliente es el teléfono del contacto (`contacto.telefono`): se edita acá o en Proveedores y Clientes.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizarNombre } from '../../utils/nombres';
import {
  DIAS, MENSAJE_BASE, aplicarVariables, normalizarTelefonoAR, resumenDias,
} from '../../utils/whatsapp';
import { ETIQUETAS, chip, input, tarjeta } from './estilos';

const EstadoTelefono = ({ telefono }) => {
  if (!String(telefono || '').trim()) return <span style={ETIQUETAS.aviso}>sin WhatsApp</span>;
  const normalizado = normalizarTelefonoAR(telefono);
  if (!normalizado) return <span style={ETIQUETAS.error}>número a revisar</span>;
  return <span style={ETIQUETAS.ok}>{normalizado}</span>;
};

const FilaCliente = ({ cliente, programacion, onGuardar, onGuardarTelefono, onQuitar }) => {
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState(programacion?.dias || []);
  const [hora, setHora] = useState(programacion?.hora || '08:00');
  const [mensaje, setMensaje] = useState(programacion?.mensaje || MENSAJE_BASE);
  const [activo, setActivo] = useState(programacion ? programacion.activo !== false : true);
  const [telefono, setTelefono] = useState(cliente.contacto?.telefono || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const abrir = () => {
    setDias(programacion?.dias || []);
    setHora(programacion?.hora || '08:00');
    setMensaje(programacion?.mensaje || MENSAJE_BASE);
    setActivo(programacion ? programacion.activo !== false : true);
    setTelefono(cliente.contacto?.telefono || '');
    setError('');
    setAbierto(true);
  };

  const alternarDia = (n) => setDias((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));

  const guardar = async () => {
    if (dias.length === 0) { setError('Elegí al menos un día.'); return; }
    if (!mensaje.trim()) { setError('Escribí el mensaje.'); return; }
    if (activo && !normalizarTelefonoAR(telefono)) {
      setError('Para dejarlo activo hace falta un WhatsApp válido (ej. 11 4567-8901).');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (telefono.trim() !== (cliente.contacto?.telefono || '').trim()) {
        await onGuardarTelefono(cliente.id, telefono);
      }
      await onGuardar(cliente.id, { cliente: cliente.nombre, dias, hora, mensaje: mensaje.trim(), activo });
      setAbierto(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async () => {
    setGuardando(true);
    try {
      await onQuitar(cliente.id);
      setAbierto(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo quitar.');
    } finally {
      setGuardando(false);
    }
  };

  const telefonoActual = cliente.contacto?.telefono || '';

  return (
    <div style={{ ...tarjeta, borderLeft: `4px solid ${programacion?.activo !== false && programacion ? '#16a34a' : 'var(--color-primary-border)'}` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={(e) => { if (e.key === 'Enter') (abierto ? setAbierto(false) : abrir()); }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontWeight: 800, color: '#333' }}>{cliente.nombre}</div>
          <EstadoTelefono telefono={telefonoActual} />
        </div>
        {programacion ? (
          <div style={{ fontSize: '0.85rem', color: '#3a5060', fontWeight: 600 }}>
            {resumenDias(programacion.dias)} · {programacion.hora}
            {programacion.activo === false && <span style={{ ...ETIQUETAS.neutra, marginLeft: 8 }}>pausado</span>}
          </div>
        ) : (
          <span style={ETIQUETAS.neutra}>sin programar</span>
        )}
      </div>

      {abierto && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700, color: '#3a5060' }}>
            WhatsApp del cliente
            <input
              type="tel" style={input} value={telefono} placeholder="11 4567-8901"
              onChange={(e) => setTelefono(e.target.value)}
            />
            <span><EstadoTelefono telefono={telefono} /></span>
          </label>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3a5060', marginBottom: 4 }}>Días</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIAS.map((d) => (
                <button key={d.n} type="button" style={chip(dias.includes(d.n))} onClick={() => alternarDia(d.n)}>
                  {d.corto}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700, color: '#3a5060', maxWidth: 140 }}>
            Hora
            <input type="time" style={input} value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700, color: '#3a5060' }}>
            Mensaje (usá {'{nombre}'} para el nombre del cliente)
            <textarea
              rows={3} style={{ ...input, resize: 'vertical' }} value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
            <span style={{ fontWeight: 500, color: '#6b7280' }}>
              Así lo recibe: {aplicarVariables(mensaje, { nombre: cliente.nombre })}
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#3a5060' }}>
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo (si está pausado no se le escribe)
          </label>

          {error && <div style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={chip(true)} disabled={guardando} onClick={guardar}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" style={chip()} disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</button>
            {programacion && (
              <button type="button" style={chip()} disabled={guardando} onClick={quitar}>Quitar programación</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProgramacionTab = ({ clientes, porCliente, onGuardar, onGuardarTelefono, onQuitar }) => {
  const [busqueda, setBusqueda] = useState('');

  const lista = useMemo(() => {
    const consulta = normalizarNombre(busqueda);
    return clientes
      .filter((c) => !consulta
        || normalizarNombre(c.nombre).includes(consulta)
        || (c.alias || []).some((a) => normalizarNombre(a).includes(consulta)))
      .sort((a, b) => {
        const pa = porCliente[a.id] && porCliente[a.id].activo !== false ? 0 : 1;
        const pb = porCliente[b.id] && porCliente[b.id].activo !== false ? 0 : 1;
        return pa - pb || (a.nombre || '').localeCompare(b.nombre || '', 'es');
      });
  }, [clientes, porCliente, busqueda]);

  const programados = clientes.filter((c) => porCliente[c.id] && porCliente[c.id].activo !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search" placeholder="Buscar cliente…" style={{ ...input, flex: 1, minWidth: 180 }}
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
        />
        <span style={{ fontSize: '0.85rem', color: '#3a5060', fontWeight: 600 }}>
          {programados} de {clientes.length} clientes con envío programado
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
        ¿Falta un cliente? Se crea en <Link to="/contactos">Proveedores y Clientes</Link> y aparece acá solo.
      </div>
      {lista.length === 0 && <div style={{ color: '#6b7280' }}>No hay clientes que coincidan.</div>}
      {lista.map((c) => (
        <FilaCliente
          key={c.id}
          cliente={c}
          programacion={porCliente[c.id]}
          onGuardar={onGuardar}
          onGuardarTelefono={onGuardarTelefono}
          onQuitar={onQuitar}
        />
      ))}
    </div>
  );
};

export default ProgramacionTab;
