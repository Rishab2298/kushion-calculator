// Cushion Price Calculator - Cart Module
// Add to cart, success popup, URL config, error display

CushionCalculator.prototype.addToCart = async function() {
  if (this.isMultiPieceMode) {
    await this.addMultiPieceToCart();
    return;
  }

  if (this.calculatedPrice <= 0) return;
  var self = this;
  var blockId = this.blockId;
  var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;
  var instructions = document.getElementById('instructions-text-' + blockId).value;
  var dimensions = this.dimensions;
  var dimStr = this.selectedShape.inputFields.map(function(f) { return f.label + ': ' + (dimensions[f.key] || 0) + ' ' + f.unit; }).join(', ');

  var visibility = this.config.sectionVisibility || {};
  var hidden = this.config.hiddenValues || {};
  var effectiveFill = this.selectedFill, effectiveFabric = this.selectedFabric, effectiveDesign = this.selectedDesign, effectivePiping = this.selectedPiping, effectiveButton = this.selectedButton, effectiveAntiSkid = this.selectedAntiSkid, effectiveRodPocket = this.selectedRodPocket, effectiveTies = this.selectedTies, effectiveFabricTies = this.selectedFabricTies;
  if (visibility.showFillSection === false && hidden.fillType) effectiveFill = hidden.fillType;
  if (visibility.showFabricSection === false && hidden.fabric) effectiveFabric = hidden.fabric;
  if (visibility.showDesignSection === false && hidden.design) effectiveDesign = hidden.design;
  if (visibility.showPipingSection === false && hidden.piping) effectivePiping = hidden.piping;
  if (visibility.showButtonSection === false && hidden.button) effectiveButton = hidden.button;
  if (visibility.showAntiSkidSection === false && hidden.antiSkid) effectiveAntiSkid = hidden.antiSkid;
  if (visibility.showRodPocketSection === false && hidden.rodPocket) effectiveRodPocket = hidden.rodPocket;
  if (visibility.showTiesSection === false && hidden.ties) effectiveTies = hidden.ties;
  if (visibility.showFabricTiesSection === false && hidden.fabricTies) effectiveFabricTies = hidden.fabricTies;

  var surfaceArea = this.evaluateFormula(this.selectedShape.surfaceAreaFormula, dimensions);
  var volume = this.evaluateFormula(this.selectedShape.volumeFormula, dimensions);

  var conversionMultiplier = 1 + ((this.config.settings && this.config.settings.conversionPercent != null ? this.config.settings.conversionPercent : 0) / 100);
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
  var profilePct = this.config.profile ? (parseFloat(this.config.profile.additionalPercent) || 0) : 0;

  var subtotalAfterAddons = baseSubtotal + designCost + (baseSubtotal * ((pipingPct + buttonPct + antiSkidPct + rodPocketPct + profilePct) / 100)) + tiesCost + fabricTiesCost;
  var shippingPct = this.config.settings && this.config.settings.shippingPercent != null ? this.config.settings.shippingPercent : 100;
  var labourPct = this.config.settings && this.config.settings.labourPercent != null ? this.config.settings.labourPercent : 100;
  var tiesInShippingLabour = this.config.settings && this.config.settings.tiesIncludeInShippingLabour != null ? this.config.settings.tiesIncludeInShippingLabour : true;
  var shippingLabourBase = tiesInShippingLabour ? subtotalAfterAddons : (subtotalAfterAddons - tiesCost);
  var preTotalUnit = subtotalAfterAddons + shippingLabourBase * ((shippingPct + labourPct) / 100);
  var marginTier = this.getMarginTier(preTotalUnit);
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
  if (this.selectedShape && this.selectedShape.is2D && this.selectedShape.enablePanels && this.panelCount > 1) {
    effectivePanelCount = this.panelCount;
    unitPrice = unitPrice * this.panelCount;
  }

  if (unitPrice <= 0) unitPrice = preTotalUnit;
  if (unitPrice < 1) unitPrice = 1;

  var dimUrlStr = this.selectedShape.inputFields.map(function(f) { return f.key + ':' + (dimensions[f.key] || 0); }).join(',');

  var debugMode = this.config.settings && this.config.settings.debugPricing;
  var properties = {
    'Shape': this.selectedShape.name, 'Dimensions': dimStr,
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
    '_shapeId': this.selectedShape.id,
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
    '_productHandle': this.productHandle,
    '_profileId': this.profileId || '',
    '_qty': qty.toString(),
    '_panelCount': effectivePanelCount.toString(),
    '_priceDisplay': '$' + unitPrice.toFixed(2),
    '_totalDisplay': '$' + (unitPrice * qty).toFixed(2)
  };
  if (instructions) {
    properties['Special Instructions'] = instructions;
    properties['_instructions'] = encodeURIComponent(instructions);
  }
  if (this.attachmentUrl) {
    properties['Reference Image'] = this.attachmentUrl;
    properties['_attachmentUrl'] = this.attachmentUrl;
    if (this.attachmentFileName) {
      properties['_attachmentFileName'] = this.attachmentFileName;
    }
  }

  var btn = document.getElementById('add-cart-btn-' + blockId);
  var floatingBtn = document.getElementById('floating-add-btn-' + blockId);
  btn.disabled = true;
  if (floatingBtn) floatingBtn.disabled = true;

  if (!this.productId) { btn.textContent = 'Add to Cart - $' + this.calculatedPrice.toFixed(2); btn.disabled = false; if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; } this.showError('Product not found.'); return; }

  btn.textContent = 'Creating configuration...';
  if (floatingBtn) floatingBtn.textContent = 'Creating...';

  try {
    var configHash = Math.abs(JSON.stringify({ shape: this.selectedShape.id, dimensions: dimensions, fill: effectiveFill.id, fabric: effectiveFabric.id, piping: effectivePiping ? effectivePiping.id : null, button: effectiveButton ? effectiveButton.id : null, antiSkid: effectiveAntiSkid ? effectiveAntiSkid.id : null, ties: effectiveTies ? effectiveTies.id : null, price: unitPrice }).split('').reduce(function(a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36);

    var variantResponse = await fetch('/apps/cushion-api/create-variant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop: this.shopDomain, productId: this.productId, price: unitPrice.toFixed(2), configHash: configHash, configSummary: this.selectedShape.name + ' - ' + dimStr })
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
    this.showSuccessPopup({ shape: this.selectedShape.name, dimensions: dimStr, fabric: effectiveFabric.name, fill: effectiveFill.name, quantity: qty, price: '$' + this.calculatedPrice.toFixed(2), hasAttachment: !!this.attachmentUrl });

    // Clear attachment for next order
    this.clearAttachment();

    setTimeout(function() { btn.textContent = 'Add to Cart - $' + self.calculatedPrice.toFixed(2); btn.disabled = false; if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; } }, 1500);
  } catch (error) {
    console.error('Add to cart error:', error);
    btn.textContent = 'Add to Cart - $' + this.calculatedPrice.toFixed(2);
    btn.disabled = false;
    if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; }
    this.showError(error.message || 'Failed to add to cart.');
  }
};

