
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// Read API key from .env
let apiKey;
try {
    const env = fs.readFileSync(".env", "utf8");
    const apiKeyMatch = env.match(/GEMINI_API_KEY=([^\r\n]+)/) || env.match(/API_KEY=([^\r\n]+)/);
    apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;
} catch (e) {
    console.error("Failed to read .env:", e.message);
}

if (!apiKey) {
    console.error("No API key found in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

console.log("ai keys:", Object.keys(ai));
if (ai.models) {
    console.log("ai.models keys:", Object.keys(ai.models));
}
