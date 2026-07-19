# Shared Scroll to Top Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** index와 post에서 한 화면 이상 내려간 사용자가 위로 16px 연속 스크롤하면 나타나고, 클릭 시 1,000ms 기준으로 맨 위까지 이동하는 공통 버튼을 제공한다.

**Architecture:** 새 `ScrollToTopButton`이 노출 판단, 방향 누적, 사용자 정의 상단 이동, 입력 취소, 키보드 포커스 복구를 한 effect 안에서 소유한다. `Layout`은 이 컴포넌트를 한 번만 렌더링해 index와 post에 자동 적용하고 404는 기존 독립 경계를 유지한다. 소스 계약 테스트, Gatsby 프로덕션 HTML 검증, Chromium·WebKit 동작 검증을 순서대로 통과시킨다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, CSS, Node.js built-in test runner, Playwright CLI

## Global Constraints

- 구현 기준은 `docs/superpowers/specs/2026-07-19-scroll-to-top-button-design.md`다.
- 구현 브랜치는 `feat/scroll-to-top-button`이며 별도 worktree를 만들지 않는다.
- `Layout`을 사용하는 index와 post에만 적용하고 독립적인 404에는 적용하지 않는다.
- 버튼은 `window.scrollY > window.innerHeight`에서 위로 16px 연속 이동했을 때만 나타나며 아래 방향에서는 즉시 숨긴다.
- 일반 환경의 상단 이동 시간은 1,000ms다. 모션 감소 환경에서는 즉시 이동한다.
- 이동 중 wheel·touchstart·pointerdown과 지정된 스크롤 키 입력은 사용자의 기본 입력을 막지 않고 애니메이션만 취소한다.
- 키보드 실행이 정상 완료된 경우에만 `.site-logo`로 포커스를 옮기고 pointer 실행 또는 취소 시에는 강제로 옮기지 않는다.
- 버튼 DOM은 항상 유지하되 숨김 상태에서는 접근성 트리와 Tab 순서에서도 제외한다.
- PC 위치는 오른쪽·아래 24px, 모바일은 16px에 각 safe-area inset을 더한다.
- post 목차, URL·history, 저장소, 스크롤 진행률, 신규 런타임 패키지는 변경하지 않는다.
- 구현·로컬 검증까지만 수행한다. push·PR·병합·배포는 별도 승인 전 수행하지 않는다.

---

## File Map

- `src/components/scroll-to-top-button.tsx`: 방향 감지, 노출 상태, 1초 애니메이션, 취소, 접근성·포커스를 소유한다.
- `src/components/layout.tsx`: 공통 버튼을 `Footer` 다음에 한 번 렌더링한다.
- `src/styles/layout.css`: 버튼의 고정 위치, 표시 전환, 상호작용, 모바일 safe area를 정의한다.
- `src/components/layout-contract.test.mjs`: 컴포넌트 동작·접근성·cleanup과 Layout·CSS 계약을 고정한다.
- `scripts/verify-layout-build.mjs`: 홈과 생성된 모든 post에는 버튼이 한 번, 404에는 0번인지 확인한다.

### Task 1: 스크롤 상태와 상단 이동 컴포넌트

**Files:**
- Create: `src/components/scroll-to-top-button.tsx`
- Modify: `src/components/layout-contract.test.mjs:56-69`

**Interfaces:**
- Consumes: `window.scrollY`, `window.innerHeight`, scroll·resize·입력 이벤트, `prefers-reduced-motion`
- Produces: `.scroll-to-top-button` native button, `is-visible` 상태 클래스, 키보드 완료 시 `.site-logo` 포커스

- [ ] **Step 1: 동작·접근성 계약의 실패 테스트 작성**

`src/components/layout-contract.test.mjs`에 다음 테스트를 추가하고 React runtime 검사 대상에도 새 파일을 넣는다.

