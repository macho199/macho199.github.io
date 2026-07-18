# Developer Blog 현재 Gatsby 재구축 글 전환 설계

## 목적

기존 `Gatsby로 블로그 사이트 만들기 1편 - 시작하기`를 2025년 글의 이전본이 아니라 현재 Gatsby 5 개발자 블로그를 새로 구축한 기록으로 다시 작성한다. 입사지원서에서 읽는 사람이 실제 저장소의 구조·문제 해결·검증 근거를 글과 함께 확인할 수 있어야 한다.

## 고정 메타데이터

- 제목은 `Gatsby로 블로그 사이트 만들기 1편 - 시작하기`를 유지한다.
- slug는 `gatsby-blog-1-getting-started`를 유지한다.
- 공개 경로는 `/posts/gatsby-blog-1-getting-started/`를 유지한다.
- `publishedAt`은 사용자가 지정한 `2026-04-18`로 변경한다.
- 설명은 `배포 산출물만 남은 GitHub Pages 블로그를 Gatsby 5 소스로 재구축하며 Tailwind CSS 4의 Preflight 회귀와 접근성 문제를 해결한 과정을 정리합니다.`로 변경한다.
- 기존 태그 `Gatsby`, `GitHub Pages`, `React`, `Tailwind CSS`는 유지한다.

## 서술 범위

### 포함

- 배포 산출물만 남은 기존 저장소를 유지보수 가능한 Gatsby 소스 저장소로 전환한 이유
- 기존 `main`과 공개 사이트를 유지하면서 `develop`에서 새 소스를 통합한 경계
- Gatsby 5.16.1, Node.js 24.14.1, npm 11.11.0과 lockfile을 고정한 재현성 기준
- MDX 기반과 Tailwind 기반을 서로 독립된 단계로 구축한 흐름
- Tailwind CSS 4.3.3, `@tailwindcss/postcss` 4.3.3, PostCSS 8.5.19, `gatsby-plugin-postcss` 6.16.0의 실제 구성
- `postcss.config.cjs`의 `@tailwindcss/postcss` 등록
- `theme.css`의 `@import "tailwindcss" source("../");`와 `@theme inline` 경계
- Tailwind Preflight가 제목 크기, 목록 마커, 링크 식별성을 초기화한 실제 문제
- 전역 의미 기본값과 `.mdx-content` 범위 스타일로 문서 표현을 복원한 방법
- 기본 링크와 hover 색상을 브랜드 강조색과 분리하고 흰 배경 대비 4.5:1 이상을 테스트한 방법
- Noto Serif KR·Noto Sans KR를 저장소에서 자체 제공하고 실제 굵기만 불러온 구성
- 테스트, 타입 검사, 프로덕션 빌드, 스타일 산출물 검증으로 완료를 판단한 기준
- GitHub Actions 배포는 아직 구현 전이라는 현재 경계

### 제외

- 2025년 원문을 재검증했다는 안내
- 2025년 starter 선택과 당시 개발 서버 흐름
- 과거 Tailwind PostCSS 오류와 `@mdx-js/react` 다운그레이드 이야기
- `text-red-500` 임시 확인 화면과 과거 스크린샷
- `public/`을 `main` 루트에 복사한 과거 수동 배포 절차
- 아직 구현하지 않은 GitHub Actions 배포의 구체적인 사용법이나 완료 주장
- React SSR 한글 NUL 손상 문제. 이는 Tailwind 문제와 별도 주제다.
- 목차, 코드 복사, 읽기 시간, 이전·다음 글 등 아직 구현하지 않은 포스트 기능

## 글 구조

1. **왜 다시 구축했는가**
   - 기존 저장소에는 배포 산출물만 남아 있었다.
   - 공개 사이트를 멈추지 않기 위해 기존 이력을 보존하고 새 Gatsby 소스는 `develop`에서 통합했다.
2. **재현 가능한 Gatsby 5 기준선**
   - 런타임·패키지 관리자·직접 의존성·lockfile을 고정했다.
   - 생성 산출물과 비밀정보 파일은 Git에서 제외했다.
