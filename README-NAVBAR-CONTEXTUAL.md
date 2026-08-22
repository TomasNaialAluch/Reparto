# Navbar contextual — que la barra "mute" según la sección

Tercer README de esta serie. Complementa a:

1. [README-NAVBAR-GLASS.md](README-NAVBAR-GLASS.md) — diseño visual (glass, siempre abajo).
2. [README-NAVBAR-GLASS-ROADMAP.md](README-NAVBAR-GLASS-ROADMAP.md) — roadmap de
   implementación (Fases 0 a 5, **completadas**: la `FloatingNavbar` ya existe,
   con las 5 secciones de primer nivel, conviviendo con el FAB).

Esto es el siguiente nivel: hoy la barra siempre muestra lo mismo (Mi Reparto,
Saldo Clientes, Transferencias, Gestión Semanal, Facturación). La idea nueva es
que la barra **cambie de contenido según en qué sección estás**, para navegar
rápido *dentro* de una sección sin perder la barra de navegación general.

## El caso concreto: Gestión Semanal

[GestionSemanal.jsx](src/pages/GestionSemanal.jsx) ya tiene sus propios tabs
internos (Mercadería, Embutidos, Empleados, Gastos, Clientes, Pagos
Proveedores) — ver `TABS` / `handleTabChange` en ese archivo. Hoy esos tabs
viven en un `useState` local y se eligen con botones arriba del contenido.

Propuesta: cuando estás en `/gestion-semanal`, la `FloatingNavbar` (que hoy
vive abajo de la pantalla) **deja de mostrar las 5 secciones globales y
muestra en su lugar los tabs de Gestión Semanal**: Mercadería, Embutidos,
Empleados, Gastos, Clientes, Pagos Proveedores. Así se puede saltar entre esos
tabs sin scrollear hasta el selector que está arriba del todo.

## El botón Home / Menú

A la izquierda de todo, siempre fijo (no cambia), un botón Home/Menú:

- **Modo contextual (default en una página con tabs propios):** la barra
  muestra los tabs de esa sección (ej. Mercadería, Embutidos...).
- **Tocás el botón Home/Menú:** la barra "vuelve" a mostrar la lista global
  (Mi Reparto, Saldo Clientes, Transferencias, Gestión Semanal, Facturación)
  — sin salir de la página en la que estás.
- **Tocás una sección global ahí:** navegás a esa página. Si esa página tiene
  su propio set contextual, la barra entra directo en modo contextual de esa
  nueva página (mismo comportamiento, encadenado). Si no lo tiene, se queda
  mostrando la lista global.

Esto da dos "capas" de navegación en el mismo lugar de la pantalla, sin
duplicar el espacio con dos barras.

## Páginas sin set contextual todavía

Por ahora **solo Gestión Semanal** tiene un set contextual definido (sus 6
tabs ya existen en el código, no hay que inventarlos). El resto de las
secciones (Mi Reparto, Saldo Clientes, Transferencias, Facturación) se quedan
mostrando la barra global tal cual está hoy, hasta que se decida qué iría en
cada una. No hay que resolver eso ahora — el sistema tiene que soportar
"esta ruta no tiene contextual, mostrar global" como caso normal, no como
excepción.

## Cómo se modela (dato, no lógica)

Mismo criterio que ya usa `navItems.js`: un archivo de configuración declara
qué contextual le corresponde a cada ruta, sin que los componentes de la
navbar sepan nada de Gestión Semanal en particular.

```
src/
  config/
    navItems.js          # ya existe — secciones globales
    navContextual.js      # nuevo — set contextual por ruta (opcional)
```

```js
// src/config/navContextual.js
export const NAV_CONTEXTUAL = {
  '/gestion-semanal': {
    paramKey: 'tab',              // ver "Sincronización" más abajo
    items: [
      { key: 'mercaderia',        label: 'Mercadería',  Icon: IconBox },
      { key: 'embutidos',         label: 'Embutidos',   Icon: IconMoney },
      { key: 'empleados',         label: 'Empleados',   Icon: IconUsers },
      { key: 'gastos',            label: 'Gastos',      Icon: IconCash },
      { key: 'clientes',          label: 'Clientes',    Icon: IconClipboard },
      { key: 'pagos-proveedores', label: 'Pagos Prov.', Icon: IconBank },
    ],
  },
  // otras rutas: sin entrada acá = FloatingNavbar se queda en modo global.
};
```

