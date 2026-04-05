export type AIProvider = "mock" | "http";

const rawProvider = (process.env.AI_PROVIDER || "mock").toLowerCase();

export const aiProvider: AIProvider = rawProvider === "http" ? "http" : "mock";
export const aiEndpoint = process.env.AI_ENDPOINT || "";
export const aiApiKey = process.env.AI_API_KEY || "";
export const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);

