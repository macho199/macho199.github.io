import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  portfolio,
// @ts-expect-error Node 24 imports the shared TypeScript content contract directly.
} from "../../content/portfolio.ts"

const repositoryRoot = new URL("../../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

test("publishes the portfolio through the shared page shell and canonical SEO", async () => {
  const page = await readRepositoryFile("src/pages/portfolio.tsx")

  assert.match(page, /import ContentContainer from "\.\.\/components\/content-container"/)
  assert.match(page, /import Layout from "\.\.\/components\/layout"/)
  assert.match(page, /import PortfolioWeb from "\.\.\/components\/portfolio\/portfolio-web"/)
  assert.match(page, /import Seo from "\.\.\/components\/seo"/)
  assert.match(page, /import \{ portfolio \} from "\.\.\/content\/portfolio"/)
  assert.match(
    page,
    /<Layout>[\s\S]*<ContentContainer>[\s\S]*<PortfolioWeb portfolio=\{portfolio\} \/>[\s\S]*<\/ContentContainer>[\s\S]*<\/Layout>/,
  )
  assert.doesNotMatch(page, /<main\b/)
  assert.match(
    page,
    /export const Head: HeadFC = \(\{ location \}\) => \([\s\S]*<Seo[\s\S]*title="백엔드 개발자 포트폴리오"[\s\S]*description="17년 경력 백엔드 개발자 권종성의 레거시 현대화, 대규모 데이터 전환, 성능 개선 사례입니다\."[\s\S]*pathname=\{location\.pathname\}[\s\S]*\/>[\s\S]*\)/,
  )
})

test("renders the portfolio overview, ordered projects, achievements, and working style", async () => {
  const web = await readRepositoryFile(
    "src/components/portfolio/portfolio-web.tsx",
  )

  assert.match(web, /import \{ getWebProjects \} from "\.\.\/\.\.\/content\/portfolio"/)
  assert.match(web, /type PortfolioWebProps = Readonly<\{ portfolio: Portfolio \}>/)
  assert.match(web, /<h1 id="portfolio-title">[\s\S]*백엔드 개발자 포트폴리오[\s\S]*<\/h1>/)
  assert.doesNotMatch(web, /<h1[^>]*className="sr-only"/)
  assert.match(web, /\{portfolio\.positioning\}/)
  assert.match(web, /<PortfolioMetrics metrics=\{portfolio\.metrics\} \/>/)
  assert.match(
    web,
    /\{getWebProjects\(portfolio\)\.map\(project => \([\s\S]*<PortfolioProject key=\{project\.id\} project=\{project\} \/>[\s\S]*\)\)\}/,
  )
  assert.match(
    web,
    /<section[^>]*aria-labelledby="portfolio-achievements-title"[\s\S]*<h2 id="portfolio-achievements-title">[\s\S]*추가 성과[\s\S]*portfolio\.additionalAchievements\.map\(achievement =>/,
  )
  assert.match(
    web,
    /<section[^>]*aria-labelledby="portfolio-working-style-title"[\s\S]*<h2 id="portfolio-working-style-title">[\s\S]*일하는 방식[\s\S]*portfolio\.workingStyle\.map\(item =>/,
  )
})

test("publishes exactly four metrics from the shared portfolio data", () => {
  assert.equal(portfolio.metrics.length, 4)
})

test("keeps 17 years visible in the shared portfolio positioning", () => {
  assert.match(portfolio.positioning, /17년/)
})

test("renders all four metrics and every project as semantic content", async () => {
  const [metrics, project] = await Promise.all([
    readRepositoryFile("src/components/portfolio/portfolio-metrics.tsx"),
    readRepositoryFile("src/components/portfolio/portfolio-project.tsx"),
  ])

  assert.match(
    metrics,
    /type PortfolioMetricsProps = Readonly<\{ metrics: Portfolio\["metrics"\] \}>/,
  )
  assert.match(metrics, /\{metrics\.map\(metric => \(/)
  assert.match(metrics, /<dt>\{metric\.label\}<\/dt>/)
  assert.match(metrics, /<dd>\{metric\.value\}<\/dd>/)

  assert.match(
    project,
    /type PortfolioProjectProps = Readonly<\{ project: PortfolioProject \}>/,
  )
  assert.match(
    project,
    /<article className="portfolio-project" aria-labelledby=\{`project-\$\{project\.id\}`\}>/,
  )
  assert.match(
    project,
    /<p className="portfolio-project-meta">[\s\S]*\{project\.period\} · \{project\.contribution\}[\s\S]*<\/p>/,
  )
  assert.match(project, /<h2 id=\{`project-\$\{project\.id\}`\}>\{project\.title\}<\/h2>/)
  assert.match(
    project,
    /<p className="portfolio-project-headline">\{project\.headline\}<\/p>/,
  )
  assert.match(
    project,
    /<section aria-label="문제와 제약">[\s\S]*\{project\.problem\}[\s\S]*project\.scaleAndConstraints\.map/,
  )
  assert.match(
    project,
    /<section aria-label="담당 역할과 판단">[\s\S]*project\.role\.concat\(project\.decisions\)\.map/,
  )
  assert.match(
    project,
    /<section aria-label="실패 대응과 결과">[\s\S]*project\.failureHandling\.concat\(project\.result\)\.map/,
  )
})

test("offers approved public links and a downloadable portfolio PDF", async () => {
  const [web, content] = await Promise.all([
    readRepositoryFile("src/components/portfolio/portfolio-web.tsx"),
    readRepositoryFile("src/content/portfolio.ts"),
  ])

  assert.match(
    web,
    /portfolio\.links\.map\(link =>[\s\S]*href=\{link\.url\}[\s\S]*\{link\.label\}/,
  )
  assert.match(content, /\{ label: "GitHub", url: "https:\/\/github\.com\/macho199" \}/)
  assert.match(
    web,
    /<a[\s\S]*href="\/downloads\/kwon-jongseong-backend-portfolio\.pdf"[\s\S]*download[\s\S]*>[\s\S]*PDF 포트폴리오 다운로드[\s\S]*<\/a>/,
  )
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const componentSources = await Promise.all(
    [
      "src/components/portfolio/portfolio-metrics.tsx",
      "src/components/portfolio/portfolio-project.tsx",
      "src/components/portfolio/portfolio-web.tsx",
      "src/pages/portfolio.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of componentSources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})
