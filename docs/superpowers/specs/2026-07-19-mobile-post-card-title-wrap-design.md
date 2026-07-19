# Developer Blog 모바일 포스트 카드 제목 줄바꿈 설계

## 목적

모바일 홈에서 포스트 카드 제목이 사용 가능한 가로 폭을 남긴 채 두 줄 길이를 비슷하게 맞추거나 한국어 단어 중간에서 갈라지는 문제를 해결한다. 카드 제목은 한 줄의 사용 가능한 폭을 우선 채우고, 공간이 부족할 때 단어 단위로 자연스럽게 줄바꿈한다.

## 사용자 결과

- 모바일에서 포스트 카드 제목이 카드의 실제 가로 폭을 충분히 사용한다.
- `사이트`, `만들기`, `3편` 같은 한국어 단어와 숫자·단위가 불필요하게 갈라지지 않는다.
- 제목 아래 태그·요약·날짜의 배치와 홈 필터 동작은 유지된다.
- 상세 포스트 제목과 다른 화면의 heading 표현은 바뀌지 않는다.

## 진단 근거

- 393px viewport에서 Chromium과 WebKit 모두 홈·목록·카드·제목 박스가 345px 전체 폭을 확보했고 문서 가로 overflow는 0이었다.
- 전역 `h1`~`h6` 규칙의 `text-wrap: balance`가 카드의 `h3.post-card-title`에도 상속됐다.
- 기존 카드 링크의 `overflow-wrap: anywhere`는 브라우저와 글꼴 폭에 따라 한국어 단어 내부를 줄바꿈 후보로 허용했다.
- 기존 상태에서 345px 제목 박스의 첫 줄 사용 폭은 약 167~201px였다.
- 브라우저 런타임에서 `text-wrap: wrap`만 적용하자 첫 줄 사용 폭이 약 327~344px로 늘어 조기 줄바꿈의 직접 원인이 확인됐다.
- `word-break: keep-all`과 `overflow-wrap: break-word`만 적용하면 단어 내부 분리는 줄지만 `balance`가 남아 첫 줄 폭은 약 184~214px에 머물렀다.

## 범위

### 포함

- `.post-card-title`의 카드 전용 일반 줄바꿈 규칙
- `.post-card-title-link`의 한국어 단어 보존과 긴 토큰 fallback
- CSS 계약 회귀 테스트
- Chromium·WebKit 393px 모바일 렌더링 검증
- PC·태블릿에서 기존 카드 폭과 가로 overflow 검증

### 제외

- 전역 `h1`~`h6`의 `text-wrap: balance` 변경
- 상세 포스트 `.post-title` 변경
- 포스트 제목·설명·태그 콘텐츠 변경
- 카드 글꼴·크기·굵기·행간·간격 변경
- 홈 필터·게시글 수·정렬·GraphQL 데이터 흐름 변경
- 배포와 `develop → main` 출시

## 스타일 규칙

### 카드 제목 컨테이너

- `.post-card-title`에 `text-wrap: wrap`을 명시해 전역 heading의 균형 줄바꿈을 카드 범위에서 해제한다.
- 현재 `min-width`, 글꼴, 크기, 굵기, 행간을 유지한다.
- 모바일 전용 media query가 아니라 카드 컴포넌트의 모든 viewport에 동일하게 적용한다. 카드 제목의 정보 밀도 원칙은 breakpoint와 무관하고, 넓은 화면의 한 줄 제목에는 시각적 변화가 없기 때문이다.

### 카드 제목 링크

- `.post-card-title-link`에 `word-break: keep-all`을 적용해 한국어 단어 내부 분리를 피한다.
- `overflow-wrap: anywhere`를 `overflow-wrap: break-word`로 교체해 정상 단어 경계를 우선하고, URL이나 매우 긴 토큰은 카드 폭 안에서 줄바꿈할 수 있게 한다.
- 링크 색상·밑줄·hover·focus 동작은 유지한다.

## 데이터와 컴포넌트 경계

- `PostCard`의 React 구조와 props는 변경하지 않는다.
- 제목 문자열을 가공하거나 non-breaking space를 삽입하지 않는다.
- 해결 책임은 `home.css`의 카드 전용 표현 규칙에 둔다.
- GraphQL query, 필터 상태, 게시글 정렬과 정적 페이지 생성은 변경하지 않는다.

## 오류·경계 상황

- 345px보다 긴 단일 영문·URL형 토큰은 `break-word` fallback으로 카드 밖 가로 overflow를 만들지 않는다.
- 일반 한국어 제목은 공백 단위 줄바꿈을 우선한다.
- 제목이 한 줄에 들어가면 기존 한 줄 높이를 유지한다.
- 두 줄 이상 제목도 카드·요약·날짜와 겹치지 않고 기존 grid gap을 유지한다.

## 검증

### TDD 계약

- 기존 CSS 계약 테스트에 카드 제목의 `text-wrap: wrap`을 먼저 요구해 현재 코드에서 실패하는지 확인한다.
- 같은 테스트에서 링크의 `word-break: keep-all`, `overflow-wrap: break-word`를 요구하고 `overflow-wrap: anywhere`가 없음을 확인한다.
- 최소 CSS 변경 후 해당 계약과 전체 테스트가 통과하는지 확인한다.

### 프로덕션 검증

- `npm test`, `npm run typecheck`, `npm run build`를 통과한다.
- `verify:styles`, `verify:layout`, `verify:home`, `verify:post`를 통과한다.
- 기존 홈 카드, 필터, 포스트 상세 정적 산출물 계약을 유지한다.

### 브라우저 검증

- Chromium과 WebKit의 393px viewport에서 제목 박스가 345px를 유지하는지 확인한다.
- 세 게시글의 첫 줄이 균형 배치 때문에 약 50~60% 폭에서 조기 종료되지 않는지 확인한다.
- `사이트`, `만들기`, `3편`이 줄 경계에서 내부 분리되지 않는지 확인한다.
- 720px·721px·1020px·1440px에서 페이지 가로 overflow가 0이고 카드의 태그·요약·날짜가 겹치지 않는지 확인한다.

## 완료 조건

- 홈 카드 제목이 사용 가능한 폭을 우선 사용하고 공간이 부족할 때만 자연스럽게 줄바꿈된다.
- 한국어 단어 내부의 불필요한 줄바꿈과 페이지 가로 overflow가 없다.
- 상세 포스트와 전역 heading 규칙, 홈의 데이터·상호작용은 유지된다.
- 신규 런타임 패키지를 추가하지 않는다.

## 작업 관리

- Redmine: http://localhost:8090/issues/30
- GitHub: https://github.com/macho199/macho199.github.io/issues/38
- 구현 브랜치: `fix/38-mobile-post-card-title-wrap`
- 구현·로컬 검증·종성님 확인·Codex 리뷰·명시적 병합 승인 순서를 따른다.
- 배포는 후속 `develop → main` 출시 흐름에서 진행한다.
