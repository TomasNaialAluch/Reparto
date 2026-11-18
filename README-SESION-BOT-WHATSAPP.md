# Bot de WhatsApp de Frigorífico La Trinidad — resumen de la sesión (17 y 18/11/2026)

Documento para **retomar desde otra computadora o con otro chat**. Cuenta qué se hizo, con qué páginas y cuentas,
cómo está todo hoy y qué sigue. No tiene contraseñas, claves ni documentos: esos los escribe siempre el usuario.

Documentos relacionados: [README-PEDIDOS-BOT.md](README-PEDIDOS-BOT.md) (qué hace el bot),
[README-PEDIDOS-BACKEND.md](README-PEDIDOS-BACKEND.md) (diseño del backend, decisiones aprobadas),
[README-PEDIDOS-WHATSAPP.md](README-PEDIDOS-WHATSAPP.md) y [README-PEDIDOS-IMPLEMENTACION.md](README-PEDIDOS-IMPLEMENTACION.md)
(diseño de la sección Pedidos; **mencionan Twilio, que se descartó: manda Meta**).

---

## 1. Objetivo

Un solo número de WhatsApp, **+54 9 11 7350-8899**, para:
1. **Bot de entrada** con menú de 6 opciones (pedido, horarios y ubicación, precios, promociones, estado de mi pedido, hablar con una persona).
2. **Envío automático** diario de la pregunta "¿qué te enviamos hoy?" a los clientes que les toca (plantilla de Meta).
3. Que **una persona** pueda contestar desde el celular (el número sigue conectado a la app de WhatsApp Business).

Los pedidos que llegan por WhatsApp terminan en la página **Hoy** de Mi Reparto (`origen: 'whatsapp'`).
Proveedor: **Meta WhatsApp Cloud API** (no Twilio). IA: **Gemini por Vertex AI**, solo con preguntas frecuentes cargadas.

## 2. Cómo retomar en otra computadora

```bash
git clone https://github.com/TomasNaialAluch/Reparto
cd Reparto
git checkout feat/pagina-hoy-cuaderno-pesadas
npm install                 # la página
cd functions && npm install # el backend
npm test                    # 45 pruebas del backend (Node 22)
```

- Hace falta **Node 22** y la herramienta de Firebase (`npx firebase login`, con la cuenta tomasaluch.ar@gmail.com, que tiene acceso al proyecto).
- Página en local: `npm run dev` (puerto 5173).
- Publicar el chat: `npx firebase deploy --only functions:chatWeb --project mireparto-14d64` (desde la raíz).
- Ver registros: `npx firebase functions:log --only chatWeb --project mireparto-14d64`.
- Las utilidades de `src/utils/` se copian al backend con `cd functions && npm run sync`. La prueba `compartido.test.js` avisa si quedaron viejas.
- **No se versionan** (están en la carpeta de trabajo pero fuera de git): `.claude/`, `fondo/mariano.pdf`, `.firebase/*.cache`.
- El **sitio del negocio** vive en otro repo: https://github.com/TomasNaialAluch/Latrinidadcortes (se publica con `npx firebase deploy --only hosting --project mireparto-14d64` desde su carpeta).

## 3. Qué se hizo

### 3.1 Meta (cuenta de José Luis Aluch, mail latrinidadcortes@gmail.com)
- Portafolio comercial **"Frigorifico La Trinidad"** (id 2130096250934966), a nombre de José Luis (el titular fiscal), no de Tomas.
- Cuenta de WhatsApp **"La Trinidad Bot"** (id 1668098768236139) con el número +54 9 11 7350-8899 **registrado en la API** y también en la app del celular (vía "vincular cuenta de WhatsApp Business", sin borrar nada). Id del número de teléfono: 1477571658765633.
- App de desarrolladores **"La Trinidad Bot"** (id 1639936807906898) con el caso de uso de WhatsApp. Cuenta de desarrollador registrada.
- **Método de pago** cargado (Visa, divisa ARS).
- Plantilla **`pedido_dia`** (Utilidad, español de Argentina): "Hola {{1}}, buen día! Te escribimos del Frigorífico La Trinidad. ¿Qué te enviamos hoy? Respondé con los cortes y los kilos, por ejemplo: '10 kg asado, 5 kg vacío'." Estaba **en revisión**.
- **Verificación del negocio:** "En revisión". Datos cargados: titular José Luis Aluch, domicilio fiscal José Enrique Rodó 6341 CABA (C1440), teléfono, sitio web propio y documento de identidad del titular. Tipo de negocio: "Sociedad unipersonal".
- Hay un portafolio viejo (id 1609604110403027) bajo la cuenta de Tomas y una cuenta "Test Messaging Account": **no se usan**.

