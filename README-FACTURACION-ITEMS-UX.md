# Exploración: UX de carga de ítems en Factura

Este doc es para **pensar opciones**, no una decisión tomada. Cuando se elija un camino, la decisión final y el porqué van a `README-FACTURACION.md` (sección de Decisiones de producto / Patrones), y este archivo se puede borrar o dejar como referencia histórica.

---

## El problema

Hoy (`FacturaForm.jsx`) cada ítem es una card con 4 campos apilados en 2 filas (Cant./Código/Descripción en una, Pr.Unit. en la otra) + botón eliminar, y **todos los ítems quedan siempre visibles y editables al mismo tiempo**, uno abajo del otro.

Con boletas de 4 ítems **ya hace falta scrollear** y se pierde de vista el total/los ítems anteriores. Una boleta real de 10 ítems sería inmanejable: mucho scroll, cero visión de conjunto, y el flujo de carga rápida por teclado (Tab → Tab → Tab, ver patrón #10 en `README-FACTURACION.md`) pierde sentido si no podés ver lo que ya cargaste.

## Cómo lo resuelve el sistema de referencia

En las capturas que pasaste se ve un patrón clásico de grilla de facturación:

- Hay **una sola fila activa** de carga (Cant. / Código / Descripción / Pr.Unit.), siempre en el mismo lugar.
- Al completar un ítem, sus datos **suben** y se acomodan como una fila más de una **tabla compacta de solo lectura** arriba (una línea por ítem, sin bordes de card, sin espacio desperdiciado).
- La fila activa se vacía y queda lista para el próximo ítem — nunca hay que scrollear para seguir cargando, y la tabla de arriba puede mostrar 10-15 ítems sin problema porque cada fila es angosta (una sola línea, sin el "aire" que ocupa hoy nuestra card de 2 filas).

En términos de UI: **"lista ya cargada" y "próximo ítem a cargar" son dos zonas visualmente distintas**, no una pila homogénea de cards todas iguales.

---

## Cómo arman la VENTANA COMPLETA de facturación otros programas

Esto es distinto a la grilla de ítems en sí — es cómo organizan toda la pantalla de "Nueva Factura": dónde va el cliente, dónde los ítems, si muestran una vista previa en vivo, etc. Tres patrones bien distintos aparecen en programas reales:

### Patrón 1 — Formulario + tabla de ítems + totales, todo en una columna (Odoo, y la mayoría de ERPs contables)

La [documentación oficial de Odoo](https://www.odoo.com/documentation/18.0/applications/finance/accounting/customer_invoices.html) describe la pantalla de "Customer Invoice" así: arriba los datos del cliente/fecha/condición de pago, debajo una sección **"Invoice Lines"** que es una tabla editable con un link **"Add a line"** al final (click para agregar fila — no una fila fantasma automática, un botón), y los totales calculados abajo del todo. Todo en una sola columna vertical, sin panel de vista previa.

**Es básicamente el mismo esqueleto que ya tiene nuestro `FacturaForm.jsx`** (Comprobante arriba → Ítems en el medio → Totales abajo). La diferencia entera está en CÓMO se agregan las filas de ítems (ahí sí aplica toda la investigación de la sección de abajo: fila fantasma vs. botón).

**Y acá está la respuesta concreta a "con 4 productos ya ocupa un montón de espacio":** el truco técnico de Odoo (documentado como `editable="bottom"` en su sistema de vistas, ver [foro Odoo](https://www.odoo.com/forum/help-1/inline-editable-treeview-61157)) es que la tabla de ítems **es una sola tabla compacta todo el tiempo — no hay una card por ítem**. Cada fila mide **una sola línea de alto** cuando no se está editando (texto plano: cantidad, código, descripción, precio, en columnas, sin bordes de card, sin padding de formulario). Recién cuando hacés click en una fila (cualquiera, no solo la última) **esa fila en particular** se "infla" y sus celdas se convierten en inputs editables, in-place, sin mover ni ocultar las demás filas. Al salir de esa fila (Tab, click afuera, guardar), vuelve a colapsarse a texto plano de una línea.

Esto es **distinto y mejor** que lo que planteé como "Opción A" más abajo (que asumía dos zonas separadas: una tabla de solo lectura arriba + una fila activa fija abajo). El mecanismo real de Odoo es más simple:

- **No hay dos zonas.** Es una sola tabla, siempre.
- **Todas las filas ocupan lo mismo** (una línea), estén "guardadas" o no — por eso 4, 10 o 20 ítems no cambian de tamaño de fila, solo se agrega alto de tabla (que si hace falta, scrollea con `maxHeight`, como ya hacemos en `VentasList`/`FacturasList`).
- **Solo una fila a la vez tiene inputs de verdad** — la que estás tocando. El resto son `<td>` con texto simple, sin ningún `<input>` montado (esto es lo que realmente ahorra espacio Y rendimiento: hoy tenemos 4 `<input>` DOM por ítem, siempre montados, aunque no los estés mirando).

> Esto resuelve directamente la pregunta "cómo hace Odoo para que 4 productos no ocupen un montón de espacio": **no ocupan más espacio que 4 líneas de texto**, porque no son 4 formularios abiertos — son 4 líneas de una tabla, y el formulario (los inputs) solo existe temporalmente sobre la fila que estás editando en ese momento.

### Patrón 2 — Split screen: formulario editable a un lado, vista previa del PDF real en vivo del otro lado (Invoice Ninja)

En Invoice Ninja, la pantalla de diseño/edición de factura está **dividida en dos secciones: arriba las opciones de edición, abajo una vista previa del PDF en tiempo real** que se actualiza mientras editás. El usuario ve exactamente cómo va a quedar el comprobante impreso mientras lo arma, no tiene que imprimir/exportar para comprobarlo.

**Nosotros NO hacemos esto** — `FacturaForm.jsx` (edición) y `PrintDocument.jsx` (vista previa de impresión) son dos pantallas separadas; la vista previa solo aparece si tocás "Imprimir" después de guardar. Agregar un panel de preview en vivo tipo Invoice Ninja sería un cambio grande (básicamente correr `renderFacturaContent()` de `PrintDocument` en paralelo, actualizado en cada tecla) — no parece que haga falta para el caso de uso actual (carga rápida, no diseño de comprobante), pero queda anotado como opción si en algún momento importa "ver cómo queda" mientras se carga.

### Patrón 3 — Separar el modo "diseñar plantilla" del modo "cargar datos" (QuickBooks Online)

QuickBooks Online separa completamente dos cosas: una pantalla de **personalización de plantilla** (colores, logo, qué campos aparecen — se configura una sola vez) y la pantalla de **carga de una factura puntual** (elegís cliente, cargás ítems, con la plantilla ya definida de fondo). No mezclan "cómo se ve" con "qué datos tiene esta factura en particular".

**Esto es exactamente lo que ya tenemos, sin haberlo buscado a propósito:** `FacturaForm`/`FacturaDetalle` son 100% carga de datos (sin preocuparse por diseño), y `PrintDocument.jsx` es donde vive el "cómo se ve" (una sola vez, compartido por toda la app, no por factura). Vale la pena confirmarlo como algo bueno de la arquitectura actual, no algo a cambiar.

### Conclusión de esta parte

La estructura general de nuestra ventana de factura (form arriba, ítems en el medio, totales abajo, preview aparte al imprimir) **ya coincide con cómo lo arman Odoo y QuickBooks** — dos de los programas más usados en el mundo para esto. El problema real que tenemos (y en el que vale la pena seguir invirtiendo) es específicamente la grilla de ítems en el medio, no la ventana entera. Ahí es donde sigue aplicando toda la investigación de abajo.

---

## Cómo lo resuelven otros programas para la grilla de ítems en particular

### El patrón de la referencia tiene nombre: "New Item Row" / fila fantasma

Lo que hace el sistema de referencia (una fila vacía siempre al final, que se "vuelve real" apenas empezás a tipear y dispara una fila vacía nueva debajo) es un patrón conocido en librerías de grillas de escritorio — Telerik/DevExpress lo llaman **"New Item Row"** en sus controles `DataGrid` de WPF/.NET. Es exactamente el mecanismo de Excel/Google Sheets: la última fila de una tabla siempre está "abierta", y al escribir en ella se confirma y aparece una nueva fila vacía a continuación.

**Ojo con la crítica que le hacen:** en una discusión pública sobre este patrón ([LibrePCB #1424](https://github.com/LibrePCB/LibrePCB/issues/1424)) varios devs lo señalan como potencialmente confuso: *"es engañoso tener una fila que contiene datos pero que en realidad no está en la tabla — si la puedo ver, debería estar ya en la tabla"*. No es un patrón unánimemente considerado "bueno", es un trade-off: gana velocidad de carga, pierde algo de claridad sobre qué está "confirmado" y qué no. Vale la pena tenerlo en cuenta para la Opción A: hay que dejar clarísimo visualmente cuál es la fila todavía-no-confirmada vs. las ya cargadas (ej. fondo distinto, borde punteado).

### Cómo lo resuelven las apps de facturación modernas (SaaS)

Googleando **QuickBooks Online** y **Zoho Books** — que son probablemente los dos sistemas de facturación más usados del mundo — ninguno de los dos usa el patrón de "fila fantasma siempre visible". Los dos usan un **botón explícito**:
- QuickBooks Online: botón **"Add lines"** debajo de la última línea cargada.
- Zoho Books: botón **"+ Add New Row"**, y además **"Add Items in Bulk"** para cargar varios de una.

Dato interesante: hay un hilo de la comunidad de Zoho literalmente titulado **["Adding line items to invoices should be easier!"](https://help.zoho.com/portal/en/community/topic/adding-line-items-to-invoices-should-be-easier)** — o sea que ni siquiera un SaaS grande y pulido tiene esto 100% resuelto a gusto de todos los usuarios. Es una señal de que el problema es genuinamente difícil de resolver del todo, no que nos estemos complicando de más.

> Ninguno de los dos SaaS resuelve el problema de **visualización** con muchos ítems de la misma forma que la referencia (tabla compacta de solo lectura) — ahí la referencia (más vieja, pensada para carga 100% por teclado sin mouse) le gana en densidad a las apps modernas (pensadas más para mouse/touch, con menos ítems típicos por comprobante).

### Grillas tipo Excel en la web: el patrón formal (WAI-ARIA)

El [W3C WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) es la especificación de accesibilidad para construir widgets tipo "grilla editable" en la web (lo que usan por debajo Excel Online, Google Sheets, y librerías como AG Grid/Handsontable). El punto clave, y una diferencia importante con lo que ya construimos:

> **La navegación dentro de una grilla se hace con las flechas del teclado (↑↓←→), no con Tab.** Tab entra y sale de la grilla entera (como si fuera un widget), pero moverse entre celdas de la grilla usa flechas — según [UXPin](https://www.uxpin.com/studio/blog/keyboard-navigation-patterns-complex-widgets/), esto es "mucho más eficiente que la navegación lineal con Tab" para datasets grandes.

Esto es distinto a lo que hicimos en `FacturaForm.jsx` (patrón #10 de `README-FACTURACION.md`), donde interceptamos `Tab` para saltar entre Cantidad→Código→Pr.Unit. Funciona porque replica el sistema de referencia tal cual, pero **no es el patrón estándar de accesibilidad para grillas** — es una convención propia, más parecida a "formulario con atajos" que a "grilla real". Si en algún momento se migra a una tabla de verdad (Opción A o D, ver abajo), vale la pena evaluar si conviene pasar a navegación con flechas (más estándar, mejor soportada por lectores de pantalla) o mantener Tab (más simple de programar, ya funciona, el usuario ya está acostumbrado a él).

### Librerías de grilla editable ya armadas (Handsontable, AG Grid)

Existen componentes JS pensados exactamente para esto — grillas editables tipo planilla de cálculo, con navegación por teclado, copiar/pegar, validación por celda:
- **[Handsontable](https://handsontable.com/)** — el que más se parece a Excel en look & feel; foco en edición de datos, dropdowns, validación.
- **[AG Grid](https://rv-grid.com/blog/best-js-datagrid-in-2026)** — más pensado para grillas grandes con filtros/agrupación/pivoteo, features de nivel "planilla empresarial".

**No recomiendo sumar ninguna de las dos por ahora** — son librerías grandes (impactan bundle size) pensadas para grillas con muchas más funciones de las que necesita una factura (no hace falta pivotear ni agrupar líneas de una boleta). Coherente con el patrón #7 de `README-FACTURACION.md` ("no sumar una dependencia nueva salvo que el caso lo justifique") — para 10-15 líneas de factura, una tabla HTML + inputs a mano (Opción A o D) alcanza y sobra. Quedan anotadas acá por si en algún momento el caso de uso crece mucho (ej. facturas con 100+ líneas, edición tipo Excel real con copiar/pegar entre celdas).

---

## Opciones para nuestra app (React/web)

### Opción A — Fila activa fija abajo + tabla compacta de solo lectura arriba (dos zonas separadas)

Dos zonas separadas dentro de la sección Ítems:
- **Arriba:** una `<table>` de solo lectura con los ítems ya cargados, una fila fina por ítem (sin el padding de card actual).
- **Abajo:** la fila activa de carga (los mismos 4 campos que ya existen, con el mismo flujo de Tab/autocompletar/historial de precios que ya armamos), siempre en el mismo lugar.

**Pro:** mismo modelo mental que la referencia (el usuario ya lo conoce). Máxima densidad — mucho menos scroll. El flujo de teclado que ya construimos (patrón #10) queda igual de rápido, o más, porque nunca hay que "buscar" la próxima fila vacía.

**Contra:** toca bastante la estructura interna de `FacturaForm.jsx`. Es la opción "fila fantasma" que critican en la discusión de LibrePCB (ver arriba) — separa visualmente "cargando" de "ya cargado", lo cual es bueno para claridad pero agrega una zona extra en pantalla.

#### Cómo resolver los puntos ambiguos, en concreto (esto ya no queda abierto)

- **Editar un ítem ya subido a la tabla → se "baja" de nuevo a la fila activa.** No hace falta inventar edición in-place dentro de la tabla de solo lectura (que sería duplicar toda la lógica de autocompletar/historial de precios en dos lugares). Click en una fila de la tabla la saca de ahí, la carga en la fila activa de abajo con sus valores, y reusa el mismo flujo de Tab/autocompletar que ya existe para ítems nuevos. Un solo camino de edición, no dos.
- **Eliminar sí queda directo en la tabla**, sin pasar por la fila activa — mismo botón `×` que ya existe hoy en cada fila. Es una acción destructiva de un solo click, no hace falta "abrir" el ítem primero para borrarlo. (Asimetría a propósito: editar reusa el formulario existente, eliminar no necesita formulario en absoluto.)
- **La ambigüedad "¿esto ya se guardó?" (la crítica de LibrePCB) se resuelve con estilo, no con texto explicativo:** la fila activa lleva un tratamiento visual claramente distinto al de una fila de la tabla — mismo lenguaje que ya usa el resto de la app para "esto todavía no es parte de la lista" (borde punteado, en el estilo de `AddBtn` en `VentaForm.jsx`/`FacturaForm.jsx`). Las filas ya confirmadas no llevan ese borde. No hace falta un cartel que diga "sin guardar" — el borde punteado ya es un lenguaje visual que el usuario reconoce de otras partes de la app.
- **El total en vivo sí puede incluir la fila activa**, mostrado por separado del subtotal confirmado (ej. "Subtotal cargado: $X" + "+ $Y en esta línea" mientras se tipea). Da el mismo feedback inmediato que tiene Odoo (recalcula con cada tecla) sin tener que esperar a "confirmar" la fila para verlo reflejado.
- **Altura y scroll de la tabla de arriba:** mismo criterio que ya usan `VentasList.jsx`/`FacturasList.jsx` (`maxHeight` fijo con scroll propio, no todo el modal). Consistencia con el resto del módulo, cero decisión nueva que tomar.

#### Oportunidad de DRY al construir esto

La tabla de solo lectura de esta opción puede reusar directamente los objetos de estilo `th`/`td` que ya existen (copiados) en `VentasList.jsx` y `FacturasList.jsx`, en vez de escribir un tercero. Es la excusa perfecta para resolver de una vez el ítem #3 de "Próximos candidatos" en `README-FACTURACION.md` (extraer `th`/`td` compartidos) — implementar Opción A sin antes hacer ese refactor significaría crear una CUARTA copia del mismo objeto de estilo.

### Opción D — Una sola tabla compacta, la fila que estás tocando se infla in-place (mecanismo real de Odoo)

**La que responde directo a "por qué 4 productos ocupan tanto espacio hoy".** Una sola tabla, siempre. Cada fila mide una línea de alto cuando no se edita (texto plano en columnas: Cant. | Código | Descripción | Pr.Unit. | Pr.Total). Al hacer click (o llegar por Tab) a una fila — **cualquiera, no solo la última** —, esa fila puntual cambia a modo edición y sus celdas se vuelven inputs de verdad, sin mover ni ocultar el resto. Al salir de la fila, vuelve a colapsarse a texto.

Técnicamente: un solo estado `editingIndex` (o `null`). Se renderiza `<input>` únicamente en la fila donde `i === editingIndex`; el resto son `<td>{valor}</td>` simples. "Agregar ítem" simplemente agrega una fila vacía al final y le pone foco (=`editingIndex` al nuevo índice) — mismo mecanismo de `pendingFocusRowRef` que ya tenemos, solo que ahora también hay que actualizar `editingIndex`.

**Importante — `editingIndex` es por FILA, no por celda.** Cuando `i === editingIndex`, las 4 celdas de esa fila (Cant./Código/Descripción/Pr.Unit.) se vuelven inputs **todas juntas**, no una por una. Esto quiere decir que el flujo interno de Tab entre esos 4 campos (patrón #10: código autocompleta descripción y salta a Pr.Unit., + abre historial de precios, Tab desde Pr.Unit. avanza) **no cambia casi nada** — sigue siendo exactamente la misma lógica que ya existe hoy. Lo único nuevo es: (1) el estado `editingIndex`, (2) el `if (i === editingIndex)` que decide input vs. texto plano por fila, y (3) qué dispara que `editingIndex` cambie de valor. No hay que reescribir el patrón #10, solo envolverlo.

**Pro:** es el que de verdad explica cómo Odoo evita el problema — no hay 40 `<input>` montados a la vez para 10 ítems, hay como máximo 4 (los de la fila activa). Una sola tabla, no dos zonas — más simple de razonar que la Opción A. Con 20 ítems, 19 son una línea de texto plano cada uno; ocupan lo mismo que 19 líneas de una lista, no 19 cards.

**Contra:** hay que decidir bien qué dispara y qué hace `editingIndex` en los bordes del flujo (entrar, salir, cancelar) — ver la sección resuelta abajo. Una vez resueltos esos bordes, el cambio real de código es más chico de lo que parece a primera vista (ver nota de arriba).

#### Cómo resolver los puntos ambiguos, en concreto (esto ya no queda abierto)

- **Qué dispara `editingIndex`:** click en cualquier fila (`onClick` en el `<tr>`, no en cada celda) la activa completa. Para no perder el flujo 100% teclado del patrón #10: cuando `Tab` sale del último campo de la fila activa (`Pr.Unit.`), en vez de mover foco directamente como hoy, primero se actualiza `editingIndex` a la fila siguiente (o se crea una si era la última) y el foco se resuelve después, en un `useEffect` atado a `editingIndex` — es el mismo mecanismo que ya usa `pendingFocusRowRef` para filas nuevas, generalizado ahora para **cualquier** cambio de fila activa, no solo las nuevas. Con esto, `pendingFocusRowRef` deja de ser un caso especial y se fusiona con la lógica general de `editingIndex`.
- **Qué pasa al salir de la fila (blur) con datos incompletos:** no se bloquea nada ahí. La fila colapsa a texto plano igual, mostrando lo que haya (`—` en los campos vacíos), y la única validación real sigue siendo la que ya existe en `handleGuardar` (filtra ítems sin descripción o sin importe antes de guardar). Cero lógica de validación nueva — mismo criterio que ya se usa hoy.
- **Cancelar una fila a medio cargar (tecla Esc):** si `editingIndex` apunta a una fila **recién creada y todavía vacía**, Esc la elimina directamente (evita dejar filas fantasma sueltas). Si apunta a una fila que ya tenía datos previos (se estaba editando algo ya cargado), Esc descarta los cambios de esa edición y vuelve a los valores que tenía antes — coherente con cómo ya se comporta `HistorialPrecioClienteModal.jsx` (Esc cierra sin aplicar nada).
- **Eliminar un ítem:** botón `×` siempre visible en cada fila (esté o no en edición), igual que se resolvió para la Opción A — eliminar es una acción independiente de estar editando, no debería hacer falta entrar en modo edición primero para borrar.
- **Altura de la tabla:** mismo criterio que la Opción A — `maxHeight` fijo con scroll propio, como ya hacen `VentasList.jsx`/`FacturasList.jsx`.
- **Total en vivo:** acá es más simple que en la Opción A. Como no hay una "fila activa" separada del array de ítems (es el mismo `formData.items` de siempre, editingIndex solo decide cómo se renderiza cada fila), el Subtotal/Total ya se recalcula solo con cada tecla, sin ningún caso especial — es la misma cuenta que ya hace `handleGuardar` hoy, corriendo sobre el mismo estado.

#### Simplificación extra que aparece al pensarlo bien: menos refs, no más

Hoy `itemRefs.current[i] = { cantidad, codigo, precioUnit }` guarda una referencia por CADA fila, porque las 4×N inputs están siempre montadas. Con `editingIndex`, en un momento dado solo existe un input real (los de la fila activa) — así que en vez de una matriz de refs por fila, alcanza con un solo grupo de refs para "la fila que está editándose ahora" (se reasigna solo cuando cambia `editingIndex`, no una vez por fila). Menos referencias que gestionar, no más — la Opción D es una simplificación del código de refs actual, no una complicación.

---

## Recomendación

**Opción D** (la de Odoo: una sola tabla, la fila tocada se infla in-place). Es la que responde de verdad a la pregunta que originó este doc — 4, 10 o 20 ítems ocupan lo mismo (una línea cada uno) salvo la única fila que estés editando en ese momento. No hace falta inventar una zona nueva en la pantalla (a diferencia de la A), y es el mecanismo que usa un ERP contable real y ampliamente probado para exactamente este problema.

La A queda como alternativa sólida si D resulta muy grande de implementar de una — ya no tiene puntos ambiguos sin resolver (ver "Cómo resolver los puntos ambiguos" arriba), es más fácil de construir de forma incremental (se puede armar la tabla de solo lectura arriba primero, reusando la fila activa de abajo casi tal cual está hoy) y resuelve el mismo 90%+ del problema de espacio que D.

---

## Estado de las preguntas abiertas

Tanto la Opción A ("Cómo resolver los puntos ambiguos", dentro de esa sección) como la Opción D (ídem) ya tienen sus decisiones de diseño resueltas en concreto — ninguna de las dos opciones tiene ambigüedades sueltas pendientes a esta altura del documento. Falta solo elegir cuál construir.

---

## Nota aparte (no es de UX): bug visto en la captura

En la tercera captura que mandaste se ven filas raras — dos filas idénticas de "Chorizo" y una fila con Código 15 pero sin descripción ni cantidad coherente. Parece un bug real en el flujo de Tab/autocompletado de `FacturaForm.jsx` (no relacionado con esta exploración de UX). Lo dejo anotado acá para no perderlo, pero no lo toqué todavía — avisame si querés que lo mire aparte de esto.
