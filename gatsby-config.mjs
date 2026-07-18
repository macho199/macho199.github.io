import path from "node:path"
import { fileURLToPath } from "node:url"

import rehypeShiki from "@shikijs/rehype"
import remarkGfm from "remark-gfm"

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))

/** @satisfies {import("@shikijs/rehype").RehypeShikiOptions} */
export const codeHighlightingOptions = {
  theme: "vesper",
  defaultLanguage: "text",
  inline: false,
  transformers: [
    {
      name: "developer-blog:code-language-metadata",
      pre(node) {
        node.properties["data-language"] = this.options.lang
      },
    },
  ],
}

/** @type {import("gatsby").GatsbyConfig} */
const config = {
  siteMetadata: {
    title: "Developer Blog",
    description: "Notes from building and operating software.",
    siteUrl: "https://macho199.github.io",
  },
  plugins: [
    {
      resolve: "gatsby-plugin-postcss",
      options: {
        postcssOptions: {
          config: path.join(rootDirectory, "postcss.config.cjs"),
        },
      },
    },
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [[rehypeShiki, codeHighlightingOptions]],
        },
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "posts",
        path: path.join(rootDirectory, "content", "posts"),
      },
    },
    {
      resolve: "gatsby-plugin-sitemap",
      options: {
        excludes: ["/404.html"],
      },
    },
  ],
}

export default config
