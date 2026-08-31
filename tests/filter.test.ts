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
    expect(filterAvatars(collection.avatars, '  ')).toHaveLength(collection.avatars.length)
  })

  it('matches identity names without requiring exact case across People and Pals', () => {
    const foundPals = filterAvatars(collection.avatars, 'mOOn-cAt')
    expect(foundPals.map((avatar) => avatar.id)).toEqual(['moon-cat'])

    const foundPeople = filterAvatars(collection.avatars, 'AsTeR')
    expect(foundPeople.map((avatar) => avatar.id)).toEqual(['aster'])
  })

  it('matches tags across both People and Pals', () => {
    const eyeMask = filterAvatars(collection.avatars, 'eye-mask')
    expect(eyeMask.map((avatar) => avatar.id)).toEqual(['snow-ferret', 'cocoa-raccoon'])

    const glasses = filterAvatars(collection.avatars, 'glasses')
    expect(glasses.map((avatar) => avatar.id)).toEqual(['noa', 'lumi'])

    const earthPalette = filterAvatars(collection.avatars, 'earth-palette')
    expect(earthPalette.map((avatar) => avatar.id)).toEqual([
      'eden',
      'marlo',
      'sota',
      'moss-capybara',
      'acorn-squirrel',
      'cocoa-raccoon',
      'sprout-hedgehog',
    ])
  })

  it('matches the whisker-dots tag across multiple identities', () => {
    expect(filterAvatars(collection.avatars, 'whisker-dots').map((avatar) => avatar.id)).toEqual([
      'shell-otter',
      'pebble-seal',
    ])
  })

  it('requires every search term to match', () => {
    const found = filterAvatars(collection.avatars, 'earth-palette eye-mask')
    expect(found.map((avatar) => avatar.id)).toEqual(['cocoa-raccoon'])

    const foundPeople = filterAvatars(collection.avatars, 'cool-palette glasses')
    expect(foundPeople.map((avatar) => avatar.id)).toEqual(['noa', 'lumi'])
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
          { id: 'formal', name: 'Formal' },
          { id: 'yukata', name: 'Yukata' },
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
              formal: 'assets/aster/formal.png',
              yukata: 'assets/aster/yukata.png',
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
  })
})
