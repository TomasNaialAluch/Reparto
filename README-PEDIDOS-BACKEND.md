# Pedidos por WhatsApp — Diseño del backend (Cloud Functions)

**Estado:** diseño **aprobado el 18/11/2026**, con las 8 decisiones de la sección 11 tal como están propuestas. Se implementa por fases (sección 10), una por vez.
**Contexto:** [README-PEDIDOS-BOT.md](README-PEDIDOS-BOT.md) (qué hace el bot) y [README-PEDIDOS-IMPLEMENTACION.md](README-PEDIDOS-IMPLEMENTACION.md) (fases; esta es la Fase 8, ahora sobre Meta y no Twilio).

> Lo que dice de la API de Meta (formas de los mensajes, nombres de campos, precios) está escrito de memoria y **se confirma contra la documentación oficial al implementar cada paso**. No se da por verificado.

---

## 1. Qué hace el backend

Tres funciones en el mismo proyecto de Firebase (`mireparto-14d64`, plan Blaze):

| Función | Cuándo corre | Qué hace |
|---|---|---|
| `webhookWhatsApp` | Meta le avisa de cada mensaje y cada cambio de estado | Recibe lo que escribe el cliente, decide qué contestar y guarda lo que corresponda |
| `programador` | Cada 5 minutos (hora de Argentina) | Manda la plantilla diaria "¿qué te enviamos hoy?" a los clientes que les toca |
| `enviarAhora` | Cuando alguien toca un botón en la página | "Enviar ahora", "Reenviar" y "Enviar prueba" |

La página **no habla con WhatsApp**: solo lee y escribe en Firestore. El backend es el único que usa la clave de Meta.

## 2. Qué ya existe y se reutiliza

- Pedidos: colección `pedidos`, un documento por pedido con `renglones: [{ id, texto, hecha }]` en texto libre ("12 b pata"), `fecha`, `cliente`, `clienteId`, `estado`, `origen`. El bot crea los suyos con `origen: 'whatsapp'`.
- Clientes: colección `contactos`, con el campo `telefono`. El bot identifica al cliente por teléfono.
- Programación por cliente: `pedidos_programacion`. Mensajes: `pedidos_mensajes`. Config: `pedidos_config`.
- Catálogo del bot (ya hecho): `pedidos_precios`, `pedidos_promociones`, `pedidos_faq`.
- Lógica pura ya probada: `src/utils/interpretarRespuesta.js`, `src/utils/pedidosBot.js`, `src/utils/whatsapp.js`, y las reglas de cortes de `src/utils/cortes.js`.

## 3. Recepción de mensajes

1. **Meta verifica el webhook** con un pedido GET y un token de verificación; la función responde el desafío.
2. **Cada mensaje llega por POST.** Se valida la firma `X-Hub-Signature-256` con el secreto de la app. Si no coincide, se descarta.
3. **Sin duplicados:** Meta puede reenviar el mismo aviso. Cada mensaje se guarda con el id de WhatsApp como id del documento y la creación falla si ya existe.
4. **Responder rápido:** se contesta 200 a Meta enseguida; lo pesado (Gemini, escritura) va después.
5. **Quién es:** se normaliza el teléfono (`normalizarTelefonoAR`) y se busca en `contactos`. Si no hay coincidencia, la conversación queda "sin identificar".

**Conversación por teléfono:** documento `pedidos_conversaciones/{telefono}` con `estado` (`menu` | `pedido` | `humano`), `ultimoEntrante` (para la ventana de 24 horas) y `clienteId`.

## 4. Qué contesta

Orden de decisión para cada mensaje entrante:

1. **"BAJA"** → se marca al cliente como no contactable, se confirma, y el programador deja de escribirle.
2. **Conversación en `humano`** → el bot **no contesta**; solo se guarda el mensaje para que lo vea la persona.
3. **Número de opción o palabra del menú** (`opcionDeMenu`) → se ejecuta esa opción.
4. **Texto con cantidades** (`interpretarRespuesta` devuelve `pedido`) → flujo de pedido (sección 5).
5. **Cualquier otro texto** → preguntas frecuentes con Gemini (sección 6); si no hay respuesta, pasa a humano.
6. **Audio o imagen** → "No puedo escuchar audios. Escribime el pedido o elegí 6 para hablar con una persona."

Las 6 opciones:

