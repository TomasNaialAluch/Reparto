# Mejoras — Gestión de Proveedores y Mercadería

Documento de diseño (sin código). Reúne cinco mejoras sobre el flujo de proveedores de **Gestión Semanal** (pestañas *Mercadería* y *Pagos Proveedores*). Todas siguen la guía visual de [README-NEWLOOK.md](README-NEWLOOK.md).

## Dónde vive hoy

| Pieza | Archivo | Qué hace hoy |
|---|---|---|
| Modal "Gestionar proveedores" | [MercaderiaTab.jsx](src/components/gestionSemanal/MercaderiaTab.jsx) (≈ línea 962) | Modal Bootstrap (`modal-dialog`) con la lista de proveedores, alta y baja |
| Card "Entradas de la Semana" | [MercaderiaTab.jsx](src/components/gestionSemanal/MercaderiaTab.jsx) (≈ línea 641) | Una card por entrada: día, proveedor, kg totales, costo, cantidad de cortes. Se expande para ver cortes y editar |
| Grupos por proveedor | [PagosProveedoresTab.jsx](src/components/gestionSemanal/PagosProveedoresTab.jsx) | Boletas y pagos agrupados por proveedor |
| Alta rápida | [ModalNuevoProveedor.jsx](src/components/ModalNuevoProveedor.jsx) | Modal para crear un proveedor |

> Interpretación: "ver una echa" se tomó como **ver una boleta/entrada de mercadería** (la card expandida). Si se refería a otra pantalla, corregir el punto 4.

---

## 1. Buscador en la lista de proveedores

**Problema:** la lista del modal crece con el tiempo y hay que scrollear para encontrar a alguien.

**Propuesta**
- Input de búsqueda fijo arriba de la lista (no scrollea con ella), con ícono de lupa SVG y botón `×` para limpiar.
- Filtra en vivo, sin distinguir mayúsculas ni tildes ("carnicería" = "Carniceria").
- Coincidencia parcial en cualquier parte del nombre; se resalta el texto encontrado.
- Contador al lado: "3 de 27 proveedores".
- Estado vacío: "No hay proveedores que coincidan con «xyz»" + botón **Crear "xyz"** (atajo directo al alta).
- Al abrir el modal, el foco va al buscador. `Enter` con un único resultado lo selecciona.
- Ordenamiento: los **últimos usados** primero cuando el buscador está vacío (ya existe `ultimosProveedoresUsados`), alfabético cuando hay texto.

Estilo: input con `border-radius: 8px`, foco con halo acero (`--color-primary`), igual que el resto de inputs NEWLOOK.

---

## 2. Mejorar el modal de proveedores

**Problema:** usa la estructura Bootstrap clásica (`modal-dialog`, header gris, footer plano), distinta del resto de la app.

**Propuesta** (patrón de modal de NEWLOOK, sección 6)
- Overlay con `backdrop-filter: blur(2px)` que cierra al hacer click afuera; panel centrado, `border-radius: 16px`, sombra grande.
- Header de dos líneas: label chico en mayúsculas ("GESTIÓN") y título "Proveedores"; botón de cierre circular `✕`.
- Cuerpo con scroll propio; header (con buscador) y footer siempre visibles.
- Cada proveedor como fila limpia: nombre, y debajo en gris chico un resumen ("2 entradas esta semana · 340 kg"). Acciones (editar / eliminar) aparecen al hover, con el ícono de borrar como overlay para no pisar el nombre.
- Alta inline al pie: input + botón primario en lugar de un modal aparte, con estado deshabilitado visual cuando está vacío.
- Confirmación de borrado con `ConfirmModal` (ya existe), aclarando si el proveedor tiene entradas en la semana.
- Evitar duplicados: aviso inmediato si el nombre ya existe (comparación sin tildes ni mayúsculas).
- Cierra con `Escape` (ya existe) y devuelve el foco al campo desde donde se abrió.

---

## 3. Mejorar las cards de mercadería ingresada

**Problema:** la card colapsada es un bloque centrado con muchos tamaños de texto y colores sólidos (`border-primary`, `badge bg-primary`, botón rojo grande); poco escaneable cuando hay muchas entradas.

