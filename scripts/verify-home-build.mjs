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

assert.equal(countOpeningTags("h1"), 1, "home: one page heading")
assert.equal(countClassedTags(main, "h1", "sr-only"), 1, "home: hidden h1")
assert.match(main, /<h1\b[^>]*>[\s\S]*?개발자 블로그[\s\S]*?<\/h1>/)
assert.match(
  main,
  /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의 엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
)

assert.equal(countClassedTags(main, "ol", "post-list"), 1, "home: one post list")
assert.ok(
  countClassedTags(main, "article", "post-card") >= 1,
  "home: real post cards",
)
assert.match(
  main,
  /<a\b(?=[^>]*href="\/posts\/gatsby-blog-1-getting-started\/")(?=[^>]*class="[^"]*post-card-title-link[^"]*")[^>]*>\s*Gatsby로 블로그 사이트 만들기 1편 - 시작하기\s*<\/a>/,
)
for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(main, new RegExp(`<span class="post-card-tag">${tag}</span>`))
}
assert.match(
  main,
  /배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="2026-04-18")[^>]*>\s*2026\.04\.18\s*<\/time>/i,
)
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
