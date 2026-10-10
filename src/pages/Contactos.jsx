import React, { useMemo, useState } from 'react';
import { useContactos } from '../hooks/useContactos';
import { normalizarNombre } from '../utils/nombres';
import { IconPlus, IconSearch, IconX, IconEdit, IconInbox } from '../components/gestionSemanal/icons';

// Paleta NEWLOOK (ver README-NEWLOOK.md)
const C = {
  primary: '#6A8899',
  primaryDark: '#506878',
  primarySoft: 'rgba(106,136,153,0.1)',
  text: '#212529',
  muted: '#6c757d',
  faint: '#9ca3af',
  border: '#d3d9de',
  borderSoft: '#dde2e6',
  danger: '#dc3545',
  green: '#28a745',
};

const FILTROS = [
  ['todos', 'Todos'],
  ['proveedores', 'Proveedores'],
  ['clientes', 'Clientes'],
  ['archivados', 'Archivados'],
];

const FORM_VACIO = { nombre: '', proveedor: true, cliente: true, telefono: '', alias: '', notas: '' };

const inputStyle = {
  width: '100%', border: '1px solid #ced4da', borderRadius: '8px',
  padding: '8px 12px', fontSize: '0.9rem', outline: 'none', background: '#fff',
};

const Label = ({ children }) => (
  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
    {children}
  </div>
);

const RolPill = ({ children, activo }) => (
  <span style={{
    fontSize: '0.65rem', fontWeight: 600, padding: '2px 9px', borderRadius: '999px',
    background: activo ? C.primarySoft : 'rgba(108,117,125,0.1)',
    color: activo ? '#3a5060' : C.muted,
  }}>
    {children}
  </span>
);

