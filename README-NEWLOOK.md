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

> **Actualización 17/06/2026 — patrón superseded:** El slider manual con `getBoundingClientRect` (documentado abajo) quedó **obsoleto**. El estándar actual es el **bloque gris unificado** filtros + lista con `motion.div` + `layoutId` (secciones 2–3 GS, secciones 13–15). Sin opción **Todos** en listas guardadas (riesgo de carga masiva). Filtro por defecto: **Semana**.

**Dónde (histórico):** `SaldoClientes.jsx` → sección "Clientes Guardados"

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
9. ~~**Página Mi Reparto** (`MiReparto.jsx` + sidebar)~~ ✅ Hecho — íconos SVG, contraste, bloque gris unificado filtros+lista, títulos con día de semana, altura de lista alineada a Deudores. Ver sección 13.
10. ~~**Página Saldo Clientes** (`SaldoClientes.jsx` + `ClienteDeudorCard` + `EditClienteModal`)~~ ✅ Hecho — alineación completa con GS/Mi Reparto: fondo tinte, bloque filtros+lista, sin "Todos", íconos SVG, cards flat, `.saldo-clientes-page`, altura de lista alineada a columna izquierda. Ver sección 14.
11. ~~**Página Transferencias** (`Transferencias.jsx` + `TransferenciaCard` + `EditTransferenciaModal`)~~ ✅ Hecho — mismo paquete que Saldo Clientes: fondo tinte, bloque filtros+lista con `layoutId="transferencias-filter-indicator"`, filtros de fecha unificados, íconos SVG, cards flat, `.transferencias-page`, altura de lista con ancla de contenido izquierdo. Ver sección 15.

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

---

## Gestión Semanal — Rediseño del Segmented Control + Contenido (17/06/2026)

### Contexto

La página `GestionSemanal.jsx` es el corazón de la app. Las pestañas (Mercadería, Embutidos, Empleados, Gastos, Clientes, Pagos Proveedores) se rediseñaron para funcionar como una unidad visual cohesiva en lugar de un selector flotante desconectado del contenido.

---

### 1. Fondo de página con tinte de marca

El fondo de la ruta `/gestion-semanal` usa un tinte muy sutil del color primario sobre blanco:

```jsx
// App.jsx
<div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh' }}>
```

> **Regla:** El fondo de página de Gestión Semanal **no** es blanco puro (`#FAFBFF`) sino `rgba(106,136,153,0.08)` — suficiente para dar temperatura fría sin competir con el contenido. Esto permite que el bloque de tabs/contenido destaque sobre el fondo. La misma regla aplica a **`/saldo-clientes`**, **`/transferencias`**, **`/mi-reparto`**, **`/reparto`** y **`/balance`** (ver secciones 13–15).

---

### 2. Bloque unificado: tabs + contenido en un solo contenedor gris

En lugar de que la barra de pestañas y el contenido sean elementos separados, ambos están envueltos en un único contenedor gris:

```jsx
<div style={{ background: '#e9ecef', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>

  {/* Fila de pestañas */}
  <div style={{ overflowX: 'auto' }}>
    <div style={{ display: 'flex', gap: '4px', width: 'max-content', minWidth: '100%' }}>
      {/* botones de tab */}
    </div>
  </div>

  {/* Área de contenido */}
  <div style={{ background: 'white', borderRadius: '0 0 9px 9px', padding: '16px', overflow: 'hidden' }}>
    {/* contenido del tab activo */}
  </div>

</div>
```

El gris `#e9ecef` (mismo token `--color-slider-bg`) actúa como "marco" que unifica tabs y contenido visualmente. El contenido tiene fondo blanco con bordes redondeados solo abajo.

> **Regla:** El bloque tabs+contenido es **un solo contenedor** con `background: #e9ecef` y `borderRadius: 12px`. No hay `marginBottom` entre la fila de tabs y el panel de contenido — el gris fluye continuo de arriba a abajo.

---

### 3. Pestaña activa sin radio en bordes inferiores

El botón activo tiene `borderRadius: '9px 9px 0 0'` para que sus esquinas inferiores empaten perfectamente con el borde superior del panel de contenido blanco:

```jsx
borderRadius: activeTab === tab.key ? '9px 9px 0 0' : '9px',
```

El panel de contenido tiene `borderRadius: '0 0 9px 9px'` — solo redondea abajo.

> **Regla:** Tab activo → radio solo arriba (`9px 9px 0 0`). Panel de contenido → radio solo abajo (`0 0 9px 9px`). Los bordes interiores se tocan sin gap, formando un bloque continuo.

---

### 4. Cards sin sombra dentro del bloque

Las cards Bootstrap (`.card`) dentro del contenido no usan `box-shadow`:

```css
/* index.css */
.card {
  border: none;
  border-radius: 12px;
  box-shadow: none;
}
.card:hover {
  box-shadow: none;
}
```