### 3.2 Dominio propio y página del negocio
- Meta **rechazó** el Instagram y las direcciones `.web.app` como sitio web ("dominio común"). Hizo falta un dominio propio.
- **frigorificolatrinidad.com.ar** comprado en NIC Argentina (17/11/2026, vence 17/11/2027), a nombre de José Luis. NIC **solo permite delegar** el dominio, no cargar registros DNS.
- Delegado a **Cloudflare** (plan gratis, cuenta latrinidadcortes@gmail.com entrando con Google). Servidores: `ariella.ns.cloudflare.com` y `dilbert.ns.cloudflare.com`.
- Registros DNS en Cloudflare, **sin proxy (nube gris, a propósito: con proxy Firebase no emite el certificado)**: `A @ 199.36.158.100` y `TXT @ hosting-site=frigorifico-la-trinidad`.
- En Firebase Hosting hay **tres sitios** en el proyecto `mireparto-14d64`: `mireparto` (la app), `mireparto-14d64` y `frigorifico-la-trinidad` (la página del negocio, con el dominio propio "Connected").
- Página simple: nombre, dirección, horarios, WhatsApp e Instagram. Ver la sección 7 de [Latrinidadcortes](https://github.com/TomasNaialAluch/Latrinidadcortes).
- Al publicar la página por primera vez se expuso brevemente la carpeta `.git`; se corrigió moviendo la página a `public/`. No tenía claves.

### 3.3 Código del bot (este repo)
| Qué | Dónde |
|---|---|
| Utilidades del bot (menú, precios, promociones, intérprete de respuestas) | `src/utils/pedidosBot.js`, `src/utils/interpretarRespuesta.js`, `src/utils/whatsapp.js` |
| Datos del bot en Firestore (hooks) | `src/hooks/usePedidosCatalogos.js` |
| Pestaña **Catálogo** (Precios, Promociones, Preguntas frecuentes) | `src/components/pedidos/catalogo/` |
| Shell de la sección Pedidos | `src/pages/Pedidos.jsx`, `src/components/pedidos/` |
| **Backend** (Cloud Functions, Node 22, región `southamerica-east1`) | `functions/` |
| Cerebro del bot (decide qué contestar; puro y probado) | `functions/src/cerebro.js` |
| Gemini por Vertex AI, sin clave | `functions/src/llm.js` |
| Chat de prueba de la página | `functions/src/chatWeb.js` y, en el repo del sitio, `public/chat.js` |
| Copia automática de utilidades | `functions/src/compartido/` (generada con `npm run sync`) |
| Pruebas | `functions/test/` (45) y las de la página (139, en una carpeta temporal, no versionadas) |

Colecciones de Firestore del bot: `pedidos_precios`, `pedidos_promociones`, `pedidos_faq`, `pedidos_conversaciones`, `pedidos_limites`, `pedidos_programacion`, `pedidos_mensajes`, `pedidos_config`.

### 3.4 Chat de prueba (ya funciona)
- Se abre en **https://frigorificolatrinidad.com.ar/?bot=1** (solo con `?bot=1`; los clientes no lo ven).
- La página llama a `/api/chat`, que Firebase Hosting manda a la función `chatWeb`.
- **No crea pedidos reales** (los simula). Límite: 40 mensajes por hora por sesión y 1000 por día.
- Probado: menú, horarios, pedido con confirmación, y Gemini (contesta con la pregunta cargada; si no está, pasa a una persona; no obedeció un intento de engaño).
- Gemini: se habilitó la API de Vertex AI. El modelo `gemini-2.5-flash` da 404 en este proyecto; `llm.js` prueba una lista de modelos (3.5, 3.6, 3.7, 3.8 flash, 3.1 flash-lite, 2.5) y se queda con el que funcione, en la región "global" para los 3.x.

## 4. Datos del negocio (para las preguntas frecuentes)

Cargadas en Pedidos → Catálogo → Preguntas frecuentes el 18/11/2026:
- **Envíos:** a domicilio o a locales. Capital **martes y viernes**, repartiendo **desde la mañana hasta el mediodía**. Pedido mínimo para envío: **30 kg**. Otros días: se consulta.
- **Retiro en el local:** sin mínimo, se vende por pieza.
- **Pago:** efectivo o transferencia **al recibir** la mercadería.
- **Hasta qué hora se toman pedidos:** para envíos, hasta las **5 a.m.** del día de reparto; para retiro, a cualquier hora dentro del horario del local.
- **Horario del local:** lunes a sábado, 4 a 12 hs; domingo cerrado. Dirección: José E. Rodó 6341, CABA.
- **Precios sin IVA**, se puede facturar; para cotizar, pedir cotización a una persona.
- **Pedidos de particulares:** https://tomasnaialaluch.github.io/RositaLista/ . **Por mayor:** por WhatsApp.
- Frase del dueño para los clientes nuevos: "Hacemos entregas. ¿Por dónde queda tu local y qué volumen de compra tenés?".

## 5. Estado y qué sigue (en este orden)

1. **Cambio pendiente del bot (propuesto, falta confirmar):** hoy el bot manda un pedido hecho hasta las 12 a "hoy" (decisión 1 del diseño). Con los datos reales del punto 4 eso queda **desactualizado**: el envío sale solo martes y viernes con corte a las 5 a.m., y el retiro vale a cualquier hora. Propuesta: antes de confirmar un pedido, el bot pregunta **"¿Lo retirás o lo enviamos?"** y calcula la fecha según eso (próximo martes o viernes, avisando el mínimo de 30 kg). Tocar `functions/src/cerebro.js` (`fechaDelPedido`, flujo `procesarPedido`) y sus pruebas.
2. **Revisar las preguntas frecuentes** en el Catálogo y probar el chat. Se interpretó "mechar en la semana" como "si necesitás otro día, lo coordinamos": confirmar.
3. **Cargar precios y promociones** en el Catálogo. Los nombres de los cortes reales no coinciden exacto con "asado" o "vacío": el bot no adivina y manda el pedido a revisión.
4. **Fase 8a del backend:** `webhookWhatsApp` (verificación del webhook de Meta, firma `X-Hub-Signature-256`, sin duplicados). Necesita secretos que **carga el usuario**: `META_APP_SECRET`, `WEBHOOK_VERIFY_TOKEN` y `WHATSAPP_TOKEN` (usuario del sistema de Meta, lo crea José Luis). Después 8b a 8g del diseño: menú por WhatsApp, pedido a Hoy, atención humana y eco del celular, preguntas frecuentes por WhatsApp, envío programado y producción.
5. **Esperar la verificación de Meta.** Si pide un documento extra: constancia de inscripción de AFIP **nueva** en PDF (la que se mostró es de 2021 y está vencida).
6. **Cambiar la contraseña** del Facebook de José Luis (se escribió en el chat).
7. **Cerrar las reglas de Firestore** antes de guardar teléfonos reales: hoy dejan leer y escribir a cualquier usuario autenticado, incluso anónimo.
8. Limpieza inofensiva: documentos de prueba `pedidos_conversaciones/web_prueba_*` y `pedidos_limites/*`.

## 6. Páginas y consolas usadas

- **Meta:** [Configuración del negocio](https://business.facebook.com/latest/settings/business_info?business_id=2130096250934966) · [Centro de seguridad / verificación](https://business.facebook.com/latest/settings/security_center?business_id=2130096250934966) · [Pagos](https://business.facebook.com/billing_hub/payment_settings?business_id=2130096250934966&asset_id=1668098768236139) · [Plantillas](https://business.facebook.com/latest/whatsapp_manager/message_templates?business_id=2130096250934966&tab=message-templates&asset_id=1668098768236139) · [App de desarrolladores](https://developers.facebook.com/apps/1639936807906898/dashboard/) · [Configuración de producción de WhatsApp](https://developers.facebook.com/apps/1639936807906898/use_cases/customize/wa-configurations-v2/?product_route=whatsapp-business&business_id=2130096250934966&use_case_enum=WHATSAPP_BUSINESS_MESSAGING&selected_tab=wa-configurations-v2)
- **Firebase:** [consola](https://console.firebase.google.com/u/1/project/mireparto-14d64/overview) · [Hosting del sitio del negocio](https://console.firebase.google.com/u/1/project/mireparto-14d64/hosting/sites/frigorifico-la-trinidad) · [Vertex AI (API)](https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/overview?project=mireparto-14d64&authuser=1)
- **NIC Argentina:** https://nic.ar/ingreso (Trámites a Distancia, con Clave Fiscal de José Luis)
- **Cloudflare:** https://dash.cloudflare.com (DNS del dominio)
- **Google Maps del negocio:** Frigorífico La Trinidad, José E. Rodó 6341
- **Instagram:** https://www.instagram.com/latrinidad.carne/
- **Sitio en vivo:** https://frigorificolatrinidad.com.ar · chat de prueba con `?bot=1` · app: https://mireparto.web.app

## 7. Cosas que aprendimos (para no repetir)

- **Meta pide un dominio propio** para verificar el negocio. Instagram, `.web.app` y similares se rechazan ("dominio común").
- **El número ya registrado en WhatsApp no se puede mover a la API** con "crear cuenta nueva". Sí se puede **vincular** la cuenta de WhatsApp Business existente, y así la app del celular sigue funcionando.
- **NIC Argentina no tiene editor de DNS**: solo delegación. Se usó Cloudflare gratis. El pago con tarjeta en NIC se acredita hasta en 24 horas y recién ahí se publica el dominio.
- **Cloudflare con proxy impide el certificado de Firebase**: dejar los registros en "DNS only".
- **Firebase Hosting + `rewrites` a una función** evita problemas de CORS: la página llama a `/api/chat` en su propio dominio.
- **Al publicar un sitio de Firebase desde la raíz del repo** se sube también `.git`: usar siempre una subcarpeta `public/`.
- **Gemini en Vertex:** `gemini-2.5-flash` da 404 en este proyecto (aparece en la lista pero sin acceso). Probar modelos de la familia 3 en la región `global`.
- **El panel de navegador de la app se oculta** si el usuario cambia de vista: las capturas salen viejas y los clics fallan. Mirar `document.visibilityState` y pedirle que lo muestre. Su selector de archivos no sirve: subir documentos desde un Chrome común.
- **Reglas de trato:** el usuario prefiere **español simple y corto**, una pregunta por vez, y que las contraseñas, el CUIT/DNI y las tarjetas los escriba él.
