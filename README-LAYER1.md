# Layer 1: auth + circles API (drops onto the starter kit)

Copy these into your project, keeping the folders:
  lib/server.ts
  app/api/[...path]/route.ts

Install (pin Prisma 6 so the starter schema works as written):
  npm install prisma@6 @prisma/client@6 bcryptjs jose
  npm install -D @types/bcryptjs
  npx prisma migrate dev --name init   # needs DATABASE_URL in .env
  npx prisma generate

Needs AUTH_SECRET in .env (any long random string).
Run with NEXT_PUBLIC_USE_MOCKS=false (or remove it) to hit these routes.