| Opción | Respuesta |
|---|---|
| 1 Pedido | Pide cortes y kilos y pasa a estado `pedido` |
| 2 Horarios y ubicación | `textoHorarios()` |
| 3 Precios | `textoPrecios()` con `pedidos_precios` |
| 4 Promociones | `textoPromociones()` con las vigentes de `pedidos_promociones` |
| 5 Estado de mi pedido | `textoEstadoPedido()` con el último pedido del cliente (solo si está identificado) |
| 6 Humano | Pasa a `humano`, avisa al cliente y deja la marca en la página |

El menú va como lista desplegable de WhatsApp (hasta 10 opciones), con el texto numerado de respaldo.

## 5. Flujo de pedido

1. El cliente escribe, por ejemplo, "10 kg asado, 5 kg vacío".
2. `interpretarRespuesta` devuelve renglones con seguridad (`segura` | `revisar` | `incompleta`).
3. **Todos seguros:** el bot repite lo que entendió ("Anoté: 10 kg Asado, 5 kg Vacío. ¿Está bien? 1 Sí · 2 Corregir"). Con "1" se crea el pedido en `pedidos` (`origen: 'whatsapp'`, `estado: 'pendiente'`) y aparece en Hoy con el ícono de chat.
4. **Alguno dudoso o sin kilos:** no se crea el pedido. Queda como mensaje `nuevo` en la bandeja **Respuestas** con la propuesta, y el bot dice "Lo reviso con una persona y te confirmo".
5. **"2 Corregir":** vuelve a pedir el texto.
6. **Si el cliente ya tiene un pedido pendiente ese día:** se suman los renglones al mismo pedido, no se crea otro.

El renglón se guarda en el mismo formato que usa el cuaderno de Hoy: `"{kg} {corte}"`, por ejemplo `10 Asado`.

## 6. Texto libre con IA (Gemini)

- Modelo: el mismo que usa la app (`gemini-2.5-flash`), **llamado desde el backend** con una clave propia guardada como secreto. La clave que hoy usa la app (`VITE_GEMINI_API_KEY`) está dentro del código del navegador y **no se reutiliza**.
- Entrada: el mensaje del cliente y **solo** las preguntas frecuentes activas de `pedidos_faq`.
- Salida obligatoria en JSON: `{ "respondible": true|false, "respuesta": "..." }`, con temperatura 0.
- Reglas del pedido a la IA: contestar solo con lo que está en las preguntas frecuentes; no inventar envíos, precios, zonas ni plazos; si no está, `respondible: false`.
- Si `respondible` es falso, o el JSON es inválido, o la IA tarda más de unos segundos: **pasa a humano**. Nunca se manda una respuesta de la IA sin pasar ese control.
- Cada respuesta de IA queda guardada en `pedidos_mensajes` para revisarla en la página.

## 7. Atención humana

- La opción 6 (o la IA, cuando no sabe) pone la conversación en `humano`: el bot se calla en ese chat.
- La página lo muestra en **Respuestas** con una marca "pide una persona". Hay un botón **"Devolver al bot"**.
- **Respaldo automático:** si pasan 12 horas sin actividad, la conversación vuelve a `menu` sola.
- **Celular y bot a la vez:** como el número sigue conectado a la app de WhatsApp Business, la persona puede contestar desde el celular. Cuando eso pasa, Meta avisa con un evento de eco; el backend lo usa para poner la conversación en `humano` automáticamente. *(Nombre exacto del evento y su disponibilidad en este tipo de cuenta: a confirmar al implementar.)*

## 8. Envío automático diario

- `programador` corre cada 5 minutos con hora de Buenos Aires y usa `proximosEnvios` sobre `pedidos_programacion`.
- Antes de mandar chequea: cliente activo, consentimiento, fecha no salteada ni pausada, fuera del horario de silencio, plantilla `pedido_dia` aprobada.
- **Sin duplicados:** se crea `pedidos_envios/{clienteId_fecha_envioId}` con una operación que falla si ya existe. Dos corridas superpuestas no mandan dos veces.
- **Ventana de 24 horas:** si el cliente escribió en las últimas 24 horas (`estaEnVentana`), se puede mandar texto libre y no hace falta la plantilla. Fuera de la ventana, solo plantilla.
- Los avisos de Meta de entregado, leído y fallido actualizan el envío (`enviado` → `entregado` → `leido` o `fallido`).
- Un fallo de un cliente no frena a los demás; queda `fallido` con el motivo.

