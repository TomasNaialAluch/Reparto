import { useState } from 'react';
import { IconX } from '../../gestionSemanal/icons';
import Breadcrumb from '../Breadcrumb';
import VentasList from './ventas/VentasList';
import VentaDetalle from './ventas/VentaDetalle';
import VentaForm from './ventas/VentaForm';
import { VENTAS_DEMO } from './ventas/ventasDemo';

export default function HistorialVentasModal({ cliente, onClose }) {
  // Copia local editable — cuando exista la colección real de ventas, esto pasa a ser un hook de Firebase.
  const [ventas, setVentas] = useState(VENTAS_DEMO);
  const [vista, setVista] = useState('lista'); // 'lista' | 'detalle' | 'editar'
  const [ventaId, setVentaId] = useState(null);

  // Igual que clienteActual en ClientesTab: se deriva del id, nunca se guarda el objeto completo.
  const ventaActual = ventaId ? ventas.find(v => v.id === ventaId) : null;

  const abrirVenta = (venta) => {
    setVentaId(venta.id);
    setVista('detalle');
  };

  const editarVentaActual = () => setVista('editar');

  const cancelarEdicion = () => setVista('detalle');

  const volverALista = () => {
    setVista('lista');
    setVentaId(null);
  };

  const handleGuardar = (data) => {
    setVentas(prev => prev.map(v => v.id === ventaId ? { ...v, ...data } : v));
    setVista('detalle');
  };

  const breadcrumbItems = [
    { label: 'Historial de Ventas', view: 'lista' },
    ...(vista === 'detalle' ? [{ label: ventaActual?.numero || '', view: 'detalle' }] : []),
    ...(vista === 'editar' ? [
      { label: ventaActual?.numero || '', view: 'detalle' },
      { label: 'Editar', view: 'editar' },
    ] : []),
  ];

  const handleBreadcrumbNav = (item) => {
    if (item.view === 'lista') volverALista();
    else if (item.view === 'detalle') setVista('detalle');
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(680px, 95vw)',
        maxHeight: '90vh',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        zIndex: 1051,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Historial de Ventas
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
              {cliente.razonSocial}
            </div>
          </div>
          <button onClick={onClose}
            className="d-inline-flex align-items-center justify-content-center"
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#6c757d' }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNav} />

          {vista === 'lista' && (
            <VentasList ventas={ventas} cliente={cliente} onSelectVenta={abrirVenta} />
          )}

          {vista === 'detalle' && ventaActual && (
            <VentaDetalle venta={ventaActual} cliente={cliente} onEdit={editarVentaActual} />
          )}

          {vista === 'editar' && ventaActual && (
            <VentaForm venta={ventaActual} onSave={handleGuardar} onCancel={cancelarEdicion} />
          )}
        </div>
      </div>
    </>
  );
}
