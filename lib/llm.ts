import { InferenceClient, type InferenceProvider } from "@huggingface/inference";
import type { BaseMessage } from "@langchain/core/messages";

type HfRole = "system" | "user" | "assistant";

export function getClient() { 
    const key = process.env.HF_API_KEY;
    if (!key) {
        throw new Error("Hugging Face API key not set in environment variables");
    }
    return new InferenceClient(key);
}

export function getModel() {
    const model = process.env.HF_TEXT_MODEL ?? process.env.HF_TEXT_MODEL_BACKUP;
    return model;
}

export function getProvider() {
    const provider = (process.env.HF_PROVIDER?.trim() ?? "auto") as InferenceProvider;
    return provider;
}

function lcTypeToRole(t: string): HfRole {
    switch(t) {
        case "system":
            return "system";
        case "human":
            return "user";
        case "ai":
            return "assistant";
        default:
            return "user";
    }
}

function lcMessagesToHf(messages: BaseMessage[]) {
    return messages.map((msg) => {
        const role = lcTypeToRole(msg.type);
        const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        return {
            role,
            content: content,
        };
    });
}

export async function generateText(opt: {
    messages: BaseMessage[], temperature?: number, maxTokens?: number
}) {
    const client = getClient();
    const model = getModel();
    const provider = getProvider();

    const res = await client.chatCompletion({
        model,
        provider,
        messages: lcMessagesToHf(opt.messages),
        temperature: opt.temperature,
        max_tokens: opt.maxTokens,
    })

    return res.choices?.[0]?.message?.content ?? "";
}