# Proveedor como objeto — relaciones en todo el proyecto

Documento de diseño (sin código). Primero se relevó **dónde y cómo se usa hoy** cada nombre de proveedor/cliente, y a partir de eso se propone **cómo relacionarlo**. Complementa [README-MEJORAS-GESTION-PROVEEDORES.md](README-MEJORAS-GESTION-PROVEEDORES.md) (sección 7), que ya planteaba el proveedor como objeto; acá se profundiza en la relación con el resto de la app y en el caso "se le compra y se le vende".

> **Alcance:** **Mi Reparto no se toca por ahora.** Las menciones a Mi Reparto y a la colección `repartos` en este documento son solo relevamiento; no forman parte de lo que se va a implementar.

> **Nota de nombre:** la pantalla que hoy se llama **Saldo Clientes** pasa a llamarse **Saldo Proveedores** (ver 3.4). En este documento se la sigue nombrando "Saldo Clientes" cuando se habla del código actual (`SaldoClientes.jsx`, `/saldo-clientes`, `clientBalances`) para poder ubicarla.

---

## 1. Hallazgo central: proveedor y cliente son la misma persona

En SaldoClientes el nombre que se escribe es el de un **cliente**, pero el código lo trata como **proveedor**:

- `obtenerBoletasPorProveedor(clientName)` busca las boletas de mercadería cuyo `proveedor` coincide con el nombre del cliente ([SaldoClientes.jsx:491](src/pages/SaldoClientes.jsx:491)).
- Al guardar un saldo, la vinculación se crea con `proveedor: clientName` ([SaldoClientes.jsx:253](src/pages/SaldoClientes.jsx:253) y [:365](src/pages/SaldoClientes.jsx:365)).
- En el saldo, las **boletas** son lo que esa persona nos vendió (es proveedor) y las **ventas** son lo que nosotros le vendimos (es cliente). El saldo final cruza las dos cosas más lo cobrado.

Es decir: **una misma persona (ej. "Tito") puede ser a la vez proveedor y cliente**, y el sistema hoy lo resuelve solo porque se escribe el mismo texto en dos lugares. Por eso el objeto no debería llamarse "proveedor" a secas: conviene un **contacto** con *roles*.

---

## 2. Relevamiento: dónde se guarda cada nombre

### 2.1 Lado proveedor (a quién se le compra)

| # | Dónde | Cómo guarda al proveedor | Archivo |
|---|---|---|---|
| P1 | Lista de proveedores de Gestión | Array de **strings** en `user_configs.proveedores` (por `userId`); default fijo en `PROVEEDORES` | [MercaderiaTab.jsx](src/components/gestionSemanal/MercaderiaTab.jsx), [constants.js](src/components/gestionSemanal/constants.js) |
| P2 | Últimos usados | Array de strings en `user_configs.ultimosProveedoresUsados` | [MercaderiaTab.jsx:289](src/components/gestionSemanal/MercaderiaTab.jsx:289) |
| P3 | Entrada de mercadería | `semanaActiva.mercaderia[].proveedor` (string) | `agregarMercaderia` en [hooks.js](src/firebase/hooks.js) |
| P4 | Pagos a proveedores | `semanaActiva.pagosProveedores[].proveedor` (string) | [PagosProveedoresTab.jsx](src/components/gestionSemanal/PagosProveedoresTab.jsx) |
| P5 | Estado de pagos | `pagosProveedoresEstado.boletasPagadas` indexado por `boleta-{índice}` (posición en el array) | [PagosProveedoresContext.jsx](src/contexts/PagosProveedoresContext.jsx) |
| P6 | Saldo a favor / vinculaciones | Colección `saldoProveedorVinculaciones`, `proveedor` (string) + `boletasVinculadas` (índices) | [useSaldoProveedor.js](src/components/saldoProveedor/useSaldoProveedor.js) |
| P7 | Balance | Filtra entradas por `entrada.proveedor` con `includes` exacto | [Balance.jsx](src/pages/Balance.jsx) |
| P8 | Estadísticas | Agrupa por nombre desde el contexto | [EstadisticasProveedores.jsx](src/components/EstadisticasProveedores.jsx) |
| P9 | Lista de Precios | Colección **`proveedores`** `{ id, nombre, contacto, fechaCreacion }` y `listasPrecios.proveedorId` + `proveedorNombre` | [useProveedores.js](src/hooks/useProveedores.js), [ListaPrecios.jsx](src/pages/ListaPrecios.jsx) |

