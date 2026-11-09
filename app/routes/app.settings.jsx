import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";
import { cleanupExistingCustomVariants } from "../lib/variant-cleanup.server";
import { Badge, Checkbox, TextField, ConfirmModal } from "../components/admin-ui";

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

  // Active fabric categories, with their Sample Shop visibility flag, for the
  // enable/disable list in the Fabric & Fill Sample Shop section.
  const categories = await prisma.fabricCategory.findMany({
    where: { shop, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, showInSampleShop: true },
  });

  return { settings, categories };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  // On-demand cleanup of leftover junk variants (scans Shopify, deletes Custom-* variants).
  if (formData.get("intent") === "cleanup") {
    try {
      // Use the default 90-day retention window so this never drops a fresh variant that's still in
      // a shopper's cart — it only clears custom variants older than 90 days, same rule as the cron.
      const result = await cleanupExistingCustomVariants(admin, shop);
      return { cleanup: { ...result, success: true } };
    } catch (err) {
      console.error("Custom variant cleanup failed:", err.message);
      return { cleanup: { success: false, error: err.message } };
    }
  }

  const shippingPercent = parseFloat(formData.get("shippingPercent")) || 0;
  const labourPercent = parseFloat(formData.get("labourPercent")) || 0;
  const conversionPercent = parseFloat(formData.get("conversionPercent")) || 0;
  const debugPricing = formData.get("debugPricing") === "true";

  // Minimum flat-rate shipping & labour settings
  const enableMinimumFlatRate = formData.get("enableMinimumFlatRate") === "true";
  const flatRateThreshold = parseFloat(formData.get("flatRateThreshold")) || 50;
  const flatShippingAmount = parseFloat(formData.get("flatShippingAmount")) || 50;
  const flatLabourAmount = parseFloat(formData.get("flatLabourAmount")) || 50;

  // Margin calculation settings
  const marginCalculationMethod = formData.get("marginCalculationMethod") || "tier";
  const flatMarginThreshold = parseFloat(formData.get("flatMarginThreshold")) || 50;
  const flatMarginPercent = parseFloat(formData.get("flatMarginPercent")) || 100;
  const formulaThreshold = parseFloat(formData.get("formulaThreshold")) || 400;
  const formulaLowConstant = parseFloat(formData.get("formulaLowConstant")) || 300;
  const formulaLowCoefficient = parseFloat(formData.get("formulaLowCoefficient")) || 52;
  const formulaHighConstant = parseFloat(formData.get("formulaHighConstant")) || 120;
  const formulaHighCoefficient = parseFloat(formData.get("formulaHighCoefficient")) || 20;

  // Fabric Sample Shop settings
  const fabricSampleProductId = formData.get("fabricSampleProductId")?.trim() || null;
  const sampleBundlePrice = parseFloat(formData.get("sampleBundlePrice")) || 25;
  const sampleMinItems = parseInt(formData.get("sampleMinItems")) || 4;
  const samplePerItemPrice = parseFloat(formData.get("samplePerItemPrice")) || 5;

  await prisma.calculatorSettings.upsert({
    where: { shop },
    update: {
      shippingPercent,
      labourPercent,
      conversionPercent,
      debugPricing,
      enableMinimumFlatRate,
      flatRateThreshold,
      flatShippingAmount,
      flatLabourAmount,
      marginCalculationMethod,
      flatMarginThreshold,
      flatMarginPercent,
      formulaThreshold,
      formulaLowConstant,
      formulaLowCoefficient,
      formulaHighConstant,
      formulaHighCoefficient,
      fabricSampleProductId,
      sampleBundlePrice,
      sampleMinItems,
      samplePerItemPrice,
    },
    create: {
      shop,
      shippingPercent,
      labourPercent,
      conversionPercent,
      debugPricing,
      enableMinimumFlatRate,
      flatRateThreshold,
      flatShippingAmount,
      flatLabourAmount,
      marginCalculationMethod,
      flatMarginThreshold,
      flatMarginPercent,
      formulaThreshold,
      formulaLowConstant,
      formulaLowCoefficient,
      formulaHighConstant,
      formulaHighCoefficient,
      fabricSampleProductId,
      sampleBundlePrice,
      sampleMinItems,
      samplePerItemPrice,
    },
  });

  // Fabric Sample Shop: which categories are shown in the storefront block.
  // The form submits the enabled category IDs; everything else (for this shop) is hidden.
  const enabledCategoryIds = (formData.get("sampleShopCategoryIds") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  // Only reconcile the categories shown in the form (active ones); leave inactive
  // categories' visibility untouched.
  const activeCategories = await prisma.fabricCategory.findMany({
    where: { shop, isActive: true },
    select: { id: true },
  });
  const enabledSet = new Set(enabledCategoryIds);
  const disabledCategoryIds = activeCategories
    .map((c) => c.id)
    .filter((id) => !enabledSet.has(id));

  await Promise.all([
    enabledCategoryIds.length
      ? prisma.fabricCategory.updateMany({
          where: { shop, id: { in: enabledCategoryIds } },
          data: { showInSampleShop: true },
        })
      : null,
    disabledCategoryIds.length
      ? prisma.fabricCategory.updateMany({
          where: { shop, id: { in: disabledCategoryIds } },
          data: { showInSampleShop: false },
        })
      : null,
  ]);

  // Invalidate the config cache so the storefront gets the updated values
  invalidateConfigCache(shop);

  return { success: true };
};

