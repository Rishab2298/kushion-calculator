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

  // Fabric is only required when the Fabric section is visible. "Inserts only" profiles hide the
  // Fabric section (Hidden Fabric Value = "None"), so effectiveFabric is null and fabric cost is 0.
  var fabricRequired = visibility.showFabricSection !== false;
  if (!this.selectedShape || (fabricRequired && !effectiveFabric)) { this.updatePriceDisplay({}); return; }

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
  var fabricCost = effectiveFabric ? surfaceArea * (parseFloat(effectiveFabric.pricePerSqInch) || 0) * conversionMultiplier : 0;
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

  // Minimum flat-rate shipping & labour: when (fabric + fill) is below the
  // threshold, charge flat amounts instead of the percentages above.
  var fs = this.config.settings || {};
  var flatEnabled = fs.enableMinimumFlatRate !== false;
  var flatThreshold = fs.flatRateThreshold != null ? fs.flatRateThreshold : 50;
  var flatShippingAmt = fs.flatShippingAmount != null ? fs.flatShippingAmount : 50;
  var flatLabourAmt = fs.flatLabourAmount != null ? fs.flatLabourAmount : 50;
  var flatRateApplied = flatEnabled && (baseSubtotal < flatThreshold);

  var shippingCost = flatRateApplied ? flatShippingAmt : shippingLabourBase * (shippingPct / 100);
  var labourCost = flatRateApplied ? flatLabourAmt : shippingLabourBase * (labourPct / 100);

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

  // Covers only: 30% deduction from raw material cost (fabric + fill)
  var isCoversOnly = !!(effectiveFill && effectiveFill.name &&
    effectiveFill.name.toLowerCase().indexOf('covers only') !== -1);
  var coversOnlyDeduction = isCoversOnly ? baseSubtotal * 0.30 : 0;

  unitTotal = Math.max(0, unitTotal - discountAmt - coversOnlyDeduction);

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
    flatRateApplied: flatRateApplied, flatThreshold: flatThreshold, shippingLabourBase: shippingLabourBase,
    preTotalUnit: preTotalUnit, marginPct: marginPct, marginAmt: marginAmt,
    fabricDiscountPct: fabricDiscountPct, fillDiscountPct: fillDiscountPct,
    // Inputs shown next to each breakdown line (debug pricing)
    detail: {
      shape: this.selectedShape, dimensions: dimensions, isWeatherproof: !!(isWeatherproof && this.selectedShape.surfaceAreaWithoutBaseFormula),
      surfaceArea: surfaceArea, volume: volume, conversionMultiplier: conversionMultiplier,
      fabric: effectiveFabric, fill: effectiveFill, design: effectiveDesign, piping: effectivePiping, button: effectiveButton,
      antiSkid: effectiveAntiSkid, rodPocket: effectiveRodPocket, drawstring: effectiveDrawstring, ties: effectiveTies, fabricTies: effectiveFabricTies
    },
    discountPct: totalDiscountPct, discountAmt: discountAmt,
    isCoversOnly: isCoversOnly, coversOnlyDeduction: coversOnlyDeduction,
    panelCount: effectivePanelCount,
    unitTotal: unitTotal, qty: qty, total: total
  });
};

