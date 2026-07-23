import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import { isIP } from "node:net"
import { pathToFileURL } from "node:url"

import { findPrivateIpv4Addresses } from "../src/content/public-content-privacy.mjs"

const canonicalUrlPattern = /https:\/\/macho199\.github\.io\/portfolio\//
const pdfPathPattern = /\/downloads\/kwon-jongseong-backend-portfolio\.pdf/

/** @param {string} value */
const normalizeText = value =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

/**
 * @param {string} attributes
 * @param {string} name
 */
const readAttribute = (attributes, name) =>
  attributes.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] ?? ""

/**
 * @param {string} attributes
 * @param {string} name
 */
const hasBooleanAttribute = (attributes, name) =>
  new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, "i").test(attributes)

/** @param {string} attributes */
const isStaticallyHidden = attributes => {
  const className = readAttribute(attributes, "class")
  const style = readAttribute(attributes, "style")

  return (
    hasBooleanAttribute(attributes, "hidden") ||
    readAttribute(attributes, "aria-hidden").toLowerCase() === "true" ||
    /(?:^|\s)(?:hidden|sr-only|visually-hidden)(?:\s|$)/i.test(className) ||
    /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)
  )
}

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

/** @typedef {{ attributes: string, content: string, hidden: boolean }} H1Element */
/** @typedef {{ contentStart: number, h1: H1Element | null, hidden: boolean, name: string }} OpenElement */

/** @param {string} source */
const readH1Elements = source => {
  /** @type {H1Element[]} */
  const elements = []
  /** @type {OpenElement[]} */
  const stack = []
  const tokens = source.matchAll(
    /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>/gi,
  )

  for (const token of tokens) {
    const markup = token[0]

    if (markup.startsWith("<!")) {
      continue
    }

    const closingMatch = markup.match(/^<\/\s*([a-z][\w:-]*)[^>]*>$/i)

    if (closingMatch) {
      const name = closingMatch[1].toLowerCase()

      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].name !== name) {
          continue
        }

        const openH1 = stack[index].h1

        if (name === "h1" && openH1) {
          openH1.content = source.slice(
            stack[index].contentStart,
            token.index,
          )
        }

        stack.length = index
        break
      }

      continue
    }

    const openingMatch = markup.match(
      /^<\s*([a-z][\w:-]*)([\s\S]*?)\/?>$/i,
    )

    if (!openingMatch) {
      continue
    }

    const name = openingMatch[1].toLowerCase()
    const attributes = openingMatch[2]
    /** @type {boolean} */
    const hidden =
      isStaticallyHidden(attributes) ||
      (stack.length > 0 && stack[stack.length - 1].hidden)
    /** @type {H1Element | null} */
    const h1 =
      name === "h1"
        ? { attributes, content: "", hidden }
        : null

    if (h1) {
      elements.push(h1)
    }

    if (!markup.endsWith("/>") && !voidElements.has(name)) {
      stack.push({
        contentStart: token.index + markup.length,
        h1,
        hidden,
        name,
      })
    }
  }

  return elements
}

/** @param {string} main */
export const assertOneVisibleH1 = main => {
  const h1Elements = readH1Elements(main)

  assert.equal(h1Elements.length, 1, "portfolio: exactly one h1")
  assert.ok(!h1Elements[0].hidden, "portfolio: h1 is visible")

  return h1Elements[0]
}

const projectContracts = [
  {
    id: "nas-to-s3",
    contribution: "2인 팀 · 60%",
    technologies: [
      "Java",
      "Spring Boot",
      "MSSQL",
      "AWS S3",
      "S3 Presigned URL",
      "C#",
      "ASP.NET",
    ],
  },
  {
    id: "resume-migration",
    contribution: "팀 프로젝트 · 30%",
    technologies: [
      "Java",
      "Spring Boot",
      "MSSQL",
      "PostgreSQL",
      "SQL",
      "Kafka",
    ],
  },
  {
    id: "recommendation-load-test",
    contribution: "팀 프로젝트 · 30%",
    technologies: ["Java", "Spring Boot", "MSSQL", "MSA"],
  },
  {
    id: "data-pulse",
    contribution: "팀 프로젝트 · 30%",
    technologies: [
      "Java",
      "Spring Boot",
      "MSSQL",
      "Debezium CDC",
      "Kafka",
    ],
  },
]

const printProjectIds = [
  "nas-to-s3",
  "resume-migration",
  "recommendation-load-test",
]

