// Cushion Price Calculator - Core Module v5.0
// Class definition, constructor, init, and entry point

function CushionCalculator(calcRoot) {
  this.calcRoot = calcRoot;
  this.blockId = calcRoot.dataset.blockId;
  this.shopDomain = calcRoot.dataset.shop;
  this.profileId = calcRoot.dataset.profileId || '';
  var rawVariantId = calcRoot.dataset.variantId;
  this.variantId = rawVariantId && rawVariantId.trim() !== '' ? rawVariantId : null;
  var rawProductId = calcRoot.dataset.productId;
  this.productId = rawProductId && rawProductId.trim() !== '' ? rawProductId : null;
  this.productTitle = calcRoot.dataset.productTitle || '';
  this.productHandle = calcRoot.dataset.productHandle || '';

  this.config = null;
  this.selectedShape = null;
  this.selectedFill = null;
  this.selectedFabric = null;
  this.selectedPiping = null;
  this.selectedButton = null;
  this.selectedAntiSkid = null;
  this.selectedRodPocket = null;
  this.selectedTies = null;
  this.selectedDesign = null;
  this.selectedFabricTies = null;
  this.selectedDrawstring = null;
  this.dimensions = {};
  this.panelCount = 1;
  this.calculatedPrice = 0;

  // Multi-piece mode state
  this.isMultiPieceMode = false;
  this.pieces = [];
  this.activePieceIndex = 0;

  this.fabricNavLevel = 'categories';
  this.fabricNavCategoryId = null;
  this.fabricNavCategoryName = '';
  this.fabricCache = {};
  this.lookupData = null;
  this.attachmentUrl = null;
  this.attachmentFileName = null;

  this.categoryFabricPreviews = {};
  this.browserSelectedFabric = null;
  this.browserCurrentPage = 1;
  this.browserCurrentCategoryId = null;
  this.browserCurrentCategoryName = null;
  this.browserFabricsData = [];

  this.loadingDiv = document.getElementById('calc-loading-' + this.blockId);
  this.container = document.getElementById('calc-container-' + this.blockId);

  this.init();
}

// Static constants
CushionCalculator.TIER_LABELS = { none: '', low: '$', medium: '$$', high: '$$$' };
CushionCalculator.MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
CushionCalculator.ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

CushionCalculator.prototype.init = async function() {
  try {
    var apiUrl = '/apps/cushion-api/calculator-config?shop=' + this.shopDomain;
    if (this.profileId && this.profileId.trim() !== '') apiUrl += '&profileId=' + encodeURIComponent(this.profileId);

    var response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed to load config');
    this.config = await response.json();

    // Check for multi-piece mode
    this.isMultiPieceMode = this.config.profile && this.config.profile.enableMultiPiece && this.config.profile.pieces && this.config.profile.pieces.length > 0;

    if (this.isMultiPieceMode) {
      this.initMultiPieceMode();
    } else {
      this.initSinglePieceMode();
    }

    this.setupEventListeners();
    this.setupFabricBrowserEventListeners();
    this.loadingDiv.style.display = 'none';
    this.container.style.display = 'block';

    if (this.config.settings && !this.config.settings.debugPricing) {
      this.calcRoot.classList.add('kraft2026zion-pricing-hidden');
    }

    this.setupFloatingFooter();
    this.initGalleryIntegration();
    await this.applyUrlConfiguration();

    if (!this.isMultiPieceMode) {
      this.openFirstVisibleSection();
    }
  } catch (error) {
    console.error('Init error:', error);
    this.loadingDiv.innerHTML = '<p style="color: #dc3545;">Failed to load calculator. Please refresh.</p>';
  }
};

