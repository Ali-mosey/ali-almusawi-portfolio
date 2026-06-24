#!/usr/bin/env node
/**
 * sync-indesign.mjs — InDesign (.idml) -> content/projects.json + /public/images
 *
 * Usage:
 *   npm run sync -- "C:\\path\\to\\portfolio.idml" [options]
 *
 * Options:
 *   --no-git        Parse + copy images + write JSON, but skip git add/commit/push.
 *   --no-push       Commit locally but do not push.
 *   --message "..." Custom git commit message.
 *
 * What it does:
 *   1. Reads the .idml (a ZIP of XML parts) in memory.
 *   2. Parses every Stories/Story_*.xml: text + applied paragraph style.
 *   3. Walks Spreads in document order (per designmap.xml), reading the text
 *      frames (by ParentStory) and image link paths (LinkResourceURI) in each.
 *   4. Groups stories into projects: a "Project Title"-styled story starts a
 *      project; the following Subtitle / Body Text / Caption stories on the same
 *      spread belong to it. The first spread is the cover, the last is contact.
 *   5. Maps to the projects.json schema, copies linked images into public/images,
 *      writes content/projects.json, then git add/commit/push.
 *
 * The mapping keys off InDesign *paragraph styles*, not story IDs, so it keeps
 * working if the template is re-saved (IDs change, styles don't). A project with
 * no linked images is treated as an unfilled template placeholder and skipped.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import AdmZip from "adm-zip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(REPO_ROOT, "content", "projects.json");
const IMAGES_DIR = path.join(REPO_ROOT, "public", "images");

// Paragraph style names the template uses, matched on the trailing segment of
// e.g. "ParagraphStyle/Project Title". Adjust here if your styles are renamed.
const STYLE = {
  title: "Project Title",
  subtitle: "Project Subtitle",
  body: "Body Text",
  caption: "Caption",
};

// --------------------------------------------------------------------------
// CLI args
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { git: true, push: true, message: null, idml: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-git") opts.git = false;
    else if (a === "--no-push") opts.push = false;
    else if (a === "--message" || a === "-m") opts.message = argv[++i];
    else if (a.startsWith("-")) fail(`Unknown option: ${a}`);
    else if (!opts.idml) opts.idml = a;
  }
  return opts;
}

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

// --------------------------------------------------------------------------
// XML / story text helpers
// --------------------------------------------------------------------------

function unescapeXml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&"); // ampersand last
}

/** Plain text of a story: <Content> joined, <Br/> -> newline. */
function storyText(xml) {
  const parts = [];
  const re = /<Content>([\s\S]*?)<\/Content>|<Br\s*\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[0].startsWith("<Br")) parts.push("\n");
    else parts.push(unescapeXml(m[1]));
  }
  return parts.join("").replace(/[ \t]+\n/g, "\n").trim();
}

/** Trailing segment of the first AppliedParagraphStyle, e.g. "Project Title". */
function storyStyle(xml) {
  const m = xml.match(/AppliedParagraphStyle="([^"]*)"/);
  if (!m) return "";
  return m[1].split("/").pop();
}

/** Resolve an InDesign LinkResourceURI ("file:/C:/...%20...") to a local path. */
function uriToLocalPath(uri) {
  let p = uri.replace(/^file:\/\/localhost/i, "").replace(/^file:\/\//, "/").replace(/^file:/, "");
  // After stripping, Windows paths look like "/C:/..." — drop the leading slash.
  p = decodeURIComponent(p);
  if (/^\/[A-Za-z]:/.test(p)) p = p.slice(1);
  return p.replace(/\//g, path.sep);
}

// --------------------------------------------------------------------------
// IDML parsing
// --------------------------------------------------------------------------

function readIdml(idmlPath) {
  const zip = new AdmZip(idmlPath);
  const stories = new Map(); // storyId -> { style, text }
  const spreads = new Map(); // entryName -> xml
  let designmap = "";

  for (const entry of zip.getEntries()) {
    const name = entry.entryName;
    if (name.startsWith("Stories/Story_") && name.endsWith(".xml")) {
      const xml = entry.getData().toString("utf8");
      const id = name.match(/Story_(u[0-9a-f]+)\.xml$/)?.[1] ?? name;
      stories.set(id, { style: storyStyle(xml), text: storyText(xml) });
    } else if (name.startsWith("Spreads/Spread_") && name.endsWith(".xml")) {
      spreads.set(path.basename(name), entry.getData().toString("utf8"));
    } else if (name === "designmap.xml") {
      designmap = entry.getData().toString("utf8");
    }
  }
  return { stories, spreads, designmap };
}

/** Spread filenames in document order, per designmap.xml (falls back to sorted). */
function spreadOrder(designmap, spreads) {
  const ordered = [];
  const re = /src="Spreads\/(Spread_u[0-9a-f]+\.xml)"/g;
  let m;
  while ((m = re.exec(designmap)) !== null) {
    if (spreads.has(m[1])) ordered.push(m[1]);
  }
  for (const name of spreads.keys()) if (!ordered.includes(name)) ordered.push(name);
  return ordered;
}

/** For one spread: ordered unique ParentStory ids + ordered image basenames. */
function readSpread(xml) {
  const storyIds = [];
  let m;
  const sre = /ParentStory="(u[0-9a-f]+)"/g;
  while ((m = sre.exec(xml)) !== null) {
    if (!storyIds.includes(m[1])) storyIds.push(m[1]);
  }
  const images = [];
  const ire = /LinkResourceURI="([^"]+)"/g;
  while ((m = ire.exec(xml)) !== null) {
    images.push(path.basename(uriToLocalPath(m[1])));
  }
  return { storyIds, images, raw: xml };
}

