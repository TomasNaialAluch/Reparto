# Página Hoy — Agenda, pesadas, pedidos y deudores del día

**Estado:** diseño (nada implementado todavía)

## 1. El problema

Hoy, cuando llega el camión con carne:

1. Se va pesando en la balanza producto por producto y **se anota en un papel**.
2. Al terminar se **suman a mano** los kilos de cada corte.
3. Se **verifica contra el remito** que trae el camión.
4. Recién ahí se **ingresa a Mercadería** (volviendo a escribir todo).

Problemas: se escribe dos veces, las sumas a mano se pueden equivocar, el papel se pierde y no queda registro de qué se pesó realmente si después hay un reclamo.

## 2. Qué queremos

Una pantalla **Pesadas** donde se carga cada pesada en el momento, en lugar del papel. La app suma sola, compara con el remito y, **si se quiere**, pasa el resultado a Mercadería con un botón.

Ideas centrales:

- **La pesada es independiente de Mercadería.** Se puede hacer una pesada sin ingresarla (control, devolución, prueba).
- **Ingresar a Mercadería es un paso opcional**, al final, y no vuelve a escribir nada.
- **Cada pesada individual queda registrada** (no solo el total), igual que en el papel.

## 3. Flujo

```
Llega el camión
   │
   ▼
Nueva pesada  (día, proveedor, nº de remito opcional)
   │
   ▼
Se carga cada pesada de balanza:  corte + kg   ──▶ se repite
   │      (la app va sumando por corte y el total general)
   ▼
Verificar contra el remito:  se escriben los kg del remito por corte (o solo el total)
   │      → la app marca diferencias (✔ coincide / ⚠ sobra / ⚠ falta)
   ▼
Cerrar pesada
   │
   ├──▶ "Ingresar a Mercadería"  → crea la entrada con los kg sumados por corte
   │                                (se completa el $/kg y se confirma como hoy)
   ├──▶ Dejarla solo como registro
   └──▶ "Descartar"  → sale de la vista, queda en historial
```

## 4. Varias pesadas a la vez

Pueden estar **abiertas varias pesadas al mismo tiempo** (dos camiones, un camión que se interrumpe, un proveedor que manda carne y embutidos por separado). Cada una es independiente: tiene su proveedor, su remito, sus pesadas y sus totales.

- **Lista de pesadas** arriba o a un costado, con una tarjeta por pesada: proveedor, hora de inicio, total de kg y estado (`abierta` / `cerrada` / `ingresada`).
- **Una sola "activa"** a la vez en pantalla: es la que recibe lo que se tipea. Se cambia tocando su tarjeta (o con un atajo de teclado), sin perder lo cargado en las otras.
- Cada tarjeta muestra siempre el total de kg, así se ve de un vistazo cómo va cada camión.
- La activa se distingue con un color/borde, para no cargar kg en el camión equivocado. El encabezado de la carga rápida repite el proveedor y el remito de la pesada activa.
- **Nada se mezcla**: los totales, la verificación con remito y "Ingresar a Mercadería" se calculan por pesada.
- Cerrar o ingresar una no afecta a las demás. Se pueden dejar varias cerradas y revisarlas después.
- Si se recarga la página, siguen todas abiertas, porque cada pesada se guarda al cargarla.

## 5. Pantalla (idea)

**Carga rápida (lo más importante)**

- Selector de corte (con el mismo catálogo de cortes de Mercadería) + input de kg.
- **Enter** agrega la pesada y deja el foco otra vez en el kg, para cargar una tras otra sin mouse.
- Lista de pesadas cargadas, con opción de **deshacer la última** o borrar una puntual (para corregir un error de tipeo).
- Totales visibles todo el tiempo:
  - Por corte: *Lomo — 5 pesadas — 48,6 kg*
  - General: *total kg y cantidad de pesadas*

**Verificación con remito**

- Columna "Remito" editable al lado del total pesado, por corte.
- Diferencia en kg y color: verde si coincide, amarillo/rojo si no.
- Si no hay detalle por corte en el remito, se puede comparar solo el total general.
- Un corte que está en el remito y no se pesó (o al revés) se marca igual.

**Estados de una pesada**

| Estado | Significado |
|---|---|
| `abierta` | Se está pesando, se puede seguir agregando |
| `cerrada` | Terminó la pesada; queda verificada o con diferencias anotadas |
| `ingresada` | Ya se pasó a Mercadería (guarda a qué entrada) |
| `descartada` | Se decidió no usarla; no se borra, queda en historial |

## 6. Pasar a Mercadería

Al tocar **"Ingresar a Mercadería"**:

