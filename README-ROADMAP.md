# Roadmap — Proveedores, Saldos y Seguimiento de Repartos

Plan de trabajo que ordena los tres documentos de diseño recientes. Cada fase es **entregable por sí sola** y no deja la app rota a mitad de camino.

| Documento fuente | Qué aporta |
|---|---|
| [README-PROVEEDOR-OBJETO-RELACIONES.md](README-PROVEEDOR-OBJETO-RELACIONES.md) | El **contacto** (proveedor y/o cliente), relaciones, movimientos, renombre a *Saldo Proveedores* y botón de selección |
| [README-MEJORAS-GESTION-PROVEEDORES.md](README-MEJORAS-GESTION-PROVEEDORES.md) | Buscador, modal, cards agrupadas por proveedor, boleta tipo ticket, productos por proveedor |
| [README-REPARTO-SEGUIMIENTO.md](README-REPARTO-SEGUIMIENTO.md) | Seguimiento de repartos hechos: pagos, deudas y vista consolidada |

> La sección 7 de `README-MEJORAS-GESTION-PROVEEDORES.md` queda **reemplazada** por el README de relaciones. Si hay diferencias, manda el de relaciones.

> **Fuera de alcance por ahora: Mi Reparto.** Ni la pantalla ni la colección `repartos` ni el seguimiento de repartos se tocan en este plan. Lo que quedó escrito sobre ellos es solo registro de lo observado, para retomarlo cuando se decida.

---

## Principios del plan

1. **Nada se rompe en el camino.** Cada fase mantiene la lectura "por id, y si no hay, por nombre". El texto libre sigue funcionando siempre.
2. **Primero lo seguro y chico, después lo grande.** Se empieza por textos y rutas, y recién después se toca la estructura de datos.
3. **Un cambio de datos por vez**, con una forma de verificar que no se perdió nada antes de seguir.
4. **Fases independientes** donde se pueda: el seguimiento de repartos no depende de los contactos.
5. **Diseño visual según [README-NEWLOOK.md](README-NEWLOOK.md)** en todo lo que se toque.

---

## Vista general

```
Fase 0  Verificaciones previas            ▪ (chica)
Fase 1  Renombrar a Saldo Proveedores     ▪ (chica)
Fase 2  Contacto + alta rápida            ▪▪ (media)
Fase 3  proveedorId e ids estables        ▪▪▪ (grande, la delicada)
Fase 4  Botón "Seleccionar" en Saldo      ▪▪ (media)
Fase 5  Mejoras de Gestión (UI)           ▪▪▪ (grande)
Fase 6  Movimientos y ficha del contacto  ▪▪▪ (grande)
Fase 7  Seguimiento de repartos           ⏸ en pausa (Mi Reparto fuera de alcance)
Fase 8  Rol cliente y unificación         ▪▪ (media)
```

Dependencias:

```
F0 ─▶ F1 ─▶ F2 ─▶ F3 ─▶ F4 ─▶ F6 ─▶ F8
                  └──▶ F5 ──┘
F7 en pausa (independiente; se retoma cuando se decida tocar Mi Reparto)
```

---

## Fase 0 — Verificaciones previas

**Objetivo:** no construir sobre algo roto.

- ~~Aclarar la inconsistencia de `updatePayment`~~ → solo **registrada** (ver resultado); Mi Reparto no se toca.
- Hacer un **inventario de nombres** de proveedor/cliente en los datos reales (entradas, pagos, saldos, repartos) para saber cuántos duplicados y variantes hay antes de migrar.
- Respaldo/exportación de las colecciones que se van a tocar (`gestion_semanal`, `saldoProveedorVinculaciones`, `user_configs`, `proveedores`, `clientBalances`).

**Listo cuando:** hay un listado de nombres únicos y variantes, y se sabe qué hace realmente `updatePayment`.

### Resultado (10/10/2026) — ✅ cerrada

Respaldo en solo lectura de **16 colecciones** (guardado fuera del repo, con un `_inventario.md` con los nombres reales; no se versiona porque contiene datos de clientes). Hallazgos, solo agregados:

