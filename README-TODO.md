# TODO: Sistema Mi Reparto

## ✅ **PROBLEMA RESUELTO: Sistema de Impresión**

### **Solución Implementada (Octubre 2025)**

El sistema de impresión fue completamente rediseñado usando un enfoque modular y profesional:

#### **Componente PrintDocument.jsx**
- ✅ **Modal con vista previa** antes de imprimir
- ✅ **Tres tipos de documentos:** reparto, saldo, transferencia
- ✅ **Ventana emergente** con HTML personalizado
- ✅ **Formato compacto** - Ocupa media hoja A4 vertical
- ✅ **Estilos optimizados** - Letra pequeña pero legible (8-12pt)
- ✅ **Cierre automático** después de imprimir

#### **Características de Impresión:**

**Saldo Clientes:**
- Resumen de cuenta con nombre del cliente
- Boletas vendidas con fechas
- Ventas, plata a favor, pagos detallados
- Totales claros y saldo final destacado
- Mensaje explicativo de quién debe a quién

**Mi Reparto:**
- Lista de clientes con números
- Tabla con nombres, montos y estados de pago
- Totales del día, cobrado y pendiente
- Indicadores de estado (Pagado/Pendiente/Parcial)

**Transferencias:**
- Resumen de transferencias recibidas
- Boletas vendidas al cliente
- Saldo final con mensaje claro

#### **Integración:**
- ✅ Botones de impresión en formularios principales
- ✅ Botones de impresión en todas las cards del historial
- ✅ Sistema unificado para todas las secciones
- ✅ Formato profesional y consistente

#### **Tecnología Utilizada:**
- `window.open()` para ventana de impresión
- HTML/CSS directo (sin librerías externas)
- Estilos inline para garantizar compatibilidad
- Márgenes reducidos (0.5cm-1cm) para aprovechar espacio

---

## ✅ **SISTEMA DE NOTIFICACIONES IMPLEMENTADO**

### **Componente NotificationContainer.jsx**
- ✅ Notificaciones animadas en esquina superior derecha
- ✅ Colores por tipo: success (verde), error (rojo), warning (amarillo), info (azul)
- ✅ Animación de entrada y salida suave
- ✅ Auto-cierre configurable (3-5 segundos)
- ✅ Cierre manual con botón X

### **Hook useNotifications.js**
- ✅ Gestión de estado de notificaciones
- ✅ Funciones: showSuccess, showError, showWarning, showInfo
- ✅ Control de duración y eliminación

### **Integración:**
- ✅ Reemplazados todos los `alert()` por notificaciones
- ✅ Implementado en: MiReparto, SaldoClientes, Transferencias
- ✅ Mensajes claros y profesionales

---

## 📊 **NUEVA FUNCIONALIDAD: Página de Transferencias**

### **Implementación Completa (Octubre 2025)**

#### **Transferencias.jsx**
- ✅ Formulario izquierdo con:
  - Nombre del cliente
  - Transferencias dinámicas (descripción + monto)
  - Boletas dinámicas (fecha + monto)
  - Cálculo automático de saldo
  - Botones: Calcular, Guardar, Imprimir
- ✅ Panel derecho con:
  - Estado de conexión Firebase
  - Filtros por fecha (Hoy, Semana, Mes, Año)
  - Cards de transferencias guardadas
  - Acciones: Editar, Imprimir, Eliminar

#### **TransferenciaCard.jsx**
- ✅ Card colapsable con información resumida
- ✅ Indicador visual claro de quién debe a quién
- ✅ Colores según saldo (verde/rojo/gris)
- ✅ Detalle expandible con todas las transacciones

#### **Firebase Collection:**
- **Nombre:** `TransferenciasClientes`
- **Estructura:**
  ```javascript
  {
    nombreCliente: string,
    transferencias: [{ descripcion, monto }],
    boletas: [{ fecha, monto }],
    totalTransferencias: number,
    totalBoletas: number,
    saldoFinal: number, // positivo = le debes, negativo = te debe
    fecha: string (YYYY-MM-DD)
  }
  ```

#### **Hook useTransferenciasClientes**
- ✅ Operaciones CRUD completas
- ✅ Tiempo real con Firestore
- ✅ Integrado en hooks.js

---

## 🎯 **FUNCIONALIDADES PENDIENTES**

### **1. Sistema de Facturación**
- ✅ **Asistente de Mensajes con IA** - COMPLETADO (Gemini AI integrado)
- ⚠️ **Sistema de Facturación** - PENDIENTE
- ⚠️ **Relación de Clientes** - PENDIENTE  
- ⚠️ **Asistente AI de Navegación** - PENDIENTE

