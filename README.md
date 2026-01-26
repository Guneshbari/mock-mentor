
<div align="center">

# 🤖 Mock Mentor AI
### Intelligent, Adaptive, Role-Specific Interview Practice

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%202.0-blue?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Installation](#-getting-started) • [Architecture](#-architecture) • [Roadmaps](#-interview-roadmaps) • [Contributing](#-contributing)

</div>

---

## 🚀 Overview

**Mock Mentor** is a cutting-edge AI interview platform designed to simulate real-world technical interviews with scary accuracy. Unlike generic chatbots, Mock Mentor uses a **structured, role-specific roadmap system** driven by Google's latest **Gemini 2.0 Flash** model to ensure every question is relevant, challenging, and logically progressive.

Whether you are a **Fresh Graduate** looking for your first job or a **Senior Architect** validated your system design skills, Mock Mentor adapts the difficulty and topic depth automatically.

---

## ✨ Features

### 🧠 Intelligent Roadmap Engine
The core of Mock Mentor is its deterministic yet adaptive roadmap engine. It ensures no two interviews are the same, while strict adherence to professional standards is maintained.

- **5-Step Strict Progression**: Every interview follows a curated 5-stage journey specific to the role.
- **Experience Tiers**:
  - 🌱 **Fresh/Entry**: Focus on fundamentals, syntax, and basic problem solving.
  - 🚀 **Mid-Level**: Focus on implementation, best practices, and edge cases.
  - 💎 **Senior**: Focus on system design, scalability, trade-offs, and leadership.
- **Multi-Mode**: Specialized tracks for **Technical**, **HR**, and **Behavioral** interviews.

### ⚡ Powered by Google Gemini
- **Gemini 2.0 Flash**: Delivers question generation in <1 second.
- **Gemini 1.5 Pro**: Powers the "Evaluation Block" for deep, nuanced scoring and feedback.
- **Context Awareness**: The AI remembers your previous answers to ask relevant follow-up questions (e.g., *"You mentioned using Redis earlier; how did you handle cache invalidation?"*).

### 📊 Comprehensive Analytics
- **Real-time Feedback**: Instant scoring after every answer.
- **Final Report**: A detailed breakdown of your performance across:
  - 🛠️ **Technical Accuracy**
  - 🗣️ **Communication Clarity**
  - 🔍 **Depth of Understanding**
  - ✅ **Completeness**

### 🎨 Modern UX
- **Audio Mode**: Full Speech-to-Text and Text-to-Speech support for a hands-free experience.
- **Clean Interface**: Built with **Shadcn/UI** and **Framer Motion** for smooth interactions.
- **Live Progress**: Visual tracking of your 5-step interview journey.

---

## 🏗️ Architecture

Mock Mentor uses a **Composable Block Architecture** in the backend to separate concerns and allow for easy scalability.

```mermaid
graph TD
    A[Client (Next.js)] -->|POST /next| B(Express Server)
    B --> C{Interview Orchestrator}
    C -->|Generate| D[Question Block]
    C -->|Score| E[Evaluation Block]
    C -->|Report| F[Feedback Block]
    D -->|Gemini 2.0| G[Google AI]
    E -->|Gemini 1.5| G
```

### Key Services
| Service | Responsibility | Model Used |
|---------|----------------|------------|
| **RoleBlock** | Define specific focus areas per job role | N/A (Static Config) |
| **QuestionGenerator** | Create adaptive, unique questions | `gemini-2.0-flash-exp` |
| **EvaluationBlock** | Score answers against rubrics | `gemini-1.5-pro` |
| **FeedbackBlock** | Compile final detailed report | `gemini-1.5-pro` |

---

## 🗺️ Interview Roadmaps

Every interview follows a specific path. Here are examples of how the "Frontend Developer" track differs by level:

| Step | 🌱 Fresh / Junior | 💎 Senior / Lead |
|------|-------------------|------------------|
| **1** | **HTML/CSS & DOM** <br>*(Box model, Semantic HTML)* | **System Architecture** <br>*(Scalability, Monorepos)* |
| **2** | **JavaScript Basics** <br>*(ES6+, Arrays, Events)* | **Performance Engineering** <br>*(Web Vitals, SSR vs CSR)* |
| **3** | **React Basics** <br>*(Props, State, Components)* | **Micro-frontends** <br>*(Module Federation, Strategy)* |
| **4** | **Debugging** <br>*(Console, Common errors)* | **Advanced Security** <br>*(XSS/CSRF, Auth patterns)* |
| **5** | **Version Control** <br>*(Git basics)* | **Leadership & Strategy** <br>*(Mentoring, Tech choices)* |

---

## 🛠️ Project Structure

```text
mock-mentor/
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── services/         # Core Business Logic
│   │   │   ├── blocks/       # AI Logic Blocks (Question, Eval, Role)
│   │   │   ├── GeminiService.js
│   │   │   └── ai.service.js
│   │   ├── controllers/      # API Route Controllers
│   │   └── server.js         # Entry Point
│   ├── .env                  # Secrets (API Keys)
│   └── package.json
│
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router Pages
│   ├── components/           # React Components (Shadcn)
│   ├── lib/                  # Utilities
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **Google Gemini API Key** (Get free key at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/mock-mentor.git
   cd mock-mentor
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create Environment Configuration
   echo "PORT=8000" > .env
   echo "GEMINI_API_KEY=your_key_here" >> .env
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run the Application**
   Open two terminals:
   
   **Terminal 1 (Backend)**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 (Frontend)**
   ```bash
   cd frontend
   npm run dev
   ```

   Visit **http://localhost:3000** to start your interview!

---

## � Security & Deployment

- **Environment Isolation**: API keys are strictly kept in backend `.env` and never exposed to the client.
- **Deployment Ready**:
  - **Frontend**: One-click deploy to [Vercel](https://vercel.com).
  - **Backend**: Ready for [Render](https://render.com) or [Railway](https://railway.app).
  - **Docker**: Includes Dockerfile for containerized deployment (optional).

---

## 🤝 Contributing

We love contributions! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <sub>Built by <b>Gunesh Bari</b></sub>
</div>