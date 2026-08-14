# Softfolk

[![Softfolk — 48 transparent portraits across 16 identities and 3 costumes](brand/social/softfolk-og.png)](https://mahirocoko.github.io/softfolk/)

Softfolk is a collection of 16 original soft 3D characters. Each one comes in three costumes—signature, everyday, and work—for a total of 48 transparent 256×256 PNG portraits.

Use them in profiles, prototypes, mockups, or interfaces. **[Browse the collection →](https://mahirocoko.github.io/softfolk/)**

## Collection

| Identity | Signature | Everyday | Work |
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
| Lumi | [`signature`](assets/lumi/signature.png) | [`everyday`](assets/lumi/everyday.png) | [`work`](assets/lumi/work.png) |
| Pax | [`signature`](assets/pax/signature.png) | [`everyday`](assets/pax/everyday.png) | [`work`](assets/pax/work.png) |
| Marlo | [`signature`](assets/marlo/signature.png) | [`everyday`](assets/marlo/everyday.png) | [`work`](assets/marlo/work.png) |
| Roux | [`signature`](assets/roux/signature.png) | [`everyday`](assets/roux/everyday.png) | [`work`](assets/roux/work.png) |

## Use an avatar

Portraits follow one path pattern:

```text
assets/<identity>/<costume>.png
```

For example:

```html
<img src="/assets/kai/work.png" alt="Kai in their work outfit" width="256" height="256" />
```

[`data/avatars.json`](data/avatars.json) lists every identity, costume path, and discovery tag if you want to build a picker or search the collection.

## Run the website locally

```text
pnpm install
pnpm dev
pnpm verify
```

`pnpm verify` runs the typecheck, tests, production build, and output checks.

## License

Softfolk is released under [CC0 1.0 Universal](LICENSE). You can use, modify, and share the avatars without asking permission or giving credit.
