import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const buttonStyleOptions = await prisma.buttonStyleOption.findMany({
    where: { shop },
    orderBy: { sortOrder: "asc" },
  });

  return { buttonStyleOptions, shop };
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
      await prisma.buttonStyleOption.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }

    if (intent === "create") {
      await prisma.buttonStyleOption.create({ data });
    } else {
      await prisma.buttonStyleOption.update({
        where: { id: formData.get("id") },
        data,
      });
    }
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.buttonStyleOption.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  if (intent === "setDefault") {
    const id = formData.get("id");
    await prisma.buttonStyleOption.updateMany({ where: { shop }, data: { isDefault: false } });
    await prisma.buttonStyleOption.update({ where: { id }, data: { isDefault: true } });
    return { success: true };
  }

  return { success: false };
};

export default function ButtonStyle() {
  const { buttonStyleOptions } = useLoaderData();
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
      sortOrder: buttonStyleOptions.length,
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
    shopify.toast.show(editingItem ? "Button style updated" : "Button style created");
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this button style?")) {
      const data = new FormData();
      data.append("intent", "delete");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show("Button style deleted");
    }
  };

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default button style updated");
  };

  return (
    <s-page heading="Button Style Options" fullWidth>
      <s-button slot="primary-action" onClick={() => { resetForm(); setShowForm(true); }}>
        Add Button Style
      </s-button>

      {showForm && (
        <s-section heading={editingItem ? "Edit Button Style" : "Create Button Style"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tufted, Diamond Tufted"
                required
              />

              <s-text-field
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.png"
              />

              <s-text-field
                label="Percentage of Subtotal (%)"
                type="number"
                value={formData.percent}
                onChange={(e) => setFormData({ ...formData, percent: parseFloat(e.target.value) || 0 })}
                helpText="This percentage will be added to the subtotal"
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
                  id="buttonActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="buttonActive">Active</label>
              </s-stack>

              <s-stack direction="inline" gap="base">
                <input
                  type="checkbox"
                  id="buttonDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="buttonDefault">Set as Default</label>
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

      <s-section heading={`Button Styles (${buttonStyleOptions.length})`}>
        {buttonStyleOptions.length === 0 ? (
          <s-box padding="base">
            <s-paragraph>No button styles created yet.</s-paragraph>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {buttonStyleOptions.map((item) => (
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
                      {item.percent}% of subtotal
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
