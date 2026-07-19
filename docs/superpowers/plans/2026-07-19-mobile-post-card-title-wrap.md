# Mobile Post Card Title Wrapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 포스트 카드 제목이 사용 가능한 가로 폭을 우선 사용하고 한국어 단어 내부를 불필요하게 나누지 않도록 최소 CSS 수정과 회귀 검증을 적용한다.

**Architecture:** React와 GraphQL 데이터 흐름은 유지하고 `home.css`의 카드 전용 선택자에서 전역 heading 줄바꿈을 덮어쓴다. 기존 Node 계약 테스트가 정확한 CSS 규칙을 고정하며, 프로덕션 빌드 뒤 Chromium과 WebKit에서 실제 줄 박스와 overflow를 확인한다.

**Tech Stack:** Gatsby 5.16.1, React 18.3.1, TypeScript 5.9.3, Node.js 24.14.1 test runner, CSS, playwright-cli

## Global Constraints

- 구현 브랜치는 `fix/38-mobile-post-card-title-wrap`이며 별도 worktree를 만들지 않는다.
- 설계 기준은 `docs/superpowers/specs/2026-07-19-mobile-post-card-title-wrap-design.md`다.
- `.post-card-title`과 `.post-card-title-link`의 줄바꿈 규칙만 변경한다.
- 전역 `h1`~`h6`, 상세 포스트 `.post-title`, React 구조, GraphQL, 필터·정렬·콘텐츠는 변경하지 않는다.
- 카드 글꼴·크기·굵기·행간·간격은 변경하지 않는다.
- 신규 런타임·개발 의존성을 추가하지 않는다.
- 배포, push, PR 생성, 이슈 종료는 이 계획의 실행 범위 밖이며 각각 별도 승인 뒤 수행한다.
- Redmine #30과 GitHub #38은 이미 양방향 연결되어 있고 Redmine 상태는 `진행 중`이다.

## File Structure

- Modify `src/components/home-screen-contract.test.mjs`: 카드 제목 줄바꿈 CSS의 회귀 계약을 소유한다.
- Modify `src/styles/home.css`: 홈 카드 범위의 실제 줄바꿈 표현만 소유한다.

---

### Task 1: 카드 제목 줄바꿈 회귀 계약과 최소 CSS 수정

**Files:**
- Modify: `src/components/home-screen-contract.test.mjs`
- Modify: `src/styles/home.css`
- Reference: `docs/superpowers/specs/2026-07-19-mobile-post-card-title-wrap-design.md`

**Interfaces:**
- Consumes: 기존 `.post-card-title`, `.post-card-title-link` 선택자와 `readRepositoryFile()` 테스트 helper
- Produces: `text-wrap: wrap`, `word-break: keep-all`, `overflow-wrap: break-word`로 고정된 카드 전용 CSS 계약

- [ ] **Step 1: 실패하는 CSS 계약 테스트 작성**

`src/components/home-screen-contract.test.mjs`의 홈 스타일 계약 테스트들 뒤에 다음 테스트를 추가한다.

```js
test("uses predictable wrapping for home post card titles", async () => {
  const homeCss = await readRepositoryFile("src/styles/home.css")
  const titleRule = homeCss.match(/\.post-card-title\s*\{([^}]*)\}/s)
  const linkRule = homeCss.match(/\.post-card-title-link\s*\{([^}]*)\}/s)

  assert.ok(titleRule)
  assert.ok(linkRule)
  assert.match(titleRule[1], /text-wrap:\s*wrap/)
  assert.doesNotMatch(titleRule[1], /text-wrap:\s*balance/)
  assert.match(linkRule[1], /word-break:\s*keep-all/)
  assert.match(linkRule[1], /overflow-wrap:\s*break-word/)
  assert.doesNotMatch(linkRule[1], /overflow-wrap:\s*anywhere/)
})
```

- [ ] **Step 2: 테스트가 현재 코드의 누락 규칙 때문에 실패하는지 확인**

Run:

```bash
node --test \
  --test-name-pattern="uses predictable wrapping for home post card titles" \
  src/components/home-screen-contract.test.mjs
```

