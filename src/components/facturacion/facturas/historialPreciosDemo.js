// Mock del historial de precios que le cobré a un cliente puntual por un producto puntual.
// Es el único archivo que sabe que estos datos son inventados — HistorialPrecioClienteModal
// solo recibe un array de filas por props. Cuando exista la colección real
// (facturacion_precios_historial, ver README-FACTURACION.md → "Historial de Precios"),
// esta función se reemplaza por una consulta a Firestore con la misma forma de salida.

// Determinístico por (clienteId, producto) para que el mismo par siempre muestre los mismos
// precios de ejemplo en vez de números al azar en cada apertura del modal.
const hashSimple = (texto) => {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
};

export const obtenerHistorialPrecio = (clienteId, productoLabel) => {
  if (!clienteId || !productoLabel) return [];

  const semilla = hashSimple(`${clienteId}-${productoLabel.trim().toLowerCase()}`);
  const precioBase = 1500 + (semilla % 40) * 100; // entre 1500 y ~5500, estable por par

  return Array.from({ length: 8 }, (_, i) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - (i + 1) * 9); // una cada ~9 días hacia atrás
    const variacion = ((semilla >> (i * 3)) % 15) - 7; // +-7% de variación por entrada
    const precioUnit = Math.round(precioBase * (1 + variacion / 100));
    const cantidad = Math.round((5 + ((semilla >> (i * 2)) % 35)) * 100) / 100; // 5.00 a 40.00
    return {
      fecha: fecha.toISOString().slice(0, 10),
      cantidad,
      precioUnit,
      numeroFactura: `0001-${String(1300 - semilla % 200 - i * 3).padStart(8, '0')}`,
    };
  });
};
