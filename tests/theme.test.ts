import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  getStoredColorScheme,
  getSystemColorScheme,
  getThemeTransitionGeometry,
  initTheme,
  isColorScheme,
  parseStoredColorScheme,
  resolveColorScheme,
  setStoredColorScheme,
  syncThemeToggleButton,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from '../src/theme.ts'
import { repoPath } from './helpers.ts'

class StorageMock implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  matches: boolean
  media: string
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null

  constructor(matches = false, media = '(prefers-color-scheme: dark)') {
    super()
    this.matches = matches
    this.media = media
  }

  addListener(listener: (event: MediaQueryListEvent) => void): void {
    this.addEventListener('change', listener as EventListener)
  }

  removeListener(listener: (event: MediaQueryListEvent) => void): void {
    this.removeEventListener('change', listener as EventListener)
  }

  setMatches(matches: boolean): void {
    this.matches = matches
    const event = new Event('change') as unknown as MediaQueryListEvent
    Object.defineProperty(event, 'matches', { value: matches })
    Object.defineProperty(event, 'media', { value: this.media })
    this.dispatchEvent(event)
    if (this.onchange) {
      this.onchange.call(this, event)
    }
  }
}

function createPendingViewTransition() {
  let resolveFinished = () => {}
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })
  const skipTransition = vi.fn()
  const transition = {
    finished,
    ready: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition,
  } as unknown as ViewTransition

  return { transition, resolveFinished, skipTransition }
}

describe('theme unit helpers', () => {
  it('validates color schemes strictly', () => {
    expect(isColorScheme('light')).toBe(true)
    expect(isColorScheme('dark')).toBe(true)
    expect(isColorScheme('auto')).toBe(false)
    expect(isColorScheme('system')).toBe(false)
    expect(isColorScheme('')).toBe(false)
    expect(isColorScheme(null)).toBe(false)
    expect(isColorScheme(undefined)).toBe(false)
    expect(isColorScheme(123)).toBe(false)
  })

  it('parses stored color schemes safely', () => {
    expect(parseStoredColorScheme('light')).toBe('light')
    expect(parseStoredColorScheme('dark')).toBe('dark')
    expect(parseStoredColorScheme('invalid')).toBeNull()
    expect(parseStoredColorScheme(null)).toBeNull()
  })

  it('reads and writes stored color schemes with error handling', () => {
    const storage = new StorageMock()
    expect(getStoredColorScheme(storage)).toBeNull()

    setStoredColorScheme('dark', storage)
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark')
    expect(getStoredColorScheme(storage)).toBe('dark')

    setStoredColorScheme('light', storage)
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light')
    expect(getStoredColorScheme(storage)).toBe('light')

    setStoredColorScheme(null, storage)
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBeNull()
    expect(getStoredColorScheme(storage)).toBeNull()

    // Resilient to throwing storage
    const faultyStorage = {
      getItem: () => {
        throw new Error('Blocked')
      },
      setItem: () => {
        throw new Error('Blocked')
      },
      removeItem: () => {
        throw new Error('Blocked')
      },
    }
    expect(getStoredColorScheme(faultyStorage)).toBeNull()
    expect(() => setStoredColorScheme('dark', faultyStorage)).not.toThrow()
  })

  it('detects system color scheme correctly', () => {
    expect(getSystemColorScheme({ matches: true })).toBe('dark')
    expect(getSystemColorScheme({ matches: false })).toBe('light')
  })

  it('resolves pinned vs system color schemes', () => {
    expect(resolveColorScheme('dark', 'light')).toBe('dark')
    expect(resolveColorScheme('light', 'dark')).toBe('light')
    expect(resolveColorScheme(null, 'dark')).toBe('dark')
    expect(resolveColorScheme(null, 'light')).toBe('light')
  })

  it('applies color scheme to root data-color-scheme and meta theme-color', () => {
    const doc = document.implementation.createHTMLDocument('Test')
    const colorSchemeMeta = doc.createElement('meta')
    colorSchemeMeta.setAttribute('name', 'color-scheme')
    colorSchemeMeta.setAttribute('content', 'light dark')
    const themeColorMeta = doc.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    themeColorMeta.setAttribute('content', THEME_COLOR_LIGHT)
    doc.head.append(colorSchemeMeta, themeColorMeta)

    applyColorScheme('dark', doc)
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(colorSchemeMeta.getAttribute('content')).toBe('dark')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_DARK)

    applyColorScheme('light', doc)
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(colorSchemeMeta.getAttribute('content')).toBe('light')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_LIGHT)
  })

  it('syncs action-oriented labels without ambiguous pressed-state semantics', () => {
    const button = document.createElement('button')

    syncThemeToggleButton(button, 'light')
    expect(button.getAttribute('aria-pressed')).toBeNull()
    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme')
    expect(button.getAttribute('title')).toBe('Switch to dark theme')

    syncThemeToggleButton(button, 'dark')
    expect(button.getAttribute('aria-pressed')).toBeNull()
    expect(button.getAttribute('aria-label')).toBe('Switch to light theme')
    expect(button.getAttribute('title')).toBe('Switch to light theme')
  })

  it('calculates a circular reveal from the button center to the farthest viewport corner', () => {
    const button = document.createElement('button')
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      x: 330,
      y: 16,
      left: 330,
      top: 16,
      right: 374,
      bottom: 60,
      width: 44,
      height: 44,
      toJSON: () => ({}),
    })

    expect(getThemeTransitionGeometry(button, { width: 390, height: 844 })).toEqual({
      x: 352,
      y: 38,
      radius: Math.hypot(352, 806),
    })
  })
})

