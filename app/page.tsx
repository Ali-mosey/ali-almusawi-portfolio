import Link from "next/link";
import { getSiteContent } from "@/lib/projects";

export default function HomePage() {
  const { cover, projects } = getSiteContent();

  return (
    <div className="container">
      <section className="cover">
        <h1>{cover.title}</h1>
        <p>{cover.subtitle}</p>
      </section>

      <section className="grid">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="tile"
          >
            <div className="frame">
              {project.hero && (
                <img src={project.hero.src} alt={project.title} />
              )}
            </div>
            <div className="caption">
              <h2>{project.title}</h2>
              {project.subtitle && <span>{project.subtitle}</span>}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
