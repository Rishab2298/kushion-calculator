import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  // Pagination
  const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
  const perPage = Math.min(200, Math.max(25, parseInt(url.searchParams.get("perPage")) || 50));
  const skip = (page - 1) * perPage;

  // Filters
  const search = url.searchParams.get("search") || "";
  const categoryId = url.searchParams.get("categoryId") || "";
  const brandId = url.searchParams.get("brandId") || "";
  const patternId = url.searchParams.get("patternId") || "";
  const colorId = url.searchParams.get("colorId") || "";
  const priceTier = url.searchParams.get("priceTier") || "";
  const status = url.searchParams.get("status") || "";

  // Build where clause
  const where = { shop };
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (categoryId === "uncategorized") {
    where.categoryId = null;
  } else if (categoryId) {
    where.categoryId = categoryId;
  }
  if (brandId) where.brandId = brandId;
  if (priceTier) where.priceTier = priceTier;
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  // Junction table filters
  if (patternId) {
    where.patternAssignments = { some: { patternId } };
  }
  if (colorId) {
    where.colorAssignments = { some: { colorId } };
  }

  try {
    const [fabrics, totalCount, categories, brands, patterns, colors, materials] = await Promise.all([
      prisma.fabric.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          patternAssignments: { include: { pattern: { select: { id: true, name: true } } } },
          colorAssignments: { include: { color: { select: { id: true, name: true, hexCode: true } } } },
          materialAssignments: { include: { material: { select: { id: true, name: true } } } },
        },
        orderBy: { sortOrder: "asc" },
        skip,
        take: perPage,
      }),
      prisma.fabric.count({ where }),
      prisma.fabricCategory.findMany({ where: { shop }, orderBy: { sortOrder: "asc" } }),
      prisma.fabricBrand.findMany({
        where: { shop },
        include: { _count: { select: { fabrics: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.fabricPattern.findMany({
        where: { shop },
        include: { _count: { select: { fabricAssignments: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.fabricColor.findMany({
        where: { shop },
        include: { _count: { select: { fabricAssignments: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.fabricMaterial.findMany({
        where: { shop },
        include: { _count: { select: { fabricAssignments: true } } },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / perPage);

    return {
      fabrics: fabrics.map(f => ({
        ...f,
        patterns: f.patternAssignments.map(a => a.pattern),
        colors: f.colorAssignments.map(a => a.color),
        materials: f.materialAssignments.map(a => a.material),
      })),
      pagination: { page, perPage, totalCount, totalPages },
      categories,
      brands,
      patterns,
      colors,
      materials,
      filters: { search, categoryId, brandId, patternId, colorId, priceTier, status },
      shop,
    };
  } catch (error) {
    console.error("Error loading fabrics:", error);
    return {
      fabrics: [], pagination: { page: 1, perPage: 50, totalCount: 0, totalPages: 0 },
      categories: [], brands: [], patterns: [], colors: [], materials: [],
      filters: { search: "", categoryId: "", brandId: "", patternId: "", colorId: "", priceTier: "", status: "" },
      shop,
    };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  // ---- Category CRUD ----
  if (intent === "createCategory") {
    await prisma.fabricCategory.create({
      data: {
        shop,
        name: formData.get("name"),
        description: formData.get("description") || null,
        imageUrl: formData.get("imageUrl") || null,
        isActive: true,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "updateCategory") {
    await prisma.fabricCategory.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"),
        description: formData.get("description") || null,
        imageUrl: formData.get("imageUrl") || null,
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "deleteCategory") {
    await prisma.fabricCategory.delete({ where: { id: formData.get("id") } });
    invalidateConfigCache(shop);
    return { success: true };
  }

  // ---- Brand CRUD ----
  if (intent === "createBrand") {
    await prisma.fabricBrand.create({
      data: {
        shop,
        name: formData.get("name"),
        logoUrl: formData.get("logoUrl") || null,
        description: formData.get("description") || null,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "updateBrand") {
    await prisma.fabricBrand.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"),
        logoUrl: formData.get("logoUrl") || null,
        description: formData.get("description") || null,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "deleteBrand") {
    await prisma.fabricBrand.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  // ---- Pattern CRUD ----
  if (intent === "createPattern") {
    await prisma.fabricPattern.create({
      data: {
        shop,
        name: formData.get("name"),
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "updatePattern") {
    await prisma.fabricPattern.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"),
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "deletePattern") {
    await prisma.fabricPattern.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  // ---- Color CRUD ----
  if (intent === "createColor") {
    await prisma.fabricColor.create({
      data: {
        shop,
        name: formData.get("name"),
        hexCode: formData.get("hexCode") || null,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "updateColor") {
    await prisma.fabricColor.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"),
        hexCode: formData.get("hexCode") || null,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "deleteColor") {
    await prisma.fabricColor.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  // ---- Material CRUD ----
  if (intent === "createMaterial") {
    await prisma.fabricMaterial.create({
      data: {
        shop,
        name: formData.get("name"),
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "updateMaterial") {
    await prisma.fabricMaterial.update({
      where: { id: formData.get("id") },
      data: {
        name: formData.get("name"),
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
      },
    });
    return { success: true };
  }

  if (intent === "deleteMaterial") {
    await prisma.fabricMaterial.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  // ---- Fabric CRUD ----
  if (intent === "createFabric") {
    const patternIds = JSON.parse(formData.get("patternIds") || "[]");
    const colorIds = JSON.parse(formData.get("colorIds") || "[]");
    const materialIds = JSON.parse(formData.get("materialIds") || "[]");

    const isDefault = formData.get("isDefault") === "true";
    if (isDefault) {
      // Only unset defaults within the same category
      const categoryId = formData.get("categoryId") || null;
      await prisma.fabric.updateMany({
        where: { shop, isDefault: true, categoryId: categoryId },
        data: { isDefault: false }
      });
    }

    const fabric = await prisma.fabric.create({
      data: {
        shop,
        categoryId: formData.get("categoryId") || null,
        name: formData.get("name"),
        imageUrl: formData.get("imageUrl") || null,
        pricePerSqInch: parseFloat(formData.get("pricePerSqInch")) || 0,
        description: formData.get("description") || null,
        priceTier: formData.get("priceTier") || "none",
        brandId: formData.get("brandId") || null,
        isActive: formData.get("isActive") !== "false",
        isDefault,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
        discountEnabled: formData.get("discountEnabled") === "true",
        discountPercent: parseFloat(formData.get("discountPercent")) || 0,
      },
    });

    // Create junction entries
    if (patternIds.length > 0) {
      await prisma.fabricPatternAssignment.createMany({
        data: patternIds.map(pid => ({ fabricId: fabric.id, patternId: pid })),
      });
    }
    if (colorIds.length > 0) {
      await prisma.fabricColorAssignment.createMany({
        data: colorIds.map(cid => ({ fabricId: fabric.id, colorId: cid })),
      });
    }
    if (materialIds.length > 0) {
      await prisma.fabricMaterialAssignment.createMany({
        data: materialIds.map(mid => ({ fabricId: fabric.id, materialId: mid })),
      });
    }

    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "updateFabric") {
    const fabricId = formData.get("id");
    const patternIds = JSON.parse(formData.get("patternIds") || "[]");
    const colorIds = JSON.parse(formData.get("colorIds") || "[]");
    const materialIds = JSON.parse(formData.get("materialIds") || "[]");

    const isDefault = formData.get("isDefault") === "true";
    if (isDefault) {
      // Only unset defaults within the same category, excluding the fabric being updated
      const categoryId = formData.get("categoryId") || null;
      await prisma.fabric.updateMany({
        where: { shop, isDefault: true, categoryId: categoryId, NOT: { id: fabricId } },
        data: { isDefault: false }
      });
    }

    await prisma.fabric.update({
      where: { id: fabricId },
      data: {
        categoryId: formData.get("categoryId") || null,
        name: formData.get("name"),
        imageUrl: formData.get("imageUrl") || null,
        pricePerSqInch: parseFloat(formData.get("pricePerSqInch")) || 0,
        description: formData.get("description") || null,
        priceTier: formData.get("priceTier") || "none",
        brandId: formData.get("brandId") || null,
        isActive: formData.get("isActive") !== "false",
        isDefault,
        sortOrder: parseInt(formData.get("sortOrder")) || 0,
        discountEnabled: formData.get("discountEnabled") === "true",
        discountPercent: parseFloat(formData.get("discountPercent")) || 0,
      },
    });

    // Sync junction tables: delete all, re-create
    await Promise.all([
      prisma.fabricPatternAssignment.deleteMany({ where: { fabricId } }),
      prisma.fabricColorAssignment.deleteMany({ where: { fabricId } }),
      prisma.fabricMaterialAssignment.deleteMany({ where: { fabricId } }),
    ]);

    if (patternIds.length > 0) {
      await prisma.fabricPatternAssignment.createMany({
        data: patternIds.map(pid => ({ fabricId, patternId: pid })),
      });
    }
    if (colorIds.length > 0) {
      await prisma.fabricColorAssignment.createMany({
        data: colorIds.map(cid => ({ fabricId, colorId: cid })),
      });
    }
    if (materialIds.length > 0) {
      await prisma.fabricMaterialAssignment.createMany({
        data: materialIds.map(mid => ({ fabricId, materialId: mid })),
      });
    }

    invalidateConfigCache(shop);
    return { success: true };
  }

  if (intent === "deleteFabric") {
    await prisma.fabric.delete({ where: { id: formData.get("id") } });
    invalidateConfigCache(shop);
    return { success: true };
  }

  // ---- Bulk Actions ----
  if (intent === "bulkDelete") {
    const ids = JSON.parse(formData.get("ids") || "[]");
    if (ids.length > 0) {
      await prisma.fabric.deleteMany({ where: { id: { in: ids } } });
      invalidateConfigCache(shop);
    }
    return { success: true };
  }

  if (intent === "bulkUpdateTier") {
    const ids = JSON.parse(formData.get("ids") || "[]");
    const tier = formData.get("priceTier") || "none";
    if (ids.length > 0) {
      await prisma.fabric.updateMany({ where: { id: { in: ids } }, data: { priceTier: tier } });
      invalidateConfigCache(shop);
    }
    return { success: true };
  }

  return { success: false };
};

const TIER_LABELS = { none: "—", low: "$", medium: "$$", high: "$$$" };
const TABS = ["Fabrics", "Categories", "Brands", "Patterns", "Colors", "Materials"];

export default function Fabrics() {
  const { fabrics, pagination, categories, brands, patterns, colors, materials, filters, shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab
  const [activeTab, setActiveTab] = useState("Fabrics");

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal state
  const [showFabricModal, setShowFabricModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [editingFabric, setEditingFabric] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingPattern, setEditingPattern] = useState(null);
  const [editingColor, setEditingColor] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Bulk action state
  const [bulkAction, setBulkAction] = useState("");
  const [bulkTier, setBulkTier] = useState("none");
  // Fabric form state
  const defaultFabricData = {
    name: "", imageUrl: "", pricePerSqInch: "", categoryId: "", description: "",
    priceTier: "none", brandId: "", sortOrder: 0, isActive: true, isDefault: false,
    patternIds: [], colorIds: [], materialIds: [],
    discountEnabled: false, discountPercent: 0,
  };
  const [fabricData, setFabricData] = useState(defaultFabricData);

  // Category form state
  const [categoryData, setCategoryData] = useState({ name: "", description: "", imageUrl: "", sortOrder: 0, isActive: true });

  // Brand form state
  const [brandData, setBrandData] = useState({ name: "", logoUrl: "", description: "", sortOrder: 0 });

  // Pattern form state
  const [patternData, setPatternData] = useState({ name: "", sortOrder: 0 });

  // Color form state
  const [colorData, setColorData] = useState({ name: "", hexCode: "", sortOrder: 0 });

  // Material form state
  const [materialData, setMaterialData] = useState({ name: "", sortOrder: 0 });

  // --- Filter handlers ---
  const updateFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
    setSelectedIds(new Set());
  }, [searchParams, setSearchParams]);

  const changePage = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
    setSelectedIds(new Set());
  };

  const changePerPage = (newPerPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("perPage", newPerPage.toString());
    params.set("page", "1");
    setSearchParams(params);
    setSelectedIds(new Set());
  };

  // --- Selection handlers ---
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === fabrics.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fabrics.map(f => f.id)));
    }
  };

  // --- Fabric modal handlers ---
  const openAddFabric = () => {
    setFabricData({ ...defaultFabricData, sortOrder: pagination.totalCount });
    setEditingFabric(null);
    setShowFabricModal(true);
  };

  const openEditFabric = (fab) => {
    setFabricData({
      name: fab.name,
      imageUrl: fab.imageUrl || "",
      pricePerSqInch: fab.pricePerSqInch.toString(),
      categoryId: fab.categoryId || "",
      description: fab.description || "",
      priceTier: fab.priceTier || "none",
      brandId: fab.brandId || "",
      sortOrder: fab.sortOrder,
      isActive: fab.isActive,
      isDefault: fab.isDefault,
      patternIds: fab.patterns?.map(p => p.id) || [],
      colorIds: fab.colors?.map(c => c.id) || [],
      materialIds: fab.materials?.map(m => m.id) || [],
      discountEnabled: fab.discountEnabled || false,
      discountPercent: fab.discountPercent || 0,
    });
    setEditingFabric(fab);
    setShowFabricModal(true);
  };

  const submitFabric = () => {
    const data = new FormData();
    data.append("intent", editingFabric ? "updateFabric" : "createFabric");
    if (editingFabric) data.append("id", editingFabric.id);
    data.append("name", fabricData.name);
    data.append("imageUrl", fabricData.imageUrl);
    data.append("pricePerSqInch", fabricData.pricePerSqInch);
    data.append("categoryId", fabricData.categoryId);
    data.append("description", fabricData.description);
    data.append("priceTier", fabricData.priceTier);
    data.append("brandId", fabricData.brandId);
    data.append("sortOrder", fabricData.sortOrder.toString());
    data.append("isActive", fabricData.isActive.toString());
    data.append("isDefault", fabricData.isDefault.toString());
    data.append("patternIds", JSON.stringify(fabricData.patternIds));
    data.append("colorIds", JSON.stringify(fabricData.colorIds));
    data.append("materialIds", JSON.stringify(fabricData.materialIds));
    data.append("discountEnabled", fabricData.discountEnabled.toString());
    data.append("discountPercent", fabricData.discountPercent.toString());
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingFabric ? "Fabric updated" : "Fabric created");
    setShowFabricModal(false);
  };

  const deleteFabric = (id) => {
    if (confirm("Delete this fabric?")) {
      const data = new FormData();
      data.append("intent", "deleteFabric");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  // --- Category modal handlers ---
  const openAddCategory = () => {
    setCategoryData({ name: "", description: "", imageUrl: "", sortOrder: categories.length, isActive: true });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setCategoryData({ name: cat.name, description: cat.description || "", imageUrl: cat.imageUrl || "", sortOrder: cat.sortOrder, isActive: cat.isActive });
    setEditingCategory(cat);
    setShowCategoryModal(true);
  };

  const submitCategory = () => {
    const data = new FormData();
    data.append("intent", editingCategory ? "updateCategory" : "createCategory");
    if (editingCategory) data.append("id", editingCategory.id);
    Object.entries(categoryData).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingCategory ? "Category updated" : "Category created");
    setShowCategoryModal(false);
  };

  const deleteCategory = (id) => {
    if (confirm("Delete this category? Fabrics will become uncategorized.")) {
      const data = new FormData();
      data.append("intent", "deleteCategory");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  // --- Brand modal handlers ---
  const openAddBrand = () => {
    setBrandData({ name: "", logoUrl: "", description: "", sortOrder: brands.length });
    setEditingBrand(null);
    setShowBrandModal(true);
  };

  const openEditBrand = (brand) => {
    setBrandData({
      name: brand.name,
      logoUrl: brand.logoUrl || "",
      description: brand.description || "",
      sortOrder: brand.sortOrder,
    });
    setEditingBrand(brand);
    setShowBrandModal(true);
  };

  const submitBrand = () => {
    const data = new FormData();
    data.append("intent", editingBrand ? "updateBrand" : "createBrand");
    if (editingBrand) data.append("id", editingBrand.id);
    Object.entries(brandData).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingBrand ? "Brand updated" : "Brand created");
    setShowBrandModal(false);
  };

  const deleteBrand = (id) => {
    if (confirm("Delete this brand? Fabrics using it will be unlinked.")) {
      const data = new FormData();
      data.append("intent", "deleteBrand");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  // --- Pattern modal handlers ---
  const openAddPattern = () => {
    setPatternData({ name: "", sortOrder: patterns.length });
    setEditingPattern(null);
    setShowPatternModal(true);
  };

  const openEditPattern = (pattern) => {
    setPatternData({ name: pattern.name, sortOrder: pattern.sortOrder });
    setEditingPattern(pattern);
    setShowPatternModal(true);
  };

  const submitPattern = () => {
    const data = new FormData();
    data.append("intent", editingPattern ? "updatePattern" : "createPattern");
    if (editingPattern) data.append("id", editingPattern.id);
    Object.entries(patternData).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingPattern ? "Pattern updated" : "Pattern created");
    setShowPatternModal(false);
  };

  const deletePattern = (id) => {
    if (confirm("Delete this pattern? Fabric assignments will be removed.")) {
      const data = new FormData();
      data.append("intent", "deletePattern");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  // --- Color modal handlers ---
  const openAddColor = () => {
    setColorData({ name: "", hexCode: "", sortOrder: colors.length });
    setEditingColor(null);
    setShowColorModal(true);
  };

  const openEditColor = (color) => {
    setColorData({ name: color.name, hexCode: color.hexCode || "", sortOrder: color.sortOrder });
    setEditingColor(color);
    setShowColorModal(true);
  };

  const submitColor = () => {
    const data = new FormData();
    data.append("intent", editingColor ? "updateColor" : "createColor");
    if (editingColor) data.append("id", editingColor.id);
    Object.entries(colorData).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingColor ? "Color updated" : "Color created");
    setShowColorModal(false);
  };

  const deleteColor = (id) => {
    if (confirm("Delete this color? Fabric assignments will be removed.")) {
      const data = new FormData();
      data.append("intent", "deleteColor");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  // --- Material modal handlers ---
  const openAddMaterial = () => {
    setMaterialData({ name: "", sortOrder: materials.length });
    setEditingMaterial(null);
    setShowMaterialModal(true);
  };

  const openEditMaterial = (material) => {
    setMaterialData({ name: material.name, sortOrder: material.sortOrder });
    setEditingMaterial(material);
    setShowMaterialModal(true);
  };

  const submitMaterial = () => {
    const data = new FormData();
    data.append("intent", editingMaterial ? "updateMaterial" : "createMaterial");
    if (editingMaterial) data.append("id", editingMaterial.id);
    Object.entries(materialData).forEach(([k, v]) => data.append(k, v.toString()));
    fetcher.submit(data, { method: "POST" });
    shopify.toast.show(editingMaterial ? "Material updated" : "Material created");
    setShowMaterialModal(false);
  };

  const deleteMaterial = (id) => {
    if (confirm("Delete this material? Fabric assignments will be removed.")) {
      const data = new FormData();
      data.append("intent", "deleteMaterial");
      data.append("id", id);
      fetcher.submit(data, { method: "POST" });
    }
  };

  // --- Bulk action handler ---
  const executeBulkAction = () => {
    if (selectedIds.size === 0) return;
    const ids = JSON.stringify([...selectedIds]);

    if (bulkAction === "delete") {
      if (!confirm(`Delete ${selectedIds.size} fabric(s)?`)) return;
      const data = new FormData();
      data.append("intent", "bulkDelete");
      data.append("ids", ids);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show(`${selectedIds.size} fabrics deleted`);
      setSelectedIds(new Set());
    } else if (bulkAction === "setTier") {
      const data = new FormData();
      data.append("intent", "bulkUpdateTier");
      data.append("ids", ids);
      data.append("priceTier", bulkTier);
      fetcher.submit(data, { method: "POST" });
      shopify.toast.show(`Price tier updated for ${selectedIds.size} fabrics`);
      setSelectedIds(new Set());
    }
    setBulkAction("");
  };

  // --- CSV Export/Import handlers ---
  const exportCsv = () => {
    window.open(`/api/fabrics-csv?shop=${encodeURIComponent(shop)}`, "_blank");
    shopify.toast.show("Downloading CSV...");
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportCsv(event.target.result);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const submitImport = async () => {
    if (!importCsv.trim()) {
      shopify.toast.show("Please select a CSV file first", { isError: true });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("shop", shop);
      formData.append("csv", importCsv);
      const response = await fetch("/api/fabrics-csv", { method: "POST", body: formData });
      const result = await response.json();
      setImportResult(result);
      if (result.success) {
        shopify.toast.show(`Imported: ${result.created} created, ${result.updated} updated`);
        // Refresh the page to show new data
        window.location.reload();
      } else {
        shopify.toast.show(result.error || "Import failed", { isError: true });
      }
    } catch (err) {
      shopify.toast.show("Import failed: " + err.message, { isError: true });
    } finally {
      setImporting(false);
    }
  };

  // Multi-select toggle helper
  const toggleMultiSelect = (arr, id) => {
    return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
  };

  const selectStyle = { padding: "4px 6px", borderRadius: 3, border: "1px solid #ccc", fontSize: "0.75rem" };
  const tabStyle = (tab) => ({
    padding: "10px 16px",
    cursor: "pointer",
    borderBottom: activeTab === tab ? "3px solid #008060" : "3px solid transparent",
    color: activeTab === tab ? "#008060" : "#6d7175",
    fontWeight: activeTab === tab ? 600 : 400,
    background: "none",
    border: "none",
    fontSize: "0.9rem",
  });

  return (
    <s-page heading="Fabrics Management" fullWidth>
      {/* Tab navigation */}
      <s-section>
        <div style={{ display: "flex", borderBottom: "1px solid #e1e3e5", marginBottom: 16 }}>
          {TABS.map(tab => (
            <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
              {tab}
              {tab === "Fabrics" && ` (${pagination.totalCount})`}
              {tab === "Categories" && ` (${categories.length})`}
              {tab === "Brands" && ` (${brands.length})`}
              {tab === "Patterns" && ` (${patterns.length})`}
              {tab === "Colors" && ` (${colors.length})`}
              {tab === "Materials" && ` (${materials.length})`}
            </button>
          ))}
        </div>
      </s-section>

      {/* =============== FABRICS TAB =============== */}
      {activeTab === "Fabrics" && (
        <>
          <s-section>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <s-button variant="primary" onClick={openAddFabric}>Add Fabric</s-button>
              <s-button variant="secondary" onClick={exportCsv}>Export CSV</s-button>
              <s-button variant="secondary" onClick={() => { setShowImportModal(true); setImportCsv(""); setImportResult(null); }}>Import CSV</s-button>
            </div>
          </s-section>

          {/* Filters */}
          <s-section>
            <div style={{ display: "flex", flexWrap: "nowrap", gap: 6, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search..."
                defaultValue={filters.search}
                onKeyDown={(e) => { if (e.key === "Enter") updateFilter("search", e.target.value); }}
                onBlur={(e) => { if (e.target.value !== filters.search) updateFilter("search", e.target.value); }}
                style={{ padding: "4px 8px", borderRadius: 3, border: "1px solid #ccc", width: 140, fontSize: "0.75rem" }}
              />
              <select value={filters.categoryId} onChange={(e) => updateFilter("categoryId", e.target.value)} style={selectStyle}>
                <option value="">Category</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filters.brandId} onChange={(e) => updateFilter("brandId", e.target.value)} style={selectStyle}>
                <option value="">Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={filters.patternId} onChange={(e) => updateFilter("patternId", e.target.value)} style={selectStyle}>
                <option value="">Pattern</option>
                {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={filters.colorId} onChange={(e) => updateFilter("colorId", e.target.value)} style={selectStyle}>
                <option value="">Color</option>
                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} style={selectStyle}>
                <option value="">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </s-section>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <s-section>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "8px 0" }}>
                <s-text fontWeight="semibold">Selected: {selectedIds.size} of {pagination.totalCount}</s-text>
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={selectStyle}>
                  <option value="">Bulk Actions...</option>
                  <option value="delete">Delete Selected</option>
                  <option value="setTier">Set Price Tier</option>
                </select>
                {bulkAction === "setTier" && (
                  <select value={bulkTier} onChange={(e) => setBulkTier(e.target.value)} style={selectStyle}>
                    <option value="none">None</option>
                    <option value="low">$ Low</option>
                    <option value="medium">$$ Medium</option>
                    <option value="high">$$$ High</option>
                  </select>
                )}
                {bulkAction && (
                  <s-button variant="primary" onClick={executeBulkAction}>Apply</s-button>
                )}
              </div>
            </s-section>
          )}

          {/* Fabric table */}
          <s-section>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e1e3e5", textAlign: "left" }}>
                    <th style={{ padding: "8px 6px", width: 30 }}>
                      <input type="checkbox" checked={selectedIds.size === fabrics.length && fabrics.length > 0}
                        onChange={toggleSelectAll} />
                    </th>
                    <th style={{ padding: "8px 6px", width: 50 }}>Image</th>
                    <th style={{ padding: "8px 6px" }}>Name</th>
                    <th style={{ padding: "8px 6px" }}>Category</th>
                    <th style={{ padding: "8px 6px" }}>Brand</th>
                    <th style={{ padding: "8px 6px" }}>Tier</th>
                    <th style={{ padding: "8px 6px" }}>$/sq in</th>
                    <th style={{ padding: "8px 6px" }}>Status</th>
                    <th style={{ padding: "8px 6px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fabrics.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: 24, textAlign: "center", color: "#6d7175" }}>
                        No fabrics found. Adjust filters or add a new fabric.
                      </td>
                    </tr>
                  ) : fabrics.map(fab => (
                    <tr key={fab.id} style={{ borderBottom: "1px solid #e1e3e5", opacity: fab.isActive ? 1 : 0.55 }}>
                      <td style={{ padding: "6px" }}>
                        <input type="checkbox" checked={selectedIds.has(fab.id)} onChange={() => toggleSelect(fab.id)} />
                      </td>
                      <td style={{ padding: "6px" }}>
                        {fab.imageUrl ? (
                          <img src={fab.imageUrl} alt={fab.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: "#f0f0f0", borderRadius: 4 }} />
                        )}
                      </td>
                      <td style={{ padding: "6px", fontWeight: 500 }}>
                        {fab.name}
                        {fab.isDefault && <span style={{ marginLeft: 4, fontSize: "0.75rem", color: "#2c6ecb" }}>(Default)</span>}
                        {fab.discountEnabled && fab.discountPercent > 0 && (
                          <span style={{ marginLeft: 4, fontSize: "0.7rem", padding: "1px 5px", borderRadius: 8, backgroundColor: "#d4edda", color: "#155724", fontWeight: 600 }}>
                            -{fab.discountPercent}%
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "6px", color: "#6d7175" }}>{fab.category?.name || "—"}</td>
                      <td style={{ padding: "6px", color: "#6d7175" }}>{fab.brand?.name || "—"}</td>
                      <td style={{ padding: "6px" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: 4, fontSize: "0.8rem", fontWeight: 600,
                          backgroundColor: fab.priceTier === "high" ? "#ffd6a5" : fab.priceTier === "medium" ? "#fff3cd" : fab.priceTier === "low" ? "#d4edda" : "#f0f0f0",
                          color: fab.priceTier === "high" ? "#8a4500" : fab.priceTier === "medium" ? "#856404" : fab.priceTier === "low" ? "#155724" : "#666",
                        }}>
                          {TIER_LABELS[fab.priceTier] || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "6px", fontFamily: "monospace", fontSize: "0.8rem" }}>{fab.pricePerSqInch.toFixed(4)}</td>
                      <td style={{ padding: "6px" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: 10, fontSize: "0.75rem",
                          backgroundColor: fab.isActive ? "#e3f1df" : "#fbeae5",
                          color: fab.isActive ? "#108043" : "#d72c0d"
                        }}>
                          {fab.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "6px" }}>
                        <s-stack direction="inline" gap="tight">
                          <s-button variant="tertiary" onClick={() => openEditFabric(fab)}>Edit</s-button>
                          <s-button variant="tertiary" tone="critical" onClick={() => deleteFabric(fab.id)}>Del</s-button>
                        </s-stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </s-section>

          {/* Pagination */}
          <s-section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <s-button variant="tertiary" disabled={pagination.page <= 1}
                  onClick={() => changePage(pagination.page - 1)}>Previous</s-button>
                <s-text>Page {pagination.page} of {pagination.totalPages || 1}</s-text>
                <s-button variant="tertiary" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => changePage(pagination.page + 1)}>Next</s-button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <s-text tone="subdued">Show</s-text>
                <select value={pagination.perPage} onChange={(e) => changePerPage(parseInt(e.target.value))} style={selectStyle}>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
                <s-text tone="subdued">per page | Total: {pagination.totalCount}</s-text>
              </div>
            </div>
          </s-section>
        </>
      )}

      {/* =============== CATEGORIES TAB =============== */}
      {activeTab === "Categories" && (
        <>
          <s-section>
            <s-button variant="primary" onClick={openAddCategory}>Add Category</s-button>
          </s-section>
          <s-section>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e1e3e5", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Name</th>
                    <th style={{ padding: "8px 12px" }}>Image</th>
                    <th style={{ padding: "8px 12px" }}>Description</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                    <th style={{ padding: "8px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: 16, textAlign: "center", color: "#6d7175" }}>No categories yet.</td></tr>
                  ) : categories.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: "1px solid #e1e3e5", opacity: cat.isActive ? 1 : 0.5 }}>
                      <td style={{ padding: "8px 12px", fontWeight: 500 }}>{cat.name}</td>
                      <td style={{ padding: "8px 12px" }}>
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#6d7175" }}>{cat.description || "—"}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 10, fontSize: "0.8rem",
                          backgroundColor: cat.isActive ? "#e3f1df" : "#fbeae5",
                          color: cat.isActive ? "#108043" : "#d72c0d"
                        }}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <s-stack direction="inline" gap="tight">
                          <s-button variant="tertiary" onClick={() => openEditCategory(cat)}>Edit</s-button>
                          <s-button variant="tertiary" tone="critical" onClick={() => deleteCategory(cat.id)}>Delete</s-button>
                        </s-stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </s-section>
        </>
      )}

      {/* =============== BRANDS TAB =============== */}
      {activeTab === "Brands" && (
        <>
          <s-section>
            <s-button variant="primary" onClick={openAddBrand}>Add Brand</s-button>
          </s-section>
          <s-section>
            {brands.length === 0 ? (
              <s-box padding="base">
                <s-paragraph>No brands yet. Click Add Brand to create one.</s-paragraph>
              </s-box>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e1e3e5", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Name</th>
                      <th style={{ padding: "8px 12px" }}>Logo</th>
                      <th style={{ padding: "8px 12px" }}>Description</th>
                      <th style={{ padding: "8px 12px" }}>Fabrics</th>
                      <th style={{ padding: "8px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map(brand => (
                      <tr key={brand.id} style={{ borderBottom: "1px solid #e1e3e5" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{brand.name}</td>
                        <td style={{ padding: "8px 12px" }}>
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} style={{ width: 32, height: 32, objectFit: "contain" }} />
                          ) : "—"}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#6d7175" }}>{brand.description || "—"}</td>
                        <td style={{ padding: "8px 12px" }}>{brand._count?.fabrics || 0}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <s-stack direction="inline" gap="tight">
                            <s-button variant="tertiary" onClick={() => openEditBrand(brand)}>Edit</s-button>
                            <s-button variant="tertiary" tone="critical" onClick={() => deleteBrand(brand.id)}>Delete</s-button>
                          </s-stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </s-section>
        </>
      )}

      {/* =============== PATTERNS TAB =============== */}
      {activeTab === "Patterns" && (
        <>
          <s-section>
            <s-button variant="primary" onClick={openAddPattern}>Add Pattern</s-button>
          </s-section>
          <s-section>
            {patterns.length === 0 ? (
              <s-box padding="base">
                <s-paragraph>No patterns yet. Click Add Pattern to create one.</s-paragraph>
              </s-box>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e1e3e5", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Name</th>
                      <th style={{ padding: "8px 12px" }}>Fabrics</th>
                      <th style={{ padding: "8px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map(pattern => (
                      <tr key={pattern.id} style={{ borderBottom: "1px solid #e1e3e5" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{pattern.name}</td>
                        <td style={{ padding: "8px 12px" }}>{pattern._count?.fabricAssignments || 0}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <s-stack direction="inline" gap="tight">
                            <s-button variant="tertiary" onClick={() => openEditPattern(pattern)}>Edit</s-button>
                            <s-button variant="tertiary" tone="critical" onClick={() => deletePattern(pattern.id)}>Delete</s-button>
                          </s-stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </s-section>
        </>
      )}

      {/* =============== COLORS TAB =============== */}
      {activeTab === "Colors" && (
        <>
          <s-section>
            <s-button variant="primary" onClick={openAddColor}>Add Color</s-button>
          </s-section>
          <s-section>
            {colors.length === 0 ? (
              <s-box padding="base">
                <s-paragraph>No colors yet. Click Add Color to create one.</s-paragraph>
              </s-box>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e1e3e5", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Swatch</th>
                      <th style={{ padding: "8px 12px" }}>Name</th>
                      <th style={{ padding: "8px 12px" }}>Hex Code</th>
                      <th style={{ padding: "8px 12px" }}>Fabrics</th>
                      <th style={{ padding: "8px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map(color => (
                      <tr key={color.id} style={{ borderBottom: "1px solid #e1e3e5" }}>
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 4,
                            backgroundColor: color.hexCode || "#ccc",
                            border: "1px solid #ddd"
                          }} />
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{color.name}</td>
                        <td style={{ padding: "8px 12px", color: "#6d7175", fontFamily: "monospace" }}>{color.hexCode || "—"}</td>
                        <td style={{ padding: "8px 12px" }}>{color._count?.fabricAssignments || 0}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <s-stack direction="inline" gap="tight">
                            <s-button variant="tertiary" onClick={() => openEditColor(color)}>Edit</s-button>
                            <s-button variant="tertiary" tone="critical" onClick={() => deleteColor(color.id)}>Delete</s-button>
                          </s-stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </s-section>
        </>
      )}

      {/* =============== MATERIALS TAB =============== */}
      {activeTab === "Materials" && (
        <>
          <s-section>
            <s-button variant="primary" onClick={openAddMaterial}>Add Material</s-button>
          </s-section>
          <s-section>
            {materials.length === 0 ? (
              <s-box padding="base">
                <s-paragraph>No materials yet. Click Add Material to create one.</s-paragraph>
              </s-box>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e1e3e5", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Name</th>
                      <th style={{ padding: "8px 12px" }}>Fabrics</th>
                      <th style={{ padding: "8px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(material => (
                      <tr key={material.id} style={{ borderBottom: "1px solid #e1e3e5" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{material.name}</td>
                        <td style={{ padding: "8px 12px" }}>{material._count?.fabricAssignments || 0}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <s-stack direction="inline" gap="tight">
                            <s-button variant="tertiary" onClick={() => openEditMaterial(material)}>Edit</s-button>
                            <s-button variant="tertiary" tone="critical" onClick={() => deleteMaterial(material.id)}>Delete</s-button>
                          </s-stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </s-section>
        </>
      )}

      {/* =============== MODALS =============== */}

      {/* Fabric Modal */}
      {showFabricModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 640, maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{editingFabric ? "Edit Fabric" : "Add Fabric"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <s-text-field label="Fabric Name *" value={fabricData.name}
                onChange={(e) => setFabricData({ ...fabricData, name: e.target.value })}
                placeholder="e.g., Blue Velvet" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Category</label>
                  <select value={fabricData.categoryId}
                    onChange={(e) => setFabricData({ ...fabricData, categoryId: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}>
                    <option value="">— No Category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Brand</label>
                  <select value={fabricData.brandId}
                    onChange={(e) => setFabricData({ ...fabricData, brandId: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}>
                    <option value="">— No Brand —</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <s-text-field label="Image URL" value={fabricData.imageUrl}
                onChange={(e) => setFabricData({ ...fabricData, imageUrl: e.target.value })}
                placeholder="https://example.com/swatch.jpg" />

              <s-text-field label="Price per Sq Inch (USD) *" type="number" value={fabricData.pricePerSqInch}
                onChange={(e) => setFabricData({ ...fabricData, pricePerSqInch: e.target.value })}
                placeholder="0.05" step="0.001" />

              <s-text-field label="Description" value={fabricData.description}
                onChange={(e) => setFabricData({ ...fabricData, description: e.target.value })} />

              {/* Price Tier */}
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Price Tier</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[["none", "None"], ["low", "$"], ["medium", "$$"], ["high", "$$$"]].map(([val, label]) => (
                    <label key={val} style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                      <input type="radio" name="priceTier" value={val} checked={fabricData.priceTier === val}
                        onChange={() => setFabricData({ ...fabricData, priceTier: val })} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Patterns multi-select */}
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Patterns</label>
                {patterns.length === 0 ? (
                  <s-text tone="subdued" fontSize="small">No patterns available. Create patterns first.</s-text>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {patterns.map(p => (
                      <label key={p.id} style={{
                        display: "flex", gap: 4, alignItems: "center", padding: "4px 8px",
                        borderRadius: 4, border: "1px solid #ccc", cursor: "pointer",
                        backgroundColor: fabricData.patternIds.includes(p.id) ? "#e3f1df" : "white"
                      }}>
                        <input type="checkbox" checked={fabricData.patternIds.includes(p.id)}
                          onChange={() => setFabricData({ ...fabricData, patternIds: toggleMultiSelect(fabricData.patternIds, p.id) })} />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Colors multi-select */}
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Colors</label>
                {colors.length === 0 ? (
                  <s-text tone="subdued" fontSize="small">No colors available. Create colors first.</s-text>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {colors.map(c => (
                      <label key={c.id} style={{
                        display: "flex", gap: 4, alignItems: "center", padding: "4px 8px",
                        borderRadius: 4, border: "1px solid #ccc", cursor: "pointer",
                        backgroundColor: fabricData.colorIds.includes(c.id) ? "#e3f1df" : "white"
                      }}>
                        <input type="checkbox" checked={fabricData.colorIds.includes(c.id)}
                          onChange={() => setFabricData({ ...fabricData, colorIds: toggleMultiSelect(fabricData.colorIds, c.id) })} />
                        {c.hexCode && <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: c.hexCode, border: "1px solid #ccc" }} />}
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials multi-select */}
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Materials</label>
                {materials.length === 0 ? (
                  <s-text tone="subdued" fontSize="small">No materials available. Create materials first.</s-text>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {materials.map(m => (
                      <label key={m.id} style={{
                        display: "flex", gap: 4, alignItems: "center", padding: "4px 8px",
                        borderRadius: 4, border: "1px solid #ccc", cursor: "pointer",
                        backgroundColor: fabricData.materialIds.includes(m.id) ? "#e3f1df" : "white"
                      }}>
                        <input type="checkbox" checked={fabricData.materialIds.includes(m.id)}
                          onChange={() => setFabricData({ ...fabricData, materialIds: toggleMultiSelect(fabricData.materialIds, m.id) })} />
                        {m.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <s-text-field label="Sort Order" type="number" value={fabricData.sortOrder}
                  onChange={(e) => setFabricData({ ...fabricData, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={fabricData.isActive}
                    onChange={(e) => setFabricData({ ...fabricData, isActive: e.target.checked })} /> Active
                </label>
                <label style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={fabricData.isDefault}
                    onChange={(e) => setFabricData({ ...fabricData, isDefault: e.target.checked })} /> Set as Default
                </label>
              </div>

              {/* Discount from Total */}
              <div style={{ padding: 12, backgroundColor: "#f6f6f7", borderRadius: 8, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input type="checkbox" id="fabricDiscountEnabled" checked={fabricData.discountEnabled}
                    onChange={(e) => setFabricData({ ...fabricData, discountEnabled: e.target.checked })} />
                  <label htmlFor="fabricDiscountEnabled" style={{ fontWeight: 500 }}>Enable Discount from Total</label>
                </div>
                {fabricData.discountEnabled && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="number" value={fabricData.discountPercent}
                      onChange={(e) => setFabricData({ ...fabricData, discountPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="10" step="0.1" min="0" max="100"
                      style={{ width: 80, padding: "6px 10px", borderRadius: 4, border: "1px solid #ccc" }} />
                    <span>%</span>
                  </div>
                )}
                <p style={{ fontSize: "0.8rem", color: "#6d7175", marginTop: 8, marginBottom: 0 }}>
                  When enabled, this percentage is deducted from the final total price.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowFabricModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitFabric}>{editingFabric ? "Update Fabric" : "Create Fabric"}</s-button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{editingCategory ? "Edit Category" : "Add Category"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <s-text-field label="Category Name *" value={categoryData.name}
                onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                placeholder="e.g., Outdoor, Indoor" />
              <s-text-field label="Description" value={categoryData.description}
                onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })} />
              <s-text-field label="Image URL" value={categoryData.imageUrl}
                onChange={(e) => setCategoryData({ ...categoryData, imageUrl: e.target.value })}
                placeholder="https://example.com/category.jpg" />
              <s-text-field label="Sort Order" type="number" value={categoryData.sortOrder}
                onChange={(e) => setCategoryData({ ...categoryData, sortOrder: parseInt(e.target.value) || 0 })} />
              <label style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={categoryData.isActive}
                  onChange={(e) => setCategoryData({ ...categoryData, isActive: e.target.checked })} /> Active
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowCategoryModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitCategory}>{editingCategory ? "Update" : "Create"}</s-button>
            </div>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {showBrandModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{editingBrand ? "Edit Brand" : "Add Brand"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <s-text-field label="Brand Name *" value={brandData.name}
                onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                placeholder="e.g., Sunbrella" />
              <s-text-field label="Logo URL" value={brandData.logoUrl}
                onChange={(e) => setBrandData({ ...brandData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png" />
              <s-text-field label="Description" value={brandData.description}
                onChange={(e) => setBrandData({ ...brandData, description: e.target.value })} />
              <s-text-field label="Sort Order" type="number" value={brandData.sortOrder}
                onChange={(e) => setBrandData({ ...brandData, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowBrandModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitBrand}>{editingBrand ? "Update" : "Create"}</s-button>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Modal */}
      {showPatternModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{editingPattern ? "Edit Pattern" : "Add Pattern"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <s-text-field label="Pattern Name *" value={patternData.name}
                onChange={(e) => setPatternData({ ...patternData, name: e.target.value })}
                placeholder="e.g., Solid, Striped, Floral" />
              <s-text-field label="Sort Order" type="number" value={patternData.sortOrder}
                onChange={(e) => setPatternData({ ...patternData, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowPatternModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitPattern}>{editingPattern ? "Update" : "Create"}</s-button>
            </div>
          </div>
        </div>
      )}

      {/* Color Modal */}
      {showColorModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{editingColor ? "Edit Color" : "Add Color"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <s-text-field label="Color Name *" value={colorData.name}
                onChange={(e) => setColorData({ ...colorData, name: e.target.value })}
                placeholder="e.g., Red, Navy Blue, Beige" />
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>Hex Code</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={colorData.hexCode || "#000000"}
                    onChange={(e) => setColorData({ ...colorData, hexCode: e.target.value })}
                    style={{ width: 40, height: 40, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={colorData.hexCode}
                    onChange={(e) => setColorData({ ...colorData, hexCode: e.target.value })}
                    placeholder="#FF0000"
                    style={{ flex: 1, padding: "10px", borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
              </div>
              <s-text-field label="Sort Order" type="number" value={colorData.sortOrder}
                onChange={(e) => setColorData({ ...colorData, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowColorModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitColor}>{editingColor ? "Update" : "Create"}</s-button>
            </div>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{editingMaterial ? "Edit Material" : "Add Material"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <s-text-field label="Material Name *" value={materialData.name}
                onChange={(e) => setMaterialData({ ...materialData, name: e.target.value })}
                placeholder="e.g., Cotton, Polyester, Velvet" />
              <s-text-field label="Sort Order" type="number" value={materialData.sortOrder}
                onChange={(e) => setMaterialData({ ...materialData, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowMaterialModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitMaterial}>{editingMaterial ? "Update" : "Create"}</s-button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 20px"
        }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 600 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>Import Fabrics from CSV</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 12, backgroundColor: "#f6f6f7", borderRadius: 8, fontSize: "0.85rem" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 600 }}>CSV Format:</p>
                <p style={{ margin: "0 0 4px" }}>• Export existing fabrics first to get the correct format</p>
                <p style={{ margin: "0 0 4px" }}>• Leave <code>id</code> empty to create new fabrics</p>
                <p style={{ margin: "0 0 4px" }}>• Include <code>id</code> to update existing fabrics</p>
                <p style={{ margin: "0 0 4px" }}>• Use pipe (|) to separate multiple patterns, colors, or materials</p>
                <p style={{ margin: 0 }}>• Category, brand, pattern, color names must match existing entries</p>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem", fontWeight: 500 }}>
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportFile}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
                />
              </div>

              {importCsv && (
                <div style={{ padding: 8, backgroundColor: "#e3f1df", borderRadius: 6, fontSize: "0.85rem" }}>
                  File loaded: {importCsv.split("\n").length - 1} data rows detected
                </div>
              )}

              {importResult && (
                <div style={{
                  padding: 12, borderRadius: 6, fontSize: "0.85rem",
                  backgroundColor: importResult.success ? "#e3f1df" : "#fbeae5",
                  color: importResult.success ? "#108043" : "#d72c0d"
                }}>
                  {importResult.success ? (
                    <>
                      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Import Complete!</p>
                      <p style={{ margin: 0 }}>Created: {importResult.created} | Updated: {importResult.updated}</p>
                      {importResult.totalErrors > 0 && (
                        <p style={{ margin: "8px 0 0", color: "#b98900" }}>
                          Errors: {importResult.totalErrors} row(s) had issues
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>{importResult.error || "Import failed"}</p>
                  )}
                  {importResult.errors?.length > 0 && (
                    <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more</li>}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <s-button variant="tertiary" onClick={() => setShowImportModal(false)}>Cancel</s-button>
              <s-button variant="primary" onClick={submitImport} disabled={importing || !importCsv}>
                {importing ? "Importing..." : "Import"}
              </s-button>
            </div>
          </div>
        </div>
      )}

    </s-page>
  );
}
