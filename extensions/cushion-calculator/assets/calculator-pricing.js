// Cushion Price Calculator - Pricing Module
// Price calculation, margin tiers, price display updates

CushionCalculator.prototype.evaluateFormula = function(formula, vars) {
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
};

CushionCalculator.prototype.getMarginTier = function(price) {
  if (!this.config) return null;
  var method = this.config.settings && this.config.settings.marginCalculationMethod ? this.config.settings.marginCalculationMethod : 'tier';
  if (method === 'formula') {
    if (price <= 0) return { adjustmentPercent: 0 };
    var flatThreshold = this.config.settings && this.config.settings.flatMarginThreshold != null ? this.config.settings.flatMarginThreshold : 50;
    var flatPercent = this.config.settings && this.config.settings.flatMarginPercent != null ? this.config.settings.flatMarginPercent : 100;
    var threshold = this.config.settings && this.config.settings.formulaThreshold != null ? this.config.settings.formulaThreshold : 400;
    var lowConst = this.config.settings && this.config.settings.formulaLowConstant != null ? this.config.settings.formulaLowConstant : 300;
    var lowCoef = this.config.settings && this.config.settings.formulaLowCoefficient != null ? this.config.settings.formulaLowCoefficient : 52;
    var highConst = this.config.settings && this.config.settings.formulaHighConstant != null ? this.config.settings.formulaHighConstant : 120;
    var highCoef = this.config.settings && this.config.settings.formulaHighCoefficient != null ? this.config.settings.formulaHighCoefficient : 20;
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
  if (!this.config.priceTiers || this.config.priceTiers.length === 0) return null;
  return this.config.priceTiers.find(function(t) { return price >= t.minPrice && price <= t.maxPrice; }) || null;
};

CushionCalculator.prototype.calculatePrice = function() {
  if (this.isMultiPieceMode) {
    this.calculateMultiPiecePrice();
    return;
  }

  var blockId = this.blockId;
  var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;
  var visibility = this.config.sectionVisibility || {};
  var hidden = this.config.hiddenValues || {};

  var effectiveFill = this.selectedFill;
  var effectiveFabric = this.selectedFabric;
  var effectiveDesign = this.selectedDesign;
  var effectivePiping = this.selectedPiping;
  var effectiveButton = this.selectedButton;
  var effectiveAntiSkid = this.selectedAntiSkid;
  var effectiveRodPocket = this.selectedRodPocket;
  var effectiveTies = this.selectedTies;
  var effectiveFabricTies = this.selectedFabricTies;
  var effectiveDrawstring = this.selectedDrawstring;

  if (visibility.showFillSection === false) effectiveFill = hidden.fillType || null;
  if (visibility.showFabricSection === false) effectiveFabric = hidden.fabric || null;
  if (visibility.showDesignSection === false) effectiveDesign = hidden.design || null;
  if (visibility.showPipingSection === false) effectivePiping = hidden.piping || null;
  if (visibility.showButtonSection === false) effectiveButton = hidden.button || null;
  if (visibility.showAntiSkidSection === false) effectiveAntiSkid = hidden.antiSkid || null;
  if (visibility.showRodPocketSection === false) effectiveRodPocket = hidden.rodPocket || null;
  if (visibility.showTiesSection === false) effectiveTies = hidden.ties || null;
  if (visibility.showFabricTiesSection === false) effectiveFabricTies = hidden.fabricTies || null;
  if (visibility.showDrawstringSection === false) effectiveDrawstring = hidden.drawstring || null;

  if (!this.selectedShape || !effectiveFabric) { this.updatePriceDisplay({}); return; }

  var dimensions = this.dimensions;
  var allDimensionsSet = this.selectedShape.inputFields.filter(function(f) { return f.required; }).every(function(f) { return dimensions[f.key] && dimensions[f.key] > 0; });
  if (!allDimensionsSet) { this.updatePriceDisplay({}); return; }

  // Use weatherproof formula (surface area without base) if enabled and available
  var isWeatherproof = this.config.profile && this.config.profile.enableWeatherproof;
  var surfaceAreaFormula = (isWeatherproof && this.selectedShape.surfaceAreaWithoutBaseFormula)
    ? this.selectedShape.surfaceAreaWithoutBaseFormula
    : this.selectedShape.surfaceAreaFormula;
  var surfaceArea = this.evaluateFormula(surfaceAreaFormula, dimensions);
  var volume = this.evaluateFormula(this.selectedShape.volumeFormula, dimensions);

  var conversionMultiplier = 1 + ((this.config.settings && this.config.settings.conversionPercent != null ? this.config.settings.conversionPercent : 0) / 100);
  var fabricCost = surfaceArea * (parseFloat(effectiveFabric.pricePerSqInch) || 0) * conversionMultiplier;
  var fillCost = effectiveFill ? volume * (parseFloat(effectiveFill.pricePerCubicInch) || 0) * conversionMultiplier : 0;
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
  var drawstringPct = effectiveDrawstring ? (parseFloat(effectiveDrawstring.percent) || 0) : 0;
  var profilePct = this.config.profile ? (parseFloat(this.config.profile.additionalPercent) || 0) : 0;

  var pipingCost = baseSubtotal * (pipingPct / 100);
  var buttonCost = baseSubtotal * (buttonPct / 100);
  var antiSkidCost = baseSubtotal * (antiSkidPct / 100);
  var rodPocketCost = baseSubtotal * (rodPocketPct / 100);
  var drawstringCost = baseSubtotal * (drawstringPct / 100);
  var profileCost = baseSubtotal * (profilePct / 100);

  var subtotalAfterAddons = baseSubtotal + designCost + pipingCost + tiesCost + fabricTiesCost + buttonCost + antiSkidCost + rodPocketCost + drawstringCost + profileCost;

  var shippingPct = this.config.settings && this.config.settings.shippingPercent != null ? this.config.settings.shippingPercent : 100;
  var labourPct = this.config.settings && this.config.settings.labourPercent != null ? this.config.settings.labourPercent : 100;
  var tiesInShippingLabour = this.config.settings && this.config.settings.tiesIncludeInShippingLabour != null ? this.config.settings.tiesIncludeInShippingLabour : true;
  var shippingLabourBase = tiesInShippingLabour ? subtotalAfterAddons : (subtotalAfterAddons - tiesCost - fabricTiesCost);
  var shippingCost = shippingLabourBase * (shippingPct / 100);
  var labourCost = shippingLabourBase * (labourPct / 100);

  var preTotalUnit = subtotalAfterAddons + shippingCost + labourCost;

  var marginTier = this.getMarginTier(preTotalUnit);
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
  if (this.selectedShape && this.selectedShape.is2D && this.selectedShape.enablePanels && this.panelCount > 1) {
    effectivePanelCount = this.panelCount;
    unitTotal = unitTotal * this.panelCount;
  }

  var total = unitTotal * qty;

  this.calculatedPrice = total;

  this.updatePriceDisplay({
    fabricCost: fabricCost, fillCost: fillCost, tiesCost: tiesCost, fabricTiesCost: fabricTiesCost, baseSubtotal: baseSubtotal,
    designPct: designPct, designCost: designCost,
    pipingPct: pipingPct, pipingCost: pipingCost, buttonPct: buttonPct, buttonCost: buttonCost,
    antiSkidPct: antiSkidPct, antiSkidCost: antiSkidCost, rodPocketPct: rodPocketPct, rodPocketCost: rodPocketCost,
    drawstringPct: drawstringPct, drawstringCost: drawstringCost,
    profilePct: profilePct, profileCost: profileCost,
    shippingPct: shippingPct, shippingCost: shippingCost, labourPct: labourPct, labourCost: labourCost,
    preTotalUnit: preTotalUnit, marginPct: marginPct, marginAmt: marginAmt,
    discountPct: totalDiscountPct, discountAmt: discountAmt,
    panelCount: effectivePanelCount,
    unitTotal: unitTotal, qty: qty, total: total
  });
};

CushionCalculator.prototype.calculateMultiPiecePrice = function() {
  var self = this;
  var blockId = this.blockId;
  var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;

  // Check if fabric is selected (shared across all pieces)
  if (!this.selectedFabric) {
    this.updateMultiPiecePriceDisplay({ pieceBreakdowns: [], piecesSubtotal: 0, total: 0, qty: qty });
    return;
  }

  // Check if all pieces have required selections (fill only required if section visible)
  var allPiecesComplete = this.pieces.every(function(piece) {
    var pc = piece.config || {};
    var fillRequired = pc.showFillSection !== false;
    return piece.shape && (!fillRequired || piece.fill) && self.hasRequiredDimensions(piece);
  });

  if (!allPiecesComplete) {
    this.updateMultiPiecePriceDisplay({ pieceBreakdowns: [], piecesSubtotal: 0, total: 0, qty: qty, incomplete: true });
    return;
  }

  var conversionMultiplier = 1 + ((this.config.settings && this.config.settings.conversionPercent != null ? this.config.settings.conversionPercent : 0) / 100);

  // Settings (shared across all pieces)
  var profilePct = this.config.profile ? (parseFloat(this.config.profile.additionalPercent) || 0) : 0;
  var shippingPct = this.config.settings && this.config.settings.shippingPercent != null ? this.config.settings.shippingPercent : 100;
  var labourPct = this.config.settings && this.config.settings.labourPercent != null ? this.config.settings.labourPercent : 100;
  var tiesInShippingLabour = this.config.settings && this.config.settings.tiesIncludeInShippingLabour != null ? this.config.settings.tiesIncludeInShippingLabour : true;

  // Fabric discount (shared fabric across all pieces)
  var fabricDiscountPct = (this.selectedFabric && this.selectedFabric.discountEnabled) ? (parseFloat(this.selectedFabric.discountPercent) || 0) : 0;

  var pieceBreakdowns = [];
  var totalFinalPrice = 0;
  var totalPiecesSubtotal = 0;

  this.pieces.forEach(function(piece) {
    // Use weatherproof formula (surface area without base) if enabled and available
    var isWeatherproof = self.config.profile && self.config.profile.enableWeatherproof;
    var surfaceAreaFormula = (isWeatherproof && piece.shape.surfaceAreaWithoutBaseFormula)
      ? piece.shape.surfaceAreaWithoutBaseFormula
      : piece.shape.surfaceAreaFormula;
    var surfaceArea = self.evaluateFormula(surfaceAreaFormula, piece.dimensions);
    var volume = self.evaluateFormula(piece.shape.volumeFormula, piece.dimensions);

    var fabricCost = surfaceArea * (parseFloat(self.selectedFabric.pricePerSqInch) || 0) * conversionMultiplier;
    var fillCost = (fillVisible && piece.fill) ? volume * (parseFloat(piece.fill.pricePerCubicInch) || 0) * conversionMultiplier : 0;

    // Check piece-level visibility before including costs (multi-piece is piece-dependent)
    var pc = piece.config || {};
    var fillVisible = pc.showFillSection !== false;
    var designVisible = pc.showDesignSection !== false;
    var pipingVisible = pc.showPipingSection !== false;
    var buttonVisible = pc.showButtonSection !== false;
    var antiSkidVisible = pc.showAntiSkidSection !== false;
    var rodPocketVisible = pc.showRodPocketSection !== false;
    var tiesVisible = pc.showTiesSection !== false;
    var fabricTiesVisible = pc.showFabricTiesSection !== false;
    var drawstringVisible = pc.showDrawstringSection !== false;

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
    var drawstringPct = (drawstringVisible && piece.drawstring) ? (parseFloat(piece.drawstring.percent) || 0) : 0;

    var pipingCost = pieceBase * (pipingPct / 100);
    var buttonCost = pieceBase * (buttonPct / 100);
    var antiSkidCost = pieceBase * (antiSkidPct / 100);
    var rodPocketCost = pieceBase * (rodPocketPct / 100);
    var drawstringCost = pieceBase * (drawstringPct / 100);

    var pieceSubtotal = pieceBase + designCost + pipingCost + buttonCost + antiSkidCost + rodPocketCost + drawstringCost + tiesCost + fabricTiesCost;
    totalPiecesSubtotal += pieceSubtotal;

    // === INDEPENDENT PER-PIECE CALCULATION ===

    // 1. Profile markup for THIS piece
    var pieceProfileCost = pieceSubtotal * (profilePct / 100);
    var pieceAfterProfile = pieceSubtotal + pieceProfileCost;

    // 2. Shipping/Labour base (optionally exclude ties and fabric ties)
    var pieceShippingLabourBase = tiesInShippingLabour ? pieceAfterProfile : (pieceAfterProfile - tiesCost - fabricTiesCost);
    var pieceShippingCost = pieceShippingLabourBase * (shippingPct / 100);
    var pieceLabourCost = pieceShippingLabourBase * (labourPct / 100);

    var piecePreMargin = pieceAfterProfile + pieceShippingCost + pieceLabourCost;

    // 3. Margin for THIS piece (based on this piece's price)
    var pieceMarginTier = self.getMarginTier(piecePreMargin);
    var pieceMarginPct = pieceMarginTier ? pieceMarginTier.adjustmentPercent : 0;
    var pieceMarginAmt = piecePreMargin * (pieceMarginPct / 100);

    var pieceTotalBeforeDeductions = piecePreMargin + pieceMarginAmt;

    // 4. Covers only check (30% deduction from raw material cost)
    var isCoversOnly = fillVisible && piece.fill && piece.fill.name &&
      piece.fill.name.toLowerCase().indexOf('covers only') !== -1;
    var rawMaterialCost = fabricCost + fillCost;
    var coversOnlyDeduction = isCoversOnly ? rawMaterialCost * 0.30 : 0;

    // 5. Apply discounts (fabric discount from shared fabric, fill discount per piece)
    var fillDiscountPct = (fillVisible && piece.fill && piece.fill.discountEnabled) ? (parseFloat(piece.fill.discountPercent) || 0) : 0;
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
      drawstringCost: drawstringCost,
      drawstringPct: drawstringPct,
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
      designName: piece.design ? piece.design.name : '',
      drawstringName: piece.drawstring ? piece.drawstring.name : ''
    });
  });

  var unitTotal = totalFinalPrice;
  var total = unitTotal * qty;

  this.calculatedPrice = total;

  this.updateMultiPiecePriceDisplay({
    pieceBreakdowns: pieceBreakdowns,
    piecesSubtotal: totalPiecesSubtotal,
    profilePct: profilePct,
    shippingPct: shippingPct,
    labourPct: labourPct,
    unitTotal: unitTotal,
    qty: qty,
    total: total
  });
};

