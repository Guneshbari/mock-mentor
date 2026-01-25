import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewConfig } = body;

    // Validate required fields according to mapping document
    if (
      !interviewConfig ||
      typeof interviewConfig.interviewType !== 'string' ||
      typeof interviewConfig.role !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: interviewType and role are required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewConfig }),
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

    // Enforce response shape according to mapping
    // Include optional questionAudio if audio mode was enabled
    return NextResponse.json({
      sessionId: data.sessionId,
      firstQuestion: data.firstQuestion,
      totalSteps: data.totalSteps,
      ...(data.questionAudio && { questionAudio: data.questionAudio }),
    });
  } catch (error) {
    console.error('Error in /api/interview/start:', error);
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