**1. Mi Reparto — solo registro, sin tocar.** `updatePayment` no se ejecuta hoy (confirmado en lectura, sin cambios al código). Queda anotado como riesgo latente para cuando se retome Mi Reparto.

**2. Nombres.** 142 personas/lugares distintos tras normalizar (mayúsculas, tildes y espacios), con **34 nombres escritos de formas distintas** (ej. un cliente con 4 variantes de mayúsculas y hasta 77 menciones). Otros **53 pares parecidos** son posibles duplicados por error de tipeo y requieren revisión manual.
- **9 aparecen en ambos lados** (proveedor y cliente), incluidos los dos con más movimiento; confirma que el contacto con doble rol es necesario.
- Parte de los nombres de repartos **no son personas sino lugares o direcciones**; por eso el contacto debe ser siempre opcional y el texto libre se conserva. Esto es solo una observación: Mi Reparto no se modifica.
- **7 proveedores se usaron en entradas de mercadería sin estar en ninguna lista** (variantes de otros o nombres sueltos), y hay valores que no son proveedores en las listas (ej. "semana anterio", "para pedido de …").

**3. `user_configs` está fragmentada.** **21 documentos de 14 `userId`** (cada navegador anónimo crea un uid nuevo) y **6 listas de proveedores distintas**: una completa (22), una intermedia (12), la mayoría con los 8 por defecto y 3 vacías. Hoy cada sesión ve su propia lista. La lista completa es la base para importar en la Fase 2.

**4. Boletas.**
- **922 de 922 entradas sin id propio**: se identifican por posición.
- `boletasPagadas`: 102 claves, **0 apuntan a una posición inexistente** (hoy está consistente).
- **Vinculaciones de saldo (9):** no guardan `semanaId`, solo índices. Por nombre de proveedor + índices **solo 1 de 9 se resuelve a una única semana**; el resto coincide con entre 2 y 8 semanas. Para migrarlas hay que apoyarse en la fecha del saldo y revisar a mano los ambiguos. **Esto ya se puede perder si se borra o reordena una entrada.**
- Semanas: 44 (1 activa, 43 cerradas), 43 con mercadería. Entradas sin proveedor: 0.

**5. Repartos — solo registro, sin tocar.** Hay datos duplicados (`clientes` y `clients`) en algunos repartos. Queda para cuando se retome Mi Reparto.

**Impacto en las fases siguientes**
| Fase | Ajuste |
|---|---|
| 2 | Importar desde la lista completa de `user_configs` + colección `proveedores` + los 7 nombres usados sin lista; descartar valores basura con revisión; catálogo compartido (no por usuario) |
| 3 | Las 9 vinculaciones requieren resolver semana por fecha + revisión manual; priorizar guardar `semanaId` en las nuevas **antes** de migrar |
| 7 | **En pausa** (Mi Reparto fuera de alcance) |
| 8 | Sin Mi Reparto por ahora |

---

## Fase 1 — Renombrar a Saldo Proveedores

**Origen:** README relaciones, sección 3.4. **Tamaño:** chica. **Riesgo:** bajo.

- Navegación, título y textos de la pantalla ("proveedor" donde corresponde).
- Ruta `/saldo-proveedores` con **redirección** desde `/saldo-clientes`.
- Actualizar los READMEs que mencionan el nombre.
- **No** tocar `clientBalances`, `nombreCliente` ni nombres de archivos.

**Listo cuando:** la pantalla se ve y se llama distinto, y los enlaces viejos siguen funcionando.

### Resultado (10/10/2026) — ✅ cerrada

- Navegación: **Saldo Proveedores** (`/saldo-proveedores`); `/saldo-clientes` redirige con `<Navigate replace>`.
- Pantalla: etiqueta del input **"Proveedor"** (decisión tomada: se pidió "Proveedor o cliente" solo para el botón de la Fase 4), sección "Datos del Proveedor", lista "Proveedores Guardados" y estados vacíos.
- Mensajes: "Saldo guardado/actualizado exitosamente" (más preciso que "cliente guardado": lo que se guarda es el saldo con esa persona).
- Modal de edición: "Editar saldo", "Datos del proveedor" y textos de balance.
- Se mantiene sin cambios: "venta mía al cliente" (es correcto: se le vendió a esa persona), el resumen impreso y todos los nombres internos (`clientBalances`, `nombreCliente`, `SaldoClientes.jsx`, `.saldo-clientes-page`).
- READMEs actualizados con el nuevo nombre.