**Propuesta**
- Card plana (sin sombra), `border-radius: 12px`, **acento izquierdo** de 3px según estado (por ejemplo: acero = normal, amarillo = sin precios cargados, que hoy se avisa con `showWarningPrecios`).
- Jerarquía clara, alineada a la izquierda:
  1. Proveedor (bold) + día como pill suave (`rgba` 10%), no badge sólido.
  2. Kg totales grande.
  3. Costo total y costo por kg como pill verde semitransparente.
  4. "N cortes" como label gris chico.
- Botón de eliminar: `×` rojo sin borde, visible solo al hover (en mobile, siempre visible pero discreto).
- Expansión con transición de altura (`max-height`) y chevron SVG que rota, en vez de cambiar el layout de la grilla.
- Filtros arriba de la grilla: por día y por proveedor, con segmented control (mismo patrón que Mi Reparto).
- Totales de la semana siempre a la vista arriba de la lista (kg y costo), coherente con el card "Totales Semanales".
- Ordenar por día de la semana, no solo por orden de carga.
- **Agrupar por proveedor:** las cards ya no van sueltas en una sola grilla; se agrupan bajo un encabezado por proveedor (ver punto 6).

---

## 4. Ver una boleta: que parezca un ticket

**Objetivo:** que al abrir una entrada el usuario sienta que está viendo un **comprobante real**, y confíe en que el dato quedó registrado.

**Propuesta de diseño — "ticket"**
- Panel blanco angosto (máx. ~420px) centrado, con **borde dentado** arriba y abajo (efecto papel cortado, hecho con CSS `radial-gradient`/`mask`), sombra suave.
- Tipografía monoespaciada (ej. *JetBrains Mono* / *IBM Plex Mono*) para importes y cantidades; Montserrat para el título.
- Estructura clásica de comprobante:
  - Encabezado: nombre del negocio, "COMPROBANTE DE INGRESO", número de entrada, día y fecha.
  - Línea punteada separadora.
  - Datos: proveedor, día de ingreso.
  - Detalle en renglones: `corte … kg × $/kg = subtotal`, alineados a la derecha con puntos de relleno.
  - Línea punteada.
  - **TOTAL KG**, **TOTAL $**, **COSTO PROM./KG** destacados.
  - Pie: estado de registro y marca de tiempo.
- **Elementos de seguridad** (la parte clave):
  - Sello "REGISTRADO ✓" con la fecha y hora de guardado en Firebase (se usa `timestamp` que ya guarda cada entrada).
  - Código de referencia corto y único por entrada (derivado del id/timestamp) para poder citarla.
  - Si se editó: "Modificado el dd/mm hh:mm" visible, para que quede claro que no es un dato suelto.
  - Si hay pagos asociados (ver `PagosProveedoresTab`): indicar "Pagada" / "Pendiente" con el mismo vocabulario de la app.
- Acciones fuera del papel (debajo): Editar, Imprimir, Eliminar. Imprimir reutiliza el ticket como vista de impresión.
- Se abre en modal NEWLOOK (overlay + blur); en mobile ocupa casi todo el ancho.
- Edición: el ticket pasa a modo editable *inline* (campos sobre el mismo papel) en vez de reacomodar la grilla de cards.

> Reutilizar el estilo del documento de impresión existente ([PrintDocument.jsx](src/components/PrintDocument.jsx)) para que pantalla e impresión sean consistentes.

---

## 5. Mostrar en las cards los productos que cada proveedor trajo en la semana

**Problema:** hoy hay que abrir cada entrada para saber qué trajo cada proveedor.

**Propuesta**
- En la card de cada proveedor (y en su fila dentro del modal) mostrar un **resumen de lo que ingresó en la semana**, agrupado por corte:
  - Chips/pills con `corte · kg` (ej. `Asado · 120 kg`, `Vacío · 45 kg`), ordenados por kg descendente.
  - Máximo 3–4 visibles + pill "+N más" que expande o abre el detalle.
- Si el proveedor tuvo varias entradas en la semana, **sumar por corte** entre entradas y mostrar los días ("Lun, Jue").
- Debajo, totales del proveedor: kg totales, costo total y costo promedio por kg.
- En *Pagos Proveedores*, el mismo resumen dentro del grupo de cada proveedor, para ver de un vistazo qué se le debe pagar y por qué mercadería.
- Proveedores sin entradas esta semana: card atenuada con "Sin ingresos esta semana".
- Fuente de datos: `semanaActiva.mercaderia[].cortes[]` (ya contiene `kg` y `precioKg`); no requiere cambios en Firebase, solo un agrupado en memoria.
- Este resumen vive en el **encabezado del grupo** de cada proveedor (punto 6), no repetido en cada card.

