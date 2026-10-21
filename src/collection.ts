export type CostumeId = 'signature' | 'everyday' | 'work' | 'formal' | 'yukata'

export type AvatarKind = 'person' | 'pal'

export interface Costume {
  id: CostumeId
  name: string
}

export interface Avatar {
  id: string
  name: string
  kind: AvatarKind
  tags: string[]
  costumes: Record<CostumeId, string>
}

export interface Collection {
  version: number
  costumes: Costume[]
  avatars: Avatar[]
}

export const COSTUME_IDS = ['signature', 'everyday', 'work', 'formal', 'yukata'] as const
export const PORTRAIT_SIZE = 256

const COSTUME_ID_SET = new Set<string>(COSTUME_IDS)
const AVATAR_KIND_SET = new Set<string>(['person', 'pal'])

export function isCostumeId(value: string): value is CostumeId {
  return COSTUME_ID_SET.has(value)
}

export function isAvatarKind(value: unknown): value is AvatarKind {
  return typeof value === 'string' && AVATAR_KIND_SET.has(value)
}

export type CatalogFacet = 'featured' | 'all' | 'people' | 'pals'

export const CATALOG_FACETS = ['featured', 'all', 'people', 'pals'] as const

// Curated Featured order is a catalog-owned list; it never mutates canonical registry order.
export const FEATURED_IDS = [
  'aster',
  'zuri',
  'rowan',
  'mio',
  'kai',
  'mira',
  'moon-cat',
  'cloud-bunny',
  'star-duck',
  'moss-capybara',
  'ember-fox',
  'dream-alpaca',
] as const

export function isCatalogFacet(value: unknown): value is CatalogFacet {
  return typeof value === 'string' && (CATALOG_FACETS as readonly string[]).includes(value)
}

export function featuredAvatars(collection: Collection): Avatar[] {
  const byId = new Map(collection.avatars.map((avatar) => [avatar.id, avatar]))
  return FEATURED_IDS.map((id) => byId.get(id)).filter((avatar): avatar is Avatar => Boolean(avatar))
}

export function facetAvatars(collection: Collection, facet: CatalogFacet): Avatar[] {
  if (facet === 'featured') {
    return featuredAvatars(collection)
  }
  if (facet === 'people') {
    return collection.avatars.filter((avatar) => avatar.kind === 'person')
  }
  if (facet === 'pals') {
    return collection.avatars.filter((avatar) => avatar.kind === 'pal')
  }
  return [...collection.avatars]
}

export function kindName(kind: AvatarKind): string {
  return kind === 'pal' ? 'Pal' : 'Person'
}

export function canonicalAssetPath(identityId: string, costumeId: CostumeId): string {
  return `assets/${identityId}/${costumeId}.png`
}

export function publicUrl(relativePath: string, basePath = '/'): string {
  const base = basePath.replace(/^\/+|\/+$/g, '')
  const path = relativePath.replace(/^\/+/, '')
  return `${base ? `/${base}` : ''}/${path}`
}

