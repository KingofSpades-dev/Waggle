const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Deleting Gra.fun data from database ---');
  try {
    // 1. Delete venue 'grafun' or name containing 'Gra' / 'grafun'
    const venues = await prisma.venue.findMany({
      where: {
        OR: [
          { key: { contains: 'grafun', mode: 'insensitive' } },
          { name: { contains: 'gra', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`Found ${venues.length} venues to delete.`);
    for (const v of venues) {
      console.log(`Deleting venue: ${v.name} (${v.key}, ID: ${v.id})`);
      // Deleting venue will cascade delete launches & associated trades/outcomes
      await prisma.venue.delete({
        where: { id: v.id }
      });
    }

    // 2. Also check reports table for any verdictVenueKey matching 'grafun'
    const deletedReports = await prisma.report.deleteMany({
      where: {
        verdictVenueKey: { contains: 'gra', mode: 'insensitive' }
      }
    });
    console.log(`Deleted ${deletedReports.count} reports referencing gra.fun.`);

    console.log('Successfully purged all Gra.fun records from DB.');
  } catch (err) {
    console.log('Database operation skipped or failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
