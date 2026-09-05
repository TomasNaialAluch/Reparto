import React, { useState, useEffect } from 'react';
import { useTablasPrecios } from '../firebase/hooks';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Referencia estable — si fuera un objeto literal inline en el componente, useSensor
// lo trataría como "cambiado" en cada render (nueva identidad) y podría des-sincronizar
// los listeners internos de dnd-kit.
const POINTER_ACTIVATION_CONSTRAINT = { distance: 6 };

// ===== Iconos SVG inline (NEWLOOK — nunca emojis/Font Awesome en controles) =====
const IconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconPlus = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconPencil = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconTable = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="9" y1="4" x2="9" y2="20" />
  </svg>
);

const IconCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Drag handle: seis puntos tipo "grip", patrón estándar de spreadsheets/Notion/Linear.
const IconGrip = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
  </svg>
);

const IconExpand = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const IconCollapse = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" /><line x1="10" y1="14" x2="3" y2="21" />
  </svg>
);

// ===== Tokens de la paleta NEWLOOK (ver README-NEWLOOK.md) =====
const C = {
  primary: '#6A8899',
  primaryDark: '#506878',
  primarySoft: 'rgba(106,136,153,0.1)',
  textMuted: '#9ca3af',
  textMuted2: '#6c757d',
  border: '#d3d9de',
  borderSoft: '#dde2e6',
  danger: '#dc3545',
};

const HANDLE_COL_WIDTH = 26;
const ACTION_COL_WIDTH = 32;
const COLUMN_MIN_WIDTH = 140;

// Botón × sin borde/fondo para eliminar inline (RemoveBtn)
const RemoveBtn = ({ onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{ border: 'none', background: 'transparent', color: C.danger, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', lineHeight: 1 }}
  >
    <IconTrash size={13} />
  </button>
);

// Overlay flotante de eliminar — no ocupa espacio en el flujo, así nunca pisa el texto.
const OverlayDeleteBtn = ({ onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      position: 'absolute', top: '3px', right: '3px', zIndex: 3,
      border: 'none', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      borderRadius: '6px', width: '20px', height: '20px', padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.danger, cursor: 'pointer',
    }}
  >
    <IconTrash size={11} />
  </button>
);

// Botón "agregar" con borde dashed (AddBtn)
const AddBtn = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: `1px dashed ${C.borderSoft}`,
      borderRadius: '8px',
      padding: '6px 12px',
      background: 'transparent',
      color: C.textMuted2,
      fontSize: '0.78rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.color = C.textMuted2; }}
  >
    <IconPlus size={11} />{children}
  </button>
);

// Label uppercase de sección (patrón FormSection/eyebrow)
const Eyebrow = ({ children }) => (
  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
    {children}
  </span>
);

const cardStyle = {
  border: 'none',
  borderRadius: '12px',
  background: '#ffffff',
  boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
  overflow: 'hidden',
};

const inputBase = {
  border: '1px solid #ced4da',
  borderRadius: '8px',
  padding: '6px 10px',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
};

const onFocusPrimary = (e) => {
  e.target.style.borderColor = C.primary;
  e.target.style.boxShadow = `0 0 0 0.2rem ${C.primarySoft}`;
};
const onBlurPrimary = (e) => {
  e.target.style.borderColor = '#ced4da';
  e.target.style.boxShadow = 'none';
};