3. **MDX와 Tailwind를 별도 단계로 연결**
   - MDX는 콘텐츠 소싱과 페이지 생성 경계를 소유한다.
   - Tailwind는 PostCSS·디자인 토큰·Preflight 경계를 소유한다.
   - MDX 버전 변경을 Tailwind 오류 해결책으로 설명하지 않는다.
4. **Preflight 이후 깨진 문서 의미 복원**
   - 제목 크기, 목록 마커, 링크 식별성이 사라진 증상을 보여준다.
   - 전역 의미 기본값과 `.mdx-content` 범위 규칙을 분리해 복원한다.
   - 링크 색상 대비를 수치와 자동 테스트로 고정한다.
5. **폰트와 외부 의존성 경계**
   - Noto KR를 자체 제공하고 외부 폰트 요청을 만들지 않는다.
   - 실제 사용하는 굵기만 진입점에서 불러온다.
6. **검증과 현재 상태**
   - 소스 계약 테스트, 타입 검사, 프로덕션 빌드, 정적 산출물 검증을 정리한다.
   - 자동 배포는 다음 단계이며 현재 완료 범위에 포함하지 않는다.

## 기존 이미지 처리

- 본문에서 다음 과거 이미지 두 장의 참조를 제거한다.
  - `hello-gatsby-tailwindcss.png`
  - `github-pages-setting.png`
- 이미지 파일 자체는 이번 변경에서 삭제하지 않는다.
- 삭제가 필요하면 정확한 경로를 사용자에게 알리고 별도 확인을 받은 뒤 처리한다.

## 기존 GitHub #18 범위와의 관계

- 기존 #18의 포스트 읽기 화면, 제목·slug·SEO·반응형 UI 경계는 유지한다.
- 기존 #18에 있던 2025년 글 이전과 이미지 두 장 노출 조건은 이번 사용자 지시로 대체한다.
- 새 설계는 콘텐츠와 콘텐츠 검증 기준만 바꾸며 포스트 UI 구현 범위를 넓히지 않는다.
- GitHub 이슈 본문은 외부 쓰기이므로 이번 로컬 변경에서 자동 수정하지 않는다.

## 테스트와 검증 변경

- 콘텐츠 계약 테스트는 다음을 확인한다.
  - `publishedAt`이 `2026-04-18`이다.
  - 제목·slug·태그가 유지된다.
  - `2025`, 과거 오류 메시지, MDX 다운그레이드, `text-red-500`, 과거 수동 배포 설명이 없다.
  - 실제 Tailwind 버전과 PostCSS 구성, Preflight 복원, 링크 대비 검증이 설명된다.
  - GitHub Actions 배포를 완료된 작업으로 표현하지 않는다.
- 포스트 산출물 검증기는 과거 이미지 존재와 대체 텍스트 요구를 제거한다.
- 포스트 산출물 검증기는 현재 글의 주요 제목·설정·검증 근거와 SEO 메타데이터를 확인한다.
- 홈 검증기는 변경된 설명과 `2026-04-18` 날짜를 기준으로 갱신한다.
- 다음 명령을 실행한다.
  - `npm test`
  - `npm run typecheck`
  - `npm run build`
  - `npm run verify:styles`
  - `npm run verify:layout`
  - `npm run verify:home`
  - `npm run verify:post`
- `npm run clean`은 `.cache/`와 `public/`을 삭제하므로 사용자 확인 없이 실행하지 않는다.

## 완료 조건

- 글 전체가 현재 Gatsby 5 재구축 기록으로 읽힌다.
- 2025년 원문과 과거 수동 배포 흐름이 남지 않는다.
- Tailwind 문제와 수정 내용이 실제 코드·커밋·테스트와 일치한다.
- 과거 이미지가 본문에 노출되지 않는다.
- 기존 제목·slug·공개 경로는 유지된다.
- 공개일은 `2026-04-18`로 표시된다.
- 테스트·타입 검사·일반 프로덕션 빌드·정적 산출물 검증이 통과한다.
- 자동 배포를 아직 완료하지 않았다는 경계가 명확하다.
