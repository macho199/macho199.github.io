import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { BlockList, isIP } from "node:net"
import { fileURLToPath, pathToFileURL } from "node:url"
import { resolve } from "node:path"

import { PDFDocument } from "pdf-lib"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import { findPrivateIpv4Addresses } from "../src/content/public-content-privacy.mjs"

export const PORTFOLIO_PDF_PATH =
  "public/downloads/kwon-jongseong-backend-portfolio.pdf"
export const PORTFOLIO_WEB_URL =
  "https://macho199.github.io/portfolio/"

const MINIMUM_PDF_SIZE = 10 * 1024
const MAXIMUM_PDF_SIZE = 10 * 1024 * 1024
const A4_WIDTH_POINTS = 595.28
const A4_HEIGHT_POINTS = 841.89
const A4_POINT_TOLERANCE = 1
const httpUrlPattern =
  /https?:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*?(?=https?:\/\/|[^A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]|$)/giu
const privatePhonePatterns = [
  /(?<!\d)\+\d{1,3}(?:[\s().-]*\d){7,12}(?!\d)/u,
  /(?<!\d)0(?:1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[\s().-]*\d{3,4}[\s.-]*\d{4}(?!\d)/u,
]
const ipv6CandidatePattern =
  /\[?(?:[a-f0-9]{0,4}:){2,7}(?:(?:\d{1,3}\.){3}\d{1,3}|[a-f0-9]{0,4})(?:%[a-z0-9._~-]+)?\]?/giu
const privateIpv6BlockList = new BlockList()

privateIpv6BlockList.addAddress("::1", "ipv6")
privateIpv6BlockList.addSubnet("fe80::", 10, "ipv6")
privateIpv6BlockList.addSubnet("fc00::", 7, "ipv6")
privateIpv6BlockList.addSubnet("::ffff:127.0.0.0", 104, "ipv6")
const defaultPdfPath = fileURLToPath(
  new URL(
    "../public/downloads/kwon-jongseong-backend-portfolio.pdf",
    import.meta.url,
  ),
)
const standardFontDataUrl = fileURLToPath(
  new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url),
)
const portfolioPageContract = {
  canonicalUrl: PORTFOLIO_WEB_URL,
  name: "권종성",
  pageAnchors: [
    [
      "17년 경력 시니어 백엔드 개발자",
      "17년간 채용 플랫폼과 채용 솔루션을 개발·운영한 백엔드 개발자입니다.",
    ],
    [
      "Java",
      "AI 에이전트는 탐색·정리·추적에 사용",
      "최종 판단과 검증은 개발자가 담당",
    ],
    ["이력서 첨부파일 NAS→S3 무중단 전환"],
    [
      "이력서 첨부파일 NAS→S3 무중단 전환",
      "서비스 중단 없이 약 800만 개 전환",
    ],
    [
      "알바몬 이력서 데이터 마이그레이션 정합성 검증",
      "1천만 건 이상의 원본과 이관 결과를 비교·보정해 누락 제거",
    ],
    [
      "알바몬 이력서 데이터 마이그레이션 정합성 검증",
      "최종 미해결 누락 0건",
    ],
    ["잡코리아 모바일 추천2.0 부하 시험 개선"],
    [
      "잡코리아 모바일 추천2.0 부하 시험 개선",
      "500 TPS 시험의 커넥션·날짜 매핑 원인 분석",
    ],
    [
      "잡코리아·알바몬 리부트 CPC API 성능 시험 P95 응답 500ms 이하",
      "data-pulse 공통 데이터 연동 기반",
    ],
  ],
  totalPages: 9,
  updatedAt: "2026.07.23",
}

const assertValidDate = (value, label) => {
  assert.ok(
    value instanceof Date && Number.isFinite(value.getTime()),
    `${label} must be a valid date`,
  )
}

const createPdfLoadingTask = data =>
  getDocument({ data, standardFontDataUrl })

