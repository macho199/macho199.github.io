# Common Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈과 포스트에 동일한 `Layout`·`Header`·`Footer`와 920px 반응형 콘텐츠 컨테이너를 적용한다.

**Architecture:** `Layout`은 공통 Header·유일한 main·Footer 순서를 소유하고, 페이지 콘텐츠만 `children`으로 받는다. `ContentContainer`는 공통 최대 너비와 좌우 여백만 담당하며 Header·페이지·Footer가 재사용한다. 공통 외형은 `layout.css`에 격리하고 기존 GraphQL·SEO Head·MDX 데이터 경계는 그대로 둔다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, Node.js built-in test runner

## Global Constraints

- 구현 대상은 GitHub #14 `공통 Layout·Header·Footer 및 반응형 컨테이너 구축` 하나다.
- Header에는 `/`로 이동하는 `kjs.log` 링크 하나만 둔다.
- Footer 문구는 `© 2026 kjs.log`와 `AI workflow · backend notes · product engineering`으로 고정한다.
- 공통 컨테이너 최대 너비는 참조 산출물과 같은 `920px`이다.
- 좌우 여백은 1020px 초과에서 `--container-gutter-desktop`, 721px~1020px에서 `--container-gutter-tablet`, 720px 이하에서 `--container-gutter-phone`을 사용한다.
- 기존 GraphQL 쿼리, SEO Head, MDX children, `/posts/{slug}/` URL을 변경하지 않는다.
- 홈 소개·목록 카드, 포스트 헤더·본문 디자인, 상호작용, 다크 테마, favicon, 이미지는 구현하지 않는다.
- 소스 계약 테스트, 정적 산출물 검증, 1440px·1020px·390px 브라우저 검증을 모두 통과해야 한다.
- 이슈 전체 구현과 로컬 검증이 끝난 뒤 종성님 검토와 Codex 리뷰를 요청한다. 중간 Task마다 외부 리뷰를 요청하지 않는다.
- 종성님의 명시적 지시 전에는 원격 푸시·PR 생성·Ready 전환·병합을 수행하지 않는다.
- 병합과 로컬 `develop` 동기화가 끝날 때까지 다음 UI 하위 이슈를 만들거나 구현하지 않는다.

## File Structure

- Create `src/components/content-container.tsx`: 920px 최대 너비와 반응형 gutter를 공유하는 표현 없는 래퍼다.
- Create `src/components/header.tsx`: 홈으로 이동하는 블로그 식별자 하나를 렌더링한다.
- Create `src/components/footer.tsx`: 저작권과 블로그 설명 문구를 렌더링한다.
- Create `src/components/layout.tsx`: Header·유일한 main·Footer 공통 골격을 조립한다.
- Create `src/components/layout-contract.test.mjs`: 컴포넌트 경계, 실제 링크, 페이지 적용, 반응형 CSS 계약을 검증한다.
- Create `src/styles/layout.css`: 공통 shell·header·footer·container 외형과 breakpoint를 소유한다.
- Modify `gatsby-browser.js`: 공통 layout stylesheet를 전역 진입점에서 한 번 불러온다.
- Modify `src/pages/index.tsx`: 기존 콘텐츠를 `Layout`과 `ContentContainer` 안으로 옮긴다.
- Modify `src/templates/post.tsx`: 기존 article·MDX·뒤로가기 링크를 공통 골격 안으로 옮긴다.
- Create `scripts/verify-layout-build.mjs`: 두 정적 HTML의 landmark·로고 링크·Footer·컨테이너 렌더링을 검증한다.
- Modify `package.json`: `verify:layout` 명령을 등록한다.

---

### Task 1: Common Shell Components and Responsive Styles

**Files:**
- Create: `src/components/layout-contract.test.mjs`
- Create: `src/components/content-container.tsx`
- Create: `src/components/header.tsx`
- Create: `src/components/footer.tsx`
- Create: `src/components/layout.tsx`
- Create: `src/styles/layout.css`
- Modify: `gatsby-browser.js`

