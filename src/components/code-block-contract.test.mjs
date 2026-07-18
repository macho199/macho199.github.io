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

test("renders a hydrated accessible copy control around the original pre", async () => {
  const source = await readRepositoryFile("src/components/code-block.tsx")

  assert.match(source, /type CopyStatus = "idle" \| "copied" \| "failed"/)
  assert.match(source, /const RESET_DELAY_MS = 1_500/)
  assert.match(source, /getCodeLanguageLabel\(language\)/)
  assert.match(source, /React\.useEffect\(\(\) =>/)
  assert.match(source, /navigator\.clipboard\?\.writeText/)
  assert.match(source, /preRef\.current\?\.textContent \?\? ""/)
  assert.match(source, /await navigator\.clipboard\.writeText\(codeText\)/)
  assert.match(source, /setCopyStatus\("copied"\)/)
  assert.match(source, /setCopyStatus\("failed"\)/)
  assert.match(source, /window\.clearTimeout\(resetTimerRef\.current\)/)
  assert.match(source, /aria-label=\{`\$\{languageLabel\} 코드 복사`\}/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /<pre \{\.\.\.preProps\} ref=\{preRef\}>/)
  assert.doesNotMatch(source, /document\.execCommand|dangerouslySetInnerHTML/)
})

test("maps MDX pre elements through a stable provider component map", async () => {
  const template = await readRepositoryFile("src/templates/post.tsx")

  assert.match(template, /import \{ MDXProvider \} from "@mdx-js\/react"/)
  assert.match(template, /import CodeBlock from "\.\.\/components\/code-block"/)
  assert.match(template, /const mdxComponents = \{\s*pre: CodeBlock,?\s*\}/)
  assert.match(
    template,
    /<div className="mdx-content">[\s\S]*<MDXProvider components=\{mdxComponents\}>[\s\S]*\{children\}[\s\S]*<\/MDXProvider>[\s\S]*<\/div>/,
  )
})
