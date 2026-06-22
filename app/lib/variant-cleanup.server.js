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

// Stock to give a freshly created "Default Title" anchor variant (mirrors api.create-variant.jsx).
const VARIANT_INITIAL_STOCK = 10;

// Fixed base price for the "actual product" — its "Default Title" variant. The guard pins every
// calculator product's Default Title at this price so it never inherits a cheap custom-config price.
const ANCHOR_PRICE = 59;

const primaryLocationCache = new Map();

const BULK_DELETE_MUTATION = `#graphql
  mutation BulkDeleteVariants($productId: ID!, $variantsIds: [ID!]!) {
    productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
      userErrors { field message }
    }
  }`;

const CREATE_ANCHOR_MUTATION = `#graphql
  mutation CreateAnchor($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants { id }
      userErrors { field message }
    }
  }`;

const PRICE_UPDATE_MUTATION = `#graphql
  mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price }
      userErrors { field message }
    }
  }`;

// Metafield that marks a product as a calculator product (set by the app on install/config).
// Used to scope the $59 price guard so only calculator products are affected.
const CALC_METAFIELD = `metafield(namespace: "custom", key: "cushion_calculator_profile_id") { id }`;

// A variant is a disposable custom one if its title uses the legacy prefix, it's tracked in the DB,
// or its title carries the calculator's config signature (catches readable-titled variants whose
// best-effort DB tracking insert failed). Real catalog variants ("Default Title") never match.
const looksLikeConfig = (t) =>
  typeof t === "string" &&
  /inches/i.test(t) &&
  /(length|width|thickness)\s*:/i.test(t);

function buildIsCustom(trackedSet) {
  return (v) =>
    (typeof v.title === "string" && v.title.startsWith(CUSTOM_VARIANT_PREFIX)) ||
    trackedSet.has(v.id) ||
    looksLikeConfig(v.title);
}

async function getPrimaryLocationId(admin, shop) {
  if (primaryLocationCache.has(shop)) return primaryLocationCache.get(shop);
  try {
    const resp = await admin.graphql(
      `#graphql
      query PrimaryLocation { locations(first: 1) { edges { node { id } } } }`
    );
    const json = await resp.json();
    const locationId = json.data?.locations?.edges?.[0]?.node?.id || null;
    if (locationId) primaryLocationCache.set(shop, locationId);
    return locationId;
  } catch (err) {
    console.error("Failed to fetch primary location:", err.message);
    return null;
  }
}

/**
 * Create a clean "Default Title" anchor variant so a product can keep a sensible single
 * listing after all custom variants are deleted (Shopify requires ≥1 variant per product).
 * Returns true on success.
 */
async function createDefaultAnchor(admin, shop, productGid, price) {
  const locationId = await getPrimaryLocationId(admin, shop);
  const inventoryQuantities = locationId
    ? [{ availableQuantity: VARIANT_INITIAL_STOCK, locationId }]
    : [];
  try {
    const resp = await admin.graphql(CREATE_ANCHOR_MUTATION, {
      variables: {
        productId: productGid,
        variants: [
          {
            price: price.toFixed(2),
            optionValues: [{ name: "Default Title", optionName: "Title" }],
            inventoryPolicy: "CONTINUE",
            inventoryQuantities,
          },
        ],
      },
    });
    const json = await resp.json();
    const errors = json.data?.productVariantsBulkCreate?.userErrors || [];
    if (errors.length) {
      console.error(`Anchor create failed for ${productGid}: ${errors.map((e) => e.message).join("; ")}`);
      return false;
    }
    return Boolean(json.data?.productVariantsBulkCreate?.productVariants?.[0]);
  } catch (err) {
    console.error(`Anchor create request failed for ${productGid}:`, err.message);
    return false;
  }
}

/**
 * Force the given variant ids on a product to a fixed price. Used to keep each calculator
 * product's "Default Title" variant (its real catalog price) pinned at ANCHOR_PRICE.
 * Returns the number of variants successfully updated.
 */
async function setVariantPrices(admin, productGid, variantIds, price) {
  if (!variantIds.length) return 0;
  try {
    const resp = await admin.graphql(PRICE_UPDATE_MUTATION, {
      variables: {
        productId: productGid,
        variants: variantIds.map((id) => ({ id, price: price.toFixed(2) })),
      },
    });
    const json = await resp.json();
    const errors = json.data?.productVariantsBulkUpdate?.userErrors || [];
    if (errors.length) {
      console.error(`Price update failed for ${productGid}: ${errors.map((e) => e.message).join("; ")}`);
      return 0;
    }
    return json.data?.productVariantsBulkUpdate?.productVariants?.length || 0;
  } catch (err) {
    console.error(`Price update request failed for ${productGid}:`, err.message);
    return 0;
  }
}

