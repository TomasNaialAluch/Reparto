import { useState } from 'react';
import { useProductosFacturacion } from '../../firebase/hooks';
import Breadcrumb from './Breadcrumb';
import ProductosList from './productos/ProductosList';
import ProductoDetalle from './productos/ProductoDetalle';
import ProductoForm from './productos/ProductoForm';

export default function ProductosTab() {
  const { productos, loading, addProducto, updateProducto } = useProductosFacturacion();
  const [vista, setVista] = useState('lista'); // 'lista' | 'ver' | 'form'
  const [productoId, setProductoId] = useState(null);

  // Mismo patrón que ClientesTab: se guarda el id y se deriva de la lista en vivo.
  const productoActual = productoId ? productos.find(p => p.id === productoId) : null;

  const irALista = () => {
    setVista('lista');
    setProductoId(null);
  };

  const abrirNuevo = () => {
    setProductoId(null);
    setVista('form');
  };

  const abrirProducto = (producto) => {
    setProductoId(producto.id);
    setVista('ver');
  };

  const editarProductoActual = () => setVista('form');

  const cancelarForm = () => {
    setVista(productoId ? 'ver' : 'lista');
  };

  const handleGuardar = async (data) => {
    if (productoId) {
      await updateProducto(productoId, data);
      setVista('ver');
    } else {
      const nuevoId = await addProducto(data);
      setProductoId(nuevoId);
      setVista('ver');
    }
  };

  const breadcrumbItems = [
    { label: 'Productos', view: 'lista' },
    ...(vista === 'ver' ? [{ label: productoActual?.descripcion || 'Producto', view: 'ver' }] : []),
    ...(vista === 'form' && productoId ? [
      { label: productoActual?.descripcion || 'Producto', view: 'ver' },
      { label: 'Editar', view: 'form' },
    ] : []),
    ...(vista === 'form' && !productoId ? [{ label: 'Nuevo Producto', view: 'form' }] : []),
  ];

  const handleBreadcrumbNav = (item) => {
    if (item.view === 'lista') irALista();
    else if (item.view === 'ver') setVista('ver');
  };

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNav} />

      {vista === 'lista' && (
        <ProductosList
          productos={productos}
          loading={loading}
          onSelectProducto={abrirProducto}
          onAddNew={abrirNuevo}
        />
      )}

      {vista === 'ver' && productoActual && (
        <ProductoDetalle producto={productoActual} onEdit={editarProductoActual} />
      )}

      {vista === 'form' && (
        <ProductoForm
          producto={productoActual}
          onSave={handleGuardar}
          onCancel={cancelarForm}
        />
      )}
    </div>
  );
}
