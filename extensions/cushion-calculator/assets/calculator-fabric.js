// Cushion Price Calculator - Fabric Module
// Fabric categories, previews, browser popup, filters

CushionCalculator.prototype.renderCategoryGrid = function() {
  var blockId = this.blockId;
  var self = this;
  var cont = document.getElementById('fabric-categories-' + blockId);
  var categories = this.config.fabricCategories || [];

  if (categories.length === 0) {
    cont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabric categories available</p>';
    return;
  }

  var html = '';

  if (categories.length > 1) {
    html += '<div class="kraft2026zion-fabric-category-tabs">';
    categories.forEach(function(cat, idx) {
      html += '<button type="button" class="kraft2026zion-fabric-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-category-id="' + cat.id + '" data-category-name="' + cat.name + '">' + cat.name + '</button>';
    });
    html += '</div>';
  }

  html += '<div class="kraft2026zion-fabric-preview-container" id="fabric-preview-container-' + blockId + '"></div>';

  cont.innerHTML = html;

  cont.querySelectorAll('.kraft2026zion-fabric-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      cont.querySelectorAll('.kraft2026zion-fabric-tab').forEach(function(t) { t.classList.remove('kraft2026zion-active'); });
      tab.classList.add('kraft2026zion-active');
      self.loadCategoryFabricPreviews(tab.dataset.categoryId, tab.dataset.categoryName);
    });
  });

  if (categories.length > 0) {
    this.loadCategoryFabricPreviews(categories[0].id, categories[0].name);
  }
};

CushionCalculator.prototype.loadCategoryFabricPreviews = async function(categoryId, categoryName) {
  var blockId = this.blockId;
  var self = this;
  var previewCont = document.getElementById('fabric-preview-container-' + blockId);
  if (!previewCont) return;

  if (this.categoryFabricPreviews[categoryId]) {
    this.renderFabricPreviews(this.categoryFabricPreviews[categoryId], categoryId, categoryName);
    this.autoSelectDefaultFabric(this.categoryFabricPreviews[categoryId], categoryId);
    return;
  }

  previewCont.innerHTML = '<div class="kraft2026zion-fabric-preview-loading"><div class="kraft2026zion-loading-spinner-small"></div></div>';

  try {
    var params = new URLSearchParams({ shop: this.shopDomain, categoryId: categoryId, limit: 5, page: 1 });
    var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
    if (!response.ok) throw new Error('Failed to load fabrics');
    var data = await response.json();
    this.categoryFabricPreviews[categoryId] = data;
    this.renderFabricPreviews(data, categoryId, categoryName);
    this.autoSelectDefaultFabric(data, categoryId);
  } catch (error) {
    console.error('Error loading category fabrics:', error);
    previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">Failed to load fabrics</p>';
  }
};

CushionCalculator.prototype.autoSelectDefaultFabric = function(data, categoryId) {
  if (this.selectedFabric) return;

  var fabrics = data.fabrics || [];
  var defaultFabric = fabrics.find(function(f) { return f.isDefault; });

  if (!defaultFabric) {
    var category = (this.config.fabricCategories || []).find(function(c) { return c.id === categoryId; });
    if (category && category.defaultFabric) {
      defaultFabric = category.defaultFabric;
    }
  }

  if (defaultFabric) {
    this.selectFabric(defaultFabric);
    var previewCont = document.getElementById('fabric-preview-container-' + this.blockId);
    if (previewCont) {
      previewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(thumb) {
        thumb.classList.toggle('kraft2026zion-selected', thumb.dataset.fabricId === defaultFabric.id);
      });
    }
  }
};

