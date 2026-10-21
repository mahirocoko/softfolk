# Softfolk web redesign brief

**Status:** Mahiro accepted the ensemble direction and reviewed the final Studio, Explorer, and Dark colophon corrections on 2026-10-21. Local verification passed; deployment is tracked separately.
**UX workflow:** `mh-ux-mtgzc8ux-f4fc3230`
**Scope:** Living redesign contract for a single growing 40 → 100+ identity collection (`AGENTS.md` is authoritative whenever older notes differ)

## Direction owner

The S01–S05 frames and Kimi K3 implementation are historical starting points. Mahiro gave Agy/Argon creative ownership of the current whole-page redesign and authorized Codex-generated landing imagery. The current hero uses the accepted transparent 12-character ensemble delivery at `src/assets/hero-ensemble.webp`, composed with semantic HTML/CSS and selectable text. Canonical portraits remain unchanged; the showcase retains the accepted Softfolk-owned social/banner images. Plus Jakarta Sans is the single visual font family.

All future portrait generation, identity/costume expansion, visual correction, and generated website-asset production must originate in the canonical private `mahirocoko/softfolk-production` repository (resolved locally via the ignored `.agent-state/incubate/mahirocoko/softfolk-production` symlink). Promote only Mahiro-accepted final deliveries here, together with the required catalog/runtime/tests/docs updates. Asset promotion, commit, push, deploy, and release always require separate Mahiro authorization.

## Current reality

- Softfolk has one append-only registry with 40 identities and 200 canonical portraits today. Counts remain data-derived as the collection grows.
- Canonical downloads are metadata-free transparent 256×256 RGBA PNGs at stable `/assets/<identity>/<costume>.png` URLs.
- Search, five-costume selection, compare/download, theme switching, snippet copy, shuffle, share URL restoration, Light/Dark behavior, reduced motion, and focus return work across desktop and mobile.
- The Studio uses 6 pinned/recent identities plus a searchable `Select identity` control (desktop popover anchored directly beneath the identity control group; mobile bottom sheet with inner grid scroll).
- The quickstart block, utility strip, and looping marquee are removed.

## Implemented page anatomy: Header → Curtain-Call Hero → Studio → In the Wild → Explorer → Colophon → Footer

The site is a shareable product website and interactive playground rather than a specification sheet or internal lab.

### Desktop section order

1. **Compact sticky header (`site-header`)**
   - Softfolk symbol and wordmark on the left.
   - `Studio` and `Collection` anchors in the navigation group.
   - GitHub link and the accessible two-state Light/Dark theme toggle on the right.
   - Do not add destinations such as Docs or Costumes until those surfaces actually exist.

2. **S01 Curtain-call hero (`hero`)**
   - Responsive transparent 12-character ensemble artwork on a decorative, pointer-free stage (`aria-hidden="true"`), with a selectable real-text `Softfolk` plaque. The former seven floating catalog cutouts and cloud-pedestal candidate are superseded.
   - Balanced 600-weight `H1` headline (`Free Soft 3D Avatars for Your Next Project`) and concise CC0 deck below the wordmark stage.
   - Primary CTA: `Explore Studio`. Secondary CTA: `View on GitHub`.
   - Data-derived identity and portrait counts (`40 Unique Identities`, `200 Soft 3D Portraits`) plus `5 Costumes Each`, `CC0 Public Domain`, `256×256 PNG`, and `Zero Attribution`.
   - Eight semantic ensemble quick-pick chips activate their identity in Studio and navigate to `#studio`, respecting reduced motion.
   - `src/intro.ts` owns the non-blocking Web Animations API entrance, bounded image-readiness wait, skip-on-interaction, and immediate reduced-motion state. Static content remains visible without animation support.

