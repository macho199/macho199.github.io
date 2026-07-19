# Mobile Tag Filter Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 홈에서 `태그 필터`와 동적 게시글 수를 같은 헤더 행에 묶고, 모든 태그를 그 아래 전체 폭에 표시한다.

**Architecture:** `PostList`와 순수 필터 모듈은 변경하지 않고 표현 경계인 `PostFilterBar`에 가시 라벨 하나를 추가한다. PC grid는 유지하고 720px 이하에서만 라벨·결과 수를 첫 행, 태그 그룹을 둘째 행에 배치한다. 컴포넌트/CSS 계약, 프로덕션 HTML, Chromium·WebKit 좌표 검증을 순서대로 통과시킨다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, CSS Grid, Node.js built-in test runner, Playwright CLI

## Global Constraints

- 구현 기준은 `docs/superpowers/specs/2026-07-19-mobile-tag-filter-header-design.md`다.
- Redmine #29와 GitHub #35가 이 구현 단위를 추적한다.
- 구현 브랜치는 `fix/35-mobile-tag-filter-header`다. 별도 worktree를 만들지 않는다.
- PC 721px 이상은 기존 태그 왼쪽·게시글 수 오른쪽 배치와 16px 열 간격·20px 하단 여백을 유지한다.
- 모바일 720px 이하는 헤더→태그 8px, 태그→게시글 목록 12px를 사용한다.
- 모든 태그를 숨김·가로 스크롤·더보기 없이 자연스럽게 개행한다.
- 기존 단일 선택, `aria-pressed`, `role="status"`, `aria-live="polite"`, 결과 복수형 규칙을 유지한다.
- 태그가 없으면 가시 라벨과 버튼 그룹을 렌더링하지 않고 현재 전체 결과 수만 오른쪽에 표시한다.
- URL·history·localStorage·필터 데이터 로직·신규 런타임 패키지는 변경하지 않는다.

---

## File Map

- `src/components/post-filter-bar.tsx`: 태그가 있을 때만 모바일용 가시 라벨을 렌더링한다.
- `src/styles/home.css`: PC 규칙을 보존하고 720px 이하의 2열·2행 grid와 정확한 간격을 정의한다.
- `src/components/home-screen-contract.test.mjs`: 라벨 마크업과 PC·모바일 CSS 계약을 TDD로 고정한다.
- `scripts/verify-home-build.mjs`: Gatsby가 생성한 홈 HTML에 라벨·기존 필터·결과 수가 함께 존재하는지 검증한다.

### Task 1: 모바일 태그 헤더 마크업과 CSS

**Files:**
- Modify: `src/components/home-screen-contract.test.mjs:78-166`
- Modify: `src/components/post-filter-bar.tsx:23-49`
- Modify: `src/styles/home.css:22-80,187-201`

**Interfaces:**
- Consumes: `PostFilterBarProps { tags, selectedTag, resultCount, onSelect }`와 기존 `.post-filter-toolbar`, `.post-filter-options`, `.post-filter-count` 클래스
- Produces: 조건부 `.post-filter-label`과 720px 이하의 첫 행 라벨·결과 수, 둘째 행 전체 폭 태그 그룹

- [ ] **Step 1: 모바일 헤더 계약의 실패 테스트 작성**

`src/components/home-screen-contract.test.mjs`에 다음 테스트를 추가한다.

```js
test("groups mobile tags under a compact result header", async () => {
  const [filterBar, homeCss] = await Promise.all([
    readRepositoryFile("src/components/post-filter-bar.tsx"),
    readRepositoryFile("src/styles/home.css"),
  ])

  assert.match(
    filterBar,
    /{tags\.length > 0 \? \([\s\S]*<span className="post-filter-label" aria-hidden="true">[\s\S]*태그 필터[\s\S]*<\/span>[\s\S]*<div className="post-filter-options"/,
  )
  assert.match(homeCss, /\.post-filter-label\s*\{[^}]*display:\s*none/s)
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-toolbar\s*\{(?=[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto)(?=[^}]*column-gap:\s*var\(--space-3\))(?=[^}]*row-gap:\s*var\(--space-2\))(?=[^}]*margin-bottom:\s*var\(--space-3\))[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-label\s*\{(?=[^}]*display:\s*block)(?=[^}]*grid-column:\s*1)(?=[^}]*grid-row:\s*1)[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-options\s*\{(?=[^}]*grid-column:\s*1\s*\/\s*-1)(?=[^}]*grid-row:\s*2)[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-count\s*\{(?=[^}]*grid-column:\s*2)(?=[^}]*grid-row:\s*1)(?=[^}]*justify-self:\s*end)[^}]*\}/s,
  )
  assert.match(
    homeCss,
    /@media \(max-width: 720px\)[\s\S]*\.post-filter-count:only-child\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  )
})
```

