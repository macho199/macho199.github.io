import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { createServer } from "node:http"
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import {
  extname,
  join,
  posix,
  resolve,
  sep,
} from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { PDFDocument } from "pdf-lib"
import { chromium } from "playwright"

export const PORTFOLIO_PDF_PATH =
  "public/downloads/kwon-jongseong-backend-portfolio.pdf"
export const PORTFOLIO_PRINT_PATH = "/portfolio/print/"
export const PORTFOLIO_WEB_URL =
  "https://macho199.github.io/portfolio/"

const publicRootUrl = new URL("../public/", import.meta.url)
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url))
const publicRootPath = fileURLToPath(publicRootUrl)
const printHtmlPath = fileURLToPath(
  new URL("../public/portfolio/print/index.html", import.meta.url),
)
const portfolioPdfPath = resolve(repositoryRoot, PORTFOLIO_PDF_PATH)
const downloadsPath = fileURLToPath(
  new URL("../public/downloads/", import.meta.url),
)
const fallbackChromiumPaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
]

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
])

class HttpError extends Error {
  /** @param {number} statusCode @param {string} message */
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

/**
 * Resolve a request only when its decoded path stays within public/.
 *
 * @param {string} requestUrl
 * @param {string} publicRoot
 */
export const resolveStaticFile = async (requestUrl, publicRoot) => {
  let decodedPath

  try {
    const rawPath = requestUrl.split(/[?#]/, 1)[0]

    if (!rawPath.startsWith("/")) {
      throw new Error("Request target must be an absolute path")
    }

    decodedPath = decodeURIComponent(rawPath).replaceAll("\\", "/")
  } catch {
    throw new HttpError(400, "Bad request")
  }

  const decodedSegments = decodedPath.split("/")

  if (decodedSegments.some(segment => segment === "..")) {
    throw new HttpError(403, "Forbidden")
  }

  const normalizedPath = posix.normalize(decodedPath)
  const relativePath = normalizedPath.replace(/^\/+/, "")
  const documentPath = decodedPath.endsWith("/")
    ? posix.join(relativePath, "index.html")
    : relativePath || "index.html"
  const candidatePath = resolve(publicRoot, documentPath)
  const publicRootPrefix = `${publicRoot}${sep}`

  if (
    candidatePath !== publicRoot &&
    !candidatePath.startsWith(publicRootPrefix)
  ) {
    throw new HttpError(403, "Forbidden")
  }

  let resolvedPath

  try {
    resolvedPath = await realpath(candidatePath)
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      throw new HttpError(404, "Not found")
    }

    throw error
  }

  if (
    resolvedPath !== publicRoot &&
    !resolvedPath.startsWith(publicRootPrefix)
  ) {
    throw new HttpError(403, "Forbidden")
  }

  const fileStat = await stat(resolvedPath)

  if (!fileStat.isFile()) {
    throw new HttpError(404, "Not found")
  }

  return resolvedPath
}

/** @param {import("node:http").IncomingMessage} request @param {import("node:http").ServerResponse} response @param {string} publicRoot */
const serveStaticFile = async (request, response, publicRoot) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    })
    response.end("Method not allowed")
    return
  }

  try {
    const filePath = await resolveStaticFile(request.url ?? "/", publicRoot)
    const body = await readFile(filePath)

    response.writeHead(200, {
      "Content-Length": body.byteLength,
      "Content-Type":
        mimeTypes.get(extname(filePath).toLowerCase()) ??
        "application/octet-stream",
    })
    response.end(request.method === "HEAD" ? undefined : body)
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500
    const message = error instanceof HttpError ? error.message : "Server error"

    response.writeHead(statusCode, {
      "Content-Type": "text/plain; charset=utf-8",
    })
    response.end(message)
  }
}

const startStaticServer = async () => {
  const publicRoot = await realpath(publicRootPath)
  const server = createServer((request, response) => {
    void serveStaticFile(request, response, publicRoot)
  })

  await new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer)
    server.listen(0, "127.0.0.1", resolveServer)
  })

  const address = server.address()

  assert.ok(address && typeof address !== "string", "static server address")

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
  }
}

/** @param {import("node:http").Server | undefined} server */
const closeServer = async server => {
  if (!server?.listening) {
    return
  }

  await new Promise((resolveClose, rejectClose) => {
    server.close(error => {
      if (error) {
        rejectClose(error)
        return
      }

      resolveClose()
    })
  })
}

