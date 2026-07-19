# Developer Blog Implementation-Based Post Series Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Gatsby 글 3편을 새 제목·slug의 구현 이력 기반 실전 제작기로 교체하고 홈, 상세, canonical, sitemap, 이전·다음 글 계약을 새 URL에 맞춘다.

**Architecture:** 애플리케이션 컴포넌트와 스타일은 유지하고 `content/posts`의 입력과 이를 검증하는 소스 계약·프로덕션 산출물 계약만 바꾼다. 각 글은 독립적으로 RED→GREEN→커밋한 뒤 세 글이 모두 준비되면 홈·상세·스타일 검증기를 새 메타데이터와 경로로 전환한다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, MDX 2.3.0, GraphQL, Tailwind CSS 4.3.3, Node.js 24.14.1 `node:test`, 정적 HTML 검증 스크립트

## Global Constraints

- 핵심 1편 제목·slug·발행일은 `왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기`, `why-github-pages-and-gatsby`, `2026-04-18`이다.
- 핵심 2편 제목·slug·발행일은 `MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기`, `gatsby-mdx-graphql-post-system`, `2026-05-16`이다.
- 핵심 3편 제목·slug·발행일은 `Tailwind CSS로 내 디자인의 개발자 블로그 완성하기`, `custom-developer-blog-with-tailwind-css`, `2026-06-27`이다.
- 기존 세 URL은 유지하거나 리다이렉트하지 않는다.
- 제목에 `1편`, `2편`, `3편` 표기를 넣지 않는다.
- 전체 파일을 본문에 복제하지 않고 역할을 설명하는 핵심 코드 조각만 사용한다.
- 코드 조각은 실제 저장소의 현재 코드와 일치하고 파일 경로·역할·사용자화 지점을 함께 설명한다.
- 기존 `publishedAt` 세 값은 유지하고 날짜 중복 검증을 추가하지 않는다.
- UI 컴포넌트, CSS 동작, 의존성, Gatsby 데이터 구조는 변경하지 않는다.
- 후속 사례 2편, Google Analytics 4, Search Console, 추가 SEO, About 페이지는 구현하지 않는다.
- 기존 포스트 경로 제거와 `npm run clean` 실행은 삭제 작업이므로 정확한 대상을 한 줄로 고지하고 사용자 확인을 받은 뒤 수행한다.
- 참조가 사라진 이미지 파일은 삭제하지 않는다.
- 구현은 worktree 없이 최신 `develop` 기준의 기능 브랜치에서 진행한다.

---

## File Structure

### 콘텐츠 경계

- Rename/Rewrite: `content/posts/gatsby-blog-1-getting-started/index.mdx` → `content/posts/why-github-pages-and-gatsby/index.mdx`
  - 기술 선택 배경, 재구축, 최소 구조, 디자인 변경 지점, Pages 배포를 설명한다.
- Rename/Rewrite: `content/posts/gatsby-blog-2-managing-mdx-posts/index.mdx` → `content/posts/gatsby-mdx-graphql-post-system/index.mdx`
  - MDX 저장 구조, frontmatter, 검증, Gatsby 데이터 계층, 홈·상세 생성을 하나의 파이프라인으로 설명한다.
- Rename/Rewrite: `content/posts/gatsby-blog-3-graphql-page-generation/index.mdx` → `content/posts/custom-developer-blog-with-tailwind-css/index.mdx`
  - 디자인 규칙, 컴포넌트 분해, Tailwind 토큰, 로컬 폰트, 824px 레이아웃, 반응형·Preflight 검증을 설명한다.

### 소스 계약

- Modify: `src/components/post-screen-contract.test.mjs:195-305`
  - 새 포스트 경로, frontmatter, 목차, 핵심 사실, 프로덕션 검증기 경로를 고정한다.
- Modify: `src/components/home-screen-contract.test.mjs:207-235`
  - 홈 검증기가 새 slug와 새 태그 집합을 고정하는지 확인한다.

### 프로덕션 산출물 계약

- Modify: `scripts/verify-home-build.mjs:33-72`
  - 홈 카드의 새 제목·설명·경로·태그와 필터 순서를 고정한다.
- Modify: `scripts/verify-post-build.mjs:7-82,308-367`
  - 상세 페이지의 새 메타데이터·목차·이전/다음 글·canonical·sitemap과 폐기 경로 부재를 검증한다.
- Modify: `scripts/verify-style-build.mjs:20-30`
  - 로컬 폰트 검증의 대표 포스트 경로를 새 1편 경로로 바꾼다.

### 변경하지 않는 파일