// --------------------------------------------------------------------------
// Build the projects.json content object
// --------------------------------------------------------------------------

function buildContent({ stories, spreads, designmap }, existing) {
  const order = spreadOrder(designmap, spreads);
  const parsed = order.map((name) => ({ name, ...readSpread(spreads.get(name)) }));

  const styledStories = (sp, style) =>
    sp.storyIds.map((id) => stories.get(id)).filter((s) => s && s.style === style);

  const hasTitle = (sp) => styledStories(sp, STYLE.title).length > 0;

  // Cover = first spread if it isn't itself a project page.
  let cover = { title: "", subtitle: "" };
  if (parsed.length && !hasTitle(parsed[0])) {
    const texts = parsed[0].storyIds.map((id) => stories.get(id)?.text).filter(Boolean);
    cover = { title: texts[0] ?? "", subtitle: texts.slice(1).join("\n") };
  }

  // Contact = last spread if it isn't a project page.
  let contact = "";
  if (parsed.length > 1) {
    const last = parsed[parsed.length - 1];
    if (!hasTitle(last)) {
      contact = last.storyIds.map((id) => stories.get(id)?.text).filter(Boolean).join("\n");
    }
  }

  // Projects: each project-title spread is a project; image-bearing spreads with
  // no title are appended to the open project (multi-spread projects).
  const projects = [];
  let current = null;
  for (const sp of parsed) {
    if (hasTitle(sp)) {
      current = {
        title: styledStories(sp, STYLE.title)[0].text,
        subtitle: styledStories(sp, STYLE.subtitle)[0]?.text ?? "",
        description: styledStories(sp, STYLE.body).map((s) => s.text).join("\n\n"),
        captions: styledStories(sp, STYLE.caption).map((s) => s.text),
        images: [...sp.images],
      };
      projects.push(current);
    } else if (current && sp.images.length) {
      current.images.push(...sp.images);
      current.captions.push(...styledStories(sp, STYLE.caption).map((s) => s.text));
    }
  }

  // Skip unfilled placeholders (a real portfolio project has at least one image).
  const filled = [];
  const skipped = [];
  for (const p of projects) (p.images.length ? filled : skipped).push(p);

  // Emit in the existing object-keyed schema: { A: {...}, B: {...} }.
  const projectsObj = {};
  filled.forEach((p, i) => {
    const key = String.fromCharCode(65 + i); // A, B, C...
    const [hero, ...gallery] = p.images;
    projectsObj[key] = {
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      captions: p.captions,
      hero_image: hero,
      images: gallery,
    };
  });

  // Fall back to the existing file for cover/contact the IDML didn't yield.
  if (!cover.title && existing?.cover?.title) cover = existing.cover;
  if (!contact && existing?.contact) contact = existing.contact;

  return { content: { cover, projects: projectsObj, contact }, filled, skipped };
}

// --------------------------------------------------------------------------
// Image copying
// --------------------------------------------------------------------------

/** Find an image's source file: try its IDML link path, then search the repo. */
function locateImage(basename, idmlPath, linkPaths) {
  const link = linkPaths.get(basename);
  if (link && fs.existsSync(link)) return link;

  const searchRoots = [path.dirname(idmlPath), path.join(REPO_ROOT, "Projects"), REPO_ROOT];
  for (const root of searchRoots) {
    const hit = findFile(root, basename, 4);
    if (hit) return hit;
  }
  return null;
}

