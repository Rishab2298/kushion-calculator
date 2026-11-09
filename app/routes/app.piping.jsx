import { useCallback, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, StatusBadge, TextField, TextArea, Checkbox, Modal, ConfirmModal, Thumb, EmptyState } from "../components/admin-ui";

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
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const handleDelete = (id) => { const data = new FormData(); data.append("intent", "delete"); data.append("id", id); fetcher.submit(data, { method: "POST" }); };
  const confirmDelete = () => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null); };

  const handleAdd = () => { reset(); setShowForm(true); };

  // Stable reference so the modal doesn't refocus its first field on every keystroke.
  const closeForm = useCallback(() => {
    setShowForm(false);
    setForm({ name: "", imageUrl: "", percent: 0, description: "", sortOrder: options.length, isActive: true, isDefault: false });
    setEditing(null);
  }, [options.length]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <s-page heading="Piping options" inlineSize="large">
      <s-button slot="primary-action" variant="primary" onClick={handleAdd}>Add piping option</s-button>

      <div className="cc-page">
        <div className="cc-card">
          {options.length === 0 ? (
            <EmptyState
              title="No piping options yet"
              action={<button type="button" className="cc-btn cc-btn--primary" onClick={handleAdd}>Add piping option</button>}
            >
              Add a piping option customers can choose in the calculator.
            </EmptyState>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th><span className="cc-visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((item) => (
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
        title={editing ? `Edit ${editing.name}` : "Add piping option"}
        onClose={closeForm}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeForm}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submit}>{editing ? "Save" : "Create"}</button>
          </>
        }
      >
        <TextField
          id="piping-name"
          label="Name"
          value={form.name}
          onChange={(v) => setField("name", v)}
          placeholder="e.g., Standard Piping, Premium Piping"
          required
        />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="piping-image"
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => setField("imageUrl", v)}
              placeholder="https://example.com/image.png"
            />
          </div>
          {form.imageUrl && <Thumb src={form.imageUrl} alt={form.name} />}
        </div>
        <TextArea
          id="piping-description"
          label="Description"
          value={form.description}
          onChange={(v) => setField("description", v)}
          placeholder="Optional description"
          rows={2}
        />
        <div className="cc-row2">
          <TextField
            id="piping-percent"
            label="Percentage of subtotal (%)"
            type="number"
            step="0.1"
            value={form.percent}
            onChange={(v) => setField("percent", parseFloat(v) || 0)}
            help="This percentage is added to the subtotal."
          />
          <TextField
            id="piping-sort"
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(v) => setField("sortOrder", parseInt(v) || 0)}
            help="Lower numbers appear first."
          />
        </div>
        <Checkbox id="piping-active" checked={form.isActive} onChange={(v) => setField("isActive", v)} label="Active" />
        <Checkbox id="piping-default" checked={form.isDefault} onChange={(v) => setField("isDefault", v)} label="Default option" />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete “${deleteTarget?.name}”?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        <p className="cc-p">This piping option will be removed from the calculator. This can’t be undone.</p>
      </ConfirmModal>
    </s-page>
  );
}
