# Pedidos por WhatsApp — Requisitos y diseño

**Estado:** diseño. Este documento dice **qué** necesitamos y **cómo se ve**. El **cómo se construye** (archivos, fases, orden) está en [README-PEDIDOS-IMPLEMENTACION.md](README-PEDIDOS-IMPLEMENTACION.md). No se programa nada hasta aprobar los dos.

**Qué reemplaza:** la "Fase 8 — Pedidos por WhatsApp (Twilio)" de [README-ROADMAP-HOY.md](README-ROADMAP-HOY.md) y el borrador anterior de este mismo archivo. La estética sigue [README-NEWLOOK.md](README-NEWLOOK.md).

---

## 1. Qué queremos

Una **sección exclusiva "Pedidos"** donde:

1. Cada cliente tiene configurado **qué días y a qué hora** se le manda un mensaje de WhatsApp **personalizado**.
2. El mensaje **sale solo** a esa hora.
3. Si el cliente **contesta**, la app lo escucha, entiende el pedido y lo deja como **pedido pendiente en Hoy**, para revisarlo antes de armar.
4. Todo se configura y se controla en un solo lugar, porque va a ser bastante contenido y va a crecer.

Lo que **no** queremos: tocar un enlace por cliente (no sirve), ni mezclar la configuración de Pedidos dentro de la ficha del cliente.

---

## 2. Cómo funciona de punta a punta

```
PROGRAMAR                  ENVIAR                     RESPONDER                    ARMAR
Cliente + días + hora  ─▶  A la hora, el sistema  ─▶  El cliente contesta    ─▶   Aparece en Hoy
+ mensaje                  manda la plantilla         por WhatsApp                 como pedido
(pestaña Programación)     (backend, automático)      │                            "pendiente" (ícono de mensaje)
                                                      ▼
                                                      Se entiende el texto
                                                      ("5 kg lomo", "lo de siempre")
                                                      │
                                                      ▼
                                                      Bandeja "Respuestas":
                                                      se revisa y se confirma
```

Hay **dos mundos** que se hablan por Firestore:

- **La app (navegador):** configura, muestra, revisa y confirma. No manda ni recibe mensajes por sí sola.
- **El backend (Cloud Functions):** envía a la hora, recibe las respuestas del proveedor y las guarda. Nunca decide por su cuenta crear un pedido sin pasar por la bandeja (ver 4.E).

---

## 3. Reglas de WhatsApp que condicionan el diseño

Estas reglas no se negocian; todo lo demás se adapta a ellas.

| Regla | Consecuencia en el diseño |
|---|---|
| **El primer mensaje lo inicia el negocio con una plantilla aprobada por Meta.** No puede ser texto libre. | "Mensaje personalizado" = **plantilla aprobada + variables**. Lo libre por cliente son los valores de las variables, no el texto entero. Hace falta una biblioteca de plantillas con su estado de aprobación. |
| **Cuando el cliente contesta se abre una ventana de 24 hs** para hablar libre. | Dentro de esa ventana se puede responder ("Anotado") sin plantilla. Fuera de ella, solo plantilla. La app tiene que saber si la ventana está abierta. |
| **Hace falta consentimiento (opt-in)**: el cliente tiene que haber aceptado recibir mensajes. | Cada cliente guarda su estado de consentimiento. Quien contesta "BAJA" deja de recibir. Sin consentimiento confirmado no se programa envío. |
| **El número no puede estar usado en un WhatsApp común.** | Se necesita un **número dedicado** (chip). El WhatsApp actual del local no se toca. |
| **Meta puede limitar o bloquear si muchos clientes marcan "spam".** | Mensajes cortos, útiles, a horarios razonables, y respetar las bajas. Un panel de calidad en Conexión. |
| **Cada plantilla enviada cuesta** (según categoría). | La app cuenta lo enviado por mes para tener a la vista el gasto estimado. |

---

## 4. Qué necesitamos, por área

### A. Clientes y fichas

- La **ficha** del cliente (nombre, teléfono, roles, alias, notas) vive en `contactos`, como hoy. Una sola fuente.
- Desde Pedidos se puede **crear un cliente** con el mismo modal de Proveedores y Clientes, que arranca como "Cliente". *(Ya hecho; se conserva.)*
- Si el WhatsApp es distinto del teléfono de la ficha, se puede cargar un **WhatsApp propio** en la configuración de Pedidos (opcional). Si está vacío se usa el de la ficha.
- El número se valida y se guarda en formato internacional (`+549…`). Se avisa si falta o está mal.

