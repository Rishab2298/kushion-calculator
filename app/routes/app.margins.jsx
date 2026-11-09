import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import { useState, useEffect, useRef } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, TextField, ConfirmModal, EmptyState } from "../components/admin-ui";

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

  // Delete and reset still submit their own <Form>s; the modal only asks first.
  const deleteFormRefs = useRef({});
  const resetFormRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const confirmDelete = () => {
    const form = deleteTarget && deleteFormRefs.current[deleteTarget.id];
    setDeleteTarget(null);
    form?.requestSubmit();
  };

  const confirmResetTiers = () => {
    setConfirmReset(false);
    resetFormRef.current?.requestSubmit();
  };

  const adjustmentTone = (percent) => {
    const tone = getAdjustmentColor(percent);
    return tone === "subdued" ? undefined : tone;
  };

  const inlineInput = (width) => ({ width, padding: "5px 8px" });

  return (
    <s-page heading="Price Margins" inlineSize="large">
      <s-button slot="primary-action" href="/app">
        Back to Dashboard
      </s-button>

      <div className="cc-page">
        {actionData?.error && (
          <div className="cc-banner" role="alert" style={{ background: "var(--cc-crit-bg)", color: "var(--cc-crit)" }}>
            {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="cc-banner" role="status" style={{ background: "var(--cc-on-bg)", color: "var(--cc-on)" }}>
            {actionData.success}
          </div>
        )}

        <div className="cc-layout">
          <div className="cc-main">
            {priceTiers.length === 0 && (
              <div className="cc-card">
                <div className="cc-card__head"><h2>Quick setup</h2></div>
                <div className="cc-card__body">
                  <p className="cc-p cc-muted">No price tiers yet. Load the recommended default tiers to get started.</p>
                  <Form method="post">
                    <input type="hidden" name="intent" value="bulk_create" />
                    <input type="hidden" name="tiers" value={JSON.stringify(defaultTiers)} />
                    <button type="submit" className="cc-btn cc-btn--primary" disabled={isSubmitting}>
                      {isSubmitting ? "Loading..." : "Load default tiers (28 tiers)"}
                    </button>
                  </Form>
                </div>
              </div>
            )}

            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Price tiers</h2>
                <span className="cc-card__meta">{priceTiers.length}</span>
                {!showAddForm && (
                  <div className="cc-card__actions">
                    <button type="button" className="cc-btn" onClick={() => setShowAddForm(true)}>Add tier</button>
                  </div>
                )}
              </div>

              {showAddForm && (
                <div className="cc-card__body" style={{ paddingBottom: 4 }}>
                  <div style={{ background: "var(--cc-surface-2)", border: "1px solid var(--cc-border)", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
                    <div className="cc-label">New price tier</div>
                    <Form method="post">
                      <input type="hidden" name="intent" value="create" />
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ width: 130 }}>
                          <TextField
                            id="tier-min"
                            label="Min price ($)"
                            type="number"
                            name="minPrice"
                            value={newTier.minPrice}
                            onChange={(v) => setNewTier({ ...newTier, minPrice: v })}
                            placeholder="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div style={{ width: 130 }}>
                          <TextField
                            id="tier-max"
                            label="Max price ($)"
                            type="number"
                            name="maxPrice"
                            value={newTier.maxPrice}
                            onChange={(v) => setNewTier({ ...newTier, maxPrice: v })}
                            placeholder="100"
                            step="0.01"
                            required
                          />
                        </div>
                        <div style={{ width: 140 }}>
                          <TextField
                            id="tier-adjustment"
                            label="Adjustment (%)"
                            type="number"
                            name="adjustmentPercent"
                            value={newTier.adjustmentPercent}
                            onChange={(v) => setNewTier({ ...newTier, adjustmentPercent: v })}
                            placeholder="10 or -10"
                            step="1"
                            required
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="cc-btn" onClick={() => { setShowAddForm(false); setNewTier({ minPrice: "", maxPrice: "", adjustmentPercent: "" }); }}>
                            Cancel
                          </button>
                          <button type="submit" className="cc-btn cc-btn--primary" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    </Form>
                  </div>
                </div>
              )}

              <div className="cc-card__flush" style={{ paddingTop: 10 }}>
                {priceTiers.length > 0 ? (
                  <div className="cc-table-wrap">
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>Price range</th>
                          <th>Margin adjustment</th>
                          <th>Example</th>
                          <th><span className="cc-visually-hidden">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceTiers.map((tier) => (
                          <tr key={tier.id}>
                            {editingId === tier.id ? (
                              <td colSpan="4" style={{ background: "var(--cc-surface-2)" }}>
                                <Form method="post">
                                  <input type="hidden" name="intent" value="update" />
                                  <input type="hidden" name="id" value={tier.id} />
                                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <span className="cc-muted">$</span>
                                      <input
                                        className="cc-input cc-num"
                                        type="number"
                                        name="minPrice"
                                        aria-label="Min price"
                                        value={editTier.minPrice}
                                        onChange={(e) => setEditTier({ ...editTier, minPrice: e.target.value })}
                                        step="0.01"
                                        style={inlineInput(100)}
                                        required
                                      />
                                      <span className="cc-muted">to $</span>
                                      <input
                                        className="cc-input cc-num"
                                        type="number"
                                        name="maxPrice"
                                        aria-label="Max price"
                                        value={editTier.maxPrice}
                                        onChange={(e) => setEditTier({ ...editTier, maxPrice: e.target.value })}
                                        step="0.01"
                                        style={inlineInput(100)}
                                        required
                                      />
                                    </div>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <span className="cc-muted">Margin</span>
                                      <input
                                        className="cc-input cc-num"
                                        type="number"
                                        name="adjustmentPercent"
                                        aria-label="Margin adjustment (%)"
                                        value={editTier.adjustmentPercent}
                                        onChange={(e) => setEditTier({ ...editTier, adjustmentPercent: e.target.value })}
                                        step="1"
                                        style={inlineInput(84)}
                                        required
                                      />
                                      <span className="cc-muted">%</span>
                                    </div>
                                    <span className="cc-muted cc-num cc-small">
                                      ${editTier.minPrice || 0} → ${((parseFloat(editTier.minPrice) || 0) * (1 + (parseFloat(editTier.adjustmentPercent) || 0) / 100)).toFixed(2)}
                                    </span>
                                    <span className="cc-spacer" />
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button type="button" className="cc-btn" onClick={cancelEditing}>Cancel</button>
                                      <button type="submit" className="cc-btn cc-btn--primary" disabled={isSubmitting}>
                                        {isSubmitting ? "Saving..." : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                </Form>
                              </td>
                            ) : (
                              <>
                                <td className="cc-num">
                                  ${tier.minPrice.toLocaleString()} – ${tier.maxPrice.toLocaleString()}
                                </td>
                                <td>
                                  <Badge tone={adjustmentTone(tier.adjustmentPercent)}>
                                    {formatAdjustment(tier.adjustmentPercent)}
                                  </Badge>
                                </td>
                                <td className="cc-num cc-muted">
                                  ${tier.minPrice} → ${(tier.minPrice * (1 + tier.adjustmentPercent / 100)).toFixed(2)}
                                </td>
                                <td>
                                  <div className="cc-rowact">
                                    <Form
                                      method="post"
                                      style={{ display: "inline" }}
                                      ref={(el) => { if (el) deleteFormRefs.current[tier.id] = el; else delete deleteFormRefs.current[tier.id]; }}
                                    >
                                      <input type="hidden" name="intent" value="delete" />
                                      <input type="hidden" name="id" value={tier.id} />
                                      <button type="button" className="cc-btn cc-btn--plain cc-btn--critical" onClick={() => setDeleteTarget(tier)}>
                                        Delete
                                      </button>
                                    </Form>
                                    <button type="button" className="cc-btn" onClick={() => startEditing(tier)}>
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No price tiers yet">
                    Add a tier, or load the default tiers above.
                  </EmptyState>
                )}
              </div>
            </div>

            {priceTiers.length > 0 && (
              <div className="cc-card">
                <div className="cc-card__head"><h2>Reset tiers</h2></div>
                <div className="cc-card__body">
                  <Form method="post" ref={resetFormRef} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <input type="hidden" name="intent" value="bulk_create" />
                    <input type="hidden" name="tiers" value={JSON.stringify(defaultTiers)} />
                    <span className="cc-muted" style={{ flex: 1, minWidth: 220 }}>
                      Delete all current tiers and load the 28 default tiers.
                    </span>
                    <button type="button" className="cc-btn cc-btn--critical" disabled={isSubmitting} onClick={() => setConfirmReset(true)}>
                      {isSubmitting ? "Resetting..." : "Reset to default tiers"}
                    </button>
                  </Form>
                </div>
              </div>
            )}
          </div>

          <div className="cc-side">
            <div className="cc-card">
              <div className="cc-card__head"><h2>About price margins</h2></div>
              <div className="cc-card__body">
                <p className="cc-p cc-muted">
                  Margins adjust the final price based on the calculated subtotal (fabric, fill, shipping and labour).
                  Use a positive percentage to raise prices on smaller orders and a negative one to discount larger orders.
                </p>
                <div className="cc-calc">
                  <div><span>Final price</span><span>Subtotal + (Subtotal × Margin %)</span></div>
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>How the defaults work</h2></div>
              <div className="cc-card__body" style={{ gap: 10 }}>
                <div>
                  <div className="cc-label">Smaller orders (price goes up)</div>
                  <div className="cc-muted cc-small cc-num">$0–$30 → +100%</div>
                  <div className="cc-muted cc-small cc-num">$31–$50 → +90%</div>
                  <div className="cc-muted cc-small">…</div>
                </div>
                <div>
                  <div className="cc-label">Break-even</div>
                  <div className="cc-muted cc-small cc-num">$276–$300 → 0% (no change)</div>
                </div>
                <div>
                  <div className="cc-label">Larger orders (discount)</div>
                  <div className="cc-muted cc-small cc-num">$301–$325 → −5%</div>
                  <div className="cc-muted cc-small">…</div>
                  <div className="cc-muted cc-small cc-num">$10,001–$20,000 → −75%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this price tier?"
        confirmLabel="Delete tier"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        <p className="cc-p">
          {deleteTarget && `$${deleteTarget.minPrice.toLocaleString()} – $${deleteTarget.maxPrice.toLocaleString()} will no longer get a margin adjustment. `}
          This can’t be undone.
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={confirmReset}
        title="Reset to default tiers?"
        confirmLabel="Reset tiers"
        onCancel={() => setConfirmReset(false)}
        onConfirm={confirmResetTiers}
      >
        <p className="cc-p">All {priceTiers.length} current tiers will be deleted and replaced with the 28 default tiers.</p>
      </ConfirmModal>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
