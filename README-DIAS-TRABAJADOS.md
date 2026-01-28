# 📅 Sistema de Días Trabajados - Gestión de Empleados

## ✅ **FUNCIONALIDAD IMPLEMENTADA (Diciembre 2024)**

### **Descripción:**
Sistema para registrar los días que cada empleado trabajó o faltó durante la semana, con cálculo automático de descuentos en el sueldo.

### **Características Actuales:**
- ✅ Botón discreto (📅) junto al nombre de cada empleado
- ✅ Modal para marcar días trabajados/faltados
- ✅ Cálculo automático de descuentos por faltas
- ✅ Visualización en tabla con badge de advertencia
- ✅ Integración en comprobante de impresión
- ✅ Persistencia en Firebase

---

## ⚠️ **PROBLEMA IDENTIFICADO**

### **Descripción del Problema:**
El sistema actual asume que **todos los empleados trabajan 6 días a la semana** (Lunes a Sábado). Sin embargo, hay empleados que:
- Tienen un sueldo semanal configurado
- Pero solo deben trabajar 3 días (o cualquier otra cantidad)
- El cálculo actual divide el sueldo por 6 días siempre

**Ejemplo del problema:**
- Empleado con sueldo semanal de $60,000
- Debe trabajar solo 3 días a la semana (Lunes, Miércoles, Viernes)
- Si falta 1 día, actualmente se le descuenta: $60,000 / 6 = $10,000
- **Pero debería descontarse:** $60,000 / 3 = $20,000

### **Impacto:**
- ❌ Descuentos incorrectos para empleados que trabajan menos de 6 días
- ❌ No hay flexibilidad para configurar días laborales por empleado
- ❌ El modal muestra todos los días aunque el empleado no deba trabajar algunos

---

## 🎯 **SOLUCIÓN PROPUESTA**

### **Objetivo:**
Permitir que el usuario configure **qué días debe trabajar cada empleado**, y calcular los descuentos basándose en esos días específicos.

### **Cambios Requeridos:**

#### **1. Formulario de Configuración de Empleado**

Agregar campo para seleccionar días que debe trabajar:

```jsx
// En EmpleadosTab.jsx - Formulario de configurar empleado
<div className="mb-3">
  <label className="form-label fw-bold">Días que debe trabajar:</label>
  <div className="d-flex flex-wrap gap-2">
    {DIAS_SEMANA.map(dia => (
      <div key={dia} className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={`dia-${dia}`}
          checked={formEmpleado.diasQueDebeTrabajar?.includes(dia) ?? true}
          onChange={(e) => {
            const dias = formEmpleado.diasQueDebeTrabajar || DIAS_SEMANA;
            if (e.target.checked) {
              setFormEmpleado({
                ...formEmpleado,
                diasQueDebeTrabajar: [...dias, dia]
              });
            } else {
              setFormEmpleado({
                ...formEmpleado,
                diasQueDebeTrabajar: dias.filter(d => d !== dia)
              });
            }
          }}
        />
        <label className="form-check-label" htmlFor={`dia-${dia}`}>
          {dia}
        </label>
      </div>
    ))}
  </div>
  <small className="text-muted">
    Selecciona los días que este empleado debe trabajar esta semana
  </small>
</div>
```

**Estado inicial del formulario:**
```jsx
const [formEmpleado, setFormEmpleado] = useState({
  nombre: 'Jorge',
  nombreOtro: '',
  sueldoSemanal: '',
  diasQueDebeTrabajar: DIAS_SEMANA // Por defecto todos los días
});
```

**Guardar en Firebase:**
```jsx
await gestionarEmpleado({
  nombre,
  sueldoSemanal: parseFloat(formEmpleado.sueldoSemanal),
  diasQueDebeTrabajar: formEmpleado.diasQueDebeTrabajar || DIAS_SEMANA
});
```

---

#### **2. Actualizar Función de Cálculo**

Modificar `calcularSueldoConDescuentos` para usar días que debe trabajar:

