import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllProjects,
  getProjectBySlug,
  getNextProject,
  getPreviousProject,
} from "@/lib/projects";
import ProjectCat, { type CatVariant } from "@/components/ProjectCat";

/** Which cat lives on which project page, by project order (A, B, C…). */
const CATS: Record<number, CatVariant> = {
  0: "watcher",
  1: "ball",
  2: "scratcher",
};

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — Architecture Portfolio`,
    description: project.description?.slice(0, 160),
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  const next = getNextProject(slug);
  const previous = getPreviousProject(slug);
  const index = getAllProjects().findIndex((p) => p.slug === slug);
  const cat = CATS[index];

  return (
    <article className="container">
      {project.background && (
        <div
          className="project-bg"
          style={{ backgroundImage: `url(${project.background.src})` }}
          aria-hidden="true"
        />
      )}

      <Link href="/" className="back">
        ← All projects
      </Link>

      <header className="project-head">
        <h1>{project.title}</h1>
        {project.subtitle && <p className="subtitle">{project.subtitle}</p>}
        {project.description && (
          <p className="description">{project.description}</p>
        )}
      </header>

      {cat === "watcher" && <ProjectCat variant="watcher" />}

      {project.hero && (
        <div className="hero">
          {cat === "ball" && <ProjectCat variant="ball" />}
          <img src={project.hero.src} alt={project.title} />
        </div>
      )}

      {project.gallery.length > 0 && (
        <section className="gallery">
          {project.gallery.map((image, i) => (
            <figure key={i}>
              <div className="gallery-frame">
                {cat === "scratcher" && i === 0 && (
                  <ProjectCat variant="scratcher" />
                )}
                <img src={image.src} alt={image.caption ?? project.title} />
              </div>
              {image.caption && <figcaption>{image.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}

      {(previous || next) && (
        <nav className="project-nav">
          {previous && (
            <Link href={`/projects/${previous.slug}`} className="prev-project">
              <div className="frame">
                {previous.hero && (
                  <img src={previous.hero.src} alt={previous.title} />
                )}
              </div>
              <div className="text">
                <span className="label">Previous project</span>
                <h3>{previous.title}</h3>
              </div>
            </Link>
          )}
          {next && (
            <Link href={`/projects/${next.slug}`} className="next-project">
              <div className="text">
                <span className="label">Next project</span>
                <h3>{next.title}</h3>
              </div>
              <div className="frame">
                {next.hero && <img src={next.hero.src} alt={next.title} />}
              </div>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