CushionCalculator.prototype.addMultiPieceToCart = async function() {
  if (this.calculatedPrice <= 0) return;
  if (!this.selectedFabric) { this.showError('Please select a fabric.'); return; }

  var self = this;
  var blockId = this.blockId;
  var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;
  var instructions = document.getElementById('instructions-text-' + blockId).value;
  var debugMode = this.config.settings && this.config.settings.debugPricing;

  // Build properties for each piece
  var properties = {
    'Fabric': this.selectedFabric.name,
    '_fabricId': this.selectedFabric.id,
    '_isMultiPiece': 'true',
    '_pieceCount': this.pieces.length.toString()
  };

  // Add each piece's details
  this.pieces.forEach(function(piece, idx) {
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
  var unitPrice = this.calculatedPrice / qty;
  if (unitPrice < 1) unitPrice = 1;

  properties['Unit Price'] = '$' + unitPrice.toFixed(2);
  properties['_productHandle'] = this.productHandle;
  properties['_profileId'] = this.profileId || '';
  properties['_qty'] = qty.toString();
  properties['_priceDisplay'] = '$' + unitPrice.toFixed(2);
  properties['_totalDisplay'] = '$' + this.calculatedPrice.toFixed(2);

  if (instructions) {
    properties['Special Instructions'] = instructions;
    properties['_instructions'] = encodeURIComponent(instructions);
  }
  if (this.attachmentUrl) {
    properties['Reference Image'] = this.attachmentUrl;
    properties['_attachmentUrl'] = this.attachmentUrl;
    if (this.attachmentFileName) {
      properties['_attachmentFileName'] = this.attachmentFileName;
    }
  }

  var btn = document.getElementById('add-cart-btn-' + blockId);
  var floatingBtn = document.getElementById('floating-add-btn-' + blockId);
  btn.disabled = true;
  if (floatingBtn) floatingBtn.disabled = true;

  if (!this.productId) {
    btn.textContent = 'Add to Cart - $' + this.calculatedPrice.toFixed(2);
    btn.disabled = false;
    if (floatingBtn) { floatingBtn.textContent = 'Add to Cart'; floatingBtn.disabled = false; }
    this.showError('Product not found.');
    return;
  }

  btn.textContent = 'Creating configuration...';
  if (floatingBtn) floatingBtn.textContent = 'Creating...';

  try {
    // Create config summary from all pieces
    var configSummary = this.pieces.map(function(p) { return p.label; }).join(' + ');

    // Create hash from all pieces
    var configData = {
      fabric: this.selectedFabric.id,
      pieces: this.pieces.map(function(p) {
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
        shop: this.shopDomain,
        productId: this.productId,
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
    var piecesSummary = this.pieces.map(function(p) { return p.label; }).join(', ');
    this.showSuccessPopup({
      shape: piecesSummary,
      dimensions: this.pieces.length + ' pieces',
      fabric: this.selectedFabric.name,
      fill: this.pieces.map(function(p) { return p.fill.name; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).join(', '),
      quantity: qty,
      price: '$' + this.calculatedPrice.toFixed(2),
      hasAttachment: !!this.attachmentUrl,
      isMultiPiece: true
    });

    // Clear attachment for next order
    this.clearAttachment();

    setTimeout(function() {
      btn.textContent = 'Add to Cart - $' + self.calculatedPrice.toFixed(2);
      btn.disabled = false;
      if (floatingBtn) {
        floatingBtn.textContent = 'Add to Cart';
        floatingBtn.disabled = false;
      }
    }, 1500);

  } catch (error) {
    console.error('Add to cart error:', error);
    btn.textContent = 'Add to Cart - $' + this.calculatedPrice.toFixed(2);
    btn.disabled = false;
    if (floatingBtn) {
      floatingBtn.textContent = 'Add to Cart';
      floatingBtn.disabled = false;
    }
    this.showError(error.message || 'Failed to add to cart.');
  }
};

CushionCalculator.prototype.showSuccessPopup = function(details) {
  var blockId = this.blockId;
  var overlay = document.getElementById('cart-success-overlay-' + blockId);
  var viewCartBtn = document.getElementById('view-cart-' + blockId);
  var attachmentHtml = details.hasAttachment ? '<p><strong>Attachment:</strong> Image attached \u2713</p>' : '';
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
};

CushionCalculator.prototype.hideSuccessPopup = function() {
  document.getElementById('cart-success-overlay-' + this.blockId).style.display = 'none';
};

CushionCalculator.prototype.showError = function(msg) {
  var el = document.getElementById('error-msg-' + this.blockId);
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 5000);
};

CushionCalculator.prototype.applyUrlConfiguration = async function() {
  var self = this;
  var blockId = this.blockId;
  var params = new URLSearchParams(window.location.search);
  if (params.get('customize') !== 'true') return;

  var shapeId = params.get('shapeId');
  if (shapeId) {
    var shape = this.config.shapes.find(function(s) { return s.id === shapeId; });
    if (shape) this.selectShape(shape);
  }

  var dimStr = params.get('dimensions');
  if (dimStr && this.selectedShape) {
    var dimParts = dimStr.split(',');
    dimParts.forEach(function(part) {
      var kv = part.split(':');
      if (kv[0] && kv[1]) {
        var numValue = parseFloat(kv[1]);
        if (!isNaN(numValue)) {
          self.dimensions[kv[0]] = numValue;
          var input = document.getElementById('dim-' + kv[0] + '-' + blockId);
          if (input) input.value = numValue;
        }
      }
    });
    this.updateDimensionValue();
  }

  var fillId = params.get('fillId');
  if (fillId) {
    var fill = this.config.fillTypes.find(function(f) { return f.id === fillId; });
    if (fill) this.selectFill(fill);
  }

  var fabricId = params.get('fabricId');
  if (fabricId) {
    var uncatFabric = (this.config.uncategorizedFabrics || []).find(function(f) { return f.id === fabricId; });
    if (uncatFabric) {
      this.selectFabric(uncatFabric);
    } else {
      try {
        var resp = await fetch('/apps/cushion-api/fabrics-paginated?shop=' + this.shopDomain + '&search=&limit=100&page=1');
        if (resp.ok) {
          var data = await resp.json();
          var fab = (data.fabrics || []).find(function(f) { return f.id === fabricId; });
          if (fab) self.selectFabric(fab);
        }
      } catch (e) { /* ignore */ }
    }
  }

  var pipingId = params.get('pipingId');
  if (pipingId && pipingId !== 'none') this.selectPiping(pipingId);

  var buttonId = params.get('buttonId');
  if (buttonId && buttonId !== 'none') this.selectButton(buttonId);

  var antiSkidId = params.get('antiSkidId');
  if (antiSkidId && antiSkidId !== 'none') this.selectAntiSkid(antiSkidId);

  var tiesId = params.get('tiesId');
  if (tiesId && tiesId !== 'none') this.selectTies(tiesId);

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

  this.calculatePrice();
};
