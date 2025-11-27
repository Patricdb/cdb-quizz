import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, Topic, Question, PronunciationFeedback, AppMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// New return type interface
interface GeneratedQuizResponse {
  questions: Question[];
  usedSources: string[];
}

export const generateQuestions = async (
  mode: AppMode, 
  language: Language | null, 
  topic: Topic | null,
  enabledSources: string[] = [] // New parameter
): Promise<GeneratedQuizResponse> => {
  let systemPrompt = "";
  let userPrompt = "";

  // Construct source instruction
  const sourcesText = enabledSources.length > 0 
    ? `BASE YOUR KNOWLEDGE STRICTLY ON THESE DATA SOURCES IF APPLICABLE: ${enabledSources.join(", ")}.`
    : "Use general authoritative knowledge sources.";

  // Define prompts based on AppMode
  switch (mode) {
    case AppMode.IDIOMAS:
      systemPrompt = "Eres un experto profesor de idiomas para hostelería.";
      userPrompt = `Genera 10 preguntas de vocabulario tipo test para un camarero español que quiere aprender ${language || 'Inglés'} sobre el tema "${topic || 'General'}". 
      Las preguntas deben ser prácticas (traducción de ingredientes, frases de cortesía, utensilios).`;
      break;

    case AppMode.CERVEZA:
      systemPrompt = "Eres un maestro cervecero y experto Zythosommelier, especializado en el sector Craft Beer (Cerveza Artesana) e Independiente en España.";
      userPrompt = `Genera 10 preguntas tipo test sobre CULTURA CERVECERA. 
      
      DISTRIBUCIÓN OBLIGATORIA DEL CONTENIDO:
      1. Cultura General (20%): Estilos (IPA, Stout, Sour, Lambic), ingredientes, defectos, servicio.
      2. Sector Artesano Nacional - España (30%): Cerveceras independientes relevantes (Ej: Dougall's, Basqueland, Garage, La Pirata, etc.), ferias importantes.
      3. Sector Artesano REGIONAL - MURCIA (50% - PRIORIDAD ALTA): 
         - Debes incluir muchas preguntas sobre cerveceras artesanas murcianas como: Yakka, El Cantero, Kato, Trinitaria, Cátedra, Pajiza, etc.
         - Figuras del sector craft murciano.
         - Locales especializados en craft beer en Murcia y Cartagena.
         - Premios obtenidos por estas cerveceras.
      
      Idioma: ESPAÑOL.`;
      break;

    case AppMode.VINO:
      systemPrompt = "Eres un experto Sommelier de prestigio internacional.";
      userPrompt = `Genera 10 preguntas tipo test sobre CULTURA DEL VINO. 
      Temas: Variedades de uva (nacionales e internacionales), D.O. importantes, proceso de vinificación, crianza, temperatura de servicio, cata y maridajes clásicos. 
      Idioma: ESPAÑOL.`;
      break;

    case AppMode.L43:
      systemPrompt = "Eres un embajador de marca de Licor 43 y experto en cultura gastronómica de Cartagena (Murcia).";
      userPrompt = `Genera 10 preguntas tipo test centradas en LICOR 43 y el CAFÉ ASIÁTICO. 
      Temas: Historia del Licor 43 (ingredientes secretos, origen romano/Liqvor Mirabilis), receta auténtica del Café Asiático de Cartagena, coctelería moderna con Licor 43 y maridajes dulces. 
      Idioma: ESPAÑOL.`;
      break;

    case AppMode.CULTURA:
      systemPrompt = "Eres un historiador experto en gastronomía, sociología de los bares y la hostelería española.";
      userPrompt = `Genera 10 preguntas tipo test sobre CULTURA DE BAR y HOSTELERÍA. 
      Temas principales:
      1. Cultura general: Historia de bares/tabernas, origen de tapas, tipos de establecimientos (Pub, Bistro, Izakaya, Speakeasy), cócteles clásicos con historia, y anécdotas históricas en bares.
      2. Hostelería en España: Personajes relevantes del sector.
      3. ÉNFASIS ESPECIAL EN REGIÓN DE MURCIA: Incluye preguntas sobre hosteleros, chefs, bares, restaurantes, cafeterías o discotecas de la Región de Murcia que hayan recibido premios o reconocimientos (Soles Repsol, Estrellas Michelin, Premios de la Hostelería, locales históricos o emblemáticos de Murcia y Cartagena).
      Idioma: ESPAÑOL.`;
      break;

    case AppMode.LEGAL:
      systemPrompt = "Eres un abogado laboralista y asesor jurídico experto en el sector de la hostelería en España.";
      userPrompt = `Genera 10 preguntas tipo test sobre DERECHOS Y OBLIGACIONES LABORALES EN HOSTELERÍA.
      
      FUENTES LEGALES OBLIGATORIAS:
      1. Estatuto de los Trabajadores (Marco Nacional).
      2. CONVENIO COLECTIVO DE HOSTELERÍA DE LA REGIÓN DE MURCIA (Vigente).

      Temas clave:
      - Jornada laboral, descansos entre turnos y descansos semanales según convenio.
      - Vacaciones anuales y festivos.
      - Clasificación profesional y funciones específicas (Grupo I, II, III...).
      - Régimen disciplinario: ¿Qué se considera falta leve, grave o muy grave en el convenio de Murcia?
      - Permisos retribuidos (matrimonio, nacimiento, fallecimiento familiar).
      - Tipos de contratación habituales (Fijo-Discontinuo).
      - Tablas salariales (conceptos generales como plus de nocturnidad, antigüedad, etc., sin cifras exactas que caducan, sino conceptos).
      
      Idioma: ESPAÑOL.`;
      break;
    
    default:
      systemPrompt = "Eres un experto en hostelería.";
      userPrompt = "Genera 10 preguntas de hostelería general.";
  }

  const fullPrompt = `${systemPrompt}
  ${sourcesText}
  ${userPrompt}
  
  IMPORTANTE: Las preguntas deben tener variedad de dificultad siguiendo estrictamente esta distribución:
  - 3 preguntas [Fácil]: Conceptos básicos, fundamentales o muy populares.
  - 4 preguntas [Medio]: Detalles técnicos estándar, procedimientos habituales o historia general.
  - 3 preguntas [Difícil]: Datos curiosos específicos, fechas exactas, química detallada o rarezas.

  Devuelve estrictamente un JSON con este esquema:
  {
    "questions": [
       {
        "id": "string",
        "questionText": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": "string",
        "explanation": "string (Breve explicación didáctica citando la norma si es posible)",
        "difficulty": "Fácil | Medio | Difícil"
      }
    ],
    "usedSources": ["string", "string"] (Lista los nombres de las fuentes de datos específicas (libros, guías, webs, convenios) que has consultado o simulado consultar para generar este lote)
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionText: { type: Type.STRING, description: "La pregunta" },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "4 posibles respuestas" 
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING, description: "Breve explicación" },
                  difficulty: { type: Type.STRING, enum: ["Fácil", "Medio", "Difícil"] }
                },
                required: ["id", "questionText", "options", "correctAnswer", "explanation", "difficulty"]
              }
            },
            usedSources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of data sources used"
            }
          },
          required: ["questions", "usedSources"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as GeneratedQuizResponse;
    }
    return { questions: [], usedSources: [] };
  } catch (error) {
    console.error("Error generating questions:", error);
    return {
      questions: [
        {
          id: "err-1",
          questionText: "Error de conexión con el Chef IA.",
          options: ["Reintentar", "Esperar", "Salir", "Error"],
          correctAnswer: "Reintentar",
          explanation: "Por favor comprueba tu conexión y API Key.",
          difficulty: "Fácil"
        }
      ],
      usedSources: []
    };
  }
};

export const evaluatePronunciation = async (audioBase64: string, word: string, language: Language): Promise<PronunciationFeedback> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm; codecs=opus", 
              data: audioBase64
            }
          },
          {
            text: `Listen to the audio. The user is a Spanish speaker trying to say the phrase/word related to "${word}" in ${language}. 
            Rate the pronunciation accuracy from 0 to 100. 
            Provide a specific, actionable tip to improve, focusing on common phonetic difficulties for Spanish speakers. 
            Keep the tip very brief (max 2 short sentences).
            IMPORTANT: The feedback/tip MUST be written in SPANISH.
            Return JSON: { "score": number, "feedback": string }`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PronunciationFeedback;
    }
    return { score: 0, feedback: "No se pudo analizar el audio." };
  } catch (error) {
    console.error("Error evaluating pronunciation:", error);
    return { score: 0, feedback: "Error de conexión." };
  }
};

export const getPronunciationAudio = async (text: string, language: Language): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [
          { text: `Say the following phrase in ${language} with a perfect accent: "${text}"` }
        ]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};