### 2.2 Lado cliente (a quién se le vende / se le cobra)

| # | Dónde | Cómo guarda al cliente | Archivo |
|---|---|---|---|
| C1 | Mi Reparto | `repartos.clientes[].clientName` (string) con id temporal por cliente | [MiReparto.jsx](src/pages/MiReparto.jsx) |
| C2 | Saldo Clientes | Colección `clientBalances.clientName` (string) | `useClientBalances` en [hooks.js](src/firebase/hooks.js) |
| C3 | Transferencias | Colección `TransferenciasClientes.nombreCliente` (string) | [Transferencias.jsx](src/pages/Transferencias.jsx) |
| C4 | Gestión Semanal → Clientes | `semanaActiva.clientesCuenta[].nombre` (string) con sus boletas adentro | [ClientesTab.jsx](src/components/gestionSemanal/ClientesTab.jsx) |
| C5 | Facturación | Colección `facturacion_clientes` con **id y `codigo`** autonumérico, `razonSocial`, `telefono`…; las facturas guardan `clienteId` + `clienteNombre` | [hooks.js](src/firebase/hooks.js), [FacturaForm.jsx](src/components/facturacion/facturas/FacturaForm.jsx) |
| C6 | Precios Clientes | Lista local con `id` propio y `nombre` | [PreciosClientes.jsx](src/pages/PreciosClientes.jsx) |
| C7 | Gestión de Deudas | Colecciones `deudaPersonas` `{ nombre }` y `deudaMovimientos` con **`personaId`** (ya es entidad + movimientos) | [GestionDeudas.jsx](src/pages/GestionDeudas.jsx) |
| C8 | Libro de Cheques | `librador` y `endosadoA` como texto libre | [LibroCheques.jsx](src/pages/LibroCheques.jsx) |
| C9 | Asistente | `destinatario` como texto en mensajes y feedback | [Asistente.jsx](src/pages/Asistente.jsx) |

### 2.3 Conclusión del relevamiento

- Hay **al menos 5 catálogos de personas** que no se hablan: `user_configs.proveedores`, `proveedores`, `facturacion_clientes`, `deudaPersonas` y la lista local de Precios Clientes. Más cuatro lugares que solo guardan texto (repartos, saldos, transferencias, clientesCuenta).
- Solo **3 lugares ya usan id**: `facturacion_clientes` (facturas por `clienteId`), `deudaPersonas` (movimientos por `personaId`) y `listasPrecios.proveedorId`. Son los precedentes del modelo que se propone.
- La relación proveedor↔cliente **ya existe de hecho** (SaldoClientes), pero solo por coincidencia de texto.
- Las boletas de mercadería se identifican por **posición en el array** (`mercaderiaIndex`, `boleta-{n}`). Si una entrada se borra o se reordena, los índices guardados en vinculaciones y pagos pueden apuntar a otra boleta. Esto es un riesgo aparte del nombre.

---

## 3. Propuesta: un solo objeto "Contacto" con roles

```js
// colección: contactos/{contactoId}   (nueva; absorbe proveedores, facturacion_clientes y deudaPersonas)
{
  id,
  nombre: "Tito",
  nombreNormalizado: "tito",           // único; sin tildes/mayúsculas/espacios dobles
  roles: { proveedor: true, cliente: true },
  codigo: 17,                           // autonumérico (hoy existe solo en facturacion_clientes)
  contacto: { telefono, whatsapp, email, direccion },
  datosFiscales: { cuit, razonSocial },
  condiciones: { plazoPagoDias, medioPagoHabitual },
  alias: ["Tito Carnes", "Tito"],       // otros nombres con los que ya se cargó (ver migración)
  notas: "",
  activo: true,
  createdAt, updatedAt
}
```

