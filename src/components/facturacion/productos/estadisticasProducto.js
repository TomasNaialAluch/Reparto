// Agrega VENTAS_DEMO por producto — mismo dataset mock que usa Historial de Ventas del cliente.
// A propósito NO se calcula el historial completo (todas las semanas/meses): eso sería
// recorrer todo el dataset innecesariamente. Se calcula solo el período ACTUAL, que es
// lo que se traduce a una consulta acotada por rango de fecha cuando exista Firestore real
// (where fecha >= desde AND fecha <= hasta), en vez de traer todo y agrupar en el cliente.
import { VENTAS_DEMO, calcularSubtotal } from '../clientes/ventas/ventasDemo';

const fmtCorta = (d) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

const rangoSemanaActual = () => {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0 = domingo
  const offset = dia === 0 ? 6 : dia - 1; // lunes como primer día
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - offset);
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + 6);
  return { desde, hasta, label: `Semana del ${fmtCorta(desde)} al ${fmtCorta(hasta)}` };
};

const rangoMesActual = () => {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const texto = hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return { desde, hasta, label: texto.charAt(0).toUpperCase() + texto.slice(1) };
};

// granularidad: 'semana' | 'mes' — devuelve solo el período actual, no el historial completo.
export const obtenerVentasPeriodoActual = (descripcion, granularidad) => {
  const nombre = (descripcion || '').trim().toLowerCase();
  const { desde, hasta, label } = granularidad === 'semana' ? rangoSemanaActual() : rangoMesActual();
  const desdeStr = desde.toISOString().slice(0, 10);
  const hastaStr = hasta.toISOString().slice(0, 10);

  let kilos = 0;
  let totalPlata = 0;
  let ventas = 0;

  if (nombre) {
    for (const venta of VENTAS_DEMO) {
      // Corte temprano por fecha antes de mirar los items — es el filtro más barato
      // y es el que se convertiría en el where() de la query real.
      if (venta.fecha < desdeStr || venta.fecha > hastaStr) continue;
      for (const item of venta.items) {
        if (item.producto.trim().toLowerCase() === nombre) {
          kilos += parseFloat(item.cantidad) || 0;
          totalPlata += calcularSubtotal(item);
          ventas += 1;
        }
      }
    }
  }

  return { label, kilos, totalPlata, ventas };
};