```js
/* styles.js — smooth-hover */
.smooth-hover:hover {
  transform: translateY(-2px);
  box-shadow: none;
}
```

> **Regla:** Dentro del bloque de contenido de Gestión Semanal, las cards **no tienen sombra**. El efecto hover usa solo `translateY(-2px)` sin `box-shadow`. Las sombras quedan reservadas para elementos flotantes (modales, dropdowns).

---

### 5. Indicador deslizante animado con Framer Motion (`layoutId`)

El fondo blanco del tab activo no es el `background` del botón sino un `motion.div` absolutamente posicionado con `layoutId="tab-indicator"`. Framer Motion lo anima automáticamente entre tabs:

```jsx
{activeTab === tab.key && (
  <motion.div
    layoutId="tab-indicator"
    style={{
      position: 'absolute', inset: 0,
      background: 'white',
      borderRadius: '9px 9px 0 0',
      zIndex: 0,
    }}
    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
  />
)}
```

El contenido del botón (ícono, label, badge) usa `position: relative; zIndex: 1` para quedar sobre el indicador.

> **Regla:** El indicador de tab activo es siempre un `motion.div` con `layoutId`. **Nunca** cambiar el `background` del botón directamente para lograr este efecto — el `layoutId` es lo que produce la animación de deslizamiento fluida entre pestañas. En **Mi Reparto**: `layoutId="reparto-filter-indicator"`; **Saldo Clientes**: `saldo-filter-indicator`; **Transferencias**: `transferencias-filter-indicator` (ids distintos para no colisionar). Ver secciones 13–15.

---

### 6. Animación de contenido con dirección (slide left/right)

Al cambiar de tab, el contenido entra deslizándose desde el costado correcto según la dirección del cambio:

```jsx
// Constantes fuera del componente
const TAB_KEYS = ['mercaderia', 'embutidos', 'empleados', 'gastos', 'clientes', 'pagos-proveedores'];

const contentVariants = {
  initial: (dir) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir) => ({ x: dir * -40, opacity: 0 }),
};

// Dentro del componente
const [tabDirection, setTabDirection] = useState(1);
const prevTabIndexRef = useRef(0);

const handleTabChange = (tabName) => {
  const newIndex = TAB_KEYS.indexOf(tabName);
  setTabDirection(newIndex >= prevTabIndexRef.current ? 1 : -1);
  prevTabIndexRef.current = newIndex;
  setActiveTab(tabName);
};

// En el render
<AnimatePresence mode="wait" custom={tabDirection}>
  <motion.div
    key={activeTab}
    custom={tabDirection}
    variants={contentVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
  >
    {/* contenido del tab */}
  </motion.div>
</AnimatePresence>
```

- Avanzar (derecha en la barra) → contenido entra por la derecha.
- Retroceder (izquierda en la barra) → contenido entra por la izquierda.
- `mode="wait"` asegura que el contenido anterior salga antes de que entre el nuevo.

> **Regla:** El contenido de tabs usa `AnimatePresence mode="wait"` con `custom` para pasar la dirección a las variantes. El `key` del `motion.div` es el `activeTab` para que React/Framer detecte el cambio. Desplazamiento de `40px` con `opacity` — suficiente para orientar al usuario sin ser exagerado.

---

### 7. Íconos SVG planos con `currentColor`

Los emojis de las pestañas fueron reemplazados por SVGs inline estilo Heroicons (stroke, 24×24 viewBox, `strokeWidth: 2`):

| Tab | Ícono |
|---|---|
| Mercadería | `package` — cubo con líneas de perspectiva |
| Embutidos | `layers` — polígono apilado en 3 capas |
| Empleados | `users` — dos siluetas de persona |
| Gastos | `credit-card` simplificado con línea interior |
| Clientes | `file-text` — documento con líneas |
| Pagos Proveedores | `credit-card` — rect + línea horizontal |

Todos usan `stroke="currentColor"` para heredar automáticamente el color del botón:
- Tab activo → `color: #212529` → ícono oscuro
- Tab inactivo → `color: #6c757d` → ícono gris

```jsx
icon: (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* paths del ícono */}
  </svg>
),
```

> **Regla:** Todos los íconos de tabs (y en general de la app) deben ser SVG inline con `stroke="currentColor"`. **Nunca emojis** en controles de UI — los emojis no respetan el color del tema, tienen tamaño inconsistente entre plataformas y no se pueden animar. El tamaño estándar para tabs es `14×14`.

---

### 8. Capa de reskin scopeada para tabs legacy (`gs-content`)

#### Contexto

El contenido de los seis tabs (`MercaderiaTab`, `EmbutidosTab`, `EmpleadosTab`, `GastosTab`, `ClientesTab`, `PagosProveedoresTab`) está construido con Bootstrap clásico: `card-header bg-primary text-white`, `btn btn-success btn-lg`, badges sólidos (`bg-danger`), bordes de color completos (`border-primary`), tablas `table-bordered`, etc. Son miles de líneas de JSX con lógica compleja (sincronización con Firebase, cálculos de pagos, edición inline).

