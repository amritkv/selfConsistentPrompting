import { Anthropic } from "@anthropic-ai/sdk";
import "dotenv/config";

const SYNTHESIZER_MODEL = process.env.ANTHROPIC_SYNTHESIZER_MODEL;

let client;

function getClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error(
            "Missing ANTHROPIC_API_KEY (required for the synthesizer). Add it to your .env file."
        );
    }
    if (!client) {
        client = new Anthropic({ apiKey });
    }
    return client;
}

/**
 * Claude is asked to act as a judge that compares candidate answers and
 * synthesizes a single, superior response.
 * @param {string} question - The original user question
 * @param {Array<{model: string, answer: string}>} candidates - Answers from previous models
 */
function buildEvaluatorPrompt(question, candidates) {
    const numbered = candidates
        .map(
            (c, idx) =>
                `### Candidate ${idx + 1} — ${c.model}\n${c.answer}`
        )
        .join("\n\n");

    return [
        "You are a rigorous evaluator applying self-consistency across multiple AI answers.",
        "",
        `Original user question:\n"""${question}"""`,
        "",
        "Candidate answers from different AI models:",
        "",
        numbered,
        "",
        "Your task:",
        "1. Compare the candidate answers for correctness, completeness, clarity, and usefulness.",
        "2. Identify the strongest parts of each and discard weak, incorrect, or redundant content.",
        "3. Resolve any contradictions between the candidates using sound reasoning.",
        "4. Produce ONE refined, self-consistent final answer that is better than any single candidate.",
        "",
        "Rules:",
        "- Do NOT simply copy a single candidate answer word-for-word.",
        "- Do NOT mention the candidates, models, or this evaluation process.",
        "- Return ONLY the final answer for the user, well-formatted and self-contained.",
        "- Do NOT be biased towards any particular ideology of any domain;"
    ].join("\n");
}

/**
 * Synthesizes the best possible answer from the collected model responses
 * using Claude as the final evaluator (self-consistent prompting)
 * @param {string} question - The original user question
 * @param {Array<{model: string, answer: string}>} candidates - Answers from previous models
 * @returns {Promise<string>} The refined final answer
 */
export async function synthesizeBestAnswer(question, candidates) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error("No successful model responses to synthesize.");
    }

    if (candidates.length === 1) {
        return candidates[0].answer;
    }

    if (!SYNTHESIZER_MODEL) {
        throw new Error(
            "Missing ANTHROPIC_SYNTHESIZER_MODEL. Add it to your .env file."
        );
    }

    const response = await getClient().messages.create({
        max_tokens: 2048,
        model: SYNTHESIZER_MODEL,
        messages: [
            { role: "user", content: buildEvaluatorPrompt(question, candidates) },
        ],
    });

    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

    if (!text) {
        throw new Error("Synthesizer (Claude) returned an empty response.");
    }
    return text;
}

export const synthesizerModelName = SYNTHESIZER_MODEL;
