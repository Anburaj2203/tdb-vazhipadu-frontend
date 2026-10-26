/* ============================================================
   React lint hook test
   (node .claude/hooks/tests/react-lint.test.cjs)

   On an edit to a src/ or e2e/ TypeScript/JavaScript file the hook runs the
   repo's linter through `process.execPath` (oxlint first, then eslint,
   whichever is installed under node_modules) and, if it complains, surfaces
   the output to the model (exit 2); otherwise it allows. Files that match no
   stack (anything outside src/ and e2e/, or a non-JS/TS extension) pass
   through untouched without ever invoking the linter.

   Invoking the linter's JS entry via node — rather than the node_modules/.bin
   shim — is what makes this work on Windows, where the extensionless shim is
   a shell script that execFileSync cannot launch.

   The lint-violation case needs a real linter on disk, so it is GUARDED:
   when neither is installed the case is skipped (logged), which keeps the
   suite green on a machine without deps installed (the CI hook-tests job does
   not run `npm install`). The pass-through cases never touch the linter, so
   they are deterministic everywhere.
   ============================================================ */

'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const REPO = path.resolve(__dirname, '..', '..', '..')
const HOOK = path.join(__dirname, '..', 'react-lint.cjs')

const LINTER_ENTRIES = ['oxlint/bin/oxlint', 'eslint/bin/eslint.js']

let passed = 0,
  failed = 0,
  skipped = 0
function ok(cond, msg) {
  if (cond) passed++
  else {
    failed++
    console.error(`  FAIL: ${msg}`)
  }
}
function skip(msg) {
  skipped++
  console.log(`  SKIP: ${msg}`)
}

function installedLinter() {
  for (const entry of LINTER_ENTRIES) {
    if (fs.existsSync(path.join(REPO, 'node_modules', ...entry.split('/')))) {
      return entry.split('/')[0]
    }
  }
  return null
}

// 2 = surfaced (lint failed), 0 = allowed.
function edit(filePath, content) {
  const payload = {
    tool_name: 'Edit',
    tool_input: { file_path: filePath, new_string: content || '' },
  }
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    cwd: REPO,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO },
  }).status
}

function withFixture(relPath, content, fn) {
  const abs = path.join(REPO, relPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content)
  try {
    fn()
  } finally {
    fs.rmSync(abs, { force: true })
  }
}

// Pass-through cases — deterministic on any machine (the linter never runs).
ok(edit('', '') === 0, 'no file path is allowed')
ok(edit('docs/notes.md', '# hi') === 0, 'unmatched extension (.md) is allowed')
ok(edit('README.md', '# demo-fe') === 0, 'root README is allowed')
ok(edit('App.tsx', 'export default null;') === 0, 'tsx outside src/ is allowed')
ok(
  edit('src/_hook_lint_missing.tsx', '') === 0,
  'a src path with no file on disk is allowed',
)

// Lint-violation case is surfaced — only when a linter is installed. The hook
// lints the file on disk, so the fixture must be a real file. A missing `alt`
// is a correctness error under jsx-a11y, which both linters enforce.
const linter = installedLinter()
if (linter) {
  const BAD = 'export const Bad = () => <img src="/x.png" />\n'
  withFixture('src/_hook_lint_fixture_bad.tsx', BAD, () => {
    ok(
      edit('src/_hook_lint_fixture_bad.tsx', '') === 2,
      `src file with an a11y violation is surfaced (${linter})`,
    )
  })

  const GOOD = 'export const Good = () => <img src="/x.png" alt="" />\n'
  withFixture('src/_hook_lint_fixture_good.tsx', GOOD, () => {
    ok(
      edit('src/_hook_lint_fixture_good.tsx', '') === 0,
      `clean src file is allowed (${linter})`,
    )
  })
} else {
  skip('no linter installed under node_modules — lint-violation case skipped')
}

console.log(
  `\nreact-lint: ${passed} passed, ${failed} failed, ${skipped} skipped`,
)
process.exit(failed === 0 ? 0 : 1)
