export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStoreRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}