3. **S02 Studio workbench (`#studio`)**
   - Borderless, transparent `.studio-stage` where child surfaces (`.specimen-canvas` and `.inspector-panel`) own spacing, background, and elevation.
   - Left specimen panel shows the active canonical portrait over the active theme background (`--avatar-theme-bg`), aligned to the lower presentation edge rather than floating above a flat image cut. Identity name, kind (`Person`/`Pal`), costume, and `256×256 transparent PNG` metadata remain truthful; presentation scaling does not change the downloadable pixels.
   - Right inspector panel groups:
     - **Identity**: 6 pinned/recent avatars (`aria-pressed`), Shuffle button, and `Select identity` trigger opening a desktop popover / mobile bottom sheet with search, `All / People / Pals` facets, 4-column avatar grid, arrow-key navigation, focus trap, and `Escape`/backdrop dismissal with focus return.
     - **Costume**: Segmented radio pills for `Signature`, `Everyday`, `Work`, `Formal`, and `Yukata`.
     - **Background**: Seven soft pastel theme swatches (`sage`, `mist`, `blush`, `lavender`, `sky`, `butter`, `apricot`) with no dominant dark swatch or loud yellow/orange outlier.
     - **Embed**: Canonical `<img src="/assets/<identity>/<costume>.png" />` snippet on the shared dark code surface using `.hl-tag`, `.hl-attr`, and `.hl-str` syntax highlighting and one-click copy.
     - **Actions**:
       1. `Download transparent PNG` — primary canonical download.
       2. `Download with background` — client-side 256×256 composite on the active theme color.
       3. `Share view` — copies a URL with explicit `?identity&costume&theme` parameters.

4. **S03 Living context showcase (`#in-the-wild`)**
   - Synchronizes `data-theme`, active avatar portrait, and identity name with the Studio.
   - **Desktop**: Three-column asymmetric editorial triptych (`social`, `chat`, `profile`) with staggered vertical rhythm and zero overlapping cards:
     - Column 1 (`Social`): Social post card featuring the Softfolk-owned pastel flocked 3D artwork, reaction stack, and interactive `Like` (`aria-pressed`, live count) and `Comment` buttons.
     - Column 2 (`Chat`): Team `Messages` list and `Comment` thread card.
     - Column 3 (`Profile`): Banner profile card (using the Softfolk-owned pastel banner with unclipped overlapping avatar), profile stats card, and interactive `Collaborators` switcher.
   - **Mobile (`<= 52rem`)**: Controlled single-panel stage switched via accessible `Social / Chat / Profile` tabs (`role="tablist"`, arrow-key navigation).

5. **S04 Curated Collection Explorer (`#collection-explorer`)**
   - Responsive toolbar with search input (`<search>`), `Clear` action, `Featured 12 / All 40 / People 20 / Pals 20` facet tabs, and 5 curated appearance/character tag chips (`warm-palette`, `cool-palette`, `glasses`, `cat`, `older`).
   - Uses explicit `kind: "person" | "pal"` metadata from `data/avatars.json`.
   - Defaults to the 12 curated `Featured` identities; `All` reveals the collection in bounded batches of 24 via a truthful `Show more identities` button (hidden whenever all matching items are already visible); active search queries the entire 40-identity registry regardless of active facet.
   - Tonal raised paper pedestal cards (`.identity`) with no border ring, portrait button opening Compare, native PNG `Download` link with icon, and icon-only `Compare` button (`aria-label` + `title`).
   - Five-costume `Compare` modal dialog (`<dialog>`) with direct per-costume PNG downloads, backdrop dismissal, and focus return to the opener.

6. **S05 Public-domain colophon & minimal footer**
   - Quiet typographic `CC0` seal colophon (`CC0 1.0 · Public domain · No attribution required`) above the minimal site footer.
   - Minimal footer: `Built by Mahiro.` plus `GitHub`, `avatars.json`, and `License (CC0)`.

### Mobile anatomy (`390px`)

