import assert from "node:assert/strict"
import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url))

const walk = async directory => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(entry => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? walk(entryPath) : [entryPath]
    }),
  )

  return nested.flat()
}

await Promise.all([
  access(path.join(publicDirectory, "index.html")),
  access(
    path.join(
      publicDirectory,
      "posts",
      "why-github-pages-and-gatsby",
      "index.html",
    ),
  ),
])

const files = await walk(publicDirectory)
const sourceFiles = files.filter(file => /\.(?:css|html)$/.test(file))
const source = (
  await Promise.all(sourceFiles.map(file => readFile(file, "utf8")))
).join("\n")
const localFonts = files.filter(file => file.endsWith(".woff2"))

assert.doesNotMatch(
  source,
  /cdn\.jsdelivr\.net|unpkg\.com|fonts\.(?:googleapis|gstatic)\.com/,
)
assert.match(source, /Noto Sans KR/)
assert.match(source, /Noto Serif KR/)
assert.ok(localFonts.length > 0, "expected local woff2 font assets")

console.log(`style build verified: ${localFonts.length} local woff2 assets`)
