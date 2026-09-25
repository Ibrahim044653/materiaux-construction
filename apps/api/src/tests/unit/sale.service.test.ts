// jest.mock() calls MUST be at the top — Jest hoists them before imports
jest.mock('../../config/prisma', () => ({
  prisma: require('../helpers/prismaMock').prismaMock,
}));
jest.mock('../../services/push.service', () => ({
  pushService: { sendStockAlert: jest.fn() },
}));

import { prismaMock } from '../helpers/prismaMock';
import { Prisma } from '@prisma/client';
import { SaleService } from '../../services/sale.service';

const TENANT_ID = 'tenant-abc';
const STORE_ID = 'store-123';
const USER_ID = 'user-456';

const mockProduct = {
  id: 'prod-1',
  name: 'Ciment CPA325',
  tenantId: TENANT_ID,
  isActive: true,
};

const mockStockEntry = {
  productId: 'prod-1',
  storeId: STORE_ID,
  quantity: new Prisma.Decimal(50),
  alertThreshold: new Prisma.Decimal(5),
};

const baseInput = {
  storeId: STORE_ID,
  paymentMethod: 'CASH',
  globalDiscount: '0',
  amountPaid: '11000',
  items: [{ productId: 'prod-1', quantity: 2, unitPrice: '5500', discount: '0' }],
};

const mockCreatedSale = {
  id: 'sale-1',
  receiptNumber: 'REC-20260925-00001',
  subtotal: new Prisma.Decimal('11000'),
  globalDiscount: new Prisma.Decimal('0'),
  totalAmount: new Prisma.Decimal('11000'),
  amountPaid: new Prisma.Decimal('11000'),
  amountDue: new Prisma.Decimal('0'),
  status: 'COMPLETED',
  paymentMethod: 'CASH',
  storeId: STORE_ID,
  items: [],
  cashier: { name: 'Caissier' },
  customer: null,
  store: { name: 'Magasin Principal' },
};

describe('SaleService', () => {
  let service: SaleService;

  beforeEach(() => {
    service = new SaleService();
  });

  describe('create() — calcul des montants', () => {
    beforeEach(() => {
      prismaMock.product.findFirst.mockResolvedValue(mockProduct);
      prismaMock.stockEntry.findUnique.mockResolvedValue(mockStockEntry);
      prismaMock.stockEntry.update.mockResolvedValue(mockStockEntry);
      prismaMock.stockMovement.create.mockResolvedValue({});
      prismaMock.sale.count.mockResolvedValue(0);

      prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) => {
        const txMock = {
          ...prismaMock,
          sale: { ...prismaMock.sale, create: jest.fn().mockResolvedValue(mockCreatedSale) },
        } as unknown as typeof prismaMock;
        return fn(txMock);
      });
    });

    it('calcule correctement le sous-total (2 × 5 500 = 11 000 FCFA)', async () => {
      const sale = await service.create(TENANT_ID, USER_ID, baseInput);
      expect(sale.subtotal.toString()).toBe('11000');
    });

    it('totalAmount = subtotal - globalDiscount', async () => {
      const sale = await service.create(TENANT_ID, USER_ID, baseInput);
      expect(sale.totalAmount.toString()).toBe('11000');
    });

    it('statut COMPLETED si amountPaid = totalAmount', async () => {
      const sale = await service.create(TENANT_ID, USER_ID, baseInput);
      expect(sale.status).toBe('COMPLETED');
    });

    it('lève une erreur si amountPaid > totalAmount', async () => {
      const input = { ...baseInput, amountPaid: '15000' };
      await expect(service.create(TENANT_ID, USER_ID, input)).rejects.toMatchObject({
        message: expect.stringContaining('dépasse'),
      });
    });

    it("lève une erreur si paiement incomplet sans mode 'CREDIT'", async () => {
      const input = { ...baseInput, amountPaid: '5000' };
      await expect(service.create(TENANT_ID, USER_ID, input)).rejects.toMatchObject({
        message: expect.stringContaining('Crédit'),
      });
    });
  });

  describe('create() — validation du stock', () => {
    it('lève une erreur si stock insuffisant', async () => {
      prismaMock.product.findFirst.mockResolvedValue(mockProduct);
      prismaMock.stockEntry.findUnique.mockResolvedValue({
        ...mockStockEntry,
        quantity: new Prisma.Decimal(1), // only 1 in stock, needs 2
      });
      prismaMock.sale.count.mockResolvedValue(0);

      prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) => {
        const txMock = {
          ...prismaMock,
          // sale.create must return an object with id so sale.id is accessible
          sale: { ...prismaMock.sale, create: jest.fn().mockResolvedValue({ id: 'sale-tmp' }) },
          // product.findUnique used by deductSaleStock for the error message
          product: { ...prismaMock.product, findUnique: jest.fn().mockResolvedValue(mockProduct) },
          stockEntry: {
            ...prismaMock.stockEntry,
            findUnique: jest.fn().mockResolvedValue({ quantity: new Prisma.Decimal(1) }),
            update: jest.fn(),
          },
          stockMovement: { create: jest.fn() },
        } as unknown as typeof prismaMock;
        return fn(txMock);
      });

      await expect(service.create(TENANT_ID, USER_ID, baseInput)).rejects.toMatchObject({
        message: expect.stringContaining('insuffisant'),
      });
    });

    it("lève une erreur si le produit n'existe pas", async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);
      prismaMock.sale.count.mockResolvedValue(0);

      await expect(service.create(TENANT_ID, USER_ID, baseInput)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('Decimal arithmetic', () => {
    it('les montants FCFA utilisent Prisma.Decimal, pas Float', () => {
      const price = new Prisma.Decimal('5500');
      const qty = new Prisma.Decimal(2);
      const disc = new Prisma.Decimal('0');
      const total = price.minus(disc).times(qty);
      expect(total.toString()).toBe('11000');
    });

    it('Decimal évite les erreurs de précision float', () => {
      const a = new Prisma.Decimal('0.1');
      const b = new Prisma.Decimal('0.2');
      expect(a.plus(b).toString()).toBe('0.3');
    });
  });
});
