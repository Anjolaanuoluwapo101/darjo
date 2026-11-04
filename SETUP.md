# Setup (Anjola, do this once)

1. Create the Next.js app in a fresh folder:
   npx create-next-app@latest darjo --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
2. Copy everything from this starter folder INTO the darjo folder (merge, keep folders).
3. In darjo, open tsconfig.json and make sure "resolveJsonModule": true is set (create-next-app usually sets it).
4. Install what we need:
   npm install prisma @prisma/client bcryptjs jose
   npm install -D @types/bcryptjs
5. Copy .env.example to .env and fill DATABASE_URL (Neon or Supabase Postgres) and AUTH_SECRET (any long random string).
6. npx prisma migrate dev --name init
7. git init, commit, create a PUBLIC GitHub repo, push, invite B and C.
8. In .env.local put NEXT_PUBLIC_USE_MOCKS=true while building screens.
