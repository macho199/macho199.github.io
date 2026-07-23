export type PortfolioLink = Readonly<{
  label: string
  url: `https://${string}`
}>

export type PortfolioProject = Readonly<{
  id: string
  title: string
  headline: string
  period: string
  contribution: string
  problem: string
  scaleAndConstraints: readonly string[]
  role: readonly string[]
  decisions: readonly string[]
  failureHandling: readonly string[]
  result: readonly string[]
  technologies: readonly string[]
  relatedLinks: readonly PortfolioLink[]
  webOrder: number
  pdfOrder: number | null
}>

export type Portfolio = Readonly<{
  name: string
  positioning: string
  updatedAt: `${number}-${number}-${number}`
  summary: readonly string[]
  coreTechnologies: readonly string[]
  metrics: readonly Readonly<{ value: string; label: string }>[]
  projects: readonly PortfolioProject[]
  additionalAchievements: readonly string[]
  workingStyle: readonly string[]
  links: readonly PortfolioLink[]
}>

export const portfolio = {
  name: "권종성",
  positioning: "17년 경력 시니어 백엔드 개발자｜레거시 현대화·대규모 데이터 전환",
  updatedAt: "2026-07-23",
  summary: [
    "17년간 채용 플랫폼과 채용 솔루션을 개발·운영한 백엔드 개발자입니다.",
    "C#·ASP.NET·MSSQL 기반 레거시부터 Java·Spring Boot·PostgreSQL·Kafka 기반 MSA까지 경험했습니다.",
    "운영 중인 서비스의 흐름을 유지하면서 데이터와 파일 저장 구조를 점진적으로 전환했습니다.",
    "원본과 이관 결과를 반복 비교하고 예외를 보정해 대규모 데이터의 정합성을 검증했습니다.",
  ],
  coreTechnologies: [
    "Java",
    "Spring Boot",
    "PostgreSQL",
    "MSSQL",
    "Kafka",
    "Redis",
    "AWS S3",
    "C#",
    "ASP.NET",
  ],
  metrics: [
    { value: "17년", label: "채용 플랫폼·솔루션 개발·운영" },
    { value: "약 800만 개", label: "서비스 중단 없는 첨부파일 전환" },
    { value: "1천만 건 이상", label: "이력서 데이터 정합성 검증" },
    { value: "0건", label: "최종 미해결 누락" },
  ],
  projects: [
    {
      id: "nas-to-s3",
      title: "이력서 첨부파일 NAS→S3 무중단 전환",
      headline: "서비스를 멈추지 않고 약 800만 개 첨부파일의 저장 구조를 전환",
      period: "2026.05~2026.07",
      contribution: "2인 팀 · 60%",
      problem: "약 800만 개 이력서 첨부파일을 서비스 중단 없이 NAS에서 AWS S3로 점진 전환해야 했습니다.",
      scaleAndConstraints: [
        "약 800만 개 파일을 약 20일간 24시간 점진 이관",
        "이관 기간에 기존 NAS와 신규 S3 데이터를 함께 조회",
        "기존 C#·ASP.NET 서비스의 파일 흐름을 유지",
      ],
      role: [
        "이관 대상 목록 조회 API 개발",
        "S3 Presigned URL 기반 업로드·다운로드 API 개발",
        "기존 서비스의 신규 API 연동 개발",
      ],
      decisions: [
        "S3 식별값 유무에 따라 S3 또는 기존 NAS를 선택하는 fallback 구조 적용",
        "Presigned URL 기반 API로 기존 서비스와 신규 저장소 연결",
      ],
      failureHandling: [
        "S3 식별값이 없는 기존 파일은 NAS에서 계속 조회",
        "기존 서비스와 신규 API를 함께 운영해 이관 중 파일 조회 호환성 유지",
      ],
      result: [
        "약 20일간 24시간 이관, 서비스 중단 없이 약 800만 개 전환",
      ],
      technologies: [
        "Java",
        "Spring Boot",
        "MSSQL",
        "AWS S3",
        "S3 Presigned URL",
        "C#",
        "ASP.NET",
      ],
      relatedLinks: [],
      webOrder: 1,
      pdfOrder: 1,
    },
    {
      id: "resume-migration",
      title: "알바몬 이력서 데이터 마이그레이션 정합성 검증",
      headline: "1천만 건 이상의 원본과 이관 결과를 비교·보정해 누락 제거",
      period: "2026.03~2026.04",
      contribution: "팀 프로젝트 · 30%",
      problem: "1천만 건 이상의 MSSQL 이력서 원본을 PostgreSQL로 옮긴 결과에서 누락과 불일치를 제거해야 했습니다.",
      scaleAndConstraints: [
        "1천만 건 이상의 MSSQL 원본과 PostgreSQL 이관 결과 비교",
        "DB와 Java의 대소문자 비교 기준 차이",
        "잘못 저장된 식별자로 인한 누락",
      ],
      role: [
        "원본과 이관 결과를 비교하는 정합성 검증 로직 설계",
        "누락과 불일치를 찾는 조회 쿼리 설계",
        "발견한 데이터 예외 보정",
      ],
      decisions: [
        "원본과 이관 결과를 반복 비교하는 검증 절차 적용",
        "발견한 데이터 예외를 원인별로 보정한 뒤 재검증",
      ],
      failureHandling: [
        "대소문자 비교 차이로 누락된 데이터 별도 탐지",
        "잘못 저장된 식별자를 찾아 보정하고 결과 재확인",
      ],
      result: [
        "1천만 건 이상 비교·보정, 최종 미해결 누락 0건",
      ],
      technologies: [
        "Java",
        "Spring Boot",
        "MSSQL",
        "PostgreSQL",
        "SQL",
        "Kafka",
      ],
      relatedLinks: [],
      webOrder: 2,
      pdfOrder: 2,
    },
    {
      id: "recommendation-load-test",
      title: "잡코리아 모바일 추천2.0 부하 시험 개선",
      headline: "500 TPS 시험에서 드러난 DB 연결 병목과 날짜 매핑 문제 개선",
      period: "2025.06~2025.08",
      contribution: "팀 프로젝트 · 30%",
      problem: "신규 추천 서비스의 부하 시험에서 발생한 DB 커넥션 풀 병목과 MSSQL 날짜 타입 매핑 문제를 해결해야 했습니다.",
      scaleAndConstraints: [
        "500 TPS 부하 시험에서 문제 재현과 원인 확인",
        "중복 내부 호출과 여러 DB 조회로 커넥션 사용 증가",
        "MSSQL 날짜 타입 매핑 문제 동시 발생",
      ],
      role: [
        "MSA 입문 개발자 2명 기술 지원과 코드 리뷰",
        "부하 시험 문제 원인 분석",
        "개선 코드 작성과 검증",
      ],
      decisions: [
        "중복 내부 호출을 Multi-get으로 통합",
        "여러 DB 조회를 하나의 트랜잭션으로 묶어 커넥션 사용 개선",
      ],
      failureHandling: [
        "커넥션 풀 병목과 날짜 타입 매핑 문제를 나누어 원인 분석",
        "개선 코드를 부하 시험으로 검증하고 해결 방법 공유",
      ],
      result: [
        "500 TPS 시험의 커넥션·날짜 매핑 원인 분석, Multi-get·트랜잭션 개선",
      ],
      technologies: [
        "Java",
        "Spring Boot",
        "MSSQL",
        "MSA",
      ],
      relatedLinks: [],
      webOrder: 3,
      pdfOrder: 3,
    },
    {
      id: "data-pulse",
      title: "data-pulse 공통 데이터 연동 기반",
      headline: "이기종 채용 서비스가 레거시 원본을 공통 구조로 참조하는 기반 마련",
      period: "2024.07~2024.10",
      contribution: "팀 프로젝트 · 30%",
      problem: "이기종 채용 서비스가 레거시 공고·이력서 원본을 공통 구조로 참조할 수 있는 기반이 필요했습니다.",
      scaleAndConstraints: [
        "연동 대상 서비스 4개의 서로 다른 도메인 구조 분석",
        "잡코리아·알바몬의 공고·이력서 원본 연결",
        "데이터 불일치 시 레거시 원장 확인 필요",
      ],
      role: [
        "공고·이력서 공통 도메인 정의",
        "서비스 간 통합 스키마 정의",
        "원장 확인용 레거시 MSSQL 조회 API 개발",
      ],
      decisions: [
        "연동 서비스가 함께 사용하는 공통 도메인과 통합 스키마 정의",
        "불일치 원인을 확인할 수 있도록 레거시 원장 조회 API 제공",
      ],
      failureHandling: [
        "데이터 불일치가 발생하면 레거시 원본을 조회해 원인 확인",
      ],
      result: [
        "연동 서비스 4개 공통 도메인·통합 스키마와 원장 조회 기반",
      ],
      technologies: [
        "Java",
        "Spring Boot",
        "MSSQL",
        "Debezium CDC",
        "Kafka",
      ],
      relatedLinks: [],
      webOrder: 4,
      pdfOrder: null,
    },
  ],
  additionalAchievements: [
    "잡코리아·알바몬 리부트 CPC API 성능 시험 P95 응답 500ms 이하",
    "babyface 이벤트 1개월 약 50,000건 이미지 변환 처리",
    "사람인 모바일 메인 평균 로드 4초→2초대, 사용자 이탈률 절반 수준",
    "등용문2.5 개발자 1인당 담당 프로젝트 평균 1~2개→5~8개",
  ],
  workingStyle: [
    "운영 중인 서비스의 데이터 흐름과 변경 영향을 먼저 확인합니다.",
    "모호한 요구사항은 질문으로 범위를 맞추고 선택 이유와 데이터 흐름을 설명합니다.",
    "데이터 비교·부하 시험·응답 시간처럼 확인 가능한 결과로 변경 효과를 검증합니다.",
    "문제와 위험을 공유하고 운영 가능한 결과까지 마무리합니다.",
  ],
  links: [
    { label: "기술 블로그", url: "https://macho199.github.io/" },
    { label: "GitHub", url: "https://github.com/macho199" },
  ],
} satisfies Portfolio