### B. Programación por cliente

- Un cliente puede tener **uno o más envíos** ("reglas"). Ejemplo: lunes 08:00 con un mensaje, jueves 07:30 con otro.
- Cada envío tiene: días de la semana, hora, plantilla, valores de las variables y un interruptor activo/pausado.
- **Pausar a un cliente entero** (interruptor general) y **pausar hasta una fecha**.
- **Saltear fechas puntuales** (feriados, vacaciones del cliente) sin tocar la regla.
- **Aplicar el mismo horario a varios clientes** a la vez (seleccionar varios y aplicar). Con 30 clientes es imprescindible.
- **Vista previa del mensaje** tal como lo ve el cliente, con sus variables resueltas.
- **Consentimiento** visible en cada cliente (confirmado / pendiente / dado de baja).

### C. Plantillas

- Biblioteca de plantillas con: nombre, categoría, idioma, texto con variables, **estado de aprobación** (borrador → en revisión → aprobada → rechazada) y el motivo si la rechazan.
- Las variables pueden ser **automáticas** (nombre del cliente, día de la semana, "lo habitual") o **por cliente** (un texto propio de cada cliente).
- Una regla de envío solo se puede activar si su plantilla está **aprobada** (o si se está probando en el sandbox).
- El texto se puede **redactar con el Asistente** (Gemini, que ya existe en el proyecto).

### D. Envíos

- Un **programador** (backend) revisa cada minuto qué envíos vencen y los manda.
- **Nunca debe mandar dos veces el mismo mensaje**: cada envío tiene un identificador fijo (cliente + fecha + regla), así un reintento no duplica.
- Estados de un envío: `pendiente`, `enviando`, `enviado`, `entregado`, `leido`, `fallido`, `salteado`, `cancelado`.
- Se actualiza el estado cuando el proveedor avisa (entregado, leído, falló).
- **Hora de Argentina** (`America/Argentina/Buenos_Aires`) siempre, sin importar dónde corra el servidor.
- **Horario de silencio**: nada antes de la hora mínima ni después de la máxima (configurable).
- Acciones manuales sobre un envío del día: **Enviar ahora**, **Saltear hoy**, **Reenviar** (si falló).

### E. Respuestas e interpretación

- Cada mensaje entrante se guarda y aparece en la **bandeja**, agrupado por cliente.
- **Primera pasada sin IA:** se separa por renglones y se reconoce cada corte con `reconocerCorte` / `interpretarLinea` (ya existen y se usan en Pedidos y Mercadería). Se muestra con qué seguridad se reconoció cada uno.
- **Segunda pasada con IA (Gemini)** solo para lo que las reglas no entienden ("lo de siempre pero sin la bondiola").
- Siempre pasa por **revisión humana** antes de crear el pedido. Más adelante se puede permitir auto-confirmar cuando la seguridad sea alta, como opción apagada por defecto.
- Casos que la bandeja tiene que resolver:
  - el cliente manda varios mensajes seguidos → se juntan en un solo pedido;
  - dice "hoy no" → se marca **sin pedido**, sin crear nada;
  - manda un audio o una foto → se marca para atender a mano (transcripción en una etapa posterior);
  - escribe sin que le hayamos mandado nada → igual entra, marcado como espontáneo;
  - escribe "BAJA" → se marca la baja y se frena su programación;
  - el número no coincide con ningún cliente → queda **sin identificar**, para asignar a mano.
- **Responder desde la app** dentro de la ventana de 24 hs ("Anotado, te lo llevo").

### F. Pedido en Hoy

- Al confirmar una respuesta se crea el pedido **pendiente** del día en la página Hoy, con `origen: 'whatsapp'`, los renglones reconocidos y el vínculo al mensaje de origen.
- Si el cliente ya tiene un pedido ese día, se **agregan renglones** al existente en vez de crear otro.
- En Hoy, esos pedidos se distinguen con el ícono de mensaje (no emoji).

### G. Conexión y control