describe('theme manager integration', () => {
  let doc: Document
  let colorSchemeMeta: HTMLMetaElement
  let themeColorMeta: HTMLMetaElement
  let toggleBtn: HTMLButtonElement
  let storage: StorageMock

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Theme Test')
    colorSchemeMeta = doc.createElement('meta')
    colorSchemeMeta.setAttribute('name', 'color-scheme')
    colorSchemeMeta.setAttribute('content', 'light dark')
    themeColorMeta = doc.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    themeColorMeta.setAttribute('content', THEME_COLOR_LIGHT)
    doc.head.append(colorSchemeMeta, themeColorMeta)

    toggleBtn = doc.createElement('button')
    toggleBtn.id = 'theme-toggle'
    doc.body.append(toggleBtn)

    storage = new StorageMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes from system default when unpinned', () => {
    const mediaQuery = new FakeMediaQueryList(true)
    const manager = initTheme(doc, { storage, mediaQuery, doc })

    expect(manager.getPinned()).toBeNull()
    expect(manager.getScheme()).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(colorSchemeMeta.getAttribute('content')).toBe('dark')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_DARK)
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to light theme')

    manager.cleanup()
  })

  it('initializes from stored override when pinned', () => {
    storage.setItem(COLOR_SCHEME_STORAGE_KEY, 'light')
    const mediaQuery = new FakeMediaQueryList(true) // System says dark, but storage says light
    const manager = initTheme(doc, { storage, mediaQuery, doc })

    expect(manager.getPinned()).toBe('light')
    expect(manager.getScheme()).toBe('light')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(colorSchemeMeta.getAttribute('content')).toBe('light')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_LIGHT)
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to dark theme')

    manager.cleanup()
  })

  it('toggles and pins preference when button is clicked', () => {
    const mediaQuery = new FakeMediaQueryList(false) // Light system default
    const manager = initTheme(doc, { storage, mediaQuery, doc })

    expect(manager.getScheme()).toBe('light')
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBeNull()

    toggleBtn.click()

    expect(manager.getScheme()).toBe('dark')
    expect(manager.getPinned()).toBe('dark')
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(colorSchemeMeta.getAttribute('content')).toBe('dark')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_DARK)
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to light theme')

    toggleBtn.click()

    expect(manager.getScheme()).toBe('light')
    expect(manager.getPinned()).toBe('light')
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(colorSchemeMeta.getAttribute('content')).toBe('light')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_LIGHT)
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to dark theme')

    manager.cleanup()
  })

  it('reveals a supported theme change from the live toggle geometry', async () => {
    const mediaQuery = new FakeMediaQueryList(false)
    const pending = createPendingViewTransition()
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return pending.transition
    })
    vi.spyOn(toggleBtn, 'getBoundingClientRect').mockReturnValue({
      x: 330,
      y: 16,
      left: 330,
      top: 16,
      right: 374,
      bottom: 60,
      width: 44,
      height: 44,
      toJSON: () => ({}),
    })
    const manager = initTheme(doc, {
      storage,
      mediaQuery,
      motionQuery: { matches: false },
      doc,
      viewport: { width: 390, height: 844 },
      startViewTransition,
    })

    toggleBtn.click()

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(manager.getScheme()).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(doc.documentElement.style.getPropertyValue('--theme-transition-x')).toBe('352px')
    expect(doc.documentElement.style.getPropertyValue('--theme-transition-y')).toBe('38px')
    expect(Number.parseFloat(doc.documentElement.style.getPropertyValue('--theme-transition-radius'))).toBeCloseTo(
      Math.hypot(352, 806),
    )

    pending.resolveFinished()
    await pending.transition.finished
    await Promise.resolve()

    expect(doc.documentElement.style.getPropertyValue('--theme-transition-x')).toBe('')
    expect(doc.documentElement.style.getPropertyValue('--theme-transition-y')).toBe('')
    expect(doc.documentElement.style.getPropertyValue('--theme-transition-radius')).toBe('')

    manager.cleanup()
  })

  it('handles rejected transition readiness without losing the selected scheme', async () => {
    const pending = createPendingViewTransition()
    const aborted = new DOMException('Viewport size changed', 'InvalidStateError')
    let rejectReady: (reason: Error) => void = () => {}
    const ready = new Promise<void>((_resolve, reject) => {
      rejectReady = reject
    })
    const handleRejection = vi.spyOn(ready, 'catch')
    const transition = { ...pending.transition, ready } as ViewTransition
    const manager = initTheme(doc, {
      storage,
      mediaQuery: new FakeMediaQueryList(false),
      motionQuery: { matches: false },
      doc,
      startViewTransition: (update) => {
        void update()
        return transition
      },
    })

    toggleBtn.click()
    expect(handleRejection).toHaveBeenCalledTimes(1)
    rejectReady(aborted)
    pending.resolveFinished()
    await pending.transition.finished
    await Promise.resolve()

    expect(manager.getScheme()).toBe('dark')
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(doc.documentElement.style.getPropertyValue('--theme-transition-radius')).toBe('')
    manager.cleanup()
  })

  it('changes immediately when reduced motion is requested', () => {
    const mediaQuery = new FakeMediaQueryList(false)
    const startViewTransition = vi.fn()
    const manager = initTheme(doc, {
      storage,
      mediaQuery,
      motionQuery: { matches: true },
      doc,
      viewport: { width: 390, height: 844 },
      startViewTransition,
    })

    toggleBtn.click()

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(manager.getScheme()).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(doc.documentElement.style.getPropertyValue('--theme-transition-radius')).toBe('')

    manager.cleanup()
  })

  it('skips an active reveal and reconciles rapid clicks to the latest theme', () => {
    const mediaQuery = new FakeMediaQueryList(false)
    const first = createPendingViewTransition()
    const second = createPendingViewTransition()
    const transitions = [first.transition, second.transition]
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      const transition = transitions.shift()
      if (!transition) throw new Error('Unexpected transition')
      return transition
    })
    const manager = initTheme(doc, {
      storage,
      mediaQuery,
      motionQuery: { matches: false },
      doc,
      viewport: { width: 390, height: 844 },
      startViewTransition,
    })

    toggleBtn.click()
    toggleBtn.click()

    expect(first.skipTransition).toHaveBeenCalledTimes(1)
    expect(startViewTransition).toHaveBeenCalledTimes(2)
    expect(manager.getScheme()).toBe('light')
    expect(manager.getPinned()).toBe('light')
    expect(storage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to dark theme')

    manager.cleanup()
    expect(second.skipTransition).toHaveBeenCalledTimes(1)
  })

  it('reacts to matchMedia change when unpinned', () => {
    const mediaQuery = new FakeMediaQueryList(false)
    const manager = initTheme(doc, { storage, mediaQuery, doc })

    expect(manager.getScheme()).toBe('light')

    mediaQuery.setMatches(true)

    expect(manager.getScheme()).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()

    mediaQuery.setMatches(false)

    expect(manager.getScheme()).toBe('light')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()

    manager.cleanup()
  })

  it('ignores matchMedia change once pinned by user', () => {
    const mediaQuery = new FakeMediaQueryList(false)
    const manager = initTheme(doc, { storage, mediaQuery, doc })

    // User explicitly clicks to toggle to dark
    toggleBtn.click()
    expect(manager.getPinned()).toBe('dark')
    expect(manager.getScheme()).toBe('dark')

    // OS changes to light
    mediaQuery.setMatches(false)

    // Should remain dark because it was pinned
    expect(manager.getScheme()).toBe('dark')
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(toggleBtn.getAttribute('aria-pressed')).toBeNull()

    manager.cleanup()
  })
})

