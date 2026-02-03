import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const shapes = await prisma.shape.findMany({
    where: { shop },
    include: { inputFields: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

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

  const handleDelete = (id) => {
    if (confirm("Delete this shape?")) {
      const data = new FormData();
      data.append("intent", "delete");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show("Shape deleted");
    }
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

  return (
    <s-page heading="Shape Builder" fullWidth>
      <s-button slot="primary-action" onClick={() => { resetForm(); setShowForm(true); }}>
        Add Shape
      </s-button>

      {showForm && (
        <s-section heading={editingShape ? "Edit Shape" : "Create Shape"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Shape Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Rectangle, Circle, Hexagon"
                required
              />

              <s-text-field
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/shape-image.png"
              />

              <s-heading level="4">Input Fields (Dimensions)</s-heading>
              <s-paragraph>
                Define the input fields customers will fill. Use the "key" in your formulas.
              </s-paragraph>

              {inputFields.map((field, index) => (
                <s-box key={index} padding="base" background="subdued" borderRadius="base">
                  <s-stack direction="block" gap="tight">
                    <s-stack direction="inline" gap="tight" wrap>
                      <s-text-field
                        label="Label"
                        value={field.label}
                        onChange={(e) => updateInputField(index, "label", e.target.value)}
                        placeholder="Length"
                        style={{ flex: 1 }}
                      />
                      <s-text-field
                        label="Key (for formula)"
                        value={field.key}
                        onChange={(e) => updateInputField(index, "key", e.target.value.toLowerCase().replace(/\s/g, "_"))}
                        placeholder="length"
                        style={{ flex: 1 }}
                      />
                      <s-text-field
                        label="Min"
                        type="number"
                        value={field.min}
                        onChange={(e) => updateInputField(index, "min", e.target.value)}
                        style={{ width: "80px" }}
                      />
                      <s-text-field
                        label="Max"
                        type="number"
                        value={field.max}
                        onChange={(e) => updateInputField(index, "max", e.target.value)}
                        style={{ width: "80px" }}
                      />
                      <s-text-field
                        label="Default"
                        type="number"
                        value={field.defaultValue}
                        onChange={(e) => updateInputField(index, "defaultValue", e.target.value)}
                        placeholder="e.g., 12"
                        style={{ width: "80px" }}
                      />
                      <s-button variant="tertiary" tone="critical" onClick={() => removeInputField(index)}>
                        Remove
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}

              <s-button variant="secondary" onClick={addInputField}>
                + Add Input Field
              </s-button>

              <s-heading level="4">Formulas</s-heading>
              <s-paragraph>
                Use the input field keys in your formulas. Example: length*width*2
              </s-paragraph>

              <s-text-field
                label="Surface Area Formula"
                value={formData.surfaceAreaFormula}
                onChange={(e) => setFormData({ ...formData, surfaceAreaFormula: e.target.value })}
                placeholder="length*width*2 + length*thickness*2 + width*thickness*2"
                helpText="Used for fabric cost calculation"
              />

              <s-text-field
                label="Volume Formula"
                value={formData.volumeFormula}
                onChange={(e) => setFormData({ ...formData, volumeFormula: e.target.value })}
                placeholder="length*width*thickness"
                helpText="Used for fill cost calculation"
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
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive">Active</label>
              </s-stack>

              <s-heading level="4">2D Shape / Panels Configuration</s-heading>
              <s-paragraph>
                Enable these options for flat shapes like curtains that may need panel multipliers.
              </s-paragraph>

              <s-stack direction="inline" gap="base">
                <input
                  type="checkbox"
                  id="is2D"
                  checked={formData.is2D}
                  onChange={(e) => setFormData({ ...formData, is2D: e.target.checked, enablePanels: e.target.checked ? formData.enablePanels : false })}
                />
                <label htmlFor="is2D">This is a 2D shape (e.g., curtain panel)</label>
              </s-stack>

              {formData.is2D && (
                <>
                  <s-stack direction="inline" gap="base">
                    <input
                      type="checkbox"
                      id="enablePanels"
                      checked={formData.enablePanels}
                      onChange={(e) => setFormData({ ...formData, enablePanels: e.target.checked })}
                    />
                    <label htmlFor="enablePanels">Enable panel count input (multiplies total by panel count)</label>
                  </s-stack>

                  {formData.enablePanels && (
                    <s-text-field
                      label="Maximum Panels"
                      type="number"
                      value={formData.maxPanels}
                      onChange={(e) => setFormData({ ...formData, maxPanels: parseInt(e.target.value) || 10 })}
                      helpText="Maximum number of panels a customer can order (1-20)"
                      min="1"
                      max="20"
                    />
                  )}
                </>
              )}

              <s-stack direction="inline" gap="base">
                <s-button onClick={handleSubmit}>
                  {editingShape ? "Update Shape" : "Create Shape"}
                </s-button>
                <s-button variant="tertiary" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </s-button>
              </s-stack>
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Shapes (${shapes.length})`}>
        {shapes.length === 0 ? (
          <s-box padding="base">
            <s-paragraph>No shapes created yet. Add your first shape to get started.</s-paragraph>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {shapes.map((shape) => (
              <s-box
                key={shape.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background={shape.isActive ? "default" : "subdued"}
              >
                <s-stack direction="inline" gap="base" align="center" wrap>
                  {shape.imageUrl ? (
                    <img src={shape.imageUrl} alt={shape.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999" }}>
                      No image
                    </div>
                  )}

                  <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                    <s-stack direction="inline" gap="tight" align="center">
                      <s-text fontWeight="semibold">{shape.name}</s-text>
                      {shape.is2D && <span style={{ background: "#e0f0ff", color: "#0066cc", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>2D</span>}
                      {shape.enablePanels && <span style={{ background: "#fff3e0", color: "#e65100", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>Panels</span>}
                      {shape.isDefault && <s-text tone="success" fontSize="small">(Default)</s-text>}
                      {!shape.isActive && <s-text tone="subdued" fontSize="small">(Inactive)</s-text>}
                    </s-stack>
                    <s-text tone="subdued" fontSize="small">
                      Inputs: {shape.inputFields.map(f => `${f.label}${f.defaultValue ? ` (${f.defaultValue})` : ''}`).join(", ")}
                    </s-text>
                    <s-text tone="subdued" fontSize="small">
                      SA: {shape.surfaceAreaFormula}
                    </s-text>
                  </s-stack>

                  <s-stack direction="inline" gap="tight">
                    <s-button variant="tertiary" onClick={() => handleEdit(shape)}>Edit</s-button>
                    {!shape.isDefault && (
                      <s-button variant="tertiary" onClick={() => handleSetDefault(shape.id)}>Set Default</s-button>
                    )}
                    <s-button variant="tertiary" tone="critical" onClick={() => handleDelete(shape.id)}>Delete</s-button>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Formula Examples">
        <s-box padding="base">
          <s-stack direction="block" gap="tight">
            <s-text fontWeight="semibold">Rectangle:</s-text>
            <s-text fontSize="small">SA: length*width*2 + length*thickness*2 + width*thickness*2</s-text>
            <s-text fontSize="small">Vol: length*width*thickness</s-text>

            <s-text fontWeight="semibold" style={{ marginTop: 12 }}>Circle:</s-text>
            <s-text fontSize="small">SA: 3.14159*radius*radius*2 + 3.14159*2*radius*thickness</s-text>
            <s-text fontSize="small">Vol: 3.14159*radius*radius*thickness</s-text>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}
