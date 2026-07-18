import * as React from "react"
import type { ComponentPropsWithoutRef } from "react"

import { getCodeLanguageLabel } from "../lib/code-language.mjs"

type CopyStatus = "idle" | "copied" | "failed"

type CodeBlockProps = Readonly<
  ComponentPropsWithoutRef<"pre"> & {
    "data-language"?: string
  }
>

const RESET_DELAY_MS = 1_500

const COPY_LABELS: Readonly<Record<CopyStatus, string>> = {
  idle: "복사",
  copied: "복사됨",
  failed: "복사 실패",
}

const CodeBlock = ({ children, ...preProps }: CodeBlockProps) => {
  const language = preProps["data-language"]
  const languageLabel = getCodeLanguageLabel(language)
  const preRef = React.useRef<HTMLPreElement>(null)
  const resetTimerRef = React.useRef<number | null>(null)
  const [canCopy, setCanCopy] = React.useState(false)
  const [copyStatus, setCopyStatus] = React.useState<CopyStatus>("idle")

  React.useEffect(() => {
    const supportsClipboard =
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"

    setCanCopy(supportsClipboard && Boolean(preRef.current?.textContent))

    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const scheduleReset = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle")
      resetTimerRef.current = null
    }, RESET_DELAY_MS)
  }

  const copyCode = async () => {
    const codeText = preRef.current?.textContent ?? ""

    if (!codeText) {
      return
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }

    try {
      await navigator.clipboard.writeText(codeText)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("failed")
    }

    scheduleReset()
  }

  const liveMessage =
    copyStatus === "copied"
      ? `${languageLabel} 코드가 복사되었습니다.`
      : copyStatus === "failed"
        ? `${languageLabel} 코드 복사에 실패했습니다.`
        : ""

  return (
    <div className="code-block">
      <div className="code-block-toolbar">
        <span className="code-block-language">{languageLabel}</span>
        {canCopy ? (
          <button
            type="button"
            className="code-block-copy"
            aria-label={`${languageLabel} 코드 복사`}
            onClick={copyCode}
          >
            {COPY_LABELS[copyStatus]}
          </button>
        ) : null}
        <span className="sr-only" aria-live="polite">
          {liveMessage}
        </span>
      </div>
      <pre {...preProps} ref={preRef}>
        {children}
      </pre>
    </div>
  )
}

export default CodeBlock
