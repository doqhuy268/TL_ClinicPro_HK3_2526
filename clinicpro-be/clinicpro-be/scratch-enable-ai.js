const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.template.updateMany({
    data: {
      enableAutoDiagnosis: true,
    },
  });
  console.log(`Updated ${result.count} templates to enable Auto Diagnosis.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