## 9. Secretos, seguridad y costos

**Secretos** (Secret Manager de Firebase, nunca en el código ni en Firestore, los carga el usuario):
- `WHATSAPP_TOKEN`: token permanente de un usuario del sistema de Meta.
- `META_APP_SECRET`: secreto de la app (para validar firmas).
- `WEBHOOK_VERIFY_TOKEN`: token inventado, para el paso de verificación del webhook.
- `GEMINI_API_KEY`: clave propia del backend.

**Seguridad:**
- Los registros del servidor no llevan teléfonos completos ni textos de clientes.
- Las funciones escriben con el SDK de administración, que no pasa por las reglas de Firestore. Esas reglas siguen abiertas a cualquier usuario autenticado, incluso anónimo. **Antes de guardar teléfonos reales de clientes hay que cerrarlas** (solo usuarios con sesión real, y que el backend sea el único que escriba `pedidos_envios` y `pedidos_conversaciones`). Es un cambio que afecta a toda la app y se hace aparte.
- Límite de mensajes por conversación por minuto, para que un número no pueda llenar la cuenta de respuestas.

**Costos** (aproximados, a confirmar):
- Las funciones, a este volumen, entran en el uso gratuito de Firebase. El programador cada 5 minutos son unas 8.600 corridas al mes.
- Meta cobra los mensajes que arranca el negocio (la plantilla diaria) y da conversaciones de servicio gratuitas hasta cierto número por mes. Precios y topes **no verificados**: se miran en la documentación y en la cuenta antes de salir.
- Gemini: pocos centavos por mes al volumen esperado.

## 10. Fases de implementación

Cada fase termina con algo que se puede probar, y se commitea sola.

| Fase | Qué se entrega | Listo cuando |
|---|---|---|
| 8a | Carpeta `functions/`, `webhookWhatsApp` que verifica el webhook y valida la firma, y registro seguro | Meta acepta el webhook y un mensaje de prueba llega al registro |
| 8b | Menú y respuestas fijas (opciones 2, 3, 4) | Escribir "2" al número devuelve el horario |
| 8c | Pedido por texto, confirmación y bandeja de revisión | Un pedido escrito termina en Hoy; uno dudoso en Respuestas |
| 8d | Estado del pedido, atención humana y eco del celular | "Hablar con una persona" calla al bot; contestar desde el celular también |
| 8e | Preguntas frecuentes con Gemini | Una pregunta cargada se contesta; una no cargada pasa a humano |
| 8f | Envío programado y estados | La plantilla sale a la hora, una sola vez, y "BAJA" frena los envíos |
| 8g | Pruebas completas con números de prueba y pase a producción | Cliente real de prueba recorre todo, de punta a punta |

**Pruebas:** las partes puras (decisión de respuesta, duplicados, ventana, silencio) se prueban con scripts de Node sin Firebase, como en la Fase 1. El resto, con el webhook de prueba de Meta y números de prueba de ustedes.

## 11. Decisiones (aprobadas el 18/11/2026)

1. **¿A qué día va un pedido hecho por WhatsApp?** Propuesta: si llega hasta las 12 hs, va a **hoy**; si llega después, va al **próximo día de reparto** (lunes a sábado, saltando el domingo).
2. **¿El bot contesta las 24 horas?** Propuesta: sí, pero fuera de 4 a 12 hs agrega "Ahora estamos cerrados; tu pedido queda para el próximo día".
3. **Cliente que escribe y no está en la ficha de clientes.** Propuesta: se atiende igual el menú, pero un pedido no se crea solo: queda en Respuestas "sin identificar" para asignarle el cliente a mano.
4. **¿Cuántas horas calla el bot después de pasar a una persona?** Propuesta: 12 horas, con el botón "Devolver al bot".
5. **Región de las funciones.** Propuesta: la más cercana a Argentina disponible para Firebase (São Paulo), para menor demora.
6. **¿Compartir el código entre la página y el backend?** Propuesta: una carpeta compartida con las funciones puras que se copia a `functions/` con un comando, y una prueba que verifica que las dos copias sean iguales.
7. **Texto de "BAJA".** Propuesta: aceptar "baja", "stop" y "no quiero más mensajes".
8. **Quién crea el token de Meta.** Propuesta: José Luis crea el usuario del sistema y el token en Meta, y lo carga en Firebase con un comando que yo le indico, sin que pase por el chat.
