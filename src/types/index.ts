/**
 * Core type definitions for the ITAM PWA
 */

// User and Authentication Types (Filament API Format)
export interface User {
  id: number;
  name: string;
  lastnames?: string; // Last names, if provided by API
  full_name?: string; // Full name (name + lastnames), if provided by API
  email: string;
  roles: string[];
  permissions: string[];
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  device_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
  };
}

// Asset Types
export interface Asset {
  id: number;
  code: string;
  name: string;
  model: string;
  serial_number: string;
  status: AssetStatus;
  location: string;
  category: string;
  assigned_to?: User;
  purchase_date?: string;
  warranty_end?: string;
  description?: string;
  comments?: string;
  photos?: string[];
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export type AssetStatus =
  | 'available'
  | 'in_use'
  | 'maintenance'
  | 'retired'
  | 'lost';

export interface AssetHistory {
  id: number;
  asset_id: number;
  action: string;
  user: User;
  description: string;
  created_at: string;
}

// Update Operations
export interface AssetUpdateData {
  status?: AssetStatus;
  location?: string;
  comments?: string;
  assigned_to_id?: number;
}

export interface SignatureData {
  signature: string; // base64 encoded image (data URL format)
  signed_by: string;
  signed_at: string;
  action: string; // received, delivered, transferred, returned, maintenance, inspection
  notes?: string; // optional notes
}

// Offline Sync Types
export interface OfflineOperation {
  id: string;
  type: 'update' | 'signature' | 'photo';
  assetId: number;
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface SyncResult {
  success: boolean;
  operationId: string;
  error?: string;
}

// API Response Types (Filament API Format)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiError {
  success?: boolean;
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Equipment Assignment Types (from legacy system)
export interface EquipmentAssignment {
  id: number;
  equipment: string;
  serial_number: string;
  name: string; // This is the system name (e.g., DESKTOP-XXX), not employee name
  model: string;
  received_date: string;
  comments: string;
  delivery_date?: string | null;
  metadata: {
    employee_name: string; // Employee's actual name
    equipment_id: number;
    employee_id: number;
    delivery_date: string | null;
    delivery_comments: string;
    equipment_status: 'ACTIV' | 'MANTC' | 'BAJAS' | 'LIBRE' | number;
    equipment_type: string | number;
    equipment_brand: string;
    employee_department: string;
    employee_email: string;
    created_at: string;
    updated_at: string;
  };
}

// Equipment Output Types (Home Office Management)
export interface EquipmentOutputEquipment {
  id: number;
  serial_number: string;
  name: string;
  model: string;
  brand: string;
  type: string;
  type_description: string;
  status: string;
  description?: string;
}

export interface EquipmentOutputEmployee {
  id: number;
  name: string;
  lastnames: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
}

export interface EquipmentOutput {
  id: number;
  equipment_inventory_id: number;
  employee_id: number;
  employee_name: string;
  output_date: string;
  output_comments: string;
  output_photo: string | null; // Base64 encoded image
  input_date: string | null;
  input_comments: string | null;
  input_photo: string | null; // Base64 encoded image
  input_signature: string | null; // Base64 encoded signature
  is_active: boolean;
  equipment: EquipmentOutputEquipment;
  employee: EquipmentOutputEmployee;
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

export interface CreateEquipmentOutputData {
  equipment_inventory_id: number;
  employee_id: number;
  employee_email: string;
  output_comments: string;
  output_date: string;
  output_photo?: string; // Base64 encoded image (optional)
}

export interface UpdateEquipmentOutputData {
  input_comments: string;
  input_date: string;
  input_photo?: string; // Base64 encoded image (optional)
  input_signature?: string; // Base64 encoded signature (optional)
}

export interface EquipmentOutputStats {
  total_outputs: number;
  active_outputs: number;
  returned_outputs: number;
}

// Component Props Types
export interface ScannerProps {
  onScanSuccess: (code: string) => void;
  onScanError?: (error: Error) => void;
}

export interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear?: () => void;
}

export interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

// Navigation Types
export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}
