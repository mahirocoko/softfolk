import type { Avatar, Collection, CostumeId } from './collection.ts'
import {
  COSTUME_IDS,
  costumeName,
  downloadFileName,
  filterAvatars,
  isCostumeId,
  portraitAlt,
  publicUrl,
} from './collection.ts'

export interface CatalogState {
  query: string
  costumeId: CostumeId
}

export function initialState(): CatalogState {
  return { query: '', costumeId: 'signature' }
}

export function mountCatalog(root: ParentNode, collection: Collection): void {
  const discoverForm = requireElement(root, '#discover', HTMLFormElement)
  const searchInput = requireElement(root, '#identity-search', HTMLInputElement)
  const resetButton = requireElement(root, '[data-reset-search]', HTMLButtonElement)
  const roster = requireElement(root, '#roster', HTMLElement)
  const empty = requireElement(root, '#empty-results', HTMLElement)
  const status = requireElement(root, '#roster-status', HTMLElement)
  const dialog = requireElement(root, '#compare-dialog', HTMLDialogElement)
  const dialogTitle = requireElement(root, '#compare-title', HTMLElement)
  const dialogStage = requireElement(root, '#compare-stage', HTMLElement)
  const dialogClose = requireElement(root, '[data-close-compare]', HTMLButtonElement)

  const state = initialState()
  let compareOpener: HTMLElement | null = null

  const selectedCostume = root.querySelector<HTMLInputElement>(
    'input[name="costume"]:checked',
  )
  if (selectedCostume && isCostumeId(selectedCostume.value)) {
    state.costumeId = selectedCostume.value
  }

  const renderRoster = (): void => {
    const visible = filterAvatars(collection.avatars, state.query)
    const costumeLabel = costumeName(collection, state.costumeId)
    const queryLabel = state.query.trim()

    status.textContent = statusText(visible.length, collection.avatars.length, queryLabel, costumeLabel)
    syncRoster(roster, visible, state.costumeId, costumeLabel)

    const hasQuery = queryLabel.length > 0
    const isEmpty = visible.length === 0
    empty.hidden = !isEmpty
    roster.hidden = isEmpty
    resetButton.hidden = !hasQuery

    if (isEmpty) {
      const emptyQuery = requireElement(empty, '[data-empty-query]', HTMLElement)
      emptyQuery.textContent = queryLabel
    }
  }

  discoverForm.addEventListener('submit', (event) => {
    event.preventDefault()
  })

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value
    renderRoster()
    if (document.activeElement !== searchInput) {
      searchInput.focus()
    }
  })

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchInput.value.length > 0) {
      event.preventDefault()
      clearSearch()
    }
  })

  resetButton.addEventListener('click', () => {
    clearSearch()
    searchInput.focus()
  })

  root.addEventListener('change', (event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement) || target.name !== 'costume') {
      return
    }
    if (!isCostumeId(target.value)) {
      return
    }
    state.costumeId = target.value
    renderRoster()
  })

  roster.addEventListener('click', (event) => {
    const trigger = event.target
    if (!(trigger instanceof Element)) {
      return
    }
    const button = trigger.closest<HTMLButtonElement>('[data-compare]')
    if (!button) {
      return
    }
    const avatar = collection.avatars.find((entry) => entry.id === button.dataset.compare)
    if (!avatar) {
      return
    }
    openCompare(avatar, button)
  })

  dialogClose.addEventListener('click', () => {
    dialog.close()
  })

  dialog.addEventListener('close', () => {
    const opener = compareOpener
    compareOpener = null
    dialogStage.replaceChildren()
    if (opener?.isConnected) {
      opener.focus()
    }
  })

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) {
        return
      }
      const rect = dialog.getBoundingClientRect()
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inside) {
        dialog.close()
      }
    })
  }

  function clearSearch(): void {
    searchInput.value = ''
    state.query = ''
    renderRoster()
  }

  function openCompare(avatar: Avatar, opener: HTMLElement): void {
    compareOpener = opener
    dialogTitle.textContent = avatar.name
    dialogStage.replaceChildren()

    for (const costumeId of COSTUME_IDS) {
      const label = costumeName(collection, costumeId)
      dialogStage.append(compareFigure(avatar, costumeId, label))
    }

    if (!dialog.open) {
      dialog.showModal()
    }
    dialogClose.focus()
  }

  renderRoster()
}

