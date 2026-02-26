/**
 * Fabric & Fill Sample Shop
 * Two-panel layout: left = image grid, right = sticky detail preview.
 * Click a card to preview on the right; add/remove from selection via the detail pane.
 */
(function () {
  'use strict';

  var API_BASE = '/apps/cushion-api';

  function FabricShop(root) {
    this.root = root;
    this.shop = root.getAttribute('data-shop');
    this.selectedItems = []; // [{id, name, type, imageUrl}]
    this.activeItem = null;  // {id, type, name, imageUrl, subtitle, priceTier} — currently previewed
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

        // ── Header ──
        '<div class="kraft2026zion-sample-header">',
          '<div class="kraft2026zion-sample-header-text">',
            '<div class="kraft2026zion-sample-heading">Sample Collection</div>',
            '<div class="kraft2026zion-sample-subheading">Touch before you choose</div>',
          '</div>',
          '<span class="kraft2026zion-sample-deal-pill">Any 4 for $25 &middot; $5 each after</span>',
        '</div>',

        // ── Sticky selection bar ──
        '<div class="kraft2026zion-sample-bar">',
          '<div class="kraft2026zion-sample-bar-left">',
            '<div class="kraft2026zion-sample-tray" data-tray></div>',
            '<span class="kraft2026zion-sample-count-badge">Nothing selected yet</span>',
          '</div>',
          '<div class="kraft2026zion-sample-bar-right">',
            '<span class="kraft2026zion-sample-bar-price"></span>',
            '<button class="kraft2026zion-sample-add-btn" disabled>Any 4 for $25</button>',
          '</div>',
        '</div>',

        // ── Two-panel body ──
        '<div class="kraft2026zion-sample-body">',

          // Left: grid pane
          '<div class="kraft2026zion-sample-grid-pane">',

            // Tabs
            '<div class="kraft2026zion-sample-tab-wrap">',
              '<div class="kraft2026zion-sample-tabs">',
                '<button class="kraft2026zion-sample-tab kraft2026zion-sample-tab-active" data-tab="fabrics">Fabrics</button>',
                '<button class="kraft2026zion-sample-tab" data-tab="fills">Fills</button>',
              '</div>',
            '</div>',

            // Fabrics panel
            '<div class="kraft2026zion-sample-panel" data-panel="fabrics">',
              '<div class="kraft2026zion-sample-filter-row">',
                '<input class="kraft2026zion-sample-search" type="text" placeholder="Search fabrics...">',
                '<select class="kraft2026zion-sample-select" data-filter="categoryId"><option value="">All Categories</option></select>',
                '<select class="kraft2026zion-sample-select" data-filter="colorId"><option value="">All Colors</option></select>',
                '<select class="kraft2026zion-sample-select" data-filter="patternId"><option value="">All Patterns</option></select>',
              '</div>',
              '<div class="kraft2026zion-sample-panel-inner">',
                '<div class="kraft2026zion-sample-grid" data-grid="fabrics">',
                  '<div class="kraft2026zion-sample-spinner"><div class="kraft2026zion-loading-spinner-small"></div></div>',
                '</div>',
                '<div class="kraft2026zion-sample-pag" data-pagination="fabrics"></div>',
              '</div>',
            '</div>',

            // Fills panel
            '<div class="kraft2026zion-sample-panel" data-panel="fills" style="display:none">',
              '<div class="kraft2026zion-sample-panel-inner">',
                '<div class="kraft2026zion-sample-grid" data-grid="fills">',
                  '<div class="kraft2026zion-sample-spinner"><div class="kraft2026zion-loading-spinner-small"></div></div>',
                '</div>',
              '</div>',
            '</div>',

          '</div>',

          // Right: sticky detail pane
          '<div class="kraft2026zion-sample-detail-pane" data-detail-pane>',
            '<div class="kraft2026zion-sample-detail-empty">',
              '<span class="kraft2026zion-sample-detail-empty-icon">&#9670;</span>',
              '<div class="kraft2026zion-sample-detail-empty-text">Click a swatch<br>to preview details</div>',
            '</div>',
          '</div>',

        '</div>',
      '</div>',
    ].join('');
  };

  FabricShop.prototype.bindEvents = function () {
    var self = this;
    var root = this.root;

    root.addEventListener('click', function (e) {
      // Tab switch
      var tab = e.target.closest('.kraft2026zion-sample-tab');
      if (tab) {
        self.switchTab(tab.getAttribute('data-tab'));
        return;
      }
      // Detail pane: select/deselect button
      var selectBtn = e.target.closest('[data-select-btn]');
      if (selectBtn) {
        self.toggleItemById(
          selectBtn.getAttribute('data-id'),
          selectBtn.getAttribute('data-type'),
          selectBtn.getAttribute('data-name'),
          selectBtn.getAttribute('data-image')
        );
        return;
      }
      // Grid card click → preview
      var card = e.target.closest('.kraft2026zion-sample-card');
      if (card) {
        self.previewItem(card);
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

    // Search with debounce
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

  // ── Preview: click card → show in detail pane ──
  FabricShop.prototype.previewItem = function (card) {
    // Update active highlight on all cards
    this.root.querySelectorAll('.kraft2026zion-sample-card').forEach(function (c) {
      c.classList.remove('kraft2026zion-active');
    });
    card.classList.add('kraft2026zion-active');

    this.activeItem = {
      id: card.getAttribute('data-id'),
      type: card.getAttribute('data-type'),
      name: card.getAttribute('data-name'),
      imageUrl: card.getAttribute('data-image'),
      subtitle: card.getAttribute('data-subtitle'),
      priceTier: card.getAttribute('data-tier'),
    };
    this.renderDetailPane();
  };

  // ── Render the right-pane detail ──
  FabricShop.prototype.renderDetailPane = function () {
    var detail = this.root.querySelector('[data-detail-pane]');
    if (!detail) return;

    var item = this.activeItem;
    if (!item) {
      detail.innerHTML = [
        '<div class="kraft2026zion-sample-detail-empty">',
          '<span class="kraft2026zion-sample-detail-empty-icon">&#9670;</span>',
          '<div class="kraft2026zion-sample-detail-empty-text">Click a swatch<br>to preview details</div>',
        '</div>',
      ].join('');
      return;
    }

    var isSelected = this.selectedItems.some(function (s) {
      return s.id === item.id && s.type === item.type;
    });

    var imgHtml = item.imageUrl
      ? '<img class="kraft2026zion-sample-detail-img" src="' + item.imageUrl + '" alt="' + escapeHtml(item.name) + '">'
      : '<div class="kraft2026zion-sample-detail-placeholder">' + (item.type === 'fill' ? '&#9729;' : '&#129525;') + '</div>';

    var tierHtml = '';
    if (item.priceTier && item.priceTier !== 'none') {
      var tierMap = { low: '$', medium: '$$', high: '$$$' };
      tierHtml = '<div class="kraft2026zion-sample-detail-tier kraft2026zion-sample-tier-' + item.priceTier + '">' + (tierMap[item.priceTier] || '') + '</div>';
    }

    var subHtml = item.subtitle
      ? '<div class="kraft2026zion-sample-detail-sub">' + escapeHtml(item.subtitle) + '</div>'
      : '';

    var btnLabel = isSelected ? '&#10003; Remove from selection' : '+ Add to selection';
    var btnClass = 'kraft2026zion-sample-detail-select-btn' + (isSelected ? ' kraft2026zion-selected-state' : '');

    detail.innerHTML = [
      '<div class="kraft2026zion-sample-detail-content">',
        '<div class="kraft2026zion-sample-detail-img-wrap">',
          imgHtml,
        '</div>',
        '<div class="kraft2026zion-sample-detail-info">',
          '<div class="kraft2026zion-sample-detail-name">' + escapeHtml(item.name) + '</div>',
          subHtml,
          tierHtml,
          '<button class="' + btnClass + '"',
            ' data-select-btn',
            ' data-id="' + escapeAttr(item.id) + '"',
            ' data-type="' + escapeAttr(item.type) + '"',
            ' data-name="' + escapeAttr(item.name) + '"',
            ' data-image="' + escapeAttr(item.imageUrl || '') + '"',
          '>' + btnLabel + '</button>',
        '</div>',
      '</div>',
    ].join('');
  };

  // ── Toggle selection by item ID (called from detail pane button) ──
  FabricShop.prototype.toggleItemById = function (id, type, name, imageUrl) {
    var idx = -1;
    for (var i = 0; i < this.selectedItems.length; i++) {
      if (this.selectedItems[i].id === id && this.selectedItems[i].type === type) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      this.selectedItems.splice(idx, 1);
    } else {
      this.selectedItems.push({ id: id, type: type, name: name, imageUrl: imageUrl });
    }

    // Sync card UI in grid
    var card = this.root.querySelector('[data-id="' + id + '"][data-type="' + type + '"]');
    if (card) {
      if (idx >= 0) {
        card.classList.remove('kraft2026zion-sample-card-selected');
      } else {
        card.classList.add('kraft2026zion-sample-card-selected');
      }
    }

    this.updateBar();
    this.renderDetailPane();
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

  // ── Create an image-only card (no text below, details live in right pane) ──
  FabricShop.prototype.createCard = function (id, name, imageUrl, type, subtitle, priceTier) {
    var isSelected = this.selectedItems.some(function (item) {
      return item.id === id && item.type === type;
    });
    var isActive = this.activeItem && this.activeItem.id === id && this.activeItem.type === type;

    var div = document.createElement('div');
    var cls = 'kraft2026zion-sample-card';
    if (isSelected) cls += ' kraft2026zion-sample-card-selected';
    if (isActive) cls += ' kraft2026zion-active';
    div.className = cls;
    div.setAttribute('data-id', id);
    div.setAttribute('data-type', type);
    div.setAttribute('data-name', name);
    div.setAttribute('data-image', imageUrl || '');
    div.setAttribute('data-subtitle', subtitle || '');
    div.setAttribute('data-tier', priceTier || '');

    var imgHtml = imageUrl
      ? '<img class="kraft2026zion-sample-card-img" src="' + imageUrl + '" alt="' + escapeHtml(name) + '" loading="lazy">'
      : '<div class="kraft2026zion-sample-card-placeholder">' + (type === 'fill' ? '&#9729;' : '&#129525;') + '</div>';

    var tierHtml = '';
    if (priceTier && priceTier !== 'none') {
      var tierMap = { low: '$', medium: '$$', high: '$$$' };
      tierHtml = '<span class="kraft2026zion-sample-tier kraft2026zion-sample-tier-' + priceTier + '">' + (tierMap[priceTier] || '') + '</span>';
    }

    // Image only — no card-info text block
    div.innerHTML = [
      '<div class="kraft2026zion-sample-card-thumb">',
        imgHtml,
        '<div class="kraft2026zion-sample-card-overlay"></div>',
        tierHtml,
        '<div class="kraft2026zion-sample-check">&#10003;</div>',
      '</div>',
    ].join('');

    return div;
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
    var price = this.calculatePrice(count);

    var countBadge = this.root.querySelector('.kraft2026zion-sample-count-badge');
    var barPrice = this.root.querySelector('.kraft2026zion-sample-bar-price');
    var addBtn = this.root.querySelector('.kraft2026zion-sample-add-btn');
    var tray = this.root.querySelector('[data-tray]');

    // Animate thumbnail tray
    if (tray) {
      var html = '';
      var shown = this.selectedItems.slice(0, 5);
      shown.forEach(function (item, i) {
        var style = 'z-index:' + (10 - i) + ';left:' + (i * 18) + 'px;';
        if (item.imageUrl) {
          style += 'background-image:url(' + item.imageUrl + ');background-size:cover;background-position:center;';
        }
        html += '<div class="kraft2026zion-sample-tray-thumb" style="' + style + '"></div>';
      });
      if (this.selectedItems.length > 5) {
        html += '<div class="kraft2026zion-sample-tray-more" style="z-index:4;left:' + (5 * 18) + 'px">+' + (this.selectedItems.length - 5) + '</div>';
      }
      tray.innerHTML = html;
      var slotCount = Math.min(count, 5) + (count > 5 ? 1 : 0);
      tray.style.width = count === 0 ? '0px' : (30 + (slotCount - 1) * 18) + 'px';
      tray.style.marginRight = count === 0 ? '0px' : '10px';
    }

    // Count badge
    if (countBadge) {
      if (count === 0) {
        countBadge.textContent = 'Nothing selected yet';
        countBadge.classList.remove('kraft2026zion-has-items');
      } else {
        countBadge.textContent = count + (count === 1 ? ' item selected' : ' items selected');
        countBadge.classList.add('kraft2026zion-has-items');
      }
    }

    if (price !== null) {
      if (barPrice) barPrice.textContent = '$' + price.toFixed(2);
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.textContent = 'Add ' + count + ' samples — $' + price.toFixed(2);
      }
    } else {
      var remaining = minItems - count;
      if (barPrice) barPrice.textContent = '';
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.textContent = count === 0
          ? 'Any ' + minItems + ' for $' + bundlePrice.toFixed(0)
          : 'Select ' + remaining + ' more to continue';
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

  // For HTML attribute values (same escaping, explicit alias for clarity)
  function escapeAttr(str) {
    return escapeHtml(str);
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