```js
test("defines the scroll direction and animation contracts", async () => {
  const button = await readRepositoryFile(
    "src/components/scroll-to-top-button.tsx",
  )

  assert.match(button, /const SCROLL_UP_THRESHOLD_PX = 16/)
  assert.match(button, /const SCROLL_DURATION_MS = 1000/)
  assert.match(
    button,
    /const CANCEL_SCROLL_KEYS = new Set\(\[[\s\S]*"ArrowUp"[\s\S]*"ArrowDown"[\s\S]*"PageUp"[\s\S]*"PageDown"[\s\S]*"Home"[\s\S]*"End"[\s\S]*"Space"[\s\S]*\]\)/,
  )
  assert.match(button, /window\.scrollY <= window\.innerHeight/)
  assert.match(button, /currentScrollY > lastScrollY[\s\S]*setIsVisible\(false\)[\s\S]*upwardDistance = 0/)
  assert.match(button, /upwardDistance \+= lastScrollY - currentScrollY/)
  assert.match(button, /upwardDistance >= SCROLL_UP_THRESHOLD_PX/)
  assert.match(
    button,
    /window\.addEventListener\("scroll", handleScroll, \{ passive: true \}\)/,
  )
  assert.match(button, /observationFrame = window\.requestAnimationFrame\(updateVisibility\)/)
  assert.match(button, /elapsed \/ SCROLL_DURATION_MS/)
  assert.match(button, /1 - \(1 - progress\) \*\* 3/)
  assert.match(button, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/)
  assert.match(button, /event\.detail === 0/)
})

test("keeps the scroll button accessible and cancels owned resources", async () => {
  const button = await readRepositoryFile(
    "src/components/scroll-to-top-button.tsx",
  )

  assert.match(button, /<button[\s\S]*type="button"[\s\S]*aria-label="페이지 맨 위로 이동"/)
  assert.match(button, /aria-hidden=\{!isVisible\}/)
  assert.match(button, /tabIndex=\{isVisible \? 0 : -1\}/)
  assert.match(button, /<svg[\s\S]*aria-hidden="true"[\s\S]*focusable="false"/)
  assert.match(button, /document\.querySelector<HTMLElement>\("\.site-logo"\)/)
  assert.match(button, /focus\(\{ preventScroll: true \}\)/)
  assert.match(button, /CANCEL_SCROLL_KEYS\.has\(event\.code\)/)

  for (const eventName of ["wheel", "touchstart", "pointerdown"]) {
    assert.match(
      button,
      new RegExp(`window\\.addEventListener\\("${eventName}", cancelScrollAnimation`),
    )
    assert.match(
      button,
      new RegExp(`window\\.removeEventListener\\("${eventName}", cancelScrollAnimation`),
    )
  }

  assert.match(button, /window\.cancelAnimationFrame\(observationFrame\)/)
  assert.match(button, /window\.cancelAnimationFrame\(scrollAnimationFrame\)/)
  assert.match(button, /window\.removeEventListener\("scroll", handleScroll\)/)
  assert.match(button, /window\.removeEventListener\("resize", handleResize\)/)
  assert.match(button, /window\.removeEventListener\("keydown", handleKeyDown\)/)
})
```

React runtime 검사 배열은 다음처럼 확장한다.

```js
[
  "src/components/content-container.tsx",
  "src/components/header.tsx",
  "src/components/footer.tsx",
  "src/components/layout.tsx",
  "src/components/scroll-to-top-button.tsx",
]
```

- [ ] **Step 2: 테스트가 새 컴포넌트 부재로 실패하는지 확인**

Run:

```bash
node --test src/components/layout-contract.test.mjs
```

Expected: 새 두 테스트와 React runtime 검사가 빈 `scroll-to-top-button.tsx` 소스를 읽어 FAIL하고 기존 Layout 테스트는 PASS한다.

- [ ] **Step 3: 한 effect가 전체 수명주기를 소유하는 컴포넌트 구현**

`src/components/scroll-to-top-button.tsx`를 다음 내용으로 만든다.

```tsx
import * as React from "react"

const SCROLL_UP_THRESHOLD_PX = 16
const SCROLL_DURATION_MS = 1000
const CANCEL_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Space",
])

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = React.useState(false)
  const startScrollRef = React.useRef<(isKeyboard: boolean) => void>(() => {})

  React.useEffect(() => {
    let lastScrollY = window.scrollY
    let upwardDistance = 0
    let observationFrame: number | null = null
    let scrollAnimationFrame: number | null = null

    const focusSiteLogo = () => {
      document
        .querySelector<HTMLElement>(".site-logo")
        ?.focus({ preventScroll: true })
    }

    const cancelScrollAnimation = () => {
      if (scrollAnimationFrame === null) return

      window.cancelAnimationFrame(scrollAnimationFrame)
      scrollAnimationFrame = null
    }

    const startScroll = (isKeyboard: boolean) => {
      cancelScrollAnimation()

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        window.scrollTo(0, 0)
        if (isKeyboard) focusSiteLogo()
        return
      }

      const startScrollY = window.scrollY
      const startedAt = window.performance.now()

      const animate = (timestamp: number) => {
        const elapsed = Math.max(0, timestamp - startedAt)
        const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1)
        const easedProgress = 1 - (1 - progress) ** 3
        const nextScrollY = Math.round(startScrollY * (1 - easedProgress))

        window.scrollTo(0, nextScrollY)

        if (progress < 1) {
          scrollAnimationFrame = window.requestAnimationFrame(animate)
          return
        }

        window.scrollTo(0, 0)
        scrollAnimationFrame = null
        if (isKeyboard) focusSiteLogo()
      }

      scrollAnimationFrame = window.requestAnimationFrame(animate)
    }

    const updateVisibility = () => {
      observationFrame = null
      const currentScrollY = window.scrollY

      if (currentScrollY <= window.innerHeight) {
        setIsVisible(false)
        upwardDistance = 0
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
        upwardDistance = 0
      } else if (currentScrollY < lastScrollY) {
        upwardDistance += lastScrollY - currentScrollY
        if (upwardDistance >= SCROLL_UP_THRESHOLD_PX) {
          setIsVisible(true)
        }
      }

      lastScrollY = currentScrollY
    }

    const handleScroll = () => {
      if (observationFrame !== null) return

      observationFrame = window.requestAnimationFrame(updateVisibility)
    }

    const handleResize = () => {
      lastScrollY = window.scrollY
      if (window.scrollY <= window.innerHeight) {
        setIsVisible(false)
        upwardDistance = 0
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (CANCEL_SCROLL_KEYS.has(event.code)) cancelScrollAnimation()
    }

    startScrollRef.current = startScroll
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)
    window.addEventListener("wheel", cancelScrollAnimation, { passive: true })
    window.addEventListener("touchstart", cancelScrollAnimation, {
      passive: true,
    })
    window.addEventListener("pointerdown", cancelScrollAnimation, {
      passive: true,
    })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      startScrollRef.current = () => {}
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("wheel", cancelScrollAnimation)
      window.removeEventListener("touchstart", cancelScrollAnimation)
      window.removeEventListener("pointerdown", cancelScrollAnimation)
      window.removeEventListener("keydown", handleKeyDown)

      if (observationFrame !== null) {
        window.cancelAnimationFrame(observationFrame)
      }
      if (scrollAnimationFrame !== null) {
        window.cancelAnimationFrame(scrollAnimationFrame)
      }
    }
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    startScrollRef.current(event.detail === 0)
  }

  return (
    <button
      className={`scroll-to-top-button${isVisible ? " is-visible" : ""}`}
      type="button"
      aria-label="페이지 맨 위로 이동"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={handleClick}
    >
      <svg
        className="scroll-to-top-icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 19V5m-6 6 6-6 6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default ScrollToTopButton
```

effect 내부 지역 변수로 listener와 두 animation frame을 함께 관리한다. `startedAt`은 클릭 처리 시점의 `performance.now()`이므로 첫 frame 시점부터가 아니라 실행 시점부터 1,000ms를 계산한다.

- [ ] **Step 4: 표적 테스트와 타입 검사 통과 확인**

Run:

```bash
node --test src/components/layout-contract.test.mjs
npm run typecheck
git diff --check
```

Expected: Layout 계약 테스트 전체 PASS, TypeScript 오류 0, whitespace 오류 0.

- [ ] **Step 5: 컴포넌트 구현 커밋**

```bash
git add src/components/scroll-to-top-button.tsx src/components/layout-contract.test.mjs
git commit -m "feat: add scroll to top behavior"
```

### Task 2: 공통 Layout 연결과 반응형 시각 상태

**Files:**
- Modify: `src/components/layout-contract.test.mjs:17-54,71-110`
- Modify: `src/components/layout.tsx:4-14`
- Modify: `src/styles/layout.css:88-114,122-126`

**Interfaces:**
- Consumes: Task 1의 `.scroll-to-top-button`과 `is-visible` 클래스
- Produces: Layout당 한 버튼, 44×44px 원형 고정 UI, PC 24px·모바일 16px+safe-area 위치

- [ ] **Step 1: Layout·CSS 계약의 실패 테스트 작성**

`src/components/layout-contract.test.mjs`에 다음 테스트를 추가한다.

```js
test("renders and styles one shared scroll to top button", async () => {
  const [layout, layoutCss] = await Promise.all([
    readRepositoryFile("src/components/layout.tsx"),
    readRepositoryFile("src/styles/layout.css"),
  ])

  assert.match(layout, /import ScrollToTopButton from "\.\/scroll-to-top-button"/)
  assert.equal((layout.match(/<ScrollToTopButton \/>/g) ?? []).length, 1)
  assert.match(
    layoutCss,
    /\.scroll-to-top-button\s*\{(?=[^}]*position:\s*fixed)(?=[^}]*right:\s*var\(--space-6\))(?=[^}]*bottom:\s*var\(--space-6\))(?=[^}]*z-index:\s*30)(?=[^}]*width:\s*44px)(?=[^}]*height:\s*44px)(?=[^}]*border-radius:\s*var\(--radius-pill\))(?=[^}]*background:\s*var\(--bg\))(?=[^}]*opacity:\s*0)(?=[^}]*visibility:\s*hidden)(?=[^}]*pointer-events:\s*none)(?=[^}]*transform:\s*translateY\(var\(--space-2\)\))[^}]*\}/s,
  )
  assert.match(
    layoutCss,
    /\.scroll-to-top-button\.is-visible\s*\{(?=[^}]*opacity:\s*1)(?=[^}]*visibility:\s*visible)(?=[^}]*pointer-events:\s*auto)(?=[^}]*transform:\s*translateY\(0\))[^}]*\}/s,
  )
  assert.match(layoutCss, /\.scroll-to-top-button:hover\s*\{[^}]*border-color:\s*var\(--accent\)[^}]*color:\s*var\(--accent-hover\)/s)
  assert.match(layoutCss, /\.scroll-to-top-button:active\s*\{[^}]*transform:\s*scale\(0\.92\)/s)
  assert.match(
    layoutCss,
    /@media \(max-width: 720px\)[\s\S]*\.scroll-to-top-button\s*\{(?=[^}]*right:\s*calc\(var\(--space-4\) \+ env\(safe-area-inset-right, 0px\)\))(?=[^}]*bottom:\s*calc\(var\(--space-4\) \+ env\(safe-area-inset-bottom, 0px\)\))[^}]*\}/s,
  )
})
```

기존 shell 정규식은 `Footer` 뒤에 버튼이 존재하도록 확장하고 404 경계도 같은 테스트에서 고정한다.

```js
assert.match(
  layout,
  /<div className="site-shell">[\s\S]*<Header \/>[\s\S]*<main id="content" className="site-main">[\s\S]*\{children\}[\s\S]*<Footer \/>[\s\S]*<ScrollToTopButton \/>/,
)

const notFoundPage = await readRepositoryFile("src/pages/404.tsx")
assert.doesNotMatch(notFoundPage, /<Layout>|ScrollToTopButton/)
```

- [ ] **Step 2: 테스트가 Layout 연결과 스타일 부재로 실패하는지 확인**

Run:

```bash
node --test src/components/layout-contract.test.mjs
```

Expected: Task 1 계약은 PASS하고 `renders and styles one shared scroll to top button`이 Layout import·렌더 또는 CSS 계약에서 FAIL한다.

- [ ] **Step 3: Layout에서 버튼을 한 번 렌더링**

`src/components/layout.tsx`에 import를 추가한다.

```tsx
import ScrollToTopButton from "./scroll-to-top-button"
```

기존 shell 순서를 유지하면서 `Footer` 뒤에 버튼을 둔다.

```tsx
const Layout = ({ children }: PropsWithChildren) => (
  <div className="site-shell">
    <Header />
    <main id="content" className="site-main">
      {children}
    </main>
    <Footer />
    <ScrollToTopButton />
  </div>
)
```

페이지별 prop이나 post 목차 연결은 추가하지 않는다.

- [ ] **Step 4: 버튼의 PC·모바일 스타일 구현**

`src/styles/layout.css`의 `@layer components` 안에 다음 규칙을 추가한다.

```css
.scroll-to-top-button {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  z-index: 30;
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--bg);
  box-shadow: var(--elev-raised);
  color: var(--accent);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(var(--space-2));
  transition:
    opacity var(--motion-base) var(--ease-standard),
    visibility 0s linear var(--motion-base),
    transform var(--motion-base) var(--ease-standard),
    border-color var(--motion-fast) var(--ease-standard),
    color var(--motion-fast) var(--ease-standard);
}

.scroll-to-top-button.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition-delay: 0s;
}

.scroll-to-top-icon {
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.scroll-to-top-button:hover {
  border-color: var(--accent);
  color: var(--accent-hover);
}

.scroll-to-top-button:active {
  transform: scale(0.92);
}
```

기존 `@media (max-width: 720px)` 안에는 다음을 추가한다.

```css
.scroll-to-top-button {
  right: calc(var(--space-4) + env(safe-area-inset-right, 0px));
  bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
}
```

전역 `:focus-visible`과 `prefers-reduced-motion` 규칙은 `theme.css`에서 이미 제공하므로 중복 정의하지 않는다.

- [ ] **Step 5: 표적·전체 단위 검증 통과 확인**

Run:

```bash
node --test src/components/layout-contract.test.mjs
npm test
npm run typecheck
git diff --check
```

Expected: 전체 Node 테스트 PASS, TypeScript 오류 0, whitespace 오류 0.

- [ ] **Step 6: 공통 연결과 스타일 커밋**

```bash
git add src/components/layout.tsx src/components/layout-contract.test.mjs src/styles/layout.css
git commit -m "feat: show shared scroll to top control"
```

### Task 3: 프로덕션 산출물과 Chromium·WebKit 수용 검증

**Files:**
- Modify: `scripts/verify-layout-build.mjs:1-94`
- Verify: `public/index.html`, `public/posts/*/index.html`, `public/404.html`

**Interfaces:**
- Consumes: Task 2의 Layout 정적 마크업과 빌드된 CSS·클라이언트 JavaScript
- Produces: 모든 일반 페이지의 버튼 1개·404의 버튼 0개 계약과 두 브라우저 동작 근거

- [ ] **Step 1: 모든 post를 포함하는 프로덕션 HTML 실패 검증 작성**

`scripts/verify-layout-build.mjs`의 import에 `readdir`를 추가한다.

```js
import { readFile, readdir } from "node:fs/promises"
```

고정 post 하나만 보던 `pages`를 생성된 모든 post 디렉터리로 확장한다.

```js
const postsDirectory = new URL("../public/posts/", import.meta.url)
const postDirectories = (await readdir(postsDirectory, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .sort((left, right) => left.name.localeCompare(right.name))

const pages = [
  ["home", new URL("../public/index.html", import.meta.url)],
  ...postDirectories.map(entry => [
    `post:${entry.name}`,
    new URL(`../public/posts/${entry.name}/index.html`, import.meta.url),
  ]),
]
```

각 일반 페이지 loop에 다음 assertion을 추가한다.

```js
assert.equal(
  countClassedTags(html, "button", "scroll-to-top-button"),
  1,
  `${name}: one scroll to top button`,
)
assert.match(
  html,
  /<button\b(?=[^>]*class="[^"]*scroll-to-top-button[^"]*")(?=[^>]*aria-label="페이지 맨 위로 이동")(?=[^>]*aria-hidden="true")(?=[^>]*tabindex="-1")[^>]*>/,
  `${name}: initially hidden accessible scroll control`,
)
```

404 HTML을 읽은 뒤에는 다음 경계를 추가한다.

```js
assert.equal(
  countClassedTags(notFoundHtml, "button", "scroll-to-top-button"),
  0,
  "not found: no scroll to top button outside Layout",
)
```

마지막 로그는 범위를 드러내도록 바꾼다.

```js
console.log(
  "layout build verified: shell, favicon, and scroll control contracts passed",
)
```

- [ ] **Step 2: 이전 산출물이 새 버튼 계약에서 실패하는지 확인**

Run:

```bash
npm run verify:layout
```

Expected: 현재 `public/index.html` 또는 첫 post에 `.scroll-to-top-button`이 없어 `one scroll to top button`에서 FAIL한다.

- [ ] **Step 3: 캐시 제거 후 프로덕션 산출물 생성**

Run:

```bash
npm run clean
npm run build
```

Expected: Gatsby가 홈·3개 post·404와 새 CSS·JavaScript asset을 생성하고 exit 0.

- [ ] **Step 4: 전체 자동 검증 통과 확인**

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

- [ ] **Step 5: 프로덕션 서버와 짧은 이름의 두 브라우저 세션 시작**

Run:

```bash
npm run serve -- --port 9000
playwright-cli -s=stc open http://127.0.0.1:9000/ --browser=chrome
playwright-cli -s=stw open http://127.0.0.1:9000/ --browser=webkit
```

Expected: 홈 HTTP 200, 두 세션 title `Developer Blog`. 짧은 세션명은 macOS socket 경로 길이 문제를 피한다.

- [ ] **Step 6: index·post의 노출 임계값과 반응형 위치 검증**

두 세션에서 다음 `run-code`를 각각 실행한다.

```js
async page => {
  const routes = [
    "/",
    "/posts/gatsby-blog-3-graphql-page-generation/",
  ]
  const viewports = [
    { width: 390, height: 500, edge: 16 },
    { width: 1440, height: 500, edge: 24 },
  ]
  const results = []

  for (const route of routes) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto(`http://127.0.0.1:9000${route}`)
      await page.waitForLoadState("networkidle")
      const button = page.locator(".scroll-to-top-button")

      if ((await button.count()) !== 1) throw new Error(`${route}: button count`)
      if ((await button.getAttribute("aria-hidden")) !== "true") {
        throw new Error(`${route}: initially visible`)
      }

      const maxScroll = await page.evaluate(
        () => document.documentElement.scrollHeight - innerHeight,
      )
      if (maxScroll <= viewport.height + 160) {
        throw new Error(`${route}: page too short for threshold test`)
      }

      await page.evaluate(() => window.scrollTo(0, innerHeight + 160))
      await page.waitForTimeout(50)
      if ((await button.getAttribute("aria-hidden")) !== "true") {
        throw new Error(`${route}: visible while scrolling down`)
      }

      await page.evaluate(() => window.scrollBy(0, -15))
      await page.waitForTimeout(50)
      if ((await button.getAttribute("aria-hidden")) !== "true") {
        throw new Error(`${route}: visible at 15px`)
      }

      await page.evaluate(() => window.scrollBy(0, -1))
      await page.waitForTimeout(50)
      if ((await button.getAttribute("aria-hidden")) !== "false") {
        throw new Error(`${route}: hidden at cumulative 16px`)
      }

      const metrics = await button.evaluate((element, expectedEdge) => {
        const rect = element.getBoundingClientRect()
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(innerWidth - rect.right),
          bottom: Math.round(innerHeight - rect.bottom),
          overflow: document.documentElement.scrollWidth - innerWidth,
          expectedEdge,
        }
      }, viewport.edge)

      if (metrics.width !== 44 || metrics.height !== 44) {
        throw new Error(`${route}: ${metrics.width}x${metrics.height}`)
      }
      if (metrics.right !== viewport.edge || metrics.bottom !== viewport.edge) {
        throw new Error(`${route}: edge ${metrics.right}/${metrics.bottom}`)
      }
      if (metrics.overflow !== 0) throw new Error(`${route}: horizontal overflow`)

      await page.evaluate(() => window.scrollBy(0, 1))
      await page.waitForTimeout(50)
      if ((await button.getAttribute("aria-hidden")) !== "true") {
        throw new Error(`${route}: not hidden on downward scroll`)
      }

      results.push({ route, ...viewport, ...metrics })
    }
  }

  return results
}
```

Expected: Chromium과 WebKit 모두 index·post의 두 viewport에서 초기·아래·15px 위쪽은 숨김, 누적 16px은 노출, 다시 1px 아래는 즉시 숨김이다. 버튼은 44×44px, PC edge 24px, 모바일 safe-area가 0인 테스트 환경에서 edge 16px, 가로 overflow 0이다.

- [ ] **Step 7: 1,000ms 이동, 취소, 모션 감소, 키보드 포커스 검증**

두 세션에서 post를 390×500으로 열고 다음 `run-code`를 각각 실행한다.

```js
async page => {
  await page.setViewportSize({ width: 390, height: 500 })
  await page.goto(
    "http://127.0.0.1:9000/posts/gatsby-blog-3-graphql-page-generation/",
  )
  await page.waitForLoadState("networkidle")

  const reveal = async () => {
    await page.evaluate(() => window.scrollTo(0, innerHeight + 500))
    await page.waitForTimeout(50)
    await page.evaluate(() => window.scrollBy(0, -16))
    await page.waitForFunction(
      () => document.querySelector(".scroll-to-top-button")?.getAttribute("aria-hidden") === "false",
    )
  }

  await reveal()
  const duration = await page.evaluate(async () => {
    const button = document.querySelector(".scroll-to-top-button")
    const startedAt = performance.now()
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))

    while (window.scrollY !== 0) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }

    return performance.now() - startedAt
  })
  if (duration < 1000 || duration > 1100) {
    throw new Error(`animation duration ${duration}`)
  }

  const cancellationEvents = ["wheel", "touchstart", "pointerdown", "keydown"]
  const cancellationResults = []
  for (const eventName of cancellationEvents) {
    await reveal()
    await page.evaluate(() => {
      document.querySelector(".scroll-to-top-button").dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      )
    })
    await page.waitForTimeout(150)
    await page.evaluate(name => {
      const event = name === "keydown"
        ? new KeyboardEvent("keydown", { bubbles: true, code: "ArrowDown" })
        : name === "wheel"
          ? new WheelEvent("wheel", { bubbles: true, deltaY: 120 })
          : new Event(name, { bubbles: true })
      window.dispatchEvent(event)
    }, eventName)
    const canceledAt = await page.evaluate(() => window.scrollY)
    await page.waitForTimeout(1100)
    const finalY = await page.evaluate(() => window.scrollY)
    if (canceledAt <= 0 || finalY !== canceledAt) {
      throw new Error(`${eventName}: animation did not remain canceled`)
    }
    cancellationResults.push({ eventName, finalY })
  }

  await reveal()
  await page.locator(".scroll-to-top-button").focus()
  await page.keyboard.press("Enter")
  await page.waitForFunction(() => window.scrollY === 0)
  const keyboardFocus = await page.evaluate(
    () => document.activeElement?.classList.contains("site-logo") ?? false,
  )
  if (!keyboardFocus) throw new Error("keyboard focus was not restored")

  await page.emulateMedia({ reducedMotion: "reduce" })
  await reveal()
  const reduced = await page.evaluate(() => {
    document.querySelector(".scroll-to-top-button").dispatchEvent(
      new MouseEvent("click", { bubbles: true, detail: 1 }),
    )
    return window.scrollY
  })
  if (reduced !== 0) throw new Error(`reduced motion stopped at ${reduced}`)
  await page.emulateMedia({ reducedMotion: "no-preference" })

  return { duration, cancellationResults, keyboardFocus, reduced }
}
```

Expected: 두 브라우저 모두 완료 frame이 1,000~1,100ms에 실행되고, 네 종류 입력 뒤 위치가 더 이상 애니메이션으로 변하지 않는다. 키보드 정상 완료 후 logo focus는 true, 모션 감소 결과는 0이다.

- [ ] **Step 8: 404 경계와 브라우저·서버 cleanup 확인**

두 세션에서 `/404.html`을 열어 `.scroll-to-top-button` count가 0인지 확인한다. 그 뒤 실행한다.

```bash
playwright-cli -s=stc close
playwright-cli -s=stw close
```

`npm run serve` 세션에는 `Ctrl-C`를 보내고 9000 포트 listener가 남지 않았는지 확인한다.

- [ ] **Step 9: 프로덕션 검증 커밋과 최종 상태 확인**

```bash
git add scripts/verify-layout-build.mjs
git commit -m "test: verify shared scroll to top control"
git status --short --branch
git log --oneline -4
```

Expected: working tree가 깨끗하고 설계 커밋 뒤에 동작, Layout·스타일, 프로덕션 검증 커밋이 순서대로 존재한다. push·PR·병합·배포는 수행하지 않는다.