const approvedPublicUrlPattern =
  /^https:\/\/(?:macho199\.github\.io(?:\/.*)?|github\.com\/macho199(?:\/.*)?)$/i

const forbiddenPublicContentPatterns = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /(?:010[-.\s]?\d{4}|localhost|intranet|사번|자격증\s*번호)/i,
  /https?:\/\/(?!macho199\.github\.io|github\.com\/macho199)/i,
] as const

const collectBlankStringErrors = (
  value: unknown,
  path: string,
  errors: string[],
): void => {
  if (typeof value === "string") {
    if (value.trim() === "") {
      errors.push(`${path} must not be blank`)
    }
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectBlankStringErrors(item, `${path}[${index}]`, errors)
    })
    return
  }

  if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      collectBlankStringErrors(item, `${path}.${key}`, errors)
    })
  }
}

const validateLinks = (
  links: readonly PortfolioLink[],
  path: string,
  errors: string[],
): void => {
  links.forEach((link, index) => {
    if (!approvedPublicUrlPattern.test(link.url)) {
      errors.push(`${path}[${index}].url must use an approved public URL`)
    }
  })
}

export const getWebProjects = (
  selectedPortfolio: Portfolio,
): readonly PortfolioProject[] =>
  [...selectedPortfolio.projects].sort((left, right) => left.webOrder - right.webOrder)

