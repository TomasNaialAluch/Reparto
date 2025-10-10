import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración de Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Función para listar modelos disponibles
export const listAvailableModels = async () => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${import.meta.env.VITE_GEMINI_API_KEY}`);
    const data = await response.json();
    console.log('📋 Modelos disponibles:', data);
    return data;
  } catch (error) {
    console.error('❌ Error listando modelos:', error);
    return null;
  }
};

export const generateMessage = async (userInput, destinatario, tono, contexto) => {
  try {
    console.log('🔧 Gemini config - API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configurada' : 'NO configurada');
    
    // Usar el modelo correcto que encontramos
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Crear el prompt personalizado según las opciones
    const prompt = createPrompt(userInput, destinatario, tono, contexto);
    console.log('📋 Prompt enviado a Gemini:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📨 Respuesta cruda de Gemini:', text);
    return text.trim();
  } catch (error) {
    console.error('❌ Error con Gemini AI:', error);
    throw new Error(`Error al generar el mensaje con IA: ${error.message}`);
  }
};

const createPrompt = (userInput, destinatario, tono, contexto) => {
  const destinatarioText = {
    'cliente': 'un cliente',
    'proveedor': 'un proveedor',
    'otro': 'una persona'
  };

  const tonoText = {
    'formal': 'formal y profesional',
    'amigable': 'amigable y cercano',
    'directo': 'directo y claro',
    'cortes': 'cortés y respetuoso'
  };

  const contextoText = {
    'cobro': 'recordar sobre un pago pendiente',
    'entrega': 'coordinar una entrega',
    'consulta': 'hacer una consulta',
    'reclamo': 'presentar un reclamo',
    'otro': 'comunicar algo importante'
  };

  return `Eres un asistente de mensajes profesionales. Tu tarea es redactar un mensaje profesional basado en la descripción del usuario.

INSTRUCCIONES:
- Destinatario: ${destinatarioText[destinatario]}
- Tono: ${tonoText[tono]}
- Contexto: ${contextoText[contexto]}

DESCRIPCIÓN DEL USUARIO: "${userInput}"

REQUISITOS:
1. Corrige cualquier error ortográfico o gramatical
2. Mejora la redacción para que sea profesional
3. Adapta el tono según las especificaciones
4. Incluye un saludo apropiado y una despedida cortés
5. Haz el mensaje claro y directo
6. Máximo 3-4 oraciones
7. NO incluyas el texto original del usuario tal como está
8. Genera un mensaje completamente nuevo y profesional

Responde SOLO con el mensaje final, sin explicaciones adicionales.`;
};
