import readline from "readline";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

const rawData = fs.readFileSync("./questionValidation/question.json", "utf-8");
const questions = JSON.parse(rawData);

dotenv.config();

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY not set in environment variables.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Enter 'off' to exit the chatbot.\n");

function askWithTimeout(
  question: string,
  timeoutMs: number
): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log("\n⏰ Time's up! You took too long to answer.");
      resolve(null);
    }, timeoutMs);

    rl.question(question, (answer) => {
      clearTimeout(timer);
      resolve(answer);
    });
  });
}

let score = 0;
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function main() {
  const randomizedQuestions = shuffleArray([...questions]); // avoid mutating original

  for (const q of randomizedQuestions) {
    console.log(`\nQuestion ${q.id}: ${q.question}`);
    const langChoice = await askWithTimeout(
      "Choose your language (swift/java/cpp): ",
      60_000
    );

    if (!langChoice || langChoice.toLowerCase() === "off") {
      console.log(`Chatbot session ended. Final score: ${score}`);
      break;
    }

    const lang = langChoice.toLowerCase();
    if (!(lang in q.solutions)) {
      console.log("❌ Invalid language choice. Skipping to next question.\n");
      continue;
    }

    const originalCode = q.solutions[lang];
    console.log(`\nHint: ${q.hint}`);
    const userCode = await askWithTimeout(
      `Rewrite this function:\n${originalCode}\n\nYour code:\n`,
      60_000
    );

    if (userCode === null) {
      score -= 3;
      console.log("❌ No answer received. -3 points.");
      console.log(`Current score: ${score}\n`);
      continue;
    }

    if (userCode.trim().toLowerCase() === "off") {
      console.log(`Chatbot session ended. Final score: ${score}`);
      break;
    }

    const prompt = `
You are a code evaluator. Your task is to verify whether the user's function is functionally like the original function.

Original function:
${originalCode}

User's rewritten function:
${userCode}

Notes:
- Ignore differences in whitespace, formatting, indentation, or variable names.
- Focus on the functional behavior: does the user's function perform the same operation?
- If the function returns the same output for the same input, it is considered correct.

Answer strictly with only one word: "true" or "false".
`;

    try {
      const response = await openai.chat.completions.create({
        model: "qwen/qwen3-30b-a3b:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const validation =
        response.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";

      if (validation === "true") {
        console.log("✅ Your code is correct.");
        score += 10;
      } else if (validation === "false") {
        console.log("❌ Your code is incorrect. Please try again.");
      } else {
        console.log("⚠️ Unexpected response from AI:", validation);
      }

      console.log(`Current score: ${score}\n`);
    } catch (error) {
      console.error("❌ Error communicating with Qwen AI:", error);
      break;
    }
  }

  rl.close();
}

main();
