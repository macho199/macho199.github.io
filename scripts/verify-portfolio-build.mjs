import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

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
  { id: "nas-to-s3", contribution: "2인 팀 · 60%" },
  { id: "resume-migration", contribution: "팀 프로젝트 · 30%" },
  { id: "recommendation-load-test", contribution: "팀 프로젝트 · 30%" },
  { id: "data-pulse", contribution: "팀 프로젝트 · 30%" },
]

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
  }

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

  assert.equal(pdfAnchors.length, 1, "portfolio: one stable PDF anchor")
  assert.equal(
    readAttribute(pdfAnchors[0][1], "href"),
    "/downloads/kwon-jongseong-backend-portfolio.pdf",
    "portfolio: stable PDF path",
  )
  assert.ok(
    hasBooleanAttribute(pdfAnchors[0][1], "download"),
    "portfolio: PDF anchor has download",
  )

  const githubAnchors = anchors.filter(
    ([, attributes]) =>
      readAttribute(attributes, "href") === "https://github.com/macho199",
  )

  assert.equal(githubAnchors.length, 1, "portfolio: one GitHub link")

  assert.doesNotMatch(
    main,
    /\bstyle\s*=/i,
    "portfolio: no inline styles",
  )
  assert.doesNotMatch(
    main,
    /(?:\+82[-.\s]?(?:0)?|0)(?:1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    "portfolio: no phone number",
  )
  assert.doesNotMatch(
    main,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    "portfolio: no private email",
  )
  assert.doesNotMatch(
    main,
    /(?:localhost|intranet|사번|자격증\s*번호)/i,
    "portfolio: no internal host or credential-number pattern",
  )

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

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  const html = await readFile(new URL("../public/portfolio/index.html", import.meta.url), "utf8")
  verifyPortfolioHtml(html)
}
