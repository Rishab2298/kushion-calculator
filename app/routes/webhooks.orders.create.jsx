import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { deleteTrackedVariantRows } from "../lib/variant-cleanup.server";

/**
 * orders/create webhook.
 *
 * Once a custom cushion variant has been ordered, it has served its purpose: the order
 * line item carries a snapshot of the title, price, and configuration properties, so the
 * variant itself is no longer needed. Delete it to keep the product clean and out of the
 * Google Merchant Center feed. Idempotent — webhooks can be delivered more than once.
 */
export const action = async ({ request }) => {
  const { shop, admin, payload, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (!admin) {
    // App may have been uninstalled; nothing to do.
    return new Response();
  }

  const lineItems = payload?.line_items || [];
  const variantGids = lineItems
    .map((li) => li.variant_id)
    .filter((id) => id != null)
    .map((id) => `gid://shopify/ProductVariant/${id}`);

  if (!variantGids.length) {
    return new Response();
  }

  const orderId = payload?.id ? String(payload.id) : null;

  // Only delete variants we created and haven't already removed.
  const rows = await prisma.customVariant.findMany({
    where: { shop, deletedAt: null, variantGid: { in: variantGids } },
    select: { variantGid: true, productGid: true },
  });

  if (rows.length) {
    const deleted = await deleteTrackedVariantRows(admin, rows, { orderId });
    console.log(`orders/create: deleted ${deleted} custom variant(s) for ${shop}`);
  }

  return new Response();
};
