# Developer Blog Home Tag Filter and Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 목록에 실제 MDX 태그 기반 단일 선택 필터와 동적 게시글 수를 추가하고, GitHub 프로필 이미지를 모든 페이지의 로컬 favicon으로 제공한다.

**Architecture:** 기존 `IndexPage`의 GraphQL 조회와 발행일 정렬은 유지한다. 태그 추출·필터링은 React와 분리한 순수 모듈이 담당하고, `PostList`는 선택 상태와 표시 목록을 조립하며, `PostFilterBar`는 버튼과 결과 수만 표현한다. favicon 원본은 `static/favicon.png`로 복사하고 공통 `Seo`에서 참조하며, 404도 같은 Head 경계를 사용한다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, Node.js 24.14.1 built-in test runner, CSS, GitHub Pages

## Global Constraints

- 구현 기준은 `docs/superpowers/specs/2026-07-19-home-tag-filter-favicon-design.md`다.
- 일반 브랜치 `feature/home-tag-filter-favicon`에서 진행하며 worktree는 만들지 않는다.
- 홈 GraphQL 쿼리, 발행일 내림차순, `PostCard`, 카드 내부 정보용 태그는 변경하지 않는다.
- 태그는 한 번에 하나만 선택한다. 기본값은 `전체`이며 URL·history·localStorage에 상태를 저장하지 않는다.
- 태그는 최신 글부터 처음 등장한 순서를 유지하고, 중복과 공백 태그만 제외하며 문자열을 정확히 비교한다.
- `전체`는 데이터 태그와 충돌하지 않는 내부 sentinel로 표현한다.
- 결과 수는 `1 post`, 그 외에는 `N posts`다. 게시글이 0개면 `0 posts`와 기존 빈 상태를 함께 표시한다.
- 태그가 없으면 버튼 그룹은 숨기되 결과 수와 목록 또는 빈 상태는 유지한다.
- 정적 HTML의 초기 상태에는 모든 게시글, 모든 태그 버튼, 전체 게시글 수가 있어야 한다.
- GitHub avatar는 런타임에 hotlink하지 않는다. 보관 원본을 수정하지 않고 `static/favicon.png`로 복사한다.
- 신규 런타임·개발 의존성을 추가하지 않는다.
- 검색, 다중 태그, URL 쿼리, 태그 페이지, 페이지네이션, 관련 글, 카드 태그 클릭, Apple touch icon, manifest, PWA, 공유 이미지는 범위 밖이다.
- `.playwright-cli/` 등 기존 사용자 파일은 수정·삭제·커밋하지 않는다.
- `npm run clean`은 `.cache/`와 `public/`을 삭제하므로 실행 직전에 정확한 경로를 한 줄로 알리고 종성님의 승인을 다시 받는다.
- Redmine/GitHub 이슈 생성·상태 변경, push, PR 생성, 병합은 외부 변경이므로 각각 실행 전에 이 스레드에서 알리고 승인을 받는다.

## File Structure

- Create `src/lib/post-filter.mjs`: 고유 태그 추출, 전체 sentinel, 정확 일치 필터를 제공한다.
- Create `src/lib/post-filter.test.mjs`: 태그 순서·중복·공백·전체·정확 일치·잘못된 선택을 단위 검증한다.
- Create `src/components/post-filter-bar.tsx`: 태그 버튼과 동적 결과 수를 접근 가능하게 표현한다.
- Modify `src/components/post-list.tsx`: 선택 상태, 안전한 선택값, 필터 결과와 빈 상태를 조립한다.
- Modify `src/components/home-screen-contract.test.mjs`: 새 UI·React 경계·반응형 CSS 계약을 검증한다.
- Modify `src/styles/home.css`: PC 2열·모바일 1열 toolbar, 줄바꿈, 활성·focus 상태를 추가한다.
- Create `src/components/seo-contract.test.mjs`: favicon Head 경계와 배포 파일 체크섬을 검증한다.
- Modify `src/components/seo.tsx`: 로컬 favicon link를 모든 공통 Head에 렌더링한다.
- Modify `src/pages/404.tsx`: 404 Head도 공통 `Seo`를 사용해 favicon 범위에서 빠지지 않게 한다.
- Create `static/favicon.png`: Luna에 보관된 128×128 GitHub 프로필 이미지의 변경 없는 배포 복사본이다.
- Modify `scripts/verify-home-build.mjs`: 실제 태그·초기 선택·전체 수·전체 카드 정적 HTML 계약을 검증한다.
- Modify `scripts/verify-layout-build.mjs`: 홈·대표 글·404 favicon link와 배포 파일 체크섬을 검증한다.
- Modify `scripts/verify-post-build.mjs`: 세 게시글 모두에서 favicon link가 한 번 존재하는지 검증한다.
- Add `docs/superpowers/plans/2026-07-19-home-tag-filter-favicon.md`: 이 실행 계획을 보존한다.