Expected: 새 테스트 하나가 `text-wrap: wrap` 불일치로 FAIL한다. 구문 오류나 파일 경로 오류로 실패하면 테스트를 고친 뒤 같은 이유로 실패할 때까지 다시 실행한다.

- [ ] **Step 3: 카드 범위에 최소 CSS 규칙 적용**

`src/styles/home.css`의 기존 두 규칙을 다음과 같이 수정한다. 나머지 선언 순서와 값은 유지한다.

```css
.post-card-title {
  min-width: 0;
  font-family: var(--font-body);
  font-size: clamp(18px, 1.7vw, 19px);
  font-weight: 600;
  line-height: 1.42;
  text-wrap: wrap;
}

.post-card-title-link {
  color: var(--fg);
  text-decoration: none;
  overflow-wrap: break-word;
  word-break: keep-all;
}
```

- [ ] **Step 4: 대상 테스트와 전체 테스트를 GREEN으로 확인**

Run:

```bash
node --test \
  --test-name-pattern="uses predictable wrapping for home post card titles" \
  src/components/home-screen-contract.test.mjs
npm test
```

Expected: 대상 테스트 1개와 전체 78개 테스트가 모두 PASS하고 warning·error가 없다.

- [ ] **Step 5: diff 범위와 금지 변경 확인**

Run:

```bash
git diff --check
git diff -- src/components/home-screen-contract.test.mjs src/styles/home.css
git status --short
```

Expected: 테스트와 카드 CSS 두 파일만 변경되고 전역 theme, post CSS, React, 콘텐츠 파일은 변경되지 않는다.

- [ ] **Step 6: TDD 수정 커밋**

```bash
git add src/components/home-screen-contract.test.mjs src/styles/home.css
git commit -m "fix: use available width for post card titles"
```

Expected: 테스트와 최소 CSS 수정이 한 커밋에 기록되고 working tree가 깨끗하다.

---

### Task 2: 프로덕션 빌드와 Chromium·WebKit 반응형 검증

**Files:**
- Verify: `src/styles/home.css`
- Verify: `public/index.html`
- Verify: generated production assets served from `http://127.0.0.1:9000/`

**Interfaces:**
- Consumes: Task 1의 카드 제목 CSS 계약과 Gatsby 프로덕션 산출물
- Produces: 393px 실제 줄 박스, 다중 viewport overflow, 기존 정적 계약에 대한 완료 근거

- [ ] **Step 1: 타입·프로덕션 빌드·정적 검증 실행**

Run:

```bash
npm run typecheck
npm run build
npm run verify:styles
npm run verify:layout
npm run verify:home
npm run verify:post
```

Expected: 모든 명령이 exit 0이며 Gatsby가 홈·404·세 포스트를 생성한다. 기존 태그 필터, 레이아웃, 상세 포스트 계약도 유지된다.

- [ ] **Step 2: 프로덕션 서버와 두 브라우저 세션 시작**

터미널 세션에서 다음 서버를 실행하고 `http://127.0.0.1:9000/` 준비 메시지를 기다린다.

```bash
npm run serve
```

별도 터미널에서 다음을 실행한다.

```bash
playwright-cli -s=title-chromium open http://127.0.0.1:9000/ --browser=chrome
playwright-cli -s=title-webkit open http://127.0.0.1:9000/ --browser=webkit
```

Expected: 두 세션의 URL과 제목이 각각 `/`, `Developer Blog`다.

- [ ] **Step 3: 393px 제목 폭·줄 경계·겹침 검증**

두 세션 각각에서 다음 코드를 `playwright-cli -s=<session> run-code`로 실행한다.

