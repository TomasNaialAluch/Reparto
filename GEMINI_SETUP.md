# Configuración de Gemini AI para el Asistente

## Pasos para configurar la API Key de Gemini

### 1. Obtener API Key de Google AI Studio

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la API key generada

### 2. Configurar en el proyecto

1. Crea un archivo `.env` en la raíz del proyecto (si no existe)
2. Agrega la siguiente línea:

```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

**Ejemplo:**
```env
VITE_GEMINI_API_KEY=AIzaSyBqJ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6
```

### 3. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

### 4. Verificar funcionamiento

1. Ve a la página "Asistente" en la aplicación
2. Escribe un mensaje de prueba
3. Haz clic en "Generar Mensaje"
4. Deberías ver un mensaje profesional generado por IA

## Características del Asistente

- ✅ **Corrección ortográfica automática**
- ✅ **Mejora de redacción profesional**
- ✅ **Adaptación de tono** (formal, amigable, directo, cortés)
- ✅ **Contexto específico** (cobro, entrega, consulta, reclamo)
- ✅ **Historial de mensajes generados**
- ✅ **Copiar al portapapeles**
- ✅ **Regenerar mensajes**

## Ejemplo de uso

**Entrada:** "NEcesiot que luz no se olvide de pagarme"
**Salida:** "Hola Luz, espero que te encuentres bien. Te contacto para recordarte sobre el pago pendiente que tenemos. ¿Podrías confirmarme cuándo te sea conveniente realizar el pago? Saludos cordiales."

## Notas importantes

- La API key es gratuita con límites generosos
- Los mensajes se procesan en tiempo real
- No se almacenan datos en servidores externos
- La API key debe mantenerse privada (no subir a GitHub)
