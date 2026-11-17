// Promociones que el bot manda cuando el cliente elige "Ver promociones" (opción 4 del menú).
// Solo se mandan las vigentes: activas y dentro de sus fechas. Las vencidas quedan guardadas para reutilizarlas.
import { useState } from 'react';
import { estadoPromocion, promocionesVigentes, textoPromociones } from '../../../utils/pedidosBot';
import { IconPlus } from '../../gestionSemanal/icons';
import { COLORES } from '../colores';
import { BotonGhost, BotonPrimario, VacioEstado } from '../ui';
import { CAJA_GRIS, ESTADOS_PROMO, INPUT, card } from './estilosCatalogo';
import { Campo, Interruptor, Nota, VistaPrevia } from './piezas';

const VACIA = { titulo: '', descripcion: '', desde: '', hasta: '', activa: true };

const fechaCorta = (f) => {
  const [, m, d] = String(f || '').split('-');
  return m && d ? `${Number(d)}/${Number(m)}` : '';
};

const rangoTexto = (p) => {
  if (p.desde && p.hasta) return `Del ${fechaCorta(p.desde)} al ${fechaCorta(p.hasta)}`;
  if (p.hasta) return `Hasta el ${fechaCorta(p.hasta)}`;
  if (p.desde) return `Desde el ${fechaCorta(p.desde)}`;
  return 'Sin fecha límite';
};

const PillPromo = ({ estado }) => {
  const e = ESTADOS_PROMO[estado];
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: e.fondo, color: e.color, whiteSpace: 'nowrap' }}>
      {e.texto}
    </span>
  );
};

const Formulario = ({ inicial, onGuardar, onCancelar }) => {
  const [datos, setDatos] = useState({ ...VACIA, ...inicial });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const poner = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const guardar = async () => {
    if (!datos.titulo.trim()) { setError('Escribí el título de la promoción.'); return; }
    if (datos.desde && datos.hasta && datos.hasta < datos.desde) { setError('La fecha "hasta" no puede ser anterior a "desde".'); return; }
    setGuardando(true);
    setError('');
    try {
      await onGuardar(datos);
    } catch (e) {
      console.error(e);
      setError('No se pudo guardar. Probá de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <div style={{ ...CAJA_GRIS, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Campo etiqueta="Título">
        <input style={INPUT} value={datos.titulo} maxLength={80} placeholder="Ej. Asado x 5 kg con 10% de descuento" onChange={poner('titulo')} />
      </Campo>
      <Campo etiqueta="Detalle (opcional)">
        <textarea rows={2} style={{ ...INPUT, resize: 'vertical' }} value={datos.descripcion} maxLength={300} onChange={poner('descripcion')} />
      </Campo>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Campo etiqueta="Desde (opcional)" style={{ flex: 1, minWidth: 140 }}>
          <input type="date" style={INPUT} value={datos.desde} onChange={poner('desde')} />
        </Campo>
        <Campo etiqueta="Hasta (opcional)" style={{ flex: 1, minWidth: 140 }}>
          <input type="date" style={INPUT} value={datos.hasta} onChange={poner('hasta')} />
        </Campo>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Interruptor activo={datos.activa} etiqueta="Promoción activa" onCambiar={(v) => setDatos((d) => ({ ...d, activa: v }))} />
        <span style={{ fontSize: '0.82rem', color: COLORES.texto }}>{datos.activa ? 'Activa' : 'Apagada: el bot no la manda'}</span>
      </div>
      {error && <Nota tipo="error">{error}</Nota>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <BotonGhost onClick={onCancelar}>Cancelar</BotonGhost>
        <BotonPrimario onClick={guardar} disabled={guardando}>{guardando ? 'Guardando' : 'Guardar'}</BotonPrimario>
      </div>
    </div>
  );
};

const TarjetaPromo = ({ promo, hoy, onEditar, onQuitar, onActivar }) => {
  const estado = estadoPromocion(promo, hoy);
  const [confirmando, setConfirmando] = useState(false);
  return (
    <div style={card(ESTADOS_PROMO[estado].acento)}>
      <div className="pedidos-fila" style={{ display: 'flex', alignItems: 'center', gap: 10, rowGap: 8 }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontWeight: 600, color: COLORES.texto, fontSize: '0.9rem' }}>{promo.titulo}</div>
          <div style={{ fontSize: '0.74rem', color: COLORES.muted }}>{rangoTexto(promo)}</div>
          {promo.descripcion && <div style={{ fontSize: '0.78rem', color: COLORES.texto, marginTop: 2 }}>{promo.descripcion}</div>}
        </div>
        <PillPromo estado={estado} />
        <Interruptor activo={promo.activa !== false} etiqueta={`${promo.titulo} activa`} onCambiar={(v) => onActivar(promo.id, v)} />
        <div style={{ display: 'flex', gap: 6 }}>
          <BotonGhost onClick={() => onEditar(promo)}>Editar</BotonGhost>
          {confirmando ? (
            <>
              <BotonGhost color="#8b1c26" borde="rgba(220,53,69,0.5)" onClick={() => onQuitar(promo.id)}>Quitar</BotonGhost>
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

const PromocionesPanel = ({ hoy, promociones, onGuardar, onQuitar, onActivar }) => {
  const [editando, setEditando] = useState(null); // null | 'nueva' | promo
  const ordenadas = [...promociones].sort((a, b) => String(b.desde || '9999').localeCompare(String(a.desde || '9999')));
  const vigentes = promocionesVigentes(promociones, hoy);

  const guardar = async (datos) => {
    const id = editando && editando !== 'nueva' ? editando.id : null;
    await onGuardar(datos, id);
    setEditando(null);
  };

  return (
    <div className="pedidos-hoy-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {editando ? (
          <Formulario
            key={editando === 'nueva' ? 'nueva' : editando.id}
            inicial={editando === 'nueva' ? VACIA : editando}
            onGuardar={guardar}
            onCancelar={() => setEditando(null)}
          />
        ) : (
          <div>
            <BotonPrimario onClick={() => setEditando('nueva')}><IconPlus size={14} /> Nueva promoción</BotonPrimario>
          </div>
        )}

        {ordenadas.map((p) => (
          <TarjetaPromo key={p.id} promo={p} hoy={hoy} onEditar={setEditando} onQuitar={onQuitar} onActivar={onActivar} />
        ))}

        {promociones.length === 0 && !editando && (
          <VacioEstado
            titulo="Todavía no hay promociones"
            detalle="Cuando cargues una vigente, el bot la manda a quien elija la opción 4 del menú."
          />
        )}
      </div>

      <div style={{ alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <VistaPrevia texto={textoPromociones(vigentes)} titulo="Así se manda por WhatsApp" />
        <Nota>Se mandan solo las vigentes hoy. Las vencidas o apagadas quedan guardadas y se pueden reactivar.</Nota>
      </div>
    </div>
  );
};

export default PromocionesPanel;
