/**
 * Módulo para manejar saldos a favor de proveedores
 * 
 * Este módulo proporciona:
 * - Hook useSaldoProveedor: Lógica para obtener y manejar saldos
 * - Componente DescuentoSaldoProveedor: UI para mostrar y aplicar descuentos
 * 
 * Uso:
 * ```jsx
 * import { useSaldoProveedor, DescuentoSaldoProveedor } from '../components/saldoProveedor';
 * 
 * const { obtenerSaldoAFavor, aplicarDescuento, calcularTotalConDescuento } = useSaldoProveedor();
 * ```
 */

export { useSaldoProveedor } from './useSaldoProveedor';
export { default as DescuentoSaldoProveedor } from './DescuentoSaldoProveedor';
