import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { Badge, StatusBadge, TextField, SelectField, Checkbox, Modal, ConfirmModal, BackButton, Thumb, EmptyState } from "../components/admin-ui";
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

  // Sorting
  const sortBy = url.searchParams.get("sortBy") || "sortOrder";
  const sortDir = url.searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const sortableColumns = { name: true, category: true, brand: true, status: true, pricePerSqInch: true, sortOrder: true };
  const activeSortBy = sortableColumns[sortBy] ? sortBy : "sortOrder";
  const orderByMap = {
    name: { name: sortDir },
    category: { category: { name: sortDir } },
    brand: { brand: { name: sortDir } },
    status: { isActive: sortDir },
    pricePerSqInch: { pricePerSqInch: sortDir },
    sortOrder: { sortOrder: sortDir },
  };
  const orderBy = orderByMap[activeSortBy];

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
        orderBy,
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
      filters: { search, categoryId, brandId, patternId, colorId, priceTier, status, sortBy: activeSortBy, sortDir },
      shop,
    };
  } catch (error) {
    console.error("Error loading fabrics:", error);
    return {
      fabrics: [], pagination: { page: 1, perPage: 50, totalCount: 0, totalPages: 0 },
      categories: [], brands: [], patterns: [], colors: [], materials: [],
      filters: { search: "", categoryId: "", brandId: "", patternId: "", colorId: "", priceTier: "", status: "", sortBy: "sortOrder", sortDir: "asc" },
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

    // Auto-assign next sort order to avoid duplicates
    const lastFabric = await prisma.fabric.findFirst({
      where: { shop },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastFabric?.sortOrder ?? -1) + 1;

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
        sortOrder: nextSortOrder,
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

  // ---- One-time: reassign sort orders by creation date ----
  if (intent === "fixSortOrders") {
    const allFabrics = await prisma.fabric.findMany({
      where: { shop },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < allFabrics.length; i++) {
      await prisma.fabric.update({ where: { id: allFabrics[i].id }, data: { sortOrder: i } });
    }
    invalidateConfigCache(shop);
    return { success: true, fixed: allFabrics.length };
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

  // Confirmation dialog (replaces window.confirm): { title, message, confirmLabel, onConfirm }
  const [confirmAction, setConfirmAction] = useState(null);
  const askConfirm = (opts) => setConfirmAction(opts);
  const cancelConfirm = useCallback(() => setConfirmAction(null), []);
  const runConfirm = () => {
    const fn = confirmAction?.onConfirm;
    setConfirmAction(null);
    if (fn) fn();
  };

  // Stable close handlers so the shared Modal does not re-focus on every keystroke
  const closeCategoryModal = useCallback(() => setShowCategoryModal(false), []);
  const closeBrandModal = useCallback(() => setShowBrandModal(false), []);
  const closePatternModal = useCallback(() => setShowPatternModal(false), []);
  const closeColorModal = useCallback(() => setShowColorModal(false), []);
  const closeMaterialModal = useCallback(() => setShowMaterialModal(false), []);
  const closeImportModal = useCallback(() => setShowImportModal(false), []);

  // --- Sort handler ---
  const handleSort = useCallback((col) => {
    const params = new URLSearchParams(searchParams);
    const currentCol = params.get("sortBy") || "sortOrder";
    const currentDir = params.get("sortDir") || "asc";
    if (col === currentCol) {
      params.set("sortDir", currentDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", col);
      params.set("sortDir", "asc");
    }
    params.set("page", "1");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

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

  const deleteFabric = (id, afterDelete) => {
    askConfirm({
      title: "Delete this fabric?",
      message: "This can’t be undone.",
      confirmLabel: "Delete fabric",
      onConfirm: () => {
        const data = new FormData();
        data.append("intent", "deleteFabric");
        data.append("id", id);
        fetcher.submit(data, { method: "POST" });
        if (afterDelete) afterDelete();
      },
    });
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

  const deleteCategory = (id, afterDelete) => {
    askConfirm({
      title: "Delete this category?",
      message: "Fabrics will become uncategorized.",
      confirmLabel: "Delete category",
      onConfirm: () => {
        const data = new FormData();
        data.append("intent", "deleteCategory");
        data.append("id", id);
        fetcher.submit(data, { method: "POST" });
        if (afterDelete) afterDelete();
      },
    });
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

  const deleteBrand = (id, afterDelete) => {
    askConfirm({
      title: "Delete this brand?",
      message: "Fabrics using it will be unlinked.",
      confirmLabel: "Delete brand",
      onConfirm: () => {
        const data = new FormData();
        data.append("intent", "deleteBrand");
        data.append("id", id);
        fetcher.submit(data, { method: "POST" });
        if (afterDelete) afterDelete();
      },
    });
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

  const deletePattern = (id, afterDelete) => {
    askConfirm({
      title: "Delete this pattern?",
      message: "Fabric assignments will be removed.",
      confirmLabel: "Delete pattern",
      onConfirm: () => {
        const data = new FormData();
        data.append("intent", "deletePattern");
        data.append("id", id);
        fetcher.submit(data, { method: "POST" });
        if (afterDelete) afterDelete();
      },
    });
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

  const deleteColor = (id, afterDelete) => {
    askConfirm({
      title: "Delete this color?",
      message: "Fabric assignments will be removed.",
      confirmLabel: "Delete color",
      onConfirm: () => {
        const data = new FormData();
        data.append("intent", "deleteColor");
        data.append("id", id);
        fetcher.submit(data, { method: "POST" });
        if (afterDelete) afterDelete();
      },
    });
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

  const deleteMaterial = (id, afterDelete) => {
    askConfirm({
      title: "Delete this material?",
      message: "Fabric assignments will be removed.",
      confirmLabel: "Delete material",
      onConfirm: () => {
        const data = new FormData();
        data.append("intent", "deleteMaterial");
        data.append("id", id);
        fetcher.submit(data, { method: "POST" });
        if (afterDelete) afterDelete();
      },
    });
  };

  // --- Bulk action handler ---
  const executeBulkAction = () => {
    if (selectedIds.size === 0) return;
    const ids = JSON.stringify([...selectedIds]);

    if (bulkAction === "delete") {
      const count = selectedIds.size;
      askConfirm({
        title: `Delete ${count} fabric(s)?`,
        message: "The selected fabrics will be permanently deleted. This can’t be undone.",
        confirmLabel: "Delete fabrics",
        onConfirm: () => {
          const data = new FormData();
          data.append("intent", "bulkDelete");
          data.append("ids", ids);
          fetcher.submit(data, { method: "POST" });
          shopify.toast.show(`${count} fabrics deleted`);
          setSelectedIds(new Set());
          setBulkAction("");
        },
      });
      return;
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

  const fixSortOrders = () => {
    askConfirm({
      title: "Reassign all fabric sort orders?",
      message: "Every fabric gets a new sort order (0, 1, 2…) based on when it was created. This can’t be undone.",
      confirmLabel: "Reassign sort orders",
      onConfirm: () => {
        const d = new FormData();
        d.append("intent", "fixSortOrders");
        fetcher.submit(d, { method: "POST" });
      },
    });
  };

  const openImport = () => { setShowImportModal(true); setImportCsv(""); setImportResult(null); };

  const TIER_TONES = { low: "success", medium: "warning", high: "critical" };
  const TIER_OPTIONS = [["none", "None"], ["low", "$ Low"], ["medium", "$$ Medium"], ["high", "$$$ High"]];

  const sortHeader = (col, label, align) => {
    const active = filters.sortBy === col;
    return (
      <th key={col} style={align ? { textAlign: align } : undefined} aria-sort={active ? (filters.sortDir === "asc" ? "ascending" : "descending") : undefined}>
        <button
          type="button"
          onClick={() => handleSort(col)}
          style={{ border: 0, background: "transparent", padding: 0, font: "inherit", color: active ? "var(--cc-fg)" : "inherit", cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center", whiteSpace: "nowrap" }}
        >
          {label}
          <span aria-hidden="true" style={{ fontSize: 10, color: active ? "var(--cc-fg)" : "var(--cc-fg-3)" }}>
            {active ? (filters.sortDir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  };

  const chipStyle = { display: "inline-flex", alignItems: "center", gap: 6 };
  const swatchDot = (hex, size = 12) => (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: 999, background: hex || "var(--cc-surface-3)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)", display: "inline-block", flex: "none" }} />
  );

  const confirmModal = (
    <ConfirmModal
      open={!!confirmAction}
      title={confirmAction?.title || ""}
      confirmLabel={confirmAction?.confirmLabel || "Delete"}
      onCancel={cancelConfirm}
      onConfirm={runConfirm}
    >
      {confirmAction?.message && <p className="cc-p">{confirmAction.message}</p>}
    </ConfirmModal>
  );

  // =============== FABRIC EDITOR (dedicated view) ===============
  if (showFabricModal) {
    const price = parseFloat(fabricData.pricePerSqInch);
    return (
      <s-page heading={editingFabric ? editingFabric.name : "New fabric"} inlineSize="large">
        <div className="cc-page">
          <div className="cc-header">
            <BackButton onClick={() => setShowFabricModal(false)} label="Back to fabrics" />
            <h1>{fabricData.name || (editingFabric ? "Untitled fabric" : "New fabric")}</h1>
            <StatusBadge active={fabricData.isActive} />
            {fabricData.isDefault && <Badge tone="info">Default</Badge>}
            {fabricData.discountEnabled && fabricData.discountPercent > 0 && <Badge tone="success">−{fabricData.discountPercent}%</Badge>}
          </div>

          <div className="cc-layout">
            <div className="cc-main">
              <div className="cc-card">
                <div className="cc-card__head"><h2>Details</h2></div>
                <div className="cc-card__body">
                  <TextField id="fabric-name" label="Fabric name" value={fabricData.name}
                    onChange={(v) => setFabricData({ ...fabricData, name: v })}
                    placeholder="e.g. Blue Velvet" required />
                  <TextField id="fabric-description" label="Description" value={fabricData.description}
                    onChange={(v) => setFabricData({ ...fabricData, description: v })} />
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card__head"><h2>Swatch image</h2></div>
                <div className="cc-card__body">
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {fabricData.imageUrl ? (
                      <img src={fabricData.imageUrl} alt={fabricData.name || "Fabric swatch"} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", background: "var(--cc-surface-3)", flex: "none", boxShadow: "inset 0 0 0 1px var(--cc-border)" }} />
                    ) : (
                      <span aria-hidden="true" style={{ width: 72, height: 72, borderRadius: 10, background: "var(--cc-surface-3)", flex: "none", display: "grid", placeItems: "center", color: "var(--cc-fg-3)", fontSize: 11 }}>No image</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <TextField id="fabric-image" label="Image URL" value={fabricData.imageUrl}
                        onChange={(v) => setFabricData({ ...fabricData, imageUrl: v })}
                        placeholder="https://example.com/swatch.jpg"
                        help="Shown to customers as the fabric swatch." />
                    </div>
                  </div>
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card__head"><h2>Pricing</h2></div>
                <div className="cc-card__body">
                  <TextField id="fabric-price" label="Price per square inch (USD)" type="number" value={fabricData.pricePerSqInch}
                    onChange={(v) => setFabricData({ ...fabricData, pricePerSqInch: v })}
                    placeholder="0.05" step="0.001" required
                    help={Number.isFinite(price) && price > 0 ? `About $${(price * 144).toFixed(2)} per square foot.` : "Required."} />
                  <div className="cc-field">
                    <span className="cc-label" id="fabric-tier-label">Price tier</span>
                    <div className="cc-chips" role="group" aria-labelledby="fabric-tier-label">
                      {TIER_OPTIONS.map(([val, label]) => (
                        <button key={val} type="button" className="cc-chip" aria-pressed={fabricData.priceTier === val}
                          onClick={() => setFabricData({ ...fabricData, priceTier: val })}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <span className="cc-help">Used to group fabrics by price on the storefront.</span>
                  </div>
                  <Checkbox id="fabricDiscountEnabled" checked={fabricData.discountEnabled}
                    onChange={(v) => setFabricData({ ...fabricData, discountEnabled: v })}
                    label="Discount from total"
                    help="When on, this percentage is taken off the customer’s final total price." />
                  {fabricData.discountEnabled && (
                    <div style={{ maxWidth: 200, paddingLeft: 24 }}>
                      <TextField id="fabric-discount" label="Discount (%)" type="number" value={fabricData.discountPercent}
                        onChange={(v) => setFabricData({ ...fabricData, discountPercent: parseFloat(v) || 0 })}
                        placeholder="10" step="0.1" min="0" max="100" />
                    </div>
                  )}
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card__head"><h2>Attributes</h2><span className="cc-card__meta">Used for storefront filters</span></div>
                <div className="cc-card__body">
                  <div className="cc-field">
                    <span className="cc-label">Patterns</span>
                    {patterns.length === 0 ? (
                      <span className="cc-help">No patterns yet. Add them on the Patterns tab first.</span>
                    ) : (
                      <div className="cc-chips">
                        {patterns.map(p => (
                          <button key={p.id} type="button" className="cc-chip" aria-pressed={fabricData.patternIds.includes(p.id)}
                            onClick={() => setFabricData({ ...fabricData, patternIds: toggleMultiSelect(fabricData.patternIds, p.id) })}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="cc-field">
                    <span className="cc-label">Colors</span>
                    {colors.length === 0 ? (
                      <span className="cc-help">No colors yet. Add them on the Colors tab first.</span>
                    ) : (
                      <div className="cc-chips">
                        {colors.map(c => (
                          <button key={c.id} type="button" className="cc-chip" style={chipStyle} aria-pressed={fabricData.colorIds.includes(c.id)}
                            onClick={() => setFabricData({ ...fabricData, colorIds: toggleMultiSelect(fabricData.colorIds, c.id) })}>
                            {c.hexCode && swatchDot(c.hexCode)}
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="cc-field">
                    <span className="cc-label">Materials</span>
                    {materials.length === 0 ? (
                      <span className="cc-help">No materials yet. Add them on the Materials tab first.</span>
                    ) : (
                      <div className="cc-chips">
                        {materials.map(m => (
                          <button key={m.id} type="button" className="cc-chip" aria-pressed={fabricData.materialIds.includes(m.id)}
                            onClick={() => setFabricData({ ...fabricData, materialIds: toggleMultiSelect(fabricData.materialIds, m.id) })}>
                            {m.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="cc-side">
              <div className="cc-card">
                <div className="cc-card__head"><h2>Status</h2></div>
                <div className="cc-card__body">
                  <Checkbox id="fabric-active" checked={fabricData.isActive}
                    onChange={(v) => setFabricData({ ...fabricData, isActive: v })}
                    label="Active" help="Inactive fabrics are hidden from customers." />
                  <Checkbox id="fabric-default" checked={fabricData.isDefault}
                    onChange={(v) => setFabricData({ ...fabricData, isDefault: v })}
                    label="Default fabric" help="Pre-selected when the calculator opens." />
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card__head"><h2>Organization</h2></div>
                <div className="cc-card__body">
                  <SelectField id="fabric-category" label="Category" value={fabricData.categoryId}
                    onChange={(v) => setFabricData({ ...fabricData, categoryId: v })}
                    placeholder="No category"
                    options={categories.map(c => ({ value: c.id, label: c.name }))} />
                  <SelectField id="fabric-brand" label="Brand" value={fabricData.brandId}
                    onChange={(v) => setFabricData({ ...fabricData, brandId: v })}
                    placeholder="No brand"
                    options={brands.map(b => ({ value: b.id, label: b.name }))} />
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card__head"><h2>List position</h2></div>
                <div className="cc-card__body">
                  <TextField id="fabric-sort" label="Sort order" type="number" value={fabricData.sortOrder}
                    onChange={(v) => setFabricData({ ...fabricData, sortOrder: parseInt(v) || 0 })}
                    help="Lower numbers appear first." />
                </div>
              </div>

              {editingFabric && (
                <button type="button" className="cc-btn cc-btn--critical" style={{ justifySelf: "start" }}
                  onClick={() => deleteFabric(editingFabric.id, () => setShowFabricModal(false))}>
                  Delete fabric
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--cc-border)", paddingTop: 16 }}>
            <button type="button" className="cc-btn" onClick={() => setShowFabricModal(false)}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitFabric}>{editingFabric ? "Save" : "Create fabric"}</button>
          </div>
        </div>
        {confirmModal}
      </s-page>
    );
  }

  // =============== LIST VIEWS ===============
  const counts = {
    Fabrics: pagination.totalCount,
    Categories: categories.length,
    Brands: brands.length,
    Patterns: patterns.length,
    Colors: colors.length,
    Materials: materials.length,
  };
  const primaryAction = {
    Fabrics: ["Add fabric", openAddFabric],
    Categories: ["Add category", openAddCategory],
    Brands: ["Add brand", openAddBrand],
    Patterns: ["Add pattern", openAddPattern],
    Colors: ["Add color", openAddColor],
    Materials: ["Add material", openAddMaterial],
  }[activeTab];

  const allSelected = selectedIds.size === fabrics.length && fabrics.length > 0;
  const statusTab = (value, label) => (
    <button type="button" className="cc-tab" aria-pressed={(filters.status || "") === value} onClick={() => updateFilter("status", value)}>{label}</button>
  );
  const filterSelect = (id, label, value, key, options, extra) => (
    <select id={id} aria-label={label} className="cc-select" style={{ width: "auto", minWidth: 120, padding: "6px 8px" }} value={value} onChange={(e) => updateFilter(key, e.target.value)}>
      <option value="">{`All ${label.toLowerCase()}`}</option>
      {extra}
      {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
  const rowActions = (onEdit, onDelete) => (
    <td onClick={(e) => e.stopPropagation()}>
      <div className="cc-rowact">
        <button type="button" className="cc-btn cc-btn--plain cc-btn--critical" onClick={onDelete}>Delete</button>
        <button type="button" className="cc-btn" onClick={onEdit}>Edit</button>
      </div>
    </td>
  );
  const clickableRow = (onOpen) => ({
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(); },
  });
  const simpleListCard = ({ title, items, emptyTitle, emptyText, addLabel, onAdd, head, row }) => (
    <div className="cc-card">
      <div className="cc-card__head"><h2>{title}</h2><span className="cc-card__meta">{items.length}</span></div>
      <div className="cc-card__flush">
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} action={<button type="button" className="cc-btn cc-btn--primary" onClick={onAdd}>{addLabel}</button>}>
            {emptyText}
          </EmptyState>
        ) : (
          <div className="cc-table-wrap">
            <table className="cc-table" style={{ minWidth: 480 }}>
              <thead><tr>{head}<th><span className="cc-visually-hidden">Actions</span></th></tr></thead>
              <tbody>{items.map(row)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <s-page heading="Fabrics" inlineSize="large">
      {primaryAction && (
        <s-button slot="primary-action" variant="primary" onClick={primaryAction[1]}>{primaryAction[0]}</s-button>
      )}
      <div className="cc-page">
        {/* Section navigation */}
        <div className="cc-tabs" role="group" aria-label="Fabric settings">
          {TABS.map(tab => (
            <button key={tab} type="button" className="cc-tab" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab} <span className="cc-num" style={{ color: "var(--cc-fg-3)", fontWeight: 500 }}>{counts[tab]}</span>
            </button>
          ))}
        </div>

        {/* =============== FABRICS TAB =============== */}
        {activeTab === "Fabrics" && (
          <>
            <div className="cc-card">
              <div className="cc-card__head" style={{ paddingBottom: 10 }}>
                <h2>Fabrics</h2>
                <span className="cc-card__meta cc-num">{pagination.totalCount} total</span>
                <div className="cc-card__actions">
                  <button type="button" className="cc-btn" onClick={exportCsv}>Export CSV</button>
                  <button type="button" className="cc-btn" onClick={openImport}>Import CSV</button>
                </div>
              </div>
              <div className="cc-toolbar" style={{ borderTop: "1px solid var(--cc-border)" }}>
                <div className="cc-tabs">
                  {statusTab("", "All")}
                  {statusTab("active", "Active")}
                  {statusTab("inactive", "Inactive")}
                </div>
                <input
                  type="search"
                  className="cc-search"
                  placeholder="Search fabrics (press Enter)"
                  aria-label="Search fabrics"
                  defaultValue={filters.search}
                  onKeyDown={(e) => { if (e.key === "Enter") updateFilter("search", e.target.value); }}
                  onBlur={(e) => { if (e.target.value !== filters.search) updateFilter("search", e.target.value); }}
                />
                {filterSelect("filter-category", "Categories", filters.categoryId, "categoryId", categories, <option value="uncategorized">Uncategorized</option>)}
                {filterSelect("filter-brand", "Brands", filters.brandId, "brandId", brands)}
                {filterSelect("filter-pattern", "Patterns", filters.patternId, "patternId", patterns)}
                {filterSelect("filter-color", "Colors", filters.colorId, "colorId", colors)}
              </div>

              {selectedIds.size > 0 && (
                <div className="cc-toolbar" style={{ background: "var(--cc-surface-2)" }}>
                  <strong className="cc-num">{selectedIds.size} selected</strong>
                  <span className="cc-muted cc-num">of {pagination.totalCount}</span>
                  <span className="cc-spacer" />
                  <select aria-label="Bulk action" className="cc-select" style={{ width: "auto", padding: "6px 8px" }} value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                    <option value="">Choose an action…</option>
                    <option value="delete">Delete selected</option>
                    <option value="setTier">Set price tier</option>
                  </select>
                  {bulkAction === "setTier" && (
                    <select aria-label="Price tier" className="cc-select" style={{ width: "auto", padding: "6px 8px" }} value={bulkTier} onChange={(e) => setBulkTier(e.target.value)}>
                      <option value="none">None</option>
                      <option value="low">$ Low</option>
                      <option value="medium">$$ Medium</option>
                      <option value="high">$$$ High</option>
                    </select>
                  )}
                  {bulkAction && (
                    <button type="button" className={`cc-btn ${bulkAction === "delete" ? "cc-btn--critical-solid" : "cc-btn--primary"}`} onClick={executeBulkAction}>Apply</button>
                  )}
                  <button type="button" className="cc-btn cc-btn--plain" onClick={() => setSelectedIds(new Set())}>Clear</button>
                </div>
              )}

              <div className="cc-table-wrap">
                <table className="cc-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" aria-label="Select all fabrics on this page" checked={allSelected} onChange={toggleSelectAll} />
                      </th>
                      {sortHeader("name", "Fabric")}
                      {sortHeader("category", "Category")}
                      {sortHeader("brand", "Brand")}
                      <th>Tier</th>
                      {sortHeader("pricePerSqInch", "Price / sq in", "right")}
                      {sortHeader("status", "Status")}
                      {sortHeader("sortOrder", "Sort", "right")}
                      <th><span className="cc-visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabrics.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: 0 }}>
                          <EmptyState
                            title="No fabrics found"
                            action={<button type="button" className="cc-btn cc-btn--primary" onClick={openAddFabric}>Add fabric</button>}
                          >
                            Try changing the filters, or add a new fabric.
                          </EmptyState>
                        </td>
                      </tr>
                    ) : fabrics.map(fab => (
                      <tr key={fab.id} className={`cc-clickable${fab.isActive ? "" : " cc-row--inactive"}`} {...clickableRow(() => openEditFabric(fab))}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Select ${fab.name}`} checked={selectedIds.has(fab.id)} onChange={() => toggleSelect(fab.id)} />
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <Thumb src={fab.imageUrl} alt={fab.name} />
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                              <span className="cc-name">{fab.name}</span>
                              {fab.isDefault && <Badge tone="info">Default</Badge>}
                              {fab.discountEnabled && fab.discountPercent > 0 && <Badge tone="success">−{fab.discountPercent}%</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className={fab.category ? undefined : "cc-muted"}>{fab.category?.name || "—"}</td>
                        <td className={fab.brand ? undefined : "cc-muted"}>{fab.brand?.name || "—"}</td>
                        <td>
                          {fab.priceTier && fab.priceTier !== "none"
                            ? <Badge tone={TIER_TONES[fab.priceTier]}>{TIER_LABELS[fab.priceTier] || "—"}</Badge>
                            : <span className="cc-muted">—</span>}
                        </td>
                        <td className="cc-num" style={{ textAlign: "right" }}>${fab.pricePerSqInch.toFixed(4)}</td>
                        <td><StatusBadge active={fab.isActive} /></td>
                        <td className="cc-num cc-muted" style={{ textAlign: "right" }}>{fab.sortOrder}</td>
                        {rowActions(() => openEditFabric(fab), () => deleteFabric(fab.id))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--cc-border)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button type="button" className="cc-btn" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)} aria-label="Previous page">‹ Previous</button>
                  <span className="cc-num cc-muted">Page {pagination.page} of {pagination.totalPages || 1}</span>
                  <button type="button" className="cc-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => changePage(pagination.page + 1)} aria-label="Next page">Next ›</button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label htmlFor="fabrics-per-page" className="cc-muted">Rows per page</label>
                  <select id="fabrics-per-page" className="cc-select" style={{ width: "auto", padding: "5px 8px" }} value={pagination.perPage} onChange={(e) => changePerPage(parseInt(e.target.value))}>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Sort order tools</h2></div>
              <div className="cc-card__body">
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="cc-muted" style={{ flex: 1, minWidth: 220 }}>
                    Renumber every fabric 0, 1, 2… in the order they were created. Use this once if sort orders have gaps or duplicates.
                  </span>
                  <button type="button" className="cc-btn" onClick={fixSortOrders}>Fix sort orders</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =============== CATEGORIES TAB =============== */}
        {activeTab === "Categories" && simpleListCard({
          title: "Categories",
          items: categories,
          emptyTitle: "No categories yet",
          emptyText: "Group fabrics into categories such as Outdoor or Indoor.",
          addLabel: "Add category",
          onAdd: openAddCategory,
          head: <><th>Category</th><th>Description</th><th>Status</th></>,
          row: (cat) => (
            <tr key={cat.id} className={`cc-clickable${cat.isActive ? "" : " cc-row--inactive"}`} {...clickableRow(() => openEditCategory(cat))}>
              <td>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Thumb src={cat.imageUrl} alt={cat.name} />
                  <span className="cc-name">{cat.name}</span>
                </div>
              </td>
              <td className="cc-muted">{cat.description || "—"}</td>
              <td><StatusBadge active={cat.isActive} /></td>
              {rowActions(() => openEditCategory(cat), () => deleteCategory(cat.id))}
            </tr>
          ),
        })}

        {/* =============== BRANDS TAB =============== */}
        {activeTab === "Brands" && simpleListCard({
          title: "Brands",
          items: brands,
          emptyTitle: "No brands yet",
          emptyText: "Add the fabric brands you carry, such as Sunbrella.",
          addLabel: "Add brand",
          onAdd: openAddBrand,
          head: <><th>Brand</th><th>Description</th><th style={{ textAlign: "right" }}>Fabrics</th></>,
          row: (brand) => (
            <tr key={brand.id} className="cc-clickable" {...clickableRow(() => openEditBrand(brand))}>
              <td>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {brand.logoUrl
                    ? <img className="cc-thumb" src={brand.logoUrl} alt={brand.name} style={{ objectFit: "contain", background: "var(--cc-surface)" }} />
                    : <Thumb />}
                  <span className="cc-name">{brand.name}</span>
                </div>
              </td>
              <td className="cc-muted">{brand.description || "—"}</td>
              <td className="cc-num" style={{ textAlign: "right" }}>{brand._count?.fabrics || 0}</td>
              {rowActions(() => openEditBrand(brand), () => deleteBrand(brand.id))}
            </tr>
          ),
        })}

        {/* =============== PATTERNS TAB =============== */}
        {activeTab === "Patterns" && simpleListCard({
          title: "Patterns",
          items: patterns,
          emptyTitle: "No patterns yet",
          emptyText: "Patterns like Solid, Striped or Floral let customers filter fabrics.",
          addLabel: "Add pattern",
          onAdd: openAddPattern,
          head: <><th>Pattern</th><th style={{ textAlign: "right" }}>Fabrics</th></>,
          row: (pattern) => (
            <tr key={pattern.id} className="cc-clickable" {...clickableRow(() => openEditPattern(pattern))}>
              <td><span className="cc-name">{pattern.name}</span></td>
              <td className="cc-num" style={{ textAlign: "right" }}>{pattern._count?.fabricAssignments || 0}</td>
              {rowActions(() => openEditPattern(pattern), () => deletePattern(pattern.id))}
            </tr>
          ),
        })}

        {/* =============== COLORS TAB =============== */}
        {activeTab === "Colors" && simpleListCard({
          title: "Colors",
          items: colors,
          emptyTitle: "No colors yet",
          emptyText: "Colors let customers filter fabrics by shade.",
          addLabel: "Add color",
          onAdd: openAddColor,
          head: <><th>Color</th><th>Hex code</th><th style={{ textAlign: "right" }}>Fabrics</th></>,
          row: (color) => (
            <tr key={color.id} className="cc-clickable" {...clickableRow(() => openEditColor(color))}>
              <td>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {swatchDot(color.hexCode || "#ccc", 24)}
                  <span className="cc-name">{color.name}</span>
                </div>
              </td>
              <td className="cc-muted" style={{ fontFamily: "var(--cc-mono)", fontSize: 12 }}>{color.hexCode || "—"}</td>
              <td className="cc-num" style={{ textAlign: "right" }}>{color._count?.fabricAssignments || 0}</td>
              {rowActions(() => openEditColor(color), () => deleteColor(color.id))}
            </tr>
          ),
        })}

        {/* =============== MATERIALS TAB =============== */}
        {activeTab === "Materials" && simpleListCard({
          title: "Materials",
          items: materials,
          emptyTitle: "No materials yet",
          emptyText: "Materials like Cotton, Polyester or Velvet let customers filter fabrics.",
          addLabel: "Add material",
          onAdd: openAddMaterial,
          head: <><th>Material</th><th style={{ textAlign: "right" }}>Fabrics</th></>,
          row: (material) => (
            <tr key={material.id} className="cc-clickable" {...clickableRow(() => openEditMaterial(material))}>
              <td><span className="cc-name">{material.name}</span></td>
              <td className="cc-num" style={{ textAlign: "right" }}>{material._count?.fabricAssignments || 0}</td>
              {rowActions(() => openEditMaterial(material), () => deleteMaterial(material.id))}
            </tr>
          ),
        })}
      </div>

      {/* =============== MODALS =============== */}

      {/* Category modal */}
      <Modal
        open={showCategoryModal}
        title={editingCategory ? "Edit category" : "Add category"}
        onClose={closeCategoryModal}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeCategoryModal}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitCategory}>{editingCategory ? "Save" : "Create category"}</button>
          </>
        }
      >
        <TextField id="category-name" label="Category name" value={categoryData.name}
          onChange={(v) => setCategoryData({ ...categoryData, name: v })}
          placeholder="e.g. Outdoor, Indoor" required />
        <TextField id="category-description" label="Description" value={categoryData.description}
          onChange={(v) => setCategoryData({ ...categoryData, description: v })} />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Thumb src={categoryData.imageUrl} alt={categoryData.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextField id="category-image" label="Image URL" value={categoryData.imageUrl}
              onChange={(v) => setCategoryData({ ...categoryData, imageUrl: v })}
              placeholder="https://example.com/category.jpg" />
          </div>
        </div>
        <TextField id="category-sort" label="Sort order" type="number" value={categoryData.sortOrder}
          onChange={(v) => setCategoryData({ ...categoryData, sortOrder: parseInt(v) || 0 })}
          help="Lower numbers appear first." />
        <Checkbox id="category-active" checked={categoryData.isActive}
          onChange={(v) => setCategoryData({ ...categoryData, isActive: v })}
          label="Active" help="Inactive categories are hidden from customers." />
      </Modal>

      {/* Brand modal */}
      <Modal
        open={showBrandModal}
        title={editingBrand ? "Edit brand" : "Add brand"}
        onClose={closeBrandModal}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeBrandModal}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitBrand}>{editingBrand ? "Save" : "Create brand"}</button>
          </>
        }
      >
        <TextField id="brand-name" label="Brand name" value={brandData.name}
          onChange={(v) => setBrandData({ ...brandData, name: v })}
          placeholder="e.g. Sunbrella" required />
        <TextField id="brand-logo" label="Logo URL" value={brandData.logoUrl}
          onChange={(v) => setBrandData({ ...brandData, logoUrl: v })}
          placeholder="https://example.com/logo.png" />
        <TextField id="brand-description" label="Description" value={brandData.description}
          onChange={(v) => setBrandData({ ...brandData, description: v })} />
        <TextField id="brand-sort" label="Sort order" type="number" value={brandData.sortOrder}
          onChange={(v) => setBrandData({ ...brandData, sortOrder: parseInt(v) || 0 })}
          help="Lower numbers appear first." />
      </Modal>

      {/* Pattern modal */}
      <Modal
        open={showPatternModal}
        title={editingPattern ? "Edit pattern" : "Add pattern"}
        onClose={closePatternModal}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closePatternModal}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitPattern}>{editingPattern ? "Save" : "Create pattern"}</button>
          </>
        }
      >
        <TextField id="pattern-name" label="Pattern name" value={patternData.name}
          onChange={(v) => setPatternData({ ...patternData, name: v })}
          placeholder="e.g. Solid, Striped, Floral" required />
        <TextField id="pattern-sort" label="Sort order" type="number" value={patternData.sortOrder}
          onChange={(v) => setPatternData({ ...patternData, sortOrder: parseInt(v) || 0 })}
          help="Lower numbers appear first." />
      </Modal>

      {/* Color modal */}
      <Modal
        open={showColorModal}
        title={editingColor ? "Edit color" : "Add color"}
        onClose={closeColorModal}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeColorModal}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitColor}>{editingColor ? "Save" : "Create color"}</button>
          </>
        }
      >
        <TextField id="color-name" label="Color name" value={colorData.name}
          onChange={(v) => setColorData({ ...colorData, name: v })}
          placeholder="e.g. Red, Navy Blue, Beige" required />
        <div className="cc-field">
          <label htmlFor="color-hex">Hex code</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              aria-label="Pick a color"
              value={colorData.hexCode || "#000000"}
              onChange={(e) => setColorData({ ...colorData, hexCode: e.target.value })}
              style={{ width: 36, height: 34, padding: 2, border: "1px solid var(--cc-border-2)", borderRadius: 8, cursor: "pointer", background: "var(--cc-surface)", flex: "none" }}
            />
            <input
              id="color-hex"
              type="text"
              className="cc-input"
              value={colorData.hexCode}
              onChange={(e) => setColorData({ ...colorData, hexCode: e.target.value })}
              placeholder="#FF0000"
              style={{ fontFamily: "var(--cc-mono)" }}
            />
          </div>
        </div>
        <TextField id="color-sort" label="Sort order" type="number" value={colorData.sortOrder}
          onChange={(v) => setColorData({ ...colorData, sortOrder: parseInt(v) || 0 })}
          help="Lower numbers appear first." />
      </Modal>

      {/* Material modal */}
      <Modal
        open={showMaterialModal}
        title={editingMaterial ? "Edit material" : "Add material"}
        onClose={closeMaterialModal}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeMaterialModal}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitMaterial}>{editingMaterial ? "Save" : "Create material"}</button>
          </>
        }
      >
        <TextField id="material-name" label="Material name" value={materialData.name}
          onChange={(v) => setMaterialData({ ...materialData, name: v })}
          placeholder="e.g. Cotton, Polyester, Velvet" required />
        <TextField id="material-sort" label="Sort order" type="number" value={materialData.sortOrder}
          onChange={(v) => setMaterialData({ ...materialData, sortOrder: parseInt(v) || 0 })}
          help="Lower numbers appear first." />
      </Modal>

      {/* Import CSV modal */}
      <Modal
        open={showImportModal}
        wide
        title="Import fabrics from CSV"
        onClose={closeImportModal}
        footer={
          <>
            <button type="button" className="cc-btn" onClick={closeImportModal}>Cancel</button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={submitImport} disabled={importing || !importCsv}>
              {importing ? "Importing…" : "Import"}
            </button>
          </>
        }
      >
        <div className="cc-banner">
          <strong>How the CSV works</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 2 }}>
            <li>Export your fabrics first to get the right columns.</li>
            <li>Leave <code>id</code> empty to create a new fabric.</li>
            <li>Keep the <code>id</code> to update an existing fabric.</li>
            <li>Separate multiple patterns, colors or materials with a pipe (|).</li>
            <li>Category, brand, pattern and color names must match ones that already exist.</li>
          </ul>
        </div>

        <div className="cc-field">
          <label htmlFor="fabrics-import-file">CSV file</label>
          <input
            id="fabrics-import-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportFile}
            className="cc-input"
          />
        </div>

        {importCsv && (
          <div className="cc-banner" style={{ background: "var(--cc-on-bg)", color: "var(--cc-on)" }}>
            File loaded: <span className="cc-num">{importCsv.split("\n").length - 1}</span> data rows found
          </div>
        )}

        {importResult && (
          <div className="cc-banner" style={importResult.success ? { background: "var(--cc-on-bg)", color: "var(--cc-on)" } : { background: "var(--cc-crit-bg)", color: "var(--cc-crit)" }}>
            {importResult.success ? (
              <>
                <p className="cc-p" style={{ fontWeight: 600 }}>Import complete</p>
                <p className="cc-p cc-num">Created: {importResult.created} · Updated: {importResult.updated}</p>
                {importResult.totalErrors > 0 && (
                  <p className="cc-p" style={{ marginTop: 8, color: "var(--cc-warn-fg)" }}>
                    {importResult.totalErrors} row(s) had problems
                  </p>
                )}
              </>
            ) : (
              <p className="cc-p">{importResult.error || "Import failed"}</p>
            )}
            {importResult.errors?.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && <li>…and {importResult.errors.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}
      </Modal>

      {confirmModal}
    </s-page>
  );
}
