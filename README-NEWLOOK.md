# NEWLOOK — Guía de Nueva Estética para Mi Reparto

Este documento registra las decisiones de diseño tomadas en la sesión del 13/06/2026 y sirve como base y referencia para ir rediseñando el resto de la app con coherencia visual.

---

## Filosofía general

El rediseño se basa en tres principios:

1. **Familiaridad nativa** — Tomar como referencia los patrones de UI de iOS/macOS (Apple HIG) y apps modernas como Linear, Stripe y Notion. Controles que el usuario ya conoce intuitivamente.
2. **Mínimo ruido visual** — Reducir bordes, colores de fondo fuertes y sombras innecesarias. Dejar que el contenido respire.
3. **Movimiento con propósito** — Las animaciones solo existen para orientar al usuario (¿qué cambió? ¿adónde fue?), nunca como decoración pura.

---

## Paleta de colores base

> **Actualización 13/06/2026 — Steel Blue / Celeste Acero**
>
> El celeste pastel original (`#A9D6E5`) fue reemplazado progresivamente:
> primero a `#3B9ABD` (saturado), luego a `#6A8899` (azul acero grisáceo).
>
> Inspiración: Gris Ártico VW (`#A9B2BA`). El color final mezcla el azul
> de marca con un gris frío que le da profundidad y carácter automotriz —
> como usan Volvo, VW, BMW en sus catálogos. No es un celeste de guardería,
> es un acero con alma.
>
> Los tokens están definidos como variables CSS en `:root` en `src/index.css`.

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#6A8899` | Botones primarios, acentos, `borderLeft` de status |
| `--color-primary-dark` | `#506878` | Hover / pressed del primario |
| `--color-primary-soft` | `rgba(106,136,153,0.1)` | Fondos de filas, pills suaves |
| `--color-primary-border` | `rgba(106,136,153,0.3)` | Bordes sutiles, líneas de acento |
| `--color-primary-text` | `#ffffff` | Texto sobre botón primario (blanco) |
| `--color-secondary` | `#BEE3DB` | Botones secundarios |
| `--color-secondary-dark` | `#A3D2CA` | Hover de secundario |
| `--color-bg` | `#F5F7F9` | Fondo general (gris muy suave, temperatura fría) |
| `--color-text` | `#333333` | Texto principal |
| `--color-text-muted` | `#6c757d` | Texto secundario / inactivo |
| `--color-card-bg` | `#ffffff` | Fondo de cards |
| `--color-slider-bg` | `#e9ecef` | Fondo del segmented control |
| `--color-warning` | `#FFD166` | Alertas / advertencias |

**Acento de texto oscuro (no sobre botón):** `#3a5060` — usado en texto sobre fondos `rgba(106,136,153,…)` y en ghost buttons.

**Regla de contraste:**
- Sobre `#6A8899` sólido → texto **blanco** (`#ffffff`)
- Sobre `rgba(106,136,153,0.07–0.15)` → texto `#3a5060`
- Sobre fondo blanco con borde acero → texto `#3a5060`

---

## Componentes rediseñados

### 1. Segmented Control (filtros de fecha)

**Dónde:** `SaldoClientes.jsx` → sección "Clientes Guardados"

**Antes:** Botones Bootstrap sueltos (`btn btn-sm btn-outline-primary`) con `flex-wrap`.

**Ahora:** Un contenedor pill con fondo gris (`#e9ecef`) y un indicador blanco absolutamente posicionado que se desliza al cambiar de opción.

#### Anatomía del componente

```
┌─────────────────────────────────────────────────────┐  ← contenedor gris, border-radius: 10px, padding: 3px
│ ┌───────┐                                           │
│ │ Hoy   │  Semana   Mes   Año   📅   Todos          │  ← slider blanco sigue al activo
│ └───────┘                                           │
└─────────────────────────────────────────────────────┘
```

#### Estilos clave del contenedor

```jsx
{
  position: 'relative',
  display: 'flex',
  background: '#e9ecef',
  borderRadius: '10px',
  padding: '3px',
  gap: '2px',
}
```

#### Estilos del slider (div absolutamente posicionado)

