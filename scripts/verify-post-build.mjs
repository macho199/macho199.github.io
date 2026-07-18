import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"

const publicRoot = new URL("../public/", import.meta.url)
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const postContracts = [
  {
    slug: "gatsby-blog-1-getting-started",
    title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기",
    description:
      "배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다.",
    publishedAt: "2026-04-18",
    publishedAtDisplay: "2026.04.18",
    tags: ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"],
    previousPost: null,
    nextPost: {
      slug: "gatsby-blog-2-managing-mdx-posts",
      title: "Gatsby로 블로그 만들기 2편 - MDX 포스트 관리",
    },
    headings: [
      "왜 소스부터 다시 구축했는가",
      "재현 가능한 Gatsby 5 기준선",
      "MDX와 Tailwind를 별도 단계로 나눈 이유",
      "Tailwind CSS 4와 PostCSS 연결",
      "Preflight 이후 사라진 문서 의미 복원",
      "로컬 폰트와 외부 요청 경계",
      "검증과 단계별 배포 경계",
      "마치며",
    ],
  },
  {
    slug: "gatsby-blog-2-managing-mdx-posts",
    title: "Gatsby로 블로그 만들기 2편 - MDX 포스트 관리",
    description:
      "MDX 글을 디렉터리 단위로 관리하고 frontmatter 스키마와 빌드 전 검증으로 잘못된 날짜·slug·태그를 차단한 과정을 정리합니다.",
    publishedAt: "2026-05-16",
    publishedAtDisplay: "2026.05.16",
    tags: ["Gatsby", "MDX", "GraphQL", "Validation"],
    previousPost: {
      slug: "gatsby-blog-1-getting-started",
      title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기",
    },
    nextPost: {
      slug: "gatsby-blog-3-graphql-page-generation",
      title: "Gatsby로 블로그 만들기 3편 - GraphQL 페이지 생성",
    },
    headings: [
      "포스트 파일과 메타데이터를 한 단위로 묶기",
      "파일을 Gatsby 데이터 레이어에 연결하기",
      "frontmatter를 명시적 계약으로 고정하기",
      "페이지 생성 전에 작성자 입력 검증하기",
      "오류를 모아 빌드를 중단하기",
      "새 글을 추가하는 실제 순서",
      "마치며",
    ],
  },
  {
    slug: "gatsby-blog-3-graphql-page-generation",
    title: "Gatsby로 블로그 만들기 3편 - GraphQL 페이지 생성",
    description:
      "Gatsby 데이터 레이어에서 MDX 글을 조회해 홈 목록과 정적 상세 페이지, SEO·sitemap까지 연결한 흐름을 정리합니다.",
    publishedAt: "2026-06-27",
    publishedAtDisplay: "2026.06.27",
    tags: ["Gatsby", "GraphQL", "MDX", "SEO"],
    previousPost: {
      slug: "gatsby-blog-2-managing-mdx-posts",
      title: "Gatsby로 블로그 만들기 2편 - MDX 포스트 관리",
    },
    nextPost: null,
    headings: [
      "같은 MDX 노드를 두 경로에서 조회하기",
      "홈에서 발행일 역순 목록 만들기",
      "블로그 글만 정적 라우트로 생성하기",
      "id로 상세 데이터와 본문 연결하기",
      "표현 컴포넌트와 GraphQL 경계 분리하기",
      "SEO와 sitemap을 같은 메타데이터에 연결하기",
      "빌드 결과로 전체 흐름 검증하기",
      "마치며",
    ],
  },
]

/**
 * @param {string} source
 * @param {string} tag
 */
const countOpeningTags = (source, tag) =>
  source.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

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

const sitemap = await readFile(new URL("sitemap-0.xml", publicRoot), "utf8")
const generatedPosts = new Map()

for (const contract of postContracts) {
  const html = await readFile(
    new URL(`posts/${contract.slug}/index.html`, publicRoot),
    "utf8",
  )
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

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

const firstPost = generatedPosts.get("gatsby-blog-1-getting-started")
assert.ok(firstPost, "article one generated")
assert.match(firstPost.main, /<blockquote>/)
assert.match(firstPost.main, /<ol>/)
assert.match(firstPost.main, /<ul>/)
assert.match(firstPost.main, /<table>/)
assert.match(
  firstPost.main,
  /<pre\b(?=[^>]*class="[^"]*\bshiki\b[^"]*")(?=[^>]*data-language="javascript")[^>]*><code><span class="line"><span style="color:[^"]+">/,
)
assert.match(
  firstPost.main,
  /<span\b[^>]*class="[^"]*\bcode-block-language\b[^"]*"[^>]*>JavaScript<\/span>/,
)
assert.match(
  firstPost.main,
  /<pre\b(?=[^>]*class="[^"]*\bshiki\b[^"]*")(?=[^>]*data-language="shell")[^>]*>/,
)
assert.match(
  firstPost.main,
  /<span\b[^>]*class="[^"]*\bcode-block-language\b[^"]*"[^>]*>Shell<\/span>/,
)
assert.match(firstPost.main, /제목 크기, 목록 마커, 링크 식별성/)
assert.match(firstPost.main, /4\.5:1/)
assert.match(firstPost.main, /GitHub Actions 배포는 이후 출시 단계에서 연결했습니다/)
assert.doesNotMatch(firstPost.main, /GitHub Actions 배포는 아직 연결하지 않았다/)
assert.doesNotMatch(
  firstPost.main,
  /2025|ERROR #98123|@mdx-js\/react|text-red-500|hello-gatsby-tailwindcss\.png|github-pages-setting\.png/,
)

const secondPost = generatedPosts.get("gatsby-blog-2-managing-mdx-posts")
assert.ok(secondPost, "article two generated")
assert.match(
  secondPost.main,
  /<pre\b(?=[^>]*class="[^"]*\bshiki\b[^"]*")(?=[^>]*data-language="text")[^>]*>/,
)
assert.match(
  secondPost.main,
  /<span\b[^>]*class="[^"]*\bcode-block-language\b[^"]*"[^>]*>Text<\/span>/,
)
assert.match(secondPost.main, /content\/posts\/&lt;slug&gt;\/index\.mdx/)

for (const retiredPath of [
  "posts/mdx-foundation/index.html",
  "posts/create-a-blog-site-with-gatsby1/index.html",
]) {
  await assert.rejects(
    access(new URL(retiredPath, publicRoot)),
    error => error?.code === "ENOENT",
    `post: retired route must not be generated: ${retiredPath}`,
  )
}

assert.doesNotMatch(sitemap, /\/posts\/mdx-foundation\//)
assert.doesNotMatch(sitemap, /\/posts\/create-a-blog-site-with-gatsby1\//)

console.log(
  "post build verified: three content, TOC, metadata, navigation, route, and sitemap contracts passed",
)
