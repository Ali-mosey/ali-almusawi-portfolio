import { getSiteContent } from "@/lib/projects";
import ProjectTile from "@/components/ProjectTile";

export default function HomePage() {
  const { cover, projects } = getSiteContent();

  return (
    <div className="container">
      <section className="cover">
        <h1>{cover.title}</h1>
        <p>{cover.subtitle}</p>
      </section>

      <section className="grid">
        {projects.map((project, i) => (
          <ProjectTile key={project.slug} project={project} withCat={i === 0} />
        ))}
      </section>
    </div>
  );
}
