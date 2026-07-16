import { Anthropic } from "@anthropic-ai/sdk"
import "dotenv/config"

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL_NAME;

/**
 * Lazily create the Anthropic client so a missing key produces a clear
 * and catchable error instead of crashing at import time.
 */
let client;
function getClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("Missing ANTHROPIC_API_KEY. Add it to your .env file.");
    }
    if (!client) {
        client = new Anthropic({ apiKey });
    }
    return client;
}

/**
 * @param {string} prompt - The user's question
 * @returns {Promise<string>} The model's answer as plain text
 */
export async function askClaude(prompt) {
    if (!CLAUDE_MODEL) {
        throw new Error(
            "Missing ANTHROPIC_MODEL_NAME. Add it to your .env file."
        );
    }
    if (!prompt || !prompt.trim()) {
        throw new Error("Prompt is empty or whitespace.");
    }
    const response = await getClient().messages.create({
        max_tokens: 1024,
        model: CLAUDE_MODEL,
        messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

    if (!text) {
        throw new Error("Claude returned an empty response.");
    }
    return text;
}

export const claudeModelName = CLAUDE_MODEL;
