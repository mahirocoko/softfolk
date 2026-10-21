import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canonicalAssetPath, COSTUME_IDS } from '../src/collection.ts'
import { loadSourceCollection, readPngIhdr, repoPath } from './helpers.ts'

function sha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

describe('build output canonical paths', () => {
  const distRoot = repoPath('dist')
  const siteBase = '/softfolk/'

  it('emits the public index, license, and nested portraits without hashed aliases', () => {
    expect(existsSync(join(distRoot, 'index.html'))).toBe(true)
    expect(existsSync(join(distRoot, 'LICENSE'))).toBe(true)
    expect(existsSync(join(distRoot, 'data', 'avatars.json'))).toBe(true)

    const siteFiles = existsSync(join(distRoot, 'site'))
      ? readdirSync(join(distRoot, 'site'))
      : []
    expect(siteFiles.some((name) => name.endsWith('.js'))).toBe(true)
    expect(siteFiles.some((name) => name.endsWith('.css'))).toBe(true)

    const distAssets = join(distRoot, 'assets')
    const rootFiles = existsSync(distAssets) ? readdirSync(distAssets, { withFileTypes: true }) : []
    expect(rootFiles.filter((entry) => entry.isFile()).map((entry) => entry.name)).toEqual([])
    expect(
      rootFiles.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(),
    ).toEqual(loadSourceCollection().avatars.map((avatar) => avatar.id).sort())

    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    expect(html).toContain(`href="${siteBase}data/avatars.json"`)
    expect(html).toContain(`href="${siteBase}LICENSE"`)
    expect(html).not.toMatch(/\/assets\/index-/)
    expect(html).not.toContain('%BASE_URL%')
  })

  it('copies only runtime Q deliveries and uses them for the masthead and favicons', () => {
    const runtimeIcons = [
      'softfolk-16.png',
      'softfolk-32.png',
      'softfolk-256.png',
      'softfolk-512.png',
    ]

    for (const name of runtimeIcons) {
      const relative = join('brand', 'icons', name)
      expect(existsSync(join(distRoot, relative))).toBe(true)
      expect(sha256(join(distRoot, relative))).toBe(sha256(repoPath(relative)))
    }

    expect(existsSync(join(distRoot, 'brand', 'icons', 'softfolk-64.png'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'icons', 'softfolk-128.png'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'softfolk-symbol.png'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'source'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'qa'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'review'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'trials'))).toBe(false)
    expect(existsSync(join(distRoot, 'brand', 'README.md'))).toBe(false)
    expect(existsSync(join(distRoot, 'favicon.ico'))).toBe(false)
    expect(readdirSync(join(distRoot, 'brand', 'icons')).sort()).toEqual([...runtimeIcons].sort())
    expect(
      (existsSync(join(distRoot, 'site')) ? readdirSync(join(distRoot, 'site')) : []).filter((name) =>
        name.endsWith('.png'),
      ),
    ).toEqual([])

    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    expect(html).not.toContain('href="data:,"')
    expect(html).toContain(`href="${siteBase}brand/icons/softfolk-32.png"`)
    expect(html).toContain('sizes="32x32"')
    expect(html).toContain(`href="${siteBase}brand/icons/softfolk-16.png"`)
    expect(html).toContain('sizes="16x16"')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain(`href="${siteBase}brand/icons/softfolk-256.png"`)
    expect(html).not.toContain('softfolk-128.png')
    expect(html).not.toMatch(/\/site\/softfolk-\d+-[^"]+\.png/)
    expect(html).toContain('A growing collection of soft 3D portraits')
    expect(html).toContain('40</span> Unique Identities')
    expect(html).toContain('200</span> Soft 3D Portraits')
    expect(html).toContain('Search <span id="catalog-identities-count">40</span> identities')
    expect(html).toContain('5 Costumes Each')
    expect(html).toContain('CC0 1.0 · Public domain · No attribution required')
    expect(html).not.toContain('All 12 Identities')

    for (const name of runtimeIcons) {
      expect(html).toContain(`${siteBase}brand/icons/${name}`)
    }

    const symbol = html.match(/<img\s+class="brand-symbol"[\s\S]*?>/)?.[0]
    expect(symbol).toContain('alt=""')
    expect(symbol).toContain('width="256"')
    expect(symbol).toContain('height="256"')
    expect(symbol).toContain(`src="${siteBase}brand/icons/softfolk-256.png"`)
    expect(symbol).toContain(
      `srcset="${siteBase}brand/icons/softfolk-256.png 256w, ${siteBase}brand/icons/softfolk-512.png 512w"`,
    )
    expect(symbol).toContain('sizes="2rem"')
    expect(symbol).not.toMatch(/style=/)

    const css = (existsSync(join(distRoot, 'site')) ? readdirSync(join(distRoot, 'site')) : [])
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(distRoot, 'site', name), 'utf8'))
      .join('\n')
    expect(css.replace(/\s/g, '')).toMatch(/\.brand-symbol\{[^}]*width:2rem/)
    expect(css).not.toMatch(/\.brand-symbol[^{]*\{[^}]*(?:filter|hue-rotate|mix-blend-mode)\s*:/)
    expect(css).not.toMatch(/\.brand-symbol[^{]*\{[^}]*object-fit\s*:\s*cover/)
  })

  it('emits the canonical share card and complete production Pages metadata', () => {
    const relative = join('brand', 'social', 'softfolk-og.png')
    const source = repoPath(relative)
    const emitted = join(distRoot, relative)

    expect(existsSync(emitted)).toBe(true)
    expect(sha256(emitted)).toBe(sha256(source))
    expect(readPngIhdr(readFileSync(source))).toEqual({
      width: 1200,
      height: 630,
      bitDepth: 8,
      colorType: 2,
    })

    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    const siteUrl = 'https://mahirocoko.github.io/softfolk/'
    const imageUrl = `${siteUrl}brand/social/softfolk-og.png`

    expect(html).toContain(`<link rel="canonical" href="${siteUrl}">`)
    expect(html).toContain('<meta property="og:type" content="website">')
    expect(html).toContain('<meta property="og:site_name" content="Softfolk">')
    expect(html).toContain(`<meta property="og:url" content="${siteUrl}">`)
    expect(html).toContain(`content="${imageUrl}"`)
    expect(html).toContain('<meta property="og:image:type" content="image/png">')
    expect(html).toContain('<meta property="og:image:width" content="1200">')
    expect(html).toContain('<meta property="og:image:height" content="630">')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(html).toContain('property="og:image:alt"')
    expect(html).toContain('name="twitter:image:alt"')
  })

  it('copies avatars.json and every nested PNG byte-for-byte from source', () => {
    const collection = loadSourceCollection()
    const sourceJson = readFileSync(repoPath('data', 'avatars.json'))
    const distJson = readFileSync(join(distRoot, 'data', 'avatars.json'))
    expect(distJson.equals(sourceJson)).toBe(true)

    for (const avatar of collection.avatars) {
      for (const costumeId of COSTUME_IDS) {
        const relative = canonicalAssetPath(avatar.id, costumeId)
        expect(sha256(join(distRoot, relative))).toBe(sha256(repoPath(relative)))
      }
    }
  })

  it('emits the curtain-call ensemble hero with high-priority LCP delivery and canonical cast chips', () => {
    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    const stageMatch = html.match(/<div\s+class="hero-stage"[\s\S]*?<\/section>/)?.[0]
    expect(stageMatch).toBeDefined()
    if (!stageMatch) return

    const ensembleImg = stageMatch.match(/<img[\s\S]*?id="hero-ensemble-img"[\s\S]*?>/)?.[0]
    expect(ensembleImg).toBeDefined()
    expect(ensembleImg).toContain('width="1536"')
    expect(ensembleImg).toContain('height="1024"')
    expect(ensembleImg).toContain('fetchpriority="high"')
    expect(ensembleImg).toContain('decoding="async"')
    expect(ensembleImg).not.toContain('loading="lazy"')
    expect(ensembleImg).toContain('alt=""')
    expect(ensembleImg).toMatch(/src="\/softfolk\/site\/hero-ensemble-[^"]+\.webp"/)

    const siteFiles = existsSync(join(distRoot, 'site')) ? readdirSync(join(distRoot, 'site')) : []
    expect(siteFiles.some((name) => /^hero-ensemble-.*\.webp$/.test(name))).toBe(true)
    expect(siteFiles.some((name) => /^hero-cloud-stage-/.test(name))).toBe(false)

    const castChipImgs = stageMatch.match(/<a\s+class="cast-chip[^"]*"[\s\S]*?<\/a>/g) ?? []
    expect(castChipImgs).toHaveLength(8)
    for (const chip of castChipImgs) {
      expect(chip).toContain(`src="${siteBase}assets/`)
      expect(chip).toContain('alt=""')
    }

    // The semantic wordmark stays real text; generated title pixels are never shipped
    expect(stageMatch).toContain('<span class="wordmark-text">Softfolk</span>')
    expect(stageMatch).toContain('aria-hidden="true"')
  })

  it('emits the compact header with section anchors and the public-domain colophon', () => {
    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')

    const header = html.match(/<header\s+class="site-header"[\s\S]*?<\/header>/)?.[0]
    expect(header).toBeDefined()
    if (!header) return
    expect(header).toContain('href="#studio"')
    expect(header).toContain('href="#collection-explorer"')
    expect(header).toContain('href="https://github.com/mahirocoko/softfolk"')
    expect(header).toContain('id="theme-toggle"')

    const colophon = html.match(/<section\s+class="colophon"[\s\S]*?<\/section>/)?.[0]
    expect(colophon).toBeDefined()
    if (!colophon) return
    expect(colophon).toContain('CC0 1.0 · Public domain · No attribution required')

    // The colophon is a quiet endcap above the unchanged minimal footer
    expect(html.indexOf('class="colophon"')).toBeLessThan(html.indexOf('class="site-footer"'))
    expect(html).toContain('Built by')
    expect(html).toContain(`href="${siteBase}data/avatars.json"`)
    expect(html).toContain(`href="${siteBase}LICENSE"`)
  })

  it('enforces complete reduced-motion resets and scroll-behavior in emitted CSS', () => {
    const rawCss = (existsSync(join(distRoot, 'site')) ? readdirSync(join(distRoot, 'site')) : [])
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(distRoot, 'site', name), 'utf8'))
      .join('\n')

    const minCss = rawCss.replace(/\s/g, '')
    expect(minCss).toContain('@media(prefers-reduced-motion:reduce)')
    expect(minCss).toContain('scroll-behavior:auto!important')
    expect(minCss).toMatch(/transition-duration:(?:0\.01ms|\.01ms)!important/)
    expect(minCss).toMatch(/animation-duration:(?:0\.01ms|\.01ms)!important/)
    expect(minCss).toContain('[hidden]{display:none!important}')
    expect(minCss).toContain('grid-template-areas:"socialchatprofile"')
  })

  it('ensures all aria-labelledby attributes point to existing element IDs', () => {
    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    const matches = [...html.matchAll(/aria-labelledby="([^"]+)"/g)]
    expect(matches.length).toBeGreaterThan(0)
    for (const match of matches) {
      const targetId = match[1]
      expect(html).toContain(`id="${targetId}"`)
    }
  })

  it('emits the zero-FOUC theme bootstrap and accessible two-state toggle', () => {
    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    const bootstrap = html.match(/<script>([\s\S]*?softfolk-color-scheme[\s\S]*?)<\/script>/)?.[0]
    const toggle = html.match(/<button[\s\S]*?id="theme-toggle"[\s\S]*?<\/button>/)?.[0]

    expect(bootstrap).toBeDefined()
    expect(toggle).toBeDefined()
    if (!bootstrap || !toggle) return

    expect(html).toContain('<meta name="color-scheme" content="light dark">')
    expect(bootstrap).toContain('prefers-color-scheme: dark')
    expect(bootstrap).toContain('data-color-scheme')
    expect(bootstrap).toContain('meta[name="color-scheme"]')
    expect(bootstrap).toContain('meta[name="theme-color"]')
    expect(html.indexOf(bootstrap)).toBeLessThan(html.indexOf('rel="stylesheet"'))

    expect(toggle).toContain('aria-label="Switch to dark theme"')
    expect(toggle).not.toContain('aria-pressed=')
    expect(toggle).toContain('class="theme-icon-sun"')
    expect(toggle).toContain('class="theme-icon-moon"')
    expect(toggle.match(/<line /g)).toHaveLength(8)
    expect(toggle).toContain('<circle cx="12" cy="12" r="5"></circle>')
    expect(toggle).toContain('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>')
  })

  it('emits the circular theme reveal with a reduced-motion gate', () => {
    const css = (existsSync(join(distRoot, 'site')) ? readdirSync(join(distRoot, 'site')) : [])
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(distRoot, 'site', name), 'utf8'))
      .join('\n')
      .replace(/\s/g, '')

    expect(css).toContain('@media(prefers-reduced-motion:no-preference)')
    expect(css).toContain('::view-transition-old(root)')
    expect(css).toContain('::view-transition-new(root)')
    expect(css).toContain('animation:.4scubic-bezier(.22,1,.36,1)boththeme-reveal')
    expect(css).toContain('clip-path:circle(0atvar(--theme-transition-x)var(--theme-transition-y))')
    expect(css).toContain('clip-path:circle(var(--theme-transition-radius)atvar(--theme-transition-x)var(--theme-transition-y))')
  })
})