CushionCalculator.prototype.renderFabricPreviews = function(data, categoryId, categoryName) {
  var blockId = this.blockId;
  var self = this;
  var previewCont = document.getElementById('fabric-preview-container-' + blockId);
  if (!previewCont) return;

  var fabrics = data.fabrics || [];
  var totalCount = data.pagination ? data.pagination.totalCount : fabrics.length;

  if (fabrics.length === 0) {
    previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabrics in this category</p>';
    return;
  }

  var html = '<div class="kraft2026zion-fabric-preview-grid">';
  var selectedFabric = this.selectedFabric;
  fabrics.forEach(function(f) {
    var isSelected = selectedFabric && selectedFabric.id === f.id;
    var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + CushionCalculator.TIER_LABELS[f.priceTier] + '</span>' : '';
    html += '<div class="kraft2026zion-fabric-preview-thumb' + (isSelected ? ' kraft2026zion-selected' : '') + '" data-fabric-id="' + f.id + '" data-category-id="' + categoryId + '" data-category-name="' + (categoryName || '') + '">' +
      (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span class="kraft2026zion-no-img">?</span>') +
      tierBadge +
      '</div>';
  });

  if (totalCount > 5) {
    html += '<div class="kraft2026zion-fabric-preview-thumb kraft2026zion-fabric-view-all-block" data-category-id="' + categoryId + '" data-category-name="' + (categoryName || '') + '">' +
      '<span class="kraft2026zion-view-all-text">+' + (totalCount - 5) + '<br>more</span>' +
      '</div>';
  }
  html += '</div>';

  previewCont.innerHTML = html;
  previewCont._fabrics = fabrics;

  previewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(thumb) {
    thumb.addEventListener('click', function() {
      if (thumb.classList.contains('kraft2026zion-fabric-view-all-block')) {
        self.openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
        return;
      }

      var fabricId = thumb.dataset.fabricId;
      var fabric = fabrics.find(function(f) { return f.id === fabricId; });
      if (fabric) {
        self.selectFabric(fabric);
        self.openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
      }
    });
  });
};

// Shared fabric (multi-piece mode)
CushionCalculator.prototype.renderSharedFabricCategoryGrid = function() {
  var blockId = this.blockId;
  var self = this;
  var cont = document.getElementById('shared-fabric-categories-' + blockId);
  if (!cont) return;

  var categories = this.config.fabricCategories || [];
  if (categories.length === 0) {
    cont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabric categories available</p>';
    return;
  }

  var html = '';
  if (categories.length > 1) {
    html += '<div class="kraft2026zion-fabric-category-tabs">';
    categories.forEach(function(cat, idx) {
      html += '<button type="button" class="kraft2026zion-fabric-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-category-id="' + cat.id + '" data-category-name="' + cat.name + '">' + cat.name + '</button>';
    });
    html += '</div>';
  }

  html += '<div class="kraft2026zion-fabric-preview-container" id="shared-fabric-preview-container-' + blockId + '"></div>';
  cont.innerHTML = html;

  cont.querySelectorAll('.kraft2026zion-fabric-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      cont.querySelectorAll('.kraft2026zion-fabric-tab').forEach(function(t) { t.classList.remove('kraft2026zion-active'); });
      tab.classList.add('kraft2026zion-active');
      self.loadSharedFabricPreviews(tab.dataset.categoryId, tab.dataset.categoryName);
    });
  });

  if (categories.length > 0) {
    this.loadSharedFabricPreviews(categories[0].id, categories[0].name);
  }
};

CushionCalculator.prototype.loadSharedFabricPreviews = async function(categoryId, categoryName) {
  var blockId = this.blockId;
  var self = this;
  var previewCont = document.getElementById('shared-fabric-preview-container-' + blockId);
  if (!previewCont) return;

  if (this.categoryFabricPreviews[categoryId]) {
    this.renderSharedFabricPreviews(this.categoryFabricPreviews[categoryId], categoryId, categoryName);
    return;
  }

  previewCont.innerHTML = '<div class="kraft2026zion-fabric-preview-loading"><div class="kraft2026zion-loading-spinner-small"></div></div>';

  try {
    var params = new URLSearchParams({ shop: this.shopDomain, categoryId: categoryId, limit: 5, page: 1 });
    var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
    if (!response.ok) throw new Error('Failed to load fabrics');
    var data = await response.json();
    this.categoryFabricPreviews[categoryId] = data;
    this.renderSharedFabricPreviews(data, categoryId, categoryName);
  } catch (error) {
    console.error('Error loading shared fabric previews:', error);
    previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">Failed to load fabrics</p>';
  }
};

