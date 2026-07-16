import { GoogleGenAI } from "@google/genai"
import "dotenv/config"

const GEMINI_MODEL = process.env.GOOGLE_MODEL_NAME;
/**
 * Lazily create the Google Gemini client so a missing key produces a clear
 * and catchable error instead of crashing at import time.
 */
let client;
function getClient() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_API_KEY. Add it to your .env file.");
    }
    if (!client) {
        client = new GoogleGenAI({ apiKey });
    }
    return client;
}

/**
 * @param {string} prompt - The user's question
 * @returns {Promise<string>} The model's answer as plain text
 */
export async function askGemini(prompt) {
    if (!GEMINI_MODEL) {
        throw new Error(
            "Missing GOOGLE_MODEL_NAME. Add it to your .env file."
        );
    }
    if (!prompt || !prompt.trim()) {
        throw new Error("Prompt is empty or whitespace.");
    }
    const response = await getClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
    });

    const text = (response.text || "").trim();
    if (!text) {
        throw new Error("Gemini returned an empty response.");
    }
    return text;
}

export const geminiModelName = GEMINI_MODEL;
