// Pedidos: mensajes de WhatsApp a los clientes y recepción de lo que piden.
// Diseño: README-PEDIDOS-WHATSAPP.md (sección 6). Plan por fases: README-PEDIDOS-IMPLEMENTACION.md.
import { useMemo, useRef, useState } from 'react';
import { getLocalDateString } from '../utils/date';
import { fechaLarga } from '../utils/pesadas';
import { useContactos } from '../hooks/useContactos';
import { usePedidos } from '../hooks/usePedidos';
import { usePedidosProgramacion } from '../hooks/usePedidosProgramacion';
import { usePedidosMensajes } from '../hooks/usePedidosMensajes';
import { usePedidosConfig } from '../hooks/usePedidosConfig';
import HoyTocaTab from '../components/pedidos/HoyTocaTab';
import RespuestasTab from '../components/pedidos/RespuestasTab';
import ProgramacionTab from '../components/pedidos/ProgramacionTab';
import ConexionTab from '../components/pedidos/ConexionTab';
import PedidosEncabezado from '../components/pedidos/PedidosEncabezado';
import PedidosTabs from '../components/pedidos/PedidosTabs';
import PedidosMenuLateral from '../components/pedidos/PedidosMenuLateral';
import { IndicadorConexion } from '../components/pedidos/ui';
import ContactoFormModal from '../components/ContactoFormModal';
import {
  IconCalendar, IconChat, IconClock, IconSettings,
} from '../components/gestionSemanal/icons';
import './Pedidos.css';

// Desde Pedidos casi siempre se crea un cliente: arranca con "Cliente" prendido y "Proveedor" apagado.
const ROLES_NUEVO = { proveedor: false, cliente: true };

