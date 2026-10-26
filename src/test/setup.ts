import { webcrypto } from 'node:crypto'
import { TextDecoder, TextEncoder } from 'node:util'
import '@testing-library/jest-dom'

// jsdom ships neither TextEncoder/TextDecoder nor WebCrypto, and react-router
// reaches for both at import time. Node's own implementations stand in.
Object.assign(globalThis, {
  TextEncoder: globalThis.TextEncoder ?? TextEncoder,
  TextDecoder: globalThis.TextDecoder ?? TextDecoder,
  crypto: globalThis.crypto ?? webcrypto,
})

beforeEach(() => {
  window.localStorage.clear()
})