```jsx
// Función para calcular sueldo con descuentos por faltas
const calcularSueldoConDescuentos = (empleado) => {
  // Días que DEBE trabajar (configurado al agregar el empleado)
  const diasQueDebeTrabajar = empleado.diasQueDebeTrabajar || DIAS_SEMANA;
  
  // Días que REALMENTE trabajó (marcados en el modal de asistencia)
  const diasTrabajadosEmpleado = empleado.diasTrabajados || diasQueDebeTrabajar;
  
  // Días faltados: los que debía trabajar pero no trabajó
  const diasFaltados = diasQueDebeTrabajar.filter(dia => !diasTrabajadosEmpleado.includes(dia));
  
  // Sueldo por día basado en los días que DEBE trabajar
  const sueldoPorDia = empleado.sueldoSemanal / diasQueDebeTrabajar.length;
  const descuentoPorFaltas = diasFaltados.length * sueldoPorDia;
  
  return {
    sueldoOriginal: empleado.sueldoSemanal,
    diasQueDebeTrabajar,
    diasTrabajados: diasTrabajadosEmpleado,
    diasFaltados,
    descuentoPorFaltas,
    sueldoFinal: empleado.sueldoSemanal - descuentoPorFaltas
  };
};
```

**Cambio clave:**
- ❌ **Antes:** `sueldoPorDia = empleado.sueldoSemanal / DIAS_SEMANA.length` (siempre 6)
- ✅ **Ahora:** `sueldoPorDia = empleado.sueldoSemanal / diasQueDebeTrabajar.length` (configurable)

---

#### **3. Actualizar Modal de Asistencia**

Solo mostrar los días que debe trabajar:

```jsx
// En el modal de asistencia, cambiar el map:
<div className="d-flex flex-wrap gap-2">
  {(empleadoAsistencia.diasQueDebeTrabajar || DIAS_SEMANA).map(dia => {
    const estaTrabajado = diasTrabajadosTemp.includes(dia);
    return (
      <button
        key={dia}
        className={`btn ${estaTrabajado ? 'btn-success' : 'btn-danger'}`}
        onClick={() => {
          if (estaTrabajado) {
            setDiasTrabajadosTemp(prev => prev.filter(d => d !== dia));
          } else {
            setDiasTrabajadosTemp(prev => [...prev, dia]);
          }
        }}
      >
        {dia} {estaTrabajado ? '✓' : '✕'}
      </button>
    );
  })}
</div>
```

**Actualizar cálculo del descuento en el modal:**
```jsx
{diasTrabajadosTemp.length < (empleadoAsistencia.diasQueDebeTrabajar || DIAS_SEMANA).length && (
  <div className="mt-3 alert alert-warning">
    <strong>Días faltados:</strong> {(empleadoAsistencia.diasQueDebeTrabajar || DIAS_SEMANA)
      .filter(d => !diasTrabajadosTemp.includes(d))
      .join(', ')}
    <br />
    <strong>Descuento:</strong> {formatCurrency(
      ((empleadoAsistencia.diasQueDebeTrabajar || DIAS_SEMANA).length - diasTrabajadosTemp.length) * 
      (empleadoAsistencia.sueldoSemanal / (empleadoAsistencia.diasQueDebeTrabajar || DIAS_SEMANA).length)
    )}
  </div>
)}
```

---

#### **4. Actualizar Inicialización del Modal**

Al abrir el modal, inicializar con los días que debe trabajar:

```jsx
// Función para abrir modal de asistencia
const abrirModalAsistencia = (empleado) => {
  const diasQueDebeTrabajar = empleado.diasQueDebeTrabajar || DIAS_SEMANA;
  // Inicializar con los días que debe trabajar (no todos los días)
  const diasTrabajados = empleado.diasTrabajados || diasQueDebeTrabajar;
  setEmpleadoAsistencia(empleado);
  setDiasTrabajadosTemp([...diasTrabajados]);
  setShowAsistenciaModal(true);
};
```

---

#### **5. Mostrar Información en la Tabla**

Agregar badge que muestre cuántos días debe trabajar:

```jsx
<td>
  <div className="d-flex align-items-center gap-2">
    <strong>{emp.nombre}</strong>
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={() => abrirModalAsistencia(emp)}
      title="Configurar días trabajados"
      style={{ 
        fontSize: '0.7rem',
        padding: '2px 6px',
        lineHeight: '1'
      }}
    >
      📅
    </button>
    {(() => {
      const diasQueDebeTrabajar = emp.diasQueDebeTrabajar || DIAS_SEMANA;
      if (diasQueDebeTrabajar.length < DIAS_SEMANA.length) {
        return (
          <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>
            {diasQueDebeTrabajar.length} días/semana
          </span>
        );
      }
      return null;
    })()}
    {(emp.diasTrabajados && emp.diasTrabajados.length < (emp.diasQueDebeTrabajar || DIAS_SEMANA).length) && (
      <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
        {((emp.diasQueDebeTrabajar || DIAS_SEMANA).length - emp.diasTrabajados.length)} falta
      </span>
    )}
  </div>
</td>
```