```js
async page => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.reload()

  return page.evaluate(() => {
    const lineBoxes = link => {
      const node = link.firstChild
      const lines = []

      for (let index = 0; index < node.textContent.length; index += 1) {
        const range = document.createRange()
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        const rect = range.getBoundingClientRect()
        let line = lines.find(item => Math.abs(item.top - rect.top) < 1)

        if (!line) {
          line = { top: rect.top, text: "", left: rect.left, right: rect.right }
          lines.push(line)
        }

        line.text += node.textContent[index]
        line.left = Math.min(line.left, rect.left)
        line.right = Math.max(line.right, rect.right)
      }

      return lines.map(({ text, left, right }) => ({
        text,
        width: right - left,
      }))
    }

    const cards = [...document.querySelectorAll(".post-card")].map(card => {
      const title = card.querySelector(".post-card-title")
      const link = card.querySelector(".post-card-title-link")
      const description = card.querySelector(".post-card-description")
      const date = card.querySelector(".post-card-date")
      const titleRect = title.getBoundingClientRect()
      const descriptionRect = description.getBoundingClientRect()
      const dateRect = date.getBoundingClientRect()
      const lines = lineBoxes(link)
      const titleStyle = getComputedStyle(title)
      const linkStyle = getComputedStyle(link)

      if (titleRect.width !== 345) throw new Error(`title width ${titleRect.width}`)
      if (titleStyle.textWrap !== "wrap") throw new Error(titleStyle.textWrap)
      if (linkStyle.wordBreak !== "keep-all") throw new Error(linkStyle.wordBreak)
      if (linkStyle.overflowWrap !== "break-word") throw new Error(linkStyle.overflowWrap)
      if (lines.length > 1 && lines[0].width < titleRect.width * 0.75) {
        throw new Error(`early wrap ${lines[0].width}/${titleRect.width}`)
      }

      for (let index = 0; index < lines.length - 1; index += 1) {
        if (!lines[index].text.endsWith(" ") && !lines[index + 1].text.startsWith(" ")) {
          throw new Error(`word split: ${lines[index].text}|${lines[index + 1].text}`)
        }
      }

      if (titleRect.bottom > descriptionRect.top) throw new Error("title overlaps description")
      if (descriptionRect.bottom > dateRect.top) throw new Error("description overlaps date")

      return { title: link.textContent.trim(), width: titleRect.width, lines }
    })

    if (document.documentElement.scrollWidth !== document.documentElement.clientWidth) {
      throw new Error("horizontal overflow")
    }

    return cards
  })
}
```

Expected: Chromium과 WebKit 모두 세 카드 배열을 반환한다. 제목 폭은 345px, 줄바꿈 경계는 공백, 첫 줄은 두 줄 제목에서 75% 이상, 가로 overflow와 요소 겹침은 0이다.

- [ ] **Step 4: 720·721·1020·1440px 회귀 검증**

두 세션 각각에서 다음 코드를 실행한다.

```js
async page => {
  const results = []

  for (const width of [720, 721, 1020, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.reload()

    results.push(await page.evaluate(viewportWidth => {
      const titles = [...document.querySelectorAll(".post-card-title")]
      const links = [...document.querySelectorAll(".post-card-title-link")]
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth

      if (overflow !== 0) throw new Error(`${viewportWidth}: overflow ${overflow}`)
      if (titles.some(title => getComputedStyle(title).textWrap !== "wrap")) {
        throw new Error(`${viewportWidth}: unexpected text-wrap`)
      }
      if (links.some(link => getComputedStyle(link).wordBreak !== "keep-all")) {
        throw new Error(`${viewportWidth}: unexpected word-break`)
      }

      return { viewportWidth, overflow, titleCount: titles.length }
    }, width))
  }

  return results
}
```

Expected: 두 엔진의 네 viewport 모두 `overflow: 0`, `titleCount: 3`을 반환한다.

- [ ] **Step 5: 진단 세션 정리와 최종 상태 확인**

```bash
playwright-cli -s=title-chromium close
playwright-cli -s=title-webkit close
```

프로덕션 서버 세션에는 `Ctrl-C`를 보내고 다음을 실행한다.

```bash
git status --short --branch
git log --oneline -3
```

Expected: 브라우저·서버가 종료되고 브랜치는 `fix/38-mobile-post-card-title-wrap`이며 working tree가 깨끗하다. 설계 커밋, 계획 커밋, TDD 수정 커밋이 최근 이력에 존재한다. push·PR·배포·이슈 종료는 수행하지 않는다.
