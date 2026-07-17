# Developer Blog Post Static Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 포스트 읽기 화면을 Gatsby에 구현하고, 기존 공개 글 한 편과 이미지 두 장을 보수적으로 이전한다.

**Architecture:** `src/templates/post.tsx`가 GraphQL 조회와 페이지 조립을 소유하고, 표현 전용 `PostHeader`에는 타입이 지정된 메타데이터만 전달한다. MDX는 의미 있는 Markdown으로 유지하며 `.post-page .mdx-content` 아래의 `post.css`가 외형만 담당한다. 홈·레이아웃·스타일·포스트 프로덕션 검증기는 실제 이전 글을 단일 기준 데이터로 사용한다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, MDX 2.3.0, Tailwind CSS 4.3.3, Node.js 24.14.1 built-in test runner

## Global Constraints

- 구현 대상은 GitHub #18 `포스트 정적 화면 및 기존 Gatsby 글 이전` 하나이며 대표 이슈는 #13이다.
- 새 게시글 경로는 `/posts/gatsby-blog-1-getting-started/`로 고정한다.
- 기존 샘플 `/posts/mdx-foundation/`과 예전 공개 경로 `/posts/create-a-blog-site-with-gatsby1/`는 새 빌드에서 생성하지 않는다.
- 원문의 경험·장 순서·발행일 `2025-08-31`은 보존하고, 맞춤법과 오래된 기술 안내만 보수적으로 바로잡는다.
- 이미지 두 장은 `static/images/posts/gatsby-blog-1-getting-started/`에서 자체 제공한다.
- GraphQL과 페이지 조립은 템플릿에, 메타데이터 표현은 `PostHeader`에, 본문 외형은 `post.css`에 둔다.
- MDX 본문은 H2부터 시작하며 페이지 전체의 H1은 `PostHeader` 하나뿐이다.
- 목차, 읽기 시간, 코드 복사, 문법 강조, 이전·다음 글, 관련 글, 리다이렉트, 신규 의존성은 구현하지 않는다.
- 픽셀 스냅샷이나 CSS 파일 전체 문자열을 고정하는 테스트는 만들지 않는다.
- 소스 계약 테스트, 타입 검사, 프로덕션 빌드, 기존 검증기, 포스트 검증기, 1440px·1020px·390px 브라우저 확인을 통과해야 한다.
- `content/posts/mdx-foundation/index.mdx` 삭제 직전에는 정확한 대상 경로를 한 줄로 알리고 종성님의 확인을 다시 받는다.
- `npm run clean`은 생성물 `.cache/`와 `public/`을 삭제하므로 실행 직전에 한 줄로 알리고 종성님의 확인을 받는다.
- `.playwright-cli/` 등 작업 전부터 있던 사용자 파일은 수정·삭제·커밋하지 않는다.
- 구현과 로컬 검증이 끝난 뒤 종성님 확인과 Codex 리뷰를 요청한다.
- 종성님의 명시적 지시 전에는 원격 푸시·PR 생성·Ready 전환·병합을 수행하지 않는다.
- 병합과 로컬 `develop` 동기화가 끝날 때까지 다음 UI 하위 이슈를 만들거나 구현하지 않는다.

## File Structure

- Create `src/components/post-header.tsx`: 태그·제목·설명·발행일 표현과 `PostHeaderData` 타입을 소유한다.
- Create `src/components/post-screen-contract.test.mjs`: 컴포넌트·템플릿·스타일·콘텐츠·검증 명령의 소스 계약을 확인한다.
- Modify `src/templates/post.tsx`: 목록 복귀 내비게이션, `PostHeader`, 포스트 본문 경계와 두 날짜 GraphQL 필드를 조립한다.
- Create `src/styles/post.css`: 포스트 헤더, 본문 의미 요소와 반응형 외형을 포스트 경계 안에서만 정의한다.
- Modify `gatsby-browser.js`: `post.css`를 전역 진입점에서 한 번 불러온다.
- Delete `content/posts/mdx-foundation/index.mdx`: 기반 확인용 샘플을 실제 글로 교체한다.
- Create `content/posts/gatsby-blog-1-getting-started/index.mdx`: 보수적으로 교정한 기존 글을 저장한다.
- Create `static/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png`: 기존 글의 Tailwind CSS 확인 이미지다.
- Create `static/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png`: 기존 글의 GitHub Pages 설정 이미지다.
- Modify `scripts/verify-style-build.mjs`: 실제 포스트 경로에서 자체 제공 폰트를 검증한다.
- Modify `scripts/verify-layout-build.mjs`: 실제 포스트 경로에서 공통 레이아웃을 검증한다.
- Modify `scripts/verify-home-build.mjs`: 홈 카드의 기준 데이터를 새 실제 글로 바꾼다.
- Create `scripts/verify-post-build.mjs`: 포스트 HTML, SEO, 자산, 제외 범위와 폐기 경로를 검증한다.
- Modify `package.json`: `verify:post` 명령을 등록한다.
- Add `docs/superpowers/specs/2026-07-18-post-static-screen-design.md`: 승인된 설계를 보존한다.
- Add `docs/superpowers/plans/2026-07-18-post-static-screen.md`: 이 실행 계획을 보존한다.

---

### Task 1: Typed Post Header and Gatsby Template Boundary

**Files:**
- Create: `src/components/post-screen-contract.test.mjs`
- Create: `src/components/post-header.tsx`
- Modify: `src/templates/post.tsx`

**Interfaces:**
- Consumes: Gatsby `Link`, GraphQL `PageProps`, existing `Layout`, `ContentContainer`, `Seo`, MDX `children`
- Produces: `PostHeaderData`, `PostHeader({ post })`, CSS hooks `post-back-nav`, `post-back-link`, `post-page`, `post-header`, `post-tags`, `post-tag`, `post-title`, `post-description`, `post-date`, `mdx-content`
- `PostHeaderData`: `{ title, description, tags, publishedAt, publishedAtDisplay }`