/**
 * Ensure a calculator product has a "Default Title" variant pinned at ANCHOR_PRICE ($59).
 * Creating a custom variant on a single-variant product can drop the implicit "Default Title",
 * so callers (e.g. api.create-variant.jsx) invoke this right after an Add-to-Cart to re-assert the
 * base price immediately instead of waiting for the hourly cron. Best-effort; never throws.
 * Returns true if a Default Title exists (or was created) afterward.
 */
export async function ensureDefaultTitleAnchor(admin, shop, productGid) {
  try {
    const resp = await admin.graphql(
      `#graphql
      query DefaultTitleCheck($id: ID!) {
        product(id: $id) {
          variants(first: 100) { edges { node { id title } } }
        }
      }`,
      { variables: { id: productGid } }
    );
    const json = await resp.json();
    const nodes = json.data?.product?.variants?.edges?.map((e) => e.node) || [];
    if (nodes.some((v) => v.title === "Default Title")) return true; // already present
    return await createDefaultAnchor(admin, shop, productGid, ANCHOR_PRICE);
  } catch (err) {
    console.error(`ensureDefaultTitleAnchor failed for ${productGid}:`, err.message);
    return false;
  }
}

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
            edges { node { id title createdAt price } }
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
 * Comprehensive cleanup for calculator products (identified by the cushion_calculator_profile_id
 * metafield): delete custom cushion variants older than the cutoff, and guarantee the product's
 * "Default Title" variant (its real catalog price) is pinned at ANCHOR_PRICE ($59) — overwriting a
 * drifted price, or creating a Default Title anchor if the product was left with none. A variant is
 * "custom" if its title starts with `Custom-`, its gid is tracked in the CustomVariant table, or its
 * title carries the calculator's config signature. Non-calculator products are left untouched.
 *
 * @returns { scannedProducts, deletedCount, anchorsCreated, pricesGuarded }
 */