- `gatsby-node.mjs`: slug·발행일을 데이터에서 읽어 페이지와 이전·다음 글을 생성하는 현재 계약을 그대로 사용한다.
- `src/pages/index.tsx`: `publishedAt DESC` 정렬과 `allMdx` 조회를 그대로 사용한다.
- `src/templates/post.tsx`: frontmatter, TOC, SEO, 이전·다음 글 조립을 그대로 사용한다.
- `src/styles/*.css`: 이번 작업은 콘텐츠 전환이므로 시각 동작을 바꾸지 않는다.

## Execution Setup

설계·계획 커밋이 있는 현재 문서 브랜치에서 구현 브랜치를 분기한다. worktree는 만들지 않는다.

```bash
git status --short
git switch -c content/implementation-based-post-series
```

Expected: 계획 문서 외 미커밋 파일이 없고 새 브랜치가 `docs/blog-post-series-rewrite`의 설계·계획 이력을 포함한다.

---

### Task 1: GitHub Pages·Gatsby 선택 글 교체

**Files:**
- Rename: `content/posts/gatsby-blog-1-getting-started/index.mdx` → `content/posts/why-github-pages-and-gatsby/index.mdx`
- Modify: `src/components/post-screen-contract.test.mjs:195-227`

**Interfaces:**
- Consumes: `package.json`의 런타임·의존성, `gatsby-config.mjs`의 MDX·filesystem·sitemap 구성, `.github/workflows/deploy-pages.yml`의 Pages artifact 배포 흐름
- Produces: slug `why-github-pages-and-gatsby`, publishedAt `2026-04-18`, 후속 글이 연결할 시리즈 도입부

- [ ] **Step 1: 새 1편 콘텐츠 계약을 먼저 작성한다**

`src/components/post-screen-contract.test.mjs`의 기존 첫 글 테스트를 아래 계약으로 교체한다.

```javascript
test("explains why the blog uses GitHub Pages and Gatsby", async () => {
  const post = await readRepositoryFile(
    "content/posts/why-github-pages-and-gatsby/index.mdx",
  )

  assert.match(post, /title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기"/)
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
```

- [ ] **Step 2: 새 파일이 없어 테스트가 RED인지 확인한다**

Run:

```bash
node --test --test-name-pattern "explains why" src/components/post-screen-contract.test.mjs
```

Expected: FAIL. 빈 문자열에 새 title 또는 slug가 없어 `assert.match`가 실패한다.

- [ ] **Step 3: 기존 1편 경로 제거 확인을 받는다**

실행 전 사용자에게 다음 한 줄을 알리고 확인을 받는다.

```text
기존 포스트 경로 content/posts/gatsby-blog-1-getting-started/index.mdx를 새 slug 경로로 이동해 기존 URL 생성을 중단하겠습니다.
```

Expected: 사용자가 승인하기 전 `git mv` 또는 기존 경로 제거를 실행하지 않는다.

- [ ] **Step 4: 파일을 새 slug 경로로 옮기고 frontmatter를 확정한다**

Run after approval:

```bash
mkdir -p content/posts/why-github-pages-and-gatsby
git mv content/posts/gatsby-blog-1-getting-started/index.mdx content/posts/why-github-pages-and-gatsby/index.mdx
```

MDX frontmatter는 정확히 다음 값을 사용한다.

```yaml
---
title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기"
slug: "why-github-pages-and-gatsby"
publishedAt: "2026-04-18"
description: "무료 정적 호스팅과 React 기반 UI라는 요구사항에서 GitHub Pages와 Gatsby를 선택하고, 배포 파일만 남은 블로그를 소스 프로젝트로 재구축한 과정을 설명합니다."
tags:
  - Gatsby
  - GitHub Pages
  - React
  - SSG
---
```

- [ ] **Step 5: 승인된 목차와 실제 근거로 1편을 작성한다**

H2 순서는 아래와 같아야 한다.

```markdown
## 블로그를 다시 만들게 된 배경
## 먼저 요구사항 정하기
## GitHub Pages를 선택한 이유
## Gatsby를 선택한 이유
## 배포 산출물을 소스 프로젝트로 재구축하기
## 최소 프로젝트 구조 만들기
## 처음부터 디자인 변경 지점 분리하기
## 빌드와 GitHub Pages 배포 확인하기
## 다음 글
```

각 섹션은 다음 사실을 포함한다.