```jsx
{
  position: 'absolute',
  top: '3px',
  bottom: '3px',
  left: sliderStyle.left + 'px',   // ← calculado con getBoundingClientRect()
  width: sliderStyle.width + 'px', // ← calculado con getBoundingClientRect()
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
  transition: 'left 0.22s cubic-bezier(.4,0,.2,1), width 0.22s cubic-bezier(.4,0,.2,1)',
  pointerEvents: 'none',
  zIndex: 0,
}
```

#### Estilos de cada botón

```jsx
{
  position: 'relative',
  zIndex: 1,                        // ← sobre el slider
  flex: 1,
  border: 'none',
  borderRadius: '8px',
  padding: '5px 6px',
  fontSize: '0.75rem',
  fontWeight: activo ? 600 : 400,
  background: 'transparent',        // ← el slider da el fondo
  color: activo ? '#212529' : '#6c757d',
  transition: 'color 0.2s, font-weight 0.2s',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
```

#### Lógica de animación (React)

```jsx
const filterContainerRef = useRef(null);
const filterButtonRefs = useRef({});
const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

useEffect(() => {
  const activeBtn = filterButtonRefs.current[dateFilter];
  const container = filterContainerRef.current;
  if (activeBtn && container) {
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setSliderStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }
}, [dateFilter]);
```

> **Curva de animación:** `cubic-bezier(.4,0,.2,1)` — Es la curva estándar de Material Design ("Standard easing"). Arranca rápido y desacelera suave al final. Duración: `0.22s`.

---

### 2. Cards de cliente (`ClienteDeudorCard`)

**Dónde:** `src/components/ClienteDeudorCard.jsx`

**Antes:** Card Bootstrap estándar con `card-header` gris, badge de color plano, contenido expandible con montaje/desmontaje brusco del DOM.

**Ahora:** Card minimalista con borde izquierdo de acento, pill de monto semitransparente, chevron SVG animado y expansión con `max-height` transition.

#### Acento izquierdo como indicador de estado

En vez de un borde de color en todo el contorno o un badge de fondo sólido, el estado se comunica solo con el borde izquierdo:

```jsx
const accentColor = esAFavor ? '#28a745' : '#dc3545';

style={{
  borderRadius: '12px',
  background: 'white',
  borderLeft: `3px solid ${accentColor}`,
  boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
  // sin border en los otros 3 lados
}}
```

> **Regla:** El borde izquierdo de acento es el patrón estándar para comunicar estado en cards de esta app. Verde = a favor / positivo, Rojo = deuda / negativo, Azul = informativo.

#### Pill de monto con fondo semitransparente

En vez de badge Bootstrap (`bg-success`, `bg-danger`), el monto usa un pill con fondo de color con baja opacidad:

```jsx
const amountBg    = esAFavor ? 'rgba(40,167,69,0.1)'  : 'rgba(220,53,69,0.1)';
const amountColor = esAFavor ? '#1a5c2a'               : '#8b1c26';

style={{
  background: amountBg,
  color: amountColor,
  fontWeight: 700,
  fontSize: '0.8rem',
  padding: '3px 10px',
  borderRadius: '999px',
}}
```

> **Regla:** Los pills de monto/estado usan `rgba` con 8–12% de opacidad del color base. Nunca colores opacos en el fondo de un pill dentro de una card.

#### Chevron SVG animado por rotación

Siempre usar SVG inline en vez de `<i class="fas fa-chevron-up/down">`. La animación es rotación, no intercambio de ícono:

```jsx
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
  style={{
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
  }}>
  <polyline points="6 9 12 15 18 9" />
</svg>
```

> **Regla:** Todo ícono que indique dirección u orientación usa `transform: rotate()` con `cubic-bezier(.4,0,.2,1)` en lugar de cambiar de clase.

#### Expansión con `max-height` transition

En vez de montar/desmontar el DOM con `{isExpanded && <div>...</div>}`, el contenido siempre existe pero su altura va de `0` a un valor máximo generoso:

```jsx
<div style={{
  maxHeight: isExpanded ? '700px' : '0px',
  overflow: 'hidden',
  transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)',
}}>
  {/* contenido */}
</div>
```