---

## Fase 2 — Contacto + alta rápida en el ingreso de mercadería

**Origen:** README relaciones, secciones 3, 3.1, 3.2 y 6. **Tamaño:** media.

- Crear la colección `contactos` (compartida, no por `userId`) con `nombre`, `nombreNormalizado` único, `roles` (ambos tildados por defecto) y `alias`.
- En el formulario de mercadería: **combobox con búsqueda** y **"Crear proveedor"** inline.
- Detección de duplicados por nombre normalizado y alias; si ya existe como cliente, ofrece **agregar el rol** en vez de duplicar.
- **Importar** los proveedores actuales (`user_configs.proveedores` y colección `proveedores`) como contactos, uniendo por nombre normalizado con revisión manual de dudosos.
- La entrada sigue guardando el **nombre**; el `proveedorId` se suma en la fase 3.

**Listo cuando:** se puede crear un proveedor desde el ingreso de mercadería y existe un único catálogo; nada de lo anterior dejó de funcionar.

### Resultado (10/10/2026) — ✅ cerrada

- **Colección `contactos`** (compartida): `nombre`, `nombreNormalizado`, `roles { proveedor, cliente }`, `alias`, `activo`, `origen`. Hook `useContactos` y utilidades en `src/utils/nombres.js`.
- **Importación:** 32 contactos creados desde la lista completa de `user_configs`, la colección `proveedores` y los nombres usados en mercadería (se descartaron 2 valores que no eran proveedores). Roles por defecto: proveedor y cliente. "J & L Paulin" / "J&L paulin" quedaron como un solo contacto con alias. Idempotente (segunda corrida: 0 creados).
- **Formulario de mercadería:** selector con **búsqueda** (nombre y alias), **últimos usados**, **"+ Crear proveedor"** inline, aviso de **nombres parecidos** y "agregar también como proveedor" si el contacto existía solo como cliente.
- **Modal "Gestionar proveedores":** ahora opera sobre contactos; "Eliminar" pasa a **Archivar** (conserva el historial) y se quitó "Restaurar lista por defecto".
- **Entradas nuevas** guardan `proveedorId` además del nombre; al editar una entrada se recalcula. Las anteriores siguen funcionando por nombre.
- **Sin cambios:** Pagos a Proveedores, Balance, Saldo, Lista de Precios (sigue con su colección `proveedores`) y los datos históricos.
- **Pantalla básica "Proveedores y Clientes"** (adelantada de la Fase 6): tarjeta en Inicio, ruta `/contactos`. Buscar, crear, editar (nombre, roles, teléfono, otros nombres, notas), archivar y reactivar; filtros Todos / Proveedores / Clientes / Archivados. No aparece en la barra flotante. Sin deuda, movimientos ni unión de duplicados todavía.
- **Pendiente de revisión manual (no se unieron):** "Pilotti" / "Pilloti" / "Leandro Pilotti" / "Leandro", "Mariano" / "Mariano Valle", "Paulin" / "J & L Paulin". No hay función de unir contactos todavía.

---

## Fase 3 — `proveedorId` en las entradas e ids estables de boleta

**Origen:** README relaciones, secciones 2.3 y 7. **Tamaño:** grande. **Riesgo:** alto, por eso va antes que cualquier funcionalidad nueva.

- Cada entrada de mercadería recibe un **`id` propio** y un **`proveedorId`**, conservando el nombre como copia.
- Migrar `mercaderiaIndex` y `boleta-{n}` (posición en el array) a ese id en: pagos, `pagosProveedoresEstado.boletasPagadas`, vinculaciones y saldos.
- Backfill de la **semana activa** primero; semanas cerradas de a poco y por demanda.
- Lectura doble en todos los consumidores: Pagos Proveedores, Balance, Estadísticas, Saldo.
- Mientras tanto, el índice viejo sigue siendo válido (no se elimina hasta validar).

**Listo cuando:** borrar o reordenar una entrada ya no desplaza pagos ni vinculaciones, y los totales de Balance y Pagos coinciden con los de antes de migrar.

