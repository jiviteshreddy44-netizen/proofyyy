import { GoogleGenAI, Type } from "@google/genai";
import { ZipFileEntry, ZipAnalysis } from "../types";

/**
 * Manages rotation across multiple Gemini API keys.
 */
class KeyManager {
  private static keys: string[] = (process.env.GEMINI_KEYS || process.env.API_KEY || "").split(',').filter(k => k.trim());
  private static currentIndex = 0;

  static getCurrentKey() {
    return this.keys[this.currentIndex];
  }

  static rotate() {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      console.warn(`Rotating to API Key Index: ${this.currentIndex}`);
      return true;
    }
    return false;
  }

  static getKeyCount() {
    return this.keys.length;
  }
}

export async function analyzeZipStructure(files: ZipFileEntry[]): Promise<ZipAnalysis> {
  const fileListString = files
    .map(f => `${f.name} (${f.isDirectory ? 'Dir' : f.size + ' bytes'})`)
    .slice(0, 100)
    .join('\n');

  let attempts = 0;
  const maxAttempts = KeyManager.getKeyCount();

  while (attempts < maxAttempts) {
    const ai = new GoogleGenAI({ apiKey: KeyManager.getCurrentKey() });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze this list of files from a ZIP archive and provide a technical summary of what this project/package likely is.
        
        Files:
        ${fileListString}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
              securityNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "category", "technologies", "securityNotes"]
          }
        }
      });
      const text = await response.response;
      return JSON.parse(text.text() || '{}') as ZipAnalysis;
    } catch (err: any) {
      if (KeyManager.rotate()) {
        attempts++;
        continue;
      }
      break;
    }
  }

  return {
    summary: "Could not analyze the ZIP structure.",
    category: "Unknown",
    technologies: [],
    securityNotes: ["Analysis failed or quota exhausted."]
  };
}