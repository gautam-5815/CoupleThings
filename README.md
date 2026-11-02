# Couple Things

Write your partner a private five-page letter — photographs, music, your own
words and one last question — and send it as a single secret link. Free, with
no account for either of you.

## Running it

```bash
npm install
npm run dev
```

It runs with no configuration at all. Without a database it keeps letters in
the sender's own browser, which means a link only opens on the device that
wrote it. The interface says so rather than pretending otherwise.

## Making links work anywhere (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql), and run it.
   That creates the `letters` table and the private `letter-media` bucket.
3. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Where it comes from |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → `service_role` |
   | `NEXT_PUBLIC_SITE_URL` | your public origin |

4. Restart `npm run dev`. The app switches over on its own.

Deploying to Vercel's free tier: push the repo, import it, and add the same
three variables in the project settings.

## How the privacy actually works

The letters are private because of how the pieces fit together, not because of
one setting:

- **Row Level Security is on, with no policies, and the default grants are
  revoked.** The `anon` and `authenticated` keys can read and write nothing.
  Every request goes through this app's own route handlers.
- **The `service_role` key is server-only.** `src/lib/supabase.ts` imports
  `server-only`, so the build fails if a client component ever reaches for it.
  The production build was checked: the key appears in no client bundle.
- **The id is the credential.** A letter has a 22-character random id, which is
  what makes a link shareable without an account. Anyone holding the link can
  read it, so it is meant for one person.
- **Editing needs an owner token.** The sender gets a 32-character token once,
  at creation, kept in their browser. Only its SHA-256 hash is stored, compared
  in constant time, so a leaked database still does not let anyone change a
  letter.
- **Media is in a private bucket.** Photographs and music are never public.
  They are handed out as signed URLs that expire after an hour.
- **Uploads are checked.** Type, size (8 MB) and the file's first bytes are all
  verified, and the uploader must prove they own the letter before anything is
  written into its folder.
- **Nothing is indexed.** Every letter route sends `noindex`, letters are
  excluded from the sitemap, `robots.txt` disallows the paths, the API sends
  `X-Robots-Tag: noindex`, and the social preview says only "someone wrote you
  something private".
- **Rate limiting** sits on creation, writes and uploads. It is in memory, so it
  resets on redeploy and does not span instances: a speed bump, not a wall.
- **Letters expire** after a year unless touched, and the sender can unpublish
  or delete at any time. Deleting removes the files too.

## The design

The look was built with the `design-taste-frontend` skill. The art direction is
**"The page is the object"** (seed `1485421638`): the artefact in this subject's
world is a sealed letter addressed to one person, so the landing page is built
as that object. The dealt "Forest and lime" palette was replaced — the skill's
own rule for a subject with unmistakable colours — keeping its proportions and
taking the colours from letter paper, ink and sealing wax.

Both gates pass on the finished landing page: `lint.mjs` 0 FAIL and
`inspect.mjs` 0 FAIL at 1440, 768 and 390. Two warnings are knowingly accepted:
the cream ground (the brief fixes that palette) and the absence of video.

### Pictures

The eight images are genuine public-domain works from the Art Institute of
Chicago — Victorian lace valentines, an eighteenth-century love-letter engraving
and a woodblock print. All are CC0, all are credited in the footer, and none is
presented as a picture of this service or anyone who uses it. Full records are
in [`assets/credits.json`](assets/credits.json).

## Layout

```
src/app/            routes: landing, /create, /l/[id], robots, sitemap, api/
src/components/     the letter reader, creation flow, music player, final question
src/lib/
  letters.ts        the one place the app asks for a letter (remote or local)
  experience.ts     the letter's shape, and the browser-only fallback store
  supabase.ts       server-only client, token hashing, rate limiting
  validate.ts       every field arriving from a browser is checked here
supabase/schema.sql run this once in your project
```

## Still to do

- The footer's marketing pages (`/how-it-works`, `/apology-website`,
  `/anniversary-website`, `/love-letter`) and `/privacy`, `/terms` are linked
  but not built yet. The SEO plumbing around them is in place.
- No AI writing help. Occasion openers are templates; everything else is typed.
- Sample content to replace before launch: the preview letter in
  `ExperiencePreview.tsx` and the placeholder domain in `src/lib/site.ts`.

## A note on this folder

The project sits inside OneDrive, which syncs `node_modules` and has already
corrupted the Next.js native binary once. If `next dev` fails with "not a valid
Win32 application", delete `node_modules/@next` and run `npm install`. Moving
the project outside OneDrive avoids it entirely.
