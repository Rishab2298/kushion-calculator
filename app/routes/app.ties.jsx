import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const tiesOptions = await prisma.tiesOption.findMany({
    where: { shop },
    orderBy: { sortOrder: "asc" },
  });

  let settings = await prisma.calculatorSettings.findUnique({
    where: { shop },
  });
  if (!settings) {
    settings = await prisma.calculatorSettings.create({
      data: { shop },
    });
  }

  return { tiesOptions, shop, tiesIncludeInShippingLabour: settings.tiesIncludeInShippingLabour };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create" || intent === "update") {
    const data = {
      shop,
      name: formData.get("name"),
      imageUrl: formData.get("imageUrl") || null,
      price: parseFloat(formData.get("price")) || 0,
      description: formData.get("description") || null,
      isActive: formData.get("isActive") === "true",
      isDefault: formData.get("isDefault") === "true",
      sortOrder: parseInt(formData.get("sortOrder")) || 0,
    };

    if (data.isDefault) {
      await prisma.tiesOption.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }

    if (intent === "create") {
      await prisma.tiesOption.create({ data });
    } else {
      await prisma.tiesOption.update({
        where: { id: formData.get("id") },
        data,
      });
    }
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.tiesOption.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  if (intent === "setDefault") {
    const id = formData.get("id");
    await prisma.tiesOption.updateMany({ where: { shop }, data: { isDefault: false } });
    await prisma.tiesOption.update({ where: { id }, data: { isDefault: true } });
    return { success: true };
  }

  if (intent === "updateTiesSettings") {
    const tiesIncludeInShippingLabour = formData.get("tiesIncludeInShippingLabour") === "true";
    await prisma.calculatorSettings.upsert({
      where: { shop },
      update: { tiesIncludeInShippingLabour },
      create: { shop, tiesIncludeInShippingLabour },
    });
    invalidateConfigCache(shop);
    return { success: true };
  }

  return { success: false };
};

export default function Ties() {
  const { tiesOptions, tiesIncludeInShippingLabour } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [includeInShippingLabour, setIncludeInShippingLabour] = useState(tiesIncludeInShippingLabour);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    price: 0,
    description: "",
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      price: 0,
      description: "",
      isActive: true,
      isDefault: false,
      sortOrder: tiesOptions.length,
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      imageUrl: item.imageUrl || "",
      price: item.price,
      description: item.description || "",
      isActive: item.isActive,
      isDefault: item.isDefault,
      sortOrder: item.sortOrder,
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const data = new FormData();
    data.append("intent", editingItem ? "update" : "create");
    if (editingItem) data.append("id", editingItem.id);
    Object.entries(formData).forEach(([key, value]) => data.append(key, value.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingItem ? "Ties option updated" : "Ties option created");
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this ties option?")) {
      const data = new FormData();
      data.append("intent", "delete");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show("Ties option deleted");
    }
  };

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default ties option updated");
  };

  return (
    <s-page heading="Ties Options" fullWidth>
      <s-button slot="primary-action" onClick={() => { resetForm(); setShowForm(true); }}>
        Add Ties Option
      </s-button>

      <s-section heading="Ties Settings">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Control whether ties cost is included in the base amount used to calculate shipping and labour percentages.
            </s-paragraph>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeInShippingLabour}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setIncludeInShippingLabour(val);
                    const data = new FormData();
                    data.append("intent", "updateTiesSettings");
                    data.append("tiesIncludeInShippingLabour", val.toString());
                    fetcher.submit(data, { method: "POST" });
                    shopify.toast.show(val ? "Ties included in shipping & labour" : "Ties excluded from shipping & labour");
                  }}
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ fontWeight: "500" }}>Include ties in shipping & labour calculation</span>
              </label>
            </div>
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-text fontSize="small">
                {includeInShippingLabour
                  ? "Ties cost IS included in the base for shipping & labour percentage calculations."
                  : "Ties cost is NOT included in the base for shipping & labour percentage calculations. Ties will still be added to the final price."}
              </s-text>
            </s-box>
          </s-stack>
        </s-box>
      </s-section>

      {showForm && (
        <s-section heading={editingItem ? "Edit Ties Option" : "Create Ties Option"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 2 Ties"
                required
              />

              <s-text-field
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.png"
              />

              <s-text-field
                label="Price ($)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                helpText="Fixed dollar amount added to total"
              />

              <s-text-field
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />

              <s-text-field
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />

              <s-stack direction="inline" gap="base">
                <input
                  type="checkbox"
                  id="tiesActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="tiesActive">Active</label>
              </s-stack>

              <s-stack direction="inline" gap="base">
                <input
                  type="checkbox"
                  id="tiesDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="tiesDefault">Set as Default</label>
              </s-stack>

              <s-stack direction="inline" gap="base">
                <s-button onClick={handleSubmit}>
                  {editingItem ? "Update" : "Create"}
                </s-button>
                <s-button variant="tertiary" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </s-button>
              </s-stack>
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Ties Options (${tiesOptions.length})`}>
        {tiesOptions.length === 0 ? (
          <s-box padding="base">
            <s-paragraph>No ties options created yet.</s-paragraph>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {tiesOptions.map((item) => (
              <s-box
                key={item.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background={item.isActive ? "default" : "subdued"}
              >
                <s-stack direction="inline" gap="base" align="center" wrap>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 50, height: 50, background: "#f0f0f0", borderRadius: 6 }} />
                  )}

                  <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                    <s-stack direction="inline" gap="tight" align="center">
                      <s-text fontWeight="semibold">{item.name}</s-text>
                      {item.isDefault && <s-badge tone="info">Default</s-badge>}
                      {!item.isActive && <s-text tone="subdued" fontSize="small">(Inactive)</s-text>}
                    </s-stack>
                    <s-text tone="subdued" fontSize="small">
                      ${item.price.toFixed(2)}
                    </s-text>
                  </s-stack>

                  <s-stack direction="inline" gap="tight">
                    <s-button variant="tertiary" onClick={() => handleEdit(item)}>Edit</s-button>
                    {!item.isDefault && (
                      <s-button variant="tertiary" onClick={() => handleSetDefault(item.id)}>Set Default</s-button>
                    )}
                    <s-button variant="tertiary" tone="critical" onClick={() => handleDelete(item.id)}>Delete</s-button>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}
