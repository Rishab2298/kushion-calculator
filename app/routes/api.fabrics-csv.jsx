import prisma from "../db.server";
import { invalidateConfigCache } from "./api.calculator-config";

// CSV Export - GET request
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all fabrics with related data
    const fabrics = await prisma.fabric.findMany({
      where: { shop },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        patternAssignments: { include: { pattern: { select: { id: true, name: true } } } },
        colorAssignments: { include: { color: { select: { id: true, name: true } } } },
        materialAssignments: { include: { material: { select: { id: true, name: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });

    // CSV headers
    const headers = [
      "id",
      "name",
      "categoryName",
      "brandName",
      "imageUrl",
      "pricePerSqInch",
      "description",
      "priceTier",
      "sortOrder",
      "isActive",
      "isDefault",
      "patterns",
      "colors",
      "materials",
    ];

    // Build CSV rows
    const rows = fabrics.map(fab => [
      fab.id,
      escapeCsvField(fab.name),
      escapeCsvField(fab.category?.name || ""),
      escapeCsvField(fab.brand?.name || ""),
      escapeCsvField(fab.imageUrl || ""),
      fab.pricePerSqInch,
      escapeCsvField(fab.description || ""),
      fab.priceTier || "none",
      fab.sortOrder,
      fab.isActive ? "true" : "false",
      fab.isDefault ? "true" : "false",
      escapeCsvField(fab.patternAssignments.map(a => a.pattern.name).join("|")),
      escapeCsvField(fab.colorAssignments.map(a => a.color.name).join("|")),
      escapeCsvField(fab.materialAssignments.map(a => a.material.name).join("|")),
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fabrics-export-${new Date().toISOString().split("T")[0]}.csv"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error exporting fabrics:", error);
    return new Response(JSON.stringify({ error: "Failed to export fabrics", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// CSV Import - POST request
export const action = async ({ request }) => {
  const formData = await request.formData();
  const shop = formData.get("shop");
  const csvContent = formData.get("csv");

  if (!shop || !csvContent) {
    return new Response(JSON.stringify({ error: "Shop and CSV content required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse CSV
    const lines = csvContent.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV must have header row and at least one data row" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = parseCsvLine(lines[0]);
    const dataRows = lines.slice(1).map(line => parseCsvLine(line));

    // Validate headers
    const requiredHeaders = ["name", "pricePerSqInch"];
    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
        return new Response(JSON.stringify({ error: `Missing required header: ${h}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Fetch lookup data for name-to-ID mapping
    const [categories, brands, patterns, colors, existingMaterials] = await Promise.all([
      prisma.fabricCategory.findMany({ where: { shop }, select: { id: true, name: true } }),
      prisma.fabricBrand.findMany({ where: { shop }, select: { id: true, name: true } }),
      prisma.fabricPattern.findMany({ where: { shop }, select: { id: true, name: true } }),
      prisma.fabricColor.findMany({ where: { shop }, select: { id: true, name: true } }),
      prisma.fabricMaterial.findMany({ where: { shop }, select: { id: true, name: true } }),
    ]);

    const categoryMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c.id]));
    const brandMap = Object.fromEntries(brands.map(b => [b.name.toLowerCase(), b.id]));
    const patternMap = Object.fromEntries(patterns.map(p => [p.name.toLowerCase(), p.id]));
    const colorMap = Object.fromEntries(colors.map(c => [c.name.toLowerCase(), c.id]));
    const materialMap = Object.fromEntries(existingMaterials.map(m => [m.name.toLowerCase(), m.id]));

    let created = 0;
    let updated = 0;
    let errors = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // 1-indexed, plus header row

      try {
        const rowData = {};
        headers.forEach((h, idx) => {
          rowData[h] = row[idx] || "";
        });

        const fabricId = rowData.id?.trim();
        const name = rowData.name?.trim();

        if (!name) {
          errors.push(`Row ${rowNum}: Name is required`);
          continue;
        }

        // Build fabric data
        const fabricData = {
          shop,
          name,
          imageUrl: rowData.imageUrl?.trim() || null,
          pricePerSqInch: parseFloat(rowData.pricePerSqInch) || 0,
          description: rowData.description?.trim() || null,
          priceTier: ["none", "low", "medium", "high"].includes(rowData.priceTier) ? rowData.priceTier : "none",
          sortOrder: parseInt(rowData.sortOrder) || 0,
          isActive: rowData.isActive?.toLowerCase() !== "false",
          isDefault: rowData.isDefault?.toLowerCase() === "true",
        };

        // Resolve category by name
        if (rowData.categoryName?.trim()) {
          const catId = categoryMap[rowData.categoryName.trim().toLowerCase()];
          if (catId) {
            fabricData.categoryId = catId;
          }
        }

        // Resolve brand by name
        if (rowData.brandName?.trim()) {
          const brandId = brandMap[rowData.brandName.trim().toLowerCase()];
          if (brandId) {
            fabricData.brandId = brandId;
          }
        }

        // Parse multi-value fields (pipe-separated)
        const patternNames = rowData.patterns?.split("|").map(s => s.trim()).filter(Boolean) || [];
        const colorNames = rowData.colors?.split("|").map(s => s.trim()).filter(Boolean) || [];
        const materialNames = rowData.materials?.split("|").map(s => s.trim()).filter(Boolean) || [];

        const patternIds = patternNames.map(n => patternMap[n.toLowerCase()]).filter(Boolean);
        const colorIds = colorNames.map(n => colorMap[n.toLowerCase()]).filter(Boolean);

        // Resolve material IDs, auto-creating missing materials
        const materialIds = [];
        for (const mName of materialNames) {
          let mid = materialMap[mName.toLowerCase()];
          if (!mid) {
            const created = await prisma.fabricMaterial.create({
              data: { shop, name: mName, sortOrder: 0 },
            });
            mid = created.id;
            materialMap[mName.toLowerCase()] = mid;
          }
          materialIds.push(mid);
        }

        if (fabricId) {
          // Update existing fabric
          const existing = await prisma.fabric.findFirst({ where: { id: fabricId, shop } });
          if (!existing) {
            errors.push(`Row ${rowNum}: Fabric ID ${fabricId} not found`);
            continue;
          }

          await prisma.fabric.update({
            where: { id: fabricId },
            data: fabricData,
          });

          // Update junction tables
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

          updated++;
        } else {
          // Create new fabric
          const newFabric = await prisma.fabric.create({ data: fabricData });

          if (patternIds.length > 0) {
            await prisma.fabricPatternAssignment.createMany({
              data: patternIds.map(pid => ({ fabricId: newFabric.id, patternId: pid })),
            });
          }
          if (colorIds.length > 0) {
            await prisma.fabricColorAssignment.createMany({
              data: colorIds.map(cid => ({ fabricId: newFabric.id, colorId: cid })),
            });
          }
          if (materialIds.length > 0) {
            await prisma.fabricMaterialAssignment.createMany({
              data: materialIds.map(mid => ({ fabricId: newFabric.id, materialId: mid })),
            });
          }

          created++;
        }
      } catch (rowError) {
        errors.push(`Row ${rowNum}: ${rowError.message}`);
      }
    }

    invalidateConfigCache(shop);

    return new Response(JSON.stringify({
      success: true,
      created,
      updated,
      errors: errors.slice(0, 20), // Limit errors returned
      totalErrors: errors.length,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error importing fabrics:", error);
    return new Response(JSON.stringify({ error: "Failed to import fabrics", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Helper: Escape CSV field
function escapeCsvField(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper: Parse CSV line (handles quoted fields)
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());

  return result;
}