> **Regla:** Usar `max-height` transition para collapsibles simples. El valor máximo debe ser generoso (2–3x el alto real esperado) para que la animación no se corte. No usar `height` porque requiere JS para medir el contenido.

> **Limitación conocida:** La curva de animación se ve levemente diferente al colapsar (desacelera al inicio). Si en el futuro se necesita curva simétrica, considerar la Web Animations API o una librería como Framer Motion.

#### Filas de transacciones como pills de fondo sutil

Cada tipo de transacción tiene su propia combinación de fondo + texto:

| Tipo | Fondo | Color texto |
|---|---|---|
| Boleta / Venta | `rgba(255,209,102,0.12)` | `#e6a817` |
| Plata a favor / Efectivo | `rgba(40,167,69,0.08)` | `#28a745` |
| Cheque | `rgba(23,162,184,0.08)` | `#17a2b8` |
| Transferencia | `rgba(108,117,125,0.08)` | `#6c757d` |

> **Regla:** Los fondos de filas/pills de datos usan opacidades de 8–12%. Si dos categorías comparten significado (ej. "pagos recibidos"), pueden compartir el mismo color.

#### Sub-secciones con caja gris redondeada

Los grupos de datos relacionados (subtotales) se agrupan en un contenedor gris suave, sin borde:

```jsx
style={{
  background: '#f8f9fa',
  borderRadius: '8px',
  padding: '10px 12px',
}}
```

> **Regla:** Para agrupar datos sin agregar ruido visual, usar `background: #f8f9fa` con `border-radius: 8px`. No usar `border` ni `card` anidada.

#### Labels de sección en uppercase pequeño

Los títulos de grupos internos (ej. "Detalle de Transacciones") usan uppercase con letter-spacing, no `<h6>` ni negrita grande:

```jsx
style={{
  fontSize: '0.68rem',
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}}
```

> **Regla:** Los labels de sección dentro de cards usan `0.68rem`, uppercase, `#9ca3af` (gris claro). Reservar `<h6>` y negrita oscura para títulos de card de primer nivel.

#### Botones de acción ghost con borde de color

Los botones de acción dentro de cards no tienen relleno. Solo borde del color correspondiente:

```jsx
style={{
  flex: 1,
  border: `1px solid ${borderColor}`,
  borderRadius: '8px',
  padding: '6px 10px',
  background: 'transparent',
  color,
  fontSize: '0.78rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
}}
```

> **Regla actualizada (reemplaza la anterior):** Los botones de acción **dentro de cards** son siempre ghost (sin fondo). Los botones de acción primaria **fuera de cards** (ej. "Calcular Saldo") conservan fondo de color.

#### Mostrar condicional de filas de datos

Si un subtotal es 0, su fila no se renderiza. Evitar mostrar `$0,00` en múltiples campos:

```jsx
{(totalChequeAmount + totalEfectivoAmount + totalTransAmount > 0) && (
  <div>... fila de cheques/efectivo/transferencias ...</div>
)}
```

> **Regla:** No mostrar filas de datos que sean todas cero. Verificar la suma del grupo antes de renderizar. Reduce el ruido y ayuda al usuario a enfocarse en lo relevante.

---

### 3. Status indicator (estado de conexión / estado de proceso)

**Dónde:** `SaldoClientes.jsx` → card "Estado de Conexión"

**Antes:** Card Bootstrap con `<h6>`, badge de color sólido, texto con `<br />` entre líneas.

**Ahora:** Card minimalista sin título, con dot de estado + halo de color, dos líneas de texto jerarquizadas.

#### Anatomía

```
┌──────────────────────────────────────────────┐  ← borderLeft: 3px solid <accentColor>
│  ●  Firebase conectado                        │  ← dot 8px + halo rgba + título 0.78rem 600
│     134 saldos guardados                      │  ← subtítulo 0.68rem #9ca3af
└──────────────────────────────────────────────┘
```

#### Colores por estado