function findFile(dir, basename, depth) {
  if (depth < 0 || !fs.existsSync(dir)) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
    const full = path.join(dir, e.name);
    if (e.isFile() && e.name === basename) return full;
  }
  for (const e of entries) {
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".next" && e.name !== ".git") {
      const hit = findFile(path.join(dir, e.name), basename, depth - 1);
      if (hit) return hit;
    }
  }
  return null;
}

function copyImages(content, idmlPath, linkPaths) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const wanted = new Set();
  for (const p of Object.values(content.projects)) {
    if (p.hero_image) wanted.add(p.hero_image);
    for (const img of p.images) wanted.add(img);
  }
  const copied = [];
  const missing = [];
  for (const name of wanted) {
    const src = locateImage(name, idmlPath, linkPaths);
    if (!src) {
      missing.push(name);
      continue;
    }
    fs.copyFileSync(src, path.join(IMAGES_DIR, name));
    copied.push(name);
  }
  return { copied, missing };
}

/** Collect every LinkResourceURI -> local path from all spreads (for lookup). */
function collectLinkPaths(spreads) {
  const map = new Map();
  for (const xml of spreads.values()) {
    const re = /LinkResourceURI="([^"]+)"/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const local = uriToLocalPath(m[1]);
      map.set(path.basename(local), local);
    }
  }
  return map;
}

// --------------------------------------------------------------------------
// git
// --------------------------------------------------------------------------

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, stdio: "pipe" }).toString().trim();
}

function gitSync(opts, summary) {
  let isRepo = false;
  try {
    isRepo = git(["rev-parse", "--is-inside-work-tree"]) === "true";
  } catch {
    isRepo = false;
  }
  if (!isRepo) {
    console.log("\nℹ  Not a git repository — skipped commit/push.");
    console.log("   Run `git init`, add a remote, then re-run to enable auto-publish.");
    return;
  }

  git(["add", "content/projects.json", "public/images"]);
  const status = git(["status", "--porcelain"]);
  if (!status) {
    console.log("\nℹ  No content changes to commit.");
    return;
  }

  const msg = opts.message || summary;
  git(["commit", "-m", msg]);
  console.log(`\n✓ Committed: ${msg}`);

  if (!opts.push) {
    console.log("ℹ  --no-push set; not pushing.");
    return;
  }
  try {
    git(["push"]);
    console.log("✓ Pushed to remote (Vercel will rebuild).");
  } catch (e) {
    console.log("⚠  Commit succeeded but push failed (no upstream/remote?).");
    console.log("   Set a remote and `git push -u origin <branch>` once; future syncs auto-push.");
  }
}

// --------------------------------------------------------------------------
// main
// --------------------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.idml) {
    fail('Provide a path to an .idml file:  npm run sync -- "C:\\path\\to\\portfolio.idml"');
  }
  const idmlPath = path.resolve(opts.idml);
  if (!fs.existsSync(idmlPath)) fail(`File not found: ${idmlPath}`);
  if (!idmlPath.toLowerCase().endsWith(".idml")) {
    fail(`Expected a .idml file, got: ${path.basename(idmlPath)}`);
  }

  console.log(`\n► Reading ${path.basename(idmlPath)} ...`);
  const idml = readIdml(idmlPath);
  console.log(`  ${idml.stories.size} stories, ${idml.spreads.size} spreads`);

  let existing = null;
  if (fs.existsSync(CONTENT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
    } catch {
      /* ignore malformed existing file */
    }
  }

  const { content, filled, skipped } = buildContent(idml, existing);
  if (filled.length === 0) {
    fail("No filled projects found (every project spread lacked linked images).");
  }

  const linkPaths = collectLinkPaths(idml.spreads);
  const { copied, missing } = copyImages(content, idmlPath, linkPaths);

  fs.mkdirSync(path.dirname(CONTENT_FILE), { recursive: true });
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2) + "\n", "utf8");

  // Report
  console.log(`\n✓ Wrote content/projects.json`);
  console.log(`  Cover:    ${content.cover.title || "(none)"}`);
  console.log(`  Projects: ${filled.map((p) => p.title).join(", ")}`);
  if (skipped.length) {
    console.log(`  Skipped:  ${skipped.map((p) => p.title).join(", ")} (no images — template placeholders)`);
  }
  console.log(`  Images:   ${copied.length} copied to public/images`);
  if (missing.length) {
    console.log(`\n⚠  ${missing.length} linked image(s) not found on disk:`);
    for (const name of missing) console.log(`     - ${name}`);
    console.log("   Keep your InDesign-linked images inside the project folder so sync can find them.");
  }

  const summary = `Sync portfolio from InDesign (${filled.length} project${filled.length === 1 ? "" : "s"})`;
  if (opts.git) gitSync(opts, summary);

  console.log("\nDone.\n");
}

main();
