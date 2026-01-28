# ⚠️ Saldo Proveedor – Problema pendiente de análisis humano

## Resumen

El módulo `src/components/saldoProveedor/` incluye la lógica para manejar saldos a favor de proveedores y aplicar descuentos en Pagos a Proveedores. **Hay un problema sin resolver** que impide depurarlo correctamente con Cursor.

## Archivos afectados

- `src/components/saldoProveedor/DescuentoSaldoProveedor.jsx` – Componente UI para mostrar y aplicar descuentos
- `src/components/saldoProveedor/useSaldoProveedor.js` – Hook con la lógica de saldos y descuentos
- `src/components/saldoProveedor/index.js` – Punto de entrada del módulo

## Problema

**Cursor se tilda siempre al analizar estos archivos.**

Cada vez que se intenta que Cursor (o el asistente IA) analice, revise o modifique este módulo, el editor se congela o deja de responder. Por eso no se pudo terminar de diagnosticar ni corregir el problema de fondo.

## Qué hace falta

**Una persona tiene que analizar manualmente** este código:

1. Revisar la búsqueda de saldos por proveedor (normalización de nombres, comparación con balances).
2. Verificar la integración con `PagosProveedoresTab.jsx` y el hook `useClientBalances`.
3. Confirmar que los cálculos de descuento y totales son correctos.
4. Revisar si hay `console.log` de debug que deban quitarse (p. ej. en `obtenerSaldoAFavor` en `useSaldoProveedor.js`).

## Contexto técnico

- El hook `useSaldoProveedor` usa `useClientBalances()` de Firebase para obtener balances.
- Busca en “Saldo Clientes” la cuenta más reciente del proveedor y calcula saldo a favor (ingresos − boletas).
- `DescuentoSaldoProveedor` muestra el saldo disponible y permite aplicar/quitar descuentos.
- El módulo se usa en la pestaña **Pagos a Proveedores** (`PagosProveedoresTab.jsx`).

## Estado

- **Funcionalidad**: implementada pero no validada por el bloqueo de Cursor.
- **Debug**: hay `console.log` en `obtenerSaldoAFavor` que probablemente haya que eliminar en producción.
- **Análisis pendiente**: debe hacerse por una persona, sin depender del análisis automático de Cursor.

---

*Documentado el 28/01/2025. Revisar cuando se pueda hacer el análisis manual.*
