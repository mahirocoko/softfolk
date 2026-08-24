export type ColorScheme = 'light' | 'dark'

export const COLOR_SCHEME_STORAGE_KEY = 'softfolk-color-scheme'
export const THEME_COLOR_LIGHT = '#FAF8F5'
export const THEME_COLOR_DARK = '#151413'

export type ThemeTransitionGeometry = {
  x: number
  y: number
  radius: number
}

export type ThemeViewport = {
  width: number
  height: number
}

export type StartThemeViewTransition = (update: () => void) => ViewTransition

function getGlobalStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined
  } catch {
    return undefined
  }
}

export function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark'
}

export function parseStoredColorScheme(value: string | null): ColorScheme | null {
  return isColorScheme(value) ? value : null
}

export function getStoredColorScheme(
  storage: Pick<Storage, 'getItem'> | undefined = getGlobalStorage(),
): ColorScheme | null {
  if (!storage) return null
  try {
    return parseStoredColorScheme(storage.getItem(COLOR_SCHEME_STORAGE_KEY))
  } catch {
    return null
  }
}

export function setStoredColorScheme(
  scheme: ColorScheme | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = getGlobalStorage(),
): void {
  if (!storage) return
  try {
    if (scheme === null) {
      storage.removeItem(COLOR_SCHEME_STORAGE_KEY)
    } else {
      storage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme)
    }
  } catch {
    // Ignore storage write errors (e.g. quota, private browsing)
  }
}

export function getSystemColorScheme(
  mediaQuery?: Pick<MediaQueryList, 'matches'>,
): ColorScheme {
  if (mediaQuery) {
    return mediaQuery.matches ? 'dark' : 'light'
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  }
  return 'light'
}

export function resolveColorScheme(
  stored: ColorScheme | null,
  system: ColorScheme,
): ColorScheme {
  return stored ?? system
}

export function applyColorScheme(scheme: ColorScheme, doc: Document = document): void {
  if (doc.documentElement) {
    doc.documentElement.setAttribute('data-color-scheme', scheme)
  }
  const colorSchemeMeta = doc.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
  const themeColorMeta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', scheme)
  }
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', scheme === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
  }
}

export function syncThemeToggleButton(button: HTMLElement, scheme: ColorScheme): void {
  const isDark = scheme === 'dark'
  const actionLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme'
  button.setAttribute('aria-label', actionLabel)
  button.setAttribute('title', actionLabel)
}

export function getThemeTransitionGeometry(
  button: HTMLElement,
  viewport: ThemeViewport,
): ThemeTransitionGeometry {
  const rect = button.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(
    Math.max(x, viewport.width - x),
    Math.max(y, viewport.height - y),
  )

  return { x, y, radius }
}

export interface ThemeManager {
  getScheme(): ColorScheme
  getPinned(): ColorScheme | null
  toggle(): ColorScheme
  setScheme(scheme: ColorScheme | null): void
  cleanup(): void
}