En lugar de reescribir cada componente con estilos inline —alto riesgo de romper la lógica— se aplicó una **capa de reskin con CSS scopeado** a un contenedor `.gs-content` que envuelve el área de contenido en `GestionSemanal.jsx`. Las reglas viven en el template string `styles` de `src/components/gestionSemanal/styles.js`, que se inyecta una sola vez vía `<style>{styles}</style>`.

```jsx
// GestionSemanal.jsx
<div className="gs-content" style={{ background: 'white', borderRadius: '0 0 9px 9px', padding: '16px', overflow: 'hidden' }}>
  {/* tabs Bootstrap legacy, sin modificar */}
</div>
```

#### Qué transforma la capa

| Elemento Bootstrap | Antes | Después (reskin) |
|---|---|---|
| `.card` | sombra, borde | `border: 1px solid #eef1f3`, sin sombra, `radius 12px` |
| `.card.border-*` | borde de color en los 4 lados | `border-left: 3px solid <semántico>` (regla de acento izquierdo) |
| `.card-header.bg-*` | fondo sólido de color + texto blanco | fondo blanco, **estilo eyebrow** (ver sección 11) — sin barra de acento |
| `.btn-primary` | azul Bootstrap `#0d6efd` | acero de marca `#6A8899` |
| `.btn:hover` | `scale(1.05)` | `translateY(-1px)` |
| `.badge.bg-*` | pill sólido de color | pill semitransparente (8–25% opacidad) + texto oscuro del mismo tono |
| `.text-primary` | azul Bootstrap | `#3a5060` (acero oscuro) |
| `.table-bordered` | bordes en todas las celdas | sin bordes, solo línea inferior `#f1f3f5`; `thead` uppercase gris `0.66rem` |
| `.alert-*` | borde + fondo Bootstrap | caja redondeada sin borde, fondo del color al 10–15% |
| `.form-control:focus` | halo azul | borde + halo acero `rgba(106,136,153,0.15)` |
| `.form-check-input:checked` | azul Bootstrap | acero de marca |
| `.form-label.fw-bold` | bold negro | uppercase `0.7rem` gris (label de campo) |

#### Mapa de acentos izquierdos por semántica (solo cards, no headers)

| Clase de card | Color acento |
|---|---|
| `border-primary` | `#6A8899` (acero, neutro/principal) |
| `border-success` | `#28a745` (positivo) |
| `border-danger` | `#dc3545` (deuda/negativo) |
| `border-warning` | `#FFD166` (alerta) |
| `border-secondary` | sin acento (solo borde sutil) |

> Nota: los **headers** de card ya no usan acento izquierdo (era repetitivo). Ver sección 11 (estilo eyebrow). El acento izquierdo se conserva solo en `.card.border-*` para comunicar estado.

#### Notas de especificidad

Bootstrap usa `!important` en utilidades como `.text-white` y `.bg-primary`. Para ganarles, las reglas de reskin usan selectores de mayor especificidad (`.gs-content .card-header.text-white`) y/o `!important`. Por eso el texto blanco de los headers originales se vuelve oscuro correctamente al cambiar el fondo a blanco.

#### Paleta de bordes (contraste calibrado)

La primera versión usaba bordes demasiado claros (`#eef1f3`, `#f1f3f5`) y al usuario le costaba distinguir las divisiones — la pantalla "cansaba el ojo". Se recalibraron a un neutro frío más presente pero todavía suave:

| Token | Hex | Uso |
|---|---|---|
| Borde de card / divisor fuerte | `#d3d9de` | contorno de cards, separador entre grupos, `thead` |
| Divisor suave | `#dde2e6` | `border-bottom` de headers, `hr`, `.border-bottom/top` |
| Divisor de fila de tabla | `#e1e5e9` | líneas entre filas (`td`) |
| Borde de input | `#ccd3d9` | `form-control`, `form-select`, `input-group-text` |

> **Regla:** Los bordes/divisores en superficies blancas usan **`#d3d9de`** (estructura) o **`#dde2e6`** (divisores suaves). Evitar valores por encima de `#e6...` para líneas estructurales: se vuelven invisibles y obligan al ojo a esforzarse. El mínimo legible sobre blanco en esta app es ~`#dde2e6`.

#### Divisor entre grupos de proveedor

En `PagosProveedoresTab`, los proveedores se separan con una línea divisoria (no solo espacio en blanco) vía la clase `gs-prov-group`:

```css
.gs-content .gs-prov-group:not(:last-child) {
  border-bottom: 1px solid #d3d9de;
  padding-bottom: 16px;
  margin-bottom: 18px;
}
```

