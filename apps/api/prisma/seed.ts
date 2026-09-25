import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Démarrage du seeding...');

  // Super Admin (prestataire SaaS)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@materiaux.pro';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'Admin@1234';

  const existing = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(superAdminPassword, 12);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: process.env.SUPER_ADMIN_NAME ?? 'Super Administrateur',
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.info(`✅ Super Admin créé : ${superAdminEmail}`);
  } else {
    console.info('ℹ️  Super Admin déjà existant, ignoré.');
  }

  // Tenant de démonstration
  const demoEmail = 'demo@materiaux.pro';
  let demoTenant = await prisma.tenant.findUnique({ where: { email: demoEmail } });

  if (!demoTenant) {
    demoTenant = await prisma.tenant.create({
      data: {
        name: 'Magasins Construction Abidjan',
        email: demoEmail,
        phone: '+225 07 00 00 00 00',
        plan: 'PRO',
        status: 'ACTIVE',
      },
    });
    console.info(`✅ Tenant démo créé : ${demoTenant.name}`);

    // Créer le propriétaire du tenant démo
    const ownerHash = await bcrypt.hash('Owner@1234', 12);
    const owner = await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        email: 'proprietaire@demo.pro',
        name: 'Koné Ibrahim',
        passwordHash: ownerHash,
        role: 'OWNER',
      },
    });
    console.info(`✅ Propriétaire créé : ${owner.email}`);

    // Créer deux magasins
    const store1 = await prisma.store.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Magasin Cocody',
        address: 'Cocody, Abidjan, Côte d\'Ivoire',
        phone: '+225 07 11 22 33',
      },
    });
    const store2 = await prisma.store.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Magasin Yopougon',
        address: 'Yopougon, Abidjan, Côte d\'Ivoire',
        phone: '+225 07 44 55 66',
      },
    });
    console.info(`✅ Magasins créés : ${store1.name}, ${store2.name}`);

    // Caissier demo pour Magasin 1
    const cashierHash = await bcrypt.hash('Caissier@1234', 12);
    await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        storeId: store1.id,
        email: 'caissier@demo.pro',
        name: 'Traoré Fatou',
        passwordHash: cashierHash,
        role: 'CASHIER',
      },
    });
    console.info('✅ Caissier créé');

    // Produits de démonstration
    const products = [
      { reference: 'CIM-001', name: 'Ciment Portland 50kg', category: 'CIMENT' as const, buyPrice: '4500', sellPrice: '5500', unit: 'sac' },
      { reference: 'FER-001', name: 'Fer à béton Ø12mm x 12m', category: 'FER_BETON' as const, buyPrice: '12000', sellPrice: '15000', unit: 'barre' },
      { reference: 'FER-002', name: 'Fer à béton Ø10mm x 12m', category: 'FER_BETON' as const, buyPrice: '8500', sellPrice: '11000', unit: 'barre' },
      { reference: 'TOL-001', name: 'Tôle galvanisée 0.5mm', category: 'TOLE' as const, buyPrice: '3500', sellPrice: '4500', unit: 'm²' },
      { reference: 'PEI-001', name: 'Peinture glycéro blanche 25L', category: 'PEINTURE' as const, buyPrice: '22000', sellPrice: '28000', unit: 'bidon' },
      { reference: 'CAR-001', name: 'Carrelage sol 60x60 gris', category: 'CARRELAGE' as const, buyPrice: '8000', sellPrice: '11000', unit: 'm²' },
    ];

    for (const p of products) {
      const product = await prisma.product.create({
        data: {
          tenantId: demoTenant.id,
          ...p,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice,
          tva: 18,
        },
      });
      // Stock initial dans les deux magasins
      await prisma.stockEntry.createMany({
        data: [
          { tenantId: demoTenant.id, productId: product.id, storeId: store1.id, quantity: 100, alertThreshold: 10 },
          { tenantId: demoTenant.id, productId: product.id, storeId: store2.id, quantity: 50, alertThreshold: 5 },
        ],
      });
    }
    console.info(`✅ ${products.length} produits créés avec stocks`);
  } else {
    console.info('ℹ️  Tenant démo déjà existant, ignoré.');
  }

  console.info('🎉 Seeding terminé !');
  console.info('\n📋 Comptes de connexion :');
  console.info('  Super Admin  : admin@materiaux.pro / Admin@1234');
  console.info('  Propriétaire : proprietaire@demo.pro / Owner@1234');
  console.info('  Caissier     : caissier@demo.pro / Caissier@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
