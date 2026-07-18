# Tailwind Style Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gatsby에 로컬 Tailwind v4·PostCSS, 자체 제공 Noto KR 글꼴, 라이트 테마 토큰과 격리된 MDX 기본 스타일 경계를 추가한다.

**Architecture:** Gatsby의 브라우저 진입점은 승인된 Fontsource CSS와 두 개의 전역 스타일 파일만 불러온다. `theme.css`는 Tailwind와 디자인 토큰·전역 기본값을, `mdx.css`는 `.mdx-content` 내부의 의미 요소 복원을 소유한다. 페이지 데이터·SEO·레이아웃 구조는 바꾸지 않고 포스트 본문에 스타일 경계만 추가한다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, PostCSS 8.5.19, Gatsby PostCSS plugin 6.16.0, Fontsource Noto KR 5.2.9, Node.js 24.14.1, npm 11.11.0

## Global Constraints

- 이 계획은 첫 GitHub 하위 이슈인 Tailwind·폰트·디자인 토큰 기반만 구현한다.
- Noto Serif KR 400과 Noto Sans KR 400·500·600만 불러온다.
- 외부 Tailwind·Google Fonts·Fontsource CDN 요청을 만들지 않는다.
- 라이트 테마만 구현한다.
- 기존 GraphQL 데이터, `/posts/<slug>/`, SEO와 sitemap 동작을 변경하지 않는다.
- `Layout`·`Header`·`Footer`, 홈·포스트 디자인, 상호작용, 다크 테마, favicon, 이미지 처리는 제외한다.
- 구현 전에 하위 이슈 본문을 종성님에게 보여주고 외부 생성을 확인받는다. 한 번에 이 이슈 하나만 만든다.
- 구현·로컬 검증 뒤 종성님 확인과 Codex 리뷰를 모두 완료하고, 종성님이 명시적으로 승인한 뒤에만 병합한다.
- 병합과 로컬 `develop` 동기화가 끝날 때까지 다음 하위 이슈를 만들거나 구현하지 않는다.
- 원격 푸시·PR 생성·Ready 전환·병합은 각각 종성님의 현재 지시 범위 안에서만 수행한다.

## File Structure

- Create `postcss.config.mjs`: Tailwind PostCSS 플러그인 한 개만 등록한다.
- Modify `gatsby-config.mjs`: Gatsby PostCSS 플러그인을 등록한다.
- Modify `package.json`: 정확한 빌드·폰트 의존성과 스타일 산출물 검증 스크립트를 등록한다.
- Modify `package-lock.json`: npm이 해석한 정확한 의존성 그래프를 고정한다.
- Create `gatsby-browser.js`: 자체 제공 폰트 굵기와 전역 스타일 진입점을 한 번만 불러온다.
- Create `src/styles/theme.css`: Tailwind import, 라이트 테마 토큰, 전역 기본 스타일을 소유한다.
- Create `src/styles/mdx.css`: `.mdx-content` 내부의 제목·목록·표·코드 기본 표현만 소유한다.
- Create `src/styles/style-foundation.test.mjs`: 설정, 폰트 import, 토큰, MDX 경계를 소스 수준에서 검증한다.
- Modify `src/templates/post.tsx`: 기존 MDX children에 `.mdx-content` 경계만 추가한다.
- Create `scripts/verify-style-build.mjs`: 프로덕션 산출물의 로컬 폰트와 금지된 CDN 부재를 검증한다.

## Execution Preflight

1. 종성님에게 아래 GitHub 하위 이슈의 외부 생성을 한 줄로 알리고 확인받는다.
2. 확인 뒤 이슈 하나만 만들고 현재 로컬 브랜치 이름을 `feat/`, GitHub가 반환한 실제 정수, `-tailwind-style-foundation` 순서로 구성해 바꾼다.
3. 구현 전 working tree가 깨끗하고 기준 커밋에 이 설계서와 계획서가 포함됐는지 확인한다.

Issue title:

```text
Tailwind v4·폰트·디자인 토큰 기반 구축
```

Issue body:

```markdown
Parent: #1

## 구현 범위

- Gatsby 로컬 Tailwind v4·PostCSS 연결
- 라이트 테마 의미 기반 토큰
- Noto Serif KR·Noto Sans KR 자체 제공
- 전역 기본 스타일과 MDX 스타일 경계
- 기존 홈·포스트·SEO·sitemap 회귀 검증

## 완료 조건

- Tailwind가 로컬 PostCSS 빌드로 생성된다.
- 외부 Tailwind·폰트 요청이 없다.
- 승인된 Noto KR 굵기가 자체 자산으로 제공된다.
- MDX 의미 요소 스타일이 `.mdx-content` 안에 격리된다.
- test·typecheck·프로덕션 빌드가 통과한다.
- 홈과 `/posts/mdx-foundation/`이 정상 생성된다.

## 제외 범위

- 공통 레이아웃과 홈·포스트 UI 이식
- 필터·페이지네이션·TOC·코드 복사
- 다크 테마·favicon·이미지 처리
```

