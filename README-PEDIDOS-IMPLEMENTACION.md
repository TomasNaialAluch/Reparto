# Pedidos por WhatsApp — Plan de implementación

**Estado:** plan. Se implementa recién cuando se aprueban este documento y [README-PEDIDOS-WHATSAPP.md](README-PEDIDOS-WHATSAPP.md) (requisitos y diseño). Si algo de acá contradice al de diseño, manda el de diseño.

**Regla de trabajo:** cada fase termina con algo que **se puede ver y probar**, pasa lint y build, y se confirma en su propio commit. No se avanza de fase con la anterior a medias.

---

## 1. Punto de partida

Ya hay dos commits en la rama `feat/pagina-hoy-cuaderno-pesadas`:

- `0b164af` — primera estructura de Pedidos.
- `e9ae584` — alta de clientes desde Pedidos con el modal compartido.

Qué se conserva y qué se rehace:

| Pieza actual | Qué hacer |
|---|---|
| `src/components/ContactoFormModal.jsx` | **Se conserva tal cual.** Ya cumple el NEWLOOK. |
| `src/utils/whatsapp.js` (teléfono, días, variables, renglones) | **Se conserva** y se amplía. |
| `src/hooks/usePedidos.js` (origen y renglones en `crearPedido`) | **Se conserva.** Se suma `mensajeId`. |
| `src/hooks/usePedidosProgramacion.js` | **Se ajusta**: pasa de "un horario por cliente" a la lista `envios[]`. |
| `src/hooks/usePedidosMensajes.js` | **Se amplía**: tipos, interpretación, vínculo a envío. |
| `src/hooks/usePedidosConfig.js` | **Se amplía**: horario de silencio y contadores. |
| `src/pages/Pedidos.jsx` y `src/components/pedidos/*` | **Se rehacen** con el diseño NEWLOOK (ver README de diseño, sección 6). La primera versión era demasiado básica. |
| Colecciones `pedidos_*` en Firestore | Todavía sin datos reales, así que el cambio de forma de `pedidos_programacion` **no necesita migración**. Antes de empezar se confirma que estén vacías. |

---

## 2. Fases

**Avance:**

| Fase | Estado |
|---|---|
| 0 — Preparación | Hecha: íconos nuevos, `Pedidos.css`, `pedidosEstados.js`, `ui.jsx`. Falta confirmar que las colecciones estén vacías. |
| 1 — Datos y utilidades | Pendiente (`envios[]`, plantillas, interpretación de respuestas). |
| 2 — Shell NEWLOOK | Hecha: encabezado, pestañas de escritorio, menú lateral de celular. Verificada renderizada en escritorio y a 375 px. |
| 3 — Programación | Pendiente. La pestaña actual es la primera versión, dentro del shell nuevo. |
| 4 — Hoy | Hecha en lo visual con los datos actuales. Sin acciones de envío hasta el backend. No se vio con envíos reales porque todavía no hay clientes programados. |
| 5 a 9 | Pendientes. Respuestas y Conexión siguen en su primera versión. |

### Fase 0 — Preparación (sin tocar pantallas)

- Confirmar que `pedidos_programacion`, `pedidos_mensajes` y `pedidos_config` están vacías en Firestore.
- Agregar los íconos nuevos a `src/components/gestionSemanal/icons.jsx`: `IconChat`, `IconClock`, `IconSend` (y `IconPause` si hace falta).
- Documentarlos en README-NEWLOOK.md (lista de íconos de la sección 10).
- Crear `src/pages/Pedidos.css` con la clase `.pedidos-page` (inputs con borde `#ccd3d9` y foco acero, igual que `.reparto-page`).

**Listo cuando:** los íconos se ven y el lint está limpio.

### Fase 1 — Datos y utilidades

Archivos:

