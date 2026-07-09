# Exploración: comprobante de impresión "con aspecto de validez"

Este doc es para **pensar opciones**, no una decisión tomada. Mismo formato que `README-FACTURACION-ITEMS-UX.md`: cuando se elija un camino, la decisión final va a `README-FACTURACION.md` y este archivo se puede borrar o dejar como referencia histórica.

---

## Qué hace el sistema de referencia (Alcuota / GestionPro)

Analizamos el PDF (`test.pdf`) que exportaste y el archivo de fondo que citás (`001_FACTURA_BC.wmf`). Renderizando el PDF se ve esto:

- **Fecha** arriba a la derecha.
- **Nombre del cliente** + una segunda línea (`<no informado>` — parece un campo de domicilio/CUIT que quedó vacío en este comprobante puntual).
- Una **tabla chica** de ítems: `Cant. | Detalle | Pr.Unit. | Importe` — en este caso una sola fila (`5,40 Carre ... 6.800,00 ... 36.720,00`).
- Un **recuadro de Total** abajo a la derecha, con el mismo número que el importe (evidencia de que en este comprobante hay un solo ítem).
- **Todo lo demás — el logo del triángulo "Frigorífico La Trinidad", las 5 estrellitas, el chanchito y la vaca, el logo de Mercado Pago + alias, los íconos de WhatsApp/teléfono/domicilio y sus textos — es parte del fondo (el `.wmf`), no texto que genera el programa por cada factura.**

Extrayendo el texto del PDF con `pdftotext -layout` se confirma: lo único que el programa "escribe" en cada impresión es fecha, cliente, ítems y total. El resto es una imagen fija.

### Por qué WMF y no PNG/JPG

WMF (*Windows Metafile*) es un formato **vectorial** nativo de GDI (el motor gráfico de Windows de esa época). Programas viejos hechos en Delphi/VB6/Access lo usaban como fondo de reportes porque:
- No pixela sin importar la resolución de impresión (a diferencia de un PNG/JPG, que se ve borroso si el DPI de la impresora es alto).
- Es liviano y se embebe fácil en motores de reporting de esa era (Crystal Reports, Access Reports, QuickReport de Delphi).

Esto es exactamente el patrón clásico de **"plantilla de fondo + campos posicionados por coordenadas encima"** que usaban (y siguen usando) motores de reporting tipo Crystal Reports / Stimulsoft / FastReport: el diseñador arma el fondo una sola vez (con el logo, los datos fijos del negocio, las líneas de la tabla), y el motor solo dibuja texto en X/Y sobre esa imagen en cada impresión.

> Esto también explica por qué en tu configuración "cargás la imagen de fondo": la lógica separa completamente **diseño** (el WMF, se hace una vez, con Illustrator/CorelDraw/lo que sea) de **datos** (fecha/cliente/ítems/total, calculados en cada factura).

---

## Qué tenemos hoy nosotros (`PrintDocument.jsx`)

`renderFacturaContent()` es HTML con clases (`print-header`, `print-table`, `print-subtotal`, `print-total`) y fondo **blanco liso** — sin logo, sin marca, layout de arriba hacia abajo en flujo normal (no posiciones fijas). Funciona, pero no tiene "aspecto de comprobante" — se ve como una lista, no como una factura.

---

## Tres caminos posibles para nuestro caso (React + impresión de navegador)

### Opción A — Réplica exacta del patrón viejo: imagen de fondo + campos absolutos encima

Se diseña una vez una imagen de fondo (PNG o SVG en vez de WMF — en web no hace falta el formato viejo, un SVG ya es vectorial y se ve nítido a cualquier DPI) con el logo, los datos fijos del negocio (dirección, teléfono, redes) y las líneas/columnas de la tabla ya dibujadas. El componente de impresión pone esa imagen como fondo (`background-image` o un `<img>` en `position: absolute`) y los datos variables (fecha, cliente, ítems, total) se posicionan **encima**, en coordenadas fijas (`position: absolute; top: Xpx; left: Ypx`).

**Pros:**
- Resultado más "prolijo"/diseñado — el fondo lo puede armar un diseñador gráfico una sola vez, con la identidad completa de la marca.
- Es literalmente lo que ya conocés y ya usás en el otro programa — cero curva de aprendizaje de "qué se ve cómo".

