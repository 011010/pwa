/**
 * Environment configuration for the ITAM PWA
 *
 * This file centralizes all environment-specific settings.
 * In production, these values should come from environment variables.
 */

export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'https://rais.ioutstandings.com/api/v1',
  apiTimeout: 30000, // 30 seconds

  // Authentication
  tokenKey: 'itam_auth_token',
  userKey: 'itam_user',
  tokenExpiryKey: 'itam_token_expiry',
  tokenType: 'Bearer',

  // Offline Sync
  syncQueueKey: 'itam_sync_queue',
  syncInterval: 60000, // 1 minute
  maxRetries: 3,

  // Scanner Settings
  scannerTimeout: 30000, // 30 seconds
  scannerFormats: ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13'],

  // Image Upload
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],

  // PWA Settings
  appName: 'ITAM PWA',
  appShortName: 'ITAM',
  appDescription: 'IT Asset Management Progressive Web App',

  // Feature Flags
  features: {
    offlineMode: true,
    signatureCapture: true,
    photoUpload: true,
    barcodeScanner: true,
  },
} as const;

// Development mode check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// API endpoints builder (Filament API v1)
export const endpoints = {
  auth: {
    login: '/login',
    logout: '/logout',
    logoutAll: '/logout-all',
    user: '/user',
  },
  health: '/health',
  assets: {
    list: '/assets',
    detail: (id: number) => `/assets/${id}`,
    create: '/assets',
    update: (id: number) => `/assets/${id}`,
    delete: (id: number) => `/assets/${id}`,
    history: (id: number) => `/assets/${id}/history`,
    photos: (id: number) => `/assets/${id}/photos`,
    photoDetail: (id: number, photoId: number) => `/assets/${id}/photos/${photoId}`,
    signatures: (id: number) => `/assets/${id}/signatures`,
    signatureDetail: (id: number, signatureId: number) => `/assets/${id}/signatures/${signatureId}`,
  },
  equipmentAssignments: {
    list: '/equipment-assignments',
    detail: (id: number) => `/equipment-assignments/${id}`,
    stats: '/equipment-assignments-stats',
    photos: (id: number) => `/equipment-assignments/${id}/photos`,
    photoDetail: (id: number, photoId: number) => `/equipment-assignments/${id}/photos/${photoId}`,
    signatures: (id: number) => `/equipment-assignments/${id}/signatures`,
    signatureDetail: (id: number, signatureId: number) => `/equipment-assignments/${id}/signatures/${signatureId}`,
  },
  inventory: {
    list: '/inventory',
    detail: (id: number) => `/inventory/${id}`,
    create: '/inventory',
    update: (id: number) => `/inventory/${id}`,
    delete: (id: number) => `/inventory/${id}`,
  },
  suppliers: {
    list: '/suppliers',
    detail: (id: number) => `/suppliers/${id}`,
    create: '/suppliers',
    update: (id: number) => `/suppliers/${id}`,
    delete: (id: number) => `/suppliers/${id}`,
  },
  categories: {
    list: '/categories',
    detail: (id: number) => `/categories/${id}`,
    create: '/categories',
    update: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`,
  },
  equipmentOutputs: {
    list: '/equipment-outputs',
    detail: (id: number) => `/equipment-outputs/${id}`,
    create: '/equipment-outputs',
    update: (id: number) => `/equipment-outputs/${id}`,
    delete: (id: number) => `/equipment-outputs/${id}`,
    stats: '/equipment-outputs/stats',
    activeByEmployee: (employeeId: number) => `/equipment-outputs/employee/${employeeId}/active`,
  },
} as const;
