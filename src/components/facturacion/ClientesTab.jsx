import { useState } from 'react';
import { useClientesFacturacion } from '../../firebase/hooks';
import Breadcrumb from './Breadcrumb';
import ClientesList from './clientes/ClientesList';
import ClienteDetalle from './clientes/ClienteDetalle';
import ClienteForm from './clientes/ClienteForm';

// Cliente hardcodeado para probar el flujo lista → detalle → historial sin cargar datos a mano.
const CLIENTE_DEMO = {
  razonSocial: 'Carnicería Don Julio S.R.L.',
  tipoDoc: 'CUIT',
  nroDoc: '30712345678',
  condicionIVA: 'RESP. INSCRIPTO',
  domicilio: 'Av. Rivadavia 4521',
  localidad: 'Caballito',
  provincia: 'CAPITAL FEDERAL',
  pais: 'ARGENTINA',
  codigoPostal: '1424',
  telefono: '11 4567-8901',
  contacto: 'Julio Fernández',
  email: 'contacto@donjulio.com.ar',
  web: '',
  observaciones: 'Cliente de ejemplo cargado para probar el flujo.',
};

export default function ClientesTab() {
  const { clientes, loading, addCliente, updateCliente } = useClientesFacturacion();
  const [vista, setVista] = useState('lista'); // 'lista' | 'ver' | 'form'
  const [clienteId, setClienteId] = useState(null);

  // Siempre derivado de la lista en vivo, así ver/editar muestran datos frescos tras guardar.
  const clienteActual = clienteId ? clientes.find(c => c.id === clienteId) : null;

  const irALista = () => {
    setVista('lista');
    setClienteId(null);
  };

  const abrirNuevo = () => {
    setClienteId(null);
    setVista('form');
  };

  const abrirCliente = (cliente) => {
    setClienteId(cliente.id);
    setVista('ver');
  };

  const editarClienteActual = () => setVista('form');

  const cancelarForm = () => {
    setVista(clienteId ? 'ver' : 'lista');
  };

  const handleGuardar = async (data) => {
    if (clienteId) {
      await updateCliente(clienteId, data);
      setVista('ver');
    } else {
      const nuevoId = await addCliente(data);
      setClienteId(nuevoId);
      setVista('ver');
    }
  };

  const breadcrumbItems = [
    { label: 'Clientes', view: 'lista' },
    ...(vista === 'ver' ? [{ label: clienteActual?.razonSocial || 'Cliente', view: 'ver' }] : []),
    ...(vista === 'form' && clienteId ? [
      { label: clienteActual?.razonSocial || 'Cliente', view: 'ver' },
      { label: 'Editar', view: 'form' },
    ] : []),
    ...(vista === 'form' && !clienteId ? [{ label: 'Nuevo Cliente', view: 'form' }] : []),
  ];

  const handleBreadcrumbNav = (item) => {
    if (item.view === 'lista') irALista();
    else if (item.view === 'ver') setVista('ver');
  };

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNav} />

      {vista === 'lista' && (
        <ClientesList
          clientes={clientes}
          loading={loading}
          onSelectCliente={abrirCliente}
          onAddNew={abrirNuevo}
          onSeedDemo={() => addCliente(CLIENTE_DEMO)}
        />
      )}

      {vista === 'ver' && clienteActual && (
        <ClienteDetalle cliente={clienteActual} onEdit={editarClienteActual} />
      )}

      {vista === 'form' && (
        <ClienteForm
          cliente={clienteActual}
          onSave={handleGuardar}
          onCancel={cancelarForm}
        />
      )}
    </div>
  );
}