---

## 📊 **SISTEMA DE FACTURACIÓN**

### **Descripción:**
Sistema completo de facturación que permita generar facturas, control de stock, gestión de productos y seguimiento de pagos.

### **Funcionalidades Requeridas:**

#### **Gestión de Productos:**
- ✅ Catálogo de productos con precios
- ✅ Control de stock (entrada/salida)
- ✅ Categorías de productos
- ✅ Códigos de barras o SKU
- ✅ Imágenes de productos

#### **Generación de Facturas:**
- ✅ Facturas con numeración automática
- ✅ Múltiples items por factura
- ✅ Cálculo automático de totales
- ✅ Impuestos (IVA, etc.)
- ✅ Formato PDF para impresión/envío

#### **Gestión de Clientes:**
- ✅ Base de datos unificada de clientes
- ✅ Historial de compras por cliente
- ✅ Estados de cuenta
- ✅ Límites de crédito

#### **Reportes de Facturación:**
- ✅ Ventas por período
- ✅ Productos más vendidos
- ✅ Clientes con mayor facturación
- ✅ Análisis de cobranza

---

## 👥 **RELACIÓN DE CLIENTES A LO LARGO DE LA APP**

### **Descripción:**
Sistema unificado donde los clientes aparezcan consistentemente en todas las secciones de la aplicación.

### **Base de Datos Unificada:**

#### **Colección Firebase: `clientes`**
```javascript
{
  id: string,
  nombre: string,
  email: string,
  telefono: string,
  direccion: string,
  fechaRegistro: timestamp,
  tipoCliente: 'minorista' | 'mayorista' | 'especial',
  limiteCredito: number,
  estado: 'activo' | 'inactivo' | 'suspendido',
  observaciones: string,
  tags: string[], // ej: ['frecuente', 'puntual', 'moroso']
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **Integración en Todas las Secciones:**

#### **Mi Reparto:**
- ✅ Autocompletado de nombres de clientes
- ✅ Historial de repartos por cliente
- ✅ Estados de pago históricos

#### **Saldo Clientes:**
- ✅ Información completa del cliente
- ✅ Historial de transacciones
- ✅ Alertas de límites de crédito

#### **Transferencias:**
- ✅ Datos de contacto del cliente
- ✅ Historial de transferencias

#### **Facturación:**
- ✅ Datos fiscales del cliente
- ✅ Historial de facturas
- ✅ Estados de cuenta

#### **Gestión Semanal:**
- ✅ Clientes que compraron en la semana
- ✅ Análisis de comportamiento

### **Funcionalidades Adicionales:**
- ✅ **Búsqueda inteligente** - Buscar por nombre, teléfono, dirección
- ✅ **Etiquetas personalizadas** - Clasificar clientes (frecuente, moroso, etc.)
- ✅ **Notificaciones automáticas** - Recordatorios de pago, cumpleaños
- ✅ **Exportar datos** - Lista de clientes en Excel/CSV

---

## 🤖 **ASISTENTE AI DE NAVEGACIÓN CON CHAT ANIMADO**

### **Descripción:**
Chat inteligente que ayuda a los usuarios a navegar por la aplicación y encontrar lo que necesitan usando IA.

### **Funcionalidades:**

#### **Chat Inteligente:**
- ✅ **Reconocimiento de intención** - "Quiero ver mis repartos de hoy"
- ✅ **Navegación automática** - Lleva al usuario a la sección correcta
- ✅ **Animaciones de navegación** - Transiciones suaves entre páginas
- ✅ **Sugerencias contextuales** - Recomendaciones basadas en la hora/día

#### **Comandos de Voz y Texto:**
```
Usuario: "¿Cómo están mis cobros pendientes?"
AI: "Te llevo a la sección de Saldo de Clientes..."
[Navegación animada]

Usuario: "Quiero facturar a Juan Pérez"
AI: "Perfecto, voy a la facturación con Juan Pérez preseleccionado..."
[Navegación + datos precargados]

