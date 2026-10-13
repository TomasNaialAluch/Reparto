import { useMemo, useState } from 'react';
import { getLocalDateString } from '../utils/date';
import {
  diaParaMercaderia, estaResuelto, fechaLarga, generarIdPesada, pendientesDe, sumarDias, totalesPesada,
} from '../utils/pesadas';
import { MATCH_SEGURO, reconocerCorte } from '../utils/cortes';
import { normalizarNombre } from '../utils/nombres';
import { usePesadas } from '../hooks/usePesadas';
import { useContactos } from '../hooks/useContactos';
import { useCortes } from '../hooks/useCortes';
import { usePreciosReferencia } from '../hooks/usePreciosReferencia';
import { useGestionSemanal } from '../firebase/hooks';
import { useFirebase } from '../contexts/FirebaseContext';
import PesadaCard from '../components/hoy/PesadaCard';
import IngresarMercaderiaModal from '../components/hoy/IngresarMercaderiaModal';
import ConfirmModal from '../components/ConfirmModal';
import { IconPlus } from '../components/gestionSemanal/icons';
import './Hoy.css';

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Chip de acción: pill suave con los tokens de NEWLOOK (no el azul de Bootstrap).
const chip = (activo = false) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600,
  border: '1px solid var(--color-primary-border)',
  background: activo ? 'var(--color-primary)' : 'var(--color-primary-soft)',
  color: activo ? '#fff' : '#3a5060',
  cursor: 'pointer', transition: 'background .15s, transform .15s',
});

// Zona reservada para un bloque de la página que todavía no se construyó.
// Deja a la vista el lugar que ocupa cada cosa (ver README-PAGINA-HOY.md, sección 8).
const ZonaReservada = ({ titulo, detalle }) => (
  <section className="hoy-zona hoy-zona--reservada">
    <div className="hoy-zona__titulo">{titulo}</div>
    <div className="hoy-zona__detalle">{detalle}</div>
  </section>
);