CushionCalculator.prototype.renderSharedFabricPreviews = function(data, categoryId, categoryName) {
  var blockId = this.blockId;
  var self = this;
  var previewCont = document.getElementById('shared-fabric-preview-container-' + blockId);
  if (!previewCont) return;

  var fabrics = data.fabrics || [];
  var totalCount = data.pagination ? data.pagination.totalCount : fabrics.length;

  if (fabrics.length === 0) {
    previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabrics in this category</p>';
    return;
  }

  var html = '<div class="kraft2026zion-fabric-preview-grid">';
  var selectedFabric = this.selectedFabric;
  fabrics.forEach(function(f) {
    var isSelected = selectedFabric && selectedFabric.id === f.id;
    var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + CushionCalculator.TIER_LABELS[f.priceTier] + '</span>' : '';
    html += '<div class="kraft2026zion-fabric-preview-thumb' + (isSelected ? ' kraft2026zion-selected' : '') + '" data-fabric-id="' + f.id + '" data-category-id="' + categoryId + '" data-category-name="' + categoryName + '">' +
      (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span class="kraft2026zion-no-img">?</span>') +
      tierBadge +
      '</div>';
  });

  if (totalCount > 5) {
    html += '<div class="kraft2026zion-fabric-preview-thumb kraft2026zion-fabric-view-all-block" data-category-id="' + categoryId + '" data-category-name="' + categoryName + '">' +
      '<span class="kraft2026zion-view-all-text">+' + (totalCount - 5) + '<br>more</span>' +
      '</div>';
  }
  html += '</div>';

  previewCont.innerHTML = html;
  previewCont._fabrics = fabrics;

  previewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(thumb) {
    thumb.addEventListener('click', function() {
      if (thumb.classList.contains('kraft2026zion-fabric-view-all-block')) {
        self.openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
        return;
      }

      var fabricId = thumb.dataset.fabricId;
      var fabric = fabrics.find(function(f) { return f.id === fabricId; });
      if (fabric) {
        self.selectFabric(fabric);
        previewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(t) {
          t.classList.toggle('kraft2026zion-selected', t.dataset.fabricId === fabricId);
        });
        self.openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
      }
    });
  });
};

// Piece-level fabric
CushionCalculator.prototype.renderPieceFabricSection = function() {
  var blockId = this.blockId;
  var self = this;
  var cont = document.getElementById('piece-fabric-categories-' + blockId);
  if (!cont) return;

  var categories = this.config.fabricCategories || [];
  if (categories.length === 0) {
    cont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabric categories available</p>';
    return;
  }

  var html = '';
  if (categories.length > 1) {
    html += '<div class="kraft2026zion-fabric-category-tabs">';
    categories.forEach(function(cat, idx) {
      html += '<button type="button" class="kraft2026zion-fabric-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-category-id="' + cat.id + '" data-category-name="' + cat.name + '">' + cat.name + '</button>';
    });
    html += '</div>';
  }

  html += '<div class="kraft2026zion-fabric-preview-container" id="piece-fabric-preview-container-' + blockId + '"></div>';
  cont.innerHTML = html;

  cont.querySelectorAll('.kraft2026zion-fabric-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      cont.querySelectorAll('.kraft2026zion-fabric-tab').forEach(function(t) { t.classList.remove('kraft2026zion-active'); });
      tab.classList.add('kraft2026zion-active');
      self.loadPieceFabricPreviews(tab.dataset.categoryId, tab.dataset.categoryName);
    });
  });

  if (categories.length > 0) {
    this.loadPieceFabricPreviews(categories[0].id, categories[0].name);
  }
};

