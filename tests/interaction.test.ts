import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Avatar } from '../src/collection.ts'
import { FEATURED_IDS } from '../src/collection.ts'
import { initIntroMotion } from '../src/intro.ts'
import { loadSourceCollection } from './helpers.ts'
import { catalogMarkup, mountFixture } from './fixture.ts'

describe('catalog interaction', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('synchronizes dynamic hero, catalog, and facet counter elements from collection', () => {
    const collection = loadSourceCollection()
    const sourceAvatar = collection.avatars[0]
    if (!sourceAvatar) {
      throw new Error('Collection needs a baseline avatar.')
    }
    const futureAvatar: Avatar = {
      ...sourceAvatar,
      id: 'future-friend',
      name: 'Future Friend',
      costumes: {
        signature: 'assets/future-friend/signature.png',
        everyday: 'assets/future-friend/everyday.png',
        work: 'assets/future-friend/work.png',
        formal: 'assets/future-friend/formal.png',
        yukata: 'assets/future-friend/yukata.png',
      },
    }
    const expandedCollection = {
      ...collection,
      avatars: [...collection.avatars, futureAvatar],
    }
    mountFixture(expandedCollection)

    const heroIdentities = document.querySelector<HTMLElement>('#hero-identities-count')
    const heroPortraits = document.querySelector<HTMLElement>('#hero-portraits-count')
    const catalogIdentities = document.querySelector<HTMLElement>('#catalog-identities-count')

    expect(heroIdentities?.textContent).toBe(String(expandedCollection.avatars.length))
    expect(heroPortraits?.textContent).toBe(
      String(expandedCollection.avatars.length * expandedCollection.costumes.length),
    )
    expect(catalogIdentities?.textContent).toBe(String(expandedCollection.avatars.length))

    expect(
      document.querySelector<HTMLElement>('[data-facet-count="all"]')?.textContent,
    ).toBe(String(expandedCollection.avatars.length))
    expect(
      document.querySelector<HTMLElement>('[data-facet-count="people"]')?.textContent,
    ).toBe(String(expandedCollection.avatars.filter((a) => a.kind === 'person').length))
    expect(
      document.querySelector<HTMLElement>('[data-facet-count="pals"]')?.textContent,
    ).toBe(String(expandedCollection.avatars.filter((a) => a.kind === 'pal').length))
    expect(
      document.querySelector<HTMLElement>('[data-facet-count="featured"]')?.textContent,
    ).toBe(String(FEATURED_IDS.length))
  })

  it('defaults the roster to the curated Featured identities in curated order', () => {
    mountFixture(loadSourceCollection())
    const roster = document.querySelector<HTMLElement>('#roster')
    if (!roster) {
      throw new Error('Fixture is missing roster.')
    }

    const ids = [...roster.querySelectorAll<HTMLElement>('.identity')].map(
      (item) => item.dataset.identity,
    )
    expect(ids).toEqual([...FEATURED_IDS])

    const featuredBtn = document.querySelector<HTMLButtonElement>('[data-facet="featured"]')
    expect(featuredBtn?.getAttribute('aria-pressed')).toBe('true')

    const status = document.querySelector<HTMLElement>('#roster-status')
    expect(status?.textContent).toBe(`${FEATURED_IDS.length} featured identities · Signature`)

    const showMore = document.querySelector<HTMLButtonElement>('#show-more')
    expect(showMore?.hidden).toBe(true)
  })

  it('reveals the All facet in bounded batches with a truthful Show more action', () => {
    const collection = loadSourceCollection()
    mountFixture(collection)

    const allBtn = document.querySelector<HTMLButtonElement>('[data-facet="all"]')
    const showMore = document.querySelector<HTMLButtonElement>('#show-more')
    const remaining = document.querySelector<HTMLElement>('#show-more-remaining')
    const roster = document.querySelector<HTMLElement>('#roster')
    if (!allBtn || !showMore || !remaining || !roster) {
      throw new Error('Facet or Show more controls are missing.')
    }

    allBtn.click()

    expect(roster.querySelectorAll('.identity')).toHaveLength(12)
    expect(roster.querySelector('.identity')?.getAttribute('data-identity')).toBe('aster')
    expect(showMore.hidden).toBe(false)
    expect(remaining.textContent).toBe(`${collection.avatars.length - 12} remaining`)
    expect(document.querySelector<HTMLElement>('#roster-status')?.textContent).toBe(
      `Showing 12 of ${collection.avatars.length} identities · Signature`,
    )

    showMore.click()
    expect(roster.querySelectorAll('.identity')).toHaveLength(24)
    expect(remaining.textContent).toBe(`${collection.avatars.length - 24} remaining`)

    showMore.click()
    expect(roster.querySelectorAll('.identity')).toHaveLength(36)

    showMore.click()
    expect(roster.querySelectorAll('.identity')).toHaveLength(collection.avatars.length)
    expect(showMore.hidden).toBe(true)
    expect(document.querySelector<HTMLElement>('#roster-status')?.textContent).toBe(
      `${collection.avatars.length} identities · Signature`,
    )
  })

  it('filters People and Pals facets by explicit kind in canonical registry order', () => {
    const collection = loadSourceCollection()
    mountFixture(collection)

    const roster = document.querySelector<HTMLElement>('#roster')
    const peopleBtn = document.querySelector<HTMLButtonElement>('[data-facet="people"]')
    const palsBtn = document.querySelector<HTMLButtonElement>('[data-facet="pals"]')
    if (!roster || !peopleBtn || !palsBtn) {
      throw new Error('Facet controls are missing.')
    }

    palsBtn.click()
    let ids = [...roster.querySelectorAll<HTMLElement>('.identity')].map(
      (item) => item.dataset.identity,
    )
    const expectedPals = collection.avatars.filter((a) => a.kind === 'pal').map((a) => a.id)
    expect(ids).toEqual(expectedPals.slice(0, 12))
    expect(palsBtn.getAttribute('aria-pressed')).toBe('true')

    peopleBtn.click()
    ids = [...roster.querySelectorAll<HTMLElement>('.identity')].map(
      (item) => item.dataset.identity,
    )
    const expectedPeople = collection.avatars.filter((a) => a.kind === 'person').map((a) => a.id)
    expect(ids).toEqual(expectedPeople.slice(0, 12))
    expect(peopleBtn.getAttribute('aria-pressed')).toBe('true')
    expect(palsBtn.getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps search focused while live-filtering across the whole registry from any facet', () => {
    const collection = loadSourceCollection()
    mountFixture(collection)
    const search = document.querySelector<HTMLInputElement>('#identity-search')
    const roster = document.querySelector<HTMLElement>('#roster')
    if (!search || !roster) {
      throw new Error('Fixture is missing search or roster.')
    }

    expect(roster.querySelectorAll('.identity')).toHaveLength(FEATURED_IDS.length)

    search.focus()
    search.value = 'eye-mask'
    search.dispatchEvent(new Event('input', { bubbles: true }))

    // Search reaches all matching identities, not only the visible Featured batch
    expect(document.activeElement).toBe(search)
    expect(roster.querySelectorAll('.identity')).toHaveLength(2)
    expect(roster.querySelector('[data-identity="snow-ferret"]')).not.toBeNull()
    expect(roster.querySelector('[data-identity="cocoa-raccoon"]')).not.toBeNull()
    expect(document.querySelector<HTMLElement>('#empty-results')?.hidden).toBe(true)

    search.value = 'glasses'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    expect(roster.querySelectorAll('.identity')).toHaveLength(2)
    expect(roster.querySelector('[data-identity="noa"]')).not.toBeNull()
    expect(roster.querySelector('[data-identity="lumi"]')).not.toBeNull()
  })

  it('applies tag chips as search and restores the facet on clear', () => {
    mountFixture(loadSourceCollection())
    const search = document.querySelector<HTMLInputElement>('#identity-search')
    const chip = document.querySelector<HTMLButtonElement>('[data-tag-chip="glasses"]')
    const roster = document.querySelector<HTMLElement>('#roster')
    const reset = document.querySelector<HTMLButtonElement>('[data-reset-search]')
    if (!search || !chip || !roster || !reset) {
      throw new Error('Tag chip or search controls are missing.')
    }

    chip.click()

    expect(search.value).toBe('glasses')
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(roster.querySelectorAll('.identity')).toHaveLength(2)
    expect(document.activeElement).toBe(search)

    reset.click()

    expect(search.value).toBe('')
    expect(chip.getAttribute('aria-pressed')).toBe('false')
    expect(roster.querySelectorAll('.identity')).toHaveLength(FEATURED_IDS.length)
  })

  it('shows a truthful empty state and restores the roster on reset', () => {
    const collection = loadSourceCollection()
    mountFixture(collection)
    const search = document.querySelector<HTMLInputElement>('#identity-search')
    const reset = document.querySelector<HTMLButtonElement>('[data-reset-search]')
    const roster = document.querySelector<HTMLElement>('#roster')
    const empty = document.querySelector<HTMLElement>('#empty-results')
    if (!search || !reset || !roster || !empty) {
      throw new Error('Fixture is missing empty-state controls.')
    }

    search.value = 'no-such-identity'
    search.dispatchEvent(new Event('input', { bubbles: true }))

    expect(roster.hidden).toBe(true)
    expect(empty.hidden).toBe(false)
    expect(empty.textContent).toContain('no-such-identity')
    expect(reset.hidden).toBe(false)

    reset.click()

    expect(search.value).toBe('')
    expect(roster.hidden).toBe(false)
    expect(empty.hidden).toBe(true)
    expect(roster.querySelectorAll('.identity')).toHaveLength(FEATURED_IDS.length)
    expect(document.activeElement).toBe(search)
  })

  it('switches visible costume paths without rewriting identity ids', () => {
    mountFixture(loadSourceCollection())
    const work = document.querySelector<HTMLInputElement>('input[name="costume"][value="work"]')
    if (!work) {
      throw new Error('Missing work costume control.')
    }

    work.checked = true
    work.dispatchEvent(new Event('change', { bubbles: true }))

    expect(work.checked).toBe(true)
    expect(
      document.querySelector<HTMLInputElement>('input[name="costume"][value="signature"]')?.checked,
    ).toBe(false)

    const aster = document.querySelector('[data-identity="aster"] img')
    const download = document.querySelector<HTMLAnchorElement>('[data-identity="aster"] a[download]')
    if (!(aster instanceof HTMLImageElement) || !download) {
      throw new Error('Aster portrait is missing.')
    }

    expect(aster.getAttribute('src')).toBe('/assets/aster/work.png')
    expect(aster.getAttribute('width')).toBe('256')
    expect(aster.getAttribute('height')).toBe('256')
    expect(aster.alt).toContain('Aster')
    expect(download.getAttribute('href')).toBe('/assets/aster/work.png')
    expect(download.getAttribute('download')).toBe('aster-work.png')
    expect(download.textContent).toBe('Download')
    expect(download.getAttribute('aria-label')).toBe('Download Aster PNG')

    const compare = document.querySelector<HTMLButtonElement>('[data-identity="aster"] .card-action-compare')
    expect(compare?.getAttribute('aria-label')).toBe('Compare Aster costumes')
    expect(compare?.querySelector('svg')).not.toBeNull()
  })

  it('uses the Pages project base for runtime assets while preserving canonical snippets', () => {
    mountFixture(loadSourceCollection(), '/softfolk/')
    const portrait = document.querySelector<HTMLImageElement>('[data-identity="aster"] img')
    const download = document.querySelector<HTMLAnchorElement>('[data-identity="aster"] a[download]')
    const snippet = document.querySelector<HTMLElement>('#active-specimen-snippet')

    expect(portrait?.getAttribute('src')).toBe('/softfolk/assets/aster/signature.png')
    expect(download?.getAttribute('href')).toBe('/softfolk/assets/aster/signature.png')
    expect(snippet?.textContent).toBe('<img src="/assets/aster/signature.png" />')
  })

  it('keeps identity nodes when only the costume changes', () => {
    mountFixture(loadSourceCollection())
    const aster = document.querySelector('[data-identity="aster"]')
    const work = document.querySelector<HTMLInputElement>('input[name="costume"][value="work"]')
    if (!aster || !work) {
      throw new Error('Missing Aster node or work costume control.')
    }

    work.checked = true
    work.dispatchEvent(new Event('change', { bubbles: true }))

    expect(document.querySelector('[data-identity="aster"]')).toBe(aster)
  })

  it('moves focus into compare and returns it to the opener on close', () => {
    mountFixture(loadSourceCollection())
    const opener = document.querySelector<HTMLButtonElement>('[data-compare="cloud-bunny"]')
    const dialog = document.querySelector<HTMLDialogElement>('#compare-dialog')
    const close = document.querySelector<HTMLButtonElement>('[data-close-compare]')
    if (!opener || !dialog || !close) {
      throw new Error('Compare controls are missing.')
    }

    opener.focus()
    opener.click()

    expect(dialog.open).toBe(true)
    expect(document.activeElement).toBe(close)
    expect(dialog.querySelectorAll('a[download]')).toHaveLength(5)
    expect(
      [...dialog.querySelectorAll('a[download]')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/assets/cloud-bunny/signature.png',
      '/assets/cloud-bunny/everyday.png',
      '/assets/cloud-bunny/work.png',
      '/assets/cloud-bunny/formal.png',
      '/assets/cloud-bunny/yukata.png',
    ])

    close.click()

    expect(dialog.open).toBe(false)
    expect(document.activeElement).toBe(opener)
  })

  it('switches the active studio specimen when clicking a pinned identity', () => {
    mountFixture(loadSourceCollection())
    const bunnyBtn = document.querySelector<HTMLButtonElement>('[data-avatar-id="cloud-bunny"]')
    const mockupImg = document.querySelector<HTMLImageElement>('.active-dynamic-avatar')
    const mockupName = document.querySelector<HTMLElement>('.active-dynamic-name')
    const snippet = document.querySelector<HTMLElement>('#active-specimen-snippet')
    const specimen = document.querySelector<HTMLImageElement>('#specimen-portrait')
    const downloadTransparent = document.querySelector<HTMLAnchorElement>('#download-transparent')

    if (!bunnyBtn || !mockupImg || !mockupName || !snippet || !specimen || !downloadTransparent) {
      throw new Error('Studio elements missing in fixture.')
    }

    // Verify button accessible label is not duplicated
    const imgInBunny = bunnyBtn.querySelector('img')
    expect(imgInBunny?.getAttribute('alt')).toBe('')
    expect(bunnyBtn.getAttribute('aria-label')).toBe('Show Cloud Bunny in the Studio')

    bunnyBtn.click()

    expect(mockupName.textContent).toBe('Cloud Bunny')
    expect(mockupImg.src).toContain('/assets/cloud-bunny/signature.png')
    expect(snippet.textContent).toBe('<img src="/assets/cloud-bunny/signature.png" />')
    expect(snippet.querySelectorAll('.hl-tag')).toHaveLength(2)
    expect(snippet.querySelector('.hl-attr')?.textContent).toBe('src')
    expect(snippet.querySelector('.hl-str')?.textContent).toBe('"/assets/cloud-bunny/signature.png"')

    // The recents row re-renders with Cloud Bunny first; the fresh node owns the state
    const freshBunnyBtn = document.querySelector<HTMLButtonElement>('[data-avatar-id="cloud-bunny"]')
    expect(freshBunnyBtn).not.toBe(bunnyBtn)
    expect(freshBunnyBtn?.getAttribute('aria-pressed')).toBe('true')
    expect(specimen.src).toContain('/assets/cloud-bunny/signature.png')
    expect(specimen.alt).toContain('Cloud Bunny')
    expect(downloadTransparent.getAttribute('href')).toBe('/assets/cloud-bunny/signature.png')
    expect(downloadTransparent.getAttribute('download')).toBe('cloud-bunny-signature.png')
  })

  it('opens the identity selector, filters by search and kind, and selects with focus return', () => {
    const collection = loadSourceCollection()
    mountFixture(collection)
    const trigger = document.querySelector<HTMLButtonElement>('#identity-select-trigger')
    const panel = document.querySelector<HTMLElement>('#identity-select-panel')
    const backdrop = document.querySelector<HTMLElement>('[data-select-backdrop]')
    const search = document.querySelector<HTMLInputElement>('#identity-select-search')
    const grid = document.querySelector<HTMLElement>('#identity-select-grid')
    const status = document.querySelector<HTMLElement>('#studio-status')
    if (!trigger || !panel || !backdrop || !search || !grid || !status) {
      throw new Error('Identity selector elements are missing.')
    }

    expect(panel.hidden).toBe(true)

    trigger.click()

    expect(panel.hidden).toBe(false)
    expect(backdrop.hidden).toBe(false)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(search)
    expect(grid.querySelectorAll('.select-grid-btn')).toHaveLength(collection.avatars.length)

    // Kind facet narrows the grid
    const palsFacet = document.querySelector<HTMLButtonElement>('[data-select-facet="pals"]')
    palsFacet?.click()
    expect(grid.querySelectorAll('.select-grid-btn')).toHaveLength(
      collection.avatars.filter((a) => a.kind === 'pal').length,
    )

    // Search narrows within the facet
    search.value = 'moon'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    expect(grid.querySelectorAll('.select-grid-btn')).toHaveLength(1)

    const option = grid.querySelector<HTMLButtonElement>('[data-select-id="moon-cat"]')
    expect(option?.getAttribute('aria-selected')).toBe('false')
    option?.click()

    // Selection closes the sheet, returns focus, and updates the specimen
    expect(panel.hidden).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
    expect(document.querySelector<HTMLElement>('.specimen-name, .active-dynamic-name')?.textContent).toBe('Moon Cat')
    expect(status.textContent).toBe('Moon Cat is active in the Studio.')

    // The new selection leads the recent identities row
    const firstPinned = document.querySelector<HTMLButtonElement>('#pinned-identities .pinned-btn')
    expect(firstPinned?.dataset.avatarId).toBe('moon-cat')
  })

  it('closes the identity selector with Escape and returns focus to the trigger', () => {
    mountFixture(loadSourceCollection())
    const trigger = document.querySelector<HTMLButtonElement>('#identity-select-trigger')
    const panel = document.querySelector<HTMLElement>('#identity-select-panel')
    if (!trigger || !panel) {
      throw new Error('Identity selector elements are missing.')
    }

    trigger.click()
    expect(panel.hidden).toBe(false)

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(panel.hidden).toBe(true)
    expect(document.activeElement).toBe(trigger)

    // Also closes when Escape is pressed from the trigger or document while open
    trigger.click()
    expect(panel.hidden).toBe(false)
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(panel.hidden).toBe(true)
    expect(document.activeElement).toBe(trigger)
  })

  it('sends hero cast chips into the Studio with a polite announcement and active chip sync', () => {
    mountFixture(loadSourceCollection())
    const asterChip = document.querySelector<HTMLAnchorElement>('[data-cast="aster"]')
    const moonCatChip = document.querySelector<HTMLAnchorElement>('[data-cast="moon-cat"]')
    const status = document.querySelector<HTMLElement>('#studio-status')
    if (!asterChip || !moonCatChip || !status) {
      throw new Error('Cast chip or studio status missing.')
    }

    expect(asterChip.getAttribute('aria-current')).toBe('true')
    expect(asterChip.classList.contains('is-active')).toBe(true)
    expect(moonCatChip.getAttribute('aria-current')).toBeNull()

    moonCatChip.click()

    expect(status.textContent).toBe('Moon Cat is active in the Studio.')
    expect(document.querySelector<HTMLImageElement>('#specimen-portrait')?.src).toContain(
      '/assets/moon-cat/signature.png',
    )
    expect(moonCatChip.getAttribute('aria-current')).toBe('true')
    expect(moonCatChip.classList.contains('is-active')).toBe(true)
    expect(asterChip.getAttribute('aria-current')).toBeNull()
    expect(asterChip.classList.contains('is-active')).toBe(false)
  })

  it('respects prefers-reduced-motion in initIntroMotion and never blocks interactive controls', async () => {
    document.body.innerHTML = catalogMarkup()
    const reducedController = initIntroMotion(document, {
      motionQuery: {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    expect(reducedController.getState()).toBe('reduced')
    expect(document.documentElement.dataset.introState).toBe('reduced')
    expect(document.querySelector<HTMLElement>('.hero')?.dataset.intro).toBe('reduced')
    expect(reducedController.getAnimations()).toHaveLength(0)
    reducedController.cleanup()

    // Now test normal motion with a simulated Web Animations API
    document.body.innerHTML = catalogMarkup()
    const ensembleImg = document.querySelector<HTMLImageElement>('#hero-ensemble-img')
    if (ensembleImg) {
      Object.defineProperty(ensembleImg, 'complete', { value: true, configurable: true })
      Object.defineProperty(ensembleImg, 'naturalWidth', { value: 1536, configurable: true })
    }

    const cancelSpy = vi.fn()
    let resolveAnim = () => {}
    const finishedPromise = new Promise<Animation>((resolve) => {
      resolveAnim = () => resolve({} as Animation)
    })
    const animateSpy = vi.fn(() => ({
      finished: finishedPromise,
      cancel: cancelSpy,
    })) as unknown as typeof HTMLElement.prototype.animate

    const originalAnimate = HTMLElement.prototype.animate
    HTMLElement.prototype.animate = animateSpy

    try {
      const controller = initIntroMotion(document, {
        motionQuery: {
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      })

      expect(controller.getState()).toBe('playing')
      expect(document.documentElement.dataset.introState).toBe('playing')
      expect(controller.getAnimations().length).toBeGreaterThanOrEqual(8)

      // Controls remain focusable and interactive during intro playback
      const studioCta = document.querySelector<HTMLAnchorElement>('.hero-actions .btn-primary')
      studioCta?.focus()
      expect(document.activeElement).toBe(studioCta)

      resolveAnim()
      await finishedPromise
      await Promise.resolve()
      await Promise.resolve()

      expect(controller.getState()).toBe('complete')
      expect(document.documentElement.dataset.introState).toBe('complete')
      controller.cleanup()
    } finally {
      HTMLElement.prototype.animate = originalAnimate
    }
  })

  it('updates stage and showcase dataset theme when clicking theme swatches with aria-pressed', () => {
    mountFixture(loadSourceCollection())
    const stage = document.querySelector<HTMLElement>('#studio-stage')
    const showcase = document.querySelector<HTMLElement>('.showcase-stage')
    const peachSwatch = document.querySelector<HTMLButtonElement>('.swatch-btn[data-theme="peach"]')

    if (!stage || !showcase || !peachSwatch) {
      throw new Error('Theme swatch elements missing.')
    }

    peachSwatch.click()

    expect(stage.dataset.theme).toBe('peach')
    expect(showcase.dataset.theme).toBe('peach')
    expect(peachSwatch.getAttribute('aria-pressed')).toBe('true')
  })

  it('handles interactive like and follow mockup actions', () => {
    mountFixture(loadSourceCollection())
    const likeBtn = document.querySelector<HTMLButtonElement>('[data-interactive="like"]')
    const followBtn = document.querySelector<HTMLButtonElement>('[data-interactive="follow"]')
    const likeCount = likeBtn?.querySelector('.like-count')
    const reactionsCount = document.querySelector<HTMLElement>('.reactions-count')

    if (!likeBtn || !followBtn || !likeCount || !reactionsCount) {
      throw new Error('Mockup buttons missing.')
    }

    expect(likeCount.textContent).toBe('24')
    expect(likeBtn.getAttribute('aria-pressed')).toBe('false')
    likeBtn.click()
    expect(likeCount.textContent).toBe('25')
    expect(likeBtn.classList.contains('liked')).toBe(true)
    expect(likeBtn.getAttribute('aria-pressed')).toBe('true')
    expect(reactionsCount.textContent).toBe('Liked by Moon Cat, Cloud Bunny and 25 others')

    expect(followBtn.textContent).toBe('Follow')
    expect(followBtn.getAttribute('aria-pressed')).toBe('false')
    followBtn.click()
    expect(followBtn.textContent).toBe('Following')
    expect(followBtn.classList.contains('following')).toBe(true)
    expect(followBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('randomizes avatar, costume, and stage theme when clicking shuffle', () => {
    mountFixture(loadSourceCollection())
    const shuffleBtn = document.querySelector<HTMLButtonElement>('[data-action="shuffle"]')
    const stage = document.querySelector<HTMLElement>('#studio-stage')
    const swatches = document.querySelectorAll<HTMLButtonElement>('.swatch-btn')
    if (!shuffleBtn || !stage || swatches.length === 0) {
      throw new Error('Shuffle or stage elements missing.')
    }

    shuffleBtn.click()

    expect(stage.dataset.theme).toBeDefined()
    const activeSwatch = document.querySelector<HTMLButtonElement>('.swatch-btn.active')
    expect(activeSwatch).not.toBeNull()
    expect(activeSwatch?.getAttribute('aria-pressed')).toBe('true')
    expect(activeSwatch?.dataset.theme).toBe(stage.dataset.theme)
  })

  it('opens compare dialog when clicking the catalog card portrait button', () => {
    mountFixture(loadSourceCollection())
    const starDuckPortraitBtn = document.querySelector<HTMLButtonElement>(
      '[data-identity="star-duck"] .portrait-btn',
    )
    const dialog = document.querySelector<HTMLDialogElement>('#compare-dialog')

    if (!starDuckPortraitBtn || !dialog) {
      throw new Error('Missing portrait button or compare dialog.')
    }

    expect(starDuckPortraitBtn.tagName).toBe('BUTTON')
    expect(starDuckPortraitBtn.getAttribute('type')).toBe('button')
    expect(starDuckPortraitBtn.getAttribute('aria-label')).toBe('Compare Star Duck costumes')
    expect(starDuckPortraitBtn.dataset.compare).toBe('star-duck')

    starDuckPortraitBtn.click()

    expect(dialog.open).toBe(true)
    expect(dialog.querySelectorAll('a[download]')).toHaveLength(5)
  })

  it('switches the visible mockup family when using the showcase tabs', () => {
    mountFixture(loadSourceCollection())
    const stage = document.querySelector<HTMLElement>('.showcase-stage')
    const socialTab = document.querySelector<HTMLButtonElement>('[data-family="social"]')
    const chatTab = document.querySelector<HTMLButtonElement>('[data-family="chat"]')
    if (!stage || !socialTab || !chatTab) {
      throw new Error('Showcase tabs are missing.')
    }

    expect(stage.dataset.activeFamily).toBe('social')
    expect(socialTab.getAttribute('aria-selected')).toBe('true')

    chatTab.click()

    expect(stage.dataset.activeFamily).toBe('chat')
    expect(chatTab.getAttribute('aria-selected')).toBe('true')
    expect(socialTab.getAttribute('aria-selected')).toBe('false')
    expect(chatTab.tabIndex).toBe(0)
    expect(socialTab.tabIndex).toBe(-1)
  })

  it('updates studio snippet and dynamic mockup costume labels when switching costumes', () => {
    mountFixture(loadSourceCollection())
    const everyday = document.querySelector<HTMLInputElement>('input[name="costume"][value="everyday"]')
    const work = document.querySelector<HTMLInputElement>('input[name="costume"][value="work"]')
    const formal = document.querySelector<HTMLInputElement>('input[name="costume"][value="formal"]')
    const yukata = document.querySelector<HTMLInputElement>('input[name="costume"][value="yukata"]')
    const snippet = document.querySelector<HTMLElement>('#active-specimen-snippet')
    const dynamicCostume = document.querySelector<HTMLElement>('.active-dynamic-costume')
    const dynamicImg = document.querySelector<HTMLImageElement>('.active-dynamic-avatar')

    if (!everyday || !work || !formal || !yukata || !snippet || !dynamicCostume || !dynamicImg) {
      throw new Error('Missing costume inputs or dynamic mockup elements.')
    }

    expect(dynamicCostume.textContent).toBe('Signature')
    expect(snippet.textContent).toBe('<img src="/assets/aster/signature.png" />')

    // Switch to Everyday
    everyday.checked = true
    everyday.dispatchEvent(new Event('change', { bubbles: true }))

    expect(dynamicCostume.textContent).toBe('Everyday')
    expect(snippet.textContent).toBe('<img src="/assets/aster/everyday.png" />')
    expect(dynamicImg.src).toContain('/assets/aster/everyday.png')

    // Switch to Work
    work.checked = true
    work.dispatchEvent(new Event('change', { bubbles: true }))

    expect(dynamicCostume.textContent).toBe('Work')
    expect(snippet.textContent).toBe('<img src="/assets/aster/work.png" />')
    expect(dynamicImg.src).toContain('/assets/aster/work.png')

    // Switch to Formal
    formal.checked = true
    formal.dispatchEvent(new Event('change', { bubbles: true }))

    expect(dynamicCostume.textContent).toBe('Formal')
    expect(snippet.textContent).toBe('<img src="/assets/aster/formal.png" />')
    expect(dynamicImg.src).toContain('/assets/aster/formal.png')

    // Switch to Yukata
    yukata.checked = true
    yukata.dispatchEvent(new Event('change', { bubbles: true }))

    expect(dynamicCostume.textContent).toBe('Yukata')
    expect(snippet.textContent).toBe('<img src="/assets/aster/yukata.png" />')
    expect(dynamicImg.src).toContain('/assets/aster/yukata.png')
  })
})
