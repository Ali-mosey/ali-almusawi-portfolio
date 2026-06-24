# Interactive Portfolio Website — Linked to a Live InDesign File

**Goal:** An interactive architecture portfolio website where you edit your InDesign file, run one export command, and the live site updates automatically. Images on the site link through to other pages.

**Stack:** InDesign (source of truth) → IDML export pipeline → Next.js project → GitHub → Vercel (hosting + auto-deploy). Built and maintained with Claude Code.

---

## The key reality (read this first)

InDesign has no cloud API that "pushes" content to a website. A true real-time link doesn't exist. What works reliably is a **one-command export pipeline**:

1. You edit your InDesign layout as normal.
2. You save it as **IDML** (`File → Save As → InDesign Markup .idml`). IDML is the open, XML-based version of an InDesign file — text and image references can be read out of it without opening InDesign.
3. A script reads the IDML, pulls out each project's title, description, captions, and image references, and writes them into your website as structured data (`projects.json`) plus the image files.
4. You commit and push to GitHub.
5. Vercel detects the push and rebuilds the live site in ~30 seconds.

After setup, your whole update loop is: **edit → export IDML → run `npm run sync` → done.** That single command handles parsing, copying images, committing, and pushing.

> Note: InDesign stores images as *links*, not embedded pixels (unless embedded). The sync script copies the linked image files into the website. Keep your InDesign image links organised in one folder so the script can find them.

---

## Architecture at a glance

```
  InDesign (.indd)
        │  Save As → .idml
        ▼
  portfolio.idml  ──────────┐
        │                   │ linked images (jpg/png)
        ▼                   ▼
  sync script (Node/Python) reads IDML XML
        │  writes
        ▼
  /content/projects.json   +   /public/images/*
        │
        ▼
  Next.js site (project pages, galleries, image links)
        │  git push
        ▼
  GitHub  ──▶  Vercel  ──▶  live website (auto-rebuild)
```

The website never reads the `.idml` at runtime. The script converts InDesign content into web data *at build time*. This keeps the live site fast and the editing experience familiar.

---

## Phase 1 — Set up the website project (with Claude Code)

Open Claude Code in an empty folder and ask it to scaffold the project. A good first prompt:

> "Create a Next.js (App Router, TypeScript) site for an architecture portfolio. It reads project data from `/content/projects.json`. Build a homepage grid of project thumbnails, and a dynamic project page at `/projects/[slug]`. Each project has: title, subtitle, description, hero image, gallery images, captions. Make the homepage thumbnails and any 'next project' images clickable links. Style it clean and minimal."

What you'll get:

- A **homepage** showing every project as a clickable image tile.
- **Project pages** (`/projects/your-project-name`) with hero image, description, and a gallery.
- **Image-as-link** behaviour: clicking a project thumbnail opens that project; you can also add "next/previous project" image links between pages.

Recommended choices:
- **Next.js** + **Tailwind CSS** — fast, great image handling, first-class Vercel support.
- Keep content in `/content/projects.json` so the InDesign sync just rewrites that one file plus the images folder.

---

## Phase 2 — Build the InDesign → website sync

This is the bridge. There are two ways to read your InDesign content; pick based on how much you want to change your workflow.

**Option A — IDML parsing (recommended, no InDesign automation needed).**
You manually `Save As .idml` when you want to publish. A script unzips the IDML (it's a zip of XML files), reads the text stories and image links, and writes `projects.json` + copies images. This is exactly the approach the InDesign portfolio tooling available in this app already uses, so the parsing logic is proven. Ask Claude Code:

> "Write a Node script `scripts/sync-indesign.mjs` that takes a path to a `.idml` file. Unzip it, parse the Story XML to extract each project's title, subtitle, body text and captions, and read the image link paths from the Spread/Rectangle elements. Map them to my `projects.json` schema, copy the linked images into `/public/images`, then git add/commit/push. Wire it to `npm run sync -- <path-to-idml>`."

**Option B — InDesign script export (more automatic, more setup).**
A small ExtendScript/UXP script *inside* InDesign exports your content to JSON + images on a menu click or keyboard shortcut. Removes the manual "Save As IDML" step but requires installing a script into InDesign. Add this later if the manual export feels slow.

For "one-command sync," **Option A** is the right starting point. Your publish step becomes:

```
npm run sync -- "C:\path\to\portfolio.idml"
```

…which parses, copies images, commits, and pushes in one go.

---

## Phase 3 — Deploy to Vercel (auto-rebuild on every push)

1. Create a free **GitHub** account and a **Vercel** account (sign in to Vercel with GitHub).
2. Push your project folder to a new GitHub repository (Claude Code can run the git commands).
3. In Vercel: **Add New → Project → import your GitHub repo.** Accept the detected Next.js settings and deploy.
4. Vercel gives you a live URL (e.g. `your-portfolio.vercel.app`). You can add a custom domain later.
5. From now on, **every `git push` triggers an automatic rebuild** — which is exactly what `npm run sync` does at the end. So editing InDesign and running the sync command publishes your site.

---

## Phase 4 — Make it interactive

Once the basic site is live, layer in the interactive pieces. Prompt Claude Code for things like:

- **Image-linked navigation:** clicking the hero image jumps to the full gallery; clicking a thumbnail on the homepage opens that project.
- **Hover states & transitions:** subtle zoom or caption reveal on project tiles; smooth page transitions (Framer Motion).
- **Lightbox gallery:** click any project image to open it full-screen with next/previous.
- **Filtering:** filter projects by type/year (works directly off `projects.json`).
- **"Next project" links:** an image at the bottom of each project page that links to the next one.

---

## Your day-to-day workflow once it's all set up

1. Edit your portfolio in InDesign.
2. `File → Save As → InDesign Markup (.idml)`.
3. Run `npm run sync -- "...portfolio.idml"`.
4. Wait ~30 seconds — the live site is updated.

---

## Suggested order of operations

| Step | What | Tool |
|---|---|---|
| 1 | Scaffold Next.js portfolio site reading `projects.json` | Claude Code |
| 2 | Define the `projects.json` schema (title, images, captions, slug) | Claude Code |
| 3 | Build homepage grid + dynamic project pages with image links | Claude Code |
| 4 | Write the IDML → `projects.json` + images sync script | Claude Code |
| 5 | Push to GitHub, import to Vercel, get live URL | Vercel + Claude Code |
| 6 | Add interactivity (lightbox, transitions, filters) | Claude Code |
| 7 | (Optional) custom domain + InDesign-side export script | Vercel / InDesign |

---

## Things to decide / watch for

- **Image organisation:** keep all InDesign-linked images in one folder so the sync script finds them reliably. Embedded images are harder to extract than linked ones.
- **Naming = URLs:** the project title becomes the page URL (slug). Keep titles clean.
- **Source of truth:** InDesign stays the master. Don't hand-edit `projects.json` — your next sync will overwrite it.
- **First parse may need tuning:** every InDesign template lays out its text stories differently, so the first run of the sync script usually needs a little adjustment to map the right text frames to the right fields. Budget time for that one-off step.
```
