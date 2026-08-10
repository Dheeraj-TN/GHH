# Frame in Goa — Hacker House Goa 2026 🌴

Upload a photo → get an instant, on-brand **HH Goa 2026** graphic → download it or share to X.
No login, no signup, one pass start to finish. `#FrameInGoa`

## Two formats

- **PFP Frame** — a circular sunset frame that wraps the photo, ready to drop in as an X profile
  picture (branding sits inside the circle X actually displays).
- **Builder ID** — an event-badge card: photo + name + stack/role + an auto-generated *builder
  title* + a builder id, laid out to be posted as an image.

## How it hits the requirements

- **Fast / near-instant:** the graphic is composited **client-side on `<canvas>`** — no server
  round-trip to generate, no loading screen.
- **Real photos:** any format incl. **HEIC/HEIF** (decoded with `heic2any`), EXIF orientation baked
  in so iPhone portraits aren't sideways. Cover-fit + **drag to reposition** + **zoom** handle
  portrait, landscape and off-center crops without forcing the user to pre-crop.
- **On-brand:** custom Goa-sunset palette, curved wordmark, sun/palm/wave motifs — not a logo on a
  generic badge.
- **Downloadable:** exports a real **1080px PNG** file.
- **Share to X that actually previews:**
  - **Mobile** — uses the Web Share API to attach the **image directly** to the X app.
  - **Desktop** — POSTs the PNG to `/api/share`, opens a pre-filled tweet linking to `/s/[id]`,
    whose **OG / `summary_large_image`** tags point at the real graphic, so the link preview shows
    it (not a blank thumbnail).
- **Mobile-friendly:** responsive single-column layout, large tap targets, touch drag.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · HTML Canvas · `heic2any`.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
```

`npm run build && npm start` for production.

## Layout

```
src/
  app/
    page.tsx              # main tool (client): upload, canvas preview, download, share
    layout.tsx            # metadata
    s/[id]/page.tsx       # share page — OG/Twitter card that renders the generated graphic
    api/share/route.ts    # store a generated PNG, return an id
    api/img/[id]/route.ts # serve a stored PNG (the OG image)
  lib/
    render.ts             # canvas rendering for both formats (pure, no React)
    loadImage.ts          # File → drawable bitmap (HEIC + EXIF orientation)
    brand.ts              # brand tokens, builder-title / builder-id generators
    store.ts              # tiny filesystem blob store for shared graphics
```

## Notes

- The X link-preview card only renders once the site is on a **publicly reachable URL** (X's
  crawler has to fetch the OG image); the flow and tags are correct on localhost, but you'll see the
  live preview after deploying. On mobile the image attaches directly regardless.
- `store.ts` writes to a temp dir by default (`SHARE_DIR` to override). For a serverless deploy
  (Vercel), swap it for Vercel Blob / KV since serverless filesystems are ephemeral.
