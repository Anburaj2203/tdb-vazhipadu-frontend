import type { MockDatabase } from '@/api/seed'
import { buildSeedData } from '@/api/seed'

let database: MockDatabase = buildSeedData()

export function getDatabase(): MockDatabase {
  return database
}

export function resetDatabase(now?: number): MockDatabase {
  database = buildSeedData(now)
  return database
}