**Interfaces:**
- Consumes: React `PropsWithChildren`, Gatsby `Link`, 기존 `theme.css` 토큰
- Produces: `ContentContainer({ children })`, `Header()`, `Footer()`, `Layout({ children })`, CSS classes `site-shell`, `site-container`, `site-header`, `site-header-inner`, `site-logo`, `site-main`, `site-footer`, `site-footer-inner`, `site-footer-meta`

- [ ] **Step 1: Write the failing common shell contract tests**

Create `src/components/layout-contract.test.mjs`:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8")

test("defines a shared Header, main, and Footer shell", async () => {
  const [layout, header, footer, container] = await Promise.all([
    readRepositoryFile("src/components/layout.tsx"),
    readRepositoryFile("src/components/header.tsx"),
    readRepositoryFile("src/components/footer.tsx"),
    readRepositoryFile("src/components/content-container.tsx"),
  ])

  assert.match(
    layout,
    /<div className="site-shell">[\s\S]*<Header \/>[\s\S]*<main id="content" className="site-main">[\s\S]*\{children\}[\s\S]*<Footer \/>/,
  )
  assert.match(header, /<header className="site-header">/)
  assert.match(header, /<Link to="\/" className="site-logo"[^>]*>\s*kjs\.log\s*<\/Link>/)
  assert.equal((header.match(/<Link\b/g) ?? []).length, 1)
  assert.match(footer, /© 2026 kjs\.log/)
  assert.match(
    footer,
    /AI workflow · backend notes · product engineering/,
  )
  assert.match(container, /<div className="site-container">\{children\}<\/div>/)
})

test("loads a responsive 920px common container", async () => {
  const [browserEntry, layoutCss] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/layout.css"),
  ])

  assert.match(browserEntry, /\.\/src\/styles\/layout\.css/)
  assert.match(
    layoutCss,
    /\.site-container\s*\{[^}]*max-width: 920px[^}]*padding-inline: var\(--container-gutter-desktop\)/s,
  )
  assert.match(
    layoutCss,
    /@media \(max-width: 1020px\)[\s\S]*?\.site-container\s*\{[^}]*padding-inline: var\(--container-gutter-tablet\)/,
  )
  assert.match(
    layoutCss,
    /@media \(max-width: 720px\)[\s\S]*?\.site-container\s*\{[^}]*padding-inline: var\(--container-gutter-phone\)/,
  )
})
```

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

Run:

```bash
node --test src/components/layout-contract.test.mjs
```

Expected: both tests FAIL because the component and layout stylesheet files do not exist.

- [ ] **Step 3: Add the shared content container**

Create `src/components/content-container.tsx`:

```tsx
import type { PropsWithChildren } from "react"

const ContentContainer = ({ children }: PropsWithChildren) => (
  <div className="site-container">{children}</div>
)

export default ContentContainer
```

- [ ] **Step 4: Add the Header with one real home link**

Create `src/components/header.tsx`:

```tsx
import { Link } from "gatsby"

import ContentContainer from "./content-container"

const Header = () => (
  <header className="site-header">
    <ContentContainer>
      <div className="site-header-inner">
        <Link to="/" className="site-logo" aria-label="kjs.log 홈">
          kjs.log
        </Link>
      </div>
    </ContentContainer>
  </header>
)

export default Header
```

- [ ] **Step 5: Add the stable shared Footer**

Create `src/components/footer.tsx`:

```tsx
import ContentContainer from "./content-container"

const Footer = () => (
  <footer className="site-footer">
    <ContentContainer>
      <div className="site-footer-inner">
        <span>© 2026 kjs.log</span>
        <span className="site-footer-meta">
          AI workflow · backend notes · product engineering
        </span>
      </div>
    </ContentContainer>
  </footer>
)

