# TracBoard Setup (Short)

Barebones steps to run locally and deploy. No env samples included.

## Prereqs
- Node.js 18+
- Supabase Postgres (connection string)
- Gemini API key
- Basecamp OAuth app (client id/secret)

## Environment
Create `.env.local` with these keys (values required):
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `BASECAMP_CLIENT_ID`
- `BASECAMP_CLIENT_SECRET`
- `NEXT_PUBLIC_BASECAMP_CLIENT_ID`

Optional (only if you use external parts/equipment API):
- `RHR_MFG_API_URL`
- `RHR_MFG_API_KEY`

## Dev
```powershell
npm install
npx prisma generate
npx prisma db push
npm run dev
```
App: http://localhost:3000

## Prod (Vercel)
1) Push repo to GitHub
2) Import on Vercel and set env vars above (Production)
3) Deploy

Tip: If schema changes don’t exist yet in the DB, run once from local or CI:
```powershell
npx prisma db push
```

## Quick Troubleshooting
- Check env vars exist and are correct
- Ensure Supabase is reachable from your network
- Reinstall deps and regenerate Prisma client if types break
```powershell
rm -r node_modules
npm install
npx prisma generate
```
