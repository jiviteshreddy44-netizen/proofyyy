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
 * Resilient wrapper that calls the server-side backend.
 */
const safeInvoke = async (model: string, contents: any, config: any = {}) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents, config })
  });

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("FILE_TOO_LARGE: The file is too large for the forensic engine. Please use a smaller clip or a lower resolution (max ~4MB).");
    }

    let errorMsg = 'Backend failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      const text = await response.text();
      if (text.includes("Request Entity Too Large")) {
        throw new Error("FILE_TOO_LARGE: The file is too large (max ~4MB after encryption).");
      }
      errorMsg = text || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return await response.json();
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
  if (file.size > 3.8 * 1024 * 1024) {
    throw new Error("FILE_TOO_LARGE: This file is too large to process. Please upload a clip under 4MB.");
  }

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
  return {
    sendMessage: async (message: string, history: any[] = []) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();
      return { response: { text: () => data.response } };
    }
  };
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