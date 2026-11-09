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
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const handleDelete = (item) => setDeleteTarget(item);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const data = new FormData();
    data.append("intent", "delete");
    data.append("id", deleteTarget.id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Ties option deleted");
    setDeleteTarget(null);
  };

  // Stable close handler so the modal doesn't re-focus its first field on every keystroke.
  const closeForm = useCallback(() => {
    setShowForm(false);
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
  }, [tiesOptions.length]);

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default ties option updated");
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  return (
    <s-page heading="Ties options" inlineSize="large">
      <s-button slot="primary-action" variant="primary" onClick={openAdd}>
        Add ties option
      </s-button>

      <div className="cc-page">
        <Card title="Settings">
          <div style={{ display: "grid", gap: 10 }}>
            <Checkbox
              id="tiesIncludeInShippingLabour"
              checked={includeInShippingLabour}
              onChange={(val) => {
                setIncludeInShippingLabour(val);
                const data = new FormData();
                data.append("intent", "updateTiesSettings");
                data.append("tiesIncludeInShippingLabour", val.toString());
                fetcher.submit(data, { method: "POST" });
                shopify.toast.show(val ? "Ties included in shipping & labour" : "Ties excluded from shipping & labour");
              }}
              label="Include ties in shipping & labour calculation"
              help="Controls whether the ties cost is part of the base amount used to calculate the shipping and labour percentages."
            />
            <div className="cc-banner cc-small">
              {includeInShippingLabour
                ? "Ties cost is included in the base for shipping & labour percentage calculations."
                : "Ties cost is not included in the base for shipping & labour percentage calculations. Ties are still added to the final price."}
            </div>
          </div>
        </Card>
        <Card title="Options" meta={`${tiesOptions.length} total`} flush>
          {tiesOptions.length === 0 ? (
            <EmptyState
              title="No ties options yet"
              action={<button type="button" className="cc-btn cc-btn--primary" onClick={openAdd}>Add ties option</button>}
            >
              Add an option for customers to choose in the calculator.
            </EmptyState>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Price</th>
                    <th>Sort order</th>
                    <th>Status</th>
                    <th><span className="cc-visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {tiesOptions.map((item) => (
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
                      <td className="cc-num">${item.price.toFixed(2)}</td>
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
        title={editingItem ? `Edit ${editingItem.name}` : "Add ties option"}
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
          id="tiesName"
          label="Name"
          value={formData.name}
          onChange={(v) => setFormData({ ...formData, name: v })}
          placeholder="e.g., 2 Ties"
          required
        />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="tiesImageUrl"
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
            id="tiesPrice"
            label="Price ($)"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(v) => setFormData({ ...formData, price: parseFloat(v) || 0 })}
            help="Fixed dollar amount added to the total."
          />
          <TextField
            id="tiesSortOrder"
            label="Sort order"
            type="number"
            value={formData.sortOrder}
            onChange={(v) => setFormData({ ...formData, sortOrder: parseInt(v) || 0 })}
          />
        </div>
        <TextArea
          id="tiesDescription"
          label="Description"
          value={formData.description}
          onChange={(v) => setFormData({ ...formData, description: v })}
          placeholder="Optional description"
          rows={2}
        />
        <Checkbox
          id="tiesActive"
          checked={formData.isActive}
          onChange={(v) => setFormData({ ...formData, isActive: v })}
          label="Active"
        />
        <Checkbox
          id="tiesDefault"
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
        <p className="cc-p">This ties option will be permanently removed and customers will no longer be able to choose it. This can’t be undone.</p>
      </ConfirmModal>
    </s-page>
  );
}
