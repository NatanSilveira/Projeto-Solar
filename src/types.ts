export type Role = 'promoter' | 'supervisor';
export type UserStatus = 'active' | 'vacation' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for security
  role: Role;
  status: UserStatus;
  supervisorId?: string;
  storeId?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
}

export type RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface ExpirationRecord {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  promoterId: string;
  expirationDate: string; // YYYY-MM-DD
  quantity: number;
  dailyGiro: number;
  riskLevel: RiskLevel;
  recordedAt: string;
}

export type QuestionType = 'text' | 'number' | 'select' | 'photo' | 'boolean';

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // Para tipos 'select'
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  questions: FormQuestion[];
  targetPromoterIds: string[] | null; // null means "All"
  responsesCount: number;
  lastUpdated: string;
  createdAt: string;
  supervisorId?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  promoterId: string;
  storeId: string;
  storeName: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  supervisorId?: string;
}

export interface MaterialRequest {
  id: string;
  promoterId: string;
  type: string;
  store: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  rejectionReason?: string;
}