---

## 6. Agrupar las cards por proveedor

**Problema:** *Entradas de la Semana* es una grilla plana en orden de carga. Si un proveedor trae mercadería lunes, miércoles y viernes, sus tres cards quedan separadas entre las de otros y hay que ir buscándolas. Hoy cada card repite además el nombre del proveedor.

**Propuesta**
- Un **bloque por proveedor**, y adentro sus cards de entrada (una por día), en orden de día de la semana.
- **Encabezado del grupo** (siempre visible, también colapsado):
  - Nombre del proveedor + cantidad de entradas ("3 entradas").
  - Totales del proveedor en la semana: **kg**, **costo total** y **costo promedio/kg** (pill verde semitransparente).
  - Resumen de productos del punto 5 (chips `corte · kg`, máx. 3–4 + "+N más").
  - Chevron SVG que rota para **colapsar/expandir** el grupo (transición de `max-height`).
- Como el proveedor ya está en el encabezado, **las cards internas dejan de repetirlo**: muestran solo día, kg, costo y cantidad de cortes. Quedan más chicas y escaneables.
- **Separador entre grupos** con línea `1px #d3d9de` y espacio, como en `PagosProveedoresTab` (`gs-prov-group`), para que el ojo distinga dónde termina uno y empieza otro.
- **Orden de los grupos:** por defecto, los de mayor costo o kg primero; alternativa alfabética con un segmented control (*Mayor compra · A–Z · Último ingreso*).
- **Filtros** (punto 3) y **buscador** (punto 1) actúan sobre los grupos: al buscar, se muestran solo los proveedores que coinciden y se resalta el texto.
- **Estado inicial:** todos los grupos expandidos si hay pocos (≤ 4); colapsados salvo el último usado si hay muchos. Se recuerda lo que el usuario abrió o cerró durante la sesión.
- **Alta de una entrada nueva:** al guardar, el grupo del proveedor se expande y la card nueva se resalta unos segundos para confirmar dónde quedó. Si es un proveedor sin entradas previas, se crea el grupo.
- **Proveedor renombrado** en edición: la card cambia de grupo con una transición corta, para que no parezca que desapareció.
- Mismo agrupado en **Pagos Proveedores**, para que ambas pestañas muestren al proveedor con el mismo criterio visual.
- Fuente de datos: se agrupa en memoria por `entrada.proveedor` sobre `semanaActiva.mercaderia`; no requiere cambios en Firebase. Conviene **normalizar el nombre** (sin tildes, mayúsculas ni espacios de más) para que "Frigorífico Sur" y "frigorifico sur " no queden como dos grupos distintos.

---

## 7. El proveedor como objeto (con deudas, cobros y más datos)

### 7.1 Cómo se guardan los proveedores hoy (investigado en el código)

**Hoy el proveedor NO es un objeto: es un texto suelto**, y hay varios lugares que guardan "el mismo proveedor" por separado:

| Dónde | Cómo se guarda | Archivo |
|---|---|---|
| Lista de Gestión (la del modal y del selector) | **Array de strings** `['Catriel', 'Lucas', 'Tito', …]` dentro del documento `user_configs` del usuario (campo `proveedores`). Lista inicial fija en `PROVEEDORES` | [MercaderiaTab.jsx](src/components/gestionSemanal/MercaderiaTab.jsx), [constants.js](src/components/gestionSemanal/constants.js), `getConfiguracionesUsuario` en [hooks.js](src/firebase/hooks.js) |
| Entradas de mercadería | Cada entrada lleva `proveedor: "Catriel"` (el **nombre**, no un id) dentro de `semanaActiva.mercaderia[]` | `agregarMercaderia` en [hooks.js](src/firebase/hooks.js) |
| Pagos a proveedores | `semanaActiva.pagosProveedores[]` con `proveedor: "Catriel"` (otra vez el nombre) | [PagosProveedoresTab.jsx](src/components/gestionSemanal/PagosProveedoresTab.jsx) |
| Saldo a favor | Colección `saldoProveedorVinculaciones`, campo `proveedor` (nombre) | [useSaldoProveedor.js](src/components/saldoProveedor/useSaldoProveedor.js) |
| Lista de Precios (otra pantalla) | Colección **`proveedores`** con objetos `{ id, nombre, contacto, fechaCreacion }` — es un catálogo **distinto y desconectado** del de Gestión | [useProveedores.js](src/hooks/useProveedores.js) |