- Estado general (conectado / no conectado) con el indicador de punto y halo del NEWLOOK.
- Elección de proveedor (Twilio o Meta) y **checklist del trámite** con avance.
- **Enviar mensaje de prueba** a un número propio, para comprobar la conexión.
- Última señal recibida del proveedor y últimos errores.
- Contador de mensajes del mes y gasto estimado.

### H. Seguridad y privacidad

- Las **claves del proveedor viven en los secretos de Firebase**, nunca en Firestore ni en el código del navegador.
- El webhook **verifica la firma** de cada llamada (Twilio y Meta la incluyen). Sin firma válida, se descarta.
- Los números de teléfono son datos personales: no van a los registros del servidor ni se comparten.
- Las reglas de Firestore actuales permiten leer y escribir a cualquier usuario autenticado. Las colecciones de Pedidos se restringen donde se pueda: los estados de envío y los mensajes entrantes **solo los escribe el backend**.

### I. Costos

- Plantillas: costo por mensaje según categoría (Meta), más recargo si se usa Twilio.
- Firebase: plan Blaze (por uso). Con este volumen, el costo propio de Firebase es mínimo.
- La app muestra el conteo mensual para que no haya sorpresas.

---

## 5. Modelo de datos

**Principio:** la ficha del cliente va por un lado y la configuración de Pedidos por otro, atadas por el **id del contacto**. Todo lo que se agregue a Pedidos no toca `contactos`.

```
contactos/{id}                       ← ficha (ya existe, no se cambia)
   │  nombre, roles, alias, contacto.telefono, notas, activo
   │
   ├── 1 ─ 1 ──  pedidos_programacion/{clienteId}   ← configuración de Pedidos
   │                envios[ ] (reglas), consentimiento, whatsapp opcional, saltear[ ], pausa
   │
   ├── 1 ─ N ──  pedidos_envios/{clienteId_fecha_envioId}   ← cada envío concreto del día
   │
   └── 1 ─ N ──  pedidos_mensajes/{id}              ← conversación (entrantes y salientes)

pedidos_plantillas/{id}              ← biblioteca de plantillas (independiente del cliente)
pedidos_config/whatsapp              ← conexión, proveedor, checklist, contadores
pedidos/{id}                         ← ya existe (página Hoy); suma mensajeId
```

### `pedidos_programacion/{clienteId}`

```js
{
  clienteId: 'contacto_id',
  cliente: 'Nombre',                // copia para listar sin cruzar colecciones
  activo: true,                     // interruptor general del cliente
  pausadoHasta: null | '2026-12-01',
  saltear: ['2026-12-25'],          // fechas puntuales sin envío
  whatsapp: null | '+5491145678901',// si es distinto del teléfono de la ficha
  consentimiento: {
    estado: 'confirmado' | 'pendiente' | 'baja',
    fecha: '2026-11-06', origen: 'verbal' | 'whatsapp' | 'otro'
  },
  envios: [
    {
      id: 'env_ab12',
      activo: true,
      dias: [1, 4],                 // 0 = domingo … 6 = sábado
      hora: '08:30',
      plantillaId: 'plan_...',
      variables: { extra: 'Tenemos lomo fresco' },   // solo las "por cliente"
    },
  ],
  notas: '',
  updatedAt: ts
}
```

### `pedidos_plantillas/{id}`

```js
{
  nombre: 'Consulta de pedido',
  categoria: 'utility',             // utility | marketing (define el costo)
  idioma: 'es_AR',
  cuerpo: 'Hola {{nombre}}, ¿qué te mando hoy? {{extra}}',
  variables: [
    { clave: 'nombre', origen: 'auto' },
    { clave: 'extra',  origen: 'cliente', ejemplo: 'Tenemos lomo fresco' },
  ],
  estado: 'borrador' | 'en_revision' | 'aprobada' | 'rechazada',
  idProveedor: 'nombre o SID en Meta/Twilio',
  motivoRechazo: ''
}
```

### `pedidos_envios/{clienteId_fecha_envioId}`

El identificador es **fijo**: es lo que evita duplicados si el programador reintenta.

```js
{
  clienteId, envioId, fecha: '2026-11-09', horaProgramada: '08:30',
  estado: 'pendiente' | 'enviando' | 'enviado' | 'entregado' | 'leido' | 'fallido' | 'salteado' | 'cancelado',
  mensajeId: 'msg_...' | null,
  intentos: 0, error: '',
  origen: 'programador' | 'manual'
}
```

