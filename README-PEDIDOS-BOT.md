# Pedidos por WhatsApp — Bot con menú (cambios al plan)

**Estado:** plan. Se programa recién cuando se aprueba este documento.
**Relación con los otros documentos:** [README-PEDIDOS-WHATSAPP.md](README-PEDIDOS-WHATSAPP.md) (diseño) y [README-PEDIDOS-IMPLEMENTACION.md](README-PEDIDOS-IMPLEMENTACION.md) (fases). Lo que está acá **pisa** lo que diga el plan anterior sobre el proveedor y suma el bot de entrada.

---

## 1. Qué cambió

| Antes | Ahora |
|---|---|
| Proveedor: Twilio | **Meta WhatsApp Cloud API** (directo, sin intermediario) |
| Solo envío automático de la pregunta del día | Envío automático **y** bot de entrada con menú |
| Sin precios | Pestaña **Precios** en Pedidos de Mi Reparto |
| Sin traspaso a una persona | Opción "hablar con una persona" |

El envío automático y el bot **conviven en el mismo número**, y la persona del local puede seguir contestando desde el celular con la app de WhatsApp Business.

## 2. Lo que ya está hecho en Meta (no secreto)

- Portafolio comercial "Frigorifico La Trinidad", a nombre de José Luis Aluch.
- App de desarrolladores "La Trinidad Bot": `1639936807906898`.
- Cuenta de WhatsApp "La Trinidad Bot": `1668098768236139`.
- Número +54 9 11 7350-8899, identificador de número de teléfono `1477571658765633`, **registrado** y conectado también a la app del celular.
- Plantilla `pedido_dia` (Utilidad, español de Argentina) enviada a revisión.

**Pendiente de ustedes:** método de pago, verificación del negocio con el CUIT y cambiar la contraseña de la cuenta de Facebook de José Luis.

Las claves (token permanente, secreto de la app) **nunca van al repositorio ni a Firestore**: se cargan como secretos de Firebase.

## 3. El bot de entrada

El cliente escribe, el bot manda el menú:

1. Hacer un pedido
2. Ver horarios y ubicación
3. Pedir precios
4. Ver promociones
5. Ver el estado de mi pedido
6. Hablar con una persona

| Opción | Qué hace | Fuente |
|---|---|---|
| 1 | Pide cortes y kilos, interpreta (reglas de `src/utils/cortes.js` + Gemini), confirma y guarda el pedido `pendiente`, `origen: 'whatsapp'` | colección `pedidos` |
| 2 | Texto fijo con dirección y horarios | `pedidos_config` |
| 3 | Manda la lista de precios | pestaña **Precios** |
| 4 | Manda las promociones vigentes | pestaña **Promociones** |
| 5 | Busca el último pedido del cliente por teléfono y dice su estado | `pedidos` + ficha de clientes |
| 6 | Avisa que lo atiende una persona, el bot deja de contestar en ese chat y se marca en la página | `pedidos_mensajes` |

Formato del menú: WhatsApp permite solo 3 botones, pero un **mensaje de lista** admite hasta 10 opciones. El menú va como lista desplegable, y el cliente también puede contestar con el número. Se mantiene el límite de 10 por si se suman más opciones.

Reglas:

- Cualquier texto que no sea una opción vuelve a mostrar el menú.
- Fuera de la ventana de 24 horas el bot **no** puede escribir con texto libre: solo con plantilla.
- Los pedidos dudosos van a la bandeja de **Respuestas**, no directo a Hoy.
- Si el teléfono no coincide con ningún cliente, el pedido se guarda "sin identificar" y se asigna a mano.

### Texto de la opción 2 (confirmado)

> Estamos en José E. Rodó 6341, CABA.
> Atendemos de lunes a sábado, de 4 a 12 hs. Domingos cerrado.

Falta confirmar si se agrega "En feriados consultá".

## 4. Pestaña Precios (nueva)

Los precios se cargan en Pedidos de Mi Reparto y de ahí los lee el bot.

