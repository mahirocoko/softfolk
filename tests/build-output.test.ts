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
    expect(html).not.toContain('vite-ignore')

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
    expect(symbol).toContain('sizes="clamp(6.75rem, 28vw, 10rem)"')
    expect(symbol).not.toMatch(/style=/)

    const css = (existsSync(join(distRoot, 'site')) ? readdirSync(join(distRoot, 'site')) : [])
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(distRoot, 'site', name), 'utf8'))
      .join('\n')
    expect(css.replace(/\s/g, '')).toMatch(
      /\.brand-symbol\{[^}]*width:clamp\(6\.75rem,28vw,10rem\)/,
    )
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

  it('ensures all marquee track images load eagerly and deterministically without lazy loading', () => {
    const html = readFileSync(join(distRoot, 'index.html'), 'utf8')
    const marqueeWrapperMatch = html.match(/<div\s+class="marquee-wrapper"[\s\S]*?<\/header>/)?.[0]
    expect(marqueeWrapperMatch).toBeDefined()
    if (!marqueeWrapperMatch) return

    const imgTags = marqueeWrapperMatch.match(/<img[\s\S]*?>/g) ?? []
    expect(imgTags).toHaveLength(24)
    for (const img of imgTags) {
      expect(img).toContain('loading="eager"')
      expect(img).not.toContain('loading="lazy"')
      expect(img).toContain(`src="${siteBase}assets/`)
    }
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
})
