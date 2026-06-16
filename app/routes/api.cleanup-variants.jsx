import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { sweepAbandonedVariants, verifyCleanupSecret } from "../lib/variant-cleanup.server";

/**
 * Scheduled sweep of abandoned custom variants (those never consumed by an order).
 *
 * Not a Shopify-authenticated route — meant to be triggered by an external scheduler
 * (e.g. Railway/Render/GitHub Actions cron). Guarded by a shared secret:
 *
 *   POST /api/cleanup-variants
 *   Header: x-cleanup-secret: <CLEANUP_SECRET env var>
 *   Optional query: ?hours=24   (age threshold, default 24h)
 *                   ?shop=foo.myshopify.com  (limit to one shop)
 */
export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyCleanupSecret(request.headers.get("x-cleanup-secret"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const hours = parseFloat(url.searchParams.get("hours"));
  const olderThanMs =
    Number.isFinite(hours) && hours >= 0 ? hours * 60 * 60 * 1000 : undefined;
  const onlyShop = url.searchParams.get("shop");

  // Sweep only shops that actually have pending tracked variants.
  let shops;
  if (onlyShop) {
    shops = [onlyShop];
  } else {
    const grouped = await prisma.customVariant.findMany({
      where: { deletedAt: null },
      distinct: ["shop"],
      select: { shop: true },
    });
    shops = grouped.map((g) => g.shop);
  }

  const results = [];
  for (const shop of shops) {
    try {
      const { admin } = await unauthenticated.admin(shop);
      const deleted = await sweepAbandonedVariants(
        admin,
        shop,
        olderThanMs != null ? { olderThanMs } : {}
      );
      results.push({ shop, deleted });
    } catch (err) {
      console.error(`Cleanup sweep failed for ${shop}:`, err.message);
      results.push({ shop, error: err.message });
    }
  }

  return Response.json({ success: true, results });
};

// Block GET.
export const loader = () => new Response("Method not allowed", { status: 405 });
