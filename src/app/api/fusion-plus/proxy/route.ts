import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      process.env.DEV_PORTAL_KEY || process.env.NEXT_PUBLIC_DEV_PORTAL_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const { method, url, data } = await request.json();
    if (!method || !url) {
      return NextResponse.json(
        { error: "Missing method or url" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    let fetchUrl: string = url;
    if (fetchUrl.startsWith("/")) {
      fetchUrl = `https://api.1inch.dev${fetchUrl}`;
    }

    const resp = await fetch(fetchUrl, {
      method,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: method === "GET" ? undefined : JSON.stringify(data ?? {}),
    });

    const text = await resp.text();
    const contentType = resp.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? JSON.parse(text)
      : { raw: text };

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: `1inch API error: ${resp.status} ${resp.statusText}`,
          details: payload,
        },
        { status: resp.status }
      );
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Proxy error", details: e?.message },
      { status: 500 }
    );
  }
}
