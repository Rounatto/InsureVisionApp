<p align="center">
  <img src="public/logo.svg" alt="InsureVision Logo" width="80" />
</p>

<h1 align="center">InsureVision AI</h1>

<p align="center">
  Smart vehicle damage estimation powered by AI.<br />
  Upload photos of a damaged car and get an instant repair cost breakdown.
</p>

---

## Features

- **AI Damage Estimation** — Upload up to 8 photos and receive a detailed parts-level cost breakdown with severity ratings.
- **PDF Reports** — Download professional estimation reports as PDF, generated client-side.
- **Authentication** — Email/password and Google OAuth via NextAuth v5 (JWT strategy).
- **Profile Management** — Update name, change password, delete account.
- **Dark Mode** — System-aware theme with manual toggle.
- **Route Protection** — Middleware redirects unauthenticated users to login.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | NextAuth v5 (beta) — Credentials + Google |
| Database | PostgreSQL via Prisma 7 |
| Styling | Tailwind CSS 4 |
| PDF | jsPDF |
| Validation | Zod |
| Language | TypeScript |

## Ordre de lecture du projet (A → Z)

Si tu veux comprendre toutes les pages et le flux complet sans te perdre, lis dans cet ordre :

1. `app/layout.tsx`
	- Comprendre la structure globale (HTML, fonts, CSS global).
2. `app/page.tsx`
	- Comprendre la landing page (navigation, sections marketing, CTA).
3. `app/(auth)/register/page.tsx`
	- Comprendre le formulaire d'inscription côté client et l'appel API.
4. `app/api/auth/register/route.ts`
	- Comprendre la validation, le hash du mot de passe, la création DB.
5. `config/auth.ts`
	- Comprendre la configuration NextAuth (Google + Credentials, session JWT).
6. `app/api/auth/[...nextauth]/route.ts`
	- Comprendre comment NextAuth expose ses endpoints API.
7. `app/(auth)/login/page.tsx`
	- Comprendre l'UI login actuelle et les points d'intégration auth à finaliser.

Fichiers support utiles après ce parcours :

- `lib/validations/auth.ts` (règles Zod)
- `types/auth.ts` (contrats de réponses API)
- `config/db.ts` + `prisma/schema.prisma` (modèle de données)

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

```
app/
  (auth)/          Auth pages (login, register, forgot/reset password)
  api/             API routes (auth, profile, estimate)
  profile/         Profile management page
  page.tsx         Home — upload & estimation
components/        Reusable UI components
config/            NextAuth & database configuration
lib/               Constants, icons, validation schemas, PDF generation
prisma/            Schema & migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Generate Prisma client & production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## License

Private — all rights reserved.

---

<p align="center">Built with by the InsureVision Team</p>
