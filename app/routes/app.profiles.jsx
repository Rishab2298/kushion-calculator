import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";
import { Badge, StatusBadge, Switch, TextField, SelectField, Checkbox, Modal, ConfirmModal, Chevron, BackButton, EmptyState, UnsavedChangesBar, LeaveConfirmModal } from "../components/admin-ui";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [profiles, shapes, fillTypes, fabricCategories, fabrics, pipingOptions, buttonOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions, drawstringOptions] = await Promise.all([
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
    prisma.drawstringOption.findMany({ where: { shop, isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return { profiles, shapes, fillTypes, fabricCategories, fabrics, pipingOptions, buttonOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions, drawstringOptions };
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
        enableWeatherproof: formData.get("enableWeatherproof") === "true",
        isCoverProduct: formData.get("isCoverProduct") === "true",
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
        showDrawstringSection: formData.get("showDrawstringSection") === "true",
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
        allowedDrawstringIds: formData.get("allowedDrawstringIds") || null,
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
        hiddenDrawstringId: formData.get("hiddenDrawstringId") || null,
        isDefault: formData.get("isDefault") === "true",
        isActive: formData.get("isActive") !== "false",
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
            showDrawstringSection: p.showDrawstringSection ?? true,
            allowedShapeIds: p.allowedShapeIds || null,
            allowedFillIds: p.allowedFillIds || null,
            allowedPipingIds: p.allowedPipingIds || null,
            allowedButtonIds: p.allowedButtonIds || null,
            allowedAntiSkidIds: p.allowedAntiSkidIds || null,
            allowedTiesIds: p.allowedTiesIds || null,
            allowedDesignIds: p.allowedDesignIds || null,
            allowedFabricTiesIds: p.allowedFabricTiesIds || null,
            allowedRodPocketIds: p.allowedRodPocketIds || null,
            allowedDrawstringIds: p.allowedDrawstringIds || null,
            hiddenShapeId: p.hiddenShapeId || null,
            hiddenFillTypeId: p.hiddenFillTypeId || null,
            hiddenPipingId: p.hiddenPipingId || null,
            hiddenButtonId: p.hiddenButtonId || null,
            hiddenAntiSkidId: p.hiddenAntiSkidId || null,
            hiddenTiesId: p.hiddenTiesId || null,
            hiddenDesignId: p.hiddenDesignId || null,
            hiddenFabricTiesId: p.hiddenFabricTiesId || null,
            hiddenRodPocketId: p.hiddenRodPocketId || null,
            hiddenDrawstringId: p.hiddenDrawstringId || null,
            defaultShapeId: p.defaultShapeId || null,
            defaultFillId: p.defaultFillId || null,
          })),
        },
      },
    });
    invalidateConfigCache(shop);
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
        enableWeatherproof: formData.get("enableWeatherproof") === "true",
        isCoverProduct: formData.get("isCoverProduct") === "true",
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
        showDrawstringSection: formData.get("showDrawstringSection") === "true",
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
        allowedDrawstringIds: formData.get("allowedDrawstringIds") || null,
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
        hiddenDrawstringId: formData.get("hiddenDrawstringId") || null,
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
            showDrawstringSection: p.showDrawstringSection ?? true,
            allowedShapeIds: p.allowedShapeIds || null,
            allowedFillIds: p.allowedFillIds || null,
            allowedPipingIds: p.allowedPipingIds || null,
            allowedButtonIds: p.allowedButtonIds || null,
            allowedAntiSkidIds: p.allowedAntiSkidIds || null,
            allowedTiesIds: p.allowedTiesIds || null,
            allowedDesignIds: p.allowedDesignIds || null,
            allowedFabricTiesIds: p.allowedFabricTiesIds || null,
            allowedRodPocketIds: p.allowedRodPocketIds || null,
            allowedDrawstringIds: p.allowedDrawstringIds || null,
            hiddenShapeId: p.hiddenShapeId || null,
            hiddenFillTypeId: p.hiddenFillTypeId || null,
            hiddenPipingId: p.hiddenPipingId || null,
            hiddenButtonId: p.hiddenButtonId || null,
            hiddenAntiSkidId: p.hiddenAntiSkidId || null,
            hiddenTiesId: p.hiddenTiesId || null,
            hiddenDesignId: p.hiddenDesignId || null,
            hiddenFabricTiesId: p.hiddenFabricTiesId || null,
            hiddenRodPocketId: p.hiddenRodPocketId || null,
            hiddenDrawstringId: p.hiddenDrawstringId || null,
            defaultShapeId: p.defaultShapeId || null,
            defaultFillId: p.defaultFillId || null,
          })),
        },
      },
    });
    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.calculatorProfile.delete({ where: { id: formData.get("id") } });
    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "duplicate") {
    const source = await prisma.calculatorProfile.findFirst({
      where: { id: formData.get("id"), shop },
      include: { pieces: { orderBy: { sortOrder: "asc" } } },
    });
    if (!source) return { success: false, intent, error: "This profile no longer exists. Refresh the page and try again." };

    const name = (formData.get("name") || "").trim();
    if (!name) return { success: false, intent, error: "Enter a name for the copy." };
    const clash = await prisma.calculatorProfile.findFirst({ where: { shop, name } });
    if (clash) return { success: false, intent, error: `A profile named "${name}" already exists. Choose another name.` };

    // Copy every stored field except identity/timestamps; the copy is never the default.
    // eslint-disable-next-line no-unused-vars
    const { id: _id, shop: _shop, createdAt: _c, updatedAt: _u, pieces, ...fields } = source;
    const created = await prisma.calculatorProfile.create({
      data: {
        ...fields,
        shop,
        name,
        isDefault: false,
        isActive: formData.get("isActive") === "true",
        pieces: {
          // eslint-disable-next-line no-unused-vars
          create: pieces.map(({ id: _pid, profileId: _pp, createdAt: _pc, updatedAt: _pu, ...piece }) => piece),
        },
      },
    });
    invalidateConfigCache(shop);
    return { success: true, intent, duplicatedId: created.id };
  }

  return { success: false };
};

