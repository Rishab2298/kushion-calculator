import { useCallback, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, StatusBadge, TextField, TextArea, Checkbox, Modal, ConfirmModal, Thumb, EmptyState } from "../components/admin-ui";

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
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    const data = new FormData();
    data.append("intent", "delete");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Button style deleted");
  };

  const confirmDelete = () => {
    if (deleteTarget) handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default button style updated");
  };

  const handleAdd = () => { resetForm(); setShowForm(true); };

  // Stable reference so the modal doesn't refocus its first field on every keystroke.
  const closeForm = useCallback(() => {
    setShowForm(false);
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
  }, [buttonStyleOptions.length]);

  const setField = (field, value) => setFormData((f) => ({ ...f, [field]: value }));

  return (
    <s-page heading="Button style options" inlineSize="large">
      <s-button slot="primary-action" variant="primary" onClick={handleAdd}>
        Add button style
      </s-button>

      <div className="cc-page">
        <div className="cc-card">
          {buttonStyleOptions.length === 0 ? (
            <EmptyState
              title="No button styles yet"
              action={<button type="button" className="cc-btn cc-btn--primary" onClick={handleAdd}>Add button style</button>}
            >
              Add a button style customers can choose in the calculator.
            </EmptyState>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Style</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th><span className="cc-visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {buttonStyleOptions.map((item) => (
                    <tr
                      key={item.id}
                      className={`cc-clickable${item.isActive ? "" : " cc-row--inactive"}`}
                      tabIndex={0}
                      onClick={() => handleEdit(item)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) handleEdit(item); }}
                    >
                      <td>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <Thumb src={item.imageUrl} alt={item.name} />
                          <div style={{ minWidth: 0 }}>
                            <span className="cc-name">{item.name}</span>
                            {item.description && <div className="cc-muted cc-small">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="cc-num">{item.percent}% <span className="cc-muted">of subtotal</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <StatusBadge active={item.isActive} />
                          {item.isDefault && <Badge tone="info">Default</Badge>}
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="cc-rowact">
                          {!item.isDefault && (
                            <button type="button" className="cc-btn cc-btn--plain" onClick={() => handleSetDefault(item.id)}>Set as default</button>
                          )}
                          <button type="button" className="cc-btn cc-btn--plain cc-btn--critical" onClick={() => setDeleteTarget(item)}>Delete</button>
                          <button type="button" className="cc-btn" onClick={() => handleEdit(item)}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showForm}
        title={editingItem ? `Edit ${editingItem.name}` : "Add button style"}
        onClose={closeForm}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeForm}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={handleSubmit}>{editingItem ? "Save" : "Create"}</button>
          </>
        }
      >
        <TextField
          id="button-name"
          label="Name"
          value={formData.name}
          onChange={(v) => setField("name", v)}
          placeholder="e.g., Tufted, Diamond Tufted"
          required
        />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="button-image"
              label="Image URL"
              value={formData.imageUrl}
              onChange={(v) => setField("imageUrl", v)}
              placeholder="https://example.com/image.png"
            />
          </div>
          {formData.imageUrl && <Thumb src={formData.imageUrl} alt={formData.name} />}
        </div>
        <TextArea
          id="button-description"
          label="Description"
          value={formData.description}
          onChange={(v) => setField("description", v)}
          placeholder="Optional description"
          rows={2}
        />
        <div className="cc-row2">
          <TextField
            id="button-percent"
            label="Percentage of subtotal (%)"
            type="number"
            value={formData.percent}
            onChange={(v) => setField("percent", parseFloat(v) || 0)}
            help="This percentage is added to the subtotal."
          />
          <TextField
            id="button-sort"
            label="Sort order"
            type="number"
            value={formData.sortOrder}
            onChange={(v) => setField("sortOrder", parseInt(v) || 0)}
            help="Lower numbers appear first."
          />
        </div>
        <Checkbox id="button-active" checked={formData.isActive} onChange={(v) => setField("isActive", v)} label="Active" />
        <Checkbox id="button-default" checked={formData.isDefault} onChange={(v) => setField("isDefault", v)} label="Default option" />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete “${deleteTarget?.name}”?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        <p className="cc-p">This button style will be removed from the calculator. This can’t be undone.</p>
      </ConfirmModal>
    </s-page>
  );
}