| 섹션 | 반드시 설명할 사실 | 근거 파일 |
| --- | --- | --- |
| 배경 | 배포 산출물만 남아 유지보수 가능한 소스 기준선이 없었다 | 기존 1편, Git 이력 |
| 요구사항 | 무료 정적 호스팅, Git 기반 관리, React, 파일 중심 글, 디자인 자유도 | 설계 문서 |
| GitHub Pages | 정적 결과 배포와 저장소 연결이 장점이며 서버 런타임 기능에는 맞지 않는다 | `.github/workflows/deploy-pages.yml` |
| Gatsby | React 컴포넌트, SSG, MDX·GraphQL 데이터 계층, 플러그인 구성이 요구와 맞았다 | `gatsby-config.mjs` |
| 재구축 | `main` 공개 상태와 `develop` 통합을 분리하고 작은 PR로 전환했다 | Git 이력 |
| 최소 구조 | `content/posts`, `src/pages`, `src/templates`, `gatsby-config.mjs`, `gatsby-node.mjs` 역할 | 현재 저장소 |
| 디자인 변경 | `theme.css` 토큰, 로컬 폰트, `.site-container`를 우선 사용자화한다 | `src/styles/theme.css`, `src/styles/layout.css` |
| 배포 | test→typecheck→build→verifier→Pages artifact 순서로 검증한다 | `.github/workflows/deploy-pages.yml` |

코드 블록은 `gatsby-config.mjs`의 plugin 배열 일부와 배포 workflow의 빌드·artifact 단계만 발췌한다. 전체 설정 파일은 복제하지 않는다.

- [ ] **Step 6: 1편 계약과 전체 소스 테스트를 GREEN으로 만든다**

Run:

```bash
node --test --test-name-pattern "explains why" src/components/post-screen-contract.test.mjs
npm test
```

Expected: 대상 테스트 PASS, 전체 `78` tests PASS.

- [ ] **Step 7: 첫 글 변경을 커밋한다**

```bash
git add content/posts/why-github-pages-and-gatsby/index.mdx src/components/post-screen-contract.test.mjs
git commit -m "content: explain GitHub Pages and Gatsby choices"
```

---

### Task 2: MDX·GraphQL 콘텐츠 파이프라인 글 교체

**Files:**
- Rename: `content/posts/gatsby-blog-2-managing-mdx-posts/index.mdx` → `content/posts/gatsby-mdx-graphql-post-system/index.mdx`
- Modify: `src/components/post-screen-contract.test.mjs:229-250`

**Interfaces:**
- Consumes: `gatsby-config.mjs`의 posts filesystem source, `gatsby-node.mjs`의 schema·validation·createPages, `src/pages/index.tsx`와 `src/templates/post.tsx`의 GraphQL 쿼리
- Produces: slug `gatsby-mdx-graphql-post-system`, publishedAt `2026-05-16`, 홈·상세를 잇는 콘텐츠 파이프라인 설명

- [ ] **Step 1: 새 2편 콘텐츠 계약을 작성한다**

```javascript
test("explains the MDX and GraphQL post system", async () => {
  const post = await readRepositoryFile(
    "content/posts/gatsby-mdx-graphql-post-system/index.mdx",
  )

  assert.match(post, /title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기"/)
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
  assert.match(post, /allMdx\(sort: \{ frontmatter: \{ publishedAt: DESC \} \}\)/)
  assert.match(post, /sourceInstanceName === "posts"/)
  assert.match(post, /mdx\(id: \{ eq: \$id \}\)/)
  assert.doesNotMatch(post, /(?:제목|Gatsby로 블로그[^\n]*)\s*[123]편/)
})
```

- [ ] **Step 2: 새 2편 경로가 없어 테스트가 RED인지 확인한다**

Run:

```bash
node --test --test-name-pattern "MDX and GraphQL" src/components/post-screen-contract.test.mjs
```

Expected: FAIL. 새 경로의 내용이 빈 문자열이어서 title assertion이 실패한다.

- [ ] **Step 3: 기존 2편 경로 제거 확인을 받는다**

```text
기존 포스트 경로 content/posts/gatsby-blog-2-managing-mdx-posts/index.mdx를 새 slug 경로로 이동해 기존 URL 생성을 중단하겠습니다.
```

Expected: 사용자 승인 뒤에만 경로를 이동한다.

- [ ] **Step 4: 새 경로와 frontmatter를 적용한다**

Run after approval:

```bash
mkdir -p content/posts/gatsby-mdx-graphql-post-system
git mv content/posts/gatsby-blog-2-managing-mdx-posts/index.mdx content/posts/gatsby-mdx-graphql-post-system/index.mdx
```