export default function Settings() {
  const { settings, categories } = useLoaderData();
  const fetcher = useFetcher();
  const cleanupFetcher = useFetcher();
  const shopify = useAppBridge();

  const [formData, setFormData] = useState({
    shippingPercent: settings.shippingPercent?.toString() || "100",
    labourPercent: settings.labourPercent?.toString() || "100",
    conversionPercent: settings.conversionPercent?.toString() || "0",
    debugPricing: settings.debugPricing || false,
    enableMinimumFlatRate: settings.enableMinimumFlatRate ?? true,
    flatRateThreshold: settings.flatRateThreshold?.toString() || "50",
    flatShippingAmount: settings.flatShippingAmount?.toString() || "50",
    flatLabourAmount: settings.flatLabourAmount?.toString() || "50",
    marginCalculationMethod: settings.marginCalculationMethod || "tier",
    flatMarginThreshold: settings.flatMarginThreshold?.toString() || "50",
    flatMarginPercent: settings.flatMarginPercent?.toString() || "100",
    formulaThreshold: settings.formulaThreshold?.toString() || "400",
    formulaLowConstant: settings.formulaLowConstant?.toString() || "300",
    formulaLowCoefficient: settings.formulaLowCoefficient?.toString() || "52",
    formulaHighConstant: settings.formulaHighConstant?.toString() || "120",
    formulaHighCoefficient: settings.formulaHighCoefficient?.toString() || "20",
    fabricSampleProductId: settings.fabricSampleProductId || "",
    sampleBundlePrice: settings.sampleBundlePrice?.toString() || "25",
    sampleMinItems: settings.sampleMinItems?.toString() || "4",
    samplePerItemPrice: settings.samplePerItemPrice?.toString() || "5",
    sampleCategories: (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      showInSampleShop: c.showInSampleShop !== false,
    })),
  });

  // Dirty tracking for the App Bridge save bar: compare the form with the last saved/loaded state.
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(formData));
  const isDirty = JSON.stringify(formData) !== savedSnapshot;
  const [confirmCleanup, setConfirmCleanup] = useState(false);

  // Small helper so each field can update its own key.
  const setField = (key) => (value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleSampleCategory = (id) => {
    setFormData((prev) => ({
      ...prev,
      sampleCategories: prev.sampleCategories.map((c) =>
        c.id === id ? { ...c, showInSampleShop: !c.showInSampleShop } : c
      ),
    }));
  };

  const handleSave = () => {
    const data = new FormData();
    data.append("shippingPercent", formData.shippingPercent);
    data.append("labourPercent", formData.labourPercent);
    data.append("conversionPercent", formData.conversionPercent);
    data.append("debugPricing", formData.debugPricing.toString());
    data.append("enableMinimumFlatRate", formData.enableMinimumFlatRate.toString());
    data.append("flatRateThreshold", formData.flatRateThreshold);
    data.append("flatShippingAmount", formData.flatShippingAmount);
    data.append("flatLabourAmount", formData.flatLabourAmount);
    data.append("marginCalculationMethod", formData.marginCalculationMethod);
    data.append("flatMarginThreshold", formData.flatMarginThreshold);
    data.append("flatMarginPercent", formData.flatMarginPercent);
    data.append("formulaThreshold", formData.formulaThreshold);
    data.append("formulaLowConstant", formData.formulaLowConstant);
    data.append("formulaLowCoefficient", formData.formulaLowCoefficient);
    data.append("formulaHighConstant", formData.formulaHighConstant);
    data.append("formulaHighCoefficient", formData.formulaHighCoefficient);
    data.append("fabricSampleProductId", formData.fabricSampleProductId);
    data.append("sampleBundlePrice", formData.sampleBundlePrice);
    data.append("sampleMinItems", formData.sampleMinItems);
    data.append("samplePerItemPrice", formData.samplePerItemPrice);
    data.append(
      "sampleShopCategoryIds",
      formData.sampleCategories
        .filter((c) => c.showInSampleShop)
        .map((c) => c.id)
        .join(",")
    );
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Settings saved");
    setSavedSnapshot(JSON.stringify(formData));
  };

  const handleDiscard = () => {
    setFormData(JSON.parse(savedSnapshot));
  };

  const handleCleanup = () => {
    setConfirmCleanup(false);
    const data = new FormData();
    data.append("intent", "cleanup");
    cleanupFetcher.submit(data, { method: "POST" });
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

  const cleanupBusy = cleanupFetcher.state !== "idle";
  const cleanupResult = cleanupFetcher.data?.cleanup;
  const enabledSampleCount = formData.sampleCategories.filter((c) => c.showInSampleShop).length;
  const formulaBox = { fontFamily: "var(--cc-mono)", fontSize: 12.5 };

  return (
    <s-page heading="Settings" inlineSize="large">
      <SaveBar id="settings-save-bar" open={isDirty}>
        <button variant="primary" onClick={handleSave}>Save</button>
        <button onClick={handleDiscard}>Discard</button>
      </SaveBar>
      <s-button slot="primary-action" variant="primary" onClick={handleSave}>
        Save
      </s-button>

      <div className="cc-page">
        <div className="cc-layout">
          <div className="cc-main">
            {/* Pricing visibility */}
            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Price display</h2>
                <span className="cc-card__actions">
                  {formData.debugPricing ? <Badge tone="info">Prices visible</Badge> : <Badge>Prices hidden</Badge>}
                </span>
              </div>
              <div className="cc-card__body">
                <Checkbox
                  id="settings-debug-pricing"
                  checked={formData.debugPricing}
                  onChange={setField("debugPricing")}
                  label="Show prices throughout the calculator (debug pricing)"
                  help="When off, prices are hidden from customers but calculations still work normally."
                />
                <div className="cc-banner cc-small">
                  {formData.debugPricing
                    ? "Prices are shown on option cards, the fabric browser, modals and the price breakdown."
                    : "Prices are hidden in every calculator section. Only the final Add to cart price is shown."}
                </div>
              </div>
            </div>

            {/* Cost markups */}
            <div className="cc-card">
              <div className="cc-card__head"><h2>Cost markups</h2></div>
              <div className="cc-card__body">
                <p className="cc-p cc-muted">
                  Conversion is applied to raw material costs (fabric, fill, ties) first. Shipping and labour are
                  then added as percentages of the resulting subtotal.
                </p>
                <div className="cc-row3">
                  <TextField
                    id="settings-conversion"
                    label="Conversion markup (%)"
                    type="number"
                    value={formData.conversionPercent}
                    onChange={setField("conversionPercent")}
                    help="Markup on fabric, fill and ties before other calculations."
                    min="0"
                    max="500"
                    step="1"
                  />
                  <TextField
                    id="settings-shipping"
                    label="Shipping (%)"
                    type="number"
                    value={formData.shippingPercent}
                    onChange={setField("shippingPercent")}
                    help="Percent of the base cost added for shipping (100 = 100% of base)."
                    min="0"
                    max="500"
                    step="1"
                  />
                  <TextField
                    id="settings-labour"
                    label="Labour (%)"
                    type="number"
                    value={formData.labourPercent}
                    onChange={setField("labourPercent")}
                    help="Percent of the base cost added for labour (100 = 100% of base)."
                    min="0"
                    max="500"
                    step="1"
                  />
                </div>
              </div>
            </div>

            {/* Minimum flat-rate */}
            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Minimum flat-rate shipping and labour</h2>
                <span className="cc-card__actions">
                  {formData.enableMinimumFlatRate ? <Badge tone="success">On</Badge> : <Badge>Off</Badge>}
                </span>
              </div>
              <div className="cc-card__body">
                <Checkbox
                  id="settings-flat-rate"
                  checked={formData.enableMinimumFlatRate}
                  onChange={setField("enableMinimumFlatRate")}
                  label="Use flat shipping and labour fees for low-cost cushions"
                  help="When fabric + fill cost is below the threshold, shipping and labour are each set to the flat amounts below instead of the percentages. In multi-piece mode the combined fabric + fill of all pieces is compared, and the flat fees are applied once to the whole order."
                />
                <div className="cc-row3">
                  <TextField
                    id="settings-flat-threshold"
                    label="Threshold, fabric + fill ($)"
                    type="number"
                    value={formData.flatRateThreshold}
                    onChange={setField("flatRateThreshold")}
                    help="Below this cost, the flat fees are used."
                    min="0"
                    step="1"
                  />
                  <TextField
                    id="settings-flat-shipping"
                    label="Flat shipping ($)"
                    type="number"
                    value={formData.flatShippingAmount}
                    onChange={setField("flatShippingAmount")}
                    help="Shipping fee charged below the threshold."
                    min="0"
                    step="1"
                  />
                  <TextField
                    id="settings-flat-labour"
                    label="Flat labour ($)"
                    type="number"
                    value={formData.flatLabourAmount}
                    onChange={setField("flatLabourAmount")}
                    help="Labour fee charged below the threshold."
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>

            {/* Margin method */}
            <div className="cc-card">
              <div className="cc-card__head"><h2>Margin calculation</h2></div>
              <div className="cc-card__body">
                <div className="cc-seg" role="radiogroup" aria-label="Margin calculation method">
                  <button
                    type="button"
                    aria-pressed={formData.marginCalculationMethod === "tier"}
                    onClick={() => setFormData({ ...formData, marginCalculationMethod: "tier" })}
                  >
                    <strong>Tier-based</strong>
                    <span>Margin % comes from predefined price ranges</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={formData.marginCalculationMethod === "formula"}
                    onClick={() => setFormData({ ...formData, marginCalculationMethod: "formula" })}
                  >
                    <strong>Formula-based</strong>
                    <span>Logarithmic formulas for finer control</span>
                  </button>
                </div>

                {formData.marginCalculationMethod === "tier" && (
                  <div className="cc-banner">
                    Set up price tiers on the <a href="/app/margins" style={{ color: "inherit", fontWeight: 600 }}>Margins page</a>.
                    Each tier defines a price range and the margin percentage to apply.
                  </div>
                )}

                {formData.marginCalculationMethod === "formula" && (
                  <>
                    <p className="cc-p cc-muted">
                      The margin % is calculated with natural logarithm (ln) formulas based on the subtotal before margin.
                    </p>

                    <div style={{ display: "grid", gap: 8 }}>
                      <div className="cc-label">Flat margin range</div>
                      <div className="cc-banner cc-banner--warning cc-small">
                        Subtotal ≤ ${formData.flatMarginThreshold}: a flat {formData.flatMarginPercent}% margin is applied, no formula.
                      </div>
                      <div className="cc-row2">
                        <TextField
                          id="settings-flat-margin-threshold"
                          label="Flat margin threshold ($)"
                          type="number"
                          value={formData.flatMarginThreshold}
                          onChange={setField("flatMarginThreshold")}
                          help="Subtotal at or below which the flat margin applies."
                          min="0"
                          step="0.01"
                        />
                        <TextField
                          id="settings-flat-margin-percent"
                          label="Flat margin (%)"
                          type="number"
                          value={formData.flatMarginPercent}
                          onChange={setField("flatMarginPercent")}
                          help="Fixed margin % for low subtotals."
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <TextField
                      id="settings-formula-threshold"
                      label="Formula threshold ($)"
                      type="number"
                      value={formData.formulaThreshold}
                      onChange={setField("formulaThreshold")}
                      help="Subtotal where the formula switches from the low range to the high range."
                      min="1"
                      step="0.01"
                    />

                    <div style={{ display: "grid", gap: 8 }}>
                      <div className="cc-label">
                        Low range <span className="cc-muted" style={{ fontWeight: 400 }}>(${formData.flatMarginThreshold} &lt; subtotal ≤ ${formData.formulaThreshold})</span>
                      </div>
                      <div className="cc-calc" style={formulaBox}>
                        Margin % = {formData.formulaLowConstant} − {formData.formulaLowCoefficient} × ln(subtotal)
                      </div>
                      <div className="cc-row2">
                        <TextField
                          id="settings-low-constant"
                          label="Low range constant"
                          type="number"
                          value={formData.formulaLowConstant}
                          onChange={setField("formulaLowConstant")}
                          help="Base value for the low range."
                          step="0.01"
                        />
                        <TextField
                          id="settings-low-coefficient"
                          label="Low range coefficient"
                          type="number"
                          value={formData.formulaLowCoefficient}
                          onChange={setField("formulaLowCoefficient")}
                          help="Multiplier for ln(subtotal)."
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <div className="cc-label">
                        High range <span className="cc-muted" style={{ fontWeight: 400 }}>(subtotal &gt; ${formData.formulaThreshold})</span>
                      </div>
                      <div className="cc-calc" style={formulaBox}>
                        Margin % = {formData.formulaHighConstant} − {formData.formulaHighCoefficient} × ln(subtotal)
                      </div>
                      <div className="cc-row2">
                        <TextField
                          id="settings-high-constant"
                          label="High range constant"
                          type="number"
                          value={formData.formulaHighConstant}
                          onChange={setField("formulaHighConstant")}
                          help="Base value for the high range."
                          step="0.01"
                        />
                        <TextField
                          id="settings-high-coefficient"
                          label="High range coefficient"
                          type="number"
                          value={formData.formulaHighCoefficient}
                          onChange={setField("formulaHighCoefficient")}
                          help="Multiplier for ln(subtotal)."
                          step="0.01"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {formData.marginCalculationMethod === "formula" && (
              <div className="cc-card">
                <div className="cc-card__head">
                  <h2>Formula examples</h2>
                  <span className="cc-card__meta">Live preview of the settings above</span>
                </div>
                <div className="cc-card__flush">
                  <div className="cc-table-wrap">
                    <table className="cc-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>Subtotal</th>
                          <th style={{ textAlign: "right" }}>Margin</th>
                          <th style={{ textAlign: "right" }}>Final price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[50, 100, 200, 400, 500, 800, 1000, 2000].map((subtotal) => {
                          const marginPct = calcFormulaMargin(subtotal);
                          const finalPrice = subtotal * (1 + marginPct / 100);
                          return (
                            <tr key={subtotal}>
                              <td className="cc-num">${subtotal}</td>
                              <td className="cc-num" style={{ textAlign: "right" }}>{marginPct.toFixed(1)}%</td>
                              <td className="cc-num" style={{ textAlign: "right", fontWeight: 600 }}>${finalPrice.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sample shop */}
            <div className="cc-card">
              <div className="cc-card__head"><h2>Fabric and fill sample shop</h2></div>
              <div className="cc-card__body">
                <p className="cc-p cc-muted">
                  Settings for the Fabric &amp; Fill Sample Shop storefront block, where customers browse and buy
                  fabric and fill samples with bundle pricing.
                </p>
                <TextField
                  id="settings-sample-product"
                  label="Fabric sample product ID"
                  value={formData.fabricSampleProductId}
                  onChange={setField("fabricSampleProductId")}
                  placeholder="gid://shopify/Product/..."
                  help="Shopify product ID or GID (e.g. gid://shopify/Product/123) of the base sample product. Create a product named “Fabric Samples” in your store and paste its GID here."
                />
                <div className="cc-row3">
                  <TextField
                    id="settings-sample-bundle-price"
                    label="Bundle price ($)"
                    type="number"
                    value={formData.sampleBundlePrice}
                    onChange={setField("sampleBundlePrice")}
                    help="Price for the minimum bundle (e.g. any 4 for $25)."
                    min="0"
                    step="0.01"
                  />
                  <TextField
                    id="settings-sample-min-items"
                    label="Minimum items"
                    type="number"
                    value={formData.sampleMinItems}
                    onChange={setField("sampleMinItems")}
                    help="Minimum number of items required to purchase."
                    min="1"
                    step="1"
                  />
                  <TextField
                    id="settings-sample-per-item"
                    label="Price per extra item ($)"
                    type="number"
                    value={formData.samplePerItemPrice}
                    onChange={setField("samplePerItemPrice")}
                    help="Cost of each item beyond the minimum bundle."
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="cc-calc">
                  Any {formData.sampleMinItems} samples = ${formData.sampleBundlePrice}, then +${formData.samplePerItemPrice} per additional item
                  (e.g. 5 items = ${(parseFloat(formData.sampleBundlePrice) + parseFloat(formData.samplePerItemPrice)).toFixed(2)},
                  6 items = ${(parseFloat(formData.sampleBundlePrice) + 2 * parseFloat(formData.samplePerItemPrice)).toFixed(2)})
                </div>

                <div style={{ display: "grid", gap: 6, borderTop: "1px solid var(--cc-border)", paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span className="cc-label">Categories shown in the sample shop</span>
                    {formData.sampleCategories.length > 0 && (
                      <span className="cc-muted cc-small cc-num">
                        {enabledSampleCount} of {formData.sampleCategories.length} shown
                      </span>
                    )}
                  </div>
                  <span className="cc-help">
                    Selected categories can be browsed in the sample shop. Unselected categories (and their fabrics) are
                    hidden from the sample shop only; they still appear in the main calculator. Uncategorized fabrics are
                    always shown.
                  </span>
                  {formData.sampleCategories.length === 0 ? (
                    <div className="cc-banner cc-small">
                      No active fabric categories yet. Add categories under Fabrics to manage them here.
                    </div>
                  ) : (
                    <div className="cc-chips" style={{ paddingTop: 4 }}>
                      {formData.sampleCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className="cc-chip"
                          aria-pressed={cat.showInSampleShop}
                          onClick={() => toggleSampleCategory(cat.id)}
                        >
                          {cat.showInSampleShop ? "✓ " : ""}{cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Variant cleanup */}
            <div className="cc-card">
              <div className="cc-card__head"><h2>Custom variant cleanup</h2></div>
              <div className="cc-card__body">
                <p className="cc-p cc-muted">
                  Each configured cushion added to the cart creates a Shopify variant on the product to carry its
                  custom price. These are deleted automatically once an order is placed, and abandoned ones are
                  swept every 6 hours after a 90-day retention window, so a shopper who returns to an older cart
                  still finds their item intact.
                </p>
                <p className="cc-p cc-muted cc-small">
                  Cleaning up now deletes custom cushion variants older than 90 days from every product, using the
                  same retention rule as the automatic cleanup, so a variant still in a shopper&apos;s cart (younger
                  than 90 days) is never dropped. Placed orders are unaffected; they keep their own line-item snapshot.
                </p>
                <div>
                  <button
                    type="button"
                    className="cc-btn cc-btn--critical"
                    onClick={() => setConfirmCleanup(true)}
                    disabled={cleanupBusy}
                  >
                    {cleanupBusy ? "Cleaning up…" : "Clean up custom variants"}
                  </button>
                </div>
                {cleanupResult && (
                  <div className={`cc-banner cc-small${cleanupResult.success ? "" : " cc-banner--warning"}`}>
                    {cleanupResult.success
                      ? `Done. Scanned ${cleanupResult.scannedProducts} product(s), deleted ${cleanupResult.deletedCount} custom variant(s).`
                      : `Cleanup failed: ${cleanupResult.error}`}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="cc-btn cc-btn--primary" onClick={handleSave}>Save</button>
            </div>
          </div>

          <div className="cc-side">
            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Example calculation</h2>
                <span className="cc-card__meta">$100 of materials</span>
              </div>
              <div className="cc-card__body">
                <div className="cc-calc">
                  <div><span>Raw materials (fabric + fill + ties)</span><span>${rawMaterials.toFixed(2)}</span></div>
                  <div><span>After conversion ({formData.conversionPercent}%)</span><span>${exampleBase.toFixed(2)}</span></div>
                  <div><span>Shipping ({formData.shippingPercent}%)</span><span>${exampleShipping.toFixed(2)}</span></div>
                  <div><span>Labour ({formData.labourPercent}%)</span><span>${exampleLabour.toFixed(2)}</span></div>
                  <div className="cc-calc__total"><span>Total</span><span>${exampleTotal.toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>How pricing works</h2></div>
              <div className="cc-card__body">
                <ol className="cc-small" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                  <li>Raw materials = (fabric + fill + ties) × (1 + conversion %)</li>
                  <li>Subtotal = raw materials + add-ons (piping, button, etc.)</li>
                  <li>Shipping = subtotal × shipping %</li>
                  <li>Labour = subtotal × labour %</li>
                  <li>Total = subtotal + shipping + labour</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmCleanup}
        title="Clean up custom variants?"
        confirmLabel="Clean up"
        onConfirm={handleCleanup}
        onCancel={() => setConfirmCleanup(false)}
      >
        <p className="cc-p">
          This deletes custom cushion variants older than 90 days across all products. Variants tied to placed
          orders keep their snapshot, so existing orders are unaffected.
        </p>
        <p className="cc-p cc-muted">This may take a moment for products with many variants.</p>
      </ConfirmModal>
    </s-page>
  );
}
