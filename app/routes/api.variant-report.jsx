import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import {
  scanCalculatorProducts,
  verifyCleanupSecret,
} from "../lib/variant-cleanup.server";

/**
 * Read-only diagnostic for the $59 price guard. Reports, per calculator product, whether it has a
 * "Default Title" variant and what it's priced at, plus what the guard would do — WITHOUT making
 * any changes. Same auth as the cleanup endpoint, but no mutation code path exists here.
 *
 *   POST /api/variant-report
 *   Header: x-cleanup-secret: <CLEANUP_SECRET env var>
 *   Optional query: ?hours=24   (age threshold used only to count "old" customs, default 24h)
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

  // Same shop resolution as the cleanup endpoint (tracked variants + active sessions).
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
      const scan = await scanCalculatorProducts(admin, shop, opts);
      // Roll up planned actions across the shop's calculator products.
      const summary = scan.report.reduce((acc, r) => {
        acc[r.plannedAction] = (acc[r.plannedAction] || 0) + 1;
        return acc;
      }, {});
      results.push({
        shop,
        scannedProducts: scan.scannedProducts,
        calculatorProducts: scan.calculatorProducts,
        summary,
        report: scan.report,
      });
    } catch (err) {
      console.error(`Variant report failed for ${shop}:`, err.message);
      results.push({ shop, error: err.message });
    }
  }

  return Response.json({ success: true, results });
};

// Block GET (read-only, but still secret-guarded via POST).
export const loader = () => new Response("Method not allowed", { status: 405 });
