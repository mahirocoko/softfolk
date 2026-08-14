# Softfolk symbol Q asset pack

This directory’s canonical deliverables are the selected Softfolk Q transparent master and six square PNG icon sizes. The cleanup changes only background removal and edge decontamination; the selected Q’s geometry, gradient, texture, color design, and full square padding ratio are preserved.

## Provenance

- The immutable provider source is retained outside Git.
- Raw source SHA-256: `e03f00cdc78e4c893385ef50d593baf796a5f393a673d8b000348e86aaa6272a`
- Raw source properties: 1254×1254 RGB PNG
- Canonical master properties: 1254×1254 RGBA PNG, complete source canvas retained
- Cleanup method: border-reachable warm-background removal, subpixel soft-matte contraction, and edge RGB restoration from neighboring opaque source color
- Explicitly unchanged: Q shape, valleys, base, crop, gradient, texture, color design, and styling

## Canonical files

| File | Role | Dimensions | Format |
| --- | --- | ---: | --- |
| `softfolk-symbol.png` | Transparent archival master | 1254×1254 | RGBA PNG |
| `icons/softfolk-512.png` | Large delivery icon | 512×512 | RGBA PNG |
| `icons/softfolk-256.png` | Standard delivery icon | 256×256 | RGBA PNG |
| `icons/softfolk-128.png` | Compact delivery icon | 128×128 | RGBA PNG |
| `icons/softfolk-64.png` | Small delivery icon | 64×64 | RGBA PNG |
| `icons/softfolk-32.png` | Small delivery icon | 32×32 | RGBA PNG |
| `icons/softfolk-16.png` | Minimum delivery icon | 16×16 | RGBA PNG |

Use the closest intrinsic icon size for fixed-size UI and do not upscale smaller deliveries. Every file retains the master’s square padding ratio and has fully transparent corners and perimeter.

## Edge limitation

The Q contains genuinely pale pastel color at parts of its boundary. That colored boundary is retained; the removed defect was the cream/gray source-background contamination visible around it on dark backgrounds. At 16px, fine texture naturally collapses and the silhouette plus dominant pastel gradient carry recognition.