CushionCalculator.prototype.loadPieceFabricPreviews = async function(categoryId, categoryName) {
  var blockId = this.blockId;
  var self = this;
  var previewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
  if (!previewCont) return;

  if (this.categoryFabricPreviews[categoryId]) {
    this.renderPieceFabricPreviews(this.categoryFabricPreviews[categoryId], categoryId, categoryName);
    this.autoSelectDefaultFabricForPiece(this.categoryFabricPreviews[categoryId], categoryId);
    return;
  }

  previewCont.innerHTML = '<div class="kraft2026zion-fabric-preview-loading"><div class="kraft2026zion-loading-spinner-small"></div></div>';

  try {
    var params = new URLSearchParams({ shop: this.shopDomain, categoryId: categoryId, limit: 5, page: 1 });
    var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
    if (!response.ok) throw new Error('Failed to load fabrics');
    var data = await response.json();
    this.categoryFabricPreviews[categoryId] = data;
    this.renderPieceFabricPreviews(data, categoryId, categoryName);
    this.autoSelectDefaultFabricForPiece(data, categoryId);
  } catch (error) {
    console.error('Error loading piece fabric previews:', error);
    previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">Failed to load fabrics</p>';
  }
};

CushionCalculator.prototype.autoSelectDefaultFabricForPiece = function(data, categoryId) {
  if (this.selectedFabric) return;

  var fabrics = data.fabrics || [];
  var defaultFabric = null;
  var self = this;

  if (this.config.defaultFabricId) {
    defaultFabric = fabrics.find(function(f) { return f.id === self.config.defaultFabricId; });
  }

  if (!defaultFabric) {
    defaultFabric = fabrics.find(function(f) { return f.isDefault; });
  }

  if (!defaultFabric) {
    var category = (this.config.fabricCategories || []).find(function(c) { return c.id === categoryId; });
    if (category && category.defaultFabric) {
      defaultFabric = category.defaultFabric;
    }
  }

  if (defaultFabric) {
    this.selectFabric(defaultFabric);
    var previewCont = document.getElementById('piece-fabric-preview-container-' + this.blockId);
    if (previewCont) {
      previewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(thumb) {
        thumb.classList.toggle('kraft2026zion-selected', thumb.dataset.fabricId === defaultFabric.id);
      });
    }
  }
};

CushionCalculator.prototype.renderPieceFabricPreviews = function(data, categoryId, categoryName) {
  var blockId = this.blockId;
  var self = this;
  var previewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
  if (!previewCont) return;

  var fabrics = data.fabrics || [];
  var totalCount = data.pagination ? data.pagination.totalCount : fabrics.length;

  if (fabrics.length === 0) {
    previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabrics in this category</p>';
    return;
  }

  var html = '<div class="kraft2026zion-fabric-preview-grid">';
  var selectedFabric = this.selectedFabric;
  fabrics.forEach(function(f) {
    var isSelected = selectedFabric && selectedFabric.id === f.id;
    var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + CushionCalculator.TIER_LABELS[f.priceTier] + '</span>' : '';
    html += '<div class="kraft2026zion-fabric-preview-thumb' + (isSelected ? ' kraft2026zion-selected' : '') + '" data-fabric-id="' + f.id + '" data-category-id="' + categoryId + '" data-category-name="' + (categoryName || '') + '">' +
      (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span class="kraft2026zion-no-img">?</span>') +
      tierBadge +
      '</div>';
  });

  if (totalCount > 5) {
    html += '<div class="kraft2026zion-fabric-preview-thumb kraft2026zion-fabric-view-all-block" data-category-id="' + categoryId + '" data-category-name="' + (categoryName || '') + '">' +
      '<span class="kraft2026zion-view-all-text">+' + (totalCount - 5) + '<br>more</span>' +
      '</div>';
  }
  html += '</div>';
  previewCont.innerHTML = html;

  previewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(thumb) {
    thumb.addEventListener('click', function() {
      if (thumb.classList.contains('kraft2026zion-fabric-view-all-block')) {
        self.openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
        return;
      }
      var fabricId = thumb.dataset.fabricId;
      var fabric = fabrics.find(function(f) { return f.id === fabricId; });
      if (fabric) {
        self.selectFabric(fabric);
        self.openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
      }
    });
  });
};

