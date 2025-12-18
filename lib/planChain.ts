import { ChatPromptTemplate } from "@langchain/core/prompts";
import { planSchema, type PlanJson } from "./planSchema";
import { generateText } from "./llm";

type PlanInput = {
    skillName: string;
    level: string;
    dailyMinutes: number;
    totalDays: number;
    retrievedContext?: string;
}

// Extract JSON candiates from LLM responses with backups
function parsePlan(text: string): PlanJson {
    const candidates = [];

    const fenced = [...text.matchAll(/```json\s*([\s\S]*?)```/gi)].map((m) => m[1]);
    candidates.push(...fenced);

    const anyFenced = [...text.matchAll(/```\s*([\s\S]*?)```/g)].map((m) => m[1]);
    candidates.push(...anyFenced);

    candidates.push(text);

    const uniq = Array.from(new Set(candidates));

    for (const candidate of uniq) {
        try {
            const parsed = planSchema.parse(JSON.parse(candidate));
            return parsed;
        }
        catch (error) {
            continue;
        }
    }
    
    throw new Error("Failed to parse plan from LLM response");
}

export async function generatePlan(input: PlanInput): Promise<PlanJson> {
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            [
                "You are an expert skill development planner and habit formation coach. Generate a realistic, low-risk, effective plan to help the user learn a new skill or habit.",
                "Avoid false or misleading information. Avoid medical/legal/financial advice. No diagnosis or treatment instructions. No overly sensitive topics.",
                "Use the user's input to create a detailed plan broken down into daily sprints.",
                "Follow the requested output schema exactly."
            ].join("\n"),
        ],
        [
            "human",
            [
                "Skill: {skillName}",
                "Level: {level}",
                "Daily Time Commitment (minutes): {dailyMinutes}",
                "Total Days: {totalDays}",
                "",
                "User context (may be empty):",
                "{retrievedContext}",
                "",
                "Generate a plan with an overview and day-by-day breakdown in JSON format.",
                "",
                "REQUIRED JSON SCHEMA:",
                "{{",
                '  "overview": "string describing the overall plan",',
                '  "days": [',
                "    {{",
                '      "day": 1,',
                '      "title": "Day title",',
                '      "estimatedMins": 30,',
                '      "instructions": ["Step 1", "Step 2", "Step 3"],',
                '      "reflectionQuestion": "Question for reflection"',
                "    }}",
                "  ]",
                "}}",
                "",
                "Quality Guidelines:",
                "- Each day must include a thorough amount of steps, on average probably at least 5 depending on the topic.",
                "- Each step must include a time estimate in paranthesis (e.g., 'Step 1 (10 mins)').",
                "- Include at least one active recall activity and one review activity per day.",
                "- Make sure the estimatedMins per day adds up to the requested dailyMinutes.",
                "- Use clear, concise language suitable for beginners.",
                "- Ensure the plan is engaging and varied to maintain user interest.",
                "- Make progression across days (e.g., increasing difficulty or building on prior knowledge).",
                "- Tailor the plan to the specified skill level.",
                "- Avoid overly generic or vague instructions. Be specific.",
                "",
                "CRITICAL REQUIREMENTS:",
                "- overview must be a single string (NOT an object)",
                "- Each day must have a 'day' field (number starting from 1)",
                "- instructions must be an array of strings (NOT objects with title/time)",
                "- Output ONLY valid JSON matching this exact structure",
                "",
            ].join("\n"),
        ],
    ]);

    const messages = await prompt.formatMessages({
        ...input,
        retrievedContext: input.retrievedContext ?? "",
    });

    const raw = await generateText({
        messages,
        temperature: 0,
        maxTokens: 3500,
    });

    try {
        return parsePlan(raw);
    }
    catch (error) {
        const retryPrompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                "CRITICAL: Output ONLY the plan JSON object (with overview + days). Do NOT output schema. Do NOT use markdown fences.",
            ],
            ["human", "Rewrite your answer as ONLY the JSON object. Here was your previous output:\n\n" + raw],
        ]);

        const retryMessages = await retryPrompt.formatMessages({});

        const retryRaw = await generateText({
            messages: retryMessages,
            temperature: 0,
            maxTokens: 3500,
        });

        return parsePlan(retryRaw);
    }
}