- [ ] **Step 1: Write the failing header and template contract tests**

Create `src/components/post-screen-contract.test.mjs`:

```js
import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

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
    /<article className="post-page">[\s\S]*<PostHeader post=\{frontmatter\} \/>[\s\S]*<div className="mdx-content">\{children\}<\/div>[\s\S]*<\/article>/,
  )
  assert.match(postTemplate, /publishedAt\(formatString: "YYYY-MM-DD"\)/)
  assert.match(
    postTemplate,
    /publishedAtDisplay: publishedAt\(formatString: "YYYY\.MM\.DD"\)/,
  )
  assert.doesNotMatch(postTemplate, /<h1\b|<button\b/)
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const sources = await Promise.all(
    ["src/components/post-header.tsx", "src/templates/post.tsx"].map(
      readRepositoryFile,
    ),
  )

  for (const source of sources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
```

Expected: the three tests FAIL because `post-header.tsx` does not exist and the current template still owns inline metadata markup.

- [ ] **Step 3: Add the typed presentation-only header**

Create `src/components/post-header.tsx`:

```tsx
import * as React from "react"

export type PostHeaderData = Readonly<{
  title: string
  description: string
  tags: readonly string[]
  publishedAt: string
  publishedAtDisplay: string
}>

type PostHeaderProps = Readonly<{
  post: PostHeaderData
}>

const PostHeader = ({ post }: PostHeaderProps) => (
  <header className="post-header">
    {post.tags.length > 0 ? (
      <ul className="post-tags" aria-label="태그">
        {post.tags.map((tag, index) => (
          <li key={`${tag}-${index}`}>
            <span className="post-tag">{tag}</span>
          </li>
        ))}
      </ul>
    ) : null}
    <h1 className="post-title">{post.title}</h1>
    <p className="post-description">{post.description}</p>
    <time className="post-date" dateTime={post.publishedAt}>
      {post.publishedAtDisplay}
    </time>
  </header>
)

export default PostHeader
```

- [ ] **Step 4: Replace the inline post markup with the approved composition**

Replace `src/templates/post.tsx` with:

```tsx
import { graphql, Link, type HeadFC, type PageProps } from "gatsby"
import * as React from "react"
import type { ReactNode } from "react"

import ContentContainer from "../components/content-container"
import Layout from "../components/layout"
import PostHeader, { type PostHeaderData } from "../components/post-header"
import Seo from "../components/seo"

type PostData = Readonly<{
  mdx: Readonly<{
    frontmatter: PostHeaderData &
      Readonly<{
        slug: string
      }>
  }>
}>

type PostTemplateProps = PageProps<PostData> &
  Readonly<{
    children: ReactNode
  }>

const PostTemplate = ({ data, children }: PostTemplateProps) => {
  const { frontmatter } = data.mdx

  return (
    <Layout>
      <ContentContainer>
        <nav className="post-back-nav" aria-label="게시글 탐색">
          <Link to="/" className="post-back-link">
            ← 게시글 목록
          </Link>
        </nav>
        <article className="post-page">
          <PostHeader post={frontmatter} />
          <div className="mdx-content">{children}</div>
        </article>
      </ContentContainer>
    </Layout>
  )
}

export default PostTemplate

export const query = graphql`
  query PostById($id: String!) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        slug
        publishedAt(formatString: "YYYY-MM-DD")
        publishedAtDisplay: publishedAt(formatString: "YYYY.MM.DD")
        description
        tags
      }
    }
  }
`

export const Head: HeadFC<PostData> = ({ data, location }) => (
  <Seo
    title={data.mdx.frontmatter.title}
    description={data.mdx.frontmatter.description}
    pathname={location.pathname}
    type="article"
    publishedAt={data.mdx.frontmatter.publishedAt}
    tags={[...data.mdx.frontmatter.tags]}
  />
)
```

- [ ] **Step 5: Run focused and existing regression checks**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: focused tests PASS 3/3, the full source suite passes, and TypeScript exits 0.

- [ ] **Step 6: Commit the header and template boundary**

```bash
git add src/components/post-header.tsx src/components/post-screen-contract.test.mjs src/templates/post.tsx
git commit -m "feat: add typed post reading header"
```

### Task 2: Scoped Post Styles and Responsive Reading Layout

**Files:**
- Modify: `src/components/post-screen-contract.test.mjs`
- Create: `src/styles/post.css`
- Modify: `gatsby-browser.js`

**Interfaces:**
- Consumes: Task 1 CSS hooks, existing theme tokens, 920px `site-container`, existing minimal `mdx.css` resets
- Produces: 760px reading measure, responsive post header, semantic MDX styles, local overflow containment

- [ ] **Step 1: Add failing style boundary tests**

Append to `src/components/post-screen-contract.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
```

Expected: the new style test FAILS because `post.css` is not present or registered.

- [ ] **Step 3: Add the complete scoped post stylesheet**

Create `src/styles/post.css`:

