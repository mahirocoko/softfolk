import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canonicalAssetPath, COSTUME_IDS, PORTRAIT_SIZE } from '../src/collection.ts'
import { loadSourceCollection, readPngIhdr, repoPath } from './helpers.ts'

function listPngFiles(directory: string): string[] {
  const found: string[] = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      found.push(...listPngFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.png')) {
      found.push(fullPath)
    }
  }

  return found.sort()
}

describe('source inventory', () => {
  const collection = loadSourceCollection()
  const assetsRoot = repoPath('assets')
  const pngFiles = listPngFiles(assetsRoot)

  it('keeps exactly twelve identities and three costumes in the public index', () => {
    expect(collection.version).toBe(1)
    expect(collection.avatars).toHaveLength(12)
    expect(collection.costumes.map((costume) => costume.id)).toEqual([...COSTUME_IDS])
  })

  it('has exactly 36 nested PNGs and no root-level asset aliases', () => {
    expect(pngFiles).toHaveLength(36)

    const rootAliases = readdirSync(assetsRoot).filter((name) => name.endsWith('.png'))
    expect(rootAliases).toEqual([])

    for (const filePath of pngFiles) {
      const relativePath = relative(assetsRoot, filePath).split(sep)
      expect(relativePath).toHaveLength(2)
      expect(relativePath[1]).toMatch(/^(signature|everyday|work)\.png$/)
    }
  })

  it('points every index path at an existing nested PNG with matching identity folders', () => {
    const expected = collection.avatars.flatMap((avatar) =>
      COSTUME_IDS.map((costumeId) => repoPath(canonicalAssetPath(avatar.id, costumeId))),
    )

    expect(pngFiles).toEqual([...expected].sort())

    for (const avatar of collection.avatars) {
      for (const costumeId of COSTUME_IDS) {
        expect(avatar.costumes[costumeId]).toBe(canonicalAssetPath(avatar.id, costumeId))
        expect(statSync(repoPath(avatar.costumes[costumeId])).isFile()).toBe(true)
      }
    }
  })

  it('keeps every canonical PNG as 256×256 8-bit RGBA', () => {
    for (const filePath of pngFiles) {
      const header = readPngIhdr(readFileSync(filePath))
      expect(header).toEqual({
        width: PORTRAIT_SIZE,
        height: PORTRAIT_SIZE,
        bitDepth: 8,
        colorType: 6,
      })
    }
  })
})
