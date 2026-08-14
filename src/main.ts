import { mountCatalog } from './catalog.ts'
import { parseCollection } from './collection.ts'

const root = document
const loadError = document.getElementById('load-error')

try {
  const response = await fetch('/data/avatars.json')
  if (!response.ok) {
    throw new Error(`Could not load /data/avatars.json (${response.status}).`)
  }
  const collection = parseCollection(await response.json())
  mountCatalog(root, collection)
} catch (error) {
  if (loadError) {
    loadError.hidden = false
    loadError.textContent =
      error instanceof Error
        ? error.message
        : 'The identity index could not be loaded.'
  }
}