CushionCalculator.prototype.initSinglePieceMode = function() {
  this.applySectionVisibility();
  this.renderShapes();
  this.renderFillTypes();
  this.renderFabrics();
  this.renderDesignOptions();
  this.renderPipingOptions();
  this.renderButtonOptions();
  this.renderAntiSkidOptions();
  this.renderRodPocketOptions();
  this.renderTiesOptions();
  this.renderFabricTiesOptions();
  this.renderDrawstringOptions();

  var self = this;

  // Check if shape section is hidden but a hidden shape is configured
  var sv = this.config.sectionVisibility || {};
  var hiddenShapeUsed = false;
  if (sv.showShapeSection === false && this.config.hiddenValues && this.config.hiddenValues.shape) {
    this.selectedShape = this.config.hiddenValues.shape;
    this.renderDimensionFields(this.selectedShape);
    this.dimensions = {};
    this.selectedShape.inputFields.forEach(function(f) { var v = parseFloat(f.defaultValue); if (!isNaN(v) && v > 0) self.dimensions[f.key] = v; });
    this.updateDimensionValue();
    document.getElementById('value-shape-' + this.blockId).textContent = this.selectedShape.name + ' (preset)';
    document.getElementById('value-shape-' + this.blockId).classList.add('kraft2026zion-selected');
    hiddenShapeUsed = true;
  }

  if (!hiddenShapeUsed && this.config.defaultShapeId) {
    var s = this.config.shapes.find(function(x) { return x.id === self.config.defaultShapeId; });
    if (s) this.selectShape(s);
  }
  if (this.config.defaultFillTypeId) {
    var f = this.config.fillTypes.find(function(x) { return x.id === self.config.defaultFillTypeId; });
    if (f) this.selectFill(f);
  }
  if (this.config.defaultFabricId) {
    var uncatFab = (this.config.uncategorizedFabrics || []).find(function(x) { return x.id === self.config.defaultFabricId; });
    if (uncatFab) this.selectFabric(uncatFab);
  }
  if (this.config.defaultDesignId) this.selectDesign(this.config.defaultDesignId);
  if (this.config.defaultPipingId) this.selectPiping(this.config.defaultPipingId);
  if (this.config.defaultButtonId) this.selectButton(this.config.defaultButtonId);
  if (this.config.defaultAntiSkidId) this.selectAntiSkid(this.config.defaultAntiSkidId);
  if (this.config.defaultRodPocketId) this.selectRodPocket(this.config.defaultRodPocketId);
  if (this.config.defaultTiesId) this.selectTies(this.config.defaultTiesId);
  if (this.config.defaultFabricTiesId) this.selectFabricTies(this.config.defaultFabricTiesId);
  if (this.config.defaultDrawstringId) this.selectDrawstring(this.config.defaultDrawstringId);
};

CushionCalculator.prototype.applySectionVisibility = function() {
  var v = this.config.sectionVisibility || {};
  var sections = [
    { key: 'shape', show: v.showShapeSection !== false },
    { key: 'dimensions', show: v.showDimensionsSection !== false },
    { key: 'fill', show: v.showFillSection !== false },
    { key: 'fabric', show: v.showFabricSection !== false },
    { key: 'design', show: v.showDesignSection !== false },
    { key: 'piping', show: v.showPipingSection !== false },
    { key: 'button', show: v.showButtonSection !== false },
    { key: 'antiskid', show: v.showAntiSkidSection !== false },
    { key: 'rodpocket', show: v.showRodPocketSection !== false },
    { key: 'ties', show: v.showTiesSection !== false },
    { key: 'fabricties', show: v.showFabricTiesSection !== false },
    { key: 'drawstring', show: v.showDrawstringSection !== false },
    { key: 'instructions', show: v.showInstructions !== false },
  ];
  var container = this.container;
  sections.forEach(function(s) {
    var el = container.querySelector('[data-section="' + s.key + '"]');
    if (el) {
      el.style.display = s.show ? 'block' : 'none';
    }
  });
};

CushionCalculator.prototype.openFirstVisibleSection = function() {
  var v = this.config.sectionVisibility || {};
  var order = ['shape', 'dimensions', 'fill', 'fabric', 'design', 'piping', 'button', 'antiskid', 'rodpocket', 'ties', 'fabricties', 'drawstring', 'instructions'];
  var map = { shape: v.showShapeSection !== false, dimensions: v.showDimensionsSection !== false, fill: v.showFillSection !== false, fabric: v.showFabricSection !== false, design: v.showDesignSection !== false, piping: v.showPipingSection !== false, button: v.showButtonSection !== false, antiskid: v.showAntiSkidSection !== false, rodpocket: v.showRodPocketSection !== false, ties: v.showTiesSection !== false, fabricties: v.showFabricTiesSection !== false, drawstring: v.showDrawstringSection !== false, instructions: v.showInstructions !== false };
  for (var i = 0; i < order.length; i++) { if (map[order[i]]) { this.toggleSection(order[i], true); break; } }
};

