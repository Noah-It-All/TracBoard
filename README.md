# 📊 TracBoard

```
 _____               ____                       _
|_   _| __ __ _  ___| __ )  ___   __ _ _ __ __| |
  | || '__/ _` |/ __|  _ \ / _ \ / _` | '__/ _` |
  | || | | (_| | (__| |_) | (_) | (_| | | | (_| |
  |_||_|  \__,_|\___|____/ \___/ \__,_|_|  \__,_|

```

**Real-time attendance tracking & parts inventory for FRC teams**

Combines AI-powered photo recognition, live dashboards, and team management—built for the fabrication floor.

---

## 🎯 What It Does

| Feature | Purpose |
|---------|---------|
| 📸 **Attendance Upload** | Point camera at a handwritten attendence sheet, AI detects and logs attendance |
| 📈 **Live Dashboard** | Display attendance stats, todo, and kanban info on big screen |
| 👥 **Team Management** | Configure members, teams, and roles |
| 📦 **Parts Tracking** | Record parts used during fabrication |
| 🔄 **Attendance History** | Edit/delete past records; filter by member or date range |

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Supabase account (free)
- Gemini API key (free)

### Steps

1. **Clone & install**
   ```powershell
   git clone <your-repo>
   cd TracBoard
   npm install
   ```

2. **Set up environment** (see [SETUP.md](SETUP.md) for details)
   ```powershell
   # Create .env.local in project root
   DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Initialize database**
   ```powershell
   npx prisma generate
   npx prisma db push
   ```

4. **Start dev server**
   ```powershell
   npm run dev
   ```

5. **Open browser**
   - Dashboard: http://localhost:3000
   - Attendance Upload: http://localhost:3000/upload
   - Management: http://localhost:3000/management

---

## 📄 Pages

| Path | Purpose | Use Case |
|------|---------|----------|
| `/` | Dashboard with stats, leaderboard, big screen mode | Live display at events or practice |
| `/upload` | Photo upload & attendance detection | At the door: take photo, record attendance |
| `/management` | Config teams, members, view/edit attendance records | Admin panel for data management |

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14 • React • TypeScript • Tailwind CSS  
**Database:** Supabase PostgreSQL • Prisma ORM  
**AI:** Google Gemini API (image recognition)  
**Deployment:** Vercel (serverless) • Docker ready

---

## 💡 Use Cases

| Scenario | How It Helps |
|----------|-------------|
| **Build Season** | Track parts used per session; manage inventory |
| **After-Action** | Review attendance history; see who's most consistent |

---

## 🚀 Deploy to Production

### Vercel (Recommended – 5 minutes)

1. Push code to GitHub
2. Go to https://vercel.com → "Import Project" → connect your repo
3. Add environment variables:
   - `DATABASE_URL` (your Supabase connection string)
   - `GEMINI_API_KEY` (your API key)
4. Deploy

Your app is now live at `https://your-project.vercel.app`

**Full instructions:** See [SETUP.md](SETUP.md)

---

## ✅ Features

- ✅ AI-powered photo → attendance detection
- ✅ Live dashboard with graphs & leaderboards
- ✅ Team & member configuration
- ✅ Attendance CRUD (add/edit/delete/filter)
- ✅ Parts inventory display
- ✅ Big screen mode (fullscreen date/time display)


---

## 📁 Project Structure

```
app/
  ├─ api/                    # API endpoints
  │  ├─ attendance/          # Attendance CRUD
  │  ├─ equipment/           # Parts tracking
  │  └─ management/          # Config endpoints
  ├─ dashboard/              # Main dashboard page
  ├─ upload/                 # Attendance upload page
  ├─ management/             # Admin panel
  └─ layout.tsx              # Root layout

components/
  ├─ Dashboard.tsx           # Dashboard UI + big screen
  ├─ AttendanceStats.tsx     # Stats display
  ├─ Leaderboard.tsx         # Top members leaderboard
  ├─ ImageUpload.tsx         # Camera/file upload
  └─ PartsDisplay.tsx        # Parts inventory

lib/
  ├─ db.ts                   # Database client wrapper
  ├─ gemini.ts               # Gemini API integration
  ├─ utils.ts                # Helper functions
  └─ prisma.ts               # Prisma setup

prisma/
  └─ schema.prisma           # Database schema

public/                       # Static files
scripts/                      # Setup scripts
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't start | Clear `node_modules` and reinstall: `rm -r node_modules; npm install` |
| Database connection error | Check `.env.local` has `DATABASE_URL` filled correctly; verify Supabase project is running |
| Attendance dates wrong | This is normal—dates stored at UTC midnight to prevent timezone bugs |
| Gemini API key errors | Verify key starts with `AIzaSy`; regenerate at https://aistudio.google.com/apikey |
| Port 3000 in use | Use different port: `npm run dev -- -p 3001` |

**Full troubleshooting guide:** See [SETUP.md](SETUP.md)

---

## 📚 Full Setup & Deployment

Complete step-by-step instructions: **[SETUP.md](SETUP.md)**

Covers:
- Environment setup (Supabase, Gemini API)
- Development workflow
- Production deployment (Vercel, Heroku, Railway, etc.)
- Database connection issues
- Useful commands

---

## 💬 Questions?

1. Check [SETUP.md](SETUP.md) for installation & deployment
2. Review browser console errors (F12)
3. Check terminal output for server-side errors
4. Verify all environment variables are set
