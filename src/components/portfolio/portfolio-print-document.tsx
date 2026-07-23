import * as React from "react"

import { getPdfProjects, portfolio } from "../../content/portfolio"
import type { PortfolioProject } from "../../content/portfolio"

const CANONICAL_PORTFOLIO_URL = "https://macho199.github.io/portfolio/"

type PrintPageProps = Readonly<{
  pageNumber: number
  totalPages: 9
  updatedAt: string
  children: React.ReactNode
}>

type PrintProjectPageProps = Readonly<{
  project: PortfolioProject
}>

const PrintPage = ({
  pageNumber,
  totalPages,
  updatedAt,
  children,
}: PrintPageProps) => (
  <section className="portfolio-print-page" data-page={pageNumber}>
    <div className="portfolio-print-content">{children}</div>
    <footer className="portfolio-print-footer">
      <span>{portfolio.name} 백엔드 개발자 포트폴리오</span>
      <span>{pageNumber} / {totalPages}</span>
      <span>업데이트 {updatedAt}</span>
      <span>{CANONICAL_PORTFOLIO_URL}</span>
    </footer>
  </section>
)

const ProjectOpeningPage = ({ project }: PrintProjectPageProps) => (
  <article
    className="portfolio-print-project-block"
    data-project-id={project.id}
    data-project-part="overview"
  >
    <header className="portfolio-print-project-header">
      <p className="portfolio-print-eyebrow">대표 프로젝트</p>
      <h2>{project.title}</h2>
      <p className="portfolio-print-project-headline">{project.headline}</p>
    </header>
    <section>
      <h3>문제</h3>
      <p>{project.problem}</p>
    </section>
    <section>
      <h3>규모와 제약</h3>
      <ul>
        {project.scaleAndConstraints.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section>
      <h3>담당 역할</h3>
      <ul>
        {project.role.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  </article>
)

const ProjectOutcomePage = ({ project }: PrintProjectPageProps) => (
  <article
    className="portfolio-print-project-block"
    data-project-id={project.id}
    data-project-part="outcome"
  >
    <header className="portfolio-print-project-header">
      <p className="portfolio-print-eyebrow">대표 프로젝트</p>
      <h2>{project.title}</h2>
    </header>
    <section>
      <h3>핵심 판단</h3>
      <ul>
        {project.decisions.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section>
      <h3>실패 대응</h3>
      <ul>
        {project.failureHandling.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section>
      <h3>결과</h3>
      <ul>
        {project.result.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section>
      <h3>기술</h3>
      <ul className="portfolio-print-tag-list">
        {project.technologies.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  </article>
)

const PortfolioPrintDocument = () => {
  const pdfProjects = getPdfProjects(portfolio)
  const [nasToS3, resumeMigration, recommendation] = pdfProjects
  const dataPulse = portfolio.projects.find(project => project.id === "data-pulse")!
  const technicalWritingLink = portfolio.links.find(
    link => link.label === "기술 블로그",
  )!
  const githubLink = portfolio.links.find(link => link.label === "GitHub")!

  return (
    <main className="portfolio-print-document">
      <PrintPage pageNumber={1} totalPages={9} updatedAt={portfolio.updatedAt}>
        <div className="portfolio-print-cover">
          <p className="portfolio-print-eyebrow">Backend Engineer Portfolio</p>
          <h1>{portfolio.name} 백엔드 개발자 포트폴리오</h1>
          <p className="portfolio-print-positioning">{portfolio.positioning}</p>
          <div className="portfolio-print-summary">
            {portfolio.summary.map(item => <p key={item}>{item}</p>)}
          </div>
          <ul className="portfolio-print-link-list">
            {portfolio.links.map(link => (
              <li key={link.url}>
                <a href={link.url}>{link.label}: {link.url}</a>
              </li>
            ))}
          </ul>
        </div>
      </PrintPage>

      <PrintPage pageNumber={2} totalPages={9} updatedAt={portfolio.updatedAt}>
        <div className="portfolio-print-overview">
          <section>
            <h2>핵심 기술</h2>
            <ul className="portfolio-print-tag-list">
              {portfolio.coreTechnologies.map(technology => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>핵심 지표</h2>
            <dl className="portfolio-print-metrics">
              {portfolio.metrics.map(metric => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2>일하는 방식</h2>
            <ul>
              {portfolio.workingStyle.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </PrintPage>

      <PrintPage pageNumber={3} totalPages={9} updatedAt={portfolio.updatedAt}>
        <ProjectOpeningPage project={nasToS3} />
      </PrintPage>

      <PrintPage pageNumber={4} totalPages={9} updatedAt={portfolio.updatedAt}>
        <ProjectOutcomePage project={nasToS3} />
      </PrintPage>

      <PrintPage pageNumber={5} totalPages={9} updatedAt={portfolio.updatedAt}>
        <ProjectOpeningPage project={resumeMigration} />
      </PrintPage>

      <PrintPage pageNumber={6} totalPages={9} updatedAt={portfolio.updatedAt}>
        <ProjectOutcomePage project={resumeMigration} />
      </PrintPage>

      <PrintPage pageNumber={7} totalPages={9} updatedAt={portfolio.updatedAt}>
        <ProjectOpeningPage project={recommendation} />
      </PrintPage>

      <PrintPage pageNumber={8} totalPages={9} updatedAt={portfolio.updatedAt}>
        <ProjectOutcomePage project={recommendation} />
      </PrintPage>

      <PrintPage pageNumber={9} totalPages={9} updatedAt={portfolio.updatedAt}>
        <div className="portfolio-print-closing">
          <section>
            <h2>추가 성과</h2>
            <ul>
              {portfolio.additionalAchievements.map(achievement => (
                <li key={achievement}>{achievement}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{dataPulse.title}</h2>
            <p>{dataPulse.headline}</p>
            {dataPulse.result.map(item => <p key={item}>{item}</p>)}
          </section>
          <section>
            <h2>기술 글과 코드</h2>
            <ul className="portfolio-print-link-list">
              <li>
                <a href={technicalWritingLink.url}>
                  {technicalWritingLink.label}: {technicalWritingLink.url}
                </a>
              </li>
              <li>
                <a href={githubLink.url}>
                  {githubLink.label}: {githubLink.url}
                </a>
              </li>
            </ul>
          </section>
          <section>
            <h2>웹 포트폴리오</h2>
            <p>{CANONICAL_PORTFOLIO_URL}</p>
          </section>
        </div>
      </PrintPage>
    </main>
  )
}

export default PortfolioPrintDocument
