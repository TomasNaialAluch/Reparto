import { useState, useEffect, useRef } from 'react';
import { DIAS_SEMANA, TIPOS_EMBUTIDOS, getDiaActual } from './constants';
import { formatCurrency } from '../../utils/money';
import { normalizarNombre } from '../../utils/nombres';
import { BoletaTicket } from '../BoletaTicketModal';
import ConfirmModal from '../ConfirmModal';
import { IconCheck, IconX, IconEdit, IconTrash, IconPlus } from './icons';

export default function EmbutidosTab({
  semanaActiva,
  agregarEmbutidos,
  eliminarEmbutidos,
  actualizarEmbutidos,
  getConfiguracionesUsuario,
  guardarConfiguracionesUsuario,
  addNotification,
  user
}) {
  const [expandedEmbutidos, setExpandedEmbutidos] = useState({});
  const [editingEmbutidos, setEditingEmbutidos] = useState(null);
  const [tempEmbutidosData, setTempEmbutidosData] = useState({});
  const [tiposEmbutidosPersonalizados, setTiposEmbutidosPersonalizados] = useState([]);
  const [nuevoTipoEmbutido, setNuevoTipoEmbutido] = useState('');
  const [mostrarInputNuevoTipo, setMostrarInputNuevoTipo] = useState(false);
  const nuevoTipoInputRef = useRef(null);
  const buscarTipoInputRef = useRef(null);
  const tipoInputRefs = useRef([]);
  const agregarEntradaBtnRef = useRef(null);

  const [showWarningPrecios, setShowWarningPrecios] = useState(false);
  const [preciosHighlight, setPreciosHighlight] = useState(new Set());

  // null = automático: arranca en el día actual (si ese día tiene entradas); el usuario puede cambiarlo
  const [filtroDiaEntradas, setFiltroDiaEntradas] = useState(null);
  const [busquedaTipo, setBusquedaTipo] = useState('');

  const [formEmbutidos, setFormEmbutidos] = useState({
    dia: getDiaActual(),
    embutidos: {}
  });

  useEffect(() => {
    const cargarTiposPersonalizados = async () => {
      if (user?.uid) {
        try {
          const configs = await getConfiguracionesUsuario();
          if (configs?.tiposEmbutidosPersonalizados) {
            setTiposEmbutidosPersonalizados(configs.tiposEmbutidosPersonalizados);
          }
        } catch (error) {
          console.error('Error cargando tipos personalizados:', error);
        }
      }
    };
    cargarTiposPersonalizados();
  }, [user?.uid, getConfiguracionesUsuario]);

  const agregarTipoEmbutidoPersonalizado = async () => {
    const tipoTrimmed = nuevoTipoEmbutido.trim();
    if (!tipoTrimmed) {
      addNotification('Ingrese un nombre para el nuevo tipo', 'warning');
      return;
    }

    const todosLosTipos = [...TIPOS_EMBUTIDOS, ...tiposEmbutidosPersonalizados];
    if (todosLosTipos.some((t) => normalizarNombre(t) === normalizarNombre(tipoTrimmed))) {
      addNotification('Este tipo ya existe', 'warning');
      return;
    }

    const nuevosPersonalizados = [...tiposEmbutidosPersonalizados, tipoTrimmed];
    setTiposEmbutidosPersonalizados(nuevosPersonalizados);

    try {
      await guardarConfiguracionesUsuario({
        tiposEmbutidosPersonalizados: nuevosPersonalizados
      });
      addNotification(`Tipo "${tipoTrimmed}" agregado exitosamente`, 'success');
      setNuevoTipoEmbutido('');
      setMostrarInputNuevoTipo(false);
    } catch (error) {
      console.error('Error guardando tipo personalizado:', error);
      addNotification('Error al guardar el tipo personalizado', 'error');
    }
  };

  const getTodosLosTiposEmbutidos = () => {
    return [...TIPOS_EMBUTIDOS, ...tiposEmbutidosPersonalizados];
  };

  const toggleExpandedEmbutidos = (index) => {
    if (editingEmbutidos !== null) {
      cancelEditingEmbutidos();
    }
    setExpandedEmbutidos(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        return {};
      } else {
        return { [index]: true };
      }
    });
  };

  const startEditingEmbutidos = (index, entrada) => {
    setEditingEmbutidos(index);
    setTempEmbutidosData({
      dia: entrada.dia,
      embutidos: entrada.embutidos.map(e => ({
        ...e,
        kg: e.kg != null ? String(e.kg) : '',
        precioKg: e.precioKg != null ? String(e.precioKg) : ''
      }))
    });
  };

  const cancelEditingEmbutidos = () => {
    setEditingEmbutidos(null);
    setTempEmbutidosData({});
  };

  const saveEditingEmbutidos = async (index) => {
    try {
      const dataToSave = {
        ...tempEmbutidosData,
        embutidos: tempEmbutidosData.embutidos.map(e => ({
          ...e,
          kg: parseFloat(e.kg) || 0,
          precioKg: parseFloat(e.precioKg) || 0
        }))
      };
      await actualizarEmbutidos(index, dataToSave);
      addNotification('Embutidos actualizados', 'success');
      setEditingEmbutidos(null);
      setTempEmbutidosData({});
      setExpandedEmbutidos({});
    } catch (error) {
      addNotification('Error al actualizar embutidos', 'error');
      console.error(error);
    }
  };

  const updateEmbutido = (embutidoIndex, field, value) => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: prev.embutidos.map((embutido, index) =>
        index === embutidoIndex ? { ...embutido, [field]: value } : embutido
      )
    }));
  };

  const eliminarEmbutidoEnEdicion = (embutidoIndex) => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: prev.embutidos.filter((_, index) => index !== embutidoIndex)
    }));
  };

  const agregarEmbutidoEnEdicion = () => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: [...prev.embutidos, { tipo: 'Nuevo Tipo', kg: '', precioKg: '' }]
    }));
  };

  const handleAgregarEmbutidos = async (forzarSinPrecios = false) => {
    try {
      const embutidosConDatos = Object.entries(formEmbutidos.embutidos)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([tipo, datos]) => ({
          tipo,
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      if (embutidosConDatos.length === 0) {
        addNotification('Debe ingresar al menos un tipo de embutido con kilos', 'warning');
        return;
      }

      if (forzarSinPrecios !== true) {
        const sinPrecio = embutidosConDatos.filter(e => !e.precioKg || e.precioKg === 0);
        if (sinPrecio.length > 0) {
          setShowWarningPrecios(true);
          return;
        }
      }

      await agregarEmbutidos({
        dia: formEmbutidos.dia,
        embutidos: embutidosConDatos
      });

      setFormEmbutidos({
        dia: formEmbutidos.dia,
        embutidos: {}
      });
      setBusquedaTipo('');

      addNotification('Embutidos agregados', 'success');
    } catch (err) {
      addNotification('Error al agregar embutidos', 'error');
    }
  };

  const calcularTotalesEmbutidos = () => {
    if (!semanaActiva?.embutidos) return { porTipo: {}, total: 0 };

    const porTipo = {};
    let total = 0;

    semanaActiva.embutidos.forEach(entrada => {
      entrada.embutidos.forEach(({ tipo, kg }) => {
        porTipo[tipo] = (porTipo[tipo] || 0) + kg;
        total += kg;
      });
    });

    return { porTipo, total };
  };

  const handleCloseWarningPrecios = () => {
    setShowWarningPrecios(false);
    const sinPrecio = Object.entries(formEmbutidos.embutidos)
      .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0 && (!datos.precioKg || parseFloat(datos.precioKg) === 0))
      .map(([tipo]) => tipo);
    if (sinPrecio.length > 0) {
      const nombres = new Set(sinPrecio);
      setPreciosHighlight(new Set());
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPreciosHighlight(nombres);
          setTimeout(() => setPreciosHighlight(new Set()), 1000);
        });
      });
    }
  };

  // ----- Tipos visibles en el formulario (buscador) -----
  const todosLosTipos = getTodosLosTiposEmbutidos();
  const consultaTipo = normalizarNombre(busquedaTipo);
  const tiposVisibles = todosLosTipos.filter(
    (t) => !consultaTipo
      || normalizarNombre(t).includes(consultaTipo)
      || formEmbutidos.embutidos[t] !== undefined
  );
  // Con pocos tipos el buscador sobra
  const mostrarBuscador = todosLosTipos.length > 8;

  const handleFormKeyDown = (e) => {
    const target = e.target;
    const n = tiposVisibles.length;

    if (e.key === 'Enter') {
      if (nuevoTipoInputRef.current && target === nuevoTipoInputRef.current) return;
      if (buscarTipoInputRef.current && target === buscarTipoInputRef.current) {
        e.preventDefault();
        const primero = tipoInputRefs.current[0];
        if (primero && primero[0]) primero[0].focus();
        return;
      }
      if (target === agregarEntradaBtnRef.current) return;
      if (target.tagName === 'BUTTON') return;
      e.preventDefault();
      handleAgregarEmbutidos();
      return;
    }

    const arrowNext = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const arrowPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    if (!arrowNext && !arrowPrev) return;

    let currentIndex = -1;
    let currentCol = 0;
    for (let i = 0; i < n; i++) {
      const pair = tipoInputRefs.current[i];
      if (!pair) continue;
      if (target === pair[0]) { currentIndex = i; currentCol = 0; break; }
      if (target === pair[1]) { currentIndex = i; currentCol = 1; break; }
    }
    if (currentIndex < 0) return;

    e.preventDefault();
    const destino = arrowNext
      ? tipoInputRefs.current[currentIndex + 1]
      : tipoInputRefs.current[currentIndex - 1];
    if (destino && destino[currentCol]) destino[currentCol].focus();
  };

  // ----- Lista de entradas -----
  const renderEntrada = (entrada, index) => {
    const totalKilos = entrada.embutidos.reduce((sum, emb) => sum + emb.kg, 0);
    const costoTotal = entrada.embutidos.reduce((sum, emb) => sum + (emb.kg * (emb.precioKg || 0)), 0);
    const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
    const isExpanded = expandedEmbutidos[index];
    const editando = editingEmbutidos === index;

    return (
      <div key={index} className={`mb-3 card-transition ${editando ? 'col-12 card-expand' : (isExpanded ? 'col-12' : 'col-12 col-sm-6')}`}>
        <div
          className="card h-100"
          style={{
            cursor: editando ? 'default' : 'pointer',
            border: '1px solid #d3d9de',
            borderLeft: `3px solid ${costoTotal > 0 ? '#6A8899' : '#FFD166'}`,
            borderRadius: '12px',
            boxShadow: 'none',
            background: '#fff',
          }}
          onClick={() => (editando ? null : toggleExpandedEmbutidos(index))}
        >
          {!isExpanded ? (
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ background: 'rgba(106,136,153,0.12)', color: '#3a5060', fontWeight: 600, fontSize: '0.72rem', padding: '2px 9px', borderRadius: '999px' }}>
                  {entrada.dia}
                </span>
                <button
                  type="button"
                  title="Eliminar entrada"
                  style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: '2px', display: 'flex', lineHeight: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarEmbutidos(index);
                  }}
                >
                  <IconX size={14} />
                </button>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#3a5060', lineHeight: 1.2 }}>
                {Math.round(totalKilos)} kg
              </div>
              {costoTotal > 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#1a5c2a', fontWeight: 600 }}>
                  {formatCurrency(costoTotal)}
                  {costoPromedioKg > 0 && (
                    <span style={{ color: '#6c757d', fontWeight: 400, marginLeft: '4px', fontSize: '0.74rem' }}>
                      ({formatCurrency(costoPromedioKg)}/kg)
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.74rem', color: '#7a5000' }}>Sin precios</div>
              )}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {entrada.embutidos.slice(0, 3).map((emb) => (
                  <span key={emb.tipo} style={{ background: 'rgba(106,136,153,0.1)', color: '#3a5060', fontSize: '0.68rem', padding: '1px 7px', borderRadius: '999px' }}>
                    {emb.tipo}
                  </span>
                ))}
                {entrada.embutidos.length > 3 && (
                  <span style={{ fontSize: '0.68rem', color: '#6c757d' }}>+{entrada.embutidos.length - 3}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  {editando ? (
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={tempEmbutidosData.dia}
                      onChange={(e) => setTempEmbutidosData(prev => ({ ...prev, dia: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {DIAS_SEMANA.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ background: 'rgba(106,136,153,0.12)', color: '#3a5060', fontWeight: 600, fontSize: '0.78rem', padding: '3px 11px', borderRadius: '999px' }}>
                      {entrada.dia}
                    </span>
                  )}
                </div>
                <div className="d-flex gap-1">
                  {editando ? (
                    <>
                      <button
                        className="btn btn-sm btn-success d-inline-flex align-items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEditingEmbutidos(index);
                        }}
                      >
                        <IconCheck size={13} />
                      </button>
                      <button
                        className="btn btn-sm btn-secondary d-inline-flex align-items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditingEmbutidos();
                        }}
                      >
                        <IconX size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-warning d-inline-flex align-items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingEmbutidos(index, entrada);
                        }}
                      >
                        <IconEdit size={13} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger d-inline-flex align-items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarEmbutidos(index);
                        }}
                      >
                        <IconTrash size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editando ? (
                <div className="fade-in">
                  <div className="gs-cortes-lista gs-cortes-edicion" onClick={(e) => e.stopPropagation()}>
                    <div className="gs-cortes-head">
                      <span>Tipo</span>
                      <span style={{ textAlign: 'right' }}>Kg</span>
                      <span style={{ textAlign: 'right' }}>$/Kg</span>
                      <span />
                    </div>
                    {tempEmbutidosData.embutidos.map((emb, i) => (
                      <div key={i} className="gs-corte-row">
                        <div className="gs-corte-nombre">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={emb.tipo}
                            onChange={(e) => updateEmbutido(i, 'tipo', e.target.value)}
                            placeholder="Tipo de embutido"
                            list="gs-tipos-embutidos"
                          />
                        </div>
                        <div className="gs-corte-campo">
                          <label className="gs-corte-etiqueta">Kg</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={emb.kg}
                            onChange={(e) => updateEmbutido(i, 'kg', e.target.value)}
                            step="0.1"
                            placeholder="0"
                          />
                        </div>
                        <div className="gs-corte-campo">
                          <label className="gs-corte-etiqueta">$/Kg</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={emb.precioKg ?? ''}
                            onChange={(e) => updateEmbutido(i, 'precioKg', e.target.value)}
                            step="0.01"
                            placeholder="0"
                          />
                        </div>
                        <div className="gs-corte-quitar-celda">
                          <button
                            type="button"
                            className="gs-corte-quitar"
                            onClick={() => eliminarEmbutidoEnEdicion(i)}
                            title="Eliminar tipo"
                          >
                            <IconX size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mt-2 d-inline-flex align-items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        agregarEmbutidoEnEdicion();
                      }}
                    >
                      <IconPlus size={12} /> Agregar tipo
                    </button>
                  </div>
                  <div className="mt-3 pt-2 border-top">
                    {(() => {
                      const totalKgEdit = tempEmbutidosData.embutidos.reduce((sum, emb) => sum + (parseFloat(emb.kg) || 0), 0);
                      const costoEdit = tempEmbutidosData.embutidos.reduce((sum, emb) => sum + ((parseFloat(emb.kg) || 0) * (parseFloat(emb.precioKg) || 0)), 0);
                      return (
                        <>
                          <div className="d-flex justify-content-between">
                            <strong>Total:</strong>
                            <strong className="text-primary fs-5">{totalKgEdit.toFixed(2)} kg</strong>
                          </div>
                          {costoEdit > 0 && (
                            <div className="d-flex justify-content-between mt-1">
                              <strong>Costo Total:</strong>
                              <strong className="text-success">${costoEdit.toFixed(2)}</strong>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#eef1f3', borderRadius: '12px', padding: '14px 10px' }}>
                  <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                    <BoletaTicket
                      sombra="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"
                      compra={{
                        subtitulo: 'Mercadería · Embutidos',
                        dia: entrada.dia,
                        timestamp: entrada.timestamp,
                        modificadoEn: entrada.modificadoEn,
                        cortes: entrada.embutidos.map((emb) => ({ corte: emb.tipo, kg: emb.kg, precioKg: emb.precioKg })),
                        kg: totalKilos,
                        costo: costoTotal,
                        entradaId: entrada.id || null,
                        sinEstadoPago: true,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderListado = () => {
    const embutidos = semanaActiva.embutidos;
    const kgDe = (e) => e.embutidos.reduce((s, x) => s + (x.kg || 0), 0);
    const costoDe = (e) => e.embutidos.reduce((s, x) => s + (x.kg || 0) * (x.precioKg || 0), 0);

    const diasPresentes = DIAS_SEMANA.filter((d) => embutidos.some((e) => e.dia === d));
    const diaHoy = getDiaActual();
    const filtroDia = filtroDiaEntradas !== null
      ? filtroDiaEntradas
      : (diasPresentes.includes(diaHoy) ? diaHoy : 'todos');

    // Se conserva el índice REAL de cada entrada (editar, borrar y expandir trabajan por índice)
    const visibles = embutidos
      .map((entrada, index) => ({ entrada, index }))
      .filter(({ entrada }) => filtroDia === 'todos' || entrada.dia === filtroDia)
      .sort((a, b) => DIAS_SEMANA.indexOf(a.entrada.dia) - DIAS_SEMANA.indexOf(b.entrada.dia));

    const totalKg = visibles.reduce((s, { entrada }) => s + kgDe(entrada), 0);
    const totalCosto = visibles.reduce((s, { entrada }) => s + costoDe(entrada), 0);

    const seg = (activo) => ({
      flex: '0 0 auto', border: 'none', borderRadius: '8px', padding: '5px 10px', whiteSpace: 'nowrap',
      fontSize: '0.74rem', fontWeight: activo ? 600 : 400, cursor: 'pointer',
      background: activo ? '#fff' : 'transparent',
      boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
      color: activo ? '#212529' : '#6c757d',
    });

    return (
      <div>
        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px', overflowX: 'auto' }}>
            {['todos', ...diasPresentes].map((d) => (
              <button key={d} type="button" onClick={() => setFiltroDiaEntradas(d)} style={seg(filtroDia === d)}>
                {d === 'todos' ? 'Todos los días' : d}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#6c757d' }}>
            {visibles.length} {visibles.length === 1 ? 'entrada' : 'entradas'} · <strong style={{ color: '#3a5060' }}>{Math.round(totalKg)} kg</strong>
            {totalCosto > 0 && <> · <strong style={{ color: '#1a5c2a' }}>{formatCurrency(totalCosto)}</strong></>}
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="text-muted text-center mb-0">No hay entradas para ese filtro.</p>
        ) : (
          <div className="row">
            {visibles.map(({ entrada, index }) => renderEntrada(entrada, index))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div className="row">
      <div className="col-lg-5" data-tab="embutidos">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Agregar Embutidos</h5>
          </div>
          <div className="card-body" onKeyDown={handleFormKeyDown}>
            <div className="mb-3">
              <label className="form-label fw-bold">Día de la semana:</label>
              <select
                className="form-select form-select-lg"
                value={formEmbutidos.dia}
                onChange={(e) => setFormEmbutidos({ ...formEmbutidos, dia: e.target.value })}
              >
                {DIAS_SEMANA.map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <label className="form-label fw-bold mb-0">Embutidos (kg y precio por kg):</label>
                <button
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-2"
                  onClick={() => setMostrarInputNuevoTipo(!mostrarInputNuevoTipo)}
                >
                  {mostrarInputNuevoTipo
                    ? <><IconX size={13} /> Cancelar</>
                    : <><IconPlus size={13} /> Agregar Tipo</>}
                </button>
              </div>

              {mostrarInputNuevoTipo && (
                <div className="card mb-3 border-success">
                  <div className="card-body p-3">
                    <div className="input-group">
                      <input
                        ref={nuevoTipoInputRef}
                        type="text"
                        className="form-control"
                        placeholder="Nombre del nuevo tipo de embutido"
                        value={nuevoTipoEmbutido}
                        onChange={(e) => setNuevoTipoEmbutido(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarTipoEmbutidoPersonalizado();
                          }
                        }}
                      />
                      <button
                        className="btn btn-success d-inline-flex align-items-center gap-2"
                        onClick={agregarTipoEmbutidoPersonalizado}
                      >
                        <IconCheck size={15} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mostrarBuscador && (
                <div className="gs-cortes-filtros">
                  <input
                    ref={buscarTipoInputRef}
                    type="search"
                    className="form-control form-control-sm"
                    placeholder={`Buscar tipo entre ${todosLosTipos.length}…`}
                    value={busquedaTipo}
                    onChange={(e) => setBusquedaTipo(e.target.value)}
                  />
                </div>
              )}

              <div className="gs-cortes-lista">
                <div className="gs-cortes-head">
                  <span>Tipo</span>
                  <span style={{ textAlign: 'right' }}>Kg</span>
                  <span style={{ textAlign: 'right' }}>$/Kg</span>
                </div>
                {tiposVisibles.length === 0 && (
                  <div className="gs-cortes-vacio">Ningún tipo coincide.</div>
                )}
                {tiposVisibles.map((tipo, index) => {
                  if (!tipoInputRefs.current[index]) tipoInputRefs.current[index] = [null, null];
                  return (
                    <div key={tipo} className="gs-corte-row">
                      <div className="gs-corte-nombre">
                        <span>{tipo}</span>
                      </div>
                      <div className="gs-corte-campo">
                        <label className="gs-corte-etiqueta">Kg</label>
                        <input
                          ref={(el) => { tipoInputRefs.current[index][0] = el; }}
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="0"
                          step="0.1"
                          value={formEmbutidos.embutidos[tipo]?.kg || ''}
                          onChange={(e) => setFormEmbutidos({
                            ...formEmbutidos,
                            embutidos: {
                              ...formEmbutidos.embutidos,
                              [tipo]: {
                                ...formEmbutidos.embutidos[tipo],
                                kg: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                      <div className={`gs-corte-campo${preciosHighlight.has(tipo) ? ' precio-alert-highlight' : ''}`}>
                        <label className="gs-corte-etiqueta">$/Kg</label>
                        <input
                          ref={(el) => { tipoInputRefs.current[index][1] = el; }}
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="0"
                          step="0.01"
                          value={formEmbutidos.embutidos[tipo]?.precioKg || ''}
                          onChange={(e) => setFormEmbutidos({
                            ...formEmbutidos,
                            embutidos: {
                              ...formEmbutidos.embutidos,
                              [tipo]: {
                                ...formEmbutidos.embutidos[tipo],
                                precioKg: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              ref={agregarEntradaBtnRef}
              type="button"
              className="btn btn-success btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={() => handleAgregarEmbutidos()}
            >
              <IconCheck size={16} /> Agregar Entrada
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-7">
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Entradas de la Semana</h5>
          </div>
          <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {!semanaActiva?.embutidos || semanaActiva.embutidos.length === 0 ? (
              <p className="text-muted text-center">No hay entradas registradas</p>
            ) : renderListado()}
          </div>
        </div>

        {semanaActiva?.embutidos && semanaActiva.embutidos.length > 0 && (
          <div className="gs-totales-glow mt-3">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Totales Semanales</h5>
              </div>
              <div className="card-body">
                {(() => {
                  const { porTipo, total } = calcularTotalesEmbutidos();
                  return (
                    <>
                      <div className="row">
                        {Object.entries(porTipo).map(([tipo, kg]) => (
                          <div key={tipo} className="col-6 mb-2">
                            <strong>{tipo}:</strong> {kg.toFixed(2)} kg
                          </div>
                        ))}
                      </div>
                      <hr />
                      <h4 className="text-center mb-0">
                        <strong>TOTAL: {total.toFixed(2)} kg</strong>
                      </h4>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    <datalist id="gs-tipos-embutidos">
      {todosLosTipos.map((t) => <option key={t} value={t} />)}
    </datalist>

    <ConfirmModal
      isOpen={showWarningPrecios}
      onClose={handleCloseWarningPrecios}
      onConfirm={() => handleAgregarEmbutidos(true)}
      title="⚠️ Faltan los precios"
      message="Hay embutidos sin precio por kg. Registrar los precios es clave para calcular tus costos. ¿Querés ingresar igual sin los precios?"
      confirmText="Ingresar sin precios"
      cancelText="Volver a completar"
      confirmButtonClass="btn-warning"
    />
    </>
  );
}
