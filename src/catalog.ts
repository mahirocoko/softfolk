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
  activeAvatarId: string
  stageTheme: string
  likes: number
  isLiked: boolean
  isFollowing: boolean
}

export function initialState(collection?: Collection): CatalogState {
  const defaultId = collection?.avatars[0]?.id ?? 'aster'
  return {
    query: '',
    costumeId: 'signature',
    activeAvatarId: defaultId,
    stageTheme: 'sage',
    likes: 24,
    isLiked: false,
    isFollowing: false,
  }
}

function renderAssetSnippet(element: HTMLElement, assetUrl: string): void {
  const tagOpen = document.createElement('span')
  tagOpen.className = 'hl-tag'
  tagOpen.textContent = '<img'

  const attribute = document.createElement('span')
  attribute.className = 'hl-attr'
  attribute.textContent = 'src'

  const value = document.createElement('span')
  value.className = 'hl-str'
  value.textContent = `"${assetUrl}"`

  const tagClose = document.createElement('span')
  tagClose.className = 'hl-tag'
  tagClose.textContent = '/>'

  element.replaceChildren(tagOpen, ' ', attribute, '=', value, ' ', tagClose)
}

export function mountCatalog(root: ParentNode, collection: Collection, runtimeBaseUrl = '/'): void {
  const searchInput = root.querySelector<HTMLInputElement>('#identity-search')
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset-search]')
  const roster = root.querySelector<HTMLElement>('#roster')
  const empty = root.querySelector<HTMLElement>('#empty-results')
  const status = root.querySelector<HTMLElement>('#roster-status')
  const dialog = root.querySelector<HTMLDialogElement>('#compare-dialog')
  const dialogTitle = root.querySelector<HTMLElement>('#compare-title')
  const dialogStage = root.querySelector<HTMLElement>('#compare-stage')
  const dialogClose = root.querySelector<HTMLButtonElement>('[data-close-compare]')
  const discoverForm = root.querySelector<HTMLFormElement>('#discover')

  const state = initialState(collection)
  let compareOpener: HTMLElement | null = null

  // Check if initial costume is checked in DOM
  const selectedCostume = root.querySelector<HTMLInputElement>(
    'input[name="costume"]:checked',
  )
  if (selectedCostume && isCostumeId(selectedCostume.value)) {
    state.costumeId = selectedCostume.value
  }

  // Playground elements
  const studioStage = root.querySelector<HTMLElement>('#studio-stage')
  const activeSpecimenSnippet = root.querySelector<HTMLElement>('#active-specimen-snippet')
  const avatarStrip = root.querySelector<HTMLElement>('#studio-avatar-strip')
  const teamGrid = root.querySelector<HTMLElement>('#team-members-grid')
  const shuffleBtn = root.querySelector<HTMLButtonElement>('[data-action="shuffle"]')
  const copySnippetBtn = root.querySelector<HTMLButtonElement>('[data-action="copy-active-snippet"]')

  // Render identity buttons in the studio selector strip
  if (avatarStrip) {
    avatarStrip.replaceChildren()
    for (const avatar of collection.avatars) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'strip-avatar-btn'
      btn.dataset.avatarId = avatar.id
      btn.setAttribute('aria-pressed', avatar.id === state.activeAvatarId ? 'true' : 'false')

      const img = document.createElement('img')
      img.src = publicUrl(avatar.costumes[state.costumeId], runtimeBaseUrl)
      img.alt = '' // Empty alt so accessible name is derived solely from the text label
      img.width = 44
      img.height = 44
      img.loading = 'lazy'

      const label = document.createElement('span')
      label.className = 'strip-avatar-label'
      label.textContent = avatar.name

      btn.append(img, label)
      btn.addEventListener('click', () => {
        setActiveAvatar(avatar.id)
      })

      avatarStrip.append(btn)
    }
  }

  // Populate mutual identity cards in UI mockup
  if (teamGrid) {
    teamGrid.replaceChildren()
    const mutualSample = collection.avatars.slice(0, 3)
    for (const member of mutualSample) {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'mutual-item-btn'
      item.dataset.teamAvatar = member.id
      item.setAttribute('aria-pressed', member.id === state.activeAvatarId ? 'true' : 'false')

      const img = document.createElement('img')
      img.src = publicUrl(member.costumes[state.costumeId], runtimeBaseUrl)
      img.alt = '' // Decorative image inside button
      img.width = 44
      img.height = 44
      img.loading = 'lazy'

      const name = document.createElement('span')
      name.className = 'mutual-name'
      name.textContent = member.name

      item.append(img, name)

      item.addEventListener('click', () => {
        setActiveAvatar(member.id)
      })

      teamGrid.append(item)
    }
  }

  const updateStudioSpecimen = (): void => {
    const avatar =
      collection.avatars.find((a) => a.id === state.activeAvatarId) ??
      collection.avatars[0]
    if (!avatar) return

    const assetPath = avatar.costumes[state.costumeId]
    const canonicalAssetUrl = publicUrl(assetPath)
    const runtimeAssetUrl = publicUrl(assetPath, runtimeBaseUrl)

    if (activeSpecimenSnippet) {
      renderAssetSnippet(activeSpecimenSnippet, canonicalAssetUrl)
    }

    // Update dynamic mockup elements
    const dynamicAvatars = root.querySelectorAll<HTMLImageElement>('.active-dynamic-avatar')
    dynamicAvatars.forEach((img) => {
      img.src = runtimeAssetUrl
      img.alt = avatar.name
    })

    const dynamicNames = root.querySelectorAll<HTMLElement>('.active-dynamic-name')
    dynamicNames.forEach((el) => {
      el.textContent = avatar.name
    })

    const dynamicCostumes = root.querySelectorAll<HTMLElement>('.active-dynamic-costume')
    dynamicCostumes.forEach((el) => {
      el.textContent = costumeName(collection, state.costumeId)
    })

    // Update active strip buttons using aria-pressed
    if (avatarStrip) {
      const buttons = avatarStrip.querySelectorAll<HTMLButtonElement>('.strip-avatar-btn')
      buttons.forEach((btn) => {
        const isSelected = btn.dataset.avatarId === avatar.id
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
        btn.classList.toggle('active', isSelected)
        const img = btn.querySelector('img')
        if (img) {
          const btnAvatar = collection.avatars.find((a) => a.id === btn.dataset.avatarId)
          if (btnAvatar) {
            img.src = publicUrl(btnAvatar.costumes[state.costumeId], runtimeBaseUrl)
          }
        }
      })
    }

    // Update mutual identity avatars
    if (teamGrid) {
      const items = teamGrid.querySelectorAll<HTMLButtonElement>('.mutual-item-btn')
      items.forEach((chip) => {
        const isSelected = chip.dataset.teamAvatar === avatar.id
        chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
        chip.classList.toggle('active', isSelected)
        const img = chip.querySelector('img')
        if (img) {
          const chipAvatar = collection.avatars.find((a) => a.id === chip.dataset.teamAvatar)
          if (chipAvatar) {
            img.src = publicUrl(chipAvatar.costumes[state.costumeId], runtimeBaseUrl)
          }
        }
      })
    }
  }

  const setActiveAvatar = (avatarId: string): void => {
    state.activeAvatarId = avatarId
    updateStudioSpecimen()
  }

  const renderRoster = (): void => {
    if (!roster || !status || !empty) return

    const visible = filterAvatars(collection.avatars, state.query)
    const costumeLabel = costumeName(collection, state.costumeId)
    const queryLabel = state.query.trim()

    status.textContent = statusText(visible.length, collection.avatars.length, queryLabel, costumeLabel)
    syncRoster(roster, visible, state.costumeId, costumeLabel, runtimeBaseUrl)

    const hasQuery = queryLabel.length > 0
    const isEmpty = visible.length === 0
    empty.hidden = !isEmpty
    roster.hidden = isEmpty
    if (resetButton) {
      resetButton.hidden = !hasQuery
    }

    if (isEmpty) {
      const emptyQuery = empty.querySelector<HTMLElement>('[data-empty-query]')
      if (emptyQuery) {
        emptyQuery.textContent = queryLabel
      }
    }

    updateStudioSpecimen()
  }

  if (discoverForm) {
    discoverForm.addEventListener('submit', (event) => {
      event.preventDefault()
    })
  }

  if (searchInput) {
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
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      clearSearch()
      searchInput?.focus()
    })
  }

  // Listen for costume radio changes
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

  // Theme swatch selectors with aria-pressed
  const swatches = root.querySelectorAll<HTMLButtonElement>('.swatch-btn')
  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const theme = swatch.dataset.theme
      if (!theme) return

      state.stageTheme = theme
      if (studioStage) {
        studioStage.dataset.theme = theme
      }

      swatches.forEach((s) => {
        const isCurrent = s === swatch
        s.classList.toggle('active', isCurrent)
        s.setAttribute('aria-pressed', isCurrent ? 'true' : 'false')
      })
    })
  })

  // Shuffle button (randomizes avatar, costume, and stage theme)
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      const randomAvatar =
        collection.avatars[Math.floor(Math.random() * collection.avatars.length)]
      const randomCostume =
        COSTUME_IDS[Math.floor(Math.random() * COSTUME_IDS.length)]
      if (randomAvatar) {
        state.activeAvatarId = randomAvatar.id
      }
      if (randomCostume) {
        state.costumeId = randomCostume
        const costumeRadio = root.querySelector<HTMLInputElement>(
          `input[name="costume"][value="${randomCostume}"]`,
        )
        if (costumeRadio) {
          costumeRadio.checked = true
        }
      }

      const allSwatches = [...root.querySelectorAll<HTMLButtonElement>('.swatch-btn')]
      if (allSwatches.length > 0) {
        const randomSwatch = allSwatches[Math.floor(Math.random() * allSwatches.length)]
        if (randomSwatch?.dataset.theme) {
          state.stageTheme = randomSwatch.dataset.theme
          if (studioStage) {
            studioStage.dataset.theme = randomSwatch.dataset.theme
          }
          allSwatches.forEach((s) => {
            const isCurrent = s === randomSwatch
            s.classList.toggle('active', isCurrent)
            s.setAttribute('aria-pressed', isCurrent ? 'true' : 'false')
          })
        }
      }

      renderRoster()
    })
  }

  // Copy code snippet button
  if (copySnippetBtn && activeSpecimenSnippet) {
    copySnippetBtn.addEventListener('click', () => {
      copyToClipboard(activeSpecimenSnippet.textContent ?? '', copySnippetBtn)
    })
  }

  // Interactive mockups: Like button
  const likeBtns = root.querySelectorAll<HTMLButtonElement>('[data-interactive="like"]')
  likeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.isLiked = !state.isLiked
      btn.classList.toggle('liked', state.isLiked)
      const countEl = btn.querySelector('.like-count')
      if (countEl) {
        countEl.textContent = String(state.likes + (state.isLiked ? 1 : 0))
      }
    })
  })

  // Interactive mockups: Follow buttons
  const followBtns = root.querySelectorAll<HTMLButtonElement>('[data-interactive="follow"]')
  followBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.isFollowing = !state.isFollowing
      followBtns.forEach((b) => {
        b.classList.toggle('following', state.isFollowing)
        b.textContent = state.isFollowing ? 'Following' : 'Follow'
      })
    })
  })

  // Listen for compare clicks on the whole root
  root.addEventListener('click', (event) => {
    const trigger = event.target
    if (!(trigger instanceof Element)) {
      return
    }
    const button = trigger.closest<HTMLButtonElement>('[data-compare]')
    if (!button) {
      return
    }
    const avatarId = button.dataset.compare
    const avatar = collection.avatars.find((entry) => entry.id === avatarId)
    if (!avatar || !dialog || !dialogTitle || !dialogStage || !dialogClose) {
      return
    }
    openCompare(avatar, button, dialog, dialogTitle, dialogStage, dialogClose, collection)
  })

  if (dialog && dialogClose && dialogStage) {
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
  }

  function clearSearch(): void {
    if (searchInput) {
      searchInput.value = ''
    }
    state.query = ''
    renderRoster()
  }

  function openCompare(
    avatar: Avatar,
    opener: HTMLElement,
    dlg: HTMLDialogElement,
    titleEl: HTMLElement,
    stageEl: HTMLElement,
    closeBtn: HTMLButtonElement,
    col: Collection,
  ): void {
    compareOpener = opener
    titleEl.textContent = `${avatar.name} — Costumes`
    stageEl.replaceChildren()

    for (const costumeId of COSTUME_IDS) {
      const label = costumeName(col, costumeId)
      stageEl.append(compareFigure(avatar, costumeId, label, runtimeBaseUrl))
    }

    if (!dlg.open) {
      dlg.showModal()
    }
    closeBtn.focus()
  }

  renderRoster()
}

