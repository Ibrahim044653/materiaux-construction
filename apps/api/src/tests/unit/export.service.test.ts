// jest.mock() calls MUST be at the top — Jest hoists them before imports
jest.mock('../../config/prisma', () => ({
  prisma: require('../helpers/prismaMock').prismaMock,
}));

import { prismaMock } from '../helpers/prismaMock';
import { Prisma } from '@prisma/client';
import { ExportService } from '../../services/export.service';

const TENANT_ID = 'tenant-abc';

const mockSale = {
  id: 'sale-1',
  receiptNumber: 'REC-20260925-00001',
  createdAt: new Date('2026-09-25T10:00:00Z'),
  paymentMethod: 'CASH',
  status: 'COMPLETED',
  subtotal: new Prisma.Decimal('25000'),
  globalDiscount: new Prisma.Decimal('0'),
  totalAmount: new Prisma.Decimal('25000'),
  amountPaid: new Prisma.Decimal('25000'),
  amountDue: new Prisma.Decimal('0'),
  cashier: { name: 'Ali Koné' },
  customer: { name: 'Ibrahim Coulibaly', phone: '0700000000' },
  store: { name: 'Magasin Cocody' },
  items: [
    {
      productName: 'Ciment CPA325',
      quantity: new Prisma.Decimal(5),
      unitPrice: new Prisma.Decimal(5000),
      total: new Prisma.Decimal(25000),
    },
  ],
};

const mockStockEntry = {
  product: {
    name: 'Ciment CPA325',
    reference: 'CIM-001',
    category: 'CIMENT',
    buyPrice: new Prisma.Decimal(4200),
    sellPrice: new Prisma.Decimal(5000),
    unit: 'sac',
  },
  store: { name: 'Magasin Cocody' },
  quantity: new Prisma.Decimal(48),
  alertThreshold: new Prisma.Decimal(5),
};

const mockCustomer = {
  id: 'cust-1',
  name: 'Ibrahim Coulibaly',
  phone: '0700000000',
  email: null,
  address: 'Cocody, Abidjan',
  creditBalance: new Prisma.Decimal('15000'),
  sales: [{ createdAt: new Date('2026-09-24'), totalAmount: new Prisma.Decimal('40000') }],
  _count: { sales: 3 },
};

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  describe('exportSales()', () => {
    it('retourne un Buffer non vide', async () => {
      prismaMock.sale.findMany.mockResolvedValue([mockSale]);
      const buffer = await service.exportSales(TENANT_ID, {});
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('génère un fichier xlsx valide (magic bytes PK\\x03\\x04)', async () => {
      prismaMock.sale.findMany.mockResolvedValue([mockSale]);
      const buffer = await service.exportSales(TENANT_ID, {});
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });

    it('fonctionne avec une liste de ventes vide', async () => {
      prismaMock.sale.findMany.mockResolvedValue([]);
      const buffer = await service.exportSales(TENANT_ID, {});
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('exportStock()', () => {
    it('retourne un Buffer valide pour les entrées de stock', async () => {
      prismaMock.stockEntry.findMany.mockResolvedValue([mockStockEntry]);
      const buffer = await service.exportStock(TENANT_ID, {});
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(0x50); // PK magic bytes
      expect(buffer[1]).toBe(0x4b);
    });
  });

  describe('exportCustomers()', () => {
    it('retourne un Buffer valide pour les clients', async () => {
      prismaMock.customer.findMany.mockResolvedValue([mockCustomer]);
      const buffer = await service.exportCustomers(TENANT_ID);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer[0]).toBe(0x50);
    });
  });
});
