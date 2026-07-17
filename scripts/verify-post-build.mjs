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
  /Gatsby와 GitHub Pages로 개발자 블로그를 시작하며 정적 사이트 생성 방식, 프로젝트 설정, Tailwind CSS 확인, 당시 배포 과정을 정리합니다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-date[^"]*")(?=[^>]*datetime="2025-08-31")[^>]*>\s*2025\.08\.31\s*<\/time>/i,
)

for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(main, new RegExp(`<span class="post-tag">${tag}</span>`))
}

for (const heading of [
  "개발자를 위한 블로그 구축",
  "정적 사이트 생성기(SSG) 이해하기",
  "Gatsby 프로젝트 생성",
  "당시 Tailwind CSS 오류와 현재의 판단",
  "프로덕션 빌드 확인",
  "당시 GitHub Pages 배포 방식",
  "마치며",
]) {
  assert.match(main, new RegExp(`<h2[^>]*>${heading.replace(/[()]/g, "\\$&")}</h2>`))
}

assert.match(main, /<blockquote>/)
assert.match(main, /<ol>/)
assert.match(main, /<ul>/)
assert.match(main, /<pre><code class="language-shell">/)
assert.match(main, /<code>npm init gatsby<\/code>/)
assert.match(
  main,
  /<img\b(?=[^>]*src="\/images\/posts\/gatsby-blog-1-getting-started\/hello-gatsby-tailwindcss\.png")(?=[^>]*alt="Gatsby 시작 화면의 제목에 Tailwind CSS 색상 클래스를 적용한 모습")[^>]*>/,
)
assert.match(
  main,
  /<img\b(?=[^>]*src="\/images\/posts\/gatsby-blog-1-getting-started\/github-pages-setting\.png")(?=[^>]*alt="GitHub Pages 설정에서 main 브랜치와 루트 폴더를 배포 소스로 선택한 모습")[^>]*>/,
)

assert.match(
  html,
  /<title[^>]*>Gatsby로 블로그 사이트 만들기 1편 - 시작하기 \| Developer Blog<\/title>/,
)
assert.match(
  html,
  /<meta\b(?=[^>]*name="description")(?=[^>]*content="Gatsby와 GitHub Pages로 개발자 블로그를 시작하며 정적 사이트 생성 방식, 프로젝트 설정, Tailwind CSS 확인, 당시 배포 과정을 정리합니다\.")[^>]*>/,
)
assert.match(
  html,
  /<link\b(?=[^>]*rel="canonical")(?=[^>]*href="https:\/\/macho199\.github\.io\/posts\/gatsby-blog-1-getting-started\/")[^>]*>/,
)
assert.match(
  html,
  /<meta\b(?=[^>]*property="article:published_time")(?=[^>]*content="2025-08-31")[^>]*>/,
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
assert.doesNotMatch(main, /이전 글|다음 글|관련 글|분 읽기/)

await Promise.all([
  access(
    new URL(
      "images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png",
      publicRoot,
    ),
  ),
  access(
    new URL(
      "images/posts/gatsby-blog-1-getting-started/github-pages-setting.png",
      publicRoot,
    ),
  ),
])

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

console.log("post build verified: reading screen, metadata, assets, and route contracts passed")
