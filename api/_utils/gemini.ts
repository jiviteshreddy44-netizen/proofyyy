import { GoogleGenAI } from "@google/genai";

/**
 * Manages rotation across multiple Gemini API keys on the server.
 */
class KeyManager {
    private static keys: string[] = (process.env.GEMINI_KEYS || process.env.GEMINI_API_KEY || "").split(',').filter(k => k.trim());
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

const getAI = () => {
    const apiKey = KeyManager.getCurrentKey();
    if (!apiKey) {
        throw new Error("API_KEY_MISSING");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Server-side resilient wrapper for Gemini API calls.
 */
export const safeInvoke = async (primaryModel: string, contents: any, config: any = {}) => {
    let attempts = 0;
    const maxAttempts = KeyManager.getKeyCount();
    const fallbackModel = "gemini-flash-latest";

    while (attempts < maxAttempts) {
        const ai = getAI();
        try {
            // Prioritize 2.5 Flash
            const modelToUse =
                primaryModel === "gemini-1.5-flash" ||
                    primaryModel === "gemini-2.0-flash"
                    ? "gemini-2.5-flash"
                    : primaryModel;

            const result = await ai.models.generateContent({
                model: modelToUse,
                contents,
                config
            });

            // Extract response text safely
            return { response: result.text || "", isSafeMode: false };
        } catch (err: any) {
            const errorMsg = err.message || JSON.stringify(err);

            const isQuotaOrNetworkError =
                errorMsg.includes("429") ||
                errorMsg.includes("quota") ||
                errorMsg.includes("exhausted") ||
                errorMsg.includes("Limit reached") ||
                errorMsg.includes("System Busy") ||
                errorMsg.includes("Cooling Down") ||
                errorMsg.includes("fetch");

            if (isQuotaOrNetworkError && KeyManager.rotate()) {
                attempts++;
                continue;
            }

            if (isQuotaOrNetworkError || errorMsg.includes("404")) {
                const aiFallback = getAI();
                const result = await aiFallback.models.generateContent({
                    model: fallbackModel,
                    contents,
                    config
                });
                return { response: result.text || "", isSafeMode: true };
            }
            throw err;
        }
    }
    throw new Error("All API keys have exhausted their quota.");
};
