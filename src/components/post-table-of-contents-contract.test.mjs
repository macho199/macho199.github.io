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
