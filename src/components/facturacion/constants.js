export const PROVINCIAS = [
  'BUENOS AIRES', 'CAPITAL FEDERAL', 'CATAMARCA', 'CHACO', 'CHUBUT', 'CORDOBA',
  'CORRIENTES', 'ENTRE RIOS', 'FORMOSA', 'JUJUY', 'LA PAMPA', 'LA RIOJA',
  'MENDOZA', 'MISIONES', 'NEUQUEN', 'RIO NEGRO', 'SALTA', 'SAN JUAN',
  'SAN LUIS', 'SANTA CRUZ', 'SANTA FE', 'SANTIAGO DEL ESTERO',
  'TIERRA DEL FUEGO', 'TUCUMAN',
];

export const CONDICIONES_IVA = [
  'RESP. INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR FINAL', 'NO RESPONSABLE',
];

export const TIPOS_DOC = ['CUIT', 'DNI', 'CUIL'];

export const TIPOS_FACTURA = ['Factura A', 'Factura B', 'Factura C'];

export const PRODUCTO_VACIO = {
  descripcion: '',
};

export const IVA_DEFAULT = 21;

// Formato simple "0001-00000001" — no es numeración AFIP real (punto de venta / letra
// según condición de IVA), solo un correlativo interno legible. Ver README-FACTURACION.md.
export const formatearComprobante = (tipo, numero) =>
  `${tipo} 0001-${String(numero || 0).padStart(8, '0')}`;

export const FACTURA_VACIA = {
  clienteId: null,
  clienteNombre: '',
  tipo: 'Factura B',
  items: [{ codigo: '', descripcion: '', cantidad: '', precioUnit: '' }],
  ivaPct: IVA_DEFAULT,
};

export const CLIENTE_VACIO = {
  razonSocial: '',
  tipoDoc: 'CUIT',
  nroDoc: '',
  condicionIVA: 'RESP. INSCRIPTO',
  domicilio: '',
  localidad: '',
  provincia: 'BUENOS AIRES',
  pais: 'ARGENTINA',
  codigoPostal: '',
  telefono: '',
  contacto: '',
  email: '',
  web: '',
  observaciones: '',
};
