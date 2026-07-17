# Current Gatsby Rebuild Post Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 글을 2025년 회고가 없는 현재 Gatsby 5 재구축 기록으로 교체하고, 실제 Tailwind CSS 4 Preflight 문제와 수정·검증 근거를 게시한다.

**Architecture:** MDX가 콘텐츠와 메타데이터의 단일 원본을 유지하고, 소스 계약 테스트가 글의 시간 경계와 기술 사실을 고정한다. 기존 홈·포스트 프로덕션 검증기는 새 설명·날짜·제목 구조를 확인하되 포스트 UI·slug·SEO·라우트 경계는 바꾸지 않는다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, MDX 2.3.0, Tailwind CSS 4.3.3, Node.js 24.14.1 built-in test runner

## Global Constraints

- 제목은 `Gatsby로 블로그 사이트 만들기 1편 - 시작하기`를 유지한다.
- slug와 공개 경로는 `gatsby-blog-1-getting-started`, `/posts/gatsby-blog-1-getting-started/`를 유지한다.
- `publishedAt`은 사용자가 지정한 `2026-04-18`로 고정한다.
- description은 `배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다.`로 고정한다.
- 태그 `Gatsby`, `GitHub Pages`, `React`, `Tailwind CSS`를 유지한다.
- 글에는 2025년 회고, 과거 Tailwind 오류, MDX 다운그레이드, `text-red-500` 임시 확인, `public/`을 `main`에 복사한 수동 배포를 남기지 않는다.
- Tailwind 문제는 실제 Preflight 제목·목록·링크 초기화와 링크 대비 수정만 설명한다.
- GitHub Actions 배포는 아직 구현 전이라고 명시하고 완료된 것처럼 쓰지 않는다.
- 과거 이미지 참조는 제거하지만 이미지 파일은 삭제하지 않는다.
- `npm run clean`은 `.cache/`와 `public/`을 삭제하므로 사용자 확인 없이 실행하지 않는다.
- GitHub 이슈·PR·원격 브랜치는 수정하지 않는다.
- `.playwright-cli/`은 수정·삭제·커밋하지 않는다.

## File Structure

- Modify `content/posts/gatsby-blog-1-getting-started/index.mdx`: 현재 Gatsby 재구축 기록과 고정 메타데이터를 소유한다.
- Modify `src/components/post-screen-contract.test.mjs`: 원본 MDX의 기술 사실·금지된 과거 서술·고정 메타데이터를 검증한다.
- Modify `scripts/verify-home-build.mjs`: 홈 카드의 새 description과 발행일을 검증한다.
- Modify `scripts/verify-post-build.mjs`: 빌드된 포스트의 새 본문 구조·SEO·과거 내용 부재를 검증한다.

---

### Task 1: Current Rebuild Content Contract and MDX

**Files:**
- Modify: `src/components/post-screen-contract.test.mjs`
- Modify: `content/posts/gatsby-blog-1-getting-started/index.mdx`

**Interfaces:**
- Consumes: 현재 포스트 title·slug·tags, Tailwind 설정과 스타일 테스트에 이미 기록된 실제 기술 사실
- Produces: `2026-04-18` 메타데이터와 현재 재구축 본문, Task 2 프로덕션 검증기의 기대 문자열

- [ ] **Step 1: Replace the old migration contract with a failing current-rebuild contract**

`src/components/post-screen-contract.test.mjs`의 첫 import에서 사용하지 않게 되는 `access`를 제거한다.

```js
import { readFile } from "node:fs/promises"
```

`uses the approved real post and local image assets` 테스트 전체를 다음 테스트로 교체한다.

```js
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
  assert.match(post, /GitHub Actions 배포는 아직 연결하지 않았다/)
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
```

