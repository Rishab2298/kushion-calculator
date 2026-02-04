// Cushion Price Calculator - External JavaScript v5.0
(function() {
  // Initialize all calculator instances on the page
  document.querySelectorAll('.kraft2026zion-calc[data-block-id]').forEach(function(calcRoot) {
    initCalculator(calcRoot);
  });

  function initCalculator(calcRoot) {
    const blockId = calcRoot.dataset.blockId;
    const shopDomain = calcRoot.dataset.shop;
    const profileId = calcRoot.dataset.profileId || '';
    const rawVariantId = calcRoot.dataset.variantId;
    const variantId = rawVariantId && rawVariantId.trim() !== '' ? rawVariantId : null;
    const rawProductId = calcRoot.dataset.productId;
    const productId = rawProductId && rawProductId.trim() !== '' ? rawProductId : null;
    const productTitle = calcRoot.dataset.productTitle || '';
    const productHandle = calcRoot.dataset.productHandle || '';

    let config = null;
    let selectedShape = null;
    let selectedFill = null;
    let selectedFabric = null;
    let selectedPiping = null;
    let selectedButton = null;
    let selectedAntiSkid = null;
    let selectedRodPocket = null;
    let selectedTies = null;
    let selectedDesign = null;
    let selectedFabricTies = null;
    let dimensions = {};
    let panelCount = 1;
    let calculatedPrice = 0;

    // Multi-piece mode state
    let isMultiPieceMode = false;
    let pieces = []; // Array of piece states: { id, name, label, shape, dimensions, fill, design, piping, button, antiSkid, rodPocket, ties, fabricTies, config }
    let activePieceIndex = 0;

    let fabricNavLevel = 'categories';
    let fabricNavCategoryId = null;
    let fabricNavCategoryName = '';
    const fabricCache = {};
    let lookupData = null;
    let attachmentUrl = null;
    let attachmentFileName = null;

    const TIER_LABELS = { none: '', low: '$', medium: '$$', high: '$$$' };
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

    const loadingDiv = document.getElementById('calc-loading-' + blockId);
    const container = document.getElementById('calc-container-' + blockId);

    async function init() {
      try {
        let apiUrl = '/apps/cushion-api/calculator-config?shop=' + shopDomain;
        if (profileId && profileId.trim() !== '') apiUrl += '&profileId=' + encodeURIComponent(profileId);

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to load config');
        config = await response.json();

        // Check for multi-piece mode
        isMultiPieceMode = config.profile && config.profile.enableMultiPiece && config.profile.pieces && config.profile.pieces.length > 0;

        if (isMultiPieceMode) {
          initMultiPieceMode();
        } else {
          initSinglePieceMode();
        }

        setupEventListeners();
        setupFabricBrowserEventListeners();
        loadingDiv.style.display = 'none';
        container.style.display = 'block';

        if (config.settings && !config.settings.debugPricing) {
          calcRoot.classList.add('kraft2026zion-pricing-hidden');
        }

        setupFloatingFooter();
        await applyUrlConfiguration();

        if (!isMultiPieceMode) {
          openFirstVisibleSection();
        }
      } catch (error) {
        console.error('Init error:', error);
        loadingDiv.innerHTML = '<p style="color: #dc3545;">Failed to load calculator. Please refresh.</p>';
      }
    }

    function initSinglePieceMode() {
      applySectionVisibility();
      renderShapes();
      renderFillTypes();
      renderFabrics();
      renderDesignOptions();
      renderPipingOptions();
      renderButtonOptions();
      renderAntiSkidOptions();
      renderRodPocketOptions();
      renderTiesOptions();
      renderFabricTiesOptions();

      // Check if shape section is hidden but a hidden shape is configured
      var sv = config.sectionVisibility || {};
      var hiddenShapeUsed = false;
      if (sv.showShapeSection === false && config.hiddenValues && config.hiddenValues.shape) {
        // Use hidden shape for calculations and render its dimension fields
        selectedShape = config.hiddenValues.shape;
        renderDimensionFields(selectedShape);
        dimensions = {};
        selectedShape.inputFields.forEach(function(f) { var v = parseFloat(f.defaultValue); if (!isNaN(v) && v > 0) dimensions[f.key] = v; });
        updateDimensionValue();
        document.getElementById('value-shape-' + blockId).textContent = selectedShape.name + ' (preset)';
        document.getElementById('value-shape-' + blockId).classList.add('kraft2026zion-selected');
        hiddenShapeUsed = true;
      }

      if (!hiddenShapeUsed && config.defaultShapeId) {
        const s = config.shapes.find(function(x) { return x.id === config.defaultShapeId; });
        if (s) selectShape(s);
      }
      if (config.defaultFillTypeId) {
        const f = config.fillTypes.find(function(x) { return x.id === config.defaultFillTypeId; });
        if (f) selectFill(f);
      }
      if (config.defaultFabricId) {
        const uncatFab = (config.uncategorizedFabrics || []).find(function(x) { return x.id === config.defaultFabricId; });
        if (uncatFab) selectFabric(uncatFab);
      }
      if (config.defaultDesignId) selectDesign(config.defaultDesignId);
      if (config.defaultPipingId) selectPiping(config.defaultPipingId);
      if (config.defaultButtonId) selectButton(config.defaultButtonId);
      if (config.defaultAntiSkidId) selectAntiSkid(config.defaultAntiSkidId);
      if (config.defaultRodPocketId) selectRodPocket(config.defaultRodPocketId);
      if (config.defaultTiesId) selectTies(config.defaultTiesId);
      if (config.defaultFabricTiesId) selectFabricTies(config.defaultFabricTiesId);
    }

    function initMultiPieceMode() {
      // Hide single-piece container, show multi-piece container
      var singlePieceContainer = document.getElementById('single-piece-container-' + blockId);
      var multiPieceContainer = document.getElementById('multi-piece-container-' + blockId);
      var sharedFabricContainer = document.getElementById('shared-fabric-container-' + blockId);
      var singlePieceBreakdown = document.getElementById('price-breakdown-' + blockId);
      var multiPieceBreakdownContainer = document.getElementById('multi-piece-breakdown-container-' + blockId);

      if (singlePieceContainer) singlePieceContainer.style.display = 'none';
      if (multiPieceContainer) multiPieceContainer.style.display = 'block';
      // Hide shared fabric container - fabric is now inside piece tabs
      if (sharedFabricContainer) sharedFabricContainer.style.display = 'none';
      if (singlePieceBreakdown) singlePieceBreakdown.style.display = 'none';
      if (multiPieceBreakdownContainer) multiPieceBreakdownContainer.style.display = 'block';

      // Initialize pieces array from profile config
      pieces = config.profile.pieces.map(function(pieceConfig, idx) {
        return {
          id: pieceConfig.id,
          name: pieceConfig.name,
          label: pieceConfig.label || pieceConfig.name,
          config: pieceConfig,
          shape: null,
          dimensions: {},
          fill: null,
          design: null,
          piping: null,
          button: null,
          antiSkid: null,
          rodPocket: null,
          ties: null,
          fabricTies: null
        };
      });

      // Apply defaults for each piece BEFORE rendering UI
      pieces.forEach(function(piece, idx) {
        var pc = piece.config;

        // Default shape
        if (pc.defaultShapeId) {
          var shape = getFilteredShapes(pc).find(function(s) { return s.id === pc.defaultShapeId; });
          if (shape) {
            piece.shape = shape;
            piece.dimensions = {};
            shape.inputFields.forEach(function(f) {
              var v = parseFloat(f.defaultValue);
              if (!isNaN(v) && v > 0) piece.dimensions[f.key] = v;
            });
          }
        }

        // Default fill
        if (pc.defaultFillId) {
          var fill = getFilteredFillTypes(pc).find(function(f) { return f.id === pc.defaultFillId; });
          if (fill) piece.fill = fill;
        }

        // Hidden values - in multi-piece mode, only check piece-level visibility
        if (pc.showFillSection === false && pc.hiddenFillTypeId) {
          var hiddenFill = config.fillTypes.find(function(f) { return f.id === pc.hiddenFillTypeId; });
          if (hiddenFill) piece.fill = hiddenFill;
        }
        if (pc.showDesignSection === false && pc.hiddenDesignId) {
          piece.design = (config.designOptions || []).find(function(d) { return d.id === pc.hiddenDesignId; }) || null;
        }
        if (pc.showPipingSection === false && pc.hiddenPipingId) {
          piece.piping = config.pipingOptions.find(function(p) { return p.id === pc.hiddenPipingId; }) || null;
        }
        if (pc.showButtonSection === false && pc.hiddenButtonId) {
          piece.button = (config.buttonStyleOptions || []).find(function(b) { return b.id === pc.hiddenButtonId; }) || null;
        }
        if (pc.showAntiSkidSection === false && pc.hiddenAntiSkidId) {
          piece.antiSkid = (config.antiSkidOptions || []).find(function(a) { return a.id === pc.hiddenAntiSkidId; }) || null;
        }
        if (pc.showRodPocketSection === false && pc.hiddenRodPocketId) {
          piece.rodPocket = (config.rodPocketOptions || []).find(function(rp) { return rp.id === pc.hiddenRodPocketId; }) || null;
        }
        if (pc.showTiesSection === false && pc.hiddenTiesId) {
          piece.ties = (config.tiesOptions || []).find(function(t) { return t.id === pc.hiddenTiesId; }) || null;
        }
        if (pc.showFabricTiesSection === false && pc.hiddenFabricTiesId) {
          piece.fabricTies = (config.fabricTiesOptions || []).find(function(ft) { return ft.id === pc.hiddenFabricTiesId; }) || null;
        }
        // Hidden shape for piece
        if (pc.showShapeSection === false && pc.hiddenShapeId) {
          var hiddenShape = config.shapes.find(function(s) { return s.id === pc.hiddenShapeId; });
          if (hiddenShape) {
            piece.shape = hiddenShape;
            piece.dimensions = {};
            hiddenShape.inputFields.forEach(function(f) {
              var v = parseFloat(f.defaultValue);
              if (!isNaN(v) && v > 0) piece.dimensions[f.key] = v;
            });
          }
        }

        // Apply profile-level defaults for add-ons (design, piping, button, anti-skid, rod pocket, ties, fabric ties)
        // Only apply if the section is visible at piece-level (multi-piece is piece-dependent)
        if (!piece.design && config.defaultDesignId && pc.showDesignSection !== false) {
          piece.design = (config.designOptions || []).find(function(d) { return d.id === config.defaultDesignId; }) || null;
        }
        if (!piece.piping && config.defaultPipingId && pc.showPipingSection !== false) {
          piece.piping = config.pipingOptions.find(function(p) { return p.id === config.defaultPipingId; }) || null;
        }
        if (!piece.button && config.defaultButtonId && pc.showButtonSection !== false) {
          piece.button = (config.buttonStyleOptions || []).find(function(b) { return b.id === config.defaultButtonId; }) || null;
        }
        if (!piece.antiSkid && config.defaultAntiSkidId && pc.showAntiSkidSection !== false) {
          piece.antiSkid = (config.antiSkidOptions || []).find(function(a) { return a.id === config.defaultAntiSkidId; }) || null;
        }
        if (!piece.rodPocket && config.defaultRodPocketId && pc.showRodPocketSection !== false) {
          piece.rodPocket = (config.rodPocketOptions || []).find(function(rp) { return rp.id === config.defaultRodPocketId; }) || null;
        }
        if (!piece.ties && config.defaultTiesId && pc.showTiesSection !== false) {
          piece.ties = (config.tiesOptions || []).find(function(t) { return t.id === config.defaultTiesId; }) || null;
        }
        if (!piece.fabricTies && config.defaultFabricTiesId && pc.showFabricTiesSection !== false) {
          piece.fabricTies = (config.fabricTiesOptions || []).find(function(ft) { return ft.id === config.defaultFabricTiesId; }) || null;
        }
      });

      // Render pieces label
      var piecesLabel = document.getElementById('pieces-label-' + blockId);
      if (piecesLabel) {
        piecesLabel.textContent = config.profile.piecesLabel || 'Pieces';
      }

      // Render piece tabs
      renderPieceTabs();

      // Activate first piece (defaults are already applied so UI reflects them)
      activePieceIndex = 0;
      switchToPiece(0);

      calculatePrice();
    }

    // Helper to parse allowed IDs - handles both array and JSON string formats
    function parseAllowedIds(val) {
      if (!val) return null;
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return null; }
      }
      return null;
    }

    function getFilteredShapes(pieceConfig) {
      if (!pieceConfig || !pieceConfig.allowedShapeIds) return config.shapes;
      var allowed = parseAllowedIds(pieceConfig.allowedShapeIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return config.shapes;
      return config.shapes.filter(function(s) { return allowed.includes(s.id); });
    }

    function getFilteredFillTypes(pieceConfig) {
      if (!pieceConfig || !pieceConfig.allowedFillIds) return config.fillTypes;
      var allowed = parseAllowedIds(pieceConfig.allowedFillIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return config.fillTypes;
      return config.fillTypes.filter(function(f) { return allowed.includes(f.id); });
    }

    function getFilteredPipingOptions(pieceConfig) {
      if (!pieceConfig || !pieceConfig.allowedPipingIds) return config.pipingOptions;
      var allowed = parseAllowedIds(pieceConfig.allowedPipingIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return config.pipingOptions;
      return config.pipingOptions.filter(function(p) { return allowed.includes(p.id); });
    }

    function getFilteredButtonOptions(pieceConfig) {
      var opts = config.buttonStyleOptions || [];
      if (!pieceConfig || !pieceConfig.allowedButtonIds) return opts;
      var allowed = parseAllowedIds(pieceConfig.allowedButtonIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return opts;
      return opts.filter(function(b) { return allowed.includes(b.id); });
    }

    function getFilteredAntiSkidOptions(pieceConfig) {
      var opts = config.antiSkidOptions || [];
      if (!pieceConfig || !pieceConfig.allowedAntiSkidIds) return opts;
      var allowed = parseAllowedIds(pieceConfig.allowedAntiSkidIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return opts;
      return opts.filter(function(a) { return allowed.includes(a.id); });
    }

    function getFilteredTiesOptions(pieceConfig) {
      var opts = config.tiesOptions || [];
      if (!pieceConfig || !pieceConfig.allowedTiesIds) return opts;
      var allowed = parseAllowedIds(pieceConfig.allowedTiesIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return opts;
      return opts.filter(function(t) { return allowed.includes(t.id); });
    }

    function getFilteredDesignOptions(pieceConfig) {
      var opts = config.designOptions || [];
      if (!pieceConfig || !pieceConfig.allowedDesignIds) return opts;
      var allowed = parseAllowedIds(pieceConfig.allowedDesignIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return opts;
      return opts.filter(function(d) { return allowed.includes(d.id); });
    }

    function getFilteredFabricTiesOptions(pieceConfig) {
      var opts = config.fabricTiesOptions || [];
      if (!pieceConfig || !pieceConfig.allowedFabricTiesIds) return opts;
      var allowed = parseAllowedIds(pieceConfig.allowedFabricTiesIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return opts;
      return opts.filter(function(ft) { return allowed.includes(ft.id); });
    }

    function getFilteredRodPocketOptions(pieceConfig) {
      var opts = config.rodPocketOptions || [];
      if (!pieceConfig || !pieceConfig.allowedRodPocketIds) return opts;
      var allowed = parseAllowedIds(pieceConfig.allowedRodPocketIds);
      if (!Array.isArray(allowed) || allowed.length === 0) return opts;
      return opts.filter(function(rp) { return allowed.includes(rp.id); });
    }

    function renderPieceTabs() {
      var tabsContainer = document.getElementById('pieces-tabs-' + blockId);
      if (!tabsContainer) return;

      tabsContainer.innerHTML = pieces.map(function(piece, idx) {
        return '<button type="button" class="kraft2026zion-piece-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-piece-index="' + idx + '">' +
          '<span class="kraft2026zion-piece-tab-name">' + piece.label + '</span>' +
          '<span class="kraft2026zion-piece-tab-status" id="piece-status-' + idx + '-' + blockId + '"></span>' +
          '</button>';
      }).join('');

      // Add click handlers
      tabsContainer.querySelectorAll('.piece-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          var idx = parseInt(tab.dataset.pieceIndex);
          switchToPiece(idx);
        });
      });

      updatePieceTabStatuses();
    }

    function updatePieceTabStatuses() {
      // No-op: tab status indicators removed
    }

    function hasRequiredDimensions(piece) {
      if (!piece.shape) return false;
      return piece.shape.inputFields.filter(function(f) { return f.required; }).every(function(f) {
        return piece.dimensions[f.key] && piece.dimensions[f.key] > 0;
      });
    }

    function switchToPiece(idx) {
      if (idx < 0 || idx >= pieces.length) return;

      activePieceIndex = idx;
      var piece = pieces[idx];
      var pieceConfig = piece.config;

      // Update tab active state
      var tabsContainer = document.getElementById('pieces-tabs-' + blockId);
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.piece-tab').forEach(function(tab, i) {
          tab.classList.toggle('kraft2026zion-active', i === idx);
        });
      }

      // Render piece content
      var pieceContent = document.getElementById('pieces-content-' + blockId);
      if (!pieceContent) return;

      // Build piece-specific sections - matching single-piece accordion structure exactly
      var html = '';
      var sectionNum = 1;
      var sv = config.sectionVisibility || {};

      // Shape section
      if (pieceConfig.showShapeSection !== false && sv.showShapeSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-shape">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-shape-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Select Shape</span>' +
          '<span class="kraft2026zion-header-value' + (piece.shape ? ' kraft2026zion-selected' : '') + '" id="piece-value-shape-' + blockId + '">' + (piece.shape ? piece.shape.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-shape-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-shape-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-shape-scroll-left-' + blockId + '" aria-label="Scroll left">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-shape-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-shape-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-shape-scroll-right-' + blockId + '" aria-label="Scroll right">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Dimensions section
      if (pieceConfig.showDimensionsSection !== false && sv.showDimensionsSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-dimensions">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-dimensions-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Enter Dimensions</span>' +
          '<span class="kraft2026zion-header-value" id="piece-value-dimensions-' + blockId + '">Not set</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-dimensions-' + blockId + '">' +
          '<div class="kraft2026zion-dimensions-scroll-container" id="piece-dimensions-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left kraft2026zion-dimensions-scroll-arrow" id="piece-dimensions-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-dimensions-scroll-wrapper" id="piece-dimensions-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-dimensions-form" id="piece-dimensions-form-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right kraft2026zion-dimensions-scroll-arrow" id="piece-dimensions-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Fill section
      if (pieceConfig.showFillSection !== false && sv.showFillSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-fill">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-fill-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Select Fill Type</span>' +
          '<span class="kraft2026zion-header-value' + (piece.fill ? ' kraft2026zion-selected' : '') + '" id="piece-value-fill-' + blockId + '">' + (piece.fill ? piece.fill.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-fill-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-fill-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-fill-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-fill-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-fill-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-fill-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Fabric section (shared across pieces, rendered inside each tab like single-piece)
      var fabricVisible = sv.showFabricSection !== false;
      if (fabricVisible) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-fabric">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-fabric-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Select Fabric</span>' +
          '<span class="kraft2026zion-header-value' + (selectedFabric ? ' kraft2026zion-selected' : '') + '" id="piece-value-fabric-' + blockId + '">' + (selectedFabric ? selectedFabric.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-fabric-' + blockId + '">' +
          '<div class="kraft2026zion-fabric-categories" id="piece-fabric-categories-' + blockId + '"></div>' +
          '</div></div>';
        sectionNum++;
      }

      // Design section
      if (pieceConfig.showDesignSection !== false && sv.showDesignSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-design">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-design-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Design Option</span>' +
          '<span class="kraft2026zion-header-value' + (piece.design ? ' kraft2026zion-selected' : '') + '" id="piece-value-design-' + blockId + '">' + (piece.design ? piece.design.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-design-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-design-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-design-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-design-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-design-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-design-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Piping section
      if (pieceConfig.showPipingSection !== false && sv.showPipingSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-piping">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-piping-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Piping Options</span>' +
          '<span class="kraft2026zion-header-value' + (piece.piping ? ' kraft2026zion-selected' : '') + '" id="piece-value-piping-' + blockId + '">' + (piece.piping ? piece.piping.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-piping-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-piping-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-piping-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-piping-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-piping-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-piping-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Button section
      if (pieceConfig.showButtonSection !== false && sv.showButtonSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-button">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-button-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Button Style</span>' +
          '<span class="kraft2026zion-header-value' + (piece.button ? ' kraft2026zion-selected' : '') + '" id="piece-value-button-' + blockId + '">' + (piece.button ? piece.button.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-button-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-button-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-button-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-button-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-button-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-button-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Anti-Skid section
      if (pieceConfig.showAntiSkidSection !== false && sv.showAntiSkidSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-antiskid">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-antiskid-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Anti-Skid</span>' +
          '<span class="kraft2026zion-header-value' + (piece.antiSkid ? ' kraft2026zion-selected' : '') + '" id="piece-value-antiskid-' + blockId + '">' + (piece.antiSkid ? piece.antiSkid.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-antiskid-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-antiskid-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-antiskid-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-antiskid-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-antiskid-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-antiskid-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Bottom Rod Pocket section
      if (pieceConfig.showRodPocketSection !== false && sv.showRodPocketSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-rodpocket">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-rodpocket-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Bottom Rod Pocket</span>' +
          '<span class="kraft2026zion-header-value' + (piece.rodPocket ? ' kraft2026zion-selected' : '') + '" id="piece-value-rodpocket-' + blockId + '">' + (piece.rodPocket ? piece.rodPocket.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-rodpocket-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-rodpocket-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-rodpocket-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-rodpocket-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-rodpocket-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-rodpocket-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Ties section
      if (pieceConfig.showTiesSection !== false && sv.showTiesSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-ties">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-ties-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Ties</span>' +
          '<span class="kraft2026zion-header-value' + (piece.ties ? ' kraft2026zion-selected' : '') + '" id="piece-value-ties-' + blockId + '">' + (piece.ties ? piece.ties.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-ties-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-ties-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-ties-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-ties-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-ties-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-ties-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      // Fabric Ties section
      if (pieceConfig.showFabricTiesSection !== false && sv.showFabricTiesSection !== false) {
        html += '<div class="kraft2026zion-accordion-section" data-section="piece-fabricties">' +
          '<div class="kraft2026zion-accordion-header" id="piece-header-fabricties-' + blockId + '">' +
          '<span class="kraft2026zion-header-title">' + sectionNum + '. Fabric Ties</span>' +
          '<span class="kraft2026zion-header-value' + (piece.fabricTies ? ' kraft2026zion-selected' : '') + '" id="piece-value-fabricties-' + blockId + '">' + (piece.fabricTies ? piece.fabricTies.name : 'Not selected') + '</span>' +
          '<span class="kraft2026zion-header-arrow">&#9662;</span>' +
          '</div>' +
          '<div class="kraft2026zion-accordion-content" id="piece-content-fabricties-' + blockId + '">' +
          '<div class="kraft2026zion-horizontal-scroll-container" id="piece-fabricties-scroll-container-' + blockId + '">' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-left" id="piece-fabricties-scroll-left-' + blockId + '" aria-label="Scroll left" style="display: none;">&#8249;</button>' +
          '<div class="kraft2026zion-horizontal-scroll-wrapper" id="piece-fabricties-scroll-wrapper-' + blockId + '">' +
          '<div class="kraft2026zion-options-row" id="piece-fabricties-grid-' + blockId + '"></div>' +
          '</div>' +
          '<button type="button" class="kraft2026zion-scroll-arrow kraft2026zion-scroll-arrow-right" id="piece-fabricties-scroll-right-' + blockId + '" aria-label="Scroll right" style="display: none;">&#8250;</button>' +
          '</div>' +
          '</div></div>';
        sectionNum++;
      }

      pieceContent.innerHTML = html;

      // Render options for each section
      renderPieceShapes(piece, pieceConfig);
      renderPieceDimensions(piece);
      renderPieceFillTypes(piece, pieceConfig);
      renderPieceFabricSection();
      renderPieceDesignOptions(piece, pieceConfig);
      renderPiecePipingOptions(piece, pieceConfig);
      renderPieceButtonOptions(piece, pieceConfig);
      renderPieceAntiSkidOptions(piece, pieceConfig);
      renderPieceRodPocketOptions(piece, pieceConfig);
      renderPieceTiesOptions(piece, pieceConfig);
      renderPieceFabricTiesOptions(piece, pieceConfig);

      // Setup click handlers for piece sections
      setupPieceSectionListeners();

      // Update dimension value display
      updatePieceDimensionValue(piece);
    }

    function renderPieceShapes(piece, pieceConfig) {
      var grid = document.getElementById('piece-shape-grid-' + blockId);
      if (!grid) return;

      var shapes = getFilteredShapes(pieceConfig);
      if (!shapes.length) {
        grid.innerHTML = '<p>No shapes available</p>';
        return;
      }

      grid.innerHTML = shapes.map(function(s) {
        return '<div class="kraft2026zion-option-card' + (piece.shape && piece.shape.id === s.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-shape" data-id="' + s.id + '">' +
          (s.imageUrl ? '<img class="kraft2026zion-option-image" src="' + s.imageUrl + '" alt="' + s.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + s.name + '">' + s.name + '</div></div>';
      }).join('');

      // Initialize scroll arrows
      initPieceSectionScrollArrows('piece-shape');
    }

    function renderPieceDimensions(piece) {
      var form = document.getElementById('piece-dimensions-form-' + blockId);
      var wrapper = document.getElementById('piece-dimensions-scroll-wrapper-' + blockId);
      var leftBtn = document.getElementById('piece-dimensions-scroll-left-' + blockId);
      var rightBtn = document.getElementById('piece-dimensions-scroll-right-' + blockId);
      if (!form) return;

      if (!piece.shape || !piece.shape.inputFields.length) {
        form.innerHTML = '<p>Select a shape first</p>';
        if (wrapper) wrapper.classList.remove('kraft2026zion-scroll-enabled');
        if (leftBtn) leftBtn.style.display = 'none';
        if (rightBtn) rightBtn.style.display = 'none';
        return;
      }

      form.innerHTML = piece.shape.inputFields.map(function(f) {
        var val = piece.dimensions[f.key] || f.defaultValue || '';
        return '<div class="kraft2026zion-dim-field"><label for="piece-dim-' + f.key + '-' + blockId + '">' + f.label + (f.required ? ' *' : '') + '</label>' +
          '<input type="number" id="piece-dim-' + f.key + '-' + blockId + '" data-key="' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="0.5" value="' + val + '" placeholder="' + f.min + '-' + f.max + '" ' + (f.required ? 'required' : '') + '>' +
          '<span class="kraft2026zion-dim-unit">' + f.unit + '</span>' +
          '<span class="kraft2026zion-dim-range-error"></span></div>';
      }).join('');

      // Enable scroll if more than 3 fields
      if (piece.shape.inputFields.length > 3) {
        if (wrapper) wrapper.classList.add('kraft2026zion-scroll-enabled');
        if (leftBtn) leftBtn.style.display = 'flex';
        if (rightBtn) rightBtn.style.display = 'flex';
        initPieceDimensionsScrollArrows();
      } else {
        if (wrapper) wrapper.classList.remove('kraft2026zion-scroll-enabled');
        if (leftBtn) leftBtn.style.display = 'none';
        if (rightBtn) rightBtn.style.display = 'none';
      }

      // Setup input handlers
      form.querySelectorAll('input').forEach(function(input) {
        input.addEventListener('input', function() {
          var val = parseFloat(input.value);
          var min = parseFloat(input.min);
          var max = parseFloat(input.max);
          var errSpan = input.parentNode.querySelector('.dim-range-error');
          var currentPiece = pieces[activePieceIndex];

          if (!isNaN(val) && val > 0) {
            if (!isNaN(min) && val < min) {
              input.classList.add('kraft2026zion-dim-out-of-range');
              if (errSpan) errSpan.textContent = 'Min ' + min;
              currentPiece.dimensions[input.dataset.key] = 0;
            } else if (!isNaN(max) && val > max) {
              input.classList.add('kraft2026zion-dim-out-of-range');
              if (errSpan) errSpan.textContent = 'Max ' + max;
              currentPiece.dimensions[input.dataset.key] = 0;
            } else {
              input.classList.remove('kraft2026zion-dim-out-of-range');
              if (errSpan) errSpan.textContent = '';
              currentPiece.dimensions[input.dataset.key] = val;
            }
          } else {
            input.classList.remove('kraft2026zion-dim-out-of-range');
            if (errSpan) errSpan.textContent = '';
            currentPiece.dimensions[input.dataset.key] = 0;
          }

          updatePieceDimensionValue(currentPiece);
          updatePieceTabStatuses();
          calculatePrice();
        });

        input.addEventListener('blur', function() {
          var val = parseFloat(input.value);
          var min = parseFloat(input.min);
          var max = parseFloat(input.max);
          var currentPiece = pieces[activePieceIndex];

          if (!isNaN(val) && val > 0) {
            if (!isNaN(min) && val < min) { input.value = min; val = min; }
            if (!isNaN(max) && val > max) { input.value = max; val = max; }
            input.classList.remove('kraft2026zion-dim-out-of-range');
            var errSpan = input.parentNode.querySelector('.dim-range-error');
            if (errSpan) errSpan.textContent = '';
            currentPiece.dimensions[input.dataset.key] = val;
            updatePieceDimensionValue(currentPiece);
            updatePieceTabStatuses();
            calculatePrice();
          }
        });
      });
    }

    function renderPieceFillTypes(piece, pieceConfig) {
      var grid = document.getElementById('piece-fill-grid-' + blockId);
      if (!grid) return;

      var fillTypes = getFilteredFillTypes(pieceConfig);
      if (!fillTypes.length) {
        grid.innerHTML = '<p>No fill types available</p>';
        return;
      }

      grid.innerHTML = fillTypes.map(function(f) {
        return '<div class="kraft2026zion-option-card' + (piece.fill && piece.fill.id === f.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-fill" data-id="' + f.id + '">' +
          (f.imageUrl ? '<img class="kraft2026zion-option-image" src="' + f.imageUrl + '" alt="' + f.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + f.name + '">' + f.name + '</div>' +
          '<div class="kraft2026zion-option-price">$' + f.pricePerCubicInch.toFixed(4) + '/cu in</div></div>';
      }).join('');

      // Initialize scroll arrows
      initPieceSectionScrollArrows('piece-fill');
    }

    function renderPiecePipingOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-piping-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredPipingOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No piping options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.piping && piece.piping.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-piping" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');

      // Initialize scroll arrows
      initPieceSectionScrollArrows('piece-piping');
    }

    function renderPieceButtonOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-button-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredButtonOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No button style options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.button && piece.button.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-button" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');

      // Initialize scroll arrows
      initPieceSectionScrollArrows('piece-button');
    }

    function renderPieceAntiSkidOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-antiskid-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredAntiSkidOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No anti-skid options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.antiSkid && piece.antiSkid.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-antiskid" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');

      // Initialize scroll arrows
      initPieceSectionScrollArrows('piece-antiskid');
    }

    function renderPieceTiesOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-ties-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredTiesOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No ties options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.ties && piece.ties.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-ties" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
      }).join('');

      // Initialize scroll arrows
      initPieceSectionScrollArrows('piece-ties');
    }

    function renderPieceDesignOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-design-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredDesignOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No design options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.design && piece.design.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-design" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');

      initPieceSectionScrollArrows('piece-design');
    }

    function renderPieceFabricTiesOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-fabricties-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredFabricTiesOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No fabric ties options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.fabricTies && piece.fabricTies.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-fabricties" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
      }).join('');

      initPieceSectionScrollArrows('piece-fabricties');
    }

    function renderPieceRodPocketOptions(piece, pieceConfig) {
      var grid = document.getElementById('piece-rodpocket-grid-' + blockId);
      if (!grid) return;

      var options = getFilteredRodPocketOptions(pieceConfig);
      if (!options.length) {
        grid.innerHTML = '<p>No bottom rod pocket options available</p>';
        return;
      }

      grid.innerHTML = options.map(function(o) {
        return '<div class="kraft2026zion-option-card' + (piece.rodPocket && piece.rodPocket.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-rodpocket" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');

      initPieceSectionScrollArrows('piece-rodpocket');
    }

    function initPieceSectionScrollArrows(prefix) {
      setupScrollArrows(
        document.getElementById(prefix + '-scroll-wrapper-' + blockId),
        document.getElementById(prefix + '-scroll-left-' + blockId),
        document.getElementById(prefix + '-scroll-right-' + blockId)
      );
    }

    function initPieceDimensionsScrollArrows() {
      var w = document.getElementById('piece-dimensions-scroll-wrapper-' + blockId);
      var l = document.getElementById('piece-dimensions-scroll-left-' + blockId);
      var r = document.getElementById('piece-dimensions-scroll-right-' + blockId);
      if (!w || !l || !r) return;
      var st = function() { l.disabled = w.scrollLeft <= 0; r.disabled = w.scrollLeft + w.clientWidth >= w.scrollWidth - 1; };
      var nl = l.cloneNode(true), nr = r.cloneNode(true);
      l.parentNode.replaceChild(nl, l); r.parentNode.replaceChild(nr, r);
      nl.onclick = function() { w.scrollBy({ left: -176, behavior: 'smooth' }); };
      nr.onclick = function() { w.scrollBy({ left: 176, behavior: 'smooth' }); };
      w.onscroll = st; setTimeout(st, 100);
    }

    function renderPieceFabricSection() {
      var cont = document.getElementById('piece-fabric-categories-' + blockId);
      if (!cont) return;

      var categories = config.fabricCategories || [];

      if (categories.length === 0) {
        cont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabric categories available</p>';
        return;
      }

      var html = '';

      // If multiple categories, show tabs
      if (categories.length > 1) {
        html += '<div class="kraft2026zion-fabric-category-tabs">';
        categories.forEach(function(cat, idx) {
          html += '<button type="button" class="kraft2026zion-fabric-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-category-id="' + cat.id + '" data-category-name="' + cat.name + '">' + cat.name + '</button>';
        });
        html += '</div>';
      }

      // Fabric preview container
      html += '<div class="kraft2026zion-fabric-preview-container" id="piece-fabric-preview-container-' + blockId + '"></div>';

      cont.innerHTML = html;

      // Setup tab click handlers
      cont.querySelectorAll('.fabric-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          cont.querySelectorAll('.fabric-tab').forEach(function(t) { t.classList.remove('kraft2026zion-active'); });
          tab.classList.add('kraft2026zion-active');
          loadPieceFabricPreviews(tab.dataset.categoryId, tab.dataset.categoryName);
        });
      });

      // Load first category's fabrics
      if (categories.length > 0) {
        loadPieceFabricPreviews(categories[0].id, categories[0].name);
      }
    }

    async function loadPieceFabricPreviews(categoryId, categoryName) {
      var previewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
      if (!previewCont) return;

      // Check cache
      if (categoryFabricPreviews[categoryId]) {
        renderPieceFabricPreviews(categoryFabricPreviews[categoryId], categoryId, categoryName);
        autoSelectDefaultFabricForPiece(categoryFabricPreviews[categoryId], categoryId);
        return;
      }

      previewCont.innerHTML = '<div class="kraft2026zion-fabric-preview-loading"><div class="kraft2026zion-loading-spinner-small"></div></div>';

      try {
        var params = new URLSearchParams({ shop: shopDomain, categoryId: categoryId, limit: 5, page: 1 });
        var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
        if (!response.ok) throw new Error('Failed to load fabrics');
        var data = await response.json();
        categoryFabricPreviews[categoryId] = data;
        renderPieceFabricPreviews(data, categoryId, categoryName);
        autoSelectDefaultFabricForPiece(data, categoryId);
      } catch (error) {
        console.error('Error loading piece fabric previews:', error);
        previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">Failed to load fabrics</p>';
      }
    }

    function autoSelectDefaultFabricForPiece(data, categoryId) {
      if (selectedFabric) return;

      var fabrics = data.fabrics || [];
      var defaultFabric = null;

      // Check config.defaultFabricId first
      if (config.defaultFabricId) {
        defaultFabric = fabrics.find(function(f) { return f.id === config.defaultFabricId; });
      }

      // Check for isDefault flag
      if (!defaultFabric) {
        defaultFabric = fabrics.find(function(f) { return f.isDefault; });
      }

      // Check category config for default fabric
      if (!defaultFabric) {
        var category = (config.fabricCategories || []).find(function(c) { return c.id === categoryId; });
        if (category && category.defaultFabric) {
          defaultFabric = category.defaultFabric;
        }
      }

      if (defaultFabric) {
        selectFabric(defaultFabric);
        var previewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
        if (previewCont) {
          previewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(thumb) {
            thumb.classList.toggle('kraft2026zion-selected', thumb.dataset.fabricId === defaultFabric.id);
          });
        }
      }
    }

    function renderPieceFabricPreviews(data, categoryId, categoryName) {
      var previewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
      if (!previewCont) return;

      var fabrics = data.fabrics || [];
      var totalCount = data.pagination ? data.pagination.totalCount : fabrics.length;

      if (fabrics.length === 0) {
        previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabrics in this category</p>';
        return;
      }

      var html = '<div class="kraft2026zion-fabric-preview-grid">';
      fabrics.forEach(function(f) {
        var isSelected = selectedFabric && selectedFabric.id === f.id;
        var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + TIER_LABELS[f.priceTier] + '</span>' : '';
        html += '<div class="kraft2026zion-fabric-preview-thumb' + (isSelected ? ' kraft2026zion-selected' : '') + '" data-fabric-id="' + f.id + '" data-category-id="' + categoryId + '" data-category-name="' + (categoryName || '') + '">' +
          (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span class="kraft2026zion-no-img">?</span>') +
          tierBadge +
          '</div>';
      });

      // View all button if more fabrics exist
      if (totalCount > 5) {
        html += '<div class="kraft2026zion-fabric-preview-thumb fabric-view-all-block" data-category-id="' + categoryId + '" data-category-name="' + (categoryName || '') + '">' +
          '<span class="kraft2026zion-view-all-text">+' + (totalCount - 5) + '<br>more</span>' +
          '</div>';
      }

      html += '</div>';
      previewCont.innerHTML = html;

      // Click handlers for fabric thumbs
      previewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          // Check if it's the "view all" block
          if (thumb.classList.contains('kraft2026zion-fabric-view-all-block')) {
            openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
            return;
          }
          var fabricId = thumb.dataset.fabricId;
          var fabric = fabrics.find(function(f) { return f.id === fabricId; });
          if (fabric) {
            // Select and open modal
            selectFabric(fabric);
            openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
          }
        });
      });
    }

    function setupPieceSectionListeners() {
      var pieceContent = document.getElementById('pieces-content-' + blockId);
      if (!pieceContent) return;

      // Add click handlers for piece section headers (accordion toggle) - using accordion-header class
      pieceContent.querySelectorAll('.accordion-header').forEach(function(header) {
        header.addEventListener('click', function() {
          var section = header.closest('.accordion-section');
          var content = section.querySelector('.accordion-content');
          var isOpen = content.classList.contains('kraft2026zion-open');

          // Close all other sections
          pieceContent.querySelectorAll('.accordion-content').forEach(function(c) {
            c.classList.remove('kraft2026zion-open');
          });
          pieceContent.querySelectorAll('.accordion-header').forEach(function(h) {
            h.classList.remove('kraft2026zion-active');
          });

          // Toggle current section
          if (!isOpen) {
            content.classList.add('kraft2026zion-open');
            header.classList.add('kraft2026zion-active');
          }
        });
      });

      // Open first section by default
      var firstSection = pieceContent.querySelector('.accordion-section');
      if (firstSection) {
        var firstHeader = firstSection.querySelector('.accordion-header');
        var firstContent = firstSection.querySelector('.accordion-content');
        if (firstHeader && firstContent) {
          firstHeader.classList.add('kraft2026zion-active');
          firstContent.classList.add('kraft2026zion-open');
        }
      }

      pieceContent.addEventListener('click', function(e) {
        var card = e.target.closest('.option-card');
        if (!card) return;

        var type = card.dataset.type;
        var id = card.dataset.id;
        var currentPiece = pieces[activePieceIndex];
        var pieceConfig = currentPiece.config;

        if (type === 'piece-shape') {
          var shape = getFilteredShapes(pieceConfig).find(function(s) { return s.id === id; });
          if (shape) {
            currentPiece.shape = shape;
            currentPiece.dimensions = {};
            shape.inputFields.forEach(function(f) {
              var v = parseFloat(f.defaultValue);
              if (!isNaN(v) && v > 0) currentPiece.dimensions[f.key] = v;
            });

            // Update UI
            pieceContent.querySelectorAll('[data-type="piece-shape"]').forEach(function(c) {
              c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
            });
            var valueEl = document.getElementById('piece-value-shape-' + blockId);
            if (valueEl) {
              valueEl.textContent = shape.name;
              valueEl.classList.add('kraft2026zion-selected');
            }

            renderPieceDimensions(currentPiece);
            updatePieceDimensionValue(currentPiece);
            updatePieceTabStatuses();
            calculatePrice();
          }
        } else if (type === 'piece-fill') {
          var fill = getFilteredFillTypes(pieceConfig).find(function(f) { return f.id === id; });
          if (fill) {
            currentPiece.fill = fill;
            pieceContent.querySelectorAll('[data-type="piece-fill"]').forEach(function(c) {
              c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
            });
            var valueEl = document.getElementById('piece-value-fill-' + blockId);
            if (valueEl) {
              valueEl.textContent = fill.name;
              valueEl.classList.add('kraft2026zion-selected');
            }
            updatePieceTabStatuses();
            calculatePrice();
          }
        } else if (type === 'piece-piping') {
          var opt = getFilteredPipingOptions(pieceConfig).find(function(p) { return p.id === id; });
          currentPiece.piping = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-piping"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-piping-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        } else if (type === 'piece-button') {
          var opt = getFilteredButtonOptions(pieceConfig).find(function(b) { return b.id === id; });
          currentPiece.button = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-button"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-button-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        } else if (type === 'piece-antiskid') {
          var opt = getFilteredAntiSkidOptions(pieceConfig).find(function(a) { return a.id === id; });
          currentPiece.antiSkid = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-antiskid"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-antiskid-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        } else if (type === 'piece-ties') {
          var opt = getFilteredTiesOptions(pieceConfig).find(function(t) { return t.id === id; });
          currentPiece.ties = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-ties"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-ties-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        } else if (type === 'piece-design') {
          var opt = getFilteredDesignOptions(pieceConfig).find(function(d) { return d.id === id; });
          currentPiece.design = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-design"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-design-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        } else if (type === 'piece-fabricties') {
          var opt = getFilteredFabricTiesOptions(pieceConfig).find(function(ft) { return ft.id === id; });
          currentPiece.fabricTies = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-fabricties"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-fabricties-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        } else if (type === 'piece-rodpocket') {
          var opt = getFilteredRodPocketOptions(pieceConfig).find(function(rp) { return rp.id === id; });
          currentPiece.rodPocket = opt || null;
          pieceContent.querySelectorAll('[data-type="piece-rodpocket"]').forEach(function(c) {
            c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
          });
          var valueEl = document.getElementById('piece-value-rodpocket-' + blockId);
          if (valueEl) {
            valueEl.textContent = opt ? opt.name : 'Not selected';
            valueEl.classList.toggle('kraft2026zion-selected', !!opt);
          }
          calculatePrice();
        }
      });
    }

    function updatePieceDimensionValue(piece) {
      var valueEl = document.getElementById('piece-value-dimensions-' + blockId);
      if (!valueEl) return;

      var keys = Object.keys(piece.dimensions);
      if (keys.length === 0 || keys.every(function(k) { return !piece.dimensions[k]; })) {
        valueEl.textContent = 'Not set';
        valueEl.classList.remove('kraft2026zion-selected');
      } else {
        var vals = keys.filter(function(k) { return piece.dimensions[k]; }).map(function(k) { return piece.dimensions[k] + '"'; }).join(' x ');
        valueEl.textContent = vals;
        valueEl.classList.add('kraft2026zion-selected');
      }
    }

    function applySectionVisibility() {
      const v = config.sectionVisibility || {};
      const sections = [
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
        { key: 'instructions', show: v.showInstructions !== false },
      ];
      let num = 1;
      sections.forEach(function(s) {
        const el = container.querySelector('[data-section="' + s.key + '"]');
        if (el) {
          if (s.show) {
            el.style.display = 'block';
            const title = el.querySelector('.header-title');
            if (title) title.textContent = num + '. ' + title.textContent.replace(/^\d+\.\s*/, '');
            num++;
          } else {
            el.style.display = 'none';
          }
        }
      });
    }

    function openFirstVisibleSection() {
      const v = config.sectionVisibility || {};
      const order = ['shape', 'dimensions', 'fill', 'fabric', 'design', 'piping', 'button', 'antiskid', 'rodpocket', 'ties', 'fabricties', 'instructions'];
      const map = { shape: v.showShapeSection !== false, dimensions: v.showDimensionsSection !== false, fill: v.showFillSection !== false, fabric: v.showFabricSection !== false, design: v.showDesignSection !== false, piping: v.showPipingSection !== false, button: v.showButtonSection !== false, antiskid: v.showAntiSkidSection !== false, rodpocket: v.showRodPocketSection !== false, ties: v.showTiesSection !== false, fabricties: v.showFabricTiesSection !== false, instructions: v.showInstructions !== false };
      for (var i = 0; i < order.length; i++) { if (map[order[i]]) { toggleSection(order[i], true); break; } }
    }

    function renderShapes() {
      const grid = document.getElementById('shape-grid-' + blockId);
      if (!config.shapes.length) { grid.innerHTML = '<p>No shapes available</p>'; return; }
      grid.innerHTML = config.shapes.map(function(s) {
        return '<div class="kraft2026zion-option-card" data-type="shape" data-id="' + s.id + '">' +
          (s.imageUrl ? '<img class="kraft2026zion-option-image" src="' + s.imageUrl + '" alt="' + s.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + s.name + '">' + s.name + '</div></div>';
      }).join('');
      initSectionScrollArrows('shape');
    }

    function renderFillTypes() {
      const grid = document.getElementById('fill-grid-' + blockId);
      if (!config.fillTypes.length) { grid.innerHTML = '<p>No fill types available</p>'; return; }
      grid.innerHTML = config.fillTypes.map(function(f) {
        return '<div class="kraft2026zion-option-card" data-type="fill" data-id="' + f.id + '">' +
          (f.imageUrl ? '<img class="kraft2026zion-option-image" src="' + f.imageUrl + '" alt="' + f.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + f.name + '">' + f.name + '</div>' +
          '<div class="kraft2026zion-option-price">$' + f.pricePerCubicInch.toFixed(4) + '/cu in</div></div>';
      }).join('');
      initSectionScrollArrows('fill');
    }

    function renderFabrics() {
      fabricNavLevel = 'categories';
      fabricNavCategoryId = null;
      renderCategoryGrid();

      // If multi-piece mode, also render in shared fabric container
      if (isMultiPieceMode) {
        renderSharedFabricCategoryGrid();
      }
    }

    function renderSharedFabricCategoryGrid() {
      var cont = document.getElementById('shared-fabric-categories-' + blockId);
      if (!cont) return;

      var categories = config.fabricCategories || [];

      if (categories.length === 0) {
        cont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabric categories available</p>';
        return;
      }

      var html = '';

      // If multiple categories, show tabs
      if (categories.length > 1) {
        html += '<div class="kraft2026zion-fabric-category-tabs">';
        categories.forEach(function(cat, idx) {
          html += '<button type="button" class="kraft2026zion-fabric-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-category-id="' + cat.id + '" data-category-name="' + cat.name + '">' + cat.name + '</button>';
        });
        html += '</div>';
      }

      // Fabric preview container
      html += '<div class="kraft2026zion-fabric-preview-container" id="shared-fabric-preview-container-' + blockId + '"></div>';

      cont.innerHTML = html;

      // Setup tab click handlers
      cont.querySelectorAll('.fabric-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          cont.querySelectorAll('.fabric-tab').forEach(function(t) { t.classList.remove('kraft2026zion-active'); });
          tab.classList.add('kraft2026zion-active');
          loadSharedFabricPreviews(tab.dataset.categoryId, tab.dataset.categoryName);
        });
      });

      // Load first category's fabrics
      if (categories.length > 0) {
        loadSharedFabricPreviews(categories[0].id, categories[0].name);
      }
    }

    async function loadSharedFabricPreviews(categoryId, categoryName) {
      var previewCont = document.getElementById('shared-fabric-preview-container-' + blockId);
      if (!previewCont) return;

      // Check cache
      if (categoryFabricPreviews[categoryId]) {
        renderSharedFabricPreviews(categoryFabricPreviews[categoryId], categoryId, categoryName);
        return;
      }

      previewCont.innerHTML = '<div class="kraft2026zion-fabric-preview-loading"><div class="kraft2026zion-loading-spinner-small"></div></div>';

      try {
        var params = new URLSearchParams({ shop: shopDomain, categoryId: categoryId, limit: 5, page: 1 });
        var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
        if (!response.ok) throw new Error('Failed to load fabrics');
        var data = await response.json();
        categoryFabricPreviews[categoryId] = data;
        renderSharedFabricPreviews(data, categoryId, categoryName);
      } catch (error) {
        console.error('Error loading shared fabric previews:', error);
        previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">Failed to load fabrics</p>';
      }
    }

    function renderSharedFabricPreviews(data, categoryId, categoryName) {
      var previewCont = document.getElementById('shared-fabric-preview-container-' + blockId);
      if (!previewCont) return;

      var fabrics = data.fabrics || [];
      var totalCount = data.pagination ? data.pagination.totalCount : fabrics.length;

      if (fabrics.length === 0) {
        previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabrics in this category</p>';
        return;
      }

      var html = '<div class="kraft2026zion-fabric-preview-grid">';
      fabrics.forEach(function(f) {
        var isSelected = selectedFabric && selectedFabric.id === f.id;
        var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + TIER_LABELS[f.priceTier] + '</span>' : '';
        html += '<div class="kraft2026zion-fabric-preview-thumb' + (isSelected ? ' kraft2026zion-selected' : '') + '" data-fabric-id="' + f.id + '" data-category-id="' + categoryId + '" data-category-name="' + categoryName + '">' +
          (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span class="kraft2026zion-no-img">?</span>') +
          tierBadge +
          '</div>';
      });

      // Add "View All" block at the end if more fabrics available
      if (totalCount > 5) {
        html += '<div class="kraft2026zion-fabric-preview-thumb fabric-view-all-block" data-category-id="' + categoryId + '" data-category-name="' + categoryName + '">' +
          '<span class="kraft2026zion-view-all-text">+' + (totalCount - 5) + '<br>more</span>' +
          '</div>';
      }
      html += '</div>';

      previewCont.innerHTML = html;

      // Store fabrics for selection
      previewCont._fabrics = fabrics;

      // Click handlers for previews
      previewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          // Check if it's the "view all" block
          if (thumb.classList.contains('kraft2026zion-fabric-view-all-block')) {
            openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
            return;
          }

          var fabricId = thumb.dataset.fabricId;
          var fabric = fabrics.find(function(f) { return f.id === fabricId; });
          if (fabric) {
            selectFabric(fabric);
            // Update selection state in shared fabric preview
            previewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(t) {
              t.classList.toggle('kraft2026zion-selected', t.dataset.fabricId === fabricId);
            });
            openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
          }
        });
      });
    }

    var categoryFabricPreviews = {};

    function renderCategoryGrid() {
      const cont = document.getElementById('fabric-categories-' + blockId);
      const categories = config.fabricCategories || [];

      if (categories.length === 0) {
        cont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabric categories available</p>';
        return;
      }

      var html = '';

      // If multiple categories, show tabs
      if (categories.length > 1) {
        html += '<div class="kraft2026zion-fabric-category-tabs">';
        categories.forEach(function(cat, idx) {
          html += '<button type="button" class="kraft2026zion-fabric-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-category-id="' + cat.id + '" data-category-name="' + cat.name + '">' + cat.name + '</button>';
        });
        html += '</div>';
      }

      // Fabric preview container
      html += '<div class="kraft2026zion-fabric-preview-container" id="fabric-preview-container-' + blockId + '"></div>';

      cont.innerHTML = html;

      // Setup tab click handlers
      cont.querySelectorAll('.fabric-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          cont.querySelectorAll('.fabric-tab').forEach(function(t) { t.classList.remove('kraft2026zion-active'); });
          tab.classList.add('kraft2026zion-active');
          loadCategoryFabricPreviews(tab.dataset.categoryId, tab.dataset.categoryName);
        });
      });

      // Load first category's fabrics
      if (categories.length > 0) {
        loadCategoryFabricPreviews(categories[0].id, categories[0].name);
      }
    }

    async function loadCategoryFabricPreviews(categoryId, categoryName) {
      var previewCont = document.getElementById('fabric-preview-container-' + blockId);
      if (!previewCont) return;

      // Check cache
      if (categoryFabricPreviews[categoryId]) {
        renderFabricPreviews(categoryFabricPreviews[categoryId], categoryId, categoryName);
        autoSelectDefaultFabric(categoryFabricPreviews[categoryId], categoryId);
        return;
      }

      previewCont.innerHTML = '<div class="kraft2026zion-fabric-preview-loading"><div class="kraft2026zion-loading-spinner-small"></div></div>';

      try {
        var params = new URLSearchParams({ shop: shopDomain, categoryId: categoryId, limit: 5, page: 1 });
        var response = await fetch('/apps/cushion-api/fabrics-paginated?' + params.toString());
        if (!response.ok) throw new Error('Failed to load fabrics');
        var data = await response.json();
        categoryFabricPreviews[categoryId] = data;
        renderFabricPreviews(data, categoryId, categoryName);
        autoSelectDefaultFabric(data, categoryId);
      } catch (error) {
        console.error('Error loading category fabrics:', error);
        previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">Failed to load fabrics</p>';
      }
    }

    function autoSelectDefaultFabric(data, categoryId) {
      // Don't override if user already selected a fabric
      if (selectedFabric) return;

      var fabrics = data.fabrics || [];

      // Check for default in loaded fabrics
      var defaultFabric = fabrics.find(function(f) { return f.isDefault; });

      // If not in preview list, check category config for default fabric
      if (!defaultFabric) {
        var category = (config.fabricCategories || []).find(function(c) { return c.id === categoryId; });
        if (category && category.defaultFabric) {
          defaultFabric = category.defaultFabric;
        }
      }

      // Auto-select if found
      if (defaultFabric) {
        selectFabric(defaultFabric);
        // Update preview grid selected state
        var previewCont = document.getElementById('fabric-preview-container-' + blockId);
        if (previewCont) {
          previewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(thumb) {
            thumb.classList.toggle('kraft2026zion-selected', thumb.dataset.fabricId === defaultFabric.id);
          });
        }
      }
    }

    function renderFabricPreviews(data, categoryId, categoryName) {
      var previewCont = document.getElementById('fabric-preview-container-' + blockId);
      if (!previewCont) return;

      var fabrics = data.fabrics || [];
      var totalCount = data.pagination ? data.pagination.totalCount : fabrics.length;

      if (fabrics.length === 0) {
        previewCont.innerHTML = '<p class="kraft2026zion-no-fabrics-msg">No fabrics in this category</p>';
        return;
      }

      var html = '<div class="kraft2026zion-fabric-preview-grid">';
      fabrics.forEach(function(f) {
        var isSelected = selectedFabric && selectedFabric.id === f.id;
        var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + TIER_LABELS[f.priceTier] + '</span>' : '';
        html += '<div class="kraft2026zion-fabric-preview-thumb' + (isSelected ? ' kraft2026zion-selected' : '') + '" data-fabric-id="' + f.id + '" data-category-id="' + categoryId + '" data-category-name="' + categoryName + '">' +
          (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span class="kraft2026zion-no-img">?</span>') +
          tierBadge +
          '</div>';
      });

      // Add "View All" block at the end if more fabrics available
      if (totalCount > 5) {
        html += '<div class="kraft2026zion-fabric-preview-thumb fabric-view-all-block" data-category-id="' + categoryId + '" data-category-name="' + categoryName + '">' +
          '<span class="kraft2026zion-view-all-text">+' + (totalCount - 5) + '<br>more</span>' +
          '</div>';
      }
      html += '</div>';

      previewCont.innerHTML = html;

      // Store fabrics for selection
      previewCont._fabrics = fabrics;

      // Click handlers for previews
      previewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          // Check if it's the "view all" block
          if (thumb.classList.contains('kraft2026zion-fabric-view-all-block')) {
            openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
            return;
          }

          var fabricId = thumb.dataset.fabricId;
          var fabric = fabrics.find(function(f) { return f.id === fabricId; });
          if (fabric) {
            // Select and open modal
            selectFabric(fabric);
            openFabricBrowserPopup(thumb.dataset.categoryId, thumb.dataset.categoryName);
          }
        });
      });
    }

    function renderPipingOptions() {
      const grid = document.getElementById('piping-grid-' + blockId);
      if (!config.pipingOptions.length) { grid.innerHTML = '<p>No piping options available</p>'; return; }
      grid.innerHTML = config.pipingOptions.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="piping" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');
      initSectionScrollArrows('piping');
    }

    function renderButtonOptions() {
      const grid = document.getElementById('button-grid-' + blockId);
      const opts = config.buttonStyleOptions || [];
      if (!opts.length) { grid.innerHTML = '<p>No button style options available</p>'; return; }
      grid.innerHTML = opts.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="button" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');
      initSectionScrollArrows('button');
    }

    function renderAntiSkidOptions() {
      const grid = document.getElementById('antiskid-grid-' + blockId);
      const opts = config.antiSkidOptions || [];
      if (!opts.length) { grid.innerHTML = '<p>No anti-skid options available</p>'; return; }
      grid.innerHTML = opts.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="antiskid" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');
      initSectionScrollArrows('antiskid');
    }

    function renderTiesOptions() {
      const grid = document.getElementById('ties-grid-' + blockId);
      const opts = config.tiesOptions || [];
      if (!opts.length) { grid.innerHTML = '<p>No ties options available</p>'; return; }
      grid.innerHTML = opts.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="ties" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
      }).join('');
      initSectionScrollArrows('ties');
    }

    function renderDesignOptions() {
      const grid = document.getElementById('design-grid-' + blockId);
      const opts = config.designOptions || [];
      if (!opts.length) { grid.innerHTML = '<p>No design options available</p>'; return; }
      grid.innerHTML = opts.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="design" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');
      initSectionScrollArrows('design');
    }

    function renderFabricTiesOptions() {
      const grid = document.getElementById('fabricties-grid-' + blockId);
      const opts = config.fabricTiesOptions || [];
      if (!opts.length) { grid.innerHTML = '<p>No fabric ties options available</p>'; return; }
      grid.innerHTML = opts.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="fabricties" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
      }).join('');
      initSectionScrollArrows('fabricties');
    }

    function renderRodPocketOptions() {
      const grid = document.getElementById('rodpocket-grid-' + blockId);
      const opts = config.rodPocketOptions || [];
      if (!opts.length) { grid.innerHTML = '<p>No bottom rod pocket options available</p>'; return; }
      grid.innerHTML = opts.map(function(o) {
        return '<div class="kraft2026zion-option-card" data-type="rodpocket" data-id="' + o.id + '">' +
          (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
          '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
      }).join('');
      initSectionScrollArrows('rodpocket');
    }

    function setupScrollArrows(w, l, r) {
      if (!w || !l || !r) return;
      var s = 160;
      var nl = l.cloneNode(true), nr = r.cloneNode(true);
      l.parentNode.replaceChild(nl, l); r.parentNode.replaceChild(nr, r);
      var upd = function() { var ns = w.scrollWidth > w.clientWidth; nl.style.display = nr.style.display = ns ? 'flex' : 'none'; if (ns) st(); };
      var st = function() { nl.disabled = w.scrollLeft <= 0; nr.disabled = w.scrollLeft + w.clientWidth >= w.scrollWidth - 1; };
      nl.onclick = function() { w.scrollBy({ left: -s, behavior: 'smooth' }); };
      nr.onclick = function() { w.scrollBy({ left: s, behavior: 'smooth' }); };
      w.onscroll = st; setTimeout(upd, 100); window.addEventListener('resize', upd);
    }

    function initSectionScrollArrows(n) {
      setupScrollArrows(document.getElementById(n + '-scroll-wrapper-' + blockId), document.getElementById(n + '-scroll-left-' + blockId), document.getElementById(n + '-scroll-right-' + blockId));
    }

    function renderDimensionFields(shape) {
      const form = document.getElementById('dimensions-form-' + blockId);
      const wrapper = document.getElementById('dimensions-scroll-wrapper-' + blockId);
      const leftBtn = document.getElementById('dimensions-scroll-left-' + blockId);
      const rightBtn = document.getElementById('dimensions-scroll-right-' + blockId);
      const panelsContainer = document.getElementById('panels-input-container-' + blockId);
      const panelRadios = document.querySelectorAll('input[name="panels-' + blockId + '"]');

      if (!shape || !shape.inputFields.length) {
        form.innerHTML = '<p>Select a shape first</p>';
        wrapper.classList.remove('kraft2026zion-scroll-enabled');
        leftBtn.style.display = 'none';
        rightBtn.style.display = 'none';
        if (panelsContainer) panelsContainer.style.display = 'none';
        return;
      }

      form.innerHTML = shape.inputFields.map(function(f) {
        return '<div class="kraft2026zion-dim-field"><label for="dim-' + f.key + '-' + blockId + '">' + f.label + (f.required ? ' *' : '') + '</label>' +
          '<input type="number" id="dim-' + f.key + '-' + blockId + '" data-key="' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="0.5" value="' + (f.defaultValue || '') + '" placeholder="' + f.min + '-' + f.max + '" ' + (f.required ? 'required' : '') + '>' +
          '<span class="kraft2026zion-dim-unit">' + f.unit + '</span>' +
          '<span class="kraft2026zion-dim-range-error"></span></div>';
      }).join('');

      if (shape.inputFields.length > 3) {
        wrapper.classList.add('kraft2026zion-scroll-enabled');
        leftBtn.style.display = 'flex';
        rightBtn.style.display = 'flex';
        initDimensionsScrollArrows();
      } else {
        wrapper.classList.remove('kraft2026zion-scroll-enabled');
        leftBtn.style.display = 'none';
        rightBtn.style.display = 'none';
      }

      // Handle panels radio buttons visibility for 2D shapes
      if (panelsContainer && panelRadios.length > 0) {
        if (shape.is2D && shape.enablePanels) {
          panelsContainer.style.display = 'block';
          panelRadios.forEach(function(radio) {
            radio.checked = (parseInt(radio.value) === panelCount);
            radio.onchange = function() {
              panelCount = parseInt(this.value);
              calculatePrice();
            };
          });
        } else {
          panelsContainer.style.display = 'none';
          panelCount = 1;
        }
      }

      form.querySelectorAll('input').forEach(function(input) {
        input.addEventListener('input', function() {
          var val = parseFloat(input.value);
          var min = parseFloat(input.min);
          var max = parseFloat(input.max);
          var errSpan = input.parentNode.querySelector('.dim-range-error');
          if (!isNaN(val) && val > 0) {
            if (!isNaN(min) && val < min) {
              input.classList.add('kraft2026zion-dim-out-of-range');
              if (errSpan) errSpan.textContent = 'Min ' + min;
              dimensions[input.dataset.key] = 0;
            } else if (!isNaN(max) && val > max) {
              input.classList.add('kraft2026zion-dim-out-of-range');
              if (errSpan) errSpan.textContent = 'Max ' + max;
              dimensions[input.dataset.key] = 0;
            } else {
              input.classList.remove('kraft2026zion-dim-out-of-range');
              if (errSpan) errSpan.textContent = '';
              dimensions[input.dataset.key] = val;
            }
          } else {
            input.classList.remove('kraft2026zion-dim-out-of-range');
            if (errSpan) errSpan.textContent = '';
            dimensions[input.dataset.key] = 0;
          }
          updateDimensionValue();
          calculatePrice();
        });
        input.addEventListener('blur', function() {
          var val = parseFloat(input.value);
          var min = parseFloat(input.min);
          var max = parseFloat(input.max);
          if (!isNaN(val) && val > 0) {
            if (!isNaN(min) && val < min) { input.value = min; val = min; }
            if (!isNaN(max) && val > max) { input.value = max; val = max; }
            input.classList.remove('kraft2026zion-dim-out-of-range');
            var errSpan = input.parentNode.querySelector('.dim-range-error');
            if (errSpan) errSpan.textContent = '';
            dimensions[input.dataset.key] = val;
            updateDimensionValue();
            calculatePrice();
          }
        });
      });
    }

    function initDimensionsScrollArrows() {
      var w = document.getElementById('dimensions-scroll-wrapper-' + blockId);
      var l = document.getElementById('dimensions-scroll-left-' + blockId);
      var r = document.getElementById('dimensions-scroll-right-' + blockId);
      if (!w || !l || !r) return;
      var st = function() { l.disabled = w.scrollLeft <= 0; r.disabled = w.scrollLeft + w.clientWidth >= w.scrollWidth - 1; };
      var nl = l.cloneNode(true), nr = r.cloneNode(true);
      l.parentNode.replaceChild(nl, l); r.parentNode.replaceChild(nr, r);
      nl.onclick = function() { w.scrollBy({ left: -176, behavior: 'smooth' }); };
      nr.onclick = function() { w.scrollBy({ left: 176, behavior: 'smooth' }); };
      w.onscroll = st; setTimeout(st, 100);
    }

    function selectShape(shape) {
      selectedShape = shape;
      panelCount = 1; // Reset panels when shape changes
      document.querySelectorAll('#shape-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === shape.id); });
      document.getElementById('value-shape-' + blockId).textContent = shape.name;
      document.getElementById('value-shape-' + blockId).classList.add('kraft2026zion-selected');
      renderDimensionFields(shape);
      dimensions = {};
      shape.inputFields.forEach(function(f) { var v = parseFloat(f.defaultValue); if (!isNaN(v) && v > 0) dimensions[f.key] = v; });
      updateDimensionValue();
      calculatePrice();
    }

    function selectFill(fill) {
      selectedFill = fill;
      document.querySelectorAll('#fill-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === fill.id); });
      document.getElementById('value-fill-' + blockId).textContent = fill.name;
      document.getElementById('value-fill-' + blockId).classList.add('kraft2026zion-selected');
      calculatePrice();
    }

    function selectFabric(fabric) {
      selectedFabric = fabric;
      document.querySelectorAll('#fabric-categories-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === fabric.id); });
      document.getElementById('value-fabric-' + blockId).textContent = fabric.name;
      document.getElementById('value-fabric-' + blockId).classList.add('kraft2026zion-selected');

      // Also update piece-level fabric value in multi-piece mode
      if (isMultiPieceMode) {
        var pieceFabricValue = document.getElementById('piece-value-fabric-' + blockId);
        if (pieceFabricValue) {
          pieceFabricValue.textContent = fabric.name;
          pieceFabricValue.classList.add('kraft2026zion-selected');
        }

        // Update selection state in piece fabric preview
        var piecePreviewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
        if (piecePreviewCont) {
          piecePreviewCont.querySelectorAll('.fabric-preview-thumb').forEach(function(t) {
            t.classList.toggle('kraft2026zion-selected', t.dataset.fabricId === fabric.id);
          });
        }
      }

      calculatePrice();
    }

    function selectPiping(id) {
      selectedPiping = id === 'none' ? null : config.pipingOptions.find(function(p) { return p.id === id; });
      document.querySelectorAll('#piping-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-piping-' + blockId).textContent = selectedPiping ? selectedPiping.name : 'None';
      document.getElementById('value-piping-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedPiping);
      calculatePrice();
    }

    function selectButton(id) {
      var opts = config.buttonStyleOptions || [];
      selectedButton = id === 'none' ? null : opts.find(function(b) { return b.id === id; });
      document.querySelectorAll('#button-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-button-' + blockId).textContent = selectedButton ? selectedButton.name : 'None';
      document.getElementById('value-button-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedButton);
      calculatePrice();
    }

    function selectAntiSkid(id) {
      var opts = config.antiSkidOptions || [];
      selectedAntiSkid = id === 'none' ? null : opts.find(function(a) { return a.id === id; });
      document.querySelectorAll('#antiskid-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-antiskid-' + blockId).textContent = selectedAntiSkid ? selectedAntiSkid.name : 'None';
      document.getElementById('value-antiskid-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedAntiSkid);
      calculatePrice();
    }

    function selectTies(id) {
      var opts = config.tiesOptions || [];
      selectedTies = id === 'none' ? null : opts.find(function(t) { return t.id === id; });
      document.querySelectorAll('#ties-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-ties-' + blockId).textContent = selectedTies ? selectedTies.name : 'None';
      document.getElementById('value-ties-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedTies);
      calculatePrice();
    }

    function selectDesign(id) {
      var opts = config.designOptions || [];
      selectedDesign = id === 'none' ? null : opts.find(function(d) { return d.id === id; });
      document.querySelectorAll('#design-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-design-' + blockId).textContent = selectedDesign ? selectedDesign.name : 'None';
      document.getElementById('value-design-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedDesign);
      calculatePrice();
    }

    function selectFabricTies(id) {
      var opts = config.fabricTiesOptions || [];
      selectedFabricTies = id === 'none' ? null : opts.find(function(ft) { return ft.id === id; });
      document.querySelectorAll('#fabricties-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-fabricties-' + blockId).textContent = selectedFabricTies ? selectedFabricTies.name : 'None';
      document.getElementById('value-fabricties-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedFabricTies);
      calculatePrice();
    }

    function selectRodPocket(id) {
      var opts = config.rodPocketOptions || [];
      selectedRodPocket = id === 'none' ? null : opts.find(function(rp) { return rp.id === id; });
      document.querySelectorAll('#rodpocket-grid-' + blockId + ' .option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
      document.getElementById('value-rodpocket-' + blockId).textContent = selectedRodPocket ? selectedRodPocket.name : 'None';
      document.getElementById('value-rodpocket-' + blockId).classList.toggle('kraft2026zion-selected', !!selectedRodPocket);
      calculatePrice();
    }

    function updateDimensionValue() {
      var keys = Object.keys(dimensions);
      if (keys.length === 0 || keys.every(function(k) { return !dimensions[k]; })) {
        document.getElementById('value-dimensions-' + blockId).textContent = 'Not set';
        document.getElementById('value-dimensions-' + blockId).classList.remove('kraft2026zion-selected');
      } else {
        var vals = keys.filter(function(k) { return dimensions[k]; }).map(function(k) { return dimensions[k] + '"'; }).join(' x ');
        document.getElementById('value-dimensions-' + blockId).textContent = vals;
        document.getElementById('value-dimensions-' + blockId).classList.add('kraft2026zion-selected');
      }
    }

    function evaluateFormula(formula, vars) {
      try {
        if (!formula) return 0;
        var expr = formula;
        var sortedKeys = Object.keys(vars).sort(function(a, b) { return b.length - a.length; });
        for (var i = 0; i < sortedKeys.length; i++) {
          var key = sortedKeys[i];
          expr = expr.replace(new RegExp('\\b' + key + '\\b', 'g'), vars[key] || 0);
        }
        var result = new Function('return ' + expr)();
        return isNaN(result) ? 0 : result;
      } catch (e) { return 0; }
    }

    function getMarginTier(price) {
      if (!config) return null;
      var method = config.settings && config.settings.marginCalculationMethod ? config.settings.marginCalculationMethod : 'tier';
      if (method === 'formula') {
        if (price <= 0) return { adjustmentPercent: 0 };
        var flatThreshold = config.settings && config.settings.flatMarginThreshold != null ? config.settings.flatMarginThreshold : 50;
        var flatPercent = config.settings && config.settings.flatMarginPercent != null ? config.settings.flatMarginPercent : 100;
        var threshold = config.settings && config.settings.formulaThreshold != null ? config.settings.formulaThreshold : 400;
        var lowConst = config.settings && config.settings.formulaLowConstant != null ? config.settings.formulaLowConstant : 300;
        var lowCoef = config.settings && config.settings.formulaLowCoefficient != null ? config.settings.formulaLowCoefficient : 52;
        var highConst = config.settings && config.settings.formulaHighConstant != null ? config.settings.formulaHighConstant : 120;
        var highCoef = config.settings && config.settings.formulaHighCoefficient != null ? config.settings.formulaHighCoefficient : 20;
        var marginPercent;
        if (price <= flatThreshold) {
          marginPercent = flatPercent;
        } else if (price <= threshold) {
          marginPercent = lowConst - lowCoef * Math.log(price);
        } else {
          marginPercent = highConst - highCoef * Math.log(price);
        }
        return { adjustmentPercent: marginPercent };
      }
      if (!config.priceTiers || config.priceTiers.length === 0) return null;
      return config.priceTiers.find(function(t) { return price >= t.minPrice && price <= t.maxPrice; }) || null;
    }

    function calculatePrice() {
      if (isMultiPieceMode) {
        calculateMultiPiecePrice();
        return;
      }

      var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;
      var visibility = config.sectionVisibility || {};
      var hidden = config.hiddenValues || {};

      var effectiveFill = selectedFill;
      var effectiveFabric = selectedFabric;
      var effectiveDesign = selectedDesign;
      var effectivePiping = selectedPiping;
      var effectiveButton = selectedButton;
      var effectiveAntiSkid = selectedAntiSkid;
      var effectiveRodPocket = selectedRodPocket;
      var effectiveTies = selectedTies;
      var effectiveFabricTies = selectedFabricTies;

      if (visibility.showFillSection === false && hidden.fillType) effectiveFill = hidden.fillType;
      if (visibility.showFabricSection === false && hidden.fabric) effectiveFabric = hidden.fabric;
      if (visibility.showDesignSection === false && hidden.design) effectiveDesign = hidden.design;
      if (visibility.showPipingSection === false && hidden.piping) effectivePiping = hidden.piping;
      if (visibility.showButtonSection === false && hidden.button) effectiveButton = hidden.button;
      if (visibility.showAntiSkidSection === false && hidden.antiSkid) effectiveAntiSkid = hidden.antiSkid;
      if (visibility.showRodPocketSection === false && hidden.rodPocket) effectiveRodPocket = hidden.rodPocket;
      if (visibility.showTiesSection === false && hidden.ties) effectiveTies = hidden.ties;
      if (visibility.showFabricTiesSection === false && hidden.fabricTies) effectiveFabricTies = hidden.fabricTies;

      if (!selectedShape || !effectiveFill || !effectiveFabric) { updatePriceDisplay({}); return; }

      var allDimensionsSet = selectedShape.inputFields.filter(function(f) { return f.required; }).every(function(f) { return dimensions[f.key] && dimensions[f.key] > 0; });
      if (!allDimensionsSet) { updatePriceDisplay({}); return; }

      var surfaceArea = evaluateFormula(selectedShape.surfaceAreaFormula, dimensions);
      var volume = evaluateFormula(selectedShape.volumeFormula, dimensions);

      var conversionMultiplier = 1 + ((config.settings && config.settings.conversionPercent != null ? config.settings.conversionPercent : 0) / 100);
      var fabricCost = surfaceArea * (parseFloat(effectiveFabric.pricePerSqInch) || 0) * conversionMultiplier;
      var fillCost = volume * (parseFloat(effectiveFill.pricePerCubicInch) || 0) * conversionMultiplier;
      var tiesCost = effectiveTies ? (parseFloat(effectiveTies.price) || 0) * conversionMultiplier : 0;
      var fabricTiesCost = effectiveFabricTies ? (parseFloat(effectiveFabricTies.price) || 0) * conversionMultiplier : 0;

      var baseSubtotal = fabricCost + fillCost;

      // Design cost is % of fabric cost
      var designPct = effectiveDesign ? (parseFloat(effectiveDesign.percent) || 0) : 0;
      var designCost = fabricCost * (designPct / 100);

      var pipingPct = effectivePiping ? (parseFloat(effectivePiping.percent) || 0) : 0;
      var buttonPct = effectiveButton ? (parseFloat(effectiveButton.percent) || 0) : 0;
      var antiSkidPct = effectiveAntiSkid ? (parseFloat(effectiveAntiSkid.percent) || 0) : 0;
      var rodPocketPct = effectiveRodPocket ? (parseFloat(effectiveRodPocket.percent) || 0) : 0;
      var profilePct = config.profile ? (parseFloat(config.profile.additionalPercent) || 0) : 0;

      var pipingCost = baseSubtotal * (pipingPct / 100);
      var buttonCost = baseSubtotal * (buttonPct / 100);
      var antiSkidCost = baseSubtotal * (antiSkidPct / 100);
      var rodPocketCost = baseSubtotal * (rodPocketPct / 100);
      var profileCost = baseSubtotal * (profilePct / 100);

      var subtotalAfterAddons = baseSubtotal + designCost + pipingCost + tiesCost + fabricTiesCost + buttonCost + antiSkidCost + rodPocketCost + profileCost;

      var shippingPct = config.settings && config.settings.shippingPercent != null ? config.settings.shippingPercent : 100;
      var labourPct = config.settings && config.settings.labourPercent != null ? config.settings.labourPercent : 100;
      var tiesInShippingLabour = config.settings && config.settings.tiesIncludeInShippingLabour != null ? config.settings.tiesIncludeInShippingLabour : true;
      var shippingLabourBase = tiesInShippingLabour ? subtotalAfterAddons : (subtotalAfterAddons - tiesCost);
      var shippingCost = shippingLabourBase * (shippingPct / 100);
      var labourCost = shippingLabourBase * (labourPct / 100);

      var preTotalUnit = subtotalAfterAddons + shippingCost + labourCost;

      var marginTier = getMarginTier(preTotalUnit);
      var marginPct = marginTier ? marginTier.adjustmentPercent : 0;
      var marginAmt = preTotalUnit * (marginPct / 100);

      var unitTotal = preTotalUnit + marginAmt;

      // Discount from Total (fabric + fill discounts are additive)
      var fabricDiscountPct = (effectiveFabric && effectiveFabric.discountEnabled) ? (parseFloat(effectiveFabric.discountPercent) || 0) : 0;
      var fillDiscountPct = (effectiveFill && effectiveFill.discountEnabled) ? (parseFloat(effectiveFill.discountPercent) || 0) : 0;
      var totalDiscountPct = fabricDiscountPct + fillDiscountPct;
      var discountAmt = totalDiscountPct > 0 ? unitTotal * (totalDiscountPct / 100) : 0;
      if (totalDiscountPct > 0) { unitTotal = Math.max(0, unitTotal - discountAmt); }

      // Panel multiplier for 2D shapes with panels enabled
      var effectivePanelCount = 1;
      if (selectedShape && selectedShape.is2D && selectedShape.enablePanels && panelCount > 1) {
        effectivePanelCount = panelCount;
        unitTotal = unitTotal * panelCount;
      }

      var total = unitTotal * qty;

      calculatedPrice = total;

      updatePriceDisplay({
        fabricCost: fabricCost, fillCost: fillCost, tiesCost: tiesCost, fabricTiesCost: fabricTiesCost, baseSubtotal: baseSubtotal,
        designPct: designPct, designCost: designCost,
        pipingPct: pipingPct, pipingCost: pipingCost, buttonPct: buttonPct, buttonCost: buttonCost,
        antiSkidPct: antiSkidPct, antiSkidCost: antiSkidCost, rodPocketPct: rodPocketPct, rodPocketCost: rodPocketCost,
        profilePct: profilePct, profileCost: profileCost,
        shippingPct: shippingPct, shippingCost: shippingCost, labourPct: labourPct, labourCost: labourCost,
        preTotalUnit: preTotalUnit, marginPct: marginPct, marginAmt: marginAmt,
        discountPct: totalDiscountPct, discountAmt: discountAmt,
        panelCount: effectivePanelCount,
        unitTotal: unitTotal, qty: qty, total: total
      });
    }

    function calculateMultiPiecePrice() {
      var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;

      // Check if fabric is selected (shared across all pieces)
      if (!selectedFabric) {
        updateMultiPiecePriceDisplay({ pieceBreakdowns: [], piecesSubtotal: 0, total: 0, qty: qty });
        return;
      }

      // Check if all pieces have required selections
      var allPiecesComplete = pieces.every(function(piece) {
        return piece.shape && piece.fill && hasRequiredDimensions(piece);
      });

      if (!allPiecesComplete) {
        updateMultiPiecePriceDisplay({ pieceBreakdowns: [], piecesSubtotal: 0, total: 0, qty: qty, incomplete: true });
        return;
      }

      var conversionMultiplier = 1 + ((config.settings && config.settings.conversionPercent != null ? config.settings.conversionPercent : 0) / 100);

      // Settings (shared across all pieces)
      var profilePct = config.profile ? (parseFloat(config.profile.additionalPercent) || 0) : 0;
      var shippingPct = config.settings && config.settings.shippingPercent != null ? config.settings.shippingPercent : 100;
      var labourPct = config.settings && config.settings.labourPercent != null ? config.settings.labourPercent : 100;
      var tiesInShippingLabour = config.settings && config.settings.tiesIncludeInShippingLabour != null ? config.settings.tiesIncludeInShippingLabour : true;

      // Fabric discount (shared fabric across all pieces)
      var fabricDiscountPct = (selectedFabric && selectedFabric.discountEnabled) ? (parseFloat(selectedFabric.discountPercent) || 0) : 0;

      var pieceBreakdowns = [];
      var totalFinalPrice = 0;
      var totalPiecesSubtotal = 0;

      pieces.forEach(function(piece) {
        var surfaceArea = evaluateFormula(piece.shape.surfaceAreaFormula, piece.dimensions);
        var volume = evaluateFormula(piece.shape.volumeFormula, piece.dimensions);

        var fabricCost = surfaceArea * (parseFloat(selectedFabric.pricePerSqInch) || 0) * conversionMultiplier;
        var fillCost = volume * (parseFloat(piece.fill.pricePerCubicInch) || 0) * conversionMultiplier;

        // Check piece-level visibility before including costs (multi-piece is piece-dependent)
        var pc = piece.config || {};
        var designVisible = pc.showDesignSection !== false;
        var pipingVisible = pc.showPipingSection !== false;
        var buttonVisible = pc.showButtonSection !== false;
        var antiSkidVisible = pc.showAntiSkidSection !== false;
        var rodPocketVisible = pc.showRodPocketSection !== false;
        var tiesVisible = pc.showTiesSection !== false;
        var fabricTiesVisible = pc.showFabricTiesSection !== false;

        var tiesCost = (tiesVisible && piece.ties) ? (parseFloat(piece.ties.price) || 0) * conversionMultiplier : 0;
        var fabricTiesCost = (fabricTiesVisible && piece.fabricTies) ? (parseFloat(piece.fabricTies.price) || 0) * conversionMultiplier : 0;

        var pieceBase = fabricCost + fillCost;

        // Design cost is % of fabric cost
        var designPct = (designVisible && piece.design) ? (parseFloat(piece.design.percent) || 0) : 0;
        var designCost = fabricCost * (designPct / 100);

        var pipingPct = (pipingVisible && piece.piping) ? (parseFloat(piece.piping.percent) || 0) : 0;
        var buttonPct = (buttonVisible && piece.button) ? (parseFloat(piece.button.percent) || 0) : 0;
        var antiSkidPct = (antiSkidVisible && piece.antiSkid) ? (parseFloat(piece.antiSkid.percent) || 0) : 0;
        var rodPocketPct = (rodPocketVisible && piece.rodPocket) ? (parseFloat(piece.rodPocket.percent) || 0) : 0;

        var pipingCost = pieceBase * (pipingPct / 100);
        var buttonCost = pieceBase * (buttonPct / 100);
        var antiSkidCost = pieceBase * (antiSkidPct / 100);
        var rodPocketCost = pieceBase * (rodPocketPct / 100);

        var pieceSubtotal = pieceBase + designCost + pipingCost + buttonCost + antiSkidCost + rodPocketCost + tiesCost + fabricTiesCost;
        totalPiecesSubtotal += pieceSubtotal;

        // === INDEPENDENT PER-PIECE CALCULATION ===

        // 1. Profile markup for THIS piece
        var pieceProfileCost = pieceSubtotal * (profilePct / 100);
        var pieceAfterProfile = pieceSubtotal + pieceProfileCost;

        // 2. Shipping/Labour base (optionally exclude ties)
        var pieceShippingLabourBase = tiesInShippingLabour ? pieceAfterProfile : (pieceAfterProfile - tiesCost);
        var pieceShippingCost = pieceShippingLabourBase * (shippingPct / 100);
        var pieceLabourCost = pieceShippingLabourBase * (labourPct / 100);

        var piecePreMargin = pieceAfterProfile + pieceShippingCost + pieceLabourCost;

        // 3. Margin for THIS piece (based on this piece's price)
        var pieceMarginTier = getMarginTier(piecePreMargin);
        var pieceMarginPct = pieceMarginTier ? pieceMarginTier.adjustmentPercent : 0;
        var pieceMarginAmt = piecePreMargin * (pieceMarginPct / 100);

        var pieceTotalBeforeDeductions = piecePreMargin + pieceMarginAmt;

        // 4. Covers only check (30% deduction from raw material cost)
        var isCoversOnly = piece.fill && piece.fill.name &&
          piece.fill.name.toLowerCase().indexOf('covers only') !== -1;
        var rawMaterialCost = fabricCost + fillCost;
        var coversOnlyDeduction = isCoversOnly ? rawMaterialCost * 0.30 : 0;

        // 5. Apply discounts (fabric discount from shared fabric, fill discount per piece)
        var fillDiscountPct = (piece.fill && piece.fill.discountEnabled) ? (parseFloat(piece.fill.discountPercent) || 0) : 0;
        var pieceFabricDiscountAmt = pieceTotalBeforeDeductions * (fabricDiscountPct / 100);
        var pieceFillDiscountAmt = pieceTotalBeforeDeductions * (fillDiscountPct / 100);

        // 6. Final price for this piece
        var pieceFinalPrice = pieceTotalBeforeDeductions - coversOnlyDeduction - pieceFabricDiscountAmt - pieceFillDiscountAmt;
        pieceFinalPrice = Math.max(0, pieceFinalPrice);

        totalFinalPrice += pieceFinalPrice;

        pieceBreakdowns.push({
          name: piece.label,
          fabricCost: fabricCost,
          fillCost: fillCost,
          designCost: designCost,
          designPct: designPct,
          tiesCost: tiesCost,
          fabricTiesCost: fabricTiesCost,
          pipingCost: pipingCost,
          pipingPct: pipingPct,
          buttonCost: buttonCost,
          buttonPct: buttonPct,
          antiSkidCost: antiSkidCost,
          antiSkidPct: antiSkidPct,
          rodPocketCost: rodPocketCost,
          rodPocketPct: rodPocketPct,
          subtotal: pieceSubtotal,
          // Per-piece calculated values
          profileCost: pieceProfileCost,
          shippingCost: pieceShippingCost,
          labourCost: pieceLabourCost,
          preMargin: piecePreMargin,
          marginPct: pieceMarginPct,
          marginAmt: pieceMarginAmt,
          isCoversOnly: isCoversOnly,
          coversOnlyDeduction: coversOnlyDeduction,
          fabricDiscountPct: fabricDiscountPct,
          fabricDiscountAmt: pieceFabricDiscountAmt,
          fillDiscountPct: fillDiscountPct,
          fillDiscountAmt: pieceFillDiscountAmt,
          finalPrice: pieceFinalPrice,
          // Names for display
          shapeName: piece.shape ? piece.shape.name : '',
          fillName: piece.fill ? piece.fill.name : '',
          pipingName: piece.piping ? piece.piping.name : '',
          buttonName: piece.button ? piece.button.name : '',
          antiSkidName: piece.antiSkid ? piece.antiSkid.name : '',
          rodPocketName: piece.rodPocket ? piece.rodPocket.name : '',
          tiesName: piece.ties ? piece.ties.name : '',
          fabricTiesName: piece.fabricTies ? piece.fabricTies.name : '',
          designName: piece.design ? piece.design.name : ''
        });
      });

      var unitTotal = totalFinalPrice;
      var total = unitTotal * qty;

      calculatedPrice = total;

      updateMultiPiecePriceDisplay({
        pieceBreakdowns: pieceBreakdowns,
        piecesSubtotal: totalPiecesSubtotal,
        profilePct: profilePct,
        shippingPct: shippingPct,
        labourPct: labourPct,
        unitTotal: unitTotal,
        qty: qty,
        total: total
      });
    }

    function updateMultiPiecePriceDisplay(d) {
      var f = function(v) { return '$' + (parseFloat(v) || 0).toFixed(2); };

      // Update main price displays
      document.getElementById('live-price-' + blockId).textContent = f(d.total || 0);
      document.getElementById('cart-price-' + blockId).textContent = f(d.total || 0);

      // Update multi-piece breakdown
      var breakdownContent = document.getElementById('multi-piece-breakdown-' + blockId);
      if (breakdownContent) {
        var html = '';

        if (d.pieceBreakdowns && d.pieceBreakdowns.length > 0) {
          // Piece-by-piece breakdown with expandable detail (now shows final price per piece)
          d.pieceBreakdowns.forEach(function(pb, idx) {
            html += '<div class="kraft2026zion-mp-breakdown-piece" data-piece-toggle="' + idx + '">' +
              '<div class="kraft2026zion-mp-breakdown-piece-name"><span class="kraft2026zion-mp-piece-arrow">&#9662;</span> ' + pb.name + '</div>' +
              '<div class="kraft2026zion-mp-breakdown-piece-price">' + f(pb.finalPrice) + '</div>' +
              '</div>';
            html += '<div class="kraft2026zion-mp-piece-detail" id="mp-piece-detail-' + blockId + '-' + idx + '" style="display: none;">';

            // Raw costs section
            html += '<div class="kraft2026zion-mp-detail-section">Raw Costs</div>';
            html += '<div class="kraft2026zion-mp-detail-row"><span>Fabric Cost</span><span>' + f(pb.fabricCost) + '</span></div>';
            html += '<div class="kraft2026zion-mp-detail-row"><span>Fill Cost' + (pb.fillName ? ' (' + pb.fillName + ')' : '') + '</span><span>' + f(pb.fillCost) + '</span></div>';
            if (pb.pipingCost > 0) {
              html += '<div class="kraft2026zion-mp-detail-row"><span>Piping' + (pb.pipingName ? ' (' + pb.pipingName + ')' : '') + ' ' + pb.pipingPct + '%</span><span>' + f(pb.pipingCost) + '</span></div>';
            }
            if (pb.buttonCost > 0) {
              html += '<div class="kraft2026zion-mp-detail-row"><span>Button' + (pb.buttonName ? ' (' + pb.buttonName + ')' : '') + ' ' + pb.buttonPct + '%</span><span>' + f(pb.buttonCost) + '</span></div>';
            }
            if (pb.antiSkidCost > 0) {
              html += '<div class="kraft2026zion-mp-detail-row"><span>Anti-Skid' + (pb.antiSkidName ? ' (' + pb.antiSkidName + ')' : '') + ' ' + pb.antiSkidPct + '%</span><span>' + f(pb.antiSkidCost) + '</span></div>';
            }
            if (pb.tiesCost > 0) {
              html += '<div class="kraft2026zion-mp-detail-row"><span>Ties' + (pb.tiesName ? ' (' + pb.tiesName + ')' : '') + '</span><span>' + f(pb.tiesCost) + '</span></div>';
            }
            html += '<div class="kraft2026zion-mp-detail-row mp-detail-subtotal"><span>Piece Subtotal</span><span>' + f(pb.subtotal) + '</span></div>';

            // Markups section
            html += '<div class="kraft2026zion-mp-detail-section">Markups</div>';
            if ((d.profilePct || 0) > 0) {
              html += '<div class="kraft2026zion-mp-detail-row"><span>Profile (' + d.profilePct + '%)</span><span>+' + f(pb.profileCost) + '</span></div>';
            }
            html += '<div class="kraft2026zion-mp-detail-row"><span>Shipping (' + (d.shippingPct || 0) + '%)</span><span>+' + f(pb.shippingCost) + '</span></div>';
            html += '<div class="kraft2026zion-mp-detail-row"><span>Labour (' + (d.labourPct || 0) + '%)</span><span>+' + f(pb.labourCost) + '</span></div>';
            html += '<div class="kraft2026zion-mp-detail-row mp-detail-subtotal"><span>Pre-Margin</span><span>' + f(pb.preMargin) + '</span></div>';

            if ((pb.marginPct || 0) !== 0) {
              var sign = pb.marginPct > 0 ? '+' : '';
              html += '<div class="kraft2026zion-mp-detail-row"><span>Margin (' + sign + pb.marginPct.toFixed(1) + '%)</span><span>' + (pb.marginAmt >= 0 ? '+' : '') + f(pb.marginAmt) + '</span></div>';
            }

            // Deductions section (if any)
            var hasDeductions = pb.isCoversOnly || (pb.fabricDiscountAmt || 0) > 0 || (pb.fillDiscountAmt || 0) > 0;
            if (hasDeductions) {
              html += '<div class="kraft2026zion-mp-detail-section">Deductions</div>';
              if (pb.isCoversOnly) {
                html += '<div class="kraft2026zion-mp-detail-row mp-detail-discount"><span>Covers Only (-30%)</span><span>-' + f(pb.coversOnlyDeduction) + '</span></div>';
              }
              if ((pb.fabricDiscountAmt || 0) > 0) {
                html += '<div class="kraft2026zion-mp-detail-row mp-detail-discount"><span>Fabric Discount (' + pb.fabricDiscountPct + '%)</span><span>-' + f(pb.fabricDiscountAmt) + '</span></div>';
              }
              if ((pb.fillDiscountAmt || 0) > 0) {
                html += '<div class="kraft2026zion-mp-detail-row mp-detail-discount"><span>Fill Discount (' + pb.fillDiscountPct + '%)</span><span>-' + f(pb.fillDiscountAmt) + '</span></div>';
              }
            }

            html += '<div class="kraft2026zion-mp-detail-row mp-detail-final"><span>Piece Final</span><span>' + f(pb.finalPrice) + '</span></div>';
            html += '</div>';
          });

          html += '<div class="kraft2026zion-mp-breakdown-divider"></div>';
          html += '<div class="kraft2026zion-mp-breakdown-row"><span>All Pieces Subtotal</span><span>' + f(d.piecesSubtotal) + '</span></div>';
          html += '<div class="kraft2026zion-mp-breakdown-row mp-breakdown-total"><span>Unit Total</span><span>' + f(d.unitTotal) + '</span></div>';
          html += '<div class="kraft2026zion-mp-breakdown-row mp-breakdown-total"><span>x ' + d.qty + '</span><span>' + f(d.total) + '</span></div>';
        } else if (d.incomplete) {
          html = '<div class="kraft2026zion-mp-breakdown-incomplete">Complete all pieces to see price</div>';
        } else {
          html = '<div class="kraft2026zion-mp-breakdown-incomplete">Select fabric to see price</div>';
        }

        breakdownContent.innerHTML = html;

        // Add click handlers for piece detail toggles
        breakdownContent.querySelectorAll('[data-piece-toggle]').forEach(function(row) {
          row.addEventListener('click', function() {
            var idx = row.dataset.pieceToggle;
            var detail = document.getElementById('mp-piece-detail-' + blockId + '-' + idx);
            if (detail) {
              var isOpen = detail.style.display !== 'none';
              detail.style.display = isOpen ? 'none' : 'block';
              var arrow = row.querySelector('.mp-piece-arrow');
              if (arrow) arrow.classList.toggle('kraft2026zion-open', !isOpen);
            }
          });
        });
      }

      // Update add to cart button state
      var canAdd = d.pieceBreakdowns && d.pieceBreakdowns.length > 0 && selectedFabric && (d.total || 0) > 0;
      document.getElementById('add-cart-btn-' + blockId).disabled = !canAdd;

      // Sync floating footer
      var floatingPrice = document.getElementById('floating-price-' + blockId);
      var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);
      if (floatingPrice) floatingPrice.textContent = f(d.total || 0);
      if (floatingAddBtn) floatingAddBtn.disabled = !canAdd;
      syncFloatingFooter();
    }

    function updatePriceDisplay(d) {
      var f = function(v) { return '$' + (parseFloat(v) || 0).toFixed(2); };
      document.getElementById('live-price-' + blockId).textContent = f(d.total || 0);
      document.getElementById('cart-price-' + blockId).textContent = f(d.total || 0);
      document.getElementById('bd-fabric-' + blockId).textContent = f(d.fabricCost);
      document.getElementById('bd-fill-' + blockId).textContent = f(d.fillCost);
      document.getElementById('bd-subtotal-' + blockId).textContent = f(d.baseSubtotal);
      // Design row
      var designRow = document.getElementById('bd-design-row-' + blockId);
      if (designRow) {
        designRow.style.display = (d.designPct || 0) > 0 ? 'flex' : 'none';
        document.getElementById('bd-design-pct-' + blockId).textContent = d.designPct || 0;
        document.getElementById('bd-design-' + blockId).textContent = f(d.designCost);
      }
      var pipingRow = document.getElementById('bd-piping-row-' + blockId);
      pipingRow.style.display = (d.pipingPct || 0) > 0 ? 'flex' : 'none';
      document.getElementById('bd-piping-pct-' + blockId).textContent = d.pipingPct || 0;
      document.getElementById('bd-piping-' + blockId).textContent = f(d.pipingCost);
      var buttonRow = document.getElementById('bd-button-row-' + blockId);
      buttonRow.style.display = (d.buttonPct || 0) > 0 ? 'flex' : 'none';
      document.getElementById('bd-button-pct-' + blockId).textContent = d.buttonPct || 0;
      document.getElementById('bd-button-' + blockId).textContent = f(d.buttonCost);
      var antiskidRow = document.getElementById('bd-antiskid-row-' + blockId);
      antiskidRow.style.display = (d.antiSkidPct || 0) > 0 ? 'flex' : 'none';
      document.getElementById('bd-antiskid-pct-' + blockId).textContent = d.antiSkidPct || 0;
      document.getElementById('bd-antiskid-' + blockId).textContent = f(d.antiSkidCost);
      // Bottom Rod Pocket row
      var rodpocketRow = document.getElementById('bd-rodpocket-row-' + blockId);
      if (rodpocketRow) {
        rodpocketRow.style.display = (d.rodPocketPct || 0) > 0 ? 'flex' : 'none';
        document.getElementById('bd-rodpocket-pct-' + blockId).textContent = d.rodPocketPct || 0;
        document.getElementById('bd-rodpocket-' + blockId).textContent = f(d.rodPocketCost);
      }
      var tiesRow = document.getElementById('bd-ties-row-' + blockId);
      tiesRow.style.display = (d.tiesCost || 0) > 0 ? 'flex' : 'none';
      document.getElementById('bd-ties-' + blockId).textContent = f(d.tiesCost);
      // Fabric Ties row
      var fabrictiesRow = document.getElementById('bd-fabricties-row-' + blockId);
      if (fabrictiesRow) {
        fabrictiesRow.style.display = (d.fabricTiesCost || 0) > 0 ? 'flex' : 'none';
        document.getElementById('bd-fabricties-' + blockId).textContent = f(d.fabricTiesCost);
      }
      var profileRow = document.getElementById('bd-profile-row-' + blockId);
      profileRow.style.display = (d.profilePct || 0) > 0 ? 'flex' : 'none';
      document.getElementById('bd-profile-pct-' + blockId).textContent = d.profilePct || 0;
      document.getElementById('bd-profile-' + blockId).textContent = f(d.profileCost);
      document.getElementById('bd-shipping-pct-' + blockId).textContent = d.shippingPct || 0;
      document.getElementById('bd-shipping-' + blockId).textContent = f(d.shippingCost);
      document.getElementById('bd-labour-pct-' + blockId).textContent = d.labourPct || 0;
      document.getElementById('bd-labour-' + blockId).textContent = f(d.labourCost);
      document.getElementById('bd-pretotal-' + blockId).textContent = f(d.preTotalUnit);
      var marginRow = document.getElementById('bd-margin-row-' + blockId);
      if ((d.marginPct || 0) !== 0) {
        marginRow.style.display = 'flex';
        var sign = d.marginPct > 0 ? '+' : '';
        document.getElementById('bd-margin-pct-' + blockId).textContent = sign + d.marginPct;
        document.getElementById('bd-margin-' + blockId).textContent = (d.marginAmt >= 0 ? '+' : '') + f(d.marginAmt);
        marginRow.classList.toggle('kraft2026zion-increase', d.marginPct > 0);
      } else {
        marginRow.style.display = 'none';
      }
      // Discount row
      var discountRow = document.getElementById('bd-discount-row-' + blockId);
      if (discountRow) {
        if ((d.discountPct || 0) > 0) {
          discountRow.style.display = 'flex';
          document.getElementById('bd-discount-pct-' + blockId).textContent = d.discountPct;
          document.getElementById('bd-discount-' + blockId).textContent = '-' + f(d.discountAmt);
        } else {
          discountRow.style.display = 'none';
        }
      }
      // Panels row
      var panelsRow = document.getElementById('bd-panels-row-' + blockId);
      if (panelsRow) {
        if ((d.panelCount || 1) > 1) {
          panelsRow.style.display = 'flex';
          document.getElementById('bd-panels-count-' + blockId).textContent = d.panelCount;
        } else {
          panelsRow.style.display = 'none';
        }
      }
      document.getElementById('bd-qty-' + blockId).textContent = d.qty || 1;
      document.getElementById('bd-total-' + blockId).textContent = f(d.total);
      var canAdd = selectedShape && (selectedFill || (config.hiddenValues && config.hiddenValues.fillType)) && (selectedFabric || (config.hiddenValues && config.hiddenValues.fabric)) && (d.baseSubtotal || 0) > 0;
      document.getElementById('add-cart-btn-' + blockId).disabled = !canAdd;

      // Sync floating footer
      var floatingPrice = document.getElementById('floating-price-' + blockId);
      var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);
      if (floatingPrice) floatingPrice.textContent = f(d.total || 0);
      if (floatingAddBtn) floatingAddBtn.disabled = !canAdd;
      syncFloatingFooter();
    }

    function toggleSection(name, forceOpen) {
      var header = document.getElementById('header-' + name + '-' + blockId);
      var content = document.getElementById('content-' + name + '-' + blockId);
      if (!header || !content) return;
      if (forceOpen || !content.classList.contains('kraft2026zion-open')) {
        // Only close accordion sections that are NOT inside pieces-content (those have their own toggle)
        document.querySelectorAll('#calc-container-' + blockId + ' .accordion-content').forEach(function(c) {
          if (!c.closest('.kraft2026zion-pieces-content')) c.classList.remove('kraft2026zion-open');
        });
        document.querySelectorAll('#calc-container-' + blockId + ' .accordion-header').forEach(function(h) {
          if (!h.closest('.kraft2026zion-pieces-content')) h.classList.remove('kraft2026zion-active');
        });
        content.classList.add('kraft2026zion-open');
        header.classList.add('kraft2026zion-active');
      } else {
        content.classList.remove('kraft2026zion-open');
        header.classList.remove('kraft2026zion-active');
      }
    }

    function setupEventListeners() {
      document.querySelectorAll('#calc-container-' + blockId + ' .accordion-header').forEach(function(header) {
        // Skip headers inside pieces-content (they have their own toggle via setupPieceSectionListeners)
        if (header.closest('.kraft2026zion-pieces-content')) return;
        header.addEventListener('click', function() { toggleSection(header.closest('.accordion-section').dataset.section); });
      });

      // Note: shared fabric container is handled by the general accordion header handler above

      container.addEventListener('click', function(e) {
        var card = e.target.closest('.option-card');
        if (!card) return;
        var type = card.dataset.type, id = card.dataset.id;
        if (type === 'shape') { var s = config.shapes.find(function(x) { return x.id === id; }); if (s) selectShape(s); }
        else if (type === 'fill') { var f = config.fillTypes.find(function(x) { return x.id === id; }); if (f) selectFill(f); }
        else if (type === 'fabric') {
          var fab = (config.uncategorizedFabrics || []).find(function(x) { return x.id === id; });
          if (!fab) {
            var cont = document.getElementById('fabric-categories-' + blockId);
            if (cont._inlineFabrics) fab = cont._inlineFabrics.find(function(x) { return x.id === id; });
          }
          if (fab) selectFabric(fab);
        }
        else if (type === 'design') selectDesign(id);
        else if (type === 'piping') selectPiping(id);
        else if (type === 'button') selectButton(id);
        else if (type === 'antiskid') selectAntiSkid(id);
        else if (type === 'rodpocket') selectRodPocket(id);
        else if (type === 'ties') selectTies(id);
        else if (type === 'fabricties') selectFabricTies(id);
      });

      document.getElementById('quantity-' + blockId).addEventListener('input', function() { syncFloatingFooter(); calculatePrice(); });

      // Quantity +/- buttons
      document.getElementById('qty-minus-' + blockId).addEventListener('click', function() {
        var qtyInput = document.getElementById('quantity-' + blockId);
        var val = parseInt(qtyInput.value) || 1;
        if (val > 1) {
          updateQuantity(val - 1);
        }
      });
      document.getElementById('qty-plus-' + blockId).addEventListener('click', function() {
        var qtyInput = document.getElementById('quantity-' + blockId);
        var val = parseInt(qtyInput.value) || 1;
        if (val < 100) {
          updateQuantity(val + 1);
        }
      });

      document.getElementById('breakdown-toggle-' + blockId).addEventListener('click', function() {
        var content = document.getElementById('breakdown-content-' + blockId);
        var toggle = document.getElementById('breakdown-toggle-' + blockId);
        var isOpen = content.style.display !== 'none';
        content.style.display = isOpen ? 'none' : 'block';
        toggle.classList.toggle('kraft2026zion-open', !isOpen);
      });

      // Instructions textarea
      document.getElementById('instructions-text-' + blockId).addEventListener('input', updateInstructionsValue);

      document.getElementById('add-cart-btn-' + blockId).addEventListener('click', addToCart);
      document.getElementById('continue-shopping-' + blockId).addEventListener('click', hideSuccessPopup);
      document.getElementById('view-cart-' + blockId).addEventListener('click', function() { hideSuccessPopup(); sessionStorage.setItem('cushion_refresh_cart', 'true'); window.location.href = '/cart'; });
      document.getElementById('cart-success-overlay-' + blockId).addEventListener('click', function(e) { if (e.target.id === 'cart-success-overlay-' + blockId) hideSuccessPopup(); });

      setupAttachmentListeners();
      setupFloatingFooterListeners();
    }

    function setupFloatingFooter() {
      var floatingFooter = document.getElementById('floating-footer-' + blockId);
      var calcContainer = document.getElementById('calc-container-' + blockId);

      if (!floatingFooter || !calcContainer) return;

      // Show floating footer whenever calculator is in the viewport
      function checkFloatingFooterVisibility() {
        var calcRect = calcContainer.getBoundingClientRect();
        var calcInView = calcRect.top < window.innerHeight && calcRect.bottom > 0;

        if (calcInView) {
          floatingFooter.style.display = 'block';
          setTimeout(function() { floatingFooter.classList.add('kraft2026zion-visible'); }, 10);
        } else {
          floatingFooter.classList.remove('kraft2026zion-visible');
          setTimeout(function() {
            if (!floatingFooter.classList.contains('kraft2026zion-visible')) {
              floatingFooter.style.display = 'none';
            }
          }, 300);
        }
      }

      // Check on scroll and resize
      window.addEventListener('scroll', checkFloatingFooterVisibility);
      window.addEventListener('resize', checkFloatingFooterVisibility);

      // Initial check
      setTimeout(checkFloatingFooterVisibility, 500);
    }

    function setupFloatingFooterListeners() {
      var floatingMinusBtn = document.getElementById('floating-qty-minus-' + blockId);
      var floatingPlusBtn = document.getElementById('floating-qty-plus-' + blockId);
      var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);

      if (floatingMinusBtn) {
        floatingMinusBtn.addEventListener('click', function() {
          var qtyInput = document.getElementById('quantity-' + blockId);
          var val = parseInt(qtyInput.value) || 1;
          if (val > 1) {
            updateQuantity(val - 1);
          }
        });
      }

      if (floatingPlusBtn) {
        floatingPlusBtn.addEventListener('click', function() {
          var qtyInput = document.getElementById('quantity-' + blockId);
          var val = parseInt(qtyInput.value) || 1;
          if (val < 100) {
            updateQuantity(val + 1);
          }
        });
      }

      if (floatingAddBtn) {
        floatingAddBtn.addEventListener('click', addToCart);
      }
    }

    function updateQuantity(newQty) {
      // Update main quantity input
      var qtyInput = document.getElementById('quantity-' + blockId);
      if (qtyInput) qtyInput.value = newQty;

      // Update floating quantity display
      var floatingQtyValue = document.getElementById('floating-qty-value-' + blockId);
      if (floatingQtyValue) floatingQtyValue.textContent = newQty;

      // Recalculate price
      calculatePrice();
    }

    function syncFloatingFooter() {
      var qtyInput = document.getElementById('quantity-' + blockId);
      var floatingQtyValue = document.getElementById('floating-qty-value-' + blockId);

      if (qtyInput && floatingQtyValue) {
        floatingQtyValue.textContent = qtyInput.value;
      }
    }

    function setupAttachmentListeners() {
      var dropzone = document.getElementById('attachment-dropzone-' + blockId);
      var fileInput = document.getElementById('attachment-input-' + blockId);
      var removeBtn = document.getElementById('preview-remove-' + blockId);

      if (!dropzone || !fileInput) return;

      // Click to select file
      dropzone.addEventListener('click', function(e) {
        if (e.target.closest('.preview-remove')) return;
        fileInput.click();
      });

      // File selected
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files[0]) {
          handleFileSelect(fileInput.files[0]);
        }
      });

      // Drag and drop
      dropzone.addEventListener('kraft2026zion-dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('kraft2026zion-dragover');
      });

      dropzone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('kraft2026zion-dragover');
      });

      dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('kraft2026zion-dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelect(e.dataTransfer.files[0]);
        }
      });

      // Remove file
      if (removeBtn) {
        removeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          clearAttachment();
        });
      }
    }

    function handleFileSelect(file) {
      var errorEl = document.getElementById('attachment-error-' + blockId);
      errorEl.style.display = 'none';

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        showAttachmentError('Invalid file type. Only PNG, JPG, and JPEG are allowed.');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        showAttachmentError('File too large. Maximum size is 2MB.');
        return;
      }

      // Show preview
      showFilePreview(file);

      // Upload file
      uploadAttachment(file);
    }

    function showFilePreview(file) {
      var content = document.getElementById('dropzone-content-' + blockId);
      var preview = document.getElementById('dropzone-preview-' + blockId);
      var previewImg = document.getElementById('preview-image-' + blockId);
      var previewName = document.getElementById('preview-name-' + blockId);

      content.style.display = 'none';
      preview.style.display = 'flex';

      previewName.textContent = file.name;

      var reader = new FileReader();
      reader.onload = function(e) {
        previewImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function showAttachmentError(message) {
      var errorEl = document.getElementById('attachment-error-' + blockId);
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    function clearAttachment() {
      var content = document.getElementById('dropzone-content-' + blockId);
      var preview = document.getElementById('dropzone-preview-' + blockId);
      var uploading = document.getElementById('dropzone-uploading-' + blockId);
      var success = document.getElementById('dropzone-success-' + blockId);
      var fileInput = document.getElementById('attachment-input-' + blockId);
      var errorEl = document.getElementById('attachment-error-' + blockId);

      content.style.display = 'flex';
      preview.style.display = 'none';
      uploading.style.display = 'none';
      success.style.display = 'none';
      errorEl.style.display = 'none';
      fileInput.value = '';

      attachmentUrl = null;
      attachmentFileName = null;

      updateInstructionsValue();
    }

    async function uploadAttachment(file) {
      var preview = document.getElementById('dropzone-preview-' + blockId);
      var uploading = document.getElementById('dropzone-uploading-' + blockId);
      var success = document.getElementById('dropzone-success-' + blockId);

      preview.style.display = 'none';
      uploading.style.display = 'flex';

      try {
        // Convert file to base64
        var base64Data = await fileToBase64(file);

        var response = await fetch('/apps/cushion-api/upload-attachment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop: shopDomain,
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data
          })
        });

        var result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        attachmentUrl = result.fileUrl;
        attachmentFileName = file.name;

        uploading.style.display = 'none';
        success.style.display = 'flex';

        // Show success briefly then show preview
        setTimeout(function() {
          success.style.display = 'none';
          preview.style.display = 'flex';
        }, 1500);

        updateInstructionsValue();

      } catch (error) {
        console.error('Upload error:', error);
        uploading.style.display = 'none';
        clearAttachment();
        showAttachmentError(error.message || 'Failed to upload file. Please try again.');
      }
    }

    function fileToBase64(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function(error) { reject(error); };
        reader.readAsDataURL(file);
      });
    }

    function updateInstructionsValue() {
      var instructions = document.getElementById('instructions-text-' + blockId).value;
      var valueEl = document.getElementById('value-instructions-' + blockId);

      if (instructions || attachmentUrl) {
        var parts = [];
        if (instructions) parts.push('Note added');
        if (attachmentUrl) parts.push('Image attached');
        valueEl.textContent = parts.join(', ');
        valueEl.classList.add('kraft2026zion-selected');
      } else {
        valueEl.textContent = 'Optional';
        valueEl.classList.remove('kraft2026zion-selected');
      }
    }

    async function addToCart() {
      if (isMultiPieceMode) {
        await addMultiPieceToCart();
        return;
      }

      if (calculatedPrice <= 0) return;
      var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;
      var instructions = document.getElementById('instructions-text-' + blockId).value;
      var dimStr = selectedShape.inputFields.map(function(f) { return f.label + ': ' + (dimensions[f.key] || 0) + ' ' + f.unit; }).join(', ');

      var visibility = config.sectionVisibility || {};
      var hidden = config.hiddenValues || {};
      var effectiveFill = selectedFill, effectiveFabric = selectedFabric, effectiveDesign = selectedDesign, effectivePiping = selectedPiping, effectiveButton = selectedButton, effectiveAntiSkid = selectedAntiSkid, effectiveRodPocket = selectedRodPocket, effectiveTies = selectedTies, effectiveFabricTies = selectedFabricTies;
      if (visibility.showFillSection === false && hidden.fillType) effectiveFill = hidden.fillType;
      if (visibility.showFabricSection === false && hidden.fabric) effectiveFabric = hidden.fabric;
      if (visibility.showDesignSection === false && hidden.design) effectiveDesign = hidden.design;
      if (visibility.showPipingSection === false && hidden.piping) effectivePiping = hidden.piping;
      if (visibility.showButtonSection === false && hidden.button) effectiveButton = hidden.button;
      if (visibility.showAntiSkidSection === false && hidden.antiSkid) effectiveAntiSkid = hidden.antiSkid;
      if (visibility.showRodPocketSection === false && hidden.rodPocket) effectiveRodPocket = hidden.rodPocket;
      if (visibility.showTiesSection === false && hidden.ties) effectiveTies = hidden.ties;
      if (visibility.showFabricTiesSection === false && hidden.fabricTies) effectiveFabricTies = hidden.fabricTies;

      var surfaceArea = evaluateFormula(selectedShape.surfaceAreaFormula, dimensions);
      var volume = evaluateFormula(selectedShape.volumeFormula, dimensions);

      var conversionMultiplier = 1 + ((config.settings && config.settings.conversionPercent != null ? config.settings.conversionPercent : 0) / 100);
      var fabricCost = surfaceArea * (parseFloat(effectiveFabric.pricePerSqInch) || 0) * conversionMultiplier;
      var fillCost = volume * (parseFloat(effectiveFill.pricePerCubicInch) || 0) * conversionMultiplier;
      var tiesCost = effectiveTies ? (parseFloat(effectiveTies.price) || 0) * conversionMultiplier : 0;
      var fabricTiesCost = effectiveFabricTies ? (parseFloat(effectiveFabricTies.price) || 0) * conversionMultiplier : 0;
      var baseSubtotal = fabricCost + fillCost;

      var designPct = effectiveDesign ? (parseFloat(effectiveDesign.percent) || 0) : 0;
      var designCost = fabricCost * (designPct / 100);
      var pipingPct = effectivePiping ? (parseFloat(effectivePiping.percent) || 0) : 0;
      var buttonPct = effectiveButton ? (parseFloat(effectiveButton.percent) || 0) : 0;
      var antiSkidPct = effectiveAntiSkid ? (parseFloat(effectiveAntiSkid.percent) || 0) : 0;
      var rodPocketPct = effectiveRodPocket ? (parseFloat(effectiveRodPocket.percent) || 0) : 0;
      var profilePct = config.profile ? (parseFloat(config.profile.additionalPercent) || 0) : 0;

      var subtotalAfterAddons = baseSubtotal + designCost + (baseSubtotal * ((pipingPct + buttonPct + antiSkidPct + rodPocketPct + profilePct) / 100)) + tiesCost + fabricTiesCost;
      var shippingPct = config.settings && config.settings.shippingPercent != null ? config.settings.shippingPercent : 100;
      var labourPct = config.settings && config.settings.labourPercent != null ? config.settings.labourPercent : 100;
      var tiesInShippingLabour = config.settings && config.settings.tiesIncludeInShippingLabour != null ? config.settings.tiesIncludeInShippingLabour : true;
      var shippingLabourBase = tiesInShippingLabour ? subtotalAfterAddons : (subtotalAfterAddons - tiesCost);
      var preTotalUnit = subtotalAfterAddons + shippingLabourBase * ((shippingPct + labourPct) / 100);
      var marginTier = getMarginTier(preTotalUnit);
      var marginPct = marginTier ? marginTier.adjustmentPercent : 0;
      var unitPrice = preTotalUnit * (1 + marginPct / 100);

      // Apply discount from total (fabric + fill discounts are additive)
      var fabricDiscountPct = (effectiveFabric && effectiveFabric.discountEnabled) ? (parseFloat(effectiveFabric.discountPercent) || 0) : 0;
      var fillDiscountPct = (effectiveFill && effectiveFill.discountEnabled) ? (parseFloat(effectiveFill.discountPercent) || 0) : 0;
      var totalDiscountPct = fabricDiscountPct + fillDiscountPct;
      if (totalDiscountPct > 0) {
        unitPrice = unitPrice * (1 - totalDiscountPct / 100);
      }

      // Apply panel multiplier for 2D shapes
      var effectivePanelCount = 1;
      if (selectedShape && selectedShape.is2D && selectedShape.enablePanels && panelCount > 1) {
        effectivePanelCount = panelCount;
        unitPrice = unitPrice * panelCount;
      }

      if (unitPrice <= 0) unitPrice = preTotalUnit;
      if (unitPrice < 1) unitPrice = 1;

      var dimUrlStr = selectedShape.inputFields.map(function(f) { return f.key + ':' + (dimensions[f.key] || 0); }).join(',');

      var debugMode = config.settings && config.settings.debugPricing;
      var properties = {
        'Shape': selectedShape.name, 'Dimensions': dimStr,
        'Panels': effectivePanelCount > 1 ? effectivePanelCount + ' panels' : '1 panel',
        'Fill Type': effectiveFill.name, 'Fabric': effectiveFabric.name,
        'Design': effectiveDesign ? (debugMode ? effectiveDesign.name + ' (' + designPct + '%)' : effectiveDesign.name) : 'None',
        'Piping': effectivePiping ? (debugMode ? effectivePiping.name + ' (' + pipingPct + '%)' : effectivePiping.name) : 'None',
        'Button Style': effectiveButton ? (debugMode ? effectiveButton.name + ' (' + buttonPct + '%)' : effectiveButton.name) : 'None',
        'Anti-Skid': effectiveAntiSkid ? (debugMode ? effectiveAntiSkid.name + ' (' + antiSkidPct + '%)' : effectiveAntiSkid.name) : 'None',
        'Bottom Rod Pocket': effectiveRodPocket ? (debugMode ? effectiveRodPocket.name + ' (' + rodPocketPct + '%)' : effectiveRodPocket.name) : 'None',
        'Ties': effectiveTies ? (debugMode ? effectiveTies.name + ' ($' + effectiveTies.price + ')' : effectiveTies.name) : 'None',
        'Fabric Ties': effectiveFabricTies ? (debugMode ? effectiveFabricTies.name + ' ($' + effectiveFabricTies.price + ')' : effectiveFabricTies.name) : 'None',
        'Discount': (debugMode && totalDiscountPct > 0) ? totalDiscountPct + '% off' : 'None',
        'Unit Price': '$' + unitPrice.toFixed(2),
        '_shapeId': selectedShape.id,
        '_fillId': effectiveFill.id,
        '_fabricId': effectiveFabric.id,
        '_designId': effectiveDesign ? effectiveDesign.id : 'none',
        '_pipingId': effectivePiping ? effectivePiping.id : 'none',
        '_buttonId': effectiveButton ? effectiveButton.id : 'none',
        '_antiSkidId': effectiveAntiSkid ? effectiveAntiSkid.id : 'none',
        '_rodPocketId': effectiveRodPocket ? effectiveRodPocket.id : 'none',
        '_tiesId': effectiveTies ? effectiveTies.id : 'none',
        '_fabricTiesId': effectiveFabricTies ? effectiveFabricTies.id : 'none',
        '_dimensions': dimUrlStr,
        '_productHandle': productHandle,
        '_profileId': profileId || '',
        '_qty': qty.toString(),
        '_panelCount': effectivePanelCount.toString(),
        '_priceDisplay': '$' + unitPrice.toFixed(2),
        '_totalDisplay': '$' + (unitPrice * qty).toFixed(2)
      };
      if (instructions) {
        properties['Special Instructions'] = instructions;
        properties['_instructions'] = encodeURIComponent(instructions);
      }
      if (attachmentUrl) {
        properties['Reference Image'] = attachmentUrl;
        properties['_attachmentUrl'] = attachmentUrl;
        if (attachmentFileName) {
          properties['_attachmentFileName'] = attachmentFileName;
        }
      }

      var btn = document.getElementById('add-cart-btn-' + blockId);
      var floatingBtn = document.getElementById('floating-add-btn-' + blockId);
      btn.disabled = true;
      if (floatingBtn) floatingBtn.disabled = true;

      if (!productId) { btn.textContent = 'Add to Cart - $' + calculatedPrice.toFixed(2); btn.disabled = false; if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; } showError('Product not found.'); return; }

      btn.textContent = 'Creating configuration...';
      if (floatingBtn) floatingBtn.textContent = 'Creating...';

      try {
        var configHash = Math.abs(JSON.stringify({ shape: selectedShape.id, dimensions: dimensions, fill: effectiveFill.id, fabric: effectiveFabric.id, piping: effectivePiping ? effectivePiping.id : null, button: effectiveButton ? effectiveButton.id : null, antiSkid: effectiveAntiSkid ? effectiveAntiSkid.id : null, ties: effectiveTies ? effectiveTies.id : null, price: unitPrice }).split('').reduce(function(a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36);

        var variantResponse = await fetch('/apps/cushion-api/create-variant', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop: shopDomain, productId: productId, price: unitPrice.toFixed(2), configHash: configHash, configSummary: selectedShape.name + ' - ' + dimStr })
        });

        if (!variantResponse.ok) { var err = await variantResponse.json(); throw new Error(err.error || 'Failed to create variant'); }
        var variantData = await variantResponse.json();

        btn.textContent = 'Adding to cart...';
        if (floatingBtn) floatingBtn.textContent = 'Adding...';
        properties['_calculated_price'] = unitPrice.toFixed(2);

        var cartResponse = await fetch('/cart/add.js', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parseInt(variantData.variantId, 10), quantity: qty, properties: properties })
        });

        if (!cartResponse.ok) { var err2 = await cartResponse.json(); throw new Error(err2.description || 'Failed to add to cart'); }

        btn.textContent = 'Added to Cart!';
        if (floatingBtn) floatingBtn.textContent = 'Added!';
        showSuccessPopup({ shape: selectedShape.name, dimensions: dimStr, fabric: effectiveFabric.name, fill: effectiveFill.name, quantity: qty, price: '$' + calculatedPrice.toFixed(2), hasAttachment: !!attachmentUrl });

        // Clear attachment for next order
        clearAttachment();

        setTimeout(function() { btn.textContent = 'Add to Cart - $' + calculatedPrice.toFixed(2); btn.disabled = false; if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; } }, 1500);
      } catch (error) {
        console.error('Add to cart error:', error);
        btn.textContent = 'Add to Cart - $' + calculatedPrice.toFixed(2);
        btn.disabled = false;
        if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; }
        showError(error.message || 'Failed to add to cart.');
      }
    }

    async function addMultiPieceToCart() {
      if (calculatedPrice <= 0) return;
      if (!selectedFabric) { showError('Please select a fabric.'); return; }

      var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;
      var instructions = document.getElementById('instructions-text-' + blockId).value;
      var debugMode = config.settings && config.settings.debugPricing;

      // Build properties for each piece
      var properties = {
        'Fabric': selectedFabric.name,
        '_fabricId': selectedFabric.id,
        '_isMultiPiece': 'true',
        '_pieceCount': pieces.length.toString()
      };

      // Add each piece's details
      pieces.forEach(function(piece, idx) {
        var prefix = piece.label;
        var dimStr = piece.shape.inputFields.map(function(f) {
          return (piece.dimensions[f.key] || 0) + '"';
        }).join(' x ');

        properties[prefix + ' - Shape'] = piece.shape.name;
        properties[prefix + ' - Dimensions'] = dimStr;
        properties[prefix + ' - Fill'] = piece.fill.name;
        properties[prefix + ' - Piping'] = piece.piping ? piece.piping.name : 'None';
        properties[prefix + ' - Button'] = piece.button ? piece.button.name : 'None';
        properties[prefix + ' - Anti-Skid'] = piece.antiSkid ? piece.antiSkid.name : 'None';
        properties[prefix + ' - Ties'] = piece.ties ? piece.ties.name : 'None';

        // Hidden IDs for reorder
        properties['_piece' + idx + '_shapeId'] = piece.shape.id;
        properties['_piece' + idx + '_fillId'] = piece.fill.id;
        properties['_piece' + idx + '_pipingId'] = piece.piping ? piece.piping.id : 'none';
        properties['_piece' + idx + '_buttonId'] = piece.button ? piece.button.id : 'none';
        properties['_piece' + idx + '_antiSkidId'] = piece.antiSkid ? piece.antiSkid.id : 'none';
        properties['_piece' + idx + '_tiesId'] = piece.ties ? piece.ties.id : 'none';

        var dimUrlStr = piece.shape.inputFields.map(function(f) {
          return f.key + ':' + (piece.dimensions[f.key] || 0);
        }).join(',');
        properties['_piece' + idx + '_dimensions'] = dimUrlStr;
      });

      // Calculate unit price
      var unitPrice = calculatedPrice / qty;
      if (unitPrice < 1) unitPrice = 1;

      properties['Unit Price'] = '$' + unitPrice.toFixed(2);
      properties['_productHandle'] = productHandle;
      properties['_profileId'] = profileId || '';
      properties['_qty'] = qty.toString();
      properties['_priceDisplay'] = '$' + unitPrice.toFixed(2);
      properties['_totalDisplay'] = '$' + calculatedPrice.toFixed(2);

      if (instructions) {
        properties['Special Instructions'] = instructions;
        properties['_instructions'] = encodeURIComponent(instructions);
      }
      if (attachmentUrl) {
        properties['Reference Image'] = attachmentUrl;
        properties['_attachmentUrl'] = attachmentUrl;
        if (attachmentFileName) {
          properties['_attachmentFileName'] = attachmentFileName;
        }
      }

      var btn = document.getElementById('add-cart-btn-' + blockId);
      var floatingBtn = document.getElementById('floating-add-btn-' + blockId);
      btn.disabled = true;
      if (floatingBtn) floatingBtn.disabled = true;

      if (!productId) {
        btn.textContent = 'Add to Cart - $' + calculatedPrice.toFixed(2);
        btn.disabled = false;
        if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; }
        showError('Product not found.');
        return;
      }

      btn.textContent = 'Creating configuration...';
      if (floatingBtn) floatingBtn.textContent = 'Creating...';

      try {
        // Create config summary from all pieces
        var configSummary = pieces.map(function(p) { return p.label; }).join(' + ');

        // Create hash from all pieces
        var configData = {
          fabric: selectedFabric.id,
          pieces: pieces.map(function(p) {
            return {
              shape: p.shape.id,
              dimensions: p.dimensions,
              fill: p.fill.id,
              piping: p.piping ? p.piping.id : null,
              button: p.button ? p.button.id : null,
              antiSkid: p.antiSkid ? p.antiSkid.id : null,
              ties: p.ties ? p.ties.id : null
            };
          }),
          price: unitPrice
        };
        var configHash = Math.abs(JSON.stringify(configData).split('').reduce(function(a, b) {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0)).toString(36);

        var variantResponse = await fetch('/apps/cushion-api/create-variant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop: shopDomain,
            productId: productId,
            price: unitPrice.toFixed(2),
            configHash: configHash,
            configSummary: configSummary
          })
        });

        if (!variantResponse.ok) {
          var err = await variantResponse.json();
          throw new Error(err.error || 'Failed to create variant');
        }
        var variantData = await variantResponse.json();

        btn.textContent = 'Adding to cart...';
        if (floatingBtn) floatingBtn.textContent = 'Adding...';
        properties['_calculated_price'] = unitPrice.toFixed(2);

        var cartResponse = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: parseInt(variantData.variantId, 10),
            quantity: qty,
            properties: properties
          })
        });

        if (!cartResponse.ok) {
          var err2 = await cartResponse.json();
          throw new Error(err2.description || 'Failed to add to cart');
        }

        btn.textContent = 'Added to Cart!';
        if (floatingBtn) floatingBtn.textContent = 'Added!';

        // Show success popup with multi-piece summary
        var piecesSummary = pieces.map(function(p) { return p.label; }).join(', ');
        showSuccessPopup({
          shape: piecesSummary,
          dimensions: pieces.length + ' pieces',
          fabric: selectedFabric.name,
          fill: pieces.map(function(p) { return p.fill.name; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).join(', '),
          quantity: qty,
          price: '$' + calculatedPrice.toFixed(2),
          hasAttachment: !!attachmentUrl,
          isMultiPiece: true
        });

        // Clear attachment for next order
        clearAttachment();

        setTimeout(function() {
          btn.textContent = 'Add to Cart - $' + calculatedPrice.toFixed(2);
          btn.disabled = false;
          if (floatingBtn) {
            floatingBtn.textContent = 'Add to Cart';
            floatingBtn.disabled = false;
          }
        }, 1500);

      } catch (error) {
        console.error('Add to cart error:', error);
        btn.textContent = 'Add to Cart - $' + calculatedPrice.toFixed(2);
        btn.disabled = false;
        if (floatingBtn) {
          floatingBtn.textContent = 'Add to Cart';
          floatingBtn.disabled = false;
        }
        showError(error.message || 'Failed to add to cart.');
      }
    }

    function showSuccessPopup(details) {
      var overlay = document.getElementById('cart-success-overlay-' + blockId);
      var viewCartBtn = document.getElementById('view-cart-' + blockId);
      var attachmentHtml = details.hasAttachment ? '<p><strong>Attachment:</strong> Image attached ✓</p>' : '';
      document.getElementById('cart-success-details-' + blockId).innerHTML =
        '<p><strong>Shape:</strong> ' + details.shape + '</p><p><strong>Dimensions:</strong> ' + details.dimensions + '</p>' +
        '<p><strong>Fabric:</strong> ' + details.fabric + '</p><p><strong>Fill:</strong> ' + details.fill + '</p>' +
        '<p><strong>Quantity:</strong> ' + details.quantity + '</p>' + attachmentHtml +
        '<p class="kraft2026zion-price-line"><strong>Price:</strong> ' + details.price + '</p>';
      overlay.style.display = 'flex';
      ['cart:add', 'cart:update', 'cart:refresh'].forEach(function(e) { document.dispatchEvent(new CustomEvent(e, { bubbles: true })); });

      viewCartBtn.disabled = true;
      var countdown = 5;
      viewCartBtn.textContent = 'View Cart (' + countdown + ')';
      var countdownInterval = setInterval(function() {
        countdown--;
        if (countdown > 0) {
          viewCartBtn.textContent = 'View Cart (' + countdown + ')';
        } else {
          viewCartBtn.textContent = 'View Cart';
          viewCartBtn.disabled = false;
          clearInterval(countdownInterval);
        }
      }, 1000);
    }

    function hideSuccessPopup() { document.getElementById('cart-success-overlay-' + blockId).style.display = 'none'; }
    function showError(msg) { var el = document.getElementById('error-msg-' + blockId); el.textContent = msg; el.style.display = 'block'; setTimeout(function() { el.style.display = 'none'; }, 5000); }

    var browserCurrentCategoryId = null;
    var browserCurrentCategoryName = null;
    var browserCurrentPage = 1;
    var browserSelectedFabric = null;

    function openFabricBrowserPopup(categoryId, categoryName) {
      browserCurrentCategoryId = categoryId;
      browserCurrentCategoryName = categoryName;
      browserCurrentPage = 1;

      // If there's already a selected fabric from the calculator, use it as the browser selection
      browserSelectedFabric = selectedFabric || null;

      document.getElementById('fabric-browser-title-' + blockId).textContent = 'Browse ' + categoryName + ' Fabrics';

      var detailPanel = document.getElementById('fabric-detail-panel-' + blockId);
      var placeholder = detailPanel.querySelector('.fabric-detail-placeholder');
      var detailContent = document.getElementById('fabric-detail-content-' + blockId);

      // If we have a pre-selected fabric, show it in the detail panel
      if (browserSelectedFabric) {
        document.getElementById('fabric-browser-select-' + blockId).disabled = false;
        placeholder.style.display = 'none';
        detailContent.style.display = 'flex';

        // Update detail content with the pre-selected fabric
        document.getElementById('fabric-detail-image-' + blockId).src = browserSelectedFabric.imageUrl || '';
        document.getElementById('fabric-detail-name-' + blockId).textContent = browserSelectedFabric.name;
        document.getElementById('fabric-detail-category-' + blockId).textContent = browserSelectedFabric.categoryName || '-';
        document.getElementById('fabric-detail-pattern-' + blockId).textContent = browserSelectedFabric.patternName || '-';
        document.getElementById('fabric-detail-color-' + blockId).textContent = browserSelectedFabric.colorName || '-';
        document.getElementById('fabric-detail-brand-' + blockId).textContent = browserSelectedFabric.brandName || '-';
        document.getElementById('fabric-detail-tier-' + blockId).textContent = browserSelectedFabric.priceTier ? TIER_LABELS[browserSelectedFabric.priceTier] || browserSelectedFabric.priceTier : '-';
      } else {
        document.getElementById('fabric-browser-select-' + blockId).disabled = true;
        placeholder.style.display = 'flex';
        detailContent.style.display = 'none';
      }

      resetBrowserFilters();
      loadLookupData();
      document.getElementById('fabric-browser-overlay-' + blockId).style.display = 'flex';
      loadPaginatedFabrics();
    }

    async function loadLookupData() {
      if (lookupData) return;
      try {
        var response = await fetch('/apps/cushion-api/fabric-lookups?shop=' + shopDomain);
        if (response.ok) {
          lookupData = await response.json();
          populateFilterOptions();
        }
      } catch (e) {
        console.error('Error loading lookup data:', e);
      }
    }

    function closeFabricBrowserPopup() {
      document.getElementById('fabric-browser-overlay-' + blockId).style.display = 'none';
      browserSelectedFabric = null;
    }

    var browserFabricsData = [];

    async function loadPaginatedFabrics() {
      var loading = document.getElementById('fabric-browser-loading-' + blockId);
      var content = document.getElementById('fabric-browser-content-' + blockId);
      var grid = document.getElementById('fabric-browser-grid-' + blockId);
      var detailPanel = document.getElementById('fabric-detail-panel-' + blockId);

      if (!loading || !content || !grid) return;

      loading.style.display = 'block';
      if (content.parentElement) content.parentElement.style.display = 'none';

      try {
        var params = new URLSearchParams({ shop: shopDomain, page: browserCurrentPage, limit: 80 });

        if (browserCurrentCategoryId && browserCurrentCategoryId !== 'all') {
          params.append('categoryId', browserCurrentCategoryId);
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
        browserFabricsData = data.fabrics;

        if (data.fabrics.length === 0) {
          grid.innerHTML = '<div class="kraft2026zion-fabric-browser-empty">No fabrics found</div>';
        } else {
          grid.innerHTML = data.fabrics.map(function(f) {
            var tierBadge = f.priceTier && f.priceTier !== 'none' ? '<span class="kraft2026zion-fabric-tier-badge">' + TIER_LABELS[f.priceTier] + '</span>' : '';
            return '<div class="kraft2026zion-fabric-thumb' + (browserSelectedFabric && browserSelectedFabric.id === f.id ? ' kraft2026zion-selected' : '') + '" data-id="' + f.id + '">' +
              (f.imageUrl ? '<img src="' + f.imageUrl + '" alt="' + f.name + '">' : '<span style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#999;">No img</span>') +
              tierBadge +
              '</div>';
          }).join('');

          grid.querySelectorAll('.fabric-thumb').forEach(function(thumb) {
            thumb.addEventListener('click', function() {
              var fabricId = thumb.dataset.id;
              var fabric = browserFabricsData.find(function(f) { return f.id === fabricId; });
              if (fabric) selectPopupFabric(fabric);
            });
          });
        }

        var pagination = data.pagination;
        document.getElementById('pagination-info-' + blockId).textContent = pagination.page + ' / ' + pagination.totalPages;
        document.getElementById('pagination-prev-' + blockId).disabled = !pagination.hasPrev;
        document.getElementById('pagination-next-' + blockId).disabled = !pagination.hasNext;

        loading.style.display = 'none';
        content.parentElement.style.display = 'flex';

        // Reset detail panel if no fabric selected
        if (!browserSelectedFabric) {
          document.getElementById('fabric-detail-content-' + blockId).style.display = 'none';
          detailPanel.querySelector('.fabric-detail-placeholder').style.display = 'flex';
        }

      } catch (error) {
        console.error('Error loading paginated fabrics:', error);
        loading.style.display = 'none';
        content.parentElement.style.display = 'flex';
        grid.innerHTML = '<div class="kraft2026zion-fabric-browser-empty">Failed to load fabrics</div>';
      }
    }

    function populateFilterOptions() {
      if (!lookupData) return;

      var currentBrand = document.getElementById('filter-brand-' + blockId).value;
      var currentPattern = document.getElementById('filter-pattern-' + blockId).value;
      var currentColor = document.getElementById('filter-color-' + blockId).value;
      var currentMaterial = document.getElementById('filter-material-' + blockId).value;

      var brandSelect = document.getElementById('filter-brand-' + blockId);
      brandSelect.innerHTML = '<option value="">Brand</option>' + (lookupData.brands || []).map(function(b) {
        return '<option value="' + b.id + '"' + (b.id === currentBrand ? ' kraft2026zion-selected' : '') + '>' + b.name + '</option>';
      }).join('');

      var patSelect = document.getElementById('filter-pattern-' + blockId);
      patSelect.innerHTML = '<option value="">Pattern</option>' + (lookupData.patterns || []).map(function(p) {
        return '<option value="' + p.id + '"' + (p.id === currentPattern ? ' kraft2026zion-selected' : '') + '>' + p.name + '</option>';
      }).join('');

      var colorSelect = document.getElementById('filter-color-' + blockId);
      colorSelect.innerHTML = '<option value="">Color</option>' + (lookupData.colors || []).map(function(c) {
        return '<option value="' + c.id + '"' + (c.id === currentColor ? ' kraft2026zion-selected' : '') + '>' + c.name + '</option>';
      }).join('');

      var materialSelect = document.getElementById('filter-material-' + blockId);
      materialSelect.innerHTML = '<option value="">Material</option>' + (lookupData.materials || []).map(function(m) {
        return '<option value="' + m.id + '"' + (m.id === currentMaterial ? ' kraft2026zion-selected' : '') + '>' + m.name + '</option>';
      }).join('');
    }

    function resetBrowserFilters() {
      document.getElementById('filter-brand-' + blockId).value = '';
      document.getElementById('filter-pattern-' + blockId).value = '';
      document.getElementById('filter-color-' + blockId).value = '';
      document.getElementById('filter-material-' + blockId).value = '';
      document.getElementById('filter-sort-' + blockId).value = 'priceTier-asc';
      browserCurrentPage = 1;
    }

    function selectPopupFabric(fabric) {
      browserSelectedFabric = fabric;

      var grid = document.getElementById('fabric-browser-grid-' + blockId);
      grid.querySelectorAll('.fabric-thumb').forEach(function(thumb) {
        thumb.classList.toggle('kraft2026zion-selected', thumb.dataset.id === fabric.id);
      });

      // Show detail panel
      var detailPanel = document.getElementById('fabric-detail-panel-' + blockId);
      var placeholder = detailPanel.querySelector('.fabric-detail-placeholder');
      var detailContent = document.getElementById('fabric-detail-content-' + blockId);

      placeholder.style.display = 'none';
      detailContent.style.display = 'flex';

      // Update detail content
      document.getElementById('fabric-detail-image-' + blockId).src = fabric.imageUrl || '';
      document.getElementById('fabric-detail-name-' + blockId).textContent = fabric.name;
      document.getElementById('fabric-detail-category-' + blockId).textContent = fabric.categoryName || '-';
      document.getElementById('fabric-detail-pattern-' + blockId).textContent = fabric.patternName || '-';
      document.getElementById('fabric-detail-color-' + blockId).textContent = fabric.colorName || '-';
      document.getElementById('fabric-detail-brand-' + blockId).textContent = fabric.brandName || '-';
      document.getElementById('fabric-detail-tier-' + blockId).textContent = fabric.priceTier ? TIER_LABELS[fabric.priceTier] || fabric.priceTier : '-';
      document.getElementById('fabric-detail-material-' + blockId).textContent = fabric.materialName || '-';

      document.getElementById('fabric-browser-select-' + blockId).disabled = false;
    }

    function confirmFabricSelection() {
      if (!browserSelectedFabric) return;
      selectFabric(browserSelectedFabric);
      closeFabricBrowserPopup();
    }

    function setupFabricBrowserEventListeners() {
      var closeBtn = document.getElementById('fabric-browser-close-' + blockId);
      var overlay = document.getElementById('fabric-browser-overlay-' + blockId);
      var applyBtn = document.getElementById('filter-apply-' + blockId);
      var resetBtn = document.getElementById('filter-reset-' + blockId);
      var prevBtn = document.getElementById('pagination-prev-' + blockId);
      var nextBtn = document.getElementById('pagination-next-' + blockId);
      var selectBtn = document.getElementById('fabric-browser-select-' + blockId);

      if (closeBtn) closeBtn.addEventListener('click', closeFabricBrowserPopup);

      if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target.id === 'fabric-browser-overlay-' + blockId) closeFabricBrowserPopup();
      });

      if (applyBtn) applyBtn.addEventListener('click', function() {
        browserCurrentPage = 1;
        loadPaginatedFabrics();
      });

      if (resetBtn) resetBtn.addEventListener('click', function() {
        resetBrowserFilters();
        loadPaginatedFabrics();
      });

      if (prevBtn) prevBtn.addEventListener('click', function() {
        if (browserCurrentPage > 1) {
          browserCurrentPage--;
          loadPaginatedFabrics();
        }
      });

      if (nextBtn) nextBtn.addEventListener('click', function() {
        browserCurrentPage++;
        loadPaginatedFabrics();
      });

      if (selectBtn) selectBtn.addEventListener('click', confirmFabricSelection);
    }

    async function applyUrlConfiguration() {
      var params = new URLSearchParams(window.location.search);
      if (params.get('customize') !== 'true') return;

      var shapeId = params.get('shapeId');
      if (shapeId) {
        var shape = config.shapes.find(function(s) { return s.id === shapeId; });
        if (shape) selectShape(shape);
      }

      var dimStr = params.get('dimensions');
      if (dimStr && selectedShape) {
        var dimParts = dimStr.split(',');
        dimParts.forEach(function(part) {
          var kv = part.split(':');
          if (kv[0] && kv[1]) {
            var numValue = parseFloat(kv[1]);
            if (!isNaN(numValue)) {
              dimensions[kv[0]] = numValue;
              var input = document.getElementById('dim-' + kv[0] + '-' + blockId);
              if (input) input.value = numValue;
            }
          }
        });
        updateDimensionValue();
      }

      var fillId = params.get('fillId');
      if (fillId) {
        var fill = config.fillTypes.find(function(f) { return f.id === fillId; });
        if (fill) selectFill(fill);
      }

      var fabricId = params.get('fabricId');
      if (fabricId) {
        var uncatFabric = (config.uncategorizedFabrics || []).find(function(f) { return f.id === fabricId; });
        if (uncatFabric) {
          selectFabric(uncatFabric);
        } else {
          try {
            var resp = await fetch('/apps/cushion-api/fabrics-paginated?shop=' + shopDomain + '&search=&limit=100&page=1');
            if (resp.ok) {
              var data = await resp.json();
              var fab = (data.fabrics || []).find(function(f) { return f.id === fabricId; });
              if (fab) selectFabric(fab);
            }
          } catch (e) { /* ignore */ }
        }
      }

      var pipingId = params.get('pipingId');
      if (pipingId && pipingId !== 'none') selectPiping(pipingId);

      var buttonId = params.get('buttonId');
      if (buttonId && buttonId !== 'none') selectButton(buttonId);

      var antiSkidId = params.get('antiSkidId');
      if (antiSkidId && antiSkidId !== 'none') selectAntiSkid(antiSkidId);

      var tiesId = params.get('tiesId');
      if (tiesId && tiesId !== 'none') selectTies(tiesId);

      var qty = params.get('qty');
      if (qty) {
        var qtyNum = parseInt(qty, 10);
        if (!isNaN(qtyNum) && qtyNum > 0) {
          document.getElementById('quantity-' + blockId).value = qtyNum;
        }
      }

      var instructions = params.get('instructions');
      if (instructions) {
        document.getElementById('instructions-text-' + blockId).value = decodeURIComponent(instructions);
      }

      calculatePrice();
    }

    init();
  }

  // Cart page refresh logic
  if (window.location.pathname === '/cart' && sessionStorage.getItem('cushion_refresh_cart') === 'true') {
    sessionStorage.removeItem('cushion_refresh_cart');
    setTimeout(function() { window.location.reload(); }, 1500);
  }

  async function checkCartPrices() {
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
  }

  if (window.location.pathname === '/cart') {
    setTimeout(checkCartPrices, 1000);
  }
})();