const runWithCleanup = async (operation, cleanup, aggregateMessage) => {
  let operationError
  let operationFailed = false

  try {
    return await operation()
  } catch (error) {
    operationError = error
    operationFailed = true
    throw error
  } finally {
    try {
      await cleanup()
    } catch (cleanupError) {
      if (!operationFailed) {
        throw cleanupError
      }

      const operationErrors =
        operationError instanceof AggregateError &&
        operationError.cause === operationError.errors[0]
          ? operationError.errors
          : [operationError]
      const primaryError =
        operationError instanceof AggregateError && operationError.cause
          ? operationError.cause
          : operationError

      throw new AggregateError(
        [...operationErrors, cleanupError],
        aggregateMessage,
        { cause: primaryError },
      )
    }
  }
}

export const extractPdfText = async (
  pdfBytes,
  createLoadingTask = createPdfLoadingTask,
) => {
  const loadingTask = createLoadingTask(new Uint8Array(pdfBytes))

  return runWithCleanup(
    async () => {
      const pdfDocument = await loadingTask.promise
      const pageTexts = []

      for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber += 1
      ) {
        const page = await pdfDocument.getPage(pageNumber)

        const pageText = await runWithCleanup(
          async () => {
            const textContent = await page.getTextContent()

            return textContent.items
              .map(item => ("str" in item ? item.str : ""))
              .join("")
          },
          () => page.cleanup(),
          "PDF.js text extraction and page cleanup both failed",
        )

        pageTexts.push(pageText)
      }

      return pageTexts
    },
    () => loadingTask.destroy(),
    "PDF.js document work and loading-task cleanup both failed",
  )
}

/**
 * @typedef {Readonly<{
 *   canonicalUrl: string
 *   name: string
 *   pageAnchors: readonly (readonly string[])[]
 *   totalPages: number
 *   updatedAt: string
 * }>} PortfolioPdfPageContract
 */

/**
 * @param {PDFDocument} pdfDocument
 * @param {readonly string[]} pageTexts
 * @param {PortfolioPdfPageContract} contract
 */
export const assertPortfolioPdfPageContracts = (
  pdfDocument,
  pageTexts,
  contract,
) => {
  assert.equal(
    pdfDocument.getPageCount(),
    contract.totalPages,
    "portfolio PDF page count",
  )
  assert.equal(
    pageTexts.length,
    contract.totalPages,
    "portfolio PDF extracted page count",
  )
  assert.equal(
    contract.pageAnchors.length,
    contract.totalPages,
    "portfolio PDF page-anchor contract count",
  )

  pdfDocument.getPages().forEach((page, index) => {
    const pageNumber = index + 1
    const pageText = pageTexts[index]
    const { width, height } = page.getSize()

    assert.ok(
      Math.abs(width - A4_WIDTH_POINTS) <= A4_POINT_TOLERANCE,
      `portfolio PDF page ${pageNumber} A4 width`,
    )
    assert.ok(
      Math.abs(height - A4_HEIGHT_POINTS) <= A4_POINT_TOLERANCE,
      `portfolio PDF page ${pageNumber} A4 height`,
    )
    assert.ok(
      pageText.trim().length > 0,
      `portfolio PDF page ${pageNumber} is nonblank`,
    )
    assert.ok(
      pageText.includes(contract.name),
      `portfolio PDF page ${pageNumber} contains name`,
    )
    assert.ok(
      pageText.includes(contract.updatedAt),
      `portfolio PDF page ${pageNumber} contains formatted update date`,
    )
    assert.ok(
      pageText.includes(contract.canonicalUrl),
      `portfolio PDF page ${pageNumber} contains canonical URL`,
    )

    const pageLabels = (pageText.match(/\d+\s+\/\s+\d+/gu) ?? [])
      .map(label => label.replace(/\s+/gu, " "))

    assert.deepEqual(
      pageLabels,
      [`${pageNumber} / ${contract.totalPages}`],
      `portfolio PDF page ${pageNumber} exact page label`,
    )

    for (const anchor of contract.pageAnchors[index]) {
      assert.ok(
        pageText.includes(anchor),
        `portfolio PDF page ${pageNumber} contains ${anchor}`,
      )
    }
  })
}

