import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [profiles, shapes, fillTypes, fabricCategories, fabrics, pipingOptions, buttonOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions] = await Promise.all([
    prisma.calculatorProfile.findMany({
      where: { shop },
      orderBy: { sortOrder: "asc" },
      include: { pieces: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.shape.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fillType.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fabricCategory.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fabric.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.pipingOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.buttonStyleOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.antiSkidOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.tiesOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.designOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fabricTiesOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.rodPocketOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return { profiles, shapes, fillTypes, fabricCategories, fabrics, pipingOptions, buttonOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    if (formData.get("isDefault") === "true") {
      await prisma.calculatorProfile.updateMany({
        where: { shop, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Parse pieces JSON if provided
    const piecesJson = formData.get("pieces");
    const pieces = piecesJson ? JSON.parse(piecesJson) : [];

    await prisma.calculatorProfile.create({
      data: {
        shop,
        name: formData.get("name"),
        description: formData.get("description") || null,
        additionalPercent: parseFloat(formData.get("additionalPercent")) || 0,
        enableMultiPiece: formData.get("enableMultiPiece") === "true",
        piecesLabel: formData.get("piecesLabel") || null,
        showShapeSection: formData.get("showShapeSection") === "true",
        showDimensionsSection: formData.get("showDimensionsSection") === "true",
        showFillSection: formData.get("showFillSection") === "true",
        showFabricSection: formData.get("showFabricSection") === "true",
        showPipingSection: formData.get("showPipingSection") === "true",
        showButtonSection: formData.get("showButtonSection") === "true",
        showAntiSkidSection: formData.get("showAntiSkidSection") === "true",
        showTiesSection: formData.get("showTiesSection") === "true",
        showDesignSection: formData.get("showDesignSection") === "true",
        showFabricTiesSection: formData.get("showFabricTiesSection") === "true",
        showRodPocketSection: formData.get("showRodPocketSection") === "true",
        showInstructions: formData.get("showInstructions") === "true",
        allowedShapeIds: formData.get("allowedShapeIds") || null,
        allowedFillIds: formData.get("allowedFillIds") || null,
        allowedFabricIds: formData.get("allowedFabricIds") || null,
        allowedCategoryIds: formData.get("allowedCategoryIds") || null,
        allowedPipingIds: formData.get("allowedPipingIds") || null,
        allowedButtonIds: formData.get("allowedButtonIds") || null,
        allowedAntiSkidIds: formData.get("allowedAntiSkidIds") || null,
        allowedTiesIds: formData.get("allowedTiesIds") || null,
        allowedDesignIds: formData.get("allowedDesignIds") || null,
        allowedFabricTiesIds: formData.get("allowedFabricTiesIds") || null,
        allowedRodPocketIds: formData.get("allowedRodPocketIds") || null,
        hiddenShapeId: formData.get("hiddenShapeId") || null,
        hiddenFillTypeId: formData.get("hiddenFillTypeId") || null,
        hiddenFabricId: formData.get("hiddenFabricId") || null,
        hiddenPipingId: formData.get("hiddenPipingId") || null,
        hiddenButtonId: formData.get("hiddenButtonId") || null,
        hiddenAntiSkidId: formData.get("hiddenAntiSkidId") || null,
        hiddenTiesId: formData.get("hiddenTiesId") || null,
        hiddenDesignId: formData.get("hiddenDesignId") || null,
        hiddenFabricTiesId: formData.get("hiddenFabricTiesId") || null,
        hiddenRodPocketId: formData.get("hiddenRodPocketId") || null,
        isDefault: formData.get("isDefault") === "true",
        isActive: true,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
        pieces: {
          create: pieces.map((p, idx) => ({
            name: p.name,
            label: p.label || null,
            sortOrder: idx,
            showShapeSection: p.showShapeSection ?? true,
            showDimensionsSection: p.showDimensionsSection ?? true,
            showFillSection: p.showFillSection ?? true,
            showPipingSection: p.showPipingSection ?? true,
            showButtonSection: p.showButtonSection ?? true,
            showAntiSkidSection: p.showAntiSkidSection ?? true,
            showTiesSection: p.showTiesSection ?? true,
            showDesignSection: p.showDesignSection ?? true,
            showFabricTiesSection: p.showFabricTiesSection ?? true,
            showRodPocketSection: p.showRodPocketSection ?? true,
            allowedShapeIds: p.allowedShapeIds || null,
            allowedFillIds: p.allowedFillIds || null,
            allowedPipingIds: p.allowedPipingIds || null,
            allowedButtonIds: p.allowedButtonIds || null,
            allowedAntiSkidIds: p.allowedAntiSkidIds || null,
            allowedTiesIds: p.allowedTiesIds || null,
            allowedDesignIds: p.allowedDesignIds || null,
            allowedFabricTiesIds: p.allowedFabricTiesIds || null,
            allowedRodPocketIds: p.allowedRodPocketIds || null,
            hiddenShapeId: p.hiddenShapeId || null,
            hiddenFillTypeId: p.hiddenFillTypeId || null,
            hiddenPipingId: p.hiddenPipingId || null,
            hiddenButtonId: p.hiddenButtonId || null,
            hiddenAntiSkidId: p.hiddenAntiSkidId || null,
            hiddenTiesId: p.hiddenTiesId || null,
            hiddenDesignId: p.hiddenDesignId || null,
            hiddenFabricTiesId: p.hiddenFabricTiesId || null,
            hiddenRodPocketId: p.hiddenRodPocketId || null,
            defaultShapeId: p.defaultShapeId || null,
            defaultFillId: p.defaultFillId || null,
          })),
        },
      },
    });
    return { success: true };
  }

  if (intent === "update") {
    const id = formData.get("id");

    if (formData.get("isDefault") === "true") {
      await prisma.calculatorProfile.updateMany({
        where: { shop, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    // Parse pieces JSON if provided
    const piecesJson = formData.get("pieces");
    const pieces = piecesJson ? JSON.parse(piecesJson) : [];

    // Delete existing pieces and recreate
    await prisma.profilePiece.deleteMany({ where: { profileId: id } });

    await prisma.calculatorProfile.update({
      where: { id },
      data: {
        name: formData.get("name"),
        description: formData.get("description") || null,
        additionalPercent: parseFloat(formData.get("additionalPercent")) || 0,
        enableMultiPiece: formData.get("enableMultiPiece") === "true",
        piecesLabel: formData.get("piecesLabel") || null,
        showShapeSection: formData.get("showShapeSection") === "true",
        showDimensionsSection: formData.get("showDimensionsSection") === "true",
        showFillSection: formData.get("showFillSection") === "true",
        showFabricSection: formData.get("showFabricSection") === "true",
        showPipingSection: formData.get("showPipingSection") === "true",
        showButtonSection: formData.get("showButtonSection") === "true",
        showAntiSkidSection: formData.get("showAntiSkidSection") === "true",
        showTiesSection: formData.get("showTiesSection") === "true",
        showDesignSection: formData.get("showDesignSection") === "true",
        showFabricTiesSection: formData.get("showFabricTiesSection") === "true",
        showRodPocketSection: formData.get("showRodPocketSection") === "true",
        showInstructions: formData.get("showInstructions") === "true",
        allowedShapeIds: formData.get("allowedShapeIds") || null,
        allowedFillIds: formData.get("allowedFillIds") || null,
        allowedFabricIds: formData.get("allowedFabricIds") || null,
        allowedCategoryIds: formData.get("allowedCategoryIds") || null,
        allowedPipingIds: formData.get("allowedPipingIds") || null,
        allowedButtonIds: formData.get("allowedButtonIds") || null,
        allowedAntiSkidIds: formData.get("allowedAntiSkidIds") || null,
        allowedTiesIds: formData.get("allowedTiesIds") || null,
        allowedDesignIds: formData.get("allowedDesignIds") || null,
        allowedFabricTiesIds: formData.get("allowedFabricTiesIds") || null,
        allowedRodPocketIds: formData.get("allowedRodPocketIds") || null,
        hiddenShapeId: formData.get("hiddenShapeId") || null,
        hiddenFillTypeId: formData.get("hiddenFillTypeId") || null,
        hiddenFabricId: formData.get("hiddenFabricId") || null,
        hiddenPipingId: formData.get("hiddenPipingId") || null,
        hiddenButtonId: formData.get("hiddenButtonId") || null,
        hiddenAntiSkidId: formData.get("hiddenAntiSkidId") || null,
        hiddenTiesId: formData.get("hiddenTiesId") || null,
        hiddenDesignId: formData.get("hiddenDesignId") || null,
        hiddenFabricTiesId: formData.get("hiddenFabricTiesId") || null,
        hiddenRodPocketId: formData.get("hiddenRodPocketId") || null,
        isDefault: formData.get("isDefault") === "true",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
        pieces: {
          create: pieces.map((p, idx) => ({
            name: p.name,
            label: p.label || null,
            sortOrder: idx,
            showShapeSection: p.showShapeSection ?? true,
            showDimensionsSection: p.showDimensionsSection ?? true,
            showFillSection: p.showFillSection ?? true,
            showPipingSection: p.showPipingSection ?? true,
            showButtonSection: p.showButtonSection ?? true,
            showAntiSkidSection: p.showAntiSkidSection ?? true,
            showTiesSection: p.showTiesSection ?? true,
            showDesignSection: p.showDesignSection ?? true,
            showFabricTiesSection: p.showFabricTiesSection ?? true,
            showRodPocketSection: p.showRodPocketSection ?? true,
            allowedShapeIds: p.allowedShapeIds || null,
            allowedFillIds: p.allowedFillIds || null,
            allowedPipingIds: p.allowedPipingIds || null,
            allowedButtonIds: p.allowedButtonIds || null,
            allowedAntiSkidIds: p.allowedAntiSkidIds || null,
            allowedTiesIds: p.allowedTiesIds || null,
            allowedDesignIds: p.allowedDesignIds || null,
            allowedFabricTiesIds: p.allowedFabricTiesIds || null,
            allowedRodPocketIds: p.allowedRodPocketIds || null,
            hiddenShapeId: p.hiddenShapeId || null,
            hiddenFillTypeId: p.hiddenFillTypeId || null,
            hiddenPipingId: p.hiddenPipingId || null,
            hiddenButtonId: p.hiddenButtonId || null,
            hiddenAntiSkidId: p.hiddenAntiSkidId || null,
            hiddenTiesId: p.hiddenTiesId || null,
            hiddenDesignId: p.hiddenDesignId || null,
            hiddenFabricTiesId: p.hiddenFabricTiesId || null,
            hiddenRodPocketId: p.hiddenRodPocketId || null,
            defaultShapeId: p.defaultShapeId || null,
            defaultFillId: p.defaultFillId || null,
          })),
        },
      },
    });
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.calculatorProfile.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  return { success: false };
};

export default function Profiles() {
  const { profiles, shapes, fillTypes, fabricCategories, fabrics, pipingOptions, buttonOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const defaultForm = {
    name: "",
    description: "",
    additionalPercent: 0,
    enableMultiPiece: false,
    piecesLabel: "",
    pieces: [],
    showShapeSection: true,
    showDimensionsSection: true,
    showFillSection: true,
    showFabricSection: true,
    showPipingSection: true,
    showButtonSection: true,
    showAntiSkidSection: true,
    showTiesSection: true,
    showDesignSection: true,
    showFabricTiesSection: true,
    showRodPocketSection: true,
    showInstructions: true,
    allowedShapeIds: [],
    allowedFillIds: [],
    allowedFabricIds: [],
    allowedCategoryIds: [],
    allowedPipingIds: [],
    allowedButtonIds: [],
    allowedAntiSkidIds: [],
    allowedTiesIds: [],
    allowedDesignIds: [],
    allowedFabricTiesIds: [],
    allowedRodPocketIds: [],
    hiddenShapeId: "",
    hiddenFillTypeId: "",
    hiddenFabricId: "",
    hiddenPipingId: "",
    hiddenButtonId: "",
    hiddenAntiSkidId: "",
    hiddenTiesId: "",
    hiddenDesignId: "",
    hiddenFabricTiesId: "",
    hiddenRodPocketId: "",
    isDefault: false,
    isActive: true,
    sortOrder: profiles.length,
  };

  const defaultPiece = {
    name: "",
    label: "",
    showShapeSection: true,
    showDimensionsSection: true,
    showFillSection: true,
    showPipingSection: true,
    showButtonSection: true,
    showAntiSkidSection: true,
    showTiesSection: true,
    showDesignSection: true,
    showFabricTiesSection: true,
    showRodPocketSection: true,
    allowedShapeIds: [],
    allowedFillIds: [],
    allowedPipingIds: [],
    allowedButtonIds: [],
    allowedAntiSkidIds: [],
    allowedTiesIds: [],
    allowedDesignIds: [],
    allowedFabricTiesIds: [],
    allowedRodPocketIds: [],
    hiddenShapeId: "",
    hiddenFillTypeId: "",
    hiddenPipingId: "",
    hiddenButtonId: "",
    hiddenAntiSkidId: "",
    hiddenTiesId: "",
    hiddenDesignId: "",
    hiddenFabricTiesId: "",
    hiddenRodPocketId: "",
    defaultShapeId: "",
    defaultFillId: "",
  };

  const [editingPieceIndex, setEditingPieceIndex] = useState(null);

  const [form, setForm] = useState(defaultForm);

  const reset = () => {
    setForm({ ...defaultForm, sortOrder: profiles.length });
    setEditing(null);
    setEditingPieceIndex(null);
  };

  const handleEdit = (profile) => {
    setForm({
      name: profile.name,
      description: profile.description || "",
      additionalPercent: profile.additionalPercent || 0,
      enableMultiPiece: profile.enableMultiPiece || false,
      piecesLabel: profile.piecesLabel || "",
      pieces: (profile.pieces || []).map(p => ({
        id: p.id,
        name: p.name,
        label: p.label || "",
        showShapeSection: p.showShapeSection ?? true,
        showDimensionsSection: p.showDimensionsSection ?? true,
        showFillSection: p.showFillSection ?? true,
        showPipingSection: p.showPipingSection ?? true,
        showButtonSection: p.showButtonSection ?? true,
        showAntiSkidSection: p.showAntiSkidSection ?? true,
        showTiesSection: p.showTiesSection ?? true,
        showDesignSection: p.showDesignSection ?? true,
        showFabricTiesSection: p.showFabricTiesSection ?? true,
        showRodPocketSection: p.showRodPocketSection ?? true,
        allowedShapeIds: p.allowedShapeIds ? JSON.parse(p.allowedShapeIds) : [],
        allowedFillIds: p.allowedFillIds ? JSON.parse(p.allowedFillIds) : [],
        allowedPipingIds: p.allowedPipingIds ? JSON.parse(p.allowedPipingIds) : [],
        allowedButtonIds: p.allowedButtonIds ? JSON.parse(p.allowedButtonIds) : [],
        allowedAntiSkidIds: p.allowedAntiSkidIds ? JSON.parse(p.allowedAntiSkidIds) : [],
        allowedTiesIds: p.allowedTiesIds ? JSON.parse(p.allowedTiesIds) : [],
        allowedDesignIds: p.allowedDesignIds ? JSON.parse(p.allowedDesignIds) : [],
        allowedFabricTiesIds: p.allowedFabricTiesIds ? JSON.parse(p.allowedFabricTiesIds) : [],
        allowedRodPocketIds: p.allowedRodPocketIds ? JSON.parse(p.allowedRodPocketIds) : [],
        hiddenShapeId: p.hiddenShapeId || "",
        hiddenFillTypeId: p.hiddenFillTypeId || "",
        hiddenPipingId: p.hiddenPipingId || "",
        hiddenButtonId: p.hiddenButtonId || "",
        hiddenAntiSkidId: p.hiddenAntiSkidId || "",
        hiddenTiesId: p.hiddenTiesId || "",
        hiddenDesignId: p.hiddenDesignId || "",
        hiddenFabricTiesId: p.hiddenFabricTiesId || "",
        hiddenRodPocketId: p.hiddenRodPocketId || "",
        defaultShapeId: p.defaultShapeId || "",
        defaultFillId: p.defaultFillId || "",
      })),
      showShapeSection: profile.showShapeSection,
      showDimensionsSection: profile.showDimensionsSection,
      showFillSection: profile.showFillSection,
      showFabricSection: profile.showFabricSection,
      showPipingSection: profile.showPipingSection,
      showButtonSection: profile.showButtonSection,
      showAntiSkidSection: profile.showAntiSkidSection ?? true,
      showTiesSection: profile.showTiesSection ?? true,
      showDesignSection: profile.showDesignSection ?? true,
      showFabricTiesSection: profile.showFabricTiesSection ?? true,
      showRodPocketSection: profile.showRodPocketSection ?? true,
      showInstructions: profile.showInstructions,
      allowedShapeIds: profile.allowedShapeIds ? JSON.parse(profile.allowedShapeIds) : [],
      allowedFillIds: profile.allowedFillIds ? JSON.parse(profile.allowedFillIds) : [],
      allowedFabricIds: profile.allowedFabricIds ? JSON.parse(profile.allowedFabricIds) : [],
      allowedCategoryIds: profile.allowedCategoryIds ? JSON.parse(profile.allowedCategoryIds) : [],
      allowedPipingIds: profile.allowedPipingIds ? JSON.parse(profile.allowedPipingIds) : [],
      allowedButtonIds: profile.allowedButtonIds ? JSON.parse(profile.allowedButtonIds) : [],
      allowedAntiSkidIds: profile.allowedAntiSkidIds ? JSON.parse(profile.allowedAntiSkidIds) : [],
      allowedTiesIds: profile.allowedTiesIds ? JSON.parse(profile.allowedTiesIds) : [],
      allowedDesignIds: profile.allowedDesignIds ? JSON.parse(profile.allowedDesignIds) : [],
      allowedFabricTiesIds: profile.allowedFabricTiesIds ? JSON.parse(profile.allowedFabricTiesIds) : [],
      allowedRodPocketIds: profile.allowedRodPocketIds ? JSON.parse(profile.allowedRodPocketIds) : [],
      hiddenShapeId: profile.hiddenShapeId || "",
      hiddenFillTypeId: profile.hiddenFillTypeId || "",
      hiddenFabricId: profile.hiddenFabricId || "",
      hiddenPipingId: profile.hiddenPipingId || "",
      hiddenButtonId: profile.hiddenButtonId || "",
      hiddenAntiSkidId: profile.hiddenAntiSkidId || "",
      hiddenTiesId: profile.hiddenTiesId || "",
      hiddenDesignId: profile.hiddenDesignId || "",
      hiddenFabricTiesId: profile.hiddenFabricTiesId || "",
      hiddenRodPocketId: profile.hiddenRodPocketId || "",
      isDefault: profile.isDefault,
      isActive: profile.isActive,
      sortOrder: profile.sortOrder,
    });
    setEditing(profile);
    setEditingPieceIndex(null);
    setShowForm(true);
  };

  const submit = () => {
    const data = new FormData();
    data.append("intent", editing ? "update" : "create");
    if (editing) data.append("id", editing.id);

    data.append("name", form.name);
    data.append("description", form.description);
    data.append("additionalPercent", form.additionalPercent.toString());
    data.append("enableMultiPiece", form.enableMultiPiece.toString());
    data.append("piecesLabel", form.piecesLabel);
    // Convert pieces array with proper JSON stringified arrays for allowedIds
    const piecesForSubmit = form.pieces.map(p => ({
      ...p,
      allowedShapeIds: p.allowedShapeIds?.length > 0 ? JSON.stringify(p.allowedShapeIds) : null,
      allowedFillIds: p.allowedFillIds?.length > 0 ? JSON.stringify(p.allowedFillIds) : null,
      allowedPipingIds: p.allowedPipingIds?.length > 0 ? JSON.stringify(p.allowedPipingIds) : null,
      allowedButtonIds: p.allowedButtonIds?.length > 0 ? JSON.stringify(p.allowedButtonIds) : null,
      allowedAntiSkidIds: p.allowedAntiSkidIds?.length > 0 ? JSON.stringify(p.allowedAntiSkidIds) : null,
      allowedTiesIds: p.allowedTiesIds?.length > 0 ? JSON.stringify(p.allowedTiesIds) : null,
      allowedDesignIds: p.allowedDesignIds?.length > 0 ? JSON.stringify(p.allowedDesignIds) : null,
      allowedFabricTiesIds: p.allowedFabricTiesIds?.length > 0 ? JSON.stringify(p.allowedFabricTiesIds) : null,
      allowedRodPocketIds: p.allowedRodPocketIds?.length > 0 ? JSON.stringify(p.allowedRodPocketIds) : null,
    }));
    data.append("pieces", JSON.stringify(piecesForSubmit));
    data.append("showShapeSection", form.showShapeSection.toString());
    data.append("showDimensionsSection", form.showDimensionsSection.toString());
    data.append("showFillSection", form.showFillSection.toString());
    data.append("showFabricSection", form.showFabricSection.toString());
    data.append("showPipingSection", form.showPipingSection.toString());
    data.append("showButtonSection", form.showButtonSection.toString());
    data.append("showAntiSkidSection", form.showAntiSkidSection.toString());
    data.append("showTiesSection", form.showTiesSection.toString());
    data.append("showDesignSection", form.showDesignSection.toString());
    data.append("showFabricTiesSection", form.showFabricTiesSection.toString());
    data.append("showRodPocketSection", form.showRodPocketSection.toString());
    data.append("showInstructions", form.showInstructions.toString());
    data.append("allowedShapeIds", form.allowedShapeIds.length > 0 ? JSON.stringify(form.allowedShapeIds) : "");
    data.append("allowedFillIds", form.allowedFillIds.length > 0 ? JSON.stringify(form.allowedFillIds) : "");
    data.append("allowedFabricIds", form.allowedFabricIds.length > 0 ? JSON.stringify(form.allowedFabricIds) : "");
    data.append("allowedCategoryIds", form.allowedCategoryIds.length > 0 ? JSON.stringify(form.allowedCategoryIds) : "");
    data.append("allowedPipingIds", form.allowedPipingIds.length > 0 ? JSON.stringify(form.allowedPipingIds) : "");
    data.append("allowedButtonIds", form.allowedButtonIds.length > 0 ? JSON.stringify(form.allowedButtonIds) : "");
    data.append("allowedAntiSkidIds", form.allowedAntiSkidIds.length > 0 ? JSON.stringify(form.allowedAntiSkidIds) : "");
    data.append("allowedTiesIds", form.allowedTiesIds.length > 0 ? JSON.stringify(form.allowedTiesIds) : "");
    data.append("allowedDesignIds", form.allowedDesignIds.length > 0 ? JSON.stringify(form.allowedDesignIds) : "");
    data.append("allowedFabricTiesIds", form.allowedFabricTiesIds.length > 0 ? JSON.stringify(form.allowedFabricTiesIds) : "");
    data.append("allowedRodPocketIds", form.allowedRodPocketIds.length > 0 ? JSON.stringify(form.allowedRodPocketIds) : "");
    data.append("hiddenShapeId", form.hiddenShapeId);
    data.append("hiddenFillTypeId", form.hiddenFillTypeId);
    data.append("hiddenFabricId", form.hiddenFabricId);
    data.append("hiddenPipingId", form.hiddenPipingId);
    data.append("hiddenButtonId", form.hiddenButtonId);
    data.append("hiddenAntiSkidId", form.hiddenAntiSkidId);
    data.append("hiddenTiesId", form.hiddenTiesId);
    data.append("hiddenDesignId", form.hiddenDesignId);
    data.append("hiddenFabricTiesId", form.hiddenFabricTiesId);
    data.append("hiddenRodPocketId", form.hiddenRodPocketId);
    data.append("isDefault", form.isDefault.toString());
    data.append("isActive", form.isActive.toString());
    data.append("sortOrder", form.sortOrder.toString());

    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editing ? "Profile updated" : "Profile created");
    setShowForm(false);
    reset();
  };

  const addPiece = () => {
    if (form.pieces.length >= 5) {
      shopify.toast.show("Maximum 5 pieces allowed", { isError: true });
      return;
    }
    setForm({ ...form, pieces: [...form.pieces, { ...defaultPiece }] });
    setEditingPieceIndex(form.pieces.length);
  };

  const removePiece = (index) => {
    const newPieces = form.pieces.filter((_, i) => i !== index);
    setForm({ ...form, pieces: newPieces });
    if (editingPieceIndex === index) setEditingPieceIndex(null);
    else if (editingPieceIndex > index) setEditingPieceIndex(editingPieceIndex - 1);
  };

  const updatePiece = (index, field, value) => {
    const newPieces = [...form.pieces];
    newPieces[index] = { ...newPieces[index], [field]: value };
    setForm({ ...form, pieces: newPieces });
  };

  const togglePieceArrayItem = (pieceIndex, field, item) => {
    const arr = form.pieces[pieceIndex][field] || [];
    const newArr = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
    updatePiece(pieceIndex, field, newArr);
  };

  const movePiece = (index, direction) => {
    const newPieces = [...form.pieces];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newPieces.length) return;
    [newPieces[index], newPieces[newIndex]] = [newPieces[newIndex], newPieces[index]];
    setForm({ ...form, pieces: newPieces });
    if (editingPieceIndex === index) setEditingPieceIndex(newIndex);
    else if (editingPieceIndex === newIndex) setEditingPieceIndex(index);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this profile?")) {
      const data = new FormData();
      data.append("intent", "delete");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  const toggleArrayItem = (arr, item) => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const getSectionSummary = (profile) => {
    const sections = [];
    if (profile.showShapeSection) sections.push("Shape");
    if (profile.showFillSection) sections.push("Fill");
    if (profile.showFabricSection) sections.push("Fabric");
    if (profile.showDesignSection) sections.push("Design");
    if (profile.showPipingSection) sections.push("Piping");
    if (profile.showButtonSection) sections.push("Button");
    if (profile.showAntiSkidSection) sections.push("Anti-Skid");
    if (profile.showRodPocketSection) sections.push("Rod Pocket");
    if (profile.showTiesSection) sections.push("Ties");
    if (profile.showFabricTiesSection) sections.push("Fabric Ties");
    return sections.join(", ") || "None";
  };

  return (
    <s-page heading="Calculator Profiles" fullWidth>
      <s-button slot="primary-action" onClick={() => { reset(); setShowForm(true); }}>Add Profile</s-button>

      <s-section>
        <s-box padding="base" background="subdued" borderRadius="base">
          <s-text>Profiles control which calculator sections and options appear for each product. Assign a profile to products using the metafield <strong>cushion_calculator.profile_id</strong></s-text>
        </s-box>
      </s-section>

      {showForm && (
        <s-section heading={editing ? "Edit Profile" : "Add Profile"}>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="loose">
              {/* Basic Info */}
              <s-stack direction="block" gap="base">
                <s-text fontWeight="semibold">Basic Information</s-text>
                <s-text-field
                  label="Profile Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Standard Cushion, Simple Cushion"
                  required
                />
                <s-text-field
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description for this profile"
                />
                <s-text-field
                  label="Additional Percentage (%)"
                  type="number"
                  value={form.additionalPercent}
                  onChange={(e) => setForm({ ...form, additionalPercent: parseFloat(e.target.value) || 0 })}
                  helpText="This percentage markup will be added to the subtotal for products using this profile"
                />
              </s-stack>

              {/* Multi-Piece Configuration */}
              <s-stack direction="block" gap="base">
                <s-text fontWeight="semibold">Multi-Piece Configuration</s-text>
                <s-text tone="subdued">Enable this to create cushion sets with multiple pieces (e.g., Seat + Backrest)</s-text>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={form.enableMultiPiece} onChange={(e) => setForm({ ...form, enableMultiPiece: e.target.checked })} />
                  Enable Multi-Piece Mode
                </label>

                {form.enableMultiPiece && (
                  <s-stack direction="block" gap="base">
                    <s-text-field
                      label="Pieces Section Label"
                      value={form.piecesLabel}
                      onChange={(e) => setForm({ ...form, piecesLabel: e.target.value })}
                      placeholder="e.g., Cushion Components"
                      helpText="Label shown above the pieces in the calculator"
                    />

                    <s-stack direction="block" gap="tight">
                      <s-stack direction="inline" gap="base" align="center">
                        <s-text fontWeight="semibold">Pieces ({form.pieces.length}/5)</s-text>
                        <s-button variant="tertiary" onClick={addPiece} disabled={form.pieces.length >= 5}>+ Add Piece</s-button>
                      </s-stack>

                      {form.pieces.length === 0 && (
                        <s-box padding="base" background="subdued" borderRadius="base">
                          <s-text tone="subdued">No pieces defined. Add at least one piece to use multi-piece mode.</s-text>
                        </s-box>
                      )}

                      {form.pieces.map((piece, idx) => (
                        <s-box key={idx} padding="base" borderWidth="base" borderRadius="base" background={editingPieceIndex === idx ? "default" : "subdued"}>
                          <s-stack direction="block" gap="tight">
                            <s-stack direction="inline" gap="base" align="center" wrap>
                              <s-stack direction="inline" gap="tight" align="center">
                                <s-button variant="tertiary" onClick={() => movePiece(idx, -1)} disabled={idx === 0}>↑</s-button>
                                <s-button variant="tertiary" onClick={() => movePiece(idx, 1)} disabled={idx === form.pieces.length - 1}>↓</s-button>
                              </s-stack>
                              <s-text fontWeight="semibold">{piece.name || `Piece ${idx + 1}`}</s-text>
                              {piece.label && <s-text tone="subdued">({piece.label})</s-text>}
                              <div style={{ flex: 1 }} />
                              <s-button variant="tertiary" onClick={() => setEditingPieceIndex(editingPieceIndex === idx ? null : idx)}>
                                {editingPieceIndex === idx ? "Collapse" : "Edit"}
                              </s-button>
                              <s-button variant="tertiary" tone="critical" onClick={() => removePiece(idx)}>Remove</s-button>
                            </s-stack>

                            {editingPieceIndex === idx && (
                              <s-stack direction="block" gap="base" style={{ marginTop: "12px" }}>
                                <s-stack direction="inline" gap="base">
                                  <s-text-field
                                    label="Piece Name"
                                    value={piece.name}
                                    onChange={(e) => updatePiece(idx, "name", e.target.value)}
                                    placeholder="e.g., Seat Base, Backrest"
                                    required
                                  />
                                  <s-text-field
                                    label="Display Label (optional)"
                                    value={piece.label}
                                    onChange={(e) => updatePiece(idx, "label", e.target.value)}
                                    placeholder="Override display name"
                                  />
                                </s-stack>

                                <s-text fontWeight="medium">Section Visibility</s-text>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showShapeSection} onChange={(e) => updatePiece(idx, "showShapeSection", e.target.checked)} />
                                    Shape
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showDimensionsSection} onChange={(e) => updatePiece(idx, "showDimensionsSection", e.target.checked)} />
                                    Dimensions
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showFillSection} onChange={(e) => updatePiece(idx, "showFillSection", e.target.checked)} />
                                    Fill Type
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showPipingSection} onChange={(e) => updatePiece(idx, "showPipingSection", e.target.checked)} />
                                    Piping
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showButtonSection} onChange={(e) => updatePiece(idx, "showButtonSection", e.target.checked)} />
                                    Button Style
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showAntiSkidSection} onChange={(e) => updatePiece(idx, "showAntiSkidSection", e.target.checked)} />
                                    Anti-Skid Bottom
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showTiesSection} onChange={(e) => updatePiece(idx, "showTiesSection", e.target.checked)} />
                                    Ties
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showDesignSection} onChange={(e) => updatePiece(idx, "showDesignSection", e.target.checked)} />
                                    Design
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showFabricTiesSection} onChange={(e) => updatePiece(idx, "showFabricTiesSection", e.target.checked)} />
                                    Fabric Ties
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input type="checkbox" checked={piece.showRodPocketSection} onChange={(e) => updatePiece(idx, "showRodPocketSection", e.target.checked)} />
                                    Rod Pocket
                                  </label>
                                </div>

                                {/* Defaults for this piece */}
                                <s-text fontWeight="medium">Defaults</s-text>
                                <s-stack direction="inline" gap="base">
                                  {piece.showShapeSection && shapes.length > 0 && (
                                    <div style={{ flex: 1 }}>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>Default Shape</label>
                                      <select
                                        value={piece.defaultShapeId}
                                        onChange={(e) => updatePiece(idx, "defaultShapeId", e.target.value)}
                                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                      >
                                        <option value="">None</option>
                                        {shapes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {piece.showFillSection && fillTypes.length > 0 && (
                                    <div style={{ flex: 1 }}>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>Default Fill</label>
                                      <select
                                        value={piece.defaultFillId}
                                        onChange={(e) => updatePiece(idx, "defaultFillId", e.target.value)}
                                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                      >
                                        <option value="">None</option>
                                        {fillTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </s-stack>

                                {/* Allowed options for this piece */}
                                {piece.showShapeSection && shapes.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Shapes (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {shapes.map((s) => (
                                        <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedShapeIds || []).includes(s.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedShapeIds || []).includes(s.id)} onChange={() => togglePieceArrayItem(idx, "allowedShapeIds", s.id)} />
                                          {s.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showFillSection && fillTypes.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Fill Types (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {fillTypes.map((f) => (
                                        <label key={f.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedFillIds || []).includes(f.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedFillIds || []).includes(f.id)} onChange={() => togglePieceArrayItem(idx, "allowedFillIds", f.id)} />
                                          {f.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showPipingSection && pipingOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Piping Options (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {pipingOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedPipingIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedPipingIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedPipingIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showButtonSection && buttonOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Button Styles (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {buttonOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedButtonIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedButtonIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedButtonIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showAntiSkidSection && antiSkidOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Anti-Skid Options (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {antiSkidOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedAntiSkidIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedAntiSkidIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedAntiSkidIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showTiesSection && tiesOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Ties Options (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {tiesOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedTiesIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedTiesIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedTiesIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showDesignSection && designOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Design Options (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {designOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedDesignIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedDesignIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedDesignIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showFabricTiesSection && fabricTiesOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Fabric Ties Options (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {fabricTiesOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedFabricTiesIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedFabricTiesIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedFabricTiesIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {piece.showRodPocketSection && rodPocketOptions.length > 0 && (
                                  <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="medium" fontSize="small">Allowed Rod Pocket Options (leave empty for all)</s-text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      {rodPocketOptions.map((o) => (
                                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: (piece.allowedRodPocketIds || []).includes(o.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                          <input type="checkbox" checked={(piece.allowedRodPocketIds || []).includes(o.id)} onChange={() => togglePieceArrayItem(idx, "allowedRodPocketIds", o.id)} />
                                          {o.name}
                                        </label>
                                      ))}
                                    </div>
                                  </s-stack>
                                )}

                                {/* Hidden values for this piece */}
                                <s-text fontWeight="medium">Hidden Values (when section is hidden)</s-text>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                                  {!piece.showShapeSection && shapes.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Shape</label>
                                      <select value={piece.hiddenShapeId} onChange={(e) => updatePiece(idx, "hiddenShapeId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {shapes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showFillSection && fillTypes.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Fill</label>
                                      <select value={piece.hiddenFillTypeId} onChange={(e) => updatePiece(idx, "hiddenFillTypeId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {fillTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showPipingSection && pipingOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Piping</label>
                                      <select value={piece.hiddenPipingId} onChange={(e) => updatePiece(idx, "hiddenPipingId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {pipingOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showButtonSection && buttonOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Button</label>
                                      <select value={piece.hiddenButtonId} onChange={(e) => updatePiece(idx, "hiddenButtonId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {buttonOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showAntiSkidSection && antiSkidOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Anti-Skid</label>
                                      <select value={piece.hiddenAntiSkidId} onChange={(e) => updatePiece(idx, "hiddenAntiSkidId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {antiSkidOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showTiesSection && tiesOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Ties</label>
                                      <select value={piece.hiddenTiesId} onChange={(e) => updatePiece(idx, "hiddenTiesId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {tiesOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showDesignSection && designOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Design</label>
                                      <select value={piece.hiddenDesignId} onChange={(e) => updatePiece(idx, "hiddenDesignId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {designOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showFabricTiesSection && fabricTiesOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Fabric Ties</label>
                                      <select value={piece.hiddenFabricTiesId} onChange={(e) => updatePiece(idx, "hiddenFabricTiesId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {fabricTiesOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                  {!piece.showRodPocketSection && rodPocketOptions.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "12px" }}>Hidden Rod Pocket</label>
                                      <select value={piece.hiddenRodPocketId} onChange={(e) => updatePiece(idx, "hiddenRodPocketId", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}>
                                        <option value="">None</option>
                                        {rodPocketOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </s-stack>
                            )}
                          </s-stack>
                        </s-box>
                      ))}
                    </s-stack>
                  </s-stack>
                )}
              </s-stack>

              {/* Section Visibility */}
              <s-stack direction="block" gap="base">
                <s-text fontWeight="semibold">Section Visibility</s-text>
                <s-text tone="subdued">{form.enableMultiPiece ? "Fabric and Instructions are configured here. Other sections are configured per-piece above." : "Toggle which calculator sections are shown"}</s-text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                  {!form.enableMultiPiece && (
                    <>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showShapeSection} onChange={(e) => setForm({ ...form, showShapeSection: e.target.checked })} />
                        Shape Selection
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showDimensionsSection} onChange={(e) => setForm({ ...form, showDimensionsSection: e.target.checked })} />
                        Dimensions
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showFillSection} onChange={(e) => setForm({ ...form, showFillSection: e.target.checked })} />
                        Fill Type
                      </label>
                    </>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={form.showFabricSection} onChange={(e) => setForm({ ...form, showFabricSection: e.target.checked })} />
                    Fabric
                  </label>
                  {!form.enableMultiPiece && (
                    <>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showPipingSection} onChange={(e) => setForm({ ...form, showPipingSection: e.target.checked })} />
                        Piping Options
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showButtonSection} onChange={(e) => setForm({ ...form, showButtonSection: e.target.checked })} />
                        Button Style
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showAntiSkidSection} onChange={(e) => setForm({ ...form, showAntiSkidSection: e.target.checked })} />
                        Anti-Skid
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showTiesSection} onChange={(e) => setForm({ ...form, showTiesSection: e.target.checked })} />
                        Ties
                      </label>
                    </>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={form.showDesignSection} onChange={(e) => setForm({ ...form, showDesignSection: e.target.checked })} />
                    Design
                  </label>
                  {!form.enableMultiPiece && (
                    <>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showRodPocketSection} onChange={(e) => setForm({ ...form, showRodPocketSection: e.target.checked })} />
                        Rod Pocket
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={form.showFabricTiesSection} onChange={(e) => setForm({ ...form, showFabricTiesSection: e.target.checked })} />
                        Fabric Ties
                      </label>
                    </>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={form.showInstructions} onChange={(e) => setForm({ ...form, showInstructions: e.target.checked })} />
                    Special Instructions
                  </label>
                </div>
              </s-stack>

              {/* Hidden Values - When sections are hidden but need values */}
              <s-stack direction="block" gap="base">
                <s-text fontWeight="semibold">Hidden Section Values</s-text>
                <s-text tone="subdued">When a section is hidden, you can still apply a preset value to the calculation</s-text>

                {!form.enableMultiPiece && !form.showShapeSection && shapes.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Shape Value</label>
                    <select
                      value={form.hiddenShapeId}
                      onChange={(e) => setForm({ ...form, hiddenShapeId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no shape)</option>
                      {shapes.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showFillSection && fillTypes.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Fill Type Value</label>
                    <select
                      value={form.hiddenFillTypeId}
                      onChange={(e) => setForm({ ...form, hiddenFillTypeId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no fill cost)</option>
                      {fillTypes.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} (${f.pricePerCubicInch}/cu.in.)</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.showFabricSection && fabrics.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Fabric Value</label>
                    <select
                      value={form.hiddenFabricId}
                      onChange={(e) => setForm({ ...form, hiddenFabricId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no fabric cost)</option>
                      {fabrics.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} (${f.pricePerSqInch}/sq.in.)</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showPipingSection && pipingOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Piping Value</label>
                    <select
                      value={form.hiddenPipingId}
                      onChange={(e) => setForm({ ...form, hiddenPipingId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no piping cost)</option>
                      {pipingOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.percent}%)</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showButtonSection && buttonOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Button Style Value</label>
                    <select
                      value={form.hiddenButtonId}
                      onChange={(e) => setForm({ ...form, hiddenButtonId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no button cost)</option>
                      {buttonOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.percent}%)</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showAntiSkidSection && antiSkidOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Anti-Skid Value</label>
                    <select
                      value={form.hiddenAntiSkidId}
                      onChange={(e) => setForm({ ...form, hiddenAntiSkidId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no anti-skid cost)</option>
                      {antiSkidOptions.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.percent}%)</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showTiesSection && tiesOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Ties Value</label>
                    <select
                      value={form.hiddenTiesId}
                      onChange={(e) => setForm({ ...form, hiddenTiesId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no ties cost)</option>
                      {tiesOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} (${t.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.showDesignSection && designOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Design Value</label>
                    <select
                      value={form.hiddenDesignId}
                      onChange={(e) => setForm({ ...form, hiddenDesignId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no design cost)</option>
                      {designOptions.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.percent}%)</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showFabricTiesSection && fabricTiesOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Fabric Ties Value</label>
                    <select
                      value={form.hiddenFabricTiesId}
                      onChange={(e) => setForm({ ...form, hiddenFabricTiesId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no fabric ties cost)</option>
                      {fabricTiesOptions.map((ft) => (
                        <option key={ft.id} value={ft.id}>{ft.name} (${ft.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.enableMultiPiece && !form.showRodPocketSection && rodPocketOptions.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Hidden Rod Pocket Value</label>
                    <select
                      value={form.hiddenRodPocketId}
                      onChange={(e) => setForm({ ...form, hiddenRodPocketId: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">None (no rod pocket cost)</option>
                      {rodPocketOptions.map((rp) => (
                        <option key={rp.id} value={rp.id}>{rp.name} ({rp.percent}%)</option>
                      ))}
                    </select>
                  </div>
                )}
              </s-stack>

              {/* Allowed Shapes */}
              {!form.enableMultiPiece && form.showShapeSection && shapes.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Shapes</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all shapes</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {shapes.map((shape) => (
                      <label key={shape.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedShapeIds.includes(shape.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedShapeIds.includes(shape.id)} onChange={() => setForm({ ...form, allowedShapeIds: toggleArrayItem(form.allowedShapeIds, shape.id) })} />
                        {shape.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Fill Types */}
              {!form.enableMultiPiece && form.showFillSection && fillTypes.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Fill Types</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all fill types</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {fillTypes.map((fill) => (
                      <label key={fill.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedFillIds.includes(fill.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedFillIds.includes(fill.id)} onChange={() => setForm({ ...form, allowedFillIds: toggleArrayItem(form.allowedFillIds, fill.id) })} />
                        {fill.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Fabric Categories */}
              {form.showFabricSection && fabricCategories.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Fabric Categories</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all fabric categories. Checking a category will restrict fabric selection to only fabrics within those categories.</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {fabricCategories.map((category) => (
                      <label key={category.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedCategoryIds.includes(category.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedCategoryIds.includes(category.id)} onChange={() => setForm({ ...form, allowedCategoryIds: toggleArrayItem(form.allowedCategoryIds, category.id) })} />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Piping Options */}
              {!form.enableMultiPiece && form.showPipingSection && pipingOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Piping Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all piping options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {pipingOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedPipingIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedPipingIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedPipingIds: toggleArrayItem(form.allowedPipingIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Button Options */}
              {!form.enableMultiPiece && form.showButtonSection && buttonOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Button Style Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all button style options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {buttonOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedButtonIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedButtonIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedButtonIds: toggleArrayItem(form.allowedButtonIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Anti-Skid Options */}
              {!form.enableMultiPiece && form.showAntiSkidSection && antiSkidOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Anti-Skid Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all anti-skid options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {antiSkidOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedAntiSkidIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedAntiSkidIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedAntiSkidIds: toggleArrayItem(form.allowedAntiSkidIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Ties Options */}
              {!form.enableMultiPiece && form.showTiesSection && tiesOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Ties Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all ties options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {tiesOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedTiesIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedTiesIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedTiesIds: toggleArrayItem(form.allowedTiesIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Design Options */}
              {form.showDesignSection && designOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Design Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all design options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {designOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedDesignIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedDesignIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedDesignIds: toggleArrayItem(form.allowedDesignIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Fabric Ties Options */}
              {!form.enableMultiPiece && form.showFabricTiesSection && fabricTiesOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Fabric Ties Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all fabric ties options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {fabricTiesOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedFabricTiesIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedFabricTiesIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedFabricTiesIds: toggleArrayItem(form.allowedFabricTiesIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Allowed Rod Pocket Options */}
              {!form.enableMultiPiece && form.showRodPocketSection && rodPocketOptions.length > 0 && (
                <s-stack direction="block" gap="base">
                  <s-text fontWeight="semibold">Allowed Rod Pocket Options</s-text>
                  <s-text tone="subdued">Leave all unchecked to show all rod pocket options</s-text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {rodPocketOptions.map((opt) => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: form.allowedRodPocketIds.includes(opt.id) ? "#e0f0e0" : "#f5f5f5", borderRadius: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.allowedRodPocketIds.includes(opt.id)} onChange={() => setForm({ ...form, allowedRodPocketIds: toggleArrayItem(form.allowedRodPocketIds, opt.id) })} />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                </s-stack>
              )}

              {/* Settings */}
              <s-stack direction="block" gap="base">
                <s-text fontWeight="semibold">Profile Settings</s-text>
                <s-text-field
                  label="Sort Order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
                <div style={{ display: "flex", gap: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Active
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                    Default Profile (used when no profile is assigned)
                  </label>
                </div>
              </s-stack>

              {/* Actions */}
              <s-stack direction="inline" gap="base">
                <s-button onClick={submit}>{editing ? "Update Profile" : "Create Profile"}</s-button>
                <s-button variant="tertiary" onClick={() => { setShowForm(false); reset(); }}>Cancel</s-button>
              </s-stack>
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Profiles (${profiles.length})`}>
        {profiles.length === 0 ? (
          <s-box padding="base">
            <s-paragraph>No profiles yet. Create your first profile to customize calculator options per product.</s-paragraph>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {profiles.map((profile) => (
              <s-box key={profile.id} padding="base" borderWidth="base" borderRadius="base" background={profile.isActive ? "default" : "subdued"}>
                <s-stack direction="block" gap="tight">
                  <s-stack direction="inline" gap="base" align="center" wrap>
                    <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                      <s-stack direction="inline" gap="tight" align="center">
                        <s-text fontWeight="semibold">{profile.name}</s-text>
                        {profile.isDefault && <span style={{ background: "#5c6ac4", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>Default</span>}
                        {!profile.isActive && <span style={{ background: "#999", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>Inactive</span>}
                        {profile.additionalPercent > 0 && <span style={{ background: "#e0f0e0", color: "#2e7d32", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>+{profile.additionalPercent}%</span>}
                        {profile.enableMultiPiece && <span style={{ background: "#fff3e0", color: "#e65100", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{profile.pieces?.length || 0} pieces</span>}
                      </s-stack>
                      {profile.description && <s-text tone="subdued">{profile.description}</s-text>}
                      <s-text tone="subdued" fontSize="small">Sections: {getSectionSummary(profile)}</s-text>
                      <s-text tone="subdued" fontSize="small">Profile ID: <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "3px" }}>{profile.id}</code></s-text>
                    </s-stack>
                    <s-stack direction="inline" gap="tight">
                      <s-button variant="tertiary" onClick={() => handleEdit(profile)}>Edit</s-button>
                      <s-button variant="tertiary" tone="critical" onClick={() => handleDelete(profile.id)}>Delete</s-button>
                    </s-stack>
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
