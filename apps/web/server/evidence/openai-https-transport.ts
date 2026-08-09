import { request as httpsRequest } from "node:https";
import type { OpenAiResponsesRequest, OpenAiResponsesResponse, OpenAiTransport } from "./openai-adapter.ts";

const MAX_RESPONSE_BYTES = 1_000_000;

class OpenAiHttpError extends Error {
  readonly status: number;
  readonly transient: boolean;

  constructor(status: number) {
    super(`OpenAI Responses API returned HTTP ${status}.`);
    this.status = status;
    this.transient = status === 408 || status === 429 || status >= 500;
  }
}

function outputText(value: Record<string, unknown>): string | undefined {
  if (typeof value.output_text === "string") return value.output_text;
  if (!Array.isArray(value.output)) return undefined;
  for (const item of value.output) {
    if (!item || typeof item !== "object" || !Array.isArray((item as { content?: unknown }).content)) continue;
    for (const content of (item as { content: unknown[] }).content) {
      if (content && typeof content === "object" && typeof (content as { text?: unknown }).text === "string") return (content as { text: string }).text;
    }
  }
  return undefined;
}

export class OpenAiHttpsTransport implements OpenAiTransport {
  createResponse(body: OpenAiResponsesRequest, options: { signal: AbortSignal; timeoutMs: number; idempotencyKey: string }): Promise<OpenAiResponsesResponse> {
    return new Promise((resolve, reject) => {
      // Read the credential only at invocation time. It is never retained on this object.
      const apiKey = process.env.HMM_AI_OPENAI_API_KEY;
      if (!apiKey) {
        reject(new Error("OpenAI API key is not present in the server process environment."));
        return;
      }
      const encoded = Buffer.from(JSON.stringify(body));
      const request = httpsRequest({
        protocol: "https:", hostname: "api.openai.com", port: 443, path: "/v1/responses", method: "POST",
        signal: options.signal,
        timeout: options.timeoutMs,
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "content-length": encoded.byteLength,
          "idempotency-key": options.idempotencyKey,
          "x-client-request-id": options.idempotencyKey,
        },
      }, (response) => {
        const chunks: Buffer[] = [];
        let received = 0;
        response.on("data", (chunk: Buffer) => {
          received += chunk.byteLength;
          if (received > MAX_RESPONSE_BYTES) request.destroy(new Error("OpenAI response exceeded the transport limit."));
          else chunks.push(chunk);
        });
        response.on("end", () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) { reject(new OpenAiHttpError(status)); return; }
          try {
            const raw = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
            const usage = raw.usage && typeof raw.usage === "object" ? raw.usage as Record<string, unknown> : undefined;
            resolve({
              id: typeof raw.id === "string" ? raw.id : response.headers["x-request-id"]?.toString() ?? "unknown",
              model: typeof raw.model === "string" ? raw.model : undefined,
              status: raw.status === "completed" || raw.status === "incomplete" || raw.status === "failed" ? raw.status : "failed",
              output_text: outputText(raw),
              refusal: typeof raw.refusal === "string" ? raw.refusal : undefined,
              incomplete_details: raw.incomplete_details,
              usage: usage ? {
                input_tokens: typeof usage.input_tokens === "number" ? usage.input_tokens : undefined,
                output_tokens: typeof usage.output_tokens === "number" ? usage.output_tokens : undefined,
                total_tokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined,
              } : undefined,
            });
          } catch { reject(new Error("OpenAI response was not valid JSON.")); }
        });
      });
      request.on("timeout", () => request.destroy(new Error("OpenAI request timed out.")));
      request.on("error", reject);
      request.end(encoded);
    });
  }
}
