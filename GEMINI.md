# Project Overview

PressKit Pro is a hosted platform that lets electronic-music DJs spin up a polished, single-page press kit website at `presskit.pro/{slug}` in minutes. It acts as both an artist's online business card and a bookable EPK that promoters/venues can use.

**Key Technologies:**

- **Framework:** Next.js 15 (App Router)
- **CMS:** Payload CMS 3 (integrated via `@payloadcms/next` and Postgres adapter)
- **Database & Auth & Storage:** Supabase (Postgres)
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Client State:** TanStack Query
- **Testing:** Vitest (Unit) and Playwright (E2E)
- **Language:** TypeScript

**Architecture Highlights:**

- **Next.js App Router** is used with Server Components (RSC) for public profile pages for fast loading and SEO, while the dashboard editor uses client components.
- **Payload CMS** manages the content modeling (Profiles, Themes, Media metadata).
- **Supabase** handles identity (auth authority), schema isolation (Postgres), and media storage (bucket for avatars and gallery).
- An auth-sync webhook bridges Supabase Auth user creation with Payload users.

---

## Building and Running

Ensure you have **Node 20.9+** (or **22+**), **pnpm 9+**, and the **Supabase CLI** installed. Dev requires a hosted Supabase project and a `cloudflared` tunnel for webhooks. See `docs/runbooks/dev-hosted-supabase.md` for one-time setup details.

**Common Commands (using `pnpm`):**

- `pnpm install` - Install dependencies.
- `pnpm dev` - Start Next.js development server and Payload admin (on `:3000`).
- `pnpm build` - Build the application for production.
- `pnpm start` - Start the compiled production server.
- `pnpm lint` - Run ESLint.
- `pnpm typecheck` - Run TypeScript compiler check without emitting files.
- `pnpm format` - Run Prettier to format codebase.
- `pnpm test` - Run Vitest unit tests.
- `pnpm test:e2e` - Run Playwright End-to-End tests.
- `supabase db push` - Push local migrations to the hosted database.
- `pnpm payload migrate` - Run Payload schema migrations.

---

## Development Conventions

- **Code Style & Linting:**
  - Strictly typed via TypeScript. Run `pnpm typecheck`.
  - Formatting enforced by Prettier (`pnpm format`).
  - Linting enforced by ESLint with Next.js and accessibility rules (`pnpm lint`).
- **Testing:**
  - The project expects robust E2E coverage for happy paths (`playwright`).
  - Axe-core is integrated into Playwright for automated accessibility checks.
  - Business logic should have unit tests (`vitest`).
- **Database Migrations:**
  - Dual migration flow: Supabase migrations handle Auth/Storage/Triggers (`supabase/migrations/`), while Payload manages the CMS tables (`pnpm payload migrate`). See `docs/runbooks/migrations.md` for order of operations.
- **Accessibility (a11y) & i18n:**
  - Strict WCAG 2.2 AA compliance is a goal. Semantic HTML and proper ARIA roles are expected.
  - Built-in multi-language support is prioritized using `next-intl`. Default setup is PT/EN.
- **Performance:**
  - The project aims for a Lighthouse score of ≥95. Pay attention to LCP, CLS, and page weight. Images should use `next/image` and lazy loading for below-the-fold content.
