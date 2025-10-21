1# 🤖 AI Assistant - Documentación Técnica

## 📋 **Resumen del Proyecto**

El AI Assistant es una funcionalidad integrada en la aplicación de gestión de repartos que permite a los usuarios generar mensajes profesionales usando inteligencia artificial (Google Gemini). Está diseñado específicamente para usuarios de 65+ años con una interfaz intuitiva tipo chat.

## 🎯 **Objetivos Principales**

- ✅ **Generar mensajes profesionales** para clientes y proveedores
- ✅ **Interfaz tipo chat** familiar y fácil de usar
- ✅ **Personalización** basada en feedback del usuario
- ✅ **Guardado y reutilización** de mensajes generados
- ✅ **Control de uso** con límites mensuales realistas

## 🏗️ **Arquitectura Técnica**

### **Frontend (React.js)**
```
src/pages/Asistente.jsx          # Componente principal del chat
src/config/gemini.js             # Configuración y funciones de Gemini AI
src/components/MessageCounter.jsx # Contador de mensajes mensuales
src/firebase/hooks.js            # Hooks para Firebase (líneas 483-629)
```

### **Backend (Firebase)**
```
asistente_feedback/              # Feedback del usuario
asistente_profile/               # Perfil personalizado consolidado
asistente_usage/                 # Uso mensual de mensajes
asistente_mensajes/              # Mensajes guardados
asistente_preferences/           # Preferencias del usuario
```

## 🔧 **Funcionalidades Implementadas**

### **1. Chat Conversacional**
- **Interfaz tipo WhatsApp**: Burbujas de chat con mensajes del usuario (azul) y respuestas de IA (gris)
- **Input fijo**: Posicionado en la parte inferior, siempre visible
- **Envío con Enter**: Enter para enviar, Shift+Enter para nueva línea
- **Auto-resize**: El textarea se ajusta automáticamente al contenido

### **2. Configuración de Mensajes**
```javascript
// Opciones disponibles
destinatarios: ['cliente', 'proveedor', 'otro']
tonos: ['formal', 'amigable', 'directo', 'cortes']
contextos: ['cobro', 'entrega', 'consulta', 'reclamo', 'otro']
tipos: ['whatsapp', 'email']
```

### **3. Integración con Gemini AI**
- **Modelo**: `gemini-2.5-flash`
- **API Key**: Configurada via `.env` (`VITE_GEMINI_API_KEY`)
- **Prompts inteligentes**: Adaptados según tipo de mensaje y perfil del usuario
- **Regeneración con feedback**: Mejora mensajes basado en feedback específico

### **4. Sistema de Feedback y Personalización**
```javascript
// Flujo de personalización
1. Usuario da feedback → Se guarda en Firebase
2. Cada 5 feedbacks → Se consolida con Gemini AI
3. Se crea/actualiza perfil personalizado
4. Futuros mensajes usan el perfil para personalización
```

### **5. Gestión de Mensajes**
- **Guardado automático**: Cada mensaje generado se guarda en Firebase
- **Búsqueda y filtros**: Por destinatario, tono, contexto, tipo
- **Reutilización**: Botones "Guardar" y "Mejorar" en cada respuesta
- **Historial completo**: Todos los mensajes con metadatos

### **6. Control de Uso**
- **Límite mensual**: 1,500 mensajes (basado en límites reales de Gemini)
- **Contador visual**: Progreso con barra y días hasta reset
- **Alertas**: Notificaciones cuando se acerca al límite
- **Auto-actualización**: Detecta y actualiza límites antiguos (50 → 1,500)

## 📱 **UI/UX Diseñada para 65+ Años**

### **Principios de Diseño**
- ✅ **Interfaz familiar**: Como WhatsApp que ya conocen
- ✅ **Botones grandes y claros**: "Guardar", "Mejorar", "Limpiar"
- ✅ **Texto legible**: Tamaños apropiados y contraste
- ✅ **Flujo intuitivo**: Sin pasos complejos
- ✅ **Feedback visual**: Notificaciones claras de éxito/error

### **Elementos de Accesibilidad**
- ✅ **Labels descriptivos**: "¿Para quién escribes?", "¿Cómo quieres que suene?"
- ✅ **Iconos claros**: Robot, papel de avión, guardar, editar
- ✅ **Colores consistentes**: Azul para usuario, gris para IA
- ✅ **Espaciado generoso**: Fácil de tocar en dispositivos táctiles

## 🔄 **Flujos de Trabajo**

### **Flujo Principal de Generación**
```
1. Usuario configura opciones (tipo, destinatario, tono, contexto)
2. Usuario escribe descripción del mensaje
3. Presiona Enter o botón enviar
4. IA genera mensaje profesional
5. Usuario puede:
   - Guardar el mensaje
   - Pedir mejoras
   - Continuar la conversación
```

