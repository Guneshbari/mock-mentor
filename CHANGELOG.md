# Changelog

All notable changes to Mock Mentor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-28

### 🚀 Major Changes

#### AI Provider Migration: Groq → Google Gemini
- **Migrated from Groq AI to Google Gemini** as the primary AI provider
- Added support for **Gemini 2.0 Flash** models for faster, more reliable responses
- Maintained backward compatibility with Groq API (optional)
- Environment variable changes:
  - Primary: `GEMINI_API_KEY` (recommended)
  - Optional: `GROQ_API_KEY` (for those who prefer Groq)

### ✨ Features

#### Enhanced Role Strategy System
- Expanded role-based interview roadmaps to **14 distinct roles**
- Each role now has **45 unique questions** (15 per interview type)
- Added comprehensive roadmaps for all experience levels:
  - Fresh/Junior
  - Mid-level
  - Senior

#### New AI Service Blocks
- **AnswerAnalyzer.js** - Analyzes answer quality and depth
- **QuestionElaborationBlock.js** - Provides question clarification
- **Improved RoleStrategies.js** - Dynamic question generation for all 14 roles

#### Improved Architecture
- Enhanced composable block architecture
- Better separation of concerns between AI services
- Dual AI provider support (Gemini + Groq)
- Model configuration flexibility via environment variables

### 📚 Documentation

#### New Documentation Files
- **API.md** - Comprehensive API documentation
  - All endpoint specifications
  - Request/response examples
  - Error handling
  - Example usage
- **ROADMAPS.md** - Detailed role and interview roadmaps
  - All 14 supported roles
  - Question topics per experience level
  - Adaptive questioning explanation
- **frontend/README.md** - Updated frontend documentation
  - Tech stack details
  - Project structure
  - Development guide

#### Updated Documentation
- **README.md** - Updated to reflect Gemini AI integration
  - New badges and tech stack
  - Updated architecture diagram
  - Dual API provider setup instructions
  - Enhanced project structure
- **DEPLOYMENT.md** - Updated deployment guide
  - Gemini API key configuration
  - Environment variable updates
- **CONTRIBUTING.md** - Updated contribution guidelines
  - New API key setup instructions
- **backend/.env.example** - Updated environment template
  - Gemini API key examples
  - Model configuration options

### 🔧 Technical Improvements

#### Backend Services
- **GeminiService.js** enhancements:
  - Improved JSON parsing with fallback
  - Better error handling
  - Support for multiple Gemini models
  - Configurable temperature and token limits
- **RoleStrategies.js** improvements:
  - Template-based question generation
  - Role-specific contexts (tasks, struggles, stakeholders)
  - Programmatic roadmap generation for all roles

#### Model Configuration
- Default models updated to `gemini-2.0-flash-exp`
- Configurable via environment variables:
  - `QUESTION_MODEL`
  - `EVALUATION_MODEL`
  - `REPORT_MODEL`

### 🐛 Bug Fixes
- Fixed JSON parsing issues in Gemini responses
- Improved error messages for missing API keys
- Better handling of markdown code blocks in AI responses

### 📦 Dependencies
- Added: `@google/generative-ai@^0.24.1`
- Maintained: `groq-sdk@*` (optional)

---

## [1.0.0] - 2026-01-25

### Initial Release

#### Core Features
- AI-powered mock interview platform
- Support for 3 interview types: Technical, HR, Behavioral
- 14 different job roles
- 3 experience levels: Fresh, Mid, Senior
- 5-step progressive interview structure
- Real-time feedback and scoring
- Final comprehensive evaluation report

#### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js, Node.js 18+
- **AI**: Groq AI with Llama 3 models

#### Initial Documentation
- README.md with setup instructions
- DEPLOYMENT.md for production deployment
- CONTRIBUTING.md for contributors
- LICENSE (MIT)

---

## Upgrade Guide

### From 1.0.0 to 1.1.0

#### Backend Changes

1. **Update Environment Variables**:
   ```bash
   # Add to your .env file
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: Keep GROQ_API_KEY if you want to use Groq
   # GROQ_API_KEY=your_groq_api_key_here
   ```

2. **Install New Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **No Code Changes Required** - The application will automatically use Gemini if `GEMINI_API_KEY` is provided, otherwise it falls back to Groq (if available)

#### Frontend Changes

- No breaking changes
- Frontend works with both AI providers seamlessly

#### API Changes

- **No breaking changes** to API endpoints
- Same request/response format
- Improved response quality with Gemini models

---

## Migration Notes

### Why Gemini?

- **Better Reliability** - More consistent JSON responses
- **Advanced Reasoning** - Improved question generation and evaluation
- **Multimodal Capabilities** - Future-ready for image/audio features
- **Active Development** - Regular model updates from Google
- **Free Tier** - Generous free API quota for development

### Groq Support

Groq is still supported as an alternative. To use Groq:
1. Provide `GROQ_API_KEY` in your `.env` file
2. Remove or comment out `GEMINI_API_KEY`
3. The application will automatically use Groq

---

## Future Roadmap

### Planned for v1.2.0
- [ ] User authentication and interview history
- [ ] PDF export for interview reports
- [ ] Enhanced audio mode with better transcription
- [ ] Custom question banks
- [ ] Multi-language support

### Planned for v2.0.0
- [ ] Video interview mode
- [ ] Peer-to-peer mock interviews
- [ ] Interview scheduling and reminders
- [ ] Analytics dashboard
- [ ] Organization/team accounts

---

For questions or issues, please visit [GitHub Issues](https://github.com/yourusername/mock-mentor/issues)
