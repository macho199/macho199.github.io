import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"

const publicRoot = new URL("../public/", import.meta.url)
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const postContracts = [
  {
    slug: "why-github-pages-and-gatsby",
    title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기",
    description:
      "무료 정적 호스팅과 React 기반 UI라는 요구사항에서 GitHub Pages와 Gatsby를 선택하고, 배포 파일만 남은 블로그를 소스 프로젝트로 재구축한 과정을 설명합니다.",
    publishedAt: "2026-04-18",
    publishedAtDisplay: "2026.04.18",
    tags: ["Gatsby", "GitHub Pages", "React", "SSG"],
    previousPost: null,
    nextPost: {
      slug: "gatsby-mdx-graphql-post-system",
      title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기",
    },
    headings: [
      "블로그를 다시 만들게 된 배경",
      "먼저 요구사항 정하기",
      "GitHub Pages를 선택한 이유",
      "Gatsby를 선택한 이유",
      "배포 산출물을 소스 프로젝트로 재구축하기",
      "최소 프로젝트 구조 만들기",
      "처음부터 디자인 변경 지점 분리하기",
      "빌드와 GitHub Pages 배포 확인하기",
      "다음 글",
    ],
  },
  {
    slug: "gatsby-mdx-graphql-post-system",
    title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기",
    description:
      "MDX 파일 구조와 frontmatter 계약을 정의하고 Gatsby GraphQL로 목록과 상세 페이지를 생성하는 콘텐츠 파이프라인을 설명합니다.",
    publishedAt: "2026-05-16",
    publishedAtDisplay: "2026.05.16",
    tags: ["Gatsby", "MDX", "GraphQL", "Validation"],
    previousPost: {
      slug: "why-github-pages-and-gatsby",
      title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기",
    },
    nextPost: {
      slug: "custom-developer-blog-with-tailwind-css",
      title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기",
    },
    headings: [
      "글을 코드에 직접 작성하면 생기는 문제",
      "포스트 저장 구조 정하기",
      "frontmatter를 글의 계약으로 사용하기",
      "잘못된 글을 빌드 전에 발견하기",
      "Gatsby가 MDX를 데이터로 바꾸는 과정",
      "GraphQL로 포스트 목록 조회하기",
      "홈 목록과 상세 페이지 연결하기",
      "slug로 글 URL 만들기",
      "콘텐츠와 디자인을 분리하기",
      "새 글 등록 체크리스트",
    ],
  },
  {
    slug: "custom-developer-blog-with-tailwind-css",
    title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기",
    description:
      "Tailwind CSS 디자인 토큰, 로컬 폰트, 824px 레이아웃과 반응형 규칙을 적용해 자신만의 개발자 블로그 UI를 만드는 과정을 설명합니다.",
    publishedAt: "2026-06-27",
    publishedAtDisplay: "2026.06.27",
    tags: ["Tailwind CSS", "React", "Responsive Web", "Accessibility"],
    previousPost: {
      slug: "gatsby-mdx-graphql-post-system",
      title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기",
    },
    nextPost: {
      slug: "gatsby-blog-reading-experience",
      title: "긴 기술 글을 읽기 쉽게: Gatsby 블로그 읽기 경험 개선기",
    },
    headings: [
      "화면을 만들기 전에 디자인 규칙 정하기",
      "UI 시안을 컴포넌트로 나누기",
      "Tailwind CSS에 디자인 토큰 정의하기",
      "로컬 폰트 적용하기",
      "824px 콘텐츠 레이아웃 통일하기",
      "홈 목록과 포스트 화면 스타일링하기",
      "모바일 레이아웃 설계하기",
      "Tailwind Preflight와 브라우저 기본 스타일 확인하기",
      "내 디자인으로 바꾸는 체크포인트",
      "여러 화면 크기에서 검증하기",
    ],
  },
  {
    slug: "gatsby-blog-reading-experience",
    title: "긴 기술 글을 읽기 쉽게: Gatsby 블로그 읽기 경험 개선기",
    description:
      "코드 구문 강조, 복사 인터랙션, MDX 목차와 맨 위로 이동 기능을 연결해 긴 기술 글의 읽기 경험을 개선한 과정을 설명합니다.",
    publishedAt: "2026-07-19",
    publishedAtDisplay: "2026.07.19",
    tags: ["Gatsby", "MDX", "React", "Accessibility"],
    previousPost: {
      slug: "custom-developer-blog-with-tailwind-css",
      title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기",
    },
    nextPost: {
      slug: "gatsby-google-search-console-seo",
      title: "Gatsby 블로그를 Google 검색에 연결하기: Search Console·sitemap·구조화 데이터",
    },
    headings: [
      "긴 기술 글에서 발견한 세 가지 불편",
      "Vesper로 코드가 읽히게 만들기",
      "MDX 코드 블록에 복사 기능 연결하기",
      "MDX 제목을 목차 데이터로 연결하기",
      "본문 옆에서 방해되지 않는 목차 UI 만들기",
      "스크롤 위치에 따라 현재 목차 표시하기",
      "홈과 포스트에서 맨 위로 버튼 공유하기",
      "1초 상단 이동을 안전하게 다루기",
      "검증하고 내 블로그에 적용하기",
    ],
  },
  {
    slug: "gatsby-google-search-console-seo",
    title: "Gatsby 블로그를 Google 검색에 연결하기: Search Console·sitemap·구조화 데이터",
    description:
      "Gatsby 블로그의 Google Search Console 소유권을 확인하고 robots.txt·sitemap·BlogPosting 구조화 데이터를 연결한 뒤, 가져오기 오류를 진단해 성공 상태까지 확인한 과정을 설명합니다.",
    publishedAt: "2026-07-20",
    publishedAtDisplay: "2026.07.20",
    tags: ["Gatsby", "Google Search Console", "SEO", "Sitemap"],
    previousPost: {
      slug: "gatsby-blog-reading-experience",
      title: "긴 기술 글을 읽기 쉽게: Gatsby 블로그 읽기 경험 개선기",
    },
    nextPost: null,
    headings: [
      "배포한 블로그는 자동으로 검색될까",
      "현재 블로그의 검색 노출 기반 점검하기",
      "Search Console에 블로그 소유권 확인하기",
      "robots.txt에서 sitemap 안내하기",
      "포스트를 BlogPosting으로 설명하기",
      "빌드 결과에서 SEO 설정 검증하기",
      "Search Console에 sitemap 제출하기",
      "‘가져올 수 없음’을 만났을 때 진단하기",
      "내 Gatsby 블로그에 적용하는 체크리스트",
    ],
  },
]