### `pedidos_mensajes/{id}`

```js
{
  clienteId: 'contacto_id' | null,  // null = número sin identificar
  telefono: '+549...',
  direccion: 'entrante' | 'saliente',
  tipo: 'texto' | 'audio' | 'imagen' | 'plantilla' | 'otro',
  texto: '...',
  estado: 'nuevo' | 'revisado' | 'sin_pedido' | 'descartado'      // entrantes
        | 'enviado' | 'entregado' | 'leido' | 'fallido',          // salientes
  idProveedor: 'id del mensaje en Meta/Twilio',
  envioId: 'clienteId_fecha_envioId' | null,
  espontaneo: false,
  interpretacion: {
    via: 'reglas' | 'ia',
    renglones: [{ texto: '5 kg lomo', corte: 'Lomo', kg: '5', seguridad: 'exacto' }],
  },
  pedidoId: 'ped_...' | null,
  fecha: '2026-11-09', creada: '2026-11-09T08:41:12-03:00'
}
```

### `pedidos_config/whatsapp`

```js
{ proveedor: 'twilio' | 'meta' | null, conectado: false, numero: '+54...',
  pasos: { portafolio: true, numero: false, ... },
  ultimaSenal: { webhook: ts, envio: ts },
  horario: { desde: '07:00', hasta: '20:00' },
  contadorMes: { '2026-11': { plantillas: 0 } } }
```

---

## 6. Diseño visual (NEWLOOK)

### 6.1 Qué estaba mal en la primera versión

La primera versión usó "chips" sueltos de Bootstrap-ish y cards con borde de color en los cuatro lados, sin respetar el sistema. Se corrige así:

| Antes (mal) | Ahora (NEWLOOK) |
|---|---|
| Pestañas como botones sueltos | **Bloque gris unificado** con tabs y panel blanco conectado (sección 2 y 3 de Gestión Semanal). Indicador deslizante con `motion.div` y `layoutId="pedidos-tab-indicator"`. Contenido con slide según la dirección del cambio. |
| Título `h1` grande | Encabezado de dos líneas: label uppercase gris + título (patrón de Proveedores y Clientes). |
| Cards con acento de 4px | **Acento izquierdo de 3px**, `border: 1px solid #d3d9de`, sin sombra. |
| Estados como texto en pills de colores planos | **Punto + halo** para estado y **pills semitransparentes** (8–12 %) para valores. |
| Checkbox nativo para activo/pausado | **Toggle switch** animado (`ToggleRow`). |
| Emoji 💬 | **Ícono SVG** (`IconChat`, nuevo en `icons.jsx`). |
| Texto gris claro `#6b7280` / `#9ca3af` | `#6c757d` para muted (regla de contraste de la sección 13). |
| Formulario plano | `FormSection` con label uppercase y línea divisora `#f3f4f6`. |
| "Agregar" y "quitar" como botones comunes | `AddBtn` con borde dashed y `RemoveBtn` con ×. |
| Botones deshabilitados con estilo del navegador | Deshabilitado manual: fondo `#e9ecef`, texto `#9ca3af`, `not-allowed`. |

### 6.1 bis — Decisiones después de ver la página renderizada

La primera versión se diseñó leyendo código, sin abrirla. Al verla (título negro suelto, un botón huérfano arriba a la derecha, cuatro chips genéricos que en celular se apilan en dos filas) quedó claro que no tenía nada del lenguaje de Hoy ni de Transferencias. Decisiones:

