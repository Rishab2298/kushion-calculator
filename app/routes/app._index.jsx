import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Get counts for all configuration items
    const [shapesCount, fillTypesCount, fabricsCount, pipingCount, buttonStyleCount, antiSkidCount, tiesCount, priceTiersCount, profilesCount] = await Promise.all([
      prisma.shape?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.fillType?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.fabric?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.pipingOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.buttonStyleOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.antiSkidOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.tiesOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.priceTier?.count({ where: { shop } }) ?? 0,
      prisma.calculatorProfile?.count({ where: { shop, isActive: true } }) ?? 0,
    ]);

    return {
      shop,
      counts: {
        shapes: shapesCount || 0,
        fillTypes: fillTypesCount || 0,
        fabrics: fabricsCount || 0,
        piping: pipingCount || 0,
        buttonStyle: buttonStyleCount || 0,
        antiSkid: antiSkidCount || 0,
        ties: tiesCount || 0,
        priceTiers: priceTiersCount || 0,
        profiles: profilesCount || 0,
      },
    };
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return {
      shop,
      counts: {
        shapes: 0,
        fillTypes: 0,
        fabrics: 0,
        piping: 0,
        buttonStyle: 0,
        antiSkid: 0,
        ties: 0,
        priceTiers: 0,
        profiles: 0,
      },
    };
  }
};

export default function Index() {
  const { counts } = useLoaderData();

  const isConfigured = (count) => count > 0;

  return (
    <s-page heading="Cushion Calculator" fullWidth>
      <s-button slot="primary-action" href="/app/shapes">
        Get Started
      </s-button>

      <s-section heading="Welcome">
        <s-paragraph>
          Create a fully customizable cushion price calculator for your store.
          Customers can select shapes, dimensions, fabrics, fill types, and more
          to get instant pricing.
        </s-paragraph>
      </s-section>

      <s-section heading="Configuration Status">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.shapes) ? "success" : "critical"}>
                {isConfigured(counts.shapes) ? "✓" : "○"}
              </s-text>
              <s-text>
                Shapes: {counts.shapes} configured
              </s-text>
              <s-link href="/app/shapes">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.fillTypes) ? "success" : "critical"}>
                {isConfigured(counts.fillTypes) ? "✓" : "○"}
              </s-text>
              <s-text>
                Fill Types: {counts.fillTypes} configured
              </s-text>
              <s-link href="/app/fill-types">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.fabrics) ? "success" : "critical"}>
                {isConfigured(counts.fabrics) ? "✓" : "○"}
              </s-text>
              <s-text>
                Fabrics: {counts.fabrics} configured
              </s-text>
              <s-link href="/app/fabrics">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.piping) ? "success" : "subdued"}>
                {isConfigured(counts.piping) ? "✓" : "○"}
              </s-text>
              <s-text>
                Piping Options: {counts.piping} configured
              </s-text>
              <s-link href="/app/piping">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.buttonStyle) ? "success" : "subdued"}>
                {isConfigured(counts.buttonStyle) ? "✓" : "○"}
              </s-text>
              <s-text>
                Button Style: {counts.buttonStyle} configured
              </s-text>
              <s-link href="/app/button-style">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.antiSkid) ? "success" : "subdued"}>
                {isConfigured(counts.antiSkid) ? "✓" : "○"}
              </s-text>
              <s-text>
                Anti-Skid Bottom: {counts.antiSkid} configured
              </s-text>
              <s-link href="/app/anti-skid">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.ties) ? "success" : "subdued"}>
                {isConfigured(counts.ties) ? "✓" : "○"}
              </s-text>
              <s-text>
                Ties: {counts.ties} configured
              </s-text>
              <s-link href="/app/ties">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.profiles) ? "success" : "subdued"}>
                {isConfigured(counts.profiles) ? "✓" : "○"}
              </s-text>
              <s-text>
                Profiles: {counts.profiles} configured
              </s-text>
              <s-link href="/app/profiles">Manage</s-link>
            </s-stack>

            <s-stack direction="inline" gap="tight" align="center">
              <s-text tone={isConfigured(counts.priceTiers) ? "success" : "subdued"}>
                {isConfigured(counts.priceTiers) ? "✓" : "○"}
              </s-text>
              <s-text>
                Price Margins: {counts.priceTiers} tiers configured
              </s-text>
              <s-link href="/app/margins">Manage</s-link>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Quick Setup Guide">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-heading level="4">1. Create Shapes</s-heading>
            <s-paragraph>
              Define cushion shapes (Rectangle, Circle, etc.) with custom formulas
              for surface area and volume calculations. Each shape can have custom
              input fields (Length, Width, Radius, etc.).
            </s-paragraph>

            <s-heading level="4">2. Add Fill Types</s-heading>
            <s-paragraph>
              Create fill options (Polyfill, Memory Foam, etc.) with pricing per
              cubic inch. Customers will select their preferred fill type.
            </s-paragraph>

            <s-heading level="4">3. Configure Fabrics</s-heading>
            <s-paragraph>
              Add fabric categories and individual fabrics with pricing per square
              inch. Upload swatch images for visual selection.
            </s-paragraph>

            <s-heading level="4">4. Add Optional Features</s-heading>
            <s-paragraph>
              Set up piping options and button/tufting styles with fixed prices.
              These are optional add-ons customers can select.
            </s-paragraph>

            <s-heading level="4">5. Add to Theme</s-heading>
            <s-paragraph>
              Go to <s-text fontWeight="semibold">Online Store → Themes → Customize</s-text>.
              On a product page, click <s-text fontWeight="semibold">Add block</s-text> and
              select <s-text fontWeight="semibold">Cushion Calculator</s-text>.
            </s-paragraph>
          </s-stack>
        </s-box>
      </s-section>

      <s-section slot="aside" heading="Calculator Features">
        <s-box padding="base">
          <s-unordered-list>
            <s-list-item>7-step accordion interface</s-list-item>
            <s-list-item>Custom shape builder with formulas</s-list-item>
            <s-list-item>Dynamic dimension inputs</s-list-item>
            <s-list-item>Fabric categories with swatches</s-list-item>
            <s-list-item>Multiple fill type options</s-list-item>
            <s-list-item>Piping and button add-ons</s-list-item>
            <s-list-item>Live price calculations</s-list-item>
            <s-list-item>Price tier adjustments</s-list-item>
            <s-list-item>Add to cart with line item properties</s-list-item>
          </s-unordered-list>
        </s-box>
      </s-section>

      <s-section slot="aside" heading="Pricing Formula">
        <s-box padding="base">
          <s-stack direction="block" gap="tight">
            <s-text fontWeight="semibold">Fabric Cost</s-text>
            <s-text fontSize="small">= Surface Area × $/sq inch</s-text>
            <s-text fontWeight="semibold" style={{ marginTop: 8 }}>Fill Cost</s-text>
            <s-text fontSize="small">= Volume × $/cubic inch</s-text>
            <s-text fontWeight="semibold" style={{ marginTop: 8 }}>Add-ons</s-text>
            <s-text fontSize="small">+ Piping + Button options</s-text>
            <s-text fontWeight="semibold" style={{ marginTop: 8 }}>Final Price</s-text>
            <s-text fontSize="small">= Subtotal × Tier Adjustment</s-text>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