> **Regla:** Cuando una lista repite bloques del mismo tipo (grupos por proveedor, secciones apiladas), separarlos con una línea `1px #d3d9de` + padding, no solo con margen. La línea da estructura escaneable sin agregar peso.

> **Regla:** Para modernizar pantallas legacy con mucho Bootstrap y lógica frágil, preferir una **capa de reskin CSS scopeada** a un contenedor raíz (`.gs-content`) en vez de reescribir el JSX. Mantiene intacta la funcionalidad, aplica la estética NEWLOOK de forma consistente a todos los sub-componentes de una vez, y es reversible quitando una sola clase. Las reglas se centralizan en `styles.js` y se documentan aquí.

> **Regla:** La capa de reskin **siempre** va scopeada bajo `.gs-content` (o el contenedor equivalente de la pantalla). Nunca escribir estas reglas como selectores globales, porque `styles` se inyecta en el `<head>` del documento y afectaría otras pantallas montadas.

---

### 9. Borde verde giratorio — info "siempre a la vista" (`gs-totales-glow`)

#### Contexto

Algunos datos son tan importantes que el usuario debería mirarlos siempre (ej. el card **"Totales Semanales"** de `MercaderiaTab`). Para esto se usa un borde verde que **gira alrededor** de todo el perímetro de la card — mismo lenguaje cromático que el indicador de "Firebase conectado" (`connectedPulse`), pero recorriendo todo el contorno en vez de solo el borde izquierdo.

#### Técnica: conic-gradient rotando detrás de la card

El patrón usa un wrapper con `padding` (que se convierte en el grosor del borde) y un pseudo-elemento `::before` con un `conic-gradient` que gira. La card interior se monta encima tapando el centro y dejando visible solo el anillo:

```css
.gs-totales-glow {
  position: relative;
  border-radius: 14px;
  padding: 2.5px;            /* grosor del borde animado */
  overflow: hidden;          /* recorta el gradiente gigante a las esquinas redondeadas */
  isolation: isolate;        /* contiene el z-index del ::before */
  box-shadow: 0 2px 14px rgba(40,167,69,0.16);
}
.gs-totales-glow::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 230%; height: 230%;               /* más grande que el wrapper para cubrir las esquinas al rotar */
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 0deg,
    #1f8a3a 0deg,
    #28a745 170deg,
    #8ff0ab 300deg,    /* sweep brillante que da la sensación de giro */
    #28a745 340deg,
    #1f8a3a 360deg
  );
  animation: gsTotalesSpin 3.2s linear infinite;
  z-index: -1;
}
.gs-totales-glow > .card {
  margin: 0 !important;
  border: none !important;
  border-radius: 11px !important;          /* 2-3px menos que el wrapper */
  position: relative;
  z-index: 1;
}

@keyframes gsTotalesSpin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .gs-totales-glow::before { animation: none; }   /* accesibilidad */
}
```

Uso en JSX — el wrapper toma el margen (`mt-3`); la card pierde su `border-success` porque el anillo animado reemplaza el borde estático:

```jsx
<div className="gs-totales-glow mt-3">
  <div className="card">
    <div className="card-header bg-success text-white">
      <h5 className="mb-0">Totales Semanales</h5>
    </div>
    <div className="card-body">{/* totales */}</div>
  </div>
</div>
```

> **Regla:** El borde verde giratorio (`gs-totales-glow`) se reserva para **información crítica de monitoreo permanente** (totales clave, estado de sistema). No abusar: si todo gira, nada llama la atención. El verde mantiene la asociación con "activo / OK" del status de conexión.

> **Detalle técnico:** El gradiente cónico se anima rotando un `::before` sobredimensionado (`230%`) con `transform: rotate()` en vez de animar el ángulo del `conic-gradient` directamente. Esto evita depender de `@property --angle` (soporte más limitado) y funciona con `transform`, que es acelerado por GPU. El `overflow: hidden` + `border-radius` del wrapper recorta el gradiente a la forma de la card. Siempre incluir el fallback de `prefers-reduced-motion`.

---

### 10. Set de íconos SVG compartido (`gestionSemanal/icons.jsx`)

#### Contexto

El contenido de los tabs estaba lleno de **emojis** usados como íconos de UI: `✅`/`✓` (confirmar), `✕`/`✗` (cerrar/eliminar), `✏️` (editar), `🗑️` (borrar), `➕` (agregar), `📅` (calendario), `💵`/`💰` (efectivo/dinero), `🏦` (transferencia), `📝` (cheques), `📊` (resumen), `📋` (lista), `💳` (tarjeta), `🔄` (recalcular), `⚠️` (alerta), más un `<i class="fas fa-print">` de FontAwesome. Esto viola la regla NEWLOOK de "nunca emojis en controles de UI".

#### Solución

