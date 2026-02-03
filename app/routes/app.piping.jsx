import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const options = await prisma.pipingOption.findMany({
    where: { shop: session.shop },
    orderBy: { sortOrder: "asc" },
  });
  return { options };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const isDefault = formData.get("isDefault") === "true";
    if (isDefault) {
      await prisma.pipingOption.updateMany({ where: { shop, isDefault: true }, data: { isDefault: false } });
    }
    await prisma.pipingOption.create({
      data: {
        shop, name: formData.get("name"), imageUrl: formData.get("imageUrl") || null,
        percent: parseFloat(formData.get("percent")) || 0, description: formData.get("description") || null,
        isActive: true, isDefault, sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }
  if (intent === "update") {
    const isDefault = formData.get("isDefault") === "true";
    if (isDefault) {
      await prisma.pipingOption.updateMany({ where: { shop, isDefault: true }, data: { isDefault: false } });
    }
    await prisma.pipingOption.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"), imageUrl: formData.get("imageUrl") || null,
        percent: parseFloat(formData.get("percent")) || 0, description: formData.get("description") || null,
        isActive: formData.get("isActive") === "true", isDefault, sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }
  if (intent === "delete") {
    await prisma.pipingOption.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }
  return { success: false };
};

export default function Piping() {
  const { options } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", imageUrl: "", percent: 0, description: "", sortOrder: 0, isActive: true, isDefault: false });

  const reset = () => { setForm({ name: "", imageUrl: "", percent: 0, description: "", sortOrder: options.length, isActive: true, isDefault: false }); setEditing(null); };
  const handleEdit = (item) => { setForm({ name: item.name, imageUrl: item.imageUrl || "", percent: item.percent, description: item.description || "", sortOrder: item.sortOrder, isActive: item.isActive, isDefault: item.isDefault }); setEditing(item); setShowForm(true); };

  const submit = () => {
    const data = new FormData();
    data.append("intent", editing ? "update" : "create");
    if (editing) data.append("id", editing.id);
    Object.entries(form).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editing ? "Updated" : "Created");
    setShowForm(false); reset();
  };

  const handleDelete = (id) => { if (confirm("Delete?")) { const data = new FormData(); data.append("intent", "delete"); data.append("id", id); fetcher.submit(data, { method: "POST" }); } };

  return (
    <s-page heading="Piping Options" fullWidth>
      <s-button slot="primary-action" onClick={() => { reset(); setShowForm(true); }}>Add Option</s-button>

      {showForm && (
        <s-section heading={editing ? "Edit Option" : "Add Option"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text-field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Standard Piping, Premium Piping" required />
              <s-text-field label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              <s-text-field label="Percentage of Subtotal (%)" type="number" value={form.percent} onChange={(e) => setForm({ ...form, percent: parseFloat(e.target.value) || 0 })} step="0.1" helpText="This percentage will be added to the subtotal" />
              <s-text-field label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <s-text-field label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              <s-stack direction="inline" gap="loose">
                <s-stack direction="inline" gap="base">
                  <input type="checkbox" id="active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><label htmlFor="active">Active</label>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <input type="checkbox" id="default" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /><label htmlFor="default">Set as Default</label>
                </s-stack>
              </s-stack>
              <s-stack direction="inline" gap="base">
                <s-button onClick={submit}>{editing ? "Update" : "Create"}</s-button>
                <s-button variant="tertiary" onClick={() => { setShowForm(false); reset(); }}>Cancel</s-button>
              </s-stack>
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Options (${options.length})`}>
        {options.length === 0 ? <s-box padding="base"><s-paragraph>No piping options yet.</s-paragraph></s-box> : (
          <s-stack direction="block" gap="base">
            {options.map((item) => (
              <s-box key={item.id} padding="base" borderWidth="base" borderRadius="base" background={item.isActive ? "default" : "subdued"}>
                <s-stack direction="inline" gap="base" align="center" wrap>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 6 }} />}
                  <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                    <s-stack direction="inline" gap="tight" align="center">
                      <s-text fontWeight="semibold">{item.name}</s-text>
                      {item.isDefault && <s-badge tone="info">Default</s-badge>}
                    </s-stack>
                    <s-text tone="subdued">{item.percent}% of subtotal</s-text>
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
    </s-page>
  );
}
