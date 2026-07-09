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

// Default retention for abandoned custom variants. They're kept this long so a shopper who returns
// to an abandoned cart days later still finds their configured variant intact; only variants older
// than this are swept. Purchased variants are deleted instantly by the orders/create webhook.
export const RETENTION_WINDOW_MS = 90 * DAY_MS;

// Variant titles created by the calculator start with this prefix (see api.create-variant.jsx).
export const CUSTOM_VARIANT_PREFIX = "Custom-";

// Stock for a freshly created "Default Title" anchor variant. Stocked high (with the CONTINUE
// policy below) so the catalog anchor never shows sold out. Purchasable custom variants are
// stocked separately in api.create-variant.jsx.
const ANCHOR_STOCK = 1000;

// Last-resort base price for a "Default Title" anchor when a product's real base price can't be
// resolved (no live Default Title price and no stored base-price metafield). Only used to avoid
// creating a $0 variant; the real base price comes from resolveBasePrice() below.
const FALLBACK_ANCHOR_PRICE = 59;

// Product metafield that stores the merchant's real base price, captured from the Default Title
// variant while it's intact (see api.create-variant.jsx). Used to recreate the anchor at the right
// price when Shopify drops the implicit Default Title during custom-variant creation.
const BASE_PRICE_NAMESPACE = "custom";
const BASE_PRICE_KEY = "cushion_base_price";
// Alias so a products query can fetch both the calc-profile marker and the stored base price at once.
const BASE_PRICE_METAFIELD = `basePrice: metafield(namespace: "${BASE_PRICE_NAMESPACE}", key: "${BASE_PRICE_KEY}") { value }`;

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

const REORDER_MUTATION = `#graphql
  mutation ReorderVariants($productId: ID!, $positions: [ProductVariantPositionInput!]!) {
    productVariantsBulkReorder(productId: $productId, positions: $positions) {
      userErrors { field message }
    }
  }`;

const BASE_PRICE_SET_MUTATION = `#graphql
  mutation SetBasePrice($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { field message }
    }
  }`;

