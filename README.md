# Ali Almusawi — Architecture Portfolio

An InDesign-linked portfolio website. You edit your layout in **InDesign**, run **one
command**, and the live site updates automatically.

- **Live site:** https://ali-almusawi-portfolio.vercel.app
- **Repo (private):** https://github.com/Ali-mosey/ali-almusawi-portfolio
- **Local folder:** `C:\Users\Ali\Desktop\Ali\Portfolio`

---

## TL;DR — the daily workflow

1. Edit your portfolio in **Adobe InDesign**.
2. **File → Save As → InDesign Markup (.idml)**, overwriting
   `Indesign Folder\Portfolio_filled.idml`.
3. Open **PowerShell** in the project folder and run:

   ```powershell
   npm run sync -- "Indesign Folder/Portfolio_filled.idml"
   ```

That one command parses the IDML, copies images, updates the website content,
commits to git, pushes to GitHub, and Vercel rebuilds the live site in ~30–60s.

> First time on a new PC only: if PowerShell says *"running scripts is disabled"*,
> run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (answer `Y`).

---

## How it fits together

```
  InDesign (.indd)
        │  File → Save As → .idml
        ▼
  Indesign Folder/Portfolio_filled.idml      ← source of truth (your content)
        │
        │  npm run sync -- "<path-to-idml>"
        ▼  (scripts/sync-indesign.mjs)
  content/projects.json   +   public/images/*    ← generated; do NOT hand-edit
        │
        ▼
  Next.js site (homepage grid + /projects/[slug] pages)
        │  git commit + push
        ▼
  GitHub  ──▶  Vercel  ──▶  live website (auto-rebuild on every push)
```

The website never reads the `.idml` at runtime. The sync script converts InDesign
content into web data **at sync time**, so the live site stays fast.

---

## What the sync script does

`scripts/sync-indesign.mjs` (run via `npm run sync`):

1. Unzips the `.idml` (it's a ZIP of XML parts) in memory.
2. Reads every story's text and its **paragraph style**.
3. Walks the spreads in page order; reads text frames and image link paths.
4. Groups content into projects using paragraph styles (see below).
5. Writes `content/projects.json`, copies linked images into `public/images/`.
6. `git add` + `commit` + `push` (skips gracefully if there's nothing to commit).

### The paragraph styles are the contract

The script identifies content by these InDesign **paragraph style names** — apply
them to your text in InDesign and the content flows through automatically:

| InDesign paragraph style | Becomes |
|--------------------------|---------|
| `Project Title`          | Project title (also the page URL/slug) |
| `Project Subtitle`       | Subtitle (e.g. location / year) |
| `Body Text`              | Description |
| `Caption`                | Image captions (matched to images in order) |

- The **first spread** is treated as the cover; the **last spread** as contact.
- Within a project, the **first placed image is the hero**, the rest form the gallery.
- A project with **no placed images is skipped** as an unfilled template
  placeholder. (This is why Projects B/C/D don't show yet — they're empty.)

### Adding a new project

In InDesign, on a project's spread: give the title the `Project Title` style, the
subtitle `Project Subtitle`, the body `Body Text`, captions `Caption`, and **place
at least one image**. Save as `.idml`, run `npm run sync`. The new project page and
homepage tile appear automatically.

---

## Project structure

```
content/projects.json          # generated content (cover, projects, contact)
public/images/                 # generated image copies served by the site
app/
  layout.tsx                   # header (title/subtitle) + footer (contact)
  page.tsx                     # homepage project grid
  projects/[slug]/page.tsx     # dynamic project page
  globals.css                  # clean minimal styling
lib/projects.ts                # reads + normalizes content/projects.json
scripts/sync-indesign.mjs      # InDesign IDML → content/projects.json + images
Indesign Folder/
  Portfolio_filled.idml        # ← the file you edit/export from InDesign
```

`content/projects.json` schema:

```jsonc
{
  "cover":   { "title": "Portfolio", "subtitle": "Bachelor of Architecture\nUTS · Ali Almusawi" },
  "projects": {
    "A": {
      "title": "A Place to Pause",
      "subtitle": "Waterloo Sydney 2025",
      "description": "…",
      "captions": ["…", "…"],
      "hero_image": "hero.png",
      "images": ["gallery1.png", "gallery2.png"]
    }
  },
  "contact": "ali-mosey@hotmail.com\n0469798091"
}
```

> Do **not** hand-edit `content/projects.json` — the next `npm run sync` overwrites it.
> InDesign is the source of truth.

---

## Commands

```powershell
npm run dev        # local dev server at http://localhost:3000 (hot reload)
npm run build      # production build (for testing the build only)
npm run start      # serve the production build locally
npm run sync -- "Indesign Folder/Portfolio_filled.idml"   # InDesign → live site
```

Sync options:

```powershell
npm run sync -- "<idml>" --no-push     # commit locally but don't push
npm run sync -- "<idml>" --no-git      # update files only, no git at all
npm run sync -- "<idml>" -m "message"  # custom commit message
```

---

## Gotchas / troubleshooting

- **"running scripts is disabled on this system"** (PowerShell): run once
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use `npm.cmd` instead of `npm`.
- **Quote the IDML path** — `Indesign Folder` contains a space, so it must be in
  `"quotes"`.
- **Don't run `npm run build` while `npm run dev` is running.** They share the
  `.next` folder and it corrupts the dev server. If the dev page shows a webpack
  runtime error: stop dev, delete the `.next` folder, run `npm run dev` again.
- **"Not a git repository"** would mean git isn't set up — it is, in this folder.
- **An image didn't copy?** Keep InDesign-linked images inside the project folder
  (e.g. `Projects/`) so the sync can find them by filename.

---

## Roadmap / possible next steps

- Fill in Projects B, C, D (add images + text in InDesign, re-export, sync).
- Phase 4 polish: lightbox gallery, "next project" link (auto-appears with 2+
  projects), hover transitions, year/type filtering.
- Custom domain (e.g. `alialmusawi.com`) via the Vercel dashboard.

See `portfolio-website-roadmap.md` for the original full plan.

---

## Stack

Next.js (App Router, TypeScript) · plain CSS · Node sync script (`adm-zip`) ·
GitHub · Vercel. Built with Claude Code.
```
