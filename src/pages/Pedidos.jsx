// Pedidos: mensajes de WhatsApp a los clientes y recepción de lo que piden.
// Ver README-PEDIDOS-WHATSAPP.md para el plan por etapas.
import { useMemo, useState } from 'react';
import { getLocalDateString } from '../utils/date';
import { useContactos } from '../hooks/useContactos';
import { usePedidos } from '../hooks/usePedidos';
import { usePedidosProgramacion } from '../hooks/usePedidosProgramacion';
import { usePedidosMensajes } from '../hooks/usePedidosMensajes';
import { usePedidosConfig } from '../hooks/usePedidosConfig';
import HoyTocaTab from '../components/pedidos/HoyTocaTab';
import RespuestasTab from '../components/pedidos/RespuestasTab';
import ProgramacionTab from '../components/pedidos/ProgramacionTab';
import ConexionTab from '../components/pedidos/ConexionTab';
import { ETIQUETAS, chip } from '../components/pedidos/estilos';

const PESTANAS = [
  { clave: 'hoy', titulo: 'Hoy toca' },
  { clave: 'respuestas', titulo: 'Respuestas' },
  { clave: 'programacion', titulo: 'Programación' },
  { clave: 'conexion', titulo: 'Conexión' },
];

const Pedidos = () => {
  const hoy = getLocalDateString();
  const [pestana, setPestana] = useState('hoy');

  const { activos, actualizarContacto, loading: cargandoContactos } = useContactos();
  const clientes = useMemo(() => activos.filter((c) => c.roles?.cliente), [activos]);
  const clientesPorId = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c])), [clientes]);

  const programacion = usePedidosProgramacion();
  const mensajes = usePedidosMensajes();
  const config = usePedidosConfig();
  const pedidosHoy = usePedidos(hoy);

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

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 24px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#333', marginBottom: 14 }}>Pedidos por WhatsApp</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {PESTANAS.map((p) => (
          <button key={p.clave} type="button" style={chip(pestana === p.clave)} onClick={() => setPestana(p.clave)}>
            {p.titulo}
            {p.clave === 'respuestas' && mensajes.entrantesNuevos.length > 0 && (
              <span style={{ ...ETIQUETAS.aviso, marginLeft: 4 }}>{mensajes.entrantesNuevos.length}</span>
            )}
          </button>
        ))}
      </div>

      {error && <div style={{ color: '#991b1b', marginBottom: 12 }}>No se pudieron cargar los datos: {error}</div>}
      {cargando && <div style={{ color: '#6b7280' }}>Cargando…</div>}

      {!cargando && pestana === 'hoy' && (
        <HoyTocaTab
          fecha={hoy}
          programaciones={programacion.programaciones}
          clientesPorId={clientesPorId}
          mensajes={mensajes.mensajes}
          conectado={config.config.conectado === true}
          onIrAConexion={() => setPestana('conexion')}
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
    </div>
  );
};

export default Pedidos;