export default Footer
```

- [ ] **Step 6: Assemble the shared Layout and unique main landmark**

Create `src/components/layout.tsx`:

```tsx
import type { PropsWithChildren } from "react"

import Footer from "./footer"
import Header from "./header"

const Layout = ({ children }: PropsWithChildren) => (
  <div className="site-shell">
    <Header />
    <main id="content" className="site-main">
      {children}
    </main>
    <Footer />
  </div>
)

export default Layout
```

- [ ] **Step 7: Add layout styles from the approved reference structure**

Create `src/styles/layout.css`:

```css
@layer components {
  .site-shell {
    display: flex;
    min-width: 0;
    min-height: 100vh;
    min-height: 100svh;
    flex-direction: column;
  }

  .site-container {
    width: 100%;
    max-width: 920px;
    min-width: 0;
    margin-inline: auto;
    padding-inline: var(--container-gutter-desktop);
  }

  .site-header {
    position: relative;
    z-index: 20;
    background: color-mix(in oklch, var(--bg) 92%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .site-header-inner {
    display: flex;
    min-width: 0;
    min-height: 64px;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }

  .site-logo {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--fg);
    font-weight: 600;
    letter-spacing: -0.01em;
    text-decoration: none;
  }

  .site-logo::before {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-pill);
    background: var(--fg);
    content: "";
  }

  .site-main {
    flex: 1;
    min-width: 0;
  }

  .site-footer {
    color: var(--muted);
    font-size: var(--text-sm);
  }

  .site-footer-inner {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-4);
    padding-block: var(--space-6) var(--space-8);
    border-top: 1px solid var(--border);
  }

  .site-footer-meta {
    overflow-wrap: anywhere;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
}

@media (max-width: 1020px) {
  .site-container {
    padding-inline: var(--container-gutter-tablet);
  }
}