const resolveChromiumExecutable = () => {
  const configuredExecutable =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

  if (configuredExecutable && existsSync(configuredExecutable)) {
    return configuredExecutable
  }

  if (existsSync(chromium.executablePath())) {
    return chromium.executablePath()
  }

  const fallbackExecutable = fallbackChromiumPaths.find(existsSync)

  assert.ok(
    fallbackExecutable,
    "Chromium executable is missing; install the Playwright Chromium runtime",
  )

  return fallbackExecutable
}

/** @param {readonly (() => unknown | Promise<unknown>)[]} tasks */
export const runCleanupTasks = async tasks => {
  const results = await Promise.allSettled(
    tasks.map(task => Promise.resolve().then(task)),
  )

  return results
    .filter(result => result.status === "rejected")
    .map(result => result.reason)
}

export const generatePortfolioPdf = async () => {
  await rm(portfolioPdfPath, { force: true })
  await access(printHtmlPath)
  await mkdir(downloadsPath, { recursive: true })

  let browser
  let generationError
  let server
  let temporaryDirectory

  try {
    temporaryDirectory = await mkdtemp(
      join(downloadsPath, ".portfolio-pdf-"),
    )
    const browserPdfPath = join(temporaryDirectory, "browser.pdf")
    const finalPdfPath = join(temporaryDirectory, "final.pdf")
    const staticServer = await startStaticServer()

    server = staticServer.server
    const executablePath = resolveChromiumExecutable()
    browser = await chromium.launch({ headless: true, executablePath })

    const page = await browser.newPage()
    const consoleErrors = []

    page.on("console", message => {
      if (message.type() === "error") {
        consoleErrors.push(message.text())
      }
    })

    await page.emulateMedia({ media: "print" })

    const response = await page.goto(
      `${staticServer.baseUrl}${PORTFOLIO_PRINT_PATH}`,
      { waitUntil: "domcontentloaded" },
    )

    assert.ok(response, "portfolio print response")
    assert.equal(response.status(), 200, "portfolio print HTTP status")

    await page.waitForLoadState("networkidle")
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const fontStatus = await page.evaluate(() => document.fonts.status)

    assert.equal(fontStatus, "loaded", "portfolio print fonts loaded")
    await page
      .locator('[data-portfolio-print-ready="true"]')
      .waitFor({ state: "attached" })
    assert.deepEqual(
      consoleErrors,
      [],
      `portfolio print console errors: ${consoleErrors.join(" | ")}`,
    )

    await page.pdf({
      path: browserPdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      headerTemplate: "",
      footerTemplate: "",
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    })

    assert.deepEqual(
      consoleErrors,
      [],
      `portfolio print console errors: ${consoleErrors.join(" | ")}`,
    )

    const browserPdfBytes = await readFile(browserPdfPath)
    const pdfDocument = await PDFDocument.load(browserPdfBytes)
    const generatedAt = new Date()

    pdfDocument.setTitle("권종성 백엔드 개발자 포트폴리오")
    pdfDocument.setAuthor("권종성")
    pdfDocument.setSubject("시니어 백엔드 개발 포트폴리오")
    pdfDocument.setKeywords([
      "권종성",
      "백엔드 개발자",
      "시니어 백엔드",
      "포트폴리오",
    ])
    pdfDocument.setCreationDate(generatedAt)
    pdfDocument.setModificationDate(generatedAt)

    await writeFile(finalPdfPath, await pdfDocument.save())
    await rename(finalPdfPath, portfolioPdfPath)

    console.log(`portfolio PDF generated: ${PORTFOLIO_PDF_PATH}`)
  } catch (error) {
    generationError = error
    throw error
  } finally {
    const cleanupErrors = await runCleanupTasks([
      () => browser?.close(),
      () => closeServer(server),
      () =>
        temporaryDirectory
          ? rm(temporaryDirectory, { force: true, recursive: true })
          : undefined,
    ])

    if (cleanupErrors.length > 0 && generationError === undefined) {
      throw new AggregateError(
        cleanupErrors,
        "Failed to clean portfolio PDF generation resources",
      )
    }
  }
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isDirectRun) {
  generatePortfolioPdf().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