Puntos de diseño:
- **Un contacto, varios roles.** El mismo documento aparece en el selector de proveedores (donde se ingresa mercadería) y en el de clientes (reparto, saldos, facturas). Como casi todos compran y venden, los roles nacen **ambos tildados** y el selector prioriza, pero no oculta (ver 3.1).
- **`alias`** permite reconocer entradas viejas escritas distinto ("Tito", "tito carnes") sin perderlas.
- **Se reutiliza lo que ya funciona:** `codigo` y `razonSocial` de Facturación, y el esquema entidad + movimientos de Gestión de Deudas.
- Si prefieren no unir clientes de Facturación (que son clientes fiscales), el contacto puede **referenciarlos** con `facturacionClienteId` en lugar de absorberlos. Ver preguntas abiertas.

### Movimientos (deuda, cobros, pagos)

Un único libro por contacto, en subcolección, con el sentido explícito:

```js
// contactos/{contactoId}/movimientos/{movId}
{
  tipo: 'compra' | 'venta' | 'pago_emitido' | 'cobro' | 'saldo_a_favor' | 'nota_credito' | 'ajuste',
  monto, fecha, medio, nota,
  origen: { tipo: 'entrada_mercaderia' | 'reparto' | 'saldo_cliente' | 'factura' | 'transferencia',
            id, semanaId },
  anulado: false, timestamp
}
```

- **Compra** (se le compró mercadería) **suma a lo que le debemos**; **venta** suma a lo que nos debe; **pago_emitido** y **cobro** los reducen.
- El **saldo neto** = lo que nos debe − lo que le debemos, con signo: positivo = nos debe, negativo = le debemos. Es exactamente el cálculo que hoy hace SaldoClientes a mano ("te debe / le debés").
- Los movimientos tienen `origen`, así que desde un movimiento se llega a la boleta o al reparto que lo generó.

### 3.1 Dato de uso real: casi todos compran y venden

Casi todos los proveedores y clientes del negocio **son las dos cosas a la vez**: se les compra mercadería y se les vende. Consecuencias para el diseño:

- **Los roles no son una puerta, son una etiqueta.** Un contacto nuevo nace con **proveedor y cliente tildados por defecto**; destildar uno es la excepción, no la regla.
- El selector **no filtra por rol de forma estricta**: muestra a todos y ordena primero a los que tienen el rol relevante para la pantalla. Así nunca queda "escondido" alguien al que se le compra y se le vende.
- La ficha muestra **compras y ventas juntas** y el **saldo neto** como dato principal, porque es lo que importa cuando se opera con la misma persona en los dos sentidos.
- Evita el caso que hoy genera duplicados: crear "Tito" como proveedor en un lado y "Tito" como cliente en otro.

### 3.2 Cómo se llama el objeto

El nombre tiene que ser claro para el usuario, que piensa en "mis proveedores / mis clientes", no en una tabla.

| Opción | A favor | En contra |
|---|---|---|
| **Contacto** | Corto, neutro, no obliga a elegir entre proveedor y cliente; sirve para la API y la base | Algo genérico; "contacto" suena a agenda telefónica |
| **Proveedor / Cliente** (como texto de la UI) | Es literalmente como lo dicen hoy; lo pidió el botón | Largo; en el código obliga a decidir un nombre único igual |
| **Cuenta** | Remite a "cuenta corriente" y saldo, que es lo que se hace con ellos | Se confunde con cuenta de usuario o cuenta bancaria |
| **Socio comercial** | Describe la relación de compra y venta | Formal, poco usado en el día a día |

**Recomendación:**
- En el **código y la base**: `contactos` (neutro y estable).
- En la **interfaz**: donde el usuario elige uno, la etiqueta es **"Proveedor o cliente"**, tal como lo pidió; en la navegación y la ficha, **"Contactos"**. Así el término técnico no se le cruza al usuario.