- Preserves the exact semantic section order: header → curtain-call hero → Studio → In the Wild → Collection Explorer → CC0 colophon → footer.
- Scales the ensemble artwork within its responsive stage without reverting to the superseded floating-portrait layout.
- Keeps the 5 Studio costume pills and the 4 Collection facet tabs on clean single-row segmented tracks at `390px` with zero horizontal overflow.
- Uses `1rem` (`16px`) font size on mobile search inputs (`#identity-search`, `#identity-select-search`) to prevent iOS Safari focus auto-zoom.
- Identity selector opens as a fixed bottom sheet (`max-height: min(78dvh, 36rem)`) with pinned search/facet header and scrollable avatar grid.

## Visual and material guidance

- **Single font family**: Plus Jakarta Sans across headings, body, controls, metadata, status, and code-like surfaces. Hierarchy comes from weight, size, spacing, paint, and syntax color—never a second typeface.
- **Atmosphere**: Warm ivory (`#FAF8F5`) with broad apricot, coral-pink, lavender, and soft-blue radial zones derived from the Softfolk symbol, paired with warm obsidian (`#151413`) in Dark mode.
- **Theme legibility**: Labels, counts, timestamps, and controls use theme-owned paints. The CC0 seal and its supporting line are separate elements, with stronger seal paint in Dark mode. Rendered review is recorded separately from any numerical contrast measurement; no blanket WCAG conformance claim is established here.
- **Restrained motion**: No translate/lift hover jumps on hero CTAs, catalog controls, or identity card shells; complete `prefers-reduced-motion: reduce` resets across transitions, animations, and view transitions.

## Keep / adapt / remove

### Keep

- Single append-only registry and stable asset URLs.
- Transparent 256×256 canonical PNGs and five costumes.
- Search semantics, Compare dialog, direct downloads, snippet copy, theme engine, focus behavior, and live mockups.
- Truthful current CC0 and zero-attribution claims.

### Adapt

- Hero becomes shorter and sends users to Studio.
- The accepted ensemble artwork composes with semantic responsive layout; source artwork and QA remain private, while only the website delivery is public.
- Studio strip becomes pinned/recent identities plus a searchable selector.
- Catalog becomes Featured/faceted/searchable and progressively reveals a large collection.
- Studio gains background export and shareable URL state.
- Mobile mockups become a controlled family switcher rather than one long stack.

### Remove

- Three-step quickstart block.
- Hardcoded looping identity marquee.
- All-identities Studio strip.
- Any static current-count copy that can drift from the registry.

## Accessibility and behavior invariants

- Searchable identity selection must support keyboard search, arrows, Enter, Escape, visible focus, and selected-state announcements.
- Costume and facet controls remain semantic radios/tabs or equivalent accessible controls.
- Theme swatches keep accessible names and selected state independent of color alone.
- Dialog focus trap and return-to-trigger remain intact.
- Dynamic catalog count, export completion, and share completion use polite live announcements.
- Desktop, tablet, and mobile evidence must cover long labels, empty search, filtered results, open selector, Compare open/closed, Light/Dark, and reduced motion.

## Current implementation decisions

1. **Facet owner — selected by Mahiro:** explicit `kind` metadata rather than tag inference.
2. **Artwork delivery — selected by Mahiro:** Agy/Argon owns the current creative implementation. Codex generated the ensemble source; Agy/Argon prepared the transparent delivery and multi-background QA in private production. The accepted WebP is a site-only asset, not part of the canonical avatar collection.
3. **Catalog default — selected by Mahiro:** 12 Featured identities first, with All/People/Pals and bounded `Show more` for growth.

Mahiro accepted the ensemble direction on 2026-10-21, then accepted the presented Studio, Explorer alignment, and Dark colophon corrections. `pnpm verify` and `git diff --check` passed locally. Executor-reported desktop/mobile Light/Dark and motion checks are supporting evidence, not exhaustive independent or human per-state verification. Mahiro separately authorized commit, push, Pages release, and shutdown of the task-owned preview/executor on 2026-10-21. Release success requires the terminal deployment result and live checks, not this document.
