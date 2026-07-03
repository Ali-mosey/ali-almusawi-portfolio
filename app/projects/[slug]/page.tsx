import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllProjects,
  getProjectBySlug,
  getNextProject,
} from "@/lib/projects";

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

      {project.hero && (
        <div className="hero">
          <img src={project.hero.src} alt={project.title} />
        </div>
      )}

      {project.gallery.length > 0 && (
        <section className="gallery">
          {project.gallery.map((image, i) => (
            <figure key={i}>
              <img src={image.src} alt={image.caption ?? project.title} />
              {image.caption && <figcaption>{image.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}

      {next && (
        <Link href={`/projects/${next.slug}`} className="next-project">
          <span className="label">Next project</span>
          <h3>{next.title}</h3>
          <div className="frame">
            {next.hero && <img src={next.hero.src} alt={next.title} />}
          </div>
        </Link>
      )}
    </article>
  );
}
