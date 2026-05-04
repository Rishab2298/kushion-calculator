import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Fetch all fabrics ordered by creation time
  const fabrics = await prisma.fabric.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true, sortOrder: true },
  });

  console.log(`Found ${fabrics.length} fabrics. Reassigning sort orders...`);

  // Update each fabric with sequential sort order
  for (let i = 0; i < fabrics.length; i++) {
    await prisma.fabric.update({
      where: { id: fabrics[i].id },
      data: { sortOrder: i },
    });
    console.log(`  [${i}] ${fabrics[i].name} (was ${fabrics[i].sortOrder})`);
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
