# Developer Blog 공통 상단 이동 버튼 설계

## 목적

index의 게시글 목록과 post 본문이 길어졌을 때 현재 읽던 위치에서 페이지 맨 위로 빠르게 돌아갈 수 있게 한다. 버튼은 아래로 읽는 동안 콘텐츠를 방해하지 않고, 사용자가 위로 돌아가려는 의도를 보일 때만 나타나게 한다.

## 사용자 결과

- index와 post에서 한 화면 이상 내려간 뒤 위로 스크롤하면 상단 이동 버튼을 사용할 수 있다.
- 아래로 글을 읽는 동안 버튼이 보이지 않아 콘텐츠 집중을 방해하지 않는다.
- 버튼을 누르면 현재 위치와 관계없이 정확히 1초를 기준으로 상단까지 이동한다.
- PC, Android 계열 모바일, iPhone Safari에서 같은 규칙으로 동작한다.
- 키보드와 모션 감소 설정을 사용하는 사람도 동등하게 사용할 수 있다.

## 현재 구조

- `Layout`은 index와 post가 공유하며 `Header`, `main`, `Footer`를 조합한다.
- 404 페이지는 `Layout`을 사용하지 않으므로 공통 버튼 적용 대상이 아니다.
- post의 목차는 `IntersectionObserver`로 현재 제목만 추적한다. window 스크롤 방향이나 공통 페이지 제어는 담당하지 않는다.
- `theme.css`는 `prefers-reduced-motion: reduce`에서 CSS 전환과 애니메이션을 사실상 제거한다.
- 현재 상단 이동 버튼이나 공통 window scroll listener는 없다.

## 범위

### 포함

- 공통 `ScrollToTopButton` 컴포넌트
- `Layout`을 사용하는 모든 일반 페이지에 자동 적용
- 한 화면 높이 이후의 위·아래 스크롤 방향 감지
- 위로 16px 연속 이동한 경우에만 버튼 노출
- 정확히 1,000ms를 기준으로 하는 사용자 정의 상단 이동
- 사용자 입력에 의한 이동 취소
- 모션 감소 환경의 즉시 이동
- 키보드 접근 이름과 실행 후 포커스 복구
- 824px PC 콘텐츠와 모바일 콘텐츠의 오른쪽 선에 맞춘 고정 위치
- iPhone 안전 영역
- index·post 정적 산출물 및 Chromium·WebKit 검증

### 제외

- 스크롤 진행률 표시
- post 목차와의 상태 공유
- URL hash·history 변경
- 마지막 스크롤 위치 저장
- localStorage·sessionStorage 사용
- 404 페이지 적용
- 외부 아이콘·애니메이션 패키지 추가

## 선택한 접근

`ScrollToTopButton`이 노출 판단, 방향 감지, 상단 이동, 입력 취소를 모두 소유하고 `Layout`에서 한 번 렌더링한다.

이 구조를 선택한 이유는 다음과 같다.

- index와 post가 같은 인스턴스를 사용해 동작이 어긋나지 않는다.
- 짧은 페이지에서는 임계 위치에 도달하지 않아 자동으로 계속 숨겨진다.
- 목차의 제목 추적 책임과 공통 페이지 이동 책임을 분리한다.
- React effect 안에서 listener와 animation frame의 수명주기를 함께 정리할 수 있다.
- 향후 `Layout`을 사용하는 일반 페이지가 추가돼도 별도 연결 없이 같은 탐색 기능을 얻는다.

## 제외한 접근

### 감지 hook과 버튼 분리

여러 소비자가 서로 다른 UI로 같은 감지 상태를 사용할 때는 유용하다. 현재 소비자는 `Layout` 하나이고 표시와 동작도 한 묶음이므로 파일과 인터페이스만 늘어난다.

### post 목차에 통합

목차는 1321px 이상에서만 보이지만 버튼은 index와 모바일에서도 필요하다. 숨겨진 목차가 사이트 공통 스크롤을 관리하면 책임과 표시 범위가 맞지 않는다.

