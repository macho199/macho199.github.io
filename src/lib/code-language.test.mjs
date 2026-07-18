import assert from "node:assert/strict"
import { test } from "node:test"

import { getCodeLanguageLabel } from "./code-language.mjs"

test("maps approved fenced-code language aliases to display labels", () => {
  const cases = [
    ["js", "JavaScript"],
    ["javascript", "JavaScript"],
    ["ts", "TypeScript"],
    ["typescript", "TypeScript"],
    ["tsx", "TSX"],
    ["graphql", "GraphQL"],
    ["css", "CSS"],
    ["sh", "Shell"],
    ["bash", "Shell"],
    ["shell", "Shell"],
    ["shellscript", "Shell"],
    ["yaml", "YAML"],
    ["yml", "YAML"],
    ["text", "Text"],
    ["txt", "Text"],
    ["plain", "Text"],
  ]

  for (const [language, expected] of cases) {
    assert.equal(getCodeLanguageLabel(language), expected)
  }
})

test("normalizes input and falls back to readable labels", () => {
  assert.equal(getCodeLanguageLabel(), "Text")
  assert.equal(getCodeLanguageLabel(""), "Text")
  assert.equal(getCodeLanguageLabel("  JAVASCRIPT  "), "JavaScript")
  assert.equal(getCodeLanguageLabel("objective-c"), "Objective C")
})
