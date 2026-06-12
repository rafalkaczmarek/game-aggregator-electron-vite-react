import { readFile } from 'node:fs/promises'
import { parse } from '@node-steam/vdf'

export async function readVdfFile(filePath: string): Promise<Record<string, unknown>> {
  const text = await readFile(filePath, 'utf8')
  return parse(text) as Record<string, unknown>
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

export function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}