export const getPdfProjects = (
  selectedPortfolio: Portfolio,
): readonly PortfolioProject[] =>
  selectedPortfolio.projects
    .filter(project => project.pdfOrder !== null)
    .sort(
      (left, right) =>
        (left.pdfOrder ?? Number.POSITIVE_INFINITY) -
        (right.pdfOrder ?? Number.POSITIVE_INFINITY),
    )

export const validatePortfolio = (
  selectedPortfolio: Portfolio,
): readonly string[] => {
  const errors: string[] = []

  collectBlankStringErrors(selectedPortfolio, "portfolio", errors)

  const webOrders = selectedPortfolio.projects.map(project => project.webOrder)
  if (new Set(webOrders).size !== webOrders.length) {
    errors.push("webOrder values must be unique")
  }

  const pdfOrders = selectedPortfolio.projects
    .map(project => project.pdfOrder)
    .filter((order): order is number => order !== null)
    .sort((left, right) => left - right)

  if (pdfOrders.length !== 3) {
    errors.push("portfolio must contain exactly 3 PDF projects")
  }

  if (pdfOrders.some((order, index) => order !== index + 1)) {
    errors.push("pdfOrder values must form a contiguous sequence starting at 1")
  }

  validateLinks(selectedPortfolio.links, "portfolio.links", errors)
  selectedPortfolio.projects.forEach((project, index) => {
    validateLinks(
      project.relatedLinks,
      `portfolio.projects[${index}].relatedLinks`,
      errors,
    )
  })

  const serialized = JSON.stringify(selectedPortfolio)
  if (forbiddenPublicContentPatterns.some(pattern => pattern.test(serialized))) {
    errors.push("portfolio contains a forbidden public-content pattern")
  }

  return errors
}

const portfolioErrors = validatePortfolio(portfolio)

if (portfolioErrors.length > 0) {
  throw new Error(`Invalid public portfolio:\n${portfolioErrors.join("\n")}`)
}