function statusText(
  visibleCount: number,
  totalCount: number,
  query: string,
  costumeLabel: string,
): string {
  if (query.length === 0) {
    return `${visibleCount} identities · ${costumeLabel}`
  }
  if (visibleCount === 0) {
    return `No identities match “${query}”. Showing ${costumeLabel}.`
  }
  return `${visibleCount} of ${totalCount} identities match “${query}” · ${costumeLabel}`
}

function syncRoster(
  roster: HTMLElement,
  visible: Avatar[],
  costumeId: CostumeId,
  costumeLabel: string,
): void {
  const existing = [...roster.querySelectorAll<HTMLElement>('.identity')]
  const sameShape =
    existing.length === visible.length &&
    existing.every((item, index) => item.dataset.identity === visible[index]?.id)

  if (!sameShape) {
    roster.replaceChildren()
    for (const [index, avatar] of visible.entries()) {
      roster.append(identityItem(avatar, costumeId, costumeLabel, index))
    }
    return
  }

  for (const [index, avatar] of visible.entries()) {
    const item = existing[index]
    if (!item) {
      continue
    }
    updateIdentityItem(item, avatar, costumeId, costumeLabel)
  }
}

function updateIdentityItem(
  item: HTMLElement,
  avatar: Avatar,
  costumeId: CostumeId,
  costumeLabel: string,
): void {
  const image = item.querySelector('img')
  const download = item.querySelector<HTMLAnchorElement>('a[download]')
  if (!image || !download) {
    throw new Error(`Identity ${avatar.id} is missing portrait or download.`)
  }

  image.src = publicUrl(avatar.costumes[costumeId])
  image.alt = portraitAlt(avatar, costumeLabel)
  download.href = publicUrl(avatar.costumes[costumeId])
  download.download = downloadFileName(avatar, costumeId)
  download.textContent = `Download ${costumeLabel.toLowerCase()}`
}

function identityItem(
  avatar: Avatar,
  costumeId: CostumeId,
  costumeLabel: string,
  index: number,
): HTMLElement {
  const item = document.createElement('li')
  item.className = 'identity'
  item.dataset.identity = avatar.id

  const figure = document.createElement('figure')
  figure.className = 'identity-figure'

  const image = document.createElement('img')
  image.className = 'portrait'
  image.src = publicUrl(avatar.costumes[costumeId])
  image.alt = portraitAlt(avatar, costumeLabel)
  image.width = 256
  image.height = 256
  image.decoding = 'async'
  if (index < 4) {
    image.loading = 'eager'
    image.fetchPriority = index < 2 ? 'high' : 'low'
  } else {
    image.loading = 'lazy'
    image.fetchPriority = 'low'
  }

  const caption = document.createElement('figcaption')
  const name = document.createElement('h2')
  name.className = 'identity-name'
  name.textContent = avatar.name

  const tags = document.createElement('p')
  tags.className = 'identity-tags'
  tags.textContent = avatar.tags.join(' · ')

  caption.append(name, tags)
  figure.append(image, caption)

  const actions = document.createElement('p')
  actions.className = 'identity-actions'

  const compare = document.createElement('button')
  compare.type = 'button'
  compare.className = 'text-action'
  compare.dataset.compare = avatar.id
  compare.setAttribute('aria-haspopup', 'dialog')
  compare.textContent = 'Compare costumes'

  const download = document.createElement('a')
  download.className = 'text-action'
  download.href = publicUrl(avatar.costumes[costumeId])
  download.download = downloadFileName(avatar, costumeId)
  download.textContent = `Download ${costumeLabel.toLowerCase()}`

  actions.append(compare, download)
  item.append(figure, actions)
  return item
}

function compareFigure(avatar: Avatar, costumeId: CostumeId, costumeLabel: string): HTMLElement {
  const figure = document.createElement('figure')
  figure.className = 'compare-figure'

  const image = document.createElement('img')
  image.className = 'portrait'
  image.src = publicUrl(avatar.costumes[costumeId])
  image.alt = portraitAlt(avatar, costumeLabel)
  image.width = 256
  image.height = 256
  image.decoding = 'async'

  const caption = document.createElement('figcaption')
  const heading = document.createElement('h3')
  heading.textContent = costumeLabel

  const download = document.createElement('a')
  download.className = 'text-action'
  download.href = publicUrl(avatar.costumes[costumeId])
  download.download = downloadFileName(avatar, costumeId)
  download.textContent = `Download ${costumeLabel.toLowerCase()} PNG`

  caption.append(heading, download)
  figure.append(image, caption)
  return figure
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
  Constructor: new () => T,
): T {
  const element = root.querySelector(selector)
  if (!(element instanceof Constructor)) {
    throw new Error(`Missing ${selector}.`)
  }
  return element
}
