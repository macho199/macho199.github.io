import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

test("renders one hidden home heading and the approved introduction", async () => {
  const homeIntro = await readRepositoryFile("src/components/home-intro.tsx")

  assert.match(
    homeIntro,
    /<h1 id="home-title" className="sr-only">[\s\S]*개발자 블로그[\s\S]*<\/h1>/,
  )
  assert.match(
    homeIntro,
    /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의\s+엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
  )
})

test("renders a typed post card with informational tags and real metadata", async () => {
  const postCard = await readRepositoryFile("src/components/post-card.tsx")

  assert.match(postCard, /export type PostSummary = Readonly<\{/)
  assert.match(postCard, /<ul className="post-card-tags" aria-label="태그">/)
  assert.match(postCard, /<span className="post-card-tag">\{tag\}<\/span>/)
  assert.match(
    postCard,
    /<Link[\s\S]*?to=\{`\/posts\/\$\{post\.slug\}\/`\}[\s\S]*?className="post-card-title-link"[\s\S]*?>/,
  )
  assert.match(
    postCard,
    /<time className="post-card-date" dateTime=\{post\.publishedAt\}>[\s\S]*\{post\.publishedAtDisplay\}[\s\S]*<\/time>/,
  )
  assert.doesNotMatch(postCard, /<button\b/)
})

test("renders an ordered post list or the approved empty state", async () => {
  const postList = await readRepositoryFile("src/components/post-list.tsx")

  assert.match(postList, /import PostFilterBar from "\.\/post-filter-bar"/)
  assert.match(postList, /ALL_POSTS_FILTER/)
  assert.match(postList, /collectPostTags/)
  assert.match(postList, /filterPostsByTag/)
  assert.match(
    postList,
    /React\.useState<string \| null>\([\s\S]*ALL_POSTS_FILTER,[\s\S]*\)/,
  )
  assert.match(
    postList,
    /<section className="home-posts" aria-labelledby="home-posts-title">/,
  )
  assert.match(
    postList,
    /<h2 id="home-posts-title" className="sr-only">[\s\S]*게시글 목록[\s\S]*<\/h2>/,
  )
  assert.match(postList, /<ol className="post-list">/)
  assert.match(postList, /<li key=\{post\.id\} className="post-list-item">/)
  assert.match(postList, /<PostCard post=\{post\} \/>/)
  assert.match(
    postList,
    /<PostFilterBar[\s\S]*tags=\{tags\}[\s\S]*selectedTag=\{activeTag\}[\s\S]*resultCount=\{visiblePosts\.length\}[\s\S]*onSelect=\{setSelectedTag\}[\s\S]*\/>/,
  )
  assert.match(postList, /visiblePosts\.map\(post =>/)
  assert.match(postList, /아직 게시글이 없습니다\./)
  assert.match(postList, /선택한 태그에 해당하는 글이 없습니다\./)
})

test("renders an accessible single-select tag filter and result count", async () => {
  const filterBar = await readRepositoryFile(
    "src/components/post-filter-bar.tsx",
  )

  assert.match(filterBar, /aria-label="글 필터"/)
  assert.match(filterBar, /role="group" aria-label="태그 필터"/)
  assert.match(filterBar, /<button/)
  assert.match(filterBar, /type="button"/)
  assert.match(filterBar, /aria-pressed=\{isSelected\}/)
  assert.match(filterBar, /key=\{isAll \? "filter:all" : `filter:tag:\$\{tag\}`\}/)
  assert.match(filterBar, /onClick=\{\(\) => onSelect\(tag\)\}/)
  assert.match(filterBar, /role="status"/)
  assert.match(filterBar, /aria-live="polite"/)
  assert.match(filterBar, /count === 1 \? "post" : "posts"/)
})

test("groups mobile tags under a compact result header", async () => {
  const [filterBar, homeCss] = await Promise.all([
    readRepositoryFile("src/components/post-filter-bar.tsx"),
    readRepositoryFile("src/styles/home.css"),
  ])

  assert.match(
    filterBar,
    /{tags\.length > 0 \? \([\s\S]*<span className="post-filter-label" aria-hidden="true">[\s\S]*태그 필터[\s\S]*<\/span>[\s\S]*<div className="post-filter-options"/,
  )
  assert.match(homeCss, /\.post-filter-label\s*\{[^}]*display:\s*none/s)
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-toolbar\s*\{(?=[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto)(?=[^}]*column-gap:\s*var\(--space-3\))(?=[^}]*row-gap:\s*var\(--space-2\))(?=[^}]*margin-bottom:\s*var\(--space-3\))[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-label\s*\{(?=[^}]*display:\s*block)(?=[^}]*grid-column:\s*1)(?=[^}]*grid-row:\s*1)[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-options\s*\{(?=[^}]*grid-column:\s*1\s*\/\s*-1)(?=[^}]*grid-row:\s*2)[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-count\s*\{(?=[^}]*grid-column:\s*2)(?=[^}]*grid-row:\s*1)(?=[^}]*justify-self:\s*end)[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-count:only-child\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  )
})

test("uses predictable wrapping for home post card titles", async () => {
  const homeCss = await readRepositoryFile("src/styles/home.css")
  const titleRule = homeCss.match(/\.post-card-title\s*\{([^}]*)\}/s)
  const linkRule = homeCss.match(/\.post-card-title-link\s*\{([^}]*)\}/s)

  assert.ok(titleRule)
  assert.ok(linkRule)
  assert.match(titleRule[1], /text-wrap:\s*wrap/)
  assert.doesNotMatch(titleRule[1], /text-wrap:\s*balance/)
  assert.match(linkRule[1], /word-break:\s*keep-all/)
  assert.match(linkRule[1], /overflow-wrap:\s*break-word/)
  assert.doesNotMatch(linkRule[1], /overflow-wrap:\s*anywhere/)
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const componentSources = await Promise.all(
    [
      "src/components/home-intro.tsx",
      "src/components/post-card.tsx",
      "src/components/post-filter-bar.tsx",
      "src/components/post-list.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of componentSources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})

test("keeps GraphQL in the page and loads scoped home styles", async () => {
  const [indexPage, browserEntry, homeCss] = await Promise.all([
    readRepositoryFile("src/pages/index.tsx"),
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/home.css"),
  ])

  assert.match(indexPage, /import HomeIntro from "\.\.\/components\/home-intro"/)
  assert.match(indexPage, /import PostList from "\.\.\/components\/post-list"/)
  assert.match(indexPage, /import type \{ PostSummary \}/)
  assert.match(indexPage, /data\.allMdx\.nodes\.map/)
  assert.match(indexPage, /<HomeIntro \/>/)
  assert.match(indexPage, /<PostList posts=\{posts\} \/>/)
  assert.match(indexPage, /allMdx\(sort: \{ frontmatter: \{ publishedAt: DESC \} \}\)/)
  assert.match(
    indexPage,
    /publishedAt\(formatString: "YYYY-MM-DD"\)/,
  )
  assert.match(indexPage, /publishedAtDisplay: publishedAt\(formatString: "YYYY\.MM\.DD"\)/)
  assert.doesNotMatch(indexPage, /<article\b|<Link\b/)

  assert.match(browserEntry, /\.\/src\/styles\/home\.css/)
  assert.match(
    homeCss,
    /\.home-intro\s*\{[^}]*padding-block: var\(--space-8\) var\(--space-4\)/s,
  )
  assert.match(homeCss, /\.post-card-main\s*\{[^}]*max-width: 760px/s)
  assert.match(
    homeCss,
    /\.post-list\s*\{[^}]*border-top: 1px solid var\(--border\)/s,
  )
  assert.match(
    homeCss,
    /\.post-list-item\s*\{[^}]*border-bottom: 1px solid var\(--border\)/s,
  )
  assert.match(
    homeCss,
    /\.post-filter-toolbar\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/s,
  )
  assert.match(
    homeCss,
    /\.post-filter-options\s*\{[^}]*flex-wrap: wrap/s,
  )
  assert.match(
    homeCss,
    /\.post-filter-button\.is-active\s*\{[^}]*text-decoration: underline/s,
  )
  assert.match(homeCss, /\.post-filter-button:focus-visible\s*\{/)
})

test("registers the production home verifier", async () => {
  const [packageSource, verifier, layoutVerifier] = await Promise.all([
    readRepositoryFile("package.json"),
    readRepositoryFile("scripts/verify-home-build.mjs"),
    readRepositoryFile("scripts/verify-layout-build.mjs"),
  ])
  const packageJson = JSON.parse(packageSource)

  assert.equal(
    packageJson.scripts["verify:home"],
    "node scripts/verify-home-build.mjs",
  )
  assert.match(verifier, /public\/index\.html/)
  assert.match(verifier, /mdx-foundation/)
  assert.match(verifier, /gatsby-blog-3-graphql-page-generation/)
  assert.match(verifier, /gatsby-blog-2-managing-mdx-posts/)
  assert.match(verifier, /gatsby-blog-1-getting-started/)
  assert.match(verifier, /const postCards = \[/)
  assert.match(verifier, /const postCard = postCards\[index\]/)
  assert.match(verifier, /assert\.deepEqual\(postCardTags, post\.tags/)
  assert.match(verifier, /assert\.deepEqual\(postPaths, expectedPostPaths/)
  assert.match(verifier, /expectedFilterTags/)
  assert.match(verifier, /post-filter-toolbar/)
  assert.match(verifier, /post-filter-button/)
  assert.match(verifier, /aria-pressed/)
  assert.match(verifier, /3 posts/)
  assert.match(verifier, /Tailwind CSS/)
  assert.match(layoutVerifier, /favicon\.png/)
  assert.match(layoutVerifier, /dde3fd00fdda954cef45373e2dc0467cde694d66e8c626749edeceed15359c7c/)
})
