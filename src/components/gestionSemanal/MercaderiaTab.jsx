import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DIAS_SEMANA, CORTES_CARNE, getDiaActual } from './constants';
import { useContactos } from '../../hooks/useContactos';
import { normalizarNombre } from '../../utils/nombres';
import { idBoleta } from '../../utils/boletas';
import { BoletaTicket } from '../BoletaTicketModal';
import { usePreciosReferencia, FACTOR_PRECIO_ATIPICO } from '../../hooks/usePreciosReferencia';
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
  // Lista de entradas agrupada por proveedor (arranca todo colapsado)
  // null = automático: arranca en el día actual (si ese día tiene entradas); el usuario puede cambiarlo
  const [filtroDiaEntradas, setFiltroDiaEntradas] = useState(null);
  const [busquedaGrupo, setBusquedaGrupo] = useState('');
  const [ordenGrupos, setOrdenGrupos] = useState('compra');
  const [gruposAbiertos, setGruposAbiertos] = useState({});
  const [busquedaModalProv, setBusquedaModalProv] = useState('');
  // Control de precios: aviso cuando un precio por kg es mucho mayor al habitual
  const { referenciaPara } = usePreciosReferencia();
  const [controlPrecios, setControlPrecios] = useState(null);
  const [preciosCorregidos, setPreciosCorregidos] = useState({});
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

  const confirmarControlPrecios = async (todoCorrecto) => {
    const control = controlPrecios;
    if (!control) return;
    const precios = {};
    control.items.forEach((it) => {
      precios[it.key] = todoCorrecto ? it.precioKg : parseFloat(preciosCorregidos[it.key]);
    });
    setControlPrecios(null);

    if (control.origen === 'agregar') {
      // Refleja la corrección en el formulario y continúa con el guardado
      setFormMercaderia((prev) => ({
        ...prev,
        cortes: {
          ...prev.cortes,
          ...Object.fromEntries(control.items.map((it) => [it.key, { ...prev.cortes[it.key], precioKg: String(precios[it.key]) }])),
        },
      }));
      await handleAgregarMercaderia(control.forzarSinPrecios, { precios, omitirControlPrecios: true });
    } else {
      setTempMercaderiaData((prev) => ({
        ...prev,
        cortes: prev.cortes.map((c, i) => (precios[i] !== undefined ? { ...c, precioKg: String(precios[i]) } : c)),
      }));
      await saveEditingMercaderia(control.indexEdit, { precios, omitirControlPrecios: true });
    }
  };

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

  // Precio habitual si el precio dado es sospechosamente alto; null si es normal.
  const referenciaSiAtipico = (proveedorId, proveedorNombre, corte, precio) => {
    const valor = Number(precio);
    if (!(valor > 0)) return null;
    const ref = referenciaPara(proveedorId, proveedorNombre, corte);
    return ref && valor > ref * FACTOR_PRECIO_ATIPICO ? ref : null;
  };

  const detectarPreciosAtipicos = (proveedorId, proveedorNombre, lista) => lista
    .map((c) => ({ ...c, ref: referenciaSiAtipico(proveedorId, proveedorNombre, c.corte, c.precioKg) }))
    .filter((c) => c.ref);

  const saveEditingMercaderia = async (index, opciones = {}) => {
    try {
      const nombreProveedor = (tempMercaderiaData.proveedor || '').trim();
      const contactoDelNombre = buscarExacto(nombreProveedor);
      const cortesAGuardar = tempMercaderiaData.cortes.map((c, i) => ({
        ...c,
        kg: parseFloat(c.kg) || 0,
        precioKg: opciones.precios && opciones.precios[i] !== undefined
          ? opciones.precios[i]
          : (parseFloat(c.precioKg) || 0)
      }));

      if (!opciones.omitirControlPrecios) {
        const atipicos = detectarPreciosAtipicos(
          contactoDelNombre ? contactoDelNombre.id : null,
          nombreProveedor,
          cortesAGuardar.map((c, i) => ({ key: i, corte: c.corte, kg: c.kg, precioKg: c.precioKg }))
        );
        if (atipicos.length > 0) {
          setPreciosCorregidos(Object.fromEntries(atipicos.map((a) => [a.key, String(a.precioKg)])));
          setControlPrecios({ origen: 'editar', items: atipicos, indexEdit: index });
          return;
        }
      }

      const dataToSave = {
        ...tempMercaderiaData,
        proveedor: nombreProveedor,
        proveedorId: contactoDelNombre ? contactoDelNombre.id : null,
        cortes: cortesAGuardar
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

  const handleAgregarMercaderia = async (forzarSinPrecios = false, opciones = {}) => {
    try {
      let cortesConDatos = Object.entries(formMercaderia.cortes)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([corte, datos]) => ({
          corte,
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      // Precios ya corregidos desde el control de precios
      if (opciones.precios) {
        cortesConDatos = cortesConDatos.map((c) => (
          opciones.precios[c.corte] !== undefined ? { ...c, precioKg: opciones.precios[c.corte] } : c
        ));
      }

      if (cortesConDatos.length === 0) {
        addNotification('Debe ingresar al menos un corte con kilos', 'warning');
        return;
      }

      const proveedor = (formMercaderia.proveedor || '').trim();
      if (!proveedor) {
        addNotification('Debe elegir un proveedor', 'warning');
        return;
      }

      // Control de precios: un precio por kg muy por encima del habitual frena el guardado.
      if (!opciones.omitirControlPrecios) {
        const atipicos = detectarPreciosAtipicos(
          formMercaderia.proveedorId || null,
          proveedor,
          cortesConDatos.map((c) => ({ key: c.corte, corte: c.corte, kg: c.kg, precioKg: c.precioKg }))
        );
        if (atipicos.length > 0) {
          setPreciosCorregidos(Object.fromEntries(atipicos.map((a) => [a.key, String(a.precioKg)])));
          setControlPrecios({ origen: 'agregar', items: atipicos, forzarSinPrecios });
          return;
        }
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
      // Dejar a la vista el grupo donde quedó la entrada recién cargada.
      setGruposAbiertos((prev) => ({
        ...prev,
        [formMercaderia.proveedorId || `n:${normalizarNombre(proveedor)}`]: true,
      }));

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

              <div className="gs-cortes-lista">
                <div className="gs-cortes-head">
                  <span>Corte</span>
                  <span style={{ textAlign: 'right' }}>Kg</span>
                  <span style={{ textAlign: 'right' }}>$/Kg</span>
                </div>
                {ordenCortesPorUso.map((corte, index) => {
                  const esPersonalizado = !CORTES_CARNE.includes(corte);
                  if (!corteInputRefs.current[index]) corteInputRefs.current[index] = [null, null];
                  const precioActual = formMercaderia.cortes[corte]?.precioKg;
                  const refPrecio = referenciaSiAtipico(formMercaderia.proveedorId, formMercaderia.proveedor, corte, precioActual);
                  return (
                    <motion.div
                      key={corte}
                      layout
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="gs-corte-row"
                    >
                      <div className="gs-corte-nombre">
                        <span>{corte}</span>
                        {esPersonalizado && (
                          <span className="badge bg-success" style={{ fontSize: '0.58rem' }}>Personalizado</span>
                        )}
                        {esPersonalizado && (
                          <button
                            type="button"
                            className="gs-corte-quitar"
                            onClick={() => eliminarCorteDelFormulario(corte)}
                            title="Eliminar corte"
                          >
                            <IconX size={13} />
                          </button>
                        )}
                      </div>
                      <div className="gs-corte-campo">
                        <label className="gs-corte-etiqueta">Kg</label>
                        <input
                          ref={(el) => { corteInputRefs.current[index][0] = el; }}
                          type="number"
                          className="form-control form-control-sm"
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
                      <div className={`gs-corte-campo${preciosHighlight.has(corte) ? ' precio-alert-highlight' : ''}`}>
                        <label className="gs-corte-etiqueta">$/Kg</label>
                        <input
                          ref={(el) => { corteInputRefs.current[index][1] = el; }}
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="0"
                          step="0.01"
                          value={precioActual || ''}
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
                          style={refPrecio ? { borderColor: '#dc3545', background: 'rgba(220,53,69,0.06)' } : undefined}
                        />
                      </div>
                      {refPrecio && (
                        <div className="gs-corte-aviso">
                          Precio muy alto: lo habitual ronda {formatCurrency(refPrecio)}/kg
                        </div>
                      )}
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
            (() => {
              const renderEntrada = (entrada, index) => {
                  const totalKilos = entrada.cortes.reduce((sum, corte) => sum + corte.kg, 0);
                  const costoTotal = entrada.cortes.reduce((sum, corte) => sum + (corte.kg * (corte.precioKg || 0)), 0);
                  const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
                  const isExpanded = expandedMercaderia[index];
                  
                  return (
                    <div key={index} className={`mb-3 card-transition ${editingMercaderia === index ? 'col-12 card-expand' : (isExpanded ? 'col-12' : 'col-12 col-sm-6')}`}>
                      <div
                        className="card h-100"
                        style={{
                          cursor: editingMercaderia === index ? 'default' : 'pointer',
                          border: '1px solid #d3d9de',
                          borderLeft: `3px solid ${costoTotal > 0 ? '#6A8899' : '#FFD166'}`,
                          borderRadius: '12px',
                          boxShadow: 'none',
                          background: '#fff',
                        }}
                        onClick={() => editingMercaderia === index ? null : toggleExpandedMercaderia(index)}
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
                                  eliminarMercaderia(index);
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
                            <small style={{ color: '#9ca3af' }}>
                              {entrada.cortes.length} {entrada.cortes.length === 1 ? 'corte' : 'cortes'}
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
                                <div className="gs-cortes-lista gs-cortes-edicion" onClick={(e) => e.stopPropagation()}>
                                  <div className="gs-cortes-head">
                                    <span>Corte</span>
                                    <span style={{ textAlign: 'right' }}>Kg</span>
                                    <span style={{ textAlign: 'right' }}>$/Kg</span>
                                    <span />
                                  </div>
                                  {tempMercaderiaData.cortes.map((corte, i) => {
                                    const refPrecio = referenciaSiAtipico(
                                      buscarExacto(tempMercaderiaData.proveedor)?.id || null,
                                      tempMercaderiaData.proveedor,
                                      corte.corte,
                                      corte.precioKg
                                    );
                                    return (
                                      <div key={i} className="gs-corte-row">
                                        <div className="gs-corte-nombre">
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={corte.corte}
                                            onChange={(e) => updateCorte(i, 'corte', e.target.value)}
                                            placeholder="Nombre del corte"
                                          />
                                        </div>
                                        <div className="gs-corte-campo">
                                          <label className="gs-corte-etiqueta">Kg</label>
                                          <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={corte.kg}
                                            onChange={(e) => updateCorte(i, 'kg', e.target.value)}
                                            step="0.1"
                                            placeholder="0"
                                          />
                                        </div>
                                        <div className="gs-corte-campo">
                                          <label className="gs-corte-etiqueta">$/Kg</label>
                                          <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={corte.precioKg ?? ''}
                                            onChange={(e) => updateCorte(i, 'precioKg', e.target.value)}
                                            step="0.01"
                                            placeholder="0"
                                            style={refPrecio ? { borderColor: '#dc3545', background: 'rgba(220,53,69,0.06)' } : undefined}
                                          />
                                        </div>
                                        <div className="gs-corte-quitar-celda">
                                          <button
                                            type="button"
                                            className="gs-corte-quitar"
                                            onClick={() => eliminarCorteEnEdicion(i)}
                                            title="Eliminar corte"
                                          >
                                            <IconX size={14} />
                                          </button>
                                        </div>
                                        {refPrecio && (
                                          <div className="gs-corte-aviso">
                                            Precio muy alto: lo habitual ronda {formatCurrency(refPrecio)}/kg
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary mt-2 d-inline-flex align-items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      agregarCorteEnEdicion();
                                    }}
                                  >
                                    <IconPlus size={12} /> Agregar corte
                                  </button>
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
                              <div style={{ background: '#eef1f3', borderRadius: '12px', padding: '14px 10px' }}>
                                <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                                  <BoletaTicket
                                    sombra="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"
                                    compra={{
                                      proveedor: (contactos.find((c) => c.id === entrada.proveedorId) || {}).nombre || entrada.proveedor,
                                      dia: entrada.dia,
                                      timestamp: entrada.timestamp,
                                      modificadoEn: entrada.modificadoEn,
                                      cortes: entrada.cortes || [],
                                      kg: totalKilos,
                                      costo: costoTotal,
                                      pagada: (semanaActiva.pagosProveedoresEstado?.boletasPagadas || {})[idBoleta(entrada, index)] === true,
                                      entradaId: entrada.id || null,
                                      semanaCerrada: false,
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

              const mercaderia = semanaActiva.mercaderia;
              const claveDe = (e) => e.proveedorId || `n:${normalizarNombre(e.proveedor)}`;
              const nombreDeContacto = (id) => (contactos.find((c) => c.id === id) || {}).nombre;
              const kgDe = (e) => (e.cortes || []).reduce((s, c) => s + (c.kg || 0), 0);
              const costoDe = (e) => (e.cortes || []).reduce((s, c) => s + (c.kg || 0) * (c.precioKg || 0), 0);

              // Días que realmente tienen mercadería (para el filtro)
              const diasPresentes = DIAS_SEMANA.filter((d) => mercaderia.some((e) => e.dia === d));
              const diaHoy = getDiaActual();
              const filtroDia = filtroDiaEntradas !== null
                ? filtroDiaEntradas
                : (diasPresentes.includes(diaHoy) ? diaHoy : 'todos');

              // 1) Agrupar por proveedor conservando el índice REAL de cada entrada
              //    (editar, borrar y expandir trabajan por índice).
              const mapa = new Map();
              mercaderia.forEach((entrada, index) => {
                if (filtroDia !== 'todos' && entrada.dia !== filtroDia) return;
                const clave = claveDe(entrada);
                if (!mapa.has(clave)) {
                  mapa.set(clave, {
                    clave,
                    nombre: nombreDeContacto(entrada.proveedorId) || entrada.proveedor,
                    entradas: [],
                    ultimo: '',
                  });
                }
                const g = mapa.get(clave);
                g.entradas.push({ entrada, index });
                if ((entrada.timestamp || '') > g.ultimo) g.ultimo = entrada.timestamp || '';
              });

              // 2) Totales y resumen de productos por grupo
              let grupos = [...mapa.values()].map((g) => {
                const porCorte = {};
                const dias = [];
                let kg = 0;
                let costo = 0;
                g.entradas.forEach(({ entrada }) => {
                  kg += kgDe(entrada);
                  costo += costoDe(entrada);
                  if (!dias.includes(entrada.dia)) dias.push(entrada.dia);
                  (entrada.cortes || []).forEach((c) => {
                    porCorte[c.corte] = (porCorte[c.corte] || 0) + (c.kg || 0);
                  });
                });
                const productos = Object.entries(porCorte).sort((a, b) => b[1] - a[1]);
                return { ...g, kg, costo, promedio: kg > 0 ? costo / kg : 0, productos, dias };
              });

              const q = normalizarNombre(busquedaGrupo);
              if (q) grupos = grupos.filter((g) => normalizarNombre(g.nombre).includes(q));

              if (ordenGrupos === 'az') grupos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
              else if (ordenGrupos === 'ultimo') grupos.sort((a, b) => (b.ultimo || '').localeCompare(a.ultimo || ''));
              else grupos.sort((a, b) => b.costo - a.costo || b.kg - a.kg);

              const totalKgSemana = grupos.reduce((s, g) => s + g.kg, 0);
              const totalCostoSemana = grupos.reduce((s, g) => s + g.costo, 0);
              const totalEntradas = grupos.reduce((s, g) => s + g.entradas.length, 0);

              // Todos los grupos arrancan colapsados; se abre solo el que se elige (o el recién cargado).
              const estaAbierto = (clave) => gruposAbiertos[clave] === true;

              const seg = (activo) => ({
                flex: '0 0 auto', border: 'none', borderRadius: '8px', padding: '5px 10px', whiteSpace: 'nowrap',
                fontSize: '0.74rem', fontWeight: activo ? 600 : 400, cursor: 'pointer',
                background: activo ? '#fff' : 'transparent',
                boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                color: activo ? '#212529' : '#6c757d',
              });

              return (
                <div>
                  {/* Controles: filtro por día, orden y buscador */}
                  <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px', overflowX: 'auto' }}>
                      {['todos', ...diasPresentes].map((d) => (
                        <button key={d} type="button" onClick={() => setFiltroDiaEntradas(d)} style={seg(filtroDia === d)}>
                          {d === 'todos' ? 'Todos los días' : d}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={busquedaGrupo}
                        onChange={(e) => setBusquedaGrupo(e.target.value)}
                        placeholder="Buscar proveedor…"
                        style={{ flex: '1 1 160px', minWidth: 0, border: '1px solid #ced4da', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                        {[['compra', 'Mayor compra'], ['az', 'A–Z'], ['ultimo', 'Último']].map(([k, label]) => (
                          <button key={k} type="button" onClick={() => setOrdenGrupos(k)} style={seg(ordenGrupos === k)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6c757d' }}>
                      {grupos.length} {grupos.length === 1 ? 'proveedor' : 'proveedores'} · {totalEntradas} {totalEntradas === 1 ? 'entrada' : 'entradas'} · <strong style={{ color: '#3a5060' }}>{Math.round(totalKgSemana)} kg</strong>
                      {totalCostoSemana > 0 && <> · <strong style={{ color: '#1a5c2a' }}>{formatCurrency(totalCostoSemana)}</strong></>}
                    </div>
                  </div>

                  {grupos.length === 0 && (
                    <p className="text-muted text-center mb-0">No hay entradas para ese filtro.</p>
                  )}

                  {grupos.map((g) => {
                    const abierto = estaAbierto(g.clave);
                    const sinPrecios = g.costo === 0;
                    const visibles = g.productos.slice(0, 4);
                    const resto = g.productos.length - visibles.length;
                    return (
                      <div
                        key={g.clave}
                        style={{
                          background: '#fff', border: '1px solid #d3d9de', borderLeft: `3px solid ${sinPrecios ? '#FFD166' : '#6A8899'}`,
                          borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
                        }}
                      >
                        {/* Encabezado del grupo (siempre visible) */}
                        <div
                          onClick={() => setGruposAbiertos((prev) => ({ ...prev, [g.clave]: !abierto }))}
                          style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212529' }}>{g.nombre}</span>
                              <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#6c757d' }}>
                                {g.entradas.length} {g.entradas.length === 1 ? 'entrada' : 'entradas'} · {g.dias.join(', ')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#3a5060' }}>{Math.round(g.kg)} kg</span>
                              <span style={{ display: 'inline-flex', color: '#9ca3af', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                            {g.costo > 0 ? (
                              <span style={{ background: 'rgba(40,167,69,0.1)', color: '#1a5c2a', fontWeight: 700, fontSize: '0.74rem', padding: '2px 9px', borderRadius: '999px' }}>
                                {formatCurrency(g.costo)}
                                <span style={{ fontWeight: 400, marginLeft: '4px' }}>({formatCurrency(g.promedio)}/kg)</span>
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(255,209,102,0.2)', color: '#7a5000', fontWeight: 600, fontSize: '0.72rem', padding: '2px 9px', borderRadius: '999px' }}>
                                Sin precios
                              </span>
                            )}
                            {visibles.map(([corte, kg]) => (
                              <span key={corte} style={{ background: 'rgba(106,136,153,0.1)', color: '#3a5060', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>
                                {corte} · {Math.round(kg)} kg
                              </span>
                            ))}
                            {resto > 0 && (
                              <span style={{ fontSize: '0.7rem', color: '#6c757d' }}>+{resto} más</span>
                            )}
                          </div>
                        </div>

                        {/* Entradas del proveedor */}
                        <div style={{ maxHeight: abierto ? '4000px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)' }}>
                          <div style={{ padding: '4px 12px 4px', borderTop: '1px solid #dde2e6' }}>
                            <div className="row" style={{ paddingTop: '10px' }}>
                              {g.entradas.map(({ entrada, index }) => renderEntrada(entrada, index))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
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

      {showProveedoresModal && (() => {
        const q = normalizarNombre(busquedaModalProv);
        const resumenDe = (c) => {
          const entradas = (semanaActiva?.mercaderia || []).filter(
            (e) => e.proveedorId === c.id || normalizarNombre(e.proveedor) === c.nombreNormalizado
          );
          const kg = entradas.reduce((s, e) => s + (e.cortes || []).reduce((a, x) => a + (x.kg || 0), 0), 0);
          return { n: entradas.length, kg };
        };
        const lista = contactosProveedor.filter((c) => !q
          || normalizarNombre(c.nombre).includes(q)
          || (c.alias || []).some((a) => normalizarNombre(a).includes(q)));
        const existente = q ? buscarExacto(busquedaModalProv) : null;

        return (
          <>
            <div
              onClick={() => setShowProveedoresModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }}
            />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(520px, 95vw)', maxHeight: '88vh', background: '#fff', borderRadius: '16px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #dde2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    Gestión
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>Proveedores</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProveedoresModal(false)}
                  aria-label="Cerrar"
                  style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}
                >
                  <IconX size={14} />
                </button>
              </div>

              {/* Buscador (fijo) */}
              <div style={{ padding: '12px 22px', borderBottom: '1px solid #dde2e6' }}>
                <input
                  type="text"
                  autoFocus
                  value={busquedaModalProv}
                  onChange={(e) => setBusquedaModalProv(e.target.value)}
                  placeholder={`Buscar entre ${contactosProveedor.length} proveedores…`}
                  style={{ width: '100%', border: '1px solid #ced4da', borderRadius: '8px', padding: '8px 12px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              {/* Lista */}
              <div style={{ overflowY: 'auto', flex: 1, minHeight: '120px' }}>
                {lista.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                    {q ? `Sin resultados para "${busquedaModalProv.trim()}".` : 'No hay proveedores. Agregá uno abajo.'}
                  </div>
                ) : (
                  lista.map((c) => {
                    const r = resumenDe(c);
                    return (
                      <div
                        key={c.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 22px', borderBottom: '1px solid #eef1f3' }}
                      >
                        <button
                          type="button"
                          onClick={() => { seleccionarProveedor(c); setShowProveedoresModal(false); }}
                          style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                          title="Elegir para cargar mercadería"
                        >
                          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.nombre}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af' }}>
                            {r.n > 0
                              ? `${r.n} ${r.n === 1 ? 'entrada' : 'entradas'} esta semana · ${Math.round(r.kg)} kg`
                              : 'Sin ingresos esta semana'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarProveedor(c)}
                          title="Archivar (conserva su historial)"
                          style={{ border: '1px solid #dde2e6', background: 'transparent', color: '#6c757d', borderRadius: '8px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                        >
                          Archivar
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Alta inline */}
              <div style={{ padding: '12px 22px', borderTop: '1px solid #dde2e6' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Agregar proveedor
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={nuevoProveedorInput}
                    onChange={(e) => setNuevoProveedorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && agregarProveedor()}
                    placeholder="Nombre del proveedor"
                    style={{ flex: 1, minWidth: 0, border: '1px solid #ced4da', borderRadius: '8px', padding: '8px 12px', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={agregarProveedor}
                    disabled={!nuevoProveedorInput.trim()}
                    style={{
                      border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '0.85rem',
                      background: nuevoProveedorInput.trim() ? '#6A8899' : '#e9ecef',
                      color: nuevoProveedorInput.trim() ? '#fff' : '#9ca3af',
                      cursor: nuevoProveedorInput.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Agregar
                  </button>
                </div>
                {existente && existente.activo === false && (
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#7a5000' }}>
                    "{existente.nombre}" está archivado. Podés reactivarlo desde Inicio → Proveedores y Clientes.
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {controlPrecios && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', zIndex: 1080 }} />
          <div
            role="alertdialog"
            aria-modal="true"
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(400px, 94vw)', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: '16px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)', zIndex: 1081, borderTop: '4px solid #dc3545',
            }}
          >
            <div style={{ padding: '16px 20px 8px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc3545', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Revisá el precio
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529', marginTop: '2px' }}>
                {controlPrecios.items.length === 1 ? 'Este precio parece un error' : 'Estos precios parecen un error'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6c757d', marginTop: '4px' }}>
                Es mucho más alto que lo que sueles pagar. Corregilo antes de guardar.
              </div>
            </div>

            <div style={{ padding: '8px 20px 4px' }}>
              {controlPrecios.items.map((it) => {
                const nuevo = parseFloat(preciosCorregidos[it.key]);
                const valido = nuevo > 0;
                return (
                  <div key={it.key} style={{ border: '1px solid #f1c0c5', background: 'rgba(220,53,69,0.05)', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span>{it.corte}</span>
                      <span style={{ color: '#6c757d', fontWeight: 600 }}>{it.kg} kg</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#8b1c26', margin: '4px 0 8px' }}>
                      Escribiste <strong>{formatCurrency(it.precioKg)}</strong> por kg. Lo habitual ronda <strong>{formatCurrency(it.ref)}</strong>.
                    </div>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">$/Kg</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        autoFocus={it === controlPrecios.items[0]}
                        className="form-control"
                        value={preciosCorregidos[it.key] ?? ''}
                        onChange={(e) => setPreciosCorregidos((prev) => ({ ...prev, [it.key]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && valido && controlPrecios.items.length === 1) confirmarControlPrecios(false); }}
                        style={{ borderColor: '#dc3545' }}
                      />
                    </div>
                    {valido && (
                      <div style={{ fontSize: '0.72rem', color: '#6c757d', marginTop: '4px' }}>
                        Total del corte: <strong>{formatCurrency(nuevo * it.kg)}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                disabled={!controlPrecios.items.every((it) => parseFloat(preciosCorregidos[it.key]) > 0)}
                onClick={() => confirmarControlPrecios(false)}
                style={{
                  border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 700,
                  background: controlPrecios.items.every((it) => parseFloat(preciosCorregidos[it.key]) > 0) ? '#6A8899' : '#e9ecef',
                  color: controlPrecios.items.every((it) => parseFloat(preciosCorregidos[it.key]) > 0) ? '#fff' : '#9ca3af',
                  cursor: controlPrecios.items.every((it) => parseFloat(preciosCorregidos[it.key]) > 0) ? 'pointer' : 'not-allowed',
                }}
              >
                Corregir y continuar
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => confirmarControlPrecios(true)}
                  style={{ flex: 1, border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', borderRadius: '10px', padding: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  El precio es correcto
                </button>
                <button
                  type="button"
                  onClick={() => setControlPrecios(null)}
                  style={{ flex: 1, border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', borderRadius: '10px', padding: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </>
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









