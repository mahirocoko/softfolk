import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCollection, type Collection } from '../src/collection.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export function repoPath(...parts: string[]): string {
  return join(repoRoot, ...parts)
}

export function loadSourceCollection(): Collection {
  const raw = readFileSync(repoPath('data', 'avatars.json'), 'utf8')
  return parseCollection(JSON.parse(raw))
}

export function readPngIhdr(buffer: Buffer): {
  width: number
  height: number
  bitDepth: number
  colorType: number
} {
  const signature = buffer.subarray(0, 8)
  const expected = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (!signature.equals(expected)) {
    throw new Error('Not a PNG file.')
  }

  const chunkType = buffer.subarray(12, 16).toString('ascii')
  if (chunkType !== 'IHDR') {
    throw new Error('PNG IHDR is missing.')
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  }
}