Se centralizó un set de íconos SVG en `src/components/gestionSemanal/icons.jsx`. Todos comparten una base común (`viewBox 0 0 24 24`, `fill: none`, `stroke: currentColor`, `strokeWidth: 2`, `strokeLinecap/Linejoin: round`) y aceptan una prop `size` (default `14`):

```jsx
import { IconCheck, IconX, IconEdit, IconTrash, IconPlus } from './icons';

<button className="btn btn-success d-inline-flex align-items-center gap-2">
  <IconCheck size={16} /> Agregar Entrada
</button>
```

Íconos disponibles: `IconPlus`, `IconX`, `IconCheck`, `IconEdit`, `IconTrash`, `IconCalendar`, `IconCash`, `IconMoney`, `IconBank`, `IconCheque`, `IconChart`, `IconClipboard`, `IconCreditCard`, `IconRefresh`, `IconWarning`, `IconPrinter`, `IconUsers`, `IconBox`, `IconSettings`, `IconChevronDown`, `IconLock`, `IconHistory`, `IconEye`, `IconFilter`, `IconArrowLeft`, `IconInfo`, `IconSave`, `IconTrophy`, `IconTrendDown`, `IconDownload`, `IconInbox`.

> `IconUsers` … `IconInfo` se agregaron con **Balance Semanal** (sección 12). `IconSave`, `IconTrophy`, `IconTrendDown` con **Mi Reparto** (sección 13). `IconDownload`, `IconInbox` con **Saldo Clientes** (sección 14). Todos son de propósito general — reutilizar en futuras pantallas.

#### Mapa de reemplazo emoji → ícono

| Emoji | Ícono | Uso |
|---|---|---|
| ✅ ✓ | `IconCheck` | confirmar, guardar, pagado, completo |
| ✕ ✗ 🗑️ | `IconX` / `IconTrash` | cerrar/deseleccionar vs borrar definitivo |
| ✏️ | `IconEdit` | editar |
| ➕ + | `IconPlus` | agregar ítem |
| 📅 | `IconCalendar` | días trabajados |
| 💵 | `IconCash` | efectivo |
| 💰 | `IconMoney` | dinero/total |
| 🏦 | `IconBank` | transferencia |
| 📝 | `IconCheque` | cheques |
| 📊 | `IconChart` | resumen |
| 📋 | `IconClipboard` | seleccionar boletas |
| 💳 | `IconCreditCard` | configurar pagos |
| 🔄 | `IconRefresh` | auto-distribuir |
| ⚠️ | `IconWarning` | alertas inline |
| `fa-print` | `IconPrinter` | imprimir |
| 👨‍💼 | `IconUsers` | empleados |
| 📦 | `IconBox` | inventario |
| ⚙️ | `IconSettings` | configuración |
| 📈 📉 | `IconChevronDown` (rota 180°) | expandir / contraer |
| 🔒 | `IconLock` | cerrar semana |
| `fa-history` | `IconHistory` | historial |
| `fa-eye` | `IconEye` | ver |
| `fa-filter` | `IconFilter` | filtrar proveedores |
| `fa-arrow-left` ← | `IconArrowLeft` | volver |
| `fa-info-circle` | `IconInfo` | nota informativa |
| `fa-calendar-week` | `IconCalendar` | semana |
| `fa-check-double` | `IconCheck` | seleccionar todos |
| `fa-exclamation-triangle` | `IconWarning` | estado vacío |
| `fa-save` | `IconSave` | guardar reparto |
| 🏆 | `IconTrophy` | mejor día (reportes) |
| 📉 | `IconTrendDown` | peor día (reportes) |

> **Regla:** Los íconos que acompañan texto en botones/labels se alinean con `d-inline-flex align-items-center gap-2` (o `gap-1` para tamaños chicos). Como usan `stroke="currentColor"`, heredan el color del botón/label automáticamente y respetan los estados de la capa de reskin.

> **Regla:** Centralizar los íconos en un único módulo (`icons.jsx`) por pantalla/feature en vez de pegar SVGs inline repetidos. Garantiza consistencia de trazo, tamaño y estilo, y permite cambiar un ícono en un solo lugar.

> **Excepción documentada:** Los emojis que se pasan como **prop string** a un componente (ej. `title="⚠️ Faltan los precios"` en `ConfirmModal`) no se reemplazan por SVG porque el prop espera texto plano, no JSX. Si en el futuro `ConfirmModal` acepta un ícono como prop, migrarlos.

---

### 11. Headers de card estilo "eyebrow / overline" (kicker)

#### Contexto

La primera versión del reskin (sección 8) le daba a cada `card-header` una **barra de acento izquierdo** de color según la semántica. Al haber muchas cards en cada tab, el patrón se volvió **repetitivo**: todos los títulos se veían igual y competían visualmente con el acento izquierdo que usan las propias cards (`.card.border-*`).

Decisión: mantener las cards como están y rediseñar **solo los títulos** con una estética más moderna y silenciosa.

#### Investigación

