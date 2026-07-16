# Self-Consistent Prompting

A command-line tool that asks the same question to three different AI models, then uses a fourth pass to merge their answers into one refined response. Instead of trusting a single model, it compares several and keeps the best of each.


This is a **CLI-based app** — there's no web UI. You run it from the terminal and read the output right there.

## SDKs used

| Role | Provider | SDK |
|------|----------|-----|
| Answer | Anthropic Claude | `@anthropic-ai/sdk` |
| Answer | OpenAI | `openai` |
| Answer | Google Gemini | `@google/genai` |
| Synthesizer | Anthropic Claude | `@anthropic-ai/sdk` |

Exact model names are read from environment variables, so you can swap them without touching the code.

## How it works

1. You type a question
2. The question goes to Claude, OpenAI and Gemini **in parallel**
3. Each model's answer is printed as it comes back. If one model fails, the others still continue
4. All the successful answers are handed to Claude one more time — this time as an **evaluator**
5. Claude compares the answers, keeps the strongest parts, drops the weak ones, and returns a single refined answer

## The self-consistency flow

Self-consistency here means the final answer isn't just a copy of whichever model replied — it's built by judging multiple answers against each other.

- The three model calls run through `Promise.allSettled`, so a single failure never breaks the run
- Only the answers that succeeded are passed forward
- The evaluator (`optimizedOutput.js`) wraps those answers in a prompt that tells Claude to compare them, resolve contradictions, and produce one self-contained answer — without mentioning the other models
- If only one model succeeds, it's returned as-is (nothing to compare). If synthesis itself fails, the tool falls back to the best single answer instead of crashing

## Setup

### Step 1

Create a `.env` file and add the below mentioned var in `.env`:

```env
# Anthropic
ANTHROPIC_API_KEY=<your_anthopic-api-key>
ANTHROPIC_MODEL_NAME=<your-claude-model-name>
ANTHROPIC_SYNTHESIZER_MODEL=<your-claude-sythesizer-model-name>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL_NAME=<your-openai-model-name>

# Google Gemini
GOOGLE_API_KEY=<your-gemini-api-key>
GOOGLE_MODEL_NAME=<your-gemini-model-name>
```

### Step 2

```bash
pnpm install
```

## Usage

```bash
# interactive — it will prompt you for a question
pnpm start

OR

# pass the question directly
node src/index.js "Explain closures in JavaScript"
```

## Project structure

```
src/
  index.js             CLI orchestrator (input -> parallel calls -> synthesis -> output)
  claudePrompting.js   askClaude()
  openaiPrompting.js   askOpenAI()
  geminiPrompting.js   askGemini()
  optimizedOutput.js   synthesizeBestAnswer() - Claude as evaluator
  utils.js             colors, section headers, loading spinner
```

