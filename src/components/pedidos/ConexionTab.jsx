// Conexión: qué falta para que WhatsApp mande y reciba solo. Es un tablero de avance del trámite;
// las casillas se guardan en Firestore para que se vea el mismo estado desde cualquier dispositivo.
import { ETIQUETAS, chip, tarjeta } from './estilos';

const PASOS = [
  { clave: 'portafolio', titulo: 'Portafolio comercial de Meta', detalle: 'En business.facebook.com. La página "Frigorífico La Trinidad" ya existe; falta confirmar el portafolio y, si piden, la verificación del negocio.' },
  { clave: 'numero', titulo: 'Número dedicado', detalle: 'Un chip que no esté usado en ningún WhatsApp. Solo hace falta para recibir el código de verificación.' },
  { clave: 'cuentaTwilio', titulo: 'Cuenta de Twilio (si se usa Twilio)', detalle: 'Se crea y se pasa a pago. Con la cuenta de prueba solo funciona el sandbox.' },
  { clave: 'sandbox', titulo: 'Probar con el sandbox de WhatsApp', detalle: 'Permite probar envío y respuestas sin tener todavía el número propio.' },
  { clave: 'waba', titulo: 'Cuenta de WhatsApp Business y número registrado', detalle: 'Se registra el número con el nombre del negocio.' },
  { clave: 'plantilla', titulo: 'Plantilla de mensaje aprobada', detalle: 'El primer mensaje del día debe ser una plantilla que Meta apruebe (puede demorar horas o días).' },
  { clave: 'blaze', titulo: 'Proyecto de Firebase en plan Blaze', detalle: 'Necesario para las Cloud Functions que envían y reciben. Se fija un tope de gasto.' },
  { clave: 'webhook', titulo: 'Webhook apuntando a la app', detalle: 'La dirección de la función que recibe las respuestas se carga en el proveedor.' },
];

const PROVEEDORES = [
  { clave: 'twilio', nombre: 'Twilio', nota: 'Más fácil de arrancar y con sandbox; suma un recargo por mensaje.' },
  { clave: 'meta', nombre: 'Meta Cloud API', nota: 'Directo, sin recargo; más trámite técnico.' },
];

const ConexionTab = ({ config, onElegirProveedor, onMarcarPaso }) => {
  const pasos = config.pasos || {};
  const hechos = PASOS.filter((p) => pasos[p.clave]).length;
  const conectado = config.conectado === true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...tarjeta, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, color: '#333', flex: 1 }}>Estado de WhatsApp</div>
        <span style={conectado ? ETIQUETAS.ok : ETIQUETAS.aviso}>{conectado ? 'conectado' : 'no conectado'}</span>
        <span style={ETIQUETAS.neutra}>{hechos} de {PASOS.length} pasos</span>
      </div>

      <div>
        <div style={{ fontWeight: 800, color: '#333', marginBottom: 8 }}>Proveedor</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PROVEEDORES.map((p) => (
            <button
              key={p.clave} type="button"
              onClick={() => onElegirProveedor(config.proveedor === p.clave ? null : p.clave)}
              style={{ ...chip(config.proveedor === p.clave), borderRadius: 12, justifyContent: 'flex-start', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
            >
              <span>{p.nombre}</span>
              <span style={{ fontWeight: 500, fontSize: '0.78rem', opacity: 0.85 }}>{p.nota}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 800, color: '#333', marginBottom: 8 }}>Pasos</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PASOS.map((p) => (
            <label key={p.clave} style={{ ...tarjeta, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', opacity: pasos[p.clave] ? 0.65 : 1 }}>
              <input
                type="checkbox" style={{ marginTop: 4 }} checked={!!pasos[p.clave]}
                onChange={(e) => onMarcarPaso(p.clave, e.target.checked)}
              />
              <span>
                <span style={{ display: 'block', fontWeight: 800, color: '#333' }}>{p.titulo}</span>
                <span style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280' }}>{p.detalle}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConexionTab;