- `src/utils/whatsapp.js` — se agregan: `normalizarTelefono` (ya está), `resolverVariables(plantilla, cliente, valores)`, `proximosEnvios(programaciones, desde, dias)`, `estaEnVentana(ultimoEntrante, ahora)` (24 hs), `fechaSalteada(prog, fecha)`, `enSilencio(hora, horario)`.
- `src/utils/pedidosEstados.js` (nuevo) — tabla única de estados: texto, color de acento, fondo del pill, color del texto. Es lo que usan **todas** las pantallas para que el estado se vea igual en todos lados (diseño, sección 6.3).
- `src/utils/interpretarRespuesta.js` (nuevo) — convierte un texto en renglones usando `interpretarLinea` y `separarTextoYKg` de `src/utils/cortes.js`, y devuelve cada renglón con su "seguridad". Detecta: "hoy no", "baja", audio/imagen.
- `src/hooks/usePedidosProgramacion.js` — `envios[]`, consentimiento, pausas, saltear. Operaciones: `guardar`, `quitar`, `aplicarAVarios`.
- `src/hooks/usePedidosPlantillas.js` (nuevo) — CRUD de plantillas.
- `src/hooks/usePedidosEnvios.js` (nuevo) — lee los envíos del día (para "Hoy") y escribe solo las acciones manuales (saltear, marcar para reenviar).
- Ajustes en `usePedidosMensajes.js` y `usePedidosConfig.js`.

Pruebas de esta fase (script de Node sin Firebase, como se hizo con los teléfonos):
- Teléfonos: casos con y sin 15, con y sin código de país, inválidos.
- `interpretarRespuesta`: "5 kg lomo", "lomo 5", "3,5 bondiola", "hoy no", "BAJA", texto vacío, renglones mezclados.
- `proximosEnvios` con saltear y pausa.
- `estaEnVentana` en los bordes (23 h 59, 24 h 01).

**Listo cuando:** las pruebas pasan y los hooks compilan.

### Fase 2 — Shell de la página y pestañas (NEWLOOK)

Archivos:

- `src/pages/Pedidos.jsx` — encabezado (label + título + botón Nuevo cliente) y el bloque gris unificado.
- `src/components/pedidos/PedidosTabs.jsx` — **solo escritorio (≥ 992 px)**: pestañas con ícono SVG, `motion.div` con `layoutId="pedidos-tab-indicator"`, contenido con slide según dirección (`AnimatePresence mode="wait"` con `custom`), contador en Respuestas.
- `src/components/pedidos/PedidosMenuLateral.jsx` — **solo celular (< 992 px)**: botón hamburguesa y panel lateral con overlay y blur, secciones con contador, estado de conexión y "Nuevo cliente". Cierra al elegir sección, al tocar fuera y con el botón de cierre.
- `src/components/pedidos/PedidosEncabezado.jsx` — línea chica + título grande (como Hoy), status indicator de conexión en escritorio, y en celular la hamburguesa y el botón circular de alta.
- `src/components/pedidos/ui.jsx` — piezas compartidas, todas con el estilo NEWLOOK: `FormSection`, `ToggleRow`, `AddBtn`, `RemoveBtn`, `EstadoDot` (punto con halo), `Pill`, `GhostBtn`, `PrimaryBtn` (con deshabilitado manual), `CajaGris`, `Eyebrow`, `VacioEstado`.
- `src/components/pedidos/estilos.js` — se reemplaza por tokens alineados al NEWLOOK (bordes `#d3d9de`, divisores `#dde2e6`, muted `#6c757d`).
- Ruta `/pedidos` y entrada del menú (ya existen).

**Listo cuando:** se ve el shell con las cinco pestañas, el indicador desliza, el contenido entra con la dirección correcta y en celular se ve bien. Las pestañas pueden estar vacías todavía.

### Fase 3 — Programación

Archivos: `src/components/pedidos/programacion/` — `ProgramacionTab.jsx`, `ClienteCard.jsx`, `EnvioEditor.jsx`, `DiasSelector.jsx`, `VistaPreviaMensaje.jsx`, `BarraSeleccion.jsx`, `AplicarAVariosModal.jsx`.

Qué incluye (diseño 6.5): buscador y filtro con segmented control, card plana con acento y chevron que rota, expansión con `max-height`, WhatsApp con validación, consentimiento, lista de envíos con `AddBtn`/`RemoveBtn`, días en píldoras, hora, plantilla, variables, vista previa, pausas y saltear, selección múltiple con barra flotante.

