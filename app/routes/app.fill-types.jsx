import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const fillTypes = await prisma.fillType.findMany({
    where: { shop },
    orderBy: { sortOrder: "asc" },
  });

  return { fillTypes, shop };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const isDefault = formData.get("isDefault") === "true";
    // If setting as default, clear other defaults first
    if (isDefault) {
      await prisma.fillType.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }
    await prisma.fillType.create({
      data: {
        shop,
        name: formData.get("name"),
        imageUrl: formData.get("imageUrl") || null,
        pricePerCubicInch: parseFloat(formData.get("pricePerCubicInch")),
        description: formData.get("description") || null,
        isActive: formData.get("isActive") === "true",
        isDefault,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
        discountEnabled: formData.get("discountEnabled") === "true",
        discountPercent: parseFloat(formData.get("discountPercent")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "update") {
    const isDefault = formData.get("isDefault") === "true";
    // If setting as default, clear other defaults first
    if (isDefault) {
      await prisma.fillType.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }
    await prisma.fillType.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"),
        imageUrl: formData.get("imageUrl") || null,
        pricePerCubicInch: parseFloat(formData.get("pricePerCubicInch")),
        description: formData.get("description") || null,
        isActive: formData.get("isActive") === "true",
        isDefault,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
        discountEnabled: formData.get("discountEnabled") === "true",
        discountPercent: parseFloat(formData.get("discountPercent")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.fillType.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  return { success: false };
};

export default function FillTypes() {
  const { fillTypes } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    pricePerCubicInch: "",
    description: "",
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    discountEnabled: false,
    discountPercent: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      pricePerCubicInch: "",
      description: "",
      isActive: true,
      isDefault: false,
      sortOrder: fillTypes.length,
      discountEnabled: false,
      discountPercent: 0,
    });
    setEditing(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      imageUrl: item.imageUrl || "",
      pricePerCubicInch: item.pricePerCubicInch.toString(),
      description: item.description || "",
      isActive: item.isActive,
      isDefault: item.isDefault,
      sortOrder: item.sortOrder,
      discountEnabled: item.discountEnabled || false,
      discountPercent: item.discountPercent || 0,
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const data = new FormData();
    data.append("intent", editing ? "update" : "create");
    if (editing) data.append("id", editing.id);
    Object.entries(formData).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editing ? "Fill type updated" : "Fill type created");
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this fill type?")) {
      const data = new FormData();
      data.append("intent", "delete");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show("Fill type deleted");
    }
  };

  return (
    <s-page heading="Fill Types" fullWidth>
      <s-button slot="primary-action" onClick={() => { resetForm(); setShowForm(true); }}>
        Add Fill Type
      </s-button>

      {showForm && (
        <s-section heading={editing ? "Edit Fill Type" : "Add Fill Type"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Fill Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Polyfill, Memory Foam, Microfiber"
                required
              />

              <s-text-field
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/fill-image.jpg"
              />

              <s-text-field
                label="Price per Cubic Inch (USD)"
                type="number"
                value={formData.pricePerCubicInch}
                onChange={(e) => setFormData({ ...formData, pricePerCubicInch: e.target.value })}
                placeholder="0.02"
                step="0.001"
                prefix="$"
                required
              />

              <s-text-field
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Soft and comfortable fill material"
              />

              <s-text-field
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />

              <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
                <s-stack direction="block" gap="tight">
                  <s-stack direction="inline" gap="base">
                    <input
                      type="checkbox"
                      id="discountEnabled"
                      checked={formData.discountEnabled}
                      onChange={(e) => setFormData({ ...formData, discountEnabled: e.target.checked })}
                    />
                    <label htmlFor="discountEnabled" style={{ fontWeight: 500 }}>Enable Discount from Total</label>
                  </s-stack>
                  {formData.discountEnabled && (
                    <s-text-field
                      label="Discount Percentage"
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 10"
                      step="0.1"
                      min="0"
                      max="100"
                      suffix="%"
                    />
                  )}
                  <s-text fontSize="small" tone="subdued">
                    When enabled, this percentage is deducted from the final total price.
                  </s-text>
                </s-stack>
              </s-box>

              <s-stack direction="inline" gap="loose">
                <s-stack direction="inline" gap="base">
                  <input
                    type="checkbox"
                    id="fillActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="fillActive">Active</label>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <input
                    type="checkbox"
                    id="fillDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <label htmlFor="fillDefault">Set as Default (pre-selected for customers)</label>
                </s-stack>
              </s-stack>

              <s-stack direction="inline" gap="base">
                <s-button onClick={handleSubmit}>{editing ? "Update" : "Create"}</s-button>
                <s-button variant="tertiary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</s-button>
              </s-stack>
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Fill Types (${fillTypes.length})`}>
        {fillTypes.length === 0 ? (
          <s-box padding="base">
            <s-paragraph>No fill types created yet.</s-paragraph>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {fillTypes.map((item) => (
              <s-box key={item.id} padding="base" borderWidth="base" borderRadius="base" background={item.isActive ? "default" : "subdued"}>
                <s-stack direction="inline" gap="base" align="center" wrap>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999" }}>No image</div>
                  )}

                  <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                    <s-stack direction="inline" gap="tight" align="center">
                      <s-text fontWeight="semibold">{item.name}</s-text>
                      {item.isDefault && <s-badge tone="info">Default</s-badge>}
                      {item.discountEnabled && item.discountPercent > 0 && (
                        <s-badge tone="success">-{item.discountPercent}%</s-badge>
                      )}
                    </s-stack>
                    <s-text tone="subdued">${item.pricePerCubicInch.toFixed(4)} / cubic inch</s-text>
                    {item.description && <s-text fontSize="small" tone="subdued">{item.description}</s-text>}
                  </s-stack>

                  <s-stack direction="inline" gap="tight">
                    <s-button variant="tertiary" onClick={() => handleEdit(item)}>Edit</s-button>
                    <s-button variant="tertiary" tone="critical" onClick={() => handleDelete(item.id)}>Delete</s-button>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Pricing Info">
        <s-box padding="base">
          <s-paragraph>
            Fill cost is calculated as:<br/>
            <s-text fontWeight="semibold">Volume × Price per Cubic Inch</s-text>
          </s-paragraph>
          <s-paragraph style={{ marginTop: 12 }}>
            Example: 200 cubic inches × $0.02 = $4.00
          </s-paragraph>
        </s-box>
      </s-section>
    </s-page>
  );
}
