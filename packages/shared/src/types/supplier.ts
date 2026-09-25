export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIAL'
  | 'RECEIVED'
  | 'CANCELLED';

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactName?: string | null;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: string;
  total: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  storeId: string;
  supplierId: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  totalAmount: string;
  notes?: string | null;
  expectedAt?: string | null;
  receivedAt?: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactName?: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  storeId: string;
  notes?: string;
  expectedAt?: string;
  items: Array<{
    productId: string;
    quantityOrdered: number;
    unitPrice: string;
  }>;
}
