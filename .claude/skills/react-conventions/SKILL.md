---
name: react-conventions
description: >-
  Engineering standard for the React code in this repo. States the bar code is held to, what a
  review flags as blocking, and the gate commands that must pass. Loaded on demand by /start-issue,
  /pr-review and /fix-review-comments for issues and diffs that touch React code; never pre-read.
---

# React conventions

This skill is a **standard, not a description**: it states the bar this repo holds `React` code to,
not a narration of what the code currently does. Apply it to the lines a change **adds or modifies**;
pre-existing violations in untouched code are backlog issues, not blockers. Surrounding code is never
precedent for a new violation.

## How this skill is used

- `/start-issue` loads it when an issue touches this stack, before any code is written.
- `/pr-review` and `/pr-review-ci` hand it to the **Reviewer Agents**, which report only the
  violations listed under **Blocking in review** below.
- `/fix-review-comments` verifies each finding against it before changing code.
- `.claude/conventions/comment-conventions.md` applies to every source file in this stack and is a
  gate: a comment in a source file fails the change.

## What a blocking finding is

A review flags a change only for: a correctness bug, a security hole, data loss or a crash; a
regression the issue did not ask for; a break of a contract or interface without its accompanying
change; a rule in **Blocking in review** below; or an unmet acceptance criterion. Style preferences,
alternative designs and "consider" remarks are not findings and are never posted.

## Project-specific

**Package Manager** and **Gate Commands** are registered once in `CLAUDE.md` under
`## Project-specific`. Read them there; they are not restated here.

What lives here is the standard itself — the **Scope** this skill governs and the rules a change is
held to. Keep it free of counts, versions, issue numbers, file inventories and dates; those move.

- **Scope**: `src/` — every TypeScript source file in the app, plus `index.html`, `vite.config.ts`
  and the ESLint and TypeScript configs when a change touches them.

**Architecture rules**:

- Routes live under `src/routes/`, reusable UI under `src/components/`, feature code under
  `src/features/<feature>/`. A component used by one feature stays in that feature.
- A component file exports one component. Shared types live beside the code that owns them, and
  cross-feature types in `src/types/`.
- Props are typed explicitly. A component takes the data it renders, not the store or the fetcher.
- Side effects live in event handlers or in a data layer, never in a `useEffect` whose only job is to
  derive state that could be computed during render.
- Environment values are read through `import.meta.env` and re-exported from `src/config/env.ts`;
  they are never hardcoded, and only `VITE_`-prefixed values reach the client. `.env*` files are
  never committed.
- Colours, spacing and typefaces come from the theme tokens, never from a literal in a component.
- Imports use the configured path alias rather than `../../..` chains out of a directory.
- Assets are imported so Vite fingerprints them, not referenced by a hand-written `/public` URL that
  nothing checks.

**State and data rules**:

- Server state belongs to the data layer and is not copied into a store or mirrored into `useState`.
  Client state that is local to one component is `useState`; genuinely global client state goes in
  the app store.
- Derived values are computed during render. `useMemo` and `useCallback` are used when a real
  measured cost or a referential-identity contract needs them, not by default.
- A network call goes through the shared client in `src/api/`, which owns the base URL, auth header
  and error shape. A raw `fetch` in a component is not acceptable.
- Every async view handles all three states — loading, error, empty — not just the success path.
- A fetch that a unmounted or superseded render started is cancelled or ignored, so a late response
  never overwrites newer data.
- Tokens and secrets are never placed in `localStorage` where an XSS can read them, never logged, and
  never hardcoded — and neither are OTPs, passwords or user PII.

**Testing rules**:

- Tests use Vitest and React Testing Library and assert what a user can observe — what renders, and
  what a click or an input produces — not internal calls or state shape.
- Queries are by role, label or text. A `data-testid` is a last resort, not the default.
- The network is mocked at the boundary; the app's own hooks and components are not mocked.
- A change keeps the configured coverage thresholds green.
- A bug fix ships with a test that fails without the fix.
- Production code is never bent to make a test pass, and a failing test is never weakened, skipped or
  deleted to go green.

**Blocking in review**:

- An `any`, a type assertion that hides a real mismatch, or a new lint/type suppression on a changed
  line.
- A `console.*` call left in the source.
- A network call that bypasses the shared API client.
- A token, OTP, secret or piece of PII stored in `localStorage`, logged, or hardcoded; a committed
  `.env*` file; a non-`VITE_` secret read in client code.
- A hardcoded colour, spacing or font-family string where a theme token exists.
- A hook called conditionally, inside a loop, or after an early return.
- A `useEffect` with wrong dependencies — a missing one (stale closure) or an extra one that loops —
  or an effect whose only job is to mirror props or store state into local state.
- State updated from a stale value where the updater form is required, or an object or array in state
  mutated in place rather than replaced.
- A list rendered with the array index as `key` where rows can reorder, be inserted or be removed.
- An unstable value — an inline object, array or function — passed as a context `Provider` value.
- An async effect or handler that sets state without guarding against the component having unmounted
  or the request having been superseded.
- `dangerouslySetInnerHTML` fed anything that is not sanitised.
- An interactive element that is a `div` with an `onClick` and no role, keyboard handler or
  accessible name; an `<img>` without `alt`; a form control without a label.
- A gate command that does not pass.

**Definition of done**:

- Every gate command passes.
- Every acceptance criterion on the issue is met.
- New and changed behaviour is covered by tests, and coverage thresholds hold.
- UI changes are checked at the supported breakpoints and with the keyboard alone.
- The issue is carried past merge as described under **Merge Method** in `CLAUDE.md`.

**Not reviewed**: lockfiles (`package-lock.json`, `pnpm-lock.yaml`) — review the `package.json`
change instead; generated output under `dist/`; and formatting a formatter owns.
