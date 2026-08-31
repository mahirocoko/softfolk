import { afterEach, describe, expect, it } from 'vitest'
import type { Avatar } from '../src/collection.ts'
import { loadSourceCollection } from './helpers.ts'
import { mountFixture } from './fixture.ts'

describe('catalog interaction', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('synchronizes dynamic hero, quickstart, and catalog counter elements from collection', () => {
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
    const quickstartIdentities = document.querySelector<HTMLElement>('#quickstart-identities-count')
    const catalogIdentities = document.querySelector<HTMLElement>('#catalog-identities-count')

    expect(heroIdentities?.textContent).toBe(String(expandedCollection.avatars.length))
    expect(heroPortraits?.textContent).toBe(
      String(expandedCollection.avatars.length * expandedCollection.costumes.length),
    )
    expect(quickstartIdentities?.textContent).toBe(String(expandedCollection.avatars.length))
    expect(catalogIdentities?.textContent).toBe(String(expandedCollection.avatars.length))
  })

  it('keeps search focused while live-filtering the roster across People and Pals', () => {
    const collection = loadSourceCollection()
    mountFixture(collection)
    const search = document.querySelector<HTMLInputElement>('#identity-search')
    const roster = document.querySelector<HTMLElement>('#roster')
    if (!search || !roster) {
      throw new Error('Fixture is missing search or roster.')
    }

    expect(roster.querySelectorAll('.identity')).toHaveLength(collection.avatars.length)

    search.focus()
    search.value = 'eye-mask'
    search.dispatchEvent(new Event('input', { bubbles: true }))

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
    expect(roster.querySelectorAll('.identity')).toHaveLength(collection.avatars.length)
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

  it('switches the active studio specimen when clicking in the avatar strip', () => {
    mountFixture(loadSourceCollection())
    const bunnyBtn = document.querySelector<HTMLButtonElement>('[data-avatar-id="cloud-bunny"]')
    const mockupImg = document.querySelector<HTMLImageElement>('.active-dynamic-avatar')
    const mockupName = document.querySelector<HTMLElement>('.active-dynamic-name')
    const snippet = document.querySelector<HTMLElement>('#active-specimen-snippet')

    if (!bunnyBtn || !mockupImg || !mockupName || !snippet) {
      throw new Error('Studio elements missing in fixture.')
    }

    // Verify button accessible label is not duplicated
    const imgInBunny = bunnyBtn.querySelector('img')
    expect(imgInBunny?.getAttribute('alt')).toBe('')
    expect(bunnyBtn.textContent?.trim()).toBe('Cloud Bunny')

    bunnyBtn.click()

    expect(mockupName.textContent).toBe('Cloud Bunny')
    expect(mockupImg.src).toContain('/assets/cloud-bunny/signature.png')
    expect(snippet.textContent).toBe('<img src="/assets/cloud-bunny/signature.png" />')
    expect(snippet.querySelectorAll('.hl-tag')).toHaveLength(2)
    expect(snippet.querySelector('.hl-attr')?.textContent).toBe('src')
    expect(snippet.querySelector('.hl-str')?.textContent).toBe('"/assets/cloud-bunny/signature.png"')
    expect(bunnyBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('updates stage dataset theme when clicking theme swatches with aria-pressed', () => {
    mountFixture(loadSourceCollection())
    const stage = document.querySelector<HTMLElement>('#studio-stage')
    const peachSwatch = document.querySelector<HTMLButtonElement>('.swatch-btn[data-theme="peach"]')

    if (!stage || !peachSwatch) {
      throw new Error('Theme swatch elements missing.')
    }

    peachSwatch.click()

    expect(stage.dataset.theme).toBe('peach')
    expect(peachSwatch.getAttribute('aria-pressed')).toBe('true')
  })

  it('handles interactive like and follow mockup actions', () => {
    mountFixture(loadSourceCollection())
    const likeBtn = document.querySelector<HTMLButtonElement>('[data-interactive="like"]')
    const followBtn = document.querySelector<HTMLButtonElement>('[data-interactive="follow"]')
    const likeCount = likeBtn?.querySelector('.like-count')

    if (!likeBtn || !followBtn || !likeCount) {
      throw new Error('Mockup buttons missing.')
    }

    expect(likeCount.textContent).toBe('24')
    likeBtn.click()
    expect(likeCount.textContent).toBe('25')
    expect(likeBtn.classList.contains('liked')).toBe(true)

    expect(followBtn.textContent).toBe('Follow')
    followBtn.click()
    expect(followBtn.textContent).toBe('Following')
    expect(followBtn.classList.contains('following')).toBe(true)
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
