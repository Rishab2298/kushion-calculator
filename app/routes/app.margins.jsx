import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import { useState, useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const priceTiers = await prisma.priceTier.findMany({
      where: { shop },
      orderBy: { minPrice: "asc" },
    });

    return { shop, priceTiers };
  } catch (error) {
    console.error("Error loading price tiers:", error);
    return { shop, priceTiers: [], error: "Failed to load price tiers" };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create") {
      const minPrice = parseFloat(formData.get("minPrice"));
      const maxPrice = parseFloat(formData.get("maxPrice"));
      const adjustmentPercent = parseFloat(formData.get("adjustmentPercent"));

      if (isNaN(minPrice) || isNaN(maxPrice) || isNaN(adjustmentPercent)) {
        return { error: "Please enter valid numbers for all fields" };
      }

      if (minPrice >= maxPrice) {
        return { error: "Min price must be less than max price" };
      }

      // Check for overlapping tiers
      const overlapping = await prisma.priceTier.findFirst({
        where: {
          shop,
          OR: [
            { AND: [{ minPrice: { lte: minPrice } }, { maxPrice: { gt: minPrice } }] },
            { AND: [{ minPrice: { lt: maxPrice } }, { maxPrice: { gte: maxPrice } }] },
            { AND: [{ minPrice: { gte: minPrice } }, { maxPrice: { lte: maxPrice } }] },
          ],
        },
      });

      if (overlapping) {
        return { error: `This range overlaps with existing tier: $${overlapping.minPrice} - $${overlapping.maxPrice}` };
      }

      await prisma.priceTier.create({
        data: {
          shop,
          minPrice,
          maxPrice,
          adjustmentPercent,
        },
      });

      return { success: "Price tier created successfully" };
    }

    if (intent === "update") {
      const id = formData.get("id");
      const minPrice = parseFloat(formData.get("minPrice"));
      const maxPrice = parseFloat(formData.get("maxPrice"));
      const adjustmentPercent = parseFloat(formData.get("adjustmentPercent"));

      console.log("Update tier:", { id, minPrice, maxPrice, adjustmentPercent });

      if (isNaN(minPrice) || isNaN(maxPrice) || isNaN(adjustmentPercent)) {
        return { error: "Please enter valid numbers for all fields" };
      }

      if (minPrice >= maxPrice) {
        return { error: "Min price must be less than max price" };
      }

      await prisma.priceTier.update({
        where: { id },
        data: { minPrice, maxPrice, adjustmentPercent },
      });

      return { success: "Price tier updated successfully" };
    }

    if (intent === "delete") {
      const id = formData.get("id");
      await prisma.priceTier.delete({ where: { id } });
      return { success: "Price tier deleted successfully" };
    }

    if (intent === "bulk_create") {
      // Delete existing tiers
      await prisma.priceTier.deleteMany({ where: { shop } });

      // Parse the bulk data
      const tiersJson = formData.get("tiers");
      const tiers = JSON.parse(tiersJson);

      // Create all tiers
      await prisma.priceTier.createMany({
        data: tiers.map(tier => ({
          shop,
          minPrice: tier.minPrice,
          maxPrice: tier.maxPrice,
          adjustmentPercent: tier.adjustmentPercent,
        })),
      });

      return { success: `${tiers.length} price tiers created successfully` };
    }

    return { error: "Unknown action" };
  } catch (error) {
    console.error("Margin action error:", error);
    return { error: error.message || "An error occurred" };
  }
};

