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
      "src/components/scroll-to-top-button.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of componentSources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})

test("defines the scroll direction and animation contracts", async () => {
  const button = await readRepositoryFile(
    "src/components/scroll-to-top-button.tsx",
  )

  assert.match(button, /const SCROLL_UP_THRESHOLD_PX = 16/)
  assert.match(button, /const SCROLL_DURATION_MS = 1000/)
  assert.match(
    button,
    /const CANCEL_SCROLL_KEYS = new Set\(\[[\s\S]*"ArrowUp"[\s\S]*"ArrowDown"[\s\S]*"PageUp"[\s\S]*"PageDown"[\s\S]*"Home"[\s\S]*"End"[\s\S]*"Space"[\s\S]*\]\)/,
  )
  assert.match(button, /window\.scrollY <= window\.innerHeight/)
  assert.match(
    button,
    /currentScrollY > lastScrollY[\s\S]*setIsVisible\(false\)[\s\S]*upwardDistance = 0/,
  )
  assert.match(button, /upwardDistance \+= lastScrollY - currentScrollY/)
  assert.match(button, /upwardDistance >= SCROLL_UP_THRESHOLD_PX/)
  assert.match(
    button,
    /window\.addEventListener\("scroll", handleScroll, \{ passive: true \}\)/,
  )
  assert.match(
    button,
    /observationFrame = window\.requestAnimationFrame\(updateVisibility\)/,
  )
  assert.match(button, /elapsed \/ SCROLL_DURATION_MS/)
  assert.match(button, /1 - \(1 - progress\) \*\* 3/)
  assert.match(
    button,
    /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/,
  )
  assert.match(button, /event\.detail === 0/)
})

test("keeps the scroll button accessible and cancels owned resources", async () => {
  const button = await readRepositoryFile(
    "src/components/scroll-to-top-button.tsx",
  )

  assert.match(
    button,
    /<button[\s\S]*type="button"[\s\S]*aria-label="페이지 맨 위로 이동"/,
  )
  assert.match(button, /aria-hidden=\{!isVisible\}/)
  assert.match(button, /tabIndex=\{isVisible \? 0 : -1\}/)
  assert.match(
    button,
    /<svg[\s\S]*aria-hidden="true"[\s\S]*focusable="false"/,
  )
  assert.match(
    button,
    /document[\s\S]*\.querySelector<HTMLElement>\("\.site-logo"\)/,
  )
  assert.match(button, /focus\(\{ preventScroll: true \}\)/)
  assert.match(button, /CANCEL_SCROLL_KEYS\.has\(event\.code\)/)

  for (const eventName of ["wheel", "touchstart", "pointerdown"]) {
    assert.match(
      button,
      new RegExp(
        `window\\.addEventListener\\("${eventName}", cancelScrollAnimation`,
      ),
    )
    assert.match(
      button,
      new RegExp(
        `window\\.removeEventListener\\("${eventName}", cancelScrollAnimation`,
      ),
    )
  }

  assert.match(button, /window\.cancelAnimationFrame\(observationFrame\)/)
  assert.match(button, /window\.cancelAnimationFrame\(scrollAnimationFrame\)/)
  assert.match(
    button,
    /window\.removeEventListener\("scroll", handleScroll\)/,
  )
  assert.match(
    button,
    /window\.removeEventListener\("resize", handleResize\)/,
  )
  assert.match(
    button,
    /window\.removeEventListener\("keydown", handleKeyDown\)/,
  )
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
    /\.site-header-inner\s*\{[^}]*justify-content:\s*space-between[^}]*gap:\s*var\(--space-4\)/s,
  )
  assert.match(
    layoutCss,
    /\.site-github-link\s*\{[^}]*display:\s*inline-grid[^}]*place-items:\s*center[^}]*flex:\s*none[^}]*width:\s*44px[^}]*min-height:\s*44px[^}]*border-radius:\s*var\(--radius-sm\)[^}]*color:\s*var\(--muted\)[^}]*transition:[^}]*background-color var\(--motion-fast\) var\(--ease-standard\)[^}]*color var\(--motion-fast\) var\(--ease-standard\)[^}]*transform var\(--motion-fast\) var\(--ease-standard\)/s,
  )
  assert.match(
    layoutCss,
    /\.site-github-icon\s*\{[^}]*width:\s*20px[^}]*height:\s*20px[^}]*pointer-events:\s*none/s,
  )
  assert.match(
    layoutCss,
    /\.site-github-link:hover\s*\{[^}]*background:\s*var\(--surface\)[^}]*color:\s*var\(--fg\)/s,
  )
  assert.match(
    layoutCss,
    /\.site-github-link:active\s*\{[^}]*background:\s*var\(--surface\)[^}]*color:\s*var\(--fg\)[^}]*transform:\s*scale\(0\.92\)/s,
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
