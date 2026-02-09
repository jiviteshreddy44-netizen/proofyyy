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
      const result = await ai.models.generateContent({
        model: primaryModel === "gemini-1.5-flash" ? "gemini-2.0-flash" : primaryModel,
        contents,
        config
      });
      return { response: result, isSafeMode: false };
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted");

      if (isQuotaError && KeyManager.rotate()) {
        attempts++;
        console.warn(`Quota reached for key. Retrying with next key (Attempt ${attempts}/${maxAttempts})...`);
        continue; // Try again with the next key
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
  const isAudio = file.type.includes('audio');

  let prompt = "";

  if (isAudio) {
    prompt = `You are a Senior Audio Forensic Analyst. Perform a deep acoustic analysis of this audio file to detect deepfakes, voice cloning, or synthetic speech (TTS).

    1. **Natural vs. Synthetic Indicators**:
       - **REAL**: Natural breaths, varied pacing, consistent room tone, imperfect articulation.
       - **FAKE (AI)**: Metallic tint, phase issues, perfectly consistent pitch, lack of breaths.

    2. **Score Logic - CRITICAL**:
       - **IF VERDICT IS REAL**: Every score in "analysisSteps" MUST be LOW (between 0 and 15). 
       - **IF VERDICT IS FAKE**: Scores in "analysisSteps" should be HIGH (80-100).
       - Do NOT return an Authentic verdict with High anomaly scores.

    JSON STRUCTURE REQUIRED:
    {
      "verdict": "REAL" | "LIKELY_FAKE",
      "deepfakeProbability": 0-100,
      "confidence": 0-100,
      "summary": "Technical summary.",
      "userRecommendation": "Actionable advice.",
      "analysisSteps": {
        "integrity": {"score": 0-100, "explanation": "Noise floor analysis", "confidenceQualifier": "High"},
        "consistency": {"score": 0-100, "explanation": "Tone logic", "confidenceQualifier": "High"},
        "aiPatterns": {"score": 0-100, "explanation": "Synthetic artifacts", "confidenceQualifier": "High"},
        "temporal": {"score": 0-100, "explanation": "Flow analysis", "confidenceQualifier": "High"}
      },
      "explanations": [{"point": "Feature", "detail": "Observation", "category": "audio", "timestamp": "MM:SS"}]
    }`;
  } else {
    prompt = `You are a Senior Forensic Video Analyst. Perform a FRAME-BY-FRAME TEMPORAL ANALYSIS.

    CRITICAL INSTRUCTION:
    1. **SCORE CONSISTENCY**: If you determine the media is REAL, your anomaly scores in "analysisSteps" MUST be LOW (under 15/100). 
    2. Do NOT report 100/100 anomaly if the verdict is REAL.
    3. Low Quality (Blur/Compression) != AI. Only flag impossible physics or warping.

    JSON STRUCTURE REQUIRED:
    {
      "verdict": "REAL" | "LIKELY_FAKE",
      "deepfakeProbability": 0-100,
      "confidence": 0-100,
      "summary": "Technical summary.",
      "userRecommendation": "Actionable advice.",
      "analysisSteps": {
        "integrity": {"score": 0-100, "explanation": "Compression vs Generation", "confidenceQualifier": "High"},
        "consistency": {"score": 0-100, "explanation": "Lighting physics", "confidenceQualifier": "High"},
        "aiPatterns": {"score": 0-100, "explanation": "Artifact scanning", "confidenceQualifier": "High"},
        "temporal": {"score": 0-100, "explanation": "Motion logic", "confidenceQualifier": "High"}
      },
      "explanations": [{"point": "Feature", "detail": "Observation", "category": "temporal", "timestamp": "MM:SS"}]
    }`;
  }

  const { response, isSafeMode } = await safeInvoke("gemini-1.5-flash", {
    parts: [
      { inlineData: { mimeType: file.type, data: base64Data } },
      { text: prompt }
    ]
  }, {
    responseMimeType: "application/json",
    systemInstruction: "You are a precise digital forensics engine. You ONLY flag content as FAKE if you detect artifacts impossible in physical reality. Ensure individual metric scores align with the overall verdict."
  });

  const data = extractJson(response.text || "{}");

  let finalVerdict = Verdict.LIKELY_FAKE;
  const prob = data.deepfakeProbability ?? 50;

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