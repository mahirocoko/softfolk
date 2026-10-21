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

  const REQUIRED_PEOPLE_IDS = [
    'aster', 'juno', 'kai', 'mira', 'rowan',
    'noa', 'zuri', 'theo', 'ines', 'omar',
    'sora', 'eden', 'lumi', 'pax', 'marlo',
    'roux', 'aoi', 'mio', 'ren', 'sota',
  ]

  const REQUIRED_PALS_IDS = [
    'moon-cat', 'cloud-bunny', 'moss-capybara', 'star-duck', 'rain-frog',
    'shell-otter', 'ember-fox', 'dusk-bat', 'honey-bear', 'peach-hamster',
    'snow-ferret', 'acorn-squirrel', 'puddle-penguin', 'bloom-deer', 'cocoa-raccoon',
    'lantern-moth', 'pebble-seal', 'sprout-hedgehog', 'comet-shiba', 'dream-alpaca',
  ]

  it('declares five costumes and includes all baseline People and Pals identities uniquely', () => {
    expect(collection.version).toBe(1)
    expect(collection.costumes.map((costume) => costume.id)).toEqual([...COSTUME_IDS])
    expect(collection.avatars.length).toBeGreaterThanOrEqual(40)

    const avatarIds = collection.avatars.map((avatar) => avatar.id)
    const uniqueIds = new Set(avatarIds)
    expect(uniqueIds.size).toBe(avatarIds.length)
    expect(avatarIds.slice(0, 40)).toEqual([...REQUIRED_PEOPLE_IDS, ...REQUIRED_PALS_IDS])

    for (const requiredId of REQUIRED_PEOPLE_IDS) {
      expect(uniqueIds.has(requiredId)).toBe(true)
    }
    for (const requiredId of REQUIRED_PALS_IDS) {
      expect(uniqueIds.has(requiredId)).toBe(true)
    }
  })

  it('assigns explicit kind metadata matching the canonical People and Pals split', () => {
    const people = new Set(REQUIRED_PEOPLE_IDS)
    const pals = new Set(REQUIRED_PALS_IDS)

    for (const avatar of collection.avatars) {
      expect(avatar.kind === 'person' || avatar.kind === 'pal').toBe(true)
      if (people.has(avatar.id)) {
        expect(avatar.kind).toBe('person')
      }
      if (pals.has(avatar.id)) {
        expect(avatar.kind).toBe('pal')
      }
    }

    expect(collection.avatars.filter((avatar) => avatar.kind === 'person')).toHaveLength(20)
    expect(collection.avatars.filter((avatar) => avatar.kind === 'pal')).toHaveLength(20)
  })

  it('has exactly avatars.length * 5 nested PNGs and no root-level asset aliases', () => {
    expect(pngFiles).toHaveLength(collection.avatars.length * COSTUME_IDS.length)

    const rootAliases = readdirSync(assetsRoot).filter((name) => name.endsWith('.png'))
    expect(rootAliases).toEqual([])

    for (const filePath of pngFiles) {
      const relativePath = relative(assetsRoot, filePath).split(sep)
      expect(relativePath).toHaveLength(2)
      expect(relativePath[1]).toMatch(/^(signature|everyday|work|formal|yukata)\.png$/)
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

  it('scales the lossless byte budget by average portrait size', () => {
    const totalBytes = pngFiles.reduce((sum, filePath) => sum + statSync(filePath).size, 0)
    const averageBytes = totalBytes / pngFiles.length
    expect(averageBytes).toBeLessThanOrEqual(76_000)
  })
})
