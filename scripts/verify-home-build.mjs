import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8")
const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

assert.ok(mainMatch, "home: main landmark")

const main = mainMatch[1]

assert.match(
  html,
  /\.sr-only\{(?=[^}]*position:absolute)(?=[^}]*overflow:hidden)(?=[^}]*clip-path:inset\(50%\))[^}]*\}/,
  "home: generated sr-only utility",
)

/**
 * @param {string} source
 * @param {string} tag
 * @param {string} className
 */
const countClassedTags = (source, tag, className) =>
  source.match(
    new RegExp(`<${tag}\\b(?=[^>]*class="[^"]*${className}[^"]*")[^>]*>`, "g"),
  )?.length ?? 0

/** @param {string} tag */
const countOpeningTags = tag =>
  main.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const postContracts = [
  {
    path: "/posts/gatsby-google-search-console-seo/",
    title: "Gatsby 블로그를 Google 검색에 연결하기: Search Console·sitemap·구조화 데이터",
    description:
      "Gatsby 블로그의 Google Search Console 소유권을 확인하고 robots.txt·sitemap·BlogPosting 구조화 데이터를 연결한 뒤, 가져오기 오류를 진단해 성공 상태까지 확인한 과정을 설명합니다.",
    publishedAt: "2026-07-20",
    publishedAtDisplay: "2026.07.20",
    tags: ["Gatsby", "Google Search Console", "SEO", "Sitemap"],
  },
  {
    path: "/posts/gatsby-blog-reading-experience/",
    title: "긴 기술 글을 읽기 쉽게: Gatsby 블로그 읽기 경험 개선기",
    description:
      "코드 구문 강조, 복사 인터랙션, MDX 목차와 맨 위로 이동 기능을 연결해 긴 기술 글의 읽기 경험을 개선한 과정을 설명합니다.",
    publishedAt: "2026-07-19",
    publishedAtDisplay: "2026.07.19",
    tags: ["Gatsby", "MDX", "React", "Accessibility"],
  },
  {
    path: "/posts/custom-developer-blog-with-tailwind-css/",
    title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기",
    description:
      "Tailwind CSS 디자인 토큰, 로컬 폰트, 824px 레이아웃과 반응형 규칙을 적용해 자신만의 개발자 블로그 UI를 만드는 과정을 설명합니다.",
    publishedAt: "2026-06-27",
    publishedAtDisplay: "2026.06.27",
    tags: ["Tailwind CSS", "React", "Responsive Web", "Accessibility"],
  },
  {
    path: "/posts/gatsby-mdx-graphql-post-system/",
    title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기",
    description:
      "MDX 파일 구조와 frontmatter 계약을 정의하고 Gatsby GraphQL로 목록과 상세 페이지를 생성하는 콘텐츠 파이프라인을 설명합니다.",
    publishedAt: "2026-05-16",
    publishedAtDisplay: "2026.05.16",
    tags: ["Gatsby", "MDX", "GraphQL", "Validation"],
  },
  {
    path: "/posts/why-github-pages-and-gatsby/",
    title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기",
    description:
      "무료 정적 호스팅과 React 기반 UI라는 요구사항에서 GitHub Pages와 Gatsby를 선택하고, 배포 파일만 남은 블로그를 소스 프로젝트로 재구축한 과정을 설명합니다.",
    publishedAt: "2026-04-18",
    publishedAtDisplay: "2026.04.18",
    tags: ["Gatsby", "GitHub Pages", "React", "SSG"],
  },
]

const expectedFilterTags = [
  "Gatsby",
  "Google Search Console",
  "SEO",
  "Sitemap",
  "MDX",
  "React",
  "Accessibility",
  "Tailwind CSS",
  "Responsive Web",
  "GraphQL",
  "Validation",
  "GitHub Pages",
  "SSG",
]

assert.equal(countOpeningTags("h1"), 1, "home: one page heading")
assert.equal(countClassedTags(main, "h1", "sr-only"), 1, "home: hidden h1")
assert.match(main, /<h1\b[^>]*>[\s\S]*?개발자 블로그[\s\S]*?<\/h1>/)
assert.match(
  main,
  /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의 엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
)

assert.equal(countClassedTags(main, "ol", "post-list"), 1, "home: one post list")
const postCards = [
  ...main.matchAll(
    /<article\b(?=[^>]*class="[^"]*\bpost-card\b[^"]*")[^>]*>[\s\S]*?<\/article>/g,
  ),
].map(match => match[0])

