import { ZipFileEntry, ZipAnalysis } from "../types";

export async function analyzeZipStructure(files: ZipFileEntry[]): Promise<ZipAnalysis> {
  try {
    const response = await fetch('/api/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });

    if (!response.ok) {
      throw new Error('ZIP analysis backend failed');
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to analyze ZIP structure", error);
    return {
      summary: "Could not analyze the ZIP structure.",
      category: "Unknown",
      technologies: [],
      securityNotes: ["Analysis failed or quota exhausted server-side."]
    };
  }
}