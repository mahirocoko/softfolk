import { describe, expect, it } from 'vitest'
import {
  FEATURED_IDS,
  backgroundFileName,
  buildShareUrl,
  canonicalAssetPath,
  facetAvatars,
  featuredAvatars,
  filterAvatars,
  parseCollection,
  parseShareState,
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
            kind: 'person',
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

  it('rejects an avatar without an explicit valid kind', () => {
    const collection = loadSourceCollection()
    const aster = collection.avatars[0]
    const base = {
      version: 1,
      costumes: collection.costumes,
    }
    const validCostumes = aster.costumes

    expect(() =>
      parseCollection({
        ...base,
        avatars: [{ id: 'aster', name: 'Aster', tags: [], costumes: validCostumes }],
      }),
    ).toThrow(/invalid kind/)

    expect(() =>
      parseCollection({
        ...base,
        avatars: [
          { id: 'aster', name: 'Aster', kind: 'robot', tags: [], costumes: validCostumes },
        ],
      }),
    ).toThrow(/invalid kind/)
  })
})

describe('collection facets', () => {
  const collection = loadSourceCollection()

  it('resolves the curated Featured list in its own order without touching registry order', () => {
    const featured = featuredAvatars(collection)
    expect(featured.map((avatar) => avatar.id)).toEqual([...FEATURED_IDS])
    expect(featured).toHaveLength(12)
    for (const avatar of featured) {
      expect(collection.avatars.some((entry) => entry.id === avatar.id)).toBe(true)
    }

    // Featured order differs from canonical order: kai/mira trail rowan/mio there
    const canonicalHead = collection.avatars.slice(0, 12).map((avatar) => avatar.id)
    expect(featured.map((avatar) => avatar.id)).not.toEqual(canonicalHead)
  })

  it('filters People and Pals by explicit kind while preserving canonical order', () => {
    const people = facetAvatars(collection, 'people')
    const pals = facetAvatars(collection, 'pals')

    expect(people.length).toBeGreaterThan(0)
    expect(pals.length).toBeGreaterThan(0)
    expect(people.every((avatar) => avatar.kind === 'person')).toBe(true)
    expect(pals.every((avatar) => avatar.kind === 'pal')).toBe(true)
    expect(people.length + pals.length).toBe(collection.avatars.length)

    const canonicalIds = collection.avatars.map((avatar) => avatar.id)
    const peopleIds = people.map((avatar) => avatar.id)
    expect([...peopleIds].sort((a, b) => canonicalIds.indexOf(a) - canonicalIds.indexOf(b))).toEqual(
      peopleIds,
    )

    expect(facetAvatars(collection, 'all').map((avatar) => avatar.id)).toEqual(canonicalIds)
    expect(facetAvatars(collection, 'featured').map((avatar) => avatar.id)).toEqual([
      ...FEATURED_IDS,
    ])
  })
})

describe('share and background export helpers', () => {
  const collection = loadSourceCollection()

  it('builds an explicit share URL and parses it back losslessly', () => {
    const url = buildShareUrl('https://mahirocoko.github.io/softfolk/?stale=1', {
      identity: 'moon-cat',
      costume: 'work',
      theme: 'blue',
    })
    expect(url).toBe('https://mahirocoko.github.io/softfolk/?identity=moon-cat&costume=work&theme=blue')

    const parsed = parseShareState('?identity=moon-cat&costume=work&theme=blue', collection)
    expect(parsed).toEqual({ identity: 'moon-cat', costume: 'work', theme: 'blue' })
  })

  it('drops unknown or invalid share params instead of inventing state', () => {
    const parsed = parseShareState(
      '?identity=not-real&costume=space&theme=periwinkle',
      collection,
    )
    expect(parsed).toEqual({})
  })

  it('names background exports softfolk-<identity>-<costume>-<theme>.png', () => {
    const moonCat = collection.avatars.find((avatar) => avatar.id === 'moon-cat')
    if (!moonCat) {
      throw new Error('Moon Cat is missing from the collection.')
    }
    expect(backgroundFileName(moonCat, 'yukata', 'blue')).toBe('softfolk-moon-cat-yukata-blue.png')
  })
})