export async function cleanupExistingCustomVariants(admin, shop, { olderThanMs = DAY_MS } = {}) {
  const cutoff = Date.now() - olderThanMs;
  let scannedProducts = 0;
  let deletedCount = 0;
  let anchorsCreated = 0;
  let pricesGuarded = 0;

  // Tracked custom variant gids for this shop (so we also catch readable-titled variants).
  let trackedSet = new Set();
  if (shop) {
    const tracked = await prisma.customVariant.findMany({
      where: { shop, deletedAt: null },
      select: { variantGid: true },
    });
    trackedSet = new Set(tracked.map((t) => t.variantGid));
  }

  const isCustom = buildIsCustom(trackedSet);

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
              ${CALC_METAFIELD}
              variants(first: 100) {
                pageInfo { hasNextPage }
                edges { node { id title createdAt price } }
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

      // If the product has more than the first page of variants, fetch them all.
      let variantNodes;
      if (product.variants.pageInfo.hasNextPage) {
        variantNodes = await fetchAllVariants(admin, product.id);
      } else {
        variantNodes = product.variants.edges.map((e) => e.node);
      }

      const customs = variantNodes.filter((v) => isCustom(v));
      // Calculator products carry this metafield; the $59 price guard applies only to them. Custom-
      // variant cleanup below still runs for any product with customs (e.g. the Fabric Samples product).
      const isCalcProduct = Boolean(product.metafield);
      if (!isCalcProduct && !customs.length) continue; // nothing to guard, nothing to clean

      const hasKeeper = variantNodes.length > customs.length; // a non-custom variant exists
      const defaultTitles = variantNodes.filter((v) => v.title === "Default Title");

      // Custom variants old enough to remove (younger ones may still be in a live cart).
      const toDelete = customs.filter((v) => new Date(v.createdAt).getTime() < cutoff);

      if (isCalcProduct) {
        // Guard the actual product price: a calculator product's "Default Title" variant is its real
        // catalog price, so pin it at ANCHOR_PRICE ($59) — overwrite any that drifted, or create one
        // if the product was left with no real variant (Shopify requires >= 1 variant per product).
        if (defaultTitles.length) {
          const mispriced = defaultTitles
            .filter((v) => parseFloat(v.price) !== ANCHOR_PRICE)
            .map((v) => v.id);
          if (mispriced.length) {
            pricesGuarded += await setVariantPrices(admin, product.id, mispriced, ANCHOR_PRICE);
          }
        } else if (!hasKeeper) {
          const ok = await createDefaultAnchor(admin, shop, product.id, ANCHOR_PRICE);
          if (ok) anchorsCreated++;
          else if (toDelete.length) toDelete.pop(); // anchor failed → keep one variant
        }
        // else: real (non-custom) variants but no "Default Title" — leave pricing alone.
      } else if (!hasKeeper) {
        // Non-calculator product (e.g. Fabric Samples) reduced to only custom variants: keep it from
        // being orphaned with a Default Title anchor at its lowest current price (legacy behavior).
        const prices = variantNodes
          .map((v) => parseFloat(v.price))
          .filter((p) => Number.isFinite(p) && p > 0);
        const anchorPrice = prices.length ? Math.min(...prices) : null;
        if (anchorPrice == null) {
          if (toDelete.length) toDelete.pop();
        } else {
          const ok = await createDefaultAnchor(admin, shop, product.id, anchorPrice);
          if (ok) anchorsCreated++;
          else if (toDelete.length) toDelete.pop();
        }
      }

      if (!toDelete.length) continue;

      const { deletedGids } = await bulkDeleteForProduct(
        admin,
        product.id,
        toDelete.map((v) => v.id)
      );
      if (deletedGids.length) {
        deletedCount += deletedGids.length;
        await prisma.customVariant.updateMany({
          where: { variantGid: { in: deletedGids }, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }
    }

    hasNext = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return { scannedProducts, deletedCount, anchorsCreated, pricesGuarded };
}

/**
 * Read-only diagnostic: scan every product and report the state of each calculator product's
 * "Default Title" (its real catalog price). Performs NO mutations — used by api.variant-report.jsx
 * to inspect what the guard would do before any writes.
 *
 * @returns { scannedProducts, calculatorProducts, report: [{ productId, title, totalVariants,
 *            customCount, oldCustomCount, hasDefaultTitle, defaultTitlePrice, plannedAction }] }
 */
export async function scanCalculatorProducts(admin, shop, { olderThanMs = DAY_MS } = {}) {
  const cutoff = Date.now() - olderThanMs;

  let trackedSet = new Set();
  if (shop) {
    const tracked = await prisma.customVariant.findMany({
      where: { shop, deletedAt: null },
      select: { variantGid: true },
    });
    trackedSet = new Set(tracked.map((t) => t.variantGid));
  }
  const isCustom = buildIsCustom(trackedSet);

  let scannedProducts = 0;
  const report = [];
  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const resp = await admin.graphql(
      `#graphql
      query ScanProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              ${CALC_METAFIELD}
              variants(first: 100) {
                pageInfo { hasNextPage }
                edges { node { id title createdAt price } }
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
      if (!product.metafield) continue; // not a calculator product

      let variantNodes;
      if (product.variants.pageInfo.hasNextPage) {
        variantNodes = await fetchAllVariants(admin, product.id);
      } else {
        variantNodes = product.variants.edges.map((e) => e.node);
      }

      const customs = variantNodes.filter((v) => isCustom(v));
      const oldCustomCount = customs.filter((v) => new Date(v.createdAt).getTime() < cutoff).length;
      const nonCustoms = variantNodes.filter((v) => !isCustom(v));
      const defaultTitle = variantNodes.find((v) => v.title === "Default Title");
      const defaultTitlePrice = defaultTitle ? parseFloat(defaultTitle.price) : null;

      let plannedAction;
      if (defaultTitle) {
        plannedAction = defaultTitlePrice === ANCHOR_PRICE ? "already-59" : "update-to-59";
      } else if (nonCustoms.length === 0) {
        plannedAction = "create-anchor-59";
      } else {
        plannedAction = "skip-real-options";
      }

      report.push({
        productId: product.id,
        title: product.title,
        totalVariants: variantNodes.length,
        customCount: customs.length,
        oldCustomCount,
        hasDefaultTitle: Boolean(defaultTitle),
        defaultTitlePrice,
        plannedAction,
      });
    }

    hasNext = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return { scannedProducts, calculatorProducts: report.length, report };
}
