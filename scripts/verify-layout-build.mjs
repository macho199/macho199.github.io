import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const pages = [
  ["home", new URL("../public/index.html", import.meta.url)],
  [
    "post",
    new URL(
      "../public/posts/gatsby-blog-1-getting-started/index.html",
      import.meta.url,
    ),
  ],
]

/**
 * @param {string} source
 * @param {string} tag
 * @param {string} className
 */
const countClassedTags = (source, tag, className) =>
  source.match(
    new RegExp(`<${tag}\\b(?=[^>]*class="[^"]*${className}[^"]*")[^>]*>`, "g"),
  )?.length ?? 0

/**
 * @param {string} source
 * @param {string} tag
 */
const countOpeningTags = (source, tag) =>
  source.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

for (const [name, url] of pages) {
  const html = await readFile(url, "utf8")

  assert.equal(
    countClassedTags(html, "header", "site-header"),
    1,
    `${name}: one site header`,
  )
  assert.equal(countOpeningTags(html, "main"), 1, `${name}: one main`)
  assert.equal(
    countClassedTags(html, "footer", "site-footer"),
    1,
    `${name}: one site footer`,
  )
  assert.match(
    html,
    /<a\b(?=[^>]*href="\/")(?=[^>]*class="[^"]*site-logo[^"]*")[^>]*>kjs\.log<\/a>/,
    `${name}: real home logo link`,
  )
  assert.match(html, /© 2026 kjs\.log/, `${name}: copyright`)
  assert.match(
    html,
    /AI workflow · backend notes · product engineering/,
    `${name}: footer description`,
  )
  assert.ok(
    (html.match(/site-container/g) ?? []).length >= 3,
    `${name}: shared containers for header, content, and footer`,
  )
}

console.log("layout build verified: home and post shell contracts passed")