- [ ] **Step 2: Run the focused contract and verify it fails for the old content**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
```

Expected: FAIL in `documents the current Gatsby rebuild and Tailwind fixes` because the current MDX still has `publishedAt: "2025-08-31"` and lacks the current-rebuild facts.

- [ ] **Step 3: Replace the MDX with the approved current-rebuild article**

Replace `content/posts/gatsby-blog-1-getting-started/index.mdx` with:

````mdx
---
title: "Gatsby로 블로그 사이트 만들기 1편 - 시작하기"
slug: "gatsby-blog-1-getting-started"
publishedAt: "2026-04-18"
description: "배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다."
tags:
  - Gatsby
  - GitHub Pages
  - React
  - Tailwind CSS
---

개발자 블로그 저장소를 다시 열어 보니 유지보수할 Gatsby 원본은 없고, 브라우저에 배포되는 HTML·CSS·JavaScript 산출물만 남아 있었습니다. 화면은 공개되고 있었지만 글이나 기능을 안전하게 추가할 수 있는 소스 기준선은 없는 상태였습니다.

이번 작업의 목표는 기존 공개 사이트를 바로 덮어쓰는 것이 아니었습니다. 먼저 재현 가능한 Gatsby 5 소스를 만들고, MDX·SEO·스타일·반응형 UI를 작은 단계로 검증한 뒤 GitHub Pages 배포 전환을 준비하는 것이었습니다.

> 현재 `main`은 기존 공개 사이트를 유지합니다. 새 Gatsby 소스는 `develop`에서 통합하고 있으며 GitHub Actions 배포는 아직 연결하지 않았다.

## 왜 소스부터 다시 구축했는가

빌드 산출물만으로도 화면 문구나 CSS를 직접 고칠 수는 있습니다. 하지만 생성된 파일은 원본 컴포넌트와 데이터 흐름을 잃은 결과물이므로 다음 변경에서 같은 결과를 재현하기 어렵습니다.

재구축을 시작하며 경계를 먼저 정했습니다.

1. 기존 Git 이력과 배포 산출물을 별도 bundle로 보존합니다.
2. 공개 사이트를 제공하는 `main`은 출시 준비가 끝날 때까지 유지합니다.
3. 새 Gatsby 소스는 `develop`에서 통합합니다.
4. 기능은 작은 브랜치와 PR 단위로 검증합니다.
5. `.cache`, `public`, `node_modules` 같은 생성물은 Git에 넣지 않습니다.

이 구조를 사용하면 새 빌드가 실패해도 기존 사이트에는 영향을 주지 않습니다. 기능을 하나씩 병합하면서도 출시 시점은 별도로 결정할 수 있습니다.

## 재현 가능한 Gatsby 5 기준선

먼저 실행 환경과 직접 의존성을 정확한 버전으로 고정했습니다.

| 항목 | 버전 |
| --- | --- |
| Gatsby | 5.16.1 |
| Node.js | 24.14.1 |
| npm | 11.11.0 |
| React | 18.3.1 |
| TypeScript | 5.9.3 |

Node.js 버전은 `.nvmrc`와 `package.json`의 `engines`에 함께 기록했습니다. npm 버전은 `packageManager`로 고정하고 `package-lock.json`을 소스에 포함했습니다. 깨끗한 환경에서는 다음 명령으로 같은 의존성 트리를 설치합니다.

```shell
npm ci
```

Gatsby 설정에는 ESM이 필요한 플러그인이 있어 `gatsby-config.mjs`를 사용했습니다. 반면 package 전체에 `"type": "module"`을 선언하면 Gatsby가 생성하는 CommonJS 파일과 충돌했기 때문에 ESM 경계는 설정 파일로 제한했습니다.

## MDX와 Tailwind를 별도 단계로 나눈 이유

콘텐츠 처리와 화면 스타일은 실패 원인과 검증 방법이 다릅니다. 두 기반을 한 번에 추가하면 빌드가 깨졌을 때 MDX 변환 문제인지 PostCSS 문제인지 구분하기 어렵습니다.

- MDX 단계는 파일 소싱, frontmatter 스키마, slug 검증, 페이지 생성을 담당합니다.
- Tailwind 단계는 PostCSS 연결, 디자인 토큰, 기본 스타일과 폰트 로딩을 담당합니다.

MDX 페이지가 먼저 빌드되는 것을 확인한 뒤 Tailwind를 연결했습니다. 덕분에 이후에 나타난 스타일 회귀를 콘텐츠 패키지 버전 문제와 분리해서 판단할 수 있었습니다.

## Tailwind CSS 4와 PostCSS 연결

현재 저장소의 스타일 기반은 다음 버전으로 고정했습니다.

| 항목 | 버전 |
| --- | --- |
| Tailwind CSS | 4.3.3 |
| @tailwindcss/postcss | 4.3.3 |
| PostCSS | 8.5.19 |
| gatsby-plugin-postcss | 6.16.0 |

Gatsby에는 `gatsby-plugin-postcss`를 등록하고, 플러그인이 저장소 루트의 `postcss.config.cjs`를 읽도록 경로를 명시했습니다. PostCSS 설정은 Tailwind CSS 4의 전용 플러그인을 사용합니다.

```javascript
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

