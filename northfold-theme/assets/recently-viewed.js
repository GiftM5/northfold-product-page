(() => {
  const STORAGE_KEY = 'northfold:recently-viewed';
  const MAX_STORED = 12;
  const MAX_SHOWN = 4;
  const FETCH_ATTEMPTS = 8;

  function readHandles() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      return Array.isArray(parsed) ? parsed.filter((handle) => typeof handle === 'string') : [];
    } catch (error) {
      return [];
    }
  }

  function writeHandles(handles) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handles.slice(0, MAX_STORED)));
    } catch (error) {
      // Storage can be blocked or full; the feature simply has nothing to show.
    }
  }

  function record(handle) {
    if (!handle) {
      return;
    }

    writeHandles([handle, ...readHandles().filter((stored) => stored !== handle)]);
  }

  function forget(handle) {
    writeHandles(readHandles().filter((stored) => stored !== handle));
  }

  function formatPrice(cents, container) {
    const amount = cents / 100;
    const { currency, locale } = container.dataset;

    try {
      return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency }).format(amount);
    } catch (error) {
      return amount.toFixed(2);
    }
  }

  function imageUrl(src, width) {
    const url = new URL(src, window.location.origin);
    url.searchParams.set('width', String(width));
    return url.toString();
  }

  async function fetchProduct(handle, container) {
    try {
      const response = await fetch(`${container.dataset.rootUrl}products/${encodeURIComponent(handle)}.js`, {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 404) {
        forget(handle);
        return null;
      }

      return response.ok ? await response.json() : null;
    } catch (error) {
      return null;
    }
  }

  function buildCard(product, container) {
    const item = document.createElement('li');
    item.className = 'recently-viewed__item';

    if (product.featured_image) {
      const media = document.createElement('div');
      media.className = 'recently-viewed__media';

      const image = document.createElement('img');
      image.src = imageUrl(product.featured_image, 360);
      image.srcset = [240, 360, 480].map((width) => `${imageUrl(product.featured_image, width)} ${width}w`).join(', ');
      image.sizes = '(min-width: 750px) 25vw, 50vw';
      image.alt = '';
      image.loading = 'lazy';
      image.width = 360;
      image.height = 360;

      media.append(image);
      item.append(media);
    }

    const title = document.createElement('a');
    title.className = 'recently-viewed__title';
    title.href = product.url;
    title.textContent = product.title;

    const price = document.createElement('p');
    price.className = 'recently-viewed__price';
    price.textContent = `${product.price_varies ? `${container.dataset.fromLabel} ` : ''}${formatPrice(product.price, container)}`;

    item.append(title, price);
    return item;
  }

  async function render(container) {
    const list = container.querySelector('[data-recently-viewed-list]');
    const currentHandle = container.dataset.currentHandle;

    if (!list) {
      return;
    }

    const candidates = readHandles()
      .filter((handle) => handle !== currentHandle)
      .slice(0, FETCH_ATTEMPTS);

    // Fetch in parallel but keep stored order, so deleted products can be skipped without leaving gaps.
    const products = (await Promise.all(candidates.map((handle) => fetchProduct(handle, container))))
      .filter(Boolean)
      .slice(0, MAX_SHOWN);

    list.replaceChildren(...products.map((product) => buildCard(product, container)));
    container.hidden = products.length === 0 && container.dataset.designMode !== 'true';
    container.classList.toggle('recently-viewed--empty', products.length === 0);
  }

  function init(root = document) {
    root.querySelectorAll('[data-recently-viewed-record]').forEach((element) => {
      record(element.dataset.handle);
    });

    root.querySelectorAll('[data-recently-viewed]').forEach(render);
  }

  window.NorthfoldRecentlyViewed = { record, get: readHandles };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
