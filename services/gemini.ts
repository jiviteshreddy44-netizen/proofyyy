
import { GoogleGenAI, Type } from "@google/genai";
import { ZipFileEntry, ZipAnalysis } from "../types";

// Always use named parameter for apiKey and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeZipStructure(files: ZipFileEntry[]): Promise<ZipAnalysis> {
  const fileListString = files
    .map(f => `${f.name} (${f.isDirectory ? 'Dir' : f.size + ' bytes'})`)
    .slice(0, 100) // Limit to first 100 files for context window safety
    .join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Analyze this list of files from a ZIP archive and provide a technical summary of what this project/package likely is.
    
    Files:
    ${fileListString}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A high-level summary of the contents." },
          category: { type: Type.STRING, description: "Main category (e.g., Web App, Data Set, Document Collection)." },
          technologies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of detected technologies or languages."
          },
          securityNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Any potential security observations or risks found in filenames."
          }
        },
        required: ["summary", "category", "technologies", "securityNotes"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as ZipAnalysis;
  } catch (e) {
    console.error("Failed to parse analysis JSON", e);
    return {
      summary: "Could not analyze the ZIP structure.",
      category: "Unknown",
      technologies: [],
      securityNotes: ["Analysis failed."]
    };
  }
}