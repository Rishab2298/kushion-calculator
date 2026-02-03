import prisma from "../db.server";

// In-memory cache for calculator config
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to invalidate cache for a shop (call this when config changes)
export const invalidateConfigCache = (shop) => {
  for (const key of configCache.keys()) {
    if (key.startsWith(`${shop}-`)) {
      configCache.delete(key);
    }
  }
};

// Safe query helper - returns empty array/null on error
const safeQuery = async (queryFn, fallback = []) => {
  try {
    return await queryFn();
  } catch (error) {
    console.error("Query error:", error.message);
    return fallback;
  }
};

// This endpoint returns calculator configuration for a specific shop
// Optionally filtered by a profile ID
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const profileId = url.searchParams.get("profileId");
  const noCache = url.searchParams.get("noCache") === "true";

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check cache first
  const cacheKey = `${shop}-${profileId || "default"}`;
  if (!noCache) {
    const cached = configCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return new Response(cached.data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=60",
          "X-Cache": "HIT",
        },
      });
    }
  }

  try {
    // Fetch profile if specified, otherwise get default profile
    let profile = null;
    if (profileId) {
      profile = await safeQuery(
        () => prisma.calculatorProfile.findUnique({
          where: { id: profileId },
          include: { pieces: { orderBy: { sortOrder: "asc" } } },
        }),
        null
      );
    }

    // If no profile found or not specified, try to get the default profile
    if (!profile) {
      profile = await safeQuery(
        () => prisma.calculatorProfile.findFirst({
          where: { shop, isDefault: true, isActive: true },
          include: { pieces: { orderBy: { sortOrder: "asc" } } },
        }),
        null
      );
    }

    // Fetch all configuration data with error handling for each
    const [shapes, fillTypes, fabricCategories, uncategorizedFabrics, pipingOptions, buttonStyleOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions, settings, priceTiers, totalCategoryCount] = await Promise.all([
      safeQuery(() => prisma.shape.findMany({
        where: { shop, isActive: true },
        include: { inputFields: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.fillType.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(async () => {
        // Fetch categories with default fabric per category
        const categories = await prisma.fabricCategory.findMany({
          where: { shop, isActive: true },
          include: {
            _count: { select: { fabrics: true } },
            // Get default fabric for each category
            fabrics: {
              where: { isActive: true, isDefault: true },
              take: 1,
              select: { id: true, name: true, imageUrl: true, pricePerSqInch: true, priceTier: true, discountEnabled: true, discountPercent: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        });
        return categories.map(cat => ({
          ...cat,
          totalFabricCount: cat._count?.fabrics || 0,
          defaultFabric: cat.fabrics?.[0] || null,
        }));
      }),
      safeQuery(() => prisma.fabric.findMany({
        where: { shop, categoryId: null, isActive: true },
        include: {
          materialAssignments: { include: { material: { select: { id: true, name: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.pipingOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.buttonStyleOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.antiSkidOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.tiesOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.designOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.fabricTiesOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.rodPocketOption.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
      })),
      safeQuery(() => prisma.calculatorSettings.findUnique({
        where: { shop },
      }), null),
      safeQuery(() => prisma.priceTier.findMany({
        where: { shop },
        orderBy: { minPrice: "asc" },
      })),
      safeQuery(() => prisma.fabricCategory.count({
        where: { shop, isActive: true },
      }), 0),
    ]);

    // Apply profile filtering
    let filteredShapes = shapes;
    let filteredFillTypes = fillTypes;
    let filteredPipingOptions = pipingOptions;
    let filteredButtonOptions = buttonStyleOptions;
    let filteredAntiSkidOptions = antiSkidOptions;
    let filteredTiesOptions = tiesOptions;
    let filteredDesignOptions = designOptions;
    let filteredFabricTiesOptions = fabricTiesOptions;
    let filteredRodPocketOptions = rodPocketOptions;
    let filteredFabricCategories = fabricCategories;
    let filteredUncategorizedFabrics = uncategorizedFabrics;

    // Default section visibility (all visible)
    let sectionVisibility = {
      showShapeSection: true,
      showDimensionsSection: true,
      showFillSection: true,
      showFabricSection: true,
      showDesignSection: true,
      showPipingSection: true,
      showButtonSection: true,
      showAntiSkidSection: true,
      showRodPocketSection: true,
      showTiesSection: true,
      showFabricTiesSection: true,
      showInstructions: true,
    };

    // Profile additional values
    let profileAdditionalPercent = 0;
    let hiddenValues = {
      hiddenShapeId: null,
      hiddenFillTypeId: null,
      hiddenFabricId: null,
      hiddenDesignId: null,
      hiddenPipingId: null,
      hiddenButtonId: null,
      hiddenAntiSkidId: null,
      hiddenRodPocketId: null,
      hiddenTiesId: null,
      hiddenFabricTiesId: null,
    };

    if (profile) {
      // Apply section visibility from profile (with safe defaults)
      sectionVisibility = {
        showShapeSection: profile.showShapeSection ?? true,
        showDimensionsSection: profile.showDimensionsSection ?? true,
        showFillSection: profile.showFillSection ?? true,
        showFabricSection: profile.showFabricSection ?? true,
        showDesignSection: profile.showDesignSection ?? true,
        showPipingSection: profile.showPipingSection ?? true,
        showButtonSection: profile.showButtonSection ?? true,
        showAntiSkidSection: profile.showAntiSkidSection ?? true,
        showRodPocketSection: profile.showRodPocketSection ?? true,
        showTiesSection: profile.showTiesSection ?? true,
        showFabricTiesSection: profile.showFabricTiesSection ?? true,
        showInstructions: profile.showInstructions ?? true,
      };

      // Get profile additional percent
      profileAdditionalPercent = profile.additionalPercent || 0;

      // Get hidden values for hidden sections
      hiddenValues = {
        hiddenShapeId: profile.hiddenShapeId || null,
        hiddenFillTypeId: profile.hiddenFillTypeId || null,
        hiddenFabricId: profile.hiddenFabricId || null,
        hiddenDesignId: profile.hiddenDesignId || null,
        hiddenPipingId: profile.hiddenPipingId || null,
        hiddenButtonId: profile.hiddenButtonId || null,
        hiddenAntiSkidId: profile.hiddenAntiSkidId || null,
        hiddenRodPocketId: profile.hiddenRodPocketId || null,
        hiddenTiesId: profile.hiddenTiesId || null,
        hiddenFabricTiesId: profile.hiddenFabricTiesId || null,
      };

      // Filter shapes if profile has allowed list
      if (profile.allowedShapeIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedShapeIds);
          if (allowedIds.length > 0) {
            filteredShapes = shapes.filter(s => allowedIds.includes(s.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter fill types if profile has allowed list
      if (profile.allowedFillIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedFillIds);
          if (allowedIds.length > 0) {
            filteredFillTypes = fillTypes.filter(f => allowedIds.includes(f.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter fabrics if profile has allowed list
      // Note: Fabric filtering is now done on the client-side since fabrics are loaded on-demand
      // via api.fabrics-paginated. We just filter uncategorized fabrics here.
      if (profile.allowedFabricIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedFabricIds);
          if (allowedIds.length > 0) {
            filteredUncategorizedFabrics = uncategorizedFabrics.filter(f => allowedIds.includes(f.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter fabric categories if profile has allowed category list
      if (profile.allowedCategoryIds) {
        try {
          const allowedCatIds = JSON.parse(profile.allowedCategoryIds);
          if (allowedCatIds.length > 0) {
            filteredFabricCategories = fabricCategories.filter(c => allowedCatIds.includes(c.id));
            // Also clear uncategorized fabrics if categories are restricted
            filteredUncategorizedFabrics = [];
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter piping options if profile has allowed list
      if (profile.allowedPipingIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedPipingIds);
          if (allowedIds.length > 0) {
            filteredPipingOptions = pipingOptions.filter(p => allowedIds.includes(p.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter button options if profile has allowed list
      if (profile.allowedButtonIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedButtonIds);
          if (allowedIds.length > 0) {
            filteredButtonOptions = buttonStyleOptions.filter(b => allowedIds.includes(b.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter anti-skid options if profile has allowed list
      if (profile.allowedAntiSkidIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedAntiSkidIds);
          if (allowedIds.length > 0) {
            filteredAntiSkidOptions = antiSkidOptions.filter(a => allowedIds.includes(a.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter ties options if profile has allowed list
      if (profile.allowedTiesIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedTiesIds);
          if (allowedIds.length > 0) {
            filteredTiesOptions = tiesOptions.filter(t => allowedIds.includes(t.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter design options if profile has allowed list
      if (profile.allowedDesignIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedDesignIds);
          if (allowedIds.length > 0) {
            filteredDesignOptions = designOptions.filter(d => allowedIds.includes(d.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter fabric ties options if profile has allowed list
      if (profile.allowedFabricTiesIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedFabricTiesIds);
          if (allowedIds.length > 0) {
            filteredFabricTiesOptions = fabricTiesOptions.filter(ft => allowedIds.includes(ft.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Filter rod pocket options if profile has allowed list
      if (profile.allowedRodPocketIds) {
        try {
          const allowedIds = JSON.parse(profile.allowedRodPocketIds);
          if (allowedIds.length > 0) {
            filteredRodPocketOptions = rodPocketOptions.filter(rp => allowedIds.includes(rp.id));
          }
        } catch (e) { /* ignore parse errors */ }
      }
    }

    // Find defaults for each category
    const defaultShape = filteredShapes.find(s => s.isDefault) || filteredShapes[0] || null;
    const defaultFillType = filteredFillTypes.find(f => f.isDefault) || null;
    // Note: Fabrics are now loaded on-demand, so we only check uncategorized fabrics for default
    const defaultFabric = filteredUncategorizedFabrics.find(f => f.isDefault) || null;
    const defaultDesignOption = filteredDesignOptions.find(d => d.isDefault) || null;
    const defaultPipingOption = filteredPipingOptions.find(p => p.isDefault) || null;
    const defaultButtonOption = filteredButtonOptions.find(b => b.isDefault) || null;
    const defaultAntiSkidOption = filteredAntiSkidOptions.find(a => a.isDefault) || null;
    const defaultRodPocketOption = filteredRodPocketOptions.find(rp => rp.isDefault) || null;
    const defaultTiesOption = filteredTiesOptions.find(t => t.isDefault) || null;
    const defaultFabricTiesOption = filteredFabricTiesOptions.find(ft => ft.isDefault) || null;

    // Find hidden option details if set
    let hiddenShape = null;
    let hiddenFillType = null;
    let hiddenFabric = null;
    let hiddenDesign = null;
    let hiddenPiping = null;
    let hiddenButton = null;
    let hiddenAntiSkid = null;
    let hiddenRodPocket = null;
    let hiddenTies = null;
    let hiddenFabricTies = null;

    if (hiddenValues.hiddenShapeId) {
      hiddenShape = shapes.find(s => s.id === hiddenValues.hiddenShapeId);
    }
    if (hiddenValues.hiddenFillTypeId) {
      hiddenFillType = fillTypes.find(f => f.id === hiddenValues.hiddenFillTypeId);
    }
    if (hiddenValues.hiddenFabricId) {
      // Since fabrics are now loaded on-demand, fetch hidden fabric directly
      hiddenFabric = uncategorizedFabrics.find(f => f.id === hiddenValues.hiddenFabricId) ||
                     await safeQuery(() => prisma.fabric.findUnique({
                       where: { id: hiddenValues.hiddenFabricId },
                       select: { id: true, name: true, pricePerSqInch: true, discountEnabled: true, discountPercent: true },
                     }), null);
    }
    if (hiddenValues.hiddenPipingId) {
      hiddenPiping = pipingOptions.find(p => p.id === hiddenValues.hiddenPipingId);
    }
    if (hiddenValues.hiddenButtonId) {
      hiddenButton = buttonStyleOptions.find(b => b.id === hiddenValues.hiddenButtonId);
    }
    if (hiddenValues.hiddenAntiSkidId) {
      hiddenAntiSkid = antiSkidOptions.find(a => a.id === hiddenValues.hiddenAntiSkidId);
    }
    if (hiddenValues.hiddenTiesId) {
      hiddenTies = tiesOptions.find(t => t.id === hiddenValues.hiddenTiesId);
    }
    if (hiddenValues.hiddenDesignId) {
      hiddenDesign = designOptions.find(d => d.id === hiddenValues.hiddenDesignId);
    }
    if (hiddenValues.hiddenFabricTiesId) {
      hiddenFabricTies = fabricTiesOptions.find(ft => ft.id === hiddenValues.hiddenFabricTiesId);
    }
    if (hiddenValues.hiddenRodPocketId) {
      hiddenRodPocket = rodPocketOptions.find(rp => rp.id === hiddenValues.hiddenRodPocketId);
    }

    const responseData = JSON.stringify({
      // Profile info
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        additionalPercent: profileAdditionalPercent,
        allowedCategoryIds: profile.allowedCategoryIds ? JSON.parse(profile.allowedCategoryIds) : null,
        enableMultiPiece: profile.enableMultiPiece || false,
        piecesLabel: profile.piecesLabel || "Pieces",
        pieces: (profile.pieces || []).map(p => ({
          id: p.id,
          name: p.name,
          label: p.label || p.name,
          sortOrder: p.sortOrder,
          showShapeSection: p.showShapeSection ?? true,
          showDimensionsSection: p.showDimensionsSection ?? true,
          showFillSection: p.showFillSection ?? true,
          showDesignSection: p.showDesignSection ?? true,
          showPipingSection: p.showPipingSection ?? true,
          showButtonSection: p.showButtonSection ?? true,
          showAntiSkidSection: p.showAntiSkidSection ?? true,
          showRodPocketSection: p.showRodPocketSection ?? true,
          showTiesSection: p.showTiesSection ?? true,
          showFabricTiesSection: p.showFabricTiesSection ?? true,
          allowedShapeIds: p.allowedShapeIds ? JSON.parse(p.allowedShapeIds) : null,
          allowedFillIds: p.allowedFillIds ? JSON.parse(p.allowedFillIds) : null,
          allowedDesignIds: p.allowedDesignIds ? JSON.parse(p.allowedDesignIds) : null,
          allowedPipingIds: p.allowedPipingIds ? JSON.parse(p.allowedPipingIds) : null,
          allowedButtonIds: p.allowedButtonIds ? JSON.parse(p.allowedButtonIds) : null,
          allowedAntiSkidIds: p.allowedAntiSkidIds ? JSON.parse(p.allowedAntiSkidIds) : null,
          allowedRodPocketIds: p.allowedRodPocketIds ? JSON.parse(p.allowedRodPocketIds) : null,
          allowedTiesIds: p.allowedTiesIds ? JSON.parse(p.allowedTiesIds) : null,
          allowedFabricTiesIds: p.allowedFabricTiesIds ? JSON.parse(p.allowedFabricTiesIds) : null,
          hiddenShapeId: p.hiddenShapeId || null,
          hiddenFillTypeId: p.hiddenFillTypeId || null,
          hiddenDesignId: p.hiddenDesignId || null,
          hiddenPipingId: p.hiddenPipingId || null,
          hiddenButtonId: p.hiddenButtonId || null,
          hiddenAntiSkidId: p.hiddenAntiSkidId || null,
          hiddenRodPocketId: p.hiddenRodPocketId || null,
          hiddenTiesId: p.hiddenTiesId || null,
          hiddenFabricTiesId: p.hiddenFabricTiesId || null,
          defaultShapeId: p.defaultShapeId || null,
          defaultFillId: p.defaultFillId || null,
        })),
      } : null,

      // Section visibility
      sectionVisibility,

      // Hidden values (for calculation when section is hidden)
      hiddenValues: {
        shape: hiddenShape ? {
          id: hiddenShape.id,
          name: hiddenShape.name,
          imageUrl: hiddenShape.imageUrl,
          surfaceAreaFormula: hiddenShape.surfaceAreaFormula,
          volumeFormula: hiddenShape.volumeFormula,
          is2D: hiddenShape.is2D || false,
          enablePanels: hiddenShape.enablePanels || false,
          maxPanels: hiddenShape.maxPanels || 10,
          inputFields: (hiddenShape.inputFields || []).map(f => ({
            label: f.label,
            key: f.key,
            unit: f.unit,
            min: f.min,
            max: f.max,
            required: f.required,
            defaultValue: f.defaultValue,
          })),
        } : null,
        fillType: hiddenFillType ? {
          id: hiddenFillType.id,
          name: hiddenFillType.name,
          pricePerCubicInch: hiddenFillType.pricePerCubicInch,
          discountEnabled: hiddenFillType.discountEnabled || false,
          discountPercent: hiddenFillType.discountPercent || 0,
        } : null,
        fabric: hiddenFabric ? {
          id: hiddenFabric.id,
          name: hiddenFabric.name,
          pricePerSqInch: hiddenFabric.pricePerSqInch,
          discountEnabled: hiddenFabric.discountEnabled || false,
          discountPercent: hiddenFabric.discountPercent || 0,
        } : null,
        piping: hiddenPiping ? {
          id: hiddenPiping.id,
          name: hiddenPiping.name,
          percent: hiddenPiping.percent,
        } : null,
        button: hiddenButton ? {
          id: hiddenButton.id,
          name: hiddenButton.name,
          percent: hiddenButton.percent,
        } : null,
        antiSkid: hiddenAntiSkid ? {
          id: hiddenAntiSkid.id,
          name: hiddenAntiSkid.name,
          percent: hiddenAntiSkid.percent,
        } : null,
        ties: hiddenTies ? {
          id: hiddenTies.id,
          name: hiddenTies.name,
          price: hiddenTies.price,
        } : null,
        design: hiddenDesign ? {
          id: hiddenDesign.id,
          name: hiddenDesign.name,
          percent: hiddenDesign.percent,
        } : null,
        fabricTies: hiddenFabricTies ? {
          id: hiddenFabricTies.id,
          name: hiddenFabricTies.name,
          price: hiddenFabricTies.price,
        } : null,
        rodPocket: hiddenRodPocket ? {
          id: hiddenRodPocket.id,
          name: hiddenRodPocket.name,
          percent: hiddenRodPocket.percent,
        } : null,
      },

      // Filtered data
      shapes: filteredShapes.map(shape => ({
        id: shape.id,
        name: shape.name,
        imageUrl: shape.imageUrl,
        surfaceAreaFormula: shape.surfaceAreaFormula,
        volumeFormula: shape.volumeFormula,
        isDefault: shape.isDefault,
        is2D: shape.is2D || false,
        enablePanels: shape.enablePanels || false,
        maxPanels: shape.maxPanels || 10,
        inputFields: (shape.inputFields || []).map(f => ({
          label: f.label,
          key: f.key,
          unit: f.unit,
          min: f.min,
          max: f.max,
          required: f.required,
          defaultValue: f.defaultValue,
        })),
      })),
      defaultShapeId: defaultShape?.id || null,
      defaultFillTypeId: defaultFillType?.id || null,
      defaultFabricId: defaultFabric?.id || null,
      defaultDesignId: defaultDesignOption?.id || null,
      defaultPipingId: defaultPipingOption?.id || null,
      defaultButtonId: defaultButtonOption?.id || null,
      defaultAntiSkidId: defaultAntiSkidOption?.id || null,
      defaultRodPocketId: defaultRodPocketOption?.id || null,
      defaultTiesId: defaultTiesOption?.id || null,
      defaultFabricTiesId: defaultFabricTiesOption?.id || null,

      fillTypes: filteredFillTypes.map(ft => ({
        id: ft.id,
        name: ft.name,
        imageUrl: ft.imageUrl,
        pricePerCubicInch: ft.pricePerCubicInch,
        description: ft.description,
        isDefault: ft.isDefault,
        discountEnabled: ft.discountEnabled || false,
        discountPercent: ft.discountPercent || 0,
      })),
      totalCategoryCount: totalCategoryCount || 0,
      fabricCategories: filteredFabricCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        totalFabricCount: cat.totalFabricCount || 0,
        defaultFabric: cat.defaultFabric || null,
      })),
      uncategorizedFabrics: filteredUncategorizedFabrics.map(fab => ({
        id: fab.id,
        name: fab.name,
        imageUrl: fab.imageUrl,
        pricePerSqInch: fab.pricePerSqInch,
        description: fab.description,
        isDefault: fab.isDefault,
        materialName: (fab.materialAssignments || []).map(a => a.material.name).join(", ") || null,
        priceTier: fab.priceTier,
        discountEnabled: fab.discountEnabled || false,
        discountPercent: fab.discountPercent || 0,
      })),
      pipingOptions: filteredPipingOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        percent: opt.percent ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      buttonStyleOptions: filteredButtonOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        percent: opt.percent ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      antiSkidOptions: filteredAntiSkidOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        percent: opt.percent ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      tiesOptions: filteredTiesOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        price: opt.price ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      designOptions: filteredDesignOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        percent: opt.percent ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      fabricTiesOptions: filteredFabricTiesOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        price: opt.price ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      rodPocketOptions: filteredRodPocketOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        imageUrl: opt.imageUrl,
        percent: opt.percent ?? 0,
        description: opt.description,
        isDefault: opt.isDefault,
      })),
      settings: {
        currencySymbol: settings?.currencySymbol || "$",
        enablePriceTiers: settings?.enablePriceTiers ?? true,
        shippingPercent: settings?.shippingPercent ?? 100,
        labourPercent: settings?.labourPercent ?? 100,
        conversionPercent: settings?.conversionPercent ?? 0,
        debugPricing: settings?.debugPricing ?? false,
        tiesIncludeInShippingLabour: settings?.tiesIncludeInShippingLabour ?? true,
        marginCalculationMethod: settings?.marginCalculationMethod || "tier",
        flatMarginThreshold: settings?.flatMarginThreshold ?? 50,
        flatMarginPercent: settings?.flatMarginPercent ?? 100,
        formulaThreshold: settings?.formulaThreshold ?? 400,
        formulaLowConstant: settings?.formulaLowConstant ?? 300,
        formulaLowCoefficient: settings?.formulaLowCoefficient ?? 52,
        formulaHighConstant: settings?.formulaHighConstant ?? 120,
        formulaHighCoefficient: settings?.formulaHighCoefficient ?? 20,
      },
      priceTiers: priceTiers.map(tier => ({
        minPrice: tier.minPrice,
        maxPrice: tier.maxPrice,
        adjustmentPercent: tier.adjustmentPercent,
      })),
    });

    // Store in cache
    configCache.set(cacheKey, {
      data: responseData,
      time: Date.now(),
    });

    // Limit cache size to prevent memory issues (max 100 entries)
    if (configCache.size > 100) {
      const firstKey = configCache.keys().next().value;
      configCache.delete(firstKey);
    }

    return new Response(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error fetching calculator config:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);

    // Return a minimal valid response so the calculator can at least load
    const fallbackResponse = JSON.stringify({
      error: "Failed to fetch configuration",
      message: error.message,
      shapes: [],
      fillTypes: [],
      fabricCategories: [],
      uncategorizedFabrics: [],
      pipingOptions: [],
      buttonStyleOptions: [],
      antiSkidOptions: [],
      tiesOptions: [],
      designOptions: [],
      fabricTiesOptions: [],
      rodPocketOptions: [],
      priceTiers: [],
      settings: {
        currencySymbol: "$",
        enablePriceTiers: true,
        shippingPercent: 100,
        labourPercent: 100,
        conversionPercent: 0,
        debugPricing: false,
      },
      sectionVisibility: {
        showShapeSection: true,
        showDimensionsSection: true,
        showFillSection: true,
        showFabricSection: true,
        showDesignSection: true,
        showPipingSection: true,
        showButtonSection: true,
        showAntiSkidSection: true,
        showRodPocketSection: true,
        showTiesSection: true,
        showFabricTiesSection: true,
        showInstructions: true,
      },
      hiddenValues: {},
      profile: null,
    });

    return new Response(fallbackResponse, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