### **Flujo de Feedback**
```
1. Usuario hace clic en "Mejorar"
2. Se abre modal de edición
3. Usuario edita mensaje y/o da feedback
4. Se envía feedback a Gemini
5. IA regenera mensaje mejorado
6. Mensaje mejorado aparece en el modal
7. Usuario puede seguir editando o guardar
```

### **Flujo de Personalización**
```
1. Usuario da feedback múltiples veces
2. Cada 5 feedbacks se consolida automáticamente
3. Gemini analiza patrones y crea perfil
4. Perfil se guarda en Firebase
5. Futuros mensajes usan el perfil para personalización
```

## 🗄️ **Estructura de Datos**

### **Mensaje Guardado**
```javascript
{
  id: "timestamp",
  userInput: "Descripción del usuario",
  generatedMessage: "Mensaje generado por IA",
  destinatario: "cliente|proveedor|otro",
  tono: "formal|amigable|directo|cortes",
  contexto: "cobro|entrega|consulta|reclamo|otro",
  tipoMensaje: "whatsapp|email",
  userProfile: { /* perfil personalizado */ },
  timestamp: "ISO string",
  isEdited: boolean,
  editedMessage: "mensaje editado"
}
```

### **Feedback**
```javascript
{
  id: "timestamp",
  originalMessage: "mensaje original",
  editedMessage: "mensaje editado",
  feedbackText: "feedback del usuario",
  context: { /* contexto del mensaje */ },
  userId: "default_user",
  timestamp: "ISO string"
}
```

### **Perfil Personalizado**
```javascript
{
  id: "timestamp",
  userId: "default_user",
  tono: "formal pero cercano",
  estructura: "saludo + contexto + petición + cierre",
  lenguaje: "respetuoso y directo",
  longitud: "conciso pero completo",
  formalidad: "formal pero accesible",
  timestamp: "ISO string"
}
```

## 🚀 **Funciones Principales**

### **Generación de Mensajes**
```javascript
// src/config/gemini.js
generateMessage(userInput, destinatario, tono, contexto, userProfile, tipoMensaje)
generateMessageWithFeedback(userInput, destinatario, tono, contexto, userProfile, tipoMensaje, originalMessage, feedback)
consolidateFeedback(feedbacks)
```

### **Gestión de Chat**
```javascript
// src/pages/Asistente.jsx
handleSendMessage()           // Envía mensaje al chat
saveChatMessage(messageId)    // Guarda mensaje específico
clearChat()                   // Limpia el chat
```

### **Firebase Hooks**
```javascript
// src/firebase/hooks.js
useAsistenteFeedback()        // Gestión de feedback
useAsistenteProfile()         // Perfil personalizado
useAsistenteUsage()           // Control de uso mensual
useAsistenteMessages()        // Mensajes guardados
useAsistentePreferences()     // Preferencias del usuario
```

## 🎨 **Estilos y CSS**

### **Clases Bootstrap Utilizadas**
- `card`, `card-header`, `card-body` - Estructura del chat
- `btn-primary`, `btn-success`, `btn-outline-primary` - Botones
- `form-control`, `form-select` - Inputs y selects
- `d-flex`, `justify-content-end/start` - Layout de burbujas
- `bg-primary`, `bg-light`, `text-white` - Colores de burbujas

### **Estilos Inline Críticos**
```css
/* Input fijo en la parte inferior */
position: 'absolute', bottom: '0', left: '0', right: '0'

/* Área de mensajes con scroll */
height: 'calc(100% - 200px)', overflowY: 'auto', paddingBottom: '120px'

/* Auto-resize del textarea */
resize: 'none', overflow: 'hidden', minHeight: '40px', maxHeight: '80px'
```

## 🔧 **Configuración Requerida**

### **Variables de Entorno**
```bash
# .env
VITE_GEMINI_API_KEY=tu_api_key_de_gemini_aqui
```

### **Dependencias NPM**
```json
{
  "@google/generative-ai": "^0.21.0",
  "firebase": "^10.0.0",
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0"
}
```

## 🚀 **Posibles Mejoras Futuras**

### **Funcionalidades Adicionales**
- [ ] **Plantillas predefinidas**: Mensajes comunes (recordatorio de pago, coordinación de entrega)
- [ ] **Historial de conversaciones**: Guardar chats completos, no solo mensajes individuales
- [ ] **Exportación**: Descargar mensajes en PDF o Word
- [ ] **Programación**: Enviar mensajes automáticamente en horarios específicos
- [ ] **Integración WhatsApp**: Envío directo desde la aplicación
- [ ] **Múltiples idiomas**: Soporte para inglés, portugués, etc.

