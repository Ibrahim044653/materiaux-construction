import {
  PrismaClient,
  Role,
  TenantPlan,
  TenantStatus,
  ProductCategory,
  PaymentMethod,
  SaleStatus,
  PurchaseOrderStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60), 0);
  return d;
}

function receipt(n: number, storeCode: string): string {
  return `${storeCode}-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Démarrage du seeding complet...\n');

  // ── 1. Super Admin ────────────────────────────────────────────────────────
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

  // ── 2. Tenant ─────────────────────────────────────────────────────────────
  let tenant = await prisma.tenant.findUnique({ where: { email: 'contact@coulibaly-freres.ci' } });
  if (tenant) {
    console.log('ℹ️  Tenant COULIBALY & Frères déjà existant — suppression et recréation...');
    // Supprimer dans l'ordre des dépendances
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
  console.log(`✅ Tenant créé : ${tenant.name}`);

  // ── 3. Magasins ───────────────────────────────────────────────────────────
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
      address: 'Avenue Houphöet-Boigny, Abobo, Abidjan',
      phone: '+225 27 23 11 22 33',
      isActive: true,
    },
  });
  console.log(`✅ Magasins : ${storeCocody.name} | ${storeAbobo.name}`);

  // ── 4. Utilisateurs ───────────────────────────────────────────────────────
  const _owner = await prisma.user.create({
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

  console.log('✅ Utilisateurs créés (owner, manager, 2 caissiers)');

  // ── 5. Produits ───────────────────────────────────────────────────────────
  const productDefs = [
    {
      ref: 'CIM-001',
      name: 'Ciment Portland CPJ 42,5 – 50kg',
      cat: ProductCategory.CIMENT,
      buy: '4200',
      sell: '5500',
      unit: 'sac',
      alertMin: 20,
    },
    {
      ref: 'CIM-002',
      name: 'Ciment CPA 55 – 50kg',
      cat: ProductCategory.CIMENT,
      buy: '4800',
      sell: '6200',
      unit: 'sac',
      alertMin: 15,
    },
    {
      ref: 'FER-001',
      name: 'Fer à béton Ø12mm × 12m',
      cat: ProductCategory.FER_BETON,
      buy: '11500',
      sell: '14500',
      unit: 'barre',
      alertMin: 10,
    },
    {
      ref: 'FER-002',
      name: 'Fer à béton Ø10mm × 12m',
      cat: ProductCategory.FER_BETON,
      buy: '8000',
      sell: '10500',
      unit: 'barre',
      alertMin: 10,
    },
    {
      ref: 'FER-003',
      name: 'Treillis soudé 2×3m',
      cat: ProductCategory.FER_BETON,
      buy: '15000',
      sell: '19000',
      unit: 'feuille',
      alertMin: 5,
    },
    {
      ref: 'TOL-001',
      name: 'Tôle galvanisée 0,5mm – 1×2m',
      cat: ProductCategory.TOLE,
      buy: '3200',
      sell: '4200',
      unit: 'feuille',
      alertMin: 10,
    },
    {
      ref: 'TOL-002',
      name: 'Tôle ondulée 0,45mm – 1×3m',
      cat: ProductCategory.TOLE,
      buy: '4500',
      sell: '5800',
      unit: 'feuille',
      alertMin: 8,
    },
    {
      ref: 'PEI-001',
      name: 'Peinture glycéro blanche 25L',
      cat: ProductCategory.PEINTURE,
      buy: '21000',
      sell: '27500',
      unit: 'bidon',
      alertMin: 5,
    },
    {
      ref: 'PEI-002',
      name: 'Peinture façade beige 10L',
      cat: ProductCategory.PEINTURE,
      buy: '11000',
      sell: '14500',
      unit: 'bidon',
      alertMin: 5,
    },
    {
      ref: 'CAR-001',
      name: 'Carrelage sol 60×60 – Gris béton',
      cat: ProductCategory.CARRELAGE,
      buy: '7500',
      sell: '10000',
      unit: 'm²',
      alertMin: 20,
    },
    {
      ref: 'CAR-002',
      name: 'Faïence murale 30×60 – Blanc mat',
      cat: ProductCategory.CARRELAGE,
      buy: '5500',
      sell: '7500',
      unit: 'm²',
      alertMin: 15,
    },
    {
      ref: 'PLO-001',
      name: 'Tube PVC Ø110mm – 4m',
      cat: ProductCategory.PLOMBERIE,
      buy: '3800',
      sell: '5000',
      unit: 'barre',
      alertMin: 8,
    },
    {
      ref: 'PLO-002',
      name: 'Raccord PVC coude 90° Ø110mm',
      cat: ProductCategory.PLOMBERIE,
      buy: '450',
      sell: '650',
      unit: 'pièce',
      alertMin: 20,
    },
    {
      ref: 'ELE-001',
      name: 'Câble électrique 2,5mm² – 100m',
      cat: ProductCategory.ELECTRICITE,
      buy: '28000',
      sell: '36000',
      unit: 'rouleau',
      alertMin: 3,
    },
    {
      ref: 'BOI-001',
      name: 'Planche madrier 50×200mm – 4m',
      cat: ProductCategory.BOIS,
      buy: '5500',
      sell: '7200',
      unit: 'pièce',
      alertMin: 10,
    },
    {
      ref: 'BOI-002',
      name: 'Contreplaqué 18mm – 1,22×2,44m',
      cat: ProductCategory.BOIS,
      buy: '18000',
      sell: '23000',
      unit: 'feuille',
      alertMin: 5,
    },
    {
      ref: 'AUT-001',
      name: 'Gravier 15/25 – m³',
      cat: ProductCategory.AUTRE,
      buy: '15000',
      sell: '20000',
      unit: 'm³',
      alertMin: 5,
    },
    {
      ref: 'AUT-002',
      name: 'Sable de rivière – m³',
      cat: ProductCategory.AUTRE,
      buy: '12000',
      sell: '16000',
      unit: 'm³',
      alertMin: 5,
    },
  ];

  const products: Record<string, { id: string; name: string; sellPrice: string }> = {};

  for (const p of productDefs) {
    const created = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        reference: p.ref,
        name: p.name,
        category: p.cat,
        buyPrice: p.buy,
        sellPrice: p.sell,
        unit: p.unit,
        tva: '18',
        isActive: true,
      },
    });
    products[p.ref] = { id: created.id, name: created.name, sellPrice: p.sell };

    // Stock magasin Cocody
    const qtyCocody = p.ref.startsWith('CIM')
      ? 180
      : p.ref.startsWith('FER')
        ? 45
        : p.ref.startsWith('CAR')
          ? 60
          : p.ref.startsWith('ELE')
            ? 4
            : 25;
    await prisma.stockEntry.create({
      data: {
        tenantId: tenant.id,
        productId: created.id,
        storeId: storeCocody.id,
        quantity: qtyCocody,
        alertThreshold: p.alertMin,
      },
    });

    // Stock magasin Abobo (plus faible, dont certains en alerte)
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
  console.log(`✅ ${productDefs.length} produits créés avec stocks`);

  // ── 6. Clients ────────────────────────────────────────────────────────────
  const customerDefs = [
    { name: 'Koné Amadou', phone: '07 01 02 03 04', credit: '0' },
    { name: 'Traoré Mariam', phone: '05 10 20 30 40', credit: '175000' },
    { name: 'Diabaté Bafing', phone: '01 55 66 77 88', credit: '89500' },
    { name: 'Coulibaly Seydou', phone: '07 22 33 44 55', credit: '0' },
    { name: "N'Goran Yves", phone: '05 98 76 54 32', credit: '310000' },
    { name: 'Ouattara Fatoumata', phone: '01 11 22 33 44', credit: '0' },
    { name: 'Bamba Construction', phone: '27 22 55 66 77', credit: '520000' },
    { name: 'Sanogo Moussa', phone: '07 44 55 66 77', credit: '0' },
    { name: 'Gbané Patrick', phone: '01 23 45 67 89', credit: '48000' },
    { name: 'Entreprise BTP+', phone: '27 23 99 88 77', credit: '0' },
  ];

  const customers: { id: string; name: string }[] = [];
  for (const c of customerDefs) {
    const created = await prisma.customer.create({
      data: { tenantId: tenant.id, name: c.name, phone: c.phone, creditBalance: c.credit },
    });
    customers.push({ id: created.id, name: c.name });
  }
  console.log(`✅ ${customers.length} clients créés`);

  // ── 7. Fournisseurs ───────────────────────────────────────────────────────
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

  // ── 8. Commandes fournisseurs ─────────────────────────────────────────────

  // BC001 — réceptionnée (historique)
  const bc001 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      supplierId: suppliers[0].id,
      orderNumber: 'BC-2025-00001',
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: '2200000',
      expectedAt: daysAgo(14),
      receivedAt: daysAgo(10),
      createdAt: daysAgo(16),
      updatedAt: daysAgo(10),
      items: {
        create: [
          {
            productId: products['CIM-001'].id,
            productName: products['CIM-001'].name,
            quantityOrdered: 200,
            quantityReceived: 200,
            unitPrice: '4200',
            total: '840000',
          },
          {
            productId: products['CIM-002'].id,
            productName: products['CIM-002'].name,
            quantityOrdered: 100,
            quantityReceived: 100,
            unitPrice: '4800',
            total: '480000',
          },
          {
            productId: products['FER-001'].id,
            productName: products['FER-001'].name,
            quantityOrdered: 60,
            quantityReceived: 60,
            unitPrice: '11500',
            total: '690000',
          },
        ],
      },
    },
  });

  // BC002 — en attente (pour la démo de réception)
  const _bc002 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeCocody.id,
      supplierId: suppliers[0].id,
      orderNumber: 'BC-2025-00002',
      status: PurchaseOrderStatus.SENT,
      totalAmount: '1540000',
      expectedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
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
            productId: products['FER-002'].id,
            productName: products['FER-002'].name,
            quantityOrdered: 40,
            quantityReceived: 0,
            unitPrice: '8000',
            total: '320000',
          },
          {
            productId: products['TOL-001'].id,
            productName: products['TOL-001'].name,
            quantityOrdered: 50,
            quantityReceived: 0,
            unitPrice: '3200',
            total: '160000',
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

  // BC003 — SOFER, aciers, en attente Abobo
  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      storeId: storeAbobo.id,
      supplierId: suppliers[1].id,
      orderNumber: 'BC-2025-00003',
      status: PurchaseOrderStatus.SENT,
      totalAmount: '875000',
      expectedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      items: {
        create: [
          {
            productId: products['FER-001'].id,
            productName: products['FER-001'].name,
            quantityOrdered: 40,
            quantityReceived: 0,
            unitPrice: '11500',
            total: '460000',
          },
          {
            productId: products['FER-003'].id,
            productName: products['FER-003'].name,
            quantityOrdered: 25,
            quantityReceived: 0,
            unitPrice: '15000',
            total: '375000',
          },
        ],
      },
    },
  });

  console.log(`✅ 3 bons de commande créés (1 réceptionné, 2 en attente SENT)`);

  // ── 9. Ventes historiques ─────────────────────────────────────────────────

  type SaleInput = {
    store: typeof storeCocody;
    cashier: typeof cashier1;
    customer?: (typeof customers)[0];
    method: PaymentMethod;
    status: SaleStatus;
    amountPaid?: number;
    daysBack: number;
    receiptIdx: number;
    lines: { ref: string; qty: number; discount?: number }[];
  };

  const salesDefs: SaleInput[] = [
    // Hier
    {
      store: storeCocody,
      cashier: cashier1,
      method: PaymentMethod.CASH,
      status: SaleStatus.COMPLETED,
      daysBack: 1,
      receiptIdx: 1,
      lines: [
        { ref: 'CIM-001', qty: 10 },
        { ref: 'FER-001', qty: 3 },
      ],
    },
    {
      store: storeCocody,
      cashier: manager,
      customer: customers[1],
      method: PaymentMethod.ORANGE_MONEY,
      status: SaleStatus.COMPLETED,
      daysBack: 1,
      receiptIdx: 2,
      lines: [
        { ref: 'CAR-001', qty: 20 },
        { ref: 'CAR-002', qty: 10 },
      ],
    },
    {
      store: storeAbobo,
      cashier: cashier2,
      method: PaymentMethod.WAVE,
      status: SaleStatus.COMPLETED,
      daysBack: 1,
      receiptIdx: 3,
      lines: [
        { ref: 'CIM-002', qty: 15 },
        { ref: 'TOL-001', qty: 8 },
      ],
    },
    {
      store: storeCocody,
      cashier: cashier1,
      customer: customers[2],
      method: PaymentMethod.CREDIT,
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 50000,
      daysBack: 1,
      receiptIdx: 4,
      lines: [
        { ref: 'FER-001', qty: 5 },
        { ref: 'FER-002', qty: 4 },
      ],
    },
    // J-2
    {
      store: storeCocody,
      cashier: manager,
      method: PaymentMethod.CASH,
      status: SaleStatus.COMPLETED,
      daysBack: 2,
      receiptIdx: 5,
      lines: [
        { ref: 'PEI-001', qty: 3 },
        { ref: 'PEI-002', qty: 2 },
      ],
    },
    {
      store: storeCocody,
      cashier: cashier1,
      customer: customers[0],
      method: PaymentMethod.CASH,
      status: SaleStatus.COMPLETED,
      daysBack: 2,
      receiptIdx: 6,
      lines: [
        { ref: 'CIM-001', qty: 20, discount: 2000 },
        { ref: 'AUT-001', qty: 2 },
      ],
    },
    {
      store: storeAbobo,
      cashier: cashier2,
      method: PaymentMethod.MTN_MONEY,
      status: SaleStatus.COMPLETED,
      daysBack: 2,
      receiptIdx: 7,
      lines: [
        { ref: 'BOI-001', qty: 6 },
        { ref: 'BOI-002', qty: 2 },
      ],
    },
    // J-3
    {
      store: storeCocody,
      cashier: cashier1,
      customer: customers[4],
      method: PaymentMethod.CREDIT,
      status: SaleStatus.PENDING_CREDIT,
      amountPaid: 0,
      daysBack: 3,
      receiptIdx: 8,
      lines: [
        { ref: 'CAR-001', qty: 30 },
        { ref: 'CAR-002', qty: 20 },
        { ref: 'PLO-001', qty: 5 },
      ],
    },
    {
      store: storeCocody,
      cashier: manager,
      method: PaymentMethod.VIREMENT,
      status: SaleStatus.COMPLETED,
      daysBack: 3,
      receiptIdx: 9,
      lines: [{ ref: 'ELE-001', qty: 2 }],
    },
    {
      store: storeAbobo,
      cashier: cashier2,
      method: PaymentMethod.CASH,
      status: SaleStatus.COMPLETED,
      daysBack: 3,
      receiptIdx: 10,
      lines: [
        { ref: 'CIM-001', qty: 8 },
        { ref: 'TOL-002', qty: 4 },
      ],
    },
    // J-5
    {
      store: storeCocody,
      cashier: cashier1,
      customer: customers[6],
      method: PaymentMethod.VIREMENT,
      status: SaleStatus.COMPLETED,
      daysBack: 5,
      receiptIdx: 11,
      lines: [
        { ref: 'FER-001', qty: 20 },
        { ref: 'FER-002', qty: 15 },
        { ref: 'FER-003', qty: 5 },
      ],
    },
    {
      store: storeCocody,
      cashier: manager,
      method: PaymentMethod.ORANGE_MONEY,
      status: SaleStatus.COMPLETED,
      daysBack: 5,
      receiptIdx: 12,
      lines: [
        { ref: 'PEI-001', qty: 2, discount: 1000 },
        { ref: 'BOI-001', qty: 4 },
      ],
    },
    {
      store: storeAbobo,
      cashier: cashier2,
      method: PaymentMethod.WAVE,
      status: SaleStatus.COMPLETED,
      daysBack: 5,
      receiptIdx: 13,
      lines: [
        { ref: 'CIM-002', qty: 10 },
        { ref: 'AUT-002', qty: 3 },
      ],
    },
    // J-7
    {
      store: storeCocody,
      cashier: cashier1,
      method: PaymentMethod.CASH,
      status: SaleStatus.COMPLETED,
      daysBack: 7,
      receiptIdx: 14,
      lines: [
        { ref: 'PLO-001', qty: 3 },
        { ref: 'PLO-002', qty: 10 },
      ],
    },
    {
      store: storeCocody,
      cashier: manager,
      customer: customers[9],
      method: PaymentMethod.VIREMENT,
      status: SaleStatus.COMPLETED,
      daysBack: 7,
      receiptIdx: 15,
      lines: [
        { ref: 'CAR-001', qty: 50 },
        { ref: 'CAR-002', qty: 30 },
        { ref: 'AUT-001', qty: 5 },
      ],
    },
  ];

  for (const s of salesDefs) {
    const storeCode = s.store.id === storeCocody.id ? 'COC' : 'ABO';
    let subtotal = 0;
    const lines = s.lines.map((l) => {
      const p = products[l.ref];
      const unitPrice = parseFloat(p.sellPrice);
      const disc = l.discount ?? 0;
      const total = unitPrice * l.qty - disc;
      subtotal += total;
      return {
        productId: p.id,
        productName: p.name,
        quantity: l.qty,
        unitPrice,
        discount: disc,
        total,
      };
    });

    const totalAmount = subtotal;
    const amountPaid = s.status === SaleStatus.COMPLETED ? totalAmount : (s.amountPaid ?? 0);
    const amountDue = totalAmount - amountPaid;

    const saleDate = daysAgo(s.daysBack);

    await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        storeId: s.store.id,
        cashierId: s.cashier.id,
        customerId: s.customer?.id,
        receiptNumber: receipt(s.receiptIdx, storeCode),
        status: s.status,
        paymentMethod: s.method,
        subtotal: subtotal.toString(),
        globalDiscount: '0',
        totalAmount: totalAmount.toString(),
        amountPaid: amountPaid.toString(),
        amountDue: amountDue.toString(),
        createdAt: saleDate,
        updatedAt: saleDate,
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
  }
  console.log(`✅ ${salesDefs.length} ventes créées sur 7 jours`);

  // ── 10. Paiements clients (remboursements partiels) ───────────────────────
  await prisma.customerPayment.createMany({
    data: [
      {
        tenantId: tenant.id,
        customerId: customers[1].id,
        amount: '50000',
        paymentMethod: 'ORANGE_MONEY',
        createdAt: daysAgo(2),
      },
      {
        tenantId: tenant.id,
        customerId: customers[2].id,
        amount: '30000',
        paymentMethod: 'CASH',
        createdAt: daysAgo(4),
      },
      {
        tenantId: tenant.id,
        customerId: customers[4].id,
        amount: '100000',
        paymentMethod: 'WAVE',
        createdAt: daysAgo(1),
      },
      {
        tenantId: tenant.id,
        customerId: customers[6].id,
        amount: '200000',
        paymentMethod: 'VIREMENT',
        createdAt: daysAgo(3),
      },
    ],
  });
  console.log('✅ 4 paiements clients enregistrés');

  // ── 11. Mouvements de stock d'entrée (réception BC001) ────────────────────
  await prisma.stockMovement.createMany({
    data: [
      {
        tenantId: tenant.id,
        productId: products['CIM-001'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '200',
        reason: 'Réception BC-2025-00001',
        referenceId: bc001.id,
        createdById: manager.id,
        createdAt: daysAgo(10),
      },
      {
        tenantId: tenant.id,
        productId: products['CIM-002'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '100',
        reason: 'Réception BC-2025-00001',
        referenceId: bc001.id,
        createdById: manager.id,
        createdAt: daysAgo(10),
      },
      {
        tenantId: tenant.id,
        productId: products['FER-001'].id,
        storeId: storeCocody.id,
        type: 'IN',
        quantity: '60',
        reason: 'Réception BC-2025-00001',
        referenceId: bc001.id,
        createdById: manager.id,
        createdAt: daysAgo(10),
      },
    ],
  });
  console.log('✅ Mouvements de stock créés');

  // ─── Résumé final ──────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           🎉  SEEDING TERMINÉ — COMPTES DE CONNEXION            ║
╠══════════════════════════════════════════════════════════════════╣
║  Super Admin   │ admin@materiaux.com       │ Admin1234!         ║
║  Propriétaire  │ proprietaire@demo.com     │ Demo1234!          ║
║  Gérant        │ manager@demo.com          │ Demo1234!          ║
║  Caissier 1    │ caissier@demo.com         │ Demo1234!          ║
║  Caissier 2    │ caissier2@demo.com        │ Demo1234!          ║
╠══════════════════════════════════════════════════════════════════╣
║  Web    → http://localhost:5173                                  ║
║  Admin  → http://localhost:3002                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
