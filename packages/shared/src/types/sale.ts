export type PaymentMethod =
  | 'CASH'
  | 'ORANGE_MONEY'
  | 'WAVE'
  | 'MTN_MONEY'
  | 'VIREMENT'
  | 'CREDIT';

export type SaleStatus = 'COMPLETED' | 'PENDING_CREDIT' | 'CANCELLED' | 'RETURNED';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discount: string;     // Remise sur cet article en FCFA
  total: string;        // (unitPrice - discount) * quantity
}

export interface Sale {
  id: string;
  tenantId: string;
  storeId: string;
  cashierId: string;
  customerId?: string | null;
  receiptNumber: string;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  globalDiscount: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;     // 0 si payé, > 0 si crédit client
  notes?: string | null;
  items: SaleItem[];
  createdAt: string;
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice: string;
  discount?: string;
}

export interface CreateSaleRequest {
  customerId?: string;
  paymentMethod: PaymentMethod;
  globalDiscount?: string;
  amountPaid: string;
  notes?: string;
  items: CreateSaleItemRequest[];
}
