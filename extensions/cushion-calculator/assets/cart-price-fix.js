(function() {
  'use strict';

  let pollInterval = null;
  let pollCount = 0;
  const MAX_POLLS = 30;
  const POLL_INTERVAL = 2000;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setTimeout(checkAndFixPrices, 500);
    setTimeout(checkAndFixPrices, 1500);
    setTimeout(checkAndFixPrices, 3000);

    setTimeout(injectCustomizeButtons, 1000);
    setTimeout(injectCustomizeButtons, 3000);

    setupCartObserver();

    document.addEventListener('cart:updated', checkAndFixPrices);
    document.addEventListener('cart:refresh', checkAndFixPrices);
    document.addEventListener('cart:change', checkAndFixPrices);
    window.addEventListener('cart:updated', checkAndFixPrices);
    document.addEventListener('cart:updated', injectCustomizeButtons);
    window.addEventListener('cart:updated', injectCustomizeButtons);
  }

  function setupCartObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const isCartRelated = node.matches && (
                node.matches('[data-cart-item]') ||
                node.matches('.cart-item') ||
                node.matches('[data-line-item]') ||
                node.matches('.cart') ||
                node.matches('[data-cart]')
              );
              const containsCart = node.querySelector && (
                node.querySelector('[data-cart-item]') ||
                node.querySelector('.cart-item') ||
                node.querySelector('.cart')
              );
              if (isCartRelated || containsCart) {
                shouldCheck = true;
                break;
              }
            }
          }
        }
      }
      if (shouldCheck) {
        setTimeout(checkAndFixPrices, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function checkAndFixPrices() {
    try {
      const cartData = await fetch('/cart.js').then(r => r.json());

      if (!cartData.items || cartData.items.length === 0) {
        stopPolling();
        return;
      }

      let hasUnverifiedPrices = false;

      for (const item of cartData.items) {
        const calculatedPrice = item.properties && item.properties['_calculated_price'];
        if (!calculatedPrice) continue;

        const expectedPrice = parseFloat(calculatedPrice);
        const actualPrice = item.price / 100;

        fixPriceDisplay(item, expectedPrice, actualPrice);

        if (Math.abs(actualPrice - expectedPrice) > 0.01) {
          hasUnverifiedPrices = true;
        }
      }

      if (hasUnverifiedPrices) {
        startPolling();
      } else {
        stopPolling();
        document.querySelectorAll('.cushion-price-wrapper').forEach(el => {
          el.classList.remove('cushion-loading');
          const spinner = el.querySelector('.cushion-spinner');
          if (spinner) spinner.remove();
        });
      }
    } catch (error) {
      console.error('[CushionPriceFix] Error:', error);
    }
  }

  function fixPriceDisplay(item, expectedPrice, actualPrice) {
    const priceDiffers = Math.abs(actualPrice - expectedPrice) > 0.01;
    const properties = item.properties || {};
    const containers = findItemContainers(item, properties);

    for (const container of containers) {
      const priceSelectors = [
        '.cart-item__price', '.cart__item-price', '.price',
        '[data-cart-item-price]', '.product-price', '.line-item-price',
        'td.price', '.cart-item__totals .price'
      ];

      let priceElements = [];
      for (const sel of priceSelectors) {
        const els = container.querySelectorAll(sel);
        if (els.length > 0) { priceElements = Array.from(els); break; }
      }

      for (const priceEl of priceElements) {
        if (priceEl.dataset.cushionProcessed === 'true') {
          const wrapper = priceEl.querySelector('.cushion-price-wrapper');
          if (wrapper) {
            const priceSpan = wrapper.querySelector('.cushion-price-value');
            if (priceSpan) priceSpan.textContent = formatPrice(expectedPrice);
            if (!priceDiffers) {
              wrapper.classList.remove('cushion-loading');
              const spinner = wrapper.querySelector('.cushion-spinner');
              if (spinner) spinner.remove();
            }
          }
          continue;
        }

        priceEl.dataset.cushionProcessed = 'true';

        const wrapper = document.createElement('span');
        wrapper.className = 'cushion-price-wrapper' + (priceDiffers ? ' cushion-loading' : '');

        const priceSpan = document.createElement('span');
        priceSpan.className = 'cushion-price-value';
        priceSpan.textContent = formatPrice(expectedPrice);
        wrapper.appendChild(priceSpan);

        if (priceDiffers) {
          const spinner = document.createElement('span');
          spinner.className = 'cushion-spinner';
          wrapper.appendChild(spinner);
        }

        while (priceEl.firstChild) priceEl.removeChild(priceEl.firstChild);
        priceEl.appendChild(wrapper);
      }
    }
  }

  function findItemContainers(item, properties) {
    const containers = [];
    const shape = properties['Shape'] || '';

    const variantSelectors = [
      '[data-variant-id="' + item.variant_id + '"]',
      '[data-id="' + item.variant_id + '"]',
      '[data-cart-item-key="' + item.key + '"]',
      '[data-line-item-key="' + item.key + '"]'
    ];

    for (const sel of variantSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        if (!containers.includes(el)) containers.push(el);
      }
    }

    if (containers.length === 0 && shape) {
      const allItems = document.querySelectorAll('.cart-item, .cart__item, [data-cart-item], .line-item, tr[data-id]');
      for (const itemEl of allItems) {
        if (itemEl.textContent.includes(shape)) containers.push(itemEl);
      }
    }

    return containers;
  }

  function formatPrice(price) {
    return '$' + price.toFixed(2);
  }

  function startPolling() {
    if (pollInterval) return;
    pollCount = 0;
    pollInterval = setInterval(function() {
      pollCount++;
      if (pollCount >= MAX_POLLS) { stopPolling(); return; }
      checkAndFixPrices();
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  }

  // ── Customize button injection ──────────────────────────────────────────
  // For each cart item with a _c property, fetch its saved config and inject
  // a "Customize" link pre-filled with all previous selections.

  async function injectCustomizeButtons() {
    try {
      const cart = await fetch('/cart.js').then(r => r.json());
      if (!cart.items || !cart.items.length) return;

      for (const item of cart.items) {
        const configId = item.properties && item.properties['_c'];
        if (!configId) continue;

        const containers = findItemContainers(item, item.properties || {});
        if (!containers.length) continue;

        const needsButton = containers.some(function(c) { return !c.querySelector('.cushion-customize-btn'); });
        if (!needsButton) continue;

        let config;
        try {
          const resp = await fetch('/apps/cushion-api/save-config?id=' + encodeURIComponent(configId));
          if (!resp.ok) continue;
          const data = await resp.json();
          config = data.config;
        } catch (e) { continue; }

        if (!config || !config.productHandle || config.isMultiPiece) continue;

        const p = new URLSearchParams({ customize: 'true' });
        if (config.profileId)   p.set('profileId',   config.profileId);
        if (config.shapeId)     p.set('shapeId',     config.shapeId);
        if (config.fillId)      p.set('fillId',      config.fillId);
        if (config.fabricId)    p.set('fabricId',    config.fabricId);
        if (config.dimensions)  p.set('dimensions',  config.dimensions);
        if (config.pipingId     && config.pipingId     !== 'none') p.set('pipingId',     config.pipingId);
        if (config.buttonId     && config.buttonId     !== 'none') p.set('buttonId',     config.buttonId);
        if (config.antiSkidId   && config.antiSkidId   !== 'none') p.set('antiSkidId',   config.antiSkidId);
        if (config.tiesId       && config.tiesId       !== 'none') p.set('tiesId',       config.tiesId);
        if (config.fabricTiesId && config.fabricTiesId !== 'none') p.set('fabricTiesId', config.fabricTiesId);
        if (config.rodPocketId  && config.rodPocketId  !== 'none') p.set('rodPocketId',  config.rodPocketId);
        if (config.drawstringId && config.drawstringId !== 'none') p.set('drawstringId', config.drawstringId);
        if (config.designId     && config.designId     !== 'none') p.set('designId',     config.designId);
        if (config.qty && config.qty !== '1') p.set('qty', config.qty);
        if (config.panelCount   && config.panelCount   !== '1') p.set('panelCount', config.panelCount);
        if (config.instructions) p.set('instructions', config.instructions);

        const href = '/products/' + config.productHandle + '?' + p.toString();

        for (const container of containers) {
          if (container.querySelector('.cushion-customize-btn')) continue;
          const btn = document.createElement('a');
          btn.href = href;
          btn.className = 'cushion-customize-btn';
          btn.textContent = 'Customize';
          container.appendChild(btn);
        }
      }
    } catch (e) {
      console.error('[CushionPriceFix] Customize button error:', e);
    }
  }

})();