| Estado | Borde izquierdo | Dot | Halo del dot |
|---|---|---|---|
| Cargando | `#6c757d` | `#adb5bd` | ninguno |
| Error | `#dc3545` | `#dc3545` | `rgba(220,53,69,0.15)` |
| Conectado | `#28a745` | `#28a745` | `rgba(40,167,69,0.15)` |

#### Estilos del dot

```jsx
style={{
  width: '8px', height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
  background: dotColor,
  boxShadow: '0 0 0 3px rgba(40,167,69,0.15)', // halo verde si conectado
}}
```

> **Regla:** Los indicadores de estado (conexión, proceso, sync) usan este patrón de dot + halo en vez de badges Bootstrap o emojis (🟢❌). El borde izquierdo de la card refleja el mismo color que el dot.

> **Regla:** Los status indicators no tienen título `<h6>`. El primer renglón es el estado en sí (bold 0.78rem), el segundo renglón es el detalle (0.68rem, `#9ca3af`).

> **Regla:** El texto del status siempre es dinámico y pluraliza correctamente: `{n} {n === 1 ? 'saldo guardado' : 'saldos guardados'}`.

---

### 4. Layout de dos columnas (desktop)

**Dónde:** `SaldoClientes.jsx` → `div.row`

**Antes:** Columna derecha con altura fija limitada por `maxHeight: '400px'` en la lista → doble scroll.

**Ahora:**

- `div.row` tiene `align-items-stretch` → ambas columnas tienen la misma altura.
- Columna derecha tiene clase `clientes-sidebar` → `display: flex; flex-direction: column`.
- Card "Clientes Guardados" tiene clase `clientes-guardados-card` → `flex: 1; display: flex; flex-direction: column; min-height: 0`.
- Lista interna tiene clase `clientes-list-scroll` → `flex: 1; overflow-y: auto; min-height: 80px`.

**En mobile (< 992px):** la lista tiene `max-height: 50vh` para no ocupar toda la pantalla.

Clases CSS en `index.css`:

```css
.clientes-sidebar {
  display: flex;
  flex-direction: column;
}

.clientes-guardados-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.clientes-list-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 80px;
}

@media (max-width: 991.98px) {
  .clientes-list-scroll {
    flex: none;
    max-height: 50vh;
  }
}
```

---

## Reglas para rediseñar otros componentes

Cuando el usuario pida rediseñar algún elemento, seguir estas guías:

### Botones

- **Primario:** `background: #A9D6E5`, texto oscuro, `border-radius: 8px`, hover con `translateY(-1px)`.
- **Secundario:** `background: #BEE3DB`, mismo radio, mismo hover.
- **Peligro/eliminar:** conservar Bootstrap `btn-danger`.
- **Grupos de opciones excluyentes:** usar Segmented Control (ver arriba), no botones sueltos.

### Cards

- `border: none`, `border-radius: 12px`, `box-shadow: 0 4px 8px rgba(0,0,0,0.1)`.
- Hover: `box-shadow: 0 6px 12px rgba(0,0,0,0.15)` (ya en `index.css`).
- No usar `border` de color como indicador de estado; preferir un acento izquierdo (`border-left: 3px solid <color>`) o un badge.

### Animaciones

| Tipo | Duración | Curva |
|---|---|---|
| Slider / posición | `0.22s` | `cubic-bezier(.4,0,.2,1)` |
| Hover botones | `0.3s` | `ease` |
| Aparición de elementos | `0.5s` | `ease-in-out` (clase `.fade-in`) |
| Desaparición | `0.3s` | `ease-out` (clase `.fade-out`) |

- Nunca animar `width` o `height` directamente sobre muchos elementos → preferir `transform` y `opacity`.
- Las animaciones de layout (mover el slider) usan `left` + `width` porque son valores calculados con JS; aceptable solo en este patrón específico.

### Tipografía

- **Fuente:** Montserrat (ya importada).
- **Pesos usados:** 300 (light), 400 (regular), 700 (bold). Para énfasis de labels activos usar `font-weight: 600`.
- **Tamaños en controles compactos:** `0.75rem` (labels de filtros, badges), `0.8rem` (texto secundario en cards).

### Inputs y selects