### Resultado (10/10/2026) — ✅ cerrada

**Código (compatible hacia atrás):**
- Cada entrada nueva recibe un **`id` propio** (`ent_…`) y `proveedorId`; al editarla se conservan (antes el guardado reemplazaba la entrada completa y los habría perdido).
- La boleta se identifica por `boleta-{id}`; las entradas sin id caen a `boleta-{posición}` como antes. Helper en `src/utils/boletas.js`.
- Los vínculos de Saldo guardan `mercaderiaEntradaId` y `semanaId`, y el descuento en Pagos a Proveedores compara por **id** (solo las vinculaciones sin ids usan la posición).
- El badge de boletas pendientes cuenta por entrada (con claves viejas y nuevas conviviendo, contar valores las duplicaría).
- **Bug corregido:** el modal de edición de saldo calculaba el índice dentro de la lista *filtrada* por proveedor, no la posición real de la entrada. Explica parte de los vínculos desplazados.

**Datos (script idempotente, con respaldo previo `Reparto-backup-2026-10-10-pre-fase3`):**
| Qué | Resultado |
|---|---|
| Entradas con id propio | **922 / 922** (44 semanas, no solo la activa) |
| Entradas con `proveedorId` | **919 / 922** (las 3 restantes son valores que no eran proveedores) |
| `boletasPagadas` con clave por id | 102 claves agregadas (se conservan las viejas) |
| Vinculaciones de saldo resueltas a su semana | **7 / 9** (5 por posición + monto, 2 por monto con la posición desplazada) |
| Saldos con boletas de mercadería resueltos | **28 / 32** |
| Pagos a proveedores (`pagosProveedores`) | no hay registros; nada que migrar |

**Pendiente de revisión manual (4 saldos + 2 vinculaciones, todos de un mismo proveedor, junio–agosto):** sus montos ya no coinciden con ninguna entrada (precios editados o entradas borradas). Mantienen el comportamiento anterior (por posición), así que podrían aplicar un descuento a la boleta equivocada hasta resolverlos a mano.

**Cuidado al desplegar:** la versión publicada todavía lee las claves por posición. Publicar la nueva versión **pronto**: lo que se marque como pagado en la versión vieja después de la migración no lo ve la nueva (y al revés).

---

## Fase 4 — Botón "Seleccionar proveedor o cliente" en Saldo Proveedores

**Origen:** README relaciones, sección 3.3. **Tamaño:** media.

- Input de nombre **intacto** (texto libre, sin registrar a nadie, como hoy).
- Botón a la derecha, **a la mitad del ancho del input**, que abre el selector de contactos.
- Contacto elegido → carga por **id** sus compras de la semana y saldos previos; pill "Vinculado ×" para volver a texto libre.
- Guardado con `contactoId` cuando hay contacto; igual que hoy cuando no.
- Acción "Vincular a un contacto" en saldos ya guardados.

**Listo cuando:** se puede hacer un saldo con un nombre cualquiera y también con un contacto, y ambos se guardan sin errores.

---

## Fase 5 — Mejoras de Gestión de proveedores (UI)

**Origen:** README mejoras, secciones 1, 2, 3, 5 y 6. **Tamaño:** grande.

Orden interno:
1. **Buscador y modal** NEWLOOK de proveedores, ya sobre `contactos`.
2. **Cards agrupadas por proveedor** (por `proveedorId`) con totales y chips de productos de la semana.
3. **Rediseño de las cards** de mercadería dentro de cada grupo.
4. Mismo agrupado en **Pagos Proveedores**.

**Listo cuando:** en la pestaña Mercadería cada proveedor tiene un solo bloque con sus entradas y su resumen de la semana.

---

## Fase 6 — Movimientos y ficha del contacto

**Origen:** README relaciones, secciones 3 y 5; README mejoras, punto 4 (ticket). **Tamaño:** grande.

- Subcolección `contactos/{id}/movimientos` (compra, pago, saldo a favor, nota de crédito, ajuste), con `origen` y anulación en vez de borrado.
- Migrar `pagosProveedores` y `saldoProveedorVinculaciones` a movimientos (conservando las colecciones viejas hasta validar).
- **Saldo neto** del contacto.
- **Ficha del contacto**: datos, deuda actual, historial y pestaña **Mercadería ("le compré")**.
- **Boleta tipo ticket**: sello "REGISTRADO ✓", código de referencia y marca de modificación.

