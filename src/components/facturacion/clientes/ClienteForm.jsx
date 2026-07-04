import { useState } from 'react';
import { PROVINCIAS, CONDICIONES_IVA, TIPOS_DOC, CLIENTE_VACIO } from '../constants';
import FormSection from './FormSection';

const Field = ({ label, children, flex = 1 }) => (
  <div style={{ flex, minWidth: '160px' }}>
    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '5px' }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #ccd3d9',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function ClienteForm({ cliente, onSave, onCancel, onError }) {
  const esNuevo = !cliente;
  const [formData, setFormData] = useState(() => ({ ...CLIENTE_VACIO, ...cliente }));

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleGuardar = () => {
    if (!formData.razonSocial.trim()) {
      onError?.('Ingresá la razón social del cliente');
      return;
    }
    onSave(formData);
  };

  return (
    <div>
      {/* Datos principales — siempre visibles */}
      <FormSection label="Identificación">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Field label="Razón Social" flex={2.5}>
            <input type="text" style={inputStyle} value={formData.razonSocial}
              onChange={(e) => update('razonSocial', e.target.value)}
              placeholder="Nombre o razón social" autoFocus={esNuevo} />
          </Field>
          {!esNuevo && (
            <Field label="Código" flex={0.8}>
              <input type="text" style={{ ...inputStyle, background: '#f8f9fa', color: '#6c757d' }} value={formData.codigo || ''} readOnly />
            </Field>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Field label="Tipo Doc." flex={0.8}>
            <select style={inputStyle} value={formData.tipoDoc} onChange={(e) => update('tipoDoc', e.target.value)}>
              {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="N° Documento" flex={1.2}>
            <input type="text" style={inputStyle} value={formData.nroDoc}
              onChange={(e) => update('nroDoc', e.target.value)} placeholder="Sin guiones ni espacios" />
          </Field>
          <Field label="Condición IVA" flex={1.5}>
            <select style={inputStyle} value={formData.condicionIVA} onChange={(e) => update('condicionIVA', e.target.value)}>
              {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection label="Domicilio y contacto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="Domicilio">
            <input type="text" style={inputStyle} value={formData.domicilio}
              onChange={(e) => update('domicilio', e.target.value)} placeholder="Calle y número" />
          </Field>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Field label="Localidad">
              <input type="text" style={inputStyle} value={formData.localidad}
                onChange={(e) => update('localidad', e.target.value)} />
            </Field>
            <Field label="Provincia">
              <select style={inputStyle} value={formData.provincia} onChange={(e) => update('provincia', e.target.value)}>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="País" flex={0.8}>
              <input type="text" style={inputStyle} value={formData.pais}
                onChange={(e) => update('pais', e.target.value)} />
            </Field>
            <Field label="Cód. Postal" flex={0.6}>
              <input type="text" style={inputStyle} value={formData.codigoPostal}
                onChange={(e) => update('codigoPostal', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Field label="Teléfono / WhatsApp">
              <input type="text" style={inputStyle} value={formData.telefono}
                onChange={(e) => update('telefono', e.target.value)} />
            </Field>
            <Field label="Responsable / contacto">
              <input type="text" style={inputStyle} value={formData.contacto}
                onChange={(e) => update('contacto', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Field label="E-mail">
              <input type="email" style={inputStyle} value={formData.email}
                onChange={(e) => update('email', e.target.value)} />
            </Field>
            <Field label="Página Web">
              <input type="text" style={inputStyle} value={formData.web}
                onChange={(e) => update('web', e.target.value)} />
            </Field>
          </div>
          <Field label="Observaciones">
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={formData.observaciones}
              onChange={(e) => update('observaciones', e.target.value)} />
          </Field>
        </div>
      </FormSection>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleGuardar}
          style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
          {esNuevo ? 'Crear Cliente' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