Usuario: "¿Qué repartos hice ayer?"
AI: "Te muestro el historial de repartos de ayer..."
[Navegación + filtros aplicados]
```

#### **Integración con IA:**
- ✅ **Gemini AI** - Para entender el lenguaje natural
- ✅ **Análisis de contexto** - Entiende qué necesita el usuario
- ✅ **Aprendizaje** - Mejora con el uso

#### **Componente Chat:**
```javascript
// ChatWidget.jsx
- Botón flotante en esquina inferior derecha
- Ventana expandible con historial de conversación
- Indicador de escritura cuando AI está procesando
- Sugerencias rápidas con botones
- Integración con todas las páginas
```

#### **Animaciones de Navegación:**
- ✅ **Transiciones suaves** - Entre páginas
- ✅ **Highlighting** - Destacar elementos relevantes
- ✅ **Loading states** - Indicadores de carga
- ✅ **Success feedback** - Confirmación de acciones

### **Tecnología:**
- ✅ **Gemini AI** - Para procesamiento de lenguaje natural
- ✅ **React Router** - Para navegación programática
- ✅ **Framer Motion** - Para animaciones suaves
- ✅ **Speech Recognition** - Para comandos de voz (opcional)

### **Ejemplos de Uso:**
```
"Muéstrame el balance de la semana"
→ Navega a Gestión Semanal → Balance

"¿Quién me debe dinero?"
→ Navega a Saldo Clientes → Filtra deudores

"Quiero imprimir los repartos de hoy"
→ Navega a Mi Reparto → Filtra hoy → Abre modal de impresión

"Facturar 3 productos a María"
→ Navega a Facturación → Preselecciona María → Abre formulario
```

---

## 🎯 **PRÓXIMA FUNCIONALIDAD: Asistente de Mensajes con IA (Gemini AI)**

### **Descripción:**
Página para ayudar al administrador a redactar mensajes profesionales para clientes y proveedores usando inteligencia artificial.

### **Layout:**

**IZQUIERDA (Input):**
- Campo de texto para descripción/idea del mensaje
- Opciones:
  - Tipo de destinatario: Cliente / Proveedor / Otro
  - Tono: Formal / Amigable / Directo / Cortés
  - Contexto: Cobro / Entrega / Consulta / Reclamo / Otro
- Botón "Generar Mensaje" que llama a Gemini AI
- Botón "Limpiar"

**DERECHA (Output):**
- Mensaje generado por la IA
- Botones:
  - Copiar al portapapeles
  - Regenerar (con variación)
  - Editar manualmente
- Historial de mensajes generados (últimos 5)

### **Tecnología Requerida:**

#### **1. Gemini AI API**
- **API:** Google Gemini API (gratuita hasta cierto límite)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Autenticación:** API Key

#### **2. Configuración en Firebase:**

**Opción A: Usar Cloud Functions (Recomendado)**
```bash
# Instalar Firebase Functions
npm install firebase-functions firebase-admin

# Estructura:
functions/
  index.js  # Cloud Function que llama a Gemini
  package.json