전역 스타일 진입점에서는 Tailwind를 한 번 불러오고, 클래스 탐색 기준을 `src`로 제한했습니다.

```css
@import "tailwindcss" source("../");
```

색상·폰트 같은 디자인 값은 `:root`의 CSS 변수로 정의하고 `@theme inline`에서 Tailwind 토큰과 연결했습니다. 화면 컴포넌트는 이 토큰과 범위가 제한된 CSS를 함께 사용합니다.

## Preflight 이후 사라진 문서 의미 복원

PostCSS 연결과 프로덕션 빌드는 성공했지만, Tailwind Preflight가 브라우저 기본 스타일을 초기화하면서 문서의 의미가 화면에서 잘 드러나지 않는 문제가 생겼습니다.

- `h1`부터 `h6`까지 제목 크기가 본문과 비슷해졌습니다.
- `ul`과 `ol`의 목록 마커와 들여쓰기가 사라졌습니다.
- 링크의 색상과 밑줄이 사라져 일반 텍스트와 구분하기 어려워졌습니다.

이 동작은 Tailwind 오류가 아니라 일관된 스타일링을 위한 초기화입니다. 따라서 Preflight를 제거하는 대신 블로그가 필요한 의미 기본값을 명시적으로 복원했습니다.

### 제목과 목록 기본값

전역 `@layer base`에서 제목별 크기와 목록 마커를 정의했습니다. MDX 본문에는 `.mdx-content` 경계를 두어 수직 간격, 표와 코드 블록의 overflow 규칙이 다른 화면으로 새지 않게 했습니다.

```css
@layer base {
  h1 { font-size: var(--text-3xl); }
  h2 { font-size: var(--text-2xl); }
  h3 { font-size: var(--text-xl); }

  ul { list-style: disc; }
  ol { list-style: decimal; }
}
```

### 링크 식별성과 색상 대비

처음 사용한 브랜드 강조색은 흰 배경에서 일반 크기 링크 색상으로 쓰기에 대비가 충분하지 않았습니다. 브랜드 색과 링크 색을 분리하고 기본 링크는 `#0a7a5e`, hover는 `#075b47`로 조정했습니다. 밑줄과 키보드 포커스도 함께 복원했습니다.

색상 수정은 눈으로만 판단하지 않았습니다. 테스트가 CSS 변수의 상대 휘도를 계산하고 기본·hover 링크가 흰 배경에서 모두 WCAG AA 기준인 4.5:1 이상인지 확인합니다.

## 로컬 폰트와 외부 요청 경계

제목과 로고에는 Noto Serif KR, 본문과 UI에는 Noto Sans KR를 사용합니다. 외부 폰트 서비스에 의존하지 않도록 두 글꼴을 저장소 패키지로 제공하고 실제 사용하는 굵기만 전역 진입점에서 불러옵니다.

```javascript
import "@fontsource/noto-serif-kr/400.css"
import "@fontsource/noto-sans-kr/400.css"
import "@fontsource/noto-sans-kr/500.css"
import "@fontsource/noto-sans-kr/600.css"
```

프로덕션 산출물에는 unicode-range로 나뉜 로컬 `woff2`가 생성됩니다. 브라우저는 현재 글에 필요한 파일만 요청하며 외부 폰트 호스트 요청은 만들지 않습니다.

## 검증과 현재 배포 경계

