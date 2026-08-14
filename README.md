# Softfolk

An open collection of 12 original soft 3D identities with signature, everyday, and work portraits, ready to use in profiles, prototypes, and interfaces.

## Avatars

| Avatar | Signature | Everyday | Work |
| --- | --- | --- | --- |
| Aster | [`signature`](assets/aster/signature.png) | [`everyday`](assets/aster/everyday.png) | [`work`](assets/aster/work.png) |
| Juno | [`signature`](assets/juno/signature.png) | [`everyday`](assets/juno/everyday.png) | [`work`](assets/juno/work.png) |
| Kai | [`signature`](assets/kai/signature.png) | [`everyday`](assets/kai/everyday.png) | [`work`](assets/kai/work.png) |
| Mira | [`signature`](assets/mira/signature.png) | [`everyday`](assets/mira/everyday.png) | [`work`](assets/mira/work.png) |
| Rowan | [`signature`](assets/rowan/signature.png) | [`everyday`](assets/rowan/everyday.png) | [`work`](assets/rowan/work.png) |
| Noa | [`signature`](assets/noa/signature.png) | [`everyday`](assets/noa/everyday.png) | [`work`](assets/noa/work.png) |
| Zuri | [`signature`](assets/zuri/signature.png) | [`everyday`](assets/zuri/everyday.png) | [`work`](assets/zuri/work.png) |
| Theo | [`signature`](assets/theo/signature.png) | [`everyday`](assets/theo/everyday.png) | [`work`](assets/theo/work.png) |
| Ines | [`signature`](assets/ines/signature.png) | [`everyday`](assets/ines/everyday.png) | [`work`](assets/ines/work.png) |
| Omar | [`signature`](assets/omar/signature.png) | [`everyday`](assets/omar/everyday.png) | [`work`](assets/omar/work.png) |
| Sora | [`signature`](assets/sora/signature.png) | [`everyday`](assets/sora/everyday.png) | [`work`](assets/sora/work.png) |
| Eden | [`signature`](assets/eden/signature.png) | [`everyday`](assets/eden/everyday.png) | [`work`](assets/eden/work.png) |

Every portrait is a metadata-free 256×256 RGB PNG.

## Metadata

[`data/avatars.json`](data/avatars.json) provides deterministic identity and costume paths plus descriptive discovery tags. The canonical path pattern is:

```text
assets/<identity>/<costume>.png
```

The three costume IDs are `signature`, `everyday`, and `work`.

## Current contracts

- `assets/<identity>/<costume>.png` owns the canonical public pixels.
- `data/avatars.json` owns the 12×3 identity, tag, and path inventory.
- `src/collection.ts` and `tests/source-inventory.test.ts` own the path and 256×256 RGB delivery contract.
- `index.html` and `src/` own the catalog behavior and presentation.
- `brand/softfolk-symbol.png`, `brand/icons/`, and `brand/README.md` own the selected Q brand delivery.

Generation prompts, provider receipts, rejected candidates, and review sheets are not active package contracts. Git history preserves superseded production context.

## Website

A static catalog for the 12×3 collection lives at the repository root. The selected Softfolk symbol Q is the house mark on the first screen. The mark’s `src` is the canonical 256×256 delivery with matching `width`/`height`; `srcset` adds the 512×512 delivery at `512w`, and `sizes` matches the CSS display clamp so 2x screens get enough source density without changing layout size. Favicons use `brand/icons/softfolk-32.png` and `brand/icons/softfolk-16.png`; the apple-touch icon is `brand/icons/softfolk-256.png`. Vite copies only those four runtime files into `dist`. The archival master, source, 64/128 deliveries, QA evidence, and pack tooling stay in the repo.

```text
pnpm install
pnpm dev
pnpm verify
```

`pnpm verify` typechecks, runs source and interaction checks, builds the site, then checks that `dist` still serves the canonical nested PNG paths, a fresh copy of `data/avatars.json`, and the runtime Q icon files.

## License

Softfolk is dedicated to the public domain under [CC0 1.0 Universal](LICENSE). You can use, modify, and share the avatars without asking permission or giving credit.
