# Softfolk contributor guidance

This file applies to the whole repository. Current source, tests, `README.md`, `LICENSE`, and `brand/README.md` remain authoritative when they are more specific.

## Product truth

- Softfolk is a public-domain, single growing collection of soft 3D characters across five costumes each: `signature`, `everyday`, `work`, `formal`, and `yukata` (current baseline: 40 identities, 200 portraits).
- New identities append to the single registry; never replace or silently delete existing identities.
- Keep product copy concise, direct, and written for someone evaluating or using the collection. Avoid prompt-inflated feature lists, repeated counts, AI-sounding filler, and unsupported claims.
- CC0 is a real package contract, but not every surface must repeat it. The website footer stays minimal: `Built by Mahiro.` plus the existing repository, metadata, and license links.
- Do not invent Figma files, Product Hunt status, usage metrics, users, versions, testimonials, or other proof that the repository cannot support.

## Canonical asset contracts

- `assets/<identity>/<costume>.png` is the only public avatar delivery tree.
- Keep exactly `avatars.length * 5` nested portrait files (currently 200 across 40 identities) and no root-level aliases.
- Every canonical portrait is a metadata-free 256×256 8-bit transparent RGBA PNG. Preserve alpha quality and decontaminated soft edges; do not reintroduce a cream matte.
- Canonical PNG encoding is losslessly optimized. Preserve decoded pixels, color type, bit depth, metadata-free delivery, and transparent-pixel RGB; do not use alpha alteration, palette conversion, quantization, resizing, or lossy re-encoding to meet the byte budget.
- `data/avatars.json` stays the sole registry owning the identity, kind (`person`/`pal`), tag, costume, and path inventory (current baseline: 40×5). Keep its paths aligned with `src/collection.ts` and the files on disk.
- Package metadata and visible snippets continue to use canonical `/assets/<identity>/<costume>.png` examples. The hosted demo resolves images, fetches, downloads, and resource links through Vite `BASE_URL` so the standard `/softfolk/` GitHub Pages project path works without changing package-facing examples.
- `brand/softfolk-symbol.png` is the archival Q master. `brand/icons/` owns fixed-size deliveries. Preserve the selected Q geometry, square padding ratio, gradient, texture, color design, and transparent perimeter.
- `brand/social/softfolk-og.png` is the canonical 1200×630 opaque RGB share card. Rebuild it from `brand/social/softfolk-og-source.html` with accepted logo/avatar pixels and authored text; do not use imagegen text or a cropped page screenshot.
- Do not create a second avatar delivery tree or silently edit accepted avatar, logo, generated social, or banner pixels during ordinary web work.
- All future portrait generation, identity/costume expansion, visual correction, and generated website-asset production must originate in the canonical private `mahirocoko/softfolk-production` ghq clone. In this checkout, resolve it through the ignored `.agent-state/incubate/mahirocoko/softfolk-production` symlink; do not recreate a nested private worktree. Prompts, provider-native raws, masks, receipts, candidates, QA, and selection/rejection decisions never belong in this public repository. Promote only Mahiro-accepted final deliveries here, together with the required catalog/runtime/tests/docs updates.
- The accepted portrait identity is soft 3D clay/felt rather than photorealistic. Preserve the established fine continuous fiber hair, minimalist dot/bead eyes, rosy cheeks, full shoulders, and simplified matte material. Do not reopen avatar art direction unless Mahiro explicitly asks.

## Website direction

