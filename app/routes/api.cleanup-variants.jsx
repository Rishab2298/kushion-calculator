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
 *   Optional query: ?days=30    (age threshold; default 30 days)
 *                   ?hours=6     (legacy threshold override; honored if present)
 *                   ?scan=1      (also run the full catalog scan; default = DB sweep only)
 *                   ?shop=foo.myshopify.com  (limit to one shop)
 *
 * The cheap DB sweep runs on every call (every 6h via the cron). The heavy full catalog scan —
 * which also re-asserts the $59 / position guard and catches legacy untracked junk — only runs
 * when ?scan=1 (daily backstop), since add-to-cart already guards price/position inline.
 */
export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyCleanupSecret(request.headers.get("x-cleanup-secret"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  // Age threshold: prefer ?days=, fall back to legacy ?hours=; otherwise undefined → the lib
  // default (30 days). The full catalog scan only runs when explicitly requested with ?scan=1.
  const days = parseFloat(url.searchParams.get("days"));
  const hours = parseFloat(url.searchParams.get("hours"));
  let olderThanMs;
  if (Number.isFinite(days) && days >= 0) {
    olderThanMs = days * 24 * 60 * 60 * 1000;
  } else if (Number.isFinite(hours) && hours >= 0) {
    olderThanMs = hours * 60 * 60 * 1000;
  }
  const runScan = url.searchParams.get("scan") === "1";
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
      // 1) Fast sweep of DB-tracked abandoned variants (runs every call).
      const sweptTracked = await sweepAbandonedVariants(admin, shop, opts);
      const result = { shop, sweptTracked, scanned: runScan };
      // 2) Comprehensive product scan (legacy Custom-* + tracked) with the clean-anchor / price /
      //    position guarantee. Only on ?scan=1 (daily backstop) — it's the expensive path.
      if (runScan) {
        const scan = await cleanupExistingCustomVariants(admin, shop, opts);
        result.scannedProducts = scan.scannedProducts;
        result.deletedCount = scan.deletedCount;
        result.anchorsCreated = scan.anchorsCreated;
        result.pricesGuarded = scan.pricesGuarded;
        result.reorderedToFront = scan.reorderedToFront;
      }
      results.push(result);
    } catch (err) {
      console.error(`Cleanup failed for ${shop}:`, err.message);
      results.push({ shop, error: err.message });
    }
  }

  return Response.json({ success: true, results });
};

// Block GET.
export const loader = () => new Response("Method not allowed", { status: 405 });
