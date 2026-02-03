import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let settings = await prisma.calculatorSettings.findUnique({
    where: { shop },
  });

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.calculatorSettings.create({
      data: {
        shop,
        shippingPercent: 100,
        labourPercent: 100,
      },
    });
  }

  return { settings };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  const shippingPercent = parseFloat(formData.get("shippingPercent")) || 0;
  const labourPercent = parseFloat(formData.get("labourPercent")) || 0;
  const conversionPercent = parseFloat(formData.get("conversionPercent")) || 0;
  const debugPricing = formData.get("debugPricing") === "true";

  // Margin calculation settings
  const marginCalculationMethod = formData.get("marginCalculationMethod") || "tier";
  const flatMarginThreshold = parseFloat(formData.get("flatMarginThreshold")) || 50;
  const flatMarginPercent = parseFloat(formData.get("flatMarginPercent")) || 100;
  const formulaThreshold = parseFloat(formData.get("formulaThreshold")) || 400;
  const formulaLowConstant = parseFloat(formData.get("formulaLowConstant")) || 300;
  const formulaLowCoefficient = parseFloat(formData.get("formulaLowCoefficient")) || 52;
  const formulaHighConstant = parseFloat(formData.get("formulaHighConstant")) || 120;
  const formulaHighCoefficient = parseFloat(formData.get("formulaHighCoefficient")) || 20;

  await prisma.calculatorSettings.upsert({
    where: { shop },
    update: {
      shippingPercent,
      labourPercent,
      conversionPercent,
      debugPricing,
      marginCalculationMethod,
      flatMarginThreshold,
      flatMarginPercent,
      formulaThreshold,
      formulaLowConstant,
      formulaLowCoefficient,
      formulaHighConstant,
      formulaHighCoefficient,
    },
    create: {
      shop,
      shippingPercent,
      labourPercent,
      conversionPercent,
      debugPricing,
      marginCalculationMethod,
      flatMarginThreshold,
      flatMarginPercent,
      formulaThreshold,
      formulaLowConstant,
      formulaLowCoefficient,
      formulaHighConstant,
      formulaHighCoefficient,
    },
  });

  // Invalidate the config cache so the storefront gets the updated values
  invalidateConfigCache(shop);

  return { success: true };
};

