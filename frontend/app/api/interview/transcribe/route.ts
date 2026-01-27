import { NextRequest, NextResponse } from 'next/server';

// Backend API base URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { audioAnswer, audioMimeType } = body;

        if (!audioAnswer) {
            return NextResponse.json(
                { error: 'audioAnswer is required' },
                { status: 400 }
            );
        }

        // Forward to backend transcription endpoint
        const response = await fetch(`${BACKEND_URL}/api/interview/transcribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audioAnswer,
                audioMimeType: audioMimeType || 'audio/webm',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: data.error || 'Failed to transcribe audio',
                    needsRetry: data.needsRetry
                },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            transcribedText: data.transcribedText
        });
    } catch (error) {
        console.error('Error in /api/interview/transcribe:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to transcribe audio. Please try again.'
            },
            { status: 500 }
        );
    }
}
