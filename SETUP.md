# TracBoard Setup Guide

Complete instructions for running TracBoard in development and production.

## Prerequisites

- **Node.js 18+** (download from https://nodejs.org)
- **Supabase Project** (free tier works fine) - https://supabase.com
- **Google Gemini API Key** - https://aistudio.google.com/apikey
- A text editor (VS Code recommended)

---

## Environment Setup

### 1. Get Your Supabase Connection String

1. Go to your **Supabase Dashboard** → Select your project
2. Click **Settings** → **Database** (left sidebar)
3. Under "Connection string", select **Prisma** from the dropdown
4. Copy the entire string (looks like: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. Replace `[PASSWORD]` with your actual database password (the one you set when creating the project)

> **⚠️ Important:** If your password contains special characters like `!@#$%`, URL-encode them. Use an [online URL encoder](https://www.urlencoder.org) if needed.

### 2. Get Your Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Click **"Create API Key"** or copy an existing one
3. The key will start with `AIzaSy`

### 3. Create `.env.local`

In the project root directory (same level as `package.json`), create a file called `.env.local`:

```env
# Supabase PostgreSQL connection (REQUIRED - see step 1)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# Google Gemini API key (REQUIRED - see step 2)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional: rhr-mfg API for parts tracking
# RHR_MFG_API_URL=http://localhost:5173
# RHR_MFG_API_KEY=your_key_here
```

> **Security:** Never commit `.env.local` to git. It's already in `.gitignore`.

---

## Development Setup

### 1. Install Dependencies

```powershell
npm install
```

### 2. Set Up Database Schema

```powershell
npx prisma generate
npx prisma db push
```

This creates all tables in your Supabase database based on `prisma/schema.prisma`.

### 3. Start Development Server

```powershell
npm run dev
```

The app will run at **http://localhost:3000**

### 4. Access the App

- **Dashboard**: http://localhost:3000
- **Attendance Upload**: http://localhost:3000/upload
- **Management Panel**: http://localhost:3000/management

---

## Production Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**
   ```powershell
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Connect your GitHub account and select the TracBoard repo
   - Click "Import"

3. **Set Environment Variables**
   - In Vercel dashboard, go to **Settings** → **Environment Variables**
   - Add these variables:
     - `DATABASE_URL` - Your Supabase connection string (from Setup step 1)
     - `GEMINI_API_KEY` - Your Gemini API key (from Setup step 2)
   - Make sure they're set for **Production** environment
   - Click "Save"

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy
   - Your app is now live at `https://your-project.vercel.app`

### Deploy to Other Platforms

**Heroku, Railway, Render, etc.** all follow similar steps:
1. Connect your GitHub repository
2. Set the same environment variables (`DATABASE_URL`, `GEMINI_API_KEY`)
3. Deploy

---

## Database Connection Issues

### Error: "Connection refused" or "Cannot connect to database"

**Solution:**
1. Verify your `DATABASE_URL` is correct (check for typos, especially the domain)
2. Verify your database password is URL-encoded if it has special characters
3. Check that your Supabase project is running (look for green indicator in Supabase dashboard)
4. Make sure your IP is whitelisted in Supabase (Settings → Database → Add My IP)

### Error: "Prepared statements not supported"

**Why this happens:** Supabase's connection pooler (pgBouncer) can conflict with Prisma's prepared statements.

**Solution:** This is already handled in the code. The `DATABASE_URL` uses `?pgbouncer=true` automatically via Prisma's connection string configuration.

### Error: "Unique constraint violation" on attendance records

**Why:** Trying to add two attendance records for the same person on the same date.

**Solution:** Use the management panel to edit/delete existing records, or use the toggle/delete buttons in the attendance history.

---

## Troubleshooting

### App won't start (`npm run dev` fails)

1. Clear Node cache:
   ```powershell
   rm -r node_modules
   npm install
   ```

2. Check for TypeScript errors:
   ```powershell
   npx tsc --noEmit
   ```

### Attendance records showing wrong dates

This is a timezone issue. The API stores dates at UTC midnight to avoid drift. This is **expected behavior** - dates in the UI should match what's in the database.

### Gemini API key errors

- Verify the key starts with `AIzaSy`
- Check that the key is not expired in https://aistudio.google.com/apikey
- Regenerate the key if unsure

### Port 3000 already in use

```powershell
# Use a different port
npm run dev -- -p 3001
```

---

## Useful Commands

```powershell
# Start dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Regenerate Prisma client
npx prisma generate

# View Supabase database in browser
npx prisma studio

# Push schema changes to database
npx prisma db push

# See database migration history
npx prisma migrate status
```

---

## Need Help?

1. Check browser console for errors (F12 or Right Click → Inspect)
2. Check terminal for server-side errors
3. Verify `.env.local` has all required variables
4. Ensure Supabase project is active and database is running
5. Verify Gemini API key is valid and has quota remaining
