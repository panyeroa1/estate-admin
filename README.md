# Estate Admin – Supabase + Vercel

Full admin dashboard connected to Supabase with Vite. Follow these steps to provision the database, connect environment variables, and deploy on Vercel.

## 1) Supabase setup
1. Create a new Supabase project (or use the provided URL/key).
2. Open the **SQL Editor** and run the contents of `supabase_schema.sql`.  
   - This creates all tables (leads, messages, properties, tasks, events, transactions), enables UUID generation, and sets permissive demo RLS policies.  
   - For production, replace the `USING (true)` policies with role-based policies and require auth.

## 2) Environment variables
Create a `.env` file locally (or set in Vercel) with:
```
VITE_SUPABASE_URL=https://wmgyanogbyzslfzpqmei.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ3lhbm9nYnl6c2xmenBxbWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTQ4MjQsImV4cCI6MjA2Nzc3MDgyNH0.czHsY-rIV0WnPJ1eYXIi1CXey_BRCt5vvP5FzBqyCnc
NEXT_PUBLIC_SUPABASE_URL=https://wmgyanogbyzslfzpqmei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ3lhbm9nYnl6c2xmenBxbWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTQ4MjQsImV4cCI6MjA2Nzc3MDgyNH0.czHsY-rIV0WnPJ1eYXIi1CXey_BRCt5vvP5FzBqyCnc
```
`VITE_` keys are used at build time; `NEXT_PUBLIC_` is kept for compatibility.

## 3) Run locally
```
npm install
npm run dev
```
The app will connect to the Supabase project using the variables above.

## 4) Deploy to Vercel
1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, “Import Project” and select **Framework Preset: Vite**.
3. Set the four environment variables above in **Project Settings → Environment Variables**.
4. Build command: `npm run build`  
   Output directory: `dist`
5. Deploy. The client will use the same Supabase URL/key in production.

## Notes
- The current SQL policies allow anonymous read/write for demo convenience. Tighten RLS before going live.
- Bundle size may trigger a Rollup warning; enable code-splitting or `manualChunks` if desired.***
