# Roadmap — Página Hoy

Plan de trabajo para construir la página **Hoy** (agenda, pesadas, pedidos para armar y deudores). Cada fase es **entregable por sí sola** y no deja la app rota a mitad de camino.

> **Documento de diseño:** [README-PAGINA-HOY.md](README-PAGINA-HOY.md). Acá solo se ordena el trabajo; el detalle de cada cosa está allá, en la sección que se indica en cada fase.
> **Detalle de la carga de cortes:** [README-PESADAS-CARGA-RAPIDA.md](README-PESADAS-CARGA-RAPIDA.md).

**Estado al 13/10/2026** (rama `feat/pagina-hoy-cuaderno-pesadas`, solo commits locales, sin push ni PR):

| Leyenda | Significado |
|---|---|
| ✅ | Hecho y compilando |
| 🟡 | Hecho a medias o por probar |
| ⬜ | Sin empezar |
| ⏸ | En pausa: falta una definición |

> **Todo lo ✅ y 🟡 está escrito y compila, pero todavía no se probó con datos reales** (la app pide login y no se probó en pantalla). Ver [Pendiente de verificar](#pendiente-de-verificar).

| Sección del diseño | Qué aporta |
|---|---|
| [1. El problema](README-PAGINA-HOY.md#1-el-problema) y [2. Qué queremos](README-PAGINA-HOY.md#2-qué-queremos) | Por qué existe y qué reemplaza (el papel de la balanza) |
| [3. Flujo](README-PAGINA-HOY.md#3-flujo) | Camión → pesadas → remito → Mercadería / descartar |
| [4. Varias pesadas a la vez](README-PAGINA-HOY.md#4-varias-pesadas-a-la-vez) | Tarjetas independientes, una activa |
| [5. Pantalla](README-PAGINA-HOY.md#5-pantalla-idea) | Carga rápida, verificación con remito y estados |
| [6. Pasar a Mercadería](README-PAGINA-HOY.md#6-pasar-a-mercadería) | Ingreso opcional y reglas |
| [7. Modelo de datos](README-PAGINA-HOY.md#7-modelo-de-datos) | Pesadas, tareas y pedidos |
| [8. Dónde vive en la app](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) | Página `/hoy`, entrada desde Inicio y los cuatro bloques |
| [10. Preguntas abiertas](README-PAGINA-HOY.md#10-preguntas-abiertas) | Lo que falta definir |

---

## Principios del plan

1. **Nada se rompe en el camino.** Mercadería sigue funcionando igual; Hoy se suma al lado y solo le entrega datos cuando se pide.
2. **Primero lo que reemplaza el papel de la balanza**, después lo demás.
3. **Un cambio de datos por vez.** Pesadas, tareas y pedidos son colecciones separadas, no se mezclan.
4. **Lo que no está definido no se construye.** Deudores y Twilio esperan a que se cierren sus preguntas abiertas.
5. **Diseño visual según [README-NEWLOOK.md](README-NEWLOOK.md)** y mismo manejo de teclado que Mercadería ([README-NAVEGACION-TECLADO-MERCADERIA.md](README-NAVEGACION-TECLADO-MERCADERIA.md)).

---

## Vista general

```
✅ Fase 0  Decisiones previas y esqueleto            ▪ (chica)
✅ Fase 1  Página Hoy + carga y suma de pesadas      ▪▪▪ (grande)
✅ Fase 2  Verificación con remito                   ▪▪ (media)
✅ Fase 3  Ingresar a Mercadería / Descartar         ▪▪ (media)
✅ Fase 4  Agenda con hora                           ▪▪ (media)
✅ Fase 5  Alarmas                                   ▪▪ (media)   con la página abierta
✅ Fase 6  Pedidos para armar (a mano)               ▪▪▪ (grande) renglones de texto libre
⏸ Fase 7  Deudores                                  ▪▪▪ (grande, por definir)
⏸ Fase 8  Pedidos por WhatsApp (Twilio)             ▪▪▪ (grande, backend)
🟡 Fase 9  Extras                                    ▪ (suelta)
```

En pantalla, las zonas que todavía no existen (**Deudores** y **Caja**) figuran como **zonas reservadas** con recuadro punteado, para ver el lugar que ocuparán.

Dependencias:

```
F0 ─▶ F1 ─▶ F2 ─▶ F3
       └──▶ F4 ─▶ F5
       └──▶ F6 ─▶ F8
       └──▶ F7   (necesita definición previa)
F9 al final, suelta
```

Las fases 2–3, 4–5 y 6 dependen solo de la 1, así que se pueden reordenar según lo que más urgencia tenga.

---

## Fase 0 — Decisiones previas y esqueleto  ✅

**Objetivo:** dejar cerradas las dudas que condicionan el modelo de datos y armar la página vacía.

- Responder las preguntas de pesadas: ¿por pieza o solo kg?, ¿hay tara?, ¿el remito trae detalle por corte?, ¿se usa en celular? Ver [10. Preguntas abiertas](README-PAGINA-HOY.md#10-preguntas-abiertas).
- Si no se responden, **arrancar con kg por corte** como supuesto y ajustar después.
- Crear la ruta `/hoy` y la tarjeta en Inicio: ver [8. Cómo se entra](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día).
- Página vacía con encabezado de fecha.

**Listo cuando:** desde Inicio se entra a Hoy y se ve la fecha.

**Estado:** ✅ ruta `/hoy` y tarjeta **Hoy** como primera de Inicio. Las preguntas de pesadas siguen sin responder; se avanzó con el supuesto de solo kg, sin tara ni piezas.

---

## Fase 1 — Página Hoy + carga y suma de pesadas  ✅

**Objetivo:** reemplazar el papel de la balanza. Es el núcleo; el resto se apoya acá.

Leer: [3. Flujo](README-PAGINA-HOY.md#3-flujo), [4. Varias pesadas a la vez](README-PAGINA-HOY.md#4-varias-pesadas-a-la-vez), [5. Pantalla — Carga rápida](README-PAGINA-HOY.md#5-pantalla-idea) y [7. Modelo de datos](README-PAGINA-HOY.md#7-modelo-de-datos).

- Navegación por fecha (anterior / siguiente / elegir día).
- Crear pesada (proveedor, día, remito opcional).
- Varias pesadas abiertas, una activa.
- Carga rápida: corte + kg + Enter, deshacer última, borrar una puntual. **Dos campos chicos en la misma fila (Corte | Kg) con reconocimiento automático del corte**, ver [README-PESADAS-CARGA-RAPIDA.md](README-PESADAS-CARGA-RAPIDA.md).
- Totales por corte y general, calculados (no guardados).
- Guardado en una **colección propia `pesadas`** (un documento por camión, filtrado por `fecha`), con `usePesadas` en `src/hooks/usePesadas.js`. Cada kg se agrega con `arrayUnion`, así dos personas pesando a la vez no se pisan.

**Listo cuando:** se puede pesar un camión entero sin papel y los totales coinciden con la suma a mano.

**Estado:** ✅ implementado. Incluye además, sin estar en el plan original:

- Reparto de espacios fijo (columna principal + barra lateral de 300 px) y zonas reservadas.
- Tarjetas colapsadas en columnas; la activa se parte en carga (380 px) y detalle.
- **Minimizado automático** al sacar el mouse (0,5 s), salvo que haya algo sin guardar, un corte resolviéndose o un modal abierto; con animación suave y respeto de "reducir movimiento".
- Eliminar solo pesadas **sin kg** (creadas por error); el descartar con historial queda para la Fase 3.

---

## Fase 2 — Verificación con remito  ✅

Leer: [5. Pantalla — Verificación con remito y Estados](README-PAGINA-HOY.md#5-pantalla-idea).

- Columna Remito editable por corte (o solo total).
- Diferencia en kg y color (coincide / sobra / falta).
- Estado `cerrada` con diferencias anotadas.

**Listo cuando:** se cierra una pesada y se ve de un vistazo qué no coincide con el remito.

**Estado:** ✅ implementado en `src/components/hoy/TotalesRemito.jsx`. Como la pregunta *"¿el remito trae detalle por corte o solo un total?"* sigue sin responder, soporta **las dos cosas**:

- Botón **Verificar con remito** en los totales: aparecen las columnas *Remito* y *Dif.*
- Se carga el remito por corte, solo el total general, o ambos (si no hay total, se suma el de los cortes).
- Diferencia en kg con color: ✔ coincide (tolerancia 0,05 kg), sobra (naranja), falta (rojo).
- Cortes que figuran en el remito y no se pesaron: se agregan abajo y quedan marcados *(no pesado)*.
- **Cerrar pesada** (estado `cerrada`): bloquea la carga pero deja editar el remito; se puede **reabrir**.

*Limitación conocida:* el remito por corte se asocia al nombre del corte. Si un texto sin validar se resuelve después a otro nombre, su remito queda como *(no pesado)* y hay que volver a cargarlo.

---

## Fase 3 — Ingresar a Mercadería / Descartar  ✅

Leer: [6. Pasar a Mercadería](README-PAGINA-HOY.md#6-pasar-a-mercadería) y [8. Pesadas del día](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día).

- Botón **Ingresar a Mercadería**: antes valida los cortes escritos que no se reconocieron (paso "Revisar cortes", ver [README-PESADAS-CARGA-RAPIDA.md](README-PESADAS-CARGA-RAPIDA.md#6-validación-al-ingresar-a-mercadería)); después arma la entrada con los kg pesados y pasa por el flujo actual (control de precios, aviso de cortes sin precio).
- Estado `ingresada` con vínculo a la entrada; no se puede ingresar dos veces.
- Si se elimina la entrada, la pesada vuelve a poder ingresarse.
- Botón **Descartar**: estado `descartada`, sale de la vista y queda en historial.

**Listo cuando:** una pesada cerrada llega a Mercadería sin volver a escribir nada, y una descartada se puede recuperar.

**Estado:** 🟡 parcial.

| Punto | Estado |
|---|---|
| Botón **Ingresar a Mercadería** | ✅ Crea la entrada en la semana activa con los kg pesados. |
| Paso **Revisar cortes** (buscador, filtro por categoría, crear corte, recordar alias) | ✅ |
| Precios $/kg opcionales y aviso de precio atípico | ✅ En el mismo modal; sin precio queda en 0 y se completa en Mercadería. |
| Estado `ingresada` con vínculo y sin doble ingreso | ✅ Guarda `mercaderiaId` y bloquea la edición. |
| Aviso **"nunca entró de este proveedor"** | ✅ No bloquea. |
| **Pista** de qué corte podría ser, según los habituales del proveedor | ✅ Sutil, en el aviso y en el buscador. |
| Si se elimina la entrada, la pesada vuelve a poder ingresarse | ✅ Se detecta sola si la entrada era de la semana activa; si no, hay un enlace discreto para habilitarla a mano. |
| Botón **Descartar** con historial y recuperar | ✅ Estado `descartada`: sale de la vista y queda en *Descartadas (n)* con **Recuperar**. |
| Pasar por el control de precios *exacto* de Mercadería | 🟡 Se replica el aviso de atípicos en el modal, pero no se reutiliza ese flujo. |

---

## Fase 4 — Agenda con hora  ✅

Leer: [8. Agenda (hoja del día)](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [7. Tareas de la agenda](README-PAGINA-HOY.md#7-modelo-de-datos).

- Renglones por fecha: escribir, tildar, borrar, Enter agrega otro.
- Hora opcional, con atajo al escribir (`10 vtv camioneta`).
- Orden por hora, y "sin hora" debajo.
- Pendientes de días pasados resaltados.
- Contacto asociado, opcional.
- Colección propia, guardada **por fecha** (no por semana).

**Listo cuando:** se anota "10:00 sacar VTV camioneta" y aparece ordenado en su día.

**Estado:** ✅ implementado (`AgendaBloque.jsx`, `useAgenda.js`, `utils/agenda.js`), colección `agenda` guardada por fecha.

- La hora se escribe al principio: `10 sacar vtv`, `10:30 llamar a Sur`, `9hs retirar cheques` o `... a las 10`.
- Un número suelto cuenta como hora solo entre las 6 y las 22, para no confundir cantidades (`2 lomos para Juan`).
- Debajo del campo se ve cómo se interpretó antes de guardar.
- **Quedaron de días anteriores**: pendientes sin tildar de fechas pasadas, con *pasar a hoy*.
- *No hecho:* contacto asociado a la tarea (el campo `contactoId` ya existe en el documento).

---

## Fase 5 — Alarmas  ✅

Leer: [8. Agenda — Alarma a la hora](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [10. Preguntas abiertas — Agenda](README-PAGINA-HOY.md#10-preguntas-abiertas).

- Campana por renglón (prendida por defecto en los que tienen hora).
- Aviso con sonido y mensaje visible a la hora.
- **Primera versión: solo con la página abierta.** Notificaciones con la app cerrada (push) requieren definirse aparte.

**Listo cuando:** a las 10:00 suena y se ve el aviso de la VTV con la página abierta.

**Estado:** ✅ implementado (`AlarmasAgenda.jsx`), con la página Hoy abierta.

- Revisa cada 15 s las tareas de **hoy** con campana, aunque se esté mirando otro día.
- Aviso en pantalla con sonido, y notificación del sistema si el navegador dio permiso (se pide al activar una campana).
- Acciones: **Listo**, **Posponer 10 min** o **Cerrar**.
- Si la página se abre después de la hora, avisa igual indicando *ya pasó la hora*.
- Cada aviso se registra (`avisadaAt`) para no repetirse al recargar ni en otro dispositivo.
- *Límite:* no suena con la app cerrada; eso requiere notificaciones push y backend.

---

## Fase 6 — Pedidos para armar (a mano)  ✅

Leer: [8. Pedidos para armar](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [7. Pedidos para armar (modelo)](README-PAGINA-HOY.md#7-modelo-de-datos).

- Lista de pedidos por fecha: cliente, qué lleva, estado.
- Estados `pendiente` → `armado` → `entregado`.
- Campo `origen: 'manual'` desde el inicio, para que Twilio se sume sin migrar.

**Pendiente de documentar** (salió del cuaderno, todavía no está en el diseño): pedidos como **bloques por nombre en columnas**, **siglas** como atajo de escritura, **tachar con un toque** y un bloque de **caja** (fondo y vueltos). Ver las preguntas que quedaron abiertas sobre nombres, siglas, fondo y vueltos; se escriben en el diseño cuando se contesten.

**Listo cuando:** se arma la lista de pedidos del día a mano y se va tildando lo armado.

**Estado:** ✅ implementado (`PedidosBloque.jsx`, `usePedidos.js`), colección `pedidos` guardada por fecha.

- **Bloques por nombre en columnas**, como el cuaderno; el nombre es texto libre (cliente, zona…) y se vincula al contacto si coincide exacto.
- **Renglones de texto libre** (`12 b pata`, `2 M`): como las siglas todavía no están definidas, no se interpretan.
- **Tachar con un toque**; al tachar todos, el pedido pasa a `armado` solo. Luego *Marcar entregado*.
- `entregado` se pliega en *Entregados (n)* y se puede reabrir.
- `origen: 'manual'` ya guardado; las filas por WhatsApp mostrarán 💬 cuando exista la Fase 8.
- *Sigue pendiente:* diccionario de siglas, bloque de **Caja** (fondo y vueltos) y descontar de lo pesado.

---

## Fase 7 — Deudores  🟡

**Antes de empezar:** cerrar el detalle. Leer [8. Deudores](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [10. Preguntas abiertas — Deudores](README-PAGINA-HOY.md#10-preguntas-abiertas).

- Cuadro unificado con tres orígenes: a mano, Mi Reparto (no pagaron) y Saldo.
- Cada deudor indica de dónde viene; un mismo contacto se muestra una sola vez.
- Atajo a la agenda: tocar un deudor crea el renglón "cobrar a …".
- A definir: qué pasa al cobrar, si lo anotado a mano es deuda real o recordatorio, y deudas con fecha prometida ("mañana").

**Listo cuando:** el cuadro muestra los tres orígenes sin duplicados y cobrar actualiza el origen correcto.

**Estado:** 🟡 primera versión de solo lectura (`DeudoresBloque.jsx`, `useDeudores.js`, `utils/deudores.js`), sin probar con datos reales.

- **A mano** sale de Gestión de Deudas (`deudaPersonas` + movimientos), **Reparto** de lo que falta cobrar en los repartos, **Saldo** del último saldo de cada cliente si es a favor del negocio (> 0).
- Un contacto se une por nombre/alias exacto y se muestra una vez, con el desglose al tocarlo.
- *Cobrar* no se hace desde acá: se cobra en el origen y el cuadro se actualiza solo. El botón **cobrar** solo agrega «cobrar a …» a la agenda de hoy.
- *Supuestos a confirmar:* que `finalBalance > 0` en Saldo es plata que nos deben, y que los repartos viejos sin cobrar siguen contando.

---

## Fase 8 — Pedidos por WhatsApp (Twilio)  ⏸

**Antes de empezar:** responder las preguntas de Twilio de [10. Preguntas abiertas — Pedidos para armar](README-PAGINA-HOY.md#10-preguntas-abiertas) (formato del mensaje, interpretación, cuenta/número).

- Backend nuevo: Cloud Function que recibe el webhook de Twilio.
- Los mensajes entran como pedidos `pendiente` con `origen: 'whatsapp'`, para revisar antes de armar.
- Marca visible (💬) en la lista.

**Listo cuando:** un mensaje de WhatsApp aparece como pedido pendiente en el día correspondiente.

---

## Fase 9 — Extras  🟡

Sueltos, sin orden fijo. Ver [9. Fases sugeridas](README-PAGINA-HOY.md#9-fases-sugeridas).

- Imprimir la hoja de pesada.
- Historial de pesadas por proveedor.
- Tara / bruto / neto, si resulta necesario.
- Tareas repetidas (VTV cada año, pagos mensuales).
- Resumen en la tarjeta de Inicio (pesadas abiertas, pedidos pendientes, total a cobrar) y opción de abrir directo en Hoy.
- Atajo de Tab para pasar de corte a kg (hoy es Enter).
- Resumen de habituales por proveedor precalculado en un documento (ver [Costo de lecturas](#costo-de-lecturas)).

---

## Costo de lecturas

Se redujeron las lecturas a Firestore como parte de este trabajo:

| Cambio | Archivo | Efecto |
|---|---|---|
| Historial de precios y cortes habituales: solo las **últimas 12 semanas** (`SEMANAS_HISTORIAL`) | `src/hooks/usePreciosReferencia.js` | Deja de leer toda la colección; no crece con los meses. |
| Semana abierta: `where('cerrada','==',false)` en lugar de bajar todo y filtrar | `src/firebase/hooks.js` (`useGestionSemanal`) | Al abrir la app lee 1 o 2 documentos en vez de todo el historial. |

**Posibles mejoras futuras** (no necesarias hoy):

- Documento resumen `estadisticas/proveedorCortes` con contadores por proveedor y corte, actualizado al ingresar (1 lectura, no crece nunca).
- `getHistorialSemanas` (Balance) todavía lee toda la colección, pero solo al entrar a esa pantalla; se puede filtrar por `cerrada == true`.

---

## Pendiente de verificar

Nada de esto se probó en pantalla ni con datos reales. Antes de seguir conviene hacer esta ronda (`npm run dev`, entrar a `/hoy`):

1. **Crear una pesada** con un proveedor existente y con uno nuevo.
2. **Cargar kg** con corte conocido, con corte parcial (`bondi`), con error de tipeo y con un nombre inventado.
3. **Totales y ⚠:** que los totales coincidan con la suma a mano y que los sin validar se agrupen bien.
4. **Resolver un ⚠** desde la tarjeta y desde el paso de ingreso; que el alias quede guardado y la próxima carga entre sola.
5. **Ingresar a Mercadería:** que la entrada aparezca en la semana activa, con el día correcto, y que la pesada quede `ingresada`.
6. **Avisos:** un corte que nunca entró del proveedor y la primera compra de un proveedor.
7. **Semana abierta y precios:** que Mercadería, Gestión Semanal y Balance sigan mostrando la semana en curso tras el cambio de consulta.
8. **Celular:** carga con teclado táctil y que los anchos no se rompan.
9. **Minimizado automático:** que no se cierre mientras se escribe y que la animación se vea bien.
10. **Remito:** cargar total y por corte, ver la diferencia, cerrar y reabrir la pesada.
11. **Descartar y recuperar** una pesada; ingresar una, borrar la entrada en Mercadería y habilitarla de nuevo.
12. **Agenda:** `10 sacar vtv` queda a las 10:00 con campana; `2 lomos para Juan` queda sin hora; pasar a hoy un pendiente de ayer.
13. **Alarma:** poner una tarea 1 minuto adelante, esperar el aviso y probar *Posponer*; recargar y confirmar que no vuelve a sonar.
14. **Pedidos:** crear un bloque, cargar renglones, tacharlos hasta que pase a `armado`, marcar entregado y reabrirlo.

---

## Dudas todavía abiertas

Resumen; el detalle está en [10. Preguntas abiertas](README-PAGINA-HOY.md#10-preguntas-abiertas) y en [README-PESADAS-CARGA-RAPIDA.md](README-PESADAS-CARGA-RAPIDA.md#13-preguntas-abiertas).

- **Pesadas:** ¿por pieza o solo kg?, ¿hay tara?, ¿el remito trae detalle por corte? (condiciona la Fase 2).
- **Cuaderno:** qué son los nombres de los bloques (¿clientes o zonas?), qué significan las siglas (B, M, C, 1-), qué es el "Fondo" y qué son los vueltos. Condiciona la Fase 6 y el bloque de Caja.
- **Deudores:** qué pasa al cobrar y cómo se unifican los tres orígenes. Condiciona la Fase 7.
- **Agenda:** si la alarma debe sonar con la app cerrada (push). Condiciona la Fase 5.
- **Twilio:** formato de los mensajes y si ya hay cuenta o número. Condiciona la Fase 8.

---

## Qué se puede hacer en paralelo

- Fases 2–3 (pesadas) y 4–5 (agenda) no dependen entre sí.
- Lo que requiere decisiones del dueño del negocio (Fase 7 y 8) puede definirse mientras se construyen las anteriores.

---

## Próximo paso sugerido

1. **Probar todo lo hecho** (ronda de [Pendiente de verificar](#pendiente-de-verificar)) y corregir lo que aparezca. Es lo que más importa ahora: las fases 1 a 6 compilan pero ninguna se vio funcionando con datos reales.
2. **Cerrar las dudas** de deudores y del cuaderno (siglas, fondo, vueltos) para poder encarar la Fase 7 y el bloque de Caja.
3. **Fase 8 (Twilio)** solo después de definir el formato de los mensajes y tener cuenta; requiere backend.