---

## 3.3 Saldo Clientes: nombre libre + botón "Seleccionar proveedor o cliente"

**Requisito:** en Saldo Clientes se tiene que **poder seguir escribiendo cualquier nombre**, con cualquier persona, sin que esté registrada. Hoy funciona así y **no se toca**: se escribe el nombre, se calcula el saldo y se guarda, sin relacionar nada. El objeto es una **ayuda opcional**, nunca un requisito.

### Dos formas de elegir a la persona

| | Escribir el nombre (como hoy) | Botón "Seleccionar proveedor o cliente" |
|---|---|---|
| Qué hace | Texto libre en el input | Abre el selector de contactos |
| Queda registrado | Solo el nombre en el saldo | `contactoId` + nombre copia |
| Relación | Ninguna (`contactoId: null`) | Con el contacto y su historial |
| Obliga a algo | No | No |

Las dos conviven: se puede escribir un nombre, seleccionar uno, o seleccionar y después retocar el texto.

### Cómo se ve

```
Cliente
┌──────────────────────────────┐ ┌──────────────────┐
│ Escribí el nombre…            │ │ Seleccionar      │   ← botón a la mitad del ancho del input
└──────────────────────────────┘ │ proveedor/cliente│
                                  └──────────────────┘
```

- **El botón va a la derecha del input**, de **la mitad de su ancho**, mismo alto. En pantallas angostas pasa debajo del input a ancho completo.
- Texto: **"Seleccionar proveedor o cliente"**; con ícono de personas (SVG, NEWLOOK) y estilo ghost, para no competir con el input ni con el botón principal.
- Una vez elegido un contacto, el input se rellena con su nombre y aparece una **pill discreta** "Vinculado" con una `×` para **desvincular** y volver a texto libre.

### Qué abre el botón

Un modal NEWLOOK (overlay con blur, header con label y título) con:
- **Buscador** arriba (nombre, alias, teléfono, CUIT), con foco automático.
- Lista de contactos con su **saldo neto** y una línea de resumen ("Compro y vendo · última operación el 03/10"), ordenados por último uso.
- **"+ Crear nuevo"** al pie, con alta rápida (solo nombre), roles proveedor y cliente tildados por defecto (ver 3.1).
- Al elegir uno: se cierra el modal, se completa el nombre y se cargan **por id**: sus boletas de compra de la semana y sus saldos anteriores.

### Qué pasa con la coincidencia por texto de hoy

Hoy, al escribir un nombre, la app ya busca boletas de mercadería y saldos previos con el mismo texto. Para no romper el uso actual:

- **Se mantiene** esa coincidencia por texto cuando no hay contacto seleccionado, tal cual funciona hoy.
- Cuando hay un contacto seleccionado, se usa **el id** (más preciso: no depende de tildes ni de cómo se escribió).
- *Opcional, a decidir:* si el texto escrito coincide con un contacto existente, mostrar una **sugerencia no intrusiva** "¿Es Tito? Vincular" que el usuario puede ignorar. Nunca vincula solo.

### Guardado

- **Sin contacto:** el saldo se guarda exactamente como hoy.
- **Con contacto:** el saldo guarda además `contactoId`; y los movimientos (compras vinculadas, saldo a favor, cobros) se registran en el libro del contacto (sección 3).
- Un saldo guardado sin contacto **se puede vincular después** desde la card (acción "Vincular a un contacto"), útil para los viejos.

---

## 3.4 Renombrar "Saldo Clientes" → "Saldo Proveedores"

**Decisión:** la pantalla se llama **Saldo Proveedores**. Es lo que realmente es: con esa persona se cruzan las **boletas de mercadería que nos vendió** (compras), lo que nosotros le vendimos y lo cobrado/pagado. Además, el módulo vecino ya se llama así: `src/components/saldoProveedor/`, colección `saldoProveedorVinculaciones` y [README-SALDO-PROVEEDOR-PENDIENTE.md](README-SALDO-PROVEEDOR-PENDIENTE.md). Hoy la vinculación va "Saldo *Cliente* → boleta → Pagos a *Proveedores*", con dos nombres para lo mismo; con el cambio queda **Saldo Proveedores ↔ Pagos a Proveedores**.