```css
@layer components {
  .post-back-nav {
    max-width: 760px;
    padding-block: var(--space-8) var(--space-4);
  }

  .post-back-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--muted);
    font-size: var(--text-sm);
    font-weight: 500;
    text-decoration: none;
  }

  .post-back-link:hover {
    color: var(--fg);
    text-decoration: underline;
  }

  .post-page {
    min-width: 0;
    padding-bottom: var(--section-y-desktop);
  }

  .post-header {
    display: grid;
    max-width: 760px;
    gap: var(--space-4);
    padding-block: var(--space-6) var(--space-12);
    border-bottom: 1px solid var(--border);
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .post-tag {
    display: inline-flex;
    gap: var(--space-1);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 500;
  }

  .post-tag::before {
    color: var(--accent);
    content: "#";
  }

  .post-title {
    color: var(--fg);
    font-size: clamp(30px, 4vw, 40px);
    overflow-wrap: anywhere;
  }

  .post-description {
    max-width: 760px;
    color: var(--fg-2);
    font-size: var(--text-lg);
    line-height: 1.65;
    overflow-wrap: anywhere;
  }

  .post-date {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }

  .post-page .mdx-content {
    max-width: 760px;
    padding-top: var(--space-12);
    color: var(--fg-2);
    font-size: var(--text-base);
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  .post-page .mdx-content :where(h2, h3, h4, h5) {
    color: var(--fg);
    overflow-wrap: anywhere;
    scroll-margin-top: var(--space-8);
  }

  .post-page .mdx-content h2 {
    margin-block: var(--space-16) var(--space-5);
    font-size: clamp(25px, 3vw, 30px);
  }

  .post-page .mdx-content h3 {
    margin-block: var(--space-12) var(--space-4);
    font-family: var(--font-body);
    font-size: var(--text-xl);
    font-weight: 600;
    line-height: 1.4;
  }

  .post-page .mdx-content h4 {
    margin-block: var(--space-8) var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-lg);
    font-weight: 600;
    line-height: 1.45;
  }

  .post-page .mdx-content h5 {
    margin-block: var(--space-6) var(--space-2);
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.5;
  }

  .post-page .mdx-content :where(p, ul, ol, blockquote, pre, table, hr) {
    margin-block: var(--space-5);
  }

  .post-page .mdx-content :where(ul, ol) {
    padding-inline-start: 1.6rem;
  }

  .post-page .mdx-content :where(ul, ol) :where(ul, ol) {
    margin-block: var(--space-2);
  }

  .post-page .mdx-content li + li {
    margin-top: var(--space-2);
  }

  .post-page .mdx-content a {
    overflow-wrap: anywhere;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.2em;
  }

  .post-page .mdx-content blockquote {
    margin-inline: 0;
    padding: var(--space-4) var(--space-5);
    border-left: 3px solid var(--accent);
    background: var(--surface-warm);
    color: var(--muted);
  }

  .post-page .mdx-content blockquote > :first-child {
    margin-top: 0;
  }

  .post-page .mdx-content blockquote > :last-child {
    margin-bottom: 0;
  }

  .post-page .mdx-content :not(pre) > code {
    padding: 0.15em 0.38em;
    border: 1px solid var(--border-soft);
    border-radius: 6px;
    background: var(--surface);
    color: var(--fg);
    font-size: 0.9em;
    overflow-wrap: anywhere;
  }

  .post-page .mdx-content pre {
    max-width: 100%;
    padding: var(--space-5);
    overflow-x: auto;
    border: 1px solid #262626;
    border-radius: var(--radius-sm);
    background: #171717;
    color: #f5f5f5;
    font-size: var(--text-sm);
    line-height: 1.7;
    tab-size: 2;
  }

  .post-page .mdx-content pre code {
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: inherit;
    overflow-wrap: normal;
  }

  .post-page .mdx-content img {
    display: block;
    width: auto;
    max-width: 100%;
    height: auto;
    margin-block: var(--space-8);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .post-page .mdx-content hr {
    border: 0;
    border-top: 1px solid var(--border);
  }

  .post-page .mdx-content table {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    white-space: nowrap;
  }

  .post-page .mdx-content :where(th, td) {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    text-align: left;
  }

  .post-page .mdx-content th {
    background: var(--surface-warm);
    color: var(--fg);
    font-weight: 600;
  }

  .post-page .mdx-content strong {
    color: var(--fg);
    font-weight: 600;
  }
}

@media (max-width: 1020px) {
  .post-back-nav {
    padding-top: var(--space-6);
  }

  .post-page {
    padding-bottom: var(--section-y-tablet);
  }

  .post-header {
    padding-bottom: var(--space-8);
  }

  .post-page .mdx-content {
    padding-top: var(--space-8);
  }
}

@media (max-width: 720px) {
  .post-back-nav {
    padding-block: var(--space-4) var(--space-2);
  }

  .post-page {
    padding-bottom: var(--section-y-phone);
  }

  .post-header {
    gap: var(--space-3);
    padding-block: var(--space-4) var(--space-8);
  }

  .post-title {
    font-size: clamp(30px, 10vw, 36px);
  }

  .post-description {
    font-size: var(--text-base);
  }

  .post-page .mdx-content {
    padding-top: var(--space-6);
    line-height: 1.75;
  }

  .post-page .mdx-content h2 {
    margin-top: var(--space-12);
  }

  .post-page .mdx-content h3 {
    margin-top: var(--space-8);
  }

  .post-page .mdx-content :where(ul, ol) {
    padding-inline-start: 1.25rem;
  }

  .post-page .mdx-content blockquote {
    padding: var(--space-3) var(--space-4);
  }

  .post-page .mdx-content pre {
    padding: var(--space-4);
  }
}
```

- [ ] **Step 4: Register post styles after the existing home stylesheet**

Append to `gatsby-browser.js`:

```js
import "./src/styles/post.css"
```

- [ ] **Step 5: Run focused and full source checks**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: the focused suite PASS 4/4, the full source suite passes, and TypeScript exits 0.

- [ ] **Step 6: Commit the isolated reading styles**

```bash
git add gatsby-browser.js src/components/post-screen-contract.test.mjs src/styles/post.css
git commit -m "feat: style responsive post content"
```

