import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";

/**
 * API endpoint for creating product variants for fabric/fill sample orders.
 * Called from the storefront Fabric & Fill Shop block when customer clicks "Add to Cart".
 *
 * POST body: { shop, price, selectedItems: [string], itemCount: number }
 *
 * Flow:
 * 1. Look up fabricSampleProductId from CalculatorSettings
 * 2. Create variant with calculated bundle price (Admin API)
 * 3. Poll until price propagates
 * 4. Return variant ID for storefront cart add
 */

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
    const { shop, price, selectedItems, itemCount } = body;

    if (!shop || !price) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: shop, price" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return new Response(JSON.stringify({ error: "Invalid price" }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Look up the configured sample product ID
    const settings = await prisma.calculatorSettings.findUnique({ where: { shop } });
    if (!settings?.fabricSampleProductId) {
      return new Response(
        JSON.stringify({
          error:
            "Fabric sample product not configured. Please set the Fabric Sample Product ID in the app settings.",
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const { admin } = await unauthenticated.admin(shop);

    const timestamp = Date.now();
    const optionValue = `Sample-${timestamp.toString(36)}`;

    const productGid = settings.fabricSampleProductId.includes("gid://")
      ? settings.fabricSampleProductId
      : `gid://shopify/Product/${settings.fabricSampleProductId}`;

    console.log(`[SampleVariant] Creating variant at $${parsedPrice} for ${itemCount} items...`);

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
              optionValues: [{ name: optionValue, optionName: "Title" }],
              inventoryPolicy: "CONTINUE",
              inventoryItem: { tracked: false },
              inventoryQuantities: [],
            },
          ],
        },
      }
    );

    const result = await response.json();

    if (result.data?.productVariantsBulkCreate?.userErrors?.length > 0) {
      const errors = result.data.productVariantsBulkCreate.userErrors;
      console.error("[SampleVariant] Variant creation errors:", errors);
      return new Response(
        JSON.stringify({ error: errors[0].message || "Failed to create variant" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const createdVariant =
      result.data?.productVariantsBulkCreate?.productVariants?.[0];
    if (!createdVariant) {
      return new Response(JSON.stringify({ error: "Failed to create variant" }), {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const variantGid = createdVariant.id;
    const numericId = variantGid.replace("gid://shopify/ProductVariant/", "");

    console.log(`[SampleVariant] Variant ${numericId} created. Waiting for price propagation...`);

    // Poll Admin API to verify price propagation (same pattern as create-variant)
    const maxAttempts = 15;
    const pollInterval = 2000;
    let priceVerified = false;
    let attempts = 0;

    while (!priceVerified && attempts < maxAttempts) {
      attempts++;
      try {
        const verifyResponse = await admin.graphql(
          `#graphql
          query GetVariant($id: ID!) {
            productVariant(id: $id) { id price }
          }`,
          { variables: { id: variantGid } }
        );
        const verifyResult = await verifyResponse.json();
        const verifiedPrice = parseFloat(
          verifyResult.data?.productVariant?.price || 0
        );
        if (Math.abs(verifiedPrice - parsedPrice) < 0.01) {
          priceVerified = true;
          await new Promise((resolve) => setTimeout(resolve, 3000));
          break;
        }
      } catch (pollError) {
        console.log(`[SampleVariant] Poll ${attempts} error: ${pollError.message}`);
      }
      if (!priceVerified && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        variantId: numericId,
        price: parsedPrice.toFixed(2),
        priceVerified,
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SampleVariant] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
};

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
