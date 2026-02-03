import prisma from "../db.server";

// This endpoint returns fabrics for a specific shop
// It's called from the storefront theme extension
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
    const fabrics = await prisma.fabric.findMany({
      where: {
        shop,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        costPerSqInch: true,
        imageUrl: true,
        description: true,
      },
    });

    // Also get the calculator settings for this shop
    const settings = await prisma.calculatorSettings.findUnique({
      where: { shop },
    });

    return new Response(JSON.stringify({
      fabrics,
      settings: settings || {
        foamCostPerCubicInch: 0.65,
        pipingCostPerInch: 0.50,
        tiesCostPerUnit: 10.00,
        labourMultiplier: 1.0,
        shippingMultiplier: 1.0,
        profitMargin: 0.50,
        antiSkidPercentage: 10.0,
        inrToUsdRate: 83.0,
        lowPriceThreshold: 150.0,
        lowPriceMarkup: 0.60,
      },
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error fetching fabrics:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch fabrics" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
