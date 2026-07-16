#!/usr/bin/env node

import "dotenv/config"
import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { askClaude, claudeModelName } from "./claudePrompting.js"
import { askOpenAI, openaiModelName } from "./openaiPrompting.js"
import { askGemini, geminiModelName } from "./geminiPrompting.js"
import { synthesizeBestAnswer, synthesizerModelName } from "./optimizedOutput.js"
import { color, section, startSpinner } from "./utils.js"

const MODEL_METADATA = [
    { label: "Claude", model: claudeModelName, run: askClaude, colorFn: color.magenta },
    { label: "OpenAI", model: openaiModelName, run: askOpenAI, colorFn: color.green },
    { label: "Gemini", model: geminiModelName, run: askGemini, colorFn: color.blue },
];

/**
 * Reads the user input from CLI
 * @returns {Promise<string>}
 */
async function getUserQuestion() {
    const argQuestion = process.argv.slice(2).join(" ").trim();
    if (argQuestion) {
        return argQuestion;
    }
    const readLineInterface = readline.createInterface({ input, output });
    try {
        const answer = await readLineInterface.question(
            color.bold(color.cyan("\n💬 Enter your question: "))
        );
        return answer.trim();
    } finally {
        readLineInterface.close();
    }
}

/**
 * Runs all model calls in parallel and returns results tagged with their model metadata
 * @param {string} question
 */
async function queryAllModels(question) {
    const settled = await Promise.allSettled(
        MODEL_METADATA.map((m) => m.run(question))
    );

    return settled.map((result, idx) => ({
        ...MODEL_METADATA[idx],
        status: result.status,
        answer: result.status === "fulfilled" ? result.value : null,
        error: result.status === "rejected" ? result.reason : null,
    }));
}

function printModelResults(results) {
    for (const r of results) {
        section(`🤖 ${r.label}  ${color.gray(`(${r.model})`)}`, r.colorFn);
        if (r.status === "fulfilled") {
            console.log(r.answer);
        } else {
            const message = r.error?.message || String(r.error);
            console.log(color.red(`✖ Failed: ${message}`));
        }
    }
}

async function main() {
    section("⚡ Self-Consistent Prompting", color.cyan);
    console.log(
        color.dim("Ask once → compare Claude, OpenAI & Gemini → get one refined answer.")
    );

    const question = await getUserQuestion();
    if (!question) {
        console.log(color.yellow("\nNo question provided. Exiting."));
        process.exitCode = 1;
        return;
    }

    //  Step 1 : query all models in parallel 
    const stopSpinner = startSpinner("Querying Claude, OpenAI & Gemini in parallel");
    let results;
    try {
        results = await queryAllModels(question);
    } finally {
        stopSpinner();
    }

    printModelResults(results);

    const successful = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => ({ model: `${r.label} (${r.model})`, answer: r.answer }));

    //  Guard: nothing succeeded
    if (successful.length === 0) {
        section("❌ Final Answer", color.red);
        console.log(
            color.red(
                "All model calls failed. Check your API keys and network, then try again."
            )
        );
        process.exitCode = 1;
        return;
    }

    //  Step 2: synthesize the best answer with Claude 
    const stopSynth = startSpinner(
        `Synthesizing best answer with ${synthesizerModelName}`);
    let finalAnswer;
    try {
        finalAnswer = await synthesizeBestAnswer(question, successful);
    } catch (err) {
        stopSynth();
        section("⚠️  Final Answer (fallback)", color.yellow);
        console.log(
            color.yellow(
                `Synthesis failed: ${err?.message || err}\nShowing the best available single response instead:\n`
            )
        );
        console.log(successful[0].answer);
        process.exitCode = 1;
        return;
    }
    stopSynth();

    //  Step 4: present the refined final answer 
    section("✨ Final Synthesized Answer", color.cyan);
    console.log(color.dim(`(refined from ${successful.length} model response(s))\n`));
    console.log(finalAnswer);
    console.log();
}

main().catch((err) => {
    console.error(color.red(`\nUnexpected error: ${err?.message || err}`));
    process.exitCode = 1;
});
