// Server-only helper: calls Google Gemini through the Lovable AI Gateway (streamed, accumulated).
const MODEL = "google/gemini-3.8-flash";

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function geminiJSON(messages: unknown[]): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AiError(401, "AI is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok || !res.body) {
    let msg = `AI request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    if (res.status === 402) msg = "Out of AI credits. Add credits in Settings → Plans & credits.";
    if (res.status === 429) msg = "AI is rate limited right now. Please try again in a minute.";
    throw new AiError(res.status, msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        if (j.error) throw new AiError(500, j.error.message || "AI stream error");
        text += j.choices?.[0]?.delta?.content ?? "";
      } catch (e) {
        if (e instanceof AiError) throw e;
      }
    }
  }
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!cleaned) throw new AiError(500, "The AI returned an empty response.");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AiError(500, "The AI response could not be read as structured data.");
  }
}
