# Seguimiento de un Reparto hecho — quién pagó y quién debe

Documento de diseño (sin código). Objetivo: una vez que un reparto ya está guardado, poder **hacerle seguimiento**: registrar quiénes pagaron (y cuánto, cómo y cuándo), dejar anotado quiénes deben, y **verlo de forma clara**. Sigue la guía visual de [README-NEWLOOK.md](README-NEWLOOK.md).

---

## 1. Cómo funciona hoy

| Pieza | Archivo | Qué hace |
|---|---|---|
| Armar el reparto del día | [MiReparto.jsx](src/pages/MiReparto.jsx) | Se cargan clientes con `billAmount`; cada uno nace `paymentStatus: 'pending'`, `paymentAmount: 0` |
| Lista de deudores | [MiReparto.jsx](src/pages/MiReparto.jsx) (≈ línea 450 y 716) | Muestra los deudores **solo del reparto que se está armando** (`billAmount - paymentAmount > 0`) |
| Card de reparto guardado | [RepartoCard.jsx](src/components/RepartoCard.jsx) | Muestra `X/Y pagados`, pendientes, y una pill por cliente (Pagado / Parcial / Pendiente) |
| Editar un reparto guardado | [EditRepartoModal.jsx](src/components/EditRepartoModal.jsx) | Único lugar donde se cambia el estado de pago de un cliente ya guardado, con un `<select>` |
| Persistencia | `useRepartos` en [hooks.js](src/firebase/hooks.js) | Un documento por reparto, con el array `clientes` adentro |

### Limitaciones detectadas

1. **El pago es un número, no un historial.** Solo existe `paymentAmount` (acumulado). No se sabe *cuándo* pagó, *cómo* (efectivo / transferencia / cheque) ni si fueron varios pagos.
2. **Para marcar un pago hay que editar todo el reparto.** No hay una acción rápida "cobré a este cliente" sobre un reparto ya guardado.
3. **Los deudores solo se ven del reparto en curso.** No hay una vista de "quién me debe" que junte varios repartos.
4. **Posible inconsistencia a revisar:** `MiReparto.jsx` llama `updatePayment(clienteId, updates)`, pero en `useRepartos` la firma es `updatePayment(repartoId, paymentStatus, paymentAmount)` y escribe sobre el documento del reparto, no sobre un cliente dentro del array. Hay que verificarlo antes de apoyarse en esa función para el seguimiento.
5. **No hay forma de anotar una deuda** ("me dijo que paga el viernes", "quedó debiendo $5.000").

---

## 2. Qué se quiere lograr

- Abrir un reparto hecho y ver, de un vistazo, **cuánto se cobró, cuánto falta y quién falta**.
- **Registrar un pago** en dos toques, completo o parcial, con medio de pago.
- **Anotar quién debe** y dejar una nota / fecha prometida de pago.
- **Visualizar** el estado con gráficos simples y una lista de deudores ordenada.
- Poder ver los **deudores de todos los repartos** en un solo lugar, sin abrir uno por uno.

---

## 3. Modelo de datos propuesto

Se mantiene el documento de reparto y se **agrega un historial de pagos por cliente**. `paymentAmount` y `paymentStatus` pasan a ser valores **derivados** (se siguen guardando para no romper nada de lo existente).

```js
clientes: [
  {
    id, clientName, billAmount, address,
    pagos: [                          // NUEVO — un renglón por cada cobro
      { monto: 12000, medio: 'efectivo', fecha: '2026-10-06', nota: '', timestamp: <ISO> },
      { monto: 5000,  medio: 'transferencia', fecha: '2026-10-08', nota: 'Mercado Pago', timestamp: <ISO> },
    ],
    nota: 'Paga el viernes',          // NUEVO — nota de deuda / promesa
    fechaPrometida: '2026-10-10',     // NUEVO — opcional, para los recordatorios
    // Derivados (se recalculan y se guardan igual por compatibilidad):
    paymentAmount: 17000,             // suma de pagos[].monto
    paymentStatus: 'paid' | 'partial' | 'pending',
  }
]
```

Reglas:
- `paymentAmount = Σ pagos.monto`; `pendiente = billAmount − paymentAmount`.
- `paid` si `pendiente ≤ 0`, `partial` si `0 < paymentAmount < billAmount`, `pending` si no hay pagos.
- Un pago se puede **anular** (queda registrado como anulado, no se borra) para no perder trazabilidad.
- Repartos viejos sin `pagos`: se leen como "un único pago por el `paymentAmount` existente, sin fecha ni medio". Sin migración obligatoria.
- Firestore no admite arrays directamente dentro de arrays; `clientes[].pagos[]` es válido porque cada elemento intermedio es un objeto.
- Cuidado con la **escritura concurrente**: hoy se reescribe todo el array `clientes`. Si dos dispositivos cobran a la vez, uno pisa al otro. Mitigar leyendo el documento justo antes de escribir (o con transacción) al registrar un pago.

---

## 4. Pantalla de seguimiento de un reparto

Se abre desde la `RepartoCard` con un botón **Seguimiento** (junto a editar / imprimir), en un modal de pantalla grande NEWLOOK (overlay con blur, panel `border-radius: 16px`).

### 4.1 Encabezado — el resumen

- Fecha del reparto con día de la semana (ya existe `formatDateWithWeekday`).
- **Barra de progreso apilada**: verde = cobrado, amarillo = parcial pendiente, gris = sin cobrar. Debajo: `$ cobrado de $ total · 68%`.
- Tres fichas chicas: **Cobrado**, **Falta cobrar**, **Clientes que deben (N)**.