### Task 3: Replace the Sample with the Conservatively Edited Real Post

**Files:**
- Modify: `src/components/post-screen-contract.test.mjs`
- Delete: `content/posts/mdx-foundation/index.mdx`
- Create: `content/posts/gatsby-blog-1-getting-started/index.mdx`
- Create: `static/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png`
- Create: `static/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png`

**Interfaces:**
- Consumes: old public article text and two approved public PNG originals
- Produces: one valid MDX post, two local image URLs, no sample post
- Image SHA-256: `7254fe8aecf723228f6575b291d7c021edb874d96f7cf1e9c6760d2e66209863`, `3117bd7678f998b53893294a6da7afb4c92bd82874270b42ab8be47a9033d220`

- [ ] **Step 1: Add a failing real-content contract test**

Append to `src/components/post-screen-contract.test.mjs`:

```js
test("uses the approved real post and local image assets", async () => {
  const [post, oldSample] = await Promise.all([
    readRepositoryFile("content/posts/gatsby-blog-1-getting-started/index.mdx"),
    readRepositoryFile("content/posts/mdx-foundation/index.mdx"),
  ])

  assert.match(post, /title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기"/)
  assert.match(post, /slug: "gatsby-blog-1-getting-started"/)
  assert.match(post, /publishedAt: "2025-08-31"/)
  assert.match(post, /2026년 재구축 과정에서 다시 검증하고 보수적으로 다듬었습니다/)
  assert.match(post, /npm init gatsby/)
  assert.match(post, /npm run serve/)
  assert.match(
    post,
    /\/images\/posts\/gatsby-blog-1-getting-started\/hello-gatsby-tailwindcss\.png/,
  )
  assert.match(
    post,
    /\/images\/posts\/gatsby-blog-1-getting-started\/github-pages-setting\.png/,
  )
  assert.doesNotMatch(post, /npm install -g gatsby-cli|npm audit fix/)
  assert.match(post, /`file:\/\/` 주소로 직접 열면/)
  assert.equal(oldSample, "")

  await Promise.all([
    access(
      new URL(
        "static/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png",
        repositoryRoot,
      ),
    ),
    access(
      new URL(
        "static/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png",
        repositoryRoot,
      ),
    ),
  ])
})
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
```

Expected: the content test FAILS because the approved post and image assets do not exist and the sample still exists.

- [ ] **Step 3: Announce and confirm the exact sample deletion**

Send this one-line confirmation request before editing:

```text
이제 승인된 교체 작업으로 content/posts/mdx-foundation/index.mdx 한 파일을 삭제하고 실제 Gatsby 글로 대체할게요. 삭제를 진행해도 될까요?
```

Wait for explicit approval. Do not delete any file before approval.

- [ ] **Step 4: Replace the sample with the complete approved MDX article**

Delete `content/posts/mdx-foundation/index.mdx` with `apply_patch`, then create `content/posts/gatsby-blog-1-getting-started/index.mdx` with the following complete content:

````mdx
---
title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기"
slug: "gatsby-blog-1-getting-started"
publishedAt: "2025-08-31"
description: "Gatsby와 GitHub Pages로 개발자 블로그를 시작하며 정적 사이트 생성 방식, 프로젝트 설정, Tailwind CSS 확인, 당시 배포 과정을 정리합니다."
tags:
  - Gatsby
  - GitHub Pages
  - React
  - Tailwind CSS
---

> 이 글은 2025년에 작성한 원문을 개발자 블로그의 2026년 재구축 과정에서 다시 검증하고 보수적으로 다듬었습니다. 당시의 시행착오와 흐름은 유지하되, 지금 그대로 따라 하면 오해할 수 있는 명령과 설명은 현재 기준에 맞게 바로잡았습니다.

## 개발자를 위한 블로그 구축

블로그 플랫폼에는 네이버 블로그, 티스토리, 구글 블로거처럼 다양한 선택지가 있습니다. 이런 플랫폼은 빠르게 시작할 수 있고 관리 기능도 편리하지만, 개발자에게는 원하는 기능을 직접 구현하기 어렵고 플랫폼에 종속된다는 한계가 있습니다.

