const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ps = await prisma.prescriptionService.findMany({
    where: { status: 'WAITING' },
    include: {
      prescription: { include: { patientProfile: true } },
      doctor: { include: { auth: true } },
      booth: true,
      clinicRoom: true
    }
  });

  console.log(JSON.stringify(ps, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