- Una lista editable: corte, precio por kilo, disponible sí/no, fecha de última actualización.
- El bot manda solo los cortes disponibles, con la fecha de actualización.
- Colección nueva `pedidos_precios` (a definir al implementar), con reglas de Firestore que permitan escribir solo desde la app autenticada.

## 4 bis. Pestaña Promociones (nueva)

Las promociones también se cargan en Pedidos de Mi Reparto, y la opción 4 del bot las lee.

- Una lista editable: título, descripción corta, precio o descuento, fecha desde y hasta, activa sí/no.
- El bot manda solo las **vigentes** (activas y dentro de fecha). Si no hay ninguna, responde "Por ahora no tenemos promociones" y vuelve al menú.
- Colección nueva `pedidos_promociones` (a definir al implementar), con las mismas reglas de escritura que los precios.
- Las promociones vencidas dejan de mandarse solas, sin borrarse, para poder reutilizarlas.

## 4 ter. Texto libre: preguntas frecuentes e IA acotada

Cuando el cliente escribe algo que **no es una opción del menú** (por ejemplo "¿me pueden mandar la mercadería al local?"):

1. Gemini recibe el texto y **solo** la lista de **Preguntas frecuentes** cargada en Pedidos (zonas de entrega, mínimo de compra, días de reparto, formas de pago, etc.).
2. Si la respuesta está en esa lista, contesta con eso, en tono cordial, y ofrece el menú.
3. Si **no** está, no adivina: responde "Te paso con una persona", marca el chat para atención humana y guarda la pregunta en una lista de **preguntas sin respuesta**.

Reglas:

- La IA **no** promete envíos, precios, zonas ni plazos que no estén en las preguntas frecuentes.
- La IA no cambia pedidos ni datos: solo responde.
- Al principio, cada respuesta de la IA queda **visible en la página** (en Respuestas) para que la revisen.
- La lista de preguntas sin respuesta sirve para detectar las que se repiten y cargarlas como frecuentes.
- Pestaña nueva **Preguntas frecuentes** en Pedidos: pregunta o tema, respuesta, activa sí/no. Colección `pedidos_faq` (a definir al implementar).

## 5. Cambios al plan de fases

- **Fases 0 a 7** (pantallas y datos): **no cambian**, salvo sumar las pestañas **Precios**, **Promociones** y **Preguntas frecuentes** y el texto de horarios en la configuración.
- **Fase 8 (backend):** el proveedor pasa de Twilio a Meta. La capa `functions/src/proveedor/` se mantiene, con `meta.js` como implementación principal.
  - `webhookEntrante`: verifica la firma `X-Hub-Signature-256` con el secreto de la app y el token de verificación del webhook.
  - Nueva `botMenu.js`: máquina de estados por conversación (menú, pedido en curso, humano).
  - `programador`: sigue igual, enviando la plantilla `pedido_dia` a los envíos que vencen.
- **Fase 9:** ya no hace falta registrar un número aparte: el número es el de producción.

Requisitos previos de la Fase 8 (los hacen ustedes): plan **Blaze** de Firebase, método de pago en Meta y plantilla aprobada.

## 6. Preguntas abiertas

1. ¿El plan Blaze de Firebase está activo?
2. ¿Los domingos están cerrados? (Maps dice que sí.)
3. ¿Se agrega "En feriados consultá" al mensaje de horarios?
4. ¿Los precios se mandan todos o solo algunos cortes?
5. ¿Qué pasa con el cliente sin teléfono cargado en la ficha? (No puede usar la opción 5, estado del pedido.)
6. ¿Cómo se avisa en la página que alguien pidió hablar con una persona?
7. Para las preguntas frecuentes: ¿hacen envíos? ¿A qué zonas, con qué mínimo y en qué días? ¿Qué formas de pago aceptan?
8. ¿Las promociones llevan foto? (WhatsApp permite mandar imágenes; habría que guardarlas en Firebase Storage.)
