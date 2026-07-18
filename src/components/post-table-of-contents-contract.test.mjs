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

test("renders accessible static TOC anchors", async () => {
  const source = await readRepositoryFile(
    "src/components/post-table-of-contents.tsx",
  )

  assert.match(source, /^import \* as React from "react"$/m)
  assert.match(source, /items: readonly PostTocItem\[\]/)
  assert.match(source, /if \(items\.length === 0\) \{[\s\S]*return null/)
  assert.match(source, /<nav className="post-toc" aria-label="글 목차">/)
  assert.match(source, /<p className="post-toc-title">목차<\/p>/)
  assert.match(source, /href=\{item\.href\}/)
  assert.match(source, /onClick=\{\(\) => setActiveId\(item\.id\)\}/)
  assert.match(source, /aria-current=\{isActive \? "location" : undefined\}/)
  assert.doesNotMatch(source, /<button\b|<Link\b|dangerouslySetInnerHTML/)
})

test("enhances active state without rewriting scroll history", async () => {
  const source = await readRepositoryFile(
    "src/components/post-table-of-contents.tsx",
  )

  assert.match(source, /window\.location\.hash/)
  assert.match(source, /decodeURIComponent/)
  assert.match(source, /document\.getElementById\(item\.id\)/)
  assert.match(source, /!\("IntersectionObserver" in window\)/)
  assert.match(source, /new window\.IntersectionObserver/)
  assert.match(
    source,
    /const viewportObserver = new window\.IntersectionObserver\(syncActiveId\)/,
  )
  assert.match(source, /viewportObserver\.observe\(heading\)/)
  assert.match(source, /viewportObserver\.disconnect\(\)/)
  assert.match(source, /getBoundingClientRect\(\)\.top <= ACTIVE_HEADING_OFFSET/)
  assert.match(source, /observer\.disconnect\(\)/)
  assert.doesNotMatch(
    source,
    /history\.(?:pushState|replaceState)|location\.hash\s*=|scrollIntoView/,
  )
})

test("queries and composes the normalized TOC beside the MDX body", async () => {
  const source = await readRepositoryFile("src/templates/post.tsx")

  assert.match(
    source,
    /import PostTableOfContents from "\.\.\/components\/post-table-of-contents"/,
  )
  assert.match(
    source,
    /import \{ normalizePostTableOfContents \} from "\.\.\/lib\/post-table-of-contents\.mjs"/,
  )
  assert.match(source, /tableOfContents: unknown/)
  assert.match(
    source,
    /const tocItems = normalizePostTableOfContents\(data\.mdx\.tableOfContents\)/,
  )
  assert.match(
    source,
    /<div className="post-body-shell">[\s\S]*<div className="mdx-content">[\s\S]*\{children\}[\s\S]*<\/div>[\s\S]*<PostTableOfContents items=\{tocItems\} \/>[\s\S]*<\/div>/,
  )
  assert.match(source, /tableOfContents\(maxDepth: 2\)/)
})

test("keeps the body width and exposes the approved desktop TOC geometry", async () => {
  const css = await readRepositoryFile("src/styles/post.css")

  assert.match(
    css,
    /\.post-body-shell\s*\{[^}]*position:\s*relative[^}]*min-width:\s*0/s,
  )
  assert.match(css, /\.post-toc-rail\s*\{[^}]*display:\s*none/s)
  assert.match(
    css,
    /@media \(min-width: 1321px\)[\s\S]*\.post-toc-rail\s*\{[^}]*display:\s*block[^}]*position:\s*absolute[^}]*top:\s*var\(--space-12\)[^}]*bottom:\s*0[^}]*left:\s*calc\(100% \+ var\(--space-12\)\)[^}]*width:\s*224px/s,
  )
  assert.match(
    css,
    /@media \(min-width: 1321px\)[\s\S]*\.post-toc\s*\{[^}]*position:\s*sticky[^}]*top:\s*var\(--space-6\)/s,
  )
  const compactMediaRule = css.match(
    /@media \(min-width: 1321px\) and \(max-width: 1390px\) \{([\s\S]*?)\n\}/,
  )
  assert.ok(compactMediaRule)
  assert.match(
    compactMediaRule[1],
    /\.post-toc-rail\s*\{[^}]*width:\s*190px/s,
  )
  assert.doesNotMatch(
    compactMediaRule[1],
    /\.post-toc-rail\s*\{[^}]*left:/s,
  )
  assert.match(
    compactMediaRule[1],
    /\.post-toc\s*\{[^}]*padding:\s*var\(--space-3\)/s,
  )
  assert.match(
    css,
    /\.post-toc\s*\{[^}]*max-height:\s*calc\(100vh - 48px\)[^}]*overflow-y:\s*auto/s,
  )
  const bodyShellRule = css.match(/\.post-body-shell\s*\{([^}]*)\}/s)
  assert.ok(bodyShellRule)
  assert.doesNotMatch(
    bodyShellRule[1],
    /(?:^|;)\s*(?:width|max-width)\s*:/,
  )
})

test("matches the approved TOC card and link presentation", async () => {
  const css = await readRepositoryFile("src/styles/post.css")

  assert.match(
    css,
    /\.post-toc-list\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
  )
  assert.match(
    css,
    /\.post-toc\s*\{[^}]*padding:\s*var\(--space-4\)[^}]*border:\s*1px solid var\(--border-soft\)[^}]*background:\s*var\(--bg\)[^}]*color:\s*var\(--muted\)[^}]*font-size:\s*var\(--text-sm\)[^}]*line-height:\s*1\.45/s,
  )
  assert.match(
    css,
    /\.post-toc-title\s*\{[^}]*margin:\s*0 0 var\(--space-2\)[^}]*padding-bottom:\s*var\(--space-2\)[^}]*border-bottom:\s*1px solid var\(--border\)[^}]*color:\s*var\(--fg-2\)[^}]*font-family:\s*var\(--font-body\)[^}]*font-size:\s*14px[^}]*font-weight:\s*500[^}]*line-height:\s*1\.35/s,
  )
  assert.match(
    css,
    /\.post-toc-link\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%[^}]*padding:\s*5px 0 5px 14px[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap[^}]*color:\s*var\(--muted\)[^}]*font-size:\s*var\(--text-sm\)[^}]*line-height:\s*1\.45/s,
  )
  assert.match(
    css,
    /\.post-toc-link::before\s*\{[^}]*top:\s*50%[^}]*width:\s*5px[^}]*height:\s*5px[^}]*transform:\s*translateY\(-50%\)/s,
  )
  assert.match(
    css,
    /\.post-toc-link:hover\s*\{[^}]*color:\s*var\(--fg-2\)/s,
  )
  assert.match(
    css,
    /\.post-toc-link--active\s*\{[^}]*color:\s*var\(--fg-2\)[^}]*font-weight:\s*500/s,
  )
  assert.match(
    css,
    /\.post-toc-link--active::before\s*\{[^}]*background:\s*var\(--accent\)/s,
  )
  assert.doesNotMatch(
    css,
    /\.post-toc-link\s*\{[^}]*(?:overflow-wrap|word-break):/s,
  )
})
