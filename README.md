# InsureVision AI

![InsureVision Logo](public/logo.svg)

Smart vehicle damage estimation powered by AI.
Upload photos of a damaged car and get an instant repair cost breakdown.

---

## Features

- **AI Damage Estimation** - Upload up to 8 photos and receive a detailed parts-level cost breakdown with severity ratings.
- **PDF Reports** - Download professional estimation reports as PDF, generated client-side.
- **Authentication** - Email/password and Google OAuth via NextAuth v5 (JWT strategy).
- **Profile Management** - Update name, change password, delete account.
- **Dark Mode** - System-aware theme with manual toggle.
- **Route Protection** - Middleware redirects unauthenticated users to login.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | NextAuth v5 (beta) - Credentials + Google |
| Database | PostgreSQL via Prisma 7 |
| Styling | Tailwind CSS 4 |
| PDF | jsPDF |
| Validation | Zod |
| Language | TypeScript |

## Project Reading Order (A -> Z)

If you want to understand all pages and the full flow without getting lost, read in this order:

1. `app/layout.tsx`
   - Understand the global structure (HTML, fonts, global CSS).
2. `app/page.tsx`
   - Understand the landing page (navigation, marketing sections, CTA).
3. `app/(auth)/register/page.tsx`
   - Understand the client-side registration form and API call.
4. `app/api/auth/register/route.ts`
   - Understand validation, password hashing, and DB creation.
5. `config/auth.ts`
   - Understand NextAuth configuration (Google + Credentials, JWT session).
6. `app/api/auth/[...nextauth]/route.ts`
   - Understand how NextAuth exposes its API endpoints.
7. `app/(auth)/login/page.tsx`
   - Understand the current login UI and auth integration points to finalize.

Useful supporting files after this walkthrough:

- `lib/validations/auth.ts` (Zod rules)
- `types/auth.ts` (API response contracts)
- `config/db.ts` + `prisma/schema.prisma` (data model)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (optional, for social login)

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/insurevision"
AUTH_SECRET="your-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```text
app/
  (auth)/          Auth pages (login, register, forgot/reset password)
  api/             API routes (auth, profile, estimate)
  profile/         Profile management page
  page.tsx         Home - upload & estimation
components/        Reusable UI components
config/            NextAuth & database configuration
lib/               Constants, icons, validation schemas, PDF generation
prisma/            Schema & migrations
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Generate Prisma client and production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## License

Private - all rights reserved.

---

Built with love by the InsureVision team.