---

### Task 1: Pure Post Tag Collection and Filtering

**Files:**
- Create: `src/lib/post-filter.test.mjs`
- Create: `src/lib/post-filter.mjs`

**Interfaces:**
- Produces: `ALL_POSTS_FILTER`, `collectPostTags(posts)`, `filterPostsByTag(posts, selectedTag)`
- Invariant: 입력 게시글과 태그 순서를 변경하지 않으며, 존재하지 않는 선택값은 전체 목록으로 복귀한다.

- [ ] **Step 1: Write the failing pure-function tests**

Create `src/lib/post-filter.test.mjs`:

```js
import assert from "node:assert/strict"
import { test } from "node:test"

import {
  ALL_POSTS_FILTER,
  collectPostTags,
  filterPostsByTag,
} from "./post-filter.mjs"

const posts = [
  { id: "new", tags: ["Gatsby", "GraphQL", "", "   "] },
  { id: "middle", tags: ["Gatsby", "MDX", "GraphQL"] },
  { id: "old", tags: ["React", "MDX"] },
]

test("collects unique non-blank tags in first appearance order", () => {
  assert.deepEqual(collectPostTags(posts), [
    "Gatsby",
    "GraphQL",
    "MDX",
    "React",
  ])
})

test("keeps every post in source order for the all filter", () => {
  assert.deepEqual(
    filterPostsByTag(posts, ALL_POSTS_FILTER).map(post => post.id),
    ["new", "middle", "old"],
  )
})

test("matches one tag exactly without reordering posts", () => {
  assert.deepEqual(
    filterPostsByTag(posts, "GraphQL").map(post => post.id),
    ["new", "middle"],
  )
  assert.deepEqual(filterPostsByTag(posts, "graphql"), posts)
})

test("falls back to all posts when the selected tag no longer exists", () => {
  assert.deepEqual(filterPostsByTag(posts, "Missing"), posts)
})
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --test src/lib/post-filter.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` because `post-filter.mjs` does not exist.

- [ ] **Step 3: Implement the minimum pure module**

Create `src/lib/post-filter.mjs`:

```js
/** @typedef {Readonly<{ tags: readonly string[] }>} TaggedPost */

export const ALL_POSTS_FILTER = "__all_posts__"

/**
 * @param {readonly TaggedPost[]} posts
 * @returns {string[]}
 */
export const collectPostTags = posts => {
  const seen = new Set()
  const tags = []

  for (const post of posts) {
    for (const tag of post.tags) {
      if (tag.trim().length === 0 || seen.has(tag)) {
        continue
      }

      seen.add(tag)
      tags.push(tag)
    }
  }

  return tags
}

/**
 * @template {TaggedPost} T
 * @param {readonly T[]} posts
 * @param {string} selectedTag
 * @returns {T[]}
 */
export const filterPostsByTag = (posts, selectedTag) => {
  if (
    selectedTag === ALL_POSTS_FILTER ||
    !collectPostTags(posts).includes(selectedTag)
  ) {
    return [...posts]
  }

  return posts.filter(post => post.tags.includes(selectedTag))
}
```