**Listo cuando:** se puede configurar un cliente completo, con dos envíos, y recargando la página queda igual. El alta de cliente desde el botón superior abre su ficha para configurarla.

### Fase 4 — Hoy

Archivos: `src/components/pedidos/hoy/` — `HoyTab.jsx`, `EnvioCard.jsx`, `ResumenDia.jsx`, `ProximosDias.jsx`.

- Lista del día generada desde las programaciones (sin backend todavía: estado "programado").
- Acciones ghost: Saltear hoy, Enviar ahora y Reenviar (quedan deshabilitadas con explicación hasta la Fase 8).
- Resumen del día y próximos 7 días en columna derecha.

**Listo cuando:** la lista del día coincide con lo configurado, respetando saltear y pausas, y los estados se ven con el sistema de colores único.

### Fase 5 — Respuestas

Archivos: `src/components/pedidos/respuestas/` — `RespuestasTab.jsx`, `ListaConversaciones.jsx`, `DetalleConversacion.jsx`, `RenglonInterpretado.jsx`, `HiloMensajes.jsx`, `SimularRespuestaModal.jsx`.

- Dos paneles en escritorio, una pantalla a la vez en celular.
- Interpretación con `interpretarRespuesta`, edición en línea y pills de seguridad.
- Acciones: **Pasar a pedido de hoy** (crea el pedido o suma renglones al existente), **Sin pedido**, **Descartar**, **Asignar cliente** (para números sin identificar).
- "Simular respuesta" en un modal, visible solo en modo prueba.
- En la página Hoy, los pedidos de WhatsApp se marcan con `IconChat`.

**Listo cuando:** una respuesta simulada recorre todo el camino hasta aparecer como pedido pendiente en Hoy, y una segunda del mismo cliente suma renglones al mismo pedido.

### Fase 6 — Plantillas y Conexión

Archivos: `src/components/pedidos/plantillas/` (`PlantillasTab.jsx`, `PlantillaCard.jsx`, `PlantillaModal.jsx`) y `src/components/pedidos/conexion/` (`ConexionTab.jsx`, `EstadoConexion.jsx`, `ChecklistTramite.jsx`, `ProbarConexion.jsx`, `UsoDelMes.jsx`).

- Plantillas con estado de aprobación, variables insertables y "Redactar con el Asistente" (se agrega `redactarPlantilla` a `src/config/gemini.js`).
- Conexión con status indicator, proveedor, checklist con barra de avance, prueba y uso del mes (la prueba y el uso quedan inactivos hasta la Fase 8).

**Listo cuando:** se puede armar una plantilla y asociarla a un envío, y el checklist guarda su avance.

### Fase 7 — Documentación y cierre de la parte de pantalla

- Actualizar README-NEWLOOK.md con la sección "Pedidos" (patrones nuevos usados) y los íconos.
- Actualizar README-ROADMAP-HOY.md (la Fase 8 pasa a apuntar a estos documentos).
- Revisión completa contra el NEWLOOK: contraste, emojis, sombras, curvas de animación.

**Listo cuando:** la parte de la app está completa y probada con datos de prueba. **Hasta acá no hace falta ningún trámite con WhatsApp.**

### Fase 8 — Backend (Cloud Functions)

Requisitos previos (los hace el usuario): plan Blaze en Firebase, cuenta de Twilio y sandbox (después número dedicado y plantilla aprobada), y las claves cargadas como secretos.

Estructura nueva en el proyecto:

```
functions/
  package.json
  index.js                       # exporta las funciones
  src/
    proveedor/
      index.js                   # interfaz común: enviarPlantilla, enviarTexto, verificarFirma
      twilio.js
      meta.js                    # se completa si se cambia de proveedor
    programador.js               # corre cada minuto
    webhookEntrante.js           # recibe mensajes del proveedor
    webhookEstado.js             # entregado / leído / falló
    interpretar.js               # reglas de cortes + Gemini
```

