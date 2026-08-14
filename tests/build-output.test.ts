import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canonicalAssetPath, COSTUME_IDS } from '../src/collection.ts'
import { loadSourceCollection, repoPath } from './helpers.ts'

function sha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

describe('build output canonical paths', () => {
  const distRoot = repoPath('dist')

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
    expect(html).toContain('href="/data/avatars.json"')
    expect(html).toContain('href="/LICENSE"')
    expect(html).not.toMatch(/\/assets\/index-/)
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
    expect(html).toContain('href="/brand/icons/softfolk-32.png"')
    expect(html).toContain('sizes="32x32"')
    expect(html).toContain('href="/brand/icons/softfolk-16.png"')
    expect(html).toContain('sizes="16x16"')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain('href="/brand/icons/softfolk-256.png"')
    expect(html).not.toContain('softfolk-128.png')
    expect(html).not.toMatch(/\/site\/softfolk-\d+-[^"]+\.png/)
    expect(html).not.toContain('vite-ignore')

    for (const name of runtimeIcons) {
      expect(html).toContain(`/brand/icons/${name}`)
    }

    const symbol = html.match(/<img\s+class="brand-symbol"[\s\S]*?>/)?.[0]
    expect(symbol).toContain('alt=""')
    expect(symbol).toContain('width="256"')
    expect(symbol).toContain('height="256"')
    expect(symbol).toContain('src="/brand/icons/softfolk-256.png"')
    expect(symbol).toContain(
      'srcset="/brand/icons/softfolk-256.png 256w, /brand/icons/softfolk-512.png 512w"',
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
})
