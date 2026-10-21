import type {
  Avatar,
  CatalogFacet,
  Collection,
  CostumeId,
  StageThemeId,
} from './collection.ts'
import {
  COSTUME_IDS,
  DEFAULT_STAGE_THEME,
  PORTRAIT_SIZE,
  backgroundFileName,
  buildShareUrl,
  costumeName,
  downloadFileName,
  facetAvatars,
  featuredAvatars,
  filterAvatars,
  isCatalogFacet,
  isCostumeId,
  isStageThemeId,
  kindName,
  parseShareState,
  portraitAlt,
  publicUrl,
} from './collection.ts'

export interface CatalogState {
  query: string
  costumeId: CostumeId
  activeAvatarId: string
  stageTheme: StageThemeId
  likes: number
  isLiked: boolean
  isFollowing: boolean
  facet: CatalogFacet
  visibleCount: number
  recents: string[]
  selectorQuery: string
  selectorFacet: 'all' | 'people' | 'pals'
}

export const ROSTER_BATCH_SIZE = 12
export const MAX_RECENT_IDENTITIES = 6

// Seeded "recent" row; real selections replace it most-recent-first.
export const DEFAULT_RECENT_IDS = ['aster', 'moon-cat', 'cloud-bunny', 'star-duck', 'zuri', 'mira']

export function initialState(collection?: Collection): CatalogState {
  const defaultId = collection?.avatars[0]?.id ?? 'aster'
  return {
    query: '',
    costumeId: 'signature',
    activeAvatarId: defaultId,
    stageTheme: DEFAULT_STAGE_THEME,
    likes: 24,
    isLiked: false,
    isFollowing: false,
    facet: 'featured',
    visibleCount: ROSTER_BATCH_SIZE,
    recents: [...DEFAULT_RECENT_IDS],
    selectorQuery: '',
    selectorFacet: 'all',
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

function themeDisplayName(theme: StageThemeId): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1)
}

