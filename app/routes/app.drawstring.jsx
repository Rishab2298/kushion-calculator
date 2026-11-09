import { useCallback, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Card, Badge, StatusBadge, TextField, TextArea, Checkbox, Modal, ConfirmModal, Thumb, EmptyState } from "../components/admin-ui";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const drawstringOptions = await prisma.drawstringOption.findMany({
    where: { shop },
    orderBy: { sortOrder: "asc" },
  });

  return { drawstringOptions, shop };
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
      await prisma.drawstringOption.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }

    if (intent === "create") {
      await prisma.drawstringOption.create({ data });
    } else {
      await prisma.drawstringOption.update({
        where: { id: formData.get("id") },
        data,
      });
    }
    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.drawstringOption.delete({ where: { id: formData.get("id") } });
    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "setDefault") {
    const id = formData.get("id");
    await prisma.drawstringOption.updateMany({ where: { shop }, data: { isDefault: false } });
    await prisma.drawstringOption.update({ where: { id }, data: { isDefault: true } });
    invalidateConfigCache(shop);
    return { success: true };
  }

  return { success: false };
};

export default function Drawstring() {
  const { drawstringOptions } = useLoaderData();
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
      sortOrder: drawstringOptions.length,
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
    shopify.toast.show(editingItem ? "Drawstring option updated" : "Drawstring option created");
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (item) => setDeleteTarget(item);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const data = new FormData();
    data.append("intent", "delete");
    data.append("id", deleteTarget.id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Drawstring option deleted");
    setDeleteTarget(null);
  };

  // Stable close handler so the modal doesn't re-focus its first field on every keystroke.
  const closeForm = useCallback(() => {
    setShowForm(false);
    setFormData({
      name: "",
      imageUrl: "",
      percent: 0,
      description: "",
      isActive: true,
      isDefault: false,
      sortOrder: drawstringOptions.length,
    });
    setEditingItem(null);
  }, [drawstringOptions.length]);

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default drawstring option updated");
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  return (
    <s-page heading="Drawstring options" inlineSize="large">
      <s-button slot="primary-action" variant="primary" onClick={openAdd}>
        Add drawstring option
      </s-button>

      <div className="cc-page">
        <p className="cc-p cc-muted">Drawstring options add a percentage of the subtotal to the total. This is commonly used for items that need a drawstring closure.</p>
        <Card title="Options" meta={`${drawstringOptions.length} total`} flush>
          {drawstringOptions.length === 0 ? (
            <EmptyState
              title="No drawstring options yet"
              action={<button type="button" className="cc-btn cc-btn--primary" onClick={openAdd}>Add drawstring option</button>}
            >
              Add an option for customers to choose in the calculator.
            </EmptyState>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Percent of subtotal</th>
                    <th>Sort order</th>
                    <th>Status</th>
                    <th><span className="cc-visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {drawstringOptions.map((item) => (
                    <tr
                      key={item.id}
                      className={`cc-clickable${item.isActive ? "" : " cc-row--inactive"}`}
                      tabIndex={0}
                      onClick={() => handleEdit(item)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) handleEdit(item); }}
                    >
                      <td>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Thumb src={item.imageUrl} alt={item.name} />
                          <div style={{ minWidth: 0 }}>
                            <div className="cc-name">{item.name}</div>
                            {item.description && <div className="cc-muted cc-small">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="cc-num">{item.percent}%</td>
                      <td className="cc-num cc-muted">{item.sortOrder}</td>
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
                          <button type="button" className="cc-btn cc-btn--plain cc-btn--critical" style={{ color: "var(--cc-crit)" }} onClick={() => handleDelete(item)}>Delete</button>
                          <button type="button" className="cc-btn" onClick={() => handleEdit(item)}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={showForm}
        title={editingItem ? `Edit ${editingItem.name}` : "Add drawstring option"}
        onClose={closeForm}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeForm}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={handleSubmit}>
              {editingItem ? "Save" : "Create"}
            </button>
          </>
        }
      >
        <TextField
          id="drawstringName"
          label="Name"
          value={formData.name}
          onChange={(v) => setFormData({ ...formData, name: v })}
          placeholder="e.g., Standard Drawstring"
          required
        />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="drawstringImageUrl"
              label="Image URL"
              value={formData.imageUrl}
              onChange={(v) => setFormData({ ...formData, imageUrl: v })}
              placeholder="https://example.com/image.png"
            />
          </div>
          {formData.imageUrl && <Thumb src={formData.imageUrl} alt="Preview" />}
        </div>
        <div className="cc-row2">
          <TextField
            id="drawstringPercent"
            label="Percentage of subtotal (%)"
            type="number"
            step="0.01"
            value={formData.percent}
            onChange={(v) => setFormData({ ...formData, percent: parseFloat(v) || 0 })}
            help="This percentage is added to the subtotal."
          />
          <TextField
            id="drawstringSortOrder"
            label="Sort order"
            type="number"
            value={formData.sortOrder}
            onChange={(v) => setFormData({ ...formData, sortOrder: parseInt(v) || 0 })}
          />
        </div>
        <TextArea
          id="drawstringDescription"
          label="Description"
          value={formData.description}
          onChange={(v) => setFormData({ ...formData, description: v })}
          placeholder="Optional description"
          rows={2}
        />
        <Checkbox
          id="drawstringActive"
          checked={formData.isActive}
          onChange={(v) => setFormData({ ...formData, isActive: v })}
          label="Active"
        />
        <Checkbox
          id="drawstringDefault"
          checked={formData.isDefault}
          onChange={(v) => setFormData({ ...formData, isDefault: v })}
          label="Default option"
        />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete “${deleteTarget?.name}”?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        <p className="cc-p">This drawstring option will be permanently removed and customers will no longer be able to choose it. This can’t be undone.</p>
      </ConfirmModal>
    </s-page>
  );
}
