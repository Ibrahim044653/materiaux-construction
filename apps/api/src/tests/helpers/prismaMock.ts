// Shared Prisma mock object.
// Each test file must register it via:
//   jest.mock('../../config/prisma', () => ({ prisma: require('../helpers/prismaMock').prismaMock }));
// placed at the top (before imports) so Jest hoisting applies.
export const prismaMock = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  sale: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  saleItem: {
    findMany: jest.fn(),
  },
  stockEntry: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  stockMovement: {
    create: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  tenant: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};

// Default $transaction implementation: execute callback synchronously with mock
prismaMock.$transaction.mockImplementation((fn: (tx: typeof prismaMock) => unknown) =>
  fn(prismaMock)
);