const Contactos = () => {
  const {
    contactos, loading, error,
    buscarExacto, buscarParecidos,
    crearContacto, actualizarContacto, archivarContacto, reactivarContacto,
  } = useContactos();

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(null); // null | { id: string|null }
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  const conteos = useMemo(() => ({
    todos: contactos.filter((c) => c.activo !== false).length,
    proveedores: contactos.filter((c) => c.activo !== false && c.roles?.proveedor).length,
    clientes: contactos.filter((c) => c.activo !== false && c.roles?.cliente).length,
    archivados: contactos.filter((c) => c.activo === false).length,
  }), [contactos]);

  const visibles = useMemo(() => {
    const q = normalizarNombre(busqueda);
    return contactos
      .filter((c) => {
        const archivado = c.activo === false;
        if (filtro === 'archivados') return archivado;
        if (archivado) return false;
        if (filtro === 'proveedores') return !!c.roles?.proveedor;
        if (filtro === 'clientes') return !!c.roles?.cliente;
        return true;
      })
      .filter((c) => !q
        || normalizarNombre(c.nombre).includes(q)
        || (c.alias || []).some((a) => normalizarNombre(a).includes(q))
        || String(c.contacto?.telefono || '').includes(busqueda.trim()))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  }, [contactos, busqueda, filtro]);

  const parecidos = useMemo(() => {
    if (!modal || modal.id || !form.nombre.trim()) return [];
    return buscarParecidos(form.nombre);
  }, [modal, form.nombre, buscarParecidos]);

  const abrirNuevo = () => {
    setForm({ ...FORM_VACIO, nombre: busqueda.trim() });
    setErrorForm('');
    setModal({ id: null });
  };

  const abrirEditar = (c) => {
    setForm({
      nombre: c.nombre || '',
      proveedor: !!c.roles?.proveedor,
      cliente: !!c.roles?.cliente,
      telefono: c.contacto?.telefono || '',
      alias: (c.alias || []).join(', '),
      notas: c.notas || '',
    });
    setErrorForm('');
    setModal({ id: c.id });
  };

  const cerrar = () => { setModal(null); setErrorForm(''); };

  const mostrarAviso = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3500);
  };

  const guardar = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) { setErrorForm('El nombre es obligatorio.'); return; }
    if (!form.proveedor && !form.cliente) { setErrorForm('Elegí al menos un rol: proveedor o cliente.'); return; }

    const alias = form.alias.split(',').map((a) => a.trim()).filter(Boolean);
    setGuardando(true);
    try {
      if (modal.id) {
        const res = await actualizarContacto(modal.id, {
          nombre,
          roles: { proveedor: form.proveedor, cliente: form.cliente },
          telefono: form.telefono,
          notas: form.notas,
          alias,
        });
        if (!res.ok) { setErrorForm(res.motivo); return; }
        mostrarAviso(`"${nombre}" actualizado`);
      } else {
        const existente = buscarExacto(nombre);
        if (existente) {
          setErrorForm(existente.activo === false
            ? `"${existente.nombre}" ya existe pero está archivado. Buscalo en Archivados y reactivalo.`
            : `Ya existe "${existente.nombre}".`);
          return;
        }
        const creado = await crearContacto(nombre, { proveedor: form.proveedor, cliente: form.cliente });
        // Datos extra que crearContacto no recibe: se completan a continuación.
        await actualizarContacto(creado.id, { telefono: form.telefono, notas: form.notas, alias });
        mostrarAviso(`"${nombre}" creado`);
      }
      cerrar();
    } catch (e) {
      console.error('Error al guardar contacto:', e);
      setErrorForm('No se pudo guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const archivar = async (c) => {
    try { await archivarContacto(c.id); mostrarAviso(`"${c.nombre}" archivado`); }
    catch (e) { mostrarAviso('No se pudo archivar'); }
  };

  const reactivar = async (c) => {
    try { await reactivarContacto(c.id); mostrarAviso(`"${c.nombre}" reactivado`); }
    catch (e) { mostrarAviso('No se pudo reactivar'); }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '16px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inicio</div>
          <h4 style={{ margin: '2px 0 0', fontWeight: 700, color: C.text }}>Proveedores y Clientes</h4>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          style={{
            border: 'none', borderRadius: '8px', padding: '9px 16px', background: C.primary, color: '#fff',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <IconPlus size={13} /> Nuevo
        </button>
      </div>

      {/* Buscador + filtros */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}`, padding: '12px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.faint, display: 'flex' }}>
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, alias o teléfono…"
            style={{ ...inputStyle, paddingLeft: '36px' }}
          />
        </div>
        <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px', overflowX: 'auto' }}>
          {FILTROS.map(([clave, etiqueta]) => {
            const activo = filtro === clave;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setFiltro(clave)}
                style={{
                  flex: 1, border: 'none', borderRadius: '8px', padding: '6px 8px', whiteSpace: 'nowrap',
                  fontSize: '0.78rem', fontWeight: activo ? 600 : 400,
                  background: activo ? '#fff' : 'transparent',
                  boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  color: activo ? C.text : C.muted, cursor: 'pointer',
                }}
              >
                {etiqueta} <span style={{ color: C.faint, fontWeight: 400 }}>{conteos[clave]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {aviso && (
        <div style={{ background: 'rgba(40,167,69,0.1)', color: '#1a5c2a', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', marginBottom: '10px' }}>
          {aviso}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>Cargando…</div>
      ) : error ? (
        <div style={{ color: C.danger, padding: '16px' }}>No se pudieron cargar los contactos: {error}</div>
      ) : visibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: C.faint, background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><IconInbox size={28} /></div>
          <div style={{ fontSize: '0.88rem' }}>
            {busqueda.trim() ? `Sin resultados para "${busqueda.trim()}".` : 'No hay contactos en esta vista.'}
          </div>
          {busqueda.trim() && filtro !== 'archivados' && (
            <button
              type="button"
              onClick={abrirNuevo}
              style={{ marginTop: '12px', border: `1px dashed ${C.borderSoft}`, background: 'transparent', borderRadius: '8px', padding: '6px 14px', color: C.primary, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              + Crear "{busqueda.trim()}"
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibles.map((c) => {
            const archivado = c.activo === false;
            return (
              <div
                key={c.id}
                style={{
                  background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${archivado ? C.faint : C.primary}`,
                  padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px',
                  opacity: archivado ? 0.75 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nombre}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
                    <RolPill activo={!!c.roles?.proveedor}>Proveedor</RolPill>
                    <RolPill activo={!!c.roles?.cliente}>Cliente</RolPill>
                    {c.contacto?.telefono && <span style={{ fontSize: '0.72rem', color: C.muted }}>{c.contacto.telefono}</span>}
                    {(c.alias || []).length > 0 && (
                      <span style={{ fontSize: '0.72rem', color: C.faint }}>También: {c.alias.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => abrirEditar(c)}
                    title="Editar"
                    style={{ border: `1px solid ${C.borderSoft}`, background: 'transparent', borderRadius: '8px', padding: '6px 10px', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600 }}
                  >
                    <IconEdit size={13} /> Editar
                  </button>
                  {archivado ? (
                    <button
                      type="button"
                      onClick={() => reactivar(c)}
                      style={{ border: `1px solid ${C.green}`, background: 'transparent', borderRadius: '8px', padding: '6px 10px', color: C.green, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}
                    >
                      Reactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => archivar(c)}
                      title="Sale de los selectores; conserva el historial"
                      style={{ border: `1px solid ${C.borderSoft}`, background: 'transparent', borderRadius: '8px', padding: '6px 10px', color: C.muted, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}
                    >
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <>
          <div onClick={cerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(520px, 95vw)', maxHeight: '90vh', background: '#fff', borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                  {modal.id ? 'Editar' : 'Nuevo'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text }}>
                  {modal.id ? (form.nombre || 'Contacto') : 'Proveedor o cliente'}
                </div>
              </div>
              <button
                type="button"
                onClick={cerrar}
                style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}
              >
                <IconX size={14} />
              </button>
            </div>

            <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <Label>Nombre</Label>
                <input
                  type="text" autoFocus style={inputStyle} value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && guardar()}
                  placeholder="Ej: Tito"
                />
                {parecidos.length > 0 && (
                  <div style={{ marginTop: '6px', background: 'rgba(255,209,102,0.18)', color: '#7a5000', borderRadius: '8px', padding: '6px 10px', fontSize: '0.78rem' }}>
                    Se parece a: {parecidos.map((p) => p.nombre).join(', ')}. Revisá que no sea la misma persona.
                  </div>
                )}
                {modal.id && (
                  <div style={{ marginTop: '6px', fontSize: '0.72rem', color: C.faint }}>
                    Las entradas ya cargadas conservan el nombre con el que se guardaron.
                  </div>
                )}
              </div>

              <div>
                <Label>Es</Label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[['proveedor', 'Proveedor'], ['cliente', 'Cliente']].map(([clave, etiqueta]) => {
                    const on = form[clave];
                    return (
                      <button
                        key={clave}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, [clave]: !f[clave] }))}
                        style={{
                          flex: 1, borderRadius: '8px', padding: '9px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                          border: `1px solid ${on ? C.primary : C.borderSoft}`,
                          background: on ? C.primarySoft : 'transparent',
                          color: on ? '#3a5060' : C.muted,
                        }}
                      >
                        {etiqueta}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: '5px', fontSize: '0.72rem', color: C.faint }}>
                  Puede ser las dos cosas: es una sola persona o empresa.
                </div>
              </div>

              <div>
                <Label>Teléfono (opcional)</Label>
                <input
                  type="text" style={inputStyle} value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                />
              </div>

              <div>
                <Label>Otros nombres (opcional)</Label>
                <input
                  type="text" style={inputStyle} value={form.alias}
                  onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
                  placeholder="Separados por coma. Ej: Tito Carnes, Tito C."
                />
              </div>

              <div>
                <Label>Notas (opcional)</Label>
                <textarea
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.notas}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                />
              </div>

              {errorForm && (
                <div style={{ background: 'rgba(220,53,69,0.08)', color: '#8b1c26', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem' }}>
                  {errorForm}
                </div>
              )}
            </div>

            <div style={{ padding: '14px 22px', borderTop: `1px solid ${C.borderSoft}`, display: 'flex', gap: '10px' }}>
              <button
                type="button" onClick={cerrar}
                style={{ flex: 1, border: '1px solid #dee2e6', background: 'transparent', color: C.muted, borderRadius: '10px', padding: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button" onClick={guardar} disabled={guardando || !form.nombre.trim()}
                style={{
                  flex: 2, border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 700,
                  background: guardando || !form.nombre.trim() ? '#e9ecef' : C.primary,
                  color: guardando || !form.nombre.trim() ? C.faint : '#fff',
                  cursor: guardando || !form.nombre.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {guardando ? 'Guardando…' : (modal.id ? 'Guardar cambios' : 'Crear')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Contactos;
