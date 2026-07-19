import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"

import config from "../gatsby-config.mjs"

const postsDirectory = new URL("../public/posts/", import.meta.url)
const postDirectories = (await readdir(postsDirectory, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .sort((left, right) => left.name.localeCompare(right.name))

const pages = [
  ["home", new URL("../public/index.html", import.meta.url)],
  ...postDirectories.map(entry => [
    `post:${entry.name}`,
    new URL(`../public/posts/${entry.name}/index.html`, import.meta.url),
  ]),
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

/** @param {string} value */
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const verificationValue = config.siteMetadata.googleSiteVerification

/** @param {string} html */
const countGoogleVerificationTags = html =>
  html.match(
    new RegExp(
      `<meta\\b(?=[^>]*name="google-site-verification")(?=[^>]*content="${escapeRegex(verificationValue)}")[^>]*>`,
      "g",
    ),
  )?.length ?? 0

/** @param {string} html */
const countBlogPostingScripts = html =>
  html.match(
    /<script\b(?=[^>]*type="application\/ld\+json")(?=[^>]*id="blog-posting-json-ld")[^>]*>/g,
  )?.length ?? 0

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
    countGoogleVerificationTags(html),
    1,
    `${name}: one exact Google site verification tag`,
  )

  assert.equal(
    countClassedTags(html, "button", "scroll-to-top-button"),
    1,
    `${name}: one scroll to top button`,
  )
  assert.match(
    html,
    /<button\b(?=[^>]*class="[^"]*scroll-to-top-button[^"]*")(?=[^>]*aria-label="페이지 맨 위로 이동")(?=[^>]*aria-hidden="true")(?=[^>]*tabindex="-1")[^>]*>/,
    `${name}: initially hidden accessible scroll control`,
  )
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
  countGoogleVerificationTags(notFoundHtml),
  1,
  "not found: one exact Google site verification tag",
)
assert.equal(
  countBlogPostingScripts(
    await readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  ),
  0,
  "home: no BlogPosting JSON-LD",
)
assert.equal(
  countBlogPostingScripts(notFoundHtml),
  0,
  "not found: no BlogPosting JSON-LD",
)
assert.equal(
  countClassedTags(notFoundHtml, "button", "scroll-to-top-button"),
  0,
  "not found: no scroll to top button outside Layout",
)
assert.equal(
  createHash("sha256").update(favicon).digest("hex"),
  "dde3fd00fdda954cef45373e2dc0467cde694d66e8c626749edeceed15359c7c",
  "layout: exact transparent local profile favicon asset",
)

console.log(
  "layout build verified: shell, favicon, and scroll control contracts passed",
)