- [ ] **Step 2: 테스트가 새 계약 부재로 실패하는지 확인**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
```

Expected: `groups mobile tags under a compact result header`가 `.post-filter-label` 또는 새 모바일 grid 계약을 찾지 못해 FAIL한다. 기존 테스트는 PASS한다.

- [ ] **Step 3: 태그가 있을 때만 가시 라벨 렌더링**

`src/components/post-filter-bar.tsx`의 조건부 태그 영역을 다음 구조로 바꾼다. 기존 버튼 map은 그대로 유지한다.

```tsx
{tags.length > 0 ? (
  <>
    <span className="post-filter-label" aria-hidden="true">
      태그 필터
    </span>
    <div className="post-filter-options" role="group" aria-label="태그 필터">
      {options.map(tag => {
        const isSelected = selectedTag === tag
        const isAll = tag === ALL_POSTS_FILTER

        return (
          <button
            key={isAll ? "filter:all" : `filter:tag:${tag}`}
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
  </>
) : null}
```

`aria-hidden="true"`는 이미 toolbar와 버튼 그룹에 있는 접근 이름을 중복 낭독하지 않게 한다. 결과 수 status는 기존처럼 조건부 영역 뒤에 둔다.

- [ ] **Step 4: PC 규칙을 보존하고 모바일 2행 grid 구현**

`src/styles/home.css`의 기본 컴포넌트 레이어에 다음 라벨 규칙을 추가한다.

```css
.post-filter-label {
  display: none;
}
```

기존 `@media (max-width: 720px)`의 toolbar와 count 규칙을 다음으로 교체한다.

```css
.post-filter-toolbar {
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: var(--space-3);
  row-gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.post-filter-label {
  display: block;
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  color: var(--fg-2);
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1.55;
}

.post-filter-options {
  grid-column: 1 / -1;
  grid-row: 2;
}

.post-filter-count {
  grid-column: 2;
  grid-row: 1;
  align-self: center;
  justify-self: end;
}

.post-filter-count:only-child {
  grid-column: 1 / -1;
}
```

기본 `.post-filter-toolbar`의 2열·16px gap·20px 하단 여백과 `.post-filter-count { grid-column: 2; }`는 변경하지 않는다.

- [ ] **Step 5: 표적 테스트와 타입 검사를 통과시킨다**

Run:

```bash
node --test src/components/home-screen-contract.test.mjs
npm run typecheck
git diff --check
```

Expected: 홈 화면 계약 테스트 전체 PASS, TypeScript 오류 0, whitespace 오류 0.

- [ ] **Step 6: 구현 단위 커밋**

```bash
git add src/components/home-screen-contract.test.mjs src/components/post-filter-bar.tsx src/styles/home.css
git commit -m "fix: organize mobile tag filter header"
```

### Task 2: 프로덕션 HTML과 브라우저 수용 검증

**Files:**
- Modify: `scripts/verify-home-build.mjs:132-182`
- Verify: `public/index.html`

**Interfaces:**
- Consumes: Task 1의 `.post-filter-label`, 기존 filter buttons와 `.post-filter-count`
- Produces: 프로덕션 홈 HTML의 라벨·필터·결과 수 계약과 Chromium·WebKit 반응형 수용 근거

- [ ] **Step 1: 프로덕션 HTML 라벨 검증을 추가**

`scripts/verify-home-build.mjs`에서 `toolbar`를 추출한 직후 다음 검증을 추가한다.

```js
assert.match(
  toolbar,
  /<span\b(?=[^>]*class="[^"]*\bpost-filter-label\b[^"]*")(?=[^>]*aria-hidden="true")[^>]*>\s*태그 필터\s*<\/span>/,
  "home: visible mobile tag filter label",
)
```

- [ ] **Step 2: 이전 프로덕션 산출물이 새 계약에서 실패하는지 확인**

Run:

```bash
npm run verify:home
```

Expected: 기존 `public/index.html`에 `.post-filter-label`이 없어 `home: visible mobile tag filter label`에서 FAIL한다.

- [ ] **Step 3: 캐시를 제거하고 프로덕션 산출물 재생성**

Run:

```bash
npm run clean
npm run build
```

Expected: Gatsby가 홈·3개 포스트·404와 새 CSS asset을 생성하고 exit 0.

- [ ] **Step 4: 프로덕션 홈 검증 통과 확인**

Run:

```bash
npm run verify:home
```

Expected: `home build verified: actual MDX list, initial filters, and static screen contracts passed`.

- [ ] **Step 5: 전체 자동 검증 실행**

Run:

```bash
npm test
npm run typecheck
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
git diff --check
```

Expected: 모든 Node 테스트 PASS, TypeScript 오류 0, 정적 verifier 4종 PASS, whitespace 오류 0.

- [ ] **Step 6: 프로덕션 서버와 두 브라우저 세션 시작**

Run:

```bash
npm run serve -- --port 9000
playwright-cli -s=mobile-filter-chrome open http://127.0.0.1:9000/ --browser=chrome
playwright-cli -s=mobile-filter-webkit open http://127.0.0.1:9000/ --browser=webkit
```

Expected: 홈 HTTP 200, 두 세션의 title이 `Developer Blog`.

- [ ] **Step 7: 390·430·720·721px 레이아웃 계약 검증**

두 세션에서 다음 `run-code`를 각각 실행한다.

```js
async page => {
  const results = []

  for (const width of [390, 430, 720, 721]) {
    await page.setViewportSize({ width, height: 900 })
    const result = await page.evaluate(() => {
      const label = document.querySelector(".post-filter-label")
      const options = document.querySelector(".post-filter-options")
      const count = document.querySelector(".post-filter-count")
      const list = document.querySelector(".post-list")
      const labelRect = label.getBoundingClientRect()
      const optionsRect = options.getBoundingClientRect()
      const countRect = count.getBoundingClientRect()
      const listRect = list.getBoundingClientRect()
      const toolbarStyle = getComputedStyle(
        document.querySelector(".post-filter-toolbar"),
      )
      const rows = new Set(
        [...options.querySelectorAll(".post-filter-button")].map(button =>
          Math.round(button.getBoundingClientRect().top),
        ),
      ).size

      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        labelDisplay: getComputedStyle(label).display,
        rowGapStyle: Math.round(parseFloat(toolbarStyle.rowGap)),
        rowGap: Math.round(
          optionsRect.top - Math.max(labelRect.bottom, countRect.bottom),
        ),
        listGap: Math.round(listRect.top - optionsRect.bottom),
        optionRows: rows,
        optionsWidth: Math.round(optionsRect.width),
      }
    })

    if (result.scrollWidth !== width) throw new Error(`${width}: page overflow`)

    if (width <= 720) {
      if (result.labelDisplay === "none") throw new Error(`${width}: label hidden`)
      if (result.rowGapStyle !== 8) {
        throw new Error(`${width}: computed row gap ${result.rowGapStyle}`)
      }
      if (result.rowGap !== 8) throw new Error(`${width}: row gap ${result.rowGap}`)
      if (result.listGap !== 12) throw new Error(`${width}: list gap ${result.listGap}`)
      if (result.optionRows < 2) {
        throw new Error(`${width}: tags did not wrap`)
      }
    } else if (result.labelDisplay !== "none") {
      throw new Error("721: mobile label visible")
    }

    results.push(result)
  }

  return results
}
```

Expected: Chromium과 WebKit 모두 390·430·720px에서 태그가 둘 이상의 행으로 자연스럽게 개행되고, row gap 8px·list gap 12px·page overflow 0이다. 브라우저 글꼴 폭 차이를 고려해 정확한 태그 행 수는 고정하지 않는다. 721px에서는 라벨이 숨겨진다.

- [ ] **Step 8: 필터 동작과 접근성 상태 검증**

두 세션 중 하나를 390px로 두고 다음 코드를 실행한다.

```js
async page => {
  const select = async (label, expectedCount, expectedText) => {
    await page.locator(".post-filter-button", { hasText: label }).click()
    const countText = await page.locator(".post-filter-count").textContent()
    const visibleCards = await page.locator(".post-list-item").count()
    const pressed = await page.locator('.post-filter-button[aria-pressed="true"]').count()

    if (countText?.trim() !== expectedText) {
      throw new Error(`${label}: count text ${countText}`)
    }
    if (visibleCards !== expectedCount) {
      throw new Error(`${label}: visible cards ${visibleCards}`)
    }
    if (pressed !== 1) throw new Error(`${label}: pressed buttons ${pressed}`)
  }

  await select("GraphQL", 2, "2 posts")
  await select("SEO", 1, "1 post")
  await page.locator('.post-filter-button[data-filter-kind="all"]').click()

  return {
    count: (await page.locator(".post-filter-count").textContent())?.trim(),
    cards: await page.locator(".post-list-item").count(),
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  }
}
```

Expected: 최종 `{ count: "3 posts", cards: 3, overflow: 0 }`; 모든 선택에서 pressed button은 하나다.

- [ ] **Step 9: 브라우저와 로컬 서버 종료**

Run:

```bash
playwright-cli -s=mobile-filter-chrome close
playwright-cli -s=mobile-filter-webkit close
```

`npm run serve` 세션에는 `Ctrl-C`를 보내고 9000 포트 listener가 남지 않았는지 확인한다.

- [ ] **Step 10: 프로덕션 검증 커밋과 최종 상태 확인**

```bash
git add scripts/verify-home-build.mjs
git commit -m "test: verify mobile tag filter header"
git status --short --branch
git log --oneline -3
```

Expected: working tree가 깨끗하고, 설계 커밋 뒤에 구현 커밋과 프로덕션 검증 커밋이 순서대로 존재한다. push·PR·병합·배포는 수행하지 않는다.