const PESTANAS = [
  { clave: 'hoy', titulo: 'Hoy', Icono: IconCalendar },
  { clave: 'respuestas', titulo: 'Respuestas', Icono: IconChat },
  { clave: 'programacion', titulo: 'Programación', Icono: IconClock },
  { clave: 'conexion', titulo: 'Conexión', Icono: IconSettings },
];

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const Pedidos = () => {
  const hoy = getLocalDateString();
  const [pestana, setPestana] = useState('hoy');
  const [direccion, setDireccion] = useState(1);
  const indiceAnterior = useRef(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [abrirId, setAbrirId] = useState(null); // cliente recién creado o a corregir: se abre su programación

  const {
    activos, actualizarContacto, buscarExacto, buscarParecidos, crearContacto, loading: cargandoContactos,
  } = useContactos();
  const clientes = useMemo(() => activos.filter((c) => c.roles?.cliente), [activos]);
  const clientesPorId = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c])), [clientes]);

  const programacion = usePedidosProgramacion();
  const mensajes = usePedidosMensajes();
  const config = usePedidosConfig();
  const pedidosHoy = usePedidos(hoy);

  const conectado = config.config.conectado === true;
  const contadores = { respuestas: mensajes.entrantesNuevos.length };

  const cambiarPestana = (clave) => {
    const nuevo = PESTANAS.findIndex((p) => p.clave === clave);
    setDireccion(nuevo >= indiceAnterior.current ? 1 : -1);
    indiceAnterior.current = nuevo;
    setPestana(clave);
    setAbrirId(null);
    setMenuAbierto(false);
  };

  const irAProgramacionDe = (clienteId) => {
    cambiarPestana('programacion');
    setAbrirId(clienteId);
  };

  // Si lo creado es cliente, se pasa a Programación con su ficha abierta para configurarlo.
  const alCrearContacto = ({ id, roles }) => {
    if (roles.cliente) irAProgramacionDe(id);
  };

  const abrirAlta = () => {
    setMenuAbierto(false);
    setCreando(true);
  };

  const pasarAPedido = async (mensaje, renglones) => {
    const pedidoId = await pedidosHoy.crearPedido({
      cliente: mensaje.cliente,
      clienteId: mensaje.clienteId,
      origen: mensaje.origen === 'whatsapp' ? 'whatsapp' : 'manual',
      renglones,
      notas: 'Respuesta de WhatsApp',
    });
    await mensajes.marcarProcesado(mensaje.id, pedidoId);
  };

  const simularRespuesta = (cliente, texto) => mensajes.registrarMensaje({
    clienteId: cliente.id,
    cliente: cliente.nombre,
    direccion: 'entrante',
    texto,
    estado: 'nuevo',
    origen: 'manual',
  });

  const cargando = cargandoContactos || programacion.loading || mensajes.loading || config.loading;
  const error = programacion.error || mensajes.error;
  const titulo = pestana === 'hoy'
    ? capitalizar(fechaLarga(hoy))
    : PESTANAS.find((p) => p.clave === pestana).titulo;

  return (
    <div className="pedidos-page">
      <PedidosEncabezado
        titulo={titulo}
        conectado={conectado}
        onMenu={() => setMenuAbierto(true)}
        onNuevo={abrirAlta}
        onIrAConexion={() => cambiarPestana('conexion')}
      />

      <div className="pedidos-solo-celular" style={{ marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <IndicadorConexion conectado={conectado} onClick={() => cambiarPestana('conexion')} />
        </div>
      </div>

      {error && <div style={{ color: '#8b1c26', marginBottom: 12 }}>No se pudieron cargar los datos: {error}</div>}

      <PedidosTabs
        pestanas={PESTANAS}
        activa={pestana}
        onCambiar={cambiarPestana}
        contadores={contadores}
        direccion={direccion}
      >
        {cargando && <div style={{ color: '#6c757d', padding: 12 }}>Cargando…</div>}

        {!cargando && pestana === 'hoy' && (
          <HoyTocaTab
            fecha={hoy}
            programaciones={programacion.programaciones}
            clientesPorId={clientesPorId}
            mensajes={mensajes.mensajes}
            onRevisar={() => cambiarPestana('respuestas')}
            onCorregir={irAProgramacionDe}
            onIrAProgramacion={() => cambiarPestana('programacion')}
          />
        )}

        {!cargando && pestana === 'respuestas' && (
          <RespuestasTab
            clientes={clientes}
            nuevos={mensajes.entrantesNuevos}
            resueltos={mensajes.entrantesResueltos}
            onSimular={simularRespuesta}
            onPasarAPedido={pasarAPedido}
            onDescartar={mensajes.descartar}
          />
        )}

        {!cargando && pestana === 'programacion' && (
          <ProgramacionTab
            clientes={clientes}
            porCliente={programacion.porCliente}
            abrirId={abrirId}
            onNuevoCliente={abrirAlta}
            onGuardar={programacion.guardar}
            onGuardarTelefono={(id, telefono) => actualizarContacto(id, { telefono })}
            onQuitar={programacion.quitar}
          />
        )}

        {!cargando && pestana === 'conexion' && (
          <ConexionTab
            config={config.config}
            onElegirProveedor={(proveedor) => config.guardar({ proveedor })}
            onMarcarPaso={config.marcarPaso}
          />
        )}
      </PedidosTabs>

      <PedidosMenuLateral
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        pestanas={PESTANAS}
        activa={pestana}
        onElegir={cambiarPestana}
        contadores={contadores}
        conectado={conectado}
        onNuevo={abrirAlta}
        onIrAConexion={() => cambiarPestana('conexion')}
      />

      {creando && (
        <ContactoFormModal
          rolesIniciales={ROLES_NUEVO}
          buscarExacto={buscarExacto}
          buscarParecidos={buscarParecidos}
          crearContacto={crearContacto}
          actualizarContacto={actualizarContacto}
          onClose={() => setCreando(false)}
          onGuardado={alCrearContacto}
        />
      )}
    </div>
  );
};

export default Pedidos;
