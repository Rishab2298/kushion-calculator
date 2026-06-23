import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import {
  sweepAbandonedVariants,
  cleanupExistingCustomVariants,
  verifyCleanupSecret,
} from "../lib/variant-cleanup.server";

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

  // Run for every installed shop (union of shops with tracked variants + active sessions), so the
  // product scan also clears old/untracked junk on shops that have no tracked rows.
  let shops;
  if (onlyShop) {
    shops = [onlyShop];
  } else {
    const [tracked, sessions] = await Promise.all([
      prisma.customVariant.findMany({
        where: { deletedAt: null },
        distinct: ["shop"],
        select: { shop: true },
      }),
      prisma.session.findMany({ distinct: ["shop"], select: { shop: true } }),
    ]);
    shops = [...new Set([...tracked, ...sessions].map((s) => s.shop))];
  }

  const opts = olderThanMs != null ? { olderThanMs } : {};
  const results = [];
  for (const shop of shops) {
    try {
      const { admin } = await unauthenticated.admin(shop);
      // 1) Fast sweep of DB-tracked abandoned variants.
      const sweptTracked = await sweepAbandonedVariants(admin, shop, opts);
      // 2) Comprehensive product scan (legacy Custom-* + tracked) with clean-anchor guarantee.
      const scan = await cleanupExistingCustomVariants(admin, shop, opts);
      results.push({
        shop,
        sweptTracked,
        scannedProducts: scan.scannedProducts,
        deletedCount: scan.deletedCount,
        anchorsCreated: scan.anchorsCreated,
        pricesGuarded: scan.pricesGuarded,
        reorderedToFront: scan.reorderedToFront,
      });
    } catch (err) {
      console.error(`Cleanup failed for ${shop}:`, err.message);
      results.push({ shop, error: err.message });
    }
  }

  return Response.json({ success: true, results });
};

// Block GET.
export const loader = () => new Response("Method not allowed", { status: 405 });
