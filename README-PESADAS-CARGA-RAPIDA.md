# Pesadas — Carga rápida por texto y validación al ingresar

**Estado:** implementado (fases 1 a 4 de la sección 12). Pendiente de probar con datos reales.

**Diferencias con el diseño:** la carga usa **dos campos chicos en la misma fila** (Corte | Kg) en lugar de la línea única: Enter en el corte pasa a los kg, Enter en los kg guarda y deja el corte fijo para la siguiente pesada. El reconocimiento es el mismo. Al ingresar, los precios $/kg son opcionales y quedan en 0 si no se completan; se completan después en Mercadería.

Documento hijo de [README-PAGINA-HOY.md](README-PAGINA-HOY.md) (sección 5, Carga rápida) y de [README-ROADMAP-HOY.md](README-ROADMAP-HOY.md) (Fases 1 y 3).

## 1. Qué se probó y por qué no sirvió

| Intento | Problema |
|---|---|
| Desplegable de cortes bajo el input | La tarjeta lo recortaba, no entraba. |
| Grilla de chips con todos los cortes | Marea: hay que **mirar y elegir** entre muchas opciones mientras se pesa. |

Las dos versiones piden **decidir antes de pesar**. Pero con el camión descargando, lo que hay que hacer es escribir rápido y seguir. La decisión de "qué corte es exactamente" se puede tomar **después**, con calma, cuando se ingresa a Mercadería.

## 2. Idea central

1. **Se escribe el corte tal cual se dice** (`lomo`, `bondi`, `asado tira`).
2. **Si la app lo reconoce con seguridad**, lo toma como ese corte del catálogo, sin preguntar.
3. **Si no lo reconoce, lo acepta igual** como texto y lo marca "sin validar". No interrumpe, no abre nada.
4. **La validación se hace al ingresar a Mercadería**: ahí se resuelve qué es cada texto sin reconocer, una sola vez por texto.

Principio: **al pesar no se bloquea nunca; al ingresar no pasa nada sin validar.**

## 3. Carga: una sola línea

```
┌──────────────────────────────────────────────────────────────┐
│  [ lomo 12,3                                      ]  ⏎       │
│   → Lomo · 12,30 kg                                  ✔       │
└──────────────────────────────────────────────────────────────┘
```

- **Un solo campo de texto** donde se escribe el corte y los kg: `lomo 12,3` y Enter.
- Debajo se ve **cómo lo interpretó** antes de guardar: *→ Lomo · 12,30 kg ✔*.
- Si se escribe **solo un número** (`8,5`), se usa **el mismo corte de la pesada anterior**. Para cargar varias del mismo corte basta `12,3 ⏎ 8 ⏎ 15,2 ⏎`.
- Si se escribe **solo texto** (`vacio`), se fija ese corte y la próxima línea con solo número lo usa.
- Atajo: Tab separa en dos campos (corte / kg) para quien prefiera no usar la línea única.
- La coma y el punto decimal valen los dos. Números absurdos (más de 5.000 kg) piden revisar antes de guardar.

### Cómo se separa texto y kg
El **último número** de la línea son los kg; todo lo anterior es el corte.
`asado tira 18,4` → corte `asado tira`, kg `18,4`.
`cuadril` + Enter → fija corte, sin kg todavía.
`2 lomos 12` → corte `2 lomos`, kg `12` (el número final manda; lo anterior es texto).

## 4. Cómo se reconoce un corte

La comparación es **local, instantánea y determinista** (sin IA ni red). Se normaliza el texto: minúsculas, sin tildes, espacios colapsados (igual que `normalizarNombre`).

| Orden | Regla | Resultado |
|---|---|---|
| 1 | El texto es **igual** al nombre de un corte del catálogo | ✔ `exacto`, entra solo |
| 2 | El texto es **igual a un alias** guardado de un corte (ver sección 6) | ✔ `alias`, entra solo |
| 3 | **Un único** corte lo contiene o empieza con él, y el texto tiene 3+ letras (`bondi` → Bondiola) | ✔ `parcial`, entra solo |
| 4 | **Varios** cortes coinciden (`asado` → Asado, Asado tira, Asado ancho) | ⚠ `dudoso`: queda como texto, sugiere candidatos |
| 5 | Es **parecido** a uno (error de tipeo: `bondoila`) | ⚠ `dudoso`: queda como texto, sugiere el parecido |
| 6 | **No hay nada** | ⚠ `nuevo`: queda como texto |

