
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, Verdict, TextAnalysisResult } from "../types.ts";

/**
 * Utility to extract JSON from potentially Markdown-formatted strings.
 */
const extractJson = (text: string) => {
  try {
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").replace(/^[^{]*/, "").replace(/[^}]*$/, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    if (text.includes("429") || text.includes("RESOURCE_EXAUSTED")) {
      try { return JSON.parse(text); } catch (inner) { }
    }
    console.error("Failed to parse AI response as JSON:", text);
    throw new Error("The forensic engine returned an unreadable response format.");
  }
};

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

/**
 * Factory function to ensure GoogleGenAI is instantiated using the currently active rotated key.
 */
const getAI = () => {
  const apiKey = KeyManager.getCurrentKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Resilient wrapper that falls back to a stable model or rotates API keys if the primary model hits quota.
 */
const safeInvoke = async (primaryModel: string, contents: any, config: any = {}) => {
  let attempts = 0;
  const maxAttempts = KeyManager.getKeyCount();
  const fallbackModel = "gemini-flash-latest";

  while (attempts < maxAttempts) {
    const ai = getAI();
    try {
      // Force use of 2.0 Flash as it's confirmed available
      const modelToUse = primaryModel === "gemini-1.5-flash" || primaryModel === "gemini-3-flash-preview"
        ? "gemini-2.0-flash"
        : primaryModel;

      const result = await ai.models.generateContent({
        model: modelToUse,
        contents,
        config
      });
      return { response: result, isSafeMode: false };
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
        console.warn(`Quota/Rate limit reached. Retrying with next key (Attempt ${attempts}/${maxAttempts})...`);
        continue;
      }

      if (isQuotaError || errorMsg.includes("404")) {
        console.warn(`Neural Engine issue (${primaryModel}). Switching to Safe Mode (${fallbackModel})...`);
        const result = await ai.models.generateContent({
          model: fallbackModel,
          contents,
          config
        });
        return { response: result, isSafeMode: true };
      }
      throw err;
    }
  }
  throw new Error("All API keys have exhausted their quota.");
};

export const generateForensicCertificate = async (result: AnalysisResult): Promise<string> => {
  const { response } = await safeInvoke("gemini-1.5-flash", `Generate a detailed forensic certificate for Case ID ${result.id}.
    Verdict: ${result.verdict}.
    AI Probability: ${result.deepfakeProbability}%.
    Include detailed findings: ${JSON.stringify(result.explanations)}.
    Format with professional headers and ASCII borders.`);
  return response.text || "Failed to generate text report.";
};

export const reverseSignalGrounding = async (file: File): Promise<any> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const { response, isSafeMode } = await safeInvoke("gemini-1.5-flash", {
    parts: [
      { inlineData: { mimeType: file.type, data: base64Data } },
      { text: "Locate the primary source of this image using Google Search. Return JSON: {summary, originalEvent, manipulationDetected, confidence, findings: [{type, detail}]}" }
    ]
  }, {
    responseMimeType: "application/json",
    tools: [{ googleSearch: {} }]
  });

  const data = extractJson(response.text || "{}");
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => (chunk as any).web)
    .map(chunk => ({ title: (chunk as any).web?.title || "Verified Source", url: (chunk as any).web?.uri || "" })) || [];

  return { ...data, sources, isSafeMode };
};