### `gatsby-browser.js`에서 DOM 직접 제어

React 밖에서 버튼과 접근성 상태를 직접 관리해야 하며 route 전환·listener 정리·테스트 경계가 불명확해진다.

## 컴포넌트 경계

### `ScrollToTopButton`

- 초기 상태는 숨김이다.
- button DOM은 유지해 CSS 진입·퇴장 전환을 가능하게 한다.
- 숨김 상태에서는 `aria-hidden="true"`, `tabIndex={-1}`, `visibility: hidden`, `pointer-events: none`을 함께 사용한다.
- 노출 상태에서는 native `button`과 `aria-label="페이지 맨 위로 이동"`을 제공한다.
- 화살표는 로컬 SVG로 렌더링하고 `aria-hidden="true"`, `focusable="false"`를 지정한다.
- scroll·resize listener, 감지용 animation frame, 이동용 animation frame을 모두 소유하고 정리한다.

### `Layout`

- `Header`, `main`, `Footer`의 기존 순서와 데이터 경계를 유지한다.
- `ScrollToTopButton`을 한 번 렌더링한다.
- 페이지별 활성화 prop은 추가하지 않는다.
- 404는 `Layout` 밖에 있으므로 기존처럼 버튼이 없다.

### post 목차

- 현재 제목 추적과 anchor 이동을 그대로 유지한다.
- 상단 이동 버튼의 상태·listener·animation을 참조하지 않는다.

## 노출 상태 규칙

### 상수

- 노출 가능 위치: `window.scrollY > window.innerHeight`
- 연속 위쪽 이동 임계값: 16px
- 상단 이동 시간: 1,000ms

### 초기화

- hydration 후 현재 `scrollY`를 마지막 위치로 기록한다.
- 현재 위치가 한 화면 높이 이내면 숨김을 유지한다.
- 브라우저가 복원한 위치에서 시작하더라도 위로 16px 움직이기 전에는 표시하지 않는다.

### scroll 처리

- window scroll listener는 `passive: true`로 등록한다.
- listener는 좌표 계산을 직접 반복하지 않고 감지용 `requestAnimationFrame`을 한 번만 예약한다.
- 같은 frame 안에 들어온 추가 scroll 이벤트는 기존 예약에 합친다.
- 현재 위치가 한 화면 높이 이내면 버튼을 숨기고 위쪽 누적값을 0으로 만든다.
- 현재 위치가 이전 위치보다 아래면 버튼을 즉시 숨기고 위쪽 누적값을 0으로 만든다.
- 현재 위치가 이전 위치보다 위면 이동량을 위쪽 누적값에 더한다.
- 위쪽 누적값이 16px 이상이면 버튼을 표시한다.
- 스크롤을 멈추면 현재 표시 상태를 유지한다.
- 방향이 다시 아래로 바뀌면 숨김 규칙을 즉시 적용한다.

### resize 처리

- viewport 높이가 바뀌면 현재 위치를 새 `innerHeight`와 다시 비교한다.
- 새 기준에서 상단 영역이면 버튼을 숨기고 누적값을 초기화한다.
- resize만으로 숨김 버튼을 강제로 표시하지 않는다.

## 상단 이동 애니메이션

### 기본 경로

- 클릭 시 진행 중인 이동 frame이 있으면 취소한 뒤 현재 위치에서 다시 시작한다.
- 시작 시각과 시작 `scrollY`를 기록한다.
- 각 animation frame에서 `elapsed / 1000`을 0~1로 제한한다.
- 초반에 빠르게 이동하고 마지막에 감속하는 `ease-out` 곡선을 적용한다.
- 첫 frame부터 계산한 위치를 `window.scrollTo(0, nextY)`로 반영한다.
- 시작 후 1,000ms 이상인 첫 frame에서 최종 위치를 0으로 고정하고 종료한다.
- frame 스케줄링 특성상 실제 완료 콜백은 1,000ms 직후의 첫 화면 갱신에서 실행된다.