- **Navegación en escritorio:** bloque gris unificado con pestañas, como Transferencias y Gestión Semanal. *(Decisión del usuario: "para escritorio como venimos".)*
- **Navegación en celular:** **menú lateral con botón hamburguesa.** Las secciones (Hoy, Respuestas, Programación, Plantillas, Conexión) viven en un panel que entra por la izquierda con overlay y blur. Muestra los contadores, el estado de la conexión y el botón "Nuevo cliente". *(Decisión del usuario.)* La barra flotante inferior de toda la app se mantiene como está.
- **Encabezado igual al de Hoy:** línea chica en mayúsculas ("PEDIDOS POR WHATSAPP") y debajo un título grande (la fecha del día en Hoy; el nombre de la sección en las demás). En celular, hamburguesa a la izquierda y acción de alta como botón circular a la derecha.
- **Ningún botón queda suelto.** Las acciones viven dentro del bloque al que pertenecen, como "+ Nueva pesada" en Hoy. "Nuevo cliente" va en el encabezado de la tarjeta de Programación, en su estado vacío y, en celular, en el menú lateral y como botón circular.
- **Estado de conexión como status indicator** (punto con halo y borde izquierdo) en el encabezado de escritorio, no como caja de alerta.
- **Fila de envío:** hora, nombre, mensaje en una línea, pill de estado con punto y una acción ghost. Mismo patrón en escritorio y celular, que solo cambia la distribución.
- **Prohibido:** chips sueltos como navegación, títulos negros sin línea chica encima, botones sin contenedor, emojis.
- **Regla de trabajo:** ninguna pantalla se da por buena sin mirarla **renderizada**, en escritorio y a 375 px de ancho, al lado de Hoy o Transferencias.

*La maqueta de este diseño se mostró en la conversación; falta la aprobación del usuario antes de implementar.*

### 6.2 Página (shell)

- Fondo de ruta `rgba(106,136,153,0.08)` como las demás páginas.
- Ancho máximo ~1100 px. Dos columnas en escritorio donde convenga; una columna en celular.
- Encabezado: label "Inicio" (uppercase) + título "Pedidos por WhatsApp", y a la derecha el botón primario **Nuevo cliente** (fondo `#6A8899`, texto blanco, ícono `IconPlus`).
- Debajo, el **bloque gris** con las pestañas y el panel.
- Pestañas (con ícono SVG de 14 px, `currentColor`):

| Pestaña | Ícono | Qué muestra |
|---|---|---|
| Hoy | `IconCalendar` | Qué sale hoy y cómo viene |
| Respuestas | `IconChat` (nuevo) | Bandeja, con contador |
| Programación | `IconClock` (nuevo) | Reglas por cliente |
| Plantillas | `IconClipboard` | Biblioteca y aprobación |
| Conexión | `IconSettings` | Proveedor, checklist, estado |

- El contador de Respuestas es un pill semitransparente (`rgba(255,209,102,0.25)`, texto `#7a5000`).

### 6.3 Pestaña Hoy

```
┌ HOY ─────────────────────────────────────────────┬ RESUMEN ──────────────┐
│ MIÉRCOLES 18 DE NOVIEMBRE · 9 CLIENTES           │ ● 6 enviados          │
│                                                  │ ● 3 contestaron       │
│ ▌08:00  Carnicería López          ● enviado      │ ● 2 sin responder     │
│ ▌       "Hola López, ¿qué te mando hoy?"         │ ● 1 falló             │
│ ▌                      [Reenviar] [Saltear]      │                       │
│ ▌08:30  Mercado Sur               ● contestó     │ PRÓXIMOS 7 DÍAS       │
│ ▌       Pedido en revisión → Respuestas          │ Mié 9 · Jue 7 · Vie 4 │
│ ▌09:00  Don Pepe                  ● programado   │ …                     │
└──────────────────────────────────────────────────┴───────────────────────┘
```

- Cada envío es una card plana con **acento izquierdo** del color de su estado y **punto + halo**.
- Colores de estado (los mismos en toda la sección):

| Estado | Acento / punto | Pill |
|---|---|---|
| programado | `#adb5bd` (gris) | neutro |
| enviado / entregado | `#6A8899` (acero) | acero suave |
| leído / contestó | `#28a745` (verde) | verde suave |
| sin responder | `#FFD166` (ámbar) | ámbar suave |
| falló | `#dc3545` (rojo) | rojo suave |
| salteado / pausado | borde sutil sin acento | gris |

- Botones **ghost** dentro de las cards (sin relleno, borde del color).
- Columna derecha (escritorio): resumen del día y próximos 7 días. En celular pasa debajo.
- Aviso "todavía no conectado" como status indicator con borde izquierdo ámbar, no como caja de alerta.
- Estado vacío: texto breve centrado ("Hoy no hay mensajes programados") con ícono, sin ilustraciones.