/**
 * @param {string} source
 * @param {string} tag
 */
const countOpeningTags = (source, tag) =>
  source.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

/**
 * @param {string} html
 * @param {string} slug
 */
const assertLocalFavicon = (html, slug) => {
  const links = html.match(
    /<link\b(?=[^>]*rel="icon")(?=[^>]*href="\/favicon\.png")[^>]*>/g,
  ) ?? []

  assert.equal(links.length, 1, `${slug}: one local favicon link`)
  assert.doesNotMatch(html, /avatars\.githubusercontent\.com/)
}

/** @param {string} value */
const normalizeText = value =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

/** @param {string} attributes */
const readId = attributes => attributes.match(/\bid="([^"]+)"/)?.[1] ?? ""

/** @param {string} source */
const readH2Outline = source =>
  [...source.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g)].map(match => ({
    id: readId(match[1]),
    text: normalizeText(match[2]),
  }))

/** @param {string} source */
const readTocLinks = source => {
  const tocMatch = source.match(
    /<nav\b[^>]*aria-label="글 목차"[^>]*>([\s\S]*?)<\/nav>/,
  )

  assert.ok(tocMatch, "post: table of contents landmark")

  return [...tocMatch[1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter(match => /class="[^"]*\bpost-toc-link\b[^"]*"/.test(match[1]))
    .map(match => ({
      href: match[1].match(/\bhref="([^"]+)"/)?.[1] ?? "",
      text: normalizeText(match[2]),
      current:
        match[1].match(/\baria-current="([^"]+)"/)?.[1] ?? "",
    }))
}

