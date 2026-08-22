# Navbar flotante estilo "Liquid Glass"

Propuesta para reemplazar el `Navbar` actual (que solo tiene un link a Inicio) por una
barra de navegación flotante, translúcida (glassmorphism al estilo del rediseño de
Apple 2025), que permita saltar entre secciones sin volver a Home.

## Por qué

- Hoy `Navbar.jsx` solo tiene un botón "Inicio". Para ir de "Mi Reparto" a
  "Transferencias" hay que volver a Home y elegir de nuevo.
- Ya existen todas las rutas y el listado de secciones armado en
  [`Home.jsx`](src/pages/Home.jsx) (`NAV_ITEMS`), así que no hay que inventar
  información nueva, solo reusarla en un componente de navegación persistente.
- El proyecto ya usa `backdropFilter: blur()` en varios lugares (Home, tarjetas del
  FAB), así que el efecto "glass" ya es parte del lenguaje visual existente.

## Qué es el efecto "Liquid Glass"

- Fondo semitransparente + `backdrop-filter: blur()` (desenfoca lo que hay detrás).
- Borde de 1px muy sutil, casi blanco/translúcido, para simular el "canto" del vidrio.
- Sombra suave hacia abajo para que la barra parezca flotar sobre el contenido.
- El contenido de la página se ve *a través* de la barra, ligeramente distorsionado
  por el blur, en vez de quedar tapado por un color sólido.
- Estados activos/hover con un resplandor o cambio de opacidad, no con bordes duros.

## Estructura propuesta

### 1. Componente único: `FloatingNavbar`

Un solo componente responsive (no dos separados) que cambia de layout según el
viewport, para no duplicar la lista de secciones:

- **Siempre abajo, en desktop y mobile** (`position: fixed; bottom: 16px`),
  centrada horizontalmente, tipo "pill" — igual criterio que el Dock de macOS y
  el tab bar de iOS. Se descartó la idea inicial de ponerla arriba en desktop
  para mantener el mismo lugar en todos los tamaños de pantalla.

### 2. Fuente de datos

Reusar/exportar `NAV_ITEMS` de `Home.jsx` (moverlo a algo como
`src/config/navItems.js` para que lo importen tanto `Home.jsx` como el nuevo
`FloatingNavbar.jsx`, sin duplicar la lista de secciones).

Para la barra flotante conviene una versión "aplanada" (sin submenús anidados) con
las secciones de primer nivel más usadas: Reparto, Saldo Clientes, Transferencias,
Facturación, Gestión Semanal, y un botón "Más" que despliega el resto (Herramientas,
Gestión, etc.) en un panel glass adicional.

### 3. Ítem activo

Usar `useLocation()` de `react-router-dom` para resaltar la sección actual (fondo
más opaco, icono con leve glow), así el usuario siempre sabe dónde está.

### 4. Integración con `App.jsx`

Hoy cada `<Route>` arma manualmente `<Navbar /><Pagina />`. Conviene:

- Reemplazar `<Navbar />` por `<FloatingNavbar />` en cada ruta (o, mejor, sacar el
  navbar del árbol de rutas y ponerlo una sola vez fuera de `<Routes>`, ya que al
  ser `position: fixed` no necesita re-renderizarse por ruta).
- Agregar `padding-top` (desktop) / `padding-bottom` (mobile) al contenedor de cada
  página para que el contenido no quede tapado detrás de la barra flotante.

### 5. Conflicto de espacio con el FAB

Ya existe un `FabGeneral` flotante (pelota, esquina de la pantalla). Hay que revisar
posiciones para que en mobile la tab-bar inferior y el FAB no se superpongan (por
ejemplo, FAB en esquina inferior derecha *arriba* de la barra, con margen extra).

## Boceto de estilos (glass)

```css
.floating-navbar {
  position: fixed;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  z-index: 1000;
}

/* Desktop: pill centrada arriba */
@media (min-width: 992px) {
  .floating-navbar {
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    padding: 6px;
  }
}

/* Mobile: tab-bar abajo, ancho completo con márgenes */
@media (max-width: 991.98px) {
  .floating-navbar {
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: flex;
    justify-content: space-around;
    padding: 8px 4px;
    border-radius: 28px;
  }
}

.floating-navbar-item.active {
  background: rgba(255, 255, 255, 0.22);
}
```

Sobre fondos claros (varias páginas usan `#FAFBFF` o `rgba(106,136,153,0.08)`) el
contraste del glass blanco puede quedar débil. Alternativa: usar un glass oscuro
(`rgba(15,24,32,0.55)` + blur), que es lo que ya usa `Home.jsx` de fondo y da mejor
contraste con texto blanco en cualquier página.

## Plan de implementación (cuando se apruebe)

1. Extraer `NAV_ITEMS` de `Home.jsx` a `src/config/navItems.js`.
2. Crear `src/components/FloatingNavbar.jsx` + CSS (glass, responsive, ítem activo
   con `useLocation`).
3. Montar `<FloatingNavbar />` una sola vez en `App.jsx`, fuera de `<Routes>`.
4. Quitar los `<Navbar />` sueltos de cada ruta.
5. Sumar padding de despeje (top en desktop, bottom en mobile) al contenedor de
   cada página.
6. Ajustar posición del `FabGeneral` en mobile para que no choque con la tab-bar.
7. Probar en Chrome mobile emulation (375px) y desktop (1280px), light/dark del
   fondo de cada página.

## Alcance de este documento

Este README es solo la propuesta de diseño/arquitectura. Todavía no se tocó código;
se implementa en un paso siguiente una vez confirmado el enfoque (por ejemplo, si
se prefiere navbar arriba también en mobile, o glass claro vs. oscuro).