// Fabric browser popup
CushionCalculator.prototype.openFabricBrowserPopup = function(categoryId, categoryName) {
  var blockId = this.blockId;
  this.browserCurrentCategoryId = categoryId;
  this.browserCurrentCategoryName = categoryName;
  this.browserCurrentPage = 1;

  this.browserSelectedFabric = this.selectedFabric || null;

  document.getElementById('fabric-browser-title-' + blockId).textContent = 'Browse ' + categoryName + ' Fabrics';

  var detailPanel = document.getElementById('fabric-detail-panel-' + blockId);
  var placeholder = detailPanel.querySelector('.kraft2026zion-fabric-detail-placeholder');
  var detailContent = document.getElementById('fabric-detail-content-' + blockId);

  if (this.browserSelectedFabric) {
    document.getElementById('fabric-browser-select-' + blockId).disabled = false;
    placeholder.style.display = 'none';
    detailContent.style.display = 'flex';

    document.getElementById('fabric-detail-image-' + blockId).src = this.browserSelectedFabric.imageUrl || '';
    document.getElementById('fabric-detail-name-' + blockId).textContent = this.browserSelectedFabric.name;
    document.getElementById('fabric-detail-category-' + blockId).textContent = this.browserSelectedFabric.categoryName || '-';
    document.getElementById('fabric-detail-pattern-' + blockId).textContent = this.browserSelectedFabric.patternName || '-';
    document.getElementById('fabric-detail-color-' + blockId).textContent = this.browserSelectedFabric.colorName || '-';
    document.getElementById('fabric-detail-brand-' + blockId).textContent = this.browserSelectedFabric.brandName || '-';
    document.getElementById('fabric-detail-tier-' + blockId).textContent = this.browserSelectedFabric.priceTier ? CushionCalculator.TIER_LABELS[this.browserSelectedFabric.priceTier] || this.browserSelectedFabric.priceTier : '-';
  } else {
    document.getElementById('fabric-browser-select-' + blockId).disabled = true;
    placeholder.style.display = 'flex';
    detailContent.style.display = 'none';
  }

  this.resetBrowserFilters();
  this.loadLookupData();
  document.getElementById('fabric-browser-overlay-' + blockId).style.display = 'flex';
  this.loadPaginatedFabrics();
};

CushionCalculator.prototype.loadLookupData = async function() {
  if (this.lookupData) return;
  try {
    var response = await fetch('/apps/cushion-api/fabric-lookups?shop=' + this.shopDomain);
    if (response.ok) {
      this.lookupData = await response.json();
      this.populateFilterOptions();
    }
  } catch (e) {
    console.error('Error loading lookup data:', e);
  }
};

CushionCalculator.prototype.closeFabricBrowserPopup = function() {
  document.getElementById('fabric-browser-overlay-' + this.blockId).style.display = 'none';
  this.browserSelectedFabric = null;
};