export const analyzeMedia = async (file: File, metadata: any): Promise<AnalysisResult> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const isVideo = file.type.includes('video');

  // Upgraded to Pro model for better reasoning and reduced false positives
  const { response, isSafeMode } = await safeInvoke("gemini-1.5-flash", {
    parts: [
      { inlineData: { mimeType: file.type, data: base64Data } },
      {
        text: `You are a Senior Forensic Video Analyst. Perform a FRAME-BY-FRAME TEMPORAL ANALYSIS of this media.

        CRITICAL INSTRUCTION FOR ACCURACY:
        You must distinguish between "Low Quality/Compressed Real Video" and "AI Generated Video".
        
        1. **IGNORE STATIC ARTIFACTS**: Compression blocks, blurriness, grain, and pixelation are NORMAL in real videos (especially from phones/web). Do NOT flag these as AI.
        2. **HUNT FOR TEMPORAL FAILURES**: AI fails in *motion*. Look for:
           - **Flickering**: Faces or objects that flash/warp for a split second.
           - **Morphing**: Objects blending into each other.
           - **Physics Breaks**: Shadows that don't move correctly with the object.
           - **Inconsistent Anatomy**: Eyes that look different from frame to frame.
        3. **BIAS TOWARDS REALITY**: If the motion is fluid, the lip-sync is correct (even if low quality), and there are no "morphing" glitches, the verdict MUST be REAL.
        
        ${isVideo ? "VIDEO SPECIFIC: Check the lip movement against facial muscle activation. Real humans have complex micro-movements. Deepfakes often have 'floating' lips." : ""}

        JSON STRUCTURE REQUIRED:
        {
          "verdict": "REAL" | "LIKELY_FAKE",
          "deepfakeProbability": 0-100, // < 45% = Likely Real. Only go > 80% if you see impossible physics.
          "confidence": 0-100,
          "summary": "Technical summary focusing on temporal consistency and motion logic.",
          "userRecommendation": "Actionable advice.",
          "analysisSteps": {
            "integrity": {"score": 0-100, "explanation": "Compression vs Generation artifacts", "confidenceQualifier": "High"},
            "consistency": {"score": 0-100, "explanation": "Lighting physics across frames", "confidenceQualifier": "High"},
            "aiPatterns": {"score": 0-100, "explanation": "Temporal glitch scanning", "confidenceQualifier": "High"},
            "temporal": {"score": 0-100, "explanation": "Motion vector logic", "confidenceQualifier": "High"}
          },
          "explanations": [
            {
              "point": "Feature Name",
              "detail": "Observation about motion or consistency.",
              "category": "temporal" | "visual" | "audio",
              "timestamp": "MM:SS"
            }
          ]
        }` }
    ]
  }, {
    responseMimeType: "application/json",
    // System instruction enforces a skeptical stance on "Fake" verdicts unless proof is absolute
    systemInstruction: "You are a precise digital forensics engine. You prioritize minimizing false positives. You understand that real world video has noise, compression, and bad lighting. You ONLY flag content as FAKE if you detect temporal inconsistency (warping, morphing, flickering) that is impossible in physical reality."
  });

  const data = extractJson(response.text || "{}");

  let finalVerdict = Verdict.LIKELY_FAKE;
  const prob = data.deepfakeProbability ?? 50;

  // STRICTER Thresholds:
  // If probability is below 50%, force verdict to REAL.
  // This prevents "Uncertain" results from scaring users about real videos.
  if (prob < 50) {
    finalVerdict = Verdict.REAL;
  } else {
    finalVerdict = Verdict.LIKELY_FAKE;
  }

  return {
    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
    timestamp: Date.now(),
    verdict: finalVerdict,
    confidence: data.confidence ?? 0,
    confidenceLevel: (data.confidence > 85 ? 'High' : data.confidence < 50 ? 'Low' : 'Medium') as any,
    deepfakeProbability: prob,
    summary: data.summary || "Forensic analysis complete.",
    userRecommendation: data.userRecommendation || "Verify manually.",
    analysisSteps: data.analysisSteps || {
      integrity: { score: 0, explanation: "Pending...", confidenceQualifier: "Medium" },
      consistency: { score: 0, explanation: "Pending...", confidenceQualifier: "Medium" },
      aiPatterns: { score: 0, explanation: "Pending...", confidenceQualifier: "Medium" },
      temporal: { score: 0, explanation: "Pending...", confidenceQualifier: "Medium" }
    },
    explanations: Array.isArray(data.explanations) ? data.explanations : [],
    manipulationType: data.manipulationType || (prob > 50 ? "Neural Synthesis" : "N/A"),
    guidance: data.guidance || "Caution advised.",
    fileMetadata: metadata,
    isSafeMode
  };
};

export const analyzeText = async (text: string, mode: 'AI_DETECT' | 'FACT_CHECK'): Promise<TextAnalysisResult> => {
  const isFactCheck = mode === 'FACT_CHECK';
  const { response, isSafeMode } = await safeInvoke('gemini-1.5-flash', text, {
    responseMimeType: "application/json",
    systemInstruction: isFactCheck
      ? "Verify claims using Google Search. Return JSON: {claims: [{claim, status, sourceUrl, category}], summary}"
      : "Detect AI text. Return JSON: {aiProbability, verdictLabel, aiSignals, humanSignals, summary, linguisticMarkers}",
    tools: isFactCheck ? [{ googleSearch: {} }] : []
  });

  const result = extractJson(response.text || "{}");
  return {
    likelihoodRange: result.aiProbability ? `${result.aiProbability}%` : "0%",
    aiProbability: result.aiProbability ?? 0,
    verdictLabel: result.verdictLabel || "STRICT",
    ambiguityNote: "",
    aiSignals: result.aiSignals || [],
    humanSignals: result.humanSignals || [],
    isFactual: result.isFactual ?? 'STRICT',
    summary: result.summary || "Analysis complete.",
    claims: result.claims || [],
    linguisticMarkers: result.linguisticMarkers || [],
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => (chunk as any).web).map(chunk => ({
        title: (chunk as any).web?.title || "Source",
        url: (chunk as any).web?.uri || ""
      })) || [],
    isSafeMode
  };
};

export const startAssistantChat = () => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: "You are a world-class forensic assistant. You help users understand deepfake detection, text analysis, and source verification. Use Google Search for up-to-date facts.",
      tools: [{ googleSearch: {} }]
    }
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(audioBlob);
  });

  const { response } = await safeInvoke("gemini-1.5-flash", {
    parts: [
      { inlineData: { mimeType: audioBlob.type, data: base64Data } },
      { text: "Transcribe this audio precisely." }
    ]
  });

  return response.text || "";
};
