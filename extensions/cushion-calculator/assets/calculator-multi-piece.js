// Cushion Price Calculator - Multi-Piece Module
// Multi-piece mode initialization, tabs, piece rendering, listeners

CushionCalculator.prototype.initMultiPieceMode = function() {
  var blockId = this.blockId;
  var singlePieceContainer = document.getElementById('single-piece-container-' + blockId);
  var multiPieceContainer = document.getElementById('multi-piece-container-' + blockId);
  var sharedFabricContainer = document.getElementById('shared-fabric-container-' + blockId);
  var singlePieceBreakdown = document.getElementById('price-breakdown-' + blockId);
  var multiPieceBreakdownContainer = document.getElementById('multi-piece-breakdown-container-' + blockId);

  if (singlePieceContainer) singlePieceContainer.style.display = 'none';
  if (multiPieceContainer) multiPieceContainer.style.display = 'block';
  if (sharedFabricContainer) sharedFabricContainer.style.display = 'none';
  if (singlePieceBreakdown) singlePieceBreakdown.style.display = 'none';
  if (multiPieceBreakdownContainer) multiPieceBreakdownContainer.style.display = 'block';

  var self = this;

  // Initialize pieces array from profile config
  this.pieces = this.config.profile.pieces.map(function(pieceConfig, idx) {
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
  this.pieces.forEach(function(piece, idx) {
    var pc = piece.config;

    if (pc.defaultShapeId) {
      var shape = self.getFilteredShapes(pc).find(function(s) { return s.id === pc.defaultShapeId; });
      if (shape) {
        piece.shape = shape;
        piece.dimensions = {};
        shape.inputFields.forEach(function(f) {
          var v = parseFloat(f.defaultValue);
          if (!isNaN(v) && v > 0) piece.dimensions[f.key] = v;
        });
      }
    }

    if (pc.defaultFillId) {
      var fill = self.getFilteredFillTypes(pc).find(function(f) { return f.id === pc.defaultFillId; });
      if (fill) piece.fill = fill;
    }

    // Hidden values
    if (pc.showFillSection === false && pc.hiddenFillTypeId) {
      var hiddenFill = self.config.fillTypes.find(function(f) { return f.id === pc.hiddenFillTypeId; });
      if (hiddenFill) piece.fill = hiddenFill;
    }
    if (pc.showDesignSection === false && pc.hiddenDesignId) {
      piece.design = (self.config.designOptions || []).find(function(d) { return d.id === pc.hiddenDesignId; }) || null;
    }
    if (pc.showPipingSection === false && pc.hiddenPipingId) {
      piece.piping = self.config.pipingOptions.find(function(p) { return p.id === pc.hiddenPipingId; }) || null;
    }
    if (pc.showButtonSection === false && pc.hiddenButtonId) {
      piece.button = (self.config.buttonStyleOptions || []).find(function(b) { return b.id === pc.hiddenButtonId; }) || null;
    }
    if (pc.showAntiSkidSection === false && pc.hiddenAntiSkidId) {
      piece.antiSkid = (self.config.antiSkidOptions || []).find(function(a) { return a.id === pc.hiddenAntiSkidId; }) || null;
    }
    if (pc.showRodPocketSection === false && pc.hiddenRodPocketId) {
      piece.rodPocket = (self.config.rodPocketOptions || []).find(function(rp) { return rp.id === pc.hiddenRodPocketId; }) || null;
    }
    if (pc.showTiesSection === false && pc.hiddenTiesId) {
      piece.ties = (self.config.tiesOptions || []).find(function(t) { return t.id === pc.hiddenTiesId; }) || null;
    }
    if (pc.showFabricTiesSection === false && pc.hiddenFabricTiesId) {
      piece.fabricTies = (self.config.fabricTiesOptions || []).find(function(ft) { return ft.id === pc.hiddenFabricTiesId; }) || null;
    }
    // Hidden shape for piece
    if (pc.showShapeSection === false && pc.hiddenShapeId) {
      var hiddenShape = self.config.shapes.find(function(s) { return s.id === pc.hiddenShapeId; });
      if (hiddenShape) {
        piece.shape = hiddenShape;
        piece.dimensions = {};
        hiddenShape.inputFields.forEach(function(f) {
          var v = parseFloat(f.defaultValue);
          if (!isNaN(v) && v > 0) piece.dimensions[f.key] = v;
        });
      }
    }

    // Apply profile-level defaults for add-ons
    if (!piece.design && self.config.defaultDesignId && pc.showDesignSection !== false) {
      piece.design = (self.config.designOptions || []).find(function(d) { return d.id === self.config.defaultDesignId; }) || null;
    }
    if (!piece.piping && self.config.defaultPipingId && pc.showPipingSection !== false) {
      piece.piping = self.config.pipingOptions.find(function(p) { return p.id === self.config.defaultPipingId; }) || null;
    }
    if (!piece.button && self.config.defaultButtonId && pc.showButtonSection !== false) {
      piece.button = (self.config.buttonStyleOptions || []).find(function(b) { return b.id === self.config.defaultButtonId; }) || null;
    }
    if (!piece.antiSkid && self.config.defaultAntiSkidId && pc.showAntiSkidSection !== false) {
      piece.antiSkid = (self.config.antiSkidOptions || []).find(function(a) { return a.id === self.config.defaultAntiSkidId; }) || null;
    }
    if (!piece.rodPocket && self.config.defaultRodPocketId && pc.showRodPocketSection !== false) {
      piece.rodPocket = (self.config.rodPocketOptions || []).find(function(rp) { return rp.id === self.config.defaultRodPocketId; }) || null;
    }
    if (!piece.ties && self.config.defaultTiesId && pc.showTiesSection !== false) {
      piece.ties = (self.config.tiesOptions || []).find(function(t) { return t.id === self.config.defaultTiesId; }) || null;
    }
    if (!piece.fabricTies && self.config.defaultFabricTiesId && pc.showFabricTiesSection !== false) {
      piece.fabricTies = (self.config.fabricTiesOptions || []).find(function(ft) { return ft.id === self.config.defaultFabricTiesId; }) || null;
    }
  });

  // Render pieces label
  var piecesLabel = document.getElementById('pieces-label-' + blockId);
  if (piecesLabel) {
    piecesLabel.textContent = this.config.profile.piecesLabel || 'Pieces';
  }

  this.renderPieceTabs();
  this.activePieceIndex = 0;
  this.switchToPiece(0);
  this.calculatePrice();
};

// Helper to parse allowed IDs (handles both array and JSON string)
CushionCalculator.prototype.parseAllowedIds = function(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return null; }
  }
  return null;
};

