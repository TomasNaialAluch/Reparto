import { useState, useRef, useEffect } from 'react';
import { IconX, IconMinimize } from '../../gestionSemanal/icons';

const MARGEN_VISIBLE = 60; // px que siempre quedan visibles, para no perder la ventana fuera de pantalla

const clamp = (valor, min, max) => Math.min(Math.max(valor, min), max);

export default function FacturaWindow({ titulo, subtitulo, zIndex, offset = 0, onFocus, onMinimize, onClose, children }) {
  const [pos, setPos] = useState(null); // null = posición inicial centrada + offset en cascada
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const startDrag = (e) => {
    if (e.target.closest('button')) return; // no arrastrar al clickear minimizar/cerrar
    onFocus?.();
    const rect = windowRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setPos({ x: rect.left, y: rect.top });
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const rect = windowRef.current.getBoundingClientRect();
      const x = clamp(e.clientX - dragOffsetRef.current.x, MARGEN_VISIBLE - rect.width, window.innerWidth - MARGEN_VISIBLE);
      const y = clamp(e.clientY - dragOffsetRef.current.y, 0, window.innerHeight - MARGEN_VISIBLE);
      setPos({ x, y });
    };
    const onUp = () => setDragging(false);

    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const posStyle = pos
    ? { top: `${pos.y}px`, left: `${pos.x}px`, transform: 'none' }
    : { top: `calc(50% + ${offset}px)`, left: `calc(50% + ${offset}px)`, transform: 'translate(-50%, -50%)' };

  return (
    <div
      ref={windowRef}
      onMouseDown={onFocus}
      style={{
        position: 'fixed',
        ...posStyle,
        width: 'min(640px, 94vw)', maxHeight: '86vh',
        background: 'white', borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.28)',
        border: '1px solid #d3d9de',
        zIndex,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Barra de título — arrastrable */}
      <div
        onMouseDown={startDrag}
        style={{
          padding: '10px 14px', background: '#f3f4f6', borderBottom: '1px solid #e1e5e9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {subtitulo}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {titulo}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={onMinimize} title="Minimizar"
            className="d-inline-flex align-items-center justify-content-center"
            style={{ width: '26px', height: '26px', border: 'none', borderRadius: '6px', background: 'rgba(0,0,0,0.06)', color: '#6c757d', cursor: 'pointer' }}>
            <IconMinimize size={11} />
          </button>
          <button onClick={onClose} title="Cerrar"
            className="d-inline-flex align-items-center justify-content-center"
            style={{ width: '26px', height: '26px', border: 'none', borderRadius: '6px', background: 'rgba(220,53,69,0.1)', color: '#dc3545', cursor: 'pointer' }}>
            <IconX size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