export function mountCatalog(root: ParentNode, collection: Collection, runtimeBaseUrl = '/'): void {
  // Synchronize dynamic stats from loaded collection
  const heroIdentitiesCount = root.querySelector<HTMLElement>('#hero-identities-count')
  if (heroIdentitiesCount) {
    heroIdentitiesCount.textContent = String(collection.avatars.length)
  }
  const heroPortraitsCount = root.querySelector<HTMLElement>('#hero-portraits-count')
  if (heroPortraitsCount) {
    heroPortraitsCount.textContent = String(collection.avatars.length * collection.costumes.length)
  }
  const catalogIdentitiesCount = root.querySelector<HTMLElement>('#catalog-identities-count')
  if (catalogIdentitiesCount) {
    catalogIdentitiesCount.textContent = String(collection.avatars.length)
  }

  const facetCounts: Record<CatalogFacet, number> = {
    featured: featuredAvatars(collection).length,
    all: collection.avatars.length,
    people: collection.avatars.filter((avatar) => avatar.kind === 'person').length,
    pals: collection.avatars.filter((avatar) => avatar.kind === 'pal').length,
  }
  root.querySelectorAll<HTMLElement>('[data-facet-count]').forEach((el) => {
    const facet = el.dataset.facetCount
    if (isCatalogFacet(facet)) {
      el.textContent = String(facetCounts[facet])
    }
  })

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
  const facetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-facet]')]
  const tagChips = [...root.querySelectorAll<HTMLButtonElement>('[data-tag-chip]')]
  const showMoreBtn = root.querySelector<HTMLButtonElement>('#show-more')
  const showMoreRemaining = root.querySelector<HTMLElement>('#show-more-remaining')

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
  const showcaseStage = root.querySelector<HTMLElement>('.showcase-stage')
  const specimenPortrait = root.querySelector<HTMLImageElement>('#specimen-portrait')
  const activeSpecimenSnippet = root.querySelector<HTMLElement>('#active-specimen-snippet')
  const pinnedWrap = root.querySelector<HTMLElement>('#pinned-identities')
  const teamGrid = root.querySelector<HTMLElement>('#team-members-grid')
  const shuffleBtn = root.querySelector<HTMLButtonElement>('[data-action="shuffle"]')
  const copySnippetBtn = root.querySelector<HTMLButtonElement>('[data-action="copy-active-snippet"]')
  const downloadTransparent = root.querySelector<HTMLAnchorElement>('#download-transparent')
  const downloadBackgroundBtn = root.querySelector<HTMLButtonElement>('#download-background')
  const shareViewBtn = root.querySelector<HTMLButtonElement>('#share-view')
  const studioStatus = root.querySelector<HTMLElement>('#studio-status')
  const swatches = [...root.querySelectorAll<HTMLButtonElement>('.swatch-btn')]

  // Identity selector elements
  const selectTrigger = root.querySelector<HTMLButtonElement>('#identity-select-trigger')
  const selectBackdrop = root.querySelector<HTMLElement>('[data-select-backdrop]')
  const selectPanel = root.querySelector<HTMLElement>('#identity-select-panel')
  const selectSearch = root.querySelector<HTMLInputElement>('#identity-select-search')
  const selectGrid = root.querySelector<HTMLElement>('#identity-select-grid')
  const selectClose = root.querySelector<HTMLButtonElement>('[data-close-select]')
  const selectStatus = root.querySelector<HTMLElement>('[data-select-status]')
  const selectFacetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-select-facet]')]

  // Showcase family tabs (mobile Social / Chat / Profile switcher)
  const familyTabs = [...root.querySelectorAll<HTMLButtonElement>('[data-family]')]

  // Read the stage's declared initial theme, then let share-state params override
  if (studioStage && isStageThemeId(studioStage.dataset.theme)) {
    state.stageTheme = studioStage.dataset.theme
  }

  if (typeof window !== 'undefined' && window.location?.search) {
    const shared = parseShareState(window.location.search, collection)
    if (shared.identity) {
      state.activeAvatarId = shared.identity
    }
    if (shared.costume) {
      state.costumeId = shared.costume
    }
    if (shared.theme) {
      state.stageTheme = shared.theme
    }
  }

  state.recents = [
    state.activeAvatarId,
    ...state.recents.filter((id) => id !== state.activeAvatarId),
  ].slice(0, MAX_RECENT_IDENTITIES)

  const announceStudio = (message: string): void => {
    if (studioStatus) {
      studioStatus.textContent = message
    }
  }

  const activeAvatar = (): Avatar | undefined =>
    collection.avatars.find((a) => a.id === state.activeAvatarId) ?? collection.avatars[0]

  // Render pinned/recent identity buttons beside the Select identity trigger
  const renderPinned = (): void => {
    if (!pinnedWrap) return
    const focusedId =
      document.activeElement instanceof HTMLElement &&
      pinnedWrap.contains(document.activeElement)
        ? document.activeElement.dataset.avatarId
        : undefined
    pinnedWrap.replaceChildren()
    for (const id of state.recents) {
      const avatar = collection.avatars.find((a) => a.id === id)
      if (!avatar) continue

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'pinned-btn'
      btn.dataset.avatarId = avatar.id
      btn.setAttribute('aria-pressed', avatar.id === state.activeAvatarId ? 'true' : 'false')
      btn.setAttribute('aria-label', `Show ${avatar.name} in the Studio`)
      btn.title = avatar.name

      const img = document.createElement('img')
      img.src = publicUrl(avatar.costumes[state.costumeId], runtimeBaseUrl)
      img.alt = ''
      img.width = 40
      img.height = 40
      img.loading = 'lazy'

      btn.append(img)
      btn.addEventListener('click', () => {
        setActiveAvatar(avatar.id)
        announceStudio(`${avatar.name} is active in the Studio.`)
      })

      pinnedWrap.append(btn)
    }
    if (focusedId) {
      pinnedWrap.querySelector<HTMLButtonElement>(`[data-avatar-id="${focusedId}"]`)?.focus()
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
      img.decoding = 'async'

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
    const avatar = activeAvatar()
    if (!avatar) return

    const assetPath = avatar.costumes[state.costumeId]
    const canonicalAssetUrl = publicUrl(assetPath)
    const runtimeAssetUrl = publicUrl(assetPath, runtimeBaseUrl)
    const costumeLabel = costumeName(collection, state.costumeId)

    if (activeSpecimenSnippet) {
      renderAssetSnippet(activeSpecimenSnippet, canonicalAssetUrl)
    }

    if (specimenPortrait) {
      specimenPortrait.src = runtimeAssetUrl
      specimenPortrait.alt = portraitAlt(avatar, costumeLabel)
    }

    if (downloadTransparent) {
      downloadTransparent.href = runtimeAssetUrl
      downloadTransparent.download = downloadFileName(avatar, state.costumeId)
      downloadTransparent.setAttribute('aria-label', `Download ${avatar.name} transparent PNG`)
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
      el.textContent = costumeLabel
    })

    const dynamicKinds = root.querySelectorAll<HTMLElement>('.active-dynamic-kind')
    dynamicKinds.forEach((el) => {
      el.textContent = kindName(avatar.kind)
    })

    // Update pinned identity buttons using aria-pressed
    if (pinnedWrap) {
      const buttons = pinnedWrap.querySelectorAll<HTMLButtonElement>('.pinned-btn')
      buttons.forEach((btn) => {
        const isSelected = btn.dataset.avatarId === avatar.id
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
        const img = btn.querySelector('img')
        if (img) {
          const btnAvatar = collection.avatars.find((a) => a.id === btn.dataset.avatarId)
          if (btnAvatar) {
            img.src = publicUrl(btnAvatar.costumes[state.costumeId], runtimeBaseUrl)
          }
        }
      })
    }

    // Update selector grid selected state and costume
    if (selectGrid) {
      const buttons = selectGrid.querySelectorAll<HTMLButtonElement>('.select-grid-btn')
      buttons.forEach((btn) => {
        const isSelected = btn.dataset.selectId === avatar.id
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false')
        const img = btn.querySelector('img')
        if (img) {
          const btnAvatar = collection.avatars.find((a) => a.id === btn.dataset.selectId)
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

    // Sync hero cast chips with the active Studio identity
    root.querySelectorAll<HTMLAnchorElement>('[data-cast]').forEach((chip) => {
      const isSelected = chip.dataset.cast === avatar.id
      chip.classList.toggle('is-active', isSelected)
      if (isSelected) {
        chip.setAttribute('aria-current', 'true')
      } else {
        chip.removeAttribute('aria-current')
      }
    })
  }

  const setActiveAvatar = (avatarId: string): void => {
    if (!collection.avatars.some((a) => a.id === avatarId)) return
    state.activeAvatarId = avatarId
    state.recents = [
      avatarId,
      ...state.recents.filter((id) => id !== avatarId),
    ].slice(0, MAX_RECENT_IDENTITIES)
    renderPinned()
    updateStudioSpecimen()
  }

  const syncTheme = (theme: StageThemeId): void => {
    state.stageTheme = theme
    if (studioStage) {
      studioStage.dataset.theme = theme
    }
    if (showcaseStage) {
      showcaseStage.dataset.theme = theme
    }
    swatches.forEach((s) => {
      const isCurrent = s.dataset.theme === theme
      s.classList.toggle('active', isCurrent)
      s.setAttribute('aria-pressed', isCurrent ? 'true' : 'false')
    })
  }

  const renderRoster = (): void => {
    if (!roster || !status || !empty) return

    const costumeLabel = costumeName(collection, state.costumeId)
    const queryLabel = state.query.trim()
    const searching = queryLabel.length > 0

    // Search reaches every matching identity; facets own the browsing population.
    const population = facetAvatars(collection, state.facet)
    const matches = searching ? filterAvatars(collection.avatars, queryLabel) : population
    const visible =
      searching || state.facet === 'featured'
        ? matches
        : matches.slice(0, state.visibleCount)

    status.textContent = statusText({
      visibleCount: visible.length,
      matchCount: matches.length,
      totalCount: collection.avatars.length,
      query: queryLabel,
      costumeLabel,
      facet: state.facet,
    })
    syncRoster(roster, visible, state.costumeId, costumeLabel, runtimeBaseUrl)

    const isEmpty = matches.length === 0
    empty.hidden = !isEmpty
    roster.hidden = isEmpty
    if (resetButton) {
      resetButton.hidden = !searching
    }

    if (isEmpty) {
      const emptyQuery = empty.querySelector<HTMLElement>('[data-empty-query]')
      if (emptyQuery) {
        emptyQuery.textContent = queryLabel
      }
    }

    facetButtons.forEach((btn) => {
      const isCurrent = !searching && btn.dataset.facet === state.facet
      btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false')
      btn.classList.toggle('active', isCurrent)
    })

    tagChips.forEach((chip) => {
      const isCurrent = searching && chip.dataset.tagChip === queryLabel
      chip.setAttribute('aria-pressed', isCurrent ? 'true' : 'false')
    })

    if (showMoreBtn) {
      const remaining = matches.length - visible.length
      const canShowMore = !searching && state.facet !== 'featured' && remaining > 0
      showMoreBtn.hidden = !canShowMore
      if (showMoreRemaining) {
        showMoreRemaining.textContent = canShowMore ? `${remaining} remaining` : ''
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

  facetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const facet = btn.dataset.facet
      if (!isCatalogFacet(facet)) return
      state.facet = facet
      state.visibleCount = ROSTER_BATCH_SIZE
      renderRoster()
    })
  })

  tagChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tagChip
      if (!tag || !searchInput) return
      searchInput.value = tag
      state.query = tag
      renderRoster()
      searchInput.focus()
    })
  })

  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      state.visibleCount += ROSTER_BATCH_SIZE
      renderRoster()
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
  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const theme = swatch.dataset.theme
      if (!isStageThemeId(theme)) return
      syncTheme(theme)
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
        setActiveAvatar(randomAvatar.id)
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

      if (swatches.length > 0) {
        const randomSwatch = swatches[Math.floor(Math.random() * swatches.length)]
        if (randomSwatch && isStageThemeId(randomSwatch.dataset.theme)) {
          syncTheme(randomSwatch.dataset.theme)
        }
      }

      renderRoster()
    })
  }

  // Copy code snippet button
  if (copySnippetBtn && activeSpecimenSnippet) {
    copySnippetBtn.addEventListener('click', () => {
      copyToClipboard(activeSpecimenSnippet.textContent ?? '', copySnippetBtn)
      announceStudio('Snippet copied to clipboard.')
    })
  }

  // Primary transparent download announcement (native anchor download)
  if (downloadTransparent) {
    downloadTransparent.addEventListener('click', () => {
      const avatar = activeAvatar()
      if (avatar) {
        announceStudio(
          `Downloading ${downloadFileName(avatar, state.costumeId)} — transparent ${avatar.name} PNG.`,
        )
      }
    })
  }

  // Secondary background export: ephemeral client-side composite on the active theme
  if (downloadBackgroundBtn) {
    downloadBackgroundBtn.addEventListener('click', () => {
      void downloadWithBackground()
    })
  }

  const downloadWithBackground = async (): Promise<void> => {
    const avatar = activeAvatar()
    if (!avatar) return
    const fileName = backgroundFileName(avatar, state.costumeId, state.stageTheme)

    const canvas = document.createElement('canvas')
    canvas.width = PORTRAIT_SIZE
    canvas.height = PORTRAIT_SIZE
    const context = canvas.getContext('2d')
    if (!context) {
      announceStudio('Background export is not available in this browser.')
      return
    }

    const computedBg =
      studioStage && typeof window !== 'undefined'
        ? window.getComputedStyle(studioStage).getPropertyValue('--avatar-theme-bg').trim()
        : ''
    context.fillStyle = computedBg || '#D3DFDC'
    context.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE)

    const image = new Image()
    image.src = publicUrl(avatar.costumes[state.costumeId], runtimeBaseUrl)
    try {
      await image.decode()
    } catch {
      announceStudio('The portrait could not be loaded for background export.')
      return
    }
    context.drawImage(image, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE)

    canvas.toBlob((blob) => {
      if (!blob) {
        announceStudio('Background export is not available in this browser.')
        return
      }
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      announceStudio(
        `Downloaded ${fileName} — ${avatar.name} on the ${themeDisplayName(state.stageTheme)} background.`,
      )
    }, 'image/png')
  }

  // Share view: copies an explicit identity/costume/theme URL
  if (shareViewBtn) {
    shareViewBtn.addEventListener('click', () => {
      const avatar = activeAvatar()
      if (!avatar || typeof window === 'undefined') return
      const url = buildShareUrl(window.location.href, {
        identity: state.activeAvatarId,
        costume: state.costumeId,
        theme: state.stageTheme,
      })
      copyToClipboard(url, shareViewBtn)
      announceStudio(
        `Link copied — ${avatar.name}, ${costumeName(collection, state.costumeId)}, ${themeDisplayName(state.stageTheme)} background.`,
      )
    })
  }

  // Hero cast chips send their identity into the Studio
  root.querySelectorAll<HTMLAnchorElement>('[data-cast]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.cast
      if (!id) return
      setActiveAvatar(id)
      const avatar = collection.avatars.find((a) => a.id === id)
      if (avatar) {
        announceStudio(`${avatar.name} is active in the Studio.`)
      }
    })
  })

  // Identity selector (desktop popover / mobile bottom sheet)
  const selectorPopulation = (): Avatar[] => {
    if (state.selectorFacet === 'people') {
      return collection.avatars.filter((avatar) => avatar.kind === 'person')
    }
    if (state.selectorFacet === 'pals') {
      return collection.avatars.filter((avatar) => avatar.kind === 'pal')
    }
    return [...collection.avatars]
  }

  const renderSelector = (): void => {
    if (!selectGrid) return
    const population = selectorPopulation()
    const visible = filterAvatars(population, state.selectorQuery)

    selectGrid.replaceChildren()
    for (const avatar of visible) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'select-grid-btn'
      btn.dataset.selectId = avatar.id
      btn.setAttribute('role', 'option')
      btn.setAttribute('aria-selected', avatar.id === state.activeAvatarId ? 'true' : 'false')

      const img = document.createElement('img')
      img.src = publicUrl(avatar.costumes[state.costumeId], runtimeBaseUrl)
      img.alt = ''
      img.width = 44
      img.height = 44
      img.loading = 'lazy'

      const name = document.createElement('span')
      name.textContent = avatar.name

      btn.append(img, name)
      btn.addEventListener('click', () => {
        setActiveAvatar(avatar.id)
        announceStudio(`${avatar.name} is active in the Studio.`)
        closeSelect()
      })
      selectGrid.append(btn)
    }

    if (selectStatus) {
      const queryLabel = state.selectorQuery.trim()
      if (queryLabel.length > 0) {
        selectStatus.textContent =
          visible.length === 0
            ? `No identities match “${queryLabel}”.`
            : `${visible.length} of ${population.length} identities match “${queryLabel}”.`
      } else {
        selectStatus.textContent = `${population.length} identities`
      }
    }
  }

  const isSelectOpen = (): boolean => Boolean(selectPanel && !selectPanel.hidden)

  const openSelect = (): void => {
    if (!selectPanel || !selectBackdrop || !selectTrigger) return
    state.selectorQuery = ''
    if (selectSearch) {
      selectSearch.value = ''
    }
    renderSelector()
    selectBackdrop.hidden = false
    selectPanel.hidden = false
    selectTrigger.setAttribute('aria-expanded', 'true')
    selectSearch?.focus()
  }

  const closeSelect = (): void => {
    if (!selectPanel || !selectBackdrop || !selectTrigger) return
    selectPanel.hidden = true
    selectBackdrop.hidden = true
    selectTrigger.setAttribute('aria-expanded', 'false')
    selectTrigger.focus()
  }

  if (selectTrigger) {
    selectTrigger.addEventListener('click', () => {
      if (isSelectOpen()) {
        closeSelect()
      } else {
        openSelect()
      }
    })
  }

  if (selectBackdrop) {
    selectBackdrop.addEventListener('click', () => {
      closeSelect()
    })
  }

  if (selectClose) {
    selectClose.addEventListener('click', () => {
      closeSelect()
    })
  }

  if (selectSearch) {
    selectSearch.addEventListener('input', () => {
      state.selectorQuery = selectSearch.value
      renderSelector()
    })
  }

  selectFacetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const facet = btn.dataset.selectFacet
      if (facet !== 'all' && facet !== 'people' && facet !== 'pals') return
      state.selectorFacet = facet
      selectFacetButtons.forEach((other) => {
        other.setAttribute('aria-pressed', other === btn ? 'true' : 'false')
      })
      renderSelector()
    })
  })

  root.addEventListener('keydown', (event) => {
    if (event instanceof KeyboardEvent && event.key === 'Escape' && isSelectOpen()) {
      event.preventDefault()
      closeSelect()
    }
  })

  if (selectPanel) {
    selectPanel.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const focusable = [
          ...selectPanel.querySelectorAll<HTMLElement>(
            'button, input, [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((el) => !el.hasAttribute('disabled'))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    })
  }

  if (selectGrid) {
    selectGrid.addEventListener('keydown', (event) => {
      if (
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowUp'
      ) {
        return
      }
      const buttons = [...selectGrid.querySelectorAll<HTMLButtonElement>('.select-grid-btn')]
      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (currentIndex === -1) return
      event.preventDefault()

      let columns = 1
      if (typeof window !== 'undefined') {
        const template = window.getComputedStyle(selectGrid).gridTemplateColumns
        const tracks = template ? template.split(' ').filter(Boolean).length : 0
        columns = Math.max(1, tracks || 1)
      }

      let nextIndex = currentIndex
      if (event.key === 'ArrowRight') nextIndex = Math.min(buttons.length - 1, currentIndex + 1)
      if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
      if (event.key === 'ArrowDown') nextIndex = Math.min(buttons.length - 1, currentIndex + columns)
      if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - columns)
      buttons[nextIndex]?.focus()
    })
  }

  // Showcase family tabs (mobile); desktop shows all three panels
  familyTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const family = tab.dataset.family
      if (!family || !showcaseStage) return
      showcaseStage.dataset.activeFamily = family
      familyTabs.forEach((other) => {
        const isCurrent = other === tab
        other.setAttribute('aria-selected', isCurrent ? 'true' : 'false')
        other.tabIndex = isCurrent ? 0 : -1
      })
    })
  })

  const showcaseTabList = root.querySelector<HTMLElement>('.showcase-tabs')
  if (showcaseTabList) {
    showcaseTabList.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      const currentIndex = familyTabs.indexOf(document.activeElement as HTMLButtonElement)
      if (currentIndex === -1) return
      event.preventDefault()
      const nextIndex =
        event.key === 'ArrowRight'
          ? (currentIndex + 1) % familyTabs.length
          : (currentIndex - 1 + familyTabs.length) % familyTabs.length
      familyTabs[nextIndex]?.focus()
      familyTabs[nextIndex]?.click()
    })
  }

  // Interactive mockups: Like button
  const likeBtns = root.querySelectorAll<HTMLButtonElement>('[data-interactive="like"]')
  const reactionsCountEl = root.querySelector<HTMLElement>('.reactions-count')
  likeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.isLiked = !state.isLiked
      const nextLikes = state.likes + (state.isLiked ? 1 : 0)
      btn.classList.toggle('liked', state.isLiked)
      btn.setAttribute('aria-pressed', state.isLiked ? 'true' : 'false')
      const countEl = btn.querySelector('.like-count')
      if (countEl) {
        countEl.textContent = String(nextLikes)
      }
      if (reactionsCountEl) {
        reactionsCountEl.textContent = `Liked by Moon Cat, Cloud Bunny and ${nextLikes} others`
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
        b.setAttribute('aria-pressed', state.isFollowing ? 'true' : 'false')
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

  // Normalize UI to the resolved initial state (DOM default + share params)
  const initialCostumeRadio = root.querySelector<HTMLInputElement>(
    `input[name="costume"][value="${state.costumeId}"]`,
  )
  if (initialCostumeRadio) {
    initialCostumeRadio.checked = true
  }
  syncTheme(state.stageTheme)
  renderPinned()
  renderRoster()
}

function copyToClipboard(text: string, button: HTMLElement): void {
  const originalSvg = button.innerHTML
  const showCopied = () => {
    button.innerHTML = `<svg class="copy-success-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
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

interface StatusArgs {
  visibleCount: number
  matchCount: number
  totalCount: number
  query: string
  costumeLabel: string
  facet: CatalogFacet
}

function statusText(args: StatusArgs): string {
  const { visibleCount, matchCount, totalCount, query, costumeLabel, facet } = args
  if (query.length > 0) {
    if (matchCount === 0) {
      return `No identities match “${query}”. Showing ${costumeLabel}.`
    }
    return `${matchCount} of ${totalCount} identities match “${query}” · ${costumeLabel}`
  }
  if (facet === 'featured') {
    return `${matchCount} featured identities · ${costumeLabel}`
  }
  if (visibleCount < matchCount) {
    return `Showing ${visibleCount} of ${matchCount} identities · ${costumeLabel}`
  }
  return `${matchCount} identities · ${costumeLabel}`
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
