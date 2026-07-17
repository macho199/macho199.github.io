# Home Static Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실제 MDX 게시글만 사용하는 반응형 홈 소개·게시글 목록 화면을 Gatsby에 구현한다.

**Architecture:** Gatsby 홈 페이지만 GraphQL을 조회하고 결과를 `PostSummary` 표현 모델로 바꿔 `PostList`에 전달한다. `HomeIntro`, `PostList`, `PostCard`는 GraphQL을 모르며 타입이 지정된 props와 의미 있는 HTML만 렌더링한다. 홈 전용 스타일과 정적 산출물 검증은 기존 전역 테마·공통 레이아웃 경계를 유지한 채 별도 파일에 격리한다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, Node.js 24.14.1 built-in test runner

## Global Constraints

- 구현 대상은 GitHub #16 `홈 정적 화면 및 실제 MDX 게시글 목록 구현` 하나이며 대표 이슈는 #13이다.
- `h1` 문구는 `개발자 블로그`이고 화면에서는 숨긴다.
- 소개 문구는 `AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의 엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다.`로 고정한다.
- 테스트용 가짜 게시글 없이 실제 MDX 게시글을 발행일 내림차순으로 표시한다.
- 카드는 태그, 실제 제목 링크, 설명, 발행일만 표시한다.
- 화면 날짜는 `YYYY.MM.DD`, `time`의 `dateTime`은 원본 날짜를 사용한다.
- 게시글이 없으면 `아직 게시글이 없습니다.`를 표시한다.
- 게시글 개수, 태그 필터·더보기, 페이지네이션, 읽는 시간은 렌더링하지 않는다.
- 기존 920px 공통 컨테이너, 디자인 토큰, GraphQL 소싱, SEO Head, sitemap, `/posts/<slug>/` URL을 유지한다.
- 소스 계약 테스트, 정적 산출물 검증, 1440px·1020px·390px 브라우저 검증을 통과해야 한다.
- 구현과 로컬 검증이 끝난 뒤 종성님 확인과 Codex 리뷰를 요청한다.
- 종성님의 명시적 지시 전에는 원격 푸시·PR 생성·Ready 전환·병합을 수행하지 않는다.
- 병합과 로컬 `develop` 동기화가 끝날 때까지 다음 UI 하위 이슈를 만들거나 구현하지 않는다.

## File Structure

- Create `src/components/home-intro.tsx`: 숨김 페이지 제목과 고정 소개 문구를 렌더링한다.
- Create `src/components/post-card.tsx`: `PostSummary` 타입과 한 게시글의 태그·링크·설명·날짜 표현을 소유한다.
- Create `src/components/post-list.tsx`: 의미 있는 게시글 목록과 빈 상태 분기를 소유한다.
- Create `src/components/home-screen-contract.test.mjs`: 홈 컴포넌트·페이지 데이터 경계·스타일 진입점·검증 명령을 소스 수준에서 확인한다.
- Modify `src/pages/index.tsx`: GraphQL 결과를 `PostSummary`로 바꾸고 홈 표현 컴포넌트에 전달한다.
- Create `src/styles/home.css`: 홈 소개·목록·카드·빈 상태의 외형만 소유한다.
- Modify `gatsby-browser.js`: 홈 stylesheet를 전역 스타일 진입점에서 한 번 불러온다.
- Create `scripts/verify-home-build.mjs`: 프로덕션 홈 HTML의 실제 데이터·의미 구조·제외 범위를 확인한다.
- Modify `package.json`: `verify:home` 명령을 등록한다.
- Add `docs/superpowers/specs/2026-07-17-home-static-screen-design.md`: 승인된 홈 설계를 저장한다.
- Add `docs/superpowers/plans/2026-07-17-home-static-screen.md`: 이 구현 계획을 저장한다.

---

### Task 1: Typed Home Presentation Components

**Files:**
- Create: `src/components/home-screen-contract.test.mjs`
- Create: `src/components/home-intro.tsx`
- Create: `src/components/post-card.tsx`
- Create: `src/components/post-list.tsx`
- Add: `docs/superpowers/specs/2026-07-17-home-static-screen-design.md`
- Add: `docs/superpowers/plans/2026-07-17-home-static-screen.md`

**Interfaces:**
- Consumes: React JSX runtime, Gatsby `Link`
- Produces: `HomeIntro()`, `PostSummary`, `PostCard({ post })`, `PostList({ posts })`
- `PostSummary`: `{ id, title, slug, description, tags, publishedAt, publishedAtDisplay }`

- [ ] **Step 1: Write failing component contract tests**

Create `src/components/home-screen-contract.test.mjs`:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
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