export function parseCollection(data: unknown): Collection {
  if (!data || typeof data !== 'object') {
    throw new Error('Collection root must be an object.')
  }

  const root = data as Record<string, unknown>
  if (root.version !== 1) {
    throw new Error('Unsupported collection version.')
  }
  if (!Array.isArray(root.costumes) || !Array.isArray(root.avatars)) {
    throw new Error('Collection must include costumes and avatars arrays.')
  }

  const costumes = root.costumes.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Costume ${index} is invalid.`)
    }
    const costume = entry as Record<string, unknown>
    if (typeof costume.id !== 'string' || !isCostumeId(costume.id)) {
      throw new Error(`Costume ${index} has an invalid id.`)
    }
    if (typeof costume.name !== 'string' || costume.name.length === 0) {
      throw new Error(`Costume ${index} has an invalid name.`)
    }
    return { id: costume.id, name: costume.name }
  })

  if (costumes.length !== COSTUME_IDS.length) {
    throw new Error('Collection must declare exactly five costumes.')
  }

  const avatars = root.avatars.map((entry, index) => parseAvatar(entry, index))

  return { version: 1, costumes, avatars }
}

function parseAvatar(entry: unknown, index: number): Avatar {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`Avatar ${index} is invalid.`)
  }

  const avatar = entry as Record<string, unknown>
  if (typeof avatar.id !== 'string' || !/^[a-z]+(?:-[a-z]+)*$/.test(avatar.id)) {
    throw new Error(`Avatar ${index} has an invalid id.`)
  }
  if (typeof avatar.name !== 'string' || avatar.name.length === 0) {
    throw new Error(`Avatar ${index} has an invalid name.`)
  }
  if (!isAvatarKind(avatar.kind)) {
    throw new Error(`Avatar ${index} (${avatar.id}) has an invalid kind.`)
  }
  if (!Array.isArray(avatar.tags) || avatar.tags.some((tag) => typeof tag !== 'string')) {
    throw new Error(`Avatar ${index} has invalid tags.`)
  }
  if (!avatar.costumes || typeof avatar.costumes !== 'object') {
    throw new Error(`Avatar ${index} is missing costumes.`)
  }

  const costumes = avatar.costumes as Record<string, unknown>
  const resolved = {} as Record<CostumeId, string>
  for (const costumeId of COSTUME_IDS) {
    const path = costumes[costumeId]
    const expected = canonicalAssetPath(avatar.id, costumeId)
    if (path !== expected) {
      throw new Error(`Avatar ${avatar.id} ${costumeId} path must be ${expected}.`)
    }
    resolved[costumeId] = expected
  }

  return {
    id: avatar.id,
    name: avatar.name,
    kind: avatar.kind,
    tags: avatar.tags as string[],
    costumes: resolved,
  }
}

export function costumeName(collection: Collection, costumeId: CostumeId): string {
  const match = collection.costumes.find((costume) => costume.id === costumeId)
  return match?.name ?? costumeId
}

export function filterAvatars(avatars: readonly Avatar[], query: string): Avatar[] {
  const terms = normalizeQuery(query)
  if (terms.length === 0) {
    return [...avatars]
  }

  return avatars.filter((avatar) => {
    const haystack = identityHaystack(avatar)
    return terms.every((term) => haystack.includes(term))
  })
}

export function identityHaystack(avatar: Avatar): string {
  return [avatar.id, avatar.name, ...avatar.tags].join(' ').toLowerCase()
}

export function normalizeQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

export function portraitAlt(avatar: Avatar, costumeLabel: string): string {
  const tagNote = avatar.tags.length > 0 ? ` Tags: ${avatar.tags.join(', ')}.` : ''
  return `${avatar.name} in ${costumeLabel.toLowerCase()} costume. Soft 3D portrait, ${PORTRAIT_SIZE} by ${PORTRAIT_SIZE} pixels.${tagNote}`
}

export function downloadFileName(avatar: Avatar, costumeId: CostumeId): string {
  return `${avatar.id}-${costumeId}.png`
}

export const STAGE_THEME_IDS = [
  'sage',
  'mint',
  'cream',
  'peach',
  'blue',
  'buttercream',
  'apricot',
] as const

export type StageThemeId = (typeof STAGE_THEME_IDS)[number]

export const DEFAULT_STAGE_THEME: StageThemeId = 'sage'

export function isStageThemeId(value: unknown): value is StageThemeId {
  return typeof value === 'string' && (STAGE_THEME_IDS as readonly string[]).includes(value)
}

export interface ShareState {
  identity: string
  costume: CostumeId
  theme: StageThemeId
}

export function buildShareUrl(baseUrl: string, state: ShareState): string {
  const url = new URL(baseUrl)
  url.search = ''
  url.searchParams.set('identity', state.identity)
  url.searchParams.set('costume', state.costume)
  url.searchParams.set('theme', state.theme)
  return url.toString()
}

export function parseShareState(search: string, collection: Collection): Partial<ShareState> {
  const params = new URLSearchParams(search)
  const state: Partial<ShareState> = {}

  const identity = params.get('identity')
  if (identity && collection.avatars.some((avatar) => avatar.id === identity)) {
    state.identity = identity
  }
  const costume = params.get('costume')
  if (costume && isCostumeId(costume)) {
    state.costume = costume
  }
  const theme = params.get('theme')
  if (theme && isStageThemeId(theme)) {
    state.theme = theme
  }
  return state
}

export function backgroundFileName(
  avatar: Avatar,
  costumeId: CostumeId,
  theme: StageThemeId,
): string {
  return `softfolk-${avatar.id}-${costumeId}-${theme}.png`
}
