# EaseMyPrompt.ai — Complete Deployment Guide

> A full-stack Next.js 14 AI prompt management platform with MongoDB Atlas, Google OAuth, Magic Link email auth, and Claude AI streaming.

---

## 📋 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Prerequisites](#-prerequisites)
3. [Clone & Install](#-clone--install)
4. [Database Setup — MongoDB Atlas](#1-database-setup--mongodb-atlas)
5. [Authentication Setup — NextAuth.js](#2-authentication-setup--nextauthjs)
   - [Google OAuth](#a-google-oauth)
   - [Email Magic Link (Gmail SMTP)](#b-email-magic-link-gmail-smtp)
   - [Generate NextAuth Secret](#c-generate-nextauth-secret)
6. [AI Setup — Anthropic Claude](#3-ai-setup--anthropic-claude)
7. [Environment Variables Reference](#-environment-variables-reference)
8. [Seed the Database](#-seed-the-database)
9. [Run Locally](#-run-locally)
10. [Deploy to Vercel](#-deploy-to-vercel)
11. [Connect a Custom Domain](#-connect-a-custom-domain)
12. [Post-Deployment Checklist](#-post-deployment-checklist)
13. [Managing Prompts & Categories](#-managing-prompts--categories)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js v4 (Google OAuth, Magic Link, Credentials) |
| AI | Anthropic Claude (streaming) |
| Email | Nodemailer + Gmail SMTP |
| Styling | Tailwind CSS + Framer Motion |
| Deployment | Vercel (recommended) |

---

## ✅ Prerequisites

Before you start, make sure you have the following installed:

- **Node.js** v18 or later → [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes with Node.js)
- **Git** → [git-scm.com](https://git-scm.com)
- A **MongoDB Atlas** account (free) → [mongodb.com/atlas](https://www.mongodb.com/atlas)
- A **Google Cloud Console** account (free) → [console.cloud.google.com](https://console.cloud.google.com)
- A **Gmail** account (for sending magic link emails)
- An **Anthropic** account → [console.anthropic.com](https://console.anthropic.com)
- A **Vercel** account (free) → [vercel.com](https://vercel.com)

---

## 📦 Clone & Install

```bash
# 1. Clone the repository
git clone https://github.com/your-username/easemyprompt.git
cd easemyprompt

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# (or manually create a .env file — see the reference section below)
```

---

## 1. Database Setup — MongoDB Atlas

### Step 1 — Create a Free Cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up / log in.
2. Click **"Build a Database"** → choose **Free (M0 Shared)** → pick a cloud provider & region closest to you → click **"Create"**.

### Step 2 — Create a Database User

1. In the left sidebar, go to **Security → Database Access**.
2. Click **"Add New Database User"**.
3. Choose **Password** as the authentication method.
4. Set a username (e.g., `easemyprompt_user`) and a strong password. **Save these — you'll need them.**
5. Under "Database User Privileges", select **"Read and write to any database"**.
6. Click **"Add User"**.

### Step 3 — Whitelist Your IP Address

1. In the left sidebar, go to **Security → Network Access**.
2. Click **"Add IP Address"**.
3. For local development: click **"Add Current IP Address"**.
4. For production (Vercel): click **"Allow Access from Anywhere"** (`0.0.0.0/0`) — Vercel uses dynamic IPs so this is necessary.
5. Click **"Confirm"**.

### Step 4 — Get Your Connection String

1. In the left sidebar, go to **Database → Clusters**.
2. Click **"Connect"** on your cluster.
3. Choose **"Drivers"** → select **Node.js**, version **5.5 or later**.
4. Copy the connection string. It looks like this:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Replace `<username>` and `<password>` with the credentials you created above.
6. Append the database name before the `?`. Your final URI should look like:

```
mongodb+srv://easemyprompt_user:YourPassword@cluster0.xxxxx.mongodb.net/easemyprompt?retryWrites=true&w=majority
```

7. Add this to your `.env` file:

```env
MONGODB_URI=mongodb+srv://easemyprompt_user:YourPassword@cluster0.xxxxx.mongodb.net/easemyprompt?retryWrites=true&w=majority
```

---

## 2. Authentication Setup — NextAuth.js

### A. Google OAuth

#### Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Click the project dropdown at the top → **"New Project"**.
3. Name it (e.g., `EaseMyPrompt`) → click **"Create"**.
4. Make sure the new project is selected in the dropdown.

#### Step 2 — Enable the Google+ API

1. In the left sidebar, go to **APIs & Services → Library**.
2. Search for **"Google+ API"** → click it → click **"Enable"**.
   > *(Alternatively search for "Google People API" — either works for OAuth.)*

#### Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Select **"External"** → click **"Create"**.
3. Fill in:
   - **App name**: `EaseMyPrompt`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **"Save and Continue"** through the Scopes and Test Users steps (defaults are fine).
5. Click **"Back to Dashboard"**.

#### Step 4 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **"+ Create Credentials"** → **"OAuth client ID"**.
3. Application type: **"Web application"**.
4. Name: `EaseMyPrompt Web`.
5. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
6. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
   > Replace `yourdomain.com` with your actual domain or Vercel deployment URL (e.g., `easemyprompt.vercel.app`).
7. Click **"Create"**.
8. Copy the **Client ID** and **Client Secret** shown in the popup.
9. Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

### B. Email Magic Link (Gmail SMTP)

The app sends magic link login emails via Gmail's SMTP server using **Nodemailer**.

#### Step 1 — Enable 2-Factor Authentication on Gmail

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security).
2. Under "How you sign in to Google", enable **"2-Step Verification"** if not already on.

#### Step 2 — Create a Gmail App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. In the "App name" field, type something like `EaseMyPrompt` → click **"Create"**.
3. Google will show you a **16-character app password**. **Copy it immediately** — it won't be shown again.

#### Step 3 — Build the SMTP Connection String

Format:
```
smtp://your_gmail@gmail.com:your_app_password@smtp.gmail.com:587
```

Example:
```
smtp://johndoe@gmail.com:abcd efgh ijkl mnop@smtp.gmail.com:587
```

> Remove the spaces from the 16-character app password when pasting it.

Add to your `.env` file:

```env
EMAIL_SERVER=smtp://johndoe@gmail.com:abcdefghijklmnop@smtp.gmail.com:587
EMAIL_FROM=noreply@yourdomain.com
```

> `EMAIL_FROM` is the "From" display address. It can be any address — the email will still be sent via your Gmail account.

---

### C. Generate NextAuth Secret

The `NEXTAUTH_SECRET` is used to encrypt session tokens. Generate a strong random value:

**On Mac/Linux:**
```bash
openssl rand -hex 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

**Or use Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output to your `.env` file:
```env
NEXTAUTH_SECRET=paste_your_generated_secret_here
```

---

## 3. AI Setup — Anthropic Claude

The app uses Claude for AI-powered prompt generation with streaming responses.

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign up / log in.
2. In the left sidebar, click **"API Keys"**.
3. Click **"Create Key"** → give it a name → click **"Create Key"**.
4. Copy the key (starts with `sk-ant-api03-...`). **This is shown only once.**
5. Add to your `.env` file:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

> Anthropic offers free credits for new accounts. For production usage, add billing at [console.anthropic.com/settings/billing](https://console.anthropic.com/settings/billing).

---

## 📄 Environment Variables Reference

Create a `.env` file in the root of the project with all the following variables:

```env
# ─── Database ─────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/easemyprompt?retryWrites=true&w=majority

# ─── NextAuth ─────────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_32_chars_or_more

# ─── Google OAuth ─────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ─── Email (Nodemailer / Gmail SMTP) ──────────────────────────────────────────
EMAIL_SERVER=smtp://your_gmail@gmail.com:your_app_password@smtp.gmail.com:587
EMAIL_FROM=noreply@yourdomain.com

# ─── AI (Anthropic) ───────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

> **⚠️ Never commit your `.env` file to Git.** The `.gitignore` already excludes it — make sure you don't accidentally force-add it.

---

## 🌱 Seed the Database

Once your `MONGODB_URI` is set, seed the initial categories so the Prompt Bank filter tabs appear correctly.

### Method 1 — MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass).
2. Open Compass → paste your `MONGODB_URI` connection string → click **"Connect"**.
3. In the left sidebar, click `easemyprompt` → click `categories`.
4. Click **"Add Data → Import JSON or CSV"**.
5. Paste the following JSON array:

```json
[
  { "name": "Copywriting", "emoji": "✍️" },
  { "name": "Coding", "emoji": "💻" },
  { "name": "Marketing", "emoji": "📣" },
  { "name": "Design", "emoji": "🎨" },
  { "name": "Writing", "emoji": "📝" },
  { "name": "Image", "emoji": "🖼️" },
  { "name": "Video", "emoji": "🎬" },
  { "name": "Business", "emoji": "💼" }
]
```

6. Click **"Import"**.

### Method 2 — Atlas Web UI

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com).
2. Click your cluster → **"Browse Collections"**.
3. If the `easemyprompt` database doesn't exist yet, click **"Create Database"** → name it `easemyprompt`, collection name `categories`.
4. Click **"Insert Document"** and add each category, or use **"Import"** with the JSON array above.

---

## 💻 Run Locally

```bash
# Make sure your .env is configured, then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build production bundle |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

---

## 🚀 Deploy to Vercel

Vercel is the recommended platform — it has native Next.js support and a generous free tier.

### Step 1 — Push Your Code to GitHub

```bash
git init                          # if not already a git repo
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/easemyprompt.git
git push -u origin main
```

### Step 2 — Import the Project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in (use GitHub for easy linking).
2. Click **"Add New… → Project"**.
3. Under **"Import Git Repository"**, find and select your `easemyprompt` repo → click **"Import"**.
4. Leave the framework preset as **"Next.js"** (Vercel detects it automatically).

### Step 3 — Add Environment Variables

Before clicking "Deploy", scroll down to **"Environment Variables"** and add every variable from your `.env` file:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your full MongoDB Atlas connection string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` *(use your actual Vercel URL or custom domain)* |
| `NEXTAUTH_SECRET` | Your generated secret |
| `GOOGLE_CLIENT_ID` | Your Google client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google client secret |
| `EMAIL_SERVER` | Your SMTP connection string |
| `EMAIL_FROM` | Your from email |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

> **Important:** `NEXTAUTH_URL` must be your production URL, not `localhost`.

### Step 4 — Deploy

Click **"Deploy"**. Vercel will build and deploy your app. It takes about 1–2 minutes.

Once deployed, you'll get a URL like `https://easemyprompt-xxxx.vercel.app`.

### Step 5 — Update Google OAuth Redirect URIs

After deployment, go back to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

1. Click on your OAuth 2.0 Client.
2. Under **"Authorized JavaScript origins"**, add your Vercel URL:
   ```
   https://easemyprompt-xxxx.vercel.app
   ```
3. Under **"Authorized redirect URIs"**, add:
   ```
   https://easemyprompt-xxxx.vercel.app/api/auth/callback/google
   ```
4. Click **"Save"**.

---

## 🌐 Connect a Custom Domain

### Step 1 — Buy a Domain

Purchase your domain from a registrar such as:
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [Cloudflare](https://www.cloudflare.com/products/registrar/) *(recommended — free WHOIS privacy, cheapest renewals)*
- [Google Domains](https://domains.google)

### Step 2 — Add the Domain to Vercel

1. In your Vercel dashboard, open your project.
2. Go to **Settings → Domains**.
3. Type your domain (e.g., `easemyprompt.ai`) → click **"Add"**.
4. Vercel will show you two DNS records to add. You have two options:

#### Option A — Use Vercel Nameservers (Easiest)

1. Vercel will give you two nameservers, e.g.:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
2. Go to your domain registrar → find **"Nameservers"** or **"DNS"** settings.
3. Replace the existing nameservers with Vercel's nameservers.
4. Wait 10–48 hours for DNS propagation. Vercel will automatically provision an SSL certificate.

#### Option B — Add DNS Records Manually (If you want to keep your registrar's DNS)

Vercel will show you either an **A record** or **CNAME record**:

**For the root/apex domain (`easemyprompt.ai`):**
| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |

**For `www` subdomain:**
| Type | Name | Value |
|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com` |

Go to your registrar's DNS settings and add these records. Changes propagate in 10 minutes to 48 hours.

### Step 3 — Verify & SSL

Vercel automatically issues a free **Let's Encrypt SSL certificate** once the DNS records propagate. You'll see a green checkmark next to your domain in the Vercel Domains dashboard when it's live.

### Step 4 — Update All URLs for Your Custom Domain

After the domain is live:

1. **Update `NEXTAUTH_URL`** in Vercel Environment Variables:
   - Go to Vercel → Your Project → **Settings → Environment Variables**.
   - Edit `NEXTAUTH_URL` → change it to `https://easemyprompt.ai`.
   - Click **"Save"** and then **"Redeploy"** your project (Deployments tab → latest deploy → Redeploy).

2. **Update Google OAuth Authorized URIs** ([console.cloud.google.com](https://console.cloud.google.com)):
   - **Authorized JavaScript origins**: Add `https://easemyprompt.ai` and `https://www.easemyprompt.ai`
   - **Authorized redirect URIs**: Add `https://easemyprompt.ai/api/auth/callback/google`

3. **Update `EMAIL_FROM`** if desired:
   - Change it to `noreply@easemyprompt.ai` to match your domain.
   - Note: For emails to actually send *from* your custom domain (not Gmail), you'd need a transactional email service like [Resend](https://resend.com), [SendGrid](https://sendgrid.com), or [Postmark](https://postmarkapp.com) — all offer free tiers. For basic use, Gmail SMTP works fine with any `EMAIL_FROM` value.

---

## ✅ Post-Deployment Checklist

Run through this after your first deployment to make sure everything works:

- [ ] App loads at your Vercel URL or custom domain over HTTPS
- [ ] **Sign up with email** → you receive a magic link in your inbox → clicking it logs you in
- [ ] **Login with Google** → redirects correctly and logs you in
- [ ] **Prompt Bank** loads and shows categories and prompts
- [ ] **AI chat / generation** works (tests the Anthropic API key)
- [ ] MongoDB Atlas shows new user documents in the `users` collection after sign-up
- [ ] `NEXTAUTH_URL` matches your live domain exactly (wrong URL = auth errors)
- [ ] Google OAuth redirect URI matches `https://yourdomain.com/api/auth/callback/google`
- [ ] MongoDB Network Access allows `0.0.0.0/0` so Vercel can connect

### Common Issues

| Problem | Likely Cause | Fix |
|---|---|---|
| `NEXTAUTH_URL` mismatch error | `NEXTAUTH_URL` set to old URL | Update in Vercel env vars → redeploy |
| Google OAuth `redirect_uri_mismatch` | Redirect URI not added in Google Console | Add production URI to OAuth credentials |
| Magic link emails not arriving | Wrong SMTP string or app password | Re-generate Gmail App Password, check format |
| MongoDB connection timeout | IP not whitelisted | Set Network Access to `0.0.0.0/0` in Atlas |
| `ANTHROPIC_API_KEY` error | Key invalid or billing not set up | Verify key in Anthropic console |
| `500` errors after deploy | Missing env variable | Check all env vars are set in Vercel |

---

## 📁 Managing Prompts & Categories

All content is managed directly in MongoDB. No admin panel needed.

### Collections

| Collection | Purpose |
|---|---|
| `categories` | Filter tabs shown in the Prompt Bank |
| `prompts` | Prompt cards shown in the Prompt Bank |

### Adding a Category

```json
{
  "name": "Copywriting",
  "emoji": "✍️"
}
```

> `name` must be **unique** and match exactly what you use in prompts' `category` field.

### Adding a Regular Prompt

```json
{
  "title": "SEO Blog Outline",
  "emoji": "📝",
  "category": "Writing",
  "description": "Generate a full SEO-optimized blog outline from a single keyword.",
  "promptText": "Act as an expert SEO content strategist...",
  "sampleOutput": "H1: The Ultimate Guide to [Keyword] in 2025...",
  "outputType": "text",
  "isMega": false,
  "tags": ["seo", "blog", "content"],
  "trendingScore": 80,
  "popularScore": 90
}
```

### Adding a Mega Prompt

Same structure as above but with `"isMega": true`. Mega Prompts open a full dedicated page at `/prompts/[id]`.

### Prompt Fields Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | String | ✅ | Short name of the prompt |
| `emoji` | String | ✅ | Single emoji on the card |
| `category` | String | ✅ | Must match a `categories.name` exactly |
| `description` | String | ✅ | Short summary shown on card |
| `promptText` | String | ✅ | The full prompt body |
| `isMega` | Boolean | ✅ | `true` for full-page, `false` for modal |
| `sampleOutput` | String | ❌ | Preview text, image URL, or video URL |
| `outputType` | String | ❌ | `"text"`, `"image"`, or `"video"` |
| `tags` | Array | ❌ | Searchable tags |
| `trendingScore` | Number | ❌ | Higher = ranked higher in trending |
| `popularScore` | Number | ❌ | Higher = ranked higher in popular |

### Image & Video Prompts

To display an image or video preview on a card:
1. Host your media on Cloudinary, Imgur, AWS S3, or any public CDN.
2. Set `outputType` to `"image"` or `"video"`.
3. Set `sampleOutput` to the **direct public URL** of the file.

---

## 🔐 Auth Flow Summary

| Method | Flow |
|---|---|
| **Email + Password** | User registers → password hashed with bcrypt → stored in MongoDB → login via Credentials provider |
| **Magic Link** | User enters email → one-click link sent via Gmail SMTP → clicking confirms account and logs in |
| **Google OAuth** | Redirects to Google → user authorizes → redirected back to `/api/auth/callback/google` → session created |

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── api/             # API routes (auth, prompts, AI)
│   ├── blog/            # Blog pages
│   ├── login/           # Login page
│   ├── signup/          # Signup page
│   ├── page.tsx         # Homepage / landing page
│   └── layout.tsx       # Root layout
├── components/          # Reusable UI components
└── lib/
    ├── auth.ts          # NextAuth configuration
    ├── db.ts            # Mongoose connection
    ├── mongodb.ts       # MongoDB client (for Auth adapter)
    ├── models/          # Mongoose models
    └── utils.ts         # Shared utilities
```

---

*Built with ❤️ using Next.js 14, MongoDB Atlas, and Anthropic Claude.*
