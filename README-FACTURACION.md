# Facturación — Guía de estructura y refactor

Este documento describe cómo está armado el módulo de Facturación, qué patrones seguimos, qué decisiones de producto ya se tomaron y qué deuda técnica conocemos. Sirve como mapa antes de tocar código y como checklist para refactors futuros bajo **YAGNI, KISS y DRY**.

Para estilos visuales (colores, botones, modales, tablas) ver [README-NEWLOOK.md](README-NEWLOOK.md) — este doc es sobre **organización de código y decisiones de producto**, no de UI visual.

---

## Estructura de carpetas

```
src/pages/Facturacion.jsx                          ← orquesta el toolbar F1/F2/F3 + animación de tabs

src/components/facturacion/
├── Toolbar.jsx                                     ← F1 Facturación / F2 Clientes / F3 Productos
├── Breadcrumb.jsx                                  ← reutilizable: ClientesTab, ProductosTab, HistorialVentasModal
├── PlaceholderSection.jsx                          ← estado "próximamente" genérico
├── constants.js                                    ← PROVINCIAS, CONDICIONES_IVA, TIPOS_DOC, TIPOS_FACTURA,
│                                                       CLIENTE_VACIO, PRODUCTO_VACIO, FACTURA_VACIA,
│                                                       IVA_DEFAULT, formatearComprobante()
│
├── FacturacionTab.jsx                              ← orquestador: vista 'lista' | 'ver' | 'form'
├── facturas/
│   ├── FacturasList.jsx                            ← tabla (Fecha, Comprobante, Cliente, Total $) + buscador + "Nueva Factura"
│   ├── FacturaForm.jsx                              ← alta/edición: buscador de cliente con autocompletar,
│   │                                                    items dinámicos, % IVA único, subtotal/total en vivo
│   └── FacturaDetalle.jsx                           ← ficha de solo lectura + Imprimir + Editar
│
├── ClientesTab.jsx                                 ← orquestador: vista 'lista' | 'ver' | 'form'
├── clientes/
│   ├── ClientesList.jsx                            ← tabla + buscador + botón "Agregar Nuevo"
│   ├── ClienteForm.jsx                              ← alta/edición (usa FormSection)
│   ├── ClienteDetalle.jsx                           ← ficha de solo lectura + botones Historial/Editar
│   ├── FormSection.jsx                              ← compartido: ClienteForm, ClienteDetalle, VentaForm
│   ├── HistorialVentasModal.jsx                     ← orquestador del modal: vista 'lista' | 'detalle' | 'editar'
│   └── ventas/
│       ├── VentasList.jsx                          ← buscador + orden por fecha + paginación + selección + imprimir resumen
│       ├── VentaDetalle.jsx                         ← detalle de una venta (líneas + total) + Imprimir + Editar
│       ├── VentaForm.jsx                            ← alta/edición de una venta (items dinámicos)
│       └── ventasDemo.js                            ← datos mock (34 ventas, ancladas a "hoy") + calcularSubtotal/calcularTotalVenta
│
├── ProductosTab.jsx                                ← orquestador: vista 'lista' | 'ver' | 'form'
└── productos/
    ├── ProductosList.jsx                           ← tabla (Código, Descripción) + buscador + "Agregar Nuevo"
    ├── ProductoForm.jsx                             ← alta/edición (solo descripción; código autogenerado)
    ├── ProductoDetalle.jsx                          ← ficha de solo lectura + botones Ventas/Editar
    ├── VentasProductoModal.jsx                      ← 2 tarjetas (kilos vendidos, total $) con toggle Semana actual / Mes actual
    └── estadisticasProducto.js                      ← suma kilos + $ (reusa calcularSubtotal) solo del período actual (ver patrón #7)

src/components/PrintDocument.jsx                     ← compartido con TODA la app, no solo Facturación
├── renderVentaContent()          → type="venta"           (comprobante de una venta)
├── renderVentasResumenContent()  → type="ventasResumen"    (resumen de varias ventas seleccionadas + total)
└── renderFacturaContent()        → type="factura"          (comprobante de una factura)

src/firebase/hooks.js
├── useClientesFacturacion()                         ← CRUD sobre 'facturacion_clientes'
├── useProductosFacturacion()                         ← CRUD sobre 'facturacion_productos'
└── useFacturasFacturacion()                          ← CRUD sobre 'facturacion_facturas', numeración con siguienteNumero()
```

