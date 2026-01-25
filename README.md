# 🎯 Mock Mentor - AI-Powered Interview Practice Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Groq API](https://img.shields.io/badge/Groq-AI%20Powered-blue)](https://groq.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An intelligent mock interview platform that provides personalized, adaptive interview practice with real-time evaluation and comprehensive feedback. Built with cutting-edge AI technology to help candidates ace their job interviews.

## ✨ Features

### 🎭 Composable Interview Flow
- **Role Block**: Customizes interview context based on job role and industry
- **Question Generator**: Creates adaptive, role-specific questions
- **Memory System**: Tracks full Q&A history with evaluations
- **Evaluation Block**: Real-time scoring (0-100) with constructive feedback
- **Feedback Block**: Comprehensive final report with actionable insights

### 🧠 Adaptive Questioning
- Questions adapt based on **previous answers** - AI analyzes what you said
- **Role-specific focus** - Questions tailored to your target position
- **Skills-based targeting** - Covers all required skills progressively
- **Resume personalization** - References your specific projects and experience
- **Dynamic difficulty** - Adjusts based on answer quality and experience level
- **Maximum variation** - Every interview is unique (temperature: 0.7)

### 🎙️ Audio Mode
- **Speech-to-Text**: Groq Whisper Large V3 Turbo for fast, accurate transcription
- **Text-to-Speech**: Browser-native speech synthesis for questions
- **Flexible Input**: Switch between voice and text seamlessly
- **Audio Summary**: Spoken report summary at the end

### 📊 Comprehensive Evaluation
- **Real-time scoring** after each answer
- **Category breakdown**: Communication, Clarity, Technical Depth, Confidence
- **Detailed feedback** with improvement suggestions
- **Question-answer history** maintained throughout
- **Final performance report** with strengths and areas to improve

### 🎨 Modern UI/UX
- **Dark/Light mode** with smooth transitions
- **Responsive design** for all devices
- **Progress tracking** with visual indicators
- **Memory panel** showing interview history
- **Clean, professional interface** built with shadcn/ui

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Audio**: Web Speech API, MediaRecorder API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI Provider**: Groq API
  - **LLM**: LLaMA 3 8B (8192 context)
  - **Transcription**: Whisper Large V3 Turbo
- **Architecture**: Composable blocks pattern

