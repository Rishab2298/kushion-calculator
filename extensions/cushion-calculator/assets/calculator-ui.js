// Cushion Price Calculator - UI Module
// Event listeners, floating footer, attachments, scroll helpers

CushionCalculator.prototype.setupEventListeners = function() {
  var self = this;
  var blockId = this.blockId;

  document.querySelectorAll('#calc-container-' + blockId + ' .kraft2026zion-accordion-header').forEach(function(header) {
    // Skip headers inside pieces-content (they have their own toggle via setupPieceSectionListeners)
    if (header.closest('.kraft2026zion-pieces-content')) return;
    header.addEventListener('click', function() { self.toggleSection(header.closest('.kraft2026zion-accordion-section').dataset.section); });
  });

  // Note: shared fabric container is handled by the general accordion header handler above

  this.container.addEventListener('click', function(e) {
    var card = e.target.closest('.kraft2026zion-option-card');
    if (!card) return;
    var type = card.dataset.type, id = card.dataset.id;
    if (type === 'shape') { var s = self.config.shapes.find(function(x) { return x.id === id; }); if (s) self.selectShape(s); }
    else if (type === 'fill') { var f = self.config.fillTypes.find(function(x) { return x.id === id; }); if (f) self.selectFill(f); }
    else if (type === 'fabric') {
      var fab = (self.config.uncategorizedFabrics || []).find(function(x) { return x.id === id; });
      if (!fab) {
        var cont = document.getElementById('fabric-categories-' + blockId);
        if (cont._inlineFabrics) fab = cont._inlineFabrics.find(function(x) { return x.id === id; });
      }
      if (fab) self.selectFabric(fab);
    }
    else if (type === 'design') self.selectDesign(id);
    else if (type === 'piping') self.selectPiping(id);
    else if (type === 'button') self.selectButton(id);
    else if (type === 'antiskid') self.selectAntiSkid(id);
    else if (type === 'rodpocket') self.selectRodPocket(id);
    else if (type === 'ties') self.selectTies(id);
    else if (type === 'fabricties') self.selectFabricTies(id);
    else if (type === 'drawstring') self.selectDrawstring(id);
  });

  document.getElementById('quantity-' + blockId).addEventListener('input', function() { self.syncFloatingFooter(); self.calculatePrice(); });

  // Quantity +/- buttons
  document.getElementById('qty-minus-' + blockId).addEventListener('click', function() {
    var qtyInput = document.getElementById('quantity-' + blockId);
    var val = parseInt(qtyInput.value) || 1;
    if (val > 1) {
      self.updateQuantity(val - 1);
    }
  });
  document.getElementById('qty-plus-' + blockId).addEventListener('click', function() {
    var qtyInput = document.getElementById('quantity-' + blockId);
    var val = parseInt(qtyInput.value) || 1;
    if (val < 100) {
      self.updateQuantity(val + 1);
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
  document.getElementById('instructions-text-' + blockId).addEventListener('input', function() { self.updateInstructionsValue(); });

  document.getElementById('add-cart-btn-' + blockId).addEventListener('click', function() { self.addToCart(); });
  document.getElementById('continue-shopping-' + blockId).addEventListener('click', function() { self.hideSuccessPopup(); });
  document.getElementById('view-cart-' + blockId).addEventListener('click', function() { self.hideSuccessPopup(); sessionStorage.setItem('cushion_refresh_cart', 'true'); window.location.href = '/cart'; });
  document.getElementById('cart-success-overlay-' + blockId).addEventListener('click', function(e) { if (e.target.id === 'cart-success-overlay-' + blockId) self.hideSuccessPopup(); });

  this.setupAttachmentListeners();
  this.setupFloatingFooterListeners();
};

CushionCalculator.prototype.setupFloatingFooter = function() {
  var blockId = this.blockId;
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
};

CushionCalculator.prototype.setupFloatingFooterListeners = function() {
  var self = this;
  var blockId = this.blockId;
  var floatingMinusBtn = document.getElementById('floating-qty-minus-' + blockId);
  var floatingPlusBtn = document.getElementById('floating-qty-plus-' + blockId);
  var floatingAddBtn = document.getElementById('floating-add-btn-' + blockId);

  if (floatingMinusBtn) {
    floatingMinusBtn.addEventListener('click', function() {
      var qtyInput = document.getElementById('quantity-' + blockId);
      var val = parseInt(qtyInput.value) || 1;
      if (val > 1) {
        self.updateQuantity(val - 1);
      }
    });
  }

  if (floatingPlusBtn) {
    floatingPlusBtn.addEventListener('click', function() {
      var qtyInput = document.getElementById('quantity-' + blockId);
      var val = parseInt(qtyInput.value) || 1;
      if (val < 100) {
        self.updateQuantity(val + 1);
      }
    });
  }

  if (floatingAddBtn) {
    floatingAddBtn.addEventListener('click', function() { self.addToCart(); });
  }
};

CushionCalculator.prototype.updateQuantity = function(newQty) {
  var blockId = this.blockId;
  // Update main quantity input
  var qtyInput = document.getElementById('quantity-' + blockId);
  if (qtyInput) qtyInput.value = newQty;

  // Update floating quantity display
  var floatingQtyValue = document.getElementById('floating-qty-value-' + blockId);
  if (floatingQtyValue) floatingQtyValue.textContent = newQty;

  // Recalculate price
  this.calculatePrice();
};

CushionCalculator.prototype.syncFloatingFooter = function() {
  var blockId = this.blockId;
  var qtyInput = document.getElementById('quantity-' + blockId);
  var floatingQtyValue = document.getElementById('floating-qty-value-' + blockId);

  if (qtyInput && floatingQtyValue) {
    floatingQtyValue.textContent = qtyInput.value;
  }
};

CushionCalculator.prototype.setupAttachmentListeners = function() {
  var self = this;
  var blockId = this.blockId;
  var dropzone = document.getElementById('attachment-dropzone-' + blockId);
  var fileInput = document.getElementById('attachment-input-' + blockId);
  var removeBtn = document.getElementById('preview-remove-' + blockId);

  if (!dropzone || !fileInput) return;

  // Click to select file
  dropzone.addEventListener('click', function(e) {
    if (e.target.closest('.kraft2026zion-preview-remove')) return;
    fileInput.click();
  });

  // File selected
  fileInput.addEventListener('change', function() {
    if (fileInput.files && fileInput.files[0]) {
      self.handleFileSelect(fileInput.files[0]);
    }
  });

  // Drag and drop
  dropzone.addEventListener('dragover', function(e) {
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
      self.handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Remove file
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self.clearAttachment();
    });
  }
};

CushionCalculator.prototype.handleFileSelect = function(file) {
  var blockId = this.blockId;
  var errorEl = document.getElementById('attachment-error-' + blockId);
  errorEl.style.display = 'none';

  // Validate file type
  if (!CushionCalculator.ALLOWED_TYPES.includes(file.type)) {
    this.showAttachmentError('Invalid file type. Only PNG, JPG, and JPEG are allowed.');
    return;
  }

  // Validate file size
  if (file.size > CushionCalculator.MAX_FILE_SIZE) {
    this.showAttachmentError('File too large. Maximum size is 2MB.');
    return;
  }

  // Show preview
  this.showFilePreview(file);

  // Upload file
  this.uploadAttachment(file);
};

CushionCalculator.prototype.showFilePreview = function(file) {
  var blockId = this.blockId;
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
};

CushionCalculator.prototype.showAttachmentError = function(message) {
  var errorEl = document.getElementById('attachment-error-' + this.blockId);
  errorEl.textContent = message;
  errorEl.style.display = 'block';
};

CushionCalculator.prototype.clearAttachment = function() {
  var blockId = this.blockId;
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

  this.attachmentUrl = null;
  this.attachmentFileName = null;

  this.updateInstructionsValue();
};

CushionCalculator.prototype.uploadAttachment = async function(file) {
  var self = this;
  var blockId = this.blockId;
  var preview = document.getElementById('dropzone-preview-' + blockId);
  var uploading = document.getElementById('dropzone-uploading-' + blockId);
  var success = document.getElementById('dropzone-success-' + blockId);

  preview.style.display = 'none';
  uploading.style.display = 'flex';

  try {
    // Convert file to base64
    var base64Data = await this.fileToBase64(file);

    var response = await fetch('/apps/cushion-api/upload-attachment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop: this.shopDomain,
        fileName: file.name,
        fileType: file.type,
        fileData: base64Data
      })
    });

    var result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    this.attachmentUrl = result.fileUrl;
    this.attachmentFileName = file.name;

    uploading.style.display = 'none';
    success.style.display = 'flex';

    // Show success briefly then show preview
    setTimeout(function() {
      success.style.display = 'none';
      preview.style.display = 'flex';
    }, 1500);

    this.updateInstructionsValue();

  } catch (error) {
    console.error('Upload error:', error);
    uploading.style.display = 'none';
    this.clearAttachment();
    this.showAttachmentError(error.message || 'Failed to upload file. Please try again.');
  }
};

CushionCalculator.prototype.fileToBase64 = function(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = function(error) { reject(error); };
    reader.readAsDataURL(file);
  });
};

CushionCalculator.prototype.updateInstructionsValue = function() {
  var blockId = this.blockId;
  var instructions = document.getElementById('instructions-text-' + blockId).value;
  var valueEl = document.getElementById('value-instructions-' + blockId);

  if (instructions || this.attachmentUrl) {
    var parts = [];
    if (instructions) parts.push('Note added');
    if (this.attachmentUrl) parts.push('Image attached');
    valueEl.textContent = parts.join(', ');
    valueEl.classList.add('kraft2026zion-selected');
  } else {
    valueEl.textContent = 'Optional';
    valueEl.classList.remove('kraft2026zion-selected');
  }
};
