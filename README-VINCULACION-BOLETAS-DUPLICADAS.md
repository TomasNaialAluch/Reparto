# 📦 Vincular Mercadería: marcar boletas ya usadas en otro Saldo Cliente

## El problema

Al armar un Saldo Cliente y abrir **"📦 Vincular Mercadería"**, el modal muestra **todas** las
boletas de la semana abierta para ese proveedor — incluidas boletas que ya se cargaron en un
Saldo Cliente anterior (de otro día de la misma semana). No hay forma de distinguir, de un
vistazo, cuáles ya se usaron y cuáles siguen libres.

## Causa raíz

`obtenerBoletasMercaderia()` en [SaldoClientes.jsx:487-510](src/pages/SaldoClientes.jsx#L487-L510)
trae todas las boletas de mercadería de la semana para ese proveedor. Sobre esa lista, el modal
hoy solo distingue:

1. **`yaVinculada`** ([SaldoClientes.jsx:1399-1401](src/pages/SaldoClientes.jsx#L1399-L1401)):
   compara contra el array `boletas` del **formulario actual en memoria** — se resetea al guardar
   (`clearForm`), así que no recuerda nada entre un Saldo Cliente y el siguiente.
2. **`estaPagada`**: viene de `pagosProveedoresEstado.boletasPagadas`, un flujo aparte (pestaña
   Pagos a Proveedores), no relacionado con Saldo Clientes.

**Nunca se consulta `clientBalances`** (los Saldos Cliente ya guardados en Firebase), que es donde
en realidad queda registrado qué boleta se vinculó a qué Saldo. Esa es la fuente de verdad que
falta cruzar.

### El detalle que hay que resolver antes de programar: `mercaderiaIndex` no es estable entre semanas

Cuando se vincula una boleta, se guarda dentro del Saldo Cliente
([SaldoClientes.jsx:525-530](src/pages/SaldoClientes.jsx#L525-L530)) como:

```js
{ date, amount, mercaderiaIndex: boletaMercaderia.index, esDeMercaderia: true }
```

`mercaderiaIndex` es la posición del ítem dentro de `semanaActiva.mercaderia`. Cada semana es un
documento nuevo (`gestion_semanal/{id}`) con su propio array, así que los índices **se reinician
en cada semana**. Si se cruza solo por `proveedor + mercaderiaIndex` contra el historial completo
de `clientBalances`, la boleta índice 2 de esta semana puede confundirse con la boleta índice 2 de
una semana pasada → falso positivo.

**Antes de tocar el modal**, hay que guardar `semanaId: semanaActiva.id` junto al resto del objeto
al vincular (`vincularBoletaMercaderia`, línea ~525), para que el cruce futuro sea exacto. Es un
campo nuevo, no rompe nada existente; los Saldos Cliente guardados *antes* de este cambio no van a
tener `semanaId` — para esos, no se puede saber con certeza si ya se usaron por índice (ver
"Datos históricos" más abajo).

## Solución: badge "Ya vinculada" + botón deshabilitado

Mismo patrón visual que ya existe en el modal para `estaPagada` (líneas
[1425-1427](src/pages/SaldoClientes.jsx#L1425-L1427)): no se oculta nada, se informa y se bloquea
la acción. Consistente con cómo el resto de la UI de esta página comunica estado (badges de
píldora con color semántico, ver `showSaldoPrevio`, `yaVinculada` actual, etc.).

### Jerarquía visual de la lista

Hoy la lista muestra las boletas en el orden que vienen de `obtenerBoletasMercaderia()` (más
reciente primero). Con el nuevo estado, conviene separar visualmente sin reordenar de forma
brusca:

- **Boletas disponibles** arriba, con opacidad y color plenos — son las que importan, las que el
  usuario vino a vincular.
- **Boletas ya usadas** (en otro Saldo Cliente, o pagadas) empujadas al final del listado y con
  tratamiento visual "apagado" (menor contraste), para que no compitan por atención pero sigan
  siendo auditable si hace falta revisar.

Esto evita el error de UX más común en listas con estado mixto: mezclar habilitado/deshabilitado
en el mismo orden obliga a leer cada fila para saber si sirve. Agrupar por estado deja que el ojo
descarte el bloque "usadas" de un vistazo.

### Anatomía de la fila para una boleta ya vinculada

Reusando el layout de fila existente (línea 1405 en adelante), la fila ya vinculada cambia así
respecto a una disponible:

- **Borde/acento izquierdo**: pasa de `#dde2e6` (neutro) a un tono apagado, no verde (verde ya lo
  usa `estaPagada` — hay que evitar que "Ya vinculada" y "Pagada" se confundan al ser el mismo
  color). Propuesta: `#adb5bd` (gris medio) para diferenciarlo semánticamente de "pagada" (verde,
  estado positivo/cerrado en Pagos a Proveedores) y de "disponible" (borde neutro claro).
- **Fondo de la fila**: `#f8f9fa`, igual que ya usa `yaVinculada` hoy — mantiene la fila legible
  pero visualmente "retirada".
- **Opacidad general de la fila**: `0.65` — suficiente para leer el contenido si hace falta, pero
  que a simple vista lea como "no accionable".
- **Badge de píldora**, mismo componente visual que el badge "Pagada" pero en gris, con ícono de
  check para lectura rápida sin depender solo del color:
  `✓ Ya en Saldo Cliente`
- **Microcopy con contexto**, debajo del badge (no como tooltip — un tooltip exige hover, que en
  la práctica nadie hace en un modal que se usa rápido y muchas veces desde mobile/tablet en el
  local). Mostrar directamente:
  `{cliente} · {fecha del Saldo Cliente}`
  Ej: `Ya en Saldo Cliente · Juan Pérez · 12/08/2026`
  Esto es lo que el usuario pidió explícitamente ("que te informe cuales ya fueron agregadas") —
  sin este dato, el badge sería una alarma sin explicación, y el usuario volvería a tener que ir a
  buscar manualmente dónde se usó.
- **Botón "Vincular" reemplazado**, no solo deshabilitado sin más: en vez de un botón gris inerte
  (que hace ruido visual sin aportar nada), se reemplaza el slot del botón por el mismo texto del
  badge ya cubre la función, así no hay un botón "grayed out" flotando sin razón de estar ahí. Si
  se prefiere mantener consistencia de layout (columna derecha siempre con algo clickeable), una
  alternativa es un botón secundario chico "Ver Saldo Cliente" que abra `EditClienteModal` sobre
  ese registro — pero eso es un alcance mayor (ida y vuelta entre modales); para la primera
  versión, mejor solo informar.

### Estado vacío / todo usado

Si **todas** las boletas del proveedor para la semana ya están vinculadas o pagadas, hoy el modal
mostraría una lista larga de filas apagadas sin nada accionable — mala señal, parece un bug ("¿por
qué no puedo vincular nada?"). Agregar, antes de la lista, un mensaje corto cuando
`disponibles.length === 0 && total.length > 0`:

> Ya vinculaste todas las boletas de esta semana con **{proveedor}** a otros Saldos Cliente.

Con el mismo estilo neutro que ya usa el mensaje "Ingresá el nombre del cliente primero"
(línea 1386), para mantener consistencia tipográfica del modal.

### Contador en el header del modal

El header hoy solo muestra el nombre del cliente. Agregar un contador chico tipo
`3 disponibles · 2 ya usadas` da contexto inmediato sin tener que escanear toda la lista — mismo
patrón que ya usa la página en "Clientes Guardados" (`{n} clientes`, línea 1237).

### Datos históricos (Saldos Cliente guardados antes de este cambio)

Los `clientBalances` guardados *antes* de agregar `semanaId` no van a tener ese campo. Para esos
casos, el cruce por índice no es confiable entre semanas distintas. Opciones para no mostrar falsos
positivos ni falsos negativos con data vieja:

- Si el Saldo Cliente vinculado no tiene `semanaId`, solo considerarlo "ya vinculado" si además la
  fecha del Saldo Cliente cae **dentro de la semana activa actual** (comparando `date` contra el
  rango de la semana) — reduce el riesgo de cruce incorrecto sin necesitar backfill.
- Alternativa más prolija pero con más trabajo: correr un backfill una sola vez que recorra
  `clientBalances` y les agregue `semanaId` inferido por fecha. No es necesario para la primera
  versión.

## Dónde tocaría el código

- **`src/pages/SaldoClientes.jsx`**
  - `vincularBoletaMercaderia` (~línea 525): agregar `semanaId: semanaActiva.id` al objeto de
    boleta vinculada.
  - `obtenerBoletasMercaderia` (~línea 487): además de mapear, cruzar contra el nuevo set de
    "usadas en otro Saldo Cliente" y anotar `yaEnOtroSaldo: { cliente, fecha } | null` en cada
    boleta.
  - Render del modal (~línea 1394-1450): separar disponibles/usadas, aplicar el tratamiento visual
    descrito, agregar el contador del header y el estado vacío.
- **Nuevo selector**, por ejemplo `useBoletasVinculadasEnSaldoClientes(proveedor, semanaId)` en
  `src/firebase/hooks.js` o un archivo propio: recorre `balances` (ya disponible vía
  `useClientBalances`) y arma un `Map<mercaderiaIndex, {cliente, fecha}>` para boletas con
  `esDeMercaderia: true` de ese proveedor, filtrando por `semanaId` cuando esté presente y por
  rango de fecha como fallback cuando no.

No se tocó código todavía — queda a la espera de que confirmes que el diseño te cierra antes de
implementarlo.
