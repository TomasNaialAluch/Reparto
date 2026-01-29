# ✅ Saldo Proveedor – Implementación Completada

## Resumen

El módulo `src/components/saldoProveedor/` maneja saldos a favor de proveedores y permite aplicar descuentos en Pagos a Proveedores. **La implementación fue completamente reescrita** para usar un sistema de vinculaciones explícitas entre Saldo Clientes y boletas de mercadería.

## Archivos del módulo

- `src/components/saldoProveedor/DescuentoSaldoProveedor.jsx` – Componente UI para mostrar y aplicar descuentos
- `src/components/saldoProveedor/useSaldoProveedor.js` – Hook con la lógica de saldos y descuentos (reescrito completamente)
- `src/components/saldoProveedor/index.js` – Punto de entrada del módulo

## Arquitectura Nueva

### Principio fundamental
**El único lugar donde se vinculan Saldo Cliente ↔ Mercadería ↔ Pagos a Proveedores es en Saldo Clientes.**

### Flujo de funcionamiento

#### 1. En Saldo Clientes (`src/pages/SaldoClientes.jsx`)
- El usuario crea un saldo para un proveedor/cliente
- Vincula boletas de mercadería usando el botón "📦 Vincular Boleta de Mercadería"
- Las boletas vinculadas se guardan con `mercaderiaIndex` y `esDeMercaderia: true`
- Al guardar el saldo cliente:
  - Si hay saldo a favor positivo (`finalBalance > 0`)
  - Y hay boletas vinculadas de mercadería
  - Se llama automáticamente a `guardarVinculacionSaldoCliente()` que guarda en Firebase

#### 2. En Pagos a Proveedores (`src/components/gestionSemanal/PagosProveedoresTab.jsx`)
- El usuario selecciona boletas para pagar
- Se llama a `obtenerSaldoAFavorPorBoletas(proveedor, boletasSeleccionadas)`
- El hook verifica si las boletas seleccionadas están vinculadas en algún saldo cliente
- Solo si hay vinculación, se muestra el saldo a favor disponible para descontar
- El descuento solo aplica a las boletas vinculadas específicamente

### Ventajas de esta arquitectura

✅ **No se arrastran valores de semanas anteriores** – El descuento solo existe si hay vinculación explícita  
✅ **No se descuenta dos veces** – Las vinculaciones son específicas por boletas  
✅ **Fuente única de verdad** – Todo se guarda en Saldo Clientes  
✅ **Trazabilidad completa** – Se sabe exactamente qué boletas están vinculadas a qué saldo

## Estructura de datos en Firebase

### Colección: `saldoProveedorVinculaciones`

Cada documento contiene:
```javascript
{
  saldoClienteId: string,        // ID del documento de saldo cliente
  proveedor: string,             // Nombre del proveedor/cliente
  boletasVinculadas: number[],   // Array de índices de mercadería vinculados
  saldoAFavor: number,           // Saldo a favor calculado (finalBalance si es positivo)
  detalleSaldo: {
    totalVentas: number,
    totalPlata: number,
    totalEfectivo: number,
    totalCheque: number,
    totalTransferencia: number,
    totalIngresos: number,
    totalBoletas: number
  },
  fechaCreacion: Timestamp,
  fechaSaldoCliente: string
}
```

## Funciones principales del hook

### `guardarVinculacionSaldoCliente(datos)`
- **Cuándo se llama**: Desde `SaldoClientes.jsx` al guardar/actualizar un saldo cliente
- **Qué hace**: Guarda la vinculación en Firebase si hay boletas vinculadas y saldo a favor positivo
- **Parámetros**: 
  - `saldoClienteId`: ID del documento de saldo cliente
  - `proveedor`: Nombre del proveedor
  - `boletasVinculadas`: Array de boletas (el hook filtra las que tienen `mercaderiaIndex`)
  - `saldoAFavor`: Saldo a favor calculado
  - `detalleSaldo`: Detalle completo del saldo

### `obtenerSaldoAFavorPorBoletas(proveedor, boletasSeleccionadas)`
- **Cuándo se llama**: Desde `PagosProveedoresTab.jsx` cuando hay boletas seleccionadas
- **Qué hace**: Busca vinculaciones donde las boletas seleccionadas estén vinculadas
- **Retorna**: Monto del saldo a favor disponible (0 si no hay vinculación)

### `obtenerSaldoAFavor(proveedor)`
- Versión simplificada para compatibilidad
- Retorna el saldo de la vinculación más reciente del proveedor

## Integración

### Archivos modificados

1. **`src/components/saldoProveedor/useSaldoProveedor.js`**
   - Reescrito completamente
   - Nueva lógica basada en vinculaciones explícitas
   - Escucha cambios en tiempo real de Firebase

2. **`src/pages/SaldoClientes.jsx`**
   - Importa `useSaldoProveedor`
   - Llama a `guardarVinculacionSaldoCliente` en `saveCurrentCliente` y `updateCliente`

3. **`src/components/gestionSemanal/PagosProveedoresTab.jsx`**
   - Usa `obtenerSaldoAFavorPorBoletas` con las boletas seleccionadas
   - Solo muestra descuento si las boletas están vinculadas

## Estado

- ✅ **Funcionalidad**: Implementada y funcionando
- ✅ **Arquitectura**: Sistema de vinculaciones explícitas
- ✅ **Integración**: Completa con Saldo Clientes y Pagos a Proveedores
- ✅ **Firebase**: Nueva colección `saldoProveedorVinculaciones` creada

## Notas técnicas

- Las vinculaciones se guardan automáticamente cuando se guarda un saldo cliente con boletas vinculadas
- El descuento solo aparece si las boletas seleccionadas están vinculadas en algún saldo cliente
- No se arrastran valores de semanas anteriores ni boletas ya pagadas
- El sistema es reactivo: los cambios en Firebase se reflejan automáticamente

---

*Implementación completada el 29/01/2025. Sistema de vinculaciones explícitas funcionando correctamente.*
