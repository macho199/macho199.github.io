import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import rehypeShiki from "@shikijs/rehype"
import rehypeSlug from "rehype-slug"

import gatsbyConfig, {
  codeHighlightingOptions,
} from "../../gatsby-config.mjs"

const repositoryRoot = new URL("../../", import.meta.url)

test("locks the approved MDX rehype versions", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", repositoryRoot), "utf8"),
  )

  assert.equal(packageJson.devDependencies["@shikijs/rehype"], "4.3.1")
  assert.equal(packageJson.devDependencies["rehype-slug"], "6.0.0")
})

test("connects heading ids and Vesper highlighting to Gatsby MDX", async () => {
  const mdxPlugin = gatsbyConfig.plugins?.find(
    plugin =>
      typeof plugin === "object" && plugin.resolve === "gatsby-plugin-mdx",
  )

  assert.ok(mdxPlugin && typeof mdxPlugin === "object")

  const pluginOptions = Reflect.get(mdxPlugin, "options")

  assert.ok(pluginOptions && typeof pluginOptions === "object")

  const mdxOptions = Reflect.get(pluginOptions, "mdxOptions")

  assert.ok(mdxOptions && typeof mdxOptions === "object")

  assert.deepEqual(Reflect.get(mdxOptions, "rehypePlugins"), [
    rehypeSlug,
    [rehypeShiki, codeHighlightingOptions],
  ])
  assert.equal(codeHighlightingOptions.theme, "vesper")
  assert.equal(codeHighlightingOptions.defaultLanguage, "text")
  assert.equal(codeHighlightingOptions.inline, false)
  assert.equal(codeHighlightingOptions.transformers?.length, 1)
  assert.equal(
    codeHighlightingOptions.transformers?.[0]?.name,
    "developer-blog:code-language-metadata",
  )

  const configSource = await readFile(
    new URL("gatsby-config.mjs", repositoryRoot),
    "utf8",
  )

  assert.match(
    configSource,
    /node\.properties\["data-language"\] = this\.options\.lang/,
  )
})
