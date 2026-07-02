// Datos de ejemplo — la lógica real de ventas (conectada a facturación) se suma más adelante.
// Se genera un volumen grande a propósito para poder probar búsqueda, orden y paginación.

const PLANTILLAS = [
  { tipo: 'Factura B', items: [
    { producto: 'Asado', cantidad: '12 kg', precioUnit: 3200 },
    { producto: 'Vacío', cantidad: '2 kg', precioUnit: 3600 },
  ] },
  { tipo: 'Factura B', items: [
    { producto: 'Matambre', cantidad: '5 kg', precioUnit: 4100 },
    { producto: 'Chorizo', cantidad: '3 kg', precioUnit: 2800 },
  ] },
  { tipo: 'Factura A', items: [
    { producto: 'Bife de chorizo', cantidad: '10 kg', precioUnit: 4800 },
    { producto: 'Costilla', cantidad: '6 kg', precioUnit: 2200 },
  ] },
  { tipo: 'Factura B', items: [
    { producto: 'Pollo', cantidad: '15 kg', precioUnit: 1800 },
  ] },
  { tipo: 'Factura A', items: [
    { producto: 'Peceto', cantidad: '8 kg', precioUnit: 3900 },
    { producto: 'Cuadril', cantidad: '4 kg', precioUnit: 4200 },
  ] },
];

// Compartido con VentaForm para que el subtotal se calcule siempre igual al editar.
export const calcularSubtotal = (item) => (parseFloat(item.precioUnit) || 0) * (parseFloat(item.cantidad) || 0);
export const calcularTotalVenta = (items) => items.reduce((sum, i) => sum + calcularSubtotal(i), 0);

const construirVenta = (index) => {
  const plantilla = PLANTILLAS[index % PLANTILLAS.length];
  const items = plantilla.items.map(item => ({
    ...item,
    subtotal: calcularSubtotal(item),
  }));
  const total = calcularTotalVenta(items);

  // Ancla en "hoy" (no una fecha fija) para que las ventas mock siempre incluyan
  // la semana/mes actual — si no, "Ventas por producto" (período actual) quedaría
  // siempre vacío apenas pasara la fecha fija original.
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - index * 4); // una venta cada ~4 días hacia atrás

  const numero = `0001-${String(1350 - index).padStart(8, '0')}`;

  return {
    id: String(index + 1),
    numero,
    tipo: plantilla.tipo,
    fecha: fecha.toISOString().slice(0, 10),
    total,
    items,
  };
};

export const VENTAS_DEMO = Array.from({ length: 34 }, (_, i) => construirVenta(i));
