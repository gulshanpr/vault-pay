import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderHash = searchParams.get("orderHash");

    if (!orderHash) {
      return NextResponse.json(
        { error: "Order hash is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_DEV_PORTAL_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Make request to 1inch API to get ready fills
    const response = await fetch(
      `https://api.1inch.dev/fusion-plus/relayer/v1.0/orders/ready-to-accept-secret-fills/${orderHash}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // 404 is expected when no fills are ready
      if (response.status === 404) {
        return NextResponse.json({ fills: [] });
      }
      console.error("1inch Fills API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `1inch API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fills API error:", error);
    return NextResponse.json(
      { error: "Failed to get fills", details: error.message },
      { status: 500 }
    );
  }
}