```yaml
---
title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기"
slug: "gatsby-mdx-graphql-post-system"
publishedAt: "2026-05-16"
description: "MDX 파일 구조와 frontmatter 계약을 정의하고 Gatsby GraphQL로 목록과 상세 페이지를 생성하는 콘텐츠 파이프라인을 설명합니다."
tags:
  - Gatsby
  - MDX
  - GraphQL
  - Validation
---
```

- [ ] **Step 5: 데이터 흐름과 승인된 목차로 2편을 작성한다**

H2 순서는 아래와 같아야 한다.

```markdown
## 글을 코드에 직접 작성하면 생기는 문제
## 포스트 저장 구조 정하기
## frontmatter를 글의 계약으로 사용하기
## 잘못된 글을 빌드 전에 발견하기
## Gatsby가 MDX를 데이터로 바꾸는 과정
## GraphQL로 포스트 목록 조회하기
## 홈 목록과 상세 페이지 연결하기
## slug로 글 URL 만들기
## 콘텐츠와 디자인을 분리하기
## 새 글 등록 체크리스트
```

본문의 데이터 흐름은 다음 관계를 정확히 설명한다.

```text
content/posts/<slug>/index.mdx
  → gatsby-source-filesystem
  → gatsby-plugin-mdx
  → Gatsby Mdx 데이터
  → allMdx 홈 목록 / createPages 상세 경로
```

핵심 코드 조각은 다음 네 경계만 사용한다.

1. `gatsby-node.mjs:20-33`의 `MdxFrontmatter @dontInfer` 스키마
2. `src/lib/post-validation.mjs:82-123`의 필수 값·slug·실제 날짜 검증
3. `src/pages/index.tsx:42-57`의 `allMdx` 발행일 역순 쿼리
4. `gatsby-node.mjs:102-110`과 `src/templates/post.tsx:73-86`의 slug 경로·id 상세 조회

GraphQL은 별도 API 서버로 네트워크 요청하는 계층이 아니라 Gatsby가 빌드 중 모은 데이터를 조회하는 내부 계층이라고 명시한다.

- [ ] **Step 6: 2편 계약과 전체 소스 테스트를 GREEN으로 만든다**

```bash
node --test --test-name-pattern "MDX and GraphQL" src/components/post-screen-contract.test.mjs
npm test
```

Expected: 대상 테스트 PASS, 전체 `78` tests PASS.

- [ ] **Step 7: 두 번째 글 변경을 커밋한다**

```bash
git add content/posts/gatsby-mdx-graphql-post-system/index.mdx src/components/post-screen-contract.test.mjs
git commit -m "content: explain the MDX GraphQL post pipeline"
```

---

### Task 3: Tailwind 기반 사용자 디자인 글 교체

**Files:**
- Rename: `content/posts/gatsby-blog-3-graphql-page-generation/index.mdx` → `content/posts/custom-developer-blog-with-tailwind-css/index.mdx`
- Modify: `src/components/post-screen-contract.test.mjs:252-274`

**Interfaces:**
- Consumes: `src/styles/theme.css`의 디자인 토큰·Preflight 복구, `gatsby-browser.js`의 로컬 폰트, `src/styles/layout.css`의 920px 컨테이너·gutter, 홈·상세 CSS의 반응형 규칙
- Produces: slug `custom-developer-blog-with-tailwind-css`, publishedAt `2026-06-27`, 독자가 자신의 색·폰트·폭을 바꿀 수 있는 디자인 가이드

- [ ] **Step 1: 새 3편 콘텐츠 계약을 작성한다**

```javascript
test("explains how to customize the blog with Tailwind CSS", async () => {
  const post = await readRepositoryFile(
    "content/posts/custom-developer-blog-with-tailwind-css/index.mdx",
  )

  assert.match(post, /title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기"/)
  assert.match(post, /slug: "custom-developer-blog-with-tailwind-css"/)
  assert.match(post, /publishedAt: "2026-06-27"/)
  assert.match(post, /## 화면을 만들기 전에 디자인 규칙 정하기/)
  assert.match(post, /## UI 시안을 컴포넌트로 나누기/)
  assert.match(post, /## Tailwind CSS에 디자인 토큰 정의하기/)
  assert.match(post, /## 로컬 폰트 적용하기/)
  assert.match(post, /## 824px 콘텐츠 레이아웃 통일하기/)
  assert.match(post, /## 홈 목록과 포스트 화면 스타일링하기/)
  assert.match(post, /## 모바일 레이아웃 설계하기/)
  assert.match(post, /## Tailwind Preflight와 브라우저 기본 스타일 확인하기/)
  assert.match(post, /## 내 디자인으로 바꾸는 체크포인트/)
  assert.match(post, /## 여러 화면 크기에서 검증하기/)
  assert.match(post, /@theme inline/)
  assert.match(post, /Noto Serif KR/)
  assert.match(post, /max-width: 920px/)
  assert.match(post, /920px - 48px - 48px = 824px/)
  assert.match(post, /4\.5:1/)
  assert.doesNotMatch(post, /(?:제목|Gatsby로 블로그[^\n]*)\s*[123]편/)
})
```

