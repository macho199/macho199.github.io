import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const repositoryRoot = new URL("../../", import.meta.url)

/** @param {string} path */
const readRepositoryFile = path =>
  readFile(new URL(path, repositoryRoot), "utf8").catch(error => {
    if (error.code === "ENOENT") {
      return ""
    }

    throw error
  })

/** @param {string} source */
const stripYamlComments = source =>
  source
    .split("\n")
    .map(line => {
      const commentIndex = line.search(/(^|\s)#/)

      return commentIndex === -1 ? line : line.slice(0, commentIndex).trimEnd()
    })
    .join("\n")

/**
 * @param {string} workflow
 * @param {string} jobName
 */
const readJob = (workflow, jobName) => {
  const marker = `  ${jobName}:\n`
  const markerIndex = workflow.indexOf(marker)

  if (markerIndex === -1) {
    return ""
  }

  const bodyStart = markerIndex + marker.length
  const remainder = workflow.slice(bodyStart)
  const nextJobIndex = remainder.search(/^  [A-Za-z0-9_-]+:\n/m)
  const body = nextJobIndex === -1 ? remainder : remainder.slice(0, nextJobIndex)

  return `${marker}${body}`
}

/** @param {string} value */
const parseYamlScalar = value => {
  const trimmedValue = value.trim()

  if (trimmedValue.startsWith('"')) {
    assert.ok(trimmedValue.endsWith('"'), "double-quoted YAML scalar must close")
    const parsedValue = JSON.parse(trimmedValue)

    assert.equal(typeof parsedValue, "string", "YAML scalar must be a string")
    return parsedValue
  }

  if (trimmedValue.startsWith("'")) {
    assert.ok(trimmedValue.endsWith("'"), "single-quoted YAML scalar must close")
    return trimmedValue.slice(1, -1).replaceAll("''", "'")
  }

  assert.notEqual(trimmedValue, "", "YAML scalar must not be blank")
  return trimmedValue
}

/** @param {string} source */
const readYamlEntries = source =>
  source.split("\n").flatMap((line, index) => {
    if (line.trim() === "") {
      return []
    }

    const match = line.match(
      /^( *)(-\s+)?([A-Za-z0-9_-]+):(?:[ \t]*(.*))?$/,
    )

    assert.ok(match, `unsupported YAML mapping at line ${index + 1}`)
    const rawValue = match[4] ?? ""

    return [
      {
        indentation: match[1].length,
        key: match[3],
        sequence: match[2] !== undefined,
        value: rawValue === "" ? undefined : parseYamlScalar(rawValue),
      },
    ]
  })

/**
 * @param {Record<string, unknown>} mapping
 * @param {string} key
 * @param {unknown} value
 */
const assignUnique = (mapping, key, value) => {
  assert.ok(!Object.hasOwn(mapping, key), `duplicate YAML key: ${key}`)
  mapping[key] = value
}

/**
 * @param {readonly Record<string, unknown>[]} entries
 * @param {string} key
 */
const readJobHeaderIndex = (entries, key) => {
  const indexes = entries.flatMap((entry, index) =>
    !entry.sequence && entry.indentation === 4 && entry.key === key
      ? [index]
      : [],
  )

  assert.equal(indexes.length, 1, `job must define one ${key}`)
  return indexes[0]
}

/** @param {string} job */
const readSteps = job => {
  const entries = readYamlEntries(job)
  const stepsIndex = readJobHeaderIndex(entries, "steps")
  const steps = []
  let currentStep
  let currentNestedMapping

  for (const entry of entries.slice(stepsIndex + 1)) {
    if (entry.indentation <= 4) {
      break
    }

    if (entry.sequence && entry.indentation === 6) {
      currentStep = Object.create(null)
      steps.push(currentStep)
      currentNestedMapping = undefined
      assignUnique(currentStep, entry.key, entry.value)
      continue
    }

    assert.ok(currentStep, "step field must follow a list item")
    assert.ok(
      !entry.sequence && (entry.indentation === 8 || entry.indentation === 10),
      "unsupported step nesting",
    )

    if (entry.indentation === 8) {
      currentNestedMapping = undefined

      if (entry.value === undefined) {
        currentNestedMapping = Object.create(null)
        assignUnique(currentStep, entry.key, currentNestedMapping)
      } else {
        assignUnique(currentStep, entry.key, entry.value)
      }

      continue
    }

    assert.ok(
      currentNestedMapping,
      "nested step field must follow a mapping",
    )
    assert.notEqual(entry.value, undefined, "nested field must have a scalar")
    assignUnique(currentNestedMapping, entry.key, entry.value)
  }

  return steps
}

/**
 * @param {string} job
 * @param {string} mappingName
 */
const readJobMapping = (job, mappingName) => {
  const entries = readYamlEntries(job)
  const mappingIndex = readJobHeaderIndex(entries, mappingName)

  assert.equal(
    entries[mappingIndex].value,
    undefined,
    `${mappingName} must use an explicit nested mapping`,
  )

  const mapping = Object.create(null)

  for (const entry of entries.slice(mappingIndex + 1)) {
    if (entry.indentation <= 4) {
      break
    }

    assert.ok(
      !entry.sequence && entry.indentation === 6,
      `unsupported ${mappingName} nesting`,
    )
    assert.notEqual(
      entry.value,
      undefined,
      `${mappingName}.${entry.key} must have a scalar value`,
    )
    assignUnique(mapping, entry.key, entry.value)
  }

  return mapping
}

/** @param {string} job */
const readStepActions = job =>
  readSteps(job).map((step, index) => {
    const actionKeys = ["uses", "run"].filter(key => Object.hasOwn(step, key))

    assert.deepEqual(
      actionKeys.length,
      1,
      `build step ${index + 1} must define exactly one uses or run action`,
    )

    const action = actionKeys[0]
    const value = step[action]

    assert.equal(typeof value, "string", `${action} must be a scalar`)
    return `${action}: ${value}`
  })

const expectedBuildStepActions = [
  "uses: actions/checkout@v6",
  "uses: actions/setup-node@v6",
  "run: npm ci",
  "run: npm test",
  "run: npm run typecheck",
  "run: npm run build",
  "run: npm run verify:styles",
  "run: npm run verify:layout",
  "run: npm run verify:home",
  "run: npm run verify:post",
  "run: npm run verify:portfolio",
  "run: npx playwright install --with-deps chromium",
  "run: npm run generate:portfolio-pdf",
  "run: npm run verify:portfolio-pdf",
  "uses: actions/configure-pages@v5",
  "uses: actions/upload-pages-artifact@v4",
]

/** @param {string} buildJob */
const assertExactBuildStepActions = buildJob => {
  assert.deepEqual(readStepActions(buildJob), expectedBuildStepActions)
}

/** @param {string} source */
const assertNoCredentialReferences = source => {
  assert.doesNotMatch(
    source,
    /\bsecrets\s*(?:\.|\[)/i,
    "secret expressions are forbidden",
  )
  assert.doesNotMatch(
    source,
    /\bgithub\s*(?:\.\s*token|\[\s*['"]token['"]\s*\])/i,
    "GitHub token expressions are forbidden",
  )
  assert.doesNotMatch(
    source,
    /GITHUB_TOKEN|\bPAT\b|api[_-]?key/i,
    "long-lived credentials are forbidden",
  )
}

/** @param {string} buildJob */
const assertBuildJobIsUnprivileged = buildJob => {
  const permissions = readJobMapping(buildJob, "permissions")

  assert.equal(permissions.contents, "read")

  for (const [permission, value] of Object.entries(permissions)) {
    assert.ok(
      value === "read" || value === "none",
      `${permission} permission must not grant write access`,
    )
  }

  assertNoCredentialReferences(buildJob)
}

/** @param {string} buildJob */
const assertUploadsPublic = buildJob => {
  const uploadSteps = readSteps(buildJob).filter(
    step => step.uses === "actions/upload-pages-artifact@v4",
  )

  assert.deepEqual(
    uploadSteps.length,
    1,
    "build must contain one upload-pages-artifact step",
  )

  const uploadInputs = uploadSteps[0].with

  assert.ok(
    uploadInputs && typeof uploadInputs === "object",
    "upload-pages-artifact must define with inputs",
  )
  assert.equal(uploadInputs.path, "public")
}

/**
 * @param {string} source
 * @param {string} target
 * @param {string} replacement
 */
const replaceRequired = (source, target, replacement) => {
  assert.ok(source.includes(target), `fixture must contain ${target}`)

  return source.replace(target, replacement)
}

const readBuildJobFixture = async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")

  return readJob(stripYamlComments(workflowFile), "build")
}

test("ignores YAML comments when checking active workflow configuration", () => {
  const activeWorkflow = stripYamlComments(`permissions:
  contents: read
  # pages: write
# PAT is not used`)

  assert.doesNotMatch(activeWorkflow, /pages: write|\bPAT\b/)
})

test("targets main and keeps Pages runs serialized", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  assert.match(
    workflow,
    /^on:\n  pull_request:\n    branches: \[main\]\n  push:\n    branches: \[main\]\n  workflow_dispatch:\n/m,
  )
  assert.match(
    workflow,
    /^concurrency:\n  group: pages\n  cancel-in-progress: false$/m,
  )
  assert.doesNotMatch(workflow, /pull_request_target/)
})

test("builds and verifies the Pages artifact in order", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  const buildJob = readJob(workflow, "build")

  assert.notEqual(buildJob, "", "build job must exist")
  assertExactBuildStepActions(buildJob)
  assert.match(buildJob, /^          node-version-file: \.nvmrc$/m)
  assert.match(buildJob, /^          cache: npm$/m)
  assertUploadsPublic(buildJob)
  assertBuildJobIsUnprivileged(buildJob)
  assert.doesNotMatch(buildJob, /^    environment:$/m)
  assert.doesNotMatch(buildJob, /^        run: npm run clean$/m)
})

test("rejects an extra inline build action", async () => {
  const buildJob = await readBuildJobFixture()
  const mutation = replaceRequired(
    buildJob,
    "    steps:\n",
    "    steps:\n      - run: npm run clean\n",
  )

  assert.throws(() => assertExactBuildStepActions(mutation))
})

test("rejects a duplicated inline build action", async () => {
  const buildJob = await readBuildJobFixture()
  const mutation = replaceRequired(
    buildJob,
    "    steps:\n",
    "    steps:\n      - run: npm ci\n",
  )

  assert.throws(() => assertExactBuildStepActions(mutation))
})

test("accepts a semantically equivalent quoted run scalar", async () => {
  const buildJob = await readBuildJobFixture()
  const mutation = replaceRequired(
    buildJob,
    "        run: npm ci",
    '        run: "npm ci"',
  )

  assert.doesNotThrow(() => assertExactBuildStepActions(mutation))
})

test("rejects a quoted write permission in the build job", async () => {
  const buildJob = await readBuildJobFixture()
  const mutation = replaceRequired(
    buildJob,
    "      contents: read",
    '      contents: read\n      packages: "write"',
  )

  assert.throws(() => assertBuildJobIsUnprivileged(mutation))
})

test("rejects a bracketed secret expression in the build job", async () => {
  const buildJob = await readBuildJobFixture()
  const mutation = replaceRequired(
    buildJob,
    "    runs-on: ubuntu-latest",
    "    runs-on: ubuntu-latest\n    env:\n      RELEASE_TOKEN: ${{ secrets['RELEASE_TOKEN'] }}",
  )

  assert.throws(() => assertBuildJobIsUnprivileged(mutation))
})

test("rejects the GitHub token expression in the build job", async () => {
  const buildJob = await readBuildJobFixture()
  const mutation = replaceRequired(
    buildJob,
    "    runs-on: ubuntu-latest",
    "    runs-on: ubuntu-latest\n    env:\n      RELEASE_TOKEN: ${{ github.token }}",
  )

  assert.throws(() => assertBuildJobIsUnprivileged(mutation))
})

test("ties the public path to the upload-pages-artifact step", async () => {
  const buildJob = await readBuildJobFixture()
  const wrongUpload = replaceRequired(
    buildJob,
    "          path: public",
    "          path: dist",
  )
  const mutation = replaceRequired(
    wrongUpload,
    "          cache: npm",
    "          cache: npm\n        env:\n          path: public",
  )

  assert.throws(() => assertUploadsPublic(mutation))
})

test("deploys only from main after build with least privilege", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  const deployJob = readJob(workflow, "deploy")

  assert.notEqual(deployJob, "", "deploy job must exist")
  assert.match(deployJob, /^    needs: build$/m)
  assert.match(
    deployJob,
    /^    if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'$/m,
  )
  assert.match(deployJob, /permissions:\n      contents: read/)
  assert.match(deployJob, /^      pages: write$/m)
  assert.match(deployJob, /^      id-token: write$/m)
  assert.match(deployJob, /environment:\n      name: github-pages/)
  assert.match(
    deployJob,
    /^      url: \$\{\{ steps\.deployment\.outputs\.page_url \}\}$/m,
  )
  assert.match(deployJob, /^        id: deployment$/m)
  assert.match(deployJob, /^        uses: actions\/deploy-pages@v4$/m)
  assert.doesNotMatch(deployJob, /generate:portfolio-pdf/)
})

test("does not add generated branches or long-lived credentials", async () => {
  const workflowFile = await readRepositoryFile(".github/workflows/deploy-pages.yml")

  assert.notEqual(workflowFile, "", "deploy-pages.yml must exist")
  const workflow = stripYamlComments(workflowFile)
  assertNoCredentialReferences(workflow)
  assert.doesNotMatch(workflow, /gh-pages|git push/i)
})