- `border-radius: 8px`, `border: 1px solid #ced4da`.
- Focus: `border-color: #A9D6E5`, `box-shadow: 0 0 0 0.2rem rgba(169,214,229,0.25)`.
- Para filtros con pocas opciones → Segmented Control.
- Para filtros con muchas opciones (> 6) → `<select>` con `border-radius: 20px`.

---

---

### 5. Formulario de datos (`SaldoClientes` — form principal)

**Dónde:** `SaldoClientes.jsx` → `div.col-lg-7`

**Antes:** Card Bootstrap con `<h4>` por cada sección, checkboxes nativos, botones `btn btn-link` para eliminar, botones grandes con fontSize inline.

**Ahora:** Card sin clases Bootstrap, secciones separadas por línea horizontal con label uppercase, toggles tipo switch animados, botones ghost con borde dashed para "agregar", botones primarios redondeados con estado deshabilitado visual.

#### Sección con separador horizontal (`FormSection`)

Patrón para agrupar campos relacionados dentro de un formulario. Reemplaza los `<h4>` de Bootstrap:

```jsx
const FormSection = ({ label, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
    </div>
    {children}
  </div>
);
```

> **Regla:** Los formularios usan `FormSection` con label uppercase + línea divisora gris (`#f3f4f6`) en vez de `<h4>` o `<h5>`. Nunca usar `<hr>` solo.

#### Toggle switch animado (`ToggleRow`)

Reemplaza los checkboxes nativos de Bootstrap para opciones que activan/desactivan una sección:

```jsx
// Pill exterior
{ width: '36px', height: '20px', borderRadius: '10px',
  background: checked ? '#A9D6E5' : '#dee2e6',
  transition: 'background 0.2s' }

// Dot interior (se mueve)
{ width: '16px', height: '16px', borderRadius: '50%', background: 'white',
  position: 'absolute', top: '2px',
  left: checked ? '18px' : '2px',
  transition: 'left 0.2s cubic-bezier(.4,0,.2,1)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
```

> **Regla:** Los checkboxes que activan/desactivan secciones del formulario se reemplazan por toggles switch. El color activo usa `#A9D6E5` (primario de la app). El dot usa la misma curva `cubic-bezier(.4,0,.2,1)`.

> **Nota:** El `onClick` va en el contenedor padre para que toda la fila sea clickeable, no solo el toggle.

#### Botón de agregar con borde dashed (`AddBtn`)

Para acciones de "agregar ítem a una lista". Visualmente secundario, no compite con las acciones primarias:

```jsx
style={{
  border: '1px dashed #dee2e6',
  borderRadius: '8px',
  padding: '5px 12px',
  background: 'transparent',
  color: '#6c757d',
  fontSize: '0.75rem',
  cursor: 'pointer',
}}
```

> **Regla:** Los botones de "agregar ítem" dentro de formularios usan borde dashed gris. Los botones de acción principal (fuera de formularios o al final) usan borde sólido o fondo de color.

#### Botón de eliminar inline (`RemoveBtn`)

Botón `×` sin borde ni fondo, color rojo, para eliminar filas de una lista:

```jsx
style={{
  border: 'none', background: 'transparent',
  color: '#dc3545', fontSize: '1.1rem',
  cursor: 'pointer', padding: '0 4px', lineHeight: 1,
}}
```

> **Regla:** Los botones de eliminar inline en listas de filas son siempre `×` sin borde/fondo, `color: #dc3545`. No usar `btn btn-link text-danger`.

#### Estado deshabilitado visual en botones primarios

En vez de usar el atributo `disabled` solo (que aplica estilos del navegador), se controla el color manualmente para coherencia:

```jsx
style={{
  background: !habilitado ? '#e9ecef' : '#28a745',
  color: !habilitado ? '#9ca3af' : 'white',
  cursor: !habilitado ? 'not-allowed' : 'pointer',
}}
```

> **Regla:** Los botones primarios con estado deshabilitado usan `background: #e9ecef`, `color: #9ca3af`, `cursor: not-allowed`. No depender del estilo por defecto del navegador para `disabled`.

#### Drag-and-drop feedback sin borde Bootstrap

