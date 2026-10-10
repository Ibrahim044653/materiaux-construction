export interface ProductCategoryRef {
  id: string;
  name: string;
  color?: string | null;
}

export interface Product {
  id: string;
  tenantId: string;
  reference: string;
  name: string;
  categoryId?: string | null;
  category?: ProductCategoryRef | null;
  description?: string | null;
  photo?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
  buyPrice: string; // Decimal(12,2) → string pour éviter les problèmes de précision
  sellPrice: string;
  tva: number; // Pourcentage (ex: 18 pour 18%)
  unit: string; // ex: "sac", "barre", "m²", "litre"
  isActive: boolean;
  createdAt: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  storeId: string;
  tenantId: string;
  quantity: number;
  alertThreshold: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  storeId: string;
  tenantId: string;
  type: 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string | null;
  referenceId?: string | null; // ID de la vente, commande fournisseur, etc.
  createdAt: string;
  createdBy: string;
}

export interface CreateProductRequest {
  reference: string;
  name: string;
  categoryId?: string | null;
  description?: string;
  buyPrice: string;
  sellPrice: string;
  tva?: number;
  unit: string;
  alertThreshold?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean;
}