---

## Decisiones de producto ya tomadas (no volver a preguntar)

Estas son respuestas explícitas del usuario — si en algún refactor aparece la tentación de "mejorar" esto, primero confirmar que el contexto no cambió.

| Decisión | Detalle |
|---|---|
| **Código de cliente y de producto** | Autogenerado secuencial (`siguienteCodigo()` en cada hook), **no** editable por el usuario. Se descartó a propósito el flujo de la referencia (código manual o `*` para auto) por simplicidad. |
| **Precio de productos** | El `ProductoForm` **no tiene campo de precio**. Los precios van a ser **por cliente, no por producto** — ese es un flujo aparte todavía sin construir. No agregar `precio`/`precioNeto`/`IVA` a `PRODUCTO_VACIO` sin repreguntar. |
| **Datos Facturación (tab del cliente)** | Se sacó del `ClienteForm` (ver Deuda técnica) — no hay campos de condición de venta/lista de precios/descuento todavía. |
| **Historial de Ventas** | Vive colgado del cliente (dentro de su ficha), no es una sección independiente en el Toolbar. Los datos son 100% mock (`ventasDemo.js`) hasta que exista una colección real de ventas. |
| **Ventas por producto** | `VENTAS_DEMO` es un dataset **global** (no está filtrado por cliente en el mock — todos los clientes ven las mismas 34 ventas). `estadisticasProducto.js` reutiliza ese mismo dataset filtrando por nombre de producto. Cuando exista la colección real, ambas vistas (Historial de cliente y Ventas de producto) deberían consultar la **misma fuente**, cada una con su propio filtro (por cliente / por producto). |
| **Ventas por producto → solo período actual, no historial completo** | El toggle Semana/Mes **no** lista todas las semanas/meses con ventas — muestra solo la semana o el mes en curso (`obtenerVentasPeriodoActual()`). Se descartó a propósito la primera versión (que agrupaba y listaba TODO el historial) por ser un barrido innecesario del dataset completo cada vez que se abre el modal. |
| **Ventas por producto → NO es instantáneo en producción** | Hoy `obtenerVentasPeriodoActual()` es síncrono porque `VENTAS_DEMO` es un array en memoria — abrís el modal y el número aparece de una. Cuando esto se conecte a Firestore, deja de ser gratis: hay que ir a la base con un `where(fecha >= desde, fecha <= hasta)` acotado al período (ver patrón #7 abajo) y recién ahí sumar. **Avisar al usuario de esto explícitamente** al implementarlo: agregar estado de carga (`loading`) en `VentasProductoModal.jsx`, mismo patrón "Cargando…" que ya usan `ClientesList.jsx`/`ProductosList.jsx`. |
| **Precio en la factura se tipea a mano, línea por línea** | `FacturaForm` **no** busca el precio de un producto automáticamente. El campo `Pr.Unit.` es un input libre por ítem, igual que en la referencia (`Cant. / Código / Descripción / Pr.Unit. / Pr.Total`). Esto es a propósito: el flujo de "precio por cliente" (ver fila de arriba) todavía no existe, y no había que bloquear Facturación esperándolo. Cuando ese flujo exista, el punto de enganche natural es el `onBlur` del campo Código en `FacturaForm.jsx` (hoy solo autocompleta la `descripción` buscando en `productos`, se puede extender para sugerir también el precio). |
| **Sin condición de pago ni deuda en la factura** | La referencia tiene columnas `COND.PAGO` y `DEUDA $` (cuenta corriente, pagos parciales). **No se construyó** — toda factura de este módulo es un documento cerrado (cliente, ítems, IVA, total), sin seguimiento de cobros. Si en algún momento hace falta cuenta corriente de facturación, es un flujo nuevo a diseñar, no agregar campos sueltos a `FACTURA_VACIA`. |
| **Numeración de factura es un correlativo simple, no AFIP real** | `useFacturasFacturacion().siguienteNumero()` es un entero autoincremental global (mismo patrón que código de cliente/producto), formateado como `0001-00000001` por `formatearComprobante()`. La referencia calcula tipo de comprobante (A/B/C) y punto de venta según condición de IVA emisor/receptor — **eso no se implementó**. El campo `tipo` (Factura A/B/C) lo elige el usuario a mano en el form, no se infiere. |
| **Cliente en la factura puede no estar vinculado a un registro real** | Si el usuario tipea un nombre en el buscador de cliente sin elegir una sugerencia (ej. "Consumidor Final"), la factura guarda `clienteId: null` y solo el texto en `clienteNombre`. Esto es intencional — replica el uso real de la referencia, donde la mayoría de las facturas son a "CONSUMIDOR FINAL" sin cliente cargado. |

---

## Patrones establecidos (repetir, no reinventar)

### 1. Orquestador vs. presentación
Cada `*Tab.jsx` o `*Modal.jsx` de primer nivel **no dibuja UI compleja**, solo decide qué sub-componente mostrar según un estado de "vista". La UI real vive en componentes chicos y enfocados (`ClientesList`, `ClienteForm`, `ClienteDetalle`, `ProductosList`, `ProductoForm`, `ProductoDetalle`, `FacturasList`, `FacturaForm`, `FacturaDetalle`, `VentasList`, `VentaDetalle`, `VentaForm`).

> Antes de agregar lógica a un orquestador, preguntate: ¿esto es "qué mostrar" o es "cómo se ve"? Lo segundo va en un componente propio.

### 2. Navegación por breadcrumb, no por rutas
Clientes, Productos y el historial de ventas no usan React Router para sub-navegación — usan estado local (`vista` + un id) + `Breadcrumb.jsx`. Es intencional: son paneles dentro de una misma pestaña, no páginas distintas.

### 3. La fuente de verdad es Firestore, no el objeto seleccionado
Los orquestadores guardan **solo el id** (`clienteId`, `productoId`, `ventaId`), nunca el objeto completo. El objeto "actual" se deriva en cada render:

```jsx
const clienteActual = clienteId ? clientes.find(c => c.id === clienteId) : null;
```

Así, después de editar, la ficha muestra datos frescos sin re-fetch manual. `HistorialVentasModal` sigue el mismo patrón aunque las ventas todavía sean mock (`ventaActual = ventas.find(v => v.id === ventaId)`), para que el día que se conecte a Firestore no haya que tocar esa lógica.

> Si en algún punto un componente empieza a guardar una copia local de un objeto de Firestore "por las dudas", es un warning sign — probablemente debería guardar el id y derivar.

### 4. Datos mock aislados y reemplazables
`ventasDemo.js` es el único lugar que sabe que las ventas son inventadas. Los componentes de presentación reciben `ventas`/`venta` por props — no importan el mock directamente. Cuando exista la colección real, el cambio es reemplazar `useState(VENTAS_DEMO)` por un hook de Firebase en `HistorialVentasModal.jsx`, sin tocar `VentasList`, `VentaDetalle` ni `VentaForm`.

### 5. Un hook de Firebase por entidad, mismo molde que el resto del repo
`useClientesFacturacion()`, `useProductosFacturacion()` y `useFacturasFacturacion()` siguen el patrón ya usado en `useClientBalances`, `useTransferenciasClientes`, etc.: combinan `useFirestoreRealtime` (lectura en vivo) + `useFirestore` (CRUD) y exponen solo lo que el módulo necesita, más un correlativo (`siguienteCodigo()` / `siguienteNumero()`) calculado sobre la lista en vivo.

### 6. Impresión: un componente compartido, un `type` por documento nuevo
No se crean modales de impresión propios de Facturación. Se agregan funciones `renderXContent()` + una entrada en el dispatcher de `PrintDocument.jsx` (`type === 'venta'`, `type === 'ventasResumen'`, `type === 'factura'`), reusando el shell de modal, los estilos de impresión y el selector de "hoja completa / media hoja / media hoja x2" que ya tiene el resto de la app.

> Antes de armar un modal de impresión nuevo, revisar si agregar un `type` a `PrintDocument.jsx` alcanza — casi siempre alcanza.

### 7. Agregaciones: acotar por rango, no traer todo y agrupar en el cliente
`estadisticasProducto.js` calcula **solo el período pedido** (semana actual o mes actual), no arma un historial completo de todas las semanas/meses. El filtro de fecha corta el dataset ANTES de mirar los items de cada venta (`if (venta.fecha < desde || venta.fecha > hasta) continue`).

Esto no es solo una optimización — es el diseño que corresponde a cómo se va a resolver con datos reales: `desde`/`hasta` se traducen directo a un `where()` de Firestore acotado, en vez de traer toda la colección de ventas y agrupar en el cliente. Diseñar la función mock ya pensando en esa query evita tener que rediseñar la interfaz cuando se conecte de verdad.

> Antes de agregar una vista de "historial completo por período" (todas las semanas, todos los meses), confirmar que hace falta — la mayoría de los pedidos de este tipo en realidad quieren saber "¿cómo voy este período?", no un reporte histórico completo. Si en algún momento sí hace falta el historial completo, va a necesitar paginación o un rango acotado por el usuario (ej. últimos 3 meses), no "traer todo".

> Para renderizar valores simples (un número grande, una tarjeta), no hace falta ninguna librería de gráficos — `VentasProductoModal.jsx` no usa ninguna. Si en el futuro se necesita un gráfico real (varias series, tooltips), seguir el patrón de barras con `<div style={{ width: '${pct}%' }}>` que ya usa `ReportesGraficos.jsx`, sin sumar una dependencia nueva salvo que el caso lo justifique (ejes múltiples, zoom, etc.).

### 8. Buscador con autocompletar sobre una lista en vivo (no un `<select>`)
El campo Cliente de `FacturaForm.jsx` no es un `<select>` con todos los clientes — es un input de texto que filtra `clientes` (de `useClientesFacturacion()`) mientras se escribe, muestra hasta 6 sugerencias en un dropdown posicionado absoluto, y cierra al hacer click afuera (`useRef` + listener de `mousedown`, mismo mecanismo que ya usa el selector de proveedor en `MercaderiaTab.jsx`). Si el usuario no clickea ninguna sugerencia, el texto queda como `clienteNombre` libre sin `clienteId` — ver decisión de producto "Cliente en la factura puede no estar vinculado a un registro real".

> Reutilizar este patrón (input + dropdown filtrado + click-outside) para cualquier selector futuro que busque sobre una colección que puede crecer mucho — un `<select>` nativo no escala a cientos de clientes/productos.

---

## Deuda técnica conocida

| Qué | Dónde | Por qué no se resolvió aún |
|---|---|---|
| Estilos de tabla `th`/`td` duplicados | `VentasList.jsx`, `VentaDetalle.jsx`, `VentaForm.jsx` (parcial), `ClientesList.jsx`, `ProductosList.jsx`, `FacturasList.jsx`, `FacturaDetalle.jsx` | Se detectó en revisión pero no se extrajo todavía — cada módulo nuevo lo repite, candidato directo para el próximo refactor DRY |
| Tabla "buscador + orden por fecha + paginación + selección + imprimir resumen" duplicada 2 veces completas | `VentasList.jsx` y `FacturasList.jsx` son casi idénticas (mismo estado `busqueda/ordenFecha/pagina/seleccionadas`, misma lógica de checkbox-header, mismo footer de paginación) | Se copió tal cual para no bloquear la entrega de Facturación con un refactor genérico a mitad de camino. Es el candidato **más claro** de todo el módulo para un `useListaConSeleccion()` hook + un `<TablaSeleccionable>` genérico — ver "Próximos candidatos" |
| Editor de líneas (`items` dinámicos) duplicado 2 veces | `VentaForm.jsx` y `FacturaForm.jsx` tienen cada uno su propio "agregar/quitar fila con Cant./Descripción/Precio" | Son parecidos pero no iguales (Factura tiene Código + IVA, Venta no). Con 2 instancias todavía no se abstrajo (regla de tres) — si aparece un tercer editor de líneas similar, ahí sí extraer un componente genérico |
| `ReadField` duplicado | `ClienteDetalle.jsx` y `ProductoDetalle.jsx` tienen el mismo componente copiado | Mismo motivo que el de arriba — candidato para mover a `clientes/FormSection.jsx` o un archivo común nuevo |
| `ventasDemo.js` ancla las fechas en "hoy" (`new Date()`), no en una fecha fija | `clientes/ventas/ventasDemo.js` | Antes anclaba en `2026-05-20` fijo — con eso, apenas pasara esa fecha, "Ventas por producto" (que filtra por semana/mes actual) siempre iba a estar vacío. Se cambió a relativo para que el mock siga siendo útil sin importar cuándo se lo mire. Si esto rompe algo que dependía de fechas fijas, es la causa. |
| `VentasProductoModal.jsx` no tiene estado de carga | `productos/VentasProductoModal.jsx` | Hoy no hace falta (cálculo síncrono en memoria) pero **es deuda a propósito**: cuando se conecte a Firestore, esta pantalla va a tardar (query + agregación) y hoy no tiene skeleton/spinner. No copiar el componente tal cual al conectar datos reales — agregar `loading` primero. |
| Historial de ventas es 100% mock, editable solo en memoria | `ventasDemo.js`, estado local en `HistorialVentasModal.jsx` | La lógica real de ventas todavía no existe en la app — se construyó la UI primero a pedido explícito. Los cambios que hagas ahí **no persisten** al cerrar el modal. |
| `CLIENTE_DEMO` hardcodeado en `ClientesTab.jsx` | `ClientesTab.jsx` | Es una utilidad de desarrollo (botón "Cargar cliente de ejemplo" solo visible con lista vacía) — sacar cuando ya no haga falta sembrar datos a mano |
| `Datos Facturación` (tab del cliente) fue removida | — | Documentado en "Decisiones de producto" arriba, no es un olvido |
| Facturación sin cuenta corriente / cobros | `facturas/` | Documentado en "Decisiones de producto" arriba — decisión explícita, no un olvido. Si se pide, es un flujo nuevo (pagos parciales, estado de deuda por factura), no un campo suelto. |
| Precio de factura sin conexión a "precio por cliente" | `FacturaForm.jsx` | Sigue pendiente el flujo de precios por cliente (ver fila de arriba en Decisiones). Cuando exista, conectar en el `onBlur` del campo Código, igual que hoy se autocompleta la descripción. |

---

## Checklist para el próximo refactor

Usar esto como filtro antes de agregar código nuevo al módulo:

- **DRY** — ¿este bloque de estilo/lógica ya existe en otro archivo de `facturacion/`? Si sí, extraer a un compartido (`FormSection.jsx` y `Breadcrumb.jsx` son el ejemplo a seguir) en vez de copiar y pegar.
- **KISS** — ¿el componente nuevo hace una sola cosa? Si un `*List.jsx` empieza a manejar también el detalle o el modal, separarlo.
- **YAGNI** — ¿estoy agregando un campo/tab/sección "por si después se necesita"? Si no hay un pedido concreto, no. `Datos Facturación` y el precio en `ProductoForm` se sacaron por esta razón — mejor vacío-y-ausente que vacío-y-presente.
- **Fuente de verdad** — ¿estoy guardando un objeto completo en estado local cuando podría guardar solo el id y derivarlo de la lista en vivo? (ver patrón #3 arriba).
- **Mock aislado** — si estoy construyendo UI antes que la lógica real, ¿el mock vive en su propio archivo y se pasa por props, o quedó importado directo dentro del componente de presentación?
- **Impresión** — ¿necesito un modal nuevo o alcanza con un `type` más en `PrintDocument.jsx`? (ver patrón #6).

---

## Próximos candidatos (en orden sugerido)

1. Extraer `VentasList.jsx`/`FacturasList.jsx` a un patrón compartido (hook `useListaConSeleccion` + componente `<TablaSeleccionable>`) — ya hay 2 copias casi idénticas, es el refactor de mayor impacto disponible hoy.
2. Definir el flujo de **precios por cliente** — es el bloqueador real para que Facturación deje de requerir tipear el precio a mano en cada línea. Probablemente una nueva sub-sección dentro de la ficha de cliente, no dentro de Productos.
3. Extraer estilos `th`/`td` y `ReadField` compartidos (`facturacion/tableStyles.js`, `facturacion/ReadField.jsx`) — hoy repetidos en varios archivos, y `facturas/` sumó dos más.
4. Reemplazar `ventasDemo.js` por datos reales cuando exista la colección de ventas en Firestore (`useVentasFacturacion()`, mismo molde que clientes/productos/facturas) — ese cambio alimenta a la vez Historial de Ventas del cliente **y** Ventas por Producto, ver patrón "Ventas por producto" arriba.
5. Sacar `CLIENTE_DEMO` y el botón de seed una vez que haya datos reales cargados.
6. Si en algún momento se necesita cuenta corriente en Facturación (cobros parciales, DEUDA $ por factura), diseñarlo como flujo nuevo — no forzarlo dentro de `FacturaForm.jsx` tal como está.
