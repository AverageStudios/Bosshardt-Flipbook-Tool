# Bosshardt Flipbook Tool

Turn PDF brochures, offering memorandums and market reports into page-turning online flipbooks with a shareable link.

**PDF → Upload → Flipbook → Shareable Link**

- `/dashboard`: your flipbooks (open, copy link, rename, delete)
- `/new`: upload a PDF (drag & drop, preview, title)
- `/f/[slug]`: the public viewer (no login needed)

Built with Next.js (App Router), TypeScript, Tailwind CSS, PDF.js, page-flip, Supabase and Lucide.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in `supabase/migrations/20260918000000_create_flipbooks.sql` and run it.
   It creates the `flipbooks` table (with RLS enabled) and the public `flipbooks` storage bucket (100 MB limit, PDF/JPEG only).
   Alternatively, with the Supabase CLI: `supabase link` then `supabase db push`.
3. **Upload size:** Supabase's *global* file-size limit is 50 MB on the Free plan. To accept PDFs up to 100 MB,
   raise it under **Storage → Settings** (Pro plan or higher).

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API (anon / publishable key) | Safe to expose; RLS blocks it from the table |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (service_role / secret key) | **Server only.** Never expose it |
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL, e.g. `https://flipbooks.bosshardtrealty.com` | Used for social previews |
| `DASHBOARD_PASSWORD` | Choose one (optional) | Protects `/dashboard`, `/new` and the API with a browser password prompt. Public `/f/…` links stay open |

### 3. Run

```bash
npm install      # also copies the PDF.js worker/fonts into public/pdfjs
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

### Local Supabase (optional)

With Docker running: `supabase start`. This project's CLI stack uses ports **545xx**
(API on `http://127.0.0.1:54521`) so it can run alongside other local Supabase projects.
`supabase status -o env` prints the keys for `.env.local`.

## How it works

- **Upload:** the browser opens the PDF with PDF.js to validate it, count pages and render the cover
  (preview + dashboard thumbnail). The server issues short-lived signed upload URLs, the browser uploads
  straight to Supabase Storage (`flipbooks/{id}/document.pdf` and `thumbnail.jpg`) with progress,
  then the server saves the record and generates a slug like `medical-office-brochure-a83jd2`.
- **Viewer:** PDF.js renders pages on demand (visible pages first, then neighbours) at the screen's
  pixel density, and caches them. [page-flip](https://github.com/Nodlik/StPageFlip) (the engine behind
  react-pageflip, used directly for React 19 compatibility) provides the page-curl animation.
  Two-page spreads with a single cover on desktop and landscape tablets; one page at a time on phones
  and portrait tablets.
- **Security:** all database access goes through the Next.js server using the service-role key. RLS is
  enabled with no public policies, so the public key can't read, list or change anything. PDFs are
  readable only via their unguessable URLs.

## Customising the brand

- **Name, logo:** `src/lib/config.ts`. Set `logoSrc` (e.g. `/bosshardt-logo.svg` in `public/`) and the
  header uses it automatically.
- **Colors:** the `@theme` tokens at the top of `src/app/globals.css` (`--color-brand`, `--color-viewer`, …).

## Project structure

```
src/
  app/
    dashboard/            My Flipbooks
    new/                  Create a Flipbook
    f/[slug]/             Public viewer (+ not-found, error)
    api/flipbooks/        prepare (signed upload URLs), create, rename, delete
  components/
    PdfUploader.tsx
    dashboard/            FlipbookGrid, FlipbookCard
    viewer/               FlipbookViewer, FlipbookBook (page-flip), FlipbookPage,
                          ViewerToolbar, ShareModal, hooks
    ui/                   Modal, button styles
  lib/
    pdf/                  PDF.js loading, page renderer + cache, file inspection
    flipbooks.ts          Server-side data access
    upload.ts             Client upload flow
  proxy.ts                Optional DASHBOARD_PASSWORD gate
supabase/migrations/      Schema, RLS, storage bucket
```
# Bosshardt-Flipbook-Tool
# Bosshardt-Flipbook-Tool
