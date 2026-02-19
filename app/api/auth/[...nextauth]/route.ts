// =====================================================
// ROUTE API NEXTAUTH (catch-all)
// =====================================================
// Fichier App Router pour NextAuth :
// - expose les handlers HTTP GET/POST nécessaires au protocole auth
// - délègue toute la logique à `@/config/auth`
//
// Pourquoi `[...nextauth]` ?
// - C'est un segment dynamique catch-all.
// - Il capture toutes les sous-routes attendues par NextAuth :
//   /api/auth/signin, /api/auth/callback, /api/auth/session, etc.

import { handlers } from "@/config/auth";

// Destructuration des handlers fournis par NextAuth.
// Next.js utilisera automatiquement :
// - `GET` pour lecture de session, pages auth, callbacks
// - `POST` pour actions auth (signin/signout selon provider)
export const { GET, POST } = handlers;
