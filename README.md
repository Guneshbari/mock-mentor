
<div align="center">

# 🤖 Mock Mentor AI
### Intelligent, Adaptive, Role-Specific Interview Practice

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Groq](https://img.shields.io/badge/Groq-AI-orange?style=for-the-badge&logo=ai&logoColor=white)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Installation](#-getting-started) • [Architecture](#-architecture) • [Roadmaps](#-interview-roadmaps) • [API Docs](API.md) • [Contributing](#-contributing) • [Changelog](CHANGELOG.md)

</div>

---

## 🚀 Overview

**Mock Mentor** is a cutting-edge AI interview platform designed to simulate real-world technical interviews. It uses **Groq's Ultra-Fast LPU™** technology with **Llama 3** models to provide intelligent, adaptive questioning and comprehensive evaluation with near-instant responses.

Data persistence and authentication are powered by **Supabase**, offering a seamless and secure user experience.

---

## ✨ Features

### 🧠 Intelligent Roadmap Engine
- **5-Step Strict Progression**: Organized interview flow covering key competencies.
- **Roles & Levels**: Customized for Freshers, Juniors, and Seniors.
- **Adaptive Difficulty**: Questions adjust based on your experience level.

### ⚡ Powered by Groq & Llama 3
- **Speed**: Lightning-fast response generation using Groq.
- **Intelligence**: Advanced reasoning with Llama 3 70B models.
- **Efficiency**: Optimized for real-time conversational latency.

### 💾 Robust Persistence (Supabase)
- **Secure Auth**: Email/Password and Social Login via Supabase Auth.
- **History Tracking**: All interview sessions, questions, and answers are saved.
- **Progress Monitoring**: Track your improvement over time.

### 📊 Comprehensive Analytics
- **Real-time Feedback**: Instant scoring after every answer.
- **Final Report**: detailed breakdown of performance:
  - 🛠️ **Technical Accuracy**
  - 🗣️ **Communication Clarity**
  - 🔍 **Depth of Understanding**
  - ✅ **Completeness**

### 🎨 Modern, Professional UI
- **Professional Design**: Clean blue/neutral color scheme.
- **Responsive Layout**: Seamless experience across all devices.
- **Audio Mode**: Speak your answers with real-time transcription.
- **Modern Components**: Built with **Shadcn/UI**, **Tailwind CSS**, and **Framer Motion**.
- **Theme Support**: Beautiful light and dark modes.

### 🛡️ Account Management
- **Profile Control**: Update profile details and avatar.
- **Privacy Focused**: Full control over your data with **Hard Delete** (permanent account deletion).
- **Session History**: Detailed logs of all past interview sessions.


---

## 🏗️ Architecture

Mock Mentor uses a **Composable Block Architecture** in the backend for modularity and scalability.

```mermaid
graph TD
    A["Client (Next.js)"] -->|"POST /next"| B["Express Server"]
    B --> C{"Interview Orchestrator"}
    C -->|Generate| D["Question Block"]
    C -->|Score| E["Evaluation Block"]
    C -->|Report| F["Feedback Block"]
    D -->|"Llama 3 70B"| G["Groq AI"]
    E -->|"Llama 3 70B"| G
    H["Supabase Auth"] <--> A
    I["Supabase DB"] <--> B
```

### Key Services
| Service | Responsibility | Technology |
|---------|----------------|------------|
| **RoleBlock** | Define specific focus areas per job role | Logic Strategies |
| **QuestionGenerator** | Create adaptive, unique questions | `llama-3.3-70b-versatile` |
| **EvaluationBlock** | Score answers against rubrics | `llama-3.3-70b-versatile` |
| **FeedbackBlock** | Compile final detailed report | `llama-3.3-70b-versatile` |
| **DatabaseService** | Persist sessions, questions, and responses | **Supabase (PostgreSQL)** |

---

## 🗺️ Interview Roadmaps

Every interview follows a specific path. Examples for "Frontend Developer":

| Step | 🌱 Fresh / Junior | 💎 Senior / Lead |
|------|-------------------|------------------|
| **1** | **HTML/CSS & DOM** | **System Architecture** |
| **2** | **JavaScript Basics** | **Performance Engineering** |
| **3** | **React Basics** | **Micro-frontends** |
| **4** | **Debugging** | **Advanced Security** |
| **5** | **Version Control** | **Leadership & Strategy** |

### Supported Roles
Mock Mentor supports **14 unique job roles** including Frontend, Backend, Full Stack, DevOps, Data Science, and more.

---

## 🛠️ Project Structure

```text
mock-mentor/
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── services/         # Core Business Logic
│   │   │   ├── blocks/       # AI Logic Blocks
│   │   │   │   ├── QuestionGeneratorBlock.js
│   │   │   │   └── EvaluationBlock.js
│   │   │   ├── database.service.js # Supabase Integration
│   │   │   ├── ai.service.js       # Groq Integration
│   │   │   └── interview.service.js
│   │   ├── middleware/       # Auth Middleware
│   │   └── server.js         # Entry Point
│   └── package.json
│
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router Pages
│   ├── components/           # React Components (Shadcn)
│   ├── lib/                  # Utilities (Supabase Client)
│   └── package.json
│
└── supabase/                 # Database Schema & Migrations
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0+
- **Groq API Key** ([Get it here](https://console.groq.com/))
- **Supabase Account** & Project ([Get it here](https://supabase.com/))

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
   
   # Create .env
   echo "PORT=8000" > .env
   echo "GROQ_API_KEY=your_groq_key" >> .env
   echo "SUPABASE_URL=your_supabase_url" >> .env
   echo "SUPABASE_KEY=your_supabase_service_role_key" >> .env
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env.local
   echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local
   echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
   echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
   ```

4. **Database Setup**
   - Run the SQL scripts from `supabase/schema.sql` in your Supabase SQL Editor to create tables.

5. **Run the Application**
   
   **Backend**: `cd backend && npm run dev`
   
   **Frontend**: `cd frontend && npm run dev`

   Visit **http://localhost:3000** to start!

---

## 🤝 Contributing

We love contributions! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

<div align="center">
  <sub>Built by <b>Gunesh Bari</b></sub>
</div>