**Contras:**
- **No escala con la cantidad de ítems.** Si el fondo tiene la tabla "dibujada" para 5 líneas y una factura tiene 15 (como la de los Chorizos), no hay dónde ponerlas sin superponerse al resto del fondo (el total, el logo de abajo, etc.). El sistema de referencia esquiva este problema teniendo pocas líneas por comprobante; nosotros ya vimos facturas de 15+ ítems en Reparto.
- Cualquier ajuste de layout (mover el total 10px, agregar un campo) implica editar la imagen de fondo Y las coordenadas del código a la vez — dos lugares que se pueden desincronizar.
- Hay que generar (o pedirle a alguien que diseñe) un asset gráfico nuevo — no es solo código.

### Opción B — Letterhead real en HTML/CSS, con flujo normal (evolución de lo que ya existe)

En vez de una imagen de fondo con posiciones fijas, se arma el "aspecto de marca" con HTML/CSS de verdad: un header con logo + nombre del negocio + datos de contacto (los mismos íconos que ya tenemos en `gestionSemanal/icons.jsx` — `IconTruck`, teléfono, etc.), la tabla de ítems como tabla HTML normal (crece sola, ítem 16 no rompe nada), y un footer con los medios de pago/redes. Todo dentro del `renderFacturaContent()` que ya existe, sin cambiar el mecanismo de impresión (`window.print()` del navegador).

**Pros:**
- Escala con cualquier cantidad de ítems sin rediseñar nada (es el mismo problema que ya resolvimos en Opción D de la grilla de carga — una tabla real, no un layout fijo).
- Cero dependencias nuevas — reusa el pipeline que ya funciona (`PrintDocument.jsx`, `.pd-preview`, `@media print`).
- El logo/ícono son assets chicos (un SVG del logo, nada más) en vez de un PNG de página completa — más fácil de mantener y versionar en git.
- Si el día de mañana se quiere logo distinto por cliente/sucursal, es un `<img src={logoUrl}>` con prop, no reemplazar una imagen de fondo de página completa.

**Contras:**
- Un poco menos "control pixel-perfect" que una imagen prediseñada — el diseño depende de CSS bien hecho, no de un diseñador gráfico armando el layout final en Illustrator.
- Hay que armar el logo/ícono de Reparto o Facturación como asset (SVG), si no existe todavía.

### Opción C — Generar un PDF real (no depender de "Imprimir" del navegador)

Las dos opciones anteriores siguen usando `window.print()` — el usuario ve una vista previa y imprime/guarda como PDF desde el diálogo del navegador. Una tercera opción es generar el PDF **nosotros**, en el cliente, con una librería (`jsPDF`, `pdf-lib`) o en el server con Puppeteer, para poder:
- Descargar un archivo `.pdf` con un click (sin pasar por el diálogo de impresión del navegador).
- Mandarlo directo por WhatsApp/mail sin que el usuario tenga que "imprimir a PDF" manualmente.