// Filtered option helpers
CushionCalculator.prototype.getFilteredShapes = function(pieceConfig) {
  if (!pieceConfig || !pieceConfig.allowedShapeIds) return this.config.shapes;
  var allowed = this.parseAllowedIds(pieceConfig.allowedShapeIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return this.config.shapes;
  return this.config.shapes.filter(function(s) { return allowed.includes(s.id); });
};

CushionCalculator.prototype.getFilteredFillTypes = function(pieceConfig) {
  if (!pieceConfig || !pieceConfig.allowedFillIds) return this.config.fillTypes;
  var allowed = this.parseAllowedIds(pieceConfig.allowedFillIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return this.config.fillTypes;
  return this.config.fillTypes.filter(function(f) { return allowed.includes(f.id); });
};

CushionCalculator.prototype.getFilteredPipingOptions = function(pieceConfig) {
  if (!pieceConfig || !pieceConfig.allowedPipingIds) return this.config.pipingOptions;
  var allowed = this.parseAllowedIds(pieceConfig.allowedPipingIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return this.config.pipingOptions;
  return this.config.pipingOptions.filter(function(p) { return allowed.includes(p.id); });
};

CushionCalculator.prototype.getFilteredButtonOptions = function(pieceConfig) {
  var opts = this.config.buttonStyleOptions || [];
  if (!pieceConfig || !pieceConfig.allowedButtonIds) return opts;
  var allowed = this.parseAllowedIds(pieceConfig.allowedButtonIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return opts;
  return opts.filter(function(b) { return allowed.includes(b.id); });
};

CushionCalculator.prototype.getFilteredAntiSkidOptions = function(pieceConfig) {
  var opts = this.config.antiSkidOptions || [];
  if (!pieceConfig || !pieceConfig.allowedAntiSkidIds) return opts;
  var allowed = this.parseAllowedIds(pieceConfig.allowedAntiSkidIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return opts;
  return opts.filter(function(a) { return allowed.includes(a.id); });
};

CushionCalculator.prototype.getFilteredTiesOptions = function(pieceConfig) {
  var opts = this.config.tiesOptions || [];
  if (!pieceConfig || !pieceConfig.allowedTiesIds) return opts;
  var allowed = this.parseAllowedIds(pieceConfig.allowedTiesIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return opts;
  return opts.filter(function(t) { return allowed.includes(t.id); });
};

CushionCalculator.prototype.getFilteredDesignOptions = function(pieceConfig) {
  var opts = this.config.designOptions || [];
  if (!pieceConfig || !pieceConfig.allowedDesignIds) return opts;
  var allowed = this.parseAllowedIds(pieceConfig.allowedDesignIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return opts;
  return opts.filter(function(d) { return allowed.includes(d.id); });
};

CushionCalculator.prototype.getFilteredFabricTiesOptions = function(pieceConfig) {
  var opts = this.config.fabricTiesOptions || [];
  if (!pieceConfig || !pieceConfig.allowedFabricTiesIds) return opts;
  var allowed = this.parseAllowedIds(pieceConfig.allowedFabricTiesIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return opts;
  return opts.filter(function(ft) { return allowed.includes(ft.id); });
};

CushionCalculator.prototype.getFilteredRodPocketOptions = function(pieceConfig) {
  var opts = this.config.rodPocketOptions || [];
  if (!pieceConfig || !pieceConfig.allowedRodPocketIds) return opts;
  var allowed = this.parseAllowedIds(pieceConfig.allowedRodPocketIds);
  if (!Array.isArray(allowed) || allowed.length === 0) return opts;
  return opts.filter(function(rp) { return allowed.includes(rp.id); });
};

CushionCalculator.prototype.renderPieceTabs = function() {
  var blockId = this.blockId;
  var tabsContainer = document.getElementById('pieces-tabs-' + blockId);
  if (!tabsContainer) return;
  var self = this;

  tabsContainer.innerHTML = this.pieces.map(function(piece, idx) {
    return '<button type="button" class="kraft2026zion-piece-tab' + (idx === 0 ? ' kraft2026zion-active' : '') + '" data-piece-index="' + idx + '">' +
      '<span class="kraft2026zion-piece-tab-name">' + piece.label + '</span>' +
      '<span class="kraft2026zion-piece-tab-status" id="piece-status-' + idx + '-' + blockId + '"></span>' +
      '</button>';
  }).join('');

  tabsContainer.querySelectorAll('.kraft2026zion-piece-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var idx = parseInt(tab.dataset.pieceIndex);
      self.switchToPiece(idx);
    });
  });

  this.updatePieceTabStatuses();
};

CushionCalculator.prototype.updatePieceTabStatuses = function() {
  // No-op: tab status indicators removed
};

CushionCalculator.prototype.hasRequiredDimensions = function(piece) {
  if (!piece.shape) return false;
  return piece.shape.inputFields.filter(function(f) { return f.required; }).every(function(f) {
    return piece.dimensions[f.key] && piece.dimensions[f.key] > 0;
  });
};

CushionCalculator.prototype.switchToPiece = function(idx) {
  if (idx < 0 || idx >= this.pieces.length) return;

  this.activePieceIndex = idx;
  var piece = this.pieces[idx];
  var pieceConfig = piece.config;
  var blockId = this.blockId;
  var self = this;

  var tabsContainer = document.getElementById('pieces-tabs-' + blockId);
  if (tabsContainer) {
    tabsContainer.querySelectorAll('.kraft2026zion-piece-tab').forEach(function(tab, i) {
      tab.classList.toggle('kraft2026zion-active', i === idx);
    });
  }

  var pieceContent = document.getElementById('pieces-content-' + blockId);
  if (!pieceContent) return;

  var html = '';
  var sectionNum = 1;
  var sv = this.config.sectionVisibility || {};

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

  // Fabric section
  var fabricVisible = sv.showFabricSection !== false;
  if (fabricVisible) {
    html += '<div class="kraft2026zion-accordion-section" data-section="piece-fabric">' +
      '<div class="kraft2026zion-accordion-header" id="piece-header-fabric-' + blockId + '">' +
      '<span class="kraft2026zion-header-title">' + sectionNum + '. Select Fabric</span>' +
      '<span class="kraft2026zion-header-value' + (this.selectedFabric ? ' kraft2026zion-selected' : '') + '" id="piece-value-fabric-' + blockId + '">' + (this.selectedFabric ? this.selectedFabric.name : 'Not selected') + '</span>' +
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

  this.renderPieceShapes(piece, pieceConfig);
  this.renderPieceDimensions(piece);
  this.renderPieceFillTypes(piece, pieceConfig);
  this.renderPieceFabricSection();
  this.renderPieceDesignOptions(piece, pieceConfig);
  this.renderPiecePipingOptions(piece, pieceConfig);
  this.renderPieceButtonOptions(piece, pieceConfig);
  this.renderPieceAntiSkidOptions(piece, pieceConfig);
  this.renderPieceRodPocketOptions(piece, pieceConfig);
  this.renderPieceTiesOptions(piece, pieceConfig);
  this.renderPieceFabricTiesOptions(piece, pieceConfig);

  this.setupPieceSectionListeners();
  this.updatePieceDimensionValue(piece);
};

CushionCalculator.prototype.renderPieceShapes = function(piece, pieceConfig) {
  var blockId = this.blockId;
  var grid = document.getElementById('piece-shape-grid-' + blockId);
  if (!grid) return;

  var shapes = this.getFilteredShapes(pieceConfig);
  if (!shapes.length) { grid.innerHTML = '<p>No shapes available</p>'; return; }

  grid.innerHTML = shapes.map(function(s) {
    return '<div class="kraft2026zion-option-card' + (piece.shape && piece.shape.id === s.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-shape" data-id="' + s.id + '">' +
      (s.imageUrl ? '<img class="kraft2026zion-option-image" src="' + s.imageUrl + '" alt="' + s.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + s.name + '">' + s.name + '</div></div>';
  }).join('');

  this.initPieceSectionScrollArrows('piece-shape');
};

CushionCalculator.prototype.renderPieceDimensions = function(piece) {
  var blockId = this.blockId;
  var form = document.getElementById('piece-dimensions-form-' + blockId);
  var wrapper = document.getElementById('piece-dimensions-scroll-wrapper-' + blockId);
  var leftBtn = document.getElementById('piece-dimensions-scroll-left-' + blockId);
  var rightBtn = document.getElementById('piece-dimensions-scroll-right-' + blockId);
  var self = this;
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

  if (piece.shape.inputFields.length > 3) {
    if (wrapper) wrapper.classList.add('kraft2026zion-scroll-enabled');
    if (leftBtn) leftBtn.style.display = 'flex';
    if (rightBtn) rightBtn.style.display = 'flex';
    this.initPieceDimensionsScrollArrows();
  } else {
    if (wrapper) wrapper.classList.remove('kraft2026zion-scroll-enabled');
    if (leftBtn) leftBtn.style.display = 'none';
    if (rightBtn) rightBtn.style.display = 'none';
  }

  form.querySelectorAll('input').forEach(function(input) {
    input.addEventListener('input', function() {
      var val = parseFloat(input.value);
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      var errSpan = input.parentNode.querySelector('.kraft2026zion-dim-range-error');
      var currentPiece = self.pieces[self.activePieceIndex];

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

      self.updatePieceDimensionValue(currentPiece);
      self.updatePieceTabStatuses();
      self.calculatePrice();
    });

    input.addEventListener('blur', function() {
      var val = parseFloat(input.value);
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      var currentPiece = self.pieces[self.activePieceIndex];

      if (!isNaN(val) && val > 0) {
        if (!isNaN(min) && val < min) { input.value = min; val = min; }
        if (!isNaN(max) && val > max) { input.value = max; val = max; }
        input.classList.remove('kraft2026zion-dim-out-of-range');
        var errSpan = input.parentNode.querySelector('.kraft2026zion-dim-range-error');
        if (errSpan) errSpan.textContent = '';
        currentPiece.dimensions[input.dataset.key] = val;
        self.updatePieceDimensionValue(currentPiece);
        self.updatePieceTabStatuses();
        self.calculatePrice();
      }
    });
  });
};

CushionCalculator.prototype.renderPieceFillTypes = function(piece, pieceConfig) {
  var blockId = this.blockId;
  var grid = document.getElementById('piece-fill-grid-' + blockId);
  if (!grid) return;

  var fillTypes = this.getFilteredFillTypes(pieceConfig);
  if (!fillTypes.length) { grid.innerHTML = '<p>No fill types available</p>'; return; }

  grid.innerHTML = fillTypes.map(function(f) {
    return '<div class="kraft2026zion-option-card' + (piece.fill && piece.fill.id === f.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-fill" data-id="' + f.id + '">' +
      (f.imageUrl ? '<img class="kraft2026zion-option-image" src="' + f.imageUrl + '" alt="' + f.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + f.name + '">' + f.name + '</div>' +
      '<div class="kraft2026zion-option-price">$' + f.pricePerCubicInch.toFixed(4) + '/cu in</div></div>';
  }).join('');

  this.initPieceSectionScrollArrows('piece-fill');
};

CushionCalculator.prototype.renderPiecePipingOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-piping-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredPipingOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No piping options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.piping && piece.piping.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-piping" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-piping');
};

CushionCalculator.prototype.renderPieceButtonOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-button-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredButtonOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No button style options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.button && piece.button.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-button" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-button');
};

CushionCalculator.prototype.renderPieceAntiSkidOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-antiskid-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredAntiSkidOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No anti-skid options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.antiSkid && piece.antiSkid.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-antiskid" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-antiskid');
};

CushionCalculator.prototype.renderPieceTiesOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-ties-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredTiesOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No ties options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.ties && piece.ties.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-ties" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-ties');
};

CushionCalculator.prototype.renderPieceDesignOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-design-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredDesignOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No design options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.design && piece.design.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-design" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-design');
};

CushionCalculator.prototype.renderPieceFabricTiesOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-fabricties-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredFabricTiesOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No fabric ties options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.fabricTies && piece.fabricTies.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-fabricties" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-fabricties');
};

CushionCalculator.prototype.renderPieceRodPocketOptions = function(piece, pieceConfig) {
  var grid = document.getElementById('piece-rodpocket-grid-' + this.blockId);
  if (!grid) return;
  var options = this.getFilteredRodPocketOptions(pieceConfig);
  if (!options.length) { grid.innerHTML = '<p>No bottom rod pocket options available</p>'; return; }
  grid.innerHTML = options.map(function(o) {
    return '<div class="kraft2026zion-option-card' + (piece.rodPocket && piece.rodPocket.id === o.id ? ' kraft2026zion-selected' : '') + '" data-type="piece-rodpocket" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initPieceSectionScrollArrows('piece-rodpocket');
};

CushionCalculator.prototype.initPieceSectionScrollArrows = function(prefix) {
  this.setupScrollArrows(
    document.getElementById(prefix + '-scroll-wrapper-' + this.blockId),
    document.getElementById(prefix + '-scroll-left-' + this.blockId),
    document.getElementById(prefix + '-scroll-right-' + this.blockId)
  );
};

CushionCalculator.prototype.initPieceDimensionsScrollArrows = function() {
  var blockId = this.blockId;
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
};

CushionCalculator.prototype.setupPieceSectionListeners = function() {
  var blockId = this.blockId;
  var self = this;
  var pieceContent = document.getElementById('pieces-content-' + blockId);
  if (!pieceContent) return;

  pieceContent.querySelectorAll('.kraft2026zion-accordion-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var section = header.closest('.kraft2026zion-accordion-section');
      var content = section.querySelector('.kraft2026zion-accordion-content');
      var isOpen = content.classList.contains('kraft2026zion-open');

      pieceContent.querySelectorAll('.kraft2026zion-accordion-content').forEach(function(c) {
        c.classList.remove('kraft2026zion-open');
      });
      pieceContent.querySelectorAll('.kraft2026zion-accordion-header').forEach(function(h) {
        h.classList.remove('kraft2026zion-active');
      });

      if (!isOpen) {
        content.classList.add('kraft2026zion-open');
        header.classList.add('kraft2026zion-active');
      }
    });
  });

  // Open first section by default
  var firstSection = pieceContent.querySelector('.kraft2026zion-accordion-section');
  if (firstSection) {
    var firstHeader = firstSection.querySelector('.kraft2026zion-accordion-header');
    var firstContent = firstSection.querySelector('.kraft2026zion-accordion-content');
    if (firstHeader && firstContent) {
      firstHeader.classList.add('kraft2026zion-active');
      firstContent.classList.add('kraft2026zion-open');
    }
  }

  pieceContent.addEventListener('click', function(e) {
    var card = e.target.closest('.kraft2026zion-option-card');
    if (!card) return;

    var type = card.dataset.type;
    var id = card.dataset.id;
    var currentPiece = self.pieces[self.activePieceIndex];
    var pieceConfig = currentPiece.config;

    if (type === 'piece-shape') {
      var shape = self.getFilteredShapes(pieceConfig).find(function(s) { return s.id === id; });
      if (shape) {
        currentPiece.shape = shape;
        currentPiece.dimensions = {};
        shape.inputFields.forEach(function(f) {
          var v = parseFloat(f.defaultValue);
          if (!isNaN(v) && v > 0) currentPiece.dimensions[f.key] = v;
        });

        pieceContent.querySelectorAll('[data-type="piece-shape"]').forEach(function(c) {
          c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
        });
        var valueEl = document.getElementById('piece-value-shape-' + blockId);
        if (valueEl) {
          valueEl.textContent = shape.name;
          valueEl.classList.add('kraft2026zion-selected');
        }

        self.renderPieceDimensions(currentPiece);
        self.updatePieceDimensionValue(currentPiece);
        self.updatePieceTabStatuses();
        self.calculatePrice();
      }
    } else if (type === 'piece-fill') {
      var fill = self.getFilteredFillTypes(pieceConfig).find(function(f) { return f.id === id; });
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
        self.updatePieceTabStatuses();
        self.calculatePrice();
      }
    } else if (type === 'piece-piping') {
      var opt = self.getFilteredPipingOptions(pieceConfig).find(function(p) { return p.id === id; });
      currentPiece.piping = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-piping"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-piping-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    } else if (type === 'piece-button') {
      var opt = self.getFilteredButtonOptions(pieceConfig).find(function(b) { return b.id === id; });
      currentPiece.button = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-button"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-button-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    } else if (type === 'piece-antiskid') {
      var opt = self.getFilteredAntiSkidOptions(pieceConfig).find(function(a) { return a.id === id; });
      currentPiece.antiSkid = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-antiskid"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-antiskid-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    } else if (type === 'piece-ties') {
      var opt = self.getFilteredTiesOptions(pieceConfig).find(function(t) { return t.id === id; });
      currentPiece.ties = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-ties"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-ties-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    } else if (type === 'piece-design') {
      var opt = self.getFilteredDesignOptions(pieceConfig).find(function(d) { return d.id === id; });
      currentPiece.design = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-design"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-design-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    } else if (type === 'piece-fabricties') {
      var opt = self.getFilteredFabricTiesOptions(pieceConfig).find(function(ft) { return ft.id === id; });
      currentPiece.fabricTies = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-fabricties"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-fabricties-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    } else if (type === 'piece-rodpocket') {
      var opt = self.getFilteredRodPocketOptions(pieceConfig).find(function(rp) { return rp.id === id; });
      currentPiece.rodPocket = opt || null;
      pieceContent.querySelectorAll('[data-type="piece-rodpocket"]').forEach(function(c) {
        c.classList.toggle('kraft2026zion-selected', c.dataset.id === id);
      });
      var valueEl = document.getElementById('piece-value-rodpocket-' + blockId);
      if (valueEl) {
        valueEl.textContent = opt ? opt.name : 'Not selected';
        valueEl.classList.toggle('kraft2026zion-selected', !!opt);
      }
      self.calculatePrice();
    }
  });
};

CushionCalculator.prototype.updatePieceDimensionValue = function(piece) {
  var blockId = this.blockId;
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
};
