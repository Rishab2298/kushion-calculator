import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const designOptions = await prisma.designOption.findMany({
    where: { shop },
    orderBy: { sortOrder: "asc" },
  });

  return { designOptions, shop };
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
      percent: parseFloat(formData.get("percent")) || 0,
      description: formData.get("description") || null,
      isActive: formData.get("isActive") === "true",
      isDefault: formData.get("isDefault") === "true",
      sortOrder: parseInt(formData.get("sortOrder")) || 0,
    };

    if (data.isDefault) {
      await prisma.designOption.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }

    if (intent === "create") {
      await prisma.designOption.create({ data });
    } else {
      await prisma.designOption.update({
        where: { id: formData.get("id") },
        data,
      });
    }
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.designOption.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  if (intent === "setDefault") {
    const id = formData.get("id");
    await prisma.designOption.updateMany({ where: { shop }, data: { isDefault: false } });
    await prisma.designOption.update({ where: { id }, data: { isDefault: true } });
    return { success: true };
  }

  return { success: false };
};

export default function Design() {
  const { designOptions } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    percent: 0,
    description: "",
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      percent: 0,
      description: "",
      isActive: true,
      isDefault: false,
      sortOrder: designOptions.length,
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      imageUrl: item.imageUrl || "",
      percent: item.percent,
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
    shopify.toast.show(editingItem ? "Design option updated" : "Design option created");
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this design option?")) {
      const data = new FormData();
      data.append("intent", "delete");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show("Design option deleted");
    }
  };

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default design option updated");
  };

  return (
    <s-page heading="Design Options" fullWidth>
      <s-button slot="primary-action" onClick={() => { resetForm(); setShowForm(true); }}>
        Add Design Option
      </s-button>

      <s-section>
        <s-box padding="base" background="subdued" borderRadius="base">
          <s-text>Design options add a percentage of the fabric cost to the total. This is useful for patterned or custom designs that require extra work.</s-text>
        </s-box>
      </s-section>

      {showForm && (
        <s-section heading={editingItem ? "Edit Design Option" : "Create Design Option"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Custom Pattern"
                required
              />

              <s-text-field
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.png"
              />

              <s-text-field
                label="Percentage of Fabric Cost (%)"
                type="number"
                value={formData.percent}
                onChange={(e) => setFormData({ ...formData, percent: parseFloat(e.target.value) || 0 })}
                helpText="This percentage of the fabric cost will be added to the total"
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
                  id="designActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="designActive">Active</label>
              </s-stack>

              <s-stack direction="inline" gap="base">
                <input
                  type="checkbox"
                  id="designDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="designDefault">Set as Default</label>
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

      <s-section heading={`Design Options (${designOptions.length})`}>
        {designOptions.length === 0 ? (
          <s-box padding="base">
            <s-paragraph>No design options created yet.</s-paragraph>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {designOptions.map((item) => (
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
                      {item.percent}% of fabric cost
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
