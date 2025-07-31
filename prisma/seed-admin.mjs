import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin user and roles...');

  // Create roles
  const roles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'att-view', description: 'Can view attendance occurrences' },
    { name: 'att-edit', description: 'Can create and edit attendance occurrences' },
    { name: 'ca-view', description: 'Can view corrective actions' },
    { name: 'ca-edit', description: 'Can create and edit corrective actions' },
    { name: 'user-edit', description: 'Can edit user information' },
    { name: 'report-edit', description: 'Can generate and view reports' },
    { name: 'pending', description: 'Pending approval' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`Created/updated role: ${role.name}`);
  }

  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123'; // Change this in production!
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrator',
      isAdmin: true,
      isActive: true,
      roles: {
        create: [
          { role: { connect: { name: 'admin' } } },
          { role: { connect: { name: 'att-view' } } },
          { role: { connect: { name: 'att-edit' } } },
          { role: { connect: { name: 'ca-view' } } },
          { role: { connect: { name: 'ca-edit' } } },
          { role: { connect: { name: 'user-edit' } } },
          { role: { connect: { name: 'report-edit' } } },
        ],
      },
    },
  });

  console.log(`Created/updated admin user: ${adminUser.email}`);
  console.log('Admin password: admin123 (change this in production!)');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 