스타일이 화면에서 한 번 보이는 것만으로 완료하지 않았습니다. 소스 계약, 타입, Gatsby 빌드와 생성된 HTML·CSS를 각각 검증했습니다.

```shell
npm test
npm run typecheck
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

검증기는 다음 경계를 확인합니다.

- Tailwind PostCSS 플러그인과 명시적인 source 경로
- 제목 크기, 목록 마커, 링크 밑줄 복원
- 기본·hover 링크 색상의 4.5:1 이상 대비
- 로컬 폰트 산출물과 외부 리소스 호스트 부재
- 홈과 포스트의 공통 레이아웃과 반응형 너비
- MDX 본문 스타일이 `.mdx-content` 밖으로 새지 않는지 여부

현재까지 새 Gatsby 소스와 UI 기반은 `develop`에서 검증하고 있습니다. GitHub Actions가 소스를 빌드해 Pages 아티팩트를 배포하는 단계는 아직 적용하지 않았습니다. 자동 배포와 공개 주소 전환은 남은 UI·콘텐츠 수용 검증이 끝난 뒤 별도 단계로 진행합니다.

## 마치며

이번 재구축에서 중요한 점은 Tailwind를 설치하는 명령 자체보다 문제의 경계를 나눈 방식이었습니다. MDX와 스타일 기반을 따로 추가했기 때문에 Preflight 회귀를 패키지 충돌로 오인하지 않았고, 의미 스타일과 접근성을 테스트로 고정할 수 있었습니다.

다음 글에서는 MDX frontmatter를 명시적인 스키마로 제한하고, 잘못된 날짜와 중복 slug를 페이지 생성 전에 거부한 과정을 정리할 예정입니다.
````

- [ ] **Step 4: Run the focused and full source tests**

Run:

```bash
node --test src/components/post-screen-contract.test.mjs
npm test
```

Expected: focused tests PASS 8/8 and the full source suite PASS 37/37.

- [ ] **Step 5: Commit the current-rebuild source contract and article**

```bash
git add src/components/post-screen-contract.test.mjs content/posts/gatsby-blog-1-getting-started/index.mdx
git commit -m "content: rewrite post around current Gatsby rebuild"
```

### Task 2: Home and Production Post Verification

**Files:**
- Modify: `scripts/verify-home-build.mjs`
- Modify: `scripts/verify-post-build.mjs`

**Interfaces:**
- Consumes: Task 1의 title, slug, `publishedAt`, description과 H2 제목
- Produces: 빌드된 홈·포스트·SEO·sitemap에 대한 현재 콘텐츠 검증

- [ ] **Step 1: Build the rewritten post and confirm the old verifiers fail**

Run:

```bash
npm run build
npm run verify:home
npm run verify:post
```

Expected: `npm run build` exits 0. `verify:home` and `verify:post` FAIL because they still expect the old description, `2025-08-31`, old headings, and two image references.

- [ ] **Step 2: Update the home card verifier**

In `scripts/verify-home-build.mjs`, replace the old description assertion with:

```js
assert.match(
  main,
  /배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\./,
)
```

Replace the old date assertion with:

```js
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-card-date[^"]*")(?=[^>]*datetime="2026-04-18")[^>]*>\s*2026\.04\.18\s*<\/time>/i,
)
```

- [ ] **Step 3: Update post body and metadata expectations**

In `scripts/verify-post-build.mjs`, replace the post description assertion with:

```js
assert.match(
  main,
  /배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\./,
)
```

Replace the post date assertion with:

```js
assert.match(
  main,
  /<time\b(?=[^>]*class="[^"]*post-date[^"]*")(?=[^>]*datetime="2026-04-18")[^>]*>\s*2026\.04\.18\s*<\/time>/i,
)
```

Replace the old heading loop with:

```js
for (const heading of [
  "왜 소스부터 다시 구축했는가",
  "재현 가능한 Gatsby 5 기준선",
  "MDX와 Tailwind를 별도 단계로 나눈 이유",
  "Tailwind CSS 4와 PostCSS 연결",
  "Preflight 이후 사라진 문서 의미 복원",
  "로컬 폰트와 외부 요청 경계",
  "검증과 현재 배포 경계",
  "마치며",
]) {
  assert.match(main, new RegExp(`<h2[^>]*>${heading}</h2>`))
}
```

Replace the old semantic body and image assertions with:

```js
assert.match(main, /<blockquote>/)
assert.match(main, /<ol>/)
assert.match(main, /<ul>/)
assert.match(main, /<table>/)
assert.match(main, /<pre><code class="language-shell">/)
assert.match(main, /<pre><code class="language-javascript">/)
assert.match(main, /<pre><code class="language-css">/)
assert.match(main, /<code>npm ci<\/code>/)
assert.match(main, /제목 크기, 목록 마커, 링크 식별성/)
assert.match(main, /4\.5:1/)
assert.match(main, /GitHub Actions 배포는 아직 연결하지 않았다/)
assert.doesNotMatch(
  main,
  /2025|ERROR #98123|@mdx-js\/react|text-red-500|hello-gatsby-tailwindcss\.png|github-pages-setting\.png/,
)
```

Remove the `Promise.all` block that calls `access` for the two old image files. Keep the `access` import because the retired-route assertions still use it.

- [ ] **Step 4: Update SEO description and published date expectations**

Replace the description meta assertion with:

```js
assert.match(
  html,
  /<meta\b(?=[^>]*name="description")(?=[^>]*content="배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다\.")[^>]*>/,
)
```

Replace the published time assertion with:

```js
assert.match(
  html,
  /<meta\b(?=[^>]*property="article:published_time")(?=[^>]*content="2026-04-18")[^>]*>/,
)
```

Replace the final log line with:

```js
console.log(
  "post build verified: current Gatsby rebuild content, metadata, and route contracts passed",
)
```

- [ ] **Step 5: Rebuild and run all production verifiers**

Run:

```bash
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected: build exits 0; all four verifiers exit 0. The post verifier prints `post build verified: current Gatsby rebuild content, metadata, and route contracts passed`.