- [ ] **Step 4: Run focused tests and type-check**

Run:

```bash
node --test src/lib/post-filter.test.mjs
npm run typecheck
```

Expected: four tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit the pure filtering boundary**

```bash
git add src/lib/post-filter.mjs src/lib/post-filter.test.mjs
git commit -m "feat: add home post tag filtering logic"
```

### Task 2: Accessible Interactive Filter Toolbar

**Files:**
- Create: `src/components/post-filter-bar.tsx`
- Modify: `src/components/post-list.tsx`
- Modify: `src/components/home-screen-contract.test.mjs`

**Interfaces:**
- `PostFilterBar`: `{ tags, selectedTag, resultCount, onSelect }`
- `PostList`: owns `selectedTag`, derives tags and visible posts, preserves `ol > li > PostCard`.
- Accessibility: `aria-label="글 필터"`, group label, native buttons, `aria-pressed`, polite status.

- [ ] **Step 1: Replace the obsolete no-button contract with failing filter contracts**

In `src/components/home-screen-contract.test.mjs`:

1. Keep the `PostCard` no-button assertion.
2. Replace `PostList`'s `assert.doesNotMatch(postList, /<button\b/)` with assertions for the filter imports, state, derived visible posts and `PostFilterBar` props.
3. Add this focused contract:

```js
test("renders an accessible single-select tag filter and result count", async () => {
  const filterBar = await readRepositoryFile(
    "src/components/post-filter-bar.tsx",
  )

  assert.match(filterBar, /aria-label="글 필터"/)
  assert.match(filterBar, /role="group" aria-label="태그 필터"/)
  assert.match(filterBar, /<button/)
  assert.match(filterBar, /type="button"/)
  assert.match(filterBar, /aria-pressed=\{isSelected\}/)
  assert.match(filterBar, /onClick=\{\(\) => onSelect\(tag\)\}/)
  assert.match(filterBar, /role="status"/)
  assert.match(filterBar, /aria-live="polite"/)
  assert.match(filterBar, /count === 1 \? "post" : "posts"/)
})
```

Add `src/components/post-filter-bar.tsx` to the React SSR import list.

- [ ] **Step 2: Run the component contract and confirm RED**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
```

Expected: FAIL because the filter component and state boundary do not exist.

- [ ] **Step 3: Implement the presentation-only filter bar**

Create `src/components/post-filter-bar.tsx`:

```tsx
import * as React from "react"

import { ALL_POSTS_FILTER } from "../lib/post-filter.mjs"

type PostFilterBarProps = Readonly<{
  tags: readonly string[]
  selectedTag: string
  resultCount: number
  onSelect: (tag: string) => void
}>

const formatPostCount = (count: number) =>
  `${count} ${count === 1 ? "post" : "posts"}`

const PostFilterBar = ({
  tags,
  selectedTag,
  resultCount,
  onSelect,
}: PostFilterBarProps) => {
  const options = [ALL_POSTS_FILTER, ...tags]

  return (
    <section className="post-filter-toolbar" aria-label="글 필터">
      {tags.length > 0 ? (
        <div className="post-filter-options" role="group" aria-label="태그 필터">
          {options.map(tag => {
            const isSelected = selectedTag === tag
            const isAll = tag === ALL_POSTS_FILTER

            return (
              <button
                key={tag}
                className={`post-filter-button${isSelected ? " is-active" : ""}`}
                type="button"
                data-filter-kind={isAll ? "all" : "tag"}
                aria-pressed={isSelected}
                onClick={() => onSelect(tag)}
              >
                {isAll ? "전체" : tag}
              </button>
            )
          })}
        </div>
      ) : null}
      <p className="post-filter-count" role="status" aria-live="polite">
        {formatPostCount(resultCount)}
      </p>
    </section>
  )
}

export default PostFilterBar
```

- [ ] **Step 4: Give `PostList` state and derived data ownership**

Update `src/components/post-list.tsx` so its core is:

```tsx
import PostFilterBar from "./post-filter-bar"
import {
  ALL_POSTS_FILTER,
  collectPostTags,
  filterPostsByTag,
} from "../lib/post-filter.mjs"