### 모션 감소

- `window.matchMedia("(prefers-reduced-motion: reduce)")`가 참이면 animation frame을 시작하지 않는다.
- `window.scrollTo(0, 0)`으로 즉시 이동하고 완료 처리를 실행한다.

### 사용자 입력 취소

- 이동 중 `wheel`, `touchstart`, `pointerdown`이 발생하면 animation frame을 취소한다.
- `ArrowUp`, `ArrowDown`, `PageUp`, `PageDown`, `Home`, `End`, `Space` 키 입력도 취소 조건이다.
- 취소는 사용자의 새 입력을 막지 않으며 `preventDefault`를 호출하지 않는다.
- 취소 후 버튼 노출 상태는 이후 scroll 감지 규칙에 맡긴다.

### 포커스

- pointer로 실행한 경우 스크롤 위치만 바꾸고 포커스를 강제로 이동하지 않는다.
- keyboard로 실행한 경우 완료 후 `.site-logo`에 `focus({ preventScroll: true })`를 적용한다.
- keyboard 실행 여부는 `clickEvent.detail === 0`으로 구분한다.
- 이동이 사용자 입력으로 취소되면 포커스를 상단으로 옮기지 않는다.

## 시각 표현

### 기본

- 크기는 44×44px다.
- 원형, 흰 배경, 1px 테두리, 은은한 그림자를 사용한다.
- 화살표는 현재 블로그의 연초록 accent를 사용한다.
- 중앙 콘텐츠 영역의 우측 하단에 `position: fixed`로 둔다.
- 버튼의 오른쪽 끝을 콘텐츠의 오른쪽 선에 맞춰 본문을 가리는 면적을 최소화한다.
- 기존 헤더보다 위에 표시되는 명시적 z-index를 사용한다.

### 위치

- 1021px 이상 PC에서는 920px 컨테이너의 좌·우 48px 여백을 제외한 824px 콘텐츠 오른쪽 선에 버튼의 오른쪽 끝을 맞춘다.
- 721~1020px에서는 현재 24px 태블릿 컨테이너 여백을 따라 같은 우측 선을 유지한다.
- 720px 이하에서는 24px 폰 컨테이너 여백에 `env(safe-area-inset-right, 0px)`를 더해 정렬한다.
- 하단 간격은 721px 이상 24px, 720px 이하 16px에 `env(safe-area-inset-bottom, 0px)`를 더한 값을 유지한다.
- post 목차는 본문 오른쪽 밖에서 시작하므로 버튼과 가로 위치가 겹치지 않는다.

### 상태

- 숨김: `opacity: 0`, `visibility: hidden`, `translateY(8px)`, pointer 비활성
- 노출: `opacity: 1`, `visibility: visible`, 원래 위치, pointer 활성
- hover: 테두리와 화살표 강조
- active: `scale(0.92)`로 눌림 피드백
- focus-visible: 전역 focus ring 유지
- CSS 진입·퇴장은 기존 motion token을 사용한다.
- 모션 감소 환경에서는 기존 `theme.css` 규칙에 따라 전환 시간이 제거된다.

## 접근성

- 최소 44×44px target을 보장한다.
- icon-only 버튼의 accessible name은 `페이지 맨 위로 이동`으로 고정한다.
- 숨김 상태는 접근성 트리와 Tab 순서에서 함께 제외한다.
- 키보드 Enter·Space로 native button을 실행할 수 있다.
- keyboard 실행 후 버튼이 사라져도 포커스가 유실되지 않게 상단 로고로 이동한다.
- 모션 감소 설정을 애니메이션보다 우선한다.
- 사용자 입력으로 애니메이션을 언제든 중단할 수 있다.

## 경계 상황

