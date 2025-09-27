import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('Fetching from 1inch API...');
    const response = await fetch('https://api.1inch.dev/portfolio/portfolio/v5.0/general/supported_chains', {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEV_PORTAL_KEY}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supported chains', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
