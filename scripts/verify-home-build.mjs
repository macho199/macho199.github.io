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
    path: "/posts/gatsby-blog-3-graphql-page-generation/",
    title: "Gatsby로 블로그 만들기 3편 - GraphQL 페이지 생성",
    description:
      "Gatsby 데이터 레이어에서 MDX 글을 조회해 홈 목록과 정적 상세 페이지, SEO·sitemap까지 연결한 흐름을 정리합니다.",
    publishedAt: "2026-06-27",
    publishedAtDisplay: "2026.06.27",
    tags: ["Gatsby", "GraphQL", "MDX", "SEO"],
  },
  {
    path: "/posts/gatsby-blog-2-managing-mdx-posts/",
    title: "Gatsby로 블로그 만들기 2편 - MDX 포스트 관리",
    description:
      "MDX 글을 디렉터리 단위로 관리하고 frontmatter 스키마와 빌드 전 검증으로 잘못된 날짜·slug·태그를 차단한 과정을 정리합니다.",
    publishedAt: "2026-05-16",
    publishedAtDisplay: "2026.05.16",
    tags: ["Gatsby", "MDX", "GraphQL", "Validation"],
  },
  {
    path: "/posts/gatsby-blog-1-getting-started/",
    title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기",
    description:
      "배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다.",
    publishedAt: "2026-04-18",
    publishedAtDisplay: "2026.04.18",
    tags: ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"],
  },
]

assert.equal(countOpeningTags("h1"), 1, "home: one page heading")
assert.equal(countClassedTags(main, "h1", "sr-only"), 1, "home: hidden h1")
assert.match(main, /<h1\b[^>]*>[\s\S]*?개발자 블로그[\s\S]*?<\/h1>/)
assert.match(
  main,
  /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의 엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
)

assert.equal(countClassedTags(main, "ol", "post-list"), 1, "home: one post list")
assert.equal(
  countClassedTags(main, "article", "post-card"),
  postContracts.length,
  "home: exact real post card count",
)

for (const post of postContracts) {
  assert.match(
    main,
    new RegExp(
      `<a\\b(?=[^>]*href="${escapeRegex(post.path)}")(?=[^>]*class="[^"]*post-card-title-link[^"]*")[^>]*>\\s*${escapeRegex(post.title)}\\s*</a>`,
    ),
  )
  assert.match(main, new RegExp(escapeRegex(post.description)))
  assert.match(
    main,
    new RegExp(
      `<time\\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="${post.publishedAt}")[^>]*>\\s*${escapeRegex(post.publishedAtDisplay)}\\s*</time>`,
      "i",
    ),
  )
  for (const tag of post.tags) {
    assert.match(
      main,
      new RegExp(`<span class="post-card-tag">${escapeRegex(tag)}</span>`),
    )
  }
}

const postPaths = [
  ...main.matchAll(
    /<a\b(?=[^>]*class="[^"]*post-card-title-link[^"]*")(?=[^>]*href="([^"]+)")[^>]*>/g,
  ),
].map(match => match[1])
const expectedPostPaths = postContracts.map(post => post.path)

assert.deepEqual(postPaths, expectedPostPaths, "home: newest post first")
assert.doesNotMatch(main, /\/posts\/mdx-foundation\//)

assert.equal(countOpeningTags("button"), 0, "home: no inactive controls")
assert.doesNotMatch(
  main,
  /class="[^"]*(?:filter-bar|pagination|result-count)[^"]*"/,
)
assert.doesNotMatch(main, /\b\d+\s+posts?\b/i)

console.log(
  "home build verified: actual MDX list and static screen contracts passed",
)