La `FloatingNavbar` solo hace: `NAV_CONTEXTUAL[pathname]` — si existe, modo
contextual (con el botón Home/Menú); si no, modo global (como está hoy).

## El punto difícil: sincronizar la barra con el tab activo de la página

Hoy `activeTab` en `GestionSemanal.jsx` es un `useState` local — la barra
flotante, al ser un componente hermano (montado en `App.jsx`, no dentro de la
página), **no tiene forma de leerlo ni cambiarlo** tal como está el código
ahora. Hay que elegir una fuente de verdad compartida. Dos opciones:

### Opción A — Query param en la URL (recomendada)

`/gestion-semanal?tab=embutidos`. `GestionSemanal.jsx` deja de usar
`useState('mercaderia')` y pasa a leer/escribir el tab con `useSearchParams`
de `react-router-dom`. La `FloatingNavbar` hace exactamente lo mismo para
saber cuál resaltar y para navegar (`<Link to="/gestion-semanal?tab=embutidos">`).

**Por qué esta:** ninguna de las dos partes necesita conocer a la otra — las
dos leen la misma URL. Además el link a un tab específico se puede compartir
o recargar sin perder el estado (F5 en `?tab=empleados` cae en Empleados, no
vuelve a Mercadería). Es el mismo patrón que ya usa la barra global (matchea
contra `useLocation()`), así que `useActiveRoute` se extiende naturalmente en
vez de inventar un mecanismo nuevo.

### Opción B — Contexto de React compartido

Un `TabContext` que se crea en `App.jsx`, con `GestionSemanal.jsx` y
`FloatingNavbar` ambos suscriptos. Funciona, pero: no sobrevive un refresh de
página, no es enlazable, y agrega una pieza de estado global nueva para un
problema que la URL ya resuelve gratis. Se descarta salvo que en el futuro
haya un motivo concreto para no tocar la URL.

**Decisión: Opción A.** Cuando se implemente, el cambio en
`GestionSemanal.jsx` es puntual: reemplazar `useState(activeTab)` por
`useSearchParams`, sin tocar la lógica de cada tab en sí.

## Componentes nuevos / modificados

| Componente | Cambio |
|---|---|
| `FloatingNavbar` | Detecta si `pathname` tiene entrada en `NAV_CONTEXTUAL`. Si sí, renderiza `FloatingNavbarHomeButton` + los items contextuales en vez de `TOP_LEVEL_ITEMS`. |
| `FloatingNavbarHomeButton` (nuevo) | Botón fijo a la izquierda, ícono home/menú. `onClick` alterna un estado local `showGlobal` (no navega). |
| `FloatingNavbarItem` | Se reusa tal cual — ya no le importa si el `item` viene de `NAV_ITEMS` o de un contextual, ambos tienen `{ path o key, label, Icon }`. Para contextual, en vez de `to={item.path}` arma `to` con el query param (`?tab=key`). |
| `useActiveRoute` | Se extiende para además exponer el `tab` activo actual (leído de `useSearchParams`), no solo el `pathname`. |
| `GestionSemanal.jsx` | Cambia `useState('mercaderia')` por `useSearchParams` para el tab activo. El selector de tabs que ya tiene arriba del contenido puede quedar (para desktop, donde hay más espacio) o retirarse más adelante si la barra de abajo lo reemplaza del todo — no hace falta decidirlo ahora. |

## Comportamiento del botón Home/Menú (estado local, no ruta)

`showGlobal` vive en `FloatingNavbar`, no en la URL — es un detalle de
presentación de la barra, no algo que tenga sentido compartir por link. Se
resetea a `false` (modo contextual) cada vez que cambia el `pathname`, así al
entrar a una página con contextual siempre arranca mostrando SU contextual, no
el estado en el que quedó la barra en la página anterior.

## Buenas prácticas a cuidar en esta fase

1. **Ni la barra ni la página se hardcodean mutuamente.** `FloatingNavbar` no
   importa nada de `GestionSemanal.jsx`, y `GestionSemanal.jsx` no sabe que
   existe la barra. Las dos leen el mismo dato externo (la URL) y
   `navContextual.js` es la única pieza que conoce la relación entre una ruta
   y sus tabs. Si mañana se agrega contextual a otra página, se toca un solo
   archivo de config — no la barra ni la página en cuestión.
2. **Cero lógica nueva duplicada.** `FloatingNavbarItem` se reusa tal cual
   para items contextuales (misma pinta, mismo componente); no se crea un
   `FloatingNavbarContextualItem` aparte solo porque el `to` se arma distinto.
   `useActiveRoute` se **extiende**, no se reemplaza por un hook paralelo.