Patrón dominante en dashboards modernos (Linear, Stripe, Notion; design systems como cladd, Create UI, Pure Admin): el **eyebrow / section kicker / overline**.

- Label en **mayúsculas**, tamaño chico (`10–12px`), con **tracking amplio** (`letter-spacing` ~`0.08–0.1em`), color **tenue**.
- Layout `flex` con `align-items: baseline/center` para anclar un chip/badge/acción a la derecha (`ml-auto`).
- Borde inferior opcional de `1px` muy sutil para separar del cuerpo, sin peso visual.
- Clave: **consistencia silenciosa** — todos los headers se leen igual y el ojo los identifica al instante en UIs densas, sin gritar.

> Fuentes: cladd `SectionTitle`, Create UI `ui-overline-*`, Pure Admin `pa-section-title`, Twill `DESIGN_SYSTEM.md` (section labels uppercase `letter-spacing: .05–.06em`).

#### Implementación (en `styles.js`, scopeada a `.gs-content`)

```css
.gs-content .card-header {
  background: #ffffff !important;
  color: #6A8899 !important;            /* acero de marca, tenue */
  border-bottom: 1px solid #f1f3f5;     /* divisor sutil */
  border-left: none !important;         /* se elimina la barra de acento repetitiva */
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 14px 16px 11px;
}
.gs-content .card-header h5,
.gs-content .card-header h6 {
  color: #6A8899 !important;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin: 0;
}
.gs-content .card-header h5 svg,
.gs-content .card-header h6 svg {
  width: 13px !important;               /* ícono proporcional al label chico */
  height: 13px !important;
  opacity: 0.85;
}
```

#### Decisiones de color

- En vez de mantener un color por semántica (que reintroduciría la repetición), **todos** los eyebrows usan el **acero de marca** `#6A8899`. Da identidad de marca, se distingue del texto del cuerpo y no compite con el acento izquierdo de las cards.
- Los íconos del header (SVG `currentColor`) heredan ese acero automáticamente y se reducen a `13px` para acompañar al label chico.

> **Regla:** Los títulos de card en pantallas densas usan el patrón **eyebrow**: mayúsculas, `0.7rem`, `font-weight 700`, `letter-spacing 0.09em`, color de marca tenue, sin barra de acento. El acento izquierdo de color se reserva para **estado** en el cuerpo de las cards (`.card.border-*`), no para los títulos. Esto evita la repetición y crea jerarquía: el título "susurra" la categoría, el contenido es el protagonista.

> **Cuidado al reskinear headers a fondo blanco:** revisar textos con `color: '#fff'` **inline** dentro de headers (ej. el "Total" del header de adelantos en `EmpleadosTab`). El blanco inline gana sobre el CSS y queda invisible sobre el nuevo fondo blanco — cambiarlo a un color legible (`#2b3a42`).

---

### 12. Balance Semanal + Historial adoptan la capa de reskin (`gs-content`)

#### Contexto

`src/pages/Balance.jsx` (que incluye el **Historial de semanas cerradas** y el modal de selección de proveedores) seguía en la estética vieja: headers de color sólido (`bg-danger text-white`, `bg-dark text-white`, etc.), emojis y FontAwesome como íconos, y la **paleta celeste antigua** (`#A9D6E5`, bordes `#007bff`) en lugar del acero de marca.

#### Solución — reutilizar la infraestructura existente, no reinventar

1. **Inyectar el mismo `styles`** de `gestionSemanal/styles.js` en la página: `import { styles } from '../components/gestionSemanal/styles'` y `<style>{styles}</style>`. Las reglas conviven sin chocar porque están scopeadas a `.gs-content`.
2. **Envolver el contenedor raíz** con la clase `gs-content` (`<div className="container-fluid ... gs-content">`). Con eso, todas las cards, headers, botones, badges, alerts, inputs, tablas y bordes heredan el reskin NEWLOOK de una sola vez — incluidos el modal y el historial, que son descendientes del contenedor.
3. **Íconos:** reemplazo de todos los emojis y FontAwesome por el set SVG compartido (sección 10), agregando los 10 íconos faltantes al módulo.
4. **Paleta:** los colores inline `#A9D6E5` → `#6A8899` (acero); los botones con estilo inline pasan a clases (`btn-primary`, etc.) para heredar el rebranding; los bordes `#007bff` del historial se eliminan en favor del `.card.border-primary` (acento izquierdo acero) del reskin.

#### Detalles

- **KPI cards** (Gastos / Empleados / Deudas / Inventario): conservan `border-*` y `bg-* text-white` en el JSX, pero el reskin convierte el header a **eyebrow** blanco con acero y deja el valor de color (rojo, ámbar, acero, gris) como protagonista. No hace falta tocar el markup de color.
- **Expandir/Contraer:** se usa un solo `IconChevronDown` envuelto en un `<span>` que rota `180°` con transición, en vez de dos emojis distintos (📈/📉).
- **Cards del historial:** el `onMouseEnter/Leave` ya no agrega `box-shadow` (la regla NEWLOOK es flat); solo queda el `translateY(-2px)`.
- **Badge `bg-info`** y **`text-info`** se sumaron al reskin (`styles.js`) mapeados al acero, porque el cyan default de Bootstrap desentona con la marca.

