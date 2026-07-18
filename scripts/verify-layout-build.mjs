import assert from "node:assert/strict"
import { createHash } from "node:crypto"
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

/**
 * @param {string} html
 * @param {string} name
 */
const assertLocalFavicon = (html, name) => {
  const links = html.match(
    /<link\b(?=[^>]*rel="icon")(?=[^>]*href="\/favicon\.png")[^>]*>/g,
  ) ?? []

  assert.equal(links.length, 1, `${name}: one local favicon link`)
  assert.doesNotMatch(html, /avatars\.githubusercontent\.com/)
}

for (const [name, url] of pages) {
  const html = await readFile(url, "utf8")

  assertLocalFavicon(html, name)

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

const notFoundHtml = await readFile(
  new URL("../public/404.html", import.meta.url),
  "utf8",
)
const favicon = await readFile(
  new URL("../public/favicon.png", import.meta.url),
)

assertLocalFavicon(notFoundHtml, "not found")
assert.equal(
  createHash("sha256").update(favicon).digest("hex"),
  "e9d4b8b644138993aaf0d6c9904613a3ae820881bed5d03d07eb1032e549693b",
  "layout: exact local profile favicon asset",
)

console.log("layout build verified: shell and local favicon contracts passed")
