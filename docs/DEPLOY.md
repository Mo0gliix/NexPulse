# NexPulse — Deployment Guide

**You have zero coding experience. That's okay.** This guide is every single click, copy, and paste you need to take NexPulse from files on your computer to a real URL on the internet that real people can sign up for.

Read this guide **once all the way through** before starting. Expect it to take a **focused 2–3 hour session** the first time.

---

## What you'll end up with

- A live URL like `https://nexpulse.vercel.app` (or any custom domain later)
- Real user sign-up and login (email + password)
- A working database that stores patients, doctors, vitals, chats, appointments
- PulseAI that actually responds (via OpenAI)
- All of this for **~$0/month** until you get meaningful traffic

---

## What you need before starting

- A **computer** (Windows, Mac, or Linux)
- A **web browser** (Chrome, Edge, Firefox — anything modern)
- A **Gmail, Apple, or email address** for signing up to services
- A **credit/debit card** for OpenAI (~$5 is enough for weeks of testing). Everything else is free.
- **A code editor** — download **[VS Code](https://code.visualstudio.com/)** (free). Install it.
- **Git** — download **[git](https://git-scm.com/downloads)** and install with default options.
- **A GitHub account** — sign up at **[github.com](https://github.com)** (free)

---

# Part 1 — Set up Supabase (your database + auth)

### 1.1 Create a Supabase account
1. Go to **[supabase.com](https://supabase.com)** → click **Start your project**.
2. Sign in with GitHub (easiest).
3. Click **New Project**.
4. Fill in:
   - **Organization**: leave default
   - **Name**: `nexpulse`
   - **Database Password**: click **Generate a password** → **copy it somewhere safe** (a password manager or Notes). You may need it later.
   - **Region**: pick the one closest to Iraq (e.g. `West EU (Ireland)` or `Central EU (Frankfurt)`)
   - **Pricing Plan**: Free
5. Click **Create new project**. Wait ~2 minutes for it to provision.

### 1.2 Create the database tables
1. In your Supabase dashboard, on the left sidebar click the **SQL Editor** icon (looks like a database/terminal).
2. Click **+ New query**.
3. Open the file **`docs/schema.sql`** from your NexPulse project in VS Code.
4. Copy the **entire contents** and paste into the SQL Editor.
5. Click **Run** (bottom right, or `Ctrl/Cmd + Enter`).
6. You should see **"Success. No rows returned."** at the bottom.

To verify: click **Table Editor** (left sidebar). You should now see `profiles`, `vitals`, `alerts`, `appointments`, `conversations`, `messages`, `activity_log`.

### 1.3 Disable email confirmation (for now — makes testing easier)
1. Left sidebar → **Authentication** → **Providers** → click **Email**.
2. Turn **OFF** the toggle labeled **Confirm email**.
3. Click **Save**.

> When you go to real production, you should turn this **back on** so people must verify their email.

### 1.4 Copy your API keys
1. Left sidebar → **Project Settings** (gear icon) → **API**.
2. You'll see two values you need:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (long string starting with `eyJ...`)
3. Keep this tab open — you'll copy them into your code in the next step.

### 1.5 Paste the keys into your project
1. Open VS Code → open the **nexpulse** folder (File → Open Folder → select it).
2. Open `js/supabase-config.js`.
3. Replace the placeholder values:
   ```js
   const SUPABASE_URL      = 'https://abcdefgh.supabase.co';   // ← your URL
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...your-long-key...';  // ← your anon key
   ```
4. **Save the file** (`Ctrl/Cmd + S`).

> ⚠️ The **anon key is safe to put in frontend code**. It's designed for that. Never commit your **service_role** key (you won't need it for this guide). Never commit the **database password** either.

---

# Part 2 — Get an OpenAI API key (for PulseAI)

1. Go to **[platform.openai.com](https://platform.openai.com)** → sign up / log in.
2. Click your profile (top right) → **Billing** → **Add payment method** → add $5 credit.
3. Left sidebar → **API Keys** → **Create new secret key**.
4. Name it `nexpulse-prod` → **Create**.
5. **Copy the key immediately** (starts with `sk-...`). You cannot see it again — save it somewhere safe.

Keep this tab open; you'll paste the key into Vercel in Part 4.

---

# Part 3 — Put your project on GitHub

### 3.1 Create the repository
1. Go to **[github.com](https://github.com)** → top right **+** → **New repository**.
2. Name it `nexpulse`.
3. Leave everything else default (Public is fine, or Private if you prefer).
4. Do **not** initialize with README/gitignore/license — your project already has what it needs.
5. Click **Create repository**. GitHub shows you a page with commands. Leave it open.

### 3.2 Push your files
1. Open a terminal in VS Code: **Terminal → New Terminal**.
2. Make sure you're in the nexpulse folder. The terminal prompt should show `.../nexpulse`.
3. Run these commands one by one (copy-paste each line, press Enter, wait for it to finish):
   ```bash
   git init
   git add .
   git commit -m "Initial NexPulse commit"
   git branch -M main
   ```
4. Now look at the GitHub page from step 3.1 — copy the two lines under **"…or push an existing repository from the command line"**. They look like:
   ```bash
   git remote add origin https://github.com/YOURNAME/nexpulse.git
   git push -u origin main
   ```
5. Paste those into the VS Code terminal and run them.
6. If asked to sign in, follow the prompts (GitHub may open a browser window).
7. Refresh the GitHub page — you should see all your files.

> 📌 From now on, anytime you change code and want to update the live site, you run:
> ```bash
> git add .
> git commit -m "describe your change"
> git push
> ```
> Vercel will re-deploy automatically.

---

# Part 4 — Deploy to Vercel (free hosting)

### 4.1 Sign up
1. Go to **[vercel.com](https://vercel.com)** → **Sign Up** → **Continue with GitHub**.
2. Authorize Vercel to access your GitHub.

### 4.2 Import your project
1. Click **Add New…** → **Project**.
2. Find `nexpulse` in the list → click **Import**.
3. On the configuration screen:
   - **Framework Preset**: Other
   - **Root Directory**: leave as `./`
   - **Build Command**: leave empty
   - **Output Directory**: leave empty
4. Expand **Environment Variables** and add:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: paste the OpenAI key from Part 2 (starts with `sk-...`)
   - Click **Add**
5. Click **Deploy**.
6. Wait ~30 seconds. When it finishes, click **Continue to Dashboard** → you'll see your live URL.

Click that URL. **Your site is live on the internet.** 🎉

---

# Part 5 — Test it end-to-end

### 5.1 Create a patient account
1. On your live site → click **Get started**.
2. Sign up with a real email + strong password → choose **Patient** role.
3. You should land on the Patient dashboard.

### 5.2 Create a doctor account
1. Open an **incognito / private window** (so you're not signed in as the patient).
2. Go to your live site → **Get started** → choose **Doctor** role → use a different email.
3. You should land on the Doctor dashboard. It'll say "No patients assigned yet."

### 5.3 Link the patient to the doctor
The doctor only sees patients whose `assigned_doctor_id` points to them. To test, we'll set this manually:

1. In Supabase → **Table Editor** → **profiles** table.
2. Find the **doctor** row → copy the `id` value (a long UUID).
3. Find the **patient** row → click the empty `assigned_doctor_id` cell → paste the doctor's UUID → press Enter.
4. Refresh the doctor dashboard in your incognito window. The patient should now appear in the roster.

### 5.4 Add some vitals for the patient
1. Supabase → **SQL Editor** → **+ New query** → run:
   ```sql
   insert into vitals (patient_id, heart_rate, spo2, bp_systolic, bp_diastolic, glucose, sleep_score, steps)
   values (
     'PASTE-PATIENT-UUID-HERE',
     72, 98, 118, 76, 94, 87, 7842
   );
   ```
2. Refresh the patient dashboard — you should see those numbers live.
3. Refresh the doctor dashboard — same numbers, now in the roster.

### 5.5 Test PulseAI
1. On the patient dashboard → click **PulseAI Chat** in the sidebar.
2. Type a question like *"How am I doing today?"*
3. You should get a real AI reply that references the vitals you just added.

---

# Part 6 — Daily operation

### Making changes
1. Edit files in VS Code.
2. Save (`Ctrl/Cmd + S`).
3. In the terminal: `git add . && git commit -m "my change" && git push`
4. Vercel auto-redeploys in ~30 seconds.

### Adding real patient data
- **Via the app**: the patient signs up, you assign them a doctor in Supabase.
- **Via API** (later): when you integrate Apple Watch / Fitbit, they'll write to the `vitals` table automatically.
- **Manually**: use the SQL insert pattern from step 5.4.

### Watching for errors
- **Vercel dashboard → Deployments → Logs** shows server errors (e.g. if the AI endpoint breaks).
- **Browser console** (`F12` → Console tab) shows frontend errors.

---

# Part 7 — Before you let real patients use it

**I cannot tell you this strongly enough:** the app you've just deployed is a **functional prototype**. Before any real sick person uses it to make a health decision, you need:

1. **A real domain + SSL** (Vercel handles SSL automatically once you add a domain — buy one from Namecheap for ~$10/year).
2. **Email confirmation re-enabled** in Supabase auth settings.
3. **Rate limiting** on the `/api/chat` endpoint (to prevent people running up your OpenAI bill).
4. **Backup strategy** — Supabase free tier pauses after 7 days of inactivity and can be deleted after 90 days. Upgrade to the Pro plan ($25/mo) before going live for real.
5. **A privacy policy and terms of service** — required by law in most jurisdictions for any app that collects personal data. Generators like **[termly.io](https://termly.io)** give you templates; a lawyer should review them for health data specifically.
6. **A clinical advisor** — ideally a doctor who has reviewed what PulseAI says and signed off. Otherwise, PulseAI is just a chatbot claiming to understand health data.
7. **An explicit disclaimer** on sign-up that the app is **not a substitute for professional medical care**, and emergency instructions (who to call for a heart attack, stroke symptoms, suicidal thoughts).
8. **Legal review** for data-protection compliance in your target countries. In Iraq, investigate the **Iraqi Personal Data Protection** landscape. For any EU users, GDPR applies. For any US users, HIPAA applies and is strict.
9. **Incident response plan** — what happens when your site goes down and a patient's alert doesn't fire? Who gets paged? There is no good answer at the free-tier stage; this is why paid infrastructure + 24/7 on-call is required for real medical use.

**My recommendation:** launch it publicly as a **"health tracking demo — not medical advice"** tool first. Get friends and family using it. Find a doctor willing to pilot it with consenting patients. Iterate. Apply for health-tech incubators (Y Combinator, Rock Health, Techstars — they exist in MENA too). Raise funds so you can hire the security/compliance help a real product needs.

You've built a great foundation. Don't rush past this step.

---

# Troubleshooting

**"Sign up fails / doesn't redirect"**
→ Check `js/supabase-config.js` has your real URL and anon key. Open browser console (F12) for the error.

**"AI chat says 'AI service unreachable'"**
→ You're running locally (just opening `index.html`) instead of on Vercel. The `/api/chat` endpoint only exists on Vercel. Either push to Vercel or run `vercel dev` locally (after `npm i -g vercel`).

**"Doctor dashboard is empty"**
→ No patients have `assigned_doctor_id` pointing to the doctor. See step 5.3.

**"Vitals don't show on patient dashboard"**
→ No rows in `vitals` table for that patient. See step 5.4.

**"I pushed code but Vercel isn't updating"**
→ Vercel dashboard → your project → Deployments tab. Check for red "Failed" builds and click into the logs.

**"Supabase says my project is paused"**
→ Free tier pauses after 7 days of inactivity. Dashboard → **Restore project**. To avoid this, upgrade or build a simple cron ping.

---

You've got this. If any step above feels stuck, the answer is almost always in the browser console (`F12`) or the Vercel deployment logs — they tell you exactly what broke in plain English.
