import prisma from "../db.server";

// Returns brands, patterns, colors for a shop (used by frontend filters)
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
    const [brands, patterns, colors, materials] = await Promise.all([
      prisma.fabricBrand.findMany({
        where: { shop },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, logoUrl: true },
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
      prisma.fabricMaterial.findMany({
        where: { shop },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return new Response(JSON.stringify({ brands, patterns, colors, materials }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching fabric lookups:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch lookups",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