El área de drop usa borde dashed con el color primario de la app en vez de `border: 2px dashed #0d6efd`:

```jsx
border: isDragOver ? '2px dashed #A9D6E5' : '2px solid transparent',
background: isDragOver ? '#f0f8ff' : 'white',
transition: 'border 0.2s, box-shadow 0.2s',
```

> **Regla:** Las zonas de drag-and-drop usan `border: 2px dashed #A9D6E5` al activarse. En reposo, el borde es `transparent` (no visible) para no agregar ruido.

---

---

### 6. Modal de edición (`EditClienteModal`)

**Dónde:** `src/components/EditClienteModal.jsx`

**Antes:** `modal-dialog modal-lg` Bootstrap con `modal-header` gris, `modal-footer` plano, body con `maxHeight: 70vh`.

**Ahora:** Panel flotante posicionado con `transform: translate(-50%, -50%)`, overlay con `backdropFilter: blur`, header/footer con separadores finos, balance en tiempo real con caja gris + acento izquierdo dinámico.

#### Estructura del modal sin Bootstrap

```jsx
<>
  {/* Overlay — cierra al clickear fuera */}
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(2px)',
    zIndex: 1050,
  }} />

  {/* Panel */}
  <div style={{
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(640px, 95vw)',
    maxHeight: '90vh',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
    zIndex: 1051,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}>
    {/* header | body scrolleable | footer */}
  </div>
</>
```

> **Regla:** Los modales no usan clases Bootstrap `modal-dialog`. Se posicionan con `fixed + transform: translate(-50%, -50%)`. El overlay siempre tiene `backdropFilter: blur(2px)` y cierra al clickear fuera. `borderRadius: 16px` para modales (vs `12px` de cards normales).

> **Regla:** El body del modal usa `flex: 1; overflow-y: auto` para que header y footer sean siempre visibles y solo el contenido scrollee.

#### Header del modal sin título grande

El header tiene dos líneas: un label uppercase como categoría y el nombre del objeto como título:

```jsx
<div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6' }}>
  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
    Editar cliente   {/* ← categoría */}
  </div>
  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
    {cliente?.nombreCliente}   {/* ← nombre del objeto */}
  </div>
</div>
```

> **Regla:** El header de modal sigue el mismo patrón que los status indicators: label uppercase gris (categoría) + texto principal en bold (nombre del objeto). Sin `<h5>` ni fondo de color.

#### Botón de cierre circular

```jsx
<button style={{
  border: 'none', background: '#f3f4f6', borderRadius: '50%',
  width: '32px', height: '32px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1rem', color: '#6c757d',
}}>✕</button>
```

> **Regla:** El botón de cierre de modales es circular, `background: #f3f4f6`, ícono `✕` (no `btn-close` de Bootstrap).

#### Footer con botón cancelar ghost + guardar primario

```jsx
<div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px' }}>
  <button style={{ flex: 1, border: '1px solid #dee2e6', background: 'transparent',
    color: '#6c757d', borderRadius: '10px', fontWeight: 600 }}>
    Cancelar
  </button>
  <button style={{ flex: 2, border: 'none', background: '#A9D6E5',
    color: '#1a3a45', borderRadius: '10px', fontWeight: 700 }}>
    Guardar Cambios
  </button>
</div>
```

> **Regla:** El footer del modal siempre tiene dos botones en `flex`: Cancelar (`flex:1`, ghost) y la acción principal (`flex:2`, fondo primario). Ratio 1:2 para dar peso visual a la acción principal.

#### Balance en tiempo real dentro del modal

El resumen de balance se muestra con actualización en vivo mientras el usuario edita, usando la misma caja gris con acento izquierdo dinámico de los status indicators:

```jsx
<div style={{
  background: '#f8f9fa', borderRadius: '10px', padding: '14px 16px',
  borderLeft: `3px solid ${esAFavor ? '#28a745' : finalBalance < 0 ? '#dc3545' : '#dee2e6'}`,
}}>
  {/* grid 2 col con boletas/pagos */}
  {/* pill de monto final */}
</div>
```

