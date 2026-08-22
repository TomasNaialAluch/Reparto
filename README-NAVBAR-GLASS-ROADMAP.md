# Roadmap de implementación — Navbar flotante glass

Este documento complementa [README-NAVBAR-GLASS.md](README-NAVBAR-GLASS.md) (la
propuesta de diseño) con el plan de implementación paso a paso, la estructura de
carpetas/componentes y las buenas prácticas a seguir para que quede escalable y
fácil de mantener.

## Estructura de carpetas propuesta

Siguiendo el patrón que ya usa el proyecto para el FAB (`src/components/fab/` con
`index.js`, subcarpeta `themes/`), la navbar flotante va en su propia carpeta:

```
src/
  components/
    floatingNavbar/
      index.js                  # export público, único punto de entrada
      FloatingNavbar.jsx        # componente contenedor (responsive)
      FloatingNavbarItem.jsx    # un ítem (icono + label + estado activo)
      FloatingNavbarMore.jsx    # panel "Más" con el resto de secciones
      FloatingNavbar.css        # estilos glass (o CSS modules, ver más abajo)
      useActiveRoute.js         # hook: compara useLocation() contra items
  config/
    navItems.js                 # NAV_ITEMS (movido desde Home.jsx), única fuente de verdad
```

**Por qué así:**
- Igual que `fab/`, queda todo lo relacionado a la navbar en un solo lugar:
  si el día de mañana hay que cambiar el diseño, tocás una carpeta, no
  archivos dispersos por todo `components/`.
- `index.js` como único punto de entrada evita que otros archivos importen
  directamente `FloatingNavbarItem.jsx` y generen acoplamiento interno.
- `navItems.js` en `config/` (no en `components/`) porque es *dato*, no *UI* —
  tanto `Home.jsx` como `FloatingNavbar.jsx` lo consumen sin duplicar nada.

## Componentes necesarios

| Componente | Responsabilidad | Notas |
|---|---|---|
| `FloatingNavbar` | Layout responsive (pill arriba en desktop / tab-bar abajo en mobile), monta la lista de items | No sabe de rutas específicas, solo recibe `NAV_ITEMS` |
| `FloatingNavbarItem` | Renderiza un ítem: icono, label (oculto en mobile si hace falta), estado activo | Recibe `active` como prop, no calcula nada de routing |
| `FloatingNavbarMore` | Botón "Más" + panel glass desplegable con secciones secundarias (Herramientas, Gestión) | Reusa `FloatingNavbarItem` adentro |
| `useActiveRoute` (hook) | Encapsula `useLocation()` + lógica de "¿esta ruta está activa?" (incluye matches de submenús) | Se testea aparte del componente visual |

Evitar un solo componente gigante con toda la lógica adentro (fetch de ruta activa,
render de desktop, render de mobile, panel "más") — separarlo hace que cada pieza
se pueda tocar sin romper las demás.

## Dónde vive el estado

- **Ruta activa:** derivada de `useLocation()` en cada render, no hace falta
  contexto ni estado global.
- **Panel "Más" abierto/cerrado:** estado local (`useState`) dentro de
  `FloatingNavbarMore`, no hace falta subirlo.
