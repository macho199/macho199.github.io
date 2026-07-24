import * as React from "react"

import type { PortfolioProject } from "../../content/portfolio"

type PortfolioProjectProps = Readonly<{ project: PortfolioProject }>

const PortfolioProjectView = ({ project }: PortfolioProjectProps) => (
  <article className="portfolio-project" aria-labelledby={`project-${project.id}`}>
    <header className="portfolio-project-header">
      <p className="portfolio-project-meta">
        {project.period} · {project.contribution}
      </p>
      <h2 id={`project-${project.id}`}>{project.title}</h2>
      <p className="portfolio-project-headline">{project.headline}</p>
    </header>
    <section aria-label="문제와 제약">
      <p>{project.problem}</p>
      <ul>
        {project.scaleAndConstraints.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section aria-label="담당 역할과 판단">
      <ul>
        {project.role.concat(project.decisions).map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
    <section aria-label="실패 대응과 결과">
      <ul>
        {project.failureHandling.concat(project.result).map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
    <section aria-label="사용 기술">
      <ul
        className="portfolio-project-technologies"
        aria-label="프로젝트 기술 목록"
      >
        {project.technologies.map(technology => (
          <li key={technology}>{technology}</li>
        ))}
      </ul>
    </section>
    {project.relatedLinks.length > 0 && (
      <section aria-label="관련 링크">
        <ul className="portfolio-project-related-links">
          {project.relatedLinks.map(link => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    )}
  </article>
)

export default PortfolioProjectView
