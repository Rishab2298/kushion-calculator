// Cushion Price Calculator - Renderers Module
// Single-piece rendering (shapes, fills, dimensions, options)

CushionCalculator.prototype.renderShapes = function() {
  var grid = document.getElementById('shape-grid-' + this.blockId);
  if (!this.config.shapes.length) { grid.innerHTML = '<p>No shapes available</p>'; return; }
  grid.innerHTML = this.config.shapes.map(function(s) {
    return '<div class="kraft2026zion-option-card" data-type="shape" data-id="' + s.id + '">' +
      (s.imageUrl ? '<img class="kraft2026zion-option-image" src="' + s.imageUrl + '" alt="' + s.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + s.name + '">' + s.name + '</div></div>';
  }).join('');
  this.initSectionScrollArrows('shape');
};

CushionCalculator.prototype.renderFillTypes = function() {
  var grid = document.getElementById('fill-grid-' + this.blockId);
  if (!this.config.fillTypes.length) { grid.innerHTML = '<p>No fill types available</p>'; return; }
  grid.innerHTML = this.config.fillTypes.map(function(f) {
    return '<div class="kraft2026zion-option-card" data-type="fill" data-id="' + f.id + '">' +
      (f.imageUrl ? '<img class="kraft2026zion-option-image" src="' + f.imageUrl + '" alt="' + f.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + f.name + '">' + f.name + '</div>' +
      '<div class="kraft2026zion-option-price">$' + f.pricePerCubicInch.toFixed(4) + '/cu in</div></div>';
  }).join('');
  this.initSectionScrollArrows('fill');
};

CushionCalculator.prototype.renderFabrics = function() {
  this.fabricNavLevel = 'categories';
  this.fabricNavCategoryId = null;
  this.renderCategoryGrid();

  if (this.isMultiPieceMode) {
    this.renderSharedFabricCategoryGrid();
  }
};

CushionCalculator.prototype.renderDimensionFields = function(shape) {
  var blockId = this.blockId;
  var form = document.getElementById('dimensions-form-' + blockId);
  var wrapper = document.getElementById('dimensions-scroll-wrapper-' + blockId);
  var leftBtn = document.getElementById('dimensions-scroll-left-' + blockId);
  var rightBtn = document.getElementById('dimensions-scroll-right-' + blockId);
  var panelsContainer = document.getElementById('panels-input-container-' + blockId);
  var panelRadios = document.querySelectorAll('input[name="panels-' + blockId + '"]');
  var self = this;

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
    this.initDimensionsScrollArrows();
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
        radio.checked = (parseInt(radio.value) === self.panelCount);
        radio.onchange = function() {
          self.panelCount = parseInt(this.value);
          self.calculatePrice();
        };
      });
    } else {
      panelsContainer.style.display = 'none';
      self.panelCount = 1;
    }
  }

  form.querySelectorAll('input').forEach(function(input) {
    input.addEventListener('input', function() {
      var val = parseFloat(input.value);
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      var errSpan = input.parentNode.querySelector('.kraft2026zion-dim-range-error');
      if (!isNaN(val) && val > 0) {
        if (!isNaN(min) && val < min) {
          input.classList.add('kraft2026zion-dim-out-of-range');
          if (errSpan) errSpan.textContent = 'Min ' + min;
          self.dimensions[input.dataset.key] = 0;
        } else if (!isNaN(max) && val > max) {
          input.classList.add('kraft2026zion-dim-out-of-range');
          if (errSpan) errSpan.textContent = 'Max ' + max;
          self.dimensions[input.dataset.key] = 0;
        } else {
          input.classList.remove('kraft2026zion-dim-out-of-range');
          if (errSpan) errSpan.textContent = '';
          self.dimensions[input.dataset.key] = val;
        }
      } else {
        input.classList.remove('kraft2026zion-dim-out-of-range');
        if (errSpan) errSpan.textContent = '';
        self.dimensions[input.dataset.key] = 0;
      }
      self.updateDimensionValue();
      self.calculatePrice();
    });
    input.addEventListener('blur', function() {
      var val = parseFloat(input.value);
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      if (!isNaN(val) && val > 0) {
        if (!isNaN(min) && val < min) { input.value = min; val = min; }
        if (!isNaN(max) && val > max) { input.value = max; val = max; }
        input.classList.remove('kraft2026zion-dim-out-of-range');
        var errSpan = input.parentNode.querySelector('.kraft2026zion-dim-range-error');
        if (errSpan) errSpan.textContent = '';
        self.dimensions[input.dataset.key] = val;
        self.updateDimensionValue();
        self.calculatePrice();
      }
    });
  });
};