- [ ] **Step 6: Run type checking and the full source suite**

Run:

```bash
npm run typecheck
npm test
```

Expected: typecheck exits 0 and full source tests PASS 37/37.

- [ ] **Step 7: Verify scope and preserved files**

Run:

```bash
git status --short
git diff --check
rg -n '2025|ERROR #98123|@mdx-js/react|text-red-500|hello-gatsby-tailwindcss\.png|github-pages-setting\.png' content/posts/gatsby-blog-1-getting-started/index.mdx
test -f static/images/posts/gatsby-blog-1-getting-started/hello-gatsby-tailwindcss.png
test -f static/images/posts/gatsby-blog-1-getting-started/github-pages-setting.png
```

Expected: `rg` returns no matches; both `test -f` commands exit 0; tracked changes are limited to the MDX, contract test, and two verifier scripts. `.playwright-cli/` remains untracked and unchanged.

- [ ] **Step 8: Commit the production verifier updates**

```bash
git add scripts/verify-home-build.mjs scripts/verify-post-build.mjs
git commit -m "test: verify current Gatsby rebuild article"
```

### Task 3: Final Branch Verification

**Files:**
- Verify only; no source changes expected

**Interfaces:**
- Consumes: Tasks 1–2 commits
- Produces: fresh evidence that the rewritten post is ready for user review

- [ ] **Step 1: Run the complete non-destructive verification sequence**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected: 37/37 tests pass, typecheck exits 0, build exits 0, and all four production verifiers pass.

- [ ] **Step 2: Confirm branch state and content boundary**

Run:

```bash
git status --short --branch
git log --oneline -5
rg -n 'publishedAt: "2026-04-18"|Preflight|4\.5:1|GitHub Actions 배포는 아직 연결하지 않았다' content/posts/gatsby-blog-1-getting-started/index.mdx
```

Expected: only the pre-existing `.playwright-cli/` is untracked, the two new implementation commits are present, and all four approved content markers are found.

- [ ] **Step 3: Stop before external writes**

Do not push, create or edit a GitHub issue/PR, delete the old image files, run `npm run clean`, or merge. Report the local result and request the next explicit instruction.
