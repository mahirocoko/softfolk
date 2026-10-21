export type IntroState = 'idle' | 'preparing' | 'playing' | 'complete' | 'reduced'

export interface IntroController {
  getState(): IntroState
  getAnimations(): Animation[]
  skip(): void
  cleanup(): void
}

export interface IntroOptions {
  doc?: Document
  motionQuery?: Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>
  imageReadyTimeoutMs?: number
}

const EASE_SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_AURA = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DEFAULT_IMAGE_TIMEOUT_MS = 160
const MAX_INTRO_DURATION_MS = 950

function waitForImageReady(img: HTMLImageElement | null, timeoutMs: number): Promise<void> {
  if (!img || (img.complete && img.naturalWidth > 0)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      img.removeEventListener('load', finish)
      img.removeEventListener('error', finish)
      resolve()
    }

    const timer = setTimeout(finish, Math.max(0, timeoutMs))
    img.addEventListener('load', finish, { once: true })
    img.addEventListener('error', finish, { once: true })

    if (typeof img.decode === 'function') {
      img.decode().then(finish, () => {
        // Wait for load/error or timeout fallback if decode rejects early
      })
    }
  })
}

export function initIntroMotion(
  root: ParentNode = document,
  options: IntroOptions = {},
): IntroController {
  const doc = options.doc ?? (root instanceof Document ? root : root.ownerDocument ?? document)
  const view = doc.defaultView ?? (typeof window !== 'undefined' ? window : undefined)
  const motionQuery =
    options.motionQuery ??
    (view && typeof view.matchMedia === 'function'
      ? view.matchMedia('(prefers-reduced-motion: reduce)')
      : undefined)

  const hero = root.querySelector<HTMLElement>('.hero')
  const ensembleImg = root.querySelector<HTMLImageElement>('#hero-ensemble-img')

  let state: IntroState = 'idle'
  let disposed = false
  let activeAnimations: Animation[] = []
  let settleTimer: ReturnType<typeof setTimeout> | null = null

  const clearSettleTimer = (): void => {
    if (settleTimer !== null) {
      clearTimeout(settleTimer)
      settleTimer = null
    }
  }

  const syncStateAttributes = (next: IntroState): void => {
    state = next
    if (doc.documentElement) {
      doc.documentElement.dataset.introState = next
    }
    if (hero) {
      hero.dataset.intro = next
    }
  }

  const clearAnimations = (): void => {
    for (const anim of activeAnimations) {
      try {
        anim.cancel()
      } catch {
        // Ignore cancellation errors on detached nodes
      }
    }
    activeAnimations = []
  }

  const animateElement = (
    element: Element | null | undefined,
    keyframes: Keyframe[],
    timing: KeyframeAnimationOptions,
  ): void => {
    if (!element || typeof (element as HTMLElement).animate !== 'function') {
      return
    }
    try {
      const animation = (element as HTMLElement).animate(keyframes, {
        fill: 'both',
        ...timing,
      })
      activeAnimations.push(animation)
    } catch {
      // Fail open if Web Animations API is stubbed or unsupported
    }
  }

  const skipToRest = (targetState: 'complete' | 'reduced' = 'complete'): void => {
    clearSettleTimer()
    clearAnimations()
    syncStateAttributes(targetState)
  }

  if (!hero) {
    syncStateAttributes('complete')
    return {
      getState: () => state,
      getAnimations: () => [],
      skip: () => skipToRest('complete'),
      cleanup: () => {
        disposed = true
      },
    }
  }

  if (motionQuery?.matches) {
    skipToRest('reduced')
    return {
      getState: () => state,
      getAnimations: () => [],
      skip: () => skipToRest('reduced'),
      cleanup: () => {
        disposed = true
      },
    }
  }

  const startChoreography = (): void => {
    if (disposed) return
    if (motionQuery?.matches) {
      skipToRest('reduced')
      return
    }

    clearAnimations()
    syncStateAttributes('playing')

    const aura = hero.querySelector<HTMLElement>('.hero-stage-aura')
    const plinth = hero.querySelector<HTMLElement>('.hero-stage-plinth')
    const ensembleFrame = hero.querySelector<HTMLElement>('.hero-ensemble-frame')
    const wordmarkPlaque = hero.querySelector<HTMLElement>('.wordmark-plaque')
    const heroTitle = hero.querySelector<HTMLElement>('.hero-title')
    const heroDeck = hero.querySelector<HTMLElement>('.hero-deck')
    const heroActions = hero.querySelector<HTMLElement>('.hero-actions')
    const featureBadges = hero.querySelector<HTMLElement>('.feature-badges')
    const heroCast = hero.querySelector<HTMLElement>('.hero-cast')
    const castChips = [...hero.querySelectorAll<HTMLElement>('.cast-chip')].slice(0, 12)
    const studioSection = root.querySelector<HTMLElement>('.studio-section')

    // Beat 1: Stage backlight aura & grounded studio floor plinth
    animateElement(
      aura,
      [
        { opacity: 0, transform: 'scale(0.88)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 560, delay: 0, easing: EASE_AURA },
    )

    animateElement(
      plinth,
      [
        { opacity: 0, transform: 'scaleX(0.84)' },
        { opacity: 1, transform: 'scaleX(1)' },
      ],
      { duration: 540, delay: 20, easing: EASE_SETTLE },
    )

    // Beat 2: 12-character Softfolk ensemble curtain-call emergence
    animateElement(
      ensembleFrame,
      [
        { opacity: 0, transform: 'translate3d(0, 20px, 0) scale(0.962)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
      ],
      { duration: 600, delay: 35, easing: EASE_SETTLE },
    )

    // Beat 3: Editorial wordmark plaque, title, deck, actions, and specifications
    animateElement(
      wordmarkPlaque,
      [
        { opacity: 0, transform: 'translate3d(0, 10px, 0) scale(0.97)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
      ],
      { duration: 460, delay: 105, easing: EASE_SETTLE },
    )

    animateElement(
      heroTitle,
      [
        { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 500, delay: 160, easing: EASE_SETTLE },
    )

    animateElement(
      heroDeck,
      [
        { opacity: 0, transform: 'translate3d(0, 12px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 500, delay: 215, easing: EASE_SETTLE },
    )

    animateElement(
      heroActions,
      [
        { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 480, delay: 270, easing: EASE_SETTLE },
    )

    animateElement(
      featureBadges,
      [
        { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 460, delay: 325, easing: EASE_SETTLE },
    )

    // Beat 4: Interactive ensemble cast strip & Studio workbench readiness
    animateElement(
      heroCast,
      [
        { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 460, delay: 355, easing: EASE_SETTLE },
    )

    castChips.forEach((chip, index) => {
      animateElement(
        chip,
        [
          { opacity: 0, transform: 'translate3d(0, 7px, 0) scale(0.96)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        { duration: 400, delay: 375 + index * 22, easing: EASE_SETTLE },
      )
    })

    animateElement(
      studioSection,
      [
        { opacity: 0.01, transform: 'translate3d(0, 16px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: 560, delay: 285, easing: EASE_SETTLE },
    )

    if (activeAnimations.length === 0) {
      skipToRest('complete')
      return
    }

    const currentBatch = [...activeAnimations]
    clearSettleTimer()
    settleTimer = setTimeout(() => {
      if (disposed || state !== 'playing') return
      if (activeAnimations.some((anim) => anim.playState === 'paused')) return
      skipToRest('complete')
    }, MAX_INTRO_DURATION_MS)

    Promise.allSettled(currentBatch.map((anim) => anim.finished)).then(() => {
      if (disposed || state !== 'playing') return
      clearSettleTimer()
      clearAnimations()
      syncStateAttributes('complete')
    })
  }

  syncStateAttributes('preparing')
  const timeoutMs = options.imageReadyTimeoutMs ?? DEFAULT_IMAGE_TIMEOUT_MS

  if (!ensembleImg || (ensembleImg.complete && ensembleImg.naturalWidth > 0)) {
    startChoreography()
  } else {
    void waitForImageReady(ensembleImg, timeoutMs).then(() => {
      if (!disposed && state === 'preparing') {
        startChoreography()
      }
    })
  }

  const handleMotionChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      skipToRest('reduced')
    }
  }

  if (motionQuery && typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionChange)
  }

  const cleanup = () => {
    disposed = true
    clearSettleTimer()
    clearAnimations()
    if (motionQuery && typeof motionQuery.removeEventListener === 'function') {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }

  return {
    getState: () => state,
    getAnimations: () => [...activeAnimations],
    skip: () => skipToRest('complete'),
    cleanup,
  }
}
