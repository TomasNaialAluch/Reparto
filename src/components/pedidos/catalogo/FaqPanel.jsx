// Preguntas frecuentes: lo ÚNICO que la IA puede usar para contestar texto libre (ej. "¿hacen envíos al local?").
// Si la respuesta no está acá, el bot no inventa: pasa la conversación a una persona.
import { useState } from 'react';
import { IconPlus } from '../../gestionSemanal/icons';
import { COLORES } from '../colores';
import { BotonGhost, BotonPrimario, Eyebrow, VacioEstado } from '../ui';
import { CAJA_GRIS, INPUT, card } from './estilosCatalogo';
import { Campo, Interruptor, Nota } from './piezas';

// Temas sugeridos: solo ayudan a arrancar; las respuestas las escriben ustedes.
const SUGERIDOS = ['Envíos a domicilio', 'Zonas de entrega', 'Mínimo de compra', 'Días de reparto', 'Formas de pago'];

const Formulario = ({ inicial, onGuardar, onCancelar }) => {
  const [tema, setTema] = useState(inicial.tema || '');
  const [respuesta, setRespuesta] = useState(inicial.respuesta || '');
  const [activa, setActiva] = useState(inicial.activa !== false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!tema.trim()) { setError('Escribí el tema o la pregunta.'); return; }
    if (!respuesta.trim()) { setError('Escribí la respuesta tal como querés que la lea el cliente.'); return; }
    setGuardando(true);
    setError('');
    try {
      await onGuardar({ tema, respuesta, activa });
    } catch (e) {
      console.error(e);
      setError('No se pudo guardar. Probá de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <div style={{ ...CAJA_GRIS, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Campo etiqueta="Tema o pregunta">
        <input style={INPUT} value={tema} maxLength={100} placeholder="Ej. ¿Hacen envíos?" onChange={(e) => setTema(e.target.value)} />
      </Campo>
      <Campo etiqueta="Respuesta">
        <textarea
          rows={4}
          style={{ ...INPUT, resize: 'vertical' }}
          value={respuesta}
          maxLength={600}
          placeholder="Escribila como se la dirías al cliente. La IA no puede agregar nada que no esté acá."
          onChange={(e) => setRespuesta(e.target.value)}
        />
      </Campo>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Interruptor activo={activa} etiqueta="Respuesta activa" onCambiar={setActiva} />
        <span style={{ fontSize: '0.82rem', color: COLORES.texto }}>{activa ? 'Activa' : 'Apagada: la IA no la usa'}</span>
      </div>
      {error && <Nota tipo="error">{error}</Nota>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <BotonGhost onClick={onCancelar}>Cancelar</BotonGhost>
        <BotonPrimario onClick={guardar} disabled={guardando}>{guardando ? 'Guardando' : 'Guardar'}</BotonPrimario>
      </div>
    </div>
  );
};

const TarjetaFaq = ({ item, onEditar, onQuitar, onActivar }) => {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <div style={card(item.activa !== false ? '#28a745' : '#d3d9de')}>
      <div className="pedidos-fila" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, rowGap: 8 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 600, color: COLORES.texto, fontSize: '0.9rem' }}>{item.tema}</div>
          <div style={{ fontSize: '0.8rem', color: COLORES.muted, marginTop: 2, whiteSpace: 'pre-wrap' }}>{item.respuesta}</div>
        </div>
        <Interruptor activo={item.activa !== false} etiqueta={`${item.tema} activa`} onCambiar={(v) => onActivar(item.id, v)} />
        <div style={{ display: 'flex', gap: 6 }}>
          <BotonGhost onClick={() => onEditar(item)}>Editar</BotonGhost>
          {confirmando ? (
            <>
              <BotonGhost color="#8b1c26" borde="rgba(220,53,69,0.5)" onClick={() => onQuitar(item.id)}>Quitar</BotonGhost>
              <BotonGhost onClick={() => setConfirmando(false)}>No</BotonGhost>
            </>
          ) : (
            <BotonGhost color="#8b1c26" borde="#ccd3d9" onClick={() => setConfirmando(true)}>Borrar</BotonGhost>
          )}
        </div>
      </div>
    </div>
  );
};

const FaqPanel = ({ faq, onGuardar, onQuitar, onActivar }) => {
  const [editando, setEditando] = useState(null); // null | 'nueva' | item (puede traer solo el tema sugerido)

  const guardar = async (datos) => {
    const id = editando && editando !== 'nueva' ? editando.id : null;
    await onGuardar(datos, id);
    setEditando(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Nota>
        La IA contesta mensajes sueltos usando solamente estas respuestas. Si la pregunta del cliente no está acá,
        no inventa: avisa que lo atiende una persona.
      </Nota>

      {editando ? (
        <Formulario
          key={editando === 'nueva' ? 'nueva' : (editando.id || editando.tema)}
          inicial={editando === 'nueva' ? {} : editando}
          onGuardar={guardar}
          onCancelar={() => setEditando(null)}
        />
      ) : (
        <div>
          <BotonPrimario onClick={() => setEditando('nueva')}><IconPlus size={14} /> Nueva pregunta</BotonPrimario>
        </div>
      )}

      {faq.map((item) => (
        <TarjetaFaq key={item.id} item={item} onEditar={setEditando} onQuitar={onQuitar} onActivar={onActivar} />
      ))}

      {faq.length === 0 && !editando && (
        <VacioEstado
          titulo="Todavía no hay preguntas cargadas"
          detalle="Empezá por las que más te hacen los clientes. Tocá un tema para arrancar."
          accion={(
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {SUGERIDOS.map((t) => (
                <BotonGhost key={t} onClick={() => setEditando({ tema: t })}>{t}</BotonGhost>
              ))}
            </div>
          )}
        />
      )}

      {faq.length > 0 && !editando && (
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Temas que todavía no están</Eyebrow>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGERIDOS.filter((t) => !faq.some((f) => f.tema?.toLowerCase().includes(t.split(' ')[0].toLowerCase()))).map((t) => (
              <BotonGhost key={t} onClick={() => setEditando({ tema: t })}>{t}</BotonGhost>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqPanel;