const BASE_PRICE_READ_QUERY = `#graphql
  query BasePrice($id: ID!) {
    product(id: $id) {
      metafield(namespace: "${BASE_PRICE_NAMESPACE}", key: "${BASE_PRICE_KEY}") { value }
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

/** Parse a price-like value into a positive finite number, or null if it isn't one. */
function toValidPrice(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Read a product's stored base price from the custom.cushion_base_price metafield. Returns a positive
 * number, or null if unset/invalid. Best-effort; never throws.
 */
async function readBasePrice(admin, productGid) {
  try {
    const resp = await admin.graphql(BASE_PRICE_READ_QUERY, { variables: { id: productGid } });
    const json = await resp.json();
    return toValidPrice(json.data?.product?.metafield?.value);
  } catch (err) {
    console.error(`readBasePrice failed for ${productGid}:`, err.message);
    return null;
  }
}

/**
 * Persist a product's real base price to the custom.cushion_base_price metafield so the anchor can be
 * recreated at the right price after Shopify drops the implicit Default Title. Only writes a positive
 * price. Best-effort; never throws.
 */
export async function syncBasePrice(admin, productGid, price) {
  const valid = toValidPrice(price);
  if (valid == null) return;
  try {
    const resp = await admin.graphql(BASE_PRICE_SET_MUTATION, {
      variables: {
        metafields: [
          {
            ownerId: productGid,
            namespace: BASE_PRICE_NAMESPACE,
            key: BASE_PRICE_KEY,
            type: "number_decimal",
            value: valid.toFixed(2),
          },
        ],
      },
    });
    const json = await resp.json();
    const errors = json.data?.metafieldsSet?.userErrors || [];
    if (errors.length) {
      console.error(`syncBasePrice failed for ${productGid}: ${errors.map((e) => e.message).join("; ")}`);
    }
  } catch (err) {
    console.error(`syncBasePrice request failed for ${productGid}:`, err.message);
  }
}

/**
 * Move a single variant to position 1 (the product's representative variant). Shopify positions
 * are 1-indexed; setting one variant to position 1 shifts the rest down. Used to keep the "Default
 * Title" anchor as the product's first/featured variant so the catalog shows the $59 base price
 * (and the right entry feeds Google Merchant Center) instead of whichever custom config landed in
 * slot 1. Best-effort; never throws. Returns true on success.
 */
async function moveVariantToFront(admin, productGid, variantId) {
  try {
    const resp = await admin.graphql(REORDER_MUTATION, {
      variables: {
        productId: productGid,
        positions: [{ id: variantId, position: 1 }],
      },
    });
    const json = await resp.json();
    const errors = json.data?.productVariantsBulkReorder?.userErrors || [];
    if (errors.length) {
      console.error(`Variant reorder failed for ${productGid}: ${errors.map((e) => e.message).join("; ")}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Variant reorder request failed for ${productGid}:`, err.message);
    return false;
  }
}

/**
 * Create a clean "Default Title" anchor variant so a product can keep a sensible single
 * listing after all custom variants are deleted (Shopify requires ≥1 variant per product).
 * Newly created variants are appended last, so the anchor is immediately moved to position 1 to
 * stay the product's representative variant. Returns the new variant's gid on success, else null.
 */
async function createDefaultAnchor(admin, shop, productGid, price) {
  const locationId = await getPrimaryLocationId(admin, shop);
  const inventoryQuantities = locationId
    ? [{ availableQuantity: ANCHOR_STOCK, locationId }]
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
      return null;
    }
    const created = json.data?.productVariantsBulkCreate?.productVariants?.[0];
    if (!created) return null;
    // Anchor is appended at the end on create; pull it to the front so it's the representative variant.
    await moveVariantToFront(admin, productGid, created.id);
    return created.id;
  } catch (err) {
    console.error(`Anchor create request failed for ${productGid}:`, err.message);
    return null;
  }
}

/**
 * Ensure a calculator product keeps its "Default Title" variant at the product's real base price,
 * sitting at position 1. Creating a custom variant on a single-variant product can drop the implicit
 * "Default Title" and leave the customer's custom config as the product's first/representative variant
 * (which drives the catalog price and the Google Merchant Center entry). Callers (e.g.
 * api.create-variant.jsx) invoke this right after an Add-to-Cart to restore the anchor to slot 1
 * immediately, instead of waiting for the cron.
 *
 * The existing Default Title's price is never overwritten — it IS the merchant's base price, so it's
 * synced into the base-price metafield instead. Only a missing Default Title is recreated, at the
 * stored base price (falling back to FALLBACK_ANCHOR_PRICE if none is known). Best-effort; never throws.
 * Returns true if a Default Title exists (or was created) at the front afterward.
 */
export async function ensureDefaultTitleAnchor(admin, shop, productGid) {
  try {
    const resp = await admin.graphql(
      `#graphql
      query DefaultTitleCheck($id: ID!) {
        product(id: $id) {
          variants(first: 100) { edges { node { id title price } } }
        }
      }`,
      { variables: { id: productGid } }
    );
    const json = await resp.json();
    // Variants come back in position order, so nodes[0] is the product's representative variant.
    const nodes = json.data?.product?.variants?.edges?.map((e) => e.node) || [];
    const existing = nodes.find((v) => v.title === "Default Title");
    if (existing) {
      // Present — keep its price as the base of truth and make sure it's the first variant
      // (a custom config may have taken slot 1).
      await syncBasePrice(admin, productGid, existing.price);
      if (nodes[0]?.id !== existing.id) {
        await moveVariantToFront(admin, productGid, existing.id);
      }
      return true;
    }
    // No Default Title — recreate one at the stored base price; createDefaultAnchor moves it to front.
    const basePrice = (await readBasePrice(admin, productGid)) ?? FALLBACK_ANCHOR_PRICE;
    return Boolean(await createDefaultAnchor(admin, shop, productGid, basePrice));
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
 * consumed by an order (abandoned carts). Defaults to a 90-day retention window so returning
 * shoppers keep their carts; younger variants are left untouched.
 *
 * @returns number of variants deleted
 */
export async function sweepAbandonedVariants(admin, shop, { olderThanMs = RETENTION_WINDOW_MS } = {}) {
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
 * metafield): delete custom cushion variants older than the cutoff, and guarantee the product keeps a
 * "Default Title" variant at its own real base price sitting at position 1. A variant is "custom" if
 * its title starts with `Custom-`, its gid is tracked in the CustomVariant table, or its title carries
 * the calculator's config signature. Non-calculator products are left untouched.
 *
 * The Default Title's price is never overwritten — it IS the merchant's base price, so it's synced into
 * the base-price metafield instead. Only a missing Default Title is recreated, at the stored base price.
 *
 * Custom variants are removed once older than the retention window (default 90 days), so younger
 * abandoned-cart variants survive; the base-price sync / position guard runs regardless of age.
 *
 * @returns { scannedProducts, deletedCount, anchorsCreated, basePricesSynced, reorderedToFront }
 */
export async function cleanupExistingCustomVariants(admin, shop, { olderThanMs = RETENTION_WINDOW_MS } = {}) {
  const cutoff = Date.now() - olderThanMs;
  let scannedProducts = 0;
  let deletedCount = 0;
  let anchorsCreated = 0;
  let basePricesSynced = 0;
  let reorderedToFront = 0;

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
              ${BASE_PRICE_METAFIELD}
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
      // Calculator products carry this metafield; the base-price guard applies only to them. Custom-
      // variant cleanup below still runs for any product with customs (e.g. the Fabric Samples product).
      const isCalcProduct = Boolean(product.metafield);
      if (!isCalcProduct && !customs.length) continue; // nothing to guard, nothing to clean

      const hasKeeper = variantNodes.length > customs.length; // a non-custom variant exists
      const defaultTitles = variantNodes.filter((v) => v.title === "Default Title");
      const storedBasePrice = toValidPrice(product.basePrice?.value);

      // Custom variants old enough to remove (younger ones may still be in a live cart).
      const toDelete = customs.filter((v) => new Date(v.createdAt).getTime() < cutoff);

      if (isCalcProduct) {
        // The "Default Title" variant is the product's own base/catalog price — NEVER overwrite it.
        // Keep the base-price metafield in sync from its live price so the anchor can be recreated at
        // the right price if Shopify later drops it, and keep it as the representative (position-1)
        // variant.
        if (defaultTitles.length) {
          const anchor = defaultTitles[0];
          const livePrice = toValidPrice(anchor.price);
          if (livePrice != null && livePrice !== storedBasePrice) {
            await syncBasePrice(admin, product.id, livePrice);
            basePricesSynced++;
          }
          // If a custom config has drifted into slot 1 (variantNodes come back in position order),
          // pull the anchor to front.
          if (variantNodes[0] && variantNodes[0].id !== anchor.id) {
            if (await moveVariantToFront(admin, product.id, anchor.id)) reorderedToFront++;
          }
        } else if (!hasKeeper) {
          // No Default Title and no other real variant — recreate one at the stored base price
          // (Shopify requires >= 1 variant per product).
          const anchorPrice = storedBasePrice ?? FALLBACK_ANCHOR_PRICE;
          const ok = await createDefaultAnchor(admin, shop, product.id, anchorPrice);
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

  return { scannedProducts, deletedCount, anchorsCreated, basePricesSynced, reorderedToFront };
}

/**
 * Read-only diagnostic: scan every product and report the state of each calculator product's
 * "Default Title" (its real catalog price) and stored base price. Performs NO mutations — used by
 * api.variant-report.jsx to inspect what the guard would do before any writes.
 *
 * @returns { scannedProducts, calculatorProducts, report: [{ productId, title, totalVariants,
 *            customCount, oldCustomCount, hasDefaultTitle, defaultTitlePrice, basePrice, plannedAction }] }
 */
export async function scanCalculatorProducts(admin, shop, { olderThanMs = RETENTION_WINDOW_MS } = {}) {
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
              ${BASE_PRICE_METAFIELD}
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
      const basePrice = toValidPrice(product.basePrice?.value);

      let plannedAction;
      if (defaultTitle) {
        // The Default Title price is kept as-is; if it differs from the stored base price we'd resync.
        plannedAction =
          toValidPrice(defaultTitlePrice) !== basePrice ? "resync-base-price" : "keep-price";
      } else if (nonCustoms.length === 0) {
        plannedAction = "recreate-at-base";
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
        basePrice,
        plannedAction,
      });
    }

    hasNext = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return { scannedProducts, calculatorProducts: report.length, report };
}