**Regla de seguridad:** ante la duda, **no adivina**. Un corte mal asignado en silencio es peor que uno pendiente, porque después nadie lo revisa. Solo entra solo lo que es seguro (1, 2 y 3).

El caso 3 es el más delicado: por eso exige un **único** candidato y 3 letras como mínimo. En cuanto aparece un segundo posible, pasa a `dudoso`.

## 5. Cómo se ve lo cargado

```
Cargadas
  08:42   Lomo            12,30 kg   ✔
  08:44   Lomo             8,00 kg   ✔
  08:51   Bondiola         9,75 kg   ✔  (bondi)
  08:55   asado tira      18,40 kg   ⚠ sin validar
  09:02   bondoila         6,10 kg   ⚠ ¿Bondiola?
```

- ✔ = reconocido. Si se reconoció por coincidencia parcial o alias, se muestra **lo que se escribió** entre paréntesis, para poder controlar.
- ⚠ = queda como texto, **pendiente de validar**.
- Los totales por corte agrupan por corte reconocido; los textos sin reconocer se agrupan **por texto normalizado**, así `asado tira` y `Asado Tira` suman juntos aunque estén pendientes.
- Un contador visible: **"2 sin validar"**. No frena nada; avisa lo que falta resolver antes de ingresar.
- Tocar un ⚠ permite resolverlo **ya mismo** (opcional, ver sección 7), pero no es necesario.

## 6. Validación al ingresar a Mercadería

