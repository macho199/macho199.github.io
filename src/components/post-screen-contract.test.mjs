import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"
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

test("uses the approved real post and local image assets", async () => {
  const [post, oldSample] = await Promise.all([
    readRepositoryFile("content/posts/gatsby-blog-1-getting-started/index.mdx"),
    readRepositoryFile("content/posts/mdx-foundation/index.mdx"),
  ])

  assert.match(post, /title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기"/)
  assert.match(post, /slug: "gatsby-blog-1-getting-started"/)
  assert.match(post, /publishedAt: "2025-08-31"/)
  assert.match(post, /2026년 재구축 과정에서 다시 검증하고 보수적으로 다듬었습니다/)
  assert.match(post, /npm init gatsby/)
  assert.match(post, /npm run serve/)
  assert.match(
    post,
    /\/images\/posts\/gatsby-blog-1-getting-started\/hello-gatsby-tailwindcss\.png/,
  )
  assert.match(
    post,
    /\/images\/posts\/gatsby-blog-1-getting-started\/github-pages-setting\.png/,
  )
  assert.doesNotMatch(post, /npm install -g gatsby-cli|npm audit fix/)
  assert.match(post, /`file:\/\/` 주소로 직접 열면/)
  assert.equal(oldSample, "")

  await Promise.all([
    access(
      new URL(
        "static/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png",
        repositoryRoot,
      ),
    ),
    access(
      new URL(
        "static/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png",
        repositoryRoot,
      ),
    ),
  ])
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
