# Bosshardt Flipbook Tool

Turn PDF brochures, offering memorandums and market reports into page-turning online flipbooks with a shareable link.

**PDF → Upload → Flipbook → Shareable Link**

- `/dashboard`: your flipbooks (open, copy link, rename, move to folder, delete), with a folder sidebar
- `/dashboard/recent`, `/dashboard/folder/[id]`: the Recent view and a single folder
- `/new`: upload a PDF (drag & drop, preview, title)
- `/f/[slug]`: the public viewer (no login needed)

Built with Next.js (App Router), TypeScript, Tailwind CSS, PDF.js, page-flip, Supabase and Lucide.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in `supabase/migrations/20260918000000_create_flipbooks.sql` and run it.
   It creates the `flipbooks` table (RLS on, no public access) and the **public** `flipbooks` storage bucket
   (50 MB limit, PDF/JPEG only). If you created these yourself, make sure the bucket is set to **Public**.
3. Then run `supabase/migrations/20260922000000_create_folders.sql`. It adds the `folders` table (same
   RLS model) and the nullable `flipbooks.folder_id` column used by the dashboard sidebar. Deleting a
   folder never deletes its flipbooks — the foreign key is `ON DELETE SET NULL`.
4. **Upload size:** the Free plan caps uploads at 50 MB. To allow larger PDFs, upgrade, raise the global limit
   under **Storage → Settings** and the bucket's limit, then change `MAX_PDF_MB` in `src/lib/config.ts`.

### 2. Environment variables

```bash
cp .env.example .env.local   # never commit .env.local (it's gitignored)
```

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API | Browser-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys (`sb_publishable_…`) | Browser-safe; RLS blocks it from the table |
| `SUPABASE_URL` | Same as the project URL | Used by server code |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys (`sb_secret_…`) | **Server only.** Only read in `src/lib/supabase/server.ts`, guarded by `server-only` |

On **Vercel**, add the same variables under Project → Settings → Environment Variables. Share links use
the domain the app is opened on, so they work on previews and production without any extra setting.

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
- **Security:** all database access goes through the Next.js server using the secret key. RLS is
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
    dashboard/(browse)/   Sidebar shell: All Flipbooks, Recent, folder/[id]
    dashboard/[slug]/     Preview + share page for a new flipbook
    new/                  Create a Flipbook (?folder=<id> files it on upload)
    f/[slug]/             Public viewer (+ not-found, error)
    api/flipbooks/        prepare (signed upload URLs), create, rename, move, delete
    api/folders/          list, create, rename, delete
  components/
    PdfUploader.tsx
    dashboard/            DashboardChrome, DashboardSidebar, FlipbookBrowser,
                          FlipbookCard, FlipbookRow
    viewer/               FlipbookViewer, FlipbookBook (page-flip), FlipbookPage,
                          ViewerToolbar, ShareModal, hooks
    ui/                   Modal, button styles
  lib/
    pdf/                  PDF.js loading, page renderer + cache, file inspection
    flipbooks.ts          Server-side data access
    folders.ts            Server-side folder access
    upload.ts             Client upload flow
supabase/migrations/      Schema, RLS, storage bucket
```
# Bosshardt-Flipbook-Tool
# Bosshardt-Flipbook-Tool
# Bosshardt-Flipbook-Tool
# Bosshardt-Flipbook-Tool
# Bosshardt-Flipbook-Tool