개발자가 자신만의 블로그를 만드는 가장 큰 이유는 **구조와 기능을 직접 통제할 수 있기 때문**입니다. 다만 개인 서버를 직접 운영하면 비용과 관리 부담이 생깁니다. 이때 정적 파일을 호스팅하는 [GitHub Pages](https://docs.github.com/en/pages)를 활용하면 작은 개발자 블로그를 비교적 단순하게 운영할 수 있습니다.

### GitHub Pages의 장점

GitHub Pages는 HTML, CSS, JavaScript 같은 정적 파일을 GitHub 저장소에서 제공하는 호스팅 서비스입니다.

- 개인 또는 오픈소스 프로젝트를 위한 공개 사이트를 시작하기 쉽습니다.
- 별도의 애플리케이션 서버를 계속 운영하지 않아도 됩니다.
- 저장소의 변경 이력과 사이트 변경 이력을 함께 관리할 수 있습니다.

> 요금과 사용 제한은 바뀔 수 있으므로 실제 적용 전에는 [GitHub Pages 공식 문서](https://docs.github.com/en/pages)를 확인하는 편이 안전합니다.

## 정적 사이트 생성기(SSG) 이해하기

순수 HTML, CSS, JavaScript만으로도 블로그를 만들 수 있습니다. 하지만 글이 늘어나면 페이지 구성, 목록 생성, 공통 레이아웃과 메타데이터 관리가 반복됩니다. Gatsby 같은 정적 사이트 생성기(SSG)는 이 반복을 빌드 과정으로 옮깁니다.

- **데이터 레이어:** 파일과 콘텐츠를 일정한 방식으로 조회할 수 있습니다.
- **컴포넌트 재사용:** 공통 화면을 React 컴포넌트로 나눌 수 있습니다.
- **유지보수성:** 콘텐츠와 표현 구조를 분리해 장기적으로 관리하기 쉽습니다.

도구를 익히는 비용은 있지만, 한 번 구조를 이해하면 다른 정적 사이트에도 비슷한 방식을 적용할 수 있습니다.

### React 앱과 Gatsby의 차이

React로 만든 일반적인 단일 페이지 애플리케이션(SPA)은 브라우저에서 JavaScript가 실행된 뒤 화면의 많은 부분을 그립니다. Gatsby는 빌드 시점에 페이지별 HTML을 먼저 만들 수 있습니다.

이 차이 덕분에 정적인 글 페이지에서는 다음 이점을 기대할 수 있습니다.

1. 첫 화면에 필요한 HTML을 미리 제공할 수 있습니다.
2. 검색 엔진이 글의 기본 구조를 읽기 쉽습니다.
3. 정적 자산 중심으로 배포 구조를 단순화할 수 있습니다.

> 동적인 기능도 추가할 수 있습니다. 다만 기능이 늘수록 클라이언트 JavaScript와 빌드 구조도 함께 복잡해지므로 블로그에 꼭 필요한 기능부터 추가하는 편이 좋습니다.

## Gatsby 프레임워크 소개

[Gatsby](https://www.gatsbyjs.com/)는 React 기반 웹 프레임워크입니다. 콘텐츠를 GraphQL 데이터 레이어로 조회하고, 빌드 시점에 페이지를 생성하며, 플러그인으로 MDX나 sitemap 같은 기능을 연결할 수 있습니다.

### Gatsby를 선택한 이유

1. **정적 페이지 생성:** 글 페이지를 빌드 시점에 만들 수 있습니다.
2. **React 기반 구성:** 익숙한 컴포넌트 단위로 UI를 나눌 수 있습니다.
3. **콘텐츠 확장:** Markdown과 MDX를 사용해 글과 컴포넌트를 함께 다룰 수 있습니다.
4. **플러그인 생태계:** sitemap, 파일 소싱, 이미지 처리 같은 기능을 단계적으로 추가할 수 있습니다.
5. **정적 호스팅 배포:** GitHub Pages 같은 정적 호스팅과 조합할 수 있습니다.

Gatsby를 사용한다고 SEO와 성능이 자동으로 완성되는 것은 아닙니다. 메타데이터, URL, 이미지, JavaScript 양을 직접 점검해야 합니다.

## Gatsby 프로젝트 생성

현재 기본 시작 방식은 [Gatsby 빠른 시작 문서](https://www.gatsbyjs.com/docs/quick-start/)를 기준으로 확인하는 것이 가장 정확합니다. Node.js 버전도 특정 숫자를 모든 프로젝트의 필수 조건으로 단정하기보다 Gatsby 지원 범위와 저장소의 `engines`, `.nvmrc`를 함께 확인합니다.

프로젝트 생성 명령은 다음과 같습니다.

```shell
npm init gatsby
```

대화형 설정에서는 프로젝트 이름, JavaScript 또는 TypeScript, 스타일링 방식, 추가 플러그인을 선택합니다. 당시 첫 프로젝트에서는 빠른 시작을 위해 JavaScript, Tailwind CSS, 반응형 이미지, sitemap, MDX 지원을 골랐습니다.

설치가 끝나면 생성된 폴더로 이동해 개발 서버를 실행합니다.

```shell
cd my-gatsby-site
npm run develop
```

기본 개발 서버는 일반적으로 다음 주소에서 확인합니다.

- 사이트: `http://localhost:8000/`
- GraphiQL: `http://localhost:8000/___graphql`

GraphQL 데이터 레이어는 글 생성 구조를 구현할 때 별도로 다루고, 여기서는 프로젝트가 실행되는지만 확인합니다.

## 당시 Tailwind CSS 오류와 현재의 판단

2025년 8월에 starter를 생성했을 때 개발 번들을 만드는 과정에서 Tailwind CSS의 PostCSS 플러그인 오류를 만났습니다.

```text
ERROR #98123 WEBPACK.DEVELOP
Generating development JavaScript bundle failed
Module build failed: TailwindCSS PostCSS plugin error...
```

당시에는 MDX 패키지 버전도 함께 바꾸며 문제를 해결했습니다. 그러나 특정 `@mdx-js/react` 버전으로 강제 다운그레이드하는 방법을 모든 Gatsby 프로젝트의 해결책으로 권장할 수는 없습니다. 현재는 먼저 Gatsby와 플러그인의 peer dependency, 설치된 Tailwind CSS의 주 버전, 실제 오류 메시지를 함께 확인합니다.

### Tailwind CSS 4와 PostCSS 연결

Tailwind CSS 4를 PostCSS와 연결하는 현재 방식은 [Tailwind CSS 공식 문서](https://tailwindcss.com/docs/installation/using-postcss)를 기준으로 확인합니다. Gatsby에서 사용할 때는 프로젝트 구성에 맞춰 다음 패키지를 설치할 수 있습니다.

```shell
npm install tailwindcss @tailwindcss/postcss gatsby-plugin-postcss
```

`postcss.config.cjs`에는 Tailwind의 PostCSS 플러그인을 등록합니다.

```javascript
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

전역 스타일 진입점에서는 Tailwind CSS를 불러옵니다.

```css
@import "tailwindcss";
```

설정을 바꾼 뒤 개발 서버를 다시 실행해 실제 오류가 사라졌는지 확인합니다.

```shell
npm run develop
```

패키지 설치 중 취약점 경고가 보이더라도 자동 수정 명령을 바로 적용하지 않습니다. 어떤 패키지가 런타임이나 빌드 결과에 영향을 주는지, 전이 의존성인지, 업데이트가 빌드를 깨뜨리지 않는지를 먼저 분석하고 별도 이슈로 추적하는 편이 안전합니다.

## 화면에서 Tailwind CSS 확인

Tailwind CSS가 적용되는지 확인하려고 기본 화면의 제목에 유틸리티 클래스를 하나 추가했습니다.

```jsx
<h1 className="text-red-500">Congratulations</h1>
```

![Gatsby 시작 화면의 제목에 Tailwind CSS 색상 클래스를 적용한 모습](/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png)

색상이 바뀌었다면 CSS import와 PostCSS 연결이 실제 개발 번들에 반영된 것입니다. 확인이 끝난 뒤에는 임시 검증용 클래스를 제품 디자인에 맞는 구조로 교체합니다.

## 프로덕션 빌드 확인

개발 서버 확인이 끝나면 프로덕션 빌드를 생성합니다.

```shell
npm run build
```

빌드 결과는 `public/`에 만들어집니다. 이 HTML을 `file://` 주소로 직접 열면 경로와 JavaScript 로딩 방식이 실제 호스팅 환경과 달라질 수 있습니다. Gatsby의 정적 서버로 확인합니다.

```shell
npm run serve
```

캐시 때문에 결과가 이상할 때만 `npm run clean`으로 생성물을 정리한 뒤 다시 빌드합니다. 이 명령은 소스가 아니라 Gatsby의 `.cache/`와 `public/` 생성물을 제거하므로 실행 전 변경 파일과 대상 경로를 확인합니다.

## 당시 GitHub Pages 배포 방식

2025년 원문에서는 `{username}.github.io` 공개 저장소를 만들고, GitHub Pages의 배포 소스를 `main` 브랜치의 루트로 지정한 뒤 Gatsby의 `public/` 내용을 저장소에 복사했습니다.

![GitHub Pages 설정에서 main 브랜치와 루트 폴더를 배포 소스로 선택한 모습](/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png)

당시 흐름은 다음과 같았습니다.

1. Gatsby 프로젝트에서 프로덕션 빌드를 생성합니다.
2. `{username}.github.io` 저장소에 `public/`의 정적 파일을 반영합니다.
3. 변경 내용을 `main` 브랜치에 푸시합니다.
4. `https://{username}.github.io`에서 배포 결과를 확인합니다.

이 방식은 당시 사용한 수동 배포 절차입니다. 저장소 소스와 빌드 산출물을 한 브랜치에서 관리하면 이력이 섞이기 쉽습니다. 이번 재구축에서 사용할 자동 배포 방식은 실제 워크플로우를 구현하고 검증한 뒤 별도의 글로 정리하겠습니다.

GitHub Pages의 화면과 옵션은 바뀔 수 있으므로 배포할 때는 [공식 배포 소스 설정 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)를 다시 확인합니다.

## 마치며

이번 글에서는 다음 내용을 다뤘습니다.

- Gatsby와 정적 사이트 생성 방식의 기본 개념
- `npm init gatsby`를 이용한 프로젝트 시작
- Gatsby와 Tailwind CSS 4의 PostCSS 연결
- 개발 서버와 프로덕션 서버에서의 확인 방법
- 2025년에 사용했던 GitHub Pages 수동 배포 흐름

첫 글의 목표는 모든 기능을 한 번에 완성하는 것이 아니라, 글을 쓸 수 있는 프로젝트와 배포 가능한 정적 결과물을 만드는 것이었습니다. 다음 구현 기록에서는 MDX 콘텐츠 소싱, 페이지 생성, SEO, UI를 어떤 순서로 나눴는지 이어서 정리할 예정입니다.
````

- [ ] **Step 5: Download the two approved PNG originals and verify them**

Run:

```bash
mkdir -p static/images/posts/gatsby-blog-1-getting-started
curl -fL https://macho199.github.io/static/8b7f42873a548851d6c313f5e02e8927/533c1/hello_gatsby_tailwindcss.png -o static/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png
curl -fL https://macho199.github.io/static/ada59e634c6e8a06877039762bb5953f/a6d36/github_pages_setting.png -o static/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png
file static/images/posts/gatsby-blog-1-getting-started/*.png
shasum -a 256 static/images/posts/gatsby-blog-1-getting-started/*.png
```

Expected:

```text
hello-gatsby-tailwindcss.png: PNG image data, 576 x 405
github-pages-setting.png: PNG image data, 650 x 433
7254fe8aecf723228f6575b291d7c021edb874d96f7cf1e9c6760d2e66209863  .../hello-gatsby-tailwindcss.png
3117bd7678f998b53893294a6da7afb4c92bd82874270b42ab8be47a9033d220  .../github-pages-setting.png
```

If a checksum differs, stop and inspect the HTTP response and file type instead of accepting the asset.

- [ ] **Step 6: Run content, metadata, and type checks**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: the focused suite PASS 5/5, the complete source suite passes, and TypeScript exits 0.

- [ ] **Step 7: Commit the real article and self-hosted assets**

```bash
git add content/posts src/components/post-screen-contract.test.mjs static/images/posts/gatsby-blog-1-getting-started
git commit -m "content: migrate Gatsby getting started post"
```

### Task 4: Production Contracts for the Real Home and Post Routes

**Files:**
- Modify: `src/components/post-screen-contract.test.mjs`
- Modify: `scripts/verify-style-build.mjs`
- Modify: `scripts/verify-layout-build.mjs`
- Modify: `scripts/verify-home-build.mjs`
- Create: `scripts/verify-post-build.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Gatsby `public/` output from a clean production build
- Produces: `npm run verify:post`; real-post assertions shared by existing verifiers; explicit absence checks for two retired routes

- [ ] **Step 1: Add a failing verifier registration contract**

Append to `src/components/post-screen-contract.test.mjs`:

```js
test("registers a production verifier for the approved post", async () => {
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
  assert.match(verifier, /mdx-foundation/)
  assert.match(verifier, /create-a-blog-site-with-gatsby1/)
})
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
```

Expected: the new verifier test FAILS because the script and npm command do not exist.

- [ ] **Step 3: Point the style and layout verifiers at the real post**

In `scripts/verify-style-build.mjs`, replace:

```js
access(path.join(publicDirectory, "posts", "mdx-foundation", "index.html")),
```

with:

```js
access(
  path.join(
    publicDirectory,
    "posts",
    "gatsby-blog-1-getting-started",
    "index.html",
  ),
),
```

In `scripts/verify-layout-build.mjs`, replace the post URL entry with:

```js
[
  "post",
  new URL(
    "../public/posts/gatsby-blog-1-getting-started/index.html",
    import.meta.url,
  ),
],
```

- [ ] **Step 4: Replace sample assertions in the home verifier**

In `scripts/verify-home-build.mjs`, replace the sample title link and metadata assertions with:

```js
assert.match(
  main,
  /<a\b(?=[^>]*href="\/posts\/gatsby-blog-1-getting-started\/")(?=[^>]*class="[^"]*post-card-title-link[^"]*")[^>]*>\s*Gatsby로 블로그 사이트 만들기 1편 - 시작하기\s*<\/a>/,
)
for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(main, new RegExp(`<span class="post-card-tag">${tag}</span>`))
}
assert.match(
  main,
  /Gatsby와 GitHub Pages로 개발자 블로그를 시작하며 정적 사이트 생성 방식, 프로젝트 설정, Tailwind CSS 확인, 당시 배포 과정을 정리합니다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="2025-08-31")[^>]*>\s*2025\.08\.31\s*<\/time>/i,
)
assert.doesNotMatch(main, /\/posts\/mdx-foundation\//)
```

- [ ] **Step 5: Add the complete production post verifier**

Create `scripts/verify-post-build.mjs`:

```js
import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"

const publicRoot = new URL("../public/", import.meta.url)
const postUrl = new URL(
  "posts/gatsby-blog-1-getting-started/index.html",
  publicRoot,
)
const html = await readFile(postUrl, "utf8")
const sitemap = await readFile(new URL("sitemap-0.xml", publicRoot), "utf8")
const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

assert.ok(mainMatch, "post: main landmark")

const main = mainMatch[1]

/** @param {string} tag */
const countOpeningTags = tag =>
  main.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

assert.equal(countOpeningTags("h1"), 1, "post: one page heading")
assert.match(main, /<nav\b[^>]*aria-label="게시글 탐색"[^>]*>/)
assert.match(
  main,
  /<a\b(?=[^>]*href="\/")(?=[^>]*class="[^"]*post-back-link[^"]*")[^>]*>\s*← 게시글 목록\s*<\/a>/,
)
assert.match(main, /<article\b[^>]*class="[^"]*post-page[^"]*"[^>]*>/)
assert.match(
  main,
  /<h1\b[^>]*class="[^"]*post-title[^"]*"[^>]*>Gatsby로 블로그 사이트 만들기 1편 - 시작하기<\/h1>/,
)
assert.match(
  main,
  /Gatsby와 GitHub Pages로 개발자 블로그를 시작하며 정적 사이트 생성 방식, 프로젝트 설정, Tailwind CSS 확인, 당시 배포 과정을 정리합니다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-date[^"]*")(?=[^>]*datetime="2025-08-31")[^>]*>\s*2025\.08\.31\s*<\/time>/i,
)

for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(main, new RegExp(`<span class="post-tag">${tag}</span>`))
}

for (const heading of [
  "개발자를 위한 블로그 구축",
  "정적 사이트 생성기(SSG) 이해하기",
  "Gatsby 프로젝트 생성",
  "당시 Tailwind CSS 오류와 현재의 판단",
  "프로덕션 빌드 확인",
  "당시 GitHub Pages 배포 방식",
  "마치며",
]) {
  assert.match(main, new RegExp(`<h2[^>]*>${heading.replace(/[()]/g, "\\$&")}</h2>`))
}

assert.match(main, /<blockquote>/)
assert.match(main, /<ol>/)
assert.match(main, /<ul>/)
assert.match(main, /<pre><code class="language-shell">/)
assert.match(main, /<code>npm init gatsby<\/code>/)
assert.match(
  main,
  /<img\b(?=[^>]*src="\/images\/posts\/gatsby-blog-1-getting-started\/hello-gatsby-tailwindcss\.png")(?=[^>]*alt="Gatsby 시작 화면의 제목에 Tailwind CSS 색상 클래스를 적용한 모습")[^>]*>/,
)
assert.match(
  main,
  /<img\b(?=[^>]*src="\/images\/posts\/gatsby-blog-1-getting-started\/github-pages-setting\.png")(?=[^>]*alt="GitHub Pages 설정에서 main 브랜치와 루트 폴더를 배포 소스로 선택한 모습")[^>]*>/,
)

assert.match(
  html,
  /<title[^>]*>Gatsby로 블로그 사이트 만들기 1편 - 시작하기 \| Developer Blog<\/title>/,
)
assert.match(
  html,
  /<meta\b(?=[^>]*name="description")(?=[^>]*content="Gatsby와 GitHub Pages로 개발자 블로그를 시작하며 정적 사이트 생성 방식, 프로젝트 설정, Tailwind CSS 확인, 당시 배포 과정을 정리합니다\.")[^>]*>/,
)
assert.match(
  html,
  /<link\b(?=[^>]*rel="canonical")(?=[^>]*href="https:\/\/macho199\.github\.io\/posts\/gatsby-blog-1-getting-started\/")[^>]*>/,
)
assert.match(
  html,
  /<meta\b(?=[^>]*property="article:published_time")(?=[^>]*content="2025-08-31")[^>]*>/,
)
for (const tag of ["Gatsby", "GitHub Pages", "React", "Tailwind CSS"]) {
  assert.match(
    html,
    new RegExp(
      `<meta\\b(?=[^>]*property="article:tag")(?=[^>]*content="${tag}")[^>]*>`,
    ),
  )
}

assert.equal(countOpeningTags("button"), 0, "post: no inactive buttons")
assert.doesNotMatch(
  main,
  /class="[^"]*(?:table-of-contents|code-copy|reading-time|related-posts|post-pagination)[^"]*"/,
)
assert.doesNotMatch(main, /이전 글|다음 글|관련 글|분 읽기/)

await Promise.all([
  access(
    new URL(
      "images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png",
      publicRoot,
    ),
  ),
  access(
    new URL(
      "images/posts/gatsby-blog-1-getting-started/github-pages-setting.png",
      publicRoot,
    ),
  ),
])

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

assert.match(
  sitemap,
  /https:\/\/macho199\.github\.io\/posts\/gatsby-blog-1-getting-started\//,
)
assert.doesNotMatch(sitemap, /\/posts\/mdx-foundation\//)
assert.doesNotMatch(sitemap, /\/posts\/create-a-blog-site-with-gatsby1\//)

console.log("post build verified: reading screen, metadata, assets, and route contracts passed")
```

- [ ] **Step 6: Register the post verifier**

Add to `package.json` after `verify:home`:

```json
"verify:home": "node scripts/verify-home-build.mjs",
"verify:post": "node scripts/verify-post-build.mjs"
```

- [ ] **Step 7: Run source checks before producing new build output**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: all source tests pass and TypeScript exits 0.

- [ ] **Step 8: Commit the production verifier changes**

```bash
git add package.json scripts/verify-home-build.mjs scripts/verify-layout-build.mjs scripts/verify-post-build.mjs scripts/verify-style-build.mjs src/components/post-screen-contract.test.mjs
git commit -m "test: verify real post production output"
```

### Task 5: Clean Production Build and Three-Viewport Review

**Files:**
- Verify: all tracked implementation files
- Do not add: `.playwright-cli/`, `.cache/`, `public/`

**Interfaces:**
- Consumes: Tasks 1–4 committed source and generated production output
- Produces: reproducible verification evidence and the handoff checkpoint for user/Codex review

- [ ] **Step 1: Announce and confirm generated-output cleanup**

Send this one-line confirmation request before cleaning:

```text
폐기한 두 URL이 남지 않았는지 검증하려고 npm run clean으로 생성물 .cache/와 public/만 삭제한 뒤 다시 빌드할게요. 진행해도 될까요?
```

Wait for explicit approval. Do not run `npm run clean` before approval.

- [ ] **Step 2: Run the complete clean production verification sequence**

Run:

```bash
npm test
npm run typecheck
npm run clean
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected:

- all Node tests pass;
- TypeScript exits 0;
- Gatsby clean and build exit 0;
- style, layout, home, and post verifiers each print their success line;
- `/posts/gatsby-blog-1-getting-started/` exists;
- the two retired routes do not exist.

- [ ] **Step 3: Serve the production output locally**

Run:

```bash
npm run serve
```

Expected: Gatsby serves the generated site at `http://127.0.0.1:9000/` without runtime errors.

- [ ] **Step 4: Verify the page at 1440px, 1020px, and 390px**

For each viewport, inspect `/posts/gatsby-blog-1-getting-started/` and verify:

- exactly one H1 and the correct H2-first body hierarchy;
- back link, tag list, title, description, original date, body, and two images are visible;
- the 760px reading measure remains left aligned inside the 920px common container;
- page-level `scrollWidth` does not exceed `clientWidth`;
- long code scrolls inside `pre` instead of widening the page;
- both images keep their aspect ratio and load with natural width greater than zero;
- link focus is visible by keyboard;
- no TOC, copy button, reading time, previous/next, or related-post controls appear;
- clicking `← 게시글 목록` returns to `/` and the new article card appears there.

Also open the two retired paths and verify Gatsby returns the 404 screen:

```text
http://127.0.0.1:9000/posts/mdx-foundation/
http://127.0.0.1:9000/posts/create-a-blog-site-with-gatsby1/
```

- [ ] **Step 5: Inspect the final diff and repository state**

Run:

```bash
git diff --check develop...HEAD
git status --short --branch
git log --oneline develop..HEAD
```

Expected: no whitespace errors; only intended tracked changes and the pre-existing untracked `.playwright-cli/`; a small sequence of task-level commits.

- [ ] **Step 6: Record verification evidence in GitHub #18 without closing it**

Prepare, but do not send until 종성님 explicitly asks for the external comment, this concise evidence:

```text
로컬 구현·검증 완료
- npm test
- npm run typecheck
- npm run build
- npm run verify:styles
- npm run verify:layout
- npm run verify:home
- npm run verify:post
- 1440px / 1020px / 390px 수동 화면 확인

종성님 화면 확인과 Codex 리뷰 전까지 이슈는 열어 둡니다.
```

- [ ] **Step 7: Stop at the review checkpoint**

Report the changed files, test/build evidence, article URL, and any remaining visual caveats to 종성님. Do not push, create a PR, close #18, check parent #13, or start the next feature until explicitly instructed.