> **Regla:** Para pantallas legacy nuevas, el camino es **(a)** inyectar `styles`, **(b)** envolver en `.gs-content`, **(c)** cambiar emojis/FA por el set SVG, **(d)** limpiar paleta vieja inline. No reescribir la lógica ni duplicar CSS. La clase `gs-content` no es exclusiva de Gestión Semanal: es el contenedor estándar para aplicar la estética NEWLOOK a cualquier pantalla con Bootstrap legacy.

---

### 13. Mi Reparto — rediseño NEWLOOK (17/06/2026)

#### Contexto

`src/pages/MiReparto.jsx` y sus componentes (`RepartoCard`, `ClienteRow`, `EditRepartoModal`, `ReportesGraficos`, `PrintDocument` en modo reparto) tenían estética legacy: emojis y FontAwesome, cards con sombra, textos y bordes muy claros (`#9ca3af`, `#f3f4f6`), filtro de repartos guardados como segmented control aislado (pill blanco redondeado sin conectar al contenido), y títulos genéricos "Reparto DD/MM/AAAA".

A diferencia de Balance (sección 12), **Mi Reparto no usa `.gs-content`**: el markup es mayormente custom con estilos inline + clase scopeada `.reparto-page` en `index.css`. La paleta y reglas visuales son las mismas que `gs-content`.

#### Fondo de página

Rutas `/mi-reparto` y `/reparto` en `App.jsx`:

```jsx
<div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh' }}>
```

El blanco queda reservado para las cards de contenido (formulario, clientes del día, deudores, bloque de repartos guardados).

#### Íconos

Todos los controles de UI migrados a `gestionSemanal/icons.jsx` (ver sección 10). Archivos tocados: `MiReparto.jsx`, `RepartoCard.jsx`, `ClienteRow.jsx`, `EditRepartoModal.jsx`, `ReportesGraficos.jsx`, modal de impresión en `PrintDocument.jsx`.

Íconos nuevos por esta pantalla: `IconSave`, `IconTrophy`, `IconTrendDown`.

#### Contraste y cards flat

Tokens alineados con la paleta de bordes de la sección 8 (aplicados inline y en `.reparto-page`):

| Token | Uso en Mi Reparto |
|---|---|
| `#d3d9de` | borde de cards blancas |
| `#dde2e6` | divisores de sección, `border-top` |
| `#ccd3d9` | bordes de botones outline e inputs |
| `#6c757d` | labels uppercase, texto muted (antes `#9ca3af`) |
| `#8a939c` | hints secundarios (antes `#c4c9d4`) |

```css
/* index.css */
.reparto-page .form-control {
  border-color: #ccd3d9;
}
.reparto-page .form-control:focus {
  border-color: #6A8899;
  box-shadow: 0 0 0 0.2rem rgba(106, 136, 153, 0.15);
}
```

Cards: `border: 1px solid #d3d9de`, `box-shadow: none` (sin sombra en hover).

#### Bloque unificado filtros + lista (patrón Gestión Semanal)

El panel **Repartos Guardados** replica las secciones 2, 3 y 5 de Gestión Semanal:

```jsx
{/* Header "Repartos Guardados" — fuera del bloque gris */}
<div style={{ background: '#e9ecef', borderRadius: '12px', padding: '4px' }}>
  {/* Fila de filtros: Hoy | Semana | Mes | Año | 📅 */}
  {dateFilter === val && (
    <motion.div
      layoutId="reparto-filter-indicator"
      style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '9px 9px 0 0', zIndex: 0 }}
      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
    />
  )}
  {/* Contenido blanco conectado */}
  <div style={{ background: 'white', borderRadius: '0 0 9px 9px', padding: '12px' }}>
    {/* lista de RepartoCard */}
  </div>
</div>
```

> **Regla:** No implementar el filtro como barra gris **aislada** dentro de una card blanca con `borderRadius: '9px'` en el indicador. El patrón correcto es **bloque gris único** + tab activo con radio **solo arriba** + panel blanco **solo abajo**, sin gap entre ambos.

> **Anti-patrón documentado:** calcular `left`/`width` del slider con `getBoundingClientRect` + `useEffect` fue el primer intento; se reemplazó por `layoutId` de Framer Motion al unificar el bloque visual.

#### Títulos de RepartoCard — día de la semana + fecha

Helper en `src/utils/date.js`:

```js
formatDateWithWeekday('2026-06-17') // → "Miércoles 17/06/2026"
```