// Calculator sections in the order merchants think about them. Keys map to the
// show/allowed/hidden fields on CalculatorProfile and ProfilePiece.
const SECTION_GROUPS = [
  { title: "Size and shape", keys: ["shape", "dimensions"] },
  { title: "Materials", keys: ["fill", "fabric", "design"] },
  { title: "Finishing", keys: ["piping", "button", "antiSkid", "ties", "fabricTies", "rodPocket", "drawstring"] },
  { title: "Order notes", keys: ["instructions"] },
];
const ALL_SECTION_KEYS = SECTION_GROUPS.flatMap((g) => g.keys);
// In multi-piece mode these are configured once for the whole profile; everything else is per piece.
const SHARED_KEYS = ["fabric", "design", "instructions"];
// Pieces have no fabric or instructions fields.
const PIECE_KEYS = ALL_SECTION_KEYS.filter((k) => k !== "fabric" && k !== "instructions");

const parseIds = (value) => (value ? JSON.parse(value) : []);

export default function Profiles() {
  const { profiles, shapes, fillTypes, fabricCategories, fabrics, pipingOptions, buttonOptions, antiSkidOptions, tiesOptions, designOptions, fabricTiesOptions, rodPocketOptions, drawstringOptions } = useLoaderData();
  const fetcher = useFetcher();
  const dupFetcher = useFetcher();
  const shopify = useAppBridge();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const defaultForm = {
    name: "",
    description: "",
    additionalPercent: 0,
    enableMultiPiece: false,
    piecesLabel: "",
    enableWeatherproof: false,
    isCoverProduct: false,
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
    showDrawstringSection: true,
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
    allowedDrawstringIds: [],
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
    hiddenDrawstringId: "",
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
    showDrawstringSection: true,
    allowedShapeIds: [],
    allowedFillIds: [],
    allowedPipingIds: [],
    allowedButtonIds: [],
    allowedAntiSkidIds: [],
    allowedTiesIds: [],
    allowedDesignIds: [],
    allowedFabricTiesIds: [],
    allowedRodPocketIds: [],
    allowedDrawstringIds: [],
    hiddenShapeId: "",
    hiddenFillTypeId: "",
    hiddenPipingId: "",
    hiddenButtonId: "",
    hiddenAntiSkidId: "",
    hiddenTiesId: "",
    hiddenDesignId: "",
    hiddenFabricTiesId: "",
    hiddenRodPocketId: "",
    hiddenDrawstringId: "",
    defaultShapeId: "",
    defaultFillId: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(defaultForm));
  const [activePiece, setActivePiece] = useState(0);
  const [openRows, setOpenRows] = useState(() => new Set());
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [dupSource, setDupSource] = useState(null);
  const [dupName, setDupName] = useState("");
  const [dupInactive, setDupInactive] = useState(false);
  const [dupOpen, setDupOpen] = useState(true);
  const [dupError, setDupError] = useState("");
  const [pendingDuplicate, setPendingDuplicate] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const isDirty = showForm && JSON.stringify(form) !== savedSnapshot;

  // ---- section metadata (needs loader data for option lists) ----
  const pct = (o) => `${o.name} (${o.percent}%)`;
  const price = (o) => `${o.name} ($${o.price})`;
  const SECTIONS = {
    shape: { name: "Shape", show: "showShapeSection", allowed: "allowedShapeIds", hidden: "hiddenShapeId", options: shapes, noun: "shapes", none: "None (no shape)", label: (o) => o.name },
    dimensions: { name: "Dimensions", show: "showDimensionsSection" },
    fill: { name: "Fill type", show: "showFillSection", allowed: "allowedFillIds", hidden: "hiddenFillTypeId", options: fillTypes, noun: "fill types", none: "None (no fill cost)", label: (f) => `${f.name} ($${f.pricePerCubicInch}/cu.in.)` },
    fabric: { name: "Fabric", show: "showFabricSection", allowed: "allowedCategoryIds", options: fabricCategories, hidden: "hiddenFabricId", hiddenOptions: fabrics, noun: "fabric categories", none: "None (no fabric cost)", label: (f) => f.name, hiddenLabel: (f) => `${f.name} ($${f.pricePerSqInch}/sq.in.)`, allowedHelp: "Customers only see fabrics in the selected categories." },
    design: { name: "Design", show: "showDesignSection", allowed: "allowedDesignIds", hidden: "hiddenDesignId", options: designOptions, noun: "designs", none: "None (no design cost)", label: pct },
    piping: { name: "Piping", show: "showPipingSection", allowed: "allowedPipingIds", hidden: "hiddenPipingId", options: pipingOptions, noun: "piping options", none: "None (no piping cost)", label: pct },
    button: { name: "Button style", show: "showButtonSection", allowed: "allowedButtonIds", hidden: "hiddenButtonId", options: buttonOptions, noun: "button styles", none: "None (no button cost)", label: pct },
    antiSkid: { name: "Anti-skid bottom", show: "showAntiSkidSection", allowed: "allowedAntiSkidIds", hidden: "hiddenAntiSkidId", options: antiSkidOptions, noun: "anti-skid options", none: "None (no anti-skid cost)", label: pct },
    ties: { name: "Ties", show: "showTiesSection", allowed: "allowedTiesIds", hidden: "hiddenTiesId", options: tiesOptions, noun: "ties options", none: "None (no ties cost)", label: price },
    fabricTies: { name: "Fabric ties", show: "showFabricTiesSection", allowed: "allowedFabricTiesIds", hidden: "hiddenFabricTiesId", options: fabricTiesOptions, noun: "fabric ties options", none: "None (no fabric ties cost)", label: price },
    rodPocket: { name: "Bottom rod pocket", show: "showRodPocketSection", allowed: "allowedRodPocketIds", hidden: "hiddenRodPocketId", options: rodPocketOptions, noun: "rod pocket options", none: "None (no bottom rod pocket cost)", label: pct },
    drawstring: { name: "Drawstring", show: "showDrawstringSection", allowed: "allowedDrawstringIds", hidden: "hiddenDrawstringId", options: drawstringOptions, noun: "drawstring options", none: "None (no drawstring cost)", label: pct },
    instructions: { name: "Special instructions", show: "showInstructions" },
  };

  // Which sections a saved profile shows to customers (for the list view).
  const shownKeys = (profile) => {
    if (!profile.enableMultiPiece) return ALL_SECTION_KEYS.filter((k) => profile[SECTIONS[k].show]);
    const on = new Set(SHARED_KEYS.filter((k) => profile[SECTIONS[k].show]));
    (profile.pieces || []).forEach((p) => PIECE_KEYS.forEach((k) => { if (p[SECTIONS[k].show]) on.add(k); }));
    return ALL_SECTION_KEYS.filter((k) => on.has(k));
  };

  const reset = () => {
    setForm({ ...defaultForm, sortOrder: profiles.length });
    setEditing(null);
    setActivePiece(0);
    setOpenRows(new Set());
  };

  const profileToForm = (profile) => ({
    name: profile.name,
    description: profile.description || "",
    additionalPercent: profile.additionalPercent || 0,
    enableMultiPiece: profile.enableMultiPiece || false,
    piecesLabel: profile.piecesLabel || "",
    enableWeatherproof: profile.enableWeatherproof || false,
    isCoverProduct: profile.isCoverProduct || false,
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
      showDrawstringSection: p.showDrawstringSection ?? true,
      allowedShapeIds: parseIds(p.allowedShapeIds),
      allowedFillIds: parseIds(p.allowedFillIds),
      allowedPipingIds: parseIds(p.allowedPipingIds),
      allowedButtonIds: parseIds(p.allowedButtonIds),
      allowedAntiSkidIds: parseIds(p.allowedAntiSkidIds),
      allowedTiesIds: parseIds(p.allowedTiesIds),
      allowedDesignIds: parseIds(p.allowedDesignIds),
      allowedFabricTiesIds: parseIds(p.allowedFabricTiesIds),
      allowedRodPocketIds: parseIds(p.allowedRodPocketIds),
      allowedDrawstringIds: parseIds(p.allowedDrawstringIds),
      hiddenShapeId: p.hiddenShapeId || "",
      hiddenFillTypeId: p.hiddenFillTypeId || "",
      hiddenPipingId: p.hiddenPipingId || "",
      hiddenButtonId: p.hiddenButtonId || "",
      hiddenAntiSkidId: p.hiddenAntiSkidId || "",
      hiddenTiesId: p.hiddenTiesId || "",
      hiddenDesignId: p.hiddenDesignId || "",
      hiddenFabricTiesId: p.hiddenFabricTiesId || "",
      hiddenRodPocketId: p.hiddenRodPocketId || "",
      hiddenDrawstringId: p.hiddenDrawstringId || "",
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
    showDrawstringSection: profile.showDrawstringSection ?? true,
    showInstructions: profile.showInstructions,
    allowedShapeIds: parseIds(profile.allowedShapeIds),
    allowedFillIds: parseIds(profile.allowedFillIds),
    allowedFabricIds: parseIds(profile.allowedFabricIds),
    allowedCategoryIds: parseIds(profile.allowedCategoryIds),
    allowedPipingIds: parseIds(profile.allowedPipingIds),
    allowedButtonIds: parseIds(profile.allowedButtonIds),
    allowedAntiSkidIds: parseIds(profile.allowedAntiSkidIds),
    allowedTiesIds: parseIds(profile.allowedTiesIds),
    allowedDesignIds: parseIds(profile.allowedDesignIds),
    allowedFabricTiesIds: parseIds(profile.allowedFabricTiesIds),
    allowedRodPocketIds: parseIds(profile.allowedRodPocketIds),
    allowedDrawstringIds: parseIds(profile.allowedDrawstringIds),
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
    hiddenDrawstringId: profile.hiddenDrawstringId || "",
    isDefault: profile.isDefault,
    isActive: profile.isActive,
    sortOrder: profile.sortOrder,
  });

  const handleEdit = (profile) => {
    const next = profileToForm(profile);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setEditing(profile);
    setActivePiece(0);
    setOpenRows(new Set());
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleAdd = () => {
    const next = { ...defaultForm, sortOrder: profiles.length };
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setEditing(null);
    setActivePiece(0);
    setOpenRows(new Set());
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const closeEditor = () => {
    // Belt and braces: make sure the App Bridge save bar is closed whenever the editor closes.
    Promise.resolve(shopify.saveBar?.hide?.("profile-save-bar")).catch(() => {});
    setShowForm(false);
    setConfirmLeave(false);
    reset();
  };

  const handleBack = () => {
    if (isDirty) setConfirmLeave(true);
    else closeEditor();
  };

  const submit = () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      shopify.toast.show("Add a profile name before saving", { isError: true });
      document.getElementById("profile-name")?.focus();
      return;
    }
    if (profiles.some((p) => p.name === trimmedName && p.id !== editing?.id)) {
      shopify.toast.show(`A profile named "${trimmedName}" already exists`, { isError: true });
      document.getElementById("profile-name")?.focus();
      return;
    }
    if (form.enableMultiPiece && form.pieces.some((p) => !p.name.trim())) {
      shopify.toast.show("Give every piece a name before saving", { isError: true });
      return;
    }

    const data = new FormData();
    data.append("intent", editing ? "update" : "create");
    if (editing) data.append("id", editing.id);

    data.append("name", trimmedName);
    data.append("description", form.description);
    data.append("additionalPercent", form.additionalPercent.toString());
    data.append("enableMultiPiece", form.enableMultiPiece.toString());
    data.append("piecesLabel", form.piecesLabel);
    data.append("enableWeatherproof", form.enableWeatherproof.toString());
    data.append("isCoverProduct", form.isCoverProduct.toString());
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
      allowedDrawstringIds: p.allowedDrawstringIds?.length > 0 ? JSON.stringify(p.allowedDrawstringIds) : null,
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
    data.append("showDrawstringSection", form.showDrawstringSection.toString());
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
    data.append("allowedDrawstringIds", form.allowedDrawstringIds.length > 0 ? JSON.stringify(form.allowedDrawstringIds) : "");
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
    data.append("hiddenDrawstringId", form.hiddenDrawstringId);
    data.append("isDefault", form.isDefault.toString());
    data.append("isActive", form.isActive.toString());
    data.append("sortOrder", form.sortOrder.toString());

    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editing ? "Profile saved" : "Profile created");
    closeEditor();
  };

  // ---- pieces ----
  const addPiece = () => {
    if (form.pieces.length >= 5) {
      shopify.toast.show("Maximum 5 pieces allowed", { isError: true });
      return;
    }
    setForm({ ...form, pieces: [...form.pieces, { ...defaultPiece, name: `Piece ${form.pieces.length + 1}` }] });
    setActivePiece(form.pieces.length);
  };

  const removePiece = (index) => {
    setForm({ ...form, pieces: form.pieces.filter((_, i) => i !== index) });
    setActivePiece(Math.max(0, index - 1));
  };

  const updatePiece = (index, field, value) => {
    const newPieces = [...form.pieces];
    newPieces[index] = { ...newPieces[index], [field]: value };
    setForm({ ...form, pieces: newPieces });
  };

  const movePiece = (index, direction) => {
    const newPieces = [...form.pieces];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newPieces.length) return;
    [newPieces[index], newPieces[newIndex]] = [newPieces[newIndex], newPieces[index]];
    setForm({ ...form, pieces: newPieces });
    setActivePiece(newIndex);
  };

  const setMultiPiece = (enabled) => {
    // Start a new multi-piece profile with one piece so there is something to configure.
    const pieces = enabled && form.pieces.length === 0 ? [{ ...defaultPiece, name: "Piece 1" }] : form.pieces;
    setForm({ ...form, enableMultiPiece: enabled, pieces });
    setActivePiece(0);
  };

  // ---- delete ----
  const confirmDelete = () => {
    const data = new FormData();
    data.append("intent", "delete");
    data.append("id", deleteTarget.id);
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show("Profile deleted");
    const wasEditing = editing?.id === deleteTarget.id;
    setDeleteTarget(null);
    if (wasEditing) closeEditor();
  };

  // ---- duplicate ----
  const openDuplicate = (profile) => {
    let base = `${profile.name} (copy)`;
    let n = 2;
    while (profiles.some((p) => p.name === base)) base = `${profile.name} (copy ${n++})`;
    setDupSource(profile);
    setDupName(base);
    setDupInactive(false);
    // Opening the copy replaces the editor, so don't default to it while there are unsaved edits.
    setDupOpen(!isDirty);
    setDupError("");
  };

  const submitDuplicate = () => {
    const name = dupName.trim();
    if (!name) { setDupError("Enter a name for the copy."); return; }
    if (profiles.some((p) => p.name === name)) { setDupError(`A profile named "${name}" already exists. Choose another name.`); return; }
    const data = new FormData();
    data.append("intent", "duplicate");
    data.append("id", dupSource.id);
    data.append("name", name);
    data.append("isActive", (!dupInactive).toString());
    dupFetcher.submit(data, { method: "POST" });
  };

  useEffect(() => {
    const result = dupFetcher.data;
    if (!result || result.intent !== "duplicate" || dupFetcher.state !== "idle") return;
    if (!result.success) { setDupError(result.error || "The profile couldn't be duplicated. Try again."); return; }
    shopify.toast.show("Profile duplicated");
    setPendingDuplicate({ id: result.duplicatedId, open: dupOpen });
    setDupSource(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dupFetcher.data, dupFetcher.state]);

  // Once the loader has revalidated and the copy is in the list, open it or highlight its row.
  useEffect(() => {
    if (!pendingDuplicate) return;
    const copy = profiles.find((p) => p.id === pendingDuplicate.id);
    if (!copy) return;
    if (pendingDuplicate.open) {
      handleEdit(copy);
    } else {
      // Stay where the merchant is; if they're in the editor, their unsaved edits are kept.
      setFlashId(copy.id);
      setTimeout(() => setFlashId(null), 2200);
    }
    setPendingDuplicate(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, pendingDuplicate]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      shopify.toast.show("Profile ID copied");
    } catch {
      shopify.toast.show("Couldn't copy. Open the profile and select the ID instead.", { isError: true });
    }
  };

  // ---- list filtering ----
  const visibleProfiles = useMemo(() => profiles.filter((p) => {
    if (filter === "single" && p.enableMultiPiece) return false;
    if (filter === "multi" && !p.enableMultiPiece) return false;
    if (filter === "inactive" && p.isActive) return false;
    return p.name.toLowerCase().includes(query.trim().toLowerCase());
  }), [profiles, filter, query]);

  // ---- section rows ----
  const toggleRow = (rowId) => {
    const next = new Set(openRows);
    next.has(rowId) ? next.delete(rowId) : next.add(rowId);
    setOpenRows(next);
  };

  const sectionSummary = (meta, values) => {
    const shown = values[meta.show];
    if (!meta.allowed) return shown ? "Shown to customers" : "Hidden";
    if (!shown) {
      const presetId = values[meta.hidden];
      if (!presetId) return `Hidden · ${meta.none}`;
      const preset = (meta.hiddenOptions || meta.options).find((o) => o.id === presetId);
      return preset ? `Hidden · always priced as ${(meta.hiddenLabel || meta.label)(preset)}` : "Hidden · preset value set";
    }
    const allowed = values[meta.allowed] || [];
    if (meta.options.length === 0) return `No ${meta.noun} set up yet`;
    if (allowed.length === 0) return `All ${meta.options.length} ${meta.noun}`;
    const names = meta.options.filter((o) => allowed.includes(o.id)).map((o) => o.name);
    return `${names.length} of ${meta.options.length}: ${names.join(", ")}`;
  };

  const renderSectionRow = (key, values, onChange, scope) => {
    const meta = SECTIONS[key];
    const rowId = `${scope}.${key}`;
    const expandable = !!meta.allowed;
    const open = expandable && openRows.has(rowId);
    const shown = values[meta.show];
    const allowed = values[meta.allowed] || [];
    const hiddenOptions = meta.hiddenOptions || meta.options || [];
    const hiddenLabel = meta.hiddenLabel || meta.label;
    return (
      <div key={rowId} className={`cc-srow${open ? " cc-srow--open" : ""}`}>
        <div
          className="cc-srow__head"
          {...(expandable ? {
            role: "button",
            tabIndex: 0,
            "aria-expanded": open,
            onClick: () => toggleRow(rowId),
            onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRow(rowId); } },
          } : {})}
        >
          <span className="cc-srow__name">{meta.name}</span>
          <span className={`cc-srow__sum${expandable && !shown ? " cc-srow__sum--hidden" : ""}`}>{sectionSummary(meta, values)}</span>
          {expandable ? <Chevron /> : <span style={{ width: 16 }} />}
          <Switch checked={!!shown} label={`Show ${meta.name} to customers`} onChange={(v) => onChange(meta.show, v)} />
        </div>
        {open && (
          <div className="cc-srow__body">
            {shown ? (
              meta.options.length === 0 ? (
                <span className="cc-label cc-muted">No {meta.noun} set up yet. Add them on the {meta.name} page first.</span>
              ) : (
                <>
                  <span className="cc-label">Customers can choose from</span>
                  <div className="cc-chips">
                    <button type="button" className="cc-chip cc-chip--all" aria-pressed={allowed.length === 0} onClick={() => onChange(meta.allowed, [])}>
                      All {meta.noun}
                    </button>
                    {meta.options.map((o) => {
                      const on = allowed.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          className="cc-chip"
                          aria-pressed={on}
                          onClick={() => onChange(meta.allowed, on ? allowed.filter((i) => i !== o.id) : [...allowed, o.id])}
                        >
                          {o.name}
                        </button>
                      );
                    })}
                  </div>
                  <span className="cc-help">{meta.allowedHelp || `Pick specific ${meta.noun} to limit the choice, or keep "All".`}</span>
                </>
              )
            ) : hiddenOptions.length === 0 ? (
              <span className="cc-label cc-muted">This section is hidden and adds no cost.</span>
            ) : (
              <>
                <span className="cc-label">This section is hidden. Price it as</span>
                <select
                  className="cc-select"
                  style={{ maxWidth: 420 }}
                  value={values[meta.hidden] || ""}
                  onChange={(e) => onChange(meta.hidden, e.target.value)}
                  aria-label={`Preset ${meta.name} value`}
                >
                  <option value="">{meta.none}</option>
                  {hiddenOptions.map((o) => <option key={o.id} value={o.id}>{hiddenLabel(o)}</option>)}
                </select>
                <span className="cc-help">Customers won’t see this choice, but its price is still added.</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSectionList = (keys, values, onChange, scope) =>
    SECTION_GROUPS.map((g) => {
      const groupKeys = g.keys.filter((k) => keys.includes(k));
      if (groupKeys.length === 0) return null;
      return (
        <div key={g.title}>
          <div className="cc-group-title">{g.title}</div>
          {groupKeys.map((k) => renderSectionRow(k, values, onChange, scope))}
        </div>
      );
    });

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ---------------------------------------------------------------- render
  const duplicateModal = dupSource && (() => {
    const on = shownKeys(dupSource).length;
    return (
      <Modal
        open
        title={`Duplicate “${dupSource.name}”`}
        onClose={() => setDupSource(null)}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={() => setDupSource(null)}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" disabled={dupFetcher.state !== "idle"} onClick={submitDuplicate}>
              {dupFetcher.state !== "idle" ? "Duplicating…" : "Duplicate profile"}
            </button>
          </>
        }
      >
        <TextField
          id="dup-name"
          label="Name for the copy"
          value={dupName}
          onChange={(v) => { setDupName(v); setDupError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitDuplicate(); } }}
          error={dupError}
        />
        <div>
          <div className="cc-label" style={{ marginBottom: 4 }}>The copy includes</div>
          <ul className="cc-muted cc-small" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 2 }}>
            <li>{on} of {ALL_SECTION_KEYS.length} sections shown to customers{dupSource.enableMultiPiece ? `, across ${dupSource.pieces?.length || 0} pieces` : ""}</li>
            <li>Every limited choice and hidden-section price</li>
            <li>{dupSource.additionalPercent ? `+${dupSource.additionalPercent}% markup` : "No markup"}{dupSource.enableWeatherproof ? ", weatherproof mode" : ""}</li>
          </ul>
        </div>
        <span className="cc-help">
          The copy gets a new profile ID, so no products use it until you assign it. It is never the default profile.
          {isDirty ? " Your unsaved changes in the editor are not copied, and opening the copy discards them." : ""}
        </span>
        <Checkbox id="dup-inactive" checked={dupInactive} onChange={setDupInactive} label="Start as inactive" />
        <Checkbox id="dup-open" checked={dupOpen} onChange={setDupOpen} label="Open the copy for editing" />
      </Modal>
    );
  })();

  const deleteModal = (
    <ConfirmModal
      open={!!deleteTarget}
      title={`Delete “${deleteTarget?.name}”?`}
      confirmLabel="Delete profile"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
    >
      <p className="cc-p">Products that use this profile will fall back to the default profile. This can’t be undone.</p>
    </ConfirmModal>
  );

  // Rendered as the first child of <s-page> in both the list and the editor so it stays mounted:
  // unmounting an open App Bridge save bar leaves it stuck on screen after saving.
  const saveBar = <UnsavedChangesBar id="profile-save-bar" dirty={isDirty} onSave={submit} onDiscard={closeEditor} />;

  if (!showForm) {
    const tab = (key, label) => (
      <button type="button" className="cc-tab" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
    );
    return (
      <s-page heading="Calculator Profiles" inlineSize="large">
        {saveBar}
        <s-button slot="primary-action" variant="primary" onClick={handleAdd}>Add profile</s-button>
        <div className="cc-page">
          <div className="cc-card">
            <div className="cc-toolbar">
              <div className="cc-tabs">
                {tab("all", "All")}
                {tab("single", "Single piece")}
                {tab("multi", "Multi-piece")}
                {tab("inactive", "Inactive")}
              </div>
              <input className="cc-search" placeholder="Search profiles" aria-label="Search profiles" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {profiles.length === 0 ? (
              <EmptyState
                title="No profiles yet"
                action={<button type="button" className="cc-btn cc-btn--primary" onClick={handleAdd}>Add profile</button>}
              >
                Create a profile to choose which calculator options each product shows.
              </EmptyState>
            ) : (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr><th>Profile</th><th>Type</th><th>Options shown to customers</th><th>Markup</th><th>Status</th><th><span className="cc-visually-hidden">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {visibleProfiles.length === 0 && (
                      <tr><td colSpan={6} className="cc-muted">No profiles match your search.</td></tr>
                    )}
                    {visibleProfiles.map((profile) => {
                      const on = shownKeys(profile);
                      return (
                        <tr
                          key={profile.id}
                          className={`cc-clickable${profile.isActive ? "" : " cc-row--inactive"}${flashId === profile.id ? " cc-row--flash" : ""}`}
                          tabIndex={0}
                          onClick={() => handleEdit(profile)}
                          onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) handleEdit(profile); }}
                        >
                          <td>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <span className="cc-name">{profile.name}</span>
                              {profile.isDefault && <Badge tone="info">Default</Badge>}
                            </div>
                            {profile.description && <div className="cc-muted cc-small">{profile.description}</div>}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {profile.enableMultiPiece
                                ? <Badge tone="warning">{profile.pieces?.length || 0}-piece set</Badge>
                                : <span className="cc-muted">Single piece</span>}
                              {profile.enableWeatherproof && <Badge tone="info">Weatherproof</Badge>}
                              {profile.isCoverProduct && <Badge tone="info">Cover</Badge>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }} title={on.map((k) => SECTIONS[k].name).join(", ") || "None"}>
                              <span style={{ display: "flex", gap: 2 }} aria-hidden="true">
                                {ALL_SECTION_KEYS.map((k) => (
                                  <i key={k} style={{ width: 8, height: 14, borderRadius: 2, background: on.includes(k) ? "var(--cc-on)" : "var(--cc-surface-3)" }} />
                                ))}
                              </span>
                              <span className="cc-num cc-muted">{on.length} of {ALL_SECTION_KEYS.length}</span>
                            </div>
                          </td>
                          <td className="cc-num">{profile.additionalPercent > 0 ? `+${profile.additionalPercent}%` : <span className="cc-muted">—</span>}</td>
                          <td><StatusBadge active={profile.isActive} /></td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="cc-rowact">
                              <button type="button" className="cc-btn cc-btn--plain" onClick={() => copyId(profile.id)}>Copy ID</button>
                              <button type="button" className="cc-btn cc-btn--plain" onClick={() => openDuplicate(profile)}>Duplicate</button>
                              <button type="button" className="cc-btn" onClick={() => handleEdit(profile)}>Edit</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="cc-p cc-muted cc-small">
            Assign a profile to a product by setting its <strong>cushion_calculator.profile_id</strong> metafield to the profile ID.
          </p>
        </div>
        {duplicateModal}
        {deleteModal}
      </s-page>
    );
  }

  // ---- editor ----
  const piece = form.enableMultiPiece ? form.pieces[activePiece] : null;
  const onCount = shownKeys(form).length;
  const markup = Number(form.additionalPercent) || 0;
  const exampleSubtotal = 100;

  return (
    <s-page heading={editing ? editing.name : "New profile"} inlineSize="large">
      {saveBar}

      <div className="cc-page">
        <div className="cc-header">
          <BackButton onClick={handleBack} label="Back to profiles" />
          <h1>{form.name || "New profile"}</h1>
          <StatusBadge active={form.isActive} />
          {form.isDefault && <Badge tone="info">Default</Badge>}
          <span className="cc-spacer" />
          {editing && <button type="button" className="cc-btn" onClick={() => openDuplicate(editing)}>Duplicate</button>}
        </div>

        <div className="cc-layout">
          <div className="cc-main">
            <div className="cc-card">
              <div className="cc-card__head"><h2>Details</h2></div>
              <div className="cc-card__body">
                <TextField id="profile-name" label="Profile name" value={form.name} onChange={(v) => setField("name", v)} placeholder="e.g. Tufted Cushion" />
                <TextField id="profile-description" label="Description" value={form.description} onChange={(v) => setField("description", v)} placeholder="Only you see this" />
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Product type</h2></div>
              <div className="cc-card__body">
                <div className="cc-seg">
                  <button type="button" aria-pressed={!form.enableMultiPiece} onClick={() => setMultiPiece(false)}>
                    <strong>Single piece</strong><span>One cushion, one set of options</span>
                  </button>
                  <button type="button" aria-pressed={form.enableMultiPiece} onClick={() => setMultiPiece(true)}>
                    <strong>Multi-piece set</strong><span>e.g. Seat + Backrest, up to 5 pieces</span>
                  </button>
                </div>
                <Checkbox
                  id="profile-weatherproof"
                  checked={form.enableWeatherproof}
                  onChange={(v) => setField("enableWeatherproof", v)}
                  label="Weatherproof cover"
                  help="The cover leaves the base open, so fabric is priced on surface area without the base."
                />
                <Checkbox
                  id="profile-cover-product"
                  checked={form.isCoverProduct}
                  onChange={(v) => setField("isCoverProduct", v)}
                  label="Cover product"
                  help={'Shows "Height" instead of "Thickness" in the dimensions, e.g. for table and chair covers. Pricing is unchanged.'}
                />
              </div>
            </div>

            {form.enableMultiPiece && (
              <div className="cc-card">
                <div className="cc-card__head"><h2>Pieces</h2><span className="cc-card__meta">{form.pieces.length} of 5</span></div>
                <div className="cc-card__body" style={{ paddingBottom: 0 }}>
                  <TextField
                    id="profile-pieces-label"
                    label="Heading above the pieces"
                    value={form.piecesLabel}
                    onChange={(v) => setField("piecesLabel", v)}
                    placeholder="e.g. Cushion Components"
                    help="Shown to customers above the list of pieces in the calculator."
                  />
                </div>
                <div className="cc-ptabs">
                  {form.pieces.map((p, i) => (
                    <button key={i} type="button" className="cc-ptab" aria-pressed={activePiece === i} onClick={() => setActivePiece(i)}>
                      {p.name || `Piece ${i + 1}`}
                    </button>
                  ))}
                  {form.pieces.length < 5 && <button type="button" className="cc-btn cc-btn--plain" onClick={addPiece}>+ Add piece</button>}
                </div>
                {piece ? (
                  <>
                    <div className="cc-card__body">
                      <div className="cc-row2">
                        <TextField id="piece-name" label="Piece name" value={piece.name} onChange={(v) => updatePiece(activePiece, "name", v)} placeholder="e.g. Seat Base, Backrest" />
                        <TextField id="piece-label" label="Display label (optional)" value={piece.label} onChange={(v) => updatePiece(activePiece, "label", v)} placeholder="Overrides the name for customers" />
                      </div>
                      <div className="cc-row2">
                        {piece.showShapeSection && shapes.length > 0 ? (
                          <SelectField id="piece-default-shape" label="Pre-selected shape" value={piece.defaultShapeId} onChange={(v) => updatePiece(activePiece, "defaultShapeId", v)} placeholder="None" options={shapes.map((s) => ({ value: s.id, label: s.name }))} />
                        ) : <span />}
                        {piece.showFillSection && fillTypes.length > 0 ? (
                          <SelectField id="piece-default-fill" label="Pre-selected fill" value={piece.defaultFillId} onChange={(v) => updatePiece(activePiece, "defaultFillId", v)} placeholder="None" options={fillTypes.map((f) => ({ value: f.id, label: f.name }))} />
                        ) : <span />}
                      </div>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button type="button" className="cc-btn cc-btn--plain" disabled={activePiece === 0} onClick={() => movePiece(activePiece, -1)}>Move left</button>
                        <button type="button" className="cc-btn cc-btn--plain" disabled={activePiece === form.pieces.length - 1} onClick={() => movePiece(activePiece, 1)}>Move right</button>
                        <button type="button" className="cc-btn cc-btn--critical" onClick={() => removePiece(activePiece)}>Remove piece</button>
                      </div>
                    </div>
                    <div className="cc-card__head" style={{ paddingTop: 0 }}><h2>Options for {piece.name || `Piece ${activePiece + 1}`}</h2></div>
                    <div className="cc-card__flush">
                      {renderSectionList(PIECE_KEYS, piece, (field, value) => updatePiece(activePiece, field, value), `piece${activePiece}`)}
                    </div>
                  </>
                ) : (
                  <div className="cc-card__body cc-muted">Add the first piece to set up its options.</div>
                )}
              </div>
            )}

            <div className="cc-card">
              <div className="cc-card__head">
                <h2>{form.enableMultiPiece ? "Options shared by all pieces" : "Options shown to customers"}</h2>
                <span className="cc-card__meta">{onCount} of {ALL_SECTION_KEYS.length} on</span>
              </div>
              <div className="cc-card__body" style={{ paddingBottom: 0 }}>
                <p className="cc-p cc-muted">Turn a section off to hide it. Click a section to limit its choices, or to set the price used while it’s hidden.</p>
              </div>
              <div className="cc-card__flush">
                {renderSectionList(form.enableMultiPiece ? SHARED_KEYS : ALL_SECTION_KEYS, form, setField, "profile")}
              </div>
            </div>
          </div>

          <div className="cc-side">
            <div className="cc-card">
              <div className="cc-card__head"><h2>Status</h2></div>
              <div className="cc-card__body">
                <Checkbox id="profile-active" checked={form.isActive} onChange={(v) => setField("isActive", v)} label="Active" help="Inactive profiles are ignored on the storefront." />
                <Checkbox id="profile-default" checked={form.isDefault} onChange={(v) => setField("isDefault", v)} label="Default profile" help="Used for products with no profile assigned. Only one profile can be the default." />
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Pricing</h2></div>
              <div className="cc-card__body">
                <TextField
                  id="profile-markup"
                  label="Markup on subtotal (%)"
                  type="number"
                  value={form.additionalPercent}
                  onChange={(v) => setField("additionalPercent", parseFloat(v) || 0)}
                />
                <div className="cc-calc">
                  <div><span>Example subtotal</span><span>${exampleSubtotal.toFixed(2)}</span></div>
                  <div><span>Markup {markup}%</span><span>+${(exampleSubtotal * markup / 100).toFixed(2)}</span></div>
                  <div className="cc-calc__total"><span>Customer pays</span><span>${(exampleSubtotal * (1 + markup / 100)).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            {editing && (
              <div className="cc-card">
                <div className="cc-card__head"><h2>Assign to products</h2></div>
                <div className="cc-card__body">
                  <span className="cc-help">Set the product metafield <strong>cushion_calculator.profile_id</strong> to:</span>
                  <div className="cc-idbox">
                    <code>{editing.id}</code>
                    <button type="button" className="cc-btn cc-btn--plain" onClick={() => copyId(editing.id)}>Copy</button>
                  </div>
                </div>
              </div>
            )}

            <div className="cc-card">
              <div className="cc-card__head"><h2>List position</h2></div>
              <div className="cc-card__body">
                <TextField
                  id="profile-sort"
                  label="Sort order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(v) => setField("sortOrder", parseInt(v) || 0)}
                  help="Lower numbers appear first."
                />
              </div>
            </div>

            {editing && (
              <button type="button" className="cc-btn cc-btn--critical" style={{ justifySelf: "start" }} onClick={() => setDeleteTarget(editing)}>
                Delete profile
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--cc-border)", paddingTop: 16 }}>
          <button type="button" className="cc-btn" onClick={handleBack}>Cancel</button>
          <button type="button" className="cc-btn cc-btn--primary" onClick={submit}>{editing ? "Save" : "Create profile"}</button>
        </div>
      </div>

      <LeaveConfirmModal open={confirmLeave} onStay={() => setConfirmLeave(false)} onLeave={closeEditor} />
      {duplicateModal}
      {deleteModal}
    </s-page>
  );
}