- [ ] **Step 2: 새 3편 경로가 없어 테스트가 RED인지 확인한다**

```bash
node --test --test-name-pattern "customize the blog" src/components/post-screen-contract.test.mjs
```

Expected: FAIL. 새 경로가 아직 없어 title assertion이 실패한다.

- [ ] **Step 3: 기존 3편 경로 제거 확인을 받는다**

```text
기존 포스트 경로 content/posts/gatsby-blog-3-graphql-page-generation/index.mdx를 새 slug 경로로 이동해 기존 URL 생성을 중단하겠습니다.
```

Expected: 사용자 승인 뒤에만 경로를 이동한다.

- [ ] **Step 4: 새 경로와 frontmatter를 적용한다**

Run after approval:

```bash
mkdir -p content/posts/custom-developer-blog-with-tailwind-css
git mv content/posts/gatsby-blog-3-graphql-page-generation/index.mdx content/posts/custom-developer-blog-with-tailwind-css/index.mdx
```

```yaml
---
title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기"
slug: "custom-developer-blog-with-tailwind-css"
publishedAt: "2026-06-27"
description: "Tailwind CSS 디자인 토큰, 로컬 폰트, 824px 레이아웃과 반응형 규칙을 적용해 자신만의 개발자 블로그 UI를 만드는 과정을 설명합니다."
tags:
  - Tailwind CSS
  - React
  - Responsive Web
  - Accessibility
---
```

- [ ] **Step 5: 디자인 변경 지점과 승인된 목차로 3편을 작성한다**

```markdown
## 화면을 만들기 전에 디자인 규칙 정하기
## UI 시안을 컴포넌트로 나누기
## Tailwind CSS에 디자인 토큰 정의하기
## 로컬 폰트 적용하기
## 824px 콘텐츠 레이아웃 통일하기
## 홈 목록과 포스트 화면 스타일링하기
## 모바일 레이아웃 설계하기
## Tailwind Preflight와 브라우저 기본 스타일 확인하기
## 내 디자인으로 바꾸는 체크포인트
## 여러 화면 크기에서 검증하기
```

각 변경 지점은 아래 실제 구현과 연결한다.

| 독자가 바꿀 것 | 실제 파일과 값 | 설명할 경계 |
| --- | --- | --- |
| 색상 | `src/styles/theme.css:6-23` | `--accent`, `--link`처럼 역할별 토큰을 바꾼다 |
| 폰트 | `gatsby-browser.js:1-4`, `theme.css:25-27` | 제목·본문·코드 글꼴 역할을 분리한다 |
| 콘텐츠 폭 | `layout.css:10-16` | 920px 컨테이너에서 좌우 48px을 빼면 PC 안쪽 824px이다 |
| 카드 | `home.css:105-182` | 데이터 계약과 무관하게 표현만 바꾼다 |
| 상세 | `post.css:27-77` | 제목·설명·날짜 스타일을 콘텐츠 경계 안에 둔다 |
| 모바일 | `layout.css:171-200`, `home.css:193-231` | gutter와 태그 헤더의 화면별 배치를 조정한다 |
| 접근성 | `theme.css:90-200` | Preflight 뒤 제목·목록·링크·focus를 복구한다 |

목차, 코드 복사, 스크롤 상단 버튼, Safari 전용 줄바꿈 디버깅은 후속 글의 범위라고 본문 마지막에 명시한다.

- [ ] **Step 6: 3편 계약과 전체 소스 테스트를 GREEN으로 만든다**

```bash
node --test --test-name-pattern "customize the blog" src/components/post-screen-contract.test.mjs
npm test
```

Expected: 대상 테스트 PASS, 전체 `78` tests PASS.

- [ ] **Step 7: 세 번째 글 변경을 커밋한다**

```bash
git add content/posts/custom-developer-blog-with-tailwind-css/index.mdx src/components/post-screen-contract.test.mjs
git commit -m "content: explain Tailwind blog customization"
```

---

### Task 4: 홈·상세·스타일 산출물 계약을 새 시리즈로 전환

