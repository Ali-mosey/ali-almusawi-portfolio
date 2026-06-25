# Ali Almusawi — Architecture Portfolio

An InDesign-linked portfolio website. You edit your layout in **InDesign**, run **one
step**, and the live site updates automatically.

- **Live site:** https://ali-almusawi-portfolio.vercel.app
- **Repo (private):** https://github.com/Ali-mosey/ali-almusawi-portfolio
- **Local folder:** `C:\Users\Ali\Desktop\Ali\Portfolio`

> **New chat? Start here.** Open Claude Code in this folder and say:
> *"Read README.md — that explains my portfolio. I want to [your task]."*
> Everything needed to continue the project is documented below.

---

## TL;DR — how to publish an update

1. Edit your portfolio in **Adobe InDesign**.
2. **File → Save As → InDesign Markup (.idml)**, overwriting
   `Indesign Folder\Portfolio_filled.idml`.
3. **Double-click the "Publish Portfolio" shortcut on the Desktop.**

That's it — it syncs the InDesign content, pushes to GitHub, and Vercel rebuilds the
live site in ~30–60s.

> The shortcut just runs this command in the project folder (cmd.exe, so no
> PowerShell script-policy issues):
> ```
> npm.cmd run sync -- "Indesign Folder/Portfolio_filled.idml"
> ```
> You can also run that yourself in a terminal opened at the project folder.

---

## How it fits together

```
  InDesign (.indd)
        │  File → Save As → .idml
        ▼
  Indesign Folder/Portfolio_filled.idml      ← source of truth (your content)
        │
        │  "Publish Portfolio" shortcut  =  npm run sync
        ▼  (scripts/sync-indesign.mjs)
  content/projects.json   +   public/images/*    ← generated; do NOT hand-edit
        │
        ▼
  Next.js site (homepage grid + /projects/[slug] pages)
        │  git commit + push
        ▼
  GitHub  ──▶  Vercel  ──▶  live website (auto-rebuild on every push)
```

The website never reads the `.idml` at runtime. The sync converts InDesign content
into web data **at publish time**, so the live site stays fast.

---

## What the sync does

`scripts/sync-indesign.mjs` (run via `npm run sync` or the Desktop shortcut):

1. Unzips the `.idml` (it's a ZIP of XML parts) in memory.
2. Reads each story's text and its **paragraph style**.
3. Walks the spreads in page order; reads text frames and image link paths.
4. Groups content into projects using paragraph styles (see below).
5. Writes `content/projects.json`, copies linked images into `public/images/`.
6. `git add` + `commit` + `push` (skips cleanly if nothing changed).

### The paragraph styles are the contract

Content is identified by these InDesign **paragraph style names** — apply them to your
text in InDesign and it flows through automatically:

| InDesign paragraph style | Becomes |
|--------------------------|---------|
| `Project Title`          | Project title (also the page URL/slug) |
| `Project Subtitle`       | Subtitle (e.g. location / year) |
| `Body Text`              | Description |
| `Caption`                | Image captions (matched to images in order) |

- The **first spread** is the cover; the **last spread** is contact.
- Within a project, the **first placed image is the hero**, the rest form the gallery.
- A project with **no placed images is skipped** as an unfilled placeholder.

### Adding a new project (e.g. filling in B / C / D)

Editing InDesign does **not** auto-update the site — you publish with the shortcut.
For a new project to appear, on its spread you must:

1. **Place at least one image** (without an image the project is skipped).
2. Apply the styles: `Project Title`, `Project Subtitle`, `Body Text`, `Caption`.
3. Replace placeholder text and give it a real title (the title becomes the URL).

Then Save As `.idml` and run the shortcut. The homepage tile, the `/projects/<slug>`
page, and the "Next project" link are all created/linked automatically — no code
changes. (The "Next project" link is hidden with only 1 project and appears at 2+.)

---

## Project structure

```
content/projects.json          # generated content (cover, projects, contact)
public/images/                 # generated image copies served by the site
app/
  layout.tsx                   # header (title/subtitle) + footer (contact)
  page.tsx                     # homepage project grid
  projects/[slug]/page.tsx     # dynamic project page (hero, gallery, next link)
  globals.css                  # clean minimal styling
lib/projects.ts                # reads + normalizes content/projects.json
scripts/sync-indesign.mjs      # InDesign IDML → content/projects.json + images
Publish Portfolio.cmd          # what the Desktop shortcut runs
Indesign Folder/
  Portfolio_filled.idml        # ← the file you edit/export from InDesign
```

`content/projects.json` schema:

```jsonc
{
  "cover":   { "title": "Portfolio", "subtitle": "Bachelor of Design in Architecture\nUTS · Ali Almusawi" },
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

> Do **not** hand-edit `content/projects.json` — the next sync overwrites it.
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

- **"running scripts is disabled on this system"** (PowerShell): use the Desktop
  shortcut (runs in cmd.exe), or run once
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use `npm.cmd` instead of `npm`.
- **Quote the IDML path** — `Indesign Folder` has a space, so it must be `"quoted"`.
- **Don't run `npm run build` while `npm run dev` is running.** They share the
  `.next` folder and it corrupts the dev server. If the dev page shows a webpack
  runtime error: stop dev, delete the `.next` folder, run `npm run dev` again.
- **An image didn't copy?** Keep InDesign-linked images inside the project folder
  (e.g. `Projects/`) so the sync can find them by filename.
- **Opening a `.idml` in InDesign** creates an untitled doc; InDesign may also write
  a working `.indd`. That's fine — just always **Save As `.idml`** back over
  `Portfolio_filled.idml` as the last step, because the sync only reads the `.idml`.

---

## Status (as of 2026-06-24)

| Piece | Status |
|---|---|
| Next.js site | ✅ Built & working |
| InDesign → JSON sync (`npm run sync`) | ✅ Working |
| Desktop "Publish Portfolio" shortcut | ✅ Created |
| Git + private GitHub repo | ✅ Pushed |
| Vercel auto-deploy | ✅ Live |
| Projects | **A, B, C live** (A Place to Pause · Intimate Classrooms · Maybe Spaces). Project D still an empty placeholder (needs images + text). |

## Possible next steps

- Fill in Projects B, C, D (add images + text in InDesign, publish).
- Phase 4 polish: lightbox gallery, hover transitions, year/type filtering.
- Custom domain (e.g. `alialmusawi.com`) via the Vercel dashboard.

See `portfolio-website-roadmap.md` for the original full plan.

---

## Stack

Next.js (App Router, TypeScript) · plain CSS · Node sync script (`adm-zip`) ·
GitHub · Vercel. Built with Claude Code.
