/**
 * Obtiene la fecha local en formato YYYY-MM-DD
 * Sin usar UTC para evitar problemas de zona horaria
 */
export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const result = `${year}-${month}-${day}`;
  
  return result;
};

/**
 * Convierte una fecha Date a string local YYYY-MM-DD
 */
export const dateToLocalString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la hora local en formato ISO completo pero con hora local
 */
export const getLocalISOString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Formatea una fecha string (YYYY-MM-DD) a formato local sin problemas de zona horaria
 * Evita el problema de que JavaScript interprete las fechas como UTC
 */
export const formatDateSafe = (dateString) => {
  if (!dateString) return '';
  
  // Si ya está en formato DD/MM/YYYY, devolverlo tal como está
  if (dateString.includes('/')) {
    return dateString;
  }
  
  // Parsear la fecha de forma segura sin problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Crear fecha local directamente con los componentes
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

