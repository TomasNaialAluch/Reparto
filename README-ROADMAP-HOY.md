# Roadmap — Página Hoy

Plan de trabajo para construir la página **Hoy** (agenda, pesadas, pedidos para armar y deudores). Cada fase es **entregable por sí sola** y no deja la app rota a mitad de camino.

> **Documento de diseño:** [README-PAGINA-HOY.md](README-PAGINA-HOY.md). Acá solo se ordena el trabajo; el detalle de cada cosa está allá, en la sección que se indica en cada fase.

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
Fase 0  Decisiones previas y esqueleto            ▪ (chica)
Fase 1  Página Hoy + carga y suma de pesadas      ▪▪▪ (grande)
Fase 2  Verificación con remito                   ▪▪ (media)
Fase 3  Ingresar a Mercadería / Descartar         ▪▪ (media)
Fase 4  Agenda con hora                           ▪▪ (media)
Fase 5  Alarmas                                   ▪▪ (media)
Fase 6  Pedidos para armar (a mano)               ▪▪▪ (grande)
Fase 7  Deudores                                  ▪▪▪ (grande, por definir)
Fase 8  Pedidos por WhatsApp (Twilio)             ▪▪▪ (grande, backend)
Fase 9  Extras                                    ▪ (suelta)
```

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

## Fase 0 — Decisiones previas y esqueleto

**Objetivo:** dejar cerradas las dudas que condicionan el modelo de datos y armar la página vacía.

- Responder las preguntas de pesadas: ¿por pieza o solo kg?, ¿hay tara?, ¿el remito trae detalle por corte?, ¿se usa en celular? Ver [10. Preguntas abiertas](README-PAGINA-HOY.md#10-preguntas-abiertas).
- Si no se responden, **arrancar con kg por corte** como supuesto y ajustar después.
- Crear la ruta `/hoy` y la tarjeta en Inicio: ver [8. Cómo se entra](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día).
- Página vacía con encabezado de fecha.

**Listo cuando:** desde Inicio se entra a Hoy y se ve la fecha.

---

## Fase 1 — Página Hoy + carga y suma de pesadas

**Objetivo:** reemplazar el papel de la balanza. Es el núcleo; el resto se apoya acá.

Leer: [3. Flujo](README-PAGINA-HOY.md#3-flujo), [4. Varias pesadas a la vez](README-PAGINA-HOY.md#4-varias-pesadas-a-la-vez), [5. Pantalla — Carga rápida](README-PAGINA-HOY.md#5-pantalla-idea) y [7. Modelo de datos](README-PAGINA-HOY.md#7-modelo-de-datos).

- Navegación por fecha (anterior / siguiente / elegir día).
- Crear pesada (proveedor, día, remito opcional).
- Varias pesadas abiertas, una activa.
- Carga rápida: corte + kg + Enter, deshacer última, borrar una puntual. **Se resuelve con una línea de texto y reconocimiento automático**, ver [README-PESADAS-CARGA-RAPIDA.md](README-PESADAS-CARGA-RAPIDA.md) (reemplaza el selector con chips).
- Totales por corte y general, calculados (no guardados).
- Guardado en la semana activa, con `agregarPesada` / `actualizarPesada` / `eliminarPesada` en `src/firebase/hooks.js`.

**Listo cuando:** se puede pesar un camión entero sin papel y los totales coinciden con la suma a mano.

---

## Fase 2 — Verificación con remito

Leer: [5. Pantalla — Verificación con remito y Estados](README-PAGINA-HOY.md#5-pantalla-idea).

- Columna Remito editable por corte (o solo total).
- Diferencia en kg y color (coincide / sobra / falta).
- Estado `cerrada` con diferencias anotadas.

**Listo cuando:** se cierra una pesada y se ve de un vistazo qué no coincide con el remito.

---

## Fase 3 — Ingresar a Mercadería / Descartar

Leer: [6. Pasar a Mercadería](README-PAGINA-HOY.md#6-pasar-a-mercadería) y [8. Pesadas del día](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día).

- Botón **Ingresar a Mercadería**: antes valida los cortes escritos que no se reconocieron (paso "Revisar cortes", ver [README-PESADAS-CARGA-RAPIDA.md](README-PESADAS-CARGA-RAPIDA.md#6-validación-al-ingresar-a-mercadería)); después arma la entrada con los kg pesados y pasa por el flujo actual (control de precios, aviso de cortes sin precio).
- Estado `ingresada` con vínculo a la entrada; no se puede ingresar dos veces.
- Si se elimina la entrada, la pesada vuelve a poder ingresarse.
- Botón **Descartar**: estado `descartada`, sale de la vista y queda en historial.

**Listo cuando:** una pesada cerrada llega a Mercadería sin volver a escribir nada, y una descartada se puede recuperar.

---

## Fase 4 — Agenda con hora

Leer: [8. Agenda (hoja del día)](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [7. Tareas de la agenda](README-PAGINA-HOY.md#7-modelo-de-datos).

- Renglones por fecha: escribir, tildar, borrar, Enter agrega otro.
- Hora opcional, con atajo al escribir (`10 vtv camioneta`).
- Orden por hora, y "sin hora" debajo.
- Pendientes de días pasados resaltados.
- Contacto asociado, opcional.
- Colección propia, guardada **por fecha** (no por semana).

**Listo cuando:** se anota "10:00 sacar VTV camioneta" y aparece ordenado en su día.

---

## Fase 5 — Alarmas

Leer: [8. Agenda — Alarma a la hora](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [10. Preguntas abiertas — Agenda](README-PAGINA-HOY.md#10-preguntas-abiertas).

- Campana por renglón (prendida por defecto en los que tienen hora).
- Aviso con sonido y mensaje visible a la hora.
- **Primera versión: solo con la página abierta.** Notificaciones con la app cerrada (push) requieren definirse aparte.

**Listo cuando:** a las 10:00 suena y se ve el aviso de la VTV con la página abierta.

---

## Fase 6 — Pedidos para armar (a mano)

Leer: [8. Pedidos para armar](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [7. Pedidos para armar (modelo)](README-PAGINA-HOY.md#7-modelo-de-datos).

- Lista de pedidos por fecha: cliente, qué lleva, estado.
- Estados `pendiente` → `armado` → `entregado`.
- Campo `origen: 'manual'` desde el inicio, para que Twilio se sume sin migrar.

**Pendiente de documentar** (salió del cuaderno, todavía no está en el diseño): pedidos como **bloques por nombre en columnas**, **siglas** como atajo de escritura, **tachar con un toque** y un bloque de **caja** (fondo y vueltos). Ver las preguntas que quedaron abiertas sobre nombres, siglas, fondo y vueltos; se escriben en el diseño cuando se contesten.

**Listo cuando:** se arma la lista de pedidos del día a mano y se va tildando lo armado.

---

## Fase 7 — Deudores

**Antes de empezar:** cerrar el detalle. Leer [8. Deudores](README-PAGINA-HOY.md#8-dónde-vive-en-la-app-la-página-del-día) y [10. Preguntas abiertas — Deudores](README-PAGINA-HOY.md#10-preguntas-abiertas).

- Cuadro unificado con tres orígenes: a mano, Mi Reparto (no pagaron) y Saldo.
- Cada deudor indica de dónde viene; un mismo contacto se muestra una sola vez.
- Atajo a la agenda: tocar un deudor crea el renglón "cobrar a …".
- A definir: qué pasa al cobrar, si lo anotado a mano es deuda real o recordatorio, y deudas con fecha prometida ("mañana").

**Listo cuando:** el cuadro muestra los tres orígenes sin duplicados y cobrar actualiza el origen correcto.

---

## Fase 8 — Pedidos por WhatsApp (Twilio)

**Antes de empezar:** responder las preguntas de Twilio de [10. Preguntas abiertas — Pedidos para armar](README-PAGINA-HOY.md#10-preguntas-abiertas) (formato del mensaje, interpretación, cuenta/número).

- Backend nuevo: Cloud Function que recibe el webhook de Twilio.
- Los mensajes entran como pedidos `pendiente` con `origen: 'whatsapp'`, para revisar antes de armar.
- Marca visible (💬) en la lista.

**Listo cuando:** un mensaje de WhatsApp aparece como pedido pendiente en el día correspondiente.

---

## Fase 9 — Extras

Sueltos, sin orden fijo. Ver [9. Fases sugeridas](README-PAGINA-HOY.md#9-fases-sugeridas).

- Imprimir la hoja de pesada.
- Historial de pesadas por proveedor.
- Tara / bruto / neto, si resulta necesario.
- Tareas repetidas (VTV cada año, pagos mensuales).
- Resumen en la tarjeta de Inicio (pesadas abiertas, pedidos pendientes, total a cobrar) y opción de abrir directo en Hoy.

---

## Qué se puede hacer en paralelo

- Fases 2–3 (pesadas) y 4–5 (agenda) no dependen entre sí.
- Lo que requiere decisiones del dueño del negocio (Fase 7 y 8) puede definirse mientras se construyen las anteriores.
