// Catégories produit libres, créées par chaque boutique.
// Aucune liste imposée : l'application sert tout type de commerce.
export interface Category {
  id: string;
  tenantId: string;
  name: string;
  color?: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  position?: number;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  isActive?: boolean;
}
