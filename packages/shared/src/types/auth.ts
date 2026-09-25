export type Role =
  | 'SUPER_ADMIN'   // Prestataire SaaS
  | 'OWNER'         // Propriétaire des magasins
  | 'MANAGER'       // Gérant d'un magasin
  | 'CASHIER'       // Caissier
  | 'ACCOUNTANT';   // Comptable (lecture seule)

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string | null;
  storeId: string | null;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