```

**Ventajas:**
- ✅ API Key segura (no expuesta en frontend)
- ✅ Rate limiting controlado
- ✅ Logs centralizados
- ✅ Mejor para producción

**Opción B: Llamada directa desde Frontend**
```javascript
// Usar variable de entorno
VITE_GEMINI_API_KEY=tu_api_key_aquí
```

**Ventajas:**
- ✅ Implementación más rápida
- ✅ No requiere plan de pago Firebase
- ⚠️ Menos segura (API key en cliente)

### **Pasos de Implementación:**

1. **Configurar Gemini API:**
   - Crear cuenta en Google AI Studio
   - Obtener API Key: https://makersuite.google.com/app/apikey
   - Configurar límites de uso

2. **Firebase Functions (Opción A):**
   ```bash
   firebase init functions
   npm install --prefix functions axios
   ```
   
   Crear función en `functions/index.js`:
   ```javascript
   const functions = require('firebase-functions');
   const axios = require('axios');

   exports.generateMessage = functions.https.onCall(async (data, context) => {
     const { prompt, tone, context: msgContext } = data;
     
     const response = await axios.post(
       'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
       {
         contents: [{ parts: [{ text: prompt }] }]
       },
       {
         headers: {
           'Content-Type': 'application/json',
         },
         params: {
           key: functions.config().gemini.apikey
         }
       }
     );
     
     return response.data;
   });
   ```

   Configurar API Key:
   ```bash
   firebase functions:config:set gemini.apikey="TU_API_KEY"
   ```

3. **O Configuración Frontend (Opción B):**
   - Agregar `.env.local`:
     ```
     VITE_GEMINI_API_KEY=tu_api_key
     ```
   - Crear servicio `src/services/gemini.js`
   - Llamar API directamente desde React

4. **Crear Componentes:**
   - `src/pages/AsistenteMensajes.jsx` - Página principal
   - `src/components/MessageInput.jsx` - Input con opciones
   - `src/components/MessageOutput.jsx` - Resultado con acciones
   - `src/components/MessageHistory.jsx` - Historial

5. **Agregar Ruta:**
   ```javascript
   <Route path="/asistente" element={<AsistenteMensajes />} />
   ```

6. **Actualizar Navbar:**
   ```javascript
   { path: '/asistente', label: 'Asistente IA' }
   ```

### **Prompt Engineering para Gemini:**

```javascript
const buildPrompt = (userInput, tone, context, recipient) => {
  return `Eres un asistente que ayuda a escribir mensajes profesionales para un negocio de reparto.

Destinatario: ${recipient}
Tono deseado: ${tone}
Contexto: ${context}
Idea del usuario: ${userInput}

Genera un mensaje claro, profesional y apropiado para WhatsApp o SMS. 
El mensaje debe ser:
- Breve y directo
- Respetuoso pero amigable
- En español argentino
- Sin saludos excesivos
- Máximo 3-4 líneas

No incluyas "Hola" ni "Gracias" al final a menos que sea necesario.
Solo el mensaje, sin explicaciones adicionales.`;
};
```

### **Estimación de Costos:**
- **Gemini API Free Tier:** 60 requests/minuto
- **Firebase Functions:** Requiere plan Blaze (pago por uso)
- **Alternativa:** Usar API directo desde frontend (menos seguro pero gratuito)

### **Prioridad:** MEDIA
**Razón:** Funcionalidad útil pero no crítica para operación diaria

---

## 📁 **Estructura Actual del Proyecto**

```
src/
├── components/
│   ├── ClienteDeudorCard.jsx       ✅ Card de cliente con saldo
│   ├── ClienteRow.jsx              ✅ Fila de cliente en tabla
│   ├── EditClienteModal.jsx        ✅ Modal edición cliente
│   ├── EditRepartoModal.jsx        ✅ Modal edición reparto
│   ├── Login.jsx                   ✅ Login con Google
│   ├── Navbar.jsx                  ✅ Navegación principal
│   ├── NotificationContainer.jsx   ✅ Sistema de notificaciones
│   ├── PrintDocument.jsx           ✅ Componente de impresión
│   ├── PrintReparto.jsx            ❌ No utilizado - Borrar
│   ├── PrintSaldoCliente.jsx       ❌ No utilizado - Borrar
│   ├── RepartoCard.jsx             ✅ Card de reparto guardado
│   ├── ReportesGraficos.jsx        ✅ Reportes con gráficos
│   └── TransferenciaCard.jsx       ✅ Card de transferencia
├── pages/
│   ├── Home.jsx                    ✅ Página principal
│   ├── MiReparto.jsx               ✅ Gestión de repartos
│   ├── SaldoClientes.jsx           ✅ Cálculo de saldos
│   └── Transferencias.jsx          ✅ Gestión de transferencias
├── firebase/
│   ├── config.js                   ✅ Configuración Firebase
│   └── hooks.js                    ✅ Hooks personalizados
├── hooks/
│   └── useNotifications.js         ✅ Hook de notificaciones
└── utils/
    ├── money.js                    ✅ Utilidades de formato
    └── printUtils.js               ❌ Eliminado - No necesario
```

---

## 🚀 **Estado del Proyecto**

- ✅ **Sistema de impresión** - Completamente funcional
- ✅ **Notificaciones** - Implementadas en todas las páginas
- ✅ **Transferencias** - Página completa y funcional
- ✅ **Reportes gráficos** - Vista colapsable/expandible
- ✅ **CRUD completo** - Todas las operaciones funcionando
- ✅ **Firebase integrado** - Tiempo real operativo
- ✅ **Asistente de Mensajes IA** - COMPLETADO (Gemini AI integrado)
- ✅ **Sistema de datos compartidos** - Todos los usuarios ven todos los datos
- ✅ **Navegación mejorada** - Submenú intuitivo implementado

---

## 🎯 **Próximos Pasos (Prioridad)**

### **ALTA PRIORIDAD:**
1. **Sistema de Facturación** - Gestión completa de productos, stock y facturas
2. **Base de Datos Unificada de Clientes** - Integración en todas las secciones
3. **Asistente AI de Navegación** - Chat inteligente con navegación animada

### **MEDIA PRIORIDAD:**
4. **Optimización de rendimiento** - Mejoras en carga y respuesta
5. **Testing exhaustivo** - Pruebas en diferentes navegadores y dispositivos
6. **Documentación de usuario** - Manuales para nuevas funcionalidades

### **BAJA PRIORIDAD:**
7. **Eliminar componentes obsoletos** (PrintReparto.jsx, PrintSaldoCliente.jsx)
8. **Mejoras de UX/UI** - Refinamientos visuales y de usabilidad

---

**Última actualización:** Diciembre 2024  
**Estado:** Sistema completo con asistente IA funcionando  
**Desarrollado por:** Tomas Naial Aluch