### 7.2 Problemas que esto genera

1. **El vínculo es por nombre.** Todo se cruza comparando texto. Algunos lugares normalizan (`trim().toLowerCase()` en el contexto de pagos y en el saldo a favor) y otros no (`PagosProveedoresTab` agrupa con `===`). "Catriel" y "catriel " pueden terminar como dos proveedores.
2. **Renombrar o corregir un nombre rompe el historial**: las entradas y pagos viejos conservan el nombre anterior y dejan de coincidir.
3. **Borrar de la lista no borra ni avisa** de las entradas que lo usan; el proveedor sigue apareciendo en las cards pero ya no existe en la lista.
4. **Dos catálogos paralelos** (`user_configs.proveedores` y colección `proveedores`) que no se hablan: un proveedor creado en Lista de Precios no existe en Gestión y viceversa.
5. **La lista es por usuario** (`user_configs` se busca por `userId`), mientras que el resto de la app comparte datos (`userId: 'shared'`). Dos logins distintos pueden ver listas de proveedores diferentes.
6. **No hay dónde guardar datos del proveedor**: teléfono, CUIT, condiciones de pago, notas, ni lo que se le debe o ya se le pagó.

### 7.3 Propuesta: un proveedor = un documento con id

Convertirlo en objeto **y reutilizar la colección `proveedores` que ya existe**, para tener un único catálogo compartido.

```js
// colección: proveedores/{proveedorId}
{
  id,                              // id de Firestore, estable aunque cambie el nombre
  nombre: "Catriel",
  nombreNormalizado: "catriel",    // sin tildes/mayúsculas/espacios; clave para evitar duplicados
  activo: true,                    // "archivar" en vez de borrar
  contacto: { telefono, whatsapp, email, direccion },
  datosFiscales: { cuit, razonSocial },
  condiciones: { plazoPagoDias: 7, medioPagoHabitual: 'transferencia' },
  notas: "Entrega los lunes y jueves",
  etiquetas: ['carne', 'cerdo'],
  createdAt, updatedAt
}
```

Los datos que **cambian todo el tiempo** (lo que se debe, lo que se pagó) **no se guardan como un número editable**, sino como **movimientos** y el saldo se calcula (así queda historial y no se pisan escrituras):

```js
// subcolección: proveedores/{proveedorId}/movimientos/{movId}
{
  tipo: 'boleta' | 'pago' | 'saldo_a_favor' | 'nota_credito' | 'ajuste',
  monto: 125000,               // siempre positivo; el tipo define si suma o resta a la deuda
  fecha: '2026-10-06',
  semanaId, entradaId,         // de dónde viene (opcional)
  medio: 'efectivo' | 'transferencia' | 'cheque',
  nota: '',
  anulado: false,              // se anula, no se borra
  timestamp
}
```

- **Deuda actual** = Σ boletas + ajustes a favor del proveedor − Σ pagos − saldo a favor − notas de crédito.
- **Cobros / saldos a favor** (lo que el proveedor nos devuelve o nos debe) entran como movimientos del tipo `saldo_a_favor` o `nota_credito`. Esto absorbe lo que hoy vive aparte en `saldoProveedorVinculaciones`.
- Se pueden agregar más tipos sin tocar el esquema (cheques entregados, adelantos, descuentos).

### 7.4 Cómo se vincula con las entradas y pagos

- Cada entrada de mercadería guarda **`proveedorId`** y además el **`proveedor` (nombre) como copia** del momento, para que el historial se vea bien aunque después se renombre y para que lo viejo siga funcionando.
- Agrupar las cards (punto 6) pasa a hacerse **por `proveedorId`**, no por texto: se acaban los grupos duplicados por tildes o mayúsculas.
- Renombrar un proveedor cambia un solo documento; las cards lo muestran con el nombre nuevo.
- Borrar = **archivar** (`activo: false`): sale del selector pero conserva su historial. Si tiene deuda pendiente, avisar antes.