1. Se arma una entrada de Mercadería con `dia`, `proveedor`, `proveedorId` y un `cortes[]` con `{ corte, kg }` ya sumados.
2. Se abre el mismo flujo que ya existe (control de precios atípicos, aviso de cortes sin precio): solo falta completar el **$/kg**.
3. La pesada queda marcada como `ingresada` y guarda el `id` de la entrada creada, para no duplicarla y poder navegar de una a la otra.

Reglas:

- Se usan los **kg pesados** (lo real), no los del remito. La diferencia con el remito queda guardada en la pesada.
- Una pesada ya ingresada no se puede volver a ingresar; si se corrige, se edita la entrada en Mercadería.
- Si la entrada de Mercadería se elimina, la pesada vuelve a poder ingresarse.

## 7. Modelo de datos

Siguiendo la forma que ya usa Mercadería (`dia`, `proveedor`, `proveedorId`, `cortes[]`):

```js
{
  id: 'pes_...',
  dia: 'Lunes',                 // mismo criterio de día que Mercadería
  fecha: '2026-10-13',          // fecha real de la pesada
  proveedor: 'Nombre',
  proveedorId: 'contacto_id' | null,
  remito: { numero: '0001-00012345', totalKg: 1250.5 } | null,
  pesadas: [                    // cada pesada individual de balanza
    { id, corte: 'Lomo', kg: 12.35, hora: '08:42' },
    ...
  ],
  remitoPorCorte: { 'Lomo': 48.5, ... },  // opcional, para la verificación
  estado: 'abierta' | 'cerrada' | 'ingresada' | 'descartada',
  mercaderiaId: 'ent_...' | null,         // entrada creada al ingresar
  notas: '',
  timestamp: '...'
}
```

Los totales por corte y general **no se guardan**, se calculan a partir de `pesadas`, para que nunca queden desfasados.

Dónde guardarlo: dentro de la semana activa, junto a `mercaderia` (como ya funcionan `agregarMercaderia` / `eliminarMercaderia` / `actualizarMercaderia` en `src/firebase/hooks.js`), con funciones equivalentes `agregarPesada`, `actualizarPesada`, `eliminarPesada`.

**Tareas de la agenda**

```js
{
  id: 'tar_...',
  fecha: '2026-10-13',          // día al que pertenece
  hora: '10:00' | null,         // opcional
  alarma: true,                 // avisar a la hora
  texto: 'Sacar VTV camioneta',
  hecha: false,
  contactoId: 'contacto_id' | null,
  orden: 0,
  timestamp: '...'
}
```

**Pedidos para armar**

```js
{
  id: 'ped_...',
  fecha: '2026-10-13',
  cliente: 'Nombre',
  clienteId: 'contacto_id' | null,
  items: [ { corte: 'Lomo', kg: 5 }, ... ],
  origen: 'manual' | 'whatsapp',      // whatsapp = vía Twilio (futuro)
  estado: 'pendiente' | 'armado' | 'entregado',
  notas: '',
  timestamp: '...'
}
```

Tareas y pedidos se guardan por **fecha** (no por semana), así el calendario puede abrir cualquier día, incluso de otra semana. Son colecciones propias, independientes de las pesadas.

## 8. Dónde vive en la app: la página del día

Las pesadas **no** van como pestaña de Gestión Semanal. Viven en una **página nueva para lo diario** (ruta propuesta: `/hoy`, con acceso desde Home y la barra). Es "medio calendario, medio hoja de cuaderno": qué hay que hacer en la fecha y, debajo, las pesadas del día.

