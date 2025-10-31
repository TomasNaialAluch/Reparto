import React, { useState } from 'react';
import { formatCurrency } from '../utils/money';
import { getLocalDateString } from '../utils/date';
import { useNotifications } from '../hooks/useNotifications';
import { useProveedores } from '../hooks/useProveedores';
import { usePronelis } from '../hooks/usePronelis';
import { useListasPrecios } from '../hooks/useListasPrecios';
import NotificationContainer from '../components/NotificationContainer';
import PrintDocument from '../components/PrintDocument';
import { ModalNuevoProveedor } from '../components/ModalNuevoProveedor';
import { ModalSeleccionProveedores } from '../components/ModalSeleccionProveedores';
import { ModalCargaRapidaPrecios } from '../components/ModalCargaRapidaPrecios';

const ListaPrecios = () => {
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Hooks personalizados (DRY - Don't Repeat Yourself)
  const { proveedores, loading: loadingProveedores, crearProveedor, actualizarProveedor, eliminarProveedor } = useProveedores();
  const { pronelis, loading: loadingPronelis, crearPronelis, actualizarPronelis, eliminarPronelis } = usePronelis();
  const { listas, pronelisAgrupadas, loading: loadingListas, crearLista, actualizarLista, eliminarLista } = useListasPrecios();
  
  const loading = loadingProveedores || loadingPronelis || loadingListas;
  
  // Estados para vista activa
  const [vistaActiva, setVistaActiva] = useState('pronelis');
  
  // Estados para proveedores
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [contactoProveedor, setContactoProveedor] = useState('');
  const [editandoProveedorId, setEditandoProveedorId] = useState(null);
  
  // Estados para lista de precios (input manual)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState('');
  const [nombrePrónelis, setNombrePrónelis] = useState('');
  const [productos, setProductos] = useState([{ nombre: '', precio: '' }]);
  const [fechaComprobante, setFechaComprobante] = useState(getLocalDateString());
  const [notas, setNotas] = useState('');
  
  // Estados para comparación
  const [prónelisSeleccionado, setPrónelisSeleccionado] = useState('');
  const [editandoListaId, setEditandoListaId] = useState(null);
  const [preciosEditables, setPreciosEditables] = useState({});
  
  // Estados para gestión de prónelis/paquetes
  const [pronelisSeleccionadoId, setPronelisSeleccionadoId] = useState('');
  const [productosPronelis, setProductosPronelis] = useState([{ nombre: '' }]);
  const [nombrePronelisEditando, setNombrePronelisEditando] = useState('');
  
  // Estados para impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  
  // Estados para modales
  const [showModalNuevoProveedor, setShowModalNuevoProveedor] = useState(false);
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState('');
  const [nuevoProveedorContacto, setNuevoProveedorContacto] = useState('');
  const [showModalSeleccionProveedores, setShowModalSeleccionProveedores] = useState(false);
  const [paqueteParaImprimir, setPaqueteParaImprimir] = useState(null);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [showModalCargaRapida, setShowModalCargaRapida] = useState(false);

  // ===== GESTIÓN DE PROVEEDORES =====
  const guardarProveedor = async () => {
    try {
      if (!nombreProveedor.trim()) {
        showError('Debes ingresar el nombre del proveedor');
        return;
      }

      if (editandoProveedorId) {
        await actualizarProveedor(editandoProveedorId, nombreProveedor, contactoProveedor);
        showSuccess('Proveedor actualizado correctamente');
        setEditandoProveedorId(null);
      } else {
        const existe = proveedores.find(p => p.nombre.toLowerCase() === nombreProveedor.toLowerCase());
        if (existe) {
          showError('Ya existe un proveedor con ese nombre');
          return;
        }
        await crearProveedor(nombreProveedor, contactoProveedor);
        showSuccess('Proveedor guardado correctamente');
      }

      setNombreProveedor('');
      setContactoProveedor('');
    } catch (error) {
      showError('Error al guardar proveedor');
    }
  };

  const eliminarProveedorHandler = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await eliminarProveedor(id);
      showSuccess('Proveedor eliminado');
    } catch (error) {
      showError('Error al eliminar proveedor');
    }
  };

  const editarProveedor = (proveedor) => {
    setNombreProveedor(proveedor.nombre);
    setContactoProveedor(proveedor.contacto || '');
    setEditandoProveedorId(proveedor.id);
  };

  const abrirModalNuevoProveedor = () => {
    setNuevoProveedorNombre('');
    setNuevoProveedorContacto('');
    setShowModalNuevoProveedor(true);
  };

  const cerrarModalNuevoProveedor = () => {
    setShowModalNuevoProveedor(false);
    setNuevoProveedorNombre('');
    setNuevoProveedorContacto('');
  };

  const agregarProveedorRapido = async () => {
    try {
      if (!nuevoProveedorNombre.trim()) {
        showError('Debes ingresar el nombre del proveedor');
        return;
      }

      const existe = proveedores.find(p => p.nombre.toLowerCase() === nuevoProveedorNombre.toLowerCase());
      if (existe) {
        showError('Ya existe un proveedor con ese nombre');
        setProveedorSeleccionado(existe.id);
        cerrarModalNuevoProveedor();
        return;
      }

      const docId = await crearProveedor(nuevoProveedorNombre, nuevoProveedorContacto);
      showSuccess('Proveedor creado correctamente');
      setProveedorSeleccionado(docId);
      cerrarModalNuevoProveedor();
    } catch (error) {
      showError('Error al crear proveedor');
    }
  };

  // ===== GESTIÓN DE IMPRESIÓN DE PAQUETES =====
  const imprimirFormulariosParaPaquete = (paquete) => {
    setPaqueteParaImprimir(paquete);
    setProveedoresSeleccionados([]);
    setShowModalSeleccionProveedores(true);
  };

  const toggleProveedor = (proveedorId) => {
    setProveedoresSeleccionados(prev => {
      if (prev.includes(proveedorId)) {
        return prev.filter(id => id !== proveedorId);
      } else {
        return [...prev, proveedorId];
      }
    });
  };

  const generarFormulariosSeleccionados = () => {
    if (proveedoresSeleccionados.length === 0) {
      showError('Debes seleccionar al menos un proveedor');
      return;
    }

    const printWindow = window.open('', '_blank');
    let content = '';
    
    const proveedoresSeleccionadosData = proveedores.filter(p => proveedoresSeleccionados.includes(p.id));
    
    proveedoresSeleccionadosData.forEach((proveedor, index) => {
      content += `
        <div style="page-break-after: ${index < proveedoresSeleccionadosData.length - 1 ? 'always' : 'auto'}; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px;">
              ${paqueteParaImprimir.nombre} - ${proveedor.nombre}
            </h2>
          </div>
          
          <div style="text-align: right; margin-bottom: 20px; font-size: 9pt; color: #666;">
            Fecha: ${new Date(getLocalDateString()).toLocaleDateString('es-AR')}
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Datos del Proveedor</div>
            <div style="margin-left: 15px;">
              <strong>Nombre:</strong> ${proveedor.nombre}<br>
              ${proveedor.contacto ? `<strong>Contacto:</strong> ${proveedor.contacto}` : ''}
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Cortes Solicitados</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 5%;">#</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 65%;">Corte</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 30%;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${paqueteParaImprimir.productos.map((producto, idx) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${producto.nombre}</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">$__________</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107;">
            <strong>Por favor completar los precios y devolver este formulario</strong><br>
            Gracias por su colaboración
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formularios de Cotización - ${paqueteParaImprimir.nombre}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.5cm 2cm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    showSuccess(`Se generaron ${proveedoresSeleccionados.length} formularios para imprimir`);
    setShowModalSeleccionProveedores(false);
  };

  // ===== GESTIÓN DE LISTAS DE PRECIOS =====
  const agregarProducto = () => {
    setProductos([...productos, { nombre: '', precio: '' }]);
  };

  const removerProducto = (index) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index));
    }
  };

  const actualizarProducto = (index, field, value) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index][field] = value;
    setProductos(nuevosProductos);
  };

  // Calcular progreso y totales
  const calcularProgreso = () => {
    const productosConPrecio = productos.filter(p => p.nombre.trim() && p.precio && parseFloat(p.precio) > 0);
    const totalProductos = productos.filter(p => p.nombre.trim()).length;
    return {
      completados: productosConPrecio.length,
      total: totalProductos,
      porcentaje: totalProductos > 0 ? Math.round((productosConPrecio.length / totalProductos) * 100) : 0
    };
  };

  const calcularTotal = () => {
    return productos.reduce((sum, p) => {
      const precio = parseFloat(p.precio) || 0;
      return sum + precio;
    }, 0);
  };

  // Función para guardar desde modal de carga rápida
  const guardarDesdeModalRapido = async (proveedorId, preciosObj, notasModal) => {
    try {
      const paqueteActual = pronelis.find(p => p.id === paqueteSeleccionadoId);
      if (!paqueteActual || !paqueteActual.productos) {
        return false;
      }

      const productosValidos = paqueteActual.productos
        .map((corte, idx) => ({
          nombre: corte.nombre,
          precio: parseFloat(preciosObj[idx]) || 0
        }))
        .filter(p => p.precio > 0);

      if (productosValidos.length === 0) {
        return false;
      }

      const proveedor = proveedores.find(p => p.id === proveedorId);
      const datos = {
        proveedorId: proveedorId,
        proveedorNombre: proveedor?.nombre,
        nombrePrónelis: nombrePrónelis.trim(),
        fecha: fechaComprobante,
        productos: productosValidos,
        notas: notasModal.trim(),
        fechaCreacion: new Date().toISOString()
      };

      await crearLista(datos);
      return true;
    } catch (error) {
      console.error('Error al guardar desde modal:', error);
      return false;
    }
  };

  // Función para manejar selección de paquete y carga automática
  const manejarSeleccionPaquete = (paqueteId) => {
    setPaqueteSeleccionadoId(paqueteId);
    
    if (paqueteId) {
      // Cargar paquete seleccionado
      const paqueteSeleccionado = pronelis.find(p => p.id === paqueteId);
      if (paqueteSeleccionado) {
        // Pre-llenar nombre del prónelis
        setNombrePrónelis(paqueteSeleccionado.nombre);
        
        // Cargar cortes del paquete como productos con precios vacíos
        if (paqueteSeleccionado.productos && paqueteSeleccionado.productos.length > 0) {
          const productosConPrecios = paqueteSeleccionado.productos.map(corte => ({
            nombre: corte.nombre,
            precio: ''
          }));
          setProductos(productosConPrecios);
        }
      }
    } else {
      // Si se deselecciona, volver al modo manual
      setNombrePrónelis('');
      setProductos([{ nombre: '', precio: '' }]);
    }
  };

  const guardarLista = async () => {
    try {
      if (!proveedorSeleccionado) {
        showError('Debes seleccionar un proveedor');
        return;
      }

      if (!nombrePrónelis.trim()) {
        showError('Debes ingresar el nombre del paquete/prónelis');
        return;
      }

      const productosValidos = productos.filter(p => p.nombre.trim() && p.precio);
      if (productosValidos.length === 0) {
        showError('Debes agregar al menos un producto con precio');
        return;
      }

      const datos = {
        proveedorId: proveedorSeleccionado,
        proveedorNombre: proveedores.find(p => p.id === proveedorSeleccionado)?.nombre,
        nombrePrónelis: nombrePrónelis.trim(),
        fecha: fechaComprobante,
        productos: productosValidos.map(p => ({
          nombre: p.nombre.trim(),
          precio: parseFloat(p.precio) || 0
        })),
        notas: notas.trim(),
        fechaCreacion: new Date().toISOString()
      };

      await crearLista(datos);
      if (paqueteSeleccionadoId) {
        showSuccess(`Precios guardados correctamente. El paquete "${nombrePrónelis}" se mantiene para continuar cargando.`);
      } else {
        showSuccess('Lista de precios guardada correctamente');
      }

      // Si viene de un paquete, mantener el paquete y proveedor, solo limpiar precios
      if (paqueteSeleccionadoId) {
        const paqueteSeleccionado = pronelis.find(p => p.id === paqueteSeleccionadoId);
        if (paqueteSeleccionado && paqueteSeleccionado.productos) {
          // Recargar los cortes del paquete con precios vacíos
          const productosConPrecios = paqueteSeleccionado.productos.map(corte => ({
            nombre: corte.nombre,
            precio: ''
          }));
          setProductos(productosConPrecios);
          setNotas(''); // Limpiar notas pero mantener el resto
          // Mantener proveedor, fecha y paquete seleccionado
          
          // Auto-focus en el primer campo de precio después de un breve delay
          setTimeout(() => {
            const firstPriceInput = document.querySelector('input[data-price-index="0"]');
            if (firstPriceInput) {
              firstPriceInput.focus();
              firstPriceInput.select();
            }
          }, 100);
        }
      } else {
        // Modo manual: limpiar todo
        setProveedorSeleccionado('');
        setNombrePrónelis('');
        setProductos([{ nombre: '', precio: '' }]);
        setFechaComprobante(getLocalDateString());
        setNotas('');
      }
    } catch (error) {
      console.error('Error al guardar lista:', error);
      showError('Error al guardar lista de precios');
    }
  };

  const eliminarListaHandler = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta lista?')) return;
    try {
      await eliminarLista(id);
      showSuccess('Lista eliminada');
    } catch (error) {
      showError('Error al eliminar lista');
    }
  };

  // Función para iniciar edición de una lista desde la vista de comparación
  const iniciarEdicionLista = (lista) => {
    setEditandoListaId(lista.id);
    const preciosIniciales = {};
    lista.productos.forEach((p, idx) => {
      preciosIniciales[`${lista.id}-${idx}`] = p.precio.toString();
    });
    setPreciosEditables(preciosIniciales);
  };

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setEditandoListaId(null);
    setPreciosEditables({});
  };

  // Función para guardar edición de precios
  const guardarEdicionLista = async (listaId) => {
    try {
      const lista = listas.find(l => l.id === listaId);
      if (!lista) {
        showError('Lista no encontrada');
        return;
      }

      // Obtener los precios editables para esta lista
      const productosActualizados = lista.productos.map((p, idx) => {
        const key = `${listaId}-${idx}`;
        const nuevoPrecio = preciosEditables[key] || '0';
        return {
          ...p,
          precio: parseFloat(nuevoPrecio) || 0
        };
      });

      await actualizarLista(listaId, {
        productos: productosActualizados,
        fechaModificacion: new Date().toISOString()
      });

      showSuccess('Precios actualizados correctamente');
      setEditandoListaId(null);
      setPreciosEditables({});
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      showError('Error al actualizar precios');
    }
  };

  // Función para actualizar precio editable
  const actualizarPrecioEditable = (key, value) => {
    setPreciosEditables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ===== COMPARACIÓN DE PRECIOS =====
  const productosUnicosAgrupados = (nombrePronelis) => {
    const listasDelPaquete = pronelisAgrupadas[nombrePronelis] || [];
    const productosSet = new Set();
    
    listasDelPaquete.forEach(lista => {
      lista.productos.forEach(p => productosSet.add(p.nombre));
    });

    return Array.from(productosSet);
  };

  const obtenerPrecioProducto = (proveedorNombre, productoNombre, nombrePronelis) => {
    const listasDelPaquete = pronelisAgrupadas[nombrePronelis] || [];
    const listaEncontrada = listasDelPaquete.find(l => l.proveedorNombre === proveedorNombre);
    if (!listaEncontrada) return null;
    
    const producto = listaEncontrada.productos.find(p => p.nombre === productoNombre);
    return producto ? producto.precio : null;
  };

  // ===== IMPRESIÓN =====
  const generarComprobanteManual = (proveedor) => {
    setPrintData({
      tipo: 'formularioManual',
      proveedor: proveedor.nombre,
      contacto: proveedor.contacto,
      fecha: getLocalDateString()
    });
    setShowPrintModal(true);
  };

  const generarComprobanteGuardado = (lista) => {
    setPrintData({
      tipo: 'listas',
      proveedor: lista.proveedorNombre,
      fecha: lista.fecha,
      productos: lista.productos,
      notas: lista.notas,
      nombrePronelis: lista.nombrePrónelis
    });
    setShowPrintModal(true);
  };

  const imprimirFormularioVacio = () => {
    setPrintData({
      tipo: 'formularioVacio',
      fecha: getLocalDateString()
    });
    setShowPrintModal(true);
  };

  const imprimirFormulariosMultiples = () => {
    if (proveedores.length === 0) {
      showError('No hay proveedores registrados');
      return;
    }

    // Crear una ventana de impresión con múltiples formularios
    const printWindow = window.open('', '_blank');
    let content = '';
    
    proveedores.forEach((proveedor, index) => {
      content += `
        <div style="page-break-after: ${index < proveedores.length - 1 ? 'always' : 'auto'}; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px;">
              Formulario de Cotización para ${proveedor.nombre}
            </h2>
          </div>
          
          <div style="text-align: right; margin-bottom: 20px; font-size: 9pt; color: #666;">
            Fecha: ${new Date(getLocalDateString()).toLocaleDateString('es-AR')}
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Datos del Proveedor</div>
            <div style="margin-left: 15px;">
              <strong>Nombre:</strong> ${proveedor.nombre}<br>
              ${proveedor.contacto ? `<strong>Contacto:</strong> ${proveedor.contacto}` : ''}
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Lista de Precios</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 5%;">#</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 65%;">Producto</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 30%;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: 20 }).map((_, idx) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 8px; min-height: 25px;">___________________________</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">$__________</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107;">
            <strong>Por favor completar y devolver este formulario</strong><br>
            Gracias por su colaboración
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formularios de Cotización - Múltiples Proveedores</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.5cm 2cm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    showSuccess(`Se generaron ${proveedores.length} formularios para imprimir`);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      
      {/* Navegación entre vistas */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${vistaActiva === 'pronelis' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActiva('pronelis')}
            >
              <i className="fas fa-box me-2"></i>
              Prónelis/Paquetes
            </button>
            <button
              type="button"
              className={`btn ${vistaActiva === 'proveedores' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActiva('proveedores')}
            >
              <i className="fas fa-users me-2"></i>
              Proveedores
            </button>
            <button
              type="button"
              className={`btn ${vistaActiva === 'listas' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActiva('listas')}
            >
              <i className="fas fa-dollar-sign me-2"></i>
              Ingresar Precios
            </button>
            <button
              type="button"
              className={`btn ${vistaActiva === 'comparacion' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActiva('comparacion')}
            >
              <i className="fas fa-chart-line me-2"></i>
              Comparar Precios
            </button>
          </div>
        </div>
      </div>

      {/* VISTA: PRÓNELIS/PAQUETES */}
      {vistaActiva === 'pronelis' && (
        <div className="row">
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-warning text-white">
                <h5 className="mb-0">
                  <i className="fas fa-box me-2"></i>
                  {pronelisSeleccionadoId ? 'Editar Paquete' : 'Nuevo Paquete/Prónelis'}
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Nombre del Paquete/Prónelis <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombrePronelisEditando}
                    onChange={(e) => setNombrePronelisEditando(e.target.value)}
                    placeholder="Ej: Geriatrico"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Cortes/Productos <span className="text-danger">*</span></label>
                  {productosPronelis.map((producto, index) => (
                    <div key={index} className="mb-2 d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre del corte/producto"
                        value={producto.nombre}
                        onChange={(e) => {
                          const nuevos = [...productosPronelis];
                          nuevos[index].nombre = e.target.value;
                          setProductosPronelis(nuevos);
                        }}
                      />
                      {productosPronelis.length > 1 && (
                        <button
                          className="btn btn-danger"
                          onClick={() => setProductosPronelis(productosPronelis.filter((_, i) => i !== index))}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setProductosPronelis([...productosPronelis, { nombre: '' }])}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Agregar Corte
                  </button>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-warning flex-fill"
                    onClick={async () => {
                      if (!nombrePronelisEditando.trim()) {
                        showError('Debes ingresar el nombre del paquete');
                        return;
                      }
                      const productosValidos = productosPronelis.filter(p => p.nombre.trim());
                      if (productosValidos.length === 0) {
                        showError('Debes agregar al menos un corte/producto');
                        return;
                      }

                      try {
                        if (pronelisSeleccionadoId) {
                          await actualizarPronelis(pronelisSeleccionadoId, nombrePronelisEditando, productosValidos);
                          showSuccess('Paquete actualizado');
                        } else {
                          await crearPronelis(nombrePronelisEditando, productosValidos);
                          showSuccess('Paquete creado');
                        }

                        setNombrePronelisEditando('');
                        setProductosPronelis([{ nombre: '' }]);
                        setPronelisSeleccionadoId('');
                      } catch (error) {
                        showError('Error al guardar paquete');
                      }
                    }}
                  >
                    <i className="fas fa-save me-2"></i>
                    {pronelisSeleccionadoId ? 'Actualizar' : 'Guardar'} Paquete
                  </button>
                  {pronelisSeleccionadoId && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setPronelisSeleccionadoId('');
                        setNombrePronelisEditando('');
                        setProductosPronelis([{ nombre: '' }]);
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-list me-2"></i>
                  Paquetes Disponibles ({pronelis.length})
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {pronelis.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-inbox fa-3x mb-3"></i>
                    <p>No hay paquetes creados</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {pronelis.map((pronelis) => (
                      <div key={pronelis.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-2">{pronelis.nombre}</h6>
                            <div className="small text-muted">
                              <strong>Cortes:</strong> {pronelis.productos?.length || 0}
                            </div>
                            {pronelis.productos && pronelis.productos.length > 0 && (
                              <ul className="list-unstyled small mb-0 mt-2">
                                {pronelis.productos.map((p, idx) => (
                                  <li key={idx}>
                                    <i className="fas fa-chevron-right me-1"></i>
                                    {p.nombre}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => imprimirFormulariosParaPaquete(pronelis)}
                              title="Imprimir formularios para proveedores"
                            >
                              <i className="fas fa-print"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => {
                                setPronelisSeleccionadoId(pronelis.id);
                                setNombrePronelisEditando(pronelis.nombre);
                                setProductosPronelis(pronelis.productos || [{ nombre: '' }]);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={async () => {
                                if (window.confirm('¿Eliminar este paquete?')) {
                                  try {
                                    await eliminarPronelis(pronelis.id);
                                    showSuccess('Paquete eliminado');
                                  } catch (error) {
                                    showError('Error al eliminar');
                                  }
                                }
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: PROVEEDORES */}
      {vistaActiva === 'proveedores' && (
        <div className="row">
          <div className="col-lg-5">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  {editandoProveedorId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Nombre del Proveedor <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombreProveedor}
                    onChange={(e) => setNombreProveedor(e.target.value)}
                    placeholder="Ej: Distribuidora ABC"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contacto (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={contactoProveedor}
                    onChange={(e) => setContactoProveedor(e.target.value)}
                    placeholder="Teléfono, email, etc."
                  />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-fill" onClick={guardarProveedor}>
                    <i className="fas fa-save me-2"></i>
                    {editandoProveedorId ? 'Actualizar' : 'Guardar'}
                  </button>
                  {editandoProveedorId && (
                    <button className="btn btn-secondary" onClick={() => {
                      setEditandoProveedorId(null);
                      setNombreProveedor('');
                      setContactoProveedor('');
                    }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-list me-2"></i>
                  Proveedores Registrados ({proveedores.length})
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {proveedores.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-inbox fa-3x mb-3"></i>
                    <p>No hay proveedores registrados</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {proveedores.map((proveedor) => (
                      <div key={proveedor.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{proveedor.nombre}</h6>
                            {proveedor.contacto && (
                              <small className="text-muted">
                                <i className="fas fa-phone me-1"></i>
                                {proveedor.contacto}
                              </small>
                            )}
                          </div>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => generarComprobanteManual(proveedor)}
                              title="Imprimir formulario para llenar a mano"
                            >
                              <i className="fas fa-print"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => editarProveedor(proveedor)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => eliminarProveedorHandler(proveedor.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: INGRESAR PRECIOS */}
      {vistaActiva === 'listas' && (
        <div className="row">
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-dollar-sign me-2"></i>
                  Ingresar Precios Manualmente
                </h5>
              </div>
              <div className="card-body">
                {/* Card destacada del paquete seleccionado */}
                {paqueteSeleccionadoId && (() => {
                  const paqueteSeleccionado = pronelis.find(p => p.id === paqueteSeleccionadoId);
                  const progreso = calcularProgreso();
                  return paqueteSeleccionado ? (
                    <div className="card border-primary mb-4" style={{ backgroundColor: '#f8f9ff' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="text-primary mb-2">
                              <i className="fas fa-box me-2"></i>
                              Paquete Seleccionado: <strong>{paqueteSeleccionado.nombre}</strong>
                            </h6>
                            <small className="text-muted">
                              <i className="fas fa-list me-1"></i>
                              {paqueteSeleccionado.productos?.length || 0} cortes en el paquete
                            </small>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => manejarSeleccionPaquete('')}
                            title="Cambiar a modo manual"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        {progreso.total > 0 && (
                          <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="text-muted">Progreso de precios</small>
                              <small className="fw-bold">
                                {progreso.completados} / {progreso.total} completados
                              </small>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className={`progress-bar ${progreso.porcentaje === 100 ? 'bg-success' : 'bg-info'}`}
                                role="progressbar"
                                style={{ width: `${progreso.porcentaje}%` }}
                                aria-valuenow={progreso.porcentaje}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Seleccionar Paquete <span className="text-muted">(recomendado)</span>
                  </label>
                  <select
                    className={`form-select form-select-lg ${paqueteSeleccionadoId ? 'border-primary border-2' : ''}`}
                    value={paqueteSeleccionadoId}
                    onChange={(e) => manejarSeleccionPaquete(e.target.value)}
                  >
                    <option value="">-- Elegir paquete (para cargar precios rápidamente) --</option>
                    {pronelis.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.productos?.length || 0} cortes)</option>
                    ))}
                  </select>
                  {!paqueteSeleccionadoId && (
                    <small className="form-text text-muted mt-2 d-block">
                      <i className="fas fa-lightbulb me-1 text-warning"></i>
                      <strong>Tip:</strong> Selecciona un paquete para cargar automáticamente los cortes y solo ingresa los precios
                    </small>
                  )}
                  {paqueteSeleccionadoId && (
                    <div className="mt-3">
                      <button
                        className="btn btn-primary btn-lg w-100"
                        onClick={() => setShowModalCargaRapida(true)}
                      >
                        <i className="fas fa-bolt me-2"></i>
                        ⚡ Carga Rápida Masiva
                      </button>
                      <small className="text-muted d-block mt-2 text-center">
                        <i className="fas fa-info-circle me-1"></i>
                        Ingresa precios para todos los proveedores de una vez
                      </small>
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Proveedor <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={proveedorSeleccionado}
                      onChange={(e) => {
                        if (e.target.value === 'crear_nuevo') {
                          abrirModalNuevoProveedor();
                          setProveedorSeleccionado('');
                        } else {
                          setProveedorSeleccionado(e.target.value);
                        }
                      }}
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                      <option value="crear_nuevo" className="text-primary">
                        ➕ Crear Nuevo Proveedor
                      </option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Fecha <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaComprobante}
                      onChange={(e) => setFechaComprobante(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del Prónelis/Paquete <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${paqueteSeleccionadoId ? 'border-primary' : ''}`}
                    value={nombrePrónelis}
                    onChange={(e) => setNombrePrónelis(e.target.value)}
                    placeholder="Ej: Arroz, Fideos y Aceite"
                    readOnly={!!paqueteSeleccionadoId}
                    style={paqueteSeleccionadoId ? { backgroundColor: '#f8f9ff', cursor: 'not-allowed' } : {}}
                  />
                  <small className="form-text text-muted">
                    {paqueteSeleccionadoId 
                      ? <><i className="fas fa-check-circle text-success me-1"></i>Se pre-llenó automáticamente desde el paquete seleccionado</>
                      : 'Usa el mismo nombre para agrupar listas de distintos proveedores'
                    }
                  </small>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold mb-0">Productos / Cortes <span className="text-danger">*</span></label>
                    {paqueteSeleccionadoId && productos.length > 0 && (
                      <span className="badge bg-info">
                        {calcularProgreso().completados} de {calcularProgreso().total} precios completados
                        {calcularProgreso().completados > 0 && calcularProgreso().completados < calcularProgreso().total && (
                          <span className="ms-1">• Puedes guardar parcialmente</span>
                        )}
                      </span>
                    )}
                  </div>
                  
                  {paqueteSeleccionadoId && productos.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover border">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '60%' }}>Corte</th>
                            <th style={{ width: '40%' }}>Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productos.map((producto, index) => (
                            <tr key={index} className={producto.precio && parseFloat(producto.precio) > 0 ? 'table-success' : ''}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-check-circle text-success me-2" style={{ opacity: producto.precio && parseFloat(producto.precio) > 0 ? 1 : 0 }}></i>
                                  <strong>{producto.nombre}</strong>
                                </div>
                              </td>
                              <td>
                                <div className="input-group">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    className="form-control text-end"
                                    placeholder="0.00"
                                    value={producto.precio}
                                    onChange={(e) => actualizarProducto(index, 'precio', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (index < productos.length - 1) {
                                          // Ir al siguiente campo
                                          e.preventDefault();
                                          const nextInput = document.querySelector(`input[data-price-index="${index + 1}"]`);
                                          if (nextInput) {
                                            nextInput.focus();
                                            nextInput.select();
                                          }
                                        } else {
                                          // Si es el último campo, guardar con Ctrl+Enter o hacer doble Enter
                                          if (e.ctrlKey || e.metaKey) {
                                            e.preventDefault();
                                            const guardarBtn = document.querySelector('button[data-guardar-btn]');
                                            if (guardarBtn && !guardarBtn.disabled) {
                                              guardarBtn.click();
                                            }
                                          }
                                        }
                                      }
                                    }}
                                    data-price-index={index}
                                    step="0.01"
                                    min="0"
                                    autoFocus={index === 0 && !producto.precio && paqueteSeleccionadoId}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <th className="text-end">Total:</th>
                            <th className="text-end text-success fs-5">
                              {formatCurrency(calcularTotal())}
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <>
                      {productos.map((producto, index) => (
                        <div key={index} className="mb-2 d-flex gap-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nombre del producto"
                            value={producto.nombre}
                            onChange={(e) => actualizarProducto(index, 'nombre', e.target.value)}
                          />
                          <div className="input-group" style={{ maxWidth: '200px' }}>
                            <span className="input-group-text">$</span>
                            <input
                              type="number"
                              className="form-control text-end"
                              placeholder="Precio"
                              value={producto.precio}
                              onChange={(e) => actualizarProducto(index, 'precio', e.target.value)}
                              step="0.01"
                              min="0"
                            />
                          </div>
                          {productos.length > 1 && (
                            <button
                              className="btn btn-danger"
                              onClick={() => removerProducto(index)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      <button className="btn btn-sm btn-outline-primary" onClick={agregarProducto}>
                        <i className="fas fa-plus me-1"></i>
                        Agregar Producto
                      </button>
                      {productos.length > 0 && (
                        <div className="mt-3 p-2 bg-light rounded">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Total:</span>
                            <span className="text-success fw-bold fs-5">{formatCurrency(calcularTotal())}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Notas (opcional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Agregar notas adicionales..."
                  />
                </div>

                <div className="d-grid gap-2">
                  <button 
                    className={`btn btn-lg ${paqueteSeleccionadoId && calcularProgreso().porcentaje === 100 ? 'btn-success' : 'btn-primary'}`}
                    onClick={guardarLista}
                    disabled={loading}
                    data-guardar-btn
                  >
                    <i className="fas fa-save me-2"></i>
                    {loading ? 'Guardando...' : paqueteSeleccionadoId ? 'Guardar Precios' : 'Guardar Lista de Precios'}
                  </button>
                  {paqueteSeleccionadoId && calcularProgreso().completados > 0 && calcularProgreso().completados < calcularProgreso().total && (
                    <small className="text-info text-center">
                      <i className="fas fa-info-circle me-1"></i>
                      Puedes guardar con los precios que tengas. El paquete se mantendrá para continuar cargando.
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-warning text-white">
                <h5 className="mb-0">
                  <i className="fas fa-list me-2"></i>
                  Listas Guardadas ({listas.length})
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {listas.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-inbox fa-3x mb-3"></i>
                    <p>No hay listas guardadas</p>
                  </div>
                ) : (
                  listas.map((lista) => {
                    const total = lista.productos.reduce((sum, p) => sum + p.precio, 0);
                    return (
                      <div key={lista.id} className="card mb-3 border">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">{lista.proveedorNombre}</h6>
                              <small className="text-muted d-block">
                                <strong>Prónelis:</strong> {lista.nombrePrónelis}
                              </small>
                              <small className="text-muted">
                                <i className="fas fa-calendar me-1"></i>
                                {new Date(lista.fecha).toLocaleDateString('es-AR')}
                              </small>
                            </div>
                            <div className="badge bg-success fs-6">
                              {formatCurrency(total)}
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <strong>Productos:</strong>
                            <ul className="list-unstyled mb-0">
                              {lista.productos.map((p, idx) => (
                                <li key={idx} className="small">
                                  <i className="fas fa-chevron-right me-1"></i>
                                  {p.nombre}: <strong>{formatCurrency(p.precio)}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="d-flex gap-2 mt-3">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => generarComprobanteGuardado(lista)}
                            >
                              <i className="fas fa-file-pdf me-1"></i>
                              Imprimir
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => eliminarListaHandler(lista.id)}
                            >
                              <i className="fas fa-trash me-1"></i>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: COMPARACIÓN */}
      {vistaActiva === 'comparacion' && (
        <div className="card shadow-sm">
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Comparar Precios
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-light btn-sm" onClick={imprimirFormularioVacio}>
                <i className="fas fa-print me-1"></i>
                Formulario Vacío
              </button>
              <button className="btn btn-success btn-sm" onClick={imprimirFormulariosMultiples}>
                <i className="fas fa-print me-1"></i>
                Imprimir Todos ({proveedores.length})
              </button>
            </div>
          </div>
          <div className="card-body">
            {Object.keys(pronelisAgrupadas).length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="fas fa-chart-line fa-4x mb-3"></i>
                <p>No hay listas para comparar</p>
                <small>Ingresa al menos una lista en la pestaña "Ingresar Precios"</small>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Seleccionar Prónelis/Paquete:</strong>
                  </label>
                  <select
                    className="form-select"
                    value={prónelisSeleccionado}
                    onChange={(e) => setPrónelisSeleccionado(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {Object.keys(pronelisAgrupadas).map(nombre => (
                      <option key={nombre} value={nombre}>{nombre}</option>
                    ))}
                  </select>
                </div>

                {prónelisSeleccionado && (
                  <>
                    {/* Lista de listas del paquete para editar */}
                    <div className="mb-4">
                      <h6 className="mb-3">
                        <i className="fas fa-list me-2"></i>
                        Listas del Paquete "{prónelisSeleccionado}" ({pronelisAgrupadas[prónelisSeleccionado].length})
                      </h6>
                      <div className="row g-3">
                        {pronelisAgrupadas[prónelisSeleccionado].map(lista => (
                          <div key={lista.id} className="col-md-6 col-lg-4">
                            <div className="card border h-100">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="mb-1">{lista.proveedorNombre}</h6>
                                    <small className="text-muted">
                                      <i className="fas fa-calendar me-1"></i>
                                      {new Date(lista.fecha).toLocaleDateString('es-AR')}
                                    </small>
                                  </div>
                                  <div className="btn-group">
                                    {editandoListaId === lista.id ? (
                                      <>
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() => guardarEdicionLista(lista.id)}
                                          title="Guardar cambios"
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-secondary"
                                          onClick={cancelarEdicion}
                                          title="Cancelar"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() => generarComprobanteGuardado(lista)}
                                          title="Imprimir"
                                        >
                                          <i className="fas fa-print"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-warning"
                                          onClick={() => iniciarEdicionLista(lista)}
                                          title="Editar precios"
                                        >
                                          <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-danger"
                                          onClick={() => eliminarListaHandler(lista.id)}
                                          title="Eliminar"
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {editandoListaId === lista.id ? (
                                  <div>
                                    {lista.productos.map((p, idx) => {
                                      const key = `${lista.id}-${idx}`;
                                      return (
                                        <div key={idx} className="mb-2">
                                          <small className="text-muted d-block mb-1">{p.nombre}</small>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text">$</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={preciosEditables[key] || ''}
                                              onChange={(e) => actualizarPrecioEditable(key, e.target.value)}
                                              step="0.01"
                                              min="0"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-2">
                                      <ul className="list-unstyled mb-0 small">
                                        {lista.productos.slice(0, 3).map((p, idx) => (
                                          <li key={idx}>
                                            <i className="fas fa-chevron-right me-1 text-muted"></i>
                                            {p.nombre}: <strong>{formatCurrency(p.precio)}</strong>
                                          </li>
                                        ))}
                                        {lista.productos.length > 3 && (
                                          <li className="text-muted">+ {lista.productos.length - 3} más</li>
                                        )}
                                      </ul>
                                    </div>
                                    <div className="alert alert-light border-success mb-0 py-2">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <strong className="small">Total:</strong>
                                        <strong className="text-success">
                                          {formatCurrency(lista.productos.reduce((sum, p) => sum + p.precio, 0))}
                                        </strong>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tabla de comparación */}
                    <hr className="my-4" />
                    <h6 className="mb-3">
                      <i className="fas fa-chart-line me-2"></i>
                      Comparación de Precios
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-primary">
                          <tr>
                            <th>Producto</th>
                            {pronelisAgrupadas[prónelisSeleccionado].map(lista => (
                              <th key={lista.id} className="text-center">
                                {lista.proveedorNombre}
                                <br />
                                <small className="text-muted">
                                  {new Date(lista.fecha).toLocaleDateString('es-AR')}
                                </small>
                              </th>
                            ))}
                            <th className="bg-success text-white text-center">Mejor Precio</th>
                          </tr>
                        </thead>
                      <tbody>
                        {productosUnicosAgrupados(prónelisSeleccionado).map(producto => {
                          const proveedoresLista = pronelisAgrupadas[prónelisSeleccionado];
                          const precios = proveedoresLista.map(lista => ({
                            proveedor: lista.proveedorNombre,
                            precio: obtenerPrecioProducto(lista.proveedorNombre, producto, prónelisSeleccionado)
                          }));

                          const preciosValidos = precios.filter(p => p.precio !== null);
                          const mejorPrecio = preciosValidos.length > 0 
                            ? Math.min(...preciosValidos.map(p => p.precio))
                            : null;

                          return (
                            <tr key={producto}>
                              <td><strong>{producto}</strong></td>
                              {proveedoresLista.map(lista => {
                                const precio = obtenerPrecioProducto(lista.proveedorNombre, producto, prónelisSeleccionado);
                                const esMejor = precio === mejorPrecio && precio !== null;
                                return (
                                  <td key={lista.id} className="text-center">
                                    {precio !== null ? (
                                      <span className={esMejor ? 'badge bg-success fs-6' : ''}>
                                        {formatCurrency(precio)}
                                      </span>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="bg-success text-white text-center fw-bold">
                                {mejorPrecio !== null ? formatCurrency(mejorPrecio) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de impresión */}
      {showPrintModal && (
        <PrintDocument
          data={printData}
          type="listaPrecios"
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Modal de Nuevo Proveedor */}
      <ModalNuevoProveedor
        isOpen={showModalNuevoProveedor}
        onClose={cerrarModalNuevoProveedor}
        nombre={nuevoProveedorNombre}
        contacto={nuevoProveedorContacto}
        onNombreChange={setNuevoProveedorNombre}
        onContactoChange={setNuevoProveedorContacto}
        onGuardar={agregarProveedorRapido}
      />

      {/* Modal de Selección de Proveedores para Imprimir */}
      <ModalSeleccionProveedores
        isOpen={showModalSeleccionProveedores}
        onClose={() => setShowModalSeleccionProveedores(false)}
        paquete={paqueteParaImprimir}
        proveedores={proveedores}
        proveedoresSeleccionados={proveedoresSeleccionados}
        onToggleProveedor={toggleProveedor}
        onImprimir={generarFormulariosSeleccionados}
      />

      {/* Modal de Carga Rápida de Precios */}
      <ModalCargaRapidaPrecios
        isOpen={showModalCargaRapida}
        onClose={() => setShowModalCargaRapida(false)}
        paquete={pronelis.find(p => p.id === paqueteSeleccionadoId)}
        proveedores={proveedores}
        onGuardar={guardarDesdeModalRapido}
      />
    </div>
  );
};

export default ListaPrecios;