**Files:**
- Modify: `src/components/home-screen-contract.test.mjs:207-235`
- Modify: `src/components/post-screen-contract.test.mjs:276-305`
- Modify: `scripts/verify-home-build.mjs:33-72`
- Modify: `scripts/verify-post-build.mjs:7-82,308-367`
- Modify: `scripts/verify-style-build.mjs:20-30`

**Interfaces:**
- Consumes: Tasks 1-3의 새 frontmatter와 정확한 H2 순서
- Produces: 홈 카드, 필터 태그, 상세 메타데이터, navigation, TOC, canonical, sitemap, 폐기 URL 부재에 대한 production contract

- [ ] **Step 1: 소스 계약이 새 검증기 경로를 요구하도록 바꾼다**

`src/components/home-screen-contract.test.mjs`의 slug assertions를 다음으로 바꾼다.

```javascript
assert.match(verifier, /custom-developer-blog-with-tailwind-css/)
assert.match(verifier, /gatsby-mdx-graphql-post-system/)
assert.match(verifier, /why-github-pages-and-gatsby/)
assert.match(verifier, /Responsive Web/)
assert.match(verifier, /Accessibility/)
assert.match(verifier, /SSG/)
```

`src/components/post-screen-contract.test.mjs`의 verifier 테스트는 style verifier도 읽고 새 대표 경로를 요구한다.

```javascript
const [packageSource, verifier, styleVerifier] = await Promise.all([
  readRepositoryFile("package.json"),
  readRepositoryFile("scripts/verify-post-build.mjs"),
  readRepositoryFile("scripts/verify-style-build.mjs"),
])

assert.match(verifier, /why-github-pages-and-gatsby/)
assert.match(verifier, /gatsby-mdx-graphql-post-system/)
assert.match(verifier, /custom-developer-blog-with-tailwind-css/)
assert.match(styleVerifier, /why-github-pages-and-gatsby/)
```

- [ ] **Step 2: 기존 검증기가 남아 있어 소스 계약이 RED인지 확인한다**

```bash
node --test src/components/home-screen-contract.test.mjs src/components/post-screen-contract.test.mjs
```

Expected: FAIL. 검증기 세 파일이 아직 기존 slug를 사용한다.

- [ ] **Step 3: 홈 검증기의 카드와 필터 계약을 새 값으로 교체한다**

`scripts/verify-home-build.mjs`의 `postContracts`는 발행일 역순으로 다음 값을 사용한다.

```javascript
const postContracts = [
  {
    path: "/posts/custom-developer-blog-with-tailwind-css/",
    title: "Tailwind CSS로 내 디자인의 개발자 블로그 완성하기",
    description:
      "Tailwind CSS 디자인 토큰, 로컬 폰트, 824px 레이아웃과 반응형 규칙을 적용해 자신만의 개발자 블로그 UI를 만드는 과정을 설명합니다.",
    publishedAt: "2026-06-27",
    publishedAtDisplay: "2026.06.27",
    tags: ["Tailwind CSS", "React", "Responsive Web", "Accessibility"],
  },
  {
    path: "/posts/gatsby-mdx-graphql-post-system/",
    title: "MDX와 GraphQL로 관리 가능한 Gatsby 블로그 만들기",
    description:
      "MDX 파일 구조와 frontmatter 계약을 정의하고 Gatsby GraphQL로 목록과 상세 페이지를 생성하는 콘텐츠 파이프라인을 설명합니다.",
    publishedAt: "2026-05-16",
    publishedAtDisplay: "2026.05.16",
    tags: ["Gatsby", "MDX", "GraphQL", "Validation"],
  },
  {
    path: "/posts/why-github-pages-and-gatsby/",
    title: "왜 GitHub Pages와 Gatsby였을까: 개발자 블로그 다시 만들기",
    description:
      "무료 정적 호스팅과 React 기반 UI라는 요구사항에서 GitHub Pages와 Gatsby를 선택하고, 배포 파일만 남은 블로그를 소스 프로젝트로 재구축한 과정을 설명합니다.",
    publishedAt: "2026-04-18",
    publishedAtDisplay: "2026.04.18",
    tags: ["Gatsby", "GitHub Pages", "React", "SSG"],
  },
]

const expectedFilterTags = [
  "Tailwind CSS",
  "React",
  "Responsive Web",
  "Accessibility",
  "Gatsby",
  "MDX",
  "GraphQL",
  "Validation",
  "GitHub Pages",
  "SSG",
]
```

- [ ] **Step 4: 상세 검증기의 세 계약과 H2 outline을 교체한다**