const PostList = ({ posts }: PostListProps) => {
  const [selectedTag, setSelectedTag] = React.useState(ALL_POSTS_FILTER)
  const tags = React.useMemo(() => collectPostTags(posts), [posts])
  const activeTag =
    selectedTag === ALL_POSTS_FILTER || tags.includes(selectedTag)
      ? selectedTag
      : ALL_POSTS_FILTER
  const visiblePosts = React.useMemo(
    () => filterPostsByTag(posts, activeTag),
    [posts, activeTag],
  )

  return (
    <section className="home-posts" aria-labelledby="home-posts-title">
      <h2 id="home-posts-title" className="sr-only">
        게시글 목록
      </h2>
      <PostFilterBar
        tags={tags}
        selectedTag={activeTag}
        resultCount={visiblePosts.length}
        onSelect={setSelectedTag}
      />
      {visiblePosts.length === 0 ? (
        <p className="post-list-empty">
          {posts.length === 0
            ? "아직 게시글이 없습니다."
            : "선택한 태그에 해당하는 글이 없습니다."}
        </p>
      ) : (
        <ol className="post-list">
          {visiblePosts.map(post => (
            <li key={post.id} className="post-list-item">
              <PostCard post={post} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
```

- [ ] **Step 5: Run focused, pure and full source checks**

Run:

```bash
node --test src/lib/post-filter.test.mjs src/components/home-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: all source tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit the interactive component boundary**

```bash
git add src/components/post-filter-bar.tsx src/components/post-list.tsx src/components/home-screen-contract.test.mjs
git commit -m "feat: add interactive home tag filter"
```

### Task 3: Responsive Toolbar and Active-State Styling

**Files:**
- Modify: `src/components/home-screen-contract.test.mjs`
- Modify: `src/styles/home.css`

**Interfaces:**
- PC: `minmax(0, 1fr) auto`, left wrapping tags, right result count.
- Mobile `<=720px`: one column, wrapped tags, count below and right aligned.
- Active: foreground, 600 weight, accent underline; focus: visible outline.

- [ ] **Step 1: Add failing CSS contracts**

Extend the existing home CSS contract with:

```js
assert.match(
  homeCss,
  /\.post-filter-toolbar\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/s,
)
assert.match(homeCss, /\.post-filter-options\s*\{[^}]*flex-wrap: wrap/s)
assert.match(
  homeCss,
  /\.post-filter-button\.is-active\s*\{[^}]*text-decoration: underline/s,
)
assert.match(homeCss, /\.post-filter-button:focus-visible\s*\{/)
assert.match(
  homeCss,
  /@media \(max-width: 720px\)[\s\S]*\.post-filter-toolbar\s*\{[^}]*grid-template-columns: 1fr/s,
)
assert.match(
  homeCss,
  /@media \(max-width: 720px\)[\s\S]*\.post-filter-count\s*\{[^}]*justify-self: end/s,
)
```

- [ ] **Step 2: Run the home contract and confirm RED**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
```

Expected: FAIL on the new toolbar selectors.

- [ ] **Step 3: Add the approved toolbar styles**

Inside `@layer components` in `src/styles/home.css`, before `.post-list`, add:

```css
.post-filter-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.post-filter-options {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.post-filter-button {
  padding: 0 0 2px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.55;
  text-underline-offset: 4px;
}

.post-filter-button[data-filter-kind="tag"]::before {
  margin-right: var(--space-1);
  color: var(--accent);
  content: "#";
}

.post-filter-button:hover {
  color: var(--fg);
}

.post-filter-button:focus-visible {
  border-radius: 2px;
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.post-filter-button.is-active {
  color: var(--fg);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 2px;
}

.post-filter-count {
  grid-column: 2;
  margin: 0;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
```

Inside the existing `@media (max-width: 720px)` add:

```css
.post-filter-toolbar {
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.post-filter-count {
  grid-column: 1;
  justify-self: end;
}
```

- [ ] **Step 4: Run focused and full source checks**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
npm test
npm run typecheck
```

Expected: CSS contracts, full source suite and type-check pass.

- [ ] **Step 5: Commit the responsive presentation layer**

```bash
git add src/components/home-screen-contract.test.mjs src/styles/home.css
git commit -m "style: add responsive home filter toolbar"
```

### Task 4: Local GitHub Profile Favicon on Every Page

**Files:**
- Create: `src/components/seo-contract.test.mjs`
- Modify: `src/components/seo.tsx`
- Modify: `src/pages/404.tsx`
- Create: `static/favicon.png`

**Interfaces:**
- Asset source: `/Users/kjs/workspace/luna/archive/developer-blog/assets/github-macho199-avatar-2026-07-19.png`
- Asset destination: `static/favicon.png`
- Expected SHA-256: `e9d4b8b644138993aaf0d6c9904613a3ae820881bed5d03d07eb1032e549693b`
- Head contract: exactly one local `<link id="favicon" rel="icon" type="image/png" sizes="128x128" href="/favicon.png" />`.

- [ ] **Step 1: Write the failing source and asset contract**

Create `src/components/seo-contract.test.mjs`:

```js
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

test("uses one local profile favicon from every page Head", async () => {
  const [seo, notFound, favicon] = await Promise.all([
    readFile(new URL("src/components/seo.tsx", repositoryRoot), "utf8"),
    readFile(new URL("src/pages/404.tsx", repositoryRoot), "utf8"),
    readFile(new URL("static/favicon.png", repositoryRoot)),
  ])

  assert.match(
    seo,
    /<link id="favicon" rel="icon" type="image\/png" sizes="128x128" href="\/favicon\.png" \/>/,
  )
  assert.doesNotMatch(seo, /avatars\.githubusercontent\.com/)
  assert.match(notFound, /import Seo from "\.\.\/components\/seo"/)
  assert.match(notFound, /<Seo title="Not Found" pathname=\{location\.pathname\} \/>/)
  assert.equal(
    createHash("sha256").update(favicon).digest("hex"),
    "e9d4b8b644138993aaf0d6c9904613a3ae820881bed5d03d07eb1032e549693b",
  )
})
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --test src/components/seo-contract.test.mjs
```

Expected: FAIL because `static/favicon.png` and the Head link do not exist.

- [ ] **Step 3: Copy the archived asset without modifying it**

Run:

```bash
cp /Users/kjs/workspace/luna/archive/developer-blog/assets/github-macho199-avatar-2026-07-19.png static/favicon.png
shasum -a 256 static/favicon.png
```

Expected checksum:

```text
e9d4b8b644138993aaf0d6c9904613a3ae820881bed5d03d07eb1032e549693b
```

- [ ] **Step 4: Add the local favicon to common SEO**

In `src/components/seo.tsx`, immediately after the canonical link, add:

```tsx
<link
  id="favicon"
  rel="icon"
  type="image/png"
  sizes="128x128"
  href="/favicon.png"
/>
```

- [ ] **Step 5: Route the 404 Head through the same SEO boundary**

Update `src/pages/404.tsx` imports and Head:

```tsx
import Seo from "../components/seo"

export const Head: HeadFC = ({ location }) => (
  <Seo title="Not Found" pathname={location.pathname} />
)
```

The visible 404 body stays unchanged, and the browser title remains `Not Found | Developer Blog`.

- [ ] **Step 6: Run favicon, source and type checks**

Run:

```bash
node --test src/components/seo-contract.test.mjs
npm test
npm run typecheck
```

Expected: checksum and Head contracts pass, the full source suite passes, and TypeScript exits 0.

- [ ] **Step 7: Commit the local favicon boundary**

```bash
git add static/favicon.png src/components/seo.tsx src/components/seo-contract.test.mjs src/pages/404.tsx
git commit -m "feat: add local profile favicon"
```

### Task 5: Production HTML and Asset Verification

**Files:**
- Modify: `scripts/verify-home-build.mjs`
- Modify: `scripts/verify-layout-build.mjs`
- Modify: `scripts/verify-post-build.mjs`
- Modify: `src/components/home-screen-contract.test.mjs`

**Interfaces:**
- Initial unique tags: `Gatsby`, `GraphQL`, `MDX`, `SEO`, `Validation`, `GitHub Pages`, `React`, `Tailwind CSS`.
- Initial selected control: `전체` only.
- Initial result count: `3 posts`.
- Initial static cards: all three, newest first.
- Favicon: all known generated pages link once to `/favicon.png`; copied file checksum is exact.

- [ ] **Step 1: Change source contracts to require the new production checks**

In `src/components/home-screen-contract.test.mjs`, update the verifier registration test to require strings or parsers for:

```text
post-filter-toolbar
post-filter-button
aria-pressed
3 posts
Gatsby
Tailwind CSS
/favicon.png
```

- [ ] **Step 2: Replace obsolete home build exclusions with exact initial-state checks**

In `scripts/verify-home-build.mjs`:

1. Delete `home: no inactive controls`, the filter-class exclusion and the post-count exclusion.
2. Add `expectedFilterTags`:

```js
const expectedFilterTags = [
  "Gatsby",
  "GraphQL",
  "MDX",
  "SEO",
  "Validation",
  "GitHub Pages",
  "React",
  "Tailwind CSS",
]
```

3. Parse `.post-filter-button` elements in source order and assert:
   - labels equal `["전체", ...expectedFilterTags]`;
   - `전체` has `aria-pressed="true"`;
   - every real tag has `aria-pressed="false"`;
   - exactly one `role="group" aria-label="태그 필터"` exists;
   - the status region contains exactly `3 posts`;
   - all existing card and newest-first assertions still pass.

- [ ] **Step 3: Add shared favicon build checks**

In `scripts/verify-layout-build.mjs`:

1. Import `createHash` from `node:crypto`.
2. For home and representative post HTML, assert exactly one local favicon link.
3. Read `public/404.html` separately and assert the same link.
4. Read `public/favicon.png` and assert SHA-256 `e9d4...693b`.

Use this reusable matcher:

```js
const assertLocalFavicon = (html, name) => {
  const links = html.match(
    /<link\b(?=[^>]*rel="icon")(?=[^>]*href="\/favicon\.png")[^>]*>/g,
  ) ?? []
  assert.equal(links.length, 1, `${name}: one local favicon link`)
  assert.doesNotMatch(html, /avatars\.githubusercontent\.com/)
}
```

In `scripts/verify-post-build.mjs`, call the same logical assertion for each of the three generated post HTML documents so no article Head can regress independently.

- [ ] **Step 4: Confirm verifiers are RED against the stale build**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
npm run verify:home
npm run verify:layout
npm run verify:post
```

Expected: the source contract passes after verifier edits, while one or more production verifiers fail against the pre-feature `public/` output.

- [ ] **Step 5: Commit production verifier changes before rebuilding**

```bash
git add src/components/home-screen-contract.test.mjs scripts/verify-home-build.mjs scripts/verify-layout-build.mjs scripts/verify-post-build.mjs
git commit -m "test: verify home filters and favicon build"
```

- [ ] **Step 6: Ask before deleting generated build directories**

Post exactly one line in this thread:

```text
프로덕션 재검증을 위해 developer-blog의 .cache/와 public/을 `npm run clean`으로 삭제한 뒤 다시 빌드할게요. 진행해도 될까요?
```

Do not run the next step until approval is received.

- [ ] **Step 7: Run the clean production gate after approval**

Run:

```bash
npm run clean
npm test
npm run typecheck
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected: every command exits 0. The build has three initial post cards, nine filter buttons including `전체`, `3 posts`, and an exact local favicon asset.

### Task 6: Browser Acceptance and Local Handoff

**Files:**
- Verify only unless a defect requires a new RED test and fix.

- [ ] **Step 1: Read the Playwright CLI skill and start production preview**

Run the repository's existing `npm run serve` flow on an unused local port. Do not add generated browser artifacts to Git.

- [ ] **Step 2: Verify 1440px default layout and progressive enhancement**

Check:

- filter tags are on the left and `3 posts` is on the upper right;
- all eight real tags wrap only when needed;
- all three cards remain in published-date order;
- disabling JavaScript or reading server HTML still exposes all three cards and the total count;
- no horizontal page overflow exists.

- [ ] **Step 3: Verify interaction, count and accessibility**

Check:

- `GraphQL` leaves posts 3 and 2 and changes the status to `2 posts`;
- `SEO` leaves only post 3 and changes the status to `1 post`;
- `전체` restores all three in their original order and `3 posts`;
- exactly one filter has `aria-pressed="true"` after every selection;
- Tab focus is visible and Enter/Space activates a focused button;
- the URL and browser history do not change.

- [ ] **Step 4: Verify 720px and 390px responsive boundaries**

Check:

- toolbar becomes one column;
- tags wrap naturally with no `더보기` control;
- result count appears below the tags and aligns right;
- cards, toolbar and page have no horizontal overflow.

- [ ] **Step 5: Verify favicon delivery without trusting browser cache**

Check:

- home, 404 and a representative post each contain one `/favicon.png` link;
- `GET /favicon.png` returns HTTP 200 and `image/png`;
- no request is sent to `avatars.githubusercontent.com`;
- console has no errors.

- [ ] **Step 6: Run the final repository gate**

Run:

```bash
npm test
npm run typecheck
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
git diff --check
git status --short --branch
```

Expected: all checks exit 0 and only intentional plan/feature changes are present. Do not push or create a PR without a new explicit instruction.

- [ ] **Step 7: Reconcile durable notes and hand off locally**

Record only verified durable facts in the existing developer-blog technical note, update issue references only after approved external writes, then report commits, automated checks, browser evidence and any remaining risks.

## Acceptance Criteria

- 홈에는 `전체`와 실제 고유 태그 8개가 최신 글의 최초 등장 순서로 보인다.
- 기본 정적 HTML에는 세 게시글과 `3 posts`가 있고 JavaScript가 없어도 읽을 수 있다.
- 단일 태그 선택 시 정확히 일치하는 글만 남고 `1 post`/`N posts`와 `aria-pressed`가 함께 바뀐다.
- PC는 필터 왼쪽·개수 오른쪽, 720px 이하에서는 필터 위·개수 아래 오른쪽이며 390px에 가로 넘침이 없다.
- 카드 태그, URL, 게시글 순서, 기존 홈·포스트 외형은 바뀌지 않는다.
- 홈·404·세 게시글 Head에 로컬 `/favicon.png` 링크가 정확히 하나씩 있다.
- `public/favicon.png`는 GitHub 프로필 원본과 체크섬이 같고 원격 avatar 요청이 없다.
- source tests, typecheck, production build, verifier 4종, 1440px·720px·390px 브라우저 확인이 모두 통과한다.
- 신규 패키지, 검색, 다중 선택, 태그 페이지, 페이지네이션, PWA 자산은 추가되지 않는다.

## Risks and Deferred Work

- favicon은 브라우저 캐시가 강하므로 탭 아이콘의 육안 변화만으로 완료 처리하지 않는다. HTML link, 파일 체크섬, HTTP 응답을 함께 확인한다.
- 새 게시글 추가로 고유 태그 수가 늘면 toolbar 높이가 달라질 수 있다. 이번 범위에서는 모든 태그 줄바꿈으로 대응하고 접기 기능은 미룬다.
- 태그 선택값이 실제 목록에서 사라지는 동적 prop 변경은 Gatsby 홈에서 일반적으로 발생하지 않지만, 순수 함수와 `activeTag` fallback으로 전체 목록을 유지한다.
- 향후 공유 가능한 필터가 필요해지면 URL 쿼리 설계를 별도 이슈로 다룬다. 이번에는 reload 시 `전체`로 초기화한다.