test("renders one hidden home heading and the approved introduction", async () => {
  const homeIntro = await readRepositoryFile("src/components/home-intro.tsx")

  assert.match(
    homeIntro,
    /<h1 id="home-title" className="sr-only">[\s\S]*개발자 블로그[\s\S]*<\/h1>/,
  )
  assert.match(
    homeIntro,
    /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의\s+엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
  )
})

test("renders a typed post card with informational tags and real metadata", async () => {
  const postCard = await readRepositoryFile("src/components/post-card.tsx")

  assert.match(postCard, /export type PostSummary = Readonly<\{/)
  assert.match(postCard, /<ul className="post-card-tags" aria-label="태그">/)
  assert.match(postCard, /<span className="post-card-tag">\{tag\}<\/span>/)
  assert.match(
    postCard,
    /<Link[\s\S]*?to=\{`\/posts\/\$\{post\.slug\}\/`\}[\s\S]*?className="post-card-title-link"[\s\S]*?>/,
  )
  assert.match(
    postCard,
    /<time className="post-card-date" dateTime=\{post\.publishedAt\}>[\s\S]*\{post\.publishedAtDisplay\}[\s\S]*<\/time>/,
  )
  assert.doesNotMatch(postCard, /<button\b/)
})

test("renders an ordered post list or the approved empty state", async () => {
  const postList = await readRepositoryFile("src/components/post-list.tsx")

  assert.match(
    postList,
    /<section className="home-posts" aria-labelledby="home-posts-title">/,
  )
  assert.match(
    postList,
    /<h2 id="home-posts-title" className="sr-only">[\s\S]*게시글 목록[\s\S]*<\/h2>/,
  )
  assert.match(postList, /<ol className="post-list">/)
  assert.match(postList, /<li key=\{post\.id\} className="post-list-item">/)
  assert.match(postList, /<PostCard post=\{post\} \/>/)
  assert.match(postList, /아직 게시글이 없습니다\./)
  assert.doesNotMatch(postList, /<button\b/)
})

test("imports the React runtime required by Gatsby SSR", async () => {
  const componentSources = await Promise.all(
    [
      "src/components/home-intro.tsx",
      "src/components/post-card.tsx",
      "src/components/post-list.tsx",
    ].map(readRepositoryFile),
  )

  for (const source of componentSources) {
    assert.match(source, /^import \* as React from "react"$/m)
  }
})
```

- [ ] **Step 2: Run focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
```

Expected: four tests FAIL because the three home component files do not exist.

- [ ] **Step 3: Add the approved home introduction**

Create `src/components/home-intro.tsx`:

```tsx
import * as React from "react"

const HomeIntro = () => (
  <section className="home-intro" aria-labelledby="home-title">
    <h1 id="home-title" className="sr-only">
      개발자 블로그
    </h1>
    <p className="home-intro-copy">
      AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의
      엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다.
    </p>
  </section>
)

export default HomeIntro
```

- [ ] **Step 4: Add the typed post card**

Create `src/components/post-card.tsx`:

```tsx
import { Link } from "gatsby"
import * as React from "react"

export type PostSummary = Readonly<{
  id: string
  title: string
  slug: string
  description: string
  tags: readonly string[]
  publishedAt: string
  publishedAtDisplay: string
}>

type PostCardProps = Readonly<{
  post: PostSummary
}>

const PostCard = ({ post }: PostCardProps) => (
  <article className="post-card">
    <div className="post-card-main">
      {post.tags.length > 0 ? (
        <ul className="post-card-tags" aria-label="태그">
          {post.tags.map((tag, index) => (
            <li key={`${post.id}-${tag}-${index}`}>
              <span className="post-card-tag">{tag}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <h3 className="post-card-title">
        <Link
          to={`/posts/${post.slug}/`}
          className="post-card-title-link"
        >
          {post.title}
        </Link>
      </h3>
      <p className="post-card-description">{post.description}</p>
      <time className="post-card-date" dateTime={post.publishedAt}>
        {post.publishedAtDisplay}
      </time>
    </div>
  </article>
)

export default PostCard
```

- [ ] **Step 5: Add the semantic list and empty state**

Create `src/components/post-list.tsx`:

```tsx
import * as React from "react"

import PostCard, { type PostSummary } from "./post-card"

type PostListProps = Readonly<{
  posts: readonly PostSummary[]
}>

const PostList = ({ posts }: PostListProps) => (
  <section className="home-posts" aria-labelledby="home-posts-title">
    <h2 id="home-posts-title" className="sr-only">
      게시글 목록
    </h2>
    {posts.length === 0 ? (
      <p className="post-list-empty">아직 게시글이 없습니다.</p>
    ) : (
      <ol className="post-list">
        {posts.map(post => (
          <li key={post.id} className="post-list-item">
            <PostCard post={post} />
          </li>
        ))}
      </ol>
    )}
  </section>
)

export default PostList
```

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
npm run typecheck
```

Expected: focused tests PASS 4/4 and TypeScript exits 0.

- [ ] **Step 7: Commit the approved design, plan, and presentation components**

```bash
git add docs/superpowers/specs/2026-07-17-home-static-screen-design.md docs/superpowers/plans/2026-07-17-home-static-screen.md src/components/home-screen-contract.test.mjs src/components/home-intro.tsx src/components/post-card.tsx src/components/post-list.tsx
git commit -m "feat: add typed home post components"
```

### Task 2: Gatsby Home Data Boundary and Responsive Styles

**Files:**
- Modify: `src/components/home-screen-contract.test.mjs`
- Modify: `src/components/layout-contract.test.mjs`
- Modify: `src/pages/index.tsx`
- Create: `src/styles/home.css`
- Modify: `gatsby-browser.js`

**Interfaces:**
- Consumes: Task 1 `HomeIntro`, `PostList`, `PostSummary`; Gatsby `PageProps`; existing `Layout`, `ContentContainer`, `Seo`; existing theme and layout tokens
- Produces: GraphQL fields `publishedAt` and `publishedAtDisplay`; CSS classes `home-intro`, `home-intro-copy`, `home-posts`, `post-list`, `post-list-item`, `post-card`, `post-card-main`, `post-card-tags`, `post-card-tag`, `post-card-title`, `post-card-title-link`, `post-card-description`, `post-card-date`, `post-list-empty`

- [ ] **Step 1: Extend the contract test for page and style boundaries**

Append to `src/components/home-screen-contract.test.mjs`:

```js
test("keeps GraphQL in the page and loads scoped home styles", async () => {
  const [indexPage, browserEntry, homeCss] = await Promise.all([
    readRepositoryFile("src/pages/index.tsx"),
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/home.css"),
  ])

  assert.match(indexPage, /import HomeIntro from "\.\.\/components\/home-intro"/)
  assert.match(indexPage, /import PostList from "\.\.\/components\/post-list"/)
  assert.match(indexPage, /import type \{ PostSummary \}/)
  assert.match(indexPage, /data\.allMdx\.nodes\.map/)
  assert.match(indexPage, /<HomeIntro \/>/)
  assert.match(indexPage, /<PostList posts=\{posts\} \/>/)
  assert.match(indexPage, /allMdx\(sort: \{ frontmatter: \{ publishedAt: DESC \} \}\)/)
  assert.match(indexPage, /publishedAtDisplay: publishedAt\(formatString: "YYYY\.MM\.DD"\)/)
  assert.doesNotMatch(indexPage, /<article\b|<Link\b/)

  assert.match(browserEntry, /\.\/src\/styles\/home\.css/)
  assert.match(homeCss, /\.home-intro\s*\{[^}]*padding-block: var\(--space-8\) var\(--space-4\)/s)
  assert.match(homeCss, /\.post-card-main\s*\{[^}]*max-width: 760px/s)
  assert.match(homeCss, /\.post-list\s*\{[^}]*border-top: 1px solid var\(--border\)/s)
  assert.match(homeCss, /\.post-list-item\s*\{[^}]*border-bottom: 1px solid var\(--border\)/s)
})
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
```

Expected: the new page/style boundary test FAILS because the page still contains inline markup and `home.css` does not exist.

- [ ] **Step 3: Replace inline home markup with typed component data**

Replace `src/pages/index.tsx` with:

```tsx
import { graphql, type HeadFC, type PageProps } from "gatsby"
import * as React from "react"

import ContentContainer from "../components/content-container"
import HomeIntro from "../components/home-intro"
import Layout from "../components/layout"
import PostList from "../components/post-list"
import type { PostSummary } from "../components/post-card"
import Seo from "../components/seo"

type IndexPageData = Readonly<{
  allMdx: Readonly<{
    nodes: ReadonlyArray<
      Readonly<{
        id: string
        frontmatter: Omit<PostSummary, "id">
      }>
    >
  }>
}>

const IndexPage = ({ data }: PageProps<IndexPageData>) => {
  const posts: PostSummary[] = data.allMdx.nodes.map(({ id, frontmatter }) => ({
    id,
    ...frontmatter,
  }))

  return (
    <Layout>
      <ContentContainer>
        <HomeIntro />
        <PostList posts={posts} />
      </ContentContainer>
    </Layout>
  )
}

export default IndexPage

export const Head: HeadFC = ({ location }) => <Seo pathname={location.pathname} />

export const query = graphql`
  query IndexPage {
    allMdx(sort: { frontmatter: { publishedAt: DESC } }) {
      nodes {
        id
        frontmatter {
          title
          slug
          publishedAt
          publishedAtDisplay: publishedAt(formatString: "YYYY.MM.DD")
          description
          tags
        }
      }
    }
  }
`
```

- [ ] **Step 4: Add home-only visual and responsive styles**

Create `src/styles/home.css`:

```css
@layer components {
  .home-intro {
    padding-block: var(--space-8) var(--space-4);
  }

  .home-intro-copy {
    width: 100%;
    max-width: 760px;
    padding-block: var(--space-2);
    color: var(--fg-2);
    font-size: var(--text-lg);
    line-height: 1.6;
    text-align: left;
    text-wrap: normal;
  }

  .home-posts {
    min-width: 0;
    padding-block: var(--space-4) var(--space-8);
  }

  .post-list {
    display: grid;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
    list-style: none;
  }

  .post-list-item {
    min-width: 0;
    border-bottom: 1px solid var(--border);
    list-style: none;
    transition: background-color var(--motion-fast) var(--ease-standard);
  }

  .post-list-item:hover {
    background: var(--surface-warm);
  }

  .post-card {
    display: block;
    min-width: 0;
    padding-block: var(--space-6);
  }

  .post-card-main {
    display: grid;
    min-width: 0;
    max-width: 760px;
    gap: var(--space-3);
  }

  .post-card-tags {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .post-card-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 500;
    white-space: nowrap;
  }

  .post-card-tag::before {
    color: var(--accent);
    content: "#";
  }

  .post-card-title {
    min-width: 0;
    font-family: var(--font-body);
    font-size: clamp(18px, 1.7vw, 19px);
    font-weight: 600;
    line-height: 1.42;
  }

  .post-card-title-link {
    color: var(--fg);
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .post-card-title-link:hover {
    color: var(--fg);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .post-card-title + .post-card-description {
    margin-top: calc(var(--space-2) * -1);
  }

  .post-card-description {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .post-card-date {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }

  .post-list-empty {
    margin: 0;
    padding: var(--space-8);
    border-block: 1px solid var(--border);
    color: var(--muted);
    text-align: center;
  }
}

@media (max-width: 720px) {
  .home-intro-copy {
    padding-block: var(--space-1);
  }
}
```

- [ ] **Step 5: Load home styles after the common layout stylesheet**

Update the end of `gatsby-browser.js` to:

```js
import "./src/styles/theme.css"
import "./src/styles/mdx.css"
import "./src/styles/layout.css"
import "./src/styles/home.css"
```

- [ ] **Step 6: Run focused checks and expose the superseded layout assertion**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: focused tests PASS 5/5 and TypeScript exits 0. The full suite reports one failure from `layout-contract.test.mjs` because its earlier layout-only contract assumes the post link remains inline in `index.tsx`.

- [ ] **Step 7: Remove the superseded inline-link location assertion**

Remove this assertion from `src/components/layout-contract.test.mjs`:

```js
assert.match(indexPage, /to=\{`\/posts\/\$\{post\.frontmatter\.slug\}\/`\}/)
```

Keep the new `PostCard` contract assertion as the single owner of the `/posts/<slug>/` link behavior.

- [ ] **Step 8: Run the complete source regression checks**

Run:

```bash
npm test
npm run typecheck
```

Expected: the full test suite passes and TypeScript exits 0.

- [ ] **Step 9: Commit the Gatsby data boundary and home styles**

```bash
git add docs/superpowers/plans/2026-07-17-home-static-screen.md gatsby-browser.js src/pages/index.tsx src/styles/home.css src/components/home-screen-contract.test.mjs src/components/layout-contract.test.mjs
git commit -m "feat: render responsive MDX home list"
```

### Task 3: Production Build Contract and Viewport Verification

**Files:**
- Modify: `src/components/home-screen-contract.test.mjs`
- Create: `scripts/verify-home-build.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2 production HTML at `public/index.html`
- Produces: npm command `verify:home`; build assertions for hidden headings, actual post data, semantic list, original/display dates, excluded controls

- [ ] **Step 1: Add a failing verifier registration test**

Append to `src/components/home-screen-contract.test.mjs`:

```js
test("registers the production home verifier", async () => {
  const [packageSource, verifier] = await Promise.all([
    readRepositoryFile("package.json"),
    readRepositoryFile("scripts/verify-home-build.mjs"),
  ])
  const packageJson = JSON.parse(packageSource)

  assert.equal(
    packageJson.scripts["verify:home"],
    "node scripts/verify-home-build.mjs",
  )
  assert.match(verifier, /public\/index\.html/)
  assert.match(verifier, /mdx-foundation/)
})
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
```

Expected: the verifier registration test FAILS because `verify:home` and its script do not exist.

- [ ] **Step 3: Add the production home verifier**

Create `scripts/verify-home-build.mjs`:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8")
const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)

assert.ok(mainMatch, "home: main landmark")

const main = mainMatch[1]

/**
 * @param {string} source
 * @param {string} tag
 * @param {string} className
 */
const countClassedTags = (source, tag, className) =>
  source.match(
    new RegExp(`<${tag}\\b(?=[^>]*class="[^"]*${className}[^"]*")[^>]*>`, "g"),
  )?.length ?? 0

/** @param {string} tag */
const countOpeningTags = tag => main.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

assert.equal(countOpeningTags("h1"), 1, "home: one page heading")
assert.equal(countClassedTags(main, "h1", "sr-only"), 1, "home: hidden h1")
assert.match(main, /<h1\b[^>]*>[\s\S]*?개발자 블로그[\s\S]*?<\/h1>/)
assert.match(
  main,
  /AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의 엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다\./,
)

assert.equal(countClassedTags(main, "ol", "post-list"), 1, "home: one post list")
assert.ok(countClassedTags(main, "article", "post-card") >= 1, "home: real post cards")
assert.match(
  main,
  /<a\b(?=[^>]*href="\/posts\/mdx-foundation\/")(?=[^>]*class="[^"]*post-card-title-link[^"]*")[^>]*>\s*MDX 콘텐츠 기반 확인\s*<\/a>/,
)
assert.match(main, /<span class="post-card-tag">Gatsby<\/span>/)
assert.match(main, /<span class="post-card-tag">MDX<\/span>/)
assert.match(
  main,
  /Gatsby가 로컬 MDX 파일을 소싱하고 포스트 페이지를 생성하는지 확인한다\./,
)
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="2026-07-17")[^>]*>\s*2026\.07\.17\s*<\/time>/,
)

assert.equal(countOpeningTags("button"), 0, "home: no inactive controls")
assert.doesNotMatch(main, /class="[^"]*(?:filter-bar|pagination|result-count)[^"]*"/)
assert.doesNotMatch(main, /\b\d+\s+posts?\b/i)

console.log("home build verified: actual MDX list and static screen contracts passed")
```

- [ ] **Step 4: Register the verifier command**

Add to the `scripts` object in `package.json` after `verify:layout`:

```json
"verify:layout": "node scripts/verify-layout-build.mjs",
"verify:home": "node scripts/verify-home-build.mjs"
```

- [ ] **Step 5: Run the complete clean-build verification**

Run:

```bash
npm test
npm run typecheck
npm run clean
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
```

Expected: every command exits 0; the final command prints `home build verified: actual MDX list and static screen contracts passed`.

- [ ] **Step 6: Inspect the three approved viewport widths**

Run the development server:

```bash
npm run develop
```

Open `http://127.0.0.1:8000/` at 1440px, 1020px, and 390px widths and confirm:

- the intro and actual MDX card follow the approved spacing and type hierarchy;
- tags, long titles, and descriptions wrap without clipping;
- `document.documentElement.scrollWidth <= document.documentElement.clientWidth` is `true` at all three widths;
- the title link reaches `/posts/mdx-foundation/`;
- there are no count, filter, pagination, or reading-time controls;
- the browser console has no new error from this change.

- [ ] **Step 7: Commit the production verifier**

```bash
git add package.json scripts/verify-home-build.mjs src/components/home-screen-contract.test.mjs
git commit -m "test: verify generated home screen"
```

### Task 4: Local Review Handoff

**Files:**
- Review only: all files changed by Tasks 1–3

**Interfaces:**
- Consumes: the three local commits and passing verification evidence
- Produces: a review-ready local branch; no remote branch or PR

- [ ] **Step 1: Review the feature diff and working tree**

Run:

```bash
git diff --check develop...HEAD
git diff --stat develop...HEAD
git status --short --branch
```

Expected: `git diff --check` exits 0, the diff is limited to #16, and the working tree is clean.

- [ ] **Step 2: Report the local result to 종성님**

Report:

- the three commit subjects;
- the test, typecheck, clean build, style, layout, and home verifier results;
- the 1440px·1020px·390px visual result;
- the exact local command and URL for 종성님 확인;
- that no push or PR has been created.

Wait for 종성님의 local UI confirmation before requesting permission to push and create a Draft PR.
