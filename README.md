# AI Mock Interview Platform

An AI-powered mock interview platform that helps you practice for technical interviews.
Features include:
- Voice-based interaction with AI interviewer (ElevenLabs TTS + Web Speech API)
- Real-time question generation tailored to your role and difficulty (OpenAI GPT-3.5)
- Automated feedback and scoring on your answers
- Dashboard to track progress and history

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Auth & Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-3.5-turbo
- **Voice**: ElevenLabs TTS, Web Speech API

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API Key
- ElevenLabs API Key (optional, for voice output)

### 2. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup

Run the SQL script in `schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

This will create:
- `interviews` table
- `interview_questions` table
- Row Level Security (RLS) policies for secure access

### 4. Run the Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages and API routes
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and Supabase client
- `src/middleware.ts`: Auth middleware for protected routes

## Deployment

Deploy easily on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Forchids-ai-mock-interview-platform)