### 7.5 Qué se ve en la app

- **Ficha del proveedor** (se abre desde el modal o desde el encabezado del grupo): datos de contacto, condiciones, notas, **deuda actual**, últimos movimientos y totales por semana. Acciones: *Registrar pago*, *Agregar saldo a favor*, *Llamar / WhatsApp*.
- **Encabezado del grupo de cards** (punto 6): suma la **deuda actual** del proveedor como pill (rojo suave si debe, verde si tiene saldo a favor).
- **Modal de proveedores** (punto 2): cada fila muestra la deuda junto al nombre y el buscador (punto 1) también encuentra por teléfono o CUIT.
- **Pagos Proveedores**: lee los mismos movimientos, así que lo que se paga ahí actualiza la ficha sin cargarlo dos veces.

### 7.6 Migración sin romper nada

1. Leer `user_configs.proveedores` (strings) y la colección `proveedores` existente; **unir por `nombreNormalizado`** y crear un documento por proveedor único. Revisar a mano los casos dudosos (nombres parecidos).
2. Completar `proveedorId` en las entradas de la **semana activa** y, de a poco, en las semanas cerradas (match por nombre normalizado). Las entradas sin match quedan con el texto y se muestran como "proveedor sin ficha" con opción de vincular.
3. Convertir las vinculaciones de `saldoProveedorVinculaciones` y los pagos existentes en movimientos (script de una sola vez; conservar las colecciones viejas hasta validar).
4. Durante la transición, **leer id y, si no hay, caer al nombre**. Cuando todo tenga id, dejar de usar el texto.
5. Mover la lista al modo **compartido** (no por `userId`) para que todos vean el mismo catálogo.

### 7.7 Cuidados técnicos

- Firestore no admite arrays directamente dentro de arrays; por eso `movimientos` va en **subcolección** y no como un array dentro del documento (que además crecería sin límite y se pisaría al escribir desde dos dispositivos).
- Los movimientos se **anulan**, nunca se borran, para tener trazabilidad (misma idea que el seguimiento de repartos).
- Reglas de Firestore: hoy cualquier usuario autenticado lee y escribe todo; si se suman datos sensibles (CUIT, saldos) conviene revisarlas.
- `nombreNormalizado` debe ser **único**: validar al crear o renombrar.

---

## Orden sugerido de implementación

1. **Proveedor como objeto** (punto 7.3 y 7.6): es la base de todo lo demás. Unificar catálogo, crear `proveedorId` y migrar.
2. Buscador + rediseño del modal (puntos 1 y 2): cambio acotado, alto impacto, ya sobre el catálogo nuevo.
3. Agrupado por proveedor y resumen de productos (puntos 6 y 5): ahora agrupando por `proveedorId`.
4. Movimientos y deuda por proveedor + ficha (7.3 y 7.5).
5. Rediseño de cards (punto 3), ya dentro de los grupos.
6. Vista tipo ticket (punto 4): depende de los anteriores y es la más visual.

## Preguntas abiertas

- ¿"Echa" era la **boleta de ingreso de mercadería** (card de *Entradas de la Semana*) o la boleta de **pago a proveedor**? El ticket del punto 4 asume la primera.
- ¿El ticket debe llevar el nombre/logo del negocio? Hoy no hay un dato de negocio configurado.
- ¿Los productos del punto 5 se quieren solo de la **semana activa** o también de semanas cerradas (historial)?
- ¿Hay proveedores con **nombres escritos distinto** en entradas viejas (el campo es texto libre)? Si es así, conviene unificarlos antes de agrupar.
- ¿Los grupos van **todos abiertos** por defecto o prefieren verlos colapsados con solo los totales?
- ¿Qué significa **"cobros"** para un proveedor? Se asumió: saldos a favor, devoluciones y notas de crédito (plata que el proveedor nos debe). Si se refería a otra cosa, ajustar los tipos de movimiento del 7.3.
- ¿Qué **datos extra** se quieren en la ficha además de contacto, CUIT, condiciones de pago y notas?
- ¿La lista de proveedores debe ser **compartida** entre todos los usuarios (como el resto de la app) o seguir siendo por usuario?
- ¿Se migran también las **semanas cerradas** o solo la semana activa hacia adelante?