/** @param {string} visibleText */
export const assertPublicPortfolioVisibleText = visibleText => {
  assert.doesNotMatch(
    visibleText,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    "portfolio: no private email",
  )
  assert.doesNotMatch(
    visibleText,
    /(?:\+82[-.\s]?(?:0)?|0)(?:1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    "portfolio: no phone number",
  )
  assert.doesNotMatch(
    visibleText,
    /(?:localhost|intranet|사번|자격증\s*번호)/i,
    "portfolio: no internal host or credential-number pattern",
  )
  assert.equal(
    findPrivateIpv4Addresses(
      visibleText,
      candidate => isIP(candidate) === 4,
    ).length,
    0,
    "portfolio: no private IPv4",
  )
}

/** @param {string} source @param {string} className */
const readListTextsByClass = (source, className) => {
  const listMatch = source.match(
    new RegExp(
      `<ul\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/ul>`,
    ),
  )

  assert.ok(listMatch, `portfolio: ${className} list`)

  return [...listMatch[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
    .map(match => normalizeText(match[1]))
}

/** @param {string} html */
export const verifyPortfolioHtml = html => {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

  assert.ok(mainMatch, "portfolio: main landmark")

  const main = mainMatch[1]
  const h1Element = assertOneVisibleH1(html)

  assert.match(
    normalizeText(h1Element.content),
    /백엔드 개발자 포트폴리오$/,
    "portfolio: approved visible h1",
  )

  const projectArticles = [
    ...main.matchAll(
      /<article\b([^>]*\bclass="[^"]*\bportfolio-project\b[^"]*"[^>]*)>([\s\S]*?)<\/article>/g,
    ),
  ]

  assert.equal(
    projectArticles.length,
    projectContracts.length,
    "portfolio: exactly four project articles",
  )

  for (const [index, contract] of projectContracts.entries()) {
    const [, attributes, body] = projectArticles[index]
    const headingId = `project-${contract.id}`

    assert.equal(
      readAttribute(attributes, "aria-labelledby"),
      headingId,
      `${contract.id}: exact article label id`,
    )
    assert.match(
      body,
      new RegExp(`<h2\\b(?=[^>]*\\bid="${headingId}")[^>]*>`),
      `${contract.id}: exact project heading id`,
    )
    assert.match(
      normalizeText(body),
      new RegExp(
        contract.contribution.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ),
      `${contract.id}: approved contribution`,
    )
    assert.deepEqual(
      readListTextsByClass(body, "portfolio-project-technologies"),
      contract.technologies,
      `${contract.id}: exact shared technologies`,
    )
  }

  assert.equal(
    main.match(/\bclass="[^"]*\bportfolio-project-related-links\b[^"]*"/g)?.length ?? 0,
    0,
    "portfolio: no related-link sections when shared relatedLinks are empty",
  )

  assert.deepEqual(
    readListTextsByClass(main, "portfolio-hero-technology-list"),
    [
      "Java",
      "Spring Boot",
      "PostgreSQL",
      "MSSQL",
      "Kafka",
      "Redis",
      "AWS S3",
      "C#",
      "ASP.NET",
    ],
    "portfolio: exact shared core technologies",
  )

  const metricsMatch = main.match(
    /<dl\b[^>]*\bclass="[^"]*\bportfolio-metrics-list\b[^"]*"[^>]*>([\s\S]*?)<\/dl>/,
  )

  assert.ok(metricsMatch, "portfolio: metric list")

  const metricValues = [
    ...metricsMatch[1].matchAll(/<dd\b[^>]*>([\s\S]*?)<\/dd>/g),
  ].map(match => normalizeText(match[1]))

  assert.deepEqual(
    metricValues,
    ["17년", "약 800만 개", "1천만 건 이상", "0건"],
    "portfolio: four approved metric values",
  )

  const anchors = [...main.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
  const pdfAnchors = anchors.filter(([, attributes]) =>
    pdfPathPattern.test(readAttribute(attributes, "href")),
  )

  assert.equal(pdfAnchors.length, 2, "portfolio: hero and closing stable PDF anchors")
  for (const [, attributes, body] of pdfAnchors) {
    assert.equal(
      readAttribute(attributes, "href"),
      "/downloads/kwon-jongseong-backend-portfolio.pdf",
      "portfolio: stable PDF path",
    )
    assert.ok(
      hasBooleanAttribute(attributes, "download"),
      "portfolio: PDF anchor has download",
    )
    assert.equal(
      normalizeText(body),
      "PDF 다운로드 · 최신 갱신 2026.07.23",
      "portfolio: exact dated PDF action",
    )
  }

  const githubAnchors = anchors.filter(
    ([, attributes]) =>
      readAttribute(attributes, "href") === "https://github.com/macho199",
  )

  assert.equal(githubAnchors.length, 2, "portfolio: hero and closing GitHub links")
  assert.match(
    normalizeText(main),
    /AI 에이전트는 탐색·정리·추적에 사용/,
    "portfolio: AI-agent working style",
  )
  assert.match(
    normalizeText(main),
    /최종 판단과 검증은 개발자가 담당/,
    "portfolio: expert-judgment working style",
  )
  assert.match(
    normalizeText(main),
    /같은 공개 콘텐츠에서 생성한 최신 PDF입니다\./,
    "portfolio: single-source PDF freshness explanation",
  )

  assert.doesNotMatch(
    main,
    /\bstyle\s*=/i,
    "portfolio: no inline styles",
  )
  assertPublicPortfolioVisibleText(normalizeText(main))

  const canonicalLinks = [
    ...html.matchAll(
      /<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="https:\/\/macho199\.github\.io\/portfolio\/")[^>]*>/g,
    ),
  ]

  assert.equal(canonicalLinks.length, 1, "portfolio: exact canonical URL")
  assert.match(
    readAttribute(canonicalLinks[0][0], "href"),
    canonicalUrlPattern,
    "portfolio: canonical path",
  )
  assert.doesNotMatch(
    html,
    /<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*\bnoindex\b[^"]*")[^>]*>/i,
    "portfolio: no robots noindex meta",
  )

  console.log(
    "portfolio build verified: content, privacy, downloads, and SEO contracts passed",
  )
}

/** @param {string} html */
export const verifyPortfolioPrintHtml = html => {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

  assert.ok(mainMatch, "portfolio print: main landmark")

  const robotsMeta = [
    ...html.matchAll(
      /<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="noindex, nofollow")[^>]*>/gi,
    ),
  ]

  assert.equal(
    robotsMeta.length,
    1,
    "portfolio print: one noindex, nofollow robots meta",
  )
  assert.doesNotMatch(
    html,
    /\bclass="[^"]*\bsite-header\b[^"]*"/i,
    "portfolio print: no common site header",
  )
  assert.doesNotMatch(
    html,
    /\bclass="[^"]*\bsite-footer\b[^"]*"/i,
    "portfolio print: no common site footer",
  )
  assert.doesNotMatch(
    html,
    /\bclass="[^"]*\bscroll-to-top\b[^"]*"/i,
    "portfolio print: no scroll-to-top control",
  )
  assertPublicPortfolioVisibleText(normalizeText(mainMatch[1]))

  const pageElements = [
    ...html.matchAll(
      /<section\b([^>]*\bclass="[^"]*\bportfolio-print-page\b[^"]*"[^>]*)>/g,
    ),
  ]

  assert.equal(
    pageElements.length,
    9,
    "portfolio print: exactly nine print sections",
  )

  for (const [index, pageElement] of pageElements.entries()) {
    const pageNumber = index + 1
    const pageEnd =
      pageElements[index + 1]?.index ?? html.indexOf("</main>", pageElement.index)
    const pageHtml = html.slice(pageElement.index, pageEnd)
    const pageText = normalizeText(pageHtml)

    assert.equal(
      readAttribute(pageElement[1], "data-page"),
      String(pageNumber),
      `portfolio print: page ${pageNumber} data marker`,
    )
    assert.match(
      pageText,
      /권종성 백엔드 개발자 포트폴리오/,
      `portfolio print: page ${pageNumber} document name`,
    )
    assert.match(
      pageText,
      new RegExp(`${pageNumber} / 9`),
      `portfolio print: page ${pageNumber} label`,
    )
    assert.match(
      pageText,
      /업데이트 2026\.07\.23/,
      `portfolio print: page ${pageNumber} updated date`,
    )
    assert.match(
      pageText,
      canonicalUrlPattern,
      `portfolio print: page ${pageNumber} canonical web URL text`,
    )
  }

  const projectIds = [
    ...html.matchAll(/\bdata-project-id="([^"]+)"/g),
  ].map(match => match[1])

  assert.deepEqual(
    [...new Set(projectIds)],
    printProjectIds,
    "portfolio print: only three PDF project ids",
  )
  for (const projectId of printProjectIds) {
    assert.equal(
      projectIds.filter(id => id === projectId).length,
      2,
      `portfolio print: ${projectId} has two case-study pages`,
    )
  }

  console.log(
    "portfolio print build verified: noindex, shell, nine-page, project, and footer contracts passed",
  )
}

/**
 * @param {readonly Readonly<{ path: string, xml: string }>[]} sitemapFiles
 */
export const verifyPortfolioSitemaps = sitemapFiles => {
  assert.ok(
    sitemapFiles.length > 0,
    "portfolio print: generated sitemap XML files exist",
  )

  for (const sitemapFile of sitemapFiles) {
    assert.match(
      sitemapFile.xml,
      /<(?:sitemapindex|urlset)\b/,
      `${sitemapFile.path}: sitemap XML root`,
    )

    const locations = [
      ...sitemapFile.xml.matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map(match => match[1])

    for (const location of locations) {
      assert.doesNotMatch(
        location,
        /\/portfolio\/print\/?(?:$|[?#])/,
        `${sitemapFile.path}: excludes portfolio print location`,
      )
    }
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  const publicRoot = new URL("../public/", import.meta.url)
  const sitemapPaths = (await readdir(publicRoot, { recursive: true }))
    .filter(path => /(?:^|\/)sitemap[^/]*\.xml$/i.test(path))
    .sort()
  const [html, printHtml, sitemapFiles] = await Promise.all([
    readFile(new URL("../public/portfolio/index.html", import.meta.url), "utf8"),
    readFile(
      new URL("../public/portfolio/print/index.html", import.meta.url),
      "utf8",
    ),
    Promise.all(
      sitemapPaths.map(async path => ({
        path,
        xml: await readFile(new URL(path, publicRoot), "utf8"),
      })),
    ),
  ])

  verifyPortfolioHtml(html)
  verifyPortfolioPrintHtml(printHtml)
  verifyPortfolioSitemaps(sitemapFiles)
}
