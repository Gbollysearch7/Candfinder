import { NextRequest, NextResponse } from "next/server";

const EXA_BASE = "https://api.exa.ai/websets/v0";

function getApiKey(): string {
  const envKey = process.env.EXA_API_KEY;
  if (envKey) return envKey;
  throw new Error("EXA_API_KEY environment variable is not set");
}

export async function exaProxy(
  req: NextRequest,
  path: string,
  options?: { method?: string }
): Promise<NextResponse> {
  try {
    const apiKey = getApiKey();
    const method = options?.method ?? req.method;

    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
      try {
        const json = await req.json();
        body = JSON.stringify(json);
      } catch {
        // No body
      }
    }

    // Forward query params
    const queryString = req.nextUrl.searchParams.toString();
    const fullUrl = `${EXA_BASE}${path}${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(fullUrl, {
      method,
      headers,
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Exa proxy error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