CushionCalculator.prototype.toggleSection = function(name, forceOpen) {
  var header = document.getElementById('header-' + name + '-' + this.blockId);
  var content = document.getElementById('content-' + name + '-' + this.blockId);
  if (!header || !content) return;
  var blockId = this.blockId;
  if (forceOpen || !content.classList.contains('kraft2026zion-open')) {
    document.querySelectorAll('#calc-container-' + blockId + ' .kraft2026zion-accordion-content').forEach(function(c) {
      if (!c.closest('.kraft2026zion-pieces-content')) c.classList.remove('kraft2026zion-open');
    });
    document.querySelectorAll('#calc-container-' + blockId + ' .kraft2026zion-accordion-header').forEach(function(h) {
      if (!h.closest('.kraft2026zion-pieces-content')) h.classList.remove('kraft2026zion-active');
    });
    content.classList.add('kraft2026zion-open');
    header.classList.add('kraft2026zion-active');
    // Gallery integration: show shape when dimensions opens
    if (name === 'dimensions') {
      this.showShapeInGallery();
    } else {
      this.hideShapeFromGallery();
    }
  } else {
    content.classList.remove('kraft2026zion-open');
    header.classList.remove('kraft2026zion-active');
    // Gallery integration: hide shape when dimensions closes
    if (name === 'dimensions') {
      this.hideShapeFromGallery();
    }
  }
};

CushionCalculator.prototype.setupScrollArrows = function(w, l, r) {
  if (!w || !l || !r) return;
  var s = 160;
  var nl = l.cloneNode(true), nr = r.cloneNode(true);
  l.parentNode.replaceChild(nl, l); r.parentNode.replaceChild(nr, r);
  var upd = function() { var ns = w.scrollWidth > w.clientWidth; nl.style.display = nr.style.display = ns ? 'flex' : 'none'; if (ns) st(); };
  var st = function() { nl.disabled = w.scrollLeft <= 0; nr.disabled = w.scrollLeft + w.clientWidth >= w.scrollWidth - 1; };
  nl.onclick = function() { w.scrollBy({ left: -s, behavior: 'smooth' }); };
  nr.onclick = function() { w.scrollBy({ left: s, behavior: 'smooth' }); };
  w.onscroll = st; setTimeout(upd, 100); window.addEventListener('resize', upd);
};

CushionCalculator.prototype.initSectionScrollArrows = function(n) {
  this.setupScrollArrows(document.getElementById(n + '-scroll-wrapper-' + this.blockId), document.getElementById(n + '-scroll-left-' + this.blockId), document.getElementById(n + '-scroll-right-' + this.blockId));
};

// Find and cache gallery elements
CushionCalculator.prototype.initGalleryIntegration = function() {
  this.galleryElement = document.querySelector('.custom-gallery');
  this.galleryMainArea = this.galleryElement ?
    this.galleryElement.querySelector('.custom-gallery__main') : null;
  this.shapeSlideInjected = false;
  this.originalActiveIndex = 0;
};

// Inject shape image into gallery
CushionCalculator.prototype.showShapeInGallery = function() {
  // In multi-piece mode, use the active piece's shape
  var shape = this.isMultiPieceMode && this.pieces && this.pieces[this.activePieceIndex]
    ? this.pieces[this.activePieceIndex].shape
    : this.selectedShape;
  if (!shape || !shape.imageUrl) return;
  if (!this.galleryElement) this.initGalleryIntegration();
  if (!this.galleryMainArea) return;

  // Store current active slide
  var currentActive = this.galleryMainArea.querySelector('.custom-gallery__slide.is-active');
  if (currentActive && currentActive.dataset.index !== 'shape') {
    this.originalActiveIndex = parseInt(currentActive.dataset.index) || 0;
  }

  // Hide all product slides
  this.galleryMainArea.querySelectorAll('.custom-gallery__slide').forEach(function(slide) {
    slide.classList.remove('is-active');
  });

  // Create or update shape slide
  var existingShapeSlide = this.galleryMainArea.querySelector('.kraft2026zion-shape-slide');
  if (existingShapeSlide) {
    existingShapeSlide.querySelector('img').src = shape.imageUrl;
    existingShapeSlide.querySelector('.kraft2026zion-shape-gallery-label').textContent =
      'Dimension Reference: ' + shape.name;
    existingShapeSlide.classList.add('is-active');
  } else {
    var shapeSlide = document.createElement('div');
    shapeSlide.className = 'custom-gallery__slide kraft2026zion-shape-slide is-active';
    shapeSlide.dataset.index = 'shape';
    shapeSlide.innerHTML = '<div class="kraft2026zion-shape-gallery-wrapper">' +
      '<img src="' + shape.imageUrl + '" alt="' + shape.name + '">' +
      '<div class="kraft2026zion-shape-gallery-label">Dimension Reference: ' + shape.name + '</div>' +
      '</div>';
    this.galleryMainArea.insertBefore(shapeSlide, this.galleryMainArea.firstChild);
  }

  this.shapeSlideInjected = true;

  // Dim thumbnails
  var thumbsWrap = this.galleryElement.querySelector('.custom-gallery__thumbs-wrap');
  if (thumbsWrap) {
    thumbsWrap.style.opacity = '0.4';
    thumbsWrap.style.pointerEvents = 'none';
  }
};

