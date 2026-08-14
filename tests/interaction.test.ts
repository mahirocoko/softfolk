import { afterEach, describe, expect, it } from 'vitest'
import { loadSourceCollection } from './helpers.ts'
import { mountFixture } from './fixture.ts'

describe('catalog interaction', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps search focused while live-filtering the roster', () => {
    mountFixture(loadSourceCollection())
    const search = document.querySelector<HTMLInputElement>('#identity-search')
    const roster = document.querySelector<HTMLElement>('#roster')
    if (!search || !roster) {
      throw new Error('Fixture is missing search or roster.')
    }

    expect(roster.querySelectorAll('.identity')).toHaveLength(12)

    search.focus()
    search.value = 'glasses'
    search.dispatchEvent(new Event('input', { bubbles: true }))

    expect(document.activeElement).toBe(search)
    expect(roster.querySelectorAll('.identity')).toHaveLength(1)
    expect(roster.querySelector('[data-identity="noa"]')).not.toBeNull()
    expect(document.querySelector<HTMLElement>('#empty-results')?.hidden).toBe(true)
  })

  it('shows a truthful empty state and restores the roster on reset', () => {
    mountFixture(loadSourceCollection())
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
    expect(roster.querySelectorAll('.identity')).toHaveLength(12)
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
    const opener = document.querySelector<HTMLButtonElement>('[data-compare="mira"]')
    const dialog = document.querySelector<HTMLDialogElement>('#compare-dialog')
    const close = document.querySelector<HTMLButtonElement>('[data-close-compare]')
    if (!opener || !dialog || !close) {
      throw new Error('Compare controls are missing.')
    }

    opener.focus()
    opener.click()

    expect(dialog.open).toBe(true)
    expect(document.activeElement).toBe(close)
    expect(dialog.querySelectorAll('a[download]')).toHaveLength(3)
    expect(
      [...dialog.querySelectorAll('a[download]')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/assets/mira/signature.png',
      '/assets/mira/everyday.png',
      '/assets/mira/work.png',
    ])

    close.click()

    expect(dialog.open).toBe(false)
    expect(document.activeElement).toBe(opener)
  })
})
