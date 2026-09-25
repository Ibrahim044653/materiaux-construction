export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditBalance: string;   // Montant dû en FCFA (dette client)
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CustomerPaymentRequest {
  amount: string;
  paymentMethod: string;
  notes?: string;
}