export const assertPublicPortfolioText = extractedText => {
  assert.doesNotMatch(
    extractedText,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    "no private email",
  )
  assert.ok(
    !privatePhonePatterns.some(pattern => pattern.test(extractedText)),
    "no private phone number",
  )
  assert.equal(
    findPrivateIpv4Addresses(
      extractedText,
      candidate => isIP(candidate) === 4,
    ).length,
    0,
    "no private IPv4",
  )

  const detectedHttpUrls = extractedText.match(httpUrlPattern) ?? []

  for (const detectedUrl of detectedHttpUrls) {
    let url

    try {
      url = new URL(detectedUrl)
    } catch {
      assert.fail("no internal URL or unapproved public URL")
    }

    const hasApprovedOrigin =
      url.protocol === "https:" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      (url.hostname === "macho199.github.io" ||
        (url.hostname === "github.com" &&
          (url.pathname === "/macho199" ||
            url.pathname.startsWith("/macho199/"))))

    assert.ok(
      hasApprovedOrigin,
      `no internal URL or unapproved public URL: ${detectedUrl}`,
    )
  }

  const textWithoutHttpUrls = extractedText.replace(httpUrlPattern, " ")

  assert.doesNotMatch(
    textWithoutHttpUrls,
    /(?:^|[^\p{L}\p{N}_])(?:localhost|intranet|internal)(?=$|[^\p{L}\p{N}_])/iu,
    "no internal host text",
  )
  assert.doesNotMatch(
    textWithoutHttpUrls,
    /(?:^|[^\p{L}\p{N}_])(?:[a-z0-9-]+\.)+(?:internal|local)(?=$|[^\p{L}\p{N}_])/iu,
    "no internal host text",
  )
  const detectedIpv6Addresses =
    textWithoutHttpUrls.match(ipv6CandidatePattern) ?? []
  const hasPrivateIpv6Address = detectedIpv6Addresses.some(candidate => {
    const unbracketedCandidate = candidate.replace(/^\[|\]$/gu, "")

    return (
      isIP(unbracketedCandidate) === 6 &&
      privateIpv6BlockList.check(unbracketedCandidate, "ipv6")
    )
  })

  assert.ok(
    !hasPrivateIpv6Address,
    "no internal host text",
  )
}

export const verifyPortfolioPdf = async pdfPath => {
  const pdfBytes = await readFile(pdfPath)

  assert.equal(
    pdfBytes.subarray(0, 5).toString("ascii"),
    "%PDF-",
    "portfolio PDF signature",
  )
  assert.ok(
    pdfBytes.byteLength > MINIMUM_PDF_SIZE,
    "portfolio PDF size greater than 10KB",
  )
  assert.ok(
    pdfBytes.byteLength <= MAXIMUM_PDF_SIZE,
    "portfolio PDF size at most 10MB",
  )

  const pdfDocument = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  })

  assert.equal(pdfDocument.isEncrypted, false, "portfolio PDF is unencrypted")
  assert.equal(
    pdfDocument.getTitle(),
    "권종성 백엔드 개발자 포트폴리오",
    "portfolio PDF title",
  )
  assert.equal(pdfDocument.getAuthor(), "권종성", "portfolio PDF author")
  assert.equal(
    pdfDocument.getSubject(),
    "시니어 백엔드 개발 포트폴리오",
    "portfolio PDF subject",
  )
  assertValidDate(pdfDocument.getCreationDate(), "PDF creation date")
  assertValidDate(pdfDocument.getModificationDate(), "PDF modification date")

  const pageTexts = await extractPdfText(pdfBytes)
  const extractedText = pageTexts.join("\n")

  assertPortfolioPdfPageContracts(
    pdfDocument,
    pageTexts,
    portfolioPageContract,
  )
  assertPublicPortfolioText(extractedText)

  console.log(
    `portfolio PDF verified: ${pdfDocument.getPageCount()} pages, ${pdfBytes.byteLength} bytes, metadata, text, and privacy contracts passed`,
  )
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isDirectRun) {
  const requestedPdfPath = process.argv[2]
  const pdfPath = requestedPdfPath
    ? resolve(process.cwd(), requestedPdfPath)
    : defaultPdfPath

  verifyPortfolioPdf(pdfPath).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