CushionCalculator.prototype.initDimensionsScrollArrows = function() {
  var blockId = this.blockId;
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
};

CushionCalculator.prototype.renderPipingOptions = function() {
  var grid = document.getElementById('piping-grid-' + this.blockId);
  if (!this.config.pipingOptions.length) { grid.innerHTML = '<p>No piping options available</p>'; return; }
  grid.innerHTML = this.config.pipingOptions.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="piping" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initSectionScrollArrows('piping');
};

CushionCalculator.prototype.renderButtonOptions = function() {
  var grid = document.getElementById('button-grid-' + this.blockId);
  var opts = this.config.buttonStyleOptions || [];
  if (!opts.length) { grid.innerHTML = '<p>No button style options available</p>'; return; }
  grid.innerHTML = opts.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="button" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initSectionScrollArrows('button');
};

CushionCalculator.prototype.renderAntiSkidOptions = function() {
  var grid = document.getElementById('antiskid-grid-' + this.blockId);
  var opts = this.config.antiSkidOptions || [];
  if (!opts.length) { grid.innerHTML = '<p>No anti-skid options available</p>'; return; }
  grid.innerHTML = opts.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="antiskid" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initSectionScrollArrows('antiskid');
};

CushionCalculator.prototype.renderTiesOptions = function() {
  var grid = document.getElementById('ties-grid-' + this.blockId);
  var opts = this.config.tiesOptions || [];
  if (!opts.length) { grid.innerHTML = '<p>No ties options available</p>'; return; }
  grid.innerHTML = opts.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="ties" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
  }).join('');
  this.initSectionScrollArrows('ties');
};

CushionCalculator.prototype.renderDesignOptions = function() {
  var grid = document.getElementById('design-grid-' + this.blockId);
  var opts = this.config.designOptions || [];
  if (!opts.length) { grid.innerHTML = '<p>No design options available</p>'; return; }
  grid.innerHTML = opts.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="design" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initSectionScrollArrows('design');
};

CushionCalculator.prototype.renderFabricTiesOptions = function() {
  var grid = document.getElementById('fabricties-grid-' + this.blockId);
  var opts = this.config.fabricTiesOptions || [];
  if (!opts.length) { grid.innerHTML = '<p>No fabric ties options available</p>'; return; }
  grid.innerHTML = opts.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="fabricties" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+$' + o.price.toFixed(2) + '</div></div>';
  }).join('');
  this.initSectionScrollArrows('fabricties');
};

CushionCalculator.prototype.renderRodPocketOptions = function() {
  var grid = document.getElementById('rodpocket-grid-' + this.blockId);
  var opts = this.config.rodPocketOptions || [];
  if (!opts.length) { grid.innerHTML = '<p>No bottom rod pocket options available</p>'; return; }
  grid.innerHTML = opts.map(function(o) {
    return '<div class="kraft2026zion-option-card" data-type="rodpocket" data-id="' + o.id + '">' +
      (o.imageUrl ? '<img class="kraft2026zion-option-image" src="' + o.imageUrl + '" alt="' + o.name + '">' : '<div class="kraft2026zion-option-placeholder">No image</div>') +
      '<div class="kraft2026zion-option-name" title="' + o.name + '">' + o.name + '</div><div class="kraft2026zion-option-price">+' + o.percent + '%</div></div>';
  }).join('');
  this.initSectionScrollArrows('rodpocket');
};