Usado en `RepartoCard` (título de card), `EditRepartoModal` (subtítulo) y mensaje de confirmación al eliminar. Parseo seguro sin UTC (misma lógica que `formatDateSafe`).

#### Altura de lista alineada con Deudores (desktop)

Con filtro **Año** (muchos repartos), la lista no debe extender la columna derecha infinitamente. En desktop (`≥992px`):

- `deudoresSectionRef` en la card Deudores (columna izquierda).
- `repartosListRef` en `.clientes-list-scroll`.
- `ResizeObserver` + `resize` calculan `maxHeight` = borde inferior de Deudores − tope de la lista.
- Se recalcula al cambiar filtro, expandir deudores, cantidad de clientes o tamaño de ventana.

En mobile: `max-height: 50vh` en `.clientes-list-scroll` (scroll interno).

> **Regla:** Listas laterales largas en layout de dos columnas deben **alinearse verticalmente** con el ancla de la columna opuesta (aquí: Deudores), no crecer sin límite. Preferir medición dinámica (`ResizeObserver`) sobre un `px` fijo cuando el contenido izquierdo es variable.

---

### 14. Saldo Clientes — rediseño NEWLOOK (17/06/2026)

#### Contexto

`SaldoClientes.jsx` fue el **origen** del NEWLOOK (sección 1 del README), pero quedó atrás respecto a Gestión Semanal y Mi Reparto: slider manual de filtros, opción **Todos**, FontAwesome, cards con sombra, fondo `#FAFBFF`, textos `#9ca3af`.

#### Fondo de página

Ruta `/saldo-clientes` en `App.jsx`:

```jsx
<div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh' }}>
```

#### Clase scopeada

```css
/* index.css */
.saldo-clientes-page .form-control { border-color: #ccd3d9; }
.saldo-clientes-page .form-control:focus {
  border-color: #6A8899;
  box-shadow: 0 0 0 0.2rem rgba(106, 136, 153, 0.15);
}
```

Contenedor raíz: `className="... saldo-clientes-page"`.

#### Bloque unificado Clientes Guardados

Mismo patrón que Mi Reparto (sección 13) con `layoutId="saldo-filter-indicator"`. Header eyebrow **fuera** del bloque gris. Filtros: Hoy | Semana | Mes | Año | 📅 (`IconCalendar`). **Sin "Todos"**. Default: `semana`.

#### Íconos

Migrados a `gestionSemanal/icons.jsx` en `SaldoClientes.jsx`, `ClienteDeudorCard.jsx`, `EditClienteModal.jsx`. Nuevos: `IconDownload`, `IconInbox`.

#### Cards flat y contraste

- Formulario, status Firebase, panel Gestión Semanal, `ClienteDeudorCard`: `border: 1px solid #d3d9de`, sin sombra.
- Divisores `#dde2e6`, muted `#6c757d` (reemplaza `#9ca3af`).

#### Altura de lista (desktop)

- `saldoAnchorRef` envolviendo formulario + resumen (`saldo-main-col` con `align-self: flex-start`).
- `clientesListRef` en `.clientes-list-scroll`.
- `ResizeObserver` calcula `maxHeight` = borde inferior de la columna izquierda − tope de la lista.

> **Regla:** En Saldo Clientes el ancla es el **contenido** del formulario/resumen (wrapper interno), no la columna Bootstrap estirada por flexbox — igual que en Transferencias (sección 15).

---

### 15. Transferencias — rediseño NEWLOOK (17/06/2026)

#### Contexto

`Transferencias.jsx` compartía el patrón legacy de Saldo Clientes: slider manual de filtros, FontAwesome, cards con sombra, fondo `#FAFBFF`, filtro `mes` mezclado con picker de mes, `default` devolviendo todo el histórico, y lista sin límite de altura en desktop.

#### Fondo de página

Ruta `/transferencias` en `App.jsx`:

```jsx
<div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh' }}>
```

#### Clase scopeada

```css
.transferencias-page .form-control { border-color: #ccd3d9; }
.transferencias-main-col { align-self: flex-start; }
```

#### Bloque unificado Transferencias Guardadas

`layoutId="transferencias-filter-indicator"`. Filtros: Hoy | Semana | Mes | Año | `IconCalendar` (`elegir_mes`). Default: `semana`.

#### Filtros de fecha (alineados con Saldo Clientes)

- `semana` = semana calendario (domingo–sábado), no últimos 7 días.
- `mes` = mes actual.
- `elegir_mes` = `customMonth`.
- `default` = `[]`.

#### Altura de lista (desktop)

- `transferenciasAnchorRef` envuelve formulario + resumen.
- `transferenciasListRef` en `.clientes-list-scroll`.
- `ResizeObserver` + `align-self: flex-start` en `.transferencias-main-col`.

#### Archivos

`Transferencias.jsx`, `TransferenciaCard.jsx`, `EditTransferenciaModal.jsx`, `App.jsx`, `index.css`.