CushionCalculator.prototype.updateMultiPiecePriceDisplay = function(d) {
  var blockId = this.blockId;
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
        if (pb.drawstringCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Drawstring' + (pb.drawstringName ? ' (' + pb.drawstringName + ')' : '') + ' ' + pb.drawstringPct + '%</span><span>' + f(pb.drawstringCost) + '</span></div>';
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
          var arrow = row.querySelector('.kraft2026zion-mp-piece-arrow');
          if (arrow) arrow.classList.toggle('kraft2026zion-open', !isOpen);
        }
      });
    });
  }

  // Update add to cart button state
  var canAdd = d.pieceBreakdowns && d.pieceBreakdowns.length > 0 && this.selectedFabric && (d.total || 0) > 0;
  document.getElementById('add-cart-btn-' + blockId).disabled = !canAdd;

  // Sync floating footer
  var floatingPrice = document.getElementById('floating-price-' + blockId);
  var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);
  if (floatingPrice) floatingPrice.textContent = f(d.total || 0);
  if (floatingAddBtn) floatingAddBtn.disabled = !canAdd;
  this.syncFloatingFooter();
};

CushionCalculator.prototype.updatePriceDisplay = function(d) {
  var blockId = this.blockId;
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
  // Drawstring row
  var drawstringRow = document.getElementById('bd-drawstring-row-' + blockId);
  if (drawstringRow) {
    drawstringRow.style.display = (d.drawstringPct || 0) > 0 ? 'flex' : 'none';
    document.getElementById('bd-drawstring-pct-' + blockId).textContent = d.drawstringPct || 0;
    document.getElementById('bd-drawstring-' + blockId).textContent = f(d.drawstringCost);
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
  var canAdd = this.selectedShape && (this.selectedFill || (this.config.hiddenValues && this.config.hiddenValues.fillType)) && (this.selectedFabric || (this.config.hiddenValues && this.config.hiddenValues.fabric)) && (d.baseSubtotal || 0) > 0;
  document.getElementById('add-cart-btn-' + blockId).disabled = !canAdd;

  // Sync floating footer
  var floatingPrice = document.getElementById('floating-price-' + blockId);
  var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);
  if (floatingPrice) floatingPrice.textContent = f(d.total || 0);
  if (floatingAddBtn) floatingAddBtn.disabled = !canAdd;
  this.syncFloatingFooter();
};
