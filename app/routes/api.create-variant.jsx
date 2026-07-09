import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { ensureDefaultTitleAnchor, syncBasePrice } from "../lib/variant-cleanup.server";

/**
 * API endpoint for creating dynamic product variants with custom prices.
 * Called from the storefront calculator when a customer clicks "Add to Cart".
 *
 * Flow:
 * 1. Create variant with calculated price (Admin API)
 * 2. Poll until price propagates to Storefront API
 * 3. Return variant ID only when price is confirmed
 * 4. Frontend then adds to cart - price shows correctly!
 */

const VARIANT_INITIAL_STOCK = 10;
const primaryLocationCache = new Map();

async function getPrimaryLocationId(admin, shop) {
  if (primaryLocationCache.has(shop)) return primaryLocationCache.get(shop);
  try {
    const resp = await admin.graphql(
      `#graphql
      query PrimaryLocation {
        locations(first: 1) {
          edges { node { id } }
        }
      }`
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

// Handle CORS preflight requests
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
  });
};

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { shop, productId, price, configHash, configSummary } = body;

    // Validate required fields
    if (!shop || !productId || !price) {
      return new Response(JSON.stringify({
        error: "Missing required fields: shop, productId, price"
      }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Validate price is a positive number
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return new Response(JSON.stringify({ error: "Invalid price" }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Get the admin context for this shop
    const { admin } = await unauthenticated.admin(shop);

    // Build a unique-but-readable option value for this variant. The readable summary
    // (e.g. "Rectangle - 10\" x 10\" x 4\"") becomes the variant title shown in the cart,
    // checkout and on the order; a short suffix keeps it unique per product as Shopify
    // requires. Falls back to the legacy "Custom-..." format if no summary was sent.
    const timestamp = Date.now();
    const shortHash = configHash ? configHash.substring(0, 8) : timestamp.toString(36);
    const uniqueSuffix = `${shortHash}${timestamp.toString(36)}`;
    const summary = typeof configSummary === "string" ? configSummary.trim() : "";
    const optionValue = summary
      ? `${summary} (${uniqueSuffix})`
      : `Custom-${uniqueSuffix}`;

    // Variants are created on the real product the customer is viewing, so the correct
    // product name shows everywhere. Accumulation is prevented by auto-delete (orders/create
    // webhook + the scheduled cleanup sweep), not by hiding them on a separate product.
    const productGid = productId.includes("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

    // Capture the product's real base price BEFORE creating the custom variant, while its "Default
    // Title" variant still holds the merchant-set price. Persisted to the custom.cushion_base_price
    // metafield so the anchor can be recreated at the right price if Shopify later drops the Default
    // Title. Best-effort — never block add-to-cart.
    try {
      const baseResp = await admin.graphql(
        `#graphql
        query BaseDefaultTitle($id: ID!) {
          product(id: $id) {
            variants(first: 100) { edges { node { title price } } }
          }
        }`,
        { variables: { id: productGid } }
      );
      const baseJson = await baseResp.json();
      const defaultTitle = baseJson.data?.product?.variants?.edges
        ?.map((e) => e.node)
        .find((v) => v.title === "Default Title");
      if (defaultTitle) await syncBasePrice(admin, productGid, defaultTitle.price);
    } catch (baseErr) {
      console.error("Failed to capture base price:", baseErr.message);
    }

    // Step 1: Create the variant with the calculated price
    console.log(`Creating variant with price $${parsedPrice}...`);

    const locationId = await getPrimaryLocationId(admin, shop);
    const inventoryQuantities = locationId
      ? [{ availableQuantity: VARIANT_INITIAL_STOCK, locationId }]
      : [];

    const response = await admin.graphql(
      `#graphql
      mutation CreateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          productVariants {
            id
            title
            price
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          productId: productGid,
          variants: [
            {
              price: parsedPrice.toFixed(2),
              optionValues: [
                {
                  name: optionValue,
                  optionName: "Title",
                },
              ],
              inventoryPolicy: "CONTINUE",
              inventoryQuantities,
            },
          ],
        },
      }
    );

    const result = await response.json();

    if (result.data?.productVariantsBulkCreate?.userErrors?.length > 0) {
      const errors = result.data.productVariantsBulkCreate.userErrors;
      console.error("Variant creation errors:", errors);

      const optionError = errors.find(e =>
        e.message?.includes("option") || e.field?.includes("optionValues")
      );

      if (optionError) {
        return new Response(JSON.stringify({
          error: "Product configuration issue. Please contact support.",
          details: errors[0].message
        }), {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        error: errors[0].message || "Failed to create variant"
      }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const createdVariant = result.data?.productVariantsBulkCreate?.productVariants?.[0];

    if (!createdVariant) {
      return new Response(JSON.stringify({ error: "Failed to create variant" }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const variantGid = createdVariant.id;
    const numericId = variantGid.replace("gid://shopify/ProductVariant/", "");

    // Track the created variant so it can be auto-deleted after the order is placed
    // or swept once abandoned. Best-effort: never block the add-to-cart on a DB hiccup.
    try {
      await prisma.customVariant.create({
        data: { shop, variantGid, productGid },
      });
    } catch (trackErr) {
      console.error("Failed to track custom variant:", trackErr.message);
    }

    // Creating a custom variant can drop the product's implicit "Default Title" variant, leaving the
    // catalog price as the customer's config price until the cron repairs it. Re-assert the "Default
    // Title" now (at the product's captured base price) so the product always shows its base price.
    // Best-effort (never throws).
    await ensureDefaultTitleAnchor(admin, shop, productGid);

    console.log(`Variant ${numericId} created. Waiting for price propagation...`);

    // Step 2: Poll Admin API to verify variant is fully created with correct price
    // We use Admin API since Storefront API has inconsistent endpoints across stores
    const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max
    const pollInterval = 2000; // 2 seconds
    let priceVerified = false;
    let attempts = 0;

    while (!priceVerified && attempts < maxAttempts) {
      attempts++;

      try {
        // Re-fetch the variant from Admin API to verify price is set
        const verifyResponse = await admin.graphql(
          `#graphql
          query GetVariant($id: ID!) {
            productVariant(id: $id) {
              id
              price
            }
          }`,
          {
            variables: { id: variantGid }
          }
        );

        const verifyResult = await verifyResponse.json();
        const verifiedPrice = parseFloat(verifyResult.data?.productVariant?.price || 0);

        console.log(`Poll ${attempts}: Admin API price = $${verifiedPrice}, Expected = $${parsedPrice}`);

        // Check if prices match (within 1 cent tolerance)
        if (Math.abs(verifiedPrice - parsedPrice) < 0.01) {
          priceVerified = true;
          console.log(`Price verified in Admin API after ${attempts} attempts!`);

          // Add longer buffer for Storefront API propagation (increased from 1s to 3s)
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      } catch (pollError) {
        console.log(`Poll ${attempts}: Error - ${pollError.message}`);
      }

      // Wait before next poll
      if (!priceVerified && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    if (!priceVerified) {
      console.log(`Price not verified after ${attempts} attempts, but returning variant anyway`);
    }

    return new Response(JSON.stringify({
      success: true,
      variantId: numericId,
      variantGid: variantGid,
      price: parsedPrice.toFixed(2),
      title: createdVariant.title,
      priceVerified: priceVerified,
      pollAttempts: attempts,
    }), {
      status: 200,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating variant:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
};

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
