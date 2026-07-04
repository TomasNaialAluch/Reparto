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
├── FacturacionTab.jsx                              ← orquestador de VENTANAS (no de vista lista/ver/form, ver patrón #9)
├── facturas/
│   ├── FacturasList.jsx                            ← tabla (Fecha, Comprobante, Cliente, Total $) + buscador + orden +
│   │                                                    paginación + selección + imprimir resumen + "Nueva Factura"
│   ├── FacturaForm.jsx                              ← alta/edición: buscador de cliente con autocompletar,
│   │                                                    items dinámicos, % IVA único (default 0, admite negativo), subtotal/total en vivo
│   ├── FacturaDetalle.jsx                           ← ficha de solo lectura + Imprimir + Editar
│   ├── FacturaWindow.jsx                            ← shell de ventana flotante (título, minimizar, cerrar, arrastre)
│   ├── FacturasTaskbar.jsx                          ← barra inferior con las ventanas minimizadas
│   ├── useFacturaWindows.js                         ← estado de todas las ventanas abiertas (ver patrón #9)
│   ├── HistorialPrecioClienteModal.jsx              ← modal chico: precios anteriores de un producto para ESE cliente
│   └── historialPreciosDemo.js                      ← mock del historial de precios (ver "Modelo de datos futuro" abajo)
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
| **Precio en la factura se tipea a mano, con historial de ayuda por "+"** | `Pr.Unit.` sigue siendo un input libre — no se autocompleta solo. Pero apretando **+** ahí (o el botón `+` al lado del campo) se abre `HistorialPrecioClienteModal`, que muestra los últimos precios que se le cobraron a **ese cliente específico** por **ese producto específico**, y un click en una fila carga ese precio. Hoy el historial es 100% mock (`historialPreciosDemo.js`) — ver la sección "Modelo de datos futuro" para cómo se resuelve con datos reales. |
| **Cliente por código, con salto de foco tipo grilla clásica** | `FacturaForm` tiene un campo `Cód. Cliente` (además del buscador por nombre existente). Escribir un código y tocar Tab busca el cliente en la lista en vivo, autocompleta la Razón Social, y manda el foco directo a la `Cantidad` del primer ítem — sin pasar por el campo Razón Social en el medio. Ver patrón #10. |
| **Sin condición de pago ni deuda en la factura** | La referencia tiene columnas `COND.PAGO` y `DEUDA $` (cuenta corriente, pagos parciales). **No se construyó** — toda factura de este módulo es un documento cerrado (cliente, ítems, IVA, total), sin seguimiento de cobros. Si en algún momento hace falta cuenta corriente de facturación, es un flujo nuevo a diseñar, no agregar campos sueltos a `FACTURA_VACIA`. |
| **Numeración de factura es un correlativo simple, no AFIP real** | `useFacturasFacturacion().siguienteNumero()` es un entero autoincremental global (mismo patrón que código de cliente/producto), formateado como `0001-00000001` por `formatearComprobante()`. La referencia calcula tipo de comprobante (A/B/C) y punto de venta según condición de IVA emisor/receptor — **eso no se implementó**. El campo `tipo` (Factura A/B/C) lo elige el usuario a mano en el form, no se infiere. |
| **Cliente en la factura puede no estar vinculado a un registro real** | Si el usuario tipea un nombre en el buscador de cliente sin elegir una sugerencia (ej. "Consumidor Final"), la factura guarda `clienteId: null` y solo el texto en `clienteNombre`. Esto es intencional — replica el uso real de la referencia, donde la mayoría de las facturas son a "CONSUMIDOR FINAL" sin cliente cargado. |
| **% IVA por defecto es 0, y acepta negativos** | `IVA_DEFAULT = 0` en `constants.js` — no toda factura lleva IVA, así que arrancar en 21% forzaba a borrar el valor en el caso común. El input no tiene `min`, así que también acepta valores negativos (por ejemplo, para modelar una bonificación general como IVA negativo). El cálculo (`total = subtotal * (1 + ivaPct/100)`) ya soporta ambos casos sin cambios adicionales. |
| **Redondeo de boleta al millar (informal, no AFIP)** | Argentina no tiene circulante chico para dar vuelto — no es la "Ley de Redondeo" de 2004 (esa habla de 5 centavos, hoy irrelevante por la inflación). Es una convención comercial informal moderna. Implementado en `FacturaDetalle.jsx`: botón **"Redondear"** (manual, no automático) que redondea el total **hacia arriba, al millar más cercano** (`roundUpToThousand()` en `utils/money.js`, ej. $1.783.350 → $1.784.000), a favor del comercio. Afecta **solo lo impreso** (`totalImpreso`/`redondeoAplicado` que se le pasan a `PrintDocument`) — el `total` real guardado en la factura (Firestore) no cambia nunca. Si en algún momento se pide otro múltiplo (100/50) o redondeo a favor del cliente, es un cambio de UI simple (el cálculo ya está aislado en una sola función), pero **no asumir eso sin repreguntar** — esta decisión fue explícita del usuario. |

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

> **Bug corregido (no específico de Facturación, pero se encontró acá):** las clases `.print-header`, `.print-table`, `.print-item`, etc. que usan todos los `renderXContent()` de `PrintDocument.jsx` **solo tenían estilo dentro del `<style>` que se inyecta en la ventana de impresión real** (`getStylesForType()` en `handlePrint()`). La vista previa en pantalla (el modal que se ve antes de imprimir) no tenía NINGÚN CSS para esas clases — por eso las tablas de factura/venta se veían apretadas y sin bordes en el modal. Se agregó `src/index.css` → bloque `.pd-preview` (fuera de `@media print`, para que aplique siempre en pantalla) con una versión legible de esos mismos estilos, y se envolvió el contenido renderizado en `PrintDocument.jsx` con `<div className="pd-preview">`. El output de impresión real (la ventana que abre `window.open`) no se tocó — sigue usando su propio `<style>` inyectado, sin relación con `.pd-preview`.
>
> Es **deuda a propósito, no un espejo automático**: `.pd-preview` en `index.css` y `getStylesForType()` en `PrintDocument.jsx` son dos hojas de estilo separadas que buscan verse parecidas pero no están generadas de la misma fuente. Si se cambia el look de un `print-table`/`print-header`/etc en una, revisar si conviene actualizar la otra también.

> **Bug corregido — `PrintDocument.jsx` y `HistorialPrecioClienteModal.jsx` ahora usan `createPortal(..., document.body)`.** Causa: `FacturaWindow.jsx` centra la ventana con `transform: translate(-50%, -50%)`. En CSS, cualquier elemento con `transform` distinto de `none` pasa a ser el "containing block" de sus descendientes `position: fixed` — o sea, un modal `fixed` renderizado *adentro* de una `FacturaWindow` deja de centrarse contra la pantalla y se centra contra la ventana flotante (angosta, no centrada), y encima queda recortado por el `overflow: hidden` de la ventana. Por eso, al abrir "Imprimir" o el historial de precios desde adentro de una factura, se veía todo corrido y cortado. La solución estándar de React para este problema es un **portal**: `createPortal(<>...</>, document.body)` saca el modal del árbol DOM de `FacturaWindow` (aunque siga viviendo en el mismo lugar del árbol de React, con el mismo estado/contexto) y lo cuelga directo de `<body>`, donde no hay ningún ancestro con `transform` que lo capture.
>
> **Cualquier modal `position: fixed` que se renderice adentro de una `FacturaWindow` (o de cualquier otro contenedor con `transform`) tiene que usar `createPortal` a `document.body`.** Si en el futuro se agrega otro modal dentro del flujo de facturas (por ejemplo, el componente de impresión de facturas dedicado que se va a construir más adelante — ver nota abajo), aplicar el mismo patrón desde el principio, no esperar a que se rompa visualmente para darse cuenta.

> **Facturación va a tener su propio componente de impresión más adelante** (no seguir invirtiendo en pulir `renderFacturaContent()`/`renderFacturasResumenContent()` dentro de `PrintDocument.jsx` — hoy funcionan, pero está anticipado que se reemplacen por algo dedicado). Mientras tanto, el fix del portal de arriba aplica igual y hace falta para que lo actual no esté roto.

### 7. Agregaciones: acotar por rango, no traer todo y agrupar en el cliente
`estadisticasProducto.js` calcula **solo el período pedido** (semana actual o mes actual), no arma un historial completo de todas las semanas/meses. El filtro de fecha corta el dataset ANTES de mirar los items de cada venta (`if (venta.fecha < desde || venta.fecha > hasta) continue`).

Esto no es solo una optimización — es el diseño que corresponde a cómo se va a resolver con datos reales: `desde`/`hasta` se traducen directo a un `where()` de Firestore acotado, en vez de traer toda la colección de ventas y agrupar en el cliente. Diseñar la función mock ya pensando en esa query evita tener que rediseñar la interfaz cuando se conecte de verdad.

> Antes de agregar una vista de "historial completo por período" (todas las semanas, todos los meses), confirmar que hace falta — la mayoría de los pedidos de este tipo en realidad quieren saber "¿cómo voy este período?", no un reporte histórico completo. Si en algún momento sí hace falta el historial completo, va a necesitar paginación o un rango acotado por el usuario (ej. últimos 3 meses), no "traer todo".

> Para renderizar valores simples (un número grande, una tarjeta), no hace falta ninguna librería de gráficos — `VentasProductoModal.jsx` no usa ninguna. Si en el futuro se necesita un gráfico real (varias series, tooltips), seguir el patrón de barras con `<div style={{ width: '${pct}%' }}>` que ya usa `ReportesGraficos.jsx`, sin sumar una dependencia nueva salvo que el caso lo justifique (ejes múltiples, zoom, etc.).

### 8. Buscador con autocompletar sobre una lista en vivo (no un `<select>`)
El campo Cliente de `FacturaForm.jsx` no es un `<select>` con todos los clientes — es un input de texto que filtra `clientes` (de `useClientesFacturacion()`) mientras se escribe, muestra hasta 6 sugerencias en un dropdown posicionado absoluto, y cierra al hacer click afuera (`useRef` + listener de `mousedown`, mismo mecanismo que ya usa el selector de proveedor en `MercaderiaTab.jsx`). Si el usuario no clickea ninguna sugerencia, el texto queda como `clienteNombre` libre sin `clienteId` — ver decisión de producto "Cliente en la factura puede no estar vinculado a un registro real".

> Reutilizar este patrón (input + dropdown filtrado + click-outside) para cualquier selector futuro que busque sobre una colección que puede crecer mucho — un `<select>` nativo no escala a cientos de clientes/productos.

### 9. Facturas usa ventanas flotantes, NO el patrón lista/ver/form del resto del módulo
A pedido explícito: ver o crear una factura **no reemplaza el contenido de la pestaña** (a diferencia de Clientes y Productos). `FacturasList` queda siempre visible; cada factura abierta es una `FacturaWindow` flotante e independiente, con su propia barra de título, botón de minimizar y botón de cerrar. Varias pueden estar abiertas (o minimizadas) al mismo tiempo.

**Dónde vive el estado:** `useFacturaWindows.js`, un hook con un array `ventanas` de objetos `{ key, facturaId, vista, minimized, zIndex }`. `key` es el identificador de la ventana (no de la factura — permite, en teoría, tener dos ventanas apuntando a la misma factura, aunque `abrirVentana()` evita esto a propósito reenfocando la existente en vez de duplicar). `facturaId` es `null` mientras se está creando una factura nueva.

**Por qué se guarda `key` y no directamente el índice del array:** el usuario puede cerrar una ventana del medio; si se usara el índice como identificador, cerrar la ventana 2 correría el índice de la ventana 3 y rompería referencias activas (el mismo motivo por el que las listas de React usan `key` estable en vez de índice).

**z-index acotado a propósito (900+):** ver el comentario en `useFacturaWindows.js`. `PrintDocument.jsx` es compartido con toda la app y tiene z-index fijo en 1050/1051; mientras las ventanas de factura se mantengan en un rango por debajo de eso, el modal de impresión (abierto desde adentro de una ventana) siempre queda arriba sin tocar `PrintDocument.jsx`. Si en algún momento se necesitan más de ~150 ventanas abiertas en una sesión (no va a pasar), hay que revisar este rango.

**Alcance de la persistencia:** el estado de las ventanas vive en `FacturacionTab.jsx`. Si el usuario cambia a la pestaña Clientes o Productos y vuelve, `FacturacionTab` se desmonta y **las ventanas abiertas/minimizadas se pierden**. Es una decisión de scope, no un bug — persistir ventanas entre pestañas requeriría subir este estado a `Facturacion.jsx` (o más arriba) y no se pidió.

**Arrastre (drag) desde la barra de título:** la posición NO se guarda en `useFacturaWindows.js` — es estado 100% local dentro de cada `FacturaWindow.jsx` (`pos`, `dragging`). Mientras `pos` es `null`, la ventana usa la posición inicial centrada + offset en cascada (prop `offset`); al primer arrastre, `pos` pasa a coordenadas absolutas en píxeles y desde ahí la ventana deja de seguir el offset en cascada. El arrastre está acotado con `clamp()` a un margen mínimo visible (`MARGEN_VISIBLE = 60px`) para que no se pueda perder la ventana fuera de la pantalla. Los listeners de `mousemove`/`mouseup` se agregan/sacan del `window` dentro de un `useEffect` atado a `dragging`, no de forma imperativa en el handler — así el cleanup es automático incluso si el componente se desmonta a mitad de un arrastre.

> Por qué la posición no vive en el hook: la posición es un detalle puramente visual de una ventana individual, no algo que otras partes del sistema necesiten leer (a diferencia de `minimized` o `vista`, que si afectan qué se renderiza). Mantenerla local evita re-renders del array completo de ventanas en cada pixel de movimiento del mouse.

**Título de la ventana = nombre del cliente, no el número de comprobante.** Es al revés de lo que se podría asumir por defecto (mostrar el N° de factura como título): el pedido fue explícito — con varias ventanas minimizadas hay que poder identificar cuál es cuál por cliente, no por número de comprobante. El comprobante formateado (`formatearComprobante`) pasó a ser el **subtítulo** chico arriba del nombre.

Mientras se está creando o editando una factura (`vista === 'form'`), el nombre todavía no existe como registro guardado — `FacturaForm` reporta cada cambio del campo Cliente hacia arriba vía la prop `onClienteChange`, y `FacturacionTab` lo guarda en `ventana.clienteNombreBorrador` (mismo mecanismo de "estado por ventana" que ya usa `actualizarVentana`). `labelVentana()` prioriza ese borrador sobre el nombre ya guardado en la factura, así el título se actualiza en vivo mientras se tipea, antes incluso de guardar.

**Atajo de teclado — tecla "-" minimiza la ventana activa.** `FacturacionTab.jsx` tiene un único listener de `keydown` a nivel `window` (no uno por ventana) que, al detectar `-`, minimiza la ventana **con mayor `zIndex`** entre las abiertas (o sea, la que está al frente / la última que se tocó — mismo criterio que ya usa `enfocarVentana`). Antes de actuar, chequea `document.activeElement.tagName`: si es `INPUT`/`TEXTAREA`/`SELECT`, no hace nada y deja que el guión se escriba normal.

> **Por qué el chequeo de `activeElement` es obligatorio acá, no opcional:** el campo `% IVA` admite valores negativos (`IVA_DEFAULT = 0`, ver Decisiones de producto). Sin este chequeo, tipear `-5` en ese campo minimizaría la ventana en vez de escribir el guión. Cualquier atajo de teclado nuevo que se agregue a nivel ventana tiene que pasar por el mismo filtro — no asumir que "estás en la ventana" significa "no estás editando un campo".

> Este patrón es exclusivo de `facturas/`. No migrar Clientes/Productos a ventanas sin que se pida explícitamente — lista/ver/form sigue siendo el patrón por defecto del módulo (ver patrones #1-#3).

### 10. Carga rápida por teclado con Tab "hijackeado" (estilo grilla de facturación clásica)
`FacturaForm.jsx` reproduce el flujo de carga rápida de la referencia (todo con teclado, sin tocar el mouse):

1. **Cód. Cliente + Tab** → busca en `clientes` (prop) por código, autocompleta Razón Social, y salta el foco directo a la `Cantidad` del primer ítem — **saltea** el campo Razón Social en el orden de tabulación.
2. **Código del ítem + Tab** → busca en `productos` (prop) por código, autocompleta `Descripción` (queda editable con click, se imprime tal cual en el comprobante), y salta el foco directo a `Pr.Unit.` — **saltea** Descripción.
3. **Pr.Unit.**: la tecla **+** abre `HistorialPrecioClienteModal` (también hay un botón al lado con `IconHistory`, para quien no use teclado — **no** un ícono `+`, ver nota abajo). **Tab** avanza a la `Cantidad` de la fila siguiente; si era la última fila, primero agrega una fila nueva (`addItem()`) y recién ahí enfoca — el input de la fila nueva no existe en el DOM hasta el próximo render, así que el foco pendiente se resuelve en un `useEffect` atado a `formData.items.length` (`pendingFocusRowRef`), no de forma síncrona en el mismo handler.

**Técnica:** cada campo intercepta `onKeyDown`; si es `Tab` sin `Shift`, hace `e.preventDefault()`, corre la lógica de autocompletar, y mueve el foco a mano con una matriz de refs (`itemRefs.current[i] = { cantidad, codigo, precioUnit }`). No se usa `tabIndex` — el orden deseado no coincide con el orden visual de los campos (hay que *saltear* Razón Social y Descripción), así que el único lugar donde se puede resolver es interceptando el evento.

> Si un código de cliente o de producto no matchea ningún registro existente, hoy **no hay feedback visual** — el flujo sigue igual sin autocompletar nada, a propósito, para no trabar la carga rápida. Si se necesita avisar (ej. resaltar el campo), agregarlo sin bloquear el `Tab`.

> **Ícono vs. tecla:** el botón que abre el historial de precios usa `IconHistory` (el mismo reloj/historial que ya usa el resto de la app), no un ícono `+`. Es a propósito — el ícono tiene que representar la **acción** ("ver historial"), no el atajo de teclado que también la dispara. La tecla `+` sigue funcionando igual, solo cambió el ícono del botón.

**`HistorialPrecioClienteModal.jsx` — navegación completa por teclado y mouse**, igual que la referencia:
- **↓ / ↑** mueve la fila seleccionada (resaltada en color, con `scrollIntoView({ block: 'nearest' })` para que la fila seleccionada nunca quede fuera del área visible).
- **Enter**, el botón azul "Usar precio", o **doble click** en una fila → confirma ese precio y lo carga en `Pr.Unit.` de la fila que abrió el modal.
- **Esc**, o click en el overlay (afuera del modal) → cierra sin elegir nada.
- Los listeners de teclado se agregan al `window` dentro de un `useEffect` mientras el modal está montado (se sacan solos al desmontar) — mismo criterio de cleanup que ya usa el arrastre de `FacturaWindow.jsx` (patrón #9).

---

## Modelo de datos futuro: Historial de Precios por Cliente-Producto

Esta es la pieza que falta para que Facturación deje de depender de tipear el precio a mano cada vez. Documentado en detalle porque es la próxima base de datos real a construir — no está implementada, `historialPreciosDemo.js` es 100% mock.

### Por qué existe esto
Ya se decidió (ver "Decisiones de producto") que el precio **no es del producto** — el mismo producto puede tener precios distintos según a quién se le vende. Por eso el historial de precios se indexa por el **par** (cliente, producto), no por producto solo.

### Colección propuesta: `facturacion_precios_historial`
Un documento por cada línea de factura que tuvo precio, con esta forma:

```js
{
  clienteId: string,          // ref a facturacion_clientes
  productoCodigo: string,     // snapshot del código al momento de facturar, NO una ref viva
  productoDescripcion: string,// snapshot de la descripción — ídem, no ref viva
  precioUnit: number,
  fecha: string,               // 'YYYY-MM-DD', la fecha de la factura
  facturaId: string,           // ref a facturacion_facturas
  numeroFactura: string,       // formateado (ej. "0001-00001234"), para no tener que ir a buscar la factura solo para mostrarlo
}
```

**Por qué snapshot de código/descripción y no una referencia viva al producto:** si mañana se renombra o recodifica un producto, el historial de precios de facturas viejas no tiene que cambiar retroactivamente — tiene que reflejar cómo se llamaba y qué código tenía en el momento en que se cobró ese precio. Mismo criterio que ya usa `VentaDetalle`/`FacturaDetalle`, que guardan los datos del ítem tal cual estaban al momento de la venta, no una referencia al producto actual.

**Por qué es una colección aparte y no un array embebido en el cliente o en el producto:** permite hacer una consulta acotada por `(clienteId, productoCodigo)` sin traer de más — mismo criterio que el patrón #7 (acotar por filtro/rango, no traer todo y filtrar en el cliente). Un array embebido en el documento del cliente crecería sin límite y obligaría a traer TODO el historial de TODOS los productos de ese cliente solo para mostrar el de uno.

### Cómo se llena
Cuando `useFacturasFacturacion().addFactura()` / `.updateFactura()` persistan una factura real, hay que agregar: por cada ítem de la factura que tenga `codigo` no vacío, un `addDocument` a `facturacion_precios_historial` con los campos de arriba. Esto pasa a ser parte del flujo de guardado de una factura, no un flujo separado.

> Ojo con la atomicidad: si el guardado de la factura sale bien pero el registro de historial de precio falla (o viceversa), quedan datos inconsistentes. Como mínimo, hacerlo best-effort con manejo de error explícito (no dejar que un fallo silencioso en el historial de precios rompa el guardado de la factura, que es lo importante). Si hace falta atomicidad real, evaluar una Cloud Function o una transacción de Firestore en ese momento — no antes.

### Cómo se consulta
`obtenerHistorialPrecio(clienteId, productoCodigo)` (hoy mock) se reemplaza por una query:

```js
query(
  collection(db, 'facturacion_precios_historial'),
  where('clienteId', '==', clienteId),
  where('productoCodigo', '==', productoCodigo),
  orderBy('fecha', 'desc'),
  limit(5)
)
```

> Firestore va a pedir un **índice compuesto** para `clienteId + productoCodigo + fecha` — hay que crearlo en la consola de Firebase (o dejar que el primer error en dev tire el link para crearlo automáticamente). Anotado acá para no perder tiempo debuggeando "por qué no anda" el día que se conecte.

La función real tiene que devolver la misma forma de salida que el mock (`{ fecha, precioUnit, numeroFactura }[]`) para no tener que tocar `HistorialPrecioClienteModal.jsx` — mismo patrón #4 (mock aislado y reemplazable).

### Cómo se relaciona con las 3 entidades que ya existen

```
Cliente (facturacion_clientes)
   │ 1
   │
   │ N
Historial de Precios (facturacion_precios_historial)  ← filtrado por (clienteId, productoCodigo)
   │ N
   │
   │ 1 (snapshot, no ref viva)
Producto (facturacion_productos)

Factura (facturacion_facturas)
   │ 1
   │ contiene (embebido, no colección aparte)
   │ N
   items[] de la factura ── por cada item con código: genera 1 doc en Historial de Precios
```

- **Cliente → Historial de Precios**: uno a muchos, por `clienteId`.
- **Producto → Historial de Precios**: uno a muchos, pero por **snapshot** de código/descripción, no por una referencia vigente al documento del producto.
- **Factura → Historial de Precios**: cada ítem de una factura con `codigo` genera (potencialmente) un registro nuevo de historial. Los ítems de la factura en sí siguen embebidos dentro del documento de la factura (`items: []`), no se separan en su propia colección — el historial de precios es una **proyección derivada** de esos ítems, pensada para consultarse distinto (por cliente+producto en vez de por factura).

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
| Ventanas de factura no persisten al cambiar de pestaña (Clientes/Productos) | `useFacturaWindows.js`, montado dentro de `FacturacionTab.jsx` | Decisión de scope explicada en patrón #9. Si se pide que las ventanas sobrevivan al cambiar de pestaña, el estado tiene que subir a `Facturacion.jsx` (o a un contexto), no quedarse local a `FacturacionTab`. |
| Ventanas flotantes no son redimensionables | `FacturaWindow.jsx` | Son arrastrables desde la barra de título (ver patrón #9), pero el tamaño es fijo (`min(640px, 94vw)`). No se pidió redimensionar — si hace falta, agregar un handle en la esquina inferior derecha con la misma técnica de `mousedown/mousemove` que ya usa el drag. |
| `historialPreciosDemo.js` es 100% mock, no persiste nada | `facturas/historialPreciosDemo.js` | Ver sección "Modelo de datos futuro" arriba — es la próxima base de datos real a construir. El mock es determinístico (mismo cliente+producto siempre da los mismos precios de ejemplo) pero no refleja facturas reales. |
| `FacturaForm` no avisa si un código no matchea ningún cliente/producto | `FacturaForm.jsx` (`handleCodigoClienteKeyDown`, `handleCodigoItemKeyDown`) | Decisión deliberada para no trabar la carga rápida por teclado (ver patrón #10) — si hace falta feedback, agregarlo sin bloquear el `Tab`. |
| Listener de Firestore duplicado por cada ventana de factura — **ya resuelto** | ~~`FacturaForm.jsx`~~ | Se detectó que `FacturaForm` llamaba a `useClientesFacturacion()`/`useProductosFacturacion()` directamente, abriendo un `onSnapshot` nuevo por cada ventana abierta. Se corrigió: `FacturacionTab.jsx` los llama una sola vez y los pasa por props (mismo patrón que ya usan `List`/`Form`/`Detalle` en Clientes y Productos). Queda anotado como recordatorio de la regla: **los hooks de Firebase se llaman en el `*Tab.jsx`, nunca en un componente de presentación**. |

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

1. Construir la colección real `facturacion_precios_historial` — es el bloqueador real para que Facturación deje de depender de tipear/adivinar el precio en cada línea. Diseño completo en "Modelo de datos futuro" arriba; incluye el índice compuesto de Firestore que hay que crear.
2. Extraer `VentasList.jsx`/`FacturasList.jsx` a un patrón compartido (hook `useListaConSeleccion` + componente `<TablaSeleccionable>`) — ya hay 2 copias casi idénticas.
3. Extraer estilos `th`/`td` y `ReadField` compartidos (`facturacion/tableStyles.js`, `facturacion/ReadField.jsx`) — hoy repetidos en varios archivos, y `facturas/` sumó dos más.
4. Reemplazar `ventasDemo.js` por datos reales cuando exista la colección de ventas en Firestore (`useVentasFacturacion()`, mismo molde que clientes/productos/facturas) — ese cambio alimenta a la vez Historial de Ventas del cliente **y** Ventas por Producto, ver patrón "Ventas por producto" arriba.
5. Sacar `CLIENTE_DEMO` y el botón de seed una vez que haya datos reales cargados.
6. Si en algún momento se necesita cuenta corriente en Facturación (cobros parciales, DEUDA $ por factura), diseñarlo como flujo nuevo — no forzarlo dentro de `FacturaForm.jsx` tal como está.
