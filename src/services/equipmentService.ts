/**
 * Equipment Assignments Service
 *
 * Handles equipment assignment operations from the legacy system API.
 * This service interacts with the equipment-assignments endpoint.
 */

import { api } from './api';
import { endpoints, config } from '../config/environment';
import type { EquipmentAssignment, ApiResponse } from '../types';

/**
 * Photo response from server
 */
export interface PhotoResponse {
  id: number;
  equipment_assignment_id: number;
  url: string;
  uploaded_at: string;
}

/**
 * Signature response from server
 */
export interface SignatureResponse {
  id: number;
  equipment_assignment_id: number;
  url: string;
  signed_by: string;
  signed_at: string;
  action: string;
}

/**
 * Params for fetching equipment assignments
 */
export interface EquipmentAssignmentsParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  equipment_id?: number;
  date_from?: string; // Format: Y-m-d (e.g., 2025-01-01)
  date_to?: string;
  status?: 'ACTIV' | 'MANTC' | 'BAJAS' | 'LIBRE';
  type?: string;
  search?: string;
  include_delivered?: boolean;
}

/**
 * Stats response interface
 */
export interface AssignmentStats {
  total_assignments: number;
  active_assignments: number;
  returned_assignments: number;
}

/**
 * Fetch equipment assignments list
 */
export const getEquipmentAssignments = async (
  params?: EquipmentAssignmentsParams
): Promise<ApiResponse<EquipmentAssignment[]>> => {
  try {
    const response = await api.get<ApiResponse<EquipmentAssignment[]>>(
      endpoints.equipmentAssignments.list,
      params
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch equipment assignments');
    }

    return response;
  } catch (error) {
    console.error('[Equipment Service] Failed to fetch assignments:', error);
    throw error;
  }
};

/**
 * Fetch single equipment assignment by ID
 */
export const getEquipmentAssignmentById = async (
  id: number
): Promise<EquipmentAssignment> => {
  try {
    const response = await api.get<ApiResponse<EquipmentAssignment>>(
      endpoints.equipmentAssignments.detail(id)
    );

    if (!response.success) {
      throw new Error(response.message || 'Equipment assignment not found');
    }

    return response.data;
  } catch (error) {
    console.error(`[Equipment Service] Failed to fetch assignment ${id}:`, error);
    throw error;
  }
};

/**
 * Get equipment assignment statistics
 */
export const getAssignmentStats = async (
  params?: EquipmentAssignmentsParams
): Promise<AssignmentStats> => {
  try {
    const response = await api.get<ApiResponse<AssignmentStats>>(
      endpoints.equipmentAssignments.stats,
      params
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }

    return response.data;
  } catch (error) {
    console.error('[Equipment Service] Failed to fetch stats:', error);
    throw error;
  }
};

/**
 * Search equipment assignments
 */
export const searchEquipmentAssignments = async (
  query: string
): Promise<EquipmentAssignment[]> => {
  try {
    const response = await getEquipmentAssignments({ search: query });
    return response.data;
  } catch (error) {
    console.error('[Equipment Service] Search failed:', error);
    throw error;
  }
};

/**
 * Get active assignments for an employee
 */
export const getEmployeeAssignments = async (
  employeeId: number
): Promise<EquipmentAssignment[]> => {
  try {
    const response = await getEquipmentAssignments({
      employee_id: employeeId,
      per_page: 100,
    });
    return response.data;
  } catch (error) {
    console.error('[Equipment Service] Failed to fetch employee assignments:', error);
    throw error;
  }
};

/**
 * Get assignments for specific equipment
 */
export const getEquipmentHistory = async (
  equipmentId: number
): Promise<EquipmentAssignment[]> => {
  try {
    const response = await getEquipmentAssignments({
      equipment_id: equipmentId,
      per_page: 100,
    });
    return response.data;
  } catch (error) {
    console.error('[Equipment Service] Failed to fetch equipment history:', error);
    throw error;
  }
};

/**
 * Upload equipment assignment photo
 */
export const uploadEquipmentPhoto = async (
  equipmentId: number,
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
      equipment_assignment_id: equipmentId,
    });

    return response;
  } catch (error) {
    console.error(`[Equipment Service] Failed to upload photo for equipment ${equipmentId}:`, error);
    throw error;
  }
};

/**
 * Upload equipment assignment signature
 */
export const uploadEquipmentSignature = async (
  equipmentId: number,
  signatureDataUrl: string,
  signedBy: string,
  action: string
): Promise<{ url: string }> => {
  try {
    // Convert base64 signature to blob
    const base64Data = signatureDataUrl.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);

    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'image/png' });
    const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });

    const response = await api.upload<{ url: string }>(endpoints.uploads.signature, file, {
      equipment_assignment_id: equipmentId,
      signed_by: signedBy,
      signed_at: new Date().toISOString(),
      action: action,
    });

    return response;
  } catch (error) {
    console.error(
      `[Equipment Service] Failed to upload signature for equipment ${equipmentId}:`,
      error
    );
    throw error;
  }
};

/**
 * Fetch photos for equipment assignment from server
 */
export const getEquipmentPhotos = async (equipmentId: number): Promise<PhotoResponse[]> => {
  try {
    const response = await api.get<ApiResponse<PhotoResponse[]>>(
      endpoints.equipmentAssignments.photos(equipmentId)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch photos');
    }

    return response.data || [];
  } catch (error) {
    console.error(`[Equipment Service] Failed to fetch photos for equipment ${equipmentId}:`, error);
    throw error;
  }
};

/**
 * Delete photo from server
 */
export const deleteEquipmentPhoto = async (equipmentId: number, photoId: number): Promise<void> => {
  try {
    await api.delete(endpoints.equipmentAssignments.photoDetail(equipmentId, photoId));
    console.log(`[Equipment Service] Photo ${photoId} deleted from server`);
  } catch (error) {
    console.error(`[Equipment Service] Failed to delete photo ${photoId}:`, error);
    throw error;
  }
};

/**
 * Fetch signatures for equipment assignment from server
 */
export const getEquipmentSignatures = async (equipmentId: number): Promise<SignatureResponse[]> => {
  try {
    const response = await api.get<ApiResponse<SignatureResponse[]>>(
      endpoints.equipmentAssignments.signatures(equipmentId)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch signatures');
    }

    return response.data || [];
  } catch (error) {
    console.error(`[Equipment Service] Failed to fetch signatures for equipment ${equipmentId}:`, error);
    throw error;
  }
};

/**
 * Delete signature from server
 */
export const deleteEquipmentSignature = async (equipmentId: number, signatureId: number): Promise<void> => {
  try {
    await api.delete(endpoints.equipmentAssignments.signatureDetail(equipmentId, signatureId));
    console.log(`[Equipment Service] Signature ${signatureId} deleted from server`);
  } catch (error) {
    console.error(`[Equipment Service] Failed to delete signature ${signatureId}:`, error);
    throw error;
  }
};

export const equipmentService = {
  getEquipmentAssignments,
  getEquipmentAssignmentById,
  getAssignmentStats,
  searchEquipmentAssignments,
  getEmployeeAssignments,
  getEquipmentHistory,
  uploadEquipmentPhoto,
  uploadEquipmentSignature,
  getEquipmentPhotos,
  deleteEquipmentPhoto,
  getEquipmentSignatures,
  deleteEquipmentSignature,
};

export default equipmentService;