CushionCalculator.prototype.loadPaginatedFabrics = async function() {
  var blockId = this.blockId;
  var self = this;
  var loading = document.getElementById('fabric-browser-loading-' + blockId);
  var content = document.getElementById('fabric-browser-content-' + blockId);
  var grid = document.getElementById('fabric-browser-grid-' + blockId);
  var detailPanel = document.getElementById('fabric-detail-panel-' + blockId);

  if (!loading || !content || !grid) return;

  loading.style.display = 'block';
  if (content.parentElement) content.parentElement.style.display = 'none';

  try {
    var params = new URLSearchParams({ shop: this.shopDomain, page: this.browserCurrentPage, limit: 50 });

    if (this.browserCurrentCategoryId && this.browserCurrentCategoryId !== 'all') {
      params.append('categoryId', this.browserCurrentCategoryId);
    }

    var brandVal = document.getElementById('filter-brand-' + blockId).value;
    var patternVal = document.getElementById('filter-pattern-' + blockId).value;
    var colorVal = document.getElementById('filter-color-' + blockId).value;
    var materialVal = document.getElementById('filter-material-' + blockId).value;
    var sortVal = document.getElementById('filter-sort-' + blockId).value;

    if (brandVal) params.append('brandId', brandVal);
    if (patternVal) params.append('patternId', patternVal);
    if (colorVal) params.append('colorId', colorVal);
    if (materialVal) params.append('materialId', materialVal);

    if (sortVal) {
      var parts = sortVal.split('-');
      params.append('sortBy', parts[0]);
      params.append('sortDir', parts[1]);
    }

    var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
    if (!response.ok) throw new Error('Failed to load fabrics');

    var data = await response.json();
    this.browserFabricsData = data.fabrics;

    if (data.fabrics.length === 0) {
      grid.innerHTML = '<div class="kraft2026zion-fabric-browser-empty">No fabrics found</div>';
    } else {
      var browserSelectedFabric = this.browserSelectedFabric;
      grid.innerHTML = data.fabrics.map(function(f) {
        var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + CushionCalculator.TIER_LABELS[f.priceTier] + '</span>' : '';
        return '<div class="kraft2026zion-fabric-thumb' + (browserSelectedFabric && browserSelectedFabric.id === f.id ? ' kraft2026zion-selected' : '') + '" data-id="' + f.id + '">' +
          (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#999;">No img</span>') +
          tierBadge +
          '</div>';
      }).join('');

      grid.querySelectorAll('.kraft2026zion-fabric-thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          var fabricId = thumb.dataset.id;
          var fabric = self.browserFabricsData.find(function(f) { return f.id === fabricId; });
          if (fabric) self.selectPopupFabric(fabric);
        });
      });
    }

    var pagination = data.pagination;
    document.getElementById('pagination-info-' + blockId).textContent = pagination.page + ' / ' + pagination.totalPages;
    document.getElementById('pagination-prev-' + blockId).disabled = !pagination.hasPrev;
    document.getElementById('pagination-next-' + blockId).disabled = !pagination.hasNext;

    loading.style.display = 'none';
    content.parentElement.style.display = 'flex';

    if (!this.browserSelectedFabric) {
      document.getElementById('fabric-detail-content-' + blockId).style.display = 'none';
      detailPanel.querySelector('.kraft2026zion-fabric-detail-placeholder').style.display = 'flex';
    }

  } catch (error) {
    console.error('Error loading paginated fabrics:', error);
    loading.style.display = 'none';
    content.parentElement.style.display = 'flex';
    grid.innerHTML = '<div class="kraft2026zion-fabric-browser-empty">Failed to load fabrics</div>';
  }
};

CushionCalculator.prototype.populateFilterOptions = function() {
  if (!this.lookupData) return;
  var blockId = this.blockId;

  var currentBrand = document.getElementById('filter-brand-' + blockId).value;
  var currentPattern = document.getElementById('filter-pattern-' + blockId).value;
  var currentColor = document.getElementById('filter-color-' + blockId).value;
  var currentMaterial = document.getElementById('filter-material-' + blockId).value;

  document.getElementById('filter-brand-' + blockId).innerHTML = '<option value="">Brand</option>' + (this.lookupData.brands || []).map(function(b) {
    return '<option value="' + b.id + '"' + (b.id === currentBrand ? ' selected' : '') + '>' + b.name + '</option>';
  }).join('');

  document.getElementById('filter-pattern-' + blockId).innerHTML = '<option value="">Pattern</option>' + (this.lookupData.patterns || []).map(function(p) {
    return '<option value="' + p.id + '"' + (p.id === currentPattern ? ' selected' : '') + '>' + p.name + '</option>';
  }).join('');

  document.getElementById('filter-color-' + blockId).innerHTML = '<option value="">Color</option>' + (this.lookupData.colors || []).map(function(c) {
    return '<option value="' + c.id + '"' + (c.id === currentColor ? ' selected' : '') + '>' + c.name + '</option>';
  }).join('');

  document.getElementById('filter-material-' + blockId).innerHTML = '<option value="">Material</option>' + (this.lookupData.materials || []).map(function(m) {
    return '<option value="' + m.id + '"' + (m.id === currentMaterial ? ' selected' : '') + '>' + m.name + '</option>';
  }).join('');
};

