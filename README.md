This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
