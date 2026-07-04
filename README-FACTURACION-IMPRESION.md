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

## Preguntas abiertas antes de empezar a programar Opción B

1. ¿Existe ya un logo/isotipo de "Reparto" o de Facturación en algún lado (SVG/PNG), o hay que usar texto estilizado por ahora (como ya hace `Frigorífico "La Trinidad"` con tipografía, sin logo real)?
2. ¿El pie de página necesita datos de contacto reales del negocio (teléfono, dirección, alias de Mercado Pago) como en la referencia, o esos datos van a variar según qué cliente de Reparto use el sistema (o sea, ¿tienen que ser configurables, no hardcodeados)?
3. ¿El "aspecto de validez" es solo visual (que no parezca una lista cruda) o hay algún dato que hoy no imprimimos y debería estar (CUIT, condición de IVA, punto de venta, algo tipo lo que discutimos en `README-FACTURACION.md` sobre que hoy no calculamos tipo de comprobante AFIP real)?
