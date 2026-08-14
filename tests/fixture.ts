import type { Collection } from '../src/collection.ts'
import { mountCatalog } from '../src/catalog.ts'

export function catalogMarkup(): string {
  return `
    <main id="collection" tabindex="-1">
      <form id="discover" action="#" method="get">
        <label for="identity-search">Find an identity</label>
        <input id="identity-search" name="q" type="search">
        <button type="button" data-reset-search hidden>Clear search</button>
      </form>
      <fieldset class="costumes">
        <legend>Costume</legend>
        <div class="costume-options">
          <label><input type="radio" name="costume" value="signature" checked><span>Signature</span></label>
          <label><input type="radio" name="costume" value="everyday"><span>Everyday</span></label>
          <label><input type="radio" name="costume" value="work"><span>Work</span></label>
        </div>
      </fieldset>
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

export function mountFixture(collection: Collection): HTMLElement {
  document.body.innerHTML = catalogMarkup()
  mountCatalog(document, collection)
  return document.body
}