- Si en el futuro se necesita persistir preferencias (ej. "recordar última sección
  visitada"), recién ahí evaluar un contexto o `localStorage` — no anticiparlo ahora.

## Buenas prácticas a aplicar

1. **Una sola fuente de verdad para las secciones.** Mover `NAV_ITEMS` de
   `Home.jsx` a `src/config/navItems.js` en el primer paso, antes de tocar nada
   de la navbar. Así `Home` y `FloatingNavbar` nunca se desincronizan.
2. **CSS separado del JSX para estilos reutilizables.** El proyecto hoy mezcla
   mucho `style={{...}}` inline (ver `Navbar.jsx`, `Home.jsx`). Para la navbar
   flotante, que tiene estados (`active`, `hover`, `open`) y media queries,
   conviene un archivo `.css` (como ya existe `PreciosClientes.css`) en vez de
   inline styles — media queries no se pueden expresar bien con `style={{}}`.
3. **Sin lógica de negocio en el componente de layout.** `FloatingNavbar` solo
   pinta; no debe importar Firebase, contexts de datos, etc. Si algún día un
   ítem necesita un badge (ej. "3 pendientes"), ese dato se pasa por props desde
   `App.jsx` o un hook aparte, no se mete el fetch adentro del navbar.
4. **Un solo componente responsive, no dos.** Nada de `FloatingNavbarDesktop` +
   `FloatingNavbarMobile` separados — mismo componente, CSS con media queries,
   para no duplicar la lista de items ni el manejo de "activo".
5. **Montado una sola vez.** En `App.jsx`, sacar `<FloatingNavbar />` de adentro
   de cada `<Route>` y ponerlo una vez fuera de `<Routes>` (mismo nivel que
   `<FabGeneral />`). Evita 13 instancias montándose/desmontándose al navegar.
6. **Accesibilidad mínima.** Cada ítem es un `<Link>` real (no `<div onClick>`),
   con `aria-current="page"` en el activo y `aria-label` en los que solo muestran
   icono (mobile). Botón "Más" con `aria-expanded`.
7. **Sin lógica duplicada de tema/color.** Si se define el glass oscuro
   (`rgba(15,24,32,0.55)` + blur) como estándar, ponerlo en variables CSS
   (`--glass-bg`, `--glass-border`, `--glass-blur`) en `FloatingNavbar.css`, no
   hardcodeado en cada selector — facilita ajustar el efecto en un solo lugar.
8. **No romper las páginas existentes de un saque.** Migrar ruta por ruta
   (reemplazar `<Navbar />` por el nuevo, agregar el padding de despeje), no
   todo `App.jsx` en un solo commit — así cada página se puede probar y hacer
   rollback si algo se ve mal.

## Roadmap de implementación

### Fase 0 — Preparación (sin cambios visuales)
- [ ] Extraer `NAV_ITEMS` de `Home.jsx` a `src/config/navItems.js`, actualizar el
      import en `Home.jsx`. Verificar que Home sigue funcionando igual.

### Fase 1 — Componente base
- [ ] Crear `src/components/floatingNavbar/` con la estructura de la tabla de
      arriba.
- [ ] Implementar `FloatingNavbar` + `FloatingNavbarItem` con el glass definido
      en el README de diseño, solo para las secciones de primer nivel (sin
      "Más" todavía).
- [ ] Implementar `useActiveRoute` y probar el resaltado del ítem activo.

### Fase 2 — Responsive
- [ ] CSS con media queries: pill arriba (desktop) / tab-bar abajo (mobile).
- [ ] Probar en Chrome mobile emulation (375px) y desktop (1280px).

### Fase 3 — Panel "Más"
- [ ] `FloatingNavbarMore` con las secciones secundarias (Herramientas, Gestión,
      submenu de Gestión Semanal).
- [ ] Cerrar el panel al navegar o al hacer click afuera.

### Fase 4 — Integración en `App.jsx`
- [ ] Montar `<FloatingNavbar />` una sola vez, fuera de `<Routes>`.
- [ ] Quitar los `<Navbar />` sueltos ruta por ruta, agregando el padding de
      despeje correspondiente a cada contenedor de página.
- [ ] Confirmar que `Navbar.jsx` (el viejo) queda sin uso y se puede borrar.

### Fase 5 — Convivencia con el FAB
- [ ] Ajustar posición de `FabGeneral` en mobile para que no choque con la
      tab-bar inferior (subir el margen inferior del FAB).

### Fase 6 — Pulido
- [ ] Accesibilidad (`aria-current`, `aria-label`, `aria-expanded`).
- [ ] Revisar contraste del glass sobre cada fondo de página (algunas son claras,
      otras usan `rgba(106,136,153,0.08)`).
- [ ] Limpiar estilos inline redundantes que dupliquen lo que ya hace el CSS.

## Fuera de alcance (no hacer ahora)

- Persistencia de preferencias de navegación (recordar última sección).
- Animaciones de transición entre páginas.
- Temas alternativos de la navbar (eso, si se pide, se resuelve después con el
  mismo patrón que ya usa `fab/themes/`).
