export type MockApiConfig = {
  minLatencyMs: number
  maxLatencyMs: number
  failureRate: number
  random: () => number
}

const DEFAULT_CONFIG: MockApiConfig = {
  minLatencyMs: 200,
  maxLatencyMs: 1000,
  failureRate: 0.1,
  random: Math.random,
}

let activeConfig: MockApiConfig = { ...DEFAULT_CONFIG }

export function getMockApiConfig(): MockApiConfig {
  return { ...activeConfig }
}

export function configureMockApi(overrides: Partial<MockApiConfig>): MockApiConfig {
  activeConfig = { ...activeConfig, ...overrides }
  return { ...activeConfig }
}

export function resetMockApiConfig(): MockApiConfig {
  activeConfig = { ...DEFAULT_CONFIG }
  return { ...activeConfig }
}
