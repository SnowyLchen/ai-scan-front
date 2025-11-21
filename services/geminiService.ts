
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

/**
 * Generate a sample document using Gemini AI
 * Note: This connects to real Google APIs, not our mock network layer.
 */
export const generateSampleScan = async (): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Cannot generate sample.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const docTypes = [
    "a crumpled receipt on a wooden table",
    "an old handwritten letter on a dark desk",
    "a business card on a textured surface",
    "a sketch on a napkin on a cafe table",
    "an id card on a blue background"
  ];
  const randomPrompt = docTypes[Math.floor(Math.random() * docTypes.length)];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Generate a realistic top-down photo of ${randomPrompt}. The document should be clearly visible but slightly angled or with non-uniform lighting to simulate a real scan scenario. Do not add text overlays.`
          }
        ]
      }
    });

    let imageUrl = '';
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
           imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           break;
        }
      }
    }
    
    if (!imageUrl) {
      throw new Error("No image generated from AI response.");
    }

    return imageUrl;

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
