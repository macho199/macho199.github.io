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