CushionCalculator.prototype.resetBrowserFilters = function() {
  var blockId = this.blockId;
  document.getElementById('filter-brand-' + blockId).value = '';
  document.getElementById('filter-pattern-' + blockId).value = '';
  document.getElementById('filter-color-' + blockId).value = '';
  document.getElementById('filter-material-' + blockId).value = '';
  document.getElementById('filter-sort-' + blockId).value = 'priceTier-asc';
  this.browserCurrentPage = 1;
};

CushionCalculator.prototype.selectPopupFabric = function(fabric) {
  var blockId = this.blockId;
  this.browserSelectedFabric = fabric;

  var grid = document.getElementById('fabric-browser-grid-' + blockId);
  grid.querySelectorAll('.kraft2026zion-fabric-thumb').forEach(function(thumb) {
    thumb.classList.toggle('kraft2026zion-selected', thumb.dataset.id === fabric.id);
  });

  var detailPanel = document.getElementById('fabric-detail-panel-' + blockId);
  var placeholder = detailPanel.querySelector('.kraft2026zion-fabric-detail-placeholder');
  var detailContent = document.getElementById('fabric-detail-content-' + blockId);

  placeholder.style.display = 'none';
  detailContent.style.display = 'flex';

  document.getElementById('fabric-detail-image-' + blockId).src = fabric.imageUrl || '';
  document.getElementById('fabric-detail-name-' + blockId).textContent = fabric.name;
  document.getElementById('fabric-detail-category-' + blockId).textContent = fabric.categoryName || '-';
  document.getElementById('fabric-detail-pattern-' + blockId).textContent = fabric.patternName || '-';
  document.getElementById('fabric-detail-color-' + blockId).textContent = fabric.colorName || '-';
  document.getElementById('fabric-detail-brand-' + blockId).textContent = fabric.brandName || '-';
  document.getElementById('fabric-detail-tier-' + blockId).textContent = fabric.priceTier ? CushionCalculator.TIER_LABELS[fabric.priceTier] || fabric.priceTier : '-';
  document.getElementById('fabric-detail-material-' + blockId).textContent = fabric.materialName || '-';

  document.getElementById('fabric-browser-select-' + blockId).disabled = false;
};

CushionCalculator.prototype.confirmFabricSelection = function() {
  if (!this.browserSelectedFabric) return;
  this.selectFabric(this.browserSelectedFabric);
  this.closeFabricBrowserPopup();
};

CushionCalculator.prototype.setupFabricBrowserEventListeners = function() {
  var blockId = this.blockId;
  var self = this;
  var closeBtn = document.getElementById('fabric-browser-close-' + blockId);
  var overlay = document.getElementById('fabric-browser-overlay-' + blockId);
  var applyBtn = document.getElementById('filter-apply-' + blockId);
  var resetBtn = document.getElementById('filter-reset-' + blockId);
  var prevBtn = document.getElementById('pagination-prev-' + blockId);
  var nextBtn = document.getElementById('pagination-next-' + blockId);
  var selectBtn = document.getElementById('fabric-browser-select-' + blockId);

  if (closeBtn) closeBtn.addEventListener('click', function() { self.closeFabricBrowserPopup(); });

  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target.id === 'fabric-browser-overlay-' + blockId) self.closeFabricBrowserPopup();
  });

  if (applyBtn) applyBtn.addEventListener('click', function() {
    self.browserCurrentPage = 1;
    self.loadPaginatedFabrics();
  });

  if (resetBtn) resetBtn.addEventListener('click', function() {
    self.resetBrowserFilters();
    self.loadPaginatedFabrics();
  });

  if (prevBtn) prevBtn.addEventListener('click', function() {
    if (self.browserCurrentPage > 1) {
      self.browserCurrentPage--;
      self.loadPaginatedFabrics();
    }
  });

  if (nextBtn) nextBtn.addEventListener('click', function() {
    self.browserCurrentPage++;
    self.loadPaginatedFabrics();
  });

  if (selectBtn) selectBtn.addEventListener('click', function() { self.confirmFabricSelection(); });
};
