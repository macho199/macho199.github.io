import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const repositoryRoot = new URL("../../", import.meta.url)
const require = createRequire(import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

test("renders typed post metadata without inactive controls", async () => {
  const postHeader = await readRepositoryFile("src/components/post-header.tsx")

  assert.match(postHeader, /export type PostHeaderData = Readonly<\{/)
  assert.match(postHeader, /title: string/)
  assert.match(postHeader, /description: string/)
  assert.match(postHeader, /tags: readonly string\[\]/)
  assert.match(postHeader, /publishedAt: string/)
  assert.match(postHeader, /publishedAtDisplay: string/)
  assert.match(postHeader, /<ul className="post-tags" aria-label="태그">/)
  assert.match(postHeader, /<span className="post-tag">\{tag\}<\/span>/)
  assert.match(postHeader, /<h1 className="post-title">\{post\.title\}<\/h1>/)
  assert.match(postHeader, /<p className="post-description">\{post\.description\}<\/p>/)
  assert.match(
    postHeader,
    /<time className="post-date" dateTime=\{post\.publishedAt\}>[\s\S]*\{post\.publishedAtDisplay\}[\s\S]*<\/time>/,
  )
  assert.doesNotMatch(postHeader, /<button\b|<a\b|<Link\b/)
})

test("keeps GraphQL and page composition in the post template", async () => {
  const postTemplate = await readRepositoryFile("src/templates/post.tsx")

  assert.match(postTemplate, /import PostHeader, \{ type PostHeaderData \}/)
  assert.match(
    postTemplate,
    /<nav className="post-back-nav" aria-label="게시글 탐색">[\s\S]*<Link to="\/" className="post-back-link">[\s\S]*게시글 목록[\s\S]*<\/Link>[\s\S]*<\/nav>/,
  )
  assert.match(
    postTemplate,
    /<article className="post-page">[\s\S]*<PostHeader post=\{frontmatter\} \/>[\s\S]*<div className="mdx-content">\{children\}<\/div>[\s\S]*<\/article>/,
  )
  assert.match(postTemplate, /publishedAt\(formatString: "YYYY-MM-DD"\)/)
  assert.match(
    postTemplate,
    /publishedAtDisplay: publishedAt\(formatString: "YYYY\.MM\.DD"\)/,
  )
  assert.doesNotMatch(postTemplate, /<h1\b|<button\b/)
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const sources = await Promise.all(
    ["src/components/post-header.tsx", "src/templates/post.tsx"].map(
      readRepositoryFile,
    ),
  )

  for (const source of sources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})

test("loads post styles once and keeps selectors inside post boundaries", async () => {
  const [browserEntry, postCss] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/post.css"),
  ])

  assert.equal(
    (browserEntry.match(/\.\/src\/styles\/post\.css/g) ?? []).length,
    1,
  )
  assert.match(postCss, /@layer components/)
  assert.match(postCss, /\.post-back-nav\s*\{/)
  assert.match(postCss, /\.post-page\s*\{/)
  assert.match(postCss, /\.post-page \.mdx-content\s*\{/)
  assert.match(postCss, /\.post-page \.mdx-content :where\(h2, h3, h4, h5\)/)
  assert.match(postCss, /\.post-page \.mdx-content pre\s*\{[^}]*overflow-x: auto/s)
  assert.match(postCss, /\.post-page \.mdx-content table\s*\{[^}]*overflow-x: auto/s)
  assert.match(postCss, /@media \(max-width: 1020px\)/)
  assert.match(postCss, /@media \(max-width: 720px\)/)
  assert.doesNotMatch(postCss, /(^|\n)\s*(?:h[1-6]|p|a|ul|ol|pre|table)\s*\{/)
})

test("keeps Korean post title words intact", async () => {
  const postCss = await readRepositoryFile("src/styles/post.css")
  const titleRule = postCss.match(/\.post-title\s*\{([^}]*)\}/s)

  assert.ok(titleRule, "post title style rule")
  assert.match(titleRule[1], /word-break:\s*keep-all/)
  assert.match(titleRule[1], /overflow-wrap:\s*break-word/)
  assert.doesNotMatch(titleRule[1], /overflow-wrap:\s*anywhere/)
})

test("keeps the post title on one line above the phone breakpoint", async () => {
  const postCss = await readRepositoryFile("src/styles/post.css")
  const titleRule = postCss.match(/\.post-title\s*\{([^}]*)\}/s)
  const phoneRule = postCss.match(
    /@media \(max-width: 720px\)[\s\S]*?\.post-title\s*\{([^}]*)\}/,
  )

  assert.ok(titleRule, "post title style rule")
  assert.ok(phoneRule, "phone post title style rule")
  assert.match(titleRule[1], /font-size:\s*clamp\(30px, 4vw, 36px\)/)
  assert.match(titleRule[1], /text-wrap:\s*nowrap/)
  assert.match(phoneRule[1], /text-wrap:\s*wrap/)
})

test("documents the current Gatsby rebuild and Tailwind fixes", async () => {
  const [post, oldSample] = await Promise.all([
    readRepositoryFile("content/posts/gatsby-blog-1-getting-started/index.mdx"),
    readRepositoryFile("content/posts/mdx-foundation/index.mdx"),
  ])

  assert.match(post, /title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기"/)
  assert.match(post, /slug: "gatsby-blog-1-getting-started"/)
  assert.match(post, /publishedAt: "2026-04-18"/)
  assert.match(
    post,
    /배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\./,
  )
  assert.match(post, /Gatsby \| 5\.16\.1/)
  assert.match(post, /Tailwind CSS \| 4\.3\.3/)
  assert.match(post, /"@tailwindcss\/postcss": \{\}/)
  assert.match(post, /@import "tailwindcss" source\("\.\.\/"\);/)
  assert.match(post, /제목 크기, 목록 마커, 링크 식별성/)
  assert.match(post, /4\.5:1/)
  assert.match(post, /npm run typecheck/)
  assert.match(post, /GitHub Actions 배포는 아직 연결하지 않았다/)
  assert.doesNotMatch(
    post,
    /2025|ERROR #98123|@mdx-js\/react|text-red-500|당시 GitHub Pages 배포 방식/,
  )
  assert.doesNotMatch(
    post,
    /hello-gatsby-tailwindcss\.png|github-pages-setting\.png/,
  )
  assert.equal(oldSample, "")
})

test("registers a production verifier for the approved post", async () => {
  const [packageSource, verifier] = await Promise.all([
    readRepositoryFile("package.json"),
    readRepositoryFile("scripts/verify-post-build.mjs"),
  ])
  const packageJson = JSON.parse(packageSource)

  assert.equal(
    packageJson.scripts["verify:post"],
    "node scripts/verify-post-build.mjs",
  )
  assert.match(verifier, /public[\s\S]*gatsby-blog-1-getting-started/)
  assert.match(verifier, /mdx-foundation/)
  assert.match(verifier, /create-a-blog-site-with-gatsby1/)
})

test("renders the Gatsby body without streaming text corruption", async () => {
  const ssrEntryUrl = new URL("gatsby-ssr.js", repositoryRoot)
  const ssrEntry = await readRepositoryFile("gatsby-ssr.js")

  assert.notEqual(ssrEntry, "", "gatsby-ssr.js must define the body renderer")

  const React = require("react")
  const { replaceRenderer } = require(fileURLToPath(ssrEntryUrl))
  const bodyText = "가나다라마바사아자차카타파하".repeat(200)
  let renderedBody = ""

  /** @param {string} html */
  const captureRenderedBody = html => {
    renderedBody = html
  }

  replaceRenderer({
    bodyComponent: React.createElement("p", null, bodyText),
    replaceBodyHTMLString: captureRenderedBody,
  })

  assert.equal(renderedBody, `<p>${bodyText}</p>`)
  assert.doesNotMatch(renderedBody, /\u0000/)
})

test("type-checks Gatsby JavaScript lifecycle entries", async () => {
  const tsconfig = JSON.parse(await readRepositoryFile("tsconfig.json"))

  assert.ok(tsconfig.include.includes("gatsby-*.js"))
})
