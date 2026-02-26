/**
 * Fabric & Fill Sample Shop
 * Storefront block for browsing and purchasing fabric/fill samples.
 * Pricing: any N items = bundlePrice, then +perItemPrice each.
 */
(function () {
  'use strict';

  var API_BASE = '/apps/cushion-api';

  function FabricShop(root) {
    this.root = root;
    this.shop = root.getAttribute('data-shop');
    this.selectedItems = []; // [{id, name, type, imageUrl}]
    this.settings = { sampleBundlePrice: 25, sampleMinItems: 4, samplePerItemPrice: 5 };
    this.currentTab = 'fabrics';
    this.fabricPagination = { page: 1, limit: 40, totalPages: 1, hasNext: false, hasPrev: false };
    this.filters = { search: '', categoryId: '', colorId: '', patternId: '' };
    this.searchTimer = null;
    this.isAddingToCart = false;
    this.init();
  }

  FabricShop.prototype.init = function () {
    this.renderShell();
    this.bindEvents();
    this.loadInitData();
  };

  FabricShop.prototype.renderShell = function () {
    this.root.innerHTML = [
      '<div class="kraft2026zion-sample-shop">',
        // Sticky cart bar
        '<div class="kraft2026zion-sample-bar">',
          '<div class="kraft2026zion-sample-bar-info">',
            '<span class="kraft2026zion-sample-count-badge">0 selected</span>',
            '<span class="kraft2026zion-sample-bar-price"></span>',
          '</div>',
          '<button class="kraft2026zion-sample-add-btn" disabled>Select 4 items to start — $25</button>',
        '</div>',
        // Tabs
        '<div class="kraft2026zion-sample-tabs">',
          '<button class="kraft2026zion-sample-tab kraft2026zion-sample-tab-active" data-tab="fabrics">Fabrics</button>',
          '<button class="kraft2026zion-sample-tab" data-tab="fills">Fills</button>',
        '</div>',
        // Fabrics panel
        '<div class="kraft2026zion-sample-panel" data-panel="fabrics">',
          '<div class="kraft2026zion-sample-filter-row">',
            '<input class="kraft2026zion-sample-search" type="text" placeholder="Search fabrics...">',
            '<select class="kraft2026zion-sample-select" data-filter="categoryId"><option value="">All Categories</option></select>',
            '<select class="kraft2026zion-sample-select" data-filter="colorId"><option value="">All Colors</option></select>',
            '<select class="kraft2026zion-sample-select" data-filter="patternId"><option value="">All Patterns</option></select>',
          '</div>',
          '<div class="kraft2026zion-sample-grid" data-grid="fabrics">',
            '<div class="kraft2026zion-sample-spinner"><div class="kraft2026zion-loading-spinner-small"></div></div>',
          '</div>',
          '<div class="kraft2026zion-sample-pag" data-pagination="fabrics"></div>',
        '</div>',
        // Fills panel
        '<div class="kraft2026zion-sample-panel" data-panel="fills" style="display:none">',
          '<div class="kraft2026zion-sample-grid" data-grid="fills">',
            '<div class="kraft2026zion-sample-spinner"><div class="kraft2026zion-loading-spinner-small"></div></div>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
  };

  FabricShop.prototype.bindEvents = function () {
    var self = this;
    var root = this.root;

    // Delegate all click events
    root.addEventListener('click', function (e) {
      // Tab switch
      var tab = e.target.closest('.kraft2026zion-sample-tab');
      if (tab) {
        self.switchTab(tab.getAttribute('data-tab'));
        return;
      }
      // Card toggle
      var card = e.target.closest('.kraft2026zion-sample-card');
      if (card) {
        self.toggleItem(card);
        return;
      }
      // Add to cart
      if (e.target.closest('.kraft2026zion-sample-add-btn')) {
        self.addToCart();
        return;
      }
      // Pagination
      var pageBtn = e.target.closest('.kraft2026zion-sample-page-btn');
      if (pageBtn) {
        var page = parseInt(pageBtn.getAttribute('data-page'), 10);
        if (!isNaN(page)) {
          self.fabricPagination.page = page;
          self.loadFabrics();
        }
        return;
      }
    });

    // Search input with debounce
    var searchInput = root.querySelector('.kraft2026zion-sample-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        clearTimeout(self.searchTimer);
        var val = this.value;
        self.searchTimer = setTimeout(function () {
          self.filters.search = val;
          self.fabricPagination.page = 1;
          self.loadFabrics();
        }, 300);
      });
    }

    // Filter selects
    root.addEventListener('change', function (e) {
      var sel = e.target.closest('.kraft2026zion-sample-select');
      if (sel) {
        var key = sel.getAttribute('data-filter');
        self.filters[key] = sel.value;
        self.fabricPagination.page = 1;
        self.loadFabrics();
      }
    });
  };

  FabricShop.prototype.switchTab = function (tabName) {
    var root = this.root;
    this.currentTab = tabName;
    root.querySelectorAll('.kraft2026zion-sample-tab').forEach(function (t) {
      t.classList.toggle('kraft2026zion-sample-tab-active', t.getAttribute('data-tab') === tabName);
    });
    root.querySelectorAll('.kraft2026zion-sample-panel').forEach(function (p) {
      p.style.display = p.getAttribute('data-panel') === tabName ? '' : 'none';
    });
  };

  FabricShop.prototype.loadInitData = function () {
    var self = this;
    var url = API_BASE + '/fabric-shop-items?shop=' + encodeURIComponent(this.shop);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.settings) self.settings = data.settings;
        self.populateFilters(data.categories, data.lookups);
        if (data.fills) self.renderFills(data.fills);
        self.updateBar();
        self.loadFabrics();
      })
      .catch(function (err) {
        console.error('[FabricShop] Init data error:', err);
        self.loadFabrics();
      });
  };

  FabricShop.prototype.populateFilters = function (categories, lookups) {
    var root = this.root;

    var catSel = root.querySelector('[data-filter="categoryId"]');
    if (catSel && categories) {
      categories.forEach(function (cat) {
        var opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        catSel.appendChild(opt);
      });
    }

    if (lookups) {
      var colorSel = root.querySelector('[data-filter="colorId"]');
      if (colorSel && lookups.colors) {
        lookups.colors.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          colorSel.appendChild(opt);
        });
      }
      var patSel = root.querySelector('[data-filter="patternId"]');
      if (patSel && lookups.patterns) {
        lookups.patterns.forEach(function (p) {
          var opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          patSel.appendChild(opt);
        });
      }
    }
  };

  FabricShop.prototype.loadFabrics = function () {
    var self = this;
    var grid = this.root.querySelector('[data-grid="fabrics"]');
    grid.innerHTML = '<div class="kraft2026zion-sample-spinner"><div class="kraft2026zion-loading-spinner-small"></div></div>';

    var params = new URLSearchParams({
      shop: this.shop,
      page: this.fabricPagination.page,
      limit: 40,
    });
    if (this.filters.search) params.set('search', this.filters.search);
    if (this.filters.categoryId) params.set('categoryId', this.filters.categoryId);
    if (this.filters.colorId) params.set('colorId', this.filters.colorId);
    if (this.filters.patternId) params.set('patternId', this.filters.patternId);

    fetch(API_BASE + '/fabrics-paginated?' + params.toString())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.pagination) self.fabricPagination = data.pagination;
        self.renderFabrics(data.fabrics || []);
        self.renderPagination();
      })
      .catch(function (err) {
        console.error('[FabricShop] Fabrics error:', err);
        grid.innerHTML = '<p class="kraft2026zion-sample-empty">Failed to load fabrics.</p>';
      });
  };

  FabricShop.prototype.renderFabrics = function (fabrics) {
    var self = this;
    var grid = this.root.querySelector('[data-grid="fabrics"]');
    if (!fabrics.length) {
      grid.innerHTML = '<p class="kraft2026zion-sample-empty">No fabrics found.</p>';
      return;
    }
    grid.innerHTML = '';
    fabrics.forEach(function (fab) {
      grid.appendChild(
        self.createCard(fab.id, fab.name, fab.imageUrl, 'fabric', fab.categoryName, fab.priceTier)
      );
    });
  };

  FabricShop.prototype.renderFills = function (fills) {
    var self = this;
    var grid = this.root.querySelector('[data-grid="fills"]');
    if (!fills.length) {
      grid.innerHTML = '<p class="kraft2026zion-sample-empty">No fill options available.</p>';
      return;
    }
    grid.innerHTML = '';
    fills.forEach(function (fill) {
      grid.appendChild(
        self.createCard(fill.id, fill.name, fill.imageUrl, 'fill', fill.description, null)
      );
    });
  };

  FabricShop.prototype.createCard = function (id, name, imageUrl, type, subtitle, priceTier) {
    var isSelected = this.selectedItems.some(function (item) {
      return item.id === id && item.type === type;
    });

    var div = document.createElement('div');
    div.className = 'kraft2026zion-sample-card' + (isSelected ? ' kraft2026zion-sample-card-selected' : '');
    div.setAttribute('data-id', id);
    div.setAttribute('data-type', type);
    div.setAttribute('data-name', name);
    div.setAttribute('data-image', imageUrl || '');

    var imgHtml = imageUrl
      ? '<img class="kraft2026zion-sample-card-img" src="' + imageUrl + '" alt="' + escapeHtml(name) + '" loading="lazy">'
      : '<div class="kraft2026zion-sample-card-placeholder">' + (type === 'fill' ? '☁' : '🧵') + '</div>';

    var tierHtml = '';
    if (priceTier && priceTier !== 'none') {
      var tierMap = { low: '$', medium: '$$', high: '$$$' };
      tierHtml = '<span class="kraft2026zion-sample-tier kraft2026zion-sample-tier-' + priceTier + '">' + (tierMap[priceTier] || '') + '</span>';
    }

    var subtitleText = subtitle ? '<div class="kraft2026zion-sample-card-sub">' + escapeHtml(subtitle) + '</div>' : '';

    div.innerHTML = [
      '<div class="kraft2026zion-sample-card-thumb">',
        imgHtml,
        tierHtml,
        '<div class="kraft2026zion-sample-check">&#10003;</div>',
      '</div>',
      '<div class="kraft2026zion-sample-card-info">',
        '<div class="kraft2026zion-sample-card-name">' + escapeHtml(name) + '</div>',
        subtitleText,
      '</div>',
    ].join('');

    return div;
  };

  FabricShop.prototype.toggleItem = function (card) {
    var id = card.getAttribute('data-id');
    var type = card.getAttribute('data-type');
    var name = card.getAttribute('data-name');
    var imageUrl = card.getAttribute('data-image');

    var idx = -1;
    for (var i = 0; i < this.selectedItems.length; i++) {
      if (this.selectedItems[i].id === id && this.selectedItems[i].type === type) {
        idx = i;
        break;
      }
    }

    if (idx >= 0) {
      this.selectedItems.splice(idx, 1);
      card.classList.remove('kraft2026zion-sample-card-selected');
    } else {
      this.selectedItems.push({ id: id, type: type, name: name, imageUrl: imageUrl });
      card.classList.add('kraft2026zion-sample-card-selected');
    }
    this.updateBar();
  };

  FabricShop.prototype.calculatePrice = function (count) {
    var s = this.settings;
    var bundlePrice = s.sampleBundlePrice || 25;
    var minItems = s.sampleMinItems || 4;
    var perItemPrice = s.samplePerItemPrice || 5;
    if (count < minItems) return null;
    return bundlePrice + Math.max(0, count - minItems) * perItemPrice;
  };

  FabricShop.prototype.updateBar = function () {
    var count = this.selectedItems.length;
    var s = this.settings;
    var minItems = s.sampleMinItems || 4;
    var bundlePrice = s.sampleBundlePrice || 25;
    var perItemPrice = s.samplePerItemPrice || 5;
    var price = this.calculatePrice(count);

    var countBadge = this.root.querySelector('.kraft2026zion-sample-count-badge');
    var barPrice = this.root.querySelector('.kraft2026zion-sample-bar-price');
    var addBtn = this.root.querySelector('.kraft2026zion-sample-add-btn');

    if (countBadge) countBadge.textContent = count + (count === 1 ? ' selected' : ' selected');

    if (price !== null) {
      if (barPrice) barPrice.textContent = '$' + price.toFixed(2);
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.textContent = 'Add ' + count + ' samples to cart — $' + price.toFixed(2);
      }
    } else {
      var remaining = minItems - count;
      if (barPrice) barPrice.textContent = '';
      if (addBtn) {
        addBtn.disabled = true;
        if (count === 0) {
          addBtn.textContent = 'Any ' + minItems + ' samples for $' + bundlePrice.toFixed(0);
        } else {
          addBtn.textContent = 'Select ' + remaining + ' more to continue';
        }
      }
    }
  };

  FabricShop.prototype.renderPagination = function () {
    var pag = this.fabricPagination;
    var container = this.root.querySelector('[data-pagination="fabrics"]');
    if (!container) return;
    if (!pag || pag.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    var html = '<div class="kraft2026zion-sample-pag-row">';
    if (pag.hasPrev) {
      html += '<button class="kraft2026zion-sample-page-btn" data-page="' + (pag.page - 1) + '">&#8249; Prev</button>';
    }
    html += '<span class="kraft2026zion-sample-pag-info">Page ' + pag.page + ' of ' + pag.totalPages + '</span>';
    if (pag.hasNext) {
      html += '<button class="kraft2026zion-sample-page-btn" data-page="' + (pag.page + 1) + '">Next &#8250;</button>';
    }
    html += '</div>';
    container.innerHTML = html;
  };

  FabricShop.prototype.addToCart = function () {
    var self = this;
    var count = this.selectedItems.length;
    var price = this.calculatePrice(count);
    if (!price || this.isAddingToCart) return;

    var productId = this.settings.fabricSampleProductId;
    if (!productId) {
      var addBtn = this.root.querySelector('.kraft2026zion-sample-add-btn');
      if (addBtn) addBtn.textContent = 'Error: Fabric Sample product not configured — Try again';
      setTimeout(function () { self.updateBar(); }, 3000);
      return;
    }

    this.isAddingToCart = true;
    var addBtn = this.root.querySelector('.kraft2026zion-sample-add-btn');
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.textContent = 'Adding to cart...';
    }

    var itemNames = this.selectedItems.map(function (item) { return item.name; });

    fetch(API_BASE + '/create-variant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop: this.shop,
        productId: productId,
        price: price,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        return fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: parseInt(data.variantId, 10),
              quantity: 1,
              properties: {
                'Samples': itemNames.join(', '),
                'Item Count': String(count),
              },
            }],
          }),
        });
      })
      .then(function (r) { return r.json(); })
      .then(function (cartData) {
        if (cartData.status && cartData.status !== 200) {
          throw new Error(cartData.description || 'Failed to add to cart');
        }
        window.location.href = '/cart';
      })
      .catch(function (err) {
        console.error('[FabricShop] Add to cart error:', err);
        self.isAddingToCart = false;
        self.updateBar();
        if (addBtn) addBtn.textContent = 'Error: ' + err.message + ' — Try again';
        setTimeout(function () { self.updateBar(); }, 3000);
      });
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Auto-initialize all shop roots on the page
  function initAll() {
    var roots = document.querySelectorAll('.kraft2026zion-sample-root');
    for (var i = 0; i < roots.length; i++) {
      if (!roots[i]._fabricShopInstance) {
        roots[i]._fabricShopInstance = new FabricShop(roots[i]);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