@media (max-width: 720px) {
  .site-container {
    padding-inline: var(--container-gutter-phone);
  }
}
```

- [ ] **Step 8: Load the shared layout stylesheet once**

Append the layout import after the existing theme and MDX imports in `gatsby-browser.js`:

```js
import "./src/styles/theme.css"
import "./src/styles/mdx.css"
import "./src/styles/layout.css"
```

- [ ] **Step 9: Run the focused tests and typecheck**

Run:

```bash
node --test src/components/layout-contract.test.mjs
npm run typecheck
```

Expected: focused tests 2/2 PASS and TypeScript exits 0.

- [ ] **Step 10: Commit the common shell components**

```bash
git add gatsby-browser.js src/components/content-container.tsx src/components/header.tsx src/components/footer.tsx src/components/layout.tsx src/components/layout-contract.test.mjs src/styles/layout.css
git commit -m "feat: add shared responsive layout shell"
```

### Task 2: Apply the Shared Layout to Home and Posts

**Files:**
- Modify: `src/components/layout-contract.test.mjs`
- Modify: `src/pages/index.tsx`
- Modify: `src/templates/post.tsx`

**Interfaces:**
- Consumes: Task 1의 `Layout`과 `ContentContainer`
- Produces: 홈과 모든 포스트에 동일한 Header·main·Footer 구조, 페이지마다 정확히 하나인 main landmark

- [ ] **Step 1: Add the failing page integration contract test**

Append to `src/components/layout-contract.test.mjs`:

```js
test("applies the shared layout without changing page data boundaries", async () => {
  const [indexPage, postTemplate] = await Promise.all([
    readRepositoryFile("src/pages/index.tsx"),
    readRepositoryFile("src/templates/post.tsx"),
  ])

  for (const source of [indexPage, postTemplate]) {
    assert.match(source, /import ContentContainer from "\.\.\/components\/content-container"/)
    assert.match(source, /import Layout from "\.\.\/components\/layout"/)
    assert.match(source, /<Layout>[\s\S]*<ContentContainer>/)
    assert.doesNotMatch(source, /<main\b/)
  }

  assert.match(indexPage, /to=\{`\/posts\/\$\{post\.frontmatter\.slug\}\/`\}/)
  assert.match(postTemplate, /<div className="mdx-content">\{children\}<\/div>/)
})
```

- [ ] **Step 2: Run the focused tests and confirm the page integration failure**

Run:

```bash
node --test src/components/layout-contract.test.mjs
```

Expected: the first two tests PASS and the new integration test FAILS because both pages still own a `<main>` and do not import the shared components.

- [ ] **Step 3: Wrap the existing home content without changing its query**

Add these imports to `src/pages/index.tsx`:

```tsx
import ContentContainer from "../components/content-container"
import Layout from "../components/layout"
import Seo from "../components/seo"
```

Replace only the component return wrapper. Keep the existing headings, post mapping, `Head`, and GraphQL query unchanged:

```tsx
return (
  <Layout>
    <ContentContainer>
      <h1>Developer Blog</h1>
      <p>Notes from building and operating software.</p>
      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading">Posts</h2>
        <ol>
          {posts.map(post => (
            <li key={post.id}>
              <article>
                <h3>
                  <Link to={`/posts/${post.frontmatter.slug}/`}>
                    {post.frontmatter.title}
                  </Link>
                </h3>
                <time dateTime={post.frontmatter.publishedAt}>
                  {post.frontmatter.publishedAt}
                </time>
                <p>{post.frontmatter.description}</p>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </ContentContainer>
  </Layout>
)
```

- [ ] **Step 4: Wrap the existing post content without changing MDX or Head**

Add these imports to `src/templates/post.tsx`:

```tsx
import ContentContainer from "../components/content-container"
import Layout from "../components/layout"
import Seo from "../components/seo"
```

Replace only the component return wrapper. Keep the existing query and `Head` export unchanged:

```tsx
return (
  <Layout>
    <ContentContainer>
      <article>
        <header>
          <h1>{frontmatter.title}</h1>
          <time dateTime={frontmatter.publishedAt}>
            {frontmatter.publishedAt}
          </time>
          <p>{frontmatter.description}</p>
          <ul aria-label="Tags">
            {frontmatter.tags.map(tag => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </header>
        <div className="mdx-content">{children}</div>
      </article>
      <Link to="/">Back to posts</Link>
    </ContentContainer>
  </Layout>
)
```

- [ ] **Step 5: Run the focused and full source test suites**

Run:

```bash
node --test src/components/layout-contract.test.mjs
npm test
npm run typecheck
```

Expected: layout tests 3/3 PASS, all repository tests PASS, and TypeScript exits 0.

- [ ] **Step 6: Commit the two page integrations**

```bash
git add src/components/layout-contract.test.mjs src/pages/index.tsx src/templates/post.tsx
git commit -m "feat: apply shared layout to blog pages"
```

### Task 3: Verify Static Output and Responsive Behavior

**Files:**
- Create: `scripts/verify-layout-build.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Gatsby `public/index.html`, `public/posts/mdx-foundation/index.html`
- Produces: `npm run verify:layout`, which fails unless both pages contain one Header, one main, one Footer, the real home logo link, both Footer strings, and at least three shared container instances

- [ ] **Step 1: Add the production layout verifier**

Create `scripts/verify-layout-build.mjs`:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const pages = [
  ["home", new URL("../public/index.html", import.meta.url)],
  [
    "post",
    new URL("../public/posts/mdx-foundation/index.html", import.meta.url),
  ],
]

/**
 * @param {string} source
 * @param {string} tag
 * @param {string} className
 */
const countClassedTags = (source, tag, className) =>
  source.match(
    new RegExp(`<${tag}\\b(?=[^>]*class="[^"]*${className}[^"]*")[^>]*>`, "g"),
  )?.length ?? 0

/**
 * @param {string} source
 * @param {string} tag
 */
const countOpeningTags = (source, tag) =>
  source.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0

for (const [name, url] of pages) {
  const html = await readFile(url, "utf8")

  assert.equal(
    countClassedTags(html, "header", "site-header"),
    1,
    `${name}: one site header`,
  )
  assert.equal(countOpeningTags(html, "main"), 1, `${name}: one main`)
  assert.equal(
    countClassedTags(html, "footer", "site-footer"),
    1,
    `${name}: one site footer`,
  )
  assert.match(
    html,
    /<a\b(?=[^>]*href="\/")(?=[^>]*class="[^"]*site-logo[^"]*")[^>]*>kjs\.log<\/a>/,
    `${name}: real home logo link`,
  )
  assert.match(html, /© 2026 kjs\.log/, `${name}: copyright`)
  assert.match(
    html,
    /AI workflow · backend notes · product engineering/,
    `${name}: footer description`,
  )
  assert.ok(
    (html.match(/site-container/g) ?? []).length >= 3,
    `${name}: shared containers for header, content, and footer`,
  )
}

console.log("layout build verified: home and post shell contracts passed")
```

- [ ] **Step 2: Register the build verifier command**

Add `verify:layout` to the `scripts` object in `package.json` while preserving all existing commands:

```json
"verify:styles": "node scripts/verify-style-build.mjs",
"verify:layout": "node scripts/verify-layout-build.mjs"
```

- [ ] **Step 3: Run a clean production verification**

Run:

```bash
npm test
npm run typecheck
npm run clean
npm run build
npm run verify:styles
npm run verify:layout
```

Expected:

- all Node tests PASS
- TypeScript exits 0
- Gatsby clean build exits 0 and generates `/` and `/posts/mdx-foundation/`
- style verifier reports local Noto KR `.woff2` assets
- layout verifier prints `layout build verified: home and post shell contracts passed`

- [ ] **Step 4: Check the two routes at all required viewport widths**

Run the built site with:

```bash
npm run serve
```

Use browser automation to open both `http://127.0.0.1:9000/` and `http://127.0.0.1:9000/posts/mdx-foundation/` at 1440px, 1020px, and 390px widths. At each of the six cases evaluate:

```js
({
  viewportWidth: window.innerWidth,
  documentWidth: document.documentElement.scrollWidth,
  hasHorizontalOverflow:
    document.documentElement.scrollWidth >
    document.documentElement.clientWidth,
  headerCount: document.querySelectorAll("header.site-header").length,
  mainCount: document.querySelectorAll("main#content").length,
  footerCount: document.querySelectorAll("footer.site-footer").length,
  logoTarget: document.querySelector("a.site-logo")?.getAttribute("href"),
})
```

Expected for every case:

```js
{
  hasHorizontalOverflow: false,
  headerCount: 1,
  mainCount: 1,
  footerCount: 1,
  logoTarget: "/",
}
```

Also confirm visually that the divider and content edges align, the 390px Footer wraps without clipping, and clicking `kjs.log` from the post opens `/`.

- [ ] **Step 5: Commit the production verification**

```bash
git add package.json scripts/verify-layout-build.mjs
git commit -m "test: verify shared layout output"
```

## Review and Integration Gate

1. Stop after all three local commits and verification evidence are ready.
2. Give 종성님 the changed-file summary, test/build/browser results, and local routes to inspect.
3. Wait for 종성님의 local UI approval.
4. Push and create a Draft PR referencing `Refs #14` only after 종성님 requests those external actions. PR 대상이 기본 브랜치가 아닌 `develop`이므로 자동 종료 키워드에 의존하지 않는다.
5. Change the PR to Ready and wait for Codex review.
6. Reproduce and evaluate every review comment before changing code; apply only technically valid feedback.
7. Merge only after checks, Codex review, and 종성님의 explicit merge approval.
8. Sync local `develop`, close #14 as completed, update parent #13 checklist, then update the technical record with decisions and review lessons.
9. Propose the next UI issue scope only after the merge and record reconciliation finish.
