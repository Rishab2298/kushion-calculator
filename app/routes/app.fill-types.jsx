import { useCallback, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, StatusBadge, TextField, Checkbox, Modal, ConfirmModal, Thumb, EmptyState } from "../components/admin-ui";

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

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = (id) => {
    const data = new FormData();
    data.append("intent", "delete");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Fill type deleted");
  };

  const confirmDelete = () => {
    if (deleteTarget) handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Stable so the modal doesn't re-focus its first field on every keystroke.
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
  }, []);

  const handleAdd = () => { resetForm(); setShowForm(true); };

  return (
    <s-page heading="Fill Types" inlineSize="large">
      <s-button slot="primary-action" variant="primary" onClick={handleAdd}>
        Add fill type
      </s-button>

      <div className="cc-page">
        <div className="cc-card">
          <div className="cc-card__head">
            <h2>Fill types</h2>
            <span className="cc-card__meta">{fillTypes.length}</span>
          </div>
          <div className="cc-card__flush" style={{ paddingTop: 10 }}>
            {fillTypes.length === 0 ? (
              <EmptyState
                title="No fill types yet"
                action={<button type="button" className="cc-btn cc-btn--primary" onClick={handleAdd}>Add fill type</button>}
              >
                Add the fill materials customers can choose, such as polyfill or foam.
              </EmptyState>
            ) : (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Fill type</th>
                      <th>Price per cubic inch</th>
                      <th>Discount</th>
                      <th>Sort order</th>
                      <th>Status</th>
                      <th><span className="cc-visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fillTypes.map((item) => (
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
                        <td className="cc-num">${item.pricePerCubicInch.toFixed(4)}</td>
                        <td className="cc-num">
                          {item.discountEnabled && item.discountPercent > 0
                            ? <Badge tone="success">−{item.discountPercent}%</Badge>
                            : <span className="cc-muted">—</span>}
                        </td>
                        <td className="cc-num">{item.sortOrder}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <StatusBadge active={item.isActive} />
                            {item.isDefault && <Badge tone="info">Default</Badge>}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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

        <p className="cc-p cc-muted cc-small">
          Fill cost is the cushion’s volume × the price per cubic inch. For example, 200 cubic inches × $0.02 = $4.00.
        </p>
      </div>

      <Modal
        open={showForm}
        title={editing ? `Edit ${editing.name}` : "Add fill type"}
        onClose={closeForm}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeForm}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={handleSubmit}>{editing ? "Save" : "Create fill type"}</button>
          </>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Thumb src={formData.imageUrl} alt={formData.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="fill-name"
              label="Fill name"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
              placeholder="e.g. Polyfill, Memory foam, Microfiber"
              required
            />
          </div>
        </div>

        <TextField
          id="fill-image"
          label="Image URL"
          value={formData.imageUrl}
          onChange={(v) => setFormData({ ...formData, imageUrl: v })}
          placeholder="https://example.com/fill-image.jpg"
        />

        <TextField
          id="fill-description"
          label="Description"
          value={formData.description}
          onChange={(v) => setFormData({ ...formData, description: v })}
          placeholder="Soft and comfortable fill material"
        />

        <div className="cc-row2">
          <TextField
            id="fill-price"
            label="Price per cubic inch ($)"
            type="number"
            value={formData.pricePerCubicInch}
            onChange={(v) => setFormData({ ...formData, pricePerCubicInch: v })}
            placeholder="0.02"
            step="0.001"
            help="Fill cost = volume × this price."
            required
          />
          <TextField
            id="fill-sort"
            label="Sort order"
            type="number"
            value={formData.sortOrder}
            onChange={(v) => setFormData({ ...formData, sortOrder: parseInt(v) || 0 })}
            help="Lower numbers appear first."
          />
        </div>

        <div style={{ display: "grid", gap: 8, background: "var(--cc-surface-2)", border: "1px solid var(--cc-border)", borderRadius: 10, padding: 12 }}>
          <Checkbox
            id="discountEnabled"
            checked={formData.discountEnabled}
            onChange={(v) => setFormData({ ...formData, discountEnabled: v })}
            label="Discount the total"
            help="When on, this percentage is taken off the final total price."
          />
          {formData.discountEnabled && (
            <TextField
              id="fill-discount"
              label="Discount (%)"
              type="number"
              value={formData.discountPercent}
              onChange={(v) => setFormData({ ...formData, discountPercent: parseFloat(v) || 0 })}
              placeholder="e.g. 10"
              step="0.1"
              min="0"
              max="100"
            />
          )}
        </div>

        <Checkbox
          id="fillActive"
          checked={formData.isActive}
          onChange={(v) => setFormData({ ...formData, isActive: v })}
          label="Active"
          help="Inactive fill types are hidden from customers."
        />
        <Checkbox
          id="fillDefault"
          checked={formData.isDefault}
          onChange={(v) => setFormData({ ...formData, isDefault: v })}
          label="Default"
          help="Pre-selected for customers. Only one fill type can be the default."
        />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete “${deleteTarget?.name}”?`}
        confirmLabel="Delete fill type"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        <p className="cc-p">Customers will no longer be able to choose this fill. This can’t be undone.</p>
      </ConfirmModal>
    </s-page>
  );
}
