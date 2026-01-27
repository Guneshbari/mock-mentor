# Mock Mentor Frontend

Built with **Next.js 15**, **React 19**, **TypeScript**, and **Shadcn/UI**.

## Overview

This is the frontend application for Mock Mentor - an AI-powered interview practice platform. It provides an interactive user interface for conducting mock interviews with adaptive AI questioning.

## Tech Stack

- **Framework**: Next.js 15.1 with App Router
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Analytics**: Vercel Analytics

## Key Features

- 🎨 Modern, responsive design with dark mode support
- 🎙️ Audio recording and transcription capabilities
- 📊 Real-time interview progress tracking
- 💬 Interactive interview session management
- 🎯 Role-based interview customization
- 📱 Fully responsive mobile experience

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file (if needed):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── interview/         # Interview session
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── interview-*.tsx   # Interview components
└── lib/                  # Utilities and helpers
```

## Backend Integration

The frontend communicates with the Express.js backend via REST API. Make sure the backend is running on port 8000 (or update the API URL accordingly).

## Deployment

This app is optimized for deployment on **Vercel**:

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_BACKEND_URL`
5. Deploy

---

**Part of the Mock Mentor AI Interview Platform**