---

### Task 1: Local Tailwind PostCSS Pipeline

**Files:**
- Create: `postcss.config.mjs`
- Create: `src/styles/style-foundation.test.mjs`
- Modify: `gatsby-config.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Gatsby의 `plugins` 배열과 Node 내장 테스트 실행기
- Produces: `postcss.config.mjs`의 default export `{ plugins: { "@tailwindcss/postcss": {} } }`, Gatsby plugin `gatsby-plugin-postcss`

- [ ] **Step 1: Write the failing PostCSS configuration test**

Create `src/styles/style-foundation.test.mjs`:

```js
import assert from "node:assert/strict"
import { test } from "node:test"

import gatsbyConfig from "../../gatsby-config.mjs"

test("registers the local Tailwind PostCSS pipeline", async () => {
  assert.ok(gatsbyConfig.plugins.includes("gatsby-plugin-postcss"))

  const postcssConfig = await import("../../postcss.config.mjs")

  assert.deepEqual(postcssConfig.default, {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
node --test src/styles/style-foundation.test.mjs
```

Expected: FAIL because `gatsby-plugin-postcss` is absent or `postcss.config.mjs` cannot be imported.

- [ ] **Step 3: Install exact PostCSS dependencies**

Run:

```bash
npm install --save-exact gatsby-plugin-postcss@6.16.0
npm install --save-dev --save-exact tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 postcss@8.5.19
```

Expected: `package.json` and `package-lock.json` change; npm exits 0.

- [ ] **Step 4: Add the minimal PostCSS configuration**

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
```

Add the string plugin before the existing MDX plugin in `gatsby-config.mjs`:

```js
plugins: [
  "gatsby-plugin-postcss",
  {
    resolve: "gatsby-plugin-mdx",
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
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
```

- [ ] **Step 5: Run the focused and existing tests**

Run:

```bash
node --test src/styles/style-foundation.test.mjs
npm test
npm run typecheck
```

Expected: focused test 1/1 PASS, existing test suite 13/13 PASS, TypeScript exits 0.

- [ ] **Step 6: Commit the local style pipeline**

```bash
git add package.json package-lock.json gatsby-config.mjs postcss.config.mjs src/styles/style-foundation.test.mjs
git commit -m "build: add Tailwind PostCSS pipeline"
```

### Task 2: Self-Hosted Fonts and Light Theme Tokens

**Files:**
- Create: `gatsby-browser.js`
- Create: `src/styles/theme.css`
- Modify: `src/styles/style-foundation.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Task 1의 PostCSS pipeline
- Produces: CSS variables `--font-display`, `--font-body`, `--font-mono`; Tailwind theme names `font-editorial`, `font-ui`, `font-code`; semantic color tokens

- [ ] **Step 1: Extend the source contract test for approved font imports and theme tokens**

Replace `src/styles/style-foundation.test.mjs` with:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import gatsbyConfig from "../../gatsby-config.mjs"

const repositoryRoot = new URL("../../", import.meta.url)
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8")

test("registers the local Tailwind PostCSS pipeline", async () => {
  assert.ok(gatsbyConfig.plugins.includes("gatsby-plugin-postcss"))

  const postcssConfig = await import("../../postcss.config.mjs")

  assert.deepEqual(postcssConfig.default, {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  })
})

test("loads only approved local fonts and light theme tokens", async () => {
  const [browserEntry, themeCss] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/theme.css"),
  ])

  for (const fontImport of [
    "@fontsource/noto-serif-kr/400.css",
    "@fontsource/noto-sans-kr/400.css",
    "@fontsource/noto-sans-kr/500.css",
    "@fontsource/noto-sans-kr/600.css",
  ]) {
    assert.ok(browserEntry.includes(`import "${fontImport}"`))
  }

  assert.match(browserEntry, /\.\/src\/styles\/theme\.css/)
  assert.match(themeCss, /@import "tailwindcss";/)
  assert.match(themeCss, /--font-display: "Noto Serif KR"/)
  assert.match(themeCss, /--font-body: "Noto Sans KR"/)
  assert.match(themeCss, /--color-brand: var\(--accent\)/)
  assert.match(themeCss, /color-scheme: light/)
  assert.doesNotMatch(`${browserEntry}\n${themeCss}`, /https?:\/\//)
})
```

- [ ] **Step 2: Run the focused test and confirm the missing-file failure**

Run:

```bash
node --test src/styles/style-foundation.test.mjs
```

Expected: the PostCSS test passes and the new test FAILS with `ENOENT` for `gatsby-browser.js` or `src/styles/theme.css`.

- [ ] **Step 3: Install exact self-hosted font packages**

Run:

```bash
npm install --save-exact @fontsource/noto-serif-kr@5.2.9 @fontsource/noto-sans-kr@5.2.9
```

Expected: both packages appear in `dependencies` with exact versions and npm exits 0.

- [ ] **Step 4: Add the Gatsby browser style entry**

Create `gatsby-browser.js`:

```js
import "@fontsource/noto-serif-kr/400.css"
import "@fontsource/noto-sans-kr/400.css"
import "@fontsource/noto-sans-kr/500.css"
import "@fontsource/noto-sans-kr/600.css"

import "./src/styles/theme.css"
```

- [ ] **Step 5: Add the light theme and Tailwind token map**

Create `src/styles/theme.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: light;

  --bg: #ffffff;
  --surface: #f5f5f5;
  --surface-warm: #fafafa;
  --fg: #0d0d0d;
  --fg-2: #1a1a1a;
  --muted: #6e6e6e;
  --meta: #9b9b9b;
  --border: #e5e5e5;
  --border-soft: #ededed;
  --accent: #10a37f;
  --accent-on: #ffffff;
  --accent-hover: #0a7a5e;
  --accent-active: color-mix(in oklab, var(--accent), black 14%);
  --success: #10a37f;
  --warn: #f5a623;
  --danger: #ef4146;

  --font-display: "Noto Serif KR", ui-serif, Georgia, serif;
  --font-body: "Noto Sans KR", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 28px;
  --text-3xl: 40px;
  --text-4xl: 56px;
  --leading-body: 1.65;
  --leading-tight: 1.08;
  --tracking-display: -0.02em;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --section-y-desktop: 96px;
  --section-y-tablet: 64px;
  --section-y-phone: 48px;

  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
  --elev-flat: none;
  --elev-ring: 0 0 0 1px var(--border);
  --elev-raised: 0 4px 16px rgb(13 13 13 / 6%);
  --focus-ring: 0 0 0 3px rgb(16 163 127 / 12%);
  --motion-fast: 150ms;
  --motion-base: 220ms;
  --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);

  --container-max: 1200px;
  --container-gutter-desktop: 48px;
  --container-gutter-tablet: 24px;
  --container-gutter-phone: 24px;
}

@theme inline {
  --color-canvas: var(--bg);
  --color-panel: var(--surface);
  --color-panel-soft: var(--surface-warm);
  --color-ink: var(--fg);
  --color-ink-soft: var(--fg-2);
  --color-copy-muted: var(--muted);
  --color-copy-meta: var(--meta);
  --color-line: var(--border);
  --color-line-soft: var(--border-soft);
  --color-brand: var(--accent);
  --font-ui: var(--font-body);
  --font-editorial: var(--font-display);
  --font-code: var(--font-mono);
}

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    overflow-x: clip;
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--leading-body);
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 400;
    text-wrap: balance;
  }

  p {
    margin: 0;
    text-wrap: pretty;
  }

  a {
    color: inherit;
  }

  button,
  input {
    font: inherit;
  }

  code,
  pre {
    font-family: var(--font-mono);
  }

  img,
  svg,
  video {
    max-width: 100%;
    height: auto;
  }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    box-shadow: var(--focus-ring);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 6: Run source tests and type checking**

Run:

```bash
node --test src/styles/style-foundation.test.mjs
npm test
npm run typecheck
```

Expected: focused tests 2/2 PASS, full test suite 14/14 PASS, TypeScript exits 0.

- [ ] **Step 7: Commit the self-hosted theme foundation**

```bash
git add package.json package-lock.json gatsby-browser.js src/styles/theme.css src/styles/style-foundation.test.mjs
git commit -m "feat: add self-hosted light theme tokens"
```

### Task 3: Isolated MDX Boundary and Build Verification

**Files:**
- Create: `src/styles/mdx.css`
- Create: `scripts/verify-style-build.mjs`
- Modify: `gatsby-browser.js`
- Modify: `src/styles/style-foundation.test.mjs`
- Modify: `src/templates/post.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2의 `theme.css` variables and Gatsby browser style entry
- Produces: `.mdx-content` style boundary and `npm run verify:styles`

- [ ] **Step 1: Extend the contract test for the MDX boundary**

Append to `src/styles/style-foundation.test.mjs`:

```js
test("keeps MDX semantic resets inside an explicit boundary", async () => {
  const [browserEntry, mdxCss, postTemplate] = await Promise.all([
    readRepositoryFile("gatsby-browser.js"),
    readRepositoryFile("src/styles/mdx.css"),
    readRepositoryFile("src/templates/post.tsx"),
  ])

  assert.match(browserEntry, /\.\/src\/styles\/mdx\.css/)
  assert.match(mdxCss, /\.mdx-content/)
  assert.doesNotMatch(mdxCss, /(^|\n)\s*(ul|ol|table)\s*\{/)
  assert.match(postTemplate, /className="mdx-content"/)
})
```

- [ ] **Step 2: Run the focused test and confirm the boundary failure**

Run:

```bash
node --test src/styles/style-foundation.test.mjs
```

Expected: the first two tests pass and the new test FAILS with `ENOENT` for `src/styles/mdx.css` or missing `.mdx-content`.

- [ ] **Step 3: Add scoped MDX semantic defaults**

Create `src/styles/mdx.css`:

```css
@layer components {
  .mdx-content {
    min-width: 0;
  }

  .mdx-content :where(h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, table) {
    margin-block: 1em;
  }

  .mdx-content :where(ul, ol) {
    padding-inline-start: 1.5rem;
  }

  .mdx-content ul {
    list-style: disc;
  }

  .mdx-content ol {
    list-style: decimal;
  }

  .mdx-content table {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
  }

  .mdx-content pre {
    max-width: 100%;
    overflow-x: auto;
  }
}
```

Append the MDX stylesheet after the theme import in `gatsby-browser.js`:

```js
import "./src/styles/theme.css"
import "./src/styles/mdx.css"
```

Wrap only the MDX children in `src/templates/post.tsx`:

```tsx
        <div className="mdx-content">{children}</div>
```

- [ ] **Step 4: Run the focused test and the full source checks**

Run:

```bash
node --test src/styles/style-foundation.test.mjs
npm test
npm run typecheck
```

Expected: focused tests 3/3 PASS, full test suite 15/15 PASS, TypeScript exits 0.

- [ ] **Step 5: Add the production style verifier**

Create `scripts/verify-style-build.mjs`:

```js
import assert from "node:assert/strict"
import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url))

const walk = async directory => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(entry => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? walk(entryPath) : [entryPath]
    }),
  )

  return nested.flat()
}

await Promise.all([
  access(path.join(publicDirectory, "index.html")),
  access(path.join(publicDirectory, "posts", "mdx-foundation", "index.html")),
])

const files = await walk(publicDirectory)
const sourceFiles = files.filter(file => /\.(?:css|html)$/.test(file))
const source = (
  await Promise.all(sourceFiles.map(file => readFile(file, "utf8")))
).join("\n")
const localFonts = files.filter(file => file.endsWith(".woff2"))

assert.doesNotMatch(
  source,
  /cdn\.jsdelivr\.net|unpkg\.com|fonts\.(?:googleapis|gstatic)\.com/,
)
assert.match(source, /Noto Sans KR/)
assert.match(source, /Noto Serif KR/)
assert.ok(localFonts.length > 0, "expected local woff2 font assets")

console.log(`style build verified: ${localFonts.length} local woff2 assets`)
```

Add this script to `package.json`:

```json
"verify:styles": "node scripts/verify-style-build.mjs"
```

- [ ] **Step 6: Run the clean production verification**

Run:

```bash
npm run clean
npm run build
npm run verify:styles
```

Expected: Gatsby build exits 0; the verifier prints `style build verified:` followed by a positive integer and `local woff2 assets`.

- [ ] **Step 7: Run the final issue-level checks**

Run:

```bash
npm test
npm run typecheck
git diff --check
```

Expected: 15/15 tests PASS, TypeScript exits 0, and `git diff --check` exits 0.

- [ ] **Step 8: Commit the MDX boundary and build verifier**

```bash
git add package.json gatsby-browser.js src/styles/mdx.css src/styles/style-foundation.test.mjs src/templates/post.tsx scripts/verify-style-build.mjs
git commit -m "test: verify local style foundation"
```

## Issue Review Gate

- [ ] Show the complete diff and verification evidence to 종성님.
- [ ] After explicit permission, push the single feature branch and create a Draft PR targeting `develop`.
- [ ] Let 종성님 run the site and review the changed foundation.
- [ ] After explicit permission, mark the PR Ready and wait for Codex review.
- [ ] Reproduce and technically evaluate every Codex finding; fix valid findings before merge.
- [ ] Confirm required checks and Codex review are complete.
- [ ] Merge only after 종성님 explicitly approves the merge.
- [ ] Synchronize local `develop` with the merged remote branch and re-run the proportional smoke checks.
- [ ] Discuss the common layout issue scope with 종성님; do not create it automatically.
