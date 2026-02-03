import prisma from "../db.server";

// Paginated fabric browser endpoint with filters and sorting
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pagination parameters
  const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit")) || 40));
  const skip = (page - 1) * limit;

  // Filter parameters
  const categoryId = url.searchParams.get("categoryId") || null;
  const brandId = url.searchParams.get("brandId") || null;
  const patternId = url.searchParams.get("patternId") || null;
  const colorId = url.searchParams.get("colorId") || null;
  const priceTier = url.searchParams.get("priceTier") || null;
  const materialId = url.searchParams.get("materialId") || null;
  const search = url.searchParams.get("search") || null;

  // Sorting parameters
  const sortBy = url.searchParams.get("sortBy") || "sortOrder";
  const sortDir = url.searchParams.get("sortDir") === "desc" ? "desc" : "asc";

  try {
    // Build where clause for fabrics
    const where = {
      shop,
      isActive: true,
    };

    // Category filter
    if (categoryId) {
      if (categoryId === "uncategorized") {
        where.categoryId = null;
      } else {
        where.categoryId = categoryId;
      }
    }

    // Direct field filters
    if (brandId) where.brandId = brandId;
    if (priceTier) where.priceTier = priceTier;
    if (search) where.name = { contains: search, mode: "insensitive" };

    // Junction table filters
    if (patternId) {
      where.patternAssignments = { some: { patternId } };
    }
    if (colorId) {
      where.colorAssignments = { some: { colorId } };
    }
    if (materialId) {
      where.materialAssignments = { some: { materialId } };
    }

    // Build orderBy clause
    const validSortFields = ["sortOrder", "name", "pricePerSqInch", "priceTier", "createdAt"];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "sortOrder";
    const orderBy = { [orderByField]: sortDir };

    // Fetch fabrics with pagination
    const [fabrics, totalCount] = await Promise.all([
      prisma.fabric.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          patternAssignments: {
            include: { pattern: { select: { id: true, name: true } } },
          },
          colorAssignments: {
            include: { color: { select: { id: true, name: true, hexCode: true } } },
          },
          materialAssignments: {
            include: { material: { select: { id: true, name: true } } },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.fabric.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      page,
      limit,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    // Format fabric response
    const formattedFabrics = fabrics.map(fab => ({
      id: fab.id,
      name: fab.name,
      imageUrl: fab.imageUrl,
      pricePerSqInch: fab.pricePerSqInch,
      description: fab.description,
      materialName: fab.materialAssignments.map(a => a.material.name).join(", ") || null,
      isDefault: fab.isDefault,
      priceTier: fab.priceTier,
      categoryId: fab.categoryId,
      categoryName: fab.category?.name || null,
      brandId: fab.brandId,
      brandName: fab.brand?.name || null,
      discountEnabled: fab.discountEnabled || false,
      discountPercent: fab.discountPercent || 0,
      patterns: fab.patternAssignments.map(a => ({
        id: a.pattern.id,
        name: a.pattern.name,
      })),
      colors: fab.colorAssignments.map(a => ({
        id: a.color.id,
        name: a.color.name,
        hexCode: a.color.hexCode,
      })),
      materials: fab.materialAssignments.map(a => ({
        id: a.material.id,
        name: a.material.name,
      })),
    }));

    return new Response(JSON.stringify({
      fabrics: formattedFabrics,
      pagination,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error) {
    console.error("Error fetching paginated fabrics:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch fabrics",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
