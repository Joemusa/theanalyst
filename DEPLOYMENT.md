# InsightHub AI — Vercel Deployment Guide

## What You Have Now

```
insighthub-nextjs/
├── app/
│   ├── layout.tsx          ← Root layout
│   ├── page.tsx            ← Home (redirects to dashboard or login)
│   ├── globals.css         ← Design tokens
│   ├── login/page.tsx      ← Real Supabase login
│   ├── register/page.tsx   ← Real Supabase signup
│   ├── dashboard/page.tsx  ← Real data from Supabase
│   ├── auth/callback/      ← OAuth redirect handler
│   └── api/
│       ├── payfast/itn/    ← PayFast payment webhook
│       └── ai/chat/        ← Claude AI (server-side, key protected)
├── lib/supabase/
│   ├── client.ts           ← Browser Supabase client
│   └── server.ts           ← Server Supabase client + admin client
├── middleware.ts            ← Auth protection for all routes
├── .env.example            ← Environment variable template
├── .gitignore              ← Excludes .env.local and node_modules
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Step-by-Step Deployment

### Step 1 — Set up the project on your computer

Open your terminal and run:

```bash
# 1. Create a new folder and copy the Next.js files into it
mkdir insighthub-ai
cd insighthub-ai

# 2. Copy all the files from the insighthub-nextjs folder here

# 3. Install dependencies
npm install

# 4. Copy the environment template
cp .env.example .env.local
```

---

### Step 2 — Fill in your .env.local

Open `.env.local` in any text editor and fill in:

```env
# From: supabase.com > your project > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# From: console.anthropic.com > API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# From: payfast.co.za > My Account > Settings > Merchant Details
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_SANDBOX=true

# Your app URL (update after Vercel deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step 3 — Test locally

```bash
npm run dev
```

Open http://localhost:3000 — you should be redirected to /login.

Try registering an account. Check Supabase Dashboard > Authentication > Users — your user should appear there.

---

### Step 4 — Push to GitHub

```bash
# In your project folder:
git init
git add .
git commit -m "Initial InsightHub AI commit"

# Create a new repo on github.com called "insighthub-ai"
# Then:
git remote add origin https://github.com/YOUR_USERNAME/insighthub-ai.git
git branch -M main
git push -u origin main
```

**IMPORTANT:** Never commit `.env.local` — it's in `.gitignore` so it won't be included.

---

### Step 5 — Deploy to Vercel

1. Go to **vercel.com** and sign in with GitHub
2. Click **"Add New Project"**
3. Find and select your **insighthub-ai** repository
4. Click **"Import"**
5. Framework Preset: **Next.js** (auto-detected)
6. Click **"Environment Variables"** and add each variable from your `.env.local`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `ANTHROPIC_API_KEY` | your Claude API key |
| `PAYFAST_MERCHANT_ID` | your merchant ID |
| `PAYFAST_MERCHANT_KEY` | your merchant key |
| `PAYFAST_PASSPHRASE` | your passphrase |
| `PAYFAST_SANDBOX` | true |
| `NEXT_PUBLIC_APP_URL` | https://your-app.vercel.app (add after deploy) |

7. Click **"Deploy"**
8. Wait ~2 minutes — Vercel builds and deploys automatically

---

### Step 6 — Update Supabase with your Vercel URL

Once deployed, copy your Vercel URL (e.g. `https://insighthub-ai.vercel.app`) and:

**In Supabase Dashboard > Authentication > URL Configuration:**
- Site URL: `https://insighthub-ai.vercel.app`
- Redirect URLs: `https://insighthub-ai.vercel.app/auth/callback`

**In Vercel > your project > Settings > Environment Variables:**
- Update `NEXT_PUBLIC_APP_URL` to `https://insighthub-ai.vercel.app`

---

### Step 7 — Update PayFast notify_url

In your HTML file `submitToPayfast()` function, update:
```javascript
notify_url: 'https://insighthub-ai.vercel.app/api/payfast/itn'
```

Or in your PayFast merchant dashboard, set the webhook URL to:
```
https://insighthub-ai.vercel.app/api/payfast/itn
```

---

### Step 8 — Test the full flow

1. Go to `https://your-app.vercel.app/register`
2. Create an account
3. Check Supabase > Authentication > Users — you should see the user
4. Check Supabase > Table Editor > profiles — your profile row should be there
5. Go to `/dashboard` — should show real data (empty at first)
6. Go to `/subscription` and test the PayFast sandbox payment

---

## After Everything Works

When you're ready to go live:

1. **PayFast:** Switch from sandbox to production credentials in Vercel env vars and set `PAYFAST_SANDBOX=false`
2. **Domain:** Add your custom domain in Vercel > Settings > Domains
3. **Supabase:** Upgrade to Pro if you exceed the free tier limits

---

## Common Issues

| Problem | Solution |
|---|---|
| "Invalid API key" on login | Check NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel env vars |
| Redirect loop on /login | Check Site URL in Supabase Auth settings matches your Vercel URL |
| PayFast 400 error | You're testing locally — PayFast needs an https:// URL |
| "User not found" in ITN | Check SUPABASE_SERVICE_ROLE_KEY is correct |
| Build fails | Run `npm run build` locally first to catch errors |