const Hoy = () => {
  const hoy = getLocalDateString();
  const [fecha, setFecha] = useState(hoy);
  const [activaId, setActivaId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busquedaProv, setBusquedaProv] = useState('');
  const [remito, setRemito] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [aEliminar, setAEliminar] = useState(null);

  const [ingreso, setIngreso] = useState(null); // { pesadaId, pendientes, autoResueltos }

  const {
    pesadas, loading, error, crearPesada, agregarKg, quitarKg,
    resolverTexto, marcarIngresada, eliminarPesadaVacia,
    cambiarEstado, habilitarReingreso, guardarRemito,
  } = usePesadas(fecha);
  const { proveedores, buscarExacto, crearContacto } = useContactos();
  const { activos: cortesActivos, categorias, crearCorte, agregarAlias } = useCortes();
  const { referenciaPara, usoCortesDe, usoGlobalCortes, listo: historialListo } = usePreciosReferencia();
  const { user } = useFirebase();
  const { agregarMercaderia, semanaActiva } = useGestionSemanal(user?.uid);
  const [aDescartar, setADescartar] = useState(null);
  const [verDescartadas, setVerDescartadas] = useState(false);

  const consulta = normalizarNombre(busquedaProv);
  const opcionesProv = useMemo(() => {
    const lista = consulta
      ? proveedores.filter((c) => normalizarNombre(c.nombre).includes(consulta)
        || (c.alias || []).some((a) => normalizarNombre(a).includes(consulta)))
      : proveedores;
    return lista.slice(0, 8);
  }, [consulta, proveedores]);
  const exactoProv = consulta ? buscarExacto(busquedaProv) : null;

  const cerrarForm = () => {
    setMostrarForm(false);
    setBusquedaProv('');
    setRemito('');
    setErrorForm('');
  };

  const crearConProveedor = async (contacto) => {
    try {
      const id = await crearPesada({
        proveedor: contacto.nombre,
        proveedorId: contacto.id || null,
        remitoNumero: remito,
      });
      setActivaId(id);
      cerrarForm();
    } catch (err) {
      console.error(err);
      setErrorForm('No se pudo crear la pesada. Probá de nuevo');
    }
  };

  const crearConNombreNuevo = async () => {
    try {
      const { id, nombre } = await crearContacto(busquedaProv, { proveedor: true });
      await crearConProveedor({ id, nombre });
    } catch (err) {
      setErrorForm(err.message || 'No se pudo crear el proveedor');
    }
  };

  const onEnterProveedor = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (exactoProv && exactoProv.activo !== false) return crearConProveedor(exactoProv);
    if (opcionesProv.length > 0) return crearConProveedor(opcionesProv[0]);
    if (consulta) return crearConNombreNuevo();
    return undefined;
  };

  const confirmarEliminar = async () => {
    const p = aEliminar;
    setAEliminar(null);
    if (!p) return;
    try {
      await eliminarPesadaVacia(p.id);
      if (activaId === p.id) setActivaId(null);
    } catch (err) {
      console.error(err);
    }
  };

  /** Aplica una decisión (existente o nuevo) a un texto sin validar. Devuelve { corteId, corte }. */
  const aplicarDecision = async (pesadaId, pendiente, decision) => {
    let corteId;
    let nombre;
    if (decision.modo === 'nuevo') {
      const creado = await crearCorte(decision.nombreNuevo, decision.categoria);
      corteId = creado.id;
      nombre = creado.nombre;
    } else {
      const elegido = cortesActivos.find((c) => c.id === decision.corteId);
      if (!elegido) throw new Error('Elegí un corte');
      corteId = elegido.id;
      nombre = elegido.nombre;
    }
    await resolverTexto(pesadaId, pendiente.textoNorm, { corteId, corte: nombre });
    // Recordar el texto como alias: solo si es distinto del nombre del corte
    if (decision.recordar !== false && normalizarNombre(pendiente.texto) !== normalizarNombre(nombre)) {
      await agregarAlias(corteId, pendiente.texto);
    }
    return { corteId, corte: nombre };
  };

  const resolverDesdeTarjeta = (pesada, pendiente, decision) => aplicarDecision(pesada.id, pendiente, decision);

  /**
   * Al tocar "Ingresar": primero se vuelve a reconocer lo pendiente (el catálogo pudo cambiar);
   * lo que ahora coincide con seguridad se resuelve solo y el resto pasa a "Revisar cortes".
   */
  const abrirIngreso = async (pesada) => {
    const autoResueltos = {};
    const restantes = [];
    for (const p of pendientesDe(pesada.pesadas || [])) {
      const rec = reconocerCorte(p.texto, cortesActivos);
      if (rec && MATCH_SEGURO.includes(rec.match)) {
        autoResueltos[p.textoNorm] = { corteId: rec.corteId, corte: rec.corte };
        await resolverTexto(pesada.id, p.textoNorm, { corteId: rec.corteId, corte: rec.corte });
      } else {
        restantes.push({ ...p, candidatos: rec?.candidatos?.length ? rec.candidatos : p.candidatos });
      }
    }
    setIngreso({ pesadaId: pesada.id, pendientes: restantes, autoResueltos });
  };

  const confirmarIngreso = async ({ decisiones, precios }) => {
    const pesada = pesadas.find((p) => p.id === ingreso.pesadaId);
    if (!pesada) throw new Error('No se encontró la pesada');

    // 1) Resolver lo pendiente (puede crear cortes nuevos y guardar alias)
    const mapa = { ...ingreso.autoResueltos };
    for (const p of ingreso.pendientes) {
      mapa[p.textoNorm] = await aplicarDecision(pesada.id, p, decisiones[p.textoNorm]);
    }

    // 2) Totales con todo resuelto
    const items = (pesada.pesadas || []).map((it) => {
      if (estaResuelto(it)) return it;
      const r = mapa[normalizarNombre(it.texto || it.corte)];
      return r ? { ...it, corteId: r.corteId, corte: r.corte } : it;
    });
    if (items.some((it) => !estaResuelto(it))) throw new Error('Quedan cortes sin resolver');
    const { cortes } = totalesPesada(items);

    // 3) Entrada de Mercadería (sin precio queda en 0 y se completa allá)
    const entrada = {
      id: generarIdPesada('ent'),
      dia: diaParaMercaderia(pesada.fecha),
      proveedor: pesada.proveedor,
      proveedorId: pesada.proveedorId || null,
      cortes: cortes.map((c) => {
        const precio = Number(String(precios[c.corte] ?? '').replace(',', '.'));
        return { corte: c.corte, kg: c.kg, precioKg: precio > 0 ? precio : 0 };
      }),
    };
    await agregarMercaderia(entrada);
    await marcarIngresada(pesada.id, entrada.id, semanaActiva?.id || null);
    setIngreso(null);
  };

  const pesadaIngreso = ingreso ? pesadas.find((p) => p.id === ingreso.pesadaId) : null;

  // Descartadas fuera de la vista normal (no se borran)
  const visibles = pesadas.filter((p) => p.estado !== 'descartada');
  const descartadas = pesadas.filter((p) => p.estado === 'descartada');

  /** La entrada de Mercadería ya no figura en la semana en la que se ingresó. */
  const entradaEliminada = (p) => p.estado === 'ingresada'
    && !!p.mercaderiaId && !!p.semanaId
    && semanaActiva?.id === p.semanaId
    && !(semanaActiva.mercaderia || []).some((e) => e.id === p.mercaderiaId);

  const confirmarDescartar = async () => {
    const p = aDescartar;
    setADescartar(null);
    if (!p) return;
    try {
      await cambiarEstado(p.id, 'descartada');
      if (activaId === p.id) setActivaId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const esHoy = fecha === hoy;

  return (
    <div className="hoy-pagina">
      {/* Encabezado con fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {esHoy ? 'Hoy' : 'Día'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#333' }}>
            {capitalizar(fechaLarga(fecha))}
          </h1>
        </div>
        <button type="button" style={{ ...chip(), background: '#fff', padding: '6px 11px' }} onClick={() => setFecha(sumarDias(fecha, -1))} aria-label="Día anterior">◀</button>
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ width: 'auto', borderRadius: 999, borderColor: 'var(--color-primary-border)', color: '#3a5060' }}
          value={fecha}
          onChange={(e) => e.target.value && setFecha(e.target.value)}
        />
        <button type="button" style={{ ...chip(), background: '#fff', padding: '6px 11px' }} onClick={() => setFecha(sumarDias(fecha, 1))} aria-label="Día siguiente">▶</button>
        {!esHoy && (
          <button type="button" style={chip(true)} onClick={() => setFecha(hoy)}>Hoy</button>
        )}
      </div>

      <div className="hoy-grid">
      <div className="hoy-main">
      <ZonaReservada titulo="Agenda" detalle="Cosas para hacer del día, con hora y alarma (Fase 4)" />

      {/* Pesadas del día */}
      <section className="hoy-zona hoy-zona--pesadas">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: '#3a5060', flex: 1 }}>
          Pesadas del día
          {pesadas.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, color: '#6c757d' }}>
              {pesadas.length}
            </span>
          )}
        </div>
        {!mostrarForm && (
          <button
            type="button"
            style={chip()}
            onClick={() => setMostrarForm(true)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
          >
            <IconPlus size={13} /> Nueva pesada
          </button>
        )}
      </div>

      {mostrarForm && (
        <div style={{ background: 'var(--color-primary-soft)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Proveedor</div>
              <input
                autoFocus
                type="text"
                className="form-control"
                placeholder="Buscar proveedor…"
                value={busquedaProv}
                onChange={(e) => { setBusquedaProv(e.target.value); setErrorForm(''); }}
                onKeyDown={onEnterProveedor}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Remito (opcional)</div>
              <input
                type="text"
                className="form-control"
                placeholder="N° de remito"
                value={remito}
                onChange={(e) => setRemito(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {opcionesProv.map((c) => (
              <button
                key={c.id}
                type="button"
                style={{ ...chip(), background: '#fff' }}
                onClick={() => crearConProveedor(c)}
              >
                {c.nombre}
              </button>
            ))}
            {consulta && !exactoProv && (
              <button type="button" style={chip(true)} onClick={crearConNombreNuevo}>
                Crear proveedor «{busquedaProv.trim()}»
              </button>
            )}
          </div>
          {errorForm && <div style={{ color: '#b45309', fontSize: '0.82rem', marginTop: 8 }}>{errorForm}</div>}
          <div style={{ marginTop: 10 }}>
            <button type="button" style={{ ...chip(), background: '#fff' }} onClick={cerrarForm}>Cancelar</button>
          </div>
        </div>
      )}

      {error && <div className="alert alert-warning">No se pudieron cargar las pesadas: {error}</div>}

      {loading ? (
        <div style={{ color: '#6c757d', padding: 20 }}>Cargando…</div>
      ) : visibles.length === 0 ? (
        <div style={{ color: '#6c757d', padding: '18px 0 20px', textAlign: 'center', fontSize: '0.9rem' }}>
          Sin pesadas este día. Cuando llegue el camión, sumá una con <strong>Nueva pesada</strong>.
        </div>
      ) : (
        <div className="hoy-pesadas">
          {visibles.map((p) => (
            <PesadaCard
              key={p.id}
              pesada={p}
              activa={activaId === p.id}
              onActivar={setActivaId}
              onAgregar={agregarKg}
              onQuitar={quitarKg}
              onEliminar={setAEliminar}
              onResolverTexto={resolverDesdeTarjeta}
              onIngresar={abrirIngreso}
              onGuardarRemito={(pes, datos) => guardarRemito(pes.id, datos)}
              onCambiarEstado={(pes, estado) => cambiarEstado(pes.id, estado)}
              onDescartar={setADescartar}
              onHabilitarReingreso={(pes) => habilitarReingreso(pes.id)}
              entradaEliminada={entradaEliminada(p)}
              bloqueado={!!ingreso || !!aEliminar || !!aDescartar}
              cortesCatalogo={cortesActivos}
              categorias={categorias}
            />
          ))}
        </div>
      )}
        {descartadas.length > 0 && (
          <div style={{ marginTop: 10, borderTop: '1px solid var(--color-primary-soft)', paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => setVerDescartadas((v) => !v)}
              style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
            >
              {verDescartadas ? '▾' : '▸'} Descartadas ({descartadas.length})
            </button>
            {verDescartadas && (
              <div style={{ marginTop: 6 }}>
                {descartadas.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: '0.86rem', color: '#6c757d' }}>
                    <span style={{ flex: 1 }}>{p.proveedor} · {(p.pesadas || []).length} pesadas</span>
                    <button type="button" style={{ ...chip(), background: '#fff', padding: '2px 10px' }} onClick={() => cambiarEstado(p.id, 'abierta')}>
                      Recuperar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <ZonaReservada titulo="Pedidos para armar" detalle="Lista de pedidos del día con estado (Fase 6)" />
      </div>

      <aside className="hoy-side">
        <ZonaReservada titulo="Deudores" detalle="Quiénes deben, de reparto, saldo y a mano (Fase 7)" />
        <ZonaReservada titulo="Caja" detalle="Fondo y vueltos del día" />
      </aside>
      </div>

      {ingreso && pesadaIngreso && (
        <IngresarMercaderiaModal
          pesada={pesadaIngreso}
          pendientes={ingreso.pendientes}
          autoResueltos={ingreso.autoResueltos}
          catalogo={cortesActivos}
          categorias={categorias}
          referenciaPara={referenciaPara}
          usoCortesDe={usoCortesDe}
          usoGlobalCortes={usoGlobalCortes}
          historialListo={historialListo}
          onCancelar={() => setIngreso(null)}
          onConfirmar={confirmarIngreso}
        />
      )}

      <ConfirmModal
        isOpen={!!aDescartar}
        onClose={() => setADescartar(null)}
        onConfirm={confirmarDescartar}
        title="Descartar pesada"
        message={aDescartar ? `Se descarta la pesada de ${aDescartar.proveedor}. No se borra: queda en "Descartadas" y se puede recuperar.` : ''}
        confirmText="Descartar"
      />

      <ConfirmModal
        isOpen={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar pesada"
        message={aEliminar ? `Se elimina la pesada de ${aEliminar.proveedor}, que no tiene kg cargados.` : ''}
        confirmText="Eliminar"
      />
    </div>
  );
};

export default Hoy;