### Qué se renombra (lo que ve el usuario)

| Dónde | Hoy | Pasa a |
|---|---|---|
| Navegación | `label: 'Saldo Clientes'`, `desc: 'Calculá y guardá saldos de clientes'` en [navItems.js](src/config/navItems.js) | `Saldo Proveedores` / "Calculá y guardá saldos de proveedores" |
| Ruta | `/saldo-clientes` en [App.jsx](src/App.jsx) | `/saldo-proveedores`, **dejando `/saldo-clientes` como redirección** para que no se rompan marcadores ni enlaces guardados |
| Título de la pantalla | "Saldo Clientes" | "Saldo Proveedores" |
| Textos en pantalla | "Sin clientes guardados", "Cliente guardado exitosamente", "Por favor ingrese el nombre del cliente", "Sin cliente", "Clientes Guardados" | Versión con "proveedor" (o "proveedor o cliente" donde la persona puede ser ambas cosas) |
| Botón de importar | "Importar boletas a Saldo Clientes" ([SaldoClientes.jsx:1215](src/pages/SaldoClientes.jsx:1215)) | "Importar boletas a Saldo Proveedores" |
| Resumen impreso | "Resumen de Cuenta con …" | Se mantiene (ya es neutro) |
| Documentación | READMEs que lo mencionan (README.md, README-TODO, README-NAVBAR-*, README-NEWLOOK, README-AUTO-SAVE-PRINT, README-PAGOS-PROVEEDORES-CONTEXT, README-SALDO-PROVEEDOR-PENDIENTE) | Actualizar el nombre en el mismo cambio |

### Qué NO se renombra (interno) — a propósito

Para no necesitar migración de datos ni arriesgar el historial, estos nombres **se quedan** hasta que haya un motivo para tocarlos:

- Colección **`clientBalances`**, hook `useClientBalances`, campos `nombreCliente` / `clientName`.
- Archivo `SaldoClientes.jsx`, componentes `ClienteDeudorCard` y `EditClienteModal`, y la clase CSS `.saldo-clientes-page`.
- `layoutId="saldo-filter-indicator"` y otros ids internos.

Renombrar archivos y componentes se puede hacer **después** con `git mv`, sin tocar datos. Los campos de la base (`nombreCliente`, `clientBalances`) solo se cambiarían con una migración y no aportan nada al usuario.

### Cómo se lleva con el botón de selección

- El **título** de la pantalla es "Saldo Proveedores".
- La **etiqueta del input** del nombre pasa a "Proveedor" (placeholder "Escribí el nombre…").
- El **botón** conserva el texto pedido: **"Seleccionar proveedor o cliente"**, porque la persona elegida puede ser ambas cosas (3.1) y el catálogo es único (`contactos`).
- Los **textos de error y confirmación** usan "proveedor"; solo se nombra "cliente" donde se hable explícitamente de ventas a esa persona.

### Consistencia con otras pantallas (decidir)

Si "Saldo Clientes" pasa a "Saldo Proveedores", quedan dos nombres que conviene revisar para no generar incoherencias:
- **Transferencias** usa la colección `TransferenciasClientes` y habla de "cliente" en su resumen ("te debe / le debés"). Mismo criterio de persona dual.
- **Mi Reparto** sí es de clientes (repartos de venta), por lo que **se queda** con "cliente".

---

## 4. Cómo se relaciona con cada parte (qué cambia y qué no)