### 6.4 Pestaña Respuestas (bandeja)

Escritorio: **dos paneles** (lista a la izquierda, detalle a la derecha). Celular: una pantalla a la vez con botón de volver (`IconArrowLeft`).

```
┌ CONVERSACIONES ───────────┬ MERCADO SUR ───────────────────────────────────┐
│ ▌Mercado Sur   08:41  (2) │ Para revisar                                   │
│ ▌Don Pepe      08:39      │ ┌ MENSAJE ─────────────────────────────────┐   │
│  López         ayer       │ │ "5 kg lomo y 3 de bondiola, lo de siempre"│   │
│  (sin identificar) +54…   │ └───────────────────────────────────────────┘   │
│                           │ INTERPRETACIÓN                                 │
│                           │  Lomo ............ 5 kg   [exacto]              │
│                           │  Bondiola ........ 3 kg   [alias]               │
│                           │  "lo de siempre" . ?      [no entendido]        │
│                           │  [+ Agregar renglón]                            │
│                           │ [Pasar a pedido de hoy]  [Sin pedido]  [Descartar]│
└───────────────────────────┴────────────────────────────────────────────────┘
```

- Lista: filas planas, la activa con fondo `--color-primary-soft`, no leídas con acento ámbar.
- Mensaje del cliente en una caja gris `#f8f9fa` sin borde (sub-sección del NEWLOOK).
- Cada renglón reconocido muestra un pill de **seguridad**: exacto / alias / parcial en verde suave, no entendido en ámbar. Se edita en línea.
- Acción principal con fondo primario; las otras, ghost.
- Hilo de la conversación abajo, con los mensajes salientes y entrantes en burbujas simples, y la casilla de **responder** (solo si la ventana de 24 hs está abierta; si no, aparece deshabilitada con la explicación).
- "Simular respuesta" queda disponible solo mientras la conexión esté en modo prueba.

### 6.5 Pestaña Programación

- Barra superior: buscador, filtro por estado (segmented control: Todos / Con envío / Sin programar / Pausados) y selección múltiple.
- Cada cliente es una card plana con **acento izquierdo** (verde si tiene envío activo, sin acento si no) y **chevron SVG que rota** al expandir. La expansión usa `max-height` con la curva `cubic-bezier(.4,0,.2,1)`.
- Resumen de cada cliente cerrado: nombre, `Lun · Jue · 08:30`, estado del WhatsApp y del consentimiento como pills.
- Al expandir:

```
┌ WHATSAPP Y CONSENTIMIENTO ─────────────────────────────────────┐
│ WhatsApp  [ 11 4567-8901 ]  ● +5491145678901     Consentimiento: [confirmado ▾]
├ ENVÍOS ────────────────────────────────────────────────────────┤
│ ┌ Envío 1 ────────────────────────────── (toggle activo)  × ┐  │
│ │ Días    [Lun][Mar][Mié][Jue][Vie][Sáb][Dom]               │  │
│ │ Hora    [ 08:30 ]       Plantilla [ Consulta de pedido ▾ ] │  │
│ │ Variable "extra"  [ Tenemos lomo fresco             ]      │  │
│ │ ┌ Así lo recibe ───────────────────────────────┐           │  │
│ │ │ Hola López, ¿qué te mando hoy? Tenemos lomo… │           │  │
│ │ └───────────────────────────────────────────────┘           │  │
│ └─────────────────────────────────────────────────────────────┘  │
│ [ + Agregar otro envío ]                                          │
├ PAUSAS ────────────────────────────────────────────────────────┤
│ Pausar hasta [ fecha ]     Saltear fechas [ + ]                   │
└────────────────────────────────────────────────────────────────┘
                                          [Cancelar]  [Guardar]
```

- Los días se eligen con **segmented control de píldoras** suaves (activo con fondo `--color-primary-soft` y texto `#3a5060`), no con botones de color fuerte.
- El interruptor activo es un **toggle switch** de toda la fila clickeable.
- La vista previa es una caja gris `#f8f9fa`, con el nombre resuelto.
- **Selección múltiple:** al tildar varios clientes aparece una barra flotante abajo con "Aplicar horario", "Pausar" y "Quitar".
- Footer de acciones con Cancelar (ghost, `flex:1`) y Guardar (primario, `flex:2`).

