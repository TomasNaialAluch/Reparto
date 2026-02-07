# Navegación por teclado en Mercadería (Gestión Semanal)

**Fecha:** 7 de febrero de 2025

## Qué se hizo

En la pestaña **Mercadería** de **Gestión Semanal** se agregó:

1. **Enter = "Agregar Entrada"**  
   Al presionar **Enter** dentro del formulario "Agregar Mercadería (Carne)" (en día, proveedor o en cualquier input de Kg/$/Kg de cortes), se ejecuta la misma acción que el botón verde **"✅ Agregar Entrada"**.

2. **Flechas para moverse entre cards de cortes**  
   Con el foco en cualquier input de una card (Kg o $/Kg):
   - **Flecha derecha** o **Flecha abajo:** pasa al **primer input (Kg)** de la **siguiente** card. En la última card, el foco va al botón "Agregar Entrada".
   - **Flecha izquierda** o **Flecha arriba:** pasa al **primer input (Kg)** de la **card anterior**.

Así se puede cargar mercadería usando solo teclado: Tab para Kg → $/Kg → siguiente card, flechas para saltar entre cards y Enter para confirmar.

---

## Dónde está el código

- **Archivo:** `src/components/gestionSemanal/MercaderiaTab.jsx`

---

## Cómo se implementó

### Refs agregados

- **`corteInputRefs`** (`useRef([])`): array donde cada posición `i` es `[refKg, refPrecio]` de la card del corte `i` (según el orden de `ordenCortesPorUso`). Se usan para mover el foco con las flechas.
- **`nuevoCorteInputRef`**: ref del input "Nombre del nuevo corte". Si el foco está ahí, **Enter** no dispara "Agregar Entrada" (sigue agregando el nuevo corte).
- **`agregarEntradaBtnRef`**: ref del botón "Agregar Entrada". Se usa para llevar el foco ahí al bajar/flecha-derecha desde la última card, y para no duplicar la acción al presionar Enter sobre el botón.
- **`formAgregarRef`**: ref del `div.card-body` del formulario "Agregar Mercadería", donde se registra el `onKeyDown`.

### Asignación de refs en el JSX

- El `card-body` del card "Agregar Mercadería (Carne)" tiene `ref={formAgregarRef}` y `onKeyDown={handleFormKeyDown}`.
- El input del nombre del nuevo corte tiene `ref={nuevoCorteInputRef}`.
- En el `map` de `ordenCortesPorUso` se usa el **índice** `index`; antes de cada card se asegura `corteInputRefs.current[index] = [null, null]`.
- El input **Kg** de cada card: `ref={(el) => { corteInputRefs.current[index][0] = el; }}`.
- El input **$/Kg** de cada card: `ref={(el) => { corteInputRefs.current[index][1] = el; }}`.
- El botón "Agregar Entrada" tiene `ref={agregarEntradaBtnRef}` y `type="button"` (para que Enter en el formulario no lo dispare por defecto de otra forma).

### Función `handleFormKeyDown`

- **Enter:**  
  - No hace nada si el foco está en `nuevoCorteInputRef.current` o en `agregarEntradaBtnRef.current`.  
  - No hace nada si el `target` es un `BUTTON` distinto del de "Agregar Entrada" (para no interferir con proveedor, "Agregar Corte", etc.).  
  - En el resto de los casos: `e.preventDefault()` y `handleAgregarMercaderia()`.

- **ArrowRight / ArrowDown:**  
  - Se busca el índice de la card actual recorriendo `corteInputRefs.current` y comparando `document.activeElement` con cada `pair[0]` y `pair[1]`.  
  - Si hay siguiente card: se hace focus en `corteInputRefs.current[currentIndex + 1][0]`.  
  - Si es la última card: focus en `agregarEntradaBtnRef.current`.  
  - `e.preventDefault()` para que el navegador no mueva el foco por su cuenta.

- **ArrowLeft / ArrowUp:**  
  - Mismo criterio para la card actual.  
  - Si `currentIndex > 0`, focus en `corteInputRefs.current[currentIndex - 1][0]`.  
  - `e.preventDefault()`.

---

## Si algo falla al probar

- **Enter no agrega la entrada:** Revisar que el foco esté dentro del `card-body` del formulario (no en otro tab o en el modal de proveedores) y que no esté en el input "Nombre del nuevo corte" ni en otro botón.
- **Enter agrega el corte y además la entrada:** El input del nuevo corte debe tener `ref={nuevoCorteInputRef}` y en `handleFormKeyDown` debe estar el `if (target === nuevoCorteInputRef.current) return` para Enter.
- **Las flechas no mueven el foco:** Comprobar que `ordenCortesPorUso.map((corte, index) => ...)` use `index` y que los refs se asignen con `corteInputRefs.current[index][0]` y `[1]`. Que no haya otro `onKeyDown` que haga `stopPropagation()` en esos inputs.
- **Al bajar desde la última card no pasa al botón:** Verificar que `agregarEntradaBtnRef` esté asignado al botón "Agregar Entrada" y que en la rama `arrowNext` del handler se llame a `agregarEntradaBtnRef.current.focus()` cuando `currentIndex === n - 1`.

---

## Resumen de archivos tocados

- `src/components/gestionSemanal/MercaderiaTab.jsx`: refs, `handleFormKeyDown`, refs y `onKeyDown` en el JSX del formulario de agregar mercadería.
