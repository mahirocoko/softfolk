import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: process.env.SITE_BASE_PATH ?? '/softfolk/',
  publicDir: false,
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'assets', dest: '.' },
        { src: 'data', dest: '.' },
        { src: 'LICENSE', dest: '.' },
        {
          src: [
            'brand/icons/softfolk-16.png',
            'brand/icons/softfolk-32.png',
            'brand/icons/softfolk-256.png',
            'brand/icons/softfolk-512.png',
          ],
          dest: '.',
        },
        { src: 'brand/social/softfolk-og.png', dest: '.' },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'site',
    sourcemap: true,
  },
})
