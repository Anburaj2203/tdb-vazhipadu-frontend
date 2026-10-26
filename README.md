# TDB Vazhipadu — temple offering booking (frontend)

A React single-page app for booking temple *vazhipadu* (offerings). A devotee picks a temple,
browses and searches its offerings, builds a cart, and submits an order with their name, phone,
birth star and offering date. Temple staff look up, filter, paginate and cancel orders.

There is no backend. The app talks to an in-memory mock API that behaves like a real network:
artificial latency, a failure rate, validation errors and pagination.

## Stack

- React 19 + TypeScript, Vite 8
- React Router 8
- Tailwind CSS 4
- Jest 30 + React Testing Library (jsdom)
- oxlint

## Prerequisites

- Node.js 24.x (developed on 24.14.1)
- npm 11.x (developed on 11.11.0)

## Running the app

```bash
npm install
npm run dev
```

Vite prints the local URL (http://localhost:5173 by default). Routes:

| Route        | What it does                                                         |
| ------------ | -------------------------------------------------------------------- |
| `/`          | Landing page                                                          |
| `/offerings` | Pick a temple, browse and search its offerings, add them to the cart  |
| `/cart`      | Review cart lines, fill in the devotee details, place the order       |
| `/orders`    | Staff view: search, filter, sort, paginate and cancel orders          |
| `/about`     | About the app                                                         |

Production build and local preview of that build:

```bash
npm run build     # tsc -b && vite build
npm run preview
```

## Running the tests and the other gates

```bash
npm test               # Jest, jsdom, all *.test.ts / *.test.tsx under src/
npm run test:watch     # the same suite in watch mode
npm run test:coverage  # coverage; thresholds are 80% branches/functions/lines/statements
npm run lint           # oxlint
npm run typecheck      # tsc -b --noEmit
npm run build          # type-checks and builds
```

Run a single file or a single test:

```bash
npm test -- src/features/orders/OrdersBrowser.test.tsx
npm test -- -t "clearing the search"
```

Jest runs through Babel with `--experimental-vm-modules` so React Router's ESM build loads.
`@/...` resolves to `src/...` in Vite, TypeScript and Jest alike.

## The mock API

`src/api` holds a seeded in-memory database and the API surface (`getTemples`, `getOfferings`,
`getOrders`, `createOrder`, `cancelOrder`), exported from `@/api`.

- Seed data: 4 temples with their own offerings (some inactive), 52 orders, order numbers from 10001.
  The seed is deterministic, so every reload starts from the same data.
- Every call waits 200–1000 ms and then fails 10% of the time with a `NETWORK_ERROR`; the UI has to
  show loading and failure states for real.
- Errors are `ApiError` with a code of `NETWORK_ERROR`, `NOT_FOUND`, `VALIDATION_ERROR` or `CONFLICT`.
- Orders are paginated, 10 per page by default.
- State lives in memory only — a reload resets it. The cart is the exception: it is kept in
  `localStorage` under `tdb.cart.v1` so a reload does not lose the devotee's work.

Tests (and anyone who wants a deterministic UI) can make the network boring:

```ts
import { configureMockApi, resetMockApiConfig, resetDatabase } from '@/api'

configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
// ... run the test ...
resetMockApiConfig()
resetDatabase()
```

## Layout of the source

```
src/
  api/        mock API: seed data, database, errors, config, types
  components/ app shell (Layout) and shared UI
  features/
    offerings/ temple picker, search, offering list
    cart/      cart state, reducer, localStorage persistence
    order/     order form, validation, confirmation
    orders/    staff list: filters, sorting, pagination, cancel
  lib/        shared helpers (price formatting, async resource hook)
  routes/     one component per route
  test/       Jest setup and test helpers
  theme/      colour tokens and contrast checks
```

## Pull requests

One problem, one issue, one branch, one PR into `main`.

| # | Problem                                                     | Issue | PR |
| - | ----------------------------------------------------------- | ----- | -- |
| 1 | Devotees can browse and search a temple's offerings          | [#1](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/issues/1) | [#11](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/pull/11) |
| 2 | Devotees can build an offering cart and submit an order      | [#2](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/issues/2) | [#13](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/pull/13) |
| 3 | Devotees get one confirmed order, and keep their work when it fails | [#3](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/issues/3) | [#14](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/pull/14) |
| 4 | Temple staff can look up, filter and cancel orders           | [#4](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/issues/4) | [#12](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/pull/12) |
| 5 | The booking flow works on a small phone, by keyboard and with a screen reader | [#5](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/issues/5) | _in progress — link to be added_ |

Groundwork that came before the five problems:
[#7](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/pull/7) (app shell and a green test
baseline) and [#9](https://github.com/Anburaj2203/tdb-vazhipadu-frontend/pull/9) (the mock API).
