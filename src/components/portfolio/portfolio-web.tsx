import * as React from "react"

import { getWebProjects } from "../../content/portfolio"
import type { Portfolio } from "../../content/portfolio"
import PortfolioMetrics from "./portfolio-metrics"
import PortfolioProject from "./portfolio-project"

type PortfolioWebProps = Readonly<{ portfolio: Portfolio }>

const PortfolioWeb = ({ portfolio }: PortfolioWebProps) => (
  <div className="portfolio-web">
    <header className="portfolio-hero">
      <h1 id="portfolio-title">
        {portfolio.name} 백엔드 개발자 포트폴리오
      </h1>
      <p className="portfolio-positioning">{portfolio.positioning}</p>
      <div className="portfolio-summary">
        {portfolio.summary.map(item => <p key={item}>{item}</p>)}
      </div>
    </header>

    <PortfolioMetrics metrics={portfolio.metrics} />

    <section
      className="portfolio-projects"
      aria-labelledby="portfolio-projects-title"
    >
      <h2 id="portfolio-projects-title">대표 프로젝트</h2>
      {getWebProjects(portfolio).map(project => (
        <PortfolioProject key={project.id} project={project} />
      ))}
    </section>

    <section
      className="portfolio-achievements"
      aria-labelledby="portfolio-achievements-title"
    >
      <h2 id="portfolio-achievements-title">추가 성과</h2>
      <ul>
        {portfolio.additionalAchievements.map(achievement => (
          <li key={achievement}>{achievement}</li>
        ))}
      </ul>
    </section>

    <section
      className="portfolio-working-style"
      aria-labelledby="portfolio-working-style-title"
    >
      <h2 id="portfolio-working-style-title">일하는 방식</h2>
      <ul>
        {portfolio.workingStyle.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>

    <section className="portfolio-links" aria-labelledby="portfolio-links-title">
      <h2 id="portfolio-links-title">더 알아보기</h2>
      <ul>
        {portfolio.links.map(link => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <a
            href="/downloads/kwon-jongseong-backend-portfolio.pdf"
            download
          >
            PDF 포트폴리오 다운로드
          </a>
        </li>
      </ul>
    </section>
  </div>
)

export default PortfolioWeb
