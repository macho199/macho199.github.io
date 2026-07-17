import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import gatsbyConfig from "../../gatsby-config.mjs"

const repositoryRoot = new URL("../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8")

test("registers the local Tailwind PostCSS pipeline", async () => {
  const plugins = gatsbyConfig.plugins ?? []

  assert.ok(plugins.includes("gatsby-plugin-postcss"))

  const postcssConfig = await import("../../postcss.config.mjs")

  assert.deepEqual(postcssConfig.default, {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  })
})

test("loads only approved local fonts and light theme tokens", async () => {
  const [browserEntry, themeCss] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/theme.css"),
  ])

  for (const fontImport of [
    "@fontsource/noto-serif-kr/400.css",
    "@fontsource/noto-sans-kr/400.css",
    "@fontsource/noto-sans-kr/500.css",
    "@fontsource/noto-sans-kr/600.css",
  ]) {
    assert.ok(browserEntry.includes(`import "${fontImport}"`))
  }

  assert.match(browserEntry, /\.\/src\/styles\/theme\.css/)
  assert.match(themeCss, /@import "tailwindcss";/)
  assert.match(themeCss, /--font-display: "Noto Serif KR"/)
  assert.match(themeCss, /--font-body: "Noto Sans KR"/)
  assert.match(themeCss, /--color-brand: var\(--accent\)/)
  assert.match(themeCss, /color-scheme: light/)
  assert.doesNotMatch(`${browserEntry}\n${themeCss}`, /https?:\/\//)
})

test("restores semantic heading sizes after Tailwind Preflight", async () => {
  const themeCss = await readRepositoryFile("src/styles/theme.css")

  assert.match(
    themeCss,
    /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*line-height: var\(--leading-tight\)/s,
  )

  for (const [selector, sizeToken] of [
    ["h1", "--text-3xl"],
    ["h2", "--text-2xl"],
    ["h3", "--text-xl"],
    ["h4", "--text-lg"],
    ["h5", "--text-base"],
    ["h6", "--text-sm"],
  ]) {
    assert.match(
      themeCss,
      new RegExp(`${selector}\\s*\\{[^}]*font-size: var\\(${sizeToken}\\)`, "s"),
    )
  }
})

test("restores semantic list markers and indentation after Tailwind Preflight", async () => {
  const themeCss = await readRepositoryFile("src/styles/theme.css")

  assert.match(
    themeCss,
    /:where\(ul, ol\)\s*\{[^}]*padding-inline-start: 1\.5rem/s,
  )
  assert.match(themeCss, /(^|\n)\s*ul\s*\{[^}]*list-style: disc/s)
  assert.match(themeCss, /(^|\n)\s*ol\s*\{[^}]*list-style: decimal/s)
})

test("restores visible link cues after Tailwind Preflight", async () => {
  const themeCss = await readRepositoryFile("src/styles/theme.css")

  assert.match(
    themeCss,
    /(^|\n)\s*a\s*\{[^}]*color: var\(--accent\)[^}]*text-decoration: underline/s,
  )
})

test("keeps MDX semantic resets inside an explicit boundary", async () => {
  const [browserEntry, mdxCss, postTemplate] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/mdx.css"),
    readRepositoryFile("src/templates/post.tsx"),
  ])

  assert.match(browserEntry, /\.\/src\/styles\/mdx\.css/)
  assert.match(mdxCss, /\.mdx-content/)
  assert.doesNotMatch(mdxCss, /(^|\n)\s*(ul|ol|table)\s*\{/)
  assert.match(postTemplate, /className="mdx-content"/)
})
