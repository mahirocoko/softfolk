import { mountCatalog } from './catalog.ts'
import { parseCollection, publicUrl } from './collection.ts'

const root = document
const loadError = document.getElementById('load-error')
const runtimeBaseUrl = import.meta.env.BASE_URL
const collectionUrl = publicUrl('data/avatars.json', runtimeBaseUrl)

try {
  const response = await fetch(collectionUrl)
  if (!response.ok) {
    throw new Error(`Could not load ${collectionUrl} (${response.status}).`)
  }
  const collection = parseCollection(await response.json())
  mountCatalog(root, collection, runtimeBaseUrl)
} catch (error) {
  if (loadError) {
    loadError.hidden = false
    loadError.textContent =
      error instanceof Error
        ? error.message
        : 'The identity index could not be loaded.'
  }
}
