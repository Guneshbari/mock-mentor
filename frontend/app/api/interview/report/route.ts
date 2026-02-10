import { NextRequest, NextResponse } from 'next/server';

// Backend API base URL - should be configured via environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const audioSummary = searchParams.get('audioSummary');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }

    // Build query string with optional audioSummary parameter
    let queryString = `sessionId=${sessionId}`;
    if (audioSummary === 'true') {
      queryString += '&audioSummary=true';
    }

    // Forward Authorization header if present
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/interview/report?${queryString}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Backend error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Response should contain finalReport according to mapping
    // Also include optional audioSummary if available
    return NextResponse.json({
      finalReport: data.finalReport,
      ...(data.audioSummary && { audioSummary: data.audioSummary }),
    });
  } catch (error) {
    console.error('Error in /api/interview/report:', error);
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to backend server. Please ensure the backend is running on port 8000.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