**Listo cuando:** la deuda de un proveedor se calcula desde los movimientos y coincide con lo que mostraba Pagos Proveedores antes.

---

## Fase 7 — Seguimiento de repartos  ⏸ EN PAUSA

**Origen:** README seguimiento. **Estado:** en pausa por decisión: Mi Reparto no se toca todavía. Se conserva la descripción para retomarla.

**Tamaño:** grande. **Independiente:** no depende de las otras fases.

Orden interno:
1. `pagos[]` por cliente con estado derivado y compatibilidad con repartos viejos.
2. **Modal de seguimiento**: barra de progreso, lista Todos / Deben / Pagaron, "Pagó todo".
3. **Formulario de pago** (parcial, medio, fecha) e historial por cliente.
4. **Notas y fecha prometida**, con estado "vencido".
5. **Vista consolidada "Quién me debe"** con antigüedad de deuda.
6. Dona por medio de pago (extra).

**Listo cuando:** sobre un reparto ya guardado se puede registrar un cobro en dos toques y ver quién falta.

---

## Fase 8 — Rol cliente y unificación

**Origen:** README relaciones, secciones 4 y 5. **Tamaño:** media.

- Mismo patrón **texto libre + botón de selección** en Transferencias, con `contactoId`. *(Mi Reparto queda afuera por ahora.)*
- **"Le vendí"**: ver la mercadería vendida a un contacto (requiere decidir si se registra el detalle de cortes).
- Enlazar o absorber **Facturación** (`facturacion_clientes`) y **Gestión de Deudas** (`deudaPersonas`) en el catálogo único.
- Opcional: `contactoId` en Libro de Cheques.

**Listo cuando:** una persona que compra y vende aparece como un solo contacto en todas las pantallas.

---

## Qué NO está en el roadmap (a propósito)

- Renombrar la colección `clientBalances` ni campos como `nombreCliente`: no aporta al usuario y exige migración.
- Cambios de reglas de seguridad de Firestore (se revisan solo si se suman datos sensibles como CUIT).
- Aplicar contactos al módulo de **Lista de Precios** más allá de enlazar `proveedorId` (ya existe).

---

## Decisiones pendientes que bloquean fases

| Decisión | Bloquea | Documento |
|---|---|---|
| ¿Unificar todo en `contactos` o solo referenciar catálogos existentes? | Fase 2 y 8 | Relaciones, 10 |
| ¿Hay personas distintas con el mismo nombre? | Fase 2 y 3 (migración) | Relaciones, 10 |
| ¿Cuántas semanas anteriores se migran? | Fase 3 | Relaciones, 10 |
| ¿Se registra el detalle de cortes en las ventas? | Fase 8 ("le vendí") | Relaciones, 5 |
| ¿Etiqueta del input "Proveedor" o "Proveedor o cliente"? | Fase 1 y 4 | Relaciones, 3.4 |
| ¿La lista de contactos es compartida entre usuarios? | Fase 2 | Relaciones, 10 |
| ¿Un cliente puede deber de varios repartos y el pago se imputa al más viejo? | Fase 7 | Seguimiento, 9 |

---

## Estado

| Fase | Estado |
|---|---|
| 0 Verificaciones previas | ✅ Hecha (10/10/2026) |
| 1 Renombrar a Saldo Proveedores | ✅ Hecha (10/10/2026) |
| 2 Contacto + alta rápida | ✅ Hecha (10/10/2026) |
| 3 `proveedorId` e ids estables | ✅ Hecha (10/10/2026) |
| 4 Botón de selección en Saldo | Pendiente |
| 5 Mejoras de Gestión (UI) | Pendiente |
| 6 Movimientos y ficha | Pendiente |
| 7 Seguimiento de repartos | ⏸ En pausa (Mi Reparto fuera de alcance) |
| 8 Rol cliente y unificación | Pendiente |

> Actualizar esta tabla a medida que se cierre cada fase.
