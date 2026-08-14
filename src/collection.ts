export type CostumeId = 'signature' | 'everyday' | 'work'

export interface Costume {
  id: CostumeId
  name: string
}

export interface Avatar {
  id: string
  name: string
  tags: string[]
  costumes: Record<CostumeId, string>
}

export interface Collection {
  version: number
  costumes: Costume[]
  avatars: Avatar[]
}

export const COSTUME_IDS = ['signature', 'everyday', 'work'] as const
export const PORTRAIT_SIZE = 256

const COSTUME_ID_SET = new Set<string>(COSTUME_IDS)

export function isCostumeId(value: string): value is CostumeId {
  return COSTUME_ID_SET.has(value)
}

export function canonicalAssetPath(identityId: string, costumeId: CostumeId): string {
  return `assets/${identityId}/${costumeId}.png`
}

export function publicUrl(relativePath: string): string {
  return `/${relativePath.replace(/^\//, '')}`
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
    throw new Error('Collection must declare exactly three costumes.')
  }

  const avatars = root.avatars.map((entry, index) => parseAvatar(entry, index))

  return { version: 1, costumes, avatars }
}

function parseAvatar(entry: unknown, index: number): Avatar {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`Avatar ${index} is invalid.`)
  }

  const avatar = entry as Record<string, unknown>
  if (typeof avatar.id !== 'string' || !/^[a-z]+$/.test(avatar.id)) {
    throw new Error(`Avatar ${index} has an invalid id.`)
  }
  if (typeof avatar.name !== 'string' || avatar.name.length === 0) {
    throw new Error(`Avatar ${index} has an invalid name.`)
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
