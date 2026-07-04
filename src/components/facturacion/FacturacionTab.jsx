import { useEffect } from 'react';
import { useFacturasFacturacion, useClientesFacturacion, useProductosFacturacion } from '../../firebase/hooks';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../NotificationContainer';
import { formatearComprobante } from './constants';
import FacturasList from './facturas/FacturasList';
import FacturaDetalle from './facturas/FacturaDetalle';
import FacturaForm from './facturas/FacturaForm';
import FacturaWindow from './facturas/FacturaWindow';
import FacturasTaskbar from './facturas/FacturasTaskbar';
import useFacturaWindows from './facturas/useFacturaWindows';

export default function FacturacionTab() {
  const { facturas, loading, addFactura, updateFactura } = useFacturasFacturacion();
  // Se traen acá arriba (una sola vez) y se pasan por props a cada ventana abierta,
  // en vez de que cada FacturaForm llame a su propio hook — evita un listener de
  // Firestore duplicado por cada ventana simultánea. Ver README-FACTURACION.md.
  const { clientes } = useClientesFacturacion();
  const { productos } = useProductosFacturacion();
  // Un solo contenedor de notificaciones para toda la pestaña (no uno por ventana) —
  // mismo sistema que ya usa el resto de la app (Mi Reparto, Gestión Semanal), en vez de alert() nativo.
  const { notifications, removeNotification, showError } = useNotifications();
  const {
    ventanas, abrirVentana, cerrarVentana, minimizarVentana, restaurarVentana, enfocarVentana, actualizarVentana,
  } = useFacturaWindows();

  const facturaDeVentana = (ventana) => ventana.facturaId ? facturas.find(f => f.id === ventana.facturaId) : null;

  // Título = nombre del cliente, así minimizada se sabe de un vistazo cuál es cuál.
  // Mientras se está creando/editando usa el borrador en vivo (ventana.clienteNombreBorrador);
  // una vez guardada, el nombre del cliente ya viene en la propia factura.
  const labelVentana = (ventana) => {
    if (ventana.vista === 'form' && ventana.clienteNombreBorrador) return ventana.clienteNombreBorrador;
    const factura = facturaDeVentana(ventana);
    return factura?.clienteNombre || 'Nueva Factura';
  };

  // El comprobante formateado pasa a ser el subtítulo (chico, arriba del nombre del cliente).
  const subtituloVentana = (ventana) => {
    const factura = facturaDeVentana(ventana);
    return factura ? formatearComprobante(factura.tipo, factura.numero) : 'Nueva factura';
  };

  const handleGuardar = async (ventana, data) => {
    if (ventana.facturaId) {
      await updateFactura(ventana.facturaId, data);
      actualizarVentana(ventana.key, { vista: 'ver' });
    } else {
      const nuevoId = await addFactura(data);
      actualizarVentana(ventana.key, { facturaId: nuevoId, vista: 'ver' });
    }
  };

  const handleCancelar = (ventana) => {
    // Editando una existente → vuelve a la ficha. Creando una nueva → no hay nada que mostrar, se cierra.
    if (ventana.facturaId) actualizarVentana(ventana.key, { vista: 'ver' });
    else cerrarVentana(ventana.key);
  };

  const abiertas = ventanas.filter(v => !v.minimized);
  const minimizadas = ventanas.filter(v => v.minimized);

  // Tecla "-" minimiza la ventana de factura al frente (la de mayor zIndex).
  // No dispara si el foco está en un campo de texto/select — el % IVA admite negativos
  // (ver constants.js → IVA_DEFAULT) y no hay que robarle el guión mientras se tipea "-5".
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== '-') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const activas = ventanas.filter(v => !v.minimized);
      if (activas.length === 0) return;
      const frontal = activas.reduce((a, b) => (b.zIndex > a.zIndex ? b : a));
      e.preventDefault();
      minimizarVentana(frontal.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ventanas, minimizarVentana]);

  return (
    <div>
      <FacturasList
        facturas={facturas}
        loading={loading}
        onSelectFactura={(factura) => abrirVentana(factura.id)}
        onAddNew={() => abrirVentana(null)}
      />

      {abiertas.map((ventana, i) => {
        const factura = facturaDeVentana(ventana);
        return (
          <FacturaWindow
            key={ventana.key}
            titulo={labelVentana(ventana)}
            subtitulo={subtituloVentana(ventana)}
            zIndex={ventana.zIndex}
            offset={i * 18}
            onFocus={() => enfocarVentana(ventana.key)}
            onMinimize={() => minimizarVentana(ventana.key)}
            onClose={() => cerrarVentana(ventana.key)}
          >
            {ventana.vista === 'ver' && factura && (
              <FacturaDetalle factura={factura} onEdit={() => actualizarVentana(ventana.key, { vista: 'form' })} />
            )}
            {ventana.vista === 'form' && (
              <FacturaForm
                factura={factura}
                clientes={clientes}
                productos={productos}
                onSave={(data) => handleGuardar(ventana, data)}
                onCancel={() => handleCancelar(ventana)}
                onClienteChange={(nombre) => actualizarVentana(ventana.key, { clienteNombreBorrador: nombre })}
                onError={showError}
              />
            )}
          </FacturaWindow>
        );
      })}

      <FacturasTaskbar
        minimizadas={minimizadas}
        getLabel={labelVentana}
        onRestaurar={restaurarVentana}
        onCerrar={cerrarVentana}
      />

      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
}
