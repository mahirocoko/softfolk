# Softfolk share card

## Asset contract

- Runtime source: `brand/social/softfolk-og.png`
- Public build path: `dist/brand/social/softfolk-og.png`
- Production URL: `https://mahirocoko.github.io/softfolk/brand/social/softfolk-og.png`
- Intended use: Open Graph and Twitter large-image previews
- Dimensions: 1200×630
- Format: opaque, metadata-free RGB PNG
- SHA-256: `ac7d30ad9849feb23333f836689f387c36e2a141de25fadba54c4a71ab8b3654`
- Encoding: losslessly optimized with `oxipng 10.2.0`; decoded RGB pixels are unchanged
- Visual source: accepted Softfolk Q, current whole-page gradient/noise, and the canonical Aster, Mira, Kai, and Zuri signature portraits
- Copy source: authored directly in `brand/social/softfolk-og-source.html`; no generated raster text
- Production mode: deterministic browser render, not image generation
- Status: accepted production share card

The standard GitHub Pages site is `https://mahirocoko.github.io/softfolk/`. The release workflow copies this file byte-for-byte into `dist` and deploys it under the project base.

## Rebuild

Serve the repository root over HTTP, open `brand/social/softfolk-og-source.html` in a 1200×630 browser viewport after Plus Jakarta Sans loads, and capture the exact viewport. Convert the screenshot to opaque RGB and save it without metadata as `brand/social/softfolk-og.png`.

Do not replace the accepted logo or avatar pixels, use image generation for embedded copy, or crop a full site screenshot as the production card.
