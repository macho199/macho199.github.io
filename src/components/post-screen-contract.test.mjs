import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const repositoryRoot = new URL("../../", import.meta.url)
const require = createRequire(import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

test("renders typed post metadata without inactive controls", async () => {
  const postHeader = await readRepositoryFile("src/components/post-header.tsx")

  assert.match(postHeader, /export type PostHeaderData = Readonly<\{/)
  assert.match(postHeader, /title: string/)
  assert.match(postHeader, /description: string/)
  assert.match(postHeader, /tags: readonly string\[\]/)
  assert.match(postHeader, /publishedAt: string/)
  assert.match(postHeader, /publishedAtDisplay: string/)
  assert.match(postHeader, /<ul className="post-tags" aria-label="태그">/)
  assert.match(postHeader, /<span className="post-tag">\{tag\}<\/span>/)
  assert.match(postHeader, /<h1 className="post-title">\{post\.title\}<\/h1>/)
  assert.match(postHeader, /<p className="post-description">\{post\.description\}<\/p>/)
  assert.match(
    postHeader,
    /<time className="post-date" dateTime=\{post\.publishedAt\}>[\s\S]*\{post\.publishedAtDisplay\}[\s\S]*<\/time>/,
  )
  assert.doesNotMatch(postHeader, /<button\b|<a\b|<Link\b/)
})

test("keeps GraphQL and page composition in the post template", async () => {
  const postTemplate = await readRepositoryFile("src/templates/post.tsx")

  assert.match(postTemplate, /import PostHeader, \{ type PostHeaderData \}/)
  assert.match(
    postTemplate,
    /<nav className="post-back-nav" aria-label="게시글 탐색">[\s\S]*<Link to="\/" className="post-back-link">[\s\S]*게시글 목록[\s\S]*<\/Link>[\s\S]*<\/nav>/,
  )
  assert.match(
    postTemplate,
    /<article className="post-page">[\s\S]*<PostHeader post=\{frontmatter\} \/>[\s\S]*<div className="mdx-content">\{children\}<\/div>[\s\S]*<PostNavigation[\s\S]*<\/article>/,
  )
  assert.match(postTemplate, /publishedAt\(formatString: "YYYY-MM-DD"\)/)
  assert.match(
    postTemplate,
    /publishedAtDisplay: publishedAt\(formatString: "YYYY\.MM\.DD"\)/,
  )
  assert.doesNotMatch(postTemplate, /<h1\b|<button\b/)
})

test("renders accessible previous and next post navigation", async () => {
  const [postNavigation, postTemplate, postCss] = await Promise.all([
    readRepositoryFile("src/components/post-navigation.tsx"),
    readRepositoryFile("src/templates/post.tsx"),
    readRepositoryFile("src/styles/post.css"),
  ])

  assert.match(postNavigation, /export type AdjacentPost = Readonly<\{/)
  assert.match(postNavigation, /previousPost: AdjacentPost \| null/)
  assert.match(postNavigation, /nextPost: AdjacentPost \| null/)
  assert.match(
    postNavigation,
    /if \(!previousPost && !nextPost\) \{[\s\S]*return null/,
  )
  assert.match(
    postNavigation,
    /<nav className="post-navigation" aria-label="이전·다음 게시글">/,
  )
  assert.ok(postNavigation.includes('to={`/posts/${previousPost.slug}/`}'))
  assert.ok(postNavigation.includes('to={`/posts/${nextPost.slug}/`}'))
  assert.match(postNavigation, />\s*이전 글\s*</)
  assert.match(postNavigation, />\s*다음 글\s*</)
  assert.doesNotMatch(postNavigation, /publishedAt|description|<button\b/)

  assert.match(postTemplate, /PageProps<PostData, PostPageContext>/)
  assert.match(postTemplate, /pageContext, children/)
  assert.match(
    postTemplate,
    /<PostNavigation[\s\S]*previousPost=\{pageContext\.previousPost\}[\s\S]*nextPost=\{pageContext\.nextPost\}/,
  )

  assert.match(
    postCss,
    /\.post-navigation\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
  )
  assert.match(
    postCss,
    /\.post-navigation-card--next\s*\{[^}]*grid-column:\s*2/s,
  )
  assert.match(
    postCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-navigation\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/,
  )
  assert.match(
    postCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-navigation-card--next\s*\{[^}]*grid-column:\s*1/,
  )
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const sources = await Promise.all(
    [
      "src/components/post-header.tsx",
      "src/components/post-navigation.tsx",
      "src/templates/post.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of sources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})

test("loads post styles once and keeps selectors inside post boundaries", async () => {
  const [browserEntry, postCss] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/post.css"),
  ])

  assert.equal(
    (browserEntry.match(/\.\/src\/styles\/post\.css/g) ?? []).length,
    1,
  )
  assert.match(postCss, /@layer components/)
  assert.match(postCss, /\.post-back-nav\s*\{/)
  assert.match(postCss, /\.post-page\s*\{/)
  assert.match(postCss, /\.post-page \.mdx-content\s*\{/)
  assert.match(postCss, /\.post-page \.mdx-content :where\(h2, h3, h4, h5\)/)
  assert.match(postCss, /\.post-page \.mdx-content pre\s*\{[^}]*overflow-x: auto/s)
  assert.match(postCss, /\.post-page \.mdx-content table\s*\{[^}]*overflow-x: auto/s)
  assert.match(postCss, /@media \(max-width: 1020px\)/)
  assert.match(postCss, /@media \(max-width: 720px\)/)
  assert.doesNotMatch(postCss, /(^|\n)\s*(?:h[1-6]|p|a|ul|ol|pre|table)\s*\{/)
})

test("keeps Korean post title words intact", async () => {
  const postCss = await readRepositoryFile("src/styles/post.css")
  const titleRule = postCss.match(/\.post-title\s*\{([^}]*)\}/s)

  assert.ok(titleRule, "post title style rule")
  assert.match(titleRule[1], /word-break:\s*keep-all/)
  assert.match(titleRule[1], /overflow-wrap:\s*break-word/)
  assert.doesNotMatch(titleRule[1], /overflow-wrap:\s*anywhere/)
})

test("inherits the shared container width and wraps long titles within it", async () => {
  const postCss = await readRepositoryFile("src/styles/post.css")
  const widthRules = [
    ["post header", postCss.match(/\.post-header\s*\{([^}]*)\}/s)],
    ["post description", postCss.match(/\.post-description\s*\{([^}]*)\}/s)],
    [
      "MDX content",
      postCss.match(/\.post-page \.mdx-content\s*\{([^}]*)\}/s),
    ],
  ]
  const titleRule = postCss.match(/\.post-title\s*\{([^}]*)\}/s)

  for (const [label, rule] of widthRules) {
    assert.ok(rule, `${label} style rule`)
    assert.doesNotMatch(rule[1], /max-width:\s*760px/)
  }

  assert.ok(titleRule, "post title style rule")
  assert.match(titleRule[1], /font-size:\s*clamp\(28px, 4vw, 36px\)/)
  assert.match(titleRule[1], /text-wrap:\s*balance/)
  assert.doesNotMatch(titleRule[1], /text-wrap:\s*nowrap/)
})

test("documents the current Gatsby rebuild and Tailwind fixes", async () => {
  const [post, oldSample] = await Promise.all([
    readRepositoryFile("content/posts/gatsby-blog-1-getting-started/index.mdx"),
    readRepositoryFile("content/posts/mdx-foundation/index.mdx"),
  ])

  assert.match(post, /title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기"/)
  assert.match(post, /slug: "gatsby-blog-1-getting-started"/)
  assert.match(post, /publishedAt: "2026-04-18"/)
  assert.match(
    post,
    /배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\./,
  )
  assert.match(post, /Gatsby \| 5\.16\.1/)
  assert.match(post, /Tailwind CSS \| 4\.3\.3/)
  assert.match(post, /"@tailwindcss\/postcss": \{\}/)
  assert.match(post, /@import "tailwindcss" source\("\.\.\/"\);/)
  assert.match(post, /제목 크기, 목록 마커, 링크 식별성/)
  assert.match(post, /4\.5:1/)
  assert.match(post, /npm run typecheck/)
  assert.match(post, /## 검증과 단계별 배포 경계/)
  assert.match(post, /GitHub Actions 배포는 이후 출시 단계에서 연결했습니다/)
  assert.doesNotMatch(post, /GitHub Actions 배포는 아직 연결하지 않았다/)
  assert.doesNotMatch(
    post,
    /2025|ERROR #98123|@mdx-js\/react|text-red-500|당시 GitHub Pages 배포 방식/,
  )
  assert.doesNotMatch(
    post,
    /hello-gatsby-tailwindcss\.png|github-pages-setting\.png/,
  )
  assert.equal(oldSample, "")
})

test("documents MDX post management as article two", async () => {
  const post = await readRepositoryFile(
    "content/posts/gatsby-blog-2-managing-mdx-posts/index.mdx",
  )

  assert.match(post, /title: "Gatsby로 블로그 만들기 2편 - MDX 포스트 관리"/)
  assert.match(post, /slug: "gatsby-blog-2-managing-mdx-posts"/)
  assert.match(post, /publishedAt: "2026-05-16"/)
  assert.match(post, /## 포스트 파일과 메타데이터를 한 단위로 묶기/)
  assert.match(post, /## 파일을 Gatsby 데이터 레이어에 연결하기/)
  assert.match(post, /## frontmatter를 명시적 계약으로 고정하기/)
  assert.match(post, /## 페이지 생성 전에 작성자 입력 검증하기/)
  assert.match(post, /## 오류를 모아 빌드를 중단하기/)
  assert.match(post, /## 새 글을 추가하는 실제 순서/)
  assert.match(post, /content\/posts\/<slug>\/index\.mdx/)
  assert.match(post, /createSchemaCustomization/)
  assert.match(post, /@dontInfer/)
  assert.match(post, /validatePostNodes/)
  assert.match(post, /Duplicate post slug/)
  assert.match(post, /YYYY-MM-DD/)
  assert.doesNotMatch(post, /2025|React SSR 한글|GitHub Actions 배포 설정 방법/)
})

test("documents GraphQL page generation as article three", async () => {
  const post = await readRepositoryFile(
    "content/posts/gatsby-blog-3-graphql-page-generation/index.mdx",
  )

  assert.match(post, /title: "Gatsby로 블로그 만들기 3편 - GraphQL 페이지 생성"/)
  assert.match(post, /slug: "gatsby-blog-3-graphql-page-generation"/)
  assert.match(post, /publishedAt: "2026-06-27"/)
  assert.match(post, /## 같은 MDX 노드를 두 경로에서 조회하기/)
  assert.match(post, /## 홈에서 발행일 역순 목록 만들기/)
  assert.match(post, /## 블로그 글만 정적 라우트로 생성하기/)
  assert.match(post, /## id로 상세 데이터와 본문 연결하기/)
  assert.match(post, /## 표현 컴포넌트와 GraphQL 경계 분리하기/)
  assert.match(post, /## SEO와 sitemap을 같은 메타데이터에 연결하기/)
  assert.match(post, /## 빌드 결과로 전체 흐름 검증하기/)
  assert.match(post, /allMdx\(sort: \{ frontmatter: \{ publishedAt: DESC \} \}\)/)
  assert.match(post, /sourceInstanceName === "posts"/)
  assert.match(post, /contentFilePath/)
  assert.match(post, /context: \{[\s\S]*id: post\.id/)
  assert.match(post, /mdx\(id: \{ eq: \$id \}\)/)
  assert.match(post, /gatsby-plugin-sitemap/)
  assert.doesNotMatch(post, /2025|React SSR 한글|태그 필터 구현/)
})

test("registers a production verifier for all approved posts", async () => {
  const [packageSource, verifier] = await Promise.all([
    readRepositoryFile("package.json"),
    readRepositoryFile("scripts/verify-post-build.mjs"),
  ])
  const packageJson = JSON.parse(packageSource)

  assert.equal(
    packageJson.scripts["verify:post"],
    "node scripts/verify-post-build.mjs",
  )
  assert.match(verifier, /public[\s\S]*gatsby-blog-1-getting-started/)
  assert.match(verifier, /gatsby-blog-2-managing-mdx-posts/)
  assert.match(verifier, /gatsby-blog-3-graphql-page-generation/)
  assert.match(verifier, /for \(const contract of postContracts\)/)
  assert.match(verifier, /previousPost:/)
  assert.match(verifier, /nextPost:/)
  assert.match(verifier, /aria-label="이전·다음 게시글"/)
  assert.match(verifier, /post-navigation-card/)
  assert.match(
    verifier,
    /assert\.deepEqual\([\s\S]*?navigationLinks,[\s\S]*?expectedNavigationLinks/,
  )
  assert.match(verifier, /assert\.deepEqual\(visibleTags, contract\.tags/)
  assert.match(
    verifier,
    /assert\.deepEqual\([\s\S]*?articleTagValues,[\s\S]*?contract\.tags/,
  )
  assert.match(verifier, /mdx-foundation/)
  assert.match(verifier, /create-a-blog-site-with-gatsby1/)
})

test("renders the Gatsby body without streaming text corruption", async () => {
  const ssrEntryUrl = new URL("gatsby-ssr.js", repositoryRoot)
  const ssrEntry = await readRepositoryFile("gatsby-ssr.js")

  assert.notEqual(ssrEntry, "", "gatsby-ssr.js must define the body renderer")

  const React = require("react")
  const { replaceRenderer } = require(fileURLToPath(ssrEntryUrl))
  const bodyText = "가나다라마바사아자차카타파하".repeat(200)
  let renderedBody = ""

  /** @param {string} html */
  const captureRenderedBody = html => {
    renderedBody = html
  }

  replaceRenderer({
    bodyComponent: React.createElement("p", null, bodyText),
    replaceBodyHTMLString: captureRenderedBody,
  })

  assert.equal(renderedBody, `<p>${bodyText}</p>`)
  assert.doesNotMatch(renderedBody, /\u0000/)
})

test("type-checks Gatsby JavaScript lifecycle entries", async () => {
  const tsconfig = JSON.parse(await readRepositoryFile("tsconfig.json"))

  assert.ok(tsconfig.include.includes("gatsby-*.js"))
})
