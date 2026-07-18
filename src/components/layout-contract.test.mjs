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

test("defines a shared Header, main, and Footer shell", async () => {
  const [layout, header, footer, container] = await Promise.all([
    readRepositoryFile("src/components/layout.tsx"),
    readRepositoryFile("src/components/header.tsx"),
    readRepositoryFile("src/components/footer.tsx"),
    readRepositoryFile("src/components/content-container.tsx"),
  ])

  assert.match(
    layout,
    /<div className="site-shell">[\s\S]*<Header \/>[\s\S]*<main id="content" className="site-main">[\s\S]*\{children\}[\s\S]*<Footer \/>/,
  )
  assert.match(header, /<header className="site-header">/)
  assert.match(header, /<Link to="\/" className="site-logo"[^>]*>\s*kjs\.log\s*<\/Link>/)
  assert.equal((header.match(/<Link\b/g) ?? []).length, 1)
  assert.match(
    header,
    /const GITHUB_PROFILE_URL = "https:\/\/github\.com\/macho199"/,
  )
  assert.match(header, /const GitHubIcon = \(\) => \(/)
  assert.match(header, /className="site-github-icon"/)
  assert.match(header, /viewBox="0 0 24 24"/)
  assert.match(header, /fill="currentColor"/)
  assert.match(header, /aria-hidden="true"/)
  assert.match(header, /focusable="false"/)
  assert.match(
    header,
    /<a[\s\S]*className="site-github-link"[\s\S]*href=\{GITHUB_PROFILE_URL\}[\s\S]*target="_blank"[\s\S]*rel="noopener noreferrer"[\s\S]*aria-label="GitHub 프로필 \(새 탭\)"[\s\S]*<GitHubIcon \/>[\s\S]*<\/a>/,
  )
  assert.equal((header.match(/<a\b/g) ?? []).length, 1)
  assert.doesNotMatch(header, /react-icons|@primer\/octicons/)
  assert.match(footer, /© 2026 kjs\.log/)
  assert.match(
    footer,
    /AI workflow · backend notes · product engineering/,
  )
  assert.match(container, /<div className="site-container">\{children\}<\/div>/)
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const componentSources = await Promise.all(
    [
      "src/components/content-container.tsx",
      "src/components/header.tsx",
      "src/components/footer.tsx",
      "src/components/layout.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of componentSources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})

test("loads a responsive 920px common container", async () => {
  const [browserEntry, layoutCss] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/layout.css"),
  ])

  assert.match(browserEntry, /\.\/src\/styles\/layout\.css/)
  assert.match(
    layoutCss,
    /\.site-container\s*\{[^}]*max-width: 920px[^}]*padding-inline: var\(--container-gutter-desktop\)/s,
  )
  assert.match(
    layoutCss,
    /@media \(max-width: 1020px\)[\s\S]*?\.site-container\s*\{[^}]*padding-inline: var\(--container-gutter-tablet\)/,
  )
  assert.match(
    layoutCss,
    /@media \(max-width: 720px\)[\s\S]*?\.site-container\s*\{[^}]*padding-inline: var\(--container-gutter-phone\)/,
  )
})

test("applies the shared layout without changing page data boundaries", async () => {
  const [indexPage, postTemplate] = await Promise.all([
    readRepositoryFile("src/pages/index.tsx"),
    readRepositoryFile("src/templates/post.tsx"),
  ])

  for (const source of [indexPage, postTemplate]) {
    assert.match(source, /import ContentContainer from "\.\.\/components\/content-container"/)
    assert.match(source, /import Layout from "\.\.\/components\/layout"/)
    assert.match(source, /<Layout>[\s\S]*<ContentContainer>/)
    assert.doesNotMatch(source, /<main\b/)
  }

  assert.match(
    postTemplate,
    /<div className="mdx-content">[\s\S]*<MDXProvider components=\{mdxComponents\}>[\s\S]*\{children\}[\s\S]*<\/MDXProvider>[\s\S]*<\/div>/,
  )
})
