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
    .slice(0, 100) // Limit to first 100 files for context window safety
    .join('\n');

  let attempts = 0;
  const maxAttempts = KeyManager.getKeyCount();

  while (attempts < maxAttempts) {
    const ai = new GoogleGenAI({ apiKey: KeyManager.getCurrentKey() });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      return JSON.parse(response.text || '{}') as ZipAnalysis;
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      const isQuotaError =
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("exhausted") ||
        errorMsg.includes("Limit reached") ||
        errorMsg.includes("System Busy") ||
        errorMsg.includes("Cooling Down");

      if (isQuotaError && KeyManager.rotate()) {
        attempts++;
        continue;
      }
      console.error("Failed to analyze ZIP structure", err);
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