export default function Settings() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [formData, setFormData] = useState({
    shippingPercent: settings.shippingPercent?.toString() || "100",
    labourPercent: settings.labourPercent?.toString() || "100",
    conversionPercent: settings.conversionPercent?.toString() || "0",
    debugPricing: settings.debugPricing || false,
    marginCalculationMethod: settings.marginCalculationMethod || "tier",
    flatMarginThreshold: settings.flatMarginThreshold?.toString() || "50",
    flatMarginPercent: settings.flatMarginPercent?.toString() || "100",
    formulaThreshold: settings.formulaThreshold?.toString() || "400",
    formulaLowConstant: settings.formulaLowConstant?.toString() || "300",
    formulaLowCoefficient: settings.formulaLowCoefficient?.toString() || "52",
    formulaHighConstant: settings.formulaHighConstant?.toString() || "120",
    formulaHighCoefficient: settings.formulaHighCoefficient?.toString() || "20",
  });

  const handleSave = () => {
    const data = new FormData();
    data.append("shippingPercent", formData.shippingPercent);
    data.append("labourPercent", formData.labourPercent);
    data.append("conversionPercent", formData.conversionPercent);
    data.append("debugPricing", formData.debugPricing.toString());
    data.append("marginCalculationMethod", formData.marginCalculationMethod);
    data.append("flatMarginThreshold", formData.flatMarginThreshold);
    data.append("flatMarginPercent", formData.flatMarginPercent);
    data.append("formulaThreshold", formData.formulaThreshold);
    data.append("formulaLowConstant", formData.formulaLowConstant);
    data.append("formulaLowCoefficient", formData.formulaLowCoefficient);
    data.append("formulaHighConstant", formData.formulaHighConstant);
    data.append("formulaHighCoefficient", formData.formulaHighCoefficient);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Settings saved");
  };

  // Calculate example - Conversion is applied to raw materials first
  const rawMaterials = 100; // Example raw material cost (Fabric + Fill + Ties)
  const conversionPct = parseFloat(formData.conversionPercent) || 0;
  const exampleBase = rawMaterials * (1 + conversionPct / 100); // Base after conversion
  const exampleShipping = exampleBase * (parseFloat(formData.shippingPercent) || 0) / 100;
  const exampleLabour = exampleBase * (parseFloat(formData.labourPercent) || 0) / 100;
  const exampleTotal = exampleBase + exampleShipping + exampleLabour;

  // Formula calculation example
  const calcFormulaMargin = (subtotal) => {
    const flatThreshold = parseFloat(formData.flatMarginThreshold) || 50;
    const flatPercent = parseFloat(formData.flatMarginPercent) || 100;
    const threshold = parseFloat(formData.formulaThreshold) || 400;
    const lowConst = parseFloat(formData.formulaLowConstant) || 300;
    const lowCoef = parseFloat(formData.formulaLowCoefficient) || 52;
    const highConst = parseFloat(formData.formulaHighConstant) || 120;
    const highCoef = parseFloat(formData.formulaHighCoefficient) || 20;

    if (subtotal <= 0) return 0;

    // Flat margin for low values
    if (subtotal <= flatThreshold) {
      return flatPercent;
    }

    // Formula-based margin
    if (subtotal <= threshold) {
      return lowConst - lowCoef * Math.log(subtotal);
    } else {
      return highConst - highCoef * Math.log(subtotal);
    }
  };

  return (
    <s-page heading="Calculator Settings" fullWidth>
      <s-button slot="primary-action" onClick={handleSave}>
        Save Settings
      </s-button>

      <s-section heading="Debug Settings">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="loose">
            <s-paragraph>
              Enable debug pricing to show all prices throughout the calculator interface.
              When disabled, prices are hidden from customers but calculations still work normally.
            </s-paragraph>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.debugPricing}
                  onChange={(e) => setFormData({ ...formData, debugPricing: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ fontWeight: "500" }}>Enable Debug Pricing</span>
              </label>
            </div>

            <s-box padding="base" background="subdued" borderRadius="base">
              <s-text fontSize="small">
                {formData.debugPricing
                  ? "✓ Pricing is visible on option cards, fabric browser, modals, and price breakdown."
                  : "✗ Pricing is hidden from all calculator sections. Only the final 'Add to Cart' price is shown."}
              </s-text>
            </s-box>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Cost Markup Settings">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="loose">
            <s-paragraph>
              Configure the cost markups. Conversion is applied to raw material costs (Fabric, Fill, Ties) first.
              Shipping and Labour are then calculated as percentages of the resulting subtotal.
            </s-paragraph>

            <s-text-field
              label="Shipping Cost (%)"
              type="number"
              value={formData.shippingPercent}
              onChange={(e) => setFormData({ ...formData, shippingPercent: e.target.value })}
              helpText="Percentage of base cost to add for shipping (e.g., 100 = 100% of base)"
              min="0"
              max="500"
              step="1"
              suffix="%"
            />

            <s-text-field
              label="Labour Cost (%)"
              type="number"
              value={formData.labourPercent}
              onChange={(e) => setFormData({ ...formData, labourPercent: e.target.value })}
              helpText="Percentage of base cost to add for labour (e.g., 100 = 100% of base)"
              min="0"
              max="500"
              step="1"
              suffix="%"
            />

            <s-text-field
              label="Conversion Markup (%)"
              type="number"
              value={formData.conversionPercent}
              onChange={(e) => setFormData({ ...formData, conversionPercent: e.target.value })}
              helpText="Markup applied to raw material costs (Fabric, Fill, Ties) before other calculations"
              min="0"
              max="500"
              step="1"
              suffix="%"
            />
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Example Calculation">
        <s-box padding="base" background="subdued" borderRadius="base">
          <s-stack direction="block" gap="tight">
            <s-text>Raw Materials (Fabric + Fill + Ties) = <s-text fontWeight="semibold">${rawMaterials.toFixed(2)}</s-text></s-text>
            <s-text>After Conversion ({formData.conversionPercent}%) = <s-text fontWeight="semibold">${exampleBase.toFixed(2)}</s-text></s-text>
            <s-text>Shipping Cost ({formData.shippingPercent}%) = <s-text fontWeight="semibold">${exampleShipping.toFixed(2)}</s-text></s-text>
            <s-text>Labour Cost ({formData.labourPercent}%) = <s-text fontWeight="semibold">${exampleLabour.toFixed(2)}</s-text></s-text>
            <s-text style={{ borderTop: "1px solid #ccc", paddingTop: 8, marginTop: 8 }}>
              <s-text fontWeight="bold">Total = ${exampleTotal.toFixed(2)}</s-text>
            </s-text>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Margin Calculation Method">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="loose">
            <s-paragraph>
              Choose how margin adjustments are calculated. The tier-based method uses predefined price ranges,
              while the formula-based method uses logarithmic formulas for more precise control.
            </s-paragraph>

            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="marginMethod"
                  value="tier"
                  checked={formData.marginCalculationMethod === "tier"}
                  onChange={() => setFormData({ ...formData, marginCalculationMethod: "tier" })}
                />
                <span>Tier-Based (Price Ranges)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="marginMethod"
                  value="formula"
                  checked={formData.marginCalculationMethod === "formula"}
                  onChange={() => setFormData({ ...formData, marginCalculationMethod: "formula" })}
                />
                <span>Formula-Based (Logarithmic)</span>
              </label>
            </div>

            {formData.marginCalculationMethod === "tier" && (
              <s-box padding="base" background="subdued" borderRadius="base" style={{ marginTop: "12px" }}>
                <s-text>
                  Configure price tiers in the <a href="/app/margins" style={{ color: "#008060" }}>Margins page</a>.
                  Each tier defines a price range and the margin percentage to apply.
                </s-text>
              </s-box>
            )}

            {formData.marginCalculationMethod === "formula" && (
              <s-box padding="base" background="subdued" borderRadius="base" style={{ marginTop: "12px" }}>
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Formula Configuration</s-text>
                  <s-paragraph fontSize="small">
                    The margin percentage is calculated using natural logarithm (ln) formulas based on the subtotal before margin.
                  </s-paragraph>

                  <s-box padding="base" style={{ background: "#fff3cd", borderRadius: "4px", border: "1px solid #ffc107" }}>
                    <s-text fontWeight="semibold" fontSize="small">Flat Margin Range (Subtotal ≤ ${formData.flatMarginThreshold})</s-text>
                    <s-text fontSize="small" style={{ marginTop: "4px" }}>
                      A flat {formData.flatMarginPercent}% margin is applied - no formula calculation.
                    </s-text>
                  </s-box>

                  <s-stack direction="inline" gap="base">
                    <s-text-field
                      label="Flat Margin Threshold ($)"
                      type="number"
                      value={formData.flatMarginThreshold}
                      onChange={(e) => setFormData({ ...formData, flatMarginThreshold: e.target.value })}
                      helpText="Subtotal below which flat margin applies"
                      min="0"
                      step="0.01"
                      prefix="$"
                    />
                    <s-text-field
                      label="Flat Margin Percent (%)"
                      type="number"
                      value={formData.flatMarginPercent}
                      onChange={(e) => setFormData({ ...formData, flatMarginPercent: e.target.value })}
                      helpText="Fixed margin % for low subtotals"
                      min="0"
                      step="1"
                      suffix="%"
                    />
                  </s-stack>

                  <s-text-field
                    label="Formula Threshold Amount ($)"
                    type="number"
                    value={formData.formulaThreshold}
                    onChange={(e) => setFormData({ ...formData, formulaThreshold: e.target.value })}
                    helpText="Subtotal value where the formula switches from low to high range"
                    min="1"
                    step="0.01"
                    prefix="$"
                  />

                  <s-box padding="base" style={{ background: "#e8f4f0", borderRadius: "4px" }}>
                    <s-text fontWeight="semibold" fontSize="small">Low Range Formula (${formData.flatMarginThreshold} &lt; Subtotal ≤ ${formData.formulaThreshold})</s-text>
                    <s-text fontSize="small" style={{ fontFamily: "monospace", marginTop: "4px" }}>
                      Margin % = {formData.formulaLowConstant} - {formData.formulaLowCoefficient} × ln(subtotal)
                    </s-text>
                  </s-box>

                  <s-stack direction="inline" gap="base">
                    <s-text-field
                      label="Low Range Constant"
                      type="number"
                      value={formData.formulaLowConstant}
                      onChange={(e) => setFormData({ ...formData, formulaLowConstant: e.target.value })}
                      helpText="Base value for low range"
                      step="0.01"
                    />
                    <s-text-field
                      label="Low Range Coefficient"
                      type="number"
                      value={formData.formulaLowCoefficient}
                      onChange={(e) => setFormData({ ...formData, formulaLowCoefficient: e.target.value })}
                      helpText="Multiplier for ln(subtotal)"
                      step="0.01"
                    />
                  </s-stack>

                  <s-box padding="base" style={{ background: "#f0e8f4", borderRadius: "4px" }}>
                    <s-text fontWeight="semibold" fontSize="small">High Range Formula (Subtotal &gt; ${formData.formulaThreshold})</s-text>
                    <s-text fontSize="small" style={{ fontFamily: "monospace", marginTop: "4px" }}>
                      Margin % = {formData.formulaHighConstant} - {formData.formulaHighCoefficient} × ln(subtotal)
                    </s-text>
                  </s-box>

                  <s-stack direction="inline" gap="base">
                    <s-text-field
                      label="High Range Constant"
                      type="number"
                      value={formData.formulaHighConstant}
                      onChange={(e) => setFormData({ ...formData, formulaHighConstant: e.target.value })}
                      helpText="Base value for high range"
                      step="0.01"
                    />
                    <s-text-field
                      label="High Range Coefficient"
                      type="number"
                      value={formData.formulaHighCoefficient}
                      onChange={(e) => setFormData({ ...formData, formulaHighCoefficient: e.target.value })}
                      helpText="Multiplier for ln(subtotal)"
                      step="0.01"
                    />
                  </s-stack>
                </s-stack>
              </s-box>
            )}
          </s-stack>
        </s-box>
      </s-section>

      {formData.marginCalculationMethod === "formula" && (
        <s-section heading="Formula Examples">
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="block" gap="tight">
              <s-text fontWeight="semibold">Sample Margin Calculations:</s-text>
              {[50, 100, 200, 400, 500, 800, 1000, 2000].map((subtotal) => {
                const marginPct = calcFormulaMargin(subtotal);
                const finalPrice = subtotal * (1 + marginPct / 100);
                return (
                  <s-text key={subtotal} fontSize="small">
                    Subtotal ${subtotal} → Margin {marginPct.toFixed(1)}% → Final ${finalPrice.toFixed(2)}
                  </s-text>
                );
              })}
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section slot="aside" heading="How It Works">
        <s-box padding="base">
          <s-stack direction="block" gap="tight">
            <s-text fontWeight="semibold">Pricing Formula:</s-text>
            <s-text fontSize="small">1. Raw Materials = (Fabric + Fill + Ties) × (1 + Conversion %)</s-text>
            <s-text fontSize="small">2. Subtotal = Raw Materials + Add-ons (Piping, Button, etc.)</s-text>
            <s-text fontSize="small">3. Shipping = Subtotal × Shipping %</s-text>
            <s-text fontSize="small">4. Labour = Subtotal × Labour %</s-text>
            <s-text fontSize="small">5. Total = Subtotal + Shipping + Labour</s-text>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}
