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

export const generateMessage = async (userInput, destinatario, tono, contexto, userProfile = null) => {
  try {
    console.log('🔧 Gemini config - API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configurada' : 'NO configurada');
    
    // Usar el modelo correcto que encontramos
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Crear el prompt personalizado según las opciones
    const prompt = createPrompt(userInput, destinatario, tono, contexto, userProfile);
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

// Función para consolidar feedback y crear perfil personalizado
export const consolidateFeedback = async (feedbacks) => {
  try {
    console.log('🔧 Gemini config - API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configurada' : 'NO configurada');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analiza estos feedbacks del usuario José sobre mensajes generados y crea un perfil personalizado de comunicación.

FEEDBACKS DEL USUARIO:
${feedbacks.map((fb, index) => `
${index + 1}. Mensaje original: "${fb.originalMessage}"
   Mensaje editado: "${fb.editedMessage}"
   Feedback: "${fb.feedback}"
   Contexto: ${fb.destinatario} - ${fb.tono} - ${fb.contexto}
`).join('\n')}

TAREA:
Crea un perfil personalizado de comunicación para José que incluya:

1. TONO PREFERIDO: Cómo le gusta que suenen los mensajes
2. ESTRUCTURA: Cómo prefiere que estén organizados
3. LENGUAJE: Palabras y frases que prefiere usar/evitar
4. LONGITUD: Preferencias sobre la extensión de los mensajes
5. FORMALIDAD: Nivel de formalidad que prefiere

FORMATO DE RESPUESTA:
Responde SOLO con un JSON válido en este formato:
{
  "tono": "descripción del tono preferido",
  "estructura": "descripción de la estructura preferida", 
  "lenguaje": "palabras/frases que prefiere y que evitar",
  "longitud": "preferencias de longitud",
  "formalidad": "nivel de formalidad preferido",
  "resumen": "resumen general del estilo de comunicación"
}

NO incluyas explicaciones adicionales, solo el JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📨 Respuesta de consolidación:', text);
    
    // Intentar parsear el JSON
    try {
      const profile = JSON.parse(text.trim());
      return profile;
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError);
      // Si no se puede parsear, crear un perfil básico
      return {
        tono: "formal pero cercano",
        estructura: "saludo + contexto + petición + consideración + cierre",
        lenguaje: "usar 'buen día', 'necesitaría', '¿habría posibilidad?', evitar informalismos",
        longitud: "3-4 oraciones máximo",
        formalidad: "formal pero accesible",
        resumen: "Estilo profesional y respetuoso, directo pero cortés"
      };
    }
    
  } catch (error) {
    console.error('❌ Error consolidando feedback:', error);
    throw new Error(`Error al consolidar feedback: ${error.message}`);
  }
};

const createPrompt = (userInput, destinatario, tono, contexto, userProfile = null) => {
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

  let basePrompt = `Eres un asistente de mensajes profesionales. Tu tarea es redactar un mensaje profesional basado en la descripción del usuario.

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
8. Genera un mensaje completamente nuevo y profesional`;

  // Agregar perfil personalizado si existe
  if (userProfile) {
    basePrompt += `

PERSONALIZACIÓN DEL USUARIO:
- Tono preferido: ${userProfile.tono}
- Estructura preferida: ${userProfile.estructura}
- Lenguaje preferido: ${userProfile.lenguaje}
- Longitud preferida: ${userProfile.longitud}
- Formalidad preferida: ${userProfile.formalidad}

ADAPTA el mensaje siguiendo estas preferencias personales del usuario.`;
  }

  basePrompt += `

Responde SOLO con el mensaje final, sin explicaciones adicionales.`;

  return basePrompt;
};
