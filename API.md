# Mock Mentor API Documentation

Backend API for the Mock Mentor AI Interview Platform

## Base URL

```
Development: http://localhost:8000
Production: Your deployed backend URL
```

## API Endpoints

### 1. Start Interview

**POST** `/api/start`

Initialize a new interview session with role, experience level, and interview type.

**Request Body:**
```json
{
  "role": "Frontend Developer",
  "experienceLevel": "mid",
  "interviewType": "technical"
}
```

**Parameters:**
- `role` (string, required): Job role (e.g., "Frontend Developer", "Backend Developer", etc.)
- `experienceLevel` (string, required): Experience level - `"fresh"`, `"mid"`, or `"senior"`
- `interviewType` (string, required): Interview type - `"technical"`, `"hr"`, or `"behavioral"`

**Response:**
```json
{
  "question": "Explain the difference between let, const, and var in JavaScript.",
  "questionNumber": 1,
  "totalQuestions": 5,
  "context": {
    "role": "Frontend Developer",
    "experienceLevel": "mid",
    "interviewType": "technical",
    "currentStep": 1,
    "focusArea": "JavaScript ES6+ Syntax & Async Patterns",
    "sessionId": "abc123...",
    "conversationHistory": []
  }
}
```

---

### 2. Submit Answer & Get Next Question

**POST** `/api/next`

Submit an answer to the current question and receive the next question or evaluation.

**Request Body:**
```json
{
  "answer": "Let and const are block-scoped while var is function-scoped...",
  "context": {
    "role": "Frontend Developer",
    "experienceLevel": "mid",
    "interviewType": "technical",
    "currentStep": 1,
    "previousQuestion": "Explain the difference between let, const, and var.",
    "conversationHistory": [...],
    "sessionId": "abc123..."
  }
}
```

**Parameters:**
- `answer` (string, required): The user's answer to the previous question
- `context` (object, required): Interview context received from the previous API call

**Response (Next Question):**
```json
{
  "question": "How would you optimize a React component that re-renders too frequently?",
  "questionNumber": 2,
  "totalQuestions": 5,
  "context": {
    "role": "Frontend Developer",
    "experienceLevel": "mid",
    "interviewType": "technical",
    "currentStep": 2,
    "focusArea": "React Performance Optimization",
    "sessionId": "abc123...",
    "conversationHistory": [
      {
        "question": "Explain the difference between let, const, and var.",
        "answer": "Let and const are block-scoped...",
        "step": 1
      }
    ]
  }
}
```

**Response (Final Evaluation - after 5th question):**
```json
{
  "sessionComplete": true,
  "finalReport": {
    "overallScore": 78,
    "categoryScores": {
      "technicalAccuracy": 80,
      "communicationClarity": 75,
      "depthOfUnderstanding": 82,
      "completeness": 76
    },
    "strengths": [
      "Strong understanding of JavaScript fundamentals",
      "Good explanations with practical examples"
    ],
    "improvements": [
      "Could elaborate more on edge cases",
      "Consider discussing performance implications"
    ],
    "detailedAnalysis": {
      "HTML5 Semantic Elements & Accessibility": {
        "score": 85,
        "feedback": "Excellent understanding of semantic HTML..."
      },
      "React Performance Optimization": {
        "score": 75,
        "feedback": "Good grasp of React.memo and useMemo..."
      }
      // ... more step-by-step feedback
    }
  }
}
```

---

### 3. Health Check

**GET** `/health`

Check if the backend server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Mock Mentor API is running",
  "timestamp": "2024-01-28T00:00:00.000Z"
}
```

---

## Interview Configuration

### Supported Roles

- Frontend Developer
- Backend Developer
- Full Stack Developer
- DevOps Engineer
- Data Scientist
- Machine Learning Engineer
- Mobile Developer
- QA Engineer
- Product Manager
- UI/UX Designer
- Software Architect
- Cloud Engineer
- Security Engineer
- Database Administrator

### Experience Levels

- `fresh` - Entry level / Fresh graduate
- `mid` - Mid-level (2-5 years experience)
- `senior` - Senior level (5+ years experience)

### Interview Types

- `technical` - Technical questions focused on role-specific skills
- `hr` - HR/Culture fit questions
- `behavioral` - STAR method behavioral questions

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message description",
  "details": "Additional error details (if available)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

---

## Environment Variables

The backend requires the following environment variables:

```env
PORT=8000
GEMINI_API_KEY=your_google_gemini_api_key    # Required if using Gemini (recommended)
GROQ_API_KEY=your_groq_api_key              # Optional - alternative to Gemini

# Optional model configurations
QUESTION_MODEL=gemini-2.0-flash-exp
EVALUATION_MODEL=gemini-2.0-flash-exp
REPORT_MODEL=gemini-2.0-flash-exp
```

---

## AI Models Used

The backend uses Google Gemini AI by default:

- **Question Generation**: `gemini-2.0-flash-exp`
- **Answer Evaluation**: `gemini-2.0-flash-exp`
- **Final Report**: `gemini-2.0-flash-exp`

You can also use Groq AI as an alternative by providing a `GROQ_API_KEY` instead.

---

## Rate Limiting

Currently, there are no rate limits imposed by the backend. However, be aware of:
- Google Gemini API rate limits (check your API quota)
- Groq API rate limits (if using Groq)

---

## Interview Flow

```
1. Client calls /api/start with role, experience, and interview type
   ↓
2. Backend generates first question based on role strategy
   ↓
3. Client displays question to user
   ↓
4. User provides answer
   ↓
5. Client calls /api/next with answer and context
   ↓
6. Backend analyzes answer and generates next question (or final report)
   ↓
7. Repeat steps 3-6 until 5 questions are answered
   ↓
8. Backend returns final comprehensive evaluation report
```

---

## Example Usage

### JavaScript/TypeScript (Fetch)

```typescript
// Start interview
const startResponse = await fetch('http://localhost:8000/api/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'Frontend Developer',
    experienceLevel: 'mid',
    interviewType: 'technical'
  })
});
const startData = await startResponse.json();

// Submit answer and get next question
const nextResponse = await fetch('http://localhost:8000/api/next', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answer: 'My answer here...',
    context: startData.context
  })
});
const nextData = await nextResponse.json();
```

---

## Architecture

The backend follows a **Composable Block Architecture**:

- **RoleBlock** - Manages role-specific interview roadmaps
- **QuestionGeneratorBlock** - Generates adaptive questions
- **QuestionElaborationBlock** - Elaborates on questions for clarity
- **AnswerAnalyzer** - Analyzes answer quality
- **EvaluationBlock** - Scores answers
- **FeedbackBlock** - Compiles final reports

All blocks interact with either **GeminiService** or **GroqService** for AI capabilities.

---

For more information, see the main [README.md](../README.md)
