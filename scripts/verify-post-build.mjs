import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"

const publicRoot = new URL("../public/", import.meta.url)
const postUrl = new URL(
  "posts/gatsby-blog-1-getting-started/index.html",
  publicRoot,
)
const html = await readFile(postUrl, "utf8")
const sitemap = await readFile(new URL("sitemap-0.xml", publicRoot), "utf8")
const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

assert.doesNotMatch(html, /\u0000/, "post: generated HTML contains no NUL bytes")
assert.ok(mainMatch, "post: main landmark")

const main = mainMatch[1]

/** @param {string} tag */
const countOpeningTags = tag =>
  main.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

assert.equal(countOpeningTags("h1"), 1, "post: one page heading")
assert.match(main, /<nav\b[^>]*aria-label="게시글 탐색"[^>]*>/)
assert.match(
  main,
  /<a\b(?=[^>]*href="\/")(?=[^>]*class="[^"]*post-back-link[^"]*")[^>]*>\s*← 게시글 목록\s*<\/a>/,
)
assert.match(main, /<article\b[^>]*class="[^"]*post-page[^"]*"[^>]*>/)
assert.match(
  main,
  /<h1\b[^>]*class="[^"]*post-title[^"]*"[^>]*>Gatsby로 블로그 사이트 만들기 1편 - 시작하기<\/h1>/,
)
assert.match(
  main,
  /배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-date[^"]*")(?=[^>]*datetime="2026-04-18")[^>]*>\s*2026\.04\.18\s*<\/time>/i,
)

for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(main, new RegExp(`<span class="post-tag">${tag}</span>`))
}

for (const heading of [
  "왜 소스부터 다시 구축했는가",
  "재현 가능한 Gatsby 5 기준선",
  "MDX와 Tailwind를 별도 단계로 나눈 이유",
  "Tailwind CSS 4와 PostCSS 연결",
  "Preflight 이후 사라진 문서 의미 복원",
  "로컬 폰트와 외부 요청 경계",
  "검증과 현재 배포 경계",
  "마치며",
]) {
  assert.match(main, new RegExp(`<h2[^>]*>${heading}</h2>`))
}

assert.match(main, /<blockquote>/)
assert.match(main, /<ol>/)
assert.match(main, /<ul>/)
assert.match(main, /<table>/)
assert.match(main, /<pre><code class="language-shell">/)
assert.match(main, /<pre><code class="language-javascript">/)
assert.match(main, /<pre><code class="language-css">/)
assert.match(main, /<pre><code class="language-shell">npm ci\s*<\/code><\/pre>/)
assert.match(main, /제목 크기, 목록 마커, 링크 식별성/)
assert.match(main, /4\.5:1/)
assert.match(main, /GitHub Actions 배포는 아직 연결하지 않았다/)
assert.doesNotMatch(
  main,
  /2025|ERROR #98123|@mdx-js\/react|text-red-500|hello-gatsby-tailwindcss\.png|github-pages-setting\.png/,
)

assert.match(
  html,
  /<title[^>]*>Gatsby로 블로그 사이트 만들기 1편 - 시작하기 \| Developer Blog<\/title>/,
)
assert.match(
  html,
  /<meta\b(?=[^>]*name="description")(?=[^>]*content="배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\.")[^>]*>/,
)
assert.match(
  html,
  /<link\b(?=[^>]*rel="canonical")(?=[^>]*href="https:\/\/macho199\.github\.io\/posts\/gatsby-blog-1-getting-started\/")[^>]*>/,
)
assert.match(
  html,
  /<meta\b(?=[^>]*property="article:published_time")(?=[^>]*content="2026-04-18")[^>]*>/,
)
for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(
    html,
    new RegExp(
      `<meta\\b(?=[^>]*property="article:tag")(?=[^>]*content="${tag}")[^>]*>`,
    ),
  )
}

assert.equal(countOpeningTags("button"), 0, "post: no inactive buttons")
assert.doesNotMatch(
  main,
  /class="[^"]*(?:table-of-contents|code-copy|reading-time|related-posts|post-pagination)[^"]*"/,
)
assert.doesNotMatch(
  main,
  />\s*(?:이전 글|다음 글|관련 글|\d+\s*분 읽기)\s*</,
)

for (const retiredPath of [
  "posts/mdx-foundation/index.html",
  "posts/create-a-blog-site-with-gatsby1/index.html",
]) {
  await assert.rejects(
    access(new URL(retiredPath, publicRoot)),
    error => error?.code === "ENOENT",
    `post: retired route must not be generated: ${retiredPath}`,
  )
}

assert.match(
  sitemap,
  /https:\/\/macho199\.github\.io\/posts\/gatsby-blog-1-getting-started\//,
)
assert.doesNotMatch(sitemap, /\/posts\/mdx-foundation\//)
assert.doesNotMatch(sitemap, /\/posts\/create-a-blog-site-with-gatsby1\//)

console.log(
  "post build verified: current Gatsby rebuild content, metadata, and route contracts passed",
)