describe('static index.html contracts for theme switch', () => {
  const html = readFileSync(repoPath('index.html'), 'utf8')
  const css = readFileSync(repoPath('src', 'styles.css'), 'utf8')
  const bootstrapScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

  it('declares color-scheme meta and theme-color meta', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark">')
    expect(html).toContain('<meta name="theme-color" content="#FAF8F5">')
  })

  it('contains synchronous head bootstrap script before styles', () => {
    const script = bootstrapScript
    expect(script).not.toBe('')
    expect(script).toContain('softfolk-color-scheme')
    expect(script).toContain('prefers-color-scheme: dark')
    expect(script).toContain('data-color-scheme')
    expect(script).toContain('#151413')
    expect(script).toContain('#FAF8F5')

    const scriptIndex = html.indexOf(script)
    const cssIndex = html.indexOf('src/styles.css')
    expect(scriptIndex).toBeLessThan(cssIndex)
  })

  it('still follows system dark and syncs metas when storage access is blocked', () => {
    const doc = document.implementation.createHTMLDocument('Bootstrap Test')
    const colorSchemeMeta = doc.createElement('meta')
    colorSchemeMeta.setAttribute('name', 'color-scheme')
    colorSchemeMeta.setAttribute('content', 'light dark')
    const themeColorMeta = doc.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    themeColorMeta.setAttribute('content', THEME_COLOR_LIGHT)
    doc.head.append(colorSchemeMeta, themeColorMeta)

    const blockedStorage = {
      getItem: () => {
        throw new Error('Blocked')
      },
    }
    const darkWindow = {
      matchMedia: () => ({ matches: true }),
    }
    const executeBootstrap = new Function(
      'localStorage',
      'window',
      'document',
      bootstrapScript,
    ) as (storage: typeof blockedStorage, windowValue: typeof darkWindow, documentValue: Document) => void

    expect(() => executeBootstrap(blockedStorage, darkWindow, doc)).not.toThrow()
    expect(doc.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(colorSchemeMeta.getAttribute('content')).toBe('dark')
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLOR_DARK)
  })

  it('contains accessible theme toggle button with complete sun and moon inline SVGs', () => {
    const toggle = html.match(/<button[\s\S]*?id="theme-toggle"[\s\S]*?<\/button>/)?.[0]
    expect(toggle).toBeDefined()
    if (!toggle) return

    expect(toggle).toContain('class="theme-toggle"')
    expect(toggle).toContain('aria-label="Switch to dark theme"')
    expect(toggle).not.toContain('aria-pressed=')
    expect(toggle).toContain('class="theme-icon-sun"')
    expect(toggle).toContain('class="theme-icon-moon"')
  })

  it('defines a reduced-motion-safe circular root reveal and mode-aware portrait surface', () => {
    expect(css).toContain('::view-transition-old(root)')
    expect(css).toContain('::view-transition-new(root)')
    expect(css).toContain('animation: theme-reveal 400ms cubic-bezier(0.22, 1, 0.36, 1) both')
    expect(css).toContain('clip-path: circle(0 at var(--theme-transition-x) var(--theme-transition-y))')
    expect(css).toContain('clip-path: circle(var(--theme-transition-radius) at var(--theme-transition-x) var(--theme-transition-y))')
    expect(css).toMatch(/:root \{[\s\S]*?--portrait-surface: #F7F3EE;/)
    expect(css).toMatch(/:root\[data-color-scheme="dark"\] \{[\s\S]*?--portrait-surface: #322E29;/)
    expect(css).toMatch(/\.portrait-wrap \{[\s\S]*?background: var\(--portrait-surface\);/)
  })
})
