# NexPulse

A health monitoring platform that connects patients, their vitals, and their doctors — with an AI assistant (PulseAI) that helps make sense of the data.

## Tech stack

- **Frontend**: vanilla HTML / CSS / JS (no framework, no build step)
- **Database + Auth**: Supabase (Postgres with row-level security)
- **AI**: OpenAI GPT-4o-mini via a Vercel serverless function
- **Hosting**: Vercel (free tier)

## Project structure

```
nexpulse/
├── index.html                  Landing page
├── login.html                  Sign in (patient or doctor)
├── signup.html                 Create account
├── dashboard-patient.html      Patient's vitals + AI insights
├── dashboard-doctor.html       Doctor's roster + alerts + schedule
├── ai-chat.html                PulseAI chat interface
│
├── styles.css                  Shared design tokens + landing styles
├── auth.css                    Login/signup split-layout styles
├── dashboard.css               Shared dashboard styles
├── doctor.css                  Doctor-dashboard-specific styles
├── chat.css                    AI chat styles
│
├── script.js                   Landing page interactions
├── dashboard.js                Patient dashboard (ECG canvas, trend chart)
│
├── js/
│   ├── supabase-config.js      Your Supabase URL + anon key (fill in)
│   ├── auth.js                 Signup / login / session / route guards
│   └── data.js                 Database queries (vitals, alerts, chat, …)
│
├── api/
│   └── chat.js                 Serverless function → OpenAI
│
├── docs/
│   ├── DEPLOY.md               ★ Start here — step-by-step deploy guide
│   └── schema.sql              Full database schema — paste into Supabase
│
├── vercel.json                 Vercel config
├── package.json                Node config for /api functions
├── .gitignore                  Keeps secrets out of git
└── .env.example                Template for environment variables
```

## Getting started

**Open `docs/DEPLOY.md`** — it walks you through every step from zero to a live URL on the internet.

## Security model

- **Row-level security** is enabled on every table. Users can only read their own data. Doctors can read data only for patients whose `assigned_doctor_id` equals the doctor's user ID.
- **The anon key** in `js/supabase-config.js` is safe to publish — it only lets clients make requests that RLS then filters.
- **The OpenAI key** lives only in Vercel environment variables. The `/api/chat` serverless function reads it server-side. It never reaches the browser.
- **Do not commit `.env` files.** `.gitignore` already protects against this.

## Important — this is a prototype

This codebase is a working foundation. It is **not** ready to be relied upon for real medical decisions without additional work: rate limiting, email verification, legal review (HIPAA/GDPR/local laws), a clinical advisor, incident response, paid infrastructure, and a proper disclaimer flow. See the "Before you let real patients use it" section in `docs/DEPLOY.md`.