---

#### **6. Actualizar PrintDocument.jsx**

Modificar el cálculo en el comprobante de impresión:

```jsx
// En renderEmpleadoContent()
// Calcular con descuentos por faltas
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const diasQueDebeTrabajar = empleado.diasQueDebeTrabajar || DIAS_SEMANA;
const diasTrabajados = empleado.diasTrabajados || diasQueDebeTrabajar;
const diasFaltados = diasQueDebeTrabajar.filter(dia => !diasTrabajados.includes(dia));
const sueldoPorDia = empleado.sueldoSemanal / diasQueDebeTrabajar.length; // CAMBIO AQUÍ
const descuentoPorFaltas = diasFaltados.length * sueldoPorDia;
```

---

## 📋 **Resumen de Cambios**

### **Archivos a Modificar:**

1. **`src/components/gestionSemanal/EmpleadosTab.jsx`**
   - Agregar campo `diasQueDebeTrabajar` al estado del formulario
   - Agregar checkboxes en el formulario de configuración
   - Actualizar `calcularSueldoConDescuentos()` para usar `diasQueDebeTrabajar`
   - Actualizar modal de asistencia para mostrar solo días que debe trabajar
   - Actualizar inicialización del modal
   - Agregar badge en tabla para mostrar días/semana

2. **`src/components/PrintDocument.jsx`**
   - Actualizar `renderEmpleadoContent()` para usar `diasQueDebeTrabajar` en el cálculo

### **Estructura de Datos en Firebase:**

```javascript
{
  nombre: "Jorge",
  sueldoSemanal: 60000,
  diasQueDebeTrabajar: ["Lunes", "Miércoles", "Viernes"], // NUEVO CAMPO
  diasTrabajados: ["Lunes", "Viernes"] // Días que realmente trabajó
}
```

**Valores por defecto:**
- Si `diasQueDebeTrabajar` no existe → usar `DIAS_SEMANA` (todos los días)
- Si `diasTrabajados` no existe → usar `diasQueDebeTrabajar` (trabajó todos los días que debía)

---

## ✅ **Ventajas de la Solución**

1. **Flexibilidad total:** Cada empleado puede tener su propia configuración de días
2. **Cálculo correcto:** Los descuentos se calculan basándose en los días que debe trabajar
3. **Interfaz clara:** El modal solo muestra días relevantes
4. **Retrocompatibilidad:** Empleados existentes seguirán funcionando (asumen 6 días)
5. **Visualización mejorada:** Badge muestra cuántos días trabaja cada empleado

---

## 🚀 **Pasos para Implementar**

1. **Modificar formulario de empleado:**
   - Agregar checkboxes para seleccionar días
   - Actualizar estado inicial
   - Guardar `diasQueDebeTrabajar` en Firebase

2. **Actualizar función de cálculo:**
   - Cambiar división de sueldo por días que debe trabajar
   - Actualizar filtro de días faltados

3. **Actualizar modal de asistencia:**
   - Mostrar solo días que debe trabajar
   - Actualizar cálculo de descuento

4. **Actualizar visualización:**
   - Agregar badge en tabla
   - Actualizar PrintDocument

5. **Probar casos:**
   - Empleado que trabaja 6 días (comportamiento actual)
   - Empleado que trabaja 3 días
   - Empleado que trabaja días específicos (ej: Lunes, Miércoles, Viernes)

---

## 📝 **Notas Importantes**

- **Retrocompatibilidad:** Los empleados existentes sin `diasQueDebeTrabajar` seguirán funcionando (asumen 6 días)
- **Validación:** Asegurarse de que al menos 1 día esté seleccionado
- **Persistencia:** Los días que debe trabajar se guardan en Firebase junto con el empleado
- **Cálculo:** El sueldo por día se recalcula automáticamente según los días configurados

---

**Fecha de creación:** Diciembre 2024  
**Estado:** Propuesta lista para implementar  
**Prioridad:** Media-Alta (afecta cálculo de sueldos)


