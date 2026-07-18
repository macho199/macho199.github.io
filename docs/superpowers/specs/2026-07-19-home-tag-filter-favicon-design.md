# Developer Blog 홈 태그 필터·게시글 수·favicon 설계

## 목적

현재 Gatsby 홈 목록에 실제 MDX 태그를 이용한 단일 선택 필터와 필터 결과 수를 추가한다. GitHub 프로필 이미지를 로컬 favicon으로 제공해 외부 이미지 요청 없이 사이트 식별성을 보완한다.

## 사용자 결과

- 홈 목록 위에서 `전체` 또는 태그 하나를 선택해 해당 게시글만 즉시 볼 수 있다.
- 목록 오른쪽 위에서 현재 표시되는 게시글 수를 확인할 수 있다.
- 모든 페이지의 브라우저 탭에 GitHub 프로필 이미지 기반 favicon이 표시된다.

## 범위

### 포함

- 전체 게시글 태그에서 중복을 제거한 필터 목록 생성
- `전체` 또는 태그 하나만 선택하는 클라이언트 필터
- 선택 결과에 따라 바뀌는 게시글 목록과 `N post/posts` 표시
- 필터 결과가 없을 때의 빈 상태
- PC 2열 toolbar와 모바일 1열 배치
- GitHub 프로필 이미지의 로컬 favicon 제공
- 정적 HTML, 상호작용, 반응형, 접근성 검증

### 제외

- 검색어 입력창과 제목·본문 전문 검색
- 여러 태그 동시 선택과 AND/OR 규칙
- URL 쿼리, 브라우저 이력, 필터 공유 링크
- `/tags/<tag>/` 정적 페이지와 태그별 SEO
- 태그 더보기·접기
- 페이지네이션과 관련 글
- 카드 내부 태그의 클릭 기능
- Apple touch icon, web manifest, PWA
- Open Graph·Twitter 공유 이미지 변경

## 참조 원본

- 홈 UI 원본: Luna `archive/developer-blog/ui/index-reference-2026-07-19.html`
  - SHA-256: `e9e790978f2d1ae782ab4557e5dbafc3bcd8d08abb467c1da1f98f001ff1a40e`
- favicon 원본: Luna `archive/developer-blog/assets/github-macho199-avatar-2026-07-19.png`
  - 출처: `https://github.com/macho199`
  - 크기: 128×128 PNG
  - SHA-256: `e9d4b8b644138993aaf0d6c9904613a3ae820881bed5d03d07eb1032e549693b`

원본은 편집하지 않는다. favicon 배포본은 코드 저장소의 `static/favicon.png`에 별도 복사한다.

## 컴포넌트와 모듈 경계

### `IndexPage`

- 기존 `allMdx` GraphQL 쿼리와 발행일 내림차순 정렬을 유지한다.
- GraphQL 결과를 `PostSummary[]`로 변환해 `PostList`에 전달한다.
- 태그 필터 상태나 favicon 표현 책임을 갖지 않는다.

### 태그 필터 순수 모듈

- 게시글 배열에서 고유 태그를 추출한다.
- 최신 게시글부터 처음 등장한 순서를 유지한다.
- 태그 비교는 frontmatter 문자열의 정확한 일치로 처리한다.
- `전체`는 데이터 태그가 아니라 UI가 소유하는 기본 선택값이다.
- 선택 태그에 맞는 게시글을 반환한다.

태그 추출과 필터는 React와 분리한 순수 함수로 두어 Node 테스트에서 직접 검증한다.

### `PostList`

- 전체 게시글과 현재 선택 태그 상태를 소유한다.
- 고유 태그와 필터 결과는 게시글과 선택값에서 계산하며 중복 상태로 저장하지 않는다.
- 기본 선택은 `전체`다.
- `PostFilterBar`에 필터 데이터와 변경 콜백을 전달한다.
- 필터된 게시글만 기존 `PostCard`에 전달한다.
- 카드 내부 태그는 상호작용 없는 정보로 유지한다.

### `PostFilterBar`

- `전체`와 고유 태그를 버튼으로 렌더링한다.
- 현재 선택, 결과 수, 선택 콜백만 props로 받는다.
- 게시글 데이터 조회와 필터 계산을 하지 않는다.
- 결과 수는 1이면 `1 post`, 나머지는 `N posts`로 표시한다.

### `Seo`

- 모든 페이지 Head에 로컬 `/favicon.png`를 가리키는 `link[rel="icon"]`을 한 번 렌더링한다.
- 원격 GitHub avatar URL을 런타임에 요청하지 않는다.
- 기존 title, description, canonical, Open Graph, Twitter 메타데이터는 변경하지 않는다.

## 데이터와 상태 흐름

```text
MDX frontmatter.tags
  -> IndexPage GraphQL(발행일 내림차순)
  -> PostList(posts)
  -> 고유 태그 추출
  -> PostFilterBar(태그·선택값·결과 수)
  -> 태그 버튼 선택
  -> PostList selectedTag 변경
  -> 필터 결과 계산
  -> 결과 수·PostCard 목록 갱신
```

- URL은 바뀌지 않는다.
- 페이지를 새로 열거나 새로고침하면 `전체`로 시작한다.
- Gatsby 정적 HTML은 기본 상태인 전체 게시글과 전체 개수를 포함한다.
- JavaScript가 실행되지 않아도 전체 게시글은 읽을 수 있다.

## 화면 규칙

### PC

