# ArabStore77 — السوق العرب

منصة تجارة إلكترونية عربية مبنية بـ Next.js 16.

## Stack
- **Framework**: Next.js 16 (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **Database/Auth**: Supabase
- **Media**: Cloudinary
- **State**: Zustand + TanStack Query
- **Package manager**: pnpm

## How to run
```bash
pnpm run dev
```
يشتغل على port 5000. الـ workflow "Start application" يشغّله تلقائياً.

## Environment variables
الموجودة في `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_API_KEY` / `CLOUDINARY_URL`
- `HUGGING_FACE_HUB_TOKEN`
