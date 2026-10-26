#!/usr/bin/env node
'use strict'

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const {
  readPayload,
  allow,
  surfaceToModel,
  extractFileEdit,
} = require('./_util.cjs')

const SOURCE_FILE = /(^|\/)(src|e2e)\/.+\.[tj]sx?$/
const LINTERS = [
  { name: 'oxlint', entry: 'oxlint/bin/oxlint' },
  { name: 'eslint', entry: 'eslint/bin/eslint.js' },
]
const MAX_OUTPUT = 2000

function registerRoot() {
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..')
}

function installedLinter(root) {
  for (const linter of LINTERS) {
    const entry = path.join(root, 'node_modules', ...linter.entry.split('/'))
    if (fs.existsSync(entry)) return { name: linter.name, entry }
  }
  return null
}

function lint(entry, target, cwd) {
  try {
    execFileSync(process.execPath, [entry, target], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { ok: true }
  } catch (e) {
    if (typeof e.status !== 'number') {
      return { ok: false, launchError: e.message }
    }
    return { ok: false, output: ((e.stdout || '') + (e.stderr || '')).trim() }
  }
}

;(async () => {
  const payload = await readPayload()
  const { filePath } = extractFileEdit(payload)
  if (!filePath || !SOURCE_FILE.test(filePath)) return allow()

  const root = registerRoot()
  const linter = installedLinter(root)
  if (!linter) return allow()

  const target = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(root, filePath)
  if (!fs.existsSync(target)) return allow()

  const result = lint(linter.entry, target, root)
  if (result.ok) return allow()

  if (result.launchError) {
    return surfaceToModel(
      `react-lint could not run ${linter.name} — the lint gate is NOT covering this edit. ` +
        `Fix the hook before trusting a clean run:\n${result.launchError.slice(0, MAX_OUTPUT)}`,
    )
  }

  return surfaceToModel(
    `${linter.name} flagged ${filePath} — fix before moving on (this would fail the lint gate):\n` +
      (result.output || '(no output)').slice(0, MAX_OUTPUT),
  )
})()
