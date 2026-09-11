# Circle 🫶

A local-first personal notebook for the people in your uni social orbit. Built for quick night logging, not business networking.

## Run it locally

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo ships with eight fake UNSW mates and fifteen made-up past hangs.

## Handy commands

```bash
npm run db:seed       # reset and repopulate the demo
npm run test:helpers  # derived relationship date helpers
npm run build         # production build check
```

Data lives in `prisma/dev.db`, using the `DATABASE_URL` from `.env`. Keep it private, it is intentionally a one-person app with no auth or cloud sync in v1.

## Later: Supabase

When you are ready for Postgres, switch the Prisma datasource provider to `postgresql`, point `DATABASE_URL` at Supabase, then run `npx prisma migrate dev`. The models deliberately use portable strings, relations, and `DateTime` values, so no model redesign should be required. Do not add a Supabase client or auth until that migration actually happens.
