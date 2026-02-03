// Cushion Price Calculator - Selections Module
// Single-piece selection handlers

CushionCalculator.prototype.selectShape = function(shape) {
  this.selectedShape = shape;
  this.panelCount = 1;
  var blockId = this.blockId;
  document.querySelectorAll('#shape-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === shape.id); });
  document.getElementById('value-shape-' + blockId).textContent = shape.name;
  document.getElementById('value-shape-' + blockId).classList.add('kraft2026zion-selected');
  this.renderDimensionFields(shape);
  this.dimensions = {};
  var self = this;
  shape.inputFields.forEach(function(f) { var v = parseFloat(f.defaultValue); if (!isNaN(v) && v > 0) self.dimensions[f.key] = v; });
  this.updateDimensionValue();
  this.calculatePrice();
};

CushionCalculator.prototype.selectFill = function(fill) {
  this.selectedFill = fill;
  var blockId = this.blockId;
  document.querySelectorAll('#fill-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === fill.id); });
  document.getElementById('value-fill-' + blockId).textContent = fill.name;
  document.getElementById('value-fill-' + blockId).classList.add('kraft2026zion-selected');
  this.calculatePrice();
};

CushionCalculator.prototype.selectFabric = function(fabric) {
  this.selectedFabric = fabric;
  var blockId = this.blockId;
  document.querySelectorAll('#fabric-categories-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === fabric.id); });
  document.getElementById('value-fabric-' + blockId).textContent = fabric.name;
  document.getElementById('value-fabric-' + blockId).classList.add('kraft2026zion-selected');

  // Also update piece-level fabric value in multi-piece mode
  if (this.isMultiPieceMode) {
    var pieceFabricValue = document.getElementById('piece-value-fabric-' + blockId);
    if (pieceFabricValue) {
      pieceFabricValue.textContent = fabric.name;
      pieceFabricValue.classList.add('kraft2026zion-selected');
    }

    // Update selection state in piece fabric preview
    var piecePreviewCont = document.getElementById('piece-fabric-preview-container-' + blockId);
    if (piecePreviewCont) {
      piecePreviewCont.querySelectorAll('.kraft2026zion-fabric-preview-thumb').forEach(function(t) {
        t.classList.toggle('kraft2026zion-selected', t.dataset.fabricId === fabric.id);
      });
    }
  }

  this.calculatePrice();
};

CushionCalculator.prototype.selectPiping = function(id) {
  var blockId = this.blockId;
  this.selectedPiping = id === 'none' ? null : this.config.pipingOptions.find(function(p) { return p.id === id; });
  document.querySelectorAll('#piping-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-piping-' + blockId).textContent = this.selectedPiping ? this.selectedPiping.name : 'None';
  document.getElementById('value-piping-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedPiping);
  this.calculatePrice();
};

CushionCalculator.prototype.selectButton = function(id) {
  var blockId = this.blockId;
  var opts = this.config.buttonStyleOptions || [];
  this.selectedButton = id === 'none' ? null : opts.find(function(b) { return b.id === id; });
  document.querySelectorAll('#button-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-button-' + blockId).textContent = this.selectedButton ? this.selectedButton.name : 'None';
  document.getElementById('value-button-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedButton);
  this.calculatePrice();
};

CushionCalculator.prototype.selectAntiSkid = function(id) {
  var blockId = this.blockId;
  var opts = this.config.antiSkidOptions || [];
  this.selectedAntiSkid = id === 'none' ? null : opts.find(function(a) { return a.id === id; });
  document.querySelectorAll('#antiskid-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-antiskid-' + blockId).textContent = this.selectedAntiSkid ? this.selectedAntiSkid.name : 'None';
  document.getElementById('value-antiskid-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedAntiSkid);
  this.calculatePrice();
};

CushionCalculator.prototype.selectTies = function(id) {
  var blockId = this.blockId;
  var opts = this.config.tiesOptions || [];
  this.selectedTies = id === 'none' ? null : opts.find(function(t) { return t.id === id; });
  document.querySelectorAll('#ties-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-ties-' + blockId).textContent = this.selectedTies ? this.selectedTies.name : 'None';
  document.getElementById('value-ties-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedTies);
  this.calculatePrice();
};

CushionCalculator.prototype.selectDesign = function(id) {
  var blockId = this.blockId;
  var opts = this.config.designOptions || [];
  this.selectedDesign = id === 'none' ? null : opts.find(function(d) { return d.id === id; });
  document.querySelectorAll('#design-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-design-' + blockId).textContent = this.selectedDesign ? this.selectedDesign.name : 'None';
  document.getElementById('value-design-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedDesign);
  this.calculatePrice();
};

CushionCalculator.prototype.selectFabricTies = function(id) {
  var blockId = this.blockId;
  var opts = this.config.fabricTiesOptions || [];
  this.selectedFabricTies = id === 'none' ? null : opts.find(function(ft) { return ft.id === id; });
  document.querySelectorAll('#fabricties-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-fabricties-' + blockId).textContent = this.selectedFabricTies ? this.selectedFabricTies.name : 'None';
  document.getElementById('value-fabricties-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedFabricTies);
  this.calculatePrice();
};

CushionCalculator.prototype.selectRodPocket = function(id) {
  var blockId = this.blockId;
  var opts = this.config.rodPocketOptions || [];
  this.selectedRodPocket = id === 'none' ? null : opts.find(function(rp) { return rp.id === id; });
  document.querySelectorAll('#rodpocket-grid-' + blockId + ' .kraft2026zion-option-card').forEach(function(c) { c.classList.toggle('kraft2026zion-selected', c.dataset.id === id); });
  document.getElementById('value-rodpocket-' + blockId).textContent = this.selectedRodPocket ? this.selectedRodPocket.name : 'None';
  document.getElementById('value-rodpocket-' + blockId).classList.toggle('kraft2026zion-selected', !!this.selectedRodPocket);
  this.calculatePrice();
};

CushionCalculator.prototype.updateDimensionValue = function() {
  var blockId = this.blockId;
  var keys = Object.keys(this.dimensions);
  var dims = this.dimensions;
  if (keys.length === 0 || keys.every(function(k) { return !dims[k]; })) {
    document.getElementById('value-dimensions-' + blockId).textContent = 'Not set';
    document.getElementById('value-dimensions-' + blockId).classList.remove('kraft2026zion-selected');
  } else {
    var vals = keys.filter(function(k) { return dims[k]; }).map(function(k) { return dims[k] + '"'; }).join(' x ');
    document.getElementById('value-dimensions-' + blockId).textContent = vals;
    document.getElementById('value-dimensions-' + blockId).classList.add('kraft2026zion-selected');
  }
};
