import type { Collection } from '../src/collection.ts'
import { mountCatalog } from '../src/catalog.ts'

export function catalogMarkup(): string {
  return `
    <header class="site-header">
      <span id="hero-identities-count">40</span>
      <span id="hero-portraits-count">200</span>
    </header>
    <section class="hero" aria-labelledby="hero-title" data-intro="idle">
      <div class="hero-stage" aria-hidden="true">
        <div class="hero-ensemble-stage">
          <div class="hero-stage-aura"></div>
          <div class="hero-stage-plinth"></div>
          <div class="hero-ensemble-frame">
            <img id="hero-ensemble-img" class="hero-ensemble-img" src="/src/assets/hero-ensemble.webp" width="1536" height="1024" alt="" fetchpriority="high" decoding="async">
          </div>
          <div class="wordmark-plaque">
            <span class="wordmark-dot"></span>
            <span class="wordmark-text">Softfolk</span>
          </div>
        </div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title" id="hero-title">Free Soft 3D Avatars</h1>
        <p class="hero-deck">Soft 3D portraits.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#studio">Explore Studio</a>
        </div>
        <ul class="feature-badges">
          <li class="feature-badge">CC0</li>
        </ul>
        <div class="hero-cast">
          <a class="cast-chip is-active" href="#studio" data-cast="aster" aria-current="true"><span>Aster</span></a>
          <a class="cast-chip" href="#studio" data-cast="moon-cat"><span>Moon Cat</span></a>
        </div>
      </div>
    </section>
    <main id="collection" tabindex="-1">
      <section class="studio-section" id="studio" aria-labelledby="studio-heading" tabindex="-1">
        <h2 id="studio-heading">Studio</h2>
        <div id="studio-stage" class="studio-stage" data-theme="sage">
          <img id="specimen-portrait" src="/assets/aster/signature.png" alt="" width="256" height="256">
          <span class="active-dynamic-name">Aster</span>
          <span class="active-dynamic-kind">Person</span>
          <span class="active-dynamic-costume">Signature</span>

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

          <div class="theme-swatches" aria-label="Stage theme colors">
            <button type="button" class="swatch-btn" data-theme="mint" aria-pressed="false"></button>
            <button type="button" class="swatch-btn active" data-theme="sage" aria-pressed="true"></button>
            <button type="button" class="swatch-btn" data-theme="cream" aria-pressed="false"></button>
            <button type="button" class="swatch-btn" data-theme="peach" aria-pressed="false"></button>
            <button type="button" class="swatch-btn" data-theme="blue" aria-pressed="false"></button>
            <button type="button" class="swatch-btn" data-theme="buttercream" aria-pressed="false"></button>
            <button type="button" class="swatch-btn" data-theme="apricot" aria-pressed="false"></button>
          </div>

          <button type="button" data-action="shuffle">Randomize</button>

          <div id="pinned-identities" role="group" aria-label="Recent identities"></div>
          <button type="button" id="identity-select-trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="identity-select-panel">
            <span>Select identity</span>
          </button>
          <div class="identity-select-backdrop" data-select-backdrop hidden></div>
          <div id="identity-select-panel" role="dialog" aria-label="Select identity" hidden>
            <input id="identity-select-search" type="search">
            <button type="button" data-close-select>Close</button>
            <div>
              <button type="button" data-select-facet="all" aria-pressed="true">All</button>
              <button type="button" data-select-facet="people" aria-pressed="false">People</button>
              <button type="button" data-select-facet="pals" aria-pressed="false">Pals</button>
            </div>
            <div id="identity-select-grid" role="listbox" aria-label="Identities"></div>
            <p data-select-status aria-live="polite"></p>
          </div>

          <code id="active-specimen-snippet">&lt;img src="/assets/aster/signature.png" /&gt;</code>
          <button type="button" data-action="copy-active-snippet">Copy</button>

          <a id="download-transparent" href="/assets/aster/signature.png" download="aster-signature.png">Download transparent PNG</a>
          <button type="button" id="download-background">Download with background</button>
          <button type="button" id="share-view">Share view</button>

          <p id="studio-status" role="status" aria-live="polite"></p>
        </div>
      </section>

      <section class="showcase-section" id="in-the-wild" aria-labelledby="showcase-heading">
        <h2 id="showcase-heading">In the wild</h2>
        <div class="showcase-tabs" role="tablist" aria-label="Mockup family">
          <button type="button" role="tab" data-family="social" aria-selected="true">Social</button>
          <button type="button" role="tab" data-family="chat" aria-selected="false" tabindex="-1">Chat</button>
          <button type="button" role="tab" data-family="profile" aria-selected="false" tabindex="-1">Profile</button>
        </div>
        <div class="showcase-stage" data-theme="sage" data-active-family="social">
          <div class="showcase-panel showcase-social" data-family-panel="social">
            <div class="mockup-card">
              <img class="active-dynamic-avatar" src="/assets/aster/signature.png" alt="" width="48" height="48">
              <span class="active-dynamic-name">Aster</span>
              <span class="active-dynamic-costume">Signature</span>
              <span class="reactions-count">Liked by Moon Cat, Cloud Bunny and 24 others</span>
              <button type="button" class="like-btn" data-interactive="like" aria-pressed="false">
                <span class="like-count">24</span>
              </button>
            </div>
          </div>
          <div class="showcase-panel showcase-chat" data-family-panel="chat">
            <div class="mockup-card">
              <img class="active-dynamic-avatar" src="/assets/aster/signature.png" alt="" width="38" height="38">
              <span class="active-dynamic-name">Aster</span>
            </div>
          </div>
          <div class="showcase-panel showcase-profile" data-family-panel="profile">
            <div class="mockup-card">
              <img class="active-dynamic-avatar" src="/assets/aster/signature.png" alt="" width="68" height="68">
              <span class="active-dynamic-name">Aster</span>
              <button type="button" class="btn-follow" data-interactive="follow" aria-pressed="false">Follow</button>
            </div>
            <div id="team-members-grid"></div>
          </div>
        </div>
      </section>

      <section class="catalog-section" id="collection-explorer" aria-labelledby="catalog-heading">
        <h2 id="catalog-heading">Meet the collection</h2>
        <p>Search <span id="catalog-identities-count">40</span> identities.</p>
        <form id="discover" action="#" method="get">
          <label for="identity-search">Find an identity</label>
          <input id="identity-search" name="q" type="search">
          <button type="button" data-reset-search hidden>Clear search</button>
        </form>
        <div class="facet-tabs" role="group" aria-label="Browse the collection">
          <button type="button" class="facet-btn active" data-facet="featured" aria-pressed="true">Featured <span class="facet-count" data-facet-count="featured">12</span></button>
          <button type="button" class="facet-btn" data-facet="all" aria-pressed="false">All <span class="facet-count" data-facet-count="all">40</span></button>
          <button type="button" class="facet-btn" data-facet="people" aria-pressed="false">People <span class="facet-count" data-facet-count="people">20</span></button>
          <button type="button" class="facet-btn" data-facet="pals" aria-pressed="false">Pals <span class="facet-count" data-facet-count="pals">20</span></button>
        </div>
        <div class="tag-chips" role="group" aria-label="Popular tags">
          <button type="button" class="tag-chip" data-tag-chip="warm-palette">warm-palette</button>
          <button type="button" class="tag-chip" data-tag-chip="glasses">glasses</button>
        </div>
        <p id="roster-status"></p>
        <ul id="roster" role="list"></ul>
        <div id="empty-results" hidden>
          <p>No identities match “<span data-empty-query></span>”.</p>
        </div>
        <button type="button" id="show-more" hidden>
          <span>Show more identities</span> <span id="show-more-remaining"></span>
        </button>
      </section>
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