### AI Models
- **Question Generation**: `llama3-8b-8192` (temperature: 0.7)
- **Evaluation**: `llama3-8b-8192` (temperature: 0.3, JSON mode)
- **Speech-to-Text**: `whisper-large-v3-turbo`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Setup Screen │→│ Session View │→│ Report Screen │        │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────┴───────────────────────────────────┐
│                      Backend (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Interview Service (Orchestrator)        │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                      │
│     ┌───────────────┴───────────────┐                      │
│     │         AI Service            │                      │
│     │  ┌──────────────────────────┐ │                      │
│     │  │   Composable Blocks:     │ │                      │
│     │  │  • RoleBlock             │ │                      │
│     │  │  • QuestionGenerator     │ │                      │
│     │  │  • EvaluationBlock       │ │                      │
│     │  │  • FeedbackBlock         │ │                      │
│     │  └──────────────────────────┘ │                      │
│     └───────────────┬───────────────┘                      │
└─────────────────────┼──────────────────────────────────────┘
                      │
              ┌───────┴────────┐
              │   Groq API     │
              │  (LLaMA + STT) │
              └────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Groq API key ([Get one here](https://console.groq.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mock-mentor.git
cd mock-mentor
```

2. **Setup Backend**
```bash
cd backend
npm install

# Create .env file
echo "PORT=8000" > .env
echo "GROQ_API_KEY=your_groq_api_key_here" >> .env
echo "GROQ_MODEL=llama3-8b-8192" >> .env
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
node src/server.js
```
Server runs on: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on: http://localhost:3000

### Environment Variables

#### Backend (`.env`)
```env
PORT=8000                              # Backend server port
GROQ_API_KEY=gsk_xxxxxxxxxxxxx        # Your Groq API key (required)
GROQ_MODEL=llama3-8b-8192             # LLM model for questions
```

#### Frontend
The frontend proxies API calls to `http://localhost:8000` automatically via Next.js API routes.

## 📖 Usage Guide

### 1. **Setup Interview**
- Select **Interview Type**: HR, Technical, or Behavioral
- Enter **Job Role**: e.g., "Frontend Developer"
- Add **Skills**: e.g., React, JavaScript, CSS (press Enter after each)
- Paste **Resume/Background**: Your experience and projects
- Choose **Experience Level**: Fresh Graduate, Junior, or Senior Developer
- Toggle **Audio Mode** (optional): Enable voice input/output

### 2. **Take Interview**
- Read the question carefully
- **Type your answer** OR **Record voice** (if audio mode enabled)
- Click "Submit Answer"
- View real-time evaluation score and feedback
- Answer 5-10 adaptive questions (varies based on role)

### 3. **View Report**
- **Overall Score**: 0-100 rating
- **Category Scores**: Communication, Clarity, Technical Depth, Confidence
- **Strengths**: What you did well
- **Areas for Improvement**: Where to focus
- **Actionable Feedback**: Specific improvement tips
- **Q&A History**: Full interview transcript with summaries

## 🎯 How It Works

### Adaptive Questioning Algorithm

1. **First Question** - Role-specific opener based on resume
```
Input: Frontend Developer + React/JS skills + Resume mentioning "e-commerce dashboard"
Output: "Tell me about the e-commerce dashboard you built. What challenges did you face with state management?"
```

2. **Subsequent Questions** - Analyze previous answer
```
Answer: "I used Redux but faced async action issues..."
AI Analysis: Mentioned Redux + async challenges
Next Q: "How did you handle API calls - Redux Thunk or Saga?"
```

3. **Adaptive Strategies**
- **Deep Dive**: Follow-up on mentioned topics
- **Related Exploration**: Expand to related concepts
- **Gap Probing**: Ask "why/how" for shallow answers
- **Skill Pivoting**: Move to next required skill
- **Difficulty Adjustment**: Increase/decrease based on performance

### Evaluation System

Each answer is evaluated on:
- **Technical Accuracy** (for technical interviews)
- **Clarity of Communication**
- **Depth of Understanding**
- **Relevance to Question**
- **Experience Level Appropriateness**

Scores are aggregated in the final report with category breakdowns.

## 📡 API Endpoints

### `POST /api/interview/start`
Initialize new interview session

**Request:**
```json
{
  "interviewConfig": {
    "interviewType": "technical",
    "role": "Frontend Developer",
    "skills": ["React", "JavaScript"],
    "resumeText": "...",
    "experiencePreset": "junior",
    "audioMode": false
  }
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "firstQuestion": "...",
  "totalSteps": 10,
  "questionAudio": { ... }
}
```

### `POST /api/interview/next`
Submit answer and get next question

**Request:**
```json
{
  "sessionId": "uuid",
  "previousAnswerText": "...",
  "inputMode": "text",
  "audioMode": false
}
```

**Response:**
```json
{
  "nextQuestion": "...",
  "currentStep": 2,
  "totalSteps": 10,
  "evaluation": {
    "score": 75,
    "feedback": "..."
  },
  "finalReport": null
}
```

### `GET /api/interview/report?sessionId=uuid`
Retrieve final interview report

**Response:**
```json
{
  "finalReport": {
    "overallScore": 78,
    "categoryScores": { ... },
    "identifiedStrengths": [...],
    "areasForImprovement": [...],
    "actionableFeedback": [...],
    "questionAnswerHistory": [...]
  }
}
```

## 🎨 Screenshots

<!-- Add screenshots here -->
![Setup Screen](docs/screenshots/setup.png)
![Interview Session](docs/screenshots/session.png)
![Final Report](docs/screenshots/report.png)

## 🔒 Security & Privacy

- ✅ No data persistence - sessions are in-memory only
- ✅ Audio files are immediately deleted after transcription
- ✅ API keys stored in environment variables
- ✅ CORS configured for localhost development
- ⚠️ Add authentication for production deployment

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8000 is available: `netstat -ano | findstr :8000`
- Verify `GROQ_API_KEY` in `.env` file
- Run `npm install` in backend directory

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check Next.js API routes are properly configured
- Verify no CORS errors in browser console

### Audio mode not working
- Grant microphone permissions in browser
- Use Chrome/Edge for best WebM support
- Check Groq API key has Whisper access
- See detailed logs in backend terminal with `[Audio]` prefix

### Questions are too generic
- Ensure resume text is detailed and specific
- Add relevant skills in the setup screen
- Choose appropriate experience level
- Check backend logs for AI service errors

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast, affordable AI inference
- **Meta** for LLaMA 3 model
- **OpenAI** for Whisper model architecture
- **Vercel** for Next.js framework
- **shadcn** for beautiful UI components

## 📬 Contact

For questions or feedback, please open an issue or reach out to:
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🗺️ Roadmap

- [ ] Add more interview types (System Design, Coding)
- [ ] Support multiple languages
- [ ] Interview scheduling and history
- [ ] Performance analytics dashboard
- [ ] Export reports as PDF
- [ ] Mobile app (React Native)
- [ ] User authentication and profiles
- [ ] Share interview reports

---

**Built with ❤️ using Next.js, Node.js, and Groq AI**

⭐ Star this repo if you found it helpful!