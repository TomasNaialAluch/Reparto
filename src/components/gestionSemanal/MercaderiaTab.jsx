import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DIAS_SEMANA, CORTES_CARNE, getDiaActual } from './constants';
import { useContactos } from '../../hooks/useContactos';
import { normalizarNombre } from '../../utils/nombres';
import { formatCurrency } from '../../utils/money';
import ConfirmModal from '../ConfirmModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { IconCheck, IconX, IconEdit, IconTrash, IconPlus } from './icons';

export default function MercaderiaTab({
  semanaActiva,
  agregarMercaderia,
  eliminarMercaderia,
  actualizarMercaderia,
  getConfiguracionesUsuario,
  guardarConfiguracionesUsuario,
  addNotification,
  user
}) {
  const [expandedMercaderia, setExpandedMercaderia] = useState({});
  const [editingMercaderia, setEditingMercaderia] = useState(null);
  const [tempMercaderiaData, setTempMercaderiaData] = useState({});
  const [showDeleteCorteModal, setShowDeleteCorteModal] = useState(false);
  const [corteToDelete, setCorteToDelete] = useState(null);
  const [showWarningPrecios, setShowWarningPrecios] = useState(false);
  const [preciosHighlight, setPreciosHighlight] = useState(new Set());

  // Catálogo único de contactos: los proveedores salen de acá (ya no de user_configs).
  const {
    proveedores: contactosProveedor,
    contactos,
    buscarExacto,
    buscarParecidos,
    crearContacto,
    agregarRol,
    archivarContacto,
  } = useContactos();
  const proveedores = useMemo(() => contactosProveedor.map((c) => c.nombre), [contactosProveedor]);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [ultimosProveedoresUsados, setUltimosProveedoresUsados] = useState([]);
  const [showProveedoresModal, setShowProveedoresModal] = useState(false);
  const [dropdownProveedorOpen, setDropdownProveedorOpen] = useState(false);
  const [nuevoProveedorInput, setNuevoProveedorInput] = useState('');
  const proveedorControlRef = useRef(null);
  const corteInputRefs = useRef([]);
  const nuevoCorteInputRef = useRef(null);
  const agregarEntradaBtnRef = useRef(null);
  const formAgregarRef = useRef(null);

  const [formMercaderia, setFormMercaderia] = useState({
    dia: getDiaActual(),
    proveedor: '',
    proveedorId: null,
    cortes: {}
  });

  const [nuevoCorte, setNuevoCorte] = useState('');
  const [mostrarInputNuevoCorte, setMostrarInputNuevoCorte] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!user?.uid || !getConfiguracionesUsuario || !guardarConfiguracionesUsuario) return;
      try {
        const config = await getConfiguracionesUsuario();
        if (Array.isArray(config?.ultimosProveedoresUsados)) {
          setUltimosProveedoresUsados(config.ultimosProveedoresUsados);
        }
      } catch (e) {
        console.error('Error cargando últimos proveedores:', e);
      }
    };
    cargar();
  }, [user?.uid, getConfiguracionesUsuario, guardarConfiguracionesUsuario]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (proveedorControlRef.current && !proveedorControlRef.current.contains(e.target)) {
        setDropdownProveedorOpen(false);
      }
    };
    if (dropdownProveedorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownProveedorOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showProveedoresModal) setShowProveedoresModal(false);
    };
    if (showProveedoresModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showProveedoresModal]);

  const ordenCortesPorUso = useMemo(() => {
    const proveedor = formMercaderia.proveedor?.trim();
    const customCortes = Object.keys(formMercaderia.cortes).filter((c) => !CORTES_CARNE.includes(c));
    const todos = [...CORTES_CARNE, ...customCortes];
    if (!proveedor || !semanaActiva?.mercaderia?.length) return todos;
    const entradasDelProveedor = semanaActiva.mercaderia.filter((e) => e.proveedor === proveedor);
    const conteo = {};
    entradasDelProveedor.forEach((entrada) => {
      entrada.cortes?.forEach((c) => {
        const n = c.corte ?? c;
        conteo[n] = (conteo[n] ?? 0) + 1;
      });
    });
    return [...todos].sort((a, b) => (conteo[b] ?? 0) - (conteo[a] ?? 0));
  }, [formMercaderia.proveedor, formMercaderia.cortes, semanaActiva?.mercaderia]);

  // ----- Selector de proveedor -----
  const consultaProveedor = normalizarNombre(busquedaProveedor);

  // Sin texto: últimos usados (o los primeros). Con texto: los que coinciden por nombre o alias.
  const ultimosVisibles = useMemo(() => {
    const porNombre = new Map(contactosProveedor.map((c) => [normalizarNombre(c.nombre), c]));
    return ultimosProveedoresUsados
      .map((n) => porNombre.get(normalizarNombre(n)))
      .filter(Boolean);
  }, [ultimosProveedoresUsados, contactosProveedor]);

  const opcionesProveedor = useMemo(() => {
    if (!consultaProveedor) {
      return ultimosVisibles.length ? ultimosVisibles : contactosProveedor.slice(0, 8);
    }
    return contactosProveedor.filter(
      (c) => normalizarNombre(c.nombre).includes(consultaProveedor)
        || (c.alias || []).some((a) => normalizarNombre(a).includes(consultaProveedor))
    );
  }, [consultaProveedor, ultimosVisibles, contactosProveedor]);

  const contactoExacto = consultaProveedor ? buscarExacto(busquedaProveedor) : null;
  // Existe como contacto pero no figura como proveedor (ej. solo cliente).
  const contactoExistenteSinRol = contactoExacto && contactoExacto.activo !== false && !contactoExacto.roles?.proveedor
    ? contactoExacto : null;
  // Se puede crear si hay texto y no hay ya un proveedor con ese nombre exacto.
  const puedeCrearProveedor = !!consultaProveedor
    && !contactoExistenteSinRol
    && !(contactoExacto && contactoExacto.activo !== false && contactoExacto.roles?.proveedor);
  const parecidosAlBuscado = puedeCrearProveedor ? buscarParecidos(busquedaProveedor) : [];

  const toggleExpandedMercaderia = (index) => {
    if (editingMercaderia !== null) {
      cancelEditingMercaderia();
    }
    setExpandedMercaderia(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        return {};
      } else {
        return { [index]: true };
      }
    });
  };

  const startEditingMercaderia = (index, entrada) => {
    setEditingMercaderia(index);
    setTempMercaderiaData({
      dia: entrada.dia,
      proveedor: entrada.proveedor,
      cortes: entrada.cortes.map(c => ({
        ...c,
        kg: c.kg != null ? String(c.kg) : '',
        precioKg: c.precioKg != null ? String(c.precioKg) : ''
      }))
    });
  };

  const cancelEditingMercaderia = () => {
    setEditingMercaderia(null);
    setTempMercaderiaData({});
  };

  const saveEditingMercaderia = async (index) => {
    try {
      const nombreProveedor = (tempMercaderiaData.proveedor || '').trim();
      const contactoDelNombre = buscarExacto(nombreProveedor);
      const dataToSave = {
        ...tempMercaderiaData,
        proveedor: nombreProveedor,
        proveedorId: contactoDelNombre ? contactoDelNombre.id : null,
        cortes: tempMercaderiaData.cortes.map(c => ({
          ...c,
          kg: parseFloat(c.kg) || 0,
          precioKg: parseFloat(c.precioKg) || 0
        }))
      };
      await actualizarMercaderia(index, dataToSave);
      addNotification('Mercadería actualizada', 'success');
      setEditingMercaderia(null);
      setTempMercaderiaData({});
      setExpandedMercaderia({});
    } catch (error) {
      addNotification('Error al actualizar mercadería', 'error');
      console.error(error);
    }
  };

  const updateCorte = (corteIndex, field, value) => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: prev.cortes.map((corte, index) =>
        index === corteIndex ? { ...corte, [field]: value } : corte
      )
    }));
  };

  const eliminarCorteEnEdicion = (corteIndex) => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: prev.cortes.filter((_, index) => index !== corteIndex)
    }));
  };

  const confirmarEliminarCorte = (entradaIndex, corteIndex) => {
    const corte = semanaActiva.mercaderia[entradaIndex].cortes[corteIndex];
    setCorteToDelete({ entradaIndex, corteIndex, corte });
    setShowDeleteCorteModal(true);
  };

  const eliminarCorteDeMercaderia = async () => {
    if (!semanaActiva?.mercaderia || !corteToDelete) return;
    
    try {
      const { entradaIndex, corteIndex } = corteToDelete;
      const nuevaMercaderia = [...semanaActiva.mercaderia];
      nuevaMercaderia[entradaIndex].cortes = nuevaMercaderia[entradaIndex].cortes.filter((_, index) => index !== corteIndex);
      
      if (nuevaMercaderia[entradaIndex].cortes.length === 0) {
        nuevaMercaderia.splice(entradaIndex, 1);
      }
      
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), { 
        mercaderia: nuevaMercaderia 
      });
      addNotification('Corte eliminado exitosamente', 'success');
      setShowDeleteCorteModal(false);
      setCorteToDelete(null);
    } catch (error) {
      console.error('Error al eliminar corte:', error);
      addNotification('Error al eliminar el corte', 'error');
    }
  };

  const agregarCorteEnEdicion = () => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: [...prev.cortes, { corte: 'Nuevo Corte', kg: '', precioKg: '' }]
    }));
  };

  const agregarNuevoCorte = () => {
    const corteTrimmed = nuevoCorte.trim();
    if (!corteTrimmed) {
      addNotification('Ingrese un nombre para el nuevo corte', 'warning');
      return;
    }

    if (formMercaderia.cortes[corteTrimmed]) {
      addNotification('Este corte ya existe', 'warning');
      return;
    }

    setFormMercaderia(prev => ({
      ...prev,
      cortes: {
        ...prev.cortes,
        [corteTrimmed]: { kg: '', precioKg: '' }
      }
    }));

    setNuevoCorte('');
    setMostrarInputNuevoCorte(false);
    addNotification(`Corte "${corteTrimmed}" agregado`, 'success');
  };

  const eliminarCorteDelFormulario = (corte) => {
    setFormMercaderia(prev => {
      const nuevosCortes = { ...prev.cortes };
      delete nuevosCortes[corte];
      return {
        ...prev,
        cortes: nuevosCortes
      };
    });
  };

  const handleAgregarMercaderia = async (forzarSinPrecios = false) => {
    try {
      const cortesConDatos = Object.entries(formMercaderia.cortes)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([corte, datos]) => ({
          corte,
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      if (cortesConDatos.length === 0) {
        addNotification('Debe ingresar al menos un corte con kilos', 'warning');
        return;
      }

      const proveedor = (formMercaderia.proveedor || '').trim();
      if (!proveedor) {
        addNotification('Debe elegir un proveedor', 'warning');
        return;
      }

      if (!forzarSinPrecios) {
        const sinPrecio = cortesConDatos.filter(c => !c.precioKg || c.precioKg === 0);
        if (sinPrecio.length > 0) {
          setShowWarningPrecios(true);
          return;
        }
      }

      await agregarMercaderia({
        dia: formMercaderia.dia,
        proveedor,
        proveedorId: formMercaderia.proveedorId || null,
        cortes: cortesConDatos
      });

      const nuevosUltimos = [proveedor, ...ultimosProveedoresUsados.filter((x) => x !== proveedor)].slice(0, 5);
      setUltimosProveedoresUsados(nuevosUltimos);
      try {
        await guardarConfiguracionesUsuario({ ultimosProveedoresUsados: nuevosUltimos });
      } catch (e) {
        console.error('Error guardando últimos proveedores:', e);
      }

      setFormMercaderia({
        dia: formMercaderia.dia,
        proveedor: '',
        proveedorId: null,
        cortes: {}
      });
      setBusquedaProveedor('');

      addNotification('Mercadería agregada', 'success');
    } catch (err) {
      addNotification('Error al agregar mercadería', 'error');
    }
  };

  const calcularTotalesMercaderia = () => {
    if (!semanaActiva?.mercaderia) return { porCorte: {}, total: 0 };

    const porCorte = {};
    let total = 0;

    semanaActiva.mercaderia.forEach(entrada => {
      entrada.cortes.forEach(({ corte, kg }) => {
        porCorte[corte] = (porCorte[corte] || 0) + kg;
        total += kg;
      });
    });

    return { porCorte, total };
  };

  /** Elige un contacto para la entrada que se está cargando. */
  const seleccionarProveedor = (contacto) => {
    setFormMercaderia((prev) => ({ ...prev, proveedor: contacto.nombre, proveedorId: contacto.id }));
    setBusquedaProveedor('');
    setDropdownProveedorOpen(false);
  };

  /** Alta rápida: crea el contacto (o reutiliza el existente) y lo deja elegido. */
  const crearYSeleccionarProveedor = async (nombre) => {
    try {
      const resultado = await crearContacto(nombre, { proveedor: true, cliente: true });
      setFormMercaderia((prev) => ({ ...prev, proveedor: resultado.nombre, proveedorId: resultado.id }));
      setBusquedaProveedor('');
      setDropdownProveedorOpen(false);
      addNotification(
        resultado.creado ? `"${resultado.nombre}" creado como proveedor` : `"${resultado.nombre}" ya existía, se seleccionó`,
        'success'
      );
    } catch (e) {
      console.error('Error al crear proveedor:', e);
      addNotification('No se pudo crear el proveedor', 'error');
    }
  };

  /** El contacto existe pero no tenía el rol proveedor (ej. solo cliente): se lo prendemos. */
  const habilitarRolProveedor = async (contacto) => {
    try {
      await agregarRol(contacto.id, 'proveedor');
      seleccionarProveedor(contacto);
      addNotification(`"${contacto.nombre}" ahora también es proveedor`, 'success');
    } catch (e) {
      addNotification('No se pudo actualizar el contacto', 'error');
    }
  };

  const eliminarProveedor = async (contacto) => {
    try {
      await archivarContacto(contacto.id);
      if (formMercaderia.proveedorId === contacto.id) {
        setFormMercaderia((prev) => ({ ...prev, proveedor: '', proveedorId: null }));
      }
      addNotification(`"${contacto.nombre}" archivado (conserva su historial)`, 'success');
    } catch (e) {
      addNotification('Error al archivar', 'error');
    }
  };

  const agregarProveedor = async () => {
    const nombre = nuevoProveedorInput.trim();
    if (!nombre) {
      addNotification('Ingresá un nombre', 'warning');
      return;
    }
    const existente = buscarExacto(nombre);
    if (existente && existente.activo !== false && existente.roles?.proveedor) {
      addNotification('Ese proveedor ya existe', 'warning');
      return;
    }
    try {
      const resultado = await crearContacto(nombre, { proveedor: true, cliente: true });
      setNuevoProveedorInput('');
      addNotification(`"${resultado.nombre}" agregado`, 'success');
    } catch (e) {
      addNotification('Error al guardar', 'error');
    }
  };

  const handleCloseWarningPrecios = () => {
    setShowWarningPrecios(false);
    const sinPrecio = Object.entries(formMercaderia.cortes)
      .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0 && (!datos.precioKg || parseFloat(datos.precioKg) === 0))
      .map(([corte]) => corte);
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

  const handleFormKeyDown = (e) => {
    const target = e.target;
    const cortes = ordenCortesPorUso;
    const n = cortes.length;

    if (e.key === 'Enter') {
      if (nuevoCorteInputRef.current && target === nuevoCorteInputRef.current) return;
      if (target === agregarEntradaBtnRef.current) return;
      if (target.tagName === 'BUTTON' && target !== agregarEntradaBtnRef.current) return;
      e.preventDefault();
      handleAgregarMercaderia();
      return;
    }

    const arrowNext = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const arrowPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    if (!arrowNext && !arrowPrev) return;

    let currentIndex = -1;
    for (let i = 0; i < n; i++) {
      const pair = corteInputRefs.current[i];
      if (!pair) continue;
      if (target === pair[0] || target === pair[1]) {
        currentIndex = i;
        break;
      }
    }

    if (arrowNext) {
      e.preventDefault();
      if (currentIndex < 0) return;
      if (currentIndex < n - 1) {
        const next = corteInputRefs.current[currentIndex + 1];
        if (next && next[0]) next[0].focus();
      } else if (agregarEntradaBtnRef.current) {
        agregarEntradaBtnRef.current.focus();
      }
    } else if (arrowPrev) {
      e.preventDefault();
      if (currentIndex <= 0) return;
      const prev = corteInputRefs.current[currentIndex - 1];
      if (prev && prev[0]) prev[0].focus();
    }
  };

  return (
    <div className="row">
      <div className="col-lg-5" data-tab="mercaderia">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Agregar Mercadería (Carne)</h5>
          </div>
          <div className="card-body" ref={formAgregarRef} onKeyDown={handleFormKeyDown}>
            <div className="mb-3">
              <label className="form-label fw-bold">Día de la semana:</label>
              <select 
                className="form-select form-select-lg"
                value={formMercaderia.dia}
                onChange={(e) => setFormMercaderia({...formMercaderia, dia: e.target.value})}
              >
                {DIAS_SEMANA.map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>

            <div className="mb-3 position-relative" ref={proveedorControlRef}>
              <label className="form-label fw-bold">Proveedor:</label>
              <div className="d-flex rounded overflow-hidden border" style={{ minHeight: '48px' }}>
                <input
                  type="text"
                  className="form-control border-0 rounded-0 shadow-none px-3"
                  style={{ minHeight: '48px' }}
                  placeholder="Buscar o crear proveedor…"
                  value={dropdownProveedorOpen ? busquedaProveedor : (formMercaderia.proveedor || '')}
                  onFocus={() => { setBusquedaProveedor(''); setDropdownProveedorOpen(true); }}
                  onChange={(e) => { setBusquedaProveedor(e.target.value); setDropdownProveedorOpen(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setDropdownProveedorOpen(false);
                    if (e.key === 'Enter' && opcionesProveedor.length === 1) {
                      e.preventDefault();
                      seleccionarProveedor(opcionesProveedor[0]);
                    }
                  }}
                />
                {formMercaderia.proveedor && (
                  <button
                    type="button"
                    className="btn btn-light border-start rounded-0 px-3"
                    title="Quitar proveedor elegido"
                    onClick={() => {
                      setFormMercaderia((prev) => ({ ...prev, proveedor: '', proveedorId: null }));
                      setBusquedaProveedor('');
                    }}
                  >
                    <IconX size={13} />
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center px-3 rounded-0 border-0 border-start"
                  style={{ minWidth: '48px', minHeight: '48px' }}
                  onClick={() => {
                    setDropdownProveedorOpen(false);
                    setShowProveedoresModal(true);
                  }}
                  title="Gestionar proveedores"
                >
                  <span className="fs-4">+</span>
                </button>
              </div>

              {dropdownProveedorOpen && (
                <div
                  className="border rounded mt-1 bg-white shadow-sm position-absolute start-0 end-0 z-2"
                  style={{ maxHeight: '280px', overflowY: 'auto' }}
                >
                  {!busquedaProveedor.trim() && ultimosVisibles.length > 0 && (
                    <div className="px-3 pt-2 pb-1 text-muted" style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Últimos usados
                    </div>
                  )}
                  {opcionesProveedor.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="btn btn-light w-100 text-start rounded-0 border-bottom"
                      onClick={() => seleccionarProveedor(c)}
                    >
                      {c.nombre}
                    </button>
                  ))}

                  {busquedaProveedor.trim() && opcionesProveedor.length === 0 && !contactoExistenteSinRol && !puedeCrearProveedor && (
                    <div className="px-3 py-2 text-muted small">Sin coincidencias.</div>
                  )}

                  {contactoExistenteSinRol && (
                    <button
                      type="button"
                      className="btn btn-light w-100 text-start rounded-0 border-bottom"
                      onClick={() => habilitarRolProveedor(contactoExistenteSinRol)}
                    >
                      <strong>{contactoExistenteSinRol.nombre}</strong> ya existe como cliente.{' '}
                      <span className="text-primary">Agregar también como proveedor</span>
                    </button>
                  )}

                  {puedeCrearProveedor && (
                    <>
                      {parecidosAlBuscado.length > 0 && (
                        <div className="px-3 py-2 small" style={{ background: 'rgba(255,209,102,0.18)', color: '#7a5000' }}>
                          Se parece a: {parecidosAlBuscado.map((c) => c.nombre).join(', ')}. Revisá antes de crear uno nuevo.
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-light w-100 text-start rounded-0"
                        onClick={() => crearYSeleccionarProveedor(busquedaProveedor)}
                      >
                        <span className="text-primary fw-bold">+ Crear proveedor</span> «{busquedaProveedor.trim()}»
                      </button>
                    </>
                  )}
                </div>
              )}
              <small className="form-text text-muted d-block mt-1">
                Escribí para buscar. Si no existe, lo creás ahí mismo.
              </small>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0">Cortes (kg y precio por kg):</label>
                <button
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-2"
                  onClick={() => setMostrarInputNuevoCorte(!mostrarInputNuevoCorte)}
                >
                  {mostrarInputNuevoCorte
                    ? <><IconX size={13} /> Cancelar</>
                    : <><IconPlus size={13} /> Agregar Corte</>}
                </button>
              </div>

              {mostrarInputNuevoCorte && (
                <div className="card mb-3 border-success">
                  <div className="card-body p-3">
                    <div className="input-group">
                      <input
                        ref={nuevoCorteInputRef}
                        type="text"
                        className="form-control"
                        placeholder="Nombre del nuevo corte (ej: Bife de chorizo, Asado, etc.)"
                        value={nuevoCorte}
                        onChange={(e) => setNuevoCorte(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            agregarNuevoCorte();
                          }
                        }}
                      />
                      <button
                        className="btn btn-success d-inline-flex align-items-center gap-2"
                        onClick={agregarNuevoCorte}
                      >
                        <IconCheck size={15} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                {ordenCortesPorUso.map((corte, index) => {
                  const esPersonalizado = !CORTES_CARNE.includes(corte);
                  if (!corteInputRefs.current[index]) corteInputRefs.current[index] = [null, null];
                  return (
                    <motion.div
                      key={corte}
                      layout
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="col-lg-4 col-md-6 mb-3"
                    >
                      <div className={`card h-100 ${esPersonalizado ? 'border-success' : ''}`}>
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                              {corte}
                              {esPersonalizado && (
                                <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>Personalizado</span>
                              )}
                            </label>
                            {esPersonalizado && (
                              <button
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                style={{ padding: '0.15rem 0.3rem' }}
                                onClick={() => eliminarCorteDelFormulario(corte)}
                                title="Eliminar corte"
                              >
                                <IconX size={12} />
                              </button>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">Kg</span>
                              <input
                                ref={(el) => { corteInputRefs.current[index][0] = el; }}
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.1"
                                value={formMercaderia.cortes[corte]?.kg || ''}
                                onChange={(e) => setFormMercaderia({
                                  ...formMercaderia,
                                  cortes: {
                                    ...formMercaderia.cortes,
                                    [corte]: {
                                      ...formMercaderia.cortes[corte],
                                      kg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className={`input-group input-group-sm${preciosHighlight.has(corte) ? ' precio-alert-highlight' : ''}`}>
                              <span className="input-group-text">$/Kg</span>
                              <input
                                ref={(el) => { corteInputRefs.current[index][1] = el; }}
                                type="number"
                                className="form-control"
                                placeholder="0"
                                step="0.01"
                                value={formMercaderia.cortes[corte]?.precioKg || ''}
                                onChange={(e) => setFormMercaderia({
                                  ...formMercaderia,
                                  cortes: {
                                    ...formMercaderia.cortes,
                                    [corte]: {
                                      ...formMercaderia.cortes[corte],
                                      precioKg: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <button 
              ref={agregarEntradaBtnRef}
              type="button"
              className="btn btn-success btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={handleAgregarMercaderia}
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
            {!semanaActiva?.mercaderia || semanaActiva.mercaderia.length === 0 ? (
              <p className="text-muted text-center">No hay entradas registradas</p>
            ) : (
              <div className="row">
                {semanaActiva.mercaderia.map((entrada, index) => {
                  const totalKilos = entrada.cortes.reduce((sum, corte) => sum + corte.kg, 0);
                  const costoTotal = entrada.cortes.reduce((sum, corte) => sum + (corte.kg * (corte.precioKg || 0)), 0);
                  const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
                  const isExpanded = expandedMercaderia[index];
                  
                  return (
                    <div key={index} className={`mb-3 card-transition ${editingMercaderia === index ? 'col-12 card-expand' : 'col-lg-4 col-md-6 col-sm-6'}`}>
                      <div 
                        className={`card border-primary h-100 ${editingMercaderia !== index ? 'smooth-hover' : ''}`}
                        style={{ cursor: editingMercaderia === index ? 'default' : 'pointer' }}
                        onClick={() => editingMercaderia === index ? null : toggleExpandedMercaderia(index)}
                      >
                        {!isExpanded ? (
                          <div className="card-body p-2 text-center">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">
                                <span className="badge bg-primary">{entrada.dia}</span>
                                {' '}
                                <strong>{entrada.proveedor}</strong>
                              </h6>
                              <button 
                                className="btn btn-sm btn-danger d-inline-flex align-items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  eliminarMercaderia(index);
                                }}
                              >
                                <IconX size={13} />
                              </button>
                            </div>
                            <h5 className="text-primary mb-1">
                              <strong>{Math.round(totalKilos)} kg</strong>
                            </h5>
                            {costoTotal > 0 && (
                              <h6 className="text-success mb-1" style={{ fontSize: '0.9rem' }}>
                                <strong>{formatCurrency(costoTotal)}</strong>
                                {costoPromedioKg > 0 && (
                                  <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.85rem' }}>
                                    ({formatCurrency(costoPromedioKg)}/kg)
                                  </span>
                                )}
                              </h6>
                            )}
                            <small className="text-muted">
                              {entrada.cortes.length} tipos de corte
                            </small>
                          </div>
                        ) : (
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                {editingMercaderia === index ? (
                                  <div className="d-flex gap-2 align-items-center">
                                    <select 
                                      className="form-select form-select-sm" 
                                      style={{width: 'auto'}}
                                      value={tempMercaderiaData.dia}
                                      onChange={(e) => setTempMercaderiaData(prev => ({...prev, dia: e.target.value}))}
                                    >
                                      {DIAS_SEMANA.map(dia => (
                                        <option key={dia} value={dia}>{dia}</option>
                                      ))}
                                    </select>
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm" 
                                      style={{width: '120px'}}
                                      value={tempMercaderiaData.proveedor}
                                      onChange={(e) => setTempMercaderiaData(prev => ({...prev, proveedor: e.target.value}))}
                                    />
                                  </div>
                                ) : (
                                  <h6 className="mb-1">
                                    <span className="badge bg-primary">{entrada.dia}</span>
                                    {' '}
                                    <strong>{entrada.proveedor}</strong>
                                  </h6>
                                )}
                              </div>
                              <div className="d-flex gap-1">
                                {editingMercaderia === index ? (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-success d-inline-flex align-items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditingMercaderia(index);
                                      }}
                                    >
                                      <IconCheck size={13} />
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-secondary d-inline-flex align-items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingMercaderia();
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
                                        startEditingMercaderia(index, entrada);
                                      }}
                                    >
                                      <IconEdit size={13} />
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-danger d-inline-flex align-items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarMercaderia(index);
                                      }}
                                    >
                                      <IconTrash size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {editingMercaderia === index ? (
                              <div className="fade-in">
                                <div className="row g-2">
                                  {tempMercaderiaData.cortes.map((corte, i) => (
                                    <div key={i} className="col-md-3 col-sm-6">
                                      <div className="border rounded p-2 position-relative">
                                        <button 
                                          className="btn btn-sm btn-danger position-absolute d-inline-flex align-items-center"
                                          style={{ top: '2px', right: '2px', padding: '0.15rem 0.3rem' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarCorteEnEdicion(i);
                                          }}
                                          title="Eliminar corte"
                                        >
                                          <IconX size={11} />
                                        </button>
                                        <input 
                                          type="text" 
                                          className="form-control form-control-sm mb-1" 
                                          value={corte.corte}
                                          onChange={(e) => updateCorte(i, 'corte', e.target.value)}
                                          placeholder="Nombre del corte"
                                        />
                                        <div className="input-group input-group-sm mb-1">
                                          <span className="input-group-text" style={{fontSize: '0.75rem'}}>Kg</span>
                                          <input
                                            type="number"
                                            className="form-control"
                                            value={corte.kg}
                                            onChange={(e) => updateCorte(i, 'kg', e.target.value)}
                                            step="0.1"
                                            placeholder="0"
                                          />
                                        </div>
                                        <div className="input-group input-group-sm">
                                          <span className="input-group-text" style={{fontSize: '0.75rem'}}>$/Kg</span>
                                          <input
                                            type="number"
                                            className="form-control"
                                            value={corte.precioKg ?? ''}
                                            onChange={(e) => updateCorte(i, 'precioKg', e.target.value)}
                                            step="0.01"
                                            placeholder="0"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="col-md-3 col-sm-6">
                                    <button 
                                      className="btn btn-outline-primary w-100 h-100 d-flex align-items-center justify-content-center"
                                      style={{ minHeight: '80px' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        agregarCorteEnEdicion();
                                      }}
                                    >
                                      <span style={{ fontSize: '2rem' }}>+</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-3 pt-2 border-top">
                                  {(() => {
                                    const totalKgEdit = tempMercaderiaData.cortes.reduce((sum, c) => sum + (parseFloat(c.kg) || 0), 0);
                                    const costoTotalEdit = tempMercaderiaData.cortes.reduce((sum, c) => sum + ((parseFloat(c.kg) || 0) * (parseFloat(c.precioKg) || 0)), 0);
                                    return (
                                      <>
                                        <div className="d-flex justify-content-between">
                                          <strong>Total:</strong>
                                          <strong className="text-primary fs-5">{totalKgEdit.toFixed(2)} kg</strong>
                                        </div>
                                        {tempMercaderiaData.cortes.some(c => parseFloat(c.precioKg) > 0) && (
                                          <>
                                            <div className="d-flex justify-content-between mt-1">
                                              <strong>Costo Total:</strong>
                                              <strong className="text-success">${costoTotalEdit.toFixed(2)}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                              <strong>Costo Promedio:</strong>
                                              <strong className="text-info">
                                                ${totalKgEdit > 0 ? (costoTotalEdit / totalKgEdit).toFixed(2) : '0.00'}/kg
                                              </strong>
                                            </div>
                                          </>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <ul className="list-unstyled mb-0 small">
                                  {entrada.cortes.map((corte, i) => (
                                    <li key={i} className="mb-1 d-flex justify-content-between align-items-center">
                                      <div>
                                        • {corte.corte}: <strong>{corte.kg.toFixed(2)} kg</strong>
                                        {corte.precioKg ? (
                                          <span className="text-muted"> (${corte.precioKg}/kg = ${(corte.kg * corte.precioKg).toFixed(2)})</span>
                                        ) : null}
                                      </div>
                                      <button
                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                        style={{ padding: '0.15rem 0.3rem' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmarEliminarCorte(index, i);
                                        }}
                                        title="Eliminar corte"
                                      >
                                        <IconX size={11} />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 pt-2 border-top">
                                  <div className="d-flex justify-content-between">
                                    <strong>Total:</strong>
                                    <strong className="text-primary">
                                      {totalKilos.toFixed(2)} kg
                                    </strong>
                                  </div>
                                  {entrada.cortes.some(c => c.precioKg) && (
                                    <>
                                      <div className="d-flex justify-content-between mt-1">
                                        <strong>Costo Total:</strong>
                                        <strong className="text-success">
                                          ${entrada.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0).toFixed(2)}
                                        </strong>
                                      </div>
                                      <div className="d-flex justify-content-between mt-1">
                                        <strong>Costo Promedio:</strong>
                                        <strong className="text-info">
                                          ${costoPromedioKg.toFixed(2)}/kg
                                        </strong>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {semanaActiva?.mercaderia && semanaActiva.mercaderia.length > 0 && (
          <div className="gs-totales-glow mt-3">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Totales Semanales</h5>
              </div>
              <div className="card-body">
                {(() => {
                  const { porCorte, total } = calcularTotalesMercaderia();
                  return (
                    <>
                      <div className="row">
                        {Object.entries(porCorte).map(([corte, kg]) => (
                          <div key={corte} className="col-6 mb-2">
                            <strong>{corte}:</strong> {kg.toFixed(2)} kg
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

      {showProveedoresModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowProveedoresModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Gestionar proveedores</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setShowProveedoresModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Agregá o archivá proveedores. Los archivados ya no aparecen al cargar mercadería, pero conservan su historial.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-bold">Agregar proveedor</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nombre del proveedor"
                      value={nuevoProveedorInput}
                      onChange={(e) => setNuevoProveedorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && agregarProveedor()}
                    />
                    <button type="button" className="btn btn-primary" onClick={agregarProveedor}>
                      Agregar
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Lista actual</label>
                  <p className="text-muted small mb-2">Hacé clic en un nombre para elegirlo e ingresar mercadería.</p>
                  {contactosProveedor.length === 0 ? (
                    <p className="text-muted small mb-0">No hay proveedores. Agregá uno arriba.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {contactosProveedor.map((c) => (
                        <li
                          key={c.id}
                          className="list-group-item d-flex justify-content-between align-items-center px-0"
                        >
                          <button
                            type="button"
                            className="btn btn-link text-dark text-decoration-none p-0 text-start flex-grow-1"
                            onClick={() => {
                              seleccionarProveedor(c);
                              setShowProveedoresModal(false);
                            }}
                          >
                            {c.nombre}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarProveedor(c);
                            }}
                            title="Archivar proveedor (conserva su historial)"
                          >
                            Archivar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowProveedoresModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showWarningPrecios}
        onClose={handleCloseWarningPrecios}
        onConfirm={() => handleAgregarMercaderia(true)}
        title="⚠️ Faltan los precios"
        message="Hay cortes sin precio por kg. Registrar los precios es clave para calcular tus costos. ¿Querés ingresar igual sin los precios?"
        confirmText="Ingresar sin precios"
        cancelText="Volver a completar"
        confirmButtonClass="btn-warning"
      />

      <ConfirmModal
        isOpen={showDeleteCorteModal}
        onClose={() => {
          setShowDeleteCorteModal(false);
          setCorteToDelete(null);
        }}
        onConfirm={eliminarCorteDeMercaderia}
        title="Eliminar Corte"
        message={`¿Estás seguro de que querés eliminar el corte "${corteToDelete?.corte?.corte}"?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
      />
    </div>
  );
}


