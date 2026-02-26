import prisma from "../db.server";

// Returns init data for the Fabric & Fill Sample Shop storefront block:
// - shop settings (bundle price, min items, per-item price)
// - all active fill types
// - all active fabric categories (for filter)
// - fabric lookups (colors, patterns) for filter dropdowns
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [settings, fills, categories, patterns, colors] = await Promise.all([
      prisma.calculatorSettings.findUnique({ where: { shop } }),
      prisma.fillType.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, imageUrl: true, description: true },
      }),
      prisma.fabricCategory.findMany({
        where: { shop, isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.fabricPattern.findMany({
        where: { shop },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.fabricColor.findMany({
        where: { shop },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, hexCode: true },
      }),
    ]);

    const shopSettings = {
      sampleBundlePrice: settings?.sampleBundlePrice ?? 25.0,
      sampleMinItems: settings?.sampleMinItems ?? 4,
      samplePerItemPrice: settings?.samplePerItemPrice ?? 5.0,
      fabricSampleProductId: settings?.fabricSampleProductId ?? null,
    };

    return new Response(
      JSON.stringify({
        settings: shopSettings,
        fills,
        categories,
        lookups: { patterns, colors },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching fabric shop items:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch shop items", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