- The page is a real shareable product website and interactive playground, not a specification sheet or internal lab.
- Page anatomy is fixed: compact sticky `site-header`, curtain-call hero, Studio workbench, `in-the-wild` showcase, collection explorer, public-domain colophon, minimal footer. Do not reintroduce a utility strip above the header, a quickstart block, or a portrait marquee.
- The hero features the 12-character Softfolk ensemble (`src/assets/hero-ensemble.webp`) on a grounded studio stage with a real-text `Softfolk` wordmark plaque and an authored, non-blocking intro motion sequence that respects `prefers-reduced-motion: reduce`. The wordmark must stay selectable text with readable contrast; the ensemble stage stays decorative (`aria-hidden`) and pointer-free, while the interactive ensemble cast chips below connect directly to the Studio. Do not ship generated title pixels.
- Hero typography must feel balanced rather than oversized. Keep the wordmark clamp and the 600-weight H1 deck direction, and avoid excessive mobile line wrapping.
- Use Plus Jakarta Sans as the single visual font family across headings, body, controls, metadata, status, and code-like surfaces. Use weight, size, spacing, paint, and syntax color—not a second font—to create hierarchy.
- Keep the whole-page Softfolk atmosphere: warm ivory with broad apricot, coral-pink, lavender, and soft-blue zones derived from the logo. Fine static noise should remain restrained and must not dirty text, cards, portraits, or generated images.

## Softfolk visual language

- Favor soft, light, calm, tactile surfaces. “Softer” does not mean indistinguishable: palette options still need enough separation to demonstrate real transparent-avatar backgrounds.
- Avoid a dominant dark swatch and avoid high-saturation yellow/orange outliers in the theme set.
- Prefer open, borderless composition when spacing, background, and hierarchy already define a group. Do not compensate for removed borders with replacement outlines or extra shadows.
- Hover states must stay inside the established paint system: no surprise black borders and no translate/lift motion on the hero actions or catalog controls.
- Fix the actual stacking, spacing, or semantic owner of a defect. Do not hide a banner/avatar overlap by making the card larger or polishing an unrelated wrapper.
- Preserve accepted page anatomy. Do not use a small correction as permission to redesign unrelated sections.

## Playground and interaction contracts

- The playground must be genuinely interactive. Costume, identity, theme, shuffle, snippet, copy, download, share, search, facet, and compare behavior must remain truthful.
- Theme controls change the avatar presentation background through the canonical transparent alpha. `.studio-stage` itself stays transparent; do not recolor the whole playground canvas.
- Theme colors must reach the relevant avatar presentations consistently, including the showcase mockups and selector portraits; `data-theme` stays synced between the Studio stage and the showcase stage.
- Shuffle randomizes identity, costume, and theme, then synchronizes every dependent UI surface.
- The studio snippet is a real canonical `<img src="/assets/<identity>/<costume>.png" />` example. Keep its visible text and clipboard payload exact.
- Use the shared `.hl-tag`, `.hl-attr`, and `.hl-str` syntax-highlight recipe on the studio code surface. Keep the shared dark code surface readable.
- The identity selector is a desktop popover / mobile bottom sheet with search, People/Pals facets, and a recent-identities row. It must keep focus management, Escape/backdrop dismissal, and truthful filtered counts.
- The explorer defaults to the curated Featured set; People/Pals/All facets browse in canonical order, All reveals in bounded batches through a truthful Show more action, and an active search always reaches the whole registry regardless of facet.
- Share view copies an explicit `?identity&costume&theme` URL that restores the same Studio state; Download with background composites the active portrait onto the active theme paint client-side and never touches canonical assets.
- Mock content should look like believable professional product, social, chat, and profile usage—not Softfolk talking about itself.
- Catalog Download stays a truthful native PNG download with a visible download icon. Compare is eye-icon-only visually but retains a useful accessible name and tooltip.
- Clicking or tapping a catalog portrait opens that identity’s Compare dialog; it must not select Studio or jump the page.
- Preserve semantic buttons/links, keyboard operation, focus-visible affordances, dialog focus return, readable contrast, useful live status, and reduced-motion behavior.

## Layout and responsive behavior