`scripts/verify-post-build.mjs`의 `postContracts`는 발행일 오름차순 navigation 관계를 유지한다.

```javascript
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
    nextPost: null,
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
]
```

- [ ] **Step 5: 글별 특수 assertion과 폐기 경로를 갱신한다**

`generatedPosts.get(...)` 키를 새 slug로 바꾸고 글별 핵심 표현을 다음처럼 확인한다.

```javascript
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
```

폐기 경로는 과거 샘플 두 개와 이번에 교체하는 세 개를 모두 포함한다.

```javascript
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
```

- [ ] **Step 6: 스타일 검증기의 대표 경로를 바꾼다**

`scripts/verify-style-build.mjs`의 `access` 대상만 바꾼다.

```javascript
path.join(
  publicDirectory,
  "posts",
  "why-github-pages-and-gatsby",
  "index.html",
)
```

- [ ] **Step 7: 소스 계약을 GREEN으로 만든다**

```bash
node --test src/components/home-screen-contract.test.mjs src/components/post-screen-contract.test.mjs
npm test
```

Expected: 대상 테스트 PASS, 전체 `78` tests PASS.

- [ ] **Step 8: 산출물 계약 전환을 커밋한다**

```bash
git add src/components/home-screen-contract.test.mjs src/components/post-screen-contract.test.mjs scripts/verify-home-build.mjs scripts/verify-post-build.mjs scripts/verify-style-build.mjs
git commit -m "test: align build contracts with rewritten posts"
```

---

### Task 5: Production build와 브라우저 수용 검증

**Files:**
- Verify: `content/posts/why-github-pages-and-gatsby/index.mdx`
- Verify: `content/posts/gatsby-mdx-graphql-post-system/index.mdx`
- Verify: `content/posts/custom-developer-blog-with-tailwind-css/index.mdx`
- Verify: `public/index.html`, `public/posts/*/index.html`, `public/sitemap-0.xml`

**Interfaces:**
- Consumes: Tasks 1-4의 콘텐츠와 검증 계약
- Produces: 새 세 URL과 메타데이터가 production build·Chromium·WebKit에서 수용 가능하다는 완료 근거

- [ ] **Step 1: 소스 전체와 타입 기준선을 다시 확인한다**

```bash
npm test
npm run typecheck
git diff --check
```

Expected: `78` tests PASS, TypeScript error 0, diff whitespace error 0.

- [ ] **Step 2: 삭제 없는 일반 production build를 먼저 실행한다**

```bash
npm run build
```

Expected: Gatsby production build exit 0.

- [ ] **Step 3: 정적 산출물 검증기를 실행한다**

```bash
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected:

- styles: 새 1편 경로와 로컬 woff2 자산 확인
- layout: 공통 Header·Footer·favicon 계약 통과
- home: 새 세 카드가 `2026-06-27 → 2026-05-16 → 2026-04-18` 순서이며 필터 태그가 첫 등장 순서와 일치
- post: 새 세 상세 경로, TOC, 이전·다음 글, canonical, article metadata, sitemap 통과
- post: 기존 세 경로와 과거 샘플 두 경로가 생성되지 않음

- [ ] **Step 4: 이전 generated route가 남으면 clean build 승인을 받는다**

일반 build 뒤 검증기가 기존 route 잔존 또는 이전 asset 참조로 실패한 경우에만 사용자에게 다음 한 줄로 확인받는다.

```text
Gatsby 생성물 .cache/와 public/에 이전 포스트 경로가 남아 있어 두 디렉터리를 삭제한 뒤 전체 빌드로 다시 생성하겠습니다.
```

승인 후에만 실행한다.

```bash
npm run clean
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected: 모든 verifier exit 0. 승인 전에는 `npm run clean`을 실행하지 않는다.

- [ ] **Step 5: 정적 서버를 열어 데스크톱과 모바일을 확인한다**

```bash
npm run serve
```

Playwright로 다음 경로를 Chromium 1440×1000, Chromium 390×844, WebKit 390×844에서 확인한다.

```text
/
/posts/why-github-pages-and-gatsby/
/posts/gatsby-mdx-graphql-post-system/
/posts/custom-developer-blog-with-tailwind-css/
```

각 화면에서 다음을 확인한다.

- 페이지 가로 overflow가 없다.
- 홈 제목·설명·태그·날짜와 `3 posts`가 정확하다.
- 모바일 홈 카드의 긴 한글 제목이 가용 폭을 사용해 자연스럽게 줄바꿈한다.
- 포스트 H1, description, H2, 코드 블록이 잘리거나 겹치지 않는다.
- 데스크톱 TOC가 H2 순서와 일치한다.
- 이전·다음 글 링크가 발행일 순서와 일치한다.
- WebKit 본문 문단이 가용 폭을 사용하고 오른쪽에 비정상적인 빈 공간이 생기지 않는다.
- console error·warning이 0건이고 모든 page-data 요청이 200이다.