function copyToClipboard(text: string, button: HTMLElement): void {
  const originalSvg = button.innerHTML
  const showCopied = () => {
    button.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    setTimeout(() => {
      button.innerHTML = originalSvg
    }, 1800)
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showCopied(),
      () => {
        fallbackCopy(text)
        showCopied()
      },
    )
  } else {
    fallbackCopy(text)
    showCopied()
  }
}

function fallbackCopy(text: string): void {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  try {
    document.execCommand('copy')
  } catch {
    // ignore
  }
  document.body.removeChild(textArea)
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
  runtimeBaseUrl: string,
): void {
  const existing = [...roster.querySelectorAll<HTMLElement>('.identity')]
  const sameShape =
    existing.length === visible.length &&
    existing.every((item, index) => item.dataset.identity === visible[index]?.id)

  if (!sameShape) {
    roster.replaceChildren()
    for (const [index, avatar] of visible.entries()) {
      roster.append(identityItem(avatar, costumeId, costumeLabel, index, runtimeBaseUrl))
    }
    return
  }

  for (const [index, avatar] of visible.entries()) {
    const item = existing[index]
    if (!item) {
      continue
    }
    updateIdentityItem(item, avatar, costumeId, costumeLabel, runtimeBaseUrl)
  }
}

function updateIdentityItem(
  item: HTMLElement,
  avatar: Avatar,
  costumeId: CostumeId,
  costumeLabel: string,
  runtimeBaseUrl: string,
): void {
  const image = item.querySelector('img')
  const download = item.querySelector<HTMLAnchorElement>('a[download]')
  if (!image || !download) {
    throw new Error(`Identity ${avatar.id} is missing portrait or download.`)
  }

  image.src = publicUrl(avatar.costumes[costumeId], runtimeBaseUrl)
  image.alt = portraitAlt(avatar, costumeLabel)
  download.href = publicUrl(avatar.costumes[costumeId], runtimeBaseUrl)
  download.download = downloadFileName(avatar, costumeId)
  download.setAttribute('aria-label', `Download ${avatar.name} PNG`)
}