- 기존 920px 공통 컨테이너를 유지한다.
- 목록 바로 위 toolbar는 `minmax(0, 1fr) auto` 2열이다.
- 태그 필터는 왼쪽, 결과 수는 오른쪽 위에 둔다.
- `전체`는 `#` 없이, 태그 버튼은 시각적으로 `#` 접두사를 사용한다.
- 태그는 모두 표시하고 공간이 부족하면 자연스럽게 줄바꿈한다.

### 모바일

- 720px 이하에서 toolbar를 1열로 바꾼다.
- 태그는 여러 줄로 자연스럽게 감싼다.
- 결과 수는 태그 아래 오른쪽에 정렬한다.
- 390px에서 페이지 가로 넘침이 없어야 한다.

### 상태 표현

- 선택 태그는 글자색, 굵기, 연초록 밑줄을 함께 사용한다.
- hover와 keyboard focus는 기존 디자인 토큰과 focus ring을 재사용한다.
- 목록 카드, 태그, 구분선, 날짜의 기존 표현은 바꾸지 않는다.
- 필터 결과가 없으면 `선택한 태그에 해당하는 글이 없습니다.`를 표시한다.

## 접근성

- toolbar는 `aria-label="글 필터"`를 갖는다.
- 태그 버튼 그룹은 `aria-label="태그 필터"`를 갖는다.
- 각 버튼은 native `button`과 `aria-pressed`로 단일 선택 상태를 전달한다.
- 결과 수는 `role="status"`와 `aria-live="polite"`로 변경을 알린다.
- 키보드만으로 모든 태그를 선택하고 기존 목록 링크로 이동할 수 있어야 한다.
- 활성 상태는 색상만으로 구분하지 않는다.
- 기존 숨김 홈 제목, `ol > li > article`, `time` 구조를 유지한다.

## 빈 상태와 방어 규칙

- 게시글이 0개면 결과 수는 `0 posts`이며 기존 `아직 게시글이 없습니다.`를 표시한다.
- 게시글이 없으면 태그 버튼 그룹은 렌더링하지 않는다.
- 고유 태그 목록은 빈 문자열 태그를 제외한다. 필수 frontmatter 오류 자체는 기존 Gatsby 스키마 검증에 맡긴다.
- 선택값에 없는 태그가 들어오면 전체 목록으로 안전하게 복귀한다.
- 태그 선택은 목록 순서를 바꾸지 않고 기존 발행일 내림차순을 유지한다.

## 검증

### 자동 검증

- 고유 태그의 중복 제거와 최초 등장 순서를 순수 함수 테스트로 확인한다.
- `전체`, 정확한 태그, 존재하지 않는 태그의 필터 결과를 확인한다.
- `PostFilterBar`의 native button, `aria-pressed`, status 영역 계약을 확인한다.
- `PostList`가 기본 전체 목록, 선택 목록, 빈 상태를 구성하는 경계를 확인한다.
- 프로덕션 홈 HTML에 실제 고유 태그, `3 posts`, 전체 게시글이 포함되는지 확인한다.
- 모든 생성 페이지의 Head에 favicon 링크가 한 번 존재하는지 확인한다.
- `/favicon.png`가 빌드 산출물에 존재하고 원본과 동일한 체크섬인지 확인한다.
- 기존 test, typecheck, Gatsby production build, 정적 verifier를 모두 통과한다.

### 브라우저 검증

- 1440px에서 필터 왼쪽·결과 수 오른쪽 배치와 기존 목록 폭을 확인한다.
- 태그 선택 시 해당 게시글만 남고 결과 수와 `aria-pressed`가 함께 갱신되는지 확인한다.
- `전체` 선택 시 원래 발행일 순서와 전체 개수로 복귀하는지 확인한다.
- 키보드 focus와 Enter/Space 선택을 확인한다.
- 720px·390px에서 toolbar 1열, 태그 줄바꿈, 결과 수 오른쪽 정렬, 가로 넘침 없음을 확인한다.
- 홈·대표 게시글에서 favicon 링크와 `/favicon.png` HTTP 200을 확인한다.
- 브라우저 네트워크에 `avatars.githubusercontent.com` 요청이 없는지 확인한다.

favicon은 브라우저 캐시가 강하므로 탭 아이콘의 육안 확인만 완료 근거로 사용하지 않는다. 생성 HTML의 link, 정적 파일, HTTP 응답을 함께 검증한다.

## 완료 조건

- 첨부 홈 시안과 같은 위치에 단일 선택 태그 필터와 동적 게시글 수가 표시된다.
- 현재 3개 게시글의 실제 태그와 결과 수가 정확하다.
- 필터가 URL과 게시글 원본 순서를 변경하지 않는다.
- GitHub 프로필 이미지의 로컬 복사본이 모든 페이지의 favicon으로 제공된다.
- JavaScript 비활성 기본 HTML에서 전체 게시글을 읽을 수 있다.
- 접근성·반응형·회귀 검증을 통과한다.
- 태그 필터·favicon을 위한 신규 런타임 패키지는 추가하지 않는다.

## 작업 관리

- 완료된 UI 재구축 이슈와 분리해 새 Redmine feature와 대표 GitHub issue를 만든다.
- 구현은 `feature/home-tag-filter-favicon` 브랜치에서 진행한다.
- 구현·로컬 검증·종성님 확인·Codex 리뷰·명시적 병합 승인 순서를 따른다.
- GitHub Pages 배포는 후속 출시 시점에 `develop → main` 흐름으로 묶는다.
