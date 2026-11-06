# Pedidos por WhatsApp — recordatorios a clientes y recepción de pedidos

**Estado:** estructura armada en la app (ruta `/pedidos`, sin conexión a WhatsApp todavía). Falta el backend (Etapas 2 y 3) y probar la pantalla con datos reales.

**Ya construido:**
- Página `/pedidos` con cuatro pestañas: *Hoy toca*, *Respuestas*, *Programación* y *Conexión* (`src/pages/Pedidos.jsx`, `src/components/pedidos/`).
- El WhatsApp de cada cliente es el teléfono del contacto (`contacto.telefono`), en la misma ficha de Proveedores y Clientes. Se valida y se pasa a formato `+549…` (`src/utils/whatsapp.js`).
- Colecciones nuevas: `pedidos_programacion` (un documento por cliente), `pedidos_mensajes` (enviados y recibidos) y `pedidos_config/whatsapp` (proveedor y checklist de la conexión).
- Una respuesta se revisa y se pasa a pedido `pendiente` de Hoy con el origen indicado. Hasta conectar WhatsApp, las respuestas se cargan con "Simular respuesta".

## 1. Qué queremos

Una **sección exclusiva "Pedidos"** donde:

1. Cada cliente tiene configurado **qué días y a qué hora** se le manda un mensaje de WhatsApp personalizado ("Hola Juan, ¿qué te mando hoy?").
2. Si el cliente **contesta**, la app escucha la respuesta; si es un pedido, **se pasa a la página Hoy** como pedido `pendiente` (con `origen: 'whatsapp'`, ya previsto en [README-PAGINA-HOY.md](README-PAGINA-HOY.md)).
3. Todo se configura y se ve en un solo lugar, porque va a ser bastante contenido.

Esto reemplaza y amplía la "Fase 8 — Pedidos por WhatsApp (Twilio)" de [README-ROADMAP-HOY.md](README-ROADMAP-HOY.md).

## 2. Qué se puede y qué no (WhatsApp)

- **Sin backend** solo hay enlaces `wa.me`: abren el chat con el mensaje armado, pero **cada envío necesita un toque**. No se pueden mandar 30 de una.
- **Envío automático y recepción de respuestas** requieren la **API oficial de WhatsApp Business** y un **backend** (Cloud Functions de Firebase, plan Blaze) que reciba el webhook.
- El primer mensaje del día lo inicia el negocio, así que **debe ser una plantilla aprobada por Meta** (puede llevar variables como el nombre). Cuando el cliente contesta se abre una ventana de 24 hs para hablar libre.
- **Proveedores posibles:** Meta Cloud API directo (recomendado, sin recargo de intermediario) o Twilio (más simple de arrancar, con recargo). Las librerías no oficiales (Baileys, whatsapp-web.js) quedan descartadas: violan los términos y ponen en riesgo el número.
- Firebase **no** ofrece WhatsApp. Aporta Cloud Functions (webhook y envíos programados) y Firestore (datos).

## 3. Estado de la cuenta de Meta (revisado el 2026-11-06)

Revisado desde Chrome con la sesión del usuario:

| Requisito | Estado |
|---|---|
| Página de Facebook "Frigorífico La Trinidad" | ✅ existe (134 seguidores), con Meta Business Suite |
| Portafolio comercial de Meta | ❓ no visible desde la configuración de la página |
| Verificación del negocio | ❓ no visible |
| Cuenta de WhatsApp Business (WABA) | ❌ no se encontró ninguna |
| Número dedicado (no usado en WhatsApp personal) | ❓ a confirmar |
| Cuenta de desarrollador / app en developers.facebook.com | ❌ no hay sesión de desarrollador |
| Plantillas aprobadas y método de pago | ❌ nada configurado |

No se pudo revisar el WhatsApp que el usuario tiene abierto en la computadora (control de escritorio no disponible en la sesión). Falta confirmar si ese número es de WhatsApp Business o común.

## 4. Etapas

### Etapa 1 — La sección Pedidos, sin backend

Sirve desde el primer día y deja listo el modelo de datos.

- **Programación por cliente:** días de la semana, hora y mensaje personalizado (con variables como `{nombre}`). Se puede redactar con el Asistente (Gemini) que ya existe.
- **Tablero "Hoy toca mandar":** lista de clientes del día ordenada por hora, con botón que abre WhatsApp (`wa.me`) con el mensaje listo. Se marca "enviado" y queda registro.
- **Bandeja de respuestas:** se pega lo que contestó el cliente; el Asistente propone los ítems (corte + kg) y se pasa a pedido `pendiente` en Hoy.
- Tope realista: un toque por cliente.

### Etapa 2 — Envío automático

- Cloud Function programada que manda la plantilla a cada cliente en su día y hora.
- Necesita: cuenta Meta (o Twilio), número dedicado, plantilla aprobada, plan Blaze.

### Etapa 3 — Recepción de respuestas

- Webhook que recibe los mensajes entrantes y los guarda.
- Interpretación con IA ("5 kg de lomo y 3 de bondiola") y alta como pedido `pendiente` con 💬, siempre para revisar antes de armar.
- Audios y fotos de listas: a definir (los audios complican la interpretación).

Las etapas 2 y 3 comparten infraestructura: conviene elegir proveedor una sola vez y dejar una capa chica de "enviar / recibir mensaje" para poder cambiar de Twilio a Meta sin reescribir.

## 5. Datos (propuesta)

```js
// pedidos_programacion — una por cliente
{
  id: 'prog_...',
  clienteId: 'contacto_id',
  cliente: 'Nombre',
  telefono: '+54...',
  dias: [1, 4],                 // 0 = domingo ... 6 = sábado
  hora: '08:30',
  mensaje: 'Hola {nombre}, ¿qué te mando hoy?',
  activo: true
}

// pedidos_mensajes — registro de lo enviado y recibido
{
  id: 'msg_...',
  clienteId: 'contacto_id',
  fecha: '2026-11-09',
  direccion: 'saliente' | 'entrante',
  texto: '...',
  estado: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'fallido' | 'procesado',
  pedidoId: 'ped_...' | null,   // pedido creado a partir de esta respuesta
  timestamp: '...'
}
```

Los pedidos siguen siendo los de Hoy (`origen: 'whatsapp'`, `estado: 'pendiente'`).

## 6. Pantalla (borrador)

Ruta propuesta `/pedidos`, con pestañas:

1. **Hoy toca** — clientes del día, botón de enviar, estado de cada uno.
2. **Respuestas** — bandeja de mensajes recibidos y los pedidos propuestos para confirmar.
3. **Programación** — días, hora y mensaje de cada cliente.
4. **Conexión** (Etapas 2 y 3) — estado de WhatsApp, plantillas y número.

## 7. Preguntas abiertas

1. ¿Cuántos clientes y cada cuánto? (define el costo mensual en Etapa 2)
2. ¿Hay un número que se pueda dedicar solo a esto? ¿El WhatsApp actual es Business o común?
3. ¿Los clientes contestan texto libre, audios o fotos de listas?
4. ¿Los pedidos interpretados entran siempre `pendiente` para revisar? (se recomienda que sí)
5. ¿Un mismo cliente puede tener varios horarios o mensajes distintos según el día?
6. ¿Qué pasa si el cliente no contesta? ¿Se reenvía o solo se marca?
7. ¿Se arranca por la Etapa 1 y se decide el proveedor después?
