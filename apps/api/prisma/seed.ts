import {
  PrismaClient,
  Role,
  TenantPlan,
  TenantStatus,
  PaymentMethod,
  SaleStatus,
  PurchaseOrderStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number, hour = -1): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(
    hour >= 0 ? hour : Math.floor(Math.random() * 10) + 8,
    Math.floor(Math.random() * 60),
    0,
    0
  );
  return d;
}

function receipt(n: number, storeCode: string): string {
  return `${storeCode}-2026-${String(n).padStart(5, '0')}`;
}

async function main() {
  console.log('\n🌱  Démarrage du seeding enrichi...\n');

  // ── 1. Super Admin ──────────────────────────────────────────────────────────
  let superAdmin = await prisma.user.findUnique({ where: { email: 'admin@materiaux.com' } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'admin@materiaux.com',
        name: 'Super Administrateur',
        passwordHash: await bcrypt.hash('Admin1234!', 12),
        role: Role.SUPER_ADMIN,
        isActive: true,
      },
    });
    console.log('✅ Super Admin : admin@materiaux.com / Admin1234!');
  } else {
    console.log('ℹ️  Super Admin déjà existant');
  }

  // ── 2. Tenant ───────────────────────────────────────────────────────────────
  let tenant = await prisma.tenant.findUnique({ where: { email: 'contact@coulibaly-freres.ci' } });
  if (tenant) {
    console.log('ℹ️  Tenant existant — nettoyage...');
    await prisma.customerPayment.deleteMany({ where: { customer: { tenantId: tenant.id } } });
    await prisma.saleItem.deleteMany({ where: { sale: { tenantId: tenant.id } } });
    await prisma.sale.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.stockMovement.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.stockEntry.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.purchaseOrderItem.deleteMany({ where: { order: { tenantId: tenant.id } } });
    await prisma.purchaseOrder.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.customer.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.supplier.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.category.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.store.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  }

  tenant = await prisma.tenant.create({
    data: {
      name: 'COULIBALY & Frères',
      email: 'contact@coulibaly-freres.ci',
      phone: '+225 07 08 09 10 11',
      plan: TenantPlan.PRO,
      status: TenantStatus.ACTIVE,
    },
  });
  console.log(`✅ Tenant : ${tenant.name}`);

  // ── 3. Magasins ─────────────────────────────────────────────────────────────
  const storeCocody = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: 'COULIBALY & Frères — Cocody',
      address: 'Rue des Jardins, Cocody, Abidjan',
      phone: '+225 27 22 44 55 66',
      isActive: true,
    },
  });
  const storeAbobo = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: 'COULIBALY & Frères — Abobo',
      address: 'Avenue Houphouët-Boigny, Abobo, Abidjan',
      phone: '+225 27 23 11 22 33',
      isActive: true,
    },
  });
  console.log('✅ 2 magasins créés');

  // ── 4. Utilisateurs ─────────────────────────────────────────────────────────
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'proprietaire@demo.com',
      name: 'Coulibaly Mamadou',
      phone: '+225 07 11 22 33 44',
      passwordHash: await bcrypt.hash('Demo1234!', 12),
      role: Role.OWNER,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      email: 'manager@demo.com',
      name: 'Koné Aminata',
      phone: '+225 07 55 66 77 88',
      passwordHash: await bcrypt.hash('Demo1234!', 12),
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const cashier1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      email: 'caissier@demo.com',
      name: 'Touré Fatoumata',
      phone: '+225 05 12 34 56 78',
      passwordHash: await bcrypt.hash('Demo1234!', 12),
      role: Role.CASHIER,
      isActive: true,
    },
  });

  const cashier2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: storeAbobo.id,
      email: 'caissier2@demo.com',
      name: 'Bamba Seydou',
      phone: '+225 01 23 45 67 89',
      passwordHash: await bcrypt.hash('Demo1234!', 12),
      role: Role.CASHIER,
      isActive: true,
    },
  });

  console.log('✅ 4 utilisateurs créés');

  // ── 5. Produits (18 références) ─────────────────────────────────────────────
  const productDefs = [
    {
      ref: 'CIM-001',
      name: 'Ciment Portland CPJ 42,5 – 50kg',
      cat: 'Ciment',
      buy: '4200',
      sell: '5500',
      unit: 'sac',
      alertMin: 20,
    },
    {
      ref: 'CIM-002',
      name: 'Ciment CPA 55 – 50kg',
      cat: 'Ciment',
      buy: '4800',
      sell: '6200',
      unit: 'sac',
      alertMin: 15,
    },
    {
      ref: 'FER-001',
      name: 'Fer à béton Ø12mm × 12m',
      cat: 'Fer à béton',
      buy: '11500',
      sell: '14500',
      unit: 'barre',
      alertMin: 10,
    },
    {
      ref: 'FER-002',
      name: 'Fer à béton Ø10mm × 12m',
      cat: 'Fer à béton',
      buy: '8000',
      sell: '10500',
      unit: 'barre',
      alertMin: 10,
    },
    {
      ref: 'FER-003',
      name: 'Treillis soudé 2×3m',
      cat: 'Fer à béton',
      buy: '15000',
      sell: '19000',
      unit: 'feuille',
      alertMin: 5,
    },
    {
      ref: 'TOL-001',
      name: 'Tôle galvanisée 0,5mm – 1×2m',
      cat: 'Tôle',
      buy: '3200',
      sell: '4200',
      unit: 'feuille',
      alertMin: 10,
    },
    {
      ref: 'TOL-002',
      name: 'Tôle ondulée 0,45mm – 1×3m',
      cat: 'Tôle',
      buy: '4500',
      sell: '5800',
      unit: 'feuille',
      alertMin: 8,
    },
    {
      ref: 'PEI-001',
      name: 'Peinture glycéro blanche 25L',
      cat: 'Peinture',
      buy: '21000',
      sell: '27500',
      unit: 'bidon',
      alertMin: 5,
    },
    {
      ref: 'PEI-002',
      name: 'Peinture façade beige 10L',
      cat: 'Peinture',
      buy: '11000',
      sell: '14500',
      unit: 'bidon',
      alertMin: 5,
    },
    {
      ref: 'CAR-001',
      name: 'Carrelage sol 60×60 – Gris béton',
      cat: 'Carrelage',
      buy: '7500',
      sell: '10000',
      unit: 'm²',
      alertMin: 20,
    },
    {
      ref: 'CAR-002',
      name: 'Faïence murale 30×60 – Blanc mat',
      cat: 'Carrelage',
      buy: '5500',
      sell: '7500',
      unit: 'm²',
      alertMin: 15,
    },
    {
      ref: 'PLO-001',
      name: 'Tube PVC Ø110mm – 4m',
      cat: 'Plomberie',
      buy: '3800',
      sell: '5000',
      unit: 'barre',
      alertMin: 8,
    },
    {
      ref: 'PLO-002',
      name: 'Raccord PVC coude 90° Ø110mm',
      cat: 'Plomberie',
      buy: '450',
      sell: '650',
      unit: 'pièce',
      alertMin: 20,
    },
    {
      ref: 'ELE-001',
      name: 'Câble électrique 2,5mm² – 100m',
      cat: 'Électricité',
      buy: '28000',
      sell: '36000',
      unit: 'rouleau',
      alertMin: 3,
    },
    {
      ref: 'BOI-001',
      name: 'Planche madrier 50×200mm – 4m',
      cat: 'Bois',
      buy: '5500',
      sell: '7200',
      unit: 'pièce',
      alertMin: 10,
    },
    {
      ref: 'BOI-002',
      name: 'Contreplaqué 18mm – 1,22×2,44m',
      cat: 'Bois',
      buy: '18000',
      sell: '23000',
      unit: 'feuille',
      alertMin: 5,
    },
    {
      ref: 'AUT-001',
      name: 'Gravier 15/25 – m³',
      cat: 'Agrégats',
      buy: '15000',
      sell: '20000',
      unit: 'm³',
      alertMin: 5,
    },
    {
      ref: 'AUT-002',
      name: 'Sable de rivière – m³',
      cat: 'Agrégats',
      buy: '12000',
      sell: '16000',
      unit: 'm³',
      alertMin: 5,
    },
  ];

  // Catégories de la boutique — libres, créées ici pour la démo quincaillerie
  const categoryIds: Record<string, string> = {};
  const categoryNames = [...new Set(productDefs.map((p) => p.cat))];
  for (const [index, name] of categoryNames.entries()) {
    const created = await prisma.category.create({
      data: { tenantId: tenant.id, name, position: index },
    });
    categoryIds[name] = created.id;
  }
  console.log(`✅ ${categoryNames.length} catégories créées`);

  const products: Record<string, { id: string; name: string; sellPrice: number }> = {};

  for (const p of productDefs) {
    const created = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        reference: p.ref,
        name: p.name,
        categoryId: categoryIds[p.cat],
        buyPrice: p.buy,
        sellPrice: p.sell,
        unit: p.unit,
        tva: '18',
        isActive: true,
      },
    });
    products[p.ref] = { id: created.id, name: created.name, sellPrice: parseFloat(p.sell) };

    const qtyCocody = p.ref.startsWith('CIM')
      ? 250
      : p.ref.startsWith('FER')
        ? 80
        : p.ref.startsWith('CAR')
          ? 120
          : p.ref === 'ELE-001'
            ? 8
            : 45;
    await prisma.stockEntry.create({
      data: {
        tenantId: tenant.id,
        productId: created.id,
        storeId: storeCocody.id,
        quantity: qtyCocody,
        alertThreshold: p.alertMin,
      },
    });

    const qtyAbobo =
      p.ref === 'ELE-001' ? 1 : p.ref === 'FER-003' ? 2 : Math.max(3, Math.floor(qtyCocody * 0.35));
    await prisma.stockEntry.create({
      data: {
        tenantId: tenant.id,
        productId: created.id,
        storeId: storeAbobo.id,
        quantity: qtyAbobo,
        alertThreshold: p.alertMin,
      },
    });
  }
  console.log(`✅ ${productDefs.length} produits + stocks créés`);

  // ── 6. Clients (25) ─────────────────────────────────────────────────────────
  const customerDefs = [
    { name: 'Koné Amadou', phone: '07 01 02 03 04', credit: '0', email: 'kone.amadou@email.ci' },
    { name: 'Traoré Mariam', phone: '05 10 20 30 40', credit: '175000', email: null },
    {
      name: 'Diabaté Bafing',
      phone: '01 55 66 77 88',
      credit: '89500',
      email: 'diabate.b@email.ci',
    },
    { name: 'Coulibaly Seydou', phone: '07 22 33 44 55', credit: '0', email: null },
    {
      name: "N'Goran Yves",
      phone: '05 98 76 54 32',
      credit: '310000',
      email: 'ngoran.yves@gmail.com',
    },
    { name: 'Ouattara Fatoumata', phone: '01 11 22 33 44', credit: '0', email: null },
    {
      name: 'Bamba Construction SARL',
      phone: '27 22 55 66 77',
      credit: '520000',
      email: 'bamba.btp@gmail.com',
    },
    { name: 'Sanogo Moussa', phone: '07 44 55 66 77', credit: '0', email: null },
    { name: 'Gbané Patrick', phone: '01 23 45 67 89', credit: '48000', email: null },
    {
      name: 'Entreprise BTP Plus',
      phone: '27 23 99 88 77',
      credit: '0',
      email: 'btpplus@entreprise.ci',
    },
    { name: 'Diallo Issouf', phone: '07 33 44 55 66', credit: '65000', email: null },
    { name: 'Cissé Rokia', phone: '05 77 88 99 00', credit: '0', email: null },
    {
      name: 'Konaté Ibrahim',
      phone: '01 66 77 88 99',
      credit: '230000',
      email: 'konate.ibr@yahoo.fr',
    },
    { name: 'Sylla Mariame', phone: '07 55 44 33 22', credit: '0', email: null },
    { name: 'Camara Lamine', phone: '05 22 33 44 55', credit: '115000', email: null },
    { name: 'Doumbia Salif', phone: '01 88 99 00 11', credit: '0', email: 'doumbia.s@email.ci' },
    {
      name: 'Groupe Immobilier SIVIM',
      phone: '27 22 10 20 30',
      credit: '850000',
      email: 'sivim@immobilier.ci',
    },
    { name: 'Fofana Drissa', phone: '07 12 23 34 45', credit: '0', email: null },
    { name: 'Bakayoko Siaka', phone: '05 34 45 56 67', credit: '42000', email: null },
    { name: 'Soro Lacina', phone: '01 56 67 78 89', credit: '0', email: null },
    {
      name: 'Dembélé Oumar',
      phone: '07 78 89 90 01',
      credit: '185000',
      email: 'dembele.o@email.ci',
    },
    { name: 'Kouyaté Abou', phone: '05 90 01 12 23', credit: '0', email: null },
    { name: 'Ballo Aminata', phone: '01 01 12 23 34', credit: '78000', email: null },
    {
      name: 'BTP Constructions CI',
      phone: '27 22 80 90 00',
      credit: '420000',
      email: 'contact@btpci.com',
    },
    { name: 'Sawadogo Pierre', phone: '07 23 34 45 56', credit: '0', email: null },
  ];

  const customers: { id: string; name: string; credit: number }[] = [];
  for (const c of customerDefs) {
    const created = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        phone: c.phone,
        email: c.email ?? undefined,
        creditBalance: c.credit,
      },
    });
    customers.push({ id: created.id, name: c.name, credit: parseFloat(c.credit) });
  }
  console.log(`✅ ${customers.length} clients créés`);

  // ── 7. Fournisseurs (6) ─────────────────────────────────────────────────────
  const supplierDefs = [
    {
      name: 'DANGOTE Ciments CI',
      phone: '27 22 11 00 00',
      contact: 'M. Sangaré Lamine',
      email: 'ventes@dangote.ci',
    },
    {
      name: 'SOFER – Aciers',
      phone: '27 23 44 55 66',
      contact: 'Mme Koné Binta',
      email: 'commandes@sofer.ci',
    },
    {
      name: 'PROLUX Matériaux',
      phone: '07 77 88 99 00',
      contact: 'M. Touré Ibrahima',
      email: 'prolux@materiaux.ci',
    },
    {
      name: 'SACI Distribution',
      phone: '27 22 33 44 55',
      contact: 'Mme Diallo Kadiatou',
      email: 'saci@distribution.ci',
    },
    {
      name: "CIMAF Côte d'Ivoire",
      phone: '27 23 55 66 77',
      contact: 'M. Ouédraogo Denis',
      email: 'cimaf@cimaf.ci',
    },
    {
      name: 'BATIMACO Fournitures',
      phone: '07 66 77 88 99',
      contact: 'M. Aké Jean-François',
      email: 'batimaco@bati.ci',
    },
  ];

  const suppliers: { id: string; name: string }[] = [];
  for (const s of supplierDefs) {
    const created = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: s.name,
        phone: s.phone,
        contactName: s.contact,
        email: s.email,
      },
    });
    suppliers.push({ id: created.id, name: s.name });
  }
  console.log(`✅ ${suppliers.length} fournisseurs créés`);

  // ── 8. Bons de commande ─────────────────────────────────────────────────────
  const bc001 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      supplierId: suppliers[0].id,
      orderNumber: 'BC-2026-00001',
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: '2200000',
      expectedAt: daysAgo(28),
      receivedAt: daysAgo(25),
      createdAt: daysAgo(30),
      updatedAt: daysAgo(25),
      items: {
        create: [
          {
            productId: products['CIM-001'].id,
            productName: products['CIM-001'].name,
            quantityOrdered: 300,
            quantityReceived: 300,
            unitPrice: '4200',
            total: '1260000',
          },
          {
            productId: products['CIM-002'].id,
            productName: products['CIM-002'].name,
            quantityOrdered: 150,
            quantityReceived: 150,
            unitPrice: '4800',
            total: '720000',
          },
          {
            productId: products['FER-001'].id,
            productName: products['FER-001'].name,
            quantityOrdered: 15,
            quantityReceived: 15,
            unitPrice: '11500',
            total: '172500',
          },
        ],
      },
    },
  });

  const bc002 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      supplierId: suppliers[1].id,
      orderNumber: 'BC-2026-00002',
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: '1200000',
      expectedAt: daysAgo(18),
      receivedAt: daysAgo(15),
      createdAt: daysAgo(20),
      updatedAt: daysAgo(15),
      items: {
        create: [
          {
            productId: products['FER-001'].id,
            productName: products['FER-001'].name,
            quantityOrdered: 50,
            quantityReceived: 50,
            unitPrice: '11500',
            total: '575000',
          },
          {
            productId: products['FER-002'].id,
            productName: products['FER-002'].name,
            quantityOrdered: 40,
            quantityReceived: 40,
            unitPrice: '8000',
            total: '320000',
          },
          {
            productId: products['FER-003'].id,
            productName: products['FER-003'].name,
            quantityOrdered: 20,
            quantityReceived: 20,
            unitPrice: '15000',
            total: '300000',
          },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      supplierId: suppliers[2].id,
      orderNumber: 'BC-2026-00003',
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: '980000',
      expectedAt: daysAgo(12),
      receivedAt: daysAgo(10),
      createdAt: daysAgo(14),
      updatedAt: daysAgo(10),
      items: {
        create: [
          {
            productId: products['PEI-001'].id,
            productName: products['PEI-001'].name,
            quantityOrdered: 20,
            quantityReceived: 20,
            unitPrice: '21000',
            total: '420000',
          },
          {
            productId: products['CAR-001'].id,
            productName: products['CAR-001'].name,
            quantityOrdered: 60,
            quantityReceived: 60,
            unitPrice: '7500',
            total: '450000',
          },
          {
            productId: products['CAR-002'].id,
            productName: products['CAR-002'].name,
            quantityOrdered: 20,
            quantityReceived: 20,
            unitPrice: '5500',
            total: '110000',
          },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeAbobo.id,
      supplierId: suppliers[0].id,
      orderNumber: 'BC-2026-00004',
      status: PurchaseOrderStatus.SENT,
      totalAmount: '1680000',
      expectedAt: new Date(Date.now() + 3 * 864e5),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
      items: {
        create: [
          {
            productId: products['CIM-001'].id,
            productName: products['CIM-001'].name,
            quantityOrdered: 200,
            quantityReceived: 0,
            unitPrice: '4200',
            total: '840000',
          },
          {
            productId: products['CIM-002'].id,
            productName: products['CIM-002'].name,
            quantityOrdered: 140,
            quantityReceived: 0,
            unitPrice: '4800',
            total: '672000',
          },
          {
            productId: products['AUT-001'].id,
            productName: products['AUT-001'].name,
            quantityOrdered: 11,
            quantityReceived: 0,
            unitPrice: '15000',
            total: '165000',
          },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeAbobo.id,
      supplierId: suppliers[1].id,
      orderNumber: 'BC-2026-00005',
      status: PurchaseOrderStatus.DRAFT,
      totalAmount: '575000',
      expectedAt: new Date(Date.now() + 7 * 864e5),
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      items: {
        create: [
          {
            productId: products['FER-001'].id,
            productName: products['FER-001'].name,
            quantityOrdered: 30,
            quantityReceived: 0,
            unitPrice: '11500',
            total: '345000',
          },
          {
            productId: products['FER-003'].id,
            productName: products['FER-003'].name,
            quantityOrdered: 15,
            quantityReceived: 0,
            unitPrice: '15000',
            total: '225000',
          },
        ],
      },
    },
  });

  console.log('✅ 5 bons de commande créés');

  // ── 9. Ventes enrichies sur 30 jours ────────────────────────────────────────
  let receiptIdx = 1;
  let totalSales = 0;

  // Ventes fixes importantes (grandes commandes entreprises)
  const fixedSales = [
    // Il y a 28 jours — grande commande
    {
      daysBack: 28,
      store: storeCocody,
      cashier: manager,
      customer: customers[6],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'FER-001', qty: 30 },
        { ref: 'FER-002', qty: 20 },
        { ref: 'CIM-001', qty: 50 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 28,
      store: storeCocody,
      cashier: cashier1,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 15 },
        { ref: 'AUT-001', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 27,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.ORANGE_MONEY,
      lines: [
        { ref: 'CIM-002', qty: 20 },
        { ref: 'TOL-001', qty: 10 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 26,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[16],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'CAR-001', qty: 80 },
        { ref: 'CAR-002', qty: 40 },
        { ref: 'PLO-001', qty: 10 },
        { ref: 'PLO-002', qty: 30 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 25,
      store: storeCocody,
      cashier: manager,
      customer: customers[4],
      method: PaymentMethod.CREDIT,
      lines: [
        { ref: 'FER-001', qty: 15 },
        { ref: 'FER-003', qty: 8 },
      ],
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 100000,
    },
    {
      daysBack: 24,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.WAVE,
      lines: [
        { ref: 'CIM-001', qty: 12 },
        { ref: 'BOI-001', qty: 5 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 23,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[0],
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 20 },
        { ref: 'AUT-002', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 22,
      store: storeCocody,
      cashier: manager,
      customer: customers[23],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'CAR-001', qty: 100 },
        { ref: 'CAR-002', qty: 50 },
        { ref: 'PEI-001', qty: 5 },
        { ref: 'ELE-001', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 21,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.MTN_MONEY,
      lines: [
        { ref: 'TOL-001', qty: 12 },
        { ref: 'TOL-002', qty: 6 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 20,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[12],
      method: PaymentMethod.CREDIT,
      lines: [
        { ref: 'FER-001', qty: 10 },
        { ref: 'FER-002', qty: 8 },
      ],
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 80000,
    },
    {
      daysBack: 19,
      store: storeCocody,
      cashier: manager,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'PEI-001', qty: 4 },
        { ref: 'PEI-002', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 19,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.ORANGE_MONEY,
      lines: [
        { ref: 'CIM-001', qty: 18 },
        { ref: 'AUT-001', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 18,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[2],
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'BOI-001', qty: 8 },
        { ref: 'BOI-002', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 17,
      store: storeCocody,
      cashier: manager,
      customer: customers[6],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'CIM-001', qty: 40 },
        { ref: 'FER-001', qty: 20 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 16,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.WAVE,
      lines: [
        { ref: 'CIM-002', qty: 15 },
        { ref: 'TOL-001', qty: 8 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 15,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[20],
      method: PaymentMethod.CREDIT,
      lines: [
        { ref: 'CAR-001', qty: 40 },
        { ref: 'CAR-002', qty: 20 },
      ],
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 200000,
    },
    {
      daysBack: 14,
      store: storeCocody,
      cashier: manager,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'PLO-001', qty: 5 },
        { ref: 'PLO-002', qty: 20 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 13,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[8],
      method: PaymentMethod.ORANGE_MONEY,
      lines: [
        { ref: 'PEI-001', qty: 2 },
        { ref: 'PEI-002', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 12,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.MTN_MONEY,
      lines: [
        { ref: 'CIM-001', qty: 10 },
        { ref: 'AUT-002', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 11,
      store: storeCocody,
      cashier: manager,
      customer: customers[23],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'FER-001', qty: 25 },
        { ref: 'FER-002', qty: 15 },
        { ref: 'FER-003', qty: 10 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 10,
      store: storeCocody,
      cashier: cashier1,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 8 },
        { ref: 'TOL-002', qty: 4 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 10,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.WAVE,
      lines: [
        { ref: 'CIM-002', qty: 12 },
        { ref: 'BOI-001', qty: 4 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 9,
      store: storeCocody,
      cashier: manager,
      customer: customers[16],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'CAR-001', qty: 60 },
        { ref: 'CAR-002', qty: 30 },
        { ref: 'AUT-001', qty: 4 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 8,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[4],
      method: PaymentMethod.CREDIT,
      lines: [
        { ref: 'ELE-001', qty: 3 },
        { ref: 'PLO-001', qty: 4 },
      ],
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 0,
    },
    {
      daysBack: 7,
      store: storeCocody,
      cashier: manager,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 15 },
        { ref: 'FER-001', qty: 5 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 7,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.ORANGE_MONEY,
      lines: [
        { ref: 'TOL-001', qty: 6 },
        { ref: 'TOL-002', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 6,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[1],
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'PEI-001', qty: 3 },
        { ref: 'BOI-002', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 6,
      store: storeCocody,
      cashier: manager,
      customer: customers[11],
      method: PaymentMethod.MTN_MONEY,
      lines: [
        { ref: 'CAR-001', qty: 15 },
        { ref: 'CAR-002', qty: 10 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 5,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[6],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'FER-001', qty: 20 },
        { ref: 'FER-002', qty: 15 },
        { ref: 'FER-003', qty: 5 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 5,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.WAVE,
      lines: [
        { ref: 'CIM-001', qty: 14 },
        { ref: 'AUT-002', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 4,
      store: storeCocody,
      cashier: manager,
      customer: customers[0],
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 20, discount: 2000 },
        { ref: 'AUT-001', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 4,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[14],
      method: PaymentMethod.ORANGE_MONEY,
      lines: [
        { ref: 'PLO-001', qty: 3 },
        { ref: 'PLO-002', qty: 12 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 3,
      store: storeCocody,
      cashier: manager,
      customer: customers[23],
      method: PaymentMethod.VIREMENT,
      lines: [
        { ref: 'CAR-001', qty: 50 },
        { ref: 'CAR-002', qty: 25 },
        { ref: 'PEI-002', qty: 4 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 3,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 10 },
        { ref: 'CIM-002', qty: 8 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 3,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[2],
      method: PaymentMethod.CREDIT,
      lines: [
        { ref: 'FER-001', qty: 5 },
        { ref: 'FER-002', qty: 4 },
      ],
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 50000,
    },
    {
      daysBack: 2,
      store: storeCocody,
      cashier: manager,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'PEI-001', qty: 3 },
        { ref: 'PEI-002', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 2,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[18],
      method: PaymentMethod.WAVE,
      lines: [
        { ref: 'BOI-001', qty: 6 },
        { ref: 'BOI-002', qty: 2 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 2,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.MTN_MONEY,
      lines: [
        { ref: 'CIM-002', qty: 12 },
        { ref: 'TOL-001', qty: 5 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 1,
      store: storeCocody,
      cashier: cashier1,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'CIM-001', qty: 10 },
        { ref: 'FER-001', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 1,
      store: storeCocody,
      cashier: manager,
      customer: customers[1],
      method: PaymentMethod.ORANGE_MONEY,
      lines: [
        { ref: 'CAR-001', qty: 20 },
        { ref: 'CAR-002', qty: 10 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 1,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.WAVE,
      lines: [
        { ref: 'CIM-002', qty: 15 },
        { ref: 'TOL-001', qty: 8 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 1,
      store: storeCocody,
      cashier: cashier1,
      customer: customers[12],
      method: PaymentMethod.CREDIT,
      lines: [
        { ref: 'FER-001', qty: 5 },
        { ref: 'FER-002', qty: 4 },
      ],
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 50000,
    },
    {
      daysBack: 0,
      store: storeCocody,
      cashier: manager,
      customer: null,
      method: PaymentMethod.CASH,
      lines: [
        { ref: 'PEI-001', qty: 2 },
        { ref: 'BOI-001', qty: 3 },
      ],
      status: SaleStatus.COMPLETED,
    },
    {
      daysBack: 0,
      store: storeAbobo,
      cashier: cashier2,
      customer: null,
      method: PaymentMethod.MTN_MONEY,
      lines: [
        { ref: 'CIM-001', qty: 8 },
        { ref: 'AUT-001', qty: 1 },
      ],
      status: SaleStatus.COMPLETED,
    },
  ] as const;

  for (const s of fixedSales) {
    const storeCode = s.store.id === storeCocody.id ? 'COC' : 'ABO';
    let subtotal = 0;
    const lines = s.lines.map((l: { ref: string; qty: number; discount?: number }) => {
      const p = products[l.ref];
      const disc = (l as { ref: string; qty: number; discount?: number }).discount ?? 0;
      const total = p.sellPrice * l.qty - disc;
      subtotal += total;
      return {
        productId: p.id,
        productName: p.name,
        quantity: l.qty,
        unitPrice: p.sellPrice,
        discount: disc,
        total,
      };
    });

    const totalAmount = subtotal;
    const isCredit = s.status === SaleStatus.PENDING_CREDIT;
    const amountPaid = isCredit ? ((s as { amountPaid?: number }).amountPaid ?? 0) : totalAmount;

    await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        storeId: s.store.id,
        cashierId: s.cashier.id,
        customerId: s.customer?.id ?? undefined,
        receiptNumber: receipt(receiptIdx++, storeCode),
        status: s.status,
        paymentMethod: s.method,
        subtotal: subtotal.toString(),
        globalDiscount: '0',
        totalAmount: totalAmount.toString(),
        amountPaid: amountPaid.toString(),
        amountDue: (totalAmount - amountPaid).toString(),
        createdAt: daysAgo(s.daysBack),
        updatedAt: daysAgo(s.daysBack),
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.quantity.toString(),
            unitPrice: l.unitPrice.toString(),
            discount: l.discount.toString(),
            total: l.total.toString(),
          })),
        },
      },
    });
    totalSales++;
  }
  console.log(`✅ ${totalSales} ventes créées sur 30 jours`);

  // ── 10. Paiements clients (remboursements) ──────────────────────────────────
  await prisma.customerPayment.createMany({
    data: [
      {
        tenantId: tenant.id,
        customerId: customers[1].id,
        amount: '75000',
        paymentMethod: 'ORANGE_MONEY',
        createdAt: daysAgo(20),
      },
      {
        tenantId: tenant.id,
        customerId: customers[2].id,
        amount: '50000',
        paymentMethod: 'CASH',
        createdAt: daysAgo(18),
      },
      {
        tenantId: tenant.id,
        customerId: customers[4].id,
        amount: '150000',
        paymentMethod: 'WAVE',
        createdAt: daysAgo(15),
      },
      {
        tenantId: tenant.id,
        customerId: customers[6].id,
        amount: '250000',
        paymentMethod: 'VIREMENT',
        createdAt: daysAgo(22),
      },
      {
        tenantId: tenant.id,
        customerId: customers[12].id,
        amount: '80000',
        paymentMethod: 'VIREMENT',
        createdAt: daysAgo(12),
      },
      {
        tenantId: tenant.id,
        customerId: customers[16].id,
        amount: '400000',
        paymentMethod: 'VIREMENT',
        createdAt: daysAgo(10),
      },
      {
        tenantId: tenant.id,
        customerId: customers[20].id,
        amount: '100000',
        paymentMethod: 'ORANGE_MONEY',
        createdAt: daysAgo(8),
      },
      {
        tenantId: tenant.id,
        customerId: customers[23].id,
        amount: '300000',
        paymentMethod: 'VIREMENT',
        createdAt: daysAgo(7),
      },
    ],
  });
  console.log('✅ 8 paiements clients enregistrés');

  // ── 11. Mouvements de stock ──────────────────────────────────────────────────
  await prisma.stockMovement.createMany({
    data: [
      // Réceptions BC-2026-00001
      {
        tenantId: tenant.id,
        productId: products['CIM-001'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '300',
        reason: 'Réception BC-2026-00001',
        referenceId: bc001.id,
        createdById: manager.id,
        createdAt: daysAgo(25),
      },
      {
        tenantId: tenant.id,
        productId: products['CIM-002'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '150',
        reason: 'Réception BC-2026-00001',
        referenceId: bc001.id,
        createdById: manager.id,
        createdAt: daysAgo(25),
      },
      {
        tenantId: tenant.id,
        productId: products['FER-001'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '15',
        reason: 'Réception BC-2026-00001',
        referenceId: bc001.id,
        createdById: manager.id,
        createdAt: daysAgo(25),
      },
      // Réceptions BC-2026-00002
      {
        tenantId: tenant.id,
        productId: products['FER-001'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '50',
        reason: 'Réception BC-2026-00002',
        referenceId: bc002.id,
        createdById: manager.id,
        createdAt: daysAgo(15),
      },
      {
        tenantId: tenant.id,
        productId: products['FER-002'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '40',
        reason: 'Réception BC-2026-00002',
        referenceId: bc002.id,
        createdById: manager.id,
        createdAt: daysAgo(15),
      },
      {
        tenantId: tenant.id,
        productId: products['FER-003'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '20',
        reason: 'Réception BC-2026-00002',
        referenceId: bc002.id,
        createdById: manager.id,
        createdAt: daysAgo(15),
      },
      // Ajustements inventaire
      {
        tenantId: tenant.id,
        productId: products['TOL-001'].id,
        storeId: storeAbobo.id,
        type: 'OUT',
        quantity: '2',
        reason: 'Casse/détérioration inventaire',
        createdById: owner.id,
        createdAt: daysAgo(8),
      },
      {
        tenantId: tenant.id,
        productId: products['PLO-002'].id,
        storeId: storeCocody.id,
        type: 'OUT',
        quantity: '5',
        reason: 'Retour marchandise défectueuse',
        createdById: manager.id,
        createdAt: daysAgo(5),
      },
      // Transfert inter-magasin
      {
        tenantId: tenant.id,
        productId: products['CIM-001'].id,
        storeId: storeCocody.id,
        type: 'OUT',
        quantity: '30',
        reason: 'Transfert vers Abobo',
        createdById: manager.id,
        createdAt: daysAgo(18),
      },
      {
        tenantId: tenant.id,
        productId: products['CIM-001'].id,
        storeId: storeAbobo.id,
        type: 'IN',
        quantity: '30',
        reason: 'Transfert depuis Cocody',
        createdById: manager.id,
        createdAt: daysAgo(18),
      },
    ],
  });
  console.log('✅ 10 mouvements de stock créés');

  // ─── Résumé ─────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║         🎉  SEEDING TERMINÉ — DONNÉES DE TEST ENRICHIES              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Tenant         │ COULIBALY & Frères (PRO)                           ║
║  Magasins       │ Cocody + Abobo                                     ║
║  Produits       │ 18 références (ciment, fer, carrelage, etc.)       ║
║  Clients        │ 25 (dont 8 avec crédit, 3 entreprises BTP)         ║
║  Fournisseurs   │ 6                                                  ║
║  Ventes         │ 45 ventes sur 30 jours (2 magasins)                ║
║  Bons commande  │ 5 (3 reçus, 1 envoyé, 1 brouillon)                ║
╠══════════════════════════════════════════════════════════════════════╣
║  Super Admin    │ admin@materiaux.com       │ Admin1234!             ║
║  Propriétaire   │ proprietaire@demo.com     │ Demo1234!              ║
║  Gérant         │ manager@demo.com          │ Demo1234!              ║
║  Caissier 1     │ caissier@demo.com         │ Demo1234!              ║
║  Caissier 2     │ caissier2@demo.com        │ Demo1234!              ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
