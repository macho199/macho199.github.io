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

  assert.match(postTemplate, /import \{ MDXProvider \} from "@mdx-js\/react"/)
  assert.match(postTemplate, /import CodeBlock from "\.\.\/components\/code-block"/)
  assert.match(postTemplate, /const mdxComponents = \{\s*pre: CodeBlock,?\s*\}/)
  assert.match(postTemplate, /import PostHeader, \{ type PostHeaderData \}/)
  assert.match(
    postTemplate,
    /<nav className="post-back-nav" aria-label="게시글 탐색">[\s\S]*<Link to="\/" className="post-back-link">[\s\S]*게시글 목록[\s\S]*<\/Link>[\s\S]*<\/nav>/,
  )
  assert.match(
    postTemplate,
    /<article className="post-page">[\s\S]*<PostHeader post=\{frontmatter\} \/>[\s\S]*<div className="mdx-content">[\s\S]*<MDXProvider components=\{mdxComponents\}>[\s\S]*\{children\}[\s\S]*<\/MDXProvider>[\s\S]*<\/div>[\s\S]*<PostNavigation[\s\S]*<\/article>/,
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
      "src/components/code-block.tsx",
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

test("uses predictable paragraph wrapping inside post content", async () => {
  const [postCss, themeCss] = await Promise.all([
    readRepositoryFile("src/styles/post.css"),
    readRepositoryFile("src/styles/theme.css"),
  ])

  assert.match(themeCss, /p\s*\{[^}]*text-wrap:\s*pretty/s)
  assert.match(
    postCss,
    /\.post-page \.mdx-content p\s*\{[^}]*text-wrap:\s*wrap/s,
  )
})

test("explains why the blog uses GitHub Pages and Gatsby", async () => {
  const post = await readRepositoryFile(
    "content/posts/why-github-pages-and-gatsby/index.mdx",
  )

  assert.match(
    post,
    /title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기"/,
  )
  assert.match(post, /slug: "why-github-pages-and-gatsby"/)
  assert.match(post, /publishedAt: "2026-04-18"/)
  assert.match(post, /- GitHub Pages/)
  assert.match(post, /- SSG/)
  assert.match(post, /## 블로그를 다시 만들게 된 배경/)
  assert.match(post, /## 먼저 요구사항 정하기/)
  assert.match(post, /## GitHub Pages를 선택한 이유/)
  assert.match(post, /## Gatsby를 선택한 이유/)
  assert.match(post, /## 배포 산출물을 소스 프로젝트로 재구축하기/)
  assert.match(post, /## 최소 프로젝트 구조 만들기/)
  assert.match(post, /## 처음부터 디자인 변경 지점 분리하기/)
  assert.match(post, /## 빌드와 GitHub Pages 배포 확인하기/)
  assert.match(post, /## 다음 글/)
  assert.match(post, /gatsby-config\.mjs/)
  assert.match(post, /deploy-pages\.yml/)
  assert.match(post, /npm run build/)
  assert.doesNotMatch(post, /(?:제목|Gatsby로 블로그[^\n]*)\s*[123]편/)
  assert.doesNotMatch(post, /2025|ERROR #98123|text-red-500/)
})

test("explains the MDX and GraphQL post system", async () => {
  const post = await readRepositoryFile(
    "content/posts/gatsby-mdx-graphql-post-system/index.mdx",
  )

  assert.match(
    post,
    /title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기"/,
  )
  assert.match(post, /slug: "gatsby-mdx-graphql-post-system"/)
  assert.match(post, /publishedAt: "2026-05-16"/)
  assert.match(post, /## 글을 코드에 직접 작성하면 생기는 문제/)
  assert.match(post, /## 포스트 저장 구조 정하기/)
  assert.match(post, /## frontmatter를 글의 계약으로 사용하기/)
  assert.match(post, /## 잘못된 글을 빌드 전에 발견하기/)
  assert.match(post, /## Gatsby가 MDX를 데이터로 바꾸는 과정/)
  assert.match(post, /## GraphQL로 포스트 목록 조회하기/)
  assert.match(post, /## 홈 목록과 상세 페이지 연결하기/)
  assert.match(post, /## slug로 글 URL 만들기/)
  assert.match(post, /## 콘텐츠와 디자인을 분리하기/)
  assert.match(post, /## 새 글 등록 체크리스트/)
  assert.match(post, /content\/posts\/<slug>\/index\.mdx/)
  assert.match(post, /MdxFrontmatter @dontInfer/)
  assert.match(post, /validatePostNodes/)
  assert.match(
    post,
    /allMdx\(sort: \{ frontmatter: \{ publishedAt: DESC \} \}\)/,
  )
  assert.match(post, /sourceInstanceName === "posts"/)
  assert.match(post, /mdx\(id: \{ eq: \$id \}\)/)
  assert.doesNotMatch(post, /(?:제목|Gatsby로 블로그[^\n]*)\s*[123]편/)
})

test("explains how to customize the blog with Tailwind CSS", async () => {
  const post = await readRepositoryFile(
    "content/posts/custom-developer-blog-with-tailwind-css/index.mdx",
  )

  assert.match(
    post,
    /title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기"/,
  )
  assert.match(post, /slug: "custom-developer-blog-with-tailwind-css"/)
  assert.match(post, /publishedAt: "2026-06-27"/)
  assert.match(post, /## 화면을 만들기 전에 디자인 규칙 정하기/)
  assert.match(post, /## UI 시안을 컴포넌트로 나누기/)
  assert.match(post, /## Tailwind CSS에 디자인 토큰 정의하기/)
  assert.match(post, /## 로컬 폰트 적용하기/)
  assert.match(post, /## 824px 콘텐츠 레이아웃 통일하기/)
  assert.match(post, /## 홈 목록과 포스트 화면 스타일링하기/)
  assert.match(post, /## 모바일 레이아웃 설계하기/)
  assert.match(
    post,
    /## Tailwind Preflight와 브라우저 기본 스타일 확인하기/,
  )
  assert.match(post, /## 내 디자인으로 바꾸는 체크포인트/)
  assert.match(post, /## 여러 화면 크기에서 검증하기/)
  assert.match(post, /@theme inline/)
  assert.match(post, /Noto Serif KR/)
  assert.match(post, /max-width: 920px/)
  assert.match(post, /920px - 48px - 48px = 824px/)
  assert.match(post, /4\.5:1/)
  assert.doesNotMatch(post, /(?:제목|Gatsby로 블로그[^\n]*)\s*[123]편/)
})

test("explains how the blog improves long-form reading experience", async () => {
  const post = await readRepositoryFile(
    "content/posts/gatsby-blog-reading-experience/index.mdx",
  )

  assert.match(
    post,
    /title: "긴 기술 글을 읽기 쉽게: Gatsby 블로그 읽기 경험 개선기"/,
  )
  assert.match(post, /slug: "gatsby-blog-reading-experience"/)
  assert.match(post, /publishedAt: "2026-07-19"/)
  assert.match(post, /- Gatsby/)
  assert.match(post, /- MDX/)
  assert.match(post, /- React/)
  assert.match(post, /- Accessibility/)
  assert.match(post, /## 긴 기술 글에서 발견한 세 가지 불편/)
  assert.match(post, /## Vesper로 코드가 읽히게 만들기/)
  assert.match(post, /## MDX 코드 블록에 복사 기능 연결하기/)
  assert.match(post, /## MDX 제목을 목차 데이터로 연결하기/)
  assert.match(post, /## 본문 옆에서 방해되지 않는 목차 UI 만들기/)
  assert.match(post, /## 스크롤 위치에 따라 현재 목차 표시하기/)
  assert.match(post, /## 홈과 포스트에서 맨 위로 버튼 공유하기/)
  assert.match(post, /## 1초 상단 이동을 안전하게 다루기/)
  assert.match(post, /## 검증하고 내 블로그에 적용하기/)
  assert.match(post, /@shikijs\/rehype/)
  assert.match(post, /MDXProvider/)
  assert.match(
    post,
    /서버 렌더링에서는 코드 카드와 언어 이름, 원래 `pre`가 출력되고 복사 버튼은 아직 나타나지 않습니다/,
  )
  assert.doesNotMatch(post, /서버 렌더링에서는 원래 코드만 출력됩니다/)
  assert.match(post, /tableOfContents\(maxDepth: 2\)/)
  assert.match(post, /IntersectionObserver/)
  assert.match(post, /스크롤에 따른 활성 상태 자동 갱신만 생략됩니다/)
  assert.doesNotMatch(post, /환경에서는 활성 상태 갱신만 생략됩니다/)
  assert.match(post, /aria-current/)
  assert.match(post, /SCROLL_DURATION_MS = 1000/)
  assert.match(post, /prefers-reduced-motion/)
  assert.match(post, /48px/)
  assert.match(post, /text-overflow: ellipsis/)
  assert.equal((post.match(/^```(?:javascript|tsx)$/gm) ?? []).length, 5)
  assert.doesNotMatch(
    post,
    /text-wrap: pretty|모바일 Safari|카드 제목 조기 줄바꿈/,
  )
})

test("registers a production verifier for all approved posts", async () => {
  const [packageSource, verifier, styleVerifier] = await Promise.all([
    readRepositoryFile("package.json"),
    readRepositoryFile("scripts/verify-post-build.mjs"),
    readRepositoryFile("scripts/verify-style-build.mjs"),
  ])
  const packageJson = JSON.parse(packageSource)

  assert.equal(
    packageJson.scripts["verify:post"],
    "node scripts/verify-post-build.mjs",
  )
  assert.match(verifier, /why-github-pages-and-gatsby/)
  assert.match(verifier, /gatsby-mdx-graphql-post-system/)
  assert.match(verifier, /custom-developer-blog-with-tailwind-css/)
  assert.match(verifier, /gatsby-blog-reading-experience/)
  assert.match(styleVerifier, /why-github-pages-and-gatsby/)
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