- [ ] **Step 6: 구현 결과를 기술 기록에 남긴다**

basic-memory의 `notes/developer-blog-web Gatsby 재구축 기술 기록`에 다음 근거를 append한다.

```text
- 핵심 3편을 선택 근거·초보자 재현·실제 구현 이력 중심으로 전면 재작성했다.
- 새 slug 3개와 유지한 publishedAt 3개를 기록한다.
- 기존 URL 3개는 리다이렉트 없이 제거됐음을 기록한다.
- 테스트 수, typecheck, build, verifier, Chromium·WebKit 뷰포트 결과를 기록한다.
- 후속 글은 읽기 경험 개선과 Safari 줄바꿈 디버깅 사례임을 연결한다.
```

- [ ] **Step 7: 최종 상태를 확인한다**

```bash
git status --short
git log --oneline --decorate -5
```

Expected: 포스트·테스트·검증기 변경은 Tasks 1-4의 커밋에 모두 포함되고, 계획과 인터랙티브 문서 외 예상하지 못한 파일이 없다.

---

## Acceptance Criteria

- [ ] 핵심 3편이 새 제목, 새 slug, 승인된 description·tags로 생성된다.
- [ ] 핵심 3편의 publishedAt은 `2026-04-18`, `2026-05-16`, `2026-06-27`을 유지한다.
- [ ] 홈은 새 세 글을 발행일 역순으로 표시하고 태그 필터가 새 태그 집합을 사용한다.
- [ ] 각 포스트의 화면 제목, 설명, 날짜, 태그, SEO metadata가 frontmatter와 일치한다.
- [ ] TOC는 각 글의 승인된 H2 outline과 정확히 일치한다.
- [ ] 이전·다음 글은 발행일 오름차순 관계로 연결된다.
- [ ] canonical과 sitemap은 새 세 URL만 사용한다.
- [ ] 기존 세 URL과 과거 샘플 두 URL은 생성되지 않고 리다이렉트도 없다.
- [ ] 제목에 `1편`, `2편`, `3편` 표기가 없다.
- [ ] 코드 조각은 현재 저장소 구현과 일치하고 전체 파일을 복제하지 않는다.
- [ ] 독자가 GitHub Pages·Gatsby 선택 근거, MDX·GraphQL 흐름, Tailwind 사용자화 지점을 이해할 수 있다.
- [ ] `npm test`, `npm run typecheck`, production build, verifier 4종이 통과한다.
- [ ] Chromium·WebKit의 지정 뷰포트에서 overflow·console 오류 없이 표시된다.

## Out of Scope and Risks

### 범위 밖

- 후속 4편 `gatsby-blog-reading-experience` 작성·발행
- 후속 5편 `gatsby-safari-text-wrap-debugging` 작성·발행
- 기존 URL 리다이렉트
- Google Analytics 4와 Search Console
- robots.txt, JSON-LD 등 추가 SEO 기능
- About·프로필 페이지
- UI 컴포넌트, CSS, 의존성 변경
- 이미지 파일 삭제

### 리스크와 대응

- **기존 URL 제거:** 외부 링크가 있다면 404가 된다. 사용자가 리다이렉트하지 않기로 결정했으므로 verifier에서 부재를 의도적으로 고정한다.
- **Gatsby 증분 산출물:** 일반 build가 폐기 경로를 남길 수 있다. 먼저 삭제 없는 build를 시도하고 실패할 때만 승인 후 clean build한다.
- **콘텐츠와 코드 불일치:** 글 작성 직전에 `package.json`, Gatsby 설정, 실제 CSS, workflow를 다시 읽고 source contract로 핵심 표현을 고정한다.
- **글 과밀화:** 각 글은 승인된 주제 하나에 집중하고 목차·코드 복사·Safari 문제는 후속 글로 넘긴다.
- **새 태그 증가:** 홈 필터가 10개 태그를 표시한다. 기존 wrap 동작과 모바일 헤더를 브라우저 수용 검증에서 확인하되 UI 재설계는 이번 범위에 넣지 않는다.

## Baseline Evidence

- `npm test`: `78` tests, `78` pass, `0` fail
- `npm run typecheck`: error 0
- 기준 브랜치: `origin/develop@e38470c`
- 설계 커밋: `d84a762`
