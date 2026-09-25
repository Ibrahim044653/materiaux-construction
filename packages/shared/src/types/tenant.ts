export type TenantPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  email: string;
  phone?: string;
  plan: TenantPlan;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface UpdateTenantRequest {
  name?: string;
  email?: string;
  phone?: string;
  plan?: TenantPlan;
}
