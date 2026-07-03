import fs from "node:fs";
import path from "node:path";

/**
 * Shape of the raw content file at /content/projects.json.
 * This is the schema produced by the InDesign -> IDML sync pipeline,
 * so we read it as-is and normalise it here rather than changing the file.
 */
type RawProject = {
  title: string;
  subtitle?: string;
  description?: string;
  captions?: string[];
  hero_image?: string;
  images?: string[];
  background_image?: string;
};

type RawContent = {
  cover?: { title?: string; subtitle?: string };
  projects?: Record<string, RawProject>;
  contact?: string;
};

export type GalleryImage = {
  /** Web-ready, URL-encoded src under /public/images. */
  src: string;
  /** Optional caption aligned by index with the project's captions. */
  caption?: string;
};

export type Project = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  hero?: GalleryImage;
  gallery: GalleryImage[];
  /** Full-page background image for the project's page. */
  background?: GalleryImage;
};

export type SiteContent = {
  cover: { title: string; subtitle: string };
  contact: string;
  projects: Project[];
};

/** Turn a project title into a URL-safe slug, e.g. "A Place to Pause" -> "a-place-to-pause". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build a public URL for an image filename living in /public/images. */
function toImageSrc(filename?: string): GalleryImage | undefined {
  if (!filename) return undefined;
  // Encode each path segment so spaces / parens in InDesign filenames are valid URLs.
  return { src: "/images/" + encodeURIComponent(filename) };
}

function readContent(): RawContent {
  const file = path.join(process.cwd(), "content", "projects.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as RawContent;
}

export function getSiteContent(): SiteContent {
  const data = readContent();

  const projects: Project[] = Object.values(data.projects ?? {}).map((p) => {
    const captions = p.captions ?? [];
    const gallery: GalleryImage[] = [];
    (p.images ?? []).forEach((img, i) => {
      const built = toImageSrc(img);
      if (built) gallery.push({ ...built, caption: captions[i] });
    });

    return {
      slug: slugify(p.title),
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      hero: toImageSrc(p.hero_image),
      gallery,
      background: toImageSrc(p.background_image),
    };
  });

  return {
    cover: {
      title: data.cover?.title ?? "Portfolio",
      subtitle: data.cover?.subtitle ?? "",
    },
    contact: data.contact ?? "",
    projects,
  };
}

export function getAllProjects(): Project[] {
  return getSiteContent().projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

/** The next project in the list, wrapping around to the first. Used for "next project" links. */
export function getNextProject(slug: string): Project | undefined {
  const all = getAllProjects();
  if (all.length < 2) return undefined;
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1) return undefined;
  return all[(i + 1) % all.length];
}
