import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, StatusBadge, TextField, Checkbox, ConfirmModal, BackButton, Thumb, EmptyState } from "../components/admin-ui";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  console.log("[SHAPES LOADER] Shop:", shop);

  const shapes = await prisma.shape.findMany({
    where: { shop },
    include: { inputFields: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  console.log("[SHAPES LOADER] Found shapes:", shapes.map(s => ({ id: s.id, name: s.name, isActive: s.isActive })));

  return { shapes, shop };
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
      surfaceAreaFormula: formData.get("surfaceAreaFormula"),
      surfaceAreaWithoutBaseFormula: formData.get("surfaceAreaWithoutBaseFormula") || null,
      volumeFormula: formData.get("volumeFormula"),
      isActive: formData.get("isActive") === "true",
      isDefault: formData.get("isDefault") === "true",
      sortOrder: parseInt(formData.get("sortOrder")) || 0,
      is2D: formData.get("is2D") === "true",
      enablePanels: formData.get("enablePanels") === "true",
      maxPanels: parseInt(formData.get("maxPanels")) || 10,
    };

    const inputFieldsJson = formData.get("inputFields");
    const inputFields = inputFieldsJson ? JSON.parse(inputFieldsJson) : [];

    if (intent === "create") {
      console.log("[SHAPES CREATE] Creating shape for shop:", shop, "Data:", JSON.stringify(data));
      const shape = await prisma.shape.create({
        data: {
          ...data,
          inputFields: {
            create: inputFields.map((f, idx) => ({
              label: f.label,
              key: f.key,
              unit: f.unit || "inches",
              min: parseFloat(f.min) || 1,
              max: parseFloat(f.max) || 200,
              required: f.required !== false,
              defaultValue: f.defaultValue ? parseFloat(f.defaultValue) : null,
              sortOrder: idx,
            })),
          },
        },
      });
      console.log("[SHAPES CREATE] Created shape:", shape.id, shape.name, "isActive:", shape.isActive);
      return { success: true, shape };
    } else {
      const id = formData.get("id");
      // Delete existing input fields and recreate
      await prisma.shapeInputField.deleteMany({ where: { shapeId: id } });
      const shape = await prisma.shape.update({
        where: { id },
        data: {
          ...data,
          inputFields: {
            create: inputFields.map((f, idx) => ({
              label: f.label,
              key: f.key,
              unit: f.unit || "inches",
              min: parseFloat(f.min) || 1,
              max: parseFloat(f.max) || 200,
              required: f.required !== false,
              defaultValue: f.defaultValue ? parseFloat(f.defaultValue) : null,
              sortOrder: idx,
            })),
          },
        },
      });
      return { success: true, shape };
    }
  }

  if (intent === "delete") {
    await prisma.shape.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  if (intent === "setDefault") {
    const id = formData.get("id");
    await prisma.shape.updateMany({ where: { shop }, data: { isDefault: false } });
    await prisma.shape.update({ where: { id }, data: { isDefault: true } });
    return { success: true };
  }

  return { success: false };
};

export default function Shapes() {
  const { shapes } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [showForm, setShowForm] = useState(false);
  const [editingShape, setEditingShape] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    surfaceAreaFormula: "",
    surfaceAreaWithoutBaseFormula: "",
    volumeFormula: "",
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    is2D: false,
    enablePanels: false,
    maxPanels: 10,
  });
  const [inputFields, setInputFields] = useState([
    { label: "Length", key: "length", unit: "inches", min: 1, max: 200, required: true, defaultValue: "" },
  ]);

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      surfaceAreaFormula: "",
      surfaceAreaWithoutBaseFormula: "",
      volumeFormula: "",
      isActive: true,
      isDefault: false,
      sortOrder: shapes.length,
      is2D: false,
      enablePanels: false,
      maxPanels: 10,
    });
    setInputFields([
      { label: "Length", key: "length", unit: "inches", min: 1, max: 200, required: true, defaultValue: "" },
    ]);
    setEditingShape(null);
  };

  const handleEdit = (shape) => {
    setFormData({
      name: shape.name,
      imageUrl: shape.imageUrl || "",
      surfaceAreaFormula: shape.surfaceAreaFormula,
      surfaceAreaWithoutBaseFormula: shape.surfaceAreaWithoutBaseFormula || "",
      volumeFormula: shape.volumeFormula,
      isActive: shape.isActive,
      isDefault: shape.isDefault,
      sortOrder: shape.sortOrder,
      is2D: shape.is2D || false,
      enablePanels: shape.enablePanels || false,
      maxPanels: shape.maxPanels || 10,
    });
    setInputFields(shape.inputFields.map(f => ({
      label: f.label,
      key: f.key,
      unit: f.unit,
      min: f.min,
      max: f.max,
      required: f.required,
      defaultValue: f.defaultValue || "",
    })));
    setEditingShape(shape);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const data = new FormData();
    data.append("intent", editingShape ? "update" : "create");
    if (editingShape) data.append("id", editingShape.id);
    Object.entries(formData).forEach(([key, value]) => data.append(key, value.toString()));
    data.append("inputFields", JSON.stringify(inputFields));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingShape ? "Shape updated" : "Shape created");
    setShowForm(false);
    resetForm();
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = (id) => {
    const data = new FormData();
    data.append("intent", "delete");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Shape deleted");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const wasEditing = editingShape && editingShape.id === deleteTarget.id;
    handleDelete(deleteTarget.id);
    setDeleteTarget(null);
    if (wasEditing) { setShowForm(false); resetForm(); }
  };

  const handleSetDefault = (id) => {
    const data = new FormData();
    data.append("intent", "setDefault");
    data.append("id", id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Default shape updated");
  };

  const addInputField = () => {
    setInputFields([...inputFields, {
      label: "",
      key: "",
      unit: "inches",
      min: 1,
      max: 200,
      required: true,
      defaultValue: "",
    }]);
  };

  const removeInputField = (index) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  const updateInputField = (index, field, value) => {
    const updated = [...inputFields];
    updated[index][field] = value;
    setInputFields(updated);
  };

  const handleAdd = () => { resetForm(); setShowForm(true); };
  const handleBack = () => { setShowForm(false); resetForm(); };

  const deleteModal = (
    <ConfirmModal
      open={!!deleteTarget}
      title={`Delete “${deleteTarget?.name}”?`}
      confirmLabel="Delete shape"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
    >
      <p className="cc-p">Customers will no longer be able to choose this shape. This can’t be undone.</p>
    </ConfirmModal>
  );

  const mono = { fontFamily: "var(--cc-mono)", fontSize: 12 };

  if (!showForm) {
    return (
      <s-page heading="Shape Builder" inlineSize="large">
        <s-button slot="primary-action" variant="primary" onClick={handleAdd}>
          Add shape
        </s-button>

        <div className="cc-page">
          <div className="cc-card">
            <div className="cc-card__head">
              <h2>Shapes</h2>
              <span className="cc-card__meta">{shapes.length}</span>
            </div>
            <div className="cc-card__flush" style={{ paddingTop: 10 }}>
              {shapes.length === 0 ? (
                <EmptyState
                  title="No shapes yet"
                  action={<button type="button" className="cc-btn cc-btn--primary" onClick={handleAdd}>Add shape</button>}
                >
                  Add your first shape to get started.
                </EmptyState>
              ) : (
                <div className="cc-table-wrap">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th>Shape</th>
                        <th>Dimensions</th>
                        <th>Surface area formula</th>
                        <th>Status</th>
                        <th><span className="cc-visually-hidden">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shapes.map((shape) => (
                        <tr
                          key={shape.id}
                          className={`cc-clickable${shape.isActive ? "" : " cc-row--inactive"}`}
                          tabIndex={0}
                          onClick={() => handleEdit(shape)}
                          onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) handleEdit(shape); }}
                        >
                          <td>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <Thumb src={shape.imageUrl} alt={shape.name} />
                              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                                <span className="cc-name">{shape.name}</span>
                                {shape.is2D && <Badge tone="info">2D</Badge>}
                                {shape.enablePanels && <Badge tone="warning">Panels</Badge>}
                              </div>
                            </div>
                          </td>
                          <td className="cc-small">
                            {shape.inputFields.length > 0
                              ? shape.inputFields.map(f => `${f.label}${f.defaultValue ? ` (${f.defaultValue})` : ''}`).join(", ")
                              : <span className="cc-muted">—</span>}
                          </td>
                          <td>
                            <div className="cc-muted" style={{ ...mono, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={shape.surfaceAreaFormula}>
                              {shape.surfaceAreaFormula}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              <StatusBadge active={shape.isActive} />
                              {shape.isDefault && <Badge tone="info">Default</Badge>}
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <div className="cc-rowact">
                              {!shape.isDefault && (
                                <button type="button" className="cc-btn cc-btn--plain" onClick={() => handleSetDefault(shape.id)}>Set as default</button>
                              )}
                              <button type="button" className="cc-btn cc-btn--plain cc-btn--critical" onClick={() => setDeleteTarget(shape)}>Delete</button>
                              <button type="button" className="cc-btn" onClick={() => handleEdit(shape)}>Edit</button>
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
        </div>
        {deleteModal}
      </s-page>
    );
  }

  // ---- editor ----
  return (
    <s-page heading={editingShape ? editingShape.name : "New shape"} inlineSize="large">
      <div className="cc-page">
        <div className="cc-header">
          <BackButton onClick={handleBack} label="Back to shapes" />
          <h1>{formData.name || (editingShape ? editingShape.name : "New shape")}</h1>
          <StatusBadge active={formData.isActive} />
          {formData.isDefault && <Badge tone="info">Default</Badge>}
        </div>

        <div className="cc-layout">
          <div className="cc-main">
            <div className="cc-card">
              <div className="cc-card__head"><h2>Details</h2></div>
              <div className="cc-card__body">
                <TextField
                  id="shape-name"
                  label="Shape name"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  placeholder="e.g. Rectangle, Circle, Hexagon"
                  required
                />
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <Thumb src={formData.imageUrl} alt={formData.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      id="shape-image"
                      label="Image URL"
                      value={formData.imageUrl}
                      onChange={(v) => setFormData({ ...formData, imageUrl: v })}
                      placeholder="https://example.com/shape-image.png"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Dimensions</h2>
                <span className="cc-card__meta">{inputFields.length}</span>
                <div className="cc-card__actions">
                  <button type="button" className="cc-btn" onClick={addInputField}>+ Add dimension</button>
                </div>
              </div>
              <div className="cc-card__body" style={{ paddingBottom: 4 }}>
                <p className="cc-p cc-muted">The measurements customers enter. Use each dimension’s key in your formulas.</p>
              </div>
              <div className="cc-card__flush">
                {inputFields.length === 0 ? (
                  <div className="cc-card__body cc-muted">No dimensions yet. Add one to use it in your formulas.</div>
                ) : (
                  <div className="cc-table-wrap">
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>Label</th>
                          <th>Key (used in formulas)</th>
                          <th>Min</th>
                          <th>Max</th>
                          <th>Default</th>
                          <th><span className="cc-visually-hidden">Remove</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inputFields.map((field, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                className="cc-input"
                                aria-label={`Dimension ${index + 1} label`}
                                value={field.label ?? ""}
                                onChange={(e) => updateInputField(index, "label", e.target.value)}
                                placeholder="Length"
                              />
                            </td>
                            <td>
                              <input
                                className="cc-input"
                                aria-label={`Dimension ${index + 1} key`}
                                style={{ fontFamily: "var(--cc-mono)" }}
                                value={field.key ?? ""}
                                onChange={(e) => updateInputField(index, "key", e.target.value.toLowerCase().replace(/\s/g, "_"))}
                                placeholder="length"
                              />
                            </td>
                            <td style={{ width: 96 }}>
                              <input
                                className="cc-input cc-num"
                                type="number"
                                aria-label={`Dimension ${index + 1} minimum`}
                                value={field.min ?? ""}
                                onChange={(e) => updateInputField(index, "min", e.target.value)}
                              />
                            </td>
                            <td style={{ width: 96 }}>
                              <input
                                className="cc-input cc-num"
                                type="number"
                                aria-label={`Dimension ${index + 1} maximum`}
                                value={field.max ?? ""}
                                onChange={(e) => updateInputField(index, "max", e.target.value)}
                              />
                            </td>
                            <td style={{ width: 104 }}>
                              <input
                                className="cc-input cc-num"
                                type="number"
                                aria-label={`Dimension ${index + 1} default value`}
                                value={field.defaultValue ?? ""}
                                onChange={(e) => updateInputField(index, "defaultValue", e.target.value)}
                                placeholder="e.g. 12"
                              />
                            </td>
                            <td style={{ width: 1 }}>
                              <div className="cc-rowact">
                                <button type="button" className="cc-btn cc-btn--plain cc-btn--critical" onClick={() => removeInputField(index)}>Remove</button>
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

            <div className="cc-card">
              <div className="cc-card__head"><h2>Pricing formulas</h2></div>
              <div className="cc-card__body">
                <p className="cc-p cc-muted">Write formulas with the dimension keys, e.g. <code style={mono}>length*width*2</code>.</p>
                <TextField
                  id="shape-sa"
                  label="Surface area formula"
                  value={formData.surfaceAreaFormula}
                  onChange={(v) => setFormData({ ...formData, surfaceAreaFormula: v })}
                  placeholder="length*width*2 + length*thickness*2 + width*thickness*2"
                  help="Used to price the fabric."
                  style={{ fontFamily: "var(--cc-mono)" }}
                />
                <TextField
                  id="shape-sa-nobase"
                  label="Surface area without base (weatherproof)"
                  value={formData.surfaceAreaWithoutBaseFormula}
                  onChange={(v) => setFormData({ ...formData, surfaceAreaWithoutBaseFormula: v })}
                  placeholder="length*width + length*thickness*2 + width*thickness*2"
                  help="Used instead when the profile has weatherproof on (the base isn’t covered)."
                  style={{ fontFamily: "var(--cc-mono)" }}
                />
                <TextField
                  id="shape-volume"
                  label="Volume formula"
                  value={formData.volumeFormula}
                  onChange={(v) => setFormData({ ...formData, volumeFormula: v })}
                  placeholder="length*width*thickness"
                  help="Used to price the fill."
                  style={{ fontFamily: "var(--cc-mono)" }}
                />
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>2D shape and panels</h2></div>
              <div className="cc-card__body">
                <p className="cc-p cc-muted">For flat items like curtains that can be ordered as several panels.</p>
                <Checkbox
                  id="is2D"
                  checked={formData.is2D}
                  onChange={(v) => setFormData({ ...formData, is2D: v, enablePanels: v ? formData.enablePanels : false })}
                  label="This is a 2D shape"
                  help="e.g. a curtain panel."
                />
                {formData.is2D && (
                  <Checkbox
                    id="enablePanels"
                    checked={formData.enablePanels}
                    onChange={(v) => setFormData({ ...formData, enablePanels: v })}
                    label="Let customers choose a panel count"
                    help="The total is multiplied by the number of panels."
                  />
                )}
                {formData.is2D && formData.enablePanels && (
                  <div style={{ maxWidth: 220 }}>
                    <TextField
                      id="shape-max-panels"
                      label="Maximum panels"
                      type="number"
                      value={formData.maxPanels}
                      onChange={(v) => setFormData({ ...formData, maxPanels: parseInt(v) || 10 })}
                      help="The most panels a customer can order (1–20)."
                      min="1"
                      max="20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="cc-side">
            <div className="cc-card">
              <div className="cc-card__head"><h2>Status</h2></div>
              <div className="cc-card__body">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(v) => setFormData({ ...formData, isActive: v })}
                  label="Active"
                  help="Inactive shapes are hidden from customers."
                />
                <span className="cc-help">
                  {formData.isDefault
                    ? "This is the default shape."
                    : "To make this the default shape, use “Set as default” in the shapes list."}
                </span>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>List position</h2></div>
              <div className="cc-card__body">
                <TextField
                  id="shape-sort"
                  label="Sort order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(v) => setFormData({ ...formData, sortOrder: parseInt(v) || 0 })}
                  help="Lower numbers appear first."
                />
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Formula examples</h2></div>
              <div className="cc-card__body" style={{ gap: 10 }}>
                <div>
                  <div className="cc-label">Rectangle</div>
                  <div className="cc-muted" style={{ ...mono, wordBreak: "break-word" }}>SA: length*width*2 + length*thickness*2 + width*thickness*2</div>
                  <div className="cc-muted" style={{ ...mono, wordBreak: "break-word" }}>Vol: length*width*thickness</div>
                </div>
                <div>
                  <div className="cc-label">Circle</div>
                  <div className="cc-muted" style={{ ...mono, wordBreak: "break-word" }}>SA: 3.14159*radius*radius*2 + 3.14159*2*radius*thickness</div>
                  <div className="cc-muted" style={{ ...mono, wordBreak: "break-word" }}>Vol: 3.14159*radius*radius*thickness</div>
                </div>
              </div>
            </div>

            {editingShape && (
              <button type="button" className="cc-btn cc-btn--critical" style={{ justifySelf: "start" }} onClick={() => setDeleteTarget(editingShape)}>
                Delete shape
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--cc-border)", paddingTop: 16 }}>
          <button type="button" className="cc-btn" onClick={handleBack}>Cancel</button>
          <button type="button" className="cc-btn cc-btn--primary" onClick={handleSubmit}>{editingShape ? "Save" : "Create shape"}</button>
        </div>
      </div>
      {deleteModal}
    </s-page>
  );
}