- The explorer toolbar is a deliberate responsive composition: search, facet tabs, and tag chips stack cleanly on narrow screens. Anchor targets keep `scroll-margin-top` clear of the sticky header.
- Identity cards are borderless tonal raised paper pedestals with no border ring. Preserve their focus affordance and practical Download/Compare anatomy.
- `studio-stage` has no border, shadow, background paint, or shell padding. Its child surfaces own the spacing and grouping.
- The showcase is an asymmetric editorial triptych on desktop and a tabbed single-panel stage on mobile; every family stays reachable in both modes.
- Social and banner mockups use the selected Softfolk-owned images. In the banner profile card, the avatar paints above the cover, remains unclipped, and clears the name/body content.
- Review desktop and mobile as whole pages, not as isolated component crops. Required checkpoints are 1440px desktop and 390px mobile unless the task establishes different targets.
- Zero horizontal overflow, readable text wrapping, and stable card/control geometry are release requirements.

## Generated website assets

- When a website image is requested, inspect the actual Softfolk symbol and target geometry before writing the prompt.
- Treat a generated website raster as private source artwork by default, not as an automatically approved full-frame runtime image. Agy/Gemini owns the dicut, layer separation, edge cleanup, and multi-background QA for website artwork unless Mahiro explicitly names another owner. The public site should compose Mahiro-accepted transparent delivery layers through real responsive layout/CSS; use an untouched full-background raw directly only when Mahiro explicitly approves that exact runtime role.
- Generated social/banner imagery should share the logo’s matte flocked or powder-soft microtexture, diffuse low-contrast light, soft pastel transitions, calm depth, and rounded organic forms.
- Abstract means non-literal: no workspace, person, interface, product story, text, logo, watermark, or label unless the task explicitly requires one.
- Do not add generic circles, halos, frames, or “premium AI” decoration merely to make an asset feel finished.
- Keep social and banner compositions distinct and crop-safe for their real aspect ratios; a banner is not merely a stretched social image or CSS gradient.
- Inspect every generated raster before selecting it. Reject text corruption, detached fragments, wrong material, literal symbolism, weak crops, and images that only match the palette but miss the logo’s softness.
- Store site-only generated runtime images outside canonical `assets/**` and `brand/**`. Retain the untouched raw, exact prompt, provider/model, source/output identity, masks, dicut receipts, layer manifest, QA, hashes, and selection/rejection evidence in the production record, but do not describe that record as a public package contract.

## Implementation workflow

- Work in the current checkout and preserve cumulative or unrelated changes. Check `git status` before editing; never restore work you did not create intentionally.
- If a development or preview server is already running, use it and leave it running unless Mahiro explicitly asks to restart or stop it.
- Use the repository package manager and pinned commands: `pnpm`, never `npm`, Yarn, or ad-hoc `npx` substitutes.
- Prefer the smallest owner-level correction. Update focused tests when behavior, paths, output, accessibility, or source contracts change.
- Keep code consistent with the existing TypeScript/CSS style: focused typed helpers, single quotes, and no semicolons unless tooling requires otherwise.
- Do not add a dependency for static syntax highlighting, simple paint, or behavior the existing stack can express directly.
- Keep current docs and tests aligned when canonical format, path, public output, or brand delivery changes. Historical production notes must not contradict current contracts.
- The production site is `https://mahirocoko.github.io/softfolk/`. `vite.config.ts` defaults to `/softfolk/`, static copied HTML assets use `%BASE_URL%`, and `.github/workflows/deploy-pages.yml` owns the verified `main` → Pages release.

## Validation and review gates

- Use `pnpm verify` for the complete local contract: typecheck, source/interaction tests, production build, and dist tests.
- During iteration, run the narrowest useful check first. Before handoff, run `git diff --check` and the relevant exact searches for changed contracts.
- Browser QA is serialized: one browser session, desktop then mobile. Check overflow, broken images, console/page errors, real image loading, changed interactions, responsive layout, and computed paint relevant to the task.
- Technical checks do not equal visual acceptance. Inspect rendered whole-page evidence, then leave final product/taste approval to Mahiro.
- Do not replace Mahiro’s visual gate with prolonged reviewer loops or claim the site is accepted because tests/build/browser mechanics pass.
- Do not commit, push, deploy, or release unless Mahiro explicitly asks.
- Do not claim a Pages release succeeded from configuration or workflow startup alone. Wait for a successful deployment terminal state, then verify the live page, OG image, asset base paths, interactions, and console.
