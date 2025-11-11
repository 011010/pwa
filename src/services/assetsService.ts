/**
 * Assets Service
 *
 * Handles all asset-related API operations including fetching, updating,
 * scanning, and managing asset photos and signatures.
 */

import { api } from './api';
import { endpoints, config } from '../config/environment';
import type {
  Asset,
  AssetUpdateData,
  AssetHistory,
  SignatureData,
  ApiResponse,
  EquipmentAssignment,
} from '../types';

/**
 * Photo response from server
 */
export interface PhotoResponse {
  id: number;
  asset_id: number;
  url: string;
  uploaded_at: string;
}

/**
 * Signature response from server
 */
export interface SignatureResponse {
  id: number;
  asset_id: number;
  url: string;
  signed_by: string;
  signed_at: string;
  action: string;
}

/**
 * Fetch list of all assets
 */
export const getAssets = async (params?: {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<{ data: Asset[]; total: number; per_page: number; current_page: number }> => {
  try {
    const response = await api.get<{
      data: Asset[];
      total: number;
      per_page: number;
      current_page: number;
    }>(endpoints.assets.list, params);

    return response;
  } catch (error) {
    console.error('[Assets Service] Failed to fetch assets:', error);
    throw error;
  }
};

/**
 * Fetch asset by ID
 */
export const getAssetById = async (id: number): Promise<Asset> => {
  try {
    const asset = await api.get<Asset>(endpoints.assets.detail(id));
    return asset;
  } catch (error) {
    console.error(`[Assets Service] Failed to fetch asset ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch asset by scanning QR/barcode
 * Searches equipment assignments by serial number
 */
export const getAssetByCode = async (code: string): Promise<Asset> => {
  try {
    // Use search parameter to find equipment by serial number
    const response = await api.get<ApiResponse<EquipmentAssignment[]>>(
      endpoints.equipmentAssignments.list,
      { search: code, per_page: 100 }
    );

    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error(`Equipment with code "${code}" not found`);
    }

    // Find exact match by serial number
    const assignment = response.data.find(
      (item) => item.serial_number.toLowerCase() === code.toLowerCase()
    );

    if (!assignment) {
      throw new Error(`Equipment with serial number "${code}" not found`);
    }

    // Check if equipment is assigned to an employee
    const hasAssignment = assignment.metadata?.employee_name &&
                         assignment.metadata?.employee_name.trim() !== '' &&
                         assignment.metadata?.employee_name !== 'N/A';

    // Convert EquipmentAssignment to Asset format
    const asset: Asset = {
      id: assignment.id,
      code: assignment.serial_number,
      name: assignment.equipment,
      model: assignment.model,
      serial_number: assignment.serial_number,
      status: hasAssignment ? 'in_use' : 'available',
      location: assignment.metadata?.employee_department || 'N/A',
      category: assignment.metadata?.equipment_type ? String(assignment.metadata.equipment_type) : 'Unknown',
      assigned_to: hasAssignment ? {
        id: assignment.metadata?.employee_id || 0,
        name: assignment.metadata?.employee_name || '', // Use employee_name from metadata
        email: assignment.metadata?.employee_email || '',
        roles: [],
        permissions: [],
      } : undefined,
      description: assignment.comments,
      comments: assignment.comments,
      created_at: assignment.metadata?.created_at || new Date().toISOString(),
      updated_at: assignment.metadata?.updated_at || new Date().toISOString(),
    };

    return asset;
  } catch (error) {
    console.error(`[Assets Service] Failed to scan asset code ${code}:`, error);
    throw error;
  }
};

/**
 * Update asset information
 */
export const updateAsset = async (
  id: number,
  data: AssetUpdateData
): Promise<Asset> => {
  try {
    const updatedAsset = await api.put<Asset>(endpoints.assets.update(id), data);
    return updatedAsset;
  } catch (error) {
    console.error(`[Assets Service] Failed to update asset ${id}:`, error);
    throw error;
  }
};

/**
 * Get asset history/activity log
 */
export const getAssetHistory = async (id: number): Promise<AssetHistory[]> => {
  try {
    const history = await api.get<AssetHistory[]>(endpoints.assets.history(id));
    return history;
  } catch (error) {
    console.error(`[Assets Service] Failed to fetch asset history ${id}:`, error);
    throw error;
  }
};

/**
 * Upload asset photo
 */
export const uploadAssetPhoto = async (
  assetId: number,
  photo: File
): Promise<{ url: string }> => {
  try {
    // Validate file size
    if (photo.size > config.maxImageSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.maxImageSize / 1024 / 1024}MB`
      );
    }

    // Validate file type
    const allowedTypes = config.allowedImageTypes as readonly string[];
    if (!allowedTypes.includes(photo.type)) {
      throw new Error(
        `File type ${photo.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    const response = await api.upload<{ url: string }>(endpoints.uploads.photo, photo, {
      asset_id: assetId,
    });

    return response;
  } catch (error) {
    console.error(`[Assets Service] Failed to upload photo for asset ${assetId}:`, error);
    throw error;
  }
};

/**
 * Upload asset signature
 */
export const uploadAssetSignature = async (
  assetId: number,
  signatureData: SignatureData
): Promise<{ url: string }> => {
  try {
    // Convert base64 signature to blob
    const base64Data = signatureData.signature.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);

    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'image/png' });
    const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });

    const response = await api.upload<{ url: string }>(endpoints.uploads.signature, file, {
      asset_id: assetId,
      signed_by: signatureData.signed_by,
      signed_at: signatureData.signed_at,
      action: signatureData.action,
    });

    return response;
  } catch (error) {
    console.error(
      `[Assets Service] Failed to upload signature for asset ${assetId}:`,
      error
    );
    throw error;
  }
};

/**
 * Fetch photos for an asset from server
 */
export const getAssetPhotos = async (assetId: number): Promise<PhotoResponse[]> => {
  try {
    const response = await api.get<ApiResponse<PhotoResponse[]>>(
      endpoints.assets.photos(assetId)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch photos');
    }

    return response.data || [];
  } catch (error) {
    console.error(`[Assets Service] Failed to fetch photos for asset ${assetId}:`, error);
    throw error;
  }
};

/**
 * Delete photo from server
 */
export const deleteAssetPhoto = async (assetId: number, photoId: number): Promise<void> => {
  try {
    await api.delete(endpoints.assets.photoDetail(assetId, photoId));
    console.log(`[Assets Service] Photo ${photoId} deleted from server`);
  } catch (error) {
    console.error(`[Assets Service] Failed to delete photo ${photoId}:`, error);
    throw error;
  }
};

/**
 * Fetch signatures for an asset from server
 */
export const getAssetSignatures = async (assetId: number): Promise<SignatureResponse[]> => {
  try {
    const response = await api.get<ApiResponse<SignatureResponse[]>>(
      endpoints.assets.signatures(assetId)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch signatures');
    }

    return response.data || [];
  } catch (error) {
    console.error(`[Assets Service] Failed to fetch signatures for asset ${assetId}:`, error);
    throw error;
  }
};

/**
 * Delete signature from server
 */
export const deleteAssetSignature = async (assetId: number, signatureId: number): Promise<void> => {
  try {
    await api.delete(endpoints.assets.signatureDetail(assetId, signatureId));
    console.log(`[Assets Service] Signature ${signatureId} deleted from server`);
  } catch (error) {
    console.error(`[Assets Service] Failed to delete signature ${signatureId}:`, error);
    throw error;
  }
};

/**
 * Search assets by text query
 */
export const searchAssets = async (query: string): Promise<Asset[]> => {
  try {
    const response = await getAssets({ search: query });
    return response.data;
  } catch (error) {
    console.error('[Assets Service] Failed to search assets:', error);
    throw error;
  }
};

export const assetsService = {
  getAssets,
  getAssetById,
  getAssetByCode,
  updateAsset,
  getAssetHistory,
  uploadAssetPhoto,
  uploadAssetSignature,
  getAssetPhotos,
  deleteAssetPhoto,
  getAssetSignatures,
  deleteAssetSignature,
  searchAssets,
};

export default assetsService;
