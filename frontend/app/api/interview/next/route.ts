import { NextRequest, NextResponse } from 'next/server';

// Backend API base URL - should be configured via environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sessionId, 
      previousAnswerText, 
      // Audio mode optional fields
      audioAnswer,
      audioMimeType,
      inputMode,
      audioMode 
    } = body;

    // Validate required fields - either text answer or audio answer required
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // For audio mode, audio answer is required; for text mode, text answer is required
    if (inputMode === 'audio') {
      if (!audioAnswer) {
        return NextResponse.json(
          { error: 'Audio answer is required when using audio mode' },
          { status: 400 }
        );
      }
    } else {
      if (!previousAnswerText) {
        return NextResponse.json(
          { error: 'Missing required field: previousAnswerText' },
          { status: 400 }
        );
      }
    }

    // Forward request to backend (backend uses session.currentStep as single source of truth)
    const response = await fetch(`${BACKEND_URL}/api/interview/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        previousAnswerText: previousAnswerText || '',
        // Include optional audio fields
        ...(inputMode && { inputMode }),
        ...(audioAnswer && { audioAnswer }),
        ...(audioMimeType && { audioMimeType }),
        ...(audioMode !== undefined && { audioMode }),
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Backend error';
      let additionalData: Record<string, unknown> = {};
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        // Forward transcription failure flag if present
        if (errorData.transcriptionFailed) {
          additionalData.transcriptionFailed = true;
          additionalData.needsRetry = errorData.needsRetry;
        }
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage, ...additionalData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Response should contain either nextQuestion OR finalReport, plus currentStep and totalSteps
    // Also include optional audio response data
    return NextResponse.json({
      nextQuestion: data.nextQuestion,
      finalReport: data.finalReport,
      currentStep: data.currentStep,
      totalSteps: data.totalSteps,
      // Optional audio fields
      ...(data.questionAudio && { questionAudio: data.questionAudio }),
      ...(data.transcribedAnswer && { transcribedAnswer: data.transcribedAnswer }),
    });
  } catch (error) {
    console.error('Error in /api/interview/next:', error);
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
