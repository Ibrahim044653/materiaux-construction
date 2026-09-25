import { Role } from './auth';

export interface User {
  id: string;
  tenantId: string | null;
  storeId: string | null;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  role: Role;
  password: string;
  storeId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  role?: Role;
  storeId?: string;
  isActive?: boolean;
}