```
┌─ Hoy · martes 13 de octubre ─────────  ◀ ▶  [📅 elegir día] ┐
│                                                             │
│  HOJA DEL DÍA (cuaderno)                                    │
│  ☐ Llamar a Frigorífico Sur por faltante                    │
│  ☐ Cobrar a Juan Pérez ($ 120.000)                          │
│  ☑ Pagar flete                                              │
│  [+ agregar tarea]                                          │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│  PESADAS DEL DÍA                         [+ Nueva pesada]   │
│  ┌ Frigorífico Sur ─────────── 1.250 kg ● abierta ┐         │
│  │  carga rápida · totales · remito               │         │
│  │  [Cerrar] [Ingresar a Mercadería] [Descartar]  │         │
│  └────────────────────────────────────────────────┘         │
│  ┌ Embutidos Pérez ─────────── 86 kg ● abierta ┐             │
│  └─────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

**Cómo se entra**

- Desde **Inicio** (`Home.jsx`), como **primera tarjeta** de la lista, arriba de *Mi Reparto*, porque es lo primero que se usa al empezar el día. Texto sugerido: **Hoy** — *Agenda, pesadas, pedidos y deudores del día*.
- Se agrega en `src/config/navItems.js` (misma lista que arma Inicio y la barra flotante), así aparece en los dos lugares sin duplicar nada.
- Ruta nueva `/hoy` en `src/App.jsx`, protegida igual que el resto de las páginas.
- La pregunta "¿Qué necesitás hacer hoy?" que ya muestra Inicio queda respondida con esa tarjeta.
- Opcional, a decidir: que la app **abra directo en Hoy** en lugar de en Inicio, o que Inicio muestre un resumen chico (cuántas pesadas abiertas, pedidos pendientes, total de deudores) en la tarjeta.

**Reparto de espacios**

Cada bloque tiene su lugar fijo; nada ocupa el ancho completo de la pantalla.

```
Compu (≥ 992 px)                                  Celular
┌──────────────────────────────┬───────────┐      ┌────────────┐
│ Encabezado: fecha ◀ ▶ 📅     │           │      │ Fecha      │
├──────────────────────────────┤           │      ├────────────┤
│ AGENDA                       │ DEUDORES  │      │ Agenda     │
├──────────────────────────────┤  (300 px, │      ├────────────┤
│ PESADAS DEL DÍA              │  fija al  │      │ Pesadas    │
│  ┌────┐ ┌────┐ ┌────┐        │  hacer    │      ├────────────┤
│  │ ○  │ │ ○  │ │ ○  │        │  scroll)  │      │ Pedidos    │
│  └────┘ └────┘ └────┘        ├───────────┤      ├────────────┤
│  ┌─────────────────────────┐ │ CAJA      │      │ Deudores   │
│  │ ● activa: carga │ detalle│ │ fondo y   │      ├────────────┤
│  └─────────────────────────┘ │ vueltos   │      │ Caja       │
├──────────────────────────────┤           │      └────────────┘
│ PEDIDOS PARA ARMAR           │           │
└──────────────────────────────┴───────────┘
```

- **Columna principal** (ancho flexible): agenda, pesadas y pedidos, en ese orden.
- **Barra lateral** (300 px): deudores y caja, a la derecha como en el cuaderno.
- **Pesadas:** las tarjetas colapsadas se acomodan en columnas (mínimo 260 px cada una). La tarjeta **activa** ocupa el ancho de su zona, y por dentro se parte en dos: la **carga** a la izquierda (ancho acotado, 380 px) y el **detalle** (totales y cargadas) a la derecha.
- **Celular:** una sola columna, en el orden agenda → pesadas → pedidos → deudores → caja.
- Los bloques que todavía no se construyeron se muestran como **zona reservada** (recuadro punteado), para que se vea el lugar que van a ocupar.

**La página del día tiene cuatro bloques**

| Bloque | Qué es |
|---|---|
| **Agenda** | Renglones de cuaderno con o sin hora: *10:00 sacar VTV camioneta* |
| **Pesadas** | Las tarjetas de camiones del día (ver abajo) |
| **Pedidos para armar** | Lo que hay que preparar para entregar ese día |
| **Deudores** | Quiénes deben, a la vista mientras se trabaja |

**Agenda (hoja del día)**

- Lista de **cosas para hacer** de la fecha, como renglones de cuaderno: se tilda, se escribe, se borra. Enter agrega un renglón nuevo.
- Cada renglón tiene una **hora opcional**: *10:00 sacar VTV camioneta*. Los que tienen hora se ordenan arriba por horario; los que no, quedan debajo como "sin hora".
- Al escribir se puede usar un atajo: si el texto empieza con una hora (`10 vtv camioneta`, `10:30 llamar a Sur`), esa hora se toma como horario del renglón.
- Se navega por **día** (anterior / siguiente / elegir en calendario). Un día sin nada queda en blanco.
- Un día pasado con tareas sin tildar se ve distinto (pendiente), para no perder lo que quedó sin hacer.
- Una tarea puede tener un **contacto** asociado (por ejemplo "cobrar a Juan"), pero es opcional.
- **Alarma a la hora**: un renglón con hora puede avisar cuando llega ese momento (sonido y aviso visible). Se activa por renglón con una campana, y por defecto está prendida en los renglones que tienen hora.
- Hay que ver cómo avisar si la app no está abierta (notificación del navegador, o avisos externos); la primera versión puede avisar solo con la página abierta.
- Tareas **repetidas** (VTV cada año, pagos mensuales): para después, no entran en la primera versión.

**Pedidos para armar**

- Lista de pedidos de la fecha: cliente, qué lleva (corte/producto + kg o cantidad) y estado.
- Estados: `pendiente` → `armado` → `entregado`. Se tilda como en una lista de tareas.
- Sirve como "lista de preparación": ver de un vistazo qué hay que armar hoy y cuánto falta.
- **Origen hoy: a mano.** Se cargan desde la propia página del día.
- **A futuro: Twilio / WhatsApp.** Que los pedidos entren solos desde los mensajes de WhatsApp (Twilio) y queden en la lista como `pendiente` con su origen indicado, para revisarlos antes de armarlos. Es una fase aparte y necesita backend (ver fases y preguntas).
- Idea futura, no incluida en la primera versión: que un pedido pueda descontar de lo pesado o ingresado.

**Deudores**

- Cuadro con quiénes deben y cuánto, siempre visible (al costado en compu, debajo en celular).
- Tocar un deudor lo asocia a un renglón de la agenda ("cobrar a ...") con un solo toque.
- **Tres orígenes** de deudores (el detalle de cómo se unifican **queda por definir**):

| Origen | Qué es |
|---|---|
| **A mano** | Alguien que debe y se anota directamente desde la página del día |
| **Mi Reparto** | Clientes del reparto que no pagaron (pago pendiente o parcial) |
| **Saldo (Saldo Proveedores)** | Saldos pendientes que ya calcula la app por contacto |

- Cada deudor en el cuadro indica **de dónde viene** (a mano / reparto / saldo), para no confundir ni duplicar.
- Un mismo contacto que aparece en más de un origen debería mostrarse **una sola vez**, con el total y el desglose. Esa regla se define cuando se vea el detalle.
- Pendiente de definir: si lo anotado a mano es una deuda real (con movimientos y saldo) o solo un recordatorio, y qué pasa cuando se cobra (se tilda, se descuenta del saldo, desaparece del cuadro).

**Pesadas del día**

- Son las tarjetas de la sección 4 (varias a la vez), filtradas por la **fecha elegida**.
- Cada tarjeta se expande en el lugar con carga rápida, totales y verificación con remito.
- Acciones de la tarjeta:
  - **Cerrar**: termina el pesaje.
  - **Ingresar a Mercadería** (ver sección 6): opcional, nunca automático.
  - **Descartar**: la pesada se marca como `descartada` y sale de la vista normal. No se borra, queda en un historial por si hay que recuperarla.

**Reutiliza**

- El catálogo de cortes, el buscador de proveedor y el estilo de [README-NEWLOOK.md](README-NEWLOOK.md).
- Navegación por teclado equivalente a [README-NAVEGACION-TECLADO-MERCADERIA.md](README-NAVEGACION-TECLADO-MERCADERIA.md).

## 9. Fases sugeridas

1. **Página del día + carga y suma**: ruta `/hoy`, navegación por fecha, crear pesadas (varias abiertas a la vez), cargar kg por corte con Enter, totales, deshacer. Reemplaza el papel.
2. **Verificación con remito**: totales del remito, diferencias y estado cerrada.
3. **Ingresar a Mercadería / Descartar**: botones, estados `ingresada` y `descartada`, vínculo con la entrada.
4. **Agenda**: tareas por fecha con hora opcional, tildar, escribir, calendario.
5. **Alarmas**: aviso a la hora de los renglones de la agenda.
6. **Pedidos para armar**: carga a mano, lista por fecha con estados.
7. **Deudores**: cuadro unificado de las tres fuentes (a mano, Mi Reparto, Saldo). Requiere definir antes el detalle.
8. **Pedidos por WhatsApp (Twilio)**: entrada automática de pedidos. Necesita backend (Cloud Functions + webhook de Twilio).
9. **Extras**: imprimir la hoja de pesada, historial por proveedor, tara/bruto/neto si hace falta, tareas repetidas.

## 10. Preguntas abiertas

- ¿Se pesa por **pieza** (cada media res, cada caja) y hace falta contar piezas, o solo importan los kg?
- ¿Hay **tara** (cajón, bandeja) que descontar en cada pesada?
- ¿El remito trae el **detalle por corte** o solo un total?
- ¿Se usa en el celular/tablet al lado de la balanza? (define si la carga rápida prioriza pantalla táctil.)
- ¿Se quiere **imprimir** la hoja de pesada para el chofer / archivo?

**Deudores** (definir con detalle más adelante)

- ¿Una deuda anotada a mano es una deuda real (con movimientos y saldo) o solo un recordatorio?
- ¿Qué pasa al cobrar: se descuenta del saldo / del reparto de origen, o solo se saca del cuadro?
- ¿Cómo se unifica un mismo contacto que aparece en dos orígenes?
- ¿Son solo clientes que deben, o también lo que se le debe a proveedores?

**Pedidos para armar**

- ¿Alcanza con cliente + qué lleva, o necesitás dirección y hora de entrega?
- Twilio: ¿qué formato de mensaje mandan los clientes (texto libre, lista)? ¿Se interpreta con IA o se muestra el texto tal cual para que lo cargues vos? ¿Ya hay cuenta/número de Twilio?

**Agenda**

- ¿La alarma tiene que sonar aunque la app esté cerrada (celular, notificación push), o alcanza con la página abierta?
- ¿Querés que aparezca sola la hora de otras cosas (cheques que vencen, pagos), o solo lo que escribís vos?
- ¿Tareas que se **repiten** (VTV cada año, pagos mensuales)? Quedaron para una fase posterior.
