import type { Collection } from '../src/collection.ts'
import { mountCatalog } from '../src/catalog.ts'

export function catalogMarkup(): string {
  return `
    <main id="collection" tabindex="-1">
      <section class="playground-section" aria-labelledby="studio-heading">
        <h2 id="studio-heading" class="sr-only">Interactive Playground Studio</h2>
        <fieldset class="costumes">
          <legend>Costume</legend>
          <div class="costume-options">
            <label><input type="radio" name="costume" value="signature" checked><span>Signature</span></label>
            <label><input type="radio" name="costume" value="everyday"><span>Everyday</span></label>
            <label><input type="radio" name="costume" value="work"><span>Work</span></label>
            <label><input type="radio" name="costume" value="formal"><span>Formal</span></label>
            <label><input type="radio" name="costume" value="yukata"><span>Yukata</span></label>
          </div>
        </fieldset>

        <div class="theme-palette-control">
          <div class="theme-swatches" aria-label="Stage theme colors">
            <button type="button" class="swatch-btn active" data-theme="cream" aria-pressed="true"></button>
            <button type="button" class="swatch-btn" data-theme="peach" aria-pressed="false"></button>
            <button type="button" class="swatch-btn" data-theme="sage" aria-pressed="false"></button>
          </div>
        </div>

        <button type="button" data-action="shuffle">Randomize</button>

        <div id="studio-avatar-strip" aria-label="Identity selector"></div>

        <div id="studio-stage" data-theme="cream">
          <div class="studio-code-banner">
            <code id="active-specimen-snippet">&lt;img src="/assets/aster/signature.png" /&gt;</code>
            <button type="button" data-action="copy-active-snippet">Copy</button>
          </div>

          <div class="mockups-grid">
            <div class="mockup-card">
              <img class="active-dynamic-avatar" src="/assets/aster/signature.png" alt="" width="48" height="48">
              <span class="active-dynamic-name">Aster</span>
              <span class="active-dynamic-costume">Signature</span>
              <button type="button" class="like-btn" data-interactive="like">
                <span class="like-count">24</span>
              </button>
              <button type="button" class="btn-follow" data-interactive="follow">Follow</button>
            </div>
            <div id="team-members-grid"></div>
          </div>
        </div>
      </section>

      <form id="discover" action="#" method="get">
        <label for="identity-search">Find an identity</label>
        <input id="identity-search" name="q" type="search">
        <button type="button" data-reset-search hidden>Clear search</button>
      </form>
      <p id="roster-status"></p>
      <ul id="roster" role="list"></ul>
      <div id="empty-results" hidden>
        <p>No identities match “<span data-empty-query></span>”.</p>
      </div>
    </main>
    <dialog id="compare-dialog" aria-labelledby="compare-title">
      <form method="dialog">
        <h2 id="compare-title">Compare</h2>
        <button type="submit" data-close-compare>Close</button>
      </form>
      <div id="compare-stage"></div>
    </dialog>
  `
}

export function mountFixture(collection: Collection, runtimeBaseUrl = '/'): HTMLElement {
  document.body.innerHTML = catalogMarkup()
  mountCatalog(document, collection, runtimeBaseUrl)
  return document.body
}