### **Mejoras de IA**
- [ ] **Análisis de sentimiento**: Detectar el tono emocional de respuestas
- [ ] **Sugerencias contextuales**: Recomendar mejoras automáticamente
- [ ] **Aprendizaje por industria**: Perfiles específicos para diferentes tipos de negocio
- [ ] **Validación de contenido**: Verificar que el mensaje sea apropiado
- [ ] **Traducción automática**: Convertir mensajes a otros idiomas

### **Mejoras de UX**
- [ ] **Modo oscuro**: Tema oscuro para uso nocturno
- [ ] **Atajos de teclado**: Ctrl+Enter para enviar, Ctrl+S para guardar
- [ ] **Drag & Drop**: Arrastrar archivos para incluir en mensajes
- [ ] **Vista previa**: Ver cómo se verá el mensaje en WhatsApp/Email
- [ ] **Notificaciones push**: Alertas cuando se generen mensajes importantes
- [ ] **Modo offline**: Funcionalidad básica sin conexión

### **Mejoras Técnicas**
- [ ] **Caché inteligente**: Guardar respuestas comunes para reducir llamadas a API
- [ ] **Compresión de datos**: Optimizar el almacenamiento en Firebase
- [ ] **Analytics**: Métricas de uso y efectividad de mensajes
- [ ] **Backup automático**: Respaldo de mensajes importantes
- [ ] **API REST**: Endpoint para integración con otras aplicaciones
- [ ] **Webhooks**: Notificaciones cuando se generen mensajes

### **Mejoras de Accesibilidad**
- [ ] **Lectura de pantalla**: Soporte completo para screen readers
- [ ] **Alto contraste**: Modo de alto contraste para usuarios con problemas visuales
- [ ] **Tamaños de fuente**: Control de usuario para ajustar tamaños
- [ ] **Navegación por teclado**: Acceso completo sin mouse
- [ ] **Subtítulos**: Transcripción de respuestas de voz (futuro)

## 🐛 **Problemas Conocidos y Soluciones**

### **Problema: Input muy abajo**
**Solución**: Implementado input fijo con `position: absolute` en la parte inferior

### **Problema: Límite de mensajes no se actualiza**
**Solución**: Auto-detección y actualización de límites antiguos (50 → 1,500)

### **Problema: Mensajes no se guardan**
**Solución**: Verificación de `userId` y filtrado correcto en `useAsistenteMessages`

### **Problema: UI no clara para usuarios mayores**
**Solución**: Rediseño completo con botones grandes, texto claro y flujo intuitivo

## 📊 **Métricas y Monitoreo**

### **Datos a Monitorear**
- **Uso mensual**: Número de mensajes generados por mes
- **Efectividad**: Tasa de mensajes guardados vs generados
- **Feedback**: Frecuencia y tipo de feedback dado
- **Personalización**: Tiempo hasta consolidación de perfil
- **Errores**: Tasa de errores en generación de mensajes

### **Alertas Importantes**
- **Límite de API**: Cuando se acerca al 80% del límite mensual
- **Errores de Gemini**: Fallos en la generación de mensajes
- **Feedback negativo**: Patrones de insatisfacción del usuario

## 🔒 **Consideraciones de Seguridad**

### **Datos Sensibles**
- **API Key**: Almacenada solo en variables de entorno
- **Mensajes**: Almacenados en Firebase con reglas de seguridad
- **Perfiles**: Datos personalizados protegidos por usuario

### **Privacidad**
- **No logging**: No se registran conversaciones completas
- **Anonimización**: IDs de usuario no vinculados a datos personales
- **Retención**: Política de eliminación de datos antiguos

## 📚 **Recursos y Referencias**

### **Documentación Técnica**
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)

### **Mejores Prácticas**
- **UX para adultos mayores**: [AARP Digital Accessibility Guidelines](https://www.aarp.org/livable-communities/info-2014/age-friendly-communities-digital-accessibility.html)
- **Diseño de chat**: [Chat UI Design Patterns](https://www.smashingmagazine.com/2017/08/chat-ui-design-patterns/)
- **IA Conversacional**: [Conversational AI Best Practices](https://www.ibm.com/cloud/learn/conversational-ai)

---

## 📝 **Notas de Desarrollo**

### **Última Actualización**: Enero 2025
### **Versión**: 1.0.0
### **Desarrollador**: AI Assistant
### **Estado**: ✅ Funcional y en producción

### **Próximos Pasos**
1. Monitorear uso y feedback de usuarios
2. Implementar mejoras basadas en datos reales
3. Considerar integración con WhatsApp Business API
4. Evaluar expansión a otros tipos de negocio

---

*Este README debe actualizarse cada vez que se implementen nuevas funcionalidades o se resuelvan problemas importantes.*
