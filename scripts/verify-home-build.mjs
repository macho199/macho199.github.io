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
  /<a\b(?=[^>]*href="\/posts\/mdx-foundation\/")(?=[^>]*class="[^"]*post-card-title-link[^"]*")[^>]*>\s*MDX 콘텐츠 기반 확인\s*<\/a>/,
)
assert.match(main, /<span class="post-card-tag">Gatsby<\/span>/)
assert.match(main, /<span class="post-card-tag">MDX<\/span>/)
assert.match(
  main,
  /Gatsby가 로컬 MDX 파일을 소싱하고 포스트 페이지를 생성하는지 확인한다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="2026-07-17")[^>]*>\s*2026\.07\.17\s*<\/time>/i,
)

assert.equal(countOpeningTags("button"), 0, "home: no inactive controls")
assert.doesNotMatch(
  main,
  /class="[^"]*(?:filter-bar|pagination|result-count)[^"]*"/,
)
assert.doesNotMatch(main, /\b\d+\s+posts?\b/i)

console.log(
  "home build verified: actual MDX list and static screen contracts passed",
)