### 4.2 Lista de clientes

Segmented control arriba: **Todos · Deben · Pagaron**. Cada fila (card plana con acento izquierdo por estado):

- Nombre y monto de la boleta.
- Pill de estado (Pagado / Parcial / Pendiente) y, si debe, el **monto pendiente en rojo suave**.
- Mini barra de avance del cliente.
- Acciones:
  - **Cobrar** → abre el formulario de pago (ver 4.3).
  - **Pagó todo** → un toque: registra un pago por el pendiente, medio "efectivo" y fecha de hoy.
  - Chevron para expandir el **historial de pagos** de ese cliente.

### 4.3 Registrar un pago

Formulario corto (mismo patrón `FormSection` / botón ghost / botón primario):
- **Monto** (precargado con el pendiente; editable para pagos parciales).
- **Medio**: Efectivo · Transferencia · Cheque (segmented control).
- **Fecha** (hoy por defecto).
- **Nota** opcional.
- Al guardar: se agrega a `pagos[]`, se recalcula el estado y la barra se anima. Aviso breve con opción **Deshacer**.

### 4.4 Anotar una deuda

Para clientes que deben, un bloque "Seguimiento de deuda":
- Nota libre ("dijo que paga el viernes").
- **Fecha prometida** de pago. Si pasa la fecha sin cobrarse, la fila se marca como **vencida** (acento rojo y pill "Vencido hace N días").

---

## 5. Visualización

| Vista | Qué muestra |
|---|---|
| **Barra apilada** (encabezado) | Proporción cobrado / parcial / pendiente del reparto |
| **Dona por medio de pago** | Cuánto entró en efectivo, transferencia y cheque (útil para el cierre de caja) |
| **Lista "Quién debe"** | Ordenada de mayor a menor deuda, con antigüedad en días |
| **Lista "Quién pagó"** | Ordenada por fecha de pago, con medio y monto |
| **Línea de tiempo del cliente** | Boleta → pago 1 → pago 2 → saldo, dentro del historial expandido |

Colores: verde `#28a745` cobrado, amarillo `#e6a817` parcial, rojo `#dc3545` deuda, gris `#6c757d` pendiente sin gestión. Pills semitransparentes al 8–12 %, como en `ClienteDeudorCard`. Íconos SVG, sin emojis.

---

## 6. Vista consolidada: "Quién me debe" (todos los repartos)

Una pestaña/sección nueva que junta los deudores de **todos los repartos guardados**:

- Agrupado por cliente (un mismo cliente que debe en 3 repartos aparece una vez, con el detalle desplegable).
- **Antigüedad de la deuda** en tramos: 0–7 días · 8–30 · más de 30, con total por tramo.
- Total general adeudado arriba.
- Filtros: por rango de fechas (segmented control, sin "Todos" por defecto, siguiendo la regla de NEWLOOK) y por cliente (buscador).
- Acción por cliente: **Cobrar** (abre el mismo formulario) y **Pasar a Saldo Clientes** para reutilizar el cálculo de saldos que ya existe en [SaldoClientes.jsx](src/pages/SaldoClientes.jsx), en lugar de duplicarlo.

---

## 7. Dónde tocar (cuando se implemente)

| Cambio | Archivo |
|---|---|
| Nuevas funciones `registrarPago`, `anularPago`, `anotarDeuda` | `useRepartos` en [hooks.js](src/firebase/hooks.js) |
| Botón "Seguimiento" en la card | [RepartoCard.jsx](src/components/RepartoCard.jsx) |
| Modal de seguimiento (nuevo) | `src/components/SeguimientoRepartoModal.jsx` |
| Formulario de pago (nuevo) | `src/components/RegistrarPagoForm.jsx` |
| Vista consolidada de deudores (nueva) | pestaña en [MiReparto.jsx](src/pages/MiReparto.jsx) o página nueva |
| Compatibilidad de estado derivado | [EditRepartoModal.jsx](src/components/EditRepartoModal.jsx) (hoy fuerza `paymentAmount` según el `<select>`; debe respetar `pagos[]`) |
| Revisar la firma de `updatePayment` | [MiReparto.jsx](src/pages/MiReparto.jsx) / [hooks.js](src/firebase/hooks.js) |

---

## 8. Orden sugerido

1. **Modelo y funciones de pago** (`pagos[]`, derivados, compatibilidad con repartos viejos) y resolver la inconsistencia de `updatePayment`.
2. **Modal de seguimiento**: encabezado con barra de progreso + lista de clientes + "Pagó todo".
3. **Formulario de pago** completo (parciales, medio, fecha) e historial por cliente.
4. **Notas y fecha prometida** con estado "vencido".
5. **Vista consolidada de deudores** con antigüedad.
6. **Dona por medio de pago** (extra, para el cierre).

---

## 9. Preguntas abiertas

- ¿Un cliente puede deber de **varios repartos distintos** y se le cobra todo junto? Si es así, ¿el pago se imputa al reparto más viejo primero?
- ¿Se quiere registrar el **medio de pago** siempre, o solo cuando no es efectivo?
- ¿Los **cheques** necesitan datos propios (banco, número, fecha de cobro) o se enlazan con el Libro de Cheques existente?
- ¿Hace falta mandar un **recordatorio** por WhatsApp al deudor (podría usar el Asistente que ya redacta mensajes)?
- ¿Quién puede **anular** un pago? Hoy la app es compartida y sin roles.