Cambios en `firebase.json`: sección `functions` y, si se quiere el webhook bajo el mismo dominio, un `rewrite` de `/api/**` a la función.

Funciones:

- **`programador`** (programada, cada minuto, hora de Argentina): busca envíos que vencen, crea `pedidos_envios/{clienteId_fecha_envioId}` con una **transacción que falla si ya existe** (así no duplica), respeta saltear, pausas, consentimiento, silencio y plantilla aprobada, manda por la capa de proveedor y guarda el mensaje saliente.
- **`webhookEntrante`**: verifica la firma, identifica al cliente por teléfono, guarda el mensaje, detecta "BAJA", interpreta con reglas y deja la propuesta lista para la bandeja. Responde rápido al proveedor y hace lo pesado después.
- **`webhookEstado`**: actualiza `enviado/entregado/leido/fallido`.
- **`enviarAhora`** (invocable): para el botón "Enviar ahora", "Reenviar" y "Enviar prueba".
- Reglas de Firestore: `pedidos_envios` y los mensajes entrantes solo los escribe el backend; la app puede leerlos.

Pruebas con el **sandbox de Twilio**: enviar, responder, "BAJA", mensaje sin identificar, audio, dos mensajes seguidos, reintento sin duplicar, y una caída del proveedor.

**Listo cuando:** un envío programado sale solo a la hora, y una respuesta real aparece en la bandeja y termina como pedido en Hoy.

### Fase 9 — Pase a producción

- Registrar el número dedicado, aprobar la plantilla y cambiar de sandbox al número real.
- Cargar clientes con su consentimiento confirmado, de a pocos al principio.
- Vigilar calidad, errores y gasto durante la primera semana.

---

## 3. Reglas de código

- **Estilo:** estilos en línea con los tokens del NEWLOOK y `.pedidos-page` para lo que no se pueda en línea (foco de inputs). Variables CSS ya definidas en `src/index.css`. Nada de colores nuevos sin documentarlos.
- **Tamaño:** ningún componente pasa de ~250 líneas; si crece, se parte. Sin la lógica de datos mezclada: eso va en hooks y utilidades.
- **Sin emojis** en la interfaz; íconos SVG de `icons.jsx`.
- **Estados** siempre desde `pedidosEstados.js`, nunca colores sueltos por pantalla.
- **Backend:** ninguna clave en el código ni en Firestore; todo en secretos. Los registros del servidor no llevan números de teléfono completos.
- **Idempotencia** en todo lo que envía o crea.
- Comentarios del mismo tono que el resto del proyecto (en español, breves, dicen el porqué).

## 4. Verificación

En cada fase:

1. `npx eslint` sobre lo tocado (se anota aparte lo que ya fallaba antes).
2. `npx vite build` compila.
3. Pruebas de Node para utilidades (fases 1 y 8).
4. **Prueba manual con sesión iniciada**: la app pide login, así que esta parte la hace el usuario con una lista corta de pasos que se entrega al cierre de cada fase.
5. **Revisión visual con la página renderizada**, en escritorio y a 375 px de ancho, comparada lado a lado con Hoy y Transferencias. Se guardan las capturas y se miran antes de dar la fase por cerrada. No alcanza con que compile.

## 5. Commits

Un commit por fase, con el formato del repositorio (`feat(pedidos): …`, `docs(pedidos): …`). La Fase 8 va en uno o dos commits propios, y nunca mezclada con cambios de pantalla.

## 6. Riesgos

| Riesgo | Cómo se maneja |
|---|---|
| Meta rechaza la plantilla | Preparar dos variantes simples; mientras tanto, el sandbox. |
| Un cliente marca spam | Consentimiento obligatorio, baja inmediata, horario razonable. |
| Envío duplicado | Identificador fijo del envío y transacción de creación. |
| Respuesta mal interpretada | Revisión humana siempre al principio; seguridad visible por renglón. |
| Número de teléfono mal cargado | Validación al guardar y aviso visible en cada cliente. |
| Se agota el límite de mensajes | Contador y tope visibles en Conexión. |
| Cambio de proveedor | Capa `proveedor/` aislada: cambiar es agregar un archivo. |
