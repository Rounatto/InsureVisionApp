# InsureVision AI

InsureVision is a Next.js fullstack app for vehicle damage estimation.
Users upload vehicle photos, the local model inference pipeline analyzes them,
and the app returns confident predictions plus a cost-estimation placeholder.

## Current Highlights

- Local-only AI inference flow (`MODEL_INFERENCE_API_URL`)
- Async estimation job pipeline (queued -> processing -> completed/failed)
- Confidence-filtered prediction display
- Placeholder cost estimation block (until dedicated cost model is integrated)
- Plain insurance-style PDF export with attached photos
- Auth with email/password + Google OAuth
- Email verification and password reset via Gmail SMTP

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Prisma 7 + PostgreSQL
- NextAuth v5 (Credentials + Google)
- Zod for request validation
- Tailwind CSS 4
- `@react-pdf/renderer` for PDF generation
- pnpm as package manager

## Requirements

- Node.js 20+
- pnpm 10+
- PostgreSQL database
- Running local model API for inference (FastAPI endpoint expected)

## Environment

Required core variables in `.env`:

```env
DATABASE_URL="postgresql://..."
MIGRATE_DATABASE_URL="postgresql://..."

AUTH_SECRET="..."
AUTH_URL="http://localhost:3001"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

GMAIL_USER="your@gmail.com"
GMAIL_APP_PASS="your-app-password"

MODEL_INFERENCE_API_URL="http://127.0.0.1:8000"
```

## Install and Run

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm dev
```

App runs on: `http://localhost:3001`

## Scripts

- `pnpm dev` - Run development server
- `pnpm build` - Generate Prisma client and build app
- `pnpm start` - Run production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

## Project Structure

```text
app/
   (auth)/
   (dashboard)/
   api/

components/
config/

lib/
   client/        # browser/client utilities (PDF export)
   server/        # server-only helpers (auth/db/email/estimate/model)
   validations/
   generated/
   icons.tsx
   constants.ts
   utils.ts

prisma/
types/
diagrams/
   code/
   images/
```

## Notes

- Estimation output currently includes confident predictions and a hardcoded
   placeholder cost block by design.
- The middleware file convention is deprecated in Next.js and can later be
   migrated to `proxy.ts`.

## License

Private - all rights reserved.