assert.equal(
  postCards.length,
  postContracts.length,
  "home: exact real post card count",
)

for (const [index, post] of postContracts.entries()) {
  const postCard = postCards[index]

  assert.match(
    postCard,
    new RegExp(
      `<a\\b(?=[^>]*href="${escapeRegex(post.path)}")(?=[^>]*class="[^"]*post-card-title-link[^"]*")[^>]*>\\s*${escapeRegex(post.title)}\\s*</a>`,
    ),
  )
  assert.match(postCard, new RegExp(escapeRegex(post.description)))
  assert.match(
    postCard,
    new RegExp(
      `<time\\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="${post.publishedAt}")[^>]*>\\s*${escapeRegex(post.publishedAtDisplay)}\\s*</time>`,
      "i",
    ),
  )

  const postCardTags = [
    ...postCard.matchAll(
      /<span\b(?=[^>]*class="[^"]*\bpost-card-tag\b[^"]*")[^>]*>([^<]*)<\/span>/g,
    ),
  ].map(match => match[1])

  assert.deepEqual(postCardTags, post.tags, `${post.path}: exact tags`)
}

const postPaths = postCards.map(postCard =>
  postCard.match(
    /<a\b(?=[^>]*class="[^"]*post-card-title-link[^"]*")(?=[^>]*href="([^"]+)")[^>]*>/,
  )?.[1],
)
const expectedPostPaths = postContracts.map(post => post.path)

assert.deepEqual(postPaths, expectedPostPaths, "home: newest post first")
assert.doesNotMatch(main, /\/posts\/mdx-foundation\//)

assert.equal(
  countClassedTags(main, "section", "post-filter-toolbar"),
  1,
  "home: one filter toolbar",
)
const toolbarMatch = main.match(
  /<section\b(?=[^>]*class="[^"]*\bpost-filter-toolbar\b[^"]*")(?=[^>]*aria-label="글 필터")[^>]*>([\s\S]*?)<\/section>/,
)

assert.ok(toolbarMatch, "home: labelled post filter toolbar")

const toolbar = toolbarMatch[1]

assert.match(
  toolbar,
  /<span\b(?=[^>]*class="[^"]*\bpost-filter-label\b[^"]*")(?=[^>]*aria-hidden="true")[^>]*>\s*태그 필터\s*<\/span>/,
  "home: visible mobile tag filter label",
)

const groupMatches = toolbar.match(
  /<div\b(?=[^>]*class="[^"]*\bpost-filter-options\b[^"]*")(?=[^>]*role="group")(?=[^>]*aria-label="태그 필터")[^>]*>/g,
) ?? []

assert.equal(groupMatches.length, 1, "home: one labelled tag filter group")

const filterButtons = [
  ...toolbar.matchAll(
    /<button\b([^>]*class="[^"]*\bpost-filter-button\b[^"]*"[^>]*)>([^<]*)<\/button>/g,
  ),
].map(match => ({
  attributes: match[1],
  label: match[2].trim(),
}))

assert.deepEqual(
  filterButtons.map(button => button.label),
  ["전체", ...expectedFilterTags],
  "home: exact filter labels in first appearance order",
)
assert.equal(countOpeningTags("button"), filterButtons.length, "home: only filter buttons")
assert.equal(
  filterButtons.filter(button => /\baria-pressed="true"/.test(button.attributes)).length,
  1,
  "home: one initially selected filter",
)
assert.match(filterButtons[0].attributes, /\baria-pressed="true"/)
assert.match(filterButtons[0].attributes, /\bdata-filter-kind="all"/)

for (const button of filterButtons.slice(1)) {
  assert.match(button.attributes, /\baria-pressed="false"/)
  assert.match(button.attributes, /\bdata-filter-kind="tag"/)
}

assert.match(
  toolbar,
  /<p\b(?=[^>]*class="[^"]*\bpost-filter-count\b[^"]*")(?=[^>]*role="status")(?=[^>]*aria-live="polite")[^>]*>\s*5 posts\s*<\/p>/,
  "home: initial post result count",
)
assert.doesNotMatch(
  main,
  /class="[^"]*(?:pagination|search-input)[^"]*"/,
)

console.log(
  "home build verified: actual MDX list, initial filters, and static screen contracts passed",
)
