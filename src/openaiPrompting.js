import OpenAI from "openai"
import "dotenv/config"

const OPENAI_MODEL = process.env.OPENAI_MODEL_NAME;

/**
 * Lazily create the OpenAI client so a missing key produces a clear,
 * and catchable error instead of crashing at import time
 */
let client;
function getClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY. Add it to your .env file.");
    }
    if (!client) {
        client = new OpenAI({ apiKey });
    }
    return client;
}

/**
 * @param {string} prompt - The user's question
 * @returns {Promise<string>} The model's answer as plain text
 */
export async function askOpenAI(prompt) {
    if (!OPENAI_MODEL) {
        throw new Error(
            "Missing OPENAI_MODEL_NAME. Add it to your .env file."
        );
    }
    if (!prompt || !prompt.trim()) {
        throw new Error("Prompt is empty or whitespace.");
    }
    const response = await getClient().responses.create({
        model: OPENAI_MODEL,
        input: prompt,
    });

    const text = (response.output_text || "").trim();
    if (!text) {
        throw new Error("OpenAI returned an empty response.");
    }
    return text;
}

export const openaiModelName = OPENAI_MODEL;