| Parte | Hoy | Con el objeto |
|---|---|---|
| **Ingreso de mercadería** (P1–P3) | Selector de strings; para agregar uno nuevo hay que ir al modal "Gestionar proveedores" | Selector de contactos con rol proveedor y **"+ Crear proveedor" ahí mismo** (alta rápida inline); la entrada guarda `proveedorId` + `proveedor` (copia del nombre) |
| **Pagos a proveedores** (P4–P5) | Por nombre y por posición de boleta | Cada boleta con **id propio** (`entradaId`); el pago es un movimiento `pago_emitido` del contacto |
| **Saldo a favor** (P6) | `saldoProveedorVinculaciones` por nombre | Movimiento `saldo_a_favor` con `origen` al saldo cliente; se migra la colección |
| **Saldo Clientes** (C2) | Escribir nombre → coincidencia de texto con boletas y saldos previos | **Se mantiene el texto libre tal cual** y se suma el botón "Seleccionar proveedor o cliente" (ver 3.3); si se elige un contacto, trae **por id** sus compras y saldos previos |
| **Mi Reparto** (C1) | `clientName` texto | Autocompletar contacto con rol cliente; guarda `contactoId` |
| **Transferencias** (C3), **Clientes de la semana** (C4) | Texto | Igual: `contactoId` + nombre copia |
| **Facturación** (C5) | Catálogo propio con `codigo` | Se enlaza o absorbe (ver preguntas) |
| **Gestión de Deudas** (C7) | `deudaPersonas` aparte | Pasa a ser una vista del libro de movimientos del contacto |
| **Lista de Precios** (P9) | Colección `proveedores` + `proveedorId` | Apunta al contacto; el id existente se conserva si se reutiliza la colección |
| **Libro de Cheques** (C8) | `librador`/`endosadoA` texto | Opcional: `contactoId` para ver los cheques de una persona en su ficha |
| **Balance** (P7), **Estadísticas** (P8) | Filtran por nombre | Filtran por `proveedorId`; ya no se duplican por tildes |

---

## 5. Ver qué mercadería se le compró o se le vendió

La ficha del contacto tiene una pestaña **Mercadería** con dos secciones, según sus roles:

- **Le compré** (rol proveedor): entradas de `semanaActiva.mercaderia` con su `proveedorId`. Se agrupa por corte y por semana: `Asado · 120 kg · $…`, con kg totales, costo y costo promedio por kg, y un selector de semana.
- **Le vendí** (rol cliente): lo vendido a esa persona, que hoy aparece como `ventas` en SaldoClientes y como boletas en `clientesCuenta`. Se muestra por fecha y monto.

> **Dato a resolver:** hoy "lo que se le vendió" se guarda como **monto por fecha**, sin detalle de cortes/kg. La mercadería *comprada* sí tiene cortes y kg; la *vendida* no. Para mostrar "qué mercadería se le vendió" hay que decidir si se registra el detalle de cortes en la venta o si basta con el monto (ver preguntas).

Atajo útil: desde una boleta de compra, ver a qué **contacto** pertenece y su **saldo neto** sin salir de la card.

---

## 6. Qué es crear el proveedor desde el ingreso de mercadería

- En el formulario de mercadería, el campo proveedor pasa a ser un **combobox con búsqueda**: escribe, filtra contactos con rol proveedor y, si no existe, ofrece **Crear "xyz"** con un mini formulario (nombre; resto opcional).
- Si el nombre coincide con un **cliente existente**, no se duplica: ofrece **"Agregar rol proveedor a Tito"**. Esto es lo que evita crear dos fichas para la misma persona.
- Detección de duplicados por `nombreNormalizado` y por `alias`, con aviso antes de crear.

---

## 7. Migración (sin romper lo que existe)

1. **Inventario**: recolectar todos los nombres únicos de P1–P9 y C1–C9 y agruparlos por `nombreNormalizado`.
2. **Revisión manual** de casos dudosos (nombres parecidos, mismo nombre en dos roles). Es la parte delicada: dos personas distintas con el mismo nombre hoy ya están mezcladas.
3. Crear los contactos y completar `roles` según dónde aparece cada nombre.
4. **Backfill de ids**: agregar `contactoId` en la semana activa y en repartos/saldos/transferencias recientes. Lo antiguo queda por nombre.
5. **Período de convivencia**: todas las lecturas hacen "buscar por `contactoId`; si no hay, caer al nombre normalizado".
6. Convertir `saldoProveedorVinculaciones`, `pagosProveedores` y `deudaMovimientos` en movimientos. Conservar las colecciones viejas hasta validar.
7. **Arreglar el índice de boletas**: dar un `id` estable a cada entrada de mercadería y migrar `mercaderiaIndex` / `boleta-{n}` a ese id.
8. Pasar el catálogo a **compartido** (hoy `user_configs` es por `userId`).

