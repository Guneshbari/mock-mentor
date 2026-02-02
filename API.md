# Mock Mentor API Documentation

Backend API for the Mock Mentor AI Interview Platform, powered by **Groq & Llama 3**.

## Base URL

```
Development: http://localhost:8000
Production: Your deployed backend URL
```

## Authentication

All API endpoints that require user context (database persistence) accept a `Authorization` header with a Supabase JWT token.

```
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```

If no token is provided, the API works in ephemeral mode (no database storage).

---

## API Endpoints

### 1. Start Interview

**POST** `/api/interview/start`

Initialize a new interview session.

**Request Body:**
```json
{
  "interviewConfig": {
    "role": "Frontend Developer",
    "candidateName": "John Doe",
    "candidateGender": "male",
    "interviewType": "technical", // "technical", "hr", "behavioral"
    "experiencePreset": "mid",    // "fresh", "junior", "senior"
    "audioMode": false
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "firstQuestion": "Explain the concept of closures in JavaScript...",
  "totalSteps": 5,
  "questionAudio": "base64_audio_string..." // If audioMode is true
}
```

---

### 2. Submit Answer & Get Next Question

**POST** `/api/interview/next`

Submit an answer (text or audio) and receive the next question or final report.

**Request Body (Text):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousAnswerText": "Closures allow a function to access...",
  "inputMode": "text"
}
```

**Request Body (Audio):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "audioAnswer": "base64_encoded_audio...",
  "inputMode": "audio",
  "audioMimeType": "audio/webm"
}
```

**Response (Next Question):**
```json
{
  "nextQuestion": "How does this relate to memory management?",
  "currentStep": 2,
  "totalSteps": 5,
  "questionAudio": "base64_audio_string...",
  "transcribedAnswer": "User's speech converted to text..."
}
```

**Response (Final Report):**
```json
{
  "finalReport": {
    "overallScore": 85,
    "categoryScores": {
      "communication": 80,
      "technicalDepth": 90,
      "clarity": 85,
      "confidence": 85
    },
    "identifiedStrengths": ["Clear explanation...", "Good examples..."],
    "areasForImprovement": ["Could be more concise..."],
    "actionableFeedback": ["Practice STAR method..."]
  },
  "currentStep": 5,
  "totalSteps": 5
}
```

---

### 3. Get Report

**GET** `/api/interview/report?sessionId=<SESSION_ID>`

Retrieve the final report for a completed session.

**Response:**
```json
{
  "finalReport": { ... }, // Same as above
  "audioSummary": {
    "text": "Overall you did great...",
    "speechParams": { ... }
  }
}
```

---

### 4. Transcribe Audio

**POST** `/api/interview/transcribe`

Utility endpoint to transcribe audio without submitting an answer.

**Request Body:**
```json
{
  "audioAnswer": "base64_encoded_audio...",
  "audioMimeType": "audio/webm"
}
```

**Response:**
```json
{
  "transcription": "Transcribed text goes here..."
}
```

---

## Environment Variables

The backend requires the following in `.env`:

```env
PORT=8000
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

---

## AI Models

The backend utilizes **Groq** to run open-source models with high performance:
- **Questions & Evaluation**: `llama-3.3-70b-versatile`
- **Speech-to-Text**: `whisper-large-v3`
