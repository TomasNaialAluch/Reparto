# Lista de Precios (tablas tipo Excel) — Sección Gestión

## Estado actual y por qué hay que rehacerlo

La v1 (`src/pages/TablasPrecios.jsx`) ya está en producción y usable, pero al probarla con una tabla real de 7+ columnas aparecieron problemas de fondo, no de detalle:

1. **Las columnas se achican sin límite.** La tabla usa `table-layout: fixed` y reparte el ancho disponible entre todas las columnas por igual. Con 2 columnas se ve bien; con 7 u 8, cada columna queda de ~60px y el nombre ("Solomillo", "Recorte") se pisa contra el ícono de tacho.
2. **El ícono de borrar en el header es mala idea tal como está.** Vive pegado al texto del nombre de columna, dentro del mismo `<th>` angosto. Cuando el header se angosta, texto e ícono compiten por el mismo espacio y se superponen. Un control destructivo (eliminar) no debería competir por espacio con el dato principal (el nombre).
3. **No se pueden reordenar filas ni columnas.** Es una limitación real de "planilla": si el usuario carga "Producto, Precio" y después quiere "Precio" primero, hoy tiene que borrar y recrear.

Conclusión: no es un ajuste de CSS, es repensar el layout y la interacción de la grilla. Este documento reemplaza el diseño anterior de la sección "UI propuesta" del README original.

---

## Principios para la v2

- **Nunca angostar una columna más allá de un mínimo legible.** Las columnas tienen un `min-width` fijo (ej. 120–140px). Si la suma de columnas supera el ancho disponible, la tabla scrollea horizontalmente — no se comprime.
- **Las acciones destructivas no compiten por espacio con el dato.** El botón de borrar columna/fila no vive inline junto al texto. Aparece como overlay al hacer hover (desktop) o como acción secundaria en un menú, nunca reduce el espacio disponible para el nombre.
- **Reordenar es una operación de primera clase**, no un extra: se agrega un handle de arrastre (drag handle) tanto para columnas como para filas.
- Seguir usando la paleta y los tokens de [README-NEWLOOK.md](README-NEWLOOK.md) (acero `#6A8899`, radios 8/12px, iconos SVG, nada de Bootstrap crudo) — eso ya quedó bien encaminado, el problema es de layout/interacción, no de estética de color.

---

## Layout de la grilla (v2)

### Columnas de ancho fijo + scroll horizontal, no `table-layout: fixed`

- Cada columna tiene un ancho mínimo fijo en píxeles (ej. `130px`), configurable por el usuario arrastrando el borde derecho del header (resize handle), como en Excel/Google Sheets/Notion.
- El contenedor de la tabla tiene `overflow-x: auto`. Si hay muchas columnas, aparece scroll horizontal en vez de que las columnas se compriman.
- La primera columna puede quedar "congelada" (`position: sticky; left: 0`) para que al scrollear horizontalmente el usuario no pierda de vista qué fila está mirando — patrón estándar de spreadsheets.

### El header de columna separa "nombre" de "acciones"

En vez de un `<th>` con `justify-content: space-between` entre nombre e ícono (lo que hoy se rompe), el header pasa a tener dos capas:

```
┌─────────────────────────────┐
│ ⠿  Nombre columna       ⋮   │  ← fila normal: drag handle + nombre + menú "⋮" (kebab)
└─────────────────────────────┘
```

- **Drag handle** (`⠿`, ícono de 6 puntos) a la izquierda: agarrar y arrastrar para reordenar. Solo visible on-hover del header para no sumar ruido visual con muchas columnas.
- **Nombre de columna**: texto que trunca con `ellipsis` si no entra (`text-overflow: ellipsis; white-space: nowrap; overflow: hidden`), nunca hace wrap ni empuja el ancho de la celda.
- **Menú "⋮" (kebab)** a la derecha, también on-hover: al clickear despliega un mini menú con **Renombrar** y **Eliminar columna**. Esto saca la acción destructiva de estar siempre visible y compitiendo por espacio — solo aparece cuando el usuario la pide.

> Alternativa más simple si el menú kebab se siente sobre-ingenierizado para el uso real: dejar el ícono de tacho, pero **solo visible al hacer hover sobre todo el header de esa columna**, posicionado en `position: absolute` (no ocupa espacio en el flujo del texto) arriba a la derecha del `<th>`, con un pequeño fondo blanco/sombra para que no se lea encima del texto. Esto resuelve el problema de superposición sin agregar un menú nuevo. Recomendado como primer paso por ser más simple de implementar y de entender para el usuario.

### Igual criterio para filas

- Drag handle a la izquierda de cada fila (columna extra angosta, ~24px, con el ícono `⠿` visible on-hover de la fila).
- El botón de eliminar fila pasa a la derecha del todo, también on-hover de la fila (hoy ya está razonablemente separado, pero se homologa al mismo patrón on-hover que columnas para consistencia).

---

## Reordenar (drag & drop)

- Se recomienda la librería **`@dnd-kit/core` + `@dnd-kit/sortable`** (liviana, sin dependencias de estilo propias, funciona bien con listas horizontales y verticales, y es la opción moderna estándar en React — alternativa a `react-beautiful-dnd`, que está en modo mantenimiento).
- Dos contextos de sorteo independientes:
  - Uno **horizontal** para las columnas (arrastrar por el drag handle del header).
  - Uno **vertical** para las filas (arrastrar por el drag handle de la fila).
- Al soltar, se recalcula el array `columnas` (y el orden correspondiente dentro de cada `fila.valores`) o el array `filas`, y se persiste con un solo `updateDoc` — mismo patrón que ya usa `useTablasPrecios` para agregar/eliminar.
- Mientras se arrastra: la columna/fila fantasma sigue el cursor con opacidad reducida, y se muestra un indicador de línea vertical/horizontal en el punto de inserción (comportamiento estándar de `@dnd-kit/sortable`, no hay que reinventarlo).

---

## Resumen de cambios respecto a la v1

| Problema v1 | Solución v2 |
|---|---|
| Columnas se comprimen sin límite | `min-width` fijo por columna + scroll horizontal del contenedor |
| Ícono de borrar pisa el texto | Acciones (renombrar/eliminar) ocultas por defecto, aparecen on-hover en overlay `position: absolute`, no ocupan espacio en el flujo |
| No se puede reordenar | Drag handle + `@dnd-kit/sortable`, un contexto horizontal (columnas) y uno vertical (filas) |
| Primera columna se pierde al scrollear | `position: sticky; left: 0` en la primera columna |
| Nombre de columna largo rompe el layout | `text-overflow: ellipsis` + tooltip nativo (`title`) con el nombre completo |

---

## Fuera de alcance (a menos que se pida)

- Redimensionar columnas arrastrando el borde (resize handle) — se menciona como posible mejora futura pero no es parte de este rediseño; por ahora el ancho de columna es fijo.
- Selección múltiple de celdas / copy-paste tipo Excel.
- Undo/redo de cambios en la grilla.

## Próximo paso

Este documento es la base para la próxima implementación. Cuando se apruebe el enfoque (en particular: ¿menú kebab o tacho on-hover con overlay absoluto para las acciones de columna?), se reescribe `TablasPrecios.jsx` aplicando este layout y se agrega `@dnd-kit` como dependencia nueva del proyecto.