3. **Un solo estado por dato, en el lugar que corresponde.**
   - Tab activo de Gestión Semanal → URL (dato de navegación, compartido
     entre dos componentes, debe sobrevivir un refresh).
   - `showGlobal` del botón Home/Menú → estado local de `FloatingNavbar`
     (detalle de presentación de un componente, nadie más lo necesita).
   No subir todo a un Context "por las dudas" — cada estado vive donde el
   problema real lo pide (ver la comparación Opción A vs B arriba).
4. **No tocar la lógica de negocio de Gestión Semanal.** El cambio en
   `GestionSemanal.jsx` es *solo* la fuente del `activeTab` (de `useState` a
   `useSearchParams`); `agregarMercaderia`, `agregarEmbutidos`, etc. no se
   tocan. Un refactor de infraestructura no debería arrastrar cambios en
   lógica de datos — si al implementarlo hace falta tocar algo más, es señal
   de que el paso está mal cortado.
5. **No construir contextual para páginas que todavía no lo necesitan.**
   `NAV_CONTEXTUAL` empieza con una sola entrada (Gestión Semanal). No se arma
   una entrada vacía o placeholder para Mi Reparto/Saldo Clientes/etc.
   "por si después se decide algo" — eso es la abstracción prematura que ya
   evita el roadmap anterior. Cuando haya una decisión concreta para otra
   sección, se agrega una entrada más al mismo archivo.
6. **Nombres e íconos consistentes con lo que ya existe.** Los items
   contextuales de Gestión Semanal reusan los mismos íconos que ya tiene
   `TABS` en `GestionSemanal.jsx` (`gestionSemanal/icons.jsx`) — no se
   inventa un segundo set de íconos para la misma sección.
7. **Accesibilidad igual que en la barra global.** El botón Home/Menú lleva
   `aria-label` y `aria-pressed` (o `aria-expanded`) para indicar si el modo
   global está abierto; los items contextuales activos usan `aria-current`
   igual que ya hace `FloatingNavbarItem`.
8. **Migrar Gestión Semanal en un commit separado y verificable solo.** El
   cambio de `useState` a `useSearchParams` (Fase 7) se prueba y confirma
   *antes* de tocar la barra (Fase 8) — así, si algo se rompe, se sabe en qué
   mitad del cambio pasó.

## Roadmap de esta fase (siguiente a la Fase 5 ya hecha)

### Fase 6 — Modelo de datos
- [ ] Crear `src/config/navContextual.js` con la entrada de Gestión Semanal
      (los 6 tabs, reusando los mismos íconos que ya usa `TABS` en
      `GestionSemanal.jsx` para no inventar un lenguaje visual nuevo).

### Fase 7 — Gestión Semanal pasa el tab a la URL
- [ ] Reemplazar el `useState('mercaderia')` de `GestionSemanal.jsx` por
      `useSearchParams`, sin tocar el resto de la lógica de cada tab.
- [ ] Confirmar que refrescar la página en `?tab=embutidos` cae en Embutidos.

### Fase 8 — Modo contextual en la barra
- [ ] `FloatingNavbarHomeButton` + lógica de `showGlobal` en `FloatingNavbar`.
- [ ] Cuando hay entrada en `NAV_CONTEXTUAL` para la ruta actual: mostrar
      Home/Menú + los items contextuales, resaltando el tab activo leído de
      la URL.
- [ ] Cuando no hay entrada: comportamiento actual sin cambios (barra global).

### Fase 9 — Pulido
- [ ] Verificar en mobile que con 6 items contextuales + Home/Menú la barra
      sigue entrando en pantalla (mismo mecanismo de `overflow-x: auto` que
      ya tiene la barra global).
- [ ] Decidir si el selector de tabs que hoy tiene `GestionSemanal.jsx` arriba
      del contenido se mantiene (útil en desktop) o se retira en mobile para
      no duplicar la navegación.

## Fuera de alcance (todavía)

- Qué contextual les correspondería a Mi Reparto, Saldo Clientes,
  Transferencias o Facturación — no hay una propuesta concreta para esas
  todavía. El sistema soporta agregarlas después sin cambios estructurales:
  cada una es una entrada nueva en `navContextual.js` cuando se decida qué va
  en cada una.
- El panel "Más" (Herramientas, Gestión) sigue desactivado — ver
  `README-NAVBAR-GLASS-ROADMAP.md`. No se toca en esta fase.
