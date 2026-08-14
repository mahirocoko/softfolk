import { describe, expect, it } from 'vitest'
import {
  canonicalAssetPath,
  filterAvatars,
  parseCollection,
  portraitAlt,
  publicUrl,
} from '../src/collection.ts'
import { loadSourceCollection } from './helpers.ts'

describe('collection filtering', () => {
  const collection = loadSourceCollection()

  it('returns the full roster for a blank query', () => {
    expect(filterAvatars(collection.avatars, '  ')).toHaveLength(16)
  })

  it('matches identity names without requiring exact case', () => {
    const found = filterAvatars(collection.avatars, 'NoA')
    expect(found.map((avatar) => avatar.id)).toEqual(['noa'])
  })

  it('matches existing tags from the public index', () => {
    const glasses = filterAvatars(collection.avatars, 'glasses')
    expect(glasses.map((avatar) => avatar.id)).toEqual(['noa', 'lumi'])

    const older = filterAvatars(collection.avatars, 'older')
    expect(older.map((avatar) => avatar.id)).toEqual(['rowan', 'ines', 'lumi'])
  })

  it('matches the explicitly authored Japanese identity tag', () => {
    expect(filterAvatars(collection.avatars, 'japanese').map((avatar) => avatar.id)).toEqual([
      'pax',
    ])
  })

  it('requires every search term to match', () => {
    const found = filterAvatars(collection.avatars, 'older jewel-palette')
    expect(found.map((avatar) => avatar.id)).toEqual(['ines'])
  })

  it('returns an empty list for queries that match no name or tag', () => {
    expect(filterAvatars(collection.avatars, 'zzzz-not-a-tag')).toEqual([])
  })
})

describe('collection contract', () => {
  it('rejects a path that leaves the nested canonical shape', () => {
    expect(() =>
      parseCollection({
        version: 1,
        costumes: [
          { id: 'signature', name: 'Signature' },
          { id: 'everyday', name: 'Everyday' },
          { id: 'work', name: 'Work' },
        ],
        avatars: [
          {
            id: 'aster',
            name: 'Aster',
            tags: ['calm'],
            costumes: {
              signature: 'assets/aster-signature.png',
              everyday: 'assets/aster/everyday.png',
              work: 'assets/aster/work.png',
            },
          },
        ],
      }),
    ).toThrow(/signature path must be assets\/aster\/signature\.png/)
  })

  it('builds public URLs and alt text from index fields only', () => {
    const collection = loadSourceCollection()
    const aster = collection.avatars[0]
    expect(aster.id).toBe('aster')
    expect(publicUrl(aster.costumes.signature)).toBe('/assets/aster/signature.png')
    expect(publicUrl(aster.costumes.signature, '/softfolk/')).toBe(
      '/softfolk/assets/aster/signature.png',
    )
    expect(canonicalAssetPath('aster', 'work')).toBe('assets/aster/work.png')
    expect(portraitAlt(aster, 'Signature')).toContain('Aster in signature costume')
    expect(portraitAlt(aster, 'Signature')).toContain('copper-bob')
  })
})
