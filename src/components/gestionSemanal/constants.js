export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const PROVEEDORES = ['Catriel', 'Lucas', 'Tito', 'FM', 'Moreira', 'Doina', 'Facundo', 'Novak'];

export const CORTES_CARNE = [
  'Carre',
  'Manta',
  'Bondiola',
  'Churrasquito 1°',
  'Anketa',
  'Jamon',
  'Recorte',
  'Menudencias',
  'Varios'
];

export const TIPOS_EMBUTIDOS = [
  'Morcilla',
  'Puro',
  'Comun',
  'Parrilera',
  'Ochi',
  'Viena',
  'Colorado',
  'Choribon'
];

export const EMPLEADOS_DEFAULT = ['Jorge', 'Nico', 'Gustavo', 'Tomy'];

// Función para obtener el día actual de la semana
export const getDiaActual = () => {
  const hoy = new Date();
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaActual = dias[hoy.getDay()];
  
  // Si es domingo, usar lunes como día por defecto (primer día laboral)
  return diaActual === 'Domingo' ? 'Lunes' : diaActual;
};