export function initTheme(
  root: ParentNode = document,
  options: {
    storage?: Storage
    mediaQuery?: MediaQueryList
    motionQuery?: Pick<MediaQueryList, 'matches'>
    doc?: Document
    viewport?: ThemeViewport
    startViewTransition?: StartThemeViewTransition | null
  } = {},
): ThemeManager {
  const doc = options.doc ?? (root instanceof Document ? root : root.ownerDocument ?? document)
  const view = doc.defaultView ?? (typeof window !== 'undefined' ? window : undefined)
  const storage = options.storage ?? getGlobalStorage()
  const mediaQuery =
    options.mediaQuery ??
    (view && typeof view.matchMedia === 'function'
      ? view.matchMedia('(prefers-color-scheme: dark)')
      : undefined)
  const motionQuery =
    options.motionQuery ??
    (view && typeof view.matchMedia === 'function'
      ? view.matchMedia('(prefers-reduced-motion: reduce)')
      : undefined)
  const startViewTransition =
    options.startViewTransition === null
      ? undefined
      : options.startViewTransition ??
        (typeof doc.startViewTransition === 'function'
          ? doc.startViewTransition.bind(doc)
          : undefined)

  let pinned: ColorScheme | null = getStoredColorScheme(storage)
  let currentScheme: ColorScheme = resolveColorScheme(pinned, getSystemColorScheme(mediaQuery))
  let activeTransition: ViewTransition | null = null
  let transitionSequence = 0

  applyColorScheme(currentScheme, doc)

  const toggleBtn = root.querySelector<HTMLButtonElement>('#theme-toggle')
  if (toggleBtn) {
    syncThemeToggleButton(toggleBtn, currentScheme)
  }

  const syncScheme = (scheme: ColorScheme): void => {
    applyColorScheme(scheme, doc)
    if (toggleBtn) {
      syncThemeToggleButton(toggleBtn, scheme)
    }
  }

  const clearTransitionGeometry = (sequence: number): void => {
    if (sequence !== transitionSequence) return
    doc.documentElement.style.removeProperty('--theme-transition-x')
    doc.documentElement.style.removeProperty('--theme-transition-y')
    doc.documentElement.style.removeProperty('--theme-transition-radius')
    activeTransition = null
  }

  const stopActiveTransition = (): void => {
    transitionSequence += 1
    activeTransition?.skipTransition()
    activeTransition = null
    doc.documentElement.style.removeProperty('--theme-transition-x')
    doc.documentElement.style.removeProperty('--theme-transition-y')
    doc.documentElement.style.removeProperty('--theme-transition-radius')
  }

  const revealSchemeFromToggle = (scheme: ColorScheme): void => {
    if (
      !toggleBtn ||
      !startViewTransition ||
      motionQuery?.matches
    ) {
      stopActiveTransition()
      syncScheme(scheme)
      return
    }

    activeTransition?.skipTransition()
    const sequence = ++transitionSequence
    const viewport = options.viewport ?? {
      width: view?.innerWidth ?? doc.documentElement.clientWidth,
      height: view?.innerHeight ?? doc.documentElement.clientHeight,
    }
    const geometry = getThemeTransitionGeometry(toggleBtn, viewport)
    doc.documentElement.style.setProperty('--theme-transition-x', `${geometry.x}px`)
    doc.documentElement.style.setProperty('--theme-transition-y', `${geometry.y}px`)
    doc.documentElement.style.setProperty('--theme-transition-radius', `${geometry.radius}px`)

    try {
      const transition = startViewTransition(() => {
        if (sequence === transitionSequence) {
          syncScheme(scheme)
        }
      })
      activeTransition = transition
      transition.finished.then(
        () => clearTransitionGeometry(sequence),
        () => clearTransitionGeometry(sequence),
      )
    } catch {
      clearTransitionGeometry(sequence)
      syncScheme(scheme)
    }
  }

  const handleToggle = (): ColorScheme => {
    const next: ColorScheme = currentScheme === 'dark' ? 'light' : 'dark'
    pinned = next
    setStoredColorScheme(next, storage)
    currentScheme = next
    revealSchemeFromToggle(currentScheme)
    return currentScheme
  }

  const clickListener = () => {
    handleToggle()
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', clickListener)
  }

  const mediaListener = (event: MediaQueryListEvent | MediaQueryList) => {
    if (pinned !== null) {
      return
    }
    const newSystem: ColorScheme = event.matches ? 'dark' : 'light'
    currentScheme = newSystem
    stopActiveTransition()
    syncScheme(currentScheme)
  }

  if (mediaQuery) {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', mediaListener)
    } else if (typeof (mediaQuery as unknown as { addListener: (cb: typeof mediaListener) => void }).addListener === 'function') {
      ;(mediaQuery as unknown as { addListener: (cb: typeof mediaListener) => void }).addListener(mediaListener)
    }
  }

  const cleanup = () => {
    stopActiveTransition()
    if (toggleBtn) {
      toggleBtn.removeEventListener('click', clickListener)
    }
    if (mediaQuery) {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', mediaListener)
      } else if (typeof (mediaQuery as unknown as { removeListener: (cb: typeof mediaListener) => void }).removeListener === 'function') {
        ;(mediaQuery as unknown as { removeListener: (cb: typeof mediaListener) => void }).removeListener(mediaListener)
      }
    }
  }

  return {
    getScheme: () => currentScheme,
    getPinned: () => pinned,
    toggle: handleToggle,
    setScheme: (scheme: ColorScheme | null) => {
      pinned = scheme
      setStoredColorScheme(scheme, storage)
      currentScheme = resolveColorScheme(pinned, getSystemColorScheme(mediaQuery))
      stopActiveTransition()
      syncScheme(currentScheme)
    },
    cleanup,
  }
}