---

## 8. Riesgos y cuidados

- **Falsos positivos al unir**: dos personas con el mismo nombre. Nunca unir en automático; siempre confirmar.
- **Falsos negativos**: la misma persona escrita distinto ("Tito" / "Tito Carnes"). Se cubre con `alias` y revisión.
- **Índices de boletas**: es el punto más frágil de hoy; migrarlo a ids estables es parte del trabajo, no un extra.
- **Firestore**: no admite arrays dentro de arrays, y reescribir arrays grandes desde dos dispositivos pisa datos; por eso los movimientos van en subcolección.
- **Reglas de seguridad**: hoy todo usuario autenticado lee y escribe todo; si se suman CUIT y saldos conviene revisarlas.
- **Cambio grande**: tocar 9+ pantallas. Hacerlo por etapas, con lectura doble (id → nombre) para no bloquear el uso diario.

---

## 9. Orden sugerido

1. **Renombrar la pantalla a Saldo Proveedores** (3.4): solo textos, navegación y redirección de ruta; sin tocar datos. Es un cambio chico y seguro, por eso va **primero**.
2. **Contacto + alta rápida en el ingreso de mercadería** (la necesidad concreta que se planteó): catálogo único para proveedores, con detección de duplicados. Sin tocar el resto todavía.
3. **`proveedorId` en las entradas** y migración del índice de boletas a ids estables.
4. **Botón "Seleccionar proveedor o cliente" en Saldo Proveedores** (3.3), con el texto libre intacto. Es el primer cambio funcional en esa pantalla y no rompe nada: sin contacto elegido todo funciona como hoy.
5. **Ficha del contacto** con pestaña Mercadería ("le compré").
6. **Movimientos** (compras, pagos, saldo a favor) y saldo neto.
7. **Rol cliente** en Mi Reparto y Transferencias, con el mismo patrón (texto libre + botón).
8. **"Le vendí"** y unificación con Facturación y Gestión de Deudas.

---

## 10. Preguntas abiertas

- ¿Unificamos **todo en `contactos`** (clientes de Facturación y personas de Deudas incluidos) o se mantiene cada catálogo y el contacto solo los **referencia**? Lo segundo es más seguro como primer paso.
- Para "qué mercadería se le **vendió**": ¿se quiere registrar el detalle de cortes y kg en la venta, o alcanza con el monto como hoy?
- ¿Hay personas con **el mismo nombre que son distintas** (dos "Carlos")? Condiciona cómo se hace la migración.
- ¿El **código autonumérico** de Facturación debe ser el código del contacto para todos?
- ¿La lista de contactos debe ser **compartida** entre usuarios (como el resto de la app)?
- ¿Cuántas **semanas anteriores** se migran con `proveedorId`: solo la activa, o todo el historial?
- ¿Les cierra el nombre **"Contactos"** para la navegación y la ficha, con **"Seleccionar proveedor o cliente"** en el botón? (ver 3.2)
- En Saldo Clientes, al escribir un nombre que coincide con un contacto: ¿querés la **sugerencia "¿Es Tito? Vincular"** o preferís que no aparezca nada y vincular solo con el botón?
- ¿El botón y el texto libre se replican igual en **Mi Reparto** y **Transferencias**, o solo en Saldo Proveedores por ahora?
- ¿**Transferencias** también pasa a hablar de "proveedor", o se queda con "cliente"? (ver 3.4)
- ¿Se mantiene un tiempo la **redirección** de `/saldo-clientes`, o se corta directo?
- ¿La etiqueta del input se llama **"Proveedor"** o **"Proveedor o cliente"**?