function identityItem(
  avatar: Avatar,
  costumeId: CostumeId,
  costumeLabel: string,
  index: number,
  runtimeBaseUrl: string,
): HTMLElement {
  const item = document.createElement('li')
  item.className = 'identity'
  item.dataset.identity = avatar.id

  const figure = document.createElement('figure')
  figure.className = 'identity-figure'

  const portraitBtn = document.createElement('button')
  portraitBtn.type = 'button'
  portraitBtn.className = 'portrait-btn portrait-wrap'
  portraitBtn.dataset.compare = avatar.id
  portraitBtn.setAttribute('aria-haspopup', 'dialog')
  portraitBtn.setAttribute('aria-label', `Compare ${avatar.name} costumes`)

  const image = document.createElement('img')
  image.className = 'portrait'
  image.src = publicUrl(avatar.costumes[costumeId], runtimeBaseUrl)
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

  portraitBtn.append(image)

  const caption = document.createElement('figcaption')
  const name = document.createElement('h3')
  name.className = 'identity-name'
  name.textContent = avatar.name

  caption.append(name)
  figure.append(portraitBtn, caption)

  const actions = document.createElement('div')
  actions.className = 'identity-actions'

  const download = document.createElement('a')
  download.className = 'btn btn-sm btn-secondary card-action-btn card-action-download'
  download.href = publicUrl(avatar.costumes[costumeId], runtimeBaseUrl)
  download.download = downloadFileName(avatar, costumeId)
  download.setAttribute('aria-label', `Download ${avatar.name} PNG`)
  download.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Download</span>`

  const compare = document.createElement('button')
  compare.type = 'button'
  compare.className = 'btn btn-sm btn-subtle card-action-btn card-action-compare'
  compare.dataset.compare = avatar.id
  compare.setAttribute('aria-haspopup', 'dialog')
  compare.setAttribute('aria-label', `Compare ${avatar.name} costumes`)
  compare.title = `Compare ${avatar.name} costumes`
  compare.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`

  actions.append(download, compare)
  item.append(figure, actions)
  return item
}

function compareFigure(
  avatar: Avatar,
  costumeId: CostumeId,
  costumeLabel: string,
  runtimeBaseUrl: string,
): HTMLElement {
  const figure = document.createElement('figure')
  figure.className = 'compare-figure'

  const image = document.createElement('img')
  image.className = 'portrait'
  image.src = publicUrl(avatar.costumes[costumeId], runtimeBaseUrl)
  image.alt = portraitAlt(avatar, costumeLabel)
  image.width = 256
  image.height = 256
  image.decoding = 'async'

  const caption = document.createElement('figcaption')
  const heading = document.createElement('h3')
  heading.textContent = costumeLabel

  const download = document.createElement('a')
  download.className = 'btn btn-sm btn-primary'
  download.href = publicUrl(avatar.costumes[costumeId], runtimeBaseUrl)
  download.download = downloadFileName(avatar, costumeId)
  download.textContent = `Download ${costumeLabel.toLowerCase()} PNG`

  caption.append(heading, download)
  figure.append(image, caption)
  return figure
}