CushionCalculator.prototype.calculateMultiPiecePrice = function() {
  var self = this;
  var blockId = this.blockId;
  var qty = parseInt(document.getElementById('quantity-' + blockId).value) || 1;

  // Fabric is shared across all pieces. Like single-piece, it is only required when the
  // Fabric section is visible; "inserts only" profiles hide it and use the hidden value (or none).
  var visibility = this.config.sectionVisibility || {};
  var fabricRequired = visibility.showFabricSection !== false;
  var effectiveFabric = fabricRequired ? this.selectedFabric : ((this.config.hiddenValues || {}).fabric || null);
  if (fabricRequired && !effectiveFabric) {
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
  var fabricDiscountPct = (effectiveFabric && effectiveFabric.discountEnabled) ? (parseFloat(effectiveFabric.discountPercent) || 0) : 0;

  // Minimum flat-rate shipping & labour (per piece, same as single-piece): when a
  // piece's fabric + fill cost is below the threshold, that piece is charged flat
  // shipping & labour instead of percentages, before its margin.
  var fs = this.config.settings || {};
  var flatEnabled = fs.enableMinimumFlatRate !== false;
  var flatThreshold = fs.flatRateThreshold != null ? fs.flatRateThreshold : 50;
  var flatShippingAmt = fs.flatShippingAmount != null ? fs.flatShippingAmount : 50;
  var flatLabourAmt = fs.flatLabourAmount != null ? fs.flatLabourAmount : 50;

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

    // Check piece-level visibility before including costs (multi-piece is piece-dependent)
    var pc = piece.config || {};
    // Like single-piece: a hidden Fill section charges its hidden value (if one is set), otherwise no fill
    var fillVisible = pc.showFillSection !== false;
    var pieceFill = (fillVisible || pc.hiddenFillTypeId) ? piece.fill : null;
    var designVisible = pc.showDesignSection !== false;
    var pipingVisible = pc.showPipingSection !== false;
    var buttonVisible = pc.showButtonSection !== false;
    var antiSkidVisible = pc.showAntiSkidSection !== false;
    var rodPocketVisible = pc.showRodPocketSection !== false;
    var tiesVisible = pc.showTiesSection !== false;
    var fabricTiesVisible = pc.showFabricTiesSection !== false;
    var drawstringVisible = pc.showDrawstringSection !== false;

    var fabricCost = effectiveFabric ? surfaceArea * (parseFloat(effectiveFabric.pricePerSqInch) || 0) * conversionMultiplier : 0;
    var fillCost = pieceFill ? volume * (parseFloat(pieceFill.pricePerCubicInch) || 0) * conversionMultiplier : 0;
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

    // 1. Profile markup for THIS piece (% of fabric + fill, same as single-piece)
    var pieceProfileCost = pieceBase * (profilePct / 100);
    var pieceAfterProfile = pieceSubtotal + pieceProfileCost;

    // 2. Shipping/Labour base (optionally exclude ties and fabric ties)
    var pieceShippingLabourBase = tiesInShippingLabour ? pieceAfterProfile : (pieceAfterProfile - tiesCost - fabricTiesCost);
    var pieceFlatRateApplied = flatEnabled && (pieceBase < flatThreshold);
    var pieceShippingCost = pieceFlatRateApplied ? flatShippingAmt : pieceShippingLabourBase * (shippingPct / 100);
    var pieceLabourCost = pieceFlatRateApplied ? flatLabourAmt : pieceShippingLabourBase * (labourPct / 100);

    var piecePreMargin = pieceAfterProfile + pieceShippingCost + pieceLabourCost;

    // 3. Margin for THIS piece (based on this piece's price)
    var pieceMarginTier = self.getMarginTier(piecePreMargin);
    var pieceMarginPct = pieceMarginTier ? pieceMarginTier.adjustmentPercent : 0;
    var pieceMarginAmt = piecePreMargin * (pieceMarginPct / 100);

    var pieceTotalBeforeDeductions = piecePreMargin + pieceMarginAmt;

    // 4. Covers only check (30% deduction from raw material cost)
    var isCoversOnly = pieceFill && pieceFill.name &&
      piece.fill.name.toLowerCase().indexOf('covers only') !== -1;
    var rawMaterialCost = fabricCost + fillCost;
    var coversOnlyDeduction = isCoversOnly ? rawMaterialCost * 0.30 : 0;

    // 5. Apply discounts (fabric discount from shared fabric, fill discount per piece)
    var fillDiscountPct = (pieceFill && pieceFill.discountEnabled) ? (parseFloat(pieceFill.discountPercent) || 0) : 0;
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
      flatRateApplied: pieceFlatRateApplied,
      // Inputs shown next to each breakdown line (debug pricing)
      pieceBase: pieceBase,
      shippingLabourBase: pieceShippingLabourBase,
      surfaceArea: surfaceArea,
      volume: volume,
      isWeatherproof: !!(isWeatherproof && piece.shape.surfaceAreaWithoutBaseFormula),
      dimensionsText: (piece.shape.inputFields || []).filter(function(fl) { return piece.dimensions[fl.key]; })
        .map(function(fl) { return (fl.label || fl.key) + ' ' + piece.dimensions[fl.key] + '"'; }).join(' × '),
      fabricName: effectiveFabric ? effectiveFabric.name : '',
      fabricRate: effectiveFabric ? effectiveFabric.pricePerSqInch : 0,
      fillRate: pieceFill ? pieceFill.pricePerCubicInch : 0,
      tiesPrice: (tiesVisible && piece.ties) ? piece.ties.price : 0,
      fabricTiesPrice: (fabricTiesVisible && piece.fabricTies) ? piece.fabricTies.price : 0,
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
      fillName: pieceFill ? pieceFill.name : '',
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
    conversionMultiplier: conversionMultiplier,
    flatThreshold: flatThreshold,
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
  var num = function(v, dp) { return (parseFloat(v) || 0).toLocaleString('en-US', { maximumFractionDigits: dp }); };
  var rate = function(v) { return '$' + num(v, 4); };
  var conv = num(d.conversionMultiplier || 1, 4);
  // Muted second line under a breakdown label showing the configuration and inputs behind it
  var esc = function(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var det = function(text) {
    if (!text) return '';
    return '<span class="kraft2026zion-bd-detail">' + esc(text) + '</span>';
  };

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
          '<div class="kraft2026zion-mp-breakdown-piece-name"><span class="kraft2026zion-mp-piece-arrow">&#9662;</span> ' + esc(pb.name) + '</div>' +
          '<div class="kraft2026zion-mp-breakdown-piece-price">' + f(pb.finalPrice) + '</div>' +
          '</div>';
        html += '<div class="kraft2026zion-mp-piece-detail" id="mp-piece-detail-' + blockId + '-' + idx + '" style="display: none;">';

        // Raw costs section
        html += '<div class="kraft2026zion-mp-detail-section">Raw Costs</div>';
        var pieceBaseText = f(pb.pieceBase);
        html += '<div class="kraft2026zion-mp-detail-row"><span>Shape' + '</span>' + det(pb.shapeName + (pb.dimensionsText ? ' · ' + pb.dimensionsText : '')) + '<span></span></div>';
        html += '<div class="kraft2026zion-mp-detail-row"><span>Fabric Cost' + '</span>' + det(pb.fabricName
          ? pb.fabricName + ' · ' + num(pb.surfaceArea, 2) + ' sq in' + (pb.isWeatherproof ? ' (no base)' : '') + ' × ' + rate(pb.fabricRate) + '/sq in × ' + conv
          : 'No fabric') + '<span>' + f(pb.fabricCost) + '</span></div>';
        html += '<div class="kraft2026zion-mp-detail-row"><span>Fill Cost' + (pb.fillName ? ' (' + esc(pb.fillName) + ')' : '') + '</span>' + det(pb.fillName
          ? num(pb.volume, 2) + ' cu in × ' + rate(pb.fillRate) + '/cu in × ' + conv
          : '') + '<span>' + f(pb.fillCost) + '</span></div>';
        if (pb.designCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Design' + (pb.designName ? ' (' + esc(pb.designName) + ')' : '') + ' ' + pb.designPct + '%' + '</span>' + det(pb.designPct + '% of fabric ' + f(pb.fabricCost)) + '<span>' + f(pb.designCost) + '</span></div>';
        }
        if (pb.pipingCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Piping' + (pb.pipingName ? ' (' + esc(pb.pipingName) + ')' : '') + ' ' + pb.pipingPct + '%' + '</span>' + det(pb.pipingPct + '% of ' + pieceBaseText) + '<span>' + f(pb.pipingCost) + '</span></div>';
        }
        if (pb.buttonCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Button' + (pb.buttonName ? ' (' + esc(pb.buttonName) + ')' : '') + ' ' + pb.buttonPct + '%' + '</span>' + det(pb.buttonPct + '% of ' + pieceBaseText) + '<span>' + f(pb.buttonCost) + '</span></div>';
        }
        if (pb.antiSkidCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Anti-Skid' + (pb.antiSkidName ? ' (' + esc(pb.antiSkidName) + ')' : '') + ' ' + pb.antiSkidPct + '%' + '</span>' + det(pb.antiSkidPct + '% of ' + pieceBaseText) + '<span>' + f(pb.antiSkidCost) + '</span></div>';
        }
        if (pb.tiesCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Ties' + (pb.tiesName ? ' (' + esc(pb.tiesName) + ')' : '') + '</span>' + det(f(pb.tiesPrice) + ' × ' + conv) + '<span>' + f(pb.tiesCost) + '</span></div>';
        }
        if (pb.fabricTiesCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Fabric Ties' + (pb.fabricTiesName ? ' (' + esc(pb.fabricTiesName) + ')' : '') + '</span>' + det(f(pb.fabricTiesPrice) + ' × ' + conv) + '<span>' + f(pb.fabricTiesCost) + '</span></div>';
        }
        if (pb.rodPocketCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Rod Pocket' + (pb.rodPocketName ? ' (' + esc(pb.rodPocketName) + ')' : '') + ' ' + pb.rodPocketPct + '%' + '</span>' + det(pb.rodPocketPct + '% of ' + pieceBaseText) + '<span>' + f(pb.rodPocketCost) + '</span></div>';
        }
        if (pb.drawstringCost > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Drawstring' + (pb.drawstringName ? ' (' + esc(pb.drawstringName) + ')' : '') + ' ' + pb.drawstringPct + '%' + '</span>' + det(pb.drawstringPct + '% of ' + pieceBaseText) + '<span>' + f(pb.drawstringCost) + '</span></div>';
        }
        html += '<div class="kraft2026zion-mp-detail-row mp-detail-subtotal"><span>Piece Subtotal</span><span>' + f(pb.subtotal) + '</span></div>';

        // Markups section
        html += '<div class="kraft2026zion-mp-detail-section">Markups</div>';
        if ((d.profilePct || 0) > 0) {
          html += '<div class="kraft2026zion-mp-detail-row"><span>Profile (' + d.profilePct + '%)' + '</span>' + det(d.profilePct + '% of ' + pieceBaseText + ' (fabric + fill)') + '<span>+' + f(pb.profileCost) + '</span></div>';
        }
        var shipLabel = pb.flatRateApplied ? 'flat' : (d.shippingPct || 0) + '%';
        var labourLabel = pb.flatRateApplied ? 'flat' : (d.labourPct || 0) + '%';
        var flatText = pb.flatRateApplied ? 'fabric + fill ' + pieceBaseText + ' is under ' + f(d.flatThreshold) + ', so flat rate' : '';
        html += '<div class="kraft2026zion-mp-detail-row"><span>Shipping (' + shipLabel + ')' + '</span>' + det(flatText || ((d.shippingPct || 0) + '% of ' + f(pb.shippingLabourBase))) + '<span>+' + f(pb.shippingCost) + '</span></div>';
        html += '<div class="kraft2026zion-mp-detail-row"><span>Labour (' + labourLabel + ')' + '</span>' + det(flatText || ((d.labourPct || 0) + '% of ' + f(pb.shippingLabourBase))) + '<span>+' + f(pb.labourCost) + '</span></div>';
        html += '<div class="kraft2026zion-mp-detail-row mp-detail-subtotal"><span>Pre-Margin</span><span>' + f(pb.preMargin) + '</span></div>';

        if ((pb.marginPct || 0) !== 0) {
          var sign = pb.marginPct > 0 ? '+' : '';
          html += '<div class="kraft2026zion-mp-detail-row"><span>Margin (' + sign + pb.marginPct.toFixed(2) + '%)' + '</span>' + det('of ' + f(pb.preMargin)) + '<span>' + (pb.marginAmt >= 0 ? '+' : '') + f(pb.marginAmt) + '</span></div>';
        }

        // Deductions section (if any)
        var hasDeductions = pb.isCoversOnly || (pb.fabricDiscountAmt || 0) > 0 || (pb.fillDiscountAmt || 0) > 0;
        if (hasDeductions) {
          html += '<div class="kraft2026zion-mp-detail-section">Deductions</div>';
          if (pb.isCoversOnly) {
            html += '<div class="kraft2026zion-mp-detail-row mp-detail-discount"><span>Covers Only (-30%)' + '</span>' + det('30% of ' + pieceBaseText + ' (fabric + fill)') + '<span>-' + f(pb.coversOnlyDeduction) + '</span></div>';
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
      html += '<div class="kraft2026zion-mp-breakdown-row"><span>Materials + Add-ons</span>' + det('all pieces, before shipping, labour and margin') + '<span>' + f(d.piecesSubtotal) + '</span></div>';
      html += '<div class="kraft2026zion-mp-breakdown-row mp-breakdown-total"><span>Unit Total</span>' +
        det(d.pieceBreakdowns.map(function(pb) { return pb.name + ' ' + f(pb.finalPrice); }).join(' + ')) + '<span>' + f(d.unitTotal) + '</span></div>';
      html += '<div class="kraft2026zion-mp-breakdown-row mp-breakdown-total"><span>Total (x' + d.qty + ')</span>' + det(f(d.unitTotal) + ' × ' + d.qty) + '<span>' + f(d.total) + '</span></div>';
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
  var vis = this.config.sectionVisibility || {};
  var fabricOk = vis.showFabricSection === false || this.selectedFabric;
  var canAdd = d.pieceBreakdowns && d.pieceBreakdowns.length > 0 && fabricOk && (d.total || 0) > 0;
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
    designRow.style.display = (d.designPct || 0) > 0 ? '' : 'none';
    document.getElementById('bd-design-pct-' + blockId).textContent = d.designPct || 0;
    document.getElementById('bd-design-' + blockId).textContent = f(d.designCost);
  }
  var pipingRow = document.getElementById('bd-piping-row-' + blockId);
  pipingRow.style.display = (d.pipingPct || 0) > 0 ? '' : 'none';
  document.getElementById('bd-piping-pct-' + blockId).textContent = d.pipingPct || 0;
  document.getElementById('bd-piping-' + blockId).textContent = f(d.pipingCost);
  var buttonRow = document.getElementById('bd-button-row-' + blockId);
  buttonRow.style.display = (d.buttonPct || 0) > 0 ? '' : 'none';
  document.getElementById('bd-button-pct-' + blockId).textContent = d.buttonPct || 0;
  document.getElementById('bd-button-' + blockId).textContent = f(d.buttonCost);
  var antiskidRow = document.getElementById('bd-antiskid-row-' + blockId);
  antiskidRow.style.display = (d.antiSkidPct || 0) > 0 ? '' : 'none';
  document.getElementById('bd-antiskid-pct-' + blockId).textContent = d.antiSkidPct || 0;
  document.getElementById('bd-antiskid-' + blockId).textContent = f(d.antiSkidCost);
  // Bottom Rod Pocket row
  var rodpocketRow = document.getElementById('bd-rodpocket-row-' + blockId);
  if (rodpocketRow) {
    rodpocketRow.style.display = (d.rodPocketPct || 0) > 0 ? '' : 'none';
    document.getElementById('bd-rodpocket-pct-' + blockId).textContent = d.rodPocketPct || 0;
    document.getElementById('bd-rodpocket-' + blockId).textContent = f(d.rodPocketCost);
  }
  var tiesRow = document.getElementById('bd-ties-row-' + blockId);
  tiesRow.style.display = (d.tiesCost || 0) > 0 ? '' : 'none';
  document.getElementById('bd-ties-' + blockId).textContent = f(d.tiesCost);
  // Fabric Ties row
  var fabrictiesRow = document.getElementById('bd-fabricties-row-' + blockId);
  if (fabrictiesRow) {
    fabrictiesRow.style.display = (d.fabricTiesCost || 0) > 0 ? '' : 'none';
    document.getElementById('bd-fabricties-' + blockId).textContent = f(d.fabricTiesCost);
  }
  // Drawstring row
  var drawstringRow = document.getElementById('bd-drawstring-row-' + blockId);
  if (drawstringRow) {
    drawstringRow.style.display = (d.drawstringPct || 0) > 0 ? '' : 'none';
    document.getElementById('bd-drawstring-pct-' + blockId).textContent = d.drawstringPct || 0;
    document.getElementById('bd-drawstring-' + blockId).textContent = f(d.drawstringCost);
  }
  var profileRow = document.getElementById('bd-profile-row-' + blockId);
  profileRow.style.display = (d.profilePct || 0) > 0 ? '' : 'none';
  document.getElementById('bd-profile-pct-' + blockId).textContent = d.profilePct || 0;
  document.getElementById('bd-profile-' + blockId).textContent = f(d.profileCost);
  var shippingLabelEl = document.getElementById('bd-shipping-label-' + blockId);
  var labourLabelEl = document.getElementById('bd-labour-label-' + blockId);
  if (d.flatRateApplied) {
    if (shippingLabelEl) shippingLabelEl.textContent = 'Shipping (flat):';
    if (labourLabelEl) labourLabelEl.textContent = 'Labour (flat):';
  } else {
    if (shippingLabelEl) shippingLabelEl.textContent = 'Shipping (' + (Number(d.shippingPct) || 0) + '%):';
    if (labourLabelEl) labourLabelEl.textContent = 'Labour (' + (Number(d.labourPct) || 0) + '%):';
  }
  document.getElementById('bd-shipping-' + blockId).textContent = f(d.shippingCost);
  document.getElementById('bd-labour-' + blockId).textContent = f(d.labourCost);
  document.getElementById('bd-pretotal-' + blockId).textContent = f(d.preTotalUnit);
  var marginRow = document.getElementById('bd-margin-row-' + blockId);
  if ((d.marginPct || 0) !== 0) {
    marginRow.style.display = '';
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
      discountRow.style.display = '';
      document.getElementById('bd-discount-pct-' + blockId).textContent = d.discountPct;
      document.getElementById('bd-discount-' + blockId).textContent = '-' + f(d.discountAmt);
    } else {
      discountRow.style.display = 'none';
    }
  }
  // Covers only row
  var coversOnlyRow = document.getElementById('bd-coversonly-row-' + blockId);
  if (coversOnlyRow) {
    if (d.isCoversOnly) {
      coversOnlyRow.style.display = '';
      document.getElementById('bd-coversonly-' + blockId).textContent = '-' + f(d.coversOnlyDeduction);
    } else {
      coversOnlyRow.style.display = 'none';
    }
  }
  // Panels row
  var panelsRow = document.getElementById('bd-panels-row-' + blockId);
  if (panelsRow) {
    if ((d.panelCount || 1) > 1) {
      panelsRow.style.display = '';
      document.getElementById('bd-panels-count-' + blockId).textContent = d.panelCount;
    } else {
      panelsRow.style.display = 'none';
    }
  }
  document.getElementById('bd-qty-' + blockId).textContent = d.qty || 1;
  document.getElementById('bd-total-' + blockId).textContent = f(d.total);
  this.updateBreakdownDetails(d);
  var vis = this.config.sectionVisibility || {};
  var fabricOk = vis.showFabricSection === false || this.selectedFabric || (this.config.hiddenValues && this.config.hiddenValues.fabric);
  var canAdd = this.selectedShape && (this.selectedFill || (this.config.hiddenValues && this.config.hiddenValues.fillType)) && fabricOk && (d.baseSubtotal || 0) > 0;
  document.getElementById('add-cart-btn-' + blockId).disabled = !canAdd;

  // Sync floating footer
  var floatingPrice = document.getElementById('floating-price-' + blockId);
  var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);
  if (floatingPrice) floatingPrice.textContent = f(d.total || 0);
  if (floatingAddBtn) floatingAddBtn.disabled = !canAdd;
  this.syncFloatingFooter();
};

// Writes the exact configuration and inputs next to each single-piece breakdown line
// (e.g. "Fabric Cost — Brown Leather · 412.5 sq in × $0.0241 × 1.325"), so the price
// can be checked without scrolling back up to the selections.
CushionCalculator.prototype.updateBreakdownDetails = function(d) {
  var blockId = this.blockId;
  var x = d.detail;
  var f = function(v) { return '$' + (parseFloat(v) || 0).toFixed(2); };
  var num = function(v, dp) { return (parseFloat(v) || 0).toLocaleString('en-US', { maximumFractionDigits: dp }); };
  var rate = function(v) { return '$' + num(v, 4); };
  var name = function(o) { return o && o.name ? o.name : ''; };

  // Put the detail in its own cell between the label and the amount of the row holding valueId
  var setDetail = function(valueId, text) {
    var valueEl = document.getElementById(valueId + '-' + blockId);
    var row = valueEl ? valueEl.parentNode : null;
    if (!row || row.firstElementChild === valueEl) return;
    var el = row.querySelector('.kraft2026zion-bd-detail');
    if (!el) {
      el = document.createElement('span');
      el.className = 'kraft2026zion-bd-detail';
      row.insertBefore(el, valueEl);
    }
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
  };

  if (!x) {
    ['bd-fabric', 'bd-fill', 'bd-subtotal', 'bd-design', 'bd-piping', 'bd-button', 'bd-antiskid', 'bd-rodpocket',
     'bd-drawstring', 'bd-ties', 'bd-fabricties', 'bd-profile', 'bd-shipping', 'bd-labour', 'bd-margin',
     'bd-discount', 'bd-coversonly', 'bd-total'].forEach(function(id) { setDetail(id, ''); });
    return;
  }

  var conv = num(x.conversionMultiplier, 4);
  var base = d.baseSubtotal || 0;
  var dimStr = (x.shape.inputFields || []).filter(function(fl) { return x.dimensions[fl.key]; })
    .map(function(fl) { return (fl.label || fl.key) + ' ' + x.dimensions[fl.key] + '"'; }).join(' × ');

  setDetail('bd-fabric', x.fabric
    ? name(x.fabric) + ' · ' + num(x.surfaceArea, 2) + ' sq in' + (x.isWeatherproof ? ' (no base)' : '') + ' × ' + rate(x.fabric.pricePerSqInch) + '/sq in × ' + conv
    : 'No fabric');
  setDetail('bd-fill', x.fill
    ? name(x.fill) + ' · ' + num(x.volume, 2) + ' cu in × ' + rate(x.fill.pricePerCubicInch) + '/cu in × ' + conv
    : 'No fill');
  setDetail('bd-subtotal', name(x.shape) + (dimStr ? ' · ' + dimStr : ''));
  setDetail('bd-design', name(x.design) + ' · ' + (d.designPct || 0) + '% of fabric ' + f(d.fabricCost));
  setDetail('bd-piping', name(x.piping) + ' · ' + (d.pipingPct || 0) + '% of ' + f(base));
  setDetail('bd-button', name(x.button) + ' · ' + (d.buttonPct || 0) + '% of ' + f(base));
  setDetail('bd-antiskid', name(x.antiSkid) + ' · ' + (d.antiSkidPct || 0) + '% of ' + f(base));
  setDetail('bd-rodpocket', name(x.rodPocket) + ' · ' + (d.rodPocketPct || 0) + '% of ' + f(base));
  setDetail('bd-drawstring', name(x.drawstring) + ' · ' + (d.drawstringPct || 0) + '% of ' + f(base));
  setDetail('bd-ties', x.ties ? name(x.ties) + ' · ' + f(x.ties.price) + ' × ' + conv : '');
  setDetail('bd-fabricties', x.fabricTies ? name(x.fabricTies) + ' · ' + f(x.fabricTies.price) + ' × ' + conv : '');
  setDetail('bd-profile', (d.profilePct || 0) + '% of ' + f(base) + ' (fabric + fill)');
  var shipLabourText = d.flatRateApplied
    ? 'fabric + fill ' + f(base) + ' is under ' + f(d.flatThreshold) + ', so flat rate'
    : null;
  setDetail('bd-shipping', shipLabourText || ((d.shippingPct || 0) + '% of ' + f(d.shippingLabourBase)));
  setDetail('bd-labour', shipLabourText || ((d.labourPct || 0) + '% of ' + f(d.shippingLabourBase)));
  setDetail('bd-margin', 'of ' + f(d.preTotalUnit));
  var discountParts = [];
  if (d.fabricDiscountPct) discountParts.push('fabric ' + d.fabricDiscountPct + '%');
  if (d.fillDiscountPct) discountParts.push('fill ' + d.fillDiscountPct + '%');
  setDetail('bd-discount', discountParts.length ? discountParts.join(' + ') + ' of ' + f(d.preTotalUnit + (d.marginAmt || 0)) : '');
  setDetail('bd-coversonly', d.isCoversOnly ? '30% of ' + f(base) + ' (fabric + fill)' : '');
  var panels = d.panelCount || 1;
  setDetail('bd-total', f((d.unitTotal || 0) / panels) + (panels > 1 ? ' × ' + panels + ' panels' : '') + ' × ' + (d.qty || 1));
};