Esto es ortogonal a A/B — el *layout* (fondo fijo vs. HTML fluido) se puede resolver igual con cualquiera de las dos, la diferencia es *cómo sale* el archivo final. Fuentes: [easyinvoice](https://www.npmjs.com/package/easyinvoice) y [jspdf-invoice-template](https://github.com/edisonneza/jspdf-invoice-template) soportan justamente imagen de fondo + campos superpuestos (el patrón de Opción A pero para exportar PDF real en vez de imprimir HTML); Puppeteer permite renderizar el mismo HTML/CSS de Opción B a PDF sin reescribir nada ([PSPDFKit/Nutrient — cómo generar facturas PDF desde HTML en Node.js](https://pspdfkit.com/blog/2021/how-to-generate-pdf-invoices-from-html-in-nodejs/)).

**Pros:** archivo real, descargable, enviable, no depende de que el usuario sepa "imprimir como PDF".
**Contras:** dependencia nueva, y si se usa Puppeteer hace falta un backend (hoy Facturación es 100% cliente + Firebase, sin server propio) — `jsPDF`/`pdf-lib` corren en el navegador sin backend, pero requieren reconstruir el layout en la API de esa librería (no reusan el HTML/CSS que ya tenemos).

---

## Un gotcha importante (aplica a A y B)

Los navegadores, por default, **no imprimen imágenes de fondo ni colores** al mandar a impresora — hay que forzarlo con la propiedad CSS `print-color-adjust: exact` (`-webkit-print-color-adjust: exact` para compatibilidad Chrome/Safari viejos) en los elementos con fondo. Si no, el usuario ve el logo/color en la vista previa de nuestra web pero la hoja impresa sale sin nada de eso. Fuente: [MDN — print-color-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust). Esto también depende de que el usuario tenga tildada la opción "Gráficos de fondo" en el diálogo de impresión del navegador — vale la pena que el mensaje de la vista previa se lo recuerde.

---

## Recomendación

**Opción B** como punto de partida: evoluciona lo que ya existe (`PrintDocument.jsx`), no rompe nada del flujo actual (`window.print()`, la vista previa `.pd-preview`), no agrega dependencias, y — a diferencia del sistema de referencia — **escala con facturas de muchos ítems**, que ya sabemos que existen en Reparto (la de los Chorizos tenía 5 líneas y hay casos reales de más).

Dejar A y C anotadas para más adelante:
- **A** si en algún momento el negocio quiere un diseño "cerrado" tipo el de la referencia (con ilustraciones tipo el chanchito/vaca) y se consigue a alguien que diseñe ese fondo — ahí sí conviene pensar un layout de altura fija (por ejemplo, para comprobantes de pocos ítems tipo "remito rápido").
- **C** si en algún momento se necesita mandar el comprobante por WhatsApp/mail directo desde la app, sin pasar por "imprimir → guardar como PDF" manual del usuario.

---

## Preguntas abiertas → respondidas, implementación hecha

1. **¿Hay logo real?** Sí — el usuario mandó el PDF de referencia y confirmó *"esa es toda la info que va"*: el logo (triángulo "Frigorífico La Trinidad" + estrellas) y la ilustración del chanchito/vaca son reales y van tal cual.
2. **¿Datos hardcodeados o configurables?** Hardcodeados — Facturación es de un solo negocio, no multi-tenant.
3. **¿Falta algún dato tipo CUIT/AFIP?** No — el usuario confirmó que esa es toda la info.

### Primer intento (descartado) vs. cómo quedó realmente

La primera versión recreó el footer con íconos propios del set NEWLOOK + texto (`DATOS_NEGOCIO`) dentro del `PrintDocument.jsx` genérico (el que comparten Reparto/Transferencias/Lista de Precios/Empleados/Ventas). El usuario corrigió el enfoque en el siguiente mensaje, con dos pedidos concretos:

- **Usar la imagen real tal cual**, no recrearla con íconos propios: *"la imagen del fondo esta que te adjunto, cópiala en la carpeta que corresponda, la pones abajo"*.
- **Componente nuevo, no el genérico**: *"hay que diseñar un componente de impresión distinto de cero. no podes usar el mismo"* — esto ya estaba anotado como pendiente en `README-FACTURACION.md` ("Facturación va a tener su propio componente de impresión más adelante"), y llegó el momento.

Implementación final:
- Se extrajo del PDF de referencia (`test.pdf`, una sola imagen rasterizada de 1414×2000 embebida — confirmado con `pdftotext -layout` que fecha/cliente/ítems/total eran el único texto real superpuesto) la banda completa de pie (mascota + logo + Mercado Pago + WhatsApp + teléfono + domicilio + recuadro de total, todo junto como un solo recorte, fondo blanco vuelto transparente) → `src/assets/facturacion/pie-factura.png`.
- Se creó `src/components/facturacion/facturas/FacturaPrintDocument.jsx`, un componente **autocontenido** (su propio modal, su propio `handlePrint()` con `window.open` + estilos inyectados, nada compartido con `PrintDocument.jsx`). Arma arriba en HTML/CSS de flujo normal: número + fecha, cliente, tabla de ítems, subtotal/IVA/redondeo/total — y abajo de todo, la imagen `pie-factura.png` completa, tal como la mandó el usuario.
- `FacturaDetalle.jsx` ahora importa `FacturaPrintDocument` en vez de `PrintDocument`. El `PrintDocument.jsx` genérico volvió a su estado sin el branch de `factura` (se sacó `renderFacturaContent`, el caso `'factura'` del dispatcher, y el CSS de footer que ya no se usa ahí) — sigue sirviendo a Reparto/Transferencias/Lista de Precios/Empleados/Ventas/resumen de facturas, sin acoplarse a este diseño puntual.
- Los íconos nuevos (`IconPhone`, `IconMapPin`, `IconMessageCircle`) y la constante `DATOS_NEGOCIO` que se habían agregado en el primer intento se sacaron por quedar sin uso — la imagen real reemplaza esa reconstrucción con íconos.

**Nota:** el recuadro de "Total" que trae la imagen queda vacío (es parte de la imagen fija, no hay overlay de texto encima) — el total real se ve arriba, en la sección de totales de la factura. Si en algún momento se quiere el número también adentro del recuadro de la imagen, hace falta un overlay de texto posicionado en coordenadas (Opción A), que es más frágil ante cambios.

---

## Segundo pedido: no alcanza con la imagen abajo — hay que recrear el comprobante de verdad (Opción A)

El usuario aclaró que lo de arriba no es lo que pidió. Instrucción textual: *"hay que diseñar un componente que agarre esa imagen, ponga un fondo blanco, y arriba de la imagen vaya poniendo la información. Para recrear el comprobante actual. Al menos que se te ocurra una mejora."*

Leído junto con el PDF de referencia (donde el número de factura, el total, etc. aparecen **impresos encima** de zonas específicas del fondo — el total, por ejemplo, cae justo dentro del recuadro que trae la imagen), esto es literalmente la **Opción A** del análisis original de este doc: fondo = `pie-factura.png` con `background-image` o `<img>` en `position: absolute`, y los campos variables (fecha, cliente, ítems, total) puestos **encima**, en coordenadas fijas — no en flujo normal como quedó ahora.

### El problema conocido de Opción A sigue ahí

Ya estaba anotado en la sección "Tres caminos posibles" de más arriba: `pie-factura.png` fue diseñada para un comprobante de **pocos ítems** (la referencia real que mandó el usuario tenía 1 sola línea). Si los campos se posicionan en coordenadas fijas pensadas para ese layout, una factura de 15+ ítems (como la de los Chorizos) no tiene dónde crecer sin taparse con el resto de la imagen.

### Propuesta (la "mejora" que pidió el usuario, a confirmar)

En vez de posicionar **todos** los campos por coordenadas sobre toda la imagen (frágil: cualquier cambio de fuente/tamaño rompe la alineación con el recuadro dibujado), separar en dos zonas:

1. **Arriba de la imagen, en flujo normal** (como ya está en `FacturaPrintDocument.jsx`): número, fecha, cliente, tabla de ítems, subtotal/IVA/redondeo. Esto es lo que puede variar en alto según la cantidad de ítems — dejarlo en flujo evita el problema de Opción A.
2. **Sobre la imagen, en posición absoluta, solo el campo Total** (el único dato que la imagen ya tiene un recuadro dibujado para recibir) — ese sí puede ir con coordenadas fijas porque es un solo campo, en un solo lugar, siempre al final, después de que el contenido de arriba ya terminó de crecer.

Así se recrea la sensación real del comprobante original (el total "metido" en el recuadro de la boleta, como en la referencia) sin heredar el problema de que toda la factura dependa de coordenadas fijas.

**Esto todavía no está implementado** — queda anotado acá para implementarlo en el próximo paso, sobre `FacturaPrintDocument.jsx` (agregar fondo blanco explícito + la imagen con posición relativa/absoluta + el total posicionado adentro del recuadro).

---

## Tercer pedido: no alcanza con resolver el problema técnico — hay que investigar qué hace que un comprobante "parezca real"

El usuario decidió diseñar una imagen de fondo nueva (todavía no la tiene — *"la tengo que armar en base a lo que pensemos"*), y pidió investigar en qué se basan los comprobantes que sí transmiten confianza a simple vista, usando como ejemplo el comprobante de transferencia de Mercado Pago.

### Qué encontramos

No hay documentación oficial de Mercado Pago sobre el "por qué" de su diseño — la investigación fue sobre estructura observable + investigación general de UX de fintech/invoicing:

- **El dato más importante es el más grande de la pantalla**, sin competencia visual de otros elementos. En MP es el monto; en nuestro caso, en el encabezado (antes de tener el total) el dato más importante es el número de comprobante.
- **Un ícono de estado arriba de todo** (el tilde verde de MP) — confirma "esto es válido" antes de leer una sola palabra. Fuente: [patrones de confirmación en fintech — Eleken](https://www.eleken.co/blog-posts/modern-fintech-design-guide), [psicología del color en fintech](https://weandthecolor.com/color-psychology-in-fintech-branding-how-the-right-palette-builds-user-trust/209146).
- **Tarjeta blanca redondeada flotando sobre un fondo**, no una hoja lisa con texto — se siente a objeto físico (ticket), no a lista de datos.
- **Filas clave-valor prolijas y consistentes** (label chico gris a la izquierda, valor en negrita a la derecha) para los datos secundarios — mismo patrón que usa MP para fecha/hora, destinatario, CVU/alias, medio de pago, ID de operación.
- **Un identificador único funciona como "sello de autenticidad" visual**, aunque nadie lo vaya a verificar de verdad — comunica trazabilidad. Fuente: [ayuda de Mercado Pago sobre CVU/alias](https://www.mercadopago.com.ar/ayuda/19761), [cómo rastrear una transferencia — Ámbito](https://www.ambito.com/informacion-general/como-rastrear-una-transferencia-mercado-pago-paso-paso-n5903916).
- Investigación general de invoices coincide: jerarquía visual clara, tipografía sin adornos, un solo color de marca usado con moderación, branding sutil (la claridad va primero). Fuentes: [Invoice Master — psicología del invoicing](https://invoicemaster.org/blog/post/psychology-of-invoicing), [Smashing Magazine — Invoice Like A Pro](https://www.smashingmagazine.com/2009/11/invoice-like-a-pro/).

**Conclusión aplicada a nuestro caso:** el comprobante de la referencia vieja (Frigorífico La Trinidad) no tiene jerarquía — todo el mismo tamaño de letra, total metido en un recuadro chico al costado, sin ícono de estado. Lo que hace "parecer real" a un comprobante moderno no es el logo ni la mascota — es la jerarquía visual y el patrón de filas clave-valor. Eso es lo que hay que aplicar en el diseño nuevo, sea cual sea la imagen de fondo que el usuario termine armando.

### Boceto en curso — Encabezado (antes de la tabla de ítems)

**Primer boceto (descartado):** ícono de estado circular arriba, tipo + número de comprobante grande y centrado como "protagonista", separador, filas clave-valor (Cliente, Fecha).

**Corregido por el usuario**, mirando otra vez la captura de la referencia (donde la fecha va arriba a la derecha): no va centrado ni con ícono — va en las esquinas, como la referencia. Estructura final (ambos bloques a la misma altura, arriba de todo):

1. **Arriba a la izquierda: Cliente** (label chico gris + razón social en negrita debajo).
2. **Arriba a la derecha, apilados** (fecha primero, número debajo — mismo bloque, alineado a la derecha):
   - **Fecha** (label chico gris arriba, valor en negrita debajo).
   - **N° de comprobante** (mismo patrón label/valor).

Sin separador ni filas debajo — es un único renglón de encabezado, cliente contra un borde y fecha/número contra el otro.

**Corrección de terminología, importante:** el campo se llama **"N° de comprobante"**, no "Factura B N°...". Palabras textuales del usuario: *"en este caso pone número de comprobante porque no es una factura homologada por el gobierno"* — como ya está anotado en la tabla de "Decisiones de producto" de `README-FACTURACION.md` (la numeración es un correlativo interno, no AFIP real, sin CAE), el diseño no puede sugerir visualmente que es una factura oficial. El campo `tipo` (Factura A/B/C) sigue existiendo como dato interno, pero en el comprobante impreso no debería aparecer con el peso visual de "esto es una Factura B" — el rótulo genérico es "N° de comprobante".

**Confirmado por el usuario** — aprovechando el ancho completo de la hoja a 4 (el cuarto de página): cliente pegado al borde izquierdo, fecha + número pegados al borde derecho, mismo renglón. **Encabezado cerrado, listo para implementar** cuando se programe `FacturaPrintDocument.jsx` con el diseño nuevo.

### Boceto en curso — Tabla de ítems

**Confirmado por el usuario:** mismas columnas que la referencia — **Cant. / Detalle / Pr. Unit. / Importe** (no se agrega código de producto ni ninguna columna nueva). Sin bordes de tabla completa ("tabla tabla no") — en cambio, **una línea fina** de separación debajo de cada fila (`border-bottom` sutil, sin grilla vertical ni encabezado con fondo). Encabezado de columnas en texto chico y gris arriba de la lista, cantidad e importe alineados a la derecha para que los números se lean en columna. **Tabla de ítems cerrada, lista para implementar.**

### Pendiente (próximos pasos del boceto)

- **Cómo se destaca el Total al final** — todavía sin definir.
- **Cómo se integra la imagen/logo nueva** que el usuario va a armar (reemplazo de `pie-factura.png`) — todavía sin definir, y sin la imagen en sí.
- Recién ahí se pasa a implementar todo junto en `FacturaPrintDocument.jsx`.

**Estado: encabezado y tabla de ítems acordados. Total y pie de imagen, pendientes. Nada de esto está implementado en código todavía — es puro boceto/acuerdo de diseño.**
