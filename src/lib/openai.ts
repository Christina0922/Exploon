import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

