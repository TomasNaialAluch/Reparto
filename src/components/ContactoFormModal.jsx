// Modal para crear o editar un contacto (proveedor y/o cliente). Lo usan Proveedores y Clientes y Pedidos.
// Se monta solo mientras está abierto, así el formulario siempre arranca con los valores correctos.
// Las funciones de guardado vienen de useContactos() de la página que lo abre.
import { useMemo, useState } from 'react';
import { IconX } from './gestionSemanal/icons';

// Paleta NEWLOOK (ver README-NEWLOOK.md)
const C = {
  primary: '#6A8899',
  primarySoft: 'rgba(106,136,153,0.1)',
  text: '#212529',
  muted: '#6c757d',
  faint: '#9ca3af',
  borderSoft: '#dde2e6',
};

const inputStyle = {
  width: '100%', border: '1px solid #ced4da', borderRadius: '8px',
  padding: '8px 12px', fontSize: '0.9rem', outline: 'none', background: '#fff',
};

const Label = ({ children }) => (
  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
    {children}
  </div>
);

const ContactoFormModal = ({
  contacto = null, // null = nuevo
  rolesIniciales = { proveedor: true, cliente: true },
  nombreInicial = '',
  buscarExacto,
  buscarParecidos,
  crearContacto,
  actualizarContacto,
  onClose,
  onGuardado,
}) => {
  const [form, setForm] = useState(() => (contacto ? {
    nombre: contacto.nombre || '',
    proveedor: !!contacto.roles?.proveedor,
    cliente: !!contacto.roles?.cliente,
    telefono: contacto.contacto?.telefono || '',
    alias: (contacto.alias || []).join(', '),
    notas: contacto.notas || '',
  } : {
    nombre: nombreInicial,
    proveedor: !!rolesIniciales.proveedor,
    cliente: !!rolesIniciales.cliente,
    telefono: '',
    alias: '',
    notas: '',
  }));
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const parecidos = useMemo(() => {
    if (contacto || !form.nombre.trim()) return [];
    return buscarParecidos(form.nombre);
  }, [contacto, form.nombre, buscarParecidos]);

  const guardar = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) { setErrorForm('El nombre es obligatorio.'); return; }
    if (!form.proveedor && !form.cliente) { setErrorForm('Elegí al menos un rol: proveedor o cliente.'); return; }

    const alias = form.alias.split(',').map((a) => a.trim()).filter(Boolean);
    const roles = { proveedor: form.proveedor, cliente: form.cliente };
    setGuardando(true);
    try {
      if (contacto) {
        const res = await actualizarContacto(contacto.id, {
          nombre, roles, telefono: form.telefono, notas: form.notas, alias,
        });
        if (!res.ok) { setErrorForm(res.motivo); return; }
        onGuardado?.({ id: contacto.id, nombre, creado: false, roles });
      } else {
        const existente = buscarExacto(nombre);
        if (existente) {
          setErrorForm(existente.activo === false
            ? `"${existente.nombre}" ya existe pero está archivado. Buscalo en Archivados y reactivalo.`
            : `Ya existe "${existente.nombre}".`);
          return;
        }
        const creado = await crearContacto(nombre, roles);
        // Datos extra que crearContacto no recibe: se completan a continuación.
        await actualizarContacto(creado.id, { telefono: form.telefono, notas: form.notas, alias });
        onGuardado?.({ id: creado.id, nombre, creado: true, roles });
      }
      onClose();
    } catch (e) {
      console.error('Error al guardar contacto:', e);
      setErrorForm('No se pudo guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(520px, 95vw)', maxHeight: '90vh', background: '#fff', borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)', zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              {contacto ? 'Editar' : 'Nuevo'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text }}>
              {contacto ? (form.nombre || 'Contacto') : 'Proveedor o cliente'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            {contacto && (
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
            type="button" onClick={onClose}
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
            {guardando ? 'Guardando…' : (contacto ? 'Guardar cambios' : 'Crear')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ContactoFormModal;