/** @param {string} href */
const decodeTocId = href => {
  assert.match(href, /^#.+/, "post: TOC href is a non-empty fragment")
  return decodeURIComponent(href.slice(1))
}

/**
 * @param {{ previousPost: { slug: string, title: string } | null, nextPost: { slug: string, title: string } | null }} contract
 */
const expectedNavigationLinks = contract =>
  [
    contract.previousPost && {
      href: `/posts/${contract.previousPost.slug}/`,
      text: `이전 글 ${contract.previousPost.title}`,
    },
    contract.nextPost && {
      href: `/posts/${contract.nextPost.slug}/`,
      text: `다음 글 ${contract.nextPost.title}`,
    },
  ].filter(Boolean)

/**
 * @param {string} html
 * @param {string} slug
 */
const readBlogPosting = (html, slug) => {
  const scripts = [
    ...html.matchAll(
      /<script\b(?=[^>]*id="blog-posting-json-ld")(?=[^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ]

  assert.equal(scripts.length, 1, `${slug}: one BlogPosting JSON-LD script`)
  return JSON.parse(scripts[0][1])
}

const [robots, sitemapIndex, sitemap] = await Promise.all([
  readFile(new URL("robots.txt", publicRoot), "utf8"),
  readFile(new URL("sitemap-index.xml", publicRoot), "utf8"),
  readFile(new URL("sitemap-0.xml", publicRoot), "utf8"),
])

assert.equal(
  robots,
  "User-agent: *\nAllow: /\n\nSitemap: https://macho199.github.io/sitemap-index.xml\n",
)
assert.match(
  sitemapIndex,
  /<loc>https:\/\/macho199\.github\.io\/sitemap-0\.xml<\/loc>/,
)
assert.doesNotMatch(sitemap, /https:\/\/macho199\.github\.io\/404(?:\.html)?/)

const generatedPosts = new Map()

for (const contract of postContracts) {
  const html = await readFile(
    new URL(`posts/${contract.slug}/index.html`, publicRoot),
    "utf8",
  )
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

  assertLocalFavicon(html, contract.slug)

  assert.doesNotMatch(
    html,
    /\u0000/,
    `${contract.slug}: generated HTML contains no NUL bytes`,
  )
  assert.ok(mainMatch, `${contract.slug}: main landmark`)

  const main = mainMatch[1]
  generatedPosts.set(contract.slug, { html, main })

  assert.equal(countOpeningTags(main, "h1"), 1, `${contract.slug}: one page heading`)
  assert.match(main, /<nav\b[^>]*aria-label="게시글 탐색"[^>]*>/)
  assert.match(
    main,
    /<a\b(?=[^>]*href="\/")(?=[^>]*class="[^"]*post-back-link[^"]*")[^>]*>\s*← 게시글 목록\s*<\/a>/,
  )
  assert.match(main, /<article\b[^>]*class="[^"]*post-page[^"]*"[^>]*>/)
  assert.match(
    main,
    new RegExp(
      `<h1\\b[^>]*class="[^"]*post-title[^"]*"[^>]*>${escapeRegex(contract.title)}</h1>`,
    ),
  )
  assert.match(main, new RegExp(escapeRegex(contract.description)))
  assert.match(
    main,
    new RegExp(
      `<time\\b(?=[^>]*class="[^"]*post-date[^"]*")(?=[^>]*datetime="${contract.publishedAt}")[^>]*>\\s*${escapeRegex(contract.publishedAtDisplay)}\\s*</time>`,
      "i",
    ),
  )

  const visibleTags = [
    ...main.matchAll(
      /<span\b(?=[^>]*class="[^"]*\bpost-tag\b[^"]*")[^>]*>([^<]*)<\/span>/g,
    ),
  ].map(match => match[1])
  const articleTagValues = [
    ...html.matchAll(
      /<meta\b(?=[^>]*property="article:tag")(?=[^>]*content="([^"]*)")[^>]*>/g,
    ),
  ].map(match => match[1])

  assert.deepEqual(visibleTags, contract.tags, `${contract.slug}: exact visible tags`)
  assert.deepEqual(
    articleTagValues,
    contract.tags,
    `${contract.slug}: exact article tag metadata`,
  )

  const navigationMatch = main.match(
    /<nav\b[^>]*aria-label="이전·다음 게시글"[^>]*>([\s\S]*?)<\/nav>/,
  )
  assert.ok(navigationMatch, `${contract.slug}: post navigation landmark`)

  const navigationLinks = [
    ...navigationMatch[1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g),
  ]
    .filter(match => /class="[^"]*\bpost-navigation-card\b[^"]*"/.test(match[1]))
    .map(match => ({
      href: match[1].match(/\bhref="([^"]*)"/)?.[1],
      text: normalizeText(match[2]),
    }))

  assert.deepEqual(
    navigationLinks,
    expectedNavigationLinks(contract),
    `${contract.slug}: exact previous and next post navigation`,
  )

  const h2Outline = readH2Outline(main)
  const tocLinks = readTocLinks(main)

  assert.deepEqual(
    h2Outline.map(heading => heading.text),
    contract.headings,
    `${contract.slug}: exact H2 outline`,
  )
  assert.ok(
    h2Outline.every(heading => heading.id.length > 0),
    `${contract.slug}: every H2 has an id`,
  )
  assert.deepEqual(
    tocLinks.map(({ href, text }) => ({
      id: decodeTocId(href),
      text,
    })),
    h2Outline.map(({ id, text }) => ({ id, text })),
    `${contract.slug}: TOC links exactly match H2 ids and order`,
  )
  assert.equal(
    tocLinks.filter(link => link.current === "location").length,
    1,
    `${contract.slug}: one initial current TOC link`,
  )

  assert.match(
    html,
    new RegExp(`<title[^>]*>${escapeRegex(contract.title)} \\| Developer Blog</title>`),
  )
  assert.match(
    html,
    new RegExp(
      `<meta\\b(?=[^>]*name="description")(?=[^>]*content="${escapeRegex(contract.description)}")[^>]*>`,
    ),
  )
  assert.match(
    html,
    new RegExp(
      `<link\\b(?=[^>]*rel="canonical")(?=[^>]*href="https:\\/\\/macho199\\.github\\.io\\/posts\\/${escapeRegex(contract.slug)}\\/")[^>]*>`,
    ),
  )
  const canonicalUrl =
    `https://macho199.github.io/posts/${contract.slug}/`
  const blogPosting = readBlogPosting(html, contract.slug)

  assert.deepEqual(blogPosting, {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: contract.title,
    description: contract.description,
    datePublished: contract.publishedAt,
    url: canonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Person",
      name: "권종성",
      url: "https://github.com/macho199",
    },
    keywords: contract.tags,
  })
  assert.match(
    html,
    new RegExp(
      `<meta\\b(?=[^>]*property="article:published_time")(?=[^>]*content="${contract.publishedAt}")[^>]*>`,
    ),
  )
  assert.equal(
    countOpeningTags(main, "button"),
    0,
    `${contract.slug}: no inactive buttons`,
  )
  assert.doesNotMatch(
    main,
    /class="[^"]*(?:code-copy|reading-time|related-posts|post-pagination)[^"]*"/,
  )
  assert.doesNotMatch(
    main,
    />\s*(?:관련 글|\d+\s*분 읽기)\s*</,
  )
  assert.match(
    sitemap,
    new RegExp(
      `https:\\/\\/macho199\\.github\\.io\\/posts\\/${escapeRegex(contract.slug)}\\/`,
    ),
  )
}

const firstPost = generatedPosts.get("why-github-pages-and-gatsby")
assert.ok(firstPost, "GitHub Pages and Gatsby article generated")
assert.match(firstPost.main, /GitHub Pages를 선택한 이유/)
assert.match(firstPost.main, /Gatsby를 선택한 이유/)

const secondPost = generatedPosts.get("gatsby-mdx-graphql-post-system")
assert.ok(secondPost, "MDX and GraphQL article generated")
assert.match(secondPost.main, /content\/posts\/&lt;slug&gt;\/index\.mdx/)

const thirdPost = generatedPosts.get("custom-developer-blog-with-tailwind-css")
assert.ok(thirdPost, "Tailwind customization article generated")
assert.match(thirdPost.main, /920px - 48px - 48px = 824px/)
assert.match(thirdPost.main, /4\.5:1/)

const fourthPost = generatedPosts.get("gatsby-blog-reading-experience")
assert.ok(fourthPost, "reading experience article generated")
assert.match(fourthPost.main, /@shikijs\/rehype/)
assert.match(fourthPost.main, /tableOfContents\(maxDepth: 2\)/)
assert.match(fourthPost.main, /IntersectionObserver/)
assert.match(fourthPost.main, /SCROLL_DURATION_MS = 1000/)
assert.match(fourthPost.main, /48px/)
assert.match(fourthPost.main, /text-overflow: ellipsis/)

const fifthPost = generatedPosts.get("gatsby-google-search-console-seo")
assert.ok(fifthPost, "Google Search Console article generated")
assert.match(fifthPost.main, /YOUR_GOOGLE_SITE_VERIFICATION/)
assert.match(fifthPost.main, /sitemap-index\.xml/)
assert.match(fifthPost.main, /BlogPosting/)
assert.ok(fifthPost.main.includes("application/xml"))
assert.match(fifthPost.main, /Googlebot/)
assert.match(fifthPost.main, /최종적으로/)
assert.match(fifthPost.main, />성공<\/code>/)

const retiredSlugs = [
  "mdx-foundation",
  "create-a-blog-site-with-gatsby1",
  "gatsby-blog-1-getting-started",
  "gatsby-blog-2-managing-mdx-posts",
  "gatsby-blog-3-graphql-page-generation",
]

for (const slug of retiredSlugs) {
  await assert.rejects(
    access(new URL(`posts/${slug}/index.html`, publicRoot)),
    error => error?.code === "ENOENT",
    `post: retired route must not be generated: ${slug}`,
  )
  assert.doesNotMatch(sitemap, new RegExp(`/posts/${slug}/`))
}

console.log(
  "post build verified: five content, TOC, metadata, navigation, route, and sitemap contracts passed",
)
