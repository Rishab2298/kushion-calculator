/**
 * Shared helpers for deleting the dynamically-created cushion variants.
 *
 * Custom variants are created on every "Add to Cart" (see api.create-variant.jsx).
 * They must be cleaned up so they don't accumulate on the product and leak into the
 * Google Merchant Center feed. Shopify orders snapshot their line items, so deleting
 * a variant after an order is placed never affects the placed order.
 *
 * Used by:
 *  - webhooks.orders.create.jsx  → delete the variant(s) an order consumed
 *  - api.cleanup-variants.jsx     → scheduled sweep of abandoned tracked variants
 *  - app.settings.jsx (action)    → one-time cleanup of pre-existing junk variants
 */

import prisma from "../db.server";

const DAY_MS = 24 * 60 * 60 * 1000;

// Variant titles created by the calculator start with this prefix (see api.create-variant.jsx).
export const CUSTOM_VARIANT_PREFIX = "Custom-";

const BULK_DELETE_MUTATION = `#graphql
  mutation BulkDeleteVariants($productId: ID!, $variantsIds: [ID!]!) {
    productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
      userErrors { field message }
    }
  }`;

/** Validate the shared secret used to guard the scheduled cleanup endpoint. */
export function verifyCleanupSecret(provided) {
  const secret = process.env.CLEANUP_SECRET;
  return Boolean(secret) && provided === secret;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Delete a set of variant GIDs that all belong to a single product, in batches.
 * Returns { deletedGids, failedGids }. Variants that no longer exist are treated as
 * already deleted so callers stop retrying them.
 */
async function bulkDeleteForProduct(admin, productGid, variantGids) {
  const deletedGids = [];
  const failedGids = [];

  for (const batch of chunk(variantGids, 100)) {
    try {
      const resp = await admin.graphql(BULK_DELETE_MUTATION, {
        variables: { productId: productGid, variantsIds: batch },
      });
      const json = await resp.json();
      const errors = json.data?.productVariantsBulkDelete?.userErrors || [];

      if (errors.length) {
        const msg = errors.map((e) => e.message).join("; ");
        // Already gone → consider handled. Anything else → real failure.
        if (/does not exist|couldn'?t find|not found/i.test(msg)) {
          deletedGids.push(...batch);
        } else {
          console.error(`Variant bulk delete error for ${productGid}: ${msg}`);
          failedGids.push(...batch);
        }
      } else {
        deletedGids.push(...batch);
      }
    } catch (err) {
      console.error(`Variant bulk delete request failed for ${productGid}:`, err.message);
      failedGids.push(...batch);
    }
  }

  return { deletedGids, failedGids };
}

/**
 * Delete the given tracked CustomVariant rows from Shopify and mark them deleted in the DB.
 * Used by the order webhook and the scheduled sweep.
 *
 * @param rows  array of { variantGid, productGid }
 * @param opts  { orderId } optionally stamp the order that consumed the variant
 * @returns number of variants deleted
 */
export async function deleteTrackedVariantRows(admin, rows, { orderId } = {}) {
  const byProduct = new Map();
  for (const r of rows) {
    const list = byProduct.get(r.productGid) || [];
    list.push(r.variantGid);
    byProduct.set(r.productGid, list);
  }

  let deletedCount = 0;
  for (const [productGid, gids] of byProduct) {
    const { deletedGids } = await bulkDeleteForProduct(admin, productGid, gids);
    if (deletedGids.length) {
      await prisma.customVariant.updateMany({
        where: { variantGid: { in: deletedGids } },
        data: { deletedAt: new Date(), ...(orderId ? { orderId } : {}) },
      });
      deletedCount += deletedGids.length;
    }
  }
  return deletedCount;
}

/**
 * Scheduled sweep: delete tracked variants older than the cutoff that were never
 * consumed by an order (abandoned carts).
 *
 * @returns number of variants deleted
 */
export async function sweepAbandonedVariants(admin, shop, { olderThanMs = DAY_MS } = {}) {
  const cutoff = new Date(Date.now() - olderThanMs);
  const rows = await prisma.customVariant.findMany({
    where: { shop, deletedAt: null, createdAt: { lt: cutoff } },
    take: 1000,
    select: { variantGid: true, productGid: true },
  });
  if (!rows.length) return 0;
  return deleteTrackedVariantRows(admin, rows);
}

// Paginate every variant of a single product.
async function fetchAllVariants(admin, productGid) {
  const variants = [];
  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const resp = await admin.graphql(
      `#graphql
      query ProductVariants($id: ID!, $cursor: String) {
        product(id: $id) {
          variants(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges { node { id title createdAt } }
          }
        }
      }`,
      { variables: { id: productGid, cursor } }
    );
    const json = await resp.json();
    const conn = json.data?.product?.variants;
    if (!conn) break;
    for (const edge of conn.edges) variants.push(edge.node);
    hasNext = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return variants;
}

/**
 * One-time cleanup: scan every product in the shop, find variants whose title starts
 * with the custom prefix and are older than the cutoff, and delete them. Always leaves
 * at least one variant on each product (Shopify requires ≥1). Used by the admin button
 * to clear out variants created before DB tracking existed.
 *
 * @returns { scannedProducts, deletedCount }
 */
export async function cleanupExistingCustomVariants(admin, { olderThanMs = DAY_MS } = {}) {
  const cutoff = Date.now() - olderThanMs;
  let scannedProducts = 0;
  let deletedCount = 0;

  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const resp = await admin.graphql(
      `#graphql
      query ProductsWithVariantCount($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              variantsCount { count }
              variants(first: 100) {
                pageInfo { hasNextPage }
                edges { node { id title createdAt } }
              }
            }
          }
        }
      }`,
      { variables: { cursor } }
    );
    const json = await resp.json();
    const conn = json.data?.products;
    if (!conn) break;

    for (const edge of conn.edges) {
      scannedProducts++;
      const product = edge.node;
      const totalVariants = product.variantsCount?.count ?? product.variants.edges.length;

      // If the product has more than the first page of variants, fetch them all.
      let variantNodes;
      if (product.variants.pageInfo.hasNextPage) {
        variantNodes = await fetchAllVariants(admin, product.id);
      } else {
        variantNodes = product.variants.edges.map((e) => e.node);
      }

      const stale = variantNodes.filter(
        (v) =>
          typeof v.title === "string" &&
          v.title.startsWith(CUSTOM_VARIANT_PREFIX) &&
          new Date(v.createdAt).getTime() < cutoff
      );
      if (!stale.length) continue;

      // Never delete the product's last remaining variant.
      let toDelete = stale;
      if (stale.length >= totalVariants) {
        toDelete = stale.slice(0, totalVariants - 1);
      }
      if (!toDelete.length) continue;

      const { deletedGids } = await bulkDeleteForProduct(
        admin,
        product.id,
        toDelete.map((v) => v.id)
      );
      if (deletedGids.length) {
        deletedCount += deletedGids.length;
        // Keep our tracking table consistent for any rows we happened to know about.
        await prisma.customVariant.updateMany({
          where: { variantGid: { in: deletedGids }, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }
    }

    hasNext = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return { scannedProducts, deletedCount };
}