- 문서 높이가 한 화면 이하이면 버튼은 계속 숨겨진다.
- 한 화면보다 조금 긴 문서도 `scrollY > innerHeight`에 도달하지 못하면 표시하지 않는다.
- 브라우저의 이전 위치 복원만으로 버튼을 표시하지 않는다.
- 위로 16px 미만의 트랙패드·터치 흔들림은 표시 조건에 포함하지 않는다.
- animation 도중 다시 클릭하면 현재 위치에서 새로운 1초 이동을 시작한다.
- route 전환이나 컴포넌트 해제 시 모든 listener와 animation frame을 정리한다.
- JavaScript가 실행되지 않으면 버튼은 숨겨진 채 남고 기존 index·post 탐색은 그대로 동작한다.

## 검증

### 계약 테스트

- `ScrollToTopButton`이 native button, 접근 이름, 장식 SVG, 숨김 접근성 속성을 제공하는지 확인한다.
- `Layout`이 버튼을 한 번만 렌더링하는지 확인한다.
- 404가 `Layout`을 사용하지 않는 현재 경계를 유지하는지 확인한다.
- 임계 위치, 16px 위쪽 누적, 아래 방향 즉시 숨김, 1,000ms 상수를 고정한다.
- scroll listener의 passive 등록, animation frame 병합, cleanup 계약을 확인한다.
- 모션 감소, 사용자 입력 취소, keyboard 완료 포커스 계약을 확인한다.
- CSS 크기·콘텐츠 우측 정렬·고정 위치·safe area·숨김·노출·hover·active 상태를 확인한다.

### 프로덕션 산출물

- index와 각 post HTML에 상단 이동 버튼이 한 번 존재하는지 확인한다.
- 404 HTML에는 버튼이 없는지 확인한다.
- 기존 header·main·footer·목차·게시글 필터 산출물 계약을 유지한다.

### 브라우저

- Chromium과 WebKit에서 index와 post를 각각 확인한다.
- PC와 모바일 viewport에서 첫 화면과 아래 방향 스크롤 중에는 숨김인지 확인한다.
- 한 화면 이상 내려간 뒤 위로 15px까지 숨김, 누적 16px에서 노출되는지 확인한다.
- 노출 후 아래로 스크롤하면 즉시 숨는지 확인한다.
- 클릭 후 1,000ms 기준으로 상단에 도착하고 버튼이 숨는지 확인한다.
- 이동 중 wheel·touch·pointer·keyboard 입력으로 취소되는지 확인한다.
- 모션 감소 환경에서는 즉시 상단에 도착하는지 확인한다.
- keyboard 실행 후 `.site-logo`가 focus를 받는지 확인한다.
- PC에서 824px 콘텐츠 오른쪽 선, 태블릿·모바일에서 현재 컨테이너 오른쪽 여백과 버튼이 정렬되는지 확인한다.
- post 목차와 버튼이 겹치지 않는지 확인한다.
- 모바일 safe area와 페이지 가로 overflow 0을 확인한다.

## 완료 조건

- index와 post에서 승인된 방향·거리 규칙으로 버튼이 노출·숨김된다.
- 버튼은 중앙 콘텐츠 오른쪽 선과 정렬된 하단 위치에서 44×44px 원형 UI로 동작한다.
- 일반 환경에서는 1,000ms 기준 상단 이동, 모션 감소 환경에서는 즉시 이동한다.
- 사용자 입력 취소와 keyboard 포커스 복구가 동작한다.
- 404와 기존 페이지 데이터·목차·필터·URL 동작은 변하지 않는다.
- 신규 런타임 패키지를 추가하지 않는다.

## 작업 관리

- 구현 브랜치: `feat/scroll-to-top-button`
- 설계 문서 검토가 끝난 뒤 작업 추적 이슈와 구현계획을 별도 단계로 만든다.
- 구현·로컬 검증·종성님 확인·Codex 리뷰·명시적 병합 승인 순서를 따른다.
- 배포는 후속 `develop → main` 출시 흐름에서 진행한다.
