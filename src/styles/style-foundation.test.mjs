import assert from "node:assert/strict"
import { test } from "node:test"

import gatsbyConfig from "../../gatsby-config.mjs"

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
