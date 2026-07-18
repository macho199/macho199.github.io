import * as React from "react"
import type { ComponentPropsWithoutRef } from "react"

import { getCodeLanguageLabel } from "../lib/code-language.mjs"

type CodeBlockProps = Readonly<
  ComponentPropsWithoutRef<"pre"> & {
    "data-language"?: string
  }
>

const CopyIcon = () => (
  <svg
    className="code-block-copy-icon"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="4" y="4" width="11" height="11" rx="2" />
    <rect x="9" y="9" width="11" height="11" rx="2" />
  </svg>
)

const CodeBlock = ({ children, ...preProps }: CodeBlockProps) => {
  const language = preProps["data-language"]
  const languageLabel = getCodeLanguageLabel(language)
  const preRef = React.useRef<HTMLPreElement>(null)
  const [canCopy, setCanCopy] = React.useState(false)

  React.useEffect(() => {
    const supportsClipboard =
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"

    setCanCopy(supportsClipboard && Boolean(preRef.current?.textContent))
  }, [])

  const copyCode = async () => {
    const codeText = preRef.current?.textContent ?? ""

    if (!codeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(codeText)
    } catch {
      return
    }
  }

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
            <CopyIcon />
          </button>
        ) : null}
      </div>
      <pre {...preProps} ref={preRef}>
        {children}
      </pre>
    </div>
  )
}

export default CodeBlock
