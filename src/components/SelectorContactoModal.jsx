import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContactos } from '../hooks/useContactos';
import { normalizarNombre } from '../utils/nombres';
import { IconSearch, IconX, IconPlus } from './gestionSemanal/icons';

// Paleta NEWLOOK (ver README-NEWLOOK.md)
const C = {
  primary: '#6A8899',
  primarySoft: 'rgba(106,136,153,0.1)',
  text: '#212529',
  muted: '#6c757d',
  faint: '#9ca3af',
  border: '#dde2e6',
};

/**
 * Modal para elegir un proveedor o cliente del catálogo de contactos.
 * Es una ayuda OPCIONAL: quien llama conserva siempre el texto libre.
 *
 * Props:
 *  - isOpen, onClose
 *  - onSelect(contacto)   -> { id, nombre, alias, roles }
 *  - consulta             -> texto inicial del buscador (ej. lo ya escrito en el input)
 *  - rolPreferido         -> 'proveedor' | 'cliente' | null: se muestran primero
 */
const SelectorContactoModal = ({ isOpen, onClose, onSelect, consulta = '', rolPreferido = null }) => {
  const { activos, loading, buscarExacto, buscarParecidos, crearContacto } = useContactos();
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setBusqueda(consulta || '');
      setError('');
      setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    }
  }, [isOpen, consulta]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const q = normalizarNombre(busqueda);

  const lista = useMemo(() => {
    const filtrados = activos.filter((c) => !q
      || normalizarNombre(c.nombre).includes(q)
      || (c.alias || []).some((a) => normalizarNombre(a).includes(q))
      || String(c.contacto?.telefono || '').includes(busqueda.trim()));
    // Los que tienen el rol buscado primero; después alfabético (activos ya viene ordenado).
    return [...filtrados].sort((a, b) => {
      const pa = rolPreferido && a.roles?.[rolPreferido] ? 0 : 1;
      const pb = rolPreferido && b.roles?.[rolPreferido] ? 0 : 1;
      return pa - pb;
    });
  }, [activos, q, busqueda, rolPreferido]);

  const exacto = q ? buscarExacto(busqueda) : null;
  const puedeCrear = !!q && !exacto;
  const parecidos = puedeCrear ? buscarParecidos(busqueda) : [];

  if (!isOpen) return null;

  const elegir = (c) => {
    onSelect({ id: c.id, nombre: c.nombre, alias: c.alias || [], roles: c.roles || {} });
    onClose();
  };

  const crearYElegir = async () => {
    setCreando(true);
    setError('');
    try {
      const r = await crearContacto(busqueda, { proveedor: true, cliente: true });
      onSelect({ id: r.id, nombre: r.nombre, alias: [], roles: { proveedor: true, cliente: true } });
      onClose();
    } catch (e) {
      console.error('Error al crear contacto:', e);
      setError('No se pudo crear. Probá de nuevo.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1060 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(480px, 95vw)', maxHeight: '85vh', background: '#fff', borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1061, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Seleccionar
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text }}>Proveedor o cliente</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}
          >
            <IconX size={14} />
          </button>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.faint, display: 'flex' }}>
              <IconSearch size={15} />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (lista.length === 1) elegir(lista[0]);
                  else if (exacto && exacto.activo !== false) elegir(exacto);
                }
              }}
              placeholder="Buscar por nombre, otro nombre o teléfono…"
              style={{ width: '100%', border: '1px solid #ced4da', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: '120px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: '0.85rem' }}>Cargando…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: C.faint, fontSize: '0.85rem' }}>
              {q ? `Sin resultados para "${busqueda.trim()}".` : 'Todavía no hay contactos.'}
            </div>
          ) : (
            lista.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => elegir(c)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${C.border}`,
                  background: 'transparent', padding: '10px 22px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.primarySoft; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nombre}
                  </span>
                  {(c.alias || []).length > 0 && (
                    <span style={{ display: 'block', fontSize: '0.72rem', color: C.faint }}>También: {c.alias.join(', ')}</span>
                  )}
                </span>
                <span style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {c.roles?.proveedor && <span style={{ fontSize: '0.62rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: C.primarySoft, color: '#3a5060' }}>Proveedor</span>}
                  {c.roles?.cliente && <span style={{ fontSize: '0.62rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: C.primarySoft, color: '#3a5060' }}>Cliente</span>}
                </span>
              </button>
            ))
          )}
        </div>

        {(puedeCrear || error) && (
          <div style={{ padding: '12px 22px', borderTop: `1px solid ${C.border}` }}>
            {parecidos.length > 0 && (
              <div style={{ marginBottom: '8px', background: 'rgba(255,209,102,0.18)', color: '#7a5000', borderRadius: '8px', padding: '6px 10px', fontSize: '0.78rem' }}>
                Se parece a: {parecidos.map((p) => p.nombre).join(', ')}. Revisá que no sea la misma persona.
              </div>
            )}
            {error && <div style={{ marginBottom: '8px', color: '#8b1c26', fontSize: '0.8rem' }}>{error}</div>}
            {puedeCrear && (
              <button
                type="button"
                onClick={crearYElegir}
                disabled={creando}
                style={{
                  width: '100%', border: `1px dashed ${C.border}`, background: 'transparent', borderRadius: '8px',
                  padding: '9px', color: C.primary, fontWeight: 700, fontSize: '0.85rem',
                  cursor: creando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <IconPlus size={13} /> {creando ? 'Creando…' : `Crear «${busqueda.trim()}»`}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SelectorContactoModal;

