import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  getPdfProjects,
  portfolio,
// @ts-expect-error Node 24 imports the shared TypeScript content contract directly.
} from "../../content/portfolio.ts"
import {
  assertOneVisibleH1,
  verifyPortfolioHtml,
} from "../../../scripts/verify-portfolio-build.mjs"

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

test("renders shared core technologies and every project's technologies and related links", async () => {
  const [web, project] = await Promise.all([
    readRepositoryFile("src/components/portfolio/portfolio-web.tsx"),
    readRepositoryFile("src/components/portfolio/portfolio-project.tsx"),
  ])

  assert.match(
    web,
    /portfolio\.coreTechnologies\.map\(technology =>[\s\S]*<li key=\{technology\}>\{technology\}<\/li>/,
  )
  assert.match(
    project,
    /<ul\s+className="portfolio-project-technologies"\s+aria-label="프로젝트 기술 목록"\s*>[\s\S]*project\.technologies\.map\(technology =>[\s\S]*<li key=\{technology\}>\{technology\}<\/li>/,
  )
  assert.match(project, /project\.relatedLinks\.length > 0 && \(/)
  assert.match(
    project,
    /project\.relatedLinks\.map\(link =>[\s\S]*href=\{link\.url\}[\s\S]*\{link\.label\}/,
  )
})

test("places GitHub and the dated single-source PDF action in the 30-second hero", async () => {
  const web = await readRepositoryFile(
    "src/components/portfolio/portfolio-web.tsx",
  )

  assert.match(
    web,
    /const formattedUpdatedAt = portfolio\.updatedAt\.replaceAll\("-", "\."\)/,
  )
  assert.match(
    web,
    /const githubLink = portfolio\.links\.find\(link => link\.label === "GitHub"\)!/,
  )
  assert.match(
    web,
    /<header className="portfolio-hero">[\s\S]*className="portfolio-hero-actions"[\s\S]*href=\{githubLink\.url\}[\s\S]*PDF 다운로드 · 최신 갱신 \{formattedUpdatedAt\}[\s\S]*같은 공개 콘텐츠에서 생성한 최신 PDF입니다\.[\s\S]*<\/header>/,
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
    /<a[\s\S]*href="\/downloads\/kwon-jongseong-backend-portfolio\.pdf"[\s\S]*download[\s\S]*>[\s\S]*PDF 다운로드 · 최신 갱신 \{formattedUpdatedAt\}[\s\S]*<\/a>/,
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

test("registers the responsive portfolio stylesheet and production verifier", async () => {
  const [browserEntry, packageSource] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("package.json"),
  ])
  const packageJson = JSON.parse(packageSource)

  assert.match(
    browserEntry,
    /^import "\.\/src\/styles\/portfolio\.css"$/m,
  )
  assert.equal(
    packageJson.scripts?.["verify:portfolio"],
    "node scripts/verify-portfolio-build.mjs",
  )
})

test("defines token-based responsive portfolio presentation without inline UI", async () => {
  const [portfolioCss, ...publicPageSources] = await Promise.all([
    readRepositoryFile("src/styles/portfolio.css"),
    ...[
      "src/pages/portfolio.tsx",
      "src/components/portfolio/portfolio-web.tsx",
      "src/components/portfolio/portfolio-metrics.tsx",
      "src/components/portfolio/portfolio-project.tsx",
    ].map(readRepositoryFile),
  ])

  assert.match(portfolioCss, /@layer components\s*\{/)
  assert.doesNotMatch(portfolioCss, /(^|\n)\s*:root\s*\{/)
  assert.doesNotMatch(portfolioCss, /--portfolio-[\w-]+\s*:/)
  assert.doesNotMatch(portfolioCss, /#[\da-f]{3,8}\b|rgba?\(/i)
  assert.match(portfolioCss, /var\(--space-\d+\)/)
  assert.match(portfolioCss, /var\(--(?:fg|muted|surface|border|accent)\)/)

  assert.match(
    portfolioCss,
    /\.portfolio-metrics-list\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/s,
  )
  assert.match(
    portfolioCss,
    /@media \(max-width:\s*1020px\)\s*\{[\s\S]*?\.portfolio-metrics-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  )
  assert.match(
    portfolioCss,
    /@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.portfolio-metrics-list\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  )
  assert.match(portfolioCss, /@media \(max-width:\s*390px\)/)

  assert.match(
    portfolioCss,
    /\.portfolio-hero h1\s*\{[^}]*max-width:\s*none;[^}]*text-wrap:\s*pretty;[^}]*word-break:\s*keep-all;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-positioning\s*\{[^}]*max-width:\s*52rem;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-summary\s*\{[^}]*max-width:\s*52rem;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-project-header\s*\{[^}]*max-width:\s*52rem;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-project section\[aria-label\]\s*\{[^}]*max-width:\s*52rem;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-achievements ul,\s*\.portfolio-working-style ul\s*\{[^}]*max-width:\s*52rem;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-summary p\s*\{[^}]*overflow-wrap:\s*break-word;[^}]*word-break:\s*keep-all;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-project h2\s*\{[^}]*word-break:\s*keep-all;[^}]*overflow-wrap:\s*break-word;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-links a\[download\]:focus-visible\s*\{[^}]*outline:/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-links ul\s*\{[^}]*flex-wrap:\s*wrap;/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-project section\[aria-label\]::before\s*\{[^}]*content:\s*attr\(aria-label\)/s,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-project \.portfolio-project-technologies li,\s*\.portfolio-project \.portfolio-project-technologies li \+ li\s*\{[^}]*margin-top:\s*0;[^}]*padding:\s*var\(--space-1\) var\(--space-3\);/s,
  )
  assert.match(portfolioCss, /max-width:\s*\d+ch/)
  assert.doesNotMatch(portfolioCss, /@keyframes|animation(?:-name)?:/i)

  const publicPageSource = publicPageSources.join("\n")
  assert.doesNotMatch(publicPageSource, /\bstyle\s*=/)
  assert.doesNotMatch(publicPageSource, /<(?:progress|meter)\b/)
  assert.doesNotMatch(publicPageSource, /<(?:details|button)\b/)
})

test("defines a verifier for the generated portfolio HTML", async () => {
  const verifier = await readRepositoryFile(
    "scripts/verify-portfolio-build.mjs",
  )

  assert.match(
    verifier,
    /readFile\(new URL\("\.\.\/public\/portfolio\/index\.html", import\.meta\.url\), "utf8"\)/,
  )
  assert.match(verifier, /https:\\\/\\\/macho199\\\.github\\\.io\\\/portfolio\\\//)
  assert.match(verifier, /kwon-jongseong-backend-portfolio\\\.pdf/)
  assert.match(verifier, /nas-to-s3/)
  assert.match(verifier, /resume-migration/)
  assert.match(verifier, /recommendation-load-test/)
  assert.match(verifier, /data-pulse/)
  for (const approvedTechnology of [
    "AWS S3",
    "PostgreSQL",
    "MSA",
    "Debezium CDC",
  ]) {
    assert.ok(
      verifier.includes(approvedTechnology),
      `${approvedTechnology} generated HTML contract`,
    )
  }
  assert.ok(
    verifier.includes("PDF 다운로드 · 최신 갱신 2026.07.23"),
    "dated PDF action generated HTML contract",
  )
  assert.ok(
    verifier.includes("AI 에이전트는 탐색·정리·추적에 사용"),
    "AI-agent working-style generated HTML contract",
  )
  assert.ok(
    verifier.includes("최종 판단과 검증은 개발자가 담당"),
    "expert-judgment working-style generated HTML contract",
  )
  assert.match(
    verifier,
    /assert\.doesNotMatch\(\s*main,\s*\/\\bstyle\\s\*=\/i,\s*"portfolio: no inline styles",?\s*\)/s,
  )
  assert.ok(verifier.includes("\\+82"))
  assert.ok(verifier.includes("|70)"))
})

test("rejects a generated H1 hidden directly or by an ancestor", () => {
  const hidingAttributes = [
    "hidden",
    'aria-hidden="true"',
    'class="hidden"',
    'class="sr-only"',
    'class="visually-hidden"',
    'style="display: none"',
    'style="visibility:hidden"',
  ]

  for (const attributes of hidingAttributes) {
    assert.throws(
      () =>
        assertOneVisibleH1(
          `<h1 ${attributes}>백엔드 개발자 포트폴리오</h1>`,
        ),
      /portfolio: h1 is visible/,
      `direct H1 marker: ${attributes}`,
    )
    assert.throws(
      () =>
        assertOneVisibleH1(
          `<section ${attributes}><div><h1>백엔드 개발자 포트폴리오</h1></div></section>`,
        ),
      /portfolio: h1 is visible/,
      `ancestor marker: ${attributes}`,
    )
  }
})

test("requires exactly one generated H1 while accepting a visible nested H1", () => {
  assert.doesNotThrow(() =>
    assertOneVisibleH1(
      "<section><div><h1>백엔드 개발자 포트폴리오</h1></div></section>",
    ),
  )
  assert.throws(
    () => assertOneVisibleH1("<section>본문</section>"),
    /portfolio: exactly one h1/,
  )
  assert.throws(
    () =>
      assertOneVisibleH1(
        "<h1>첫 제목</h1><section><h1>두 번째 제목</h1></section>",
      ),
    /portfolio: exactly one h1/,
  )
})

test("rejects a generated portfolio document with a hidden document ancestor", () => {
  const hiddenDocuments = [
    [
      "main",
      "<!doctype html><html><body><main hidden><h1>백엔드 개발자 포트폴리오</h1></main></body></html>",
    ],
    [
      "body",
      "<!doctype html><html><body hidden><main><h1>백엔드 개발자 포트폴리오</h1></main></body></html>",
    ],
    [
      "html",
      "<!doctype html><html hidden><body><main><h1>백엔드 개발자 포트폴리오</h1></main></body></html>",
    ],
  ]

  for (const [ancestor, html] of hiddenDocuments) {
    assert.throws(
      () => verifyPortfolioHtml(html),
      /portfolio: h1 is visible/,
      `hidden ${ancestor}`,
    )
  }
})

test("rejects private IPv4 from built visible text while preserving URL and phone checks", async () => {
  const { assertPublicPortfolioVisibleText } = await import(
    "../../../scripts/verify-portfolio-build.mjs"
  )

  assert.equal(typeof assertPublicPortfolioVisibleText, "function")

  for (const privateText of [
    "10.0.0.1",
    "127.10.20.30",
    "169.254.1.2",
    "172.16.5.4",
    "172.31.255.255",
    "192.168.40.50",
    "https://macho199.github.io/portfolio/10.0.0.1",
  ]) {
    assert.throws(
      () => assertPublicPortfolioVisibleText(`visible ${privateText}`),
      /no private IPv4/,
      privateText,
    )
  }

  assert.throws(
    () =>
      assertPublicPortfolioVisibleText(
        "https://macho199.github.io/portfolio/010-1234-5678",
      ),
    /no phone number/,
  )
  assert.doesNotThrow(() =>
    assertPublicPortfolioVisibleText(
      "public 8.8.8.8 https://macho199.github.io/portfolio/8.8.4.4",
    ),
  )
})

test("publishes a shell-free noindex print route at the nested portfolio path", async () => {
  const route = await readRepositoryFile("src/pages/portfolio/print.tsx")

  assert.match(
    route,
    /import PortfolioPrintDocument from "\.\.\/\.\.\/components\/portfolio\/portfolio-print-document"/,
  )
  assert.match(route, /import Seo from "\.\.\/\.\.\/components\/seo"/)
  assert.match(route, /<PortfolioPrintDocument \/>/)
  assert.doesNotMatch(
    route,
    /\b(?:Layout|Header|Footer|ScrollToTopButton)\b/,
  )
  assert.match(
    route,
    /export const Head: HeadFC = \(\{ location \}\) => \([\s\S]*<Seo[\s\S]*pathname=\{location\.pathname\}[\s\S]*robots="noindex, nofollow"[\s\S]*\/>[\s\S]*\)/,
  )
})

test("composes exactly nine deterministic print pages from shared portfolio data", async () => {
  const printDocument = await readRepositoryFile(
    "src/components/portfolio/portfolio-print-document.tsx",
  )
  const pdfProjects = getPdfProjects(portfolio)

  assert.deepEqual(
    pdfProjects.map(project => project.id),
    ["nas-to-s3", "resume-migration", "recommendation-load-test"],
  )
  assert.match(
    printDocument,
    /import \{ getPdfProjects, portfolio \} from "\.\.\/\.\.\/content\/portfolio"/,
  )
  assert.match(
    printDocument,
    /const pdfProjects = getPdfProjects\(portfolio\)/,
  )
  assert.equal(
    [...printDocument.matchAll(/<PrintPage\b/g)].length,
    9,
  )
  assert.equal(
    [...printDocument.matchAll(/pageNumber=\{\d\}/g)].length,
    9,
  )
  for (let pageNumber = 1; pageNumber <= 9; pageNumber += 1) {
    assert.match(
      printDocument,
      new RegExp(`pageNumber=\\{${pageNumber}\\}`),
    )
  }
  assert.match(
    printDocument,
    /type PrintPageProps = Readonly<\{[\s\S]*pageNumber: number[\s\S]*totalPages: 9[\s\S]*updatedAt: string[\s\S]*children: React\.ReactNode[\s\S]*\}>/,
  )
  assert.match(
    printDocument,
    /<section className="portfolio-print-page" data-page=\{pageNumber\}>/,
  )
  assert.match(
    printDocument,
    /\{portfolio\.name\} 백엔드 개발자 포트폴리오/,
  )
  assert.match(
    printDocument,
    /\{pageNumber\} \/ \{totalPages\}/,
  )
  assert.match(
    printDocument,
    /업데이트 \{updatedAt\.replaceAll\("-", "\."\)\}/,
  )
  assert.match(
    printDocument,
    /https:\/\/macho199\.github\.io\/portfolio\//,
  )
})

test("uses the approved nine-page content map without PDF-only project prose", async () => {
  const printDocument = await readRepositoryFile(
    "src/components/portfolio/portfolio-print-document.tsx",
  )

  assert.match(printDocument, /\{portfolio\.positioning\}/)
  assert.match(printDocument, /portfolio\.summary\.map/)
  assert.match(printDocument, /portfolio\.links\.map/)
  assert.match(printDocument, /portfolio\.coreTechnologies\.map/)
  assert.match(printDocument, /portfolio\.metrics\.map/)
  assert.match(printDocument, /portfolio\.workingStyle\.map/)
  assert.match(printDocument, /\{project\.headline\}/)
  assert.match(printDocument, /\{project\.problem\}/)
  assert.match(printDocument, /project\.scaleAndConstraints\.map/)
  assert.match(printDocument, /project\.role\.map/)
  assert.match(printDocument, /project\.decisions\.map/)
  assert.match(printDocument, /project\.failureHandling\.map/)
  assert.match(printDocument, /project\.result\.map/)
  assert.match(printDocument, /project\.technologies\.map/)
  assert.match(printDocument, /portfolio\.additionalAchievements\.map/)
  assert.match(
    printDocument,
    /const dataPulse = portfolio\.projects\.find\(project => project\.id === "data-pulse"\)/,
  )
  assert.match(printDocument, /\{dataPulse\.headline\}/)
  assert.match(printDocument, /dataPulse\.result\.map/)
  assert.doesNotMatch(
    printDocument,
    /서비스를 멈추지 않고 약 800만 개|1천만 건 이상의 원본과 이관 결과|500 TPS 시험에서 드러난/,
  )
})

test("defines A4 pagination and keeps each print content block together", async () => {
  const portfolioCss = await readRepositoryFile("src/styles/portfolio.css")

  assert.match(
    portfolioCss,
    /@page\s*\{[^}]*size:\s*A4 portrait;[^}]*margin:\s*0;/s,
  )
  assert.match(
    portfolioCss,
    /@media print\s*\{[\s\S]*?\.portfolio-print-page\s*\{[^}]*width:\s*210mm;[^}]*height:\s*297mm;[^}]*break-after:\s*page;[^}]*overflow:\s*hidden;/,
  )
  assert.match(
    portfolioCss,
    /@media print\s*\{[\s\S]*?\.portfolio-print-page:last-child\s*\{[^}]*break-after:\s*auto;/,
  )
  assert.match(
    portfolioCss,
    /\.portfolio-print-project-block\s*\{[^}]*break-inside:\s*avoid;/s,
  )
})

test("extends the production verifier for print HTML and every sitemap XML file", async () => {
  const verifier = await readRepositoryFile(
    "scripts/verify-portfolio-build.mjs",
  )

  assert.match(
    verifier,
    /public\/portfolio\/print\/index\.html/,
  )
  assert.match(verifier, /noindex, nofollow/)
  assert.match(verifier, /portfolio-print-page/)
  assert.match(verifier, /const pageNumber = index \+ 1/)
  assert.match(
    verifier,
    /new RegExp\(`\$\{pageNumber\} \/ 9`\)/,
  )
  assert.match(verifier, /site-header/)
  assert.match(verifier, /site-footer/)
  assert.match(verifier, /scroll-to-top/)
  assert.match(verifier, /sitemap[^"'`]*\\\.xml/)
  assert.match(verifier, /<loc>/)
  assert.match(verifier, /portfolio\\\/print/)
})