> **Regla:** Los formularios de edición que afectan un balance/total muestran el resultado en tiempo real al final del body, antes del footer. Usa `borderLeft` dinámico y el pill de monto semitransparente (igual que en `ClienteDeudorCard`).

#### Sub-modales anidados

Cuando un modal necesita abrir otro (ej. seleccionar mercadería), el sub-modal usa `zIndex` superior (`1060/1061`) y `borderRadius: 14px` (ligeramente menor que el modal principal de `16px`):

```jsx
// Overlay sub-modal
{ zIndex: 1060 }

// Panel sub-modal
{ borderRadius: '14px', zIndex: 1061 }
```

> **Regla:** Los sub-modales tienen `borderRadius` 2px menor que el modal que los contiene. Los z-index van en incrementos de 10 por nivel de anidamiento (1050 → 1060 → 1070...).

---

## Próximos candidatos a rediseñar

En orden de impacto visual sugerido:

1. ~~**Cards de cliente expandidas** (`ClienteDeudorCard`) — layout interno de los datos, tipografía de montos.~~ ✅ Hecho
2. ~~**Botones de acción en las cards** (Editar, Eliminar, Imprimir) — reemplazar por icon buttons con tooltip.~~ ✅ Hecho (ghost buttons con borde)
3. ~~**Estado de conexión**~~ ✅ Hecho (dot + halo + borde izquierdo dinámico)
4. ~~**Formulario de Datos del Cliente**~~ ✅ Hecho (FormSection, ToggleRow, AddBtn, RemoveBtn, botones primarios con estado)
4. **Navbar** — ya tiene estilos propios; candidato a un rediseño mobile-first.
5. ~~**Modales** (edición)~~ ✅ Hecho — overlay blur, panel `borderRadius: 16px`, header con label uppercase, footer 1:2, balance en tiempo real, sub-modal anidado.
6. ~~**Modal de mercadería** en `SaldoClientes.jsx`~~ ✅ Hecho — mismo patrón de modal: overlay blur, panel `borderRadius: 16px`, header label+nombre, fila de boleta con `borderLeft` dinámico por estado (vinculada/pagada/libre), footer botón ancho completo.
7. ~~**Modal de impresión** (`PrintDocument`)~~ ✅ Hecho — mismo shell de modal, segmented control para ancho, indicadores de scroll como pills semitransparentes sticky.
8. **Navbar** — rediseño mobile-first pendiente.

---

### Patrón adicional: Indicadores de scroll dentro de body scrolleable

Cuando un modal o panel tiene `overflow-y: auto` y el contenido puede ser más largo que la altura visible, se usan indicadores `sticky` con backdrop-filter:

```jsx
{/* Arriba — aparece cuando scrollTop > 10 */}
{showTopIndicator && (
  <div style={{
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', justifyContent: 'center',
    pointerEvents: 'none',
  }}>
    <span style={{
      background: 'rgba(169,214,229,0.9)',
      color: '#1a3a45', fontSize: '0.7rem', fontWeight: 600,
      padding: '3px 12px', borderRadius: '999px',
      backdropFilter: 'blur(4px)',
    }}>↑ más arriba</span>
  </div>
)}

{/* Abajo — aparece cuando no se llegó al final */}
{showBottomIndicator && (
  <div style={{
    position: 'sticky', bottom: 0, zIndex: 10,
    display: 'flex', justifyContent: 'center',
    pointerEvents: 'none',
  }}>
    <span style={{ /* mismo estilo */ }}>↓ hay más abajo</span>
  </div>
)}
```

La lógica de detección va en un `useEffect` con listener de `scroll`:

```jsx
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = ref.current;
  setShowTopIndicator(scrollTop > 10);
  setShowBottomIndicator(scrollTop < scrollHeight - clientHeight - 10);
};
ref.current.addEventListener('scroll', handleScroll);
handleScroll(); // estado inicial
```

> **Regla:** Los indicadores de scroll usan `position: sticky` (no `absolute`) para que siempre estén visibles en el borde del área scrolleable. Color `rgba(169,214,229,0.9)` con `backdropFilter: blur(4px)` para que no tapen el contenido. `pointerEvents: none` para que no bloqueen el scroll.