### 6.6 Pestaña Plantillas

- Lista de cards planas: nombre, categoría, **pill de estado de aprobación** (borrador gris, en revisión ámbar, aprobada verde, rechazada rojo) y cuántos clientes la usan.
- Editor en modal (patrón de modal del NEWLOOK: overlay con blur, panel de 16 px, header con label + nombre, footer 1:2).
- Variables insertables con un toque; botón "Redactar con el Asistente".
- Si está rechazada, se muestra el motivo en una caja con acento rojo.

### 6.7 Pestaña Conexión

- Un **status indicator** arriba: punto con halo + "WhatsApp conectado" / "No conectado", detalle en 0.68rem (último mensaje recibido, número).
- Proveedor: dos opciones como cards seleccionables (acento izquierdo acero en la elegida).
- **Checklist del trámite** con barra de avance fina y un paso por fila (toggle o tilde). Cada paso tiene su explicación corta.
- Sección **Probar conexión**: campo con un número propio y botón "Enviar prueba".
- Sección **Uso del mes**: mensajes enviados, estimado de gasto, advertencia si se acerca al tope fijado.

### 6.8 Modales

Todos siguen el patrón único: overlay `rgba(0,0,0,0.4)` con blur de 2 px, panel centrado con `borderRadius: 16px`, header de dos líneas (label uppercase + nombre), botón de cierre circular `#f3f4f6`, body que scrollea y footer fijo con Cancelar (1) y acción principal (2). El modal de alta de cliente ya cumple y se reutiliza tal cual.

### 6.9 Movimiento

| Qué | Cómo |
|---|---|
| Indicador de pestaña | `layoutId`, spring `bounce 0.15`, 0.4 s |
| Contenido al cambiar de pestaña | slide de 40 px con opacidad, 0.18 s, según la dirección |
| Expandir cliente | `max-height`, 0.3 s, `cubic-bezier(.4,0,.2,1)` |
| Chevron | rotación 180°, 0.22 s |
| Aparición de filas nuevas | `.fade-in` existente |
| Reducir movimiento | respetar `prefers-reduced-motion` |

### 6.10 Responsive y accesibilidad

- Un solo corte en 992 px, igual que el resto de la app.
- Objetivos táctiles de al menos 40 px en celular.
- Todo ícono con `aria-label` si va solo; foco visible con el halo acero de los inputs.
- Los estados nunca dependen solo del color: siempre llevan texto.

### 6.11 Íconos nuevos

`IconChat`, `IconClock`, `IconSend` (y `IconPause` si hace falta), agregados a `gestionSemanal/icons.jsx` con el mismo formato (viewBox 24, `currentColor`, trazo 2, prop `size`). Documentarlos en README-NEWLOOK.md.

---

## 7. Decisiones abiertas (con mi recomendación)

| # | Decisión | Recomendación |
|---|---|---|
| 1 | Proveedor | **Twilio con sandbox** para construir y probar ya; pasar a Meta directo cuando el número y la plantilla estén aprobados. La capa de proveedor queda aislada. |
| 2 | Número | Chip prepago dedicado (el usuario tiene uno). Hasta tenerlo, sandbox. |
| 3 | Varios envíos por cliente | Sí (lista de reglas), desde el primer día. |
| 4 | Crear pedido directo o con revisión | **Siempre revisión** al principio. Auto-confirmar como opción posterior. |
| 5 | Audios y fotos | Marcarlos para atender a mano en la primera versión; transcribir con Gemini después. |
| 6 | Responder desde la app | En la etapa de respuestas, dentro de la ventana de 24 hs. |
| 7 | Cliente que no contesta | Marcar "sin responder" a las N horas. **No reenviar solo**; el reenvío es manual. |
| 8 | Consentimiento | Campo obligatorio por cliente; sin "confirmado" no se programa. |
| 9 | Horario de silencio | 07:00 a 20:00 por defecto, configurable. |
| 10 | Mensaje "lo de siempre" | Guardar el pedido habitual de cada cliente para poder interpretarlo (etapa posterior). |

## 8. Fuera de alcance (por ahora)

Campañas masivas o promociones, chatbot que conteste solo, catálogos de WhatsApp, pagos por WhatsApp, más de un número, multiusuario con permisos distintos.
