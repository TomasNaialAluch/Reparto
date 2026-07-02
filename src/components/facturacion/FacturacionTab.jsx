import { useState } from 'react';
import { useFacturasFacturacion } from '../../firebase/hooks';
import { formatearComprobante } from './constants';
import Breadcrumb from './Breadcrumb';
import FacturasList from './facturas/FacturasList';
import FacturaDetalle from './facturas/FacturaDetalle';
import FacturaForm from './facturas/FacturaForm';

export default function FacturacionTab() {
  const { facturas, loading, addFactura, updateFactura } = useFacturasFacturacion();
  const [vista, setVista] = useState('lista'); // 'lista' | 'ver' | 'form'
  const [facturaId, setFacturaId] = useState(null);

  // Mismo patrón que ClientesTab/ProductosTab: se guarda el id y se deriva de la lista en vivo.
  const facturaActual = facturaId ? facturas.find(f => f.id === facturaId) : null;

  const irALista = () => {
    setVista('lista');
    setFacturaId(null);
  };

  const abrirNueva = () => {
    setFacturaId(null);
    setVista('form');
  };

  const abrirFactura = (factura) => {
    setFacturaId(factura.id);
    setVista('ver');
  };

  const editarFacturaActual = () => setVista('form');

  const cancelarForm = () => {
    setVista(facturaId ? 'ver' : 'lista');
  };

  const handleGuardar = async (data) => {
    if (facturaId) {
      await updateFactura(facturaId, data);
      setVista('ver');
    } else {
      const nuevoId = await addFactura(data);
      setFacturaId(nuevoId);
      setVista('ver');
    }
  };

  const labelFactura = (f) => f && formatearComprobante(f.tipo, f.numero);

  const breadcrumbItems = [
    { label: 'Facturación', view: 'lista' },
    ...(vista === 'ver' ? [{ label: labelFactura(facturaActual) || 'Factura', view: 'ver' }] : []),
    ...(vista === 'form' && facturaId ? [
      { label: labelFactura(facturaActual) || 'Factura', view: 'ver' },
      { label: 'Editar', view: 'form' },
    ] : []),
    ...(vista === 'form' && !facturaId ? [{ label: 'Nueva Factura', view: 'form' }] : []),
  ];

  const handleBreadcrumbNav = (item) => {
    if (item.view === 'lista') irALista();
    else if (item.view === 'ver') setVista('ver');
  };

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNav} />

      {vista === 'lista' && (
        <FacturasList
          facturas={facturas}
          loading={loading}
          onSelectFactura={abrirFactura}
          onAddNew={abrirNueva}
        />
      )}

      {vista === 'ver' && facturaActual && (
        <FacturaDetalle factura={facturaActual} onEdit={editarFacturaActual} />
      )}

      {vista === 'form' && (
        <FacturaForm
          factura={facturaActual}
          onSave={handleGuardar}
          onCancel={cancelarForm}
        />
      )}
    </div>
  );
}
