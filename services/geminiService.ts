
import { GoogleGenAI, Type } from "@google/genai";
import { Category, GeminiResponse } from "../types";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLinuxCommand = async (query: string): Promise<GeminiResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Linux expert. A user is asking for a Linux command related to: "${query}". 
      Provide the most appropriate command, a brief Japanese description, and the best fitting category.
      If the request is vague, provide the most common interpretation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: "The specific Linux command, including common flags if needed."
            },
            description: {
              type: Type.STRING,
              description: "A concise explanation of what the command does in Japanese."
            },
            category: {
              type: Type.STRING,
              enum: Object.values(Category),
              description: "The category of the command."
            }
          },
          required: ["command", "description", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(text) as GeminiResponse;
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateLogNote = async (command: string, output: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a DevOps assistant helping to document server operations.
        Analyze the following Linux command and its execution output.
        
        Command: ${command}
        Output (truncated): ${output ? output.slice(0, 1000) : '(No output)'}
        
        Task:
        Provide a concise Japanese summary (remark/note) explaining the purpose of this command and what the result indicates.
        Focus on the "intent" and "outcome".
        
        Format:
        Just the text for the note. Keep it short (1-2 sentences).
      `,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error (generateLogNote):", error);
    throw error;
  }
};