export default function MarginsPage() {
  const { priceTiers } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState({ minPrice: "", maxPrice: "", adjustmentPercent: "" });
  const [editingId, setEditingId] = useState(null);
  const [editTier, setEditTier] = useState({ minPrice: "", maxPrice: "", adjustmentPercent: "" });

  // Clear editing state and add form after successful action
  useEffect(() => {
    if (actionData?.success) {
      setEditingId(null);
      setEditTier({ minPrice: "", maxPrice: "", adjustmentPercent: "" });
      setShowAddForm(false);
      setNewTier({ minPrice: "", maxPrice: "", adjustmentPercent: "" });
    }
  }, [actionData]);

  // Default tiers as specified by user
  const defaultTiers = [
    { minPrice: 0, maxPrice: 30, adjustmentPercent: 100 },
    { minPrice: 31, maxPrice: 50, adjustmentPercent: 90 },
    { minPrice: 51, maxPrice: 70, adjustmentPercent: 75 },
    { minPrice: 71, maxPrice: 90, adjustmentPercent: 60 },
    { minPrice: 91, maxPrice: 110, adjustmentPercent: 50 },
    { minPrice: 111, maxPrice: 130, adjustmentPercent: 40 },
    { minPrice: 131, maxPrice: 150, adjustmentPercent: 30 },
    { minPrice: 151, maxPrice: 175, adjustmentPercent: 25 },
    { minPrice: 176, maxPrice: 200, adjustmentPercent: 20 },
    { minPrice: 201, maxPrice: 225, adjustmentPercent: 15 },
    { minPrice: 226, maxPrice: 250, adjustmentPercent: 10 },
    { minPrice: 251, maxPrice: 275, adjustmentPercent: 5 },
    { minPrice: 276, maxPrice: 300, adjustmentPercent: 0 },
    { minPrice: 301, maxPrice: 325, adjustmentPercent: -5 },
    { minPrice: 326, maxPrice: 350, adjustmentPercent: -10 },
    { minPrice: 351, maxPrice: 375, adjustmentPercent: -15 },
    { minPrice: 376, maxPrice: 400, adjustmentPercent: -20 },
    { minPrice: 401, maxPrice: 500, adjustmentPercent: -25 },
    { minPrice: 501, maxPrice: 600, adjustmentPercent: -30 },
    { minPrice: 601, maxPrice: 800, adjustmentPercent: -35 },
    { minPrice: 801, maxPrice: 1000, adjustmentPercent: -40 },
    { minPrice: 1001, maxPrice: 1250, adjustmentPercent: -45 },
    { minPrice: 1251, maxPrice: 1500, adjustmentPercent: -50 },
    { minPrice: 1501, maxPrice: 2000, adjustmentPercent: -55 },
    { minPrice: 2001, maxPrice: 3000, adjustmentPercent: -60 },
    { minPrice: 3001, maxPrice: 5000, adjustmentPercent: -65 },
    { minPrice: 5001, maxPrice: 10000, adjustmentPercent: -70 },
    { minPrice: 10001, maxPrice: 20000, adjustmentPercent: -75 },
  ];

  const formatAdjustment = (percent) => {
    if (percent > 0) return `+${percent}% (Increase)`;
    if (percent < 0) return `${percent}% (Decrease)`;
    return "0% (No change)";
  };

  const getAdjustmentColor = (percent) => {
    if (percent > 0) return "critical";
    if (percent < 0) return "success";
    return "subdued";
  };

  const startEditing = (tier) => {
    setEditingId(tier.id);
    setEditTier({
      minPrice: tier.minPrice.toString(),
      maxPrice: tier.maxPrice.toString(),
      adjustmentPercent: tier.adjustmentPercent.toString(),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTier({ minPrice: "", maxPrice: "", adjustmentPercent: "" });
  };

  return (
    <s-page heading="Price Margins" fullWidth>
      <s-button slot="primary-action" href="/app">
        Back to Dashboard
      </s-button>

      {actionData?.error && (
        <s-banner tone="critical" style={{ marginBottom: 16 }}>
          {actionData.error}
        </s-banner>
      )}

      {actionData?.success && (
        <s-banner tone="success" style={{ marginBottom: 16 }}>
          {actionData.success}
        </s-banner>
      )}

      <s-section heading="About Price Margins">
        <s-box padding="base">
          <s-paragraph>
            Price margins automatically adjust the final price based on the calculated subtotal
            (after fabric, fill, shipping, and labour costs). Use positive percentages to increase
            prices for lower-value orders, and negative percentages to offer discounts on higher-value orders.
          </s-paragraph>
          <s-paragraph style={{ marginTop: 8 }}>
            <s-text fontWeight="semibold">Formula:</s-text> Final Price = Subtotal + (Subtotal × Margin%)
          </s-paragraph>
        </s-box>
      </s-section>

      {priceTiers.length === 0 && (
        <s-section heading="Quick Setup">
          <s-box padding="base">
            <s-paragraph>
              No price tiers configured yet. Click below to load the recommended default tiers.
            </s-paragraph>
            <Form method="post" style={{ marginTop: 16 }}>
              <input type="hidden" name="intent" value="bulk_create" />
              <input type="hidden" name="tiers" value={JSON.stringify(defaultTiers)} />
              <s-button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Loading..." : "Load Default Tiers (28 tiers)"}
              </s-button>
            </Form>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Price Tiers (${priceTiers.length})`}>
        {!showAddForm && (
          <s-button slot="action" onClick={() => setShowAddForm(true)}>
            Add Tier
          </s-button>
        )}

        {showAddForm && (
          <s-box padding="base" style={{ marginBottom: 16, background: "#f9fafb", borderRadius: 8 }}>
            <s-heading level="4">Add New Price Tier</s-heading>
            <Form method="post" style={{ marginTop: 12 }}>
              <input type="hidden" name="intent" value="create" />
              <s-stack direction="inline" gap="base" align="end">
                <s-stack direction="block" gap="tight">
                  <label>Min Price ($)</label>
                  <input
                    type="number"
                    name="minPrice"
                    value={newTier.minPrice}
                    onChange={(e) => setNewTier({ ...newTier, minPrice: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", width: 100 }}
                    required
                  />
                </s-stack>
                <s-stack direction="block" gap="tight">
                  <label>Max Price ($)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={newTier.maxPrice}
                    onChange={(e) => setNewTier({ ...newTier, maxPrice: e.target.value })}
                    placeholder="100"
                    step="0.01"
                    style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", width: 100 }}
                    required
                  />
                </s-stack>
                <s-stack direction="block" gap="tight">
                  <label>Adjustment (%)</label>
                  <input
                    type="number"
                    name="adjustmentPercent"
                    value={newTier.adjustmentPercent}
                    onChange={(e) => setNewTier({ ...newTier, adjustmentPercent: e.target.value })}
                    placeholder="10 or -10"
                    step="1"
                    style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", width: 120 }}
                    required
                  />
                </s-stack>
                <s-button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add"}
                </s-button>
                <s-button type="button" onClick={() => { setShowAddForm(false); setNewTier({ minPrice: "", maxPrice: "", adjustmentPercent: "" }); }}>
                  Cancel
                </s-button>
              </s-stack>
            </Form>
          </s-box>
        )}

        {priceTiers.length > 0 ? (
          <s-box padding="none">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Price Range</th>
                  <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Margin Adjustment</th>
                  <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Example</th>
                  <th style={{ padding: 12, textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {priceTiers.map((tier, index) => (
                  <tr key={tier.id} style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    {editingId === tier.id ? (
                      <td colSpan="4" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                        <Form method="post">
                          <input type="hidden" name="intent" value="update" />
                          <input type="hidden" name="id" value={tier.id} />
                          <s-stack direction="inline" gap="base" align="center">
                            <s-stack direction="inline" gap="tight" align="center">
                              <span>$</span>
                              <input
                                type="number"
                                name="minPrice"
                                value={editTier.minPrice}
                                onChange={(e) => setEditTier({ ...editTier, minPrice: e.target.value })}
                                step="0.01"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", width: 90 }}
                                required
                              />
                              <span>-</span>
                              <span>$</span>
                              <input
                                type="number"
                                name="maxPrice"
                                value={editTier.maxPrice}
                                onChange={(e) => setEditTier({ ...editTier, maxPrice: e.target.value })}
                                step="0.01"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", width: 90 }}
                                required
                              />
                            </s-stack>
                            <s-stack direction="inline" gap="tight" align="center">
                              <span>Margin:</span>
                              <input
                                type="number"
                                name="adjustmentPercent"
                                value={editTier.adjustmentPercent}
                                onChange={(e) => setEditTier({ ...editTier, adjustmentPercent: e.target.value })}
                                step="1"
                                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", width: 80 }}
                                required
                              />
                              <span>%</span>
                            </s-stack>
                            <span style={{ color: "#666" }}>
                              (${editTier.minPrice || 0} → ${((parseFloat(editTier.minPrice) || 0) * (1 + (parseFloat(editTier.adjustmentPercent) || 0) / 100)).toFixed(2)})
                            </span>
                            <s-stack direction="inline" gap="tight">
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                  padding: "6px 12px",
                                  background: "#008060",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer"
                                }}
                              >
                                {isSubmitting ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                style={{
                                  padding: "6px 12px",
                                  background: "#f3f4f6",
                                  color: "#333",
                                  border: "1px solid #ccc",
                                  borderRadius: 4,
                                  cursor: "pointer"
                                }}
                              >
                                Cancel
                              </button>
                            </s-stack>
                          </s-stack>
                        </Form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                          ${tier.minPrice.toLocaleString()} - ${tier.maxPrice.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                          <s-text tone={getAdjustmentColor(tier.adjustmentPercent)}>
                            {formatAdjustment(tier.adjustmentPercent)}
                          </s-text>
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", color: "#666" }}>
                          ${tier.minPrice} → ${(tier.minPrice * (1 + tier.adjustmentPercent / 100)).toFixed(2)}
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>
                          <s-stack direction="inline" gap="tight">
                            <s-button type="button" variant="plain" size="small" onClick={() => startEditing(tier)}>
                              Edit
                            </s-button>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="id" value={tier.id} />
                              <s-button type="submit" variant="plain" tone="critical" size="small">
                                Delete
                              </s-button>
                            </Form>
                          </s-stack>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </s-box>
        ) : (
          <s-box padding="large" style={{ textAlign: "center" }}>
            <s-text tone="subdued">No price tiers configured. Add tiers or load defaults above.</s-text>
          </s-box>
        )}

        {priceTiers.length > 0 && (
          <s-box padding="base" style={{ marginTop: 16 }}>
            <Form method="post">
              <input type="hidden" name="intent" value="bulk_create" />
              <input type="hidden" name="tiers" value={JSON.stringify(defaultTiers)} />
              <s-button type="submit" variant="plain" tone="critical" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset to Default Tiers"}
              </s-button>
              <s-text tone="subdued" style={{ marginLeft: 12 }}>
                This will delete all current tiers and load the 28 default tiers.
              </s-text>
            </Form>
          </s-box>
        )}
      </s-section>

      <s-section slot="aside" heading="How It Works">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text fontWeight="semibold">Low-value orders (increase price):</s-text>
            <s-text fontSize="small">$0-$30 → +100% margin</s-text>
            <s-text fontSize="small">$31-$50 → +90% margin</s-text>
            <s-text fontSize="small">...</s-text>

            <s-text fontWeight="semibold" style={{ marginTop: 8 }}>Break-even point:</s-text>
            <s-text fontSize="small">$276-$300 → 0% (no change)</s-text>

            <s-text fontWeight="semibold" style={{ marginTop: 8 }}>High-value orders (discount):</s-text>
            <s-text fontSize="small">$301-$325 → -5% discount</s-text>
            <s-text fontSize="small">...</s-text>
            <s-text fontSize="small">$10,001-$20,000 → -75% discount</s-text>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