// Remove shape image and restore gallery
CushionCalculator.prototype.hideShapeFromGallery = function() {
  if (!this.shapeSlideInjected || !this.galleryMainArea) return;

  var shapeSlide = this.galleryMainArea.querySelector('.kraft2026zion-shape-slide');
  if (shapeSlide) shapeSlide.remove();

  // Restore original slide
  var slides = this.galleryMainArea.querySelectorAll('.custom-gallery__slide');
  var targetIndex = this.originalActiveIndex;
  var activated = false;
  slides.forEach(function(slide) {
    if (parseInt(slide.dataset.index) === targetIndex) {
      slide.classList.add('is-active');
      activated = true;
    }
  });
  if (!activated && slides.length > 0) slides[0].classList.add('is-active');

  // Restore thumbnails
  var thumbsWrap = this.galleryElement.querySelector('.custom-gallery__thumbs-wrap');
  if (thumbsWrap) {
    thumbsWrap.style.opacity = '';
    thumbsWrap.style.pointerEvents = '';
  }

  // Sync thumbnail active state
  var thumbs = this.galleryElement.querySelectorAll('.custom-gallery__thumb');
  thumbs.forEach(function(thumb, i) {
    thumb.classList.toggle('is-active', i === targetIndex);
  });

  this.shapeSlideInjected = false;
};

// Entry point - runs after all deferred scripts have loaded
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.kraft2026zion-calc[data-block-id]').forEach(function(calcRoot) {
    new CushionCalculator(calcRoot);
  });

  // Cart page refresh logic
  if (window.location.pathname === '/cart' && sessionStorage.getItem('cushion_refresh_cart') === 'true') {
    sessionStorage.removeItem('cushion_refresh_cart');
    setTimeout(function() { window.location.reload(); }, 1500);
  }

  if (window.location.pathname === '/cart') {
    setTimeout(function() {
      CushionCalculator.checkCartPrices();
    }, 1000);
  }
});

// Static method for cart price checking
CushionCalculator.checkCartPrices = async function() {
  if (window.location.pathname !== '/cart') return;
  try {
    var response = await fetch('/cart.js');
    var cart = await response.json();
    var needsRefresh = false;
    var refreshAttempts = parseInt(sessionStorage.getItem('cushion_price_refresh_attempts') || '0');
    for (var i = 0; i < cart.items.length; i++) {
      var item = cart.items[i];
      var calculatedPrice = item.properties && item.properties._calculated_price;
      if (!calculatedPrice) continue;
      var expectedPrice = parseFloat(calculatedPrice) * 100;
      var actualPrice = item.price;
      if (actualPrice < 1 || Math.abs(actualPrice - expectedPrice) > 1) {
        needsRefresh = true;
        break;
      }
    }
    if (needsRefresh && refreshAttempts < 10) {
      sessionStorage.setItem('cushion_price_refresh_attempts', (refreshAttempts + 1).toString());
      setTimeout(function() { window.location.reload(); }, 2000);
    } else if (!needsRefresh) {
      sessionStorage.removeItem('cushion_price_refresh_attempts');
    } else {
      sessionStorage.removeItem('cushion_price_refresh_attempts');
    }
  } catch (error) { /* ignore */ }
};