Al tocar **Ingresar a Mercadería** ([README-PAGINA-HOY.md, sección 6](README-PAGINA-HOY.md#6-pasar-a-mercadería)):

- **Todo reconocido:** pasa directo, como se describió.
- **Hay textos sin validar:** se abre un paso previo **"Revisar cortes"** que lista cada texto distinto una sola vez, con su total de kg:

```
Revisar cortes antes de ingresar                 2 pendientes

 «asado tira»    18,40 kg · 1 pesada
    ( ) Es uno existente:  [ Asado tira ▾ ]   sugeridos: Asado, Asado ancho
    ( ) Crear corte nuevo   categoría [ Vaca ▾ ]
    [x] Recordar para la próxima

 «bondoila»       6,10 kg · 1 pesada
    (•) Es:  Bondiola     ← sugerido (parecido)
    [x] Recordar para la próxima

                                       [Cancelar]  [Confirmar e ingresar]
```

- **Una decisión por texto**, que aplica a todas las pesadas con ese texto.
- Opciones: **es uno existente** (con sugerencias ordenadas por parecido), o **crear corte nuevo** (con categoría, como ya hace Mercadería).
- **Recordar para la próxima** (activado por defecto): guarda el texto como **alias** del corte elegido. La próxima vez que se escriba `asado tira`, entra solo por la regla 2.
- No se puede confirmar con textos sin resolver. Se puede **cancelar** y la pesada sigue abierta, tal como estaba.
- Al confirmar, la pesada se actualiza (cada item pasa a `ok` con su corte) y recién ahí se arma la entrada de Mercadería. Después sigue el flujo actual (precios, control de atípicos).

Así el catálogo **aprende** con el uso: cuanto más se carga, menos pendientes aparecen.

## 7. Resolver antes de ingresar (opcional)

Para no acumular pendientes, en la lista de cargadas, tocar un ⚠ abre un mini selector con los sugeridos y la opción de crear. Es la misma decisión que en el paso 6 y se guarda igual. **No es obligatorio**: si no se toca nada, igual se resuelve al ingresar.

## 8. Modelo de datos

**Cada pesada individual** (dentro de `pesadas[]` del documento de la pesada, ver [README-PAGINA-HOY.md, sección 7](README-PAGINA-HOY.md#7-modelo-de-datos)):

```js
{
  id: 'kg_...',
  texto: 'bondi',               // exactamente lo que se escribió
  corteId: 'abc123' | null,     // corte del catálogo si se reconoció o validó
  corte: 'Bondiola' | null,     // nombre canónico al momento de resolver
  kg: 9.75,
  hora: '08:51',
  match: 'exacto' | 'alias' | 'parcial' | 'dudoso' | 'nuevo' | 'validado',
  candidatos: ['Asado', 'Asado tira']   // solo si es dudoso (opcional)
}
```

- `texto` **siempre se conserva**: queda la trazabilidad de lo que se escribió, aunque después se resuelva.
- `corteId` + `corte` se llenan cuando se reconoce o se valida.
- Pendiente = `corteId === null`.

**Alias en el catálogo de cortes** (colección `cortes`, `useCortes`), igual que ya tienen los contactos:

```js
{ nombre: 'Asado tira', nombreNormalizado: 'asado tira', alias: ['asado tira ancho', 'tira'], ... }
```

- Un alias no puede repetirse en dos cortes distintos (se rechaza o se avisa al validar).
- Un corte archivado no recibe coincidencias automáticas; si el texto coincide con uno archivado, queda `dudoso` con aviso "archivado".

## 9. Dónde cambia el código

| Archivo | Cambio |
|---|---|
| `src/utils/cortes.js` (nuevo) | `reconocerCorte(texto, catalogo)` → `{ corteId, corte, match, candidatos }`; `separarTextoYKg(linea, ultimoCorte)`. Es función pura y fácil de probar. |
| `src/components/hoy/PesadaCard.jsx` | Se reemplaza el selector (grilla de chips) por la línea única con la interpretación en vivo. |
| `src/hooks/usePesadas.js` | `agregarKg` guarda `texto`, `corteId`, `match`; `resolverTexto(pesadaId, texto, corte)` aplica una decisión a todos los items con ese texto. |
| `src/hooks/useCortes.js` | Soporte de `alias[]`: `agregarAlias(id, texto)` y `buscarPorAlias`. |
| `src/components/hoy/RevisarCortesModal.jsx` (nuevo) | Paso "Revisar cortes" de la sección 6. |
| `src/utils/pesadas.js` | `totalesPesada` agrupa por `corteId` o, si no hay, por texto normalizado. |

Se puede reutilizar `normalizarNombre` y `sonParecidos` de `src/utils/nombres.js`.

## 10. Casos límite

- **El mismo corte escrito de dos formas** (`lomo`, `Lomo `): ambos reconocen igual, nada que hacer.
- **El mismo texto sin reconocer, varias veces:** se resuelve de una sola vez en la validación.
- **Cambia el catálogo entre la carga y el ingreso** (se crea o renombra un corte): al abrir "Revisar cortes" se **vuelve a reconocer** todo lo pendiente; lo que ahora coincide se resuelve solo.
- **Se corrige o borra una pesada** pendiente: el contador se actualiza, no queda residuo.
- **Un texto que es solo número** al principio de una pesada vacía (sin corte previo): se avisa "falta el corte", no se guarda.
- **Texto vacío con Enter:** no hace nada.
- **Edición posterior:** si Mercadería ya recibió la pesada, un cambio de corte se hace en Mercadería (la pesada queda como registro de lo que se pesó).

## 11. Qué NO hace (a propósito)

- No usa IA ni consultas externas para adivinar: ante la duda pregunta después, no inventa.
- No mezcla cortes parecidos en silencio.
- No obliga a limpiar el catálogo antes de pesar.
- No bloquea nunca la carga; solo bloquea **ingresar** con textos sin resolver.

## 12. Fases de implementación

1. **Línea única + reconocimiento:** parser texto/kg, `reconocerCorte`, interpretación en vivo, cargadas con ✔/⚠, totales agrupados.
2. **Resolución rápida opcional:** tocar un ⚠ y resolverlo en el momento.
3. **Alias en el catálogo:** `alias[]`, aprendizaje con "recordar".
4. **Validación al ingresar:** modal "Revisar cortes" integrado con **Ingresar a Mercadería** (Fase 3 del roadmap).

Las fases 1 y 2 reemplazan lo implementado en la Fase 1 del roadmap; la 4 se integra con la Fase 3.

## 13. Preguntas abiertas

- ¿Cómo se dicen los cortes en la balanza? Un par de ejemplos reales (abreviaturas, apodos) ayudan a afinar las reglas 3 a 5.
- Las siglas del cuaderno (B, M, C, 1-): ¿se escribirían tal cual en esta línea? Si sí, se resuelven con la misma tabla de **alias**.
- ¿Se quiere la línea única como principal, o preferís dos campos (corte / kg) y la línea única como atajo?
- Si un texto queda `dudoso` entre varios (`asado`), ¿preferís que **sugiera el más usado** en la validación?