// ===== Header de columna: drag handle + nombre truncado + borrar en overlay on-hover =====
const ColumnHeaderCell = ({
  id, index, nombre, isOnlyColumn, isFirst,
  editando, nombreTemp, onStartEdit, onChangeTemp, onSaveEdit,
  onEliminar,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [hover, setHover] = useState(false);

  return (
    <th
      ref={setNodeRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: isFirst ? 'sticky' : 'relative',
        left: isFirst ? HANDLE_COL_WIDTH : undefined,
        zIndex: isFirst ? 2 : 1,
        background: '#fff',
        minWidth: `${COLUMN_MIN_WIDTH}px`,
        padding: '8px 26px 8px 6px',
        borderBottom: `1px solid ${C.border}`,
        fontSize: '0.66rem', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          style={{
            cursor: 'grab', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, width: '20px', height: '20px', marginLeft: '-4px',
            color: hover ? C.textMuted2 : 'transparent', transition: 'color 0.1s',
          }}
        >
          <IconGrip />
        </span>

        {editando ? (
          <input
            type="text"
            style={{ ...inputBase, padding: '3px 6px', fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, color: '#333' }}
            value={nombreTemp}
            autoFocus
            onFocus={onFocusPrimary}
            onChange={(e) => onChangeTemp(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
          />
        ) : (
          <span
            onClick={onStartEdit}
            title={nombre}
            style={{ cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}
          >
            {nombre}
          </span>
        )}
      </div>

      {!isOnlyColumn && hover && !editando && (
        <OverlayDeleteBtn title="Eliminar columna" onClick={onEliminar} />
      )}
    </th>
  );
};

// ===== Fila: drag handle a la izquierda + celdas + borrar fila on-hover =====
const SortableRow = ({ id, index, valores, onCelda, onEliminarFila, isOnlyRow }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [hover, setHover] = useState(false);

  return (
    <tr
      ref={setNodeRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <td style={{
        width: `${HANDLE_COL_WIDTH}px`, padding: 0, borderBottom: '1px solid #f1f3f5',
        position: 'sticky', left: 0, background: '#fff', zIndex: 1,
      }}>
        <span
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          style={{
            cursor: 'grab', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: '32px',
            color: hover ? C.textMuted2 : 'transparent', transition: 'color 0.1s',
          }}
        >
          <IconGrip />
        </span>
      </td>

      {valores.map((valor, colIdx) => (
        <td
          key={colIdx}
          style={{
            padding: 0, borderBottom: '1px solid #f1f3f5', minWidth: `${COLUMN_MIN_WIDTH}px`,
            position: colIdx === 0 ? 'sticky' : undefined,
            left: colIdx === 0 ? `${HANDLE_COL_WIDTH}px` : undefined,
            background: colIdx === 0 ? '#fff' : undefined,
            zIndex: colIdx === 0 ? 1 : undefined,
          }}
        >
          <input
            type="text"
            defaultValue={valor}
            onFocus={(e) => { e.target.style.background = C.primarySoft; }}
            onBlur={(e) => { e.target.style.background = 'transparent'; onCelda(index, colIdx, e.target.value); }}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              width: '100%', padding: '8px 10px', fontSize: '0.85rem', color: '#333',
            }}
          />
        </td>
      ))}

      <td style={{ width: `${ACTION_COL_WIDTH}px`, textAlign: 'center', borderBottom: '1px solid #f1f3f5' }}>
        {!isOnlyRow && hover && (
          <RemoveBtn title="Eliminar fila" onClick={() => onEliminarFila(index)} />
        )}
      </td>
    </tr>
  );
};

// ===== Grilla completa (thead + tbody + DnD) — reutilizada inline y en el modal fullscreen =====
const TablaGrid = ({
  tabla, columnIds, rowIds, sensors, onDragEnd,
  editandoColumna, nombreColumnaTemp, setNombreColumnaTemp,
  onStartEditColumna, onSaveEditColumna,
  onEliminarColumna, onEliminarFila, onCelda,
  maxBodyHeight,
}) => (
  <div style={{ overflow: 'auto', maxHeight: maxBodyHeight }}>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <thead>
            <tr>
              <th style={{
                width: `${HANDLE_COL_WIDTH}px`, position: 'sticky', left: 0, top: 0, background: '#fff',
                zIndex: 3, borderBottom: `1px solid ${C.border}`,
              }} />
              {tabla.columnas.map((col, colIdx) => (
                <ColumnHeaderCell
                  key={columnIds[colIdx]}
                  id={columnIds[colIdx]}
                  index={colIdx}
                  isFirst={colIdx === 0}
                  nombre={col}
                  isOnlyColumn={tabla.columnas.length <= 1}
                  editando={editandoColumna === colIdx}
                  nombreTemp={nombreColumnaTemp}
                  onStartEdit={() => onStartEditColumna(colIdx)}
                  onChangeTemp={setNombreColumnaTemp}
                  onSaveEdit={onSaveEditColumna}
                  onEliminar={() => onEliminarColumna(colIdx)}
                />
              ))}
              <th style={{ width: `${ACTION_COL_WIDTH}px`, position: 'sticky', top: 0, background: '#fff', borderBottom: `1px solid ${C.border}` }} />
            </tr>
          </thead>
        </SortableContext>

        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <tbody>
            {tabla.filas.map((fila, filaIdx) => (
              <SortableRow
                key={rowIds[filaIdx]}
                id={rowIds[filaIdx]}
                index={filaIdx}
                valores={fila.valores}
                onCelda={onCelda}
                onEliminarFila={onEliminarFila}
                isOnlyRow={tabla.filas.length <= 1}
              />
            ))}
          </tbody>
        </SortableContext>
      </table>
    </DndContext>
  </div>
);

const TablasPrecios = () => {
  const {
    tablas,
    loading,
    crearTabla,
    renombrarTabla,
    agregarColumna,
    renombrarColumna,
    eliminarColumna,
    agregarFila,
    eliminarFila,
    actualizarCelda,
    reordenarColumnas,
    reordenarFilas,
    eliminarTabla,
  } = useTablasPrecios();

  const [tablaSeleccionadaId, setTablaSeleccionadaId] = useState(null);
  const [editandoNombreTabla, setEditandoNombreTabla] = useState(false);
  const [nombreTablaTemp, setNombreTablaTemp] = useState('');
  const [editandoColumna, setEditandoColumna] = useState(null); // índice de columna en edición
  const [nombreColumnaTemp, setNombreColumnaTemp] = useState('');
  const [creandoTabla, setCreandoTabla] = useState(false);
  const [nombreNuevaTabla, setNombreNuevaTabla] = useState('');
  const [expandido, setExpandido] = useState(false);

  // Cerrar el modal de pantalla completa con Escape.
  useEffect(() => {
    if (!expandido) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setExpandido(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expandido]);

  // Distancia mínima antes de activar el drag: evita que un click normal en la celda
  // (para escribir) se confunda con un intento de arrastre.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: POINTER_ACTIVATION_CONSTRAINT }),
    // Permite reordenar con teclado: foco en el grip (Tab), Espacio para levantar,
    // flechas para mover, Espacio para soltar. Mismo drag handle que el mouse.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tablaSeleccionada = tablas.find(t => t.id === tablaSeleccionadaId) || null;

  const handleConfirmarCrearTabla = async () => {
    const nombre = nombreNuevaTabla.trim();
    if (!nombre) return;
    const id = await crearTabla(nombre);
    setTablaSeleccionadaId(id);
    setNombreNuevaTabla('');
    setCreandoTabla(false);
  };

  const handleEliminarTabla = async (tabla) => {
    if (!window.confirm(`¿Eliminar la tabla "${tabla.nombre}"? Esta acción no se puede deshacer.`)) return;
    await eliminarTabla(tabla.id);
    if (tablaSeleccionadaId === tabla.id) setTablaSeleccionadaId(null);
  };

  const iniciarEdicionNombreTabla = () => {
    setNombreTablaTemp(tablaSeleccionada.nombre);
    setEditandoNombreTabla(true);
  };

  const guardarNombreTabla = async () => {
    const nombre = nombreTablaTemp.trim();
    if (nombre && nombre !== tablaSeleccionada.nombre) {
      await renombrarTabla(tablaSeleccionada.id, nombre);
    }
    setEditandoNombreTabla(false);
  };

  const iniciarEdicionColumna = (colIdx) => {
    setEditandoColumna(colIdx);
    setNombreColumnaTemp(tablaSeleccionada.columnas[colIdx]);
  };

  const guardarNombreColumna = async () => {
    const nombre = nombreColumnaTemp.trim() || tablaSeleccionada.columnas[editandoColumna];
    await renombrarColumna(tablaSeleccionada, editandoColumna, nombre);
    setEditandoColumna(null);
  };

  const handleCelda = (filaIdx, colIdx, valor) => {
    actualizarCelda(tablaSeleccionada, filaIdx, colIdx, valor);
  };

  // Un único DndContext maneja ambos ejes (columnas y filas) — el id decide qué reordenar.
  // Importante: DndContext no puede quedar como hijo directo de <table>/<thead>/<tbody>,
  // porque internamente renderiza un <div> de accesibilidad oculto que rompería el HTML
  // de la tabla (un <div> no es un hijo válido de esos elementos).
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId.startsWith('col-') && overId.startsWith('col-')) {
      const desde = parseInt(activeId.replace('col-', ''), 10);
      const hasta = parseInt(overId.replace('col-', ''), 10);
      reordenarColumnas(tablaSeleccionada, desde, hasta);
    } else if (activeId.startsWith('row-') && overId.startsWith('row-')) {
      const desde = parseInt(activeId.replace('row-', ''), 10);
      const hasta = parseInt(overId.replace('row-', ''), 10);
      reordenarFilas(tablaSeleccionada, desde, hasta);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div className="spinner-border" style={{ color: C.primary }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const columnIds = tablaSeleccionada ? tablaSeleccionada.columnas.map((_, i) => `col-${i}`) : [];
  const rowIds = tablaSeleccionada ? tablaSeleccionada.filas.map((_, i) => `row-${i}`) : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      {/* Header de página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <Eyebrow>Gestión</Eyebrow>
          <h4 style={{ margin: '2px 0 0', fontWeight: 700, color: '#212529' }}>Lista de Precios</h4>
        </div>

        {creandoTabla ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              style={{ ...inputBase, width: '220px' }}
              placeholder="Nombre de la tabla"
              value={nombreNuevaTabla}
              autoFocus
              onFocus={onFocusPrimary}
              onBlur={onBlurPrimary}
              onChange={(e) => setNombreNuevaTabla(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmarCrearTabla();
                if (e.key === 'Escape') { setCreandoTabla(false); setNombreNuevaTabla(''); }
              }}
            />
            <button
              type="button"
              onClick={handleConfirmarCrearTabla}
              disabled={!nombreNuevaTabla.trim()}
              style={{
                border: 'none', borderRadius: '8px', width: '36px',
                background: nombreNuevaTabla.trim() ? C.primary : '#e9ecef',
                color: nombreNuevaTabla.trim() ? '#fff' : '#9ca3af',
                cursor: nombreNuevaTabla.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconCheck />
            </button>
            <button
              type="button"
              onClick={() => { setCreandoTabla(false); setNombreNuevaTabla(''); }}
              style={{ border: '1px solid #dee2e6', borderRadius: '8px', width: '36px', background: 'transparent', color: C.textMuted2, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreandoTabla(true)}
            style={{
              border: 'none', borderRadius: '8px', padding: '9px 16px',
              background: C.primary, color: '#fff', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = C.primaryDark; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = C.primary; }}
          >
            <IconPlus size={13} /> Nueva Tabla
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Lista de tablas */}
        <div style={{ flex: '0 0 260px', minWidth: '220px', ...cardStyle }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.borderSoft}` }}>
            <Eyebrow>Tablas ({tablas.length})</Eyebrow>
          </div>
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {tablas.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.textMuted, padding: '28px 12px', fontSize: '0.82rem' }}>
                No hay tablas creadas todavía.
              </div>
            ) : (
              tablas.map(tabla => {
                const activa = tabla.id === tablaSeleccionadaId;
                return (
                  <div
                    key={tabla.id}
                    onClick={() => setTablaSeleccionadaId(tabla.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${activa ? C.primary : 'transparent'}`,
                      background: activa ? C.primarySoft : 'transparent',
                      borderBottom: `1px solid ${C.borderSoft}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontWeight: activa ? 600 : 400, color: activa ? '#3a5060' : '#333',
                      fontSize: '0.85rem',
                    }}>
                      {tabla.nombre}
                    </span>
                    <RemoveBtn title="Eliminar tabla" onClick={(e) => { e.stopPropagation(); handleEliminarTabla(tabla); }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Grilla de la tabla seleccionada */}
        <div style={{ flex: '1 1 500px', minWidth: '280px', ...cardStyle }}>
          {!tablaSeleccionada ? (
            <div style={{ textAlign: 'center', color: C.textMuted, padding: '60px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><IconTable /></div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Seleccioná una tabla de la izquierda o creá una nueva.</p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                padding: '14px 16px', borderBottom: `1px solid ${C.borderSoft}`,
              }}>
                {editandoNombreTabla ? (
                  <input
                    type="text"
                    style={{ ...inputBase, maxWidth: '280px', fontWeight: 700 }}
                    value={nombreTablaTemp}
                    autoFocus
                    onFocus={onFocusPrimary}
                    onChange={(e) => setNombreTablaTemp(e.target.value)}
                    onBlur={guardarNombreTabla}
                    onKeyDown={(e) => e.key === 'Enter' && guardarNombreTabla()}
                  />
                ) : (
                  <div
                    onClick={iniciarEdicionNombreTabla}
                    title="Click para renombrar"
                    style={{ cursor: 'text', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>{tablaSeleccionada.nombre}</span>
                    <span style={{ color: C.textMuted }}><IconPencil /></span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <AddBtn onClick={() => agregarColumna(tablaSeleccionada)}>Columna</AddBtn>
                  <AddBtn onClick={() => agregarFila(tablaSeleccionada)}>Fila</AddBtn>
                  <button
                    type="button"
                    onClick={() => setExpandido(true)}
                    title="Ver en pantalla completa"
                    style={{
                      border: `1px solid ${C.borderSoft}`, borderRadius: '8px', width: '32px', height: '32px',
                      background: 'transparent', color: C.textMuted2, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.color = C.textMuted2; }}
                  >
                    <IconExpand />
                  </button>
                </div>
              </div>

              <TablaGrid
                tabla={tablaSeleccionada}
                columnIds={columnIds}
                rowIds={rowIds}
                sensors={sensors}
                onDragEnd={handleDragEnd}
                editandoColumna={editandoColumna}
                nombreColumnaTemp={nombreColumnaTemp}
                setNombreColumnaTemp={setNombreColumnaTemp}
                onStartEditColumna={iniciarEdicionColumna}
                onSaveEditColumna={guardarNombreColumna}
                onEliminarColumna={(idx) => eliminarColumna(tablaSeleccionada, idx)}
                onEliminarFila={(idx) => eliminarFila(tablaSeleccionada, idx)}
                onCelda={handleCelda}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal de pantalla completa — mismo patrón de overlay+blur que el resto de la app */}
      {expandido && tablaSeleccionada && (
        <>
          <div
            onClick={() => setExpandido(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }}
          />
          <div style={{
            position: 'fixed', top: '2vh', left: '2vw', width: '96vw', height: '96vh',
            background: '#fff', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
              padding: '16px 20px', borderBottom: `1px solid ${C.borderSoft}`,
            }}>
              <div>
                <Eyebrow>Lista de Precios</Eyebrow>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#212529', marginTop: '2px' }}>
                  {tablaSeleccionada.nombre}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AddBtn onClick={() => agregarColumna(tablaSeleccionada)}>Columna</AddBtn>
                <AddBtn onClick={() => agregarFila(tablaSeleccionada)}>Fila</AddBtn>
                <button
                  type="button"
                  onClick={() => setExpandido(false)}
                  title="Cerrar pantalla completa"
                  style={{
                    border: 'none', background: '#f3f4f6', borderRadius: '50%',
                    width: '32px', height: '32px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.textMuted2, marginLeft: '6px',
                  }}
                >
                  <IconCollapse />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <TablaGrid
                tabla={tablaSeleccionada}
                columnIds={columnIds}
                rowIds={rowIds}
                sensors={sensors}
                onDragEnd={handleDragEnd}
                editandoColumna={editandoColumna}
                nombreColumnaTemp={nombreColumnaTemp}
                setNombreColumnaTemp={setNombreColumnaTemp}
                onStartEditColumna={iniciarEdicionColumna}
                onSaveEditColumna={guardarNombreColumna}
                onEliminarColumna={(idx) => eliminarColumna(tablaSeleccionada, idx)}
                onEliminarFila={(idx) => eliminarFila(tablaSeleccionada, idx)}
                onCelda={handleCelda}
                maxBodyHeight="100%"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TablasPrecios;
