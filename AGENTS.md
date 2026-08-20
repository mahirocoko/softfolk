# Softfolk contributor guidance

This file applies to the whole repository. Current source, tests, `README.md`, `LICENSE`, and `brand/README.md` remain authoritative when they are more specific.

## Product truth

- Softfolk is a public-domain collection of 20 identities with five costumes each: `signature`, `everyday`, `work`, `formal`, and `yukata`.
- Keep product copy concise, direct, and written for someone evaluating or using the collection. Avoid prompt-inflated feature lists, repeated counts, AI-sounding filler, and unsupported claims.
- CC0 is a real package contract, but not every surface must repeat it. The website footer stays minimal: `Built by Mahiro.` plus the existing repository, metadata, and license links.
- Do not invent Figma files, Product Hunt status, usage metrics, users, versions, testimonials, or other proof that the repository cannot support.

## Canonical asset contracts

- `assets/<identity>/<costume>.png` is the only public avatar delivery tree.
- Keep exactly 100 nested portrait files and no root-level aliases.
- Every canonical portrait is a metadata-free 256×256 8-bit transparent RGBA PNG. Preserve alpha quality and decontaminated soft edges; do not reintroduce a cream matte.
- Canonical PNG encoding is losslessly optimized. Preserve decoded pixels, color type, bit depth, metadata-free delivery, and transparent-pixel RGB; do not use alpha alteration, palette conversion, quantization, resizing, or lossy re-encoding to meet the byte budget.
- `data/avatars.json` owns the 20×5 identity, tag, costume, and path inventory. Keep its paths aligned with `src/collection.ts` and the files on disk.
- Package metadata and visible snippets continue to use canonical `/assets/<identity>/<costume>.png` examples. The hosted demo resolves images, fetches, downloads, and resource links through Vite `BASE_URL` so the standard `/softfolk/` GitHub Pages project path works without changing package-facing examples.
- `brand/softfolk-symbol.png` is the archival Q master. `brand/icons/` owns fixed-size deliveries. Preserve the selected Q geometry, square padding ratio, gradient, texture, color design, and transparent perimeter.
- `brand/social/softfolk-og.png` is the canonical 1200×630 opaque RGB share card. Rebuild it from `brand/social/softfolk-og-source.html` with accepted logo/avatar pixels and authored text; do not use imagegen text or a cropped page screenshot.
- Do not create a second avatar delivery tree or silently edit accepted avatar, logo, generated social, or banner pixels during ordinary web work.
- The accepted portrait identity is soft 3D clay/felt rather than photorealistic. Preserve the established fine continuous fiber hair, minimalist dot/bead eyes, rosy cheeks, full shoulders, and simplified matte material. Do not reopen avatar art direction unless Mahiro explicitly asks.

## Website direction

- The page is a real shareable product website and interactive playground, not a specification sheet or internal lab.
- Keep the top of the page clean: no utility strip above the hero and no frame around the logo.
- Hero typography must feel balanced rather than oversized. Keep the current 600-weight title direction and avoid excessive mobile line wrapping.
- Use Plus Jakarta Sans as the single visual font family across headings, body, controls, metadata, status, and code-like surfaces. Use weight, size, spacing, paint, and syntax color—not a second font—to create hierarchy.
- Keep the whole-page Softfolk atmosphere: warm ivory with broad apricot, coral-pink, lavender, and soft-blue zones derived from the logo. Fine static noise should remain restrained and must not dirty text, cards, portraits, or generated images.
- The portrait ribbon is a marquee. Its portraits should read as soft floating objects without border rings or box shadows, and reduced-motion mode must remain complete and usable.

## Softfolk visual language

- Favor soft, light, calm, tactile surfaces. “Softer” does not mean indistinguishable: palette options still need enough separation to demonstrate real transparent-avatar backgrounds.
- Avoid a dominant dark swatch and avoid high-saturation yellow/orange outliers in the theme set.
- Prefer open, borderless composition when spacing, background, and hierarchy already define a group. Do not compensate for removed borders with replacement outlines or extra shadows.
- Hover states must stay inside the established paint system: no surprise black borders and no translate/lift motion on the hero actions or catalog controls.
- Fix the actual stacking, spacing, or semantic owner of a defect. Do not hide a banner/avatar overlap by making the card larger or polishing an unrelated wrapper.
- Preserve accepted page anatomy. Do not use a small correction as permission to redesign unrelated sections.

## Playground and interaction contracts

- The playground must be genuinely interactive. Costume, identity, theme, shuffle, snippet, copy, download, search, and compare behavior must remain truthful.
- Theme controls change the avatar presentation background through the canonical transparent alpha. `.studio-stage` itself stays transparent; do not recolor the whole playground canvas.
- Theme colors must reach the relevant avatar presentations consistently, including the active mockups and selector portraits.
- Shuffle randomizes identity, costume, and theme, then synchronizes every dependent UI surface.
- The studio snippet is a real canonical `<img src="/assets/<identity>/<costume>.png" />` example. Keep its visible text and clipboard payload exact.
- Use the shared `.hl-tag`, `.hl-attr`, and `.hl-str` syntax-highlight recipe for both quickstart and studio code surfaces. Keep the shared dark code surface readable.
- Mock content should look like believable professional product, social, chat, and profile usage—not Softfolk talking about itself.
- Catalog Download stays a truthful native PNG download with a visible download icon. Compare is eye-icon-only visually but retains a useful accessible name and tooltip.
- Clicking or tapping a catalog portrait opens that identity’s Compare dialog; it must not select Studio or jump the page.
- Preserve semantic buttons/links, keyboard operation, focus-visible affordances, dialog focus return, readable contrast, useful live status, and reduced-motion behavior.

## Layout and responsive behavior

- `catalog-header` is a deliberate responsive flex composition: title/deck left and toolbar right on desktop, with a clean narrow-screen stack.
- Identity cards are borderless. Preserve their focus affordance and practical Download/Compare anatomy.
- `studio-stage` has no border, shadow, background paint, or shell padding. Its child surfaces own the spacing and grouping.
- Social and banner mockups use the selected Softfolk-owned images. In the banner profile card, the avatar paints above the cover, remains unclipped, and clears the name/body content.
- Review desktop and mobile as whole pages, not as isolated component crops. Required checkpoints are 1440px desktop and 390px mobile unless the task establishes different targets.
- Zero horizontal overflow, readable text wrapping, and stable card/control geometry are release requirements.

## Generated website assets

- When a website image is requested, inspect the actual Softfolk symbol and target geometry before writing the prompt.
- Generated social/banner imagery should share the logo’s matte flocked or powder-soft microtexture, diffuse low-contrast light, soft pastel transitions, calm depth, and rounded organic forms.
- Abstract means non-literal: no workspace, person, interface, product story, text, logo, watermark, or label unless the task explicitly requires one.
- Do not add generic circles, halos, frames, or “premium AI” decoration merely to make an asset feel finished.
- Keep social and banner compositions distinct and crop-safe for their real aspect ratios; a banner is not merely a stretched social image or CSS gradient.
- Inspect every generated raster before selecting it. Reject text corruption, detached fragments, wrong material, literal symbolism, weak crops, and images that only match the palette but miss the logo’s softness.
- Store site-only generated runtime images outside canonical `assets/**` and `brand/**`. Retain exact prompt, provider/model, source/output identity, hash, and selection/rejection evidence in the production record, but do not describe that record as a public package contract.

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
