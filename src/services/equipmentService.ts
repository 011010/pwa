/**
 * Equipment Assignments Service
 *
 * Handles equipment assignment operations from the legacy system API.
 * This service interacts with the equipment-assignments endpoint.
 */

import { api } from './api';
import { endpoints } from '../config/environment';
import type { EquipmentAssignment, ApiResponse } from '../types';

/**
 * Photo response from server
 */
export interface PhotoResponse {
  id: number;
  assignment_id: number;
  url: string;
  filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  created_at: string;
}

/**
 * Signature response from server
 */
export interface SignatureResponse {
  id: number;
  assignment_id: number;
  url: string;
  filename: string;
  signed_by: string;
  signed_at: string;
  action: string;
  notes?: string;
  created_at: string;
}

/**
 * Params for fetching equipment assignments
 */
export interface EquipmentAssignmentsParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  equipment_id?: number;
  email?: string; // Filter by employee email
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
 * Upload equipment assignment photo using RESTful endpoint
 */
export const uploadEquipmentPhoto = async (
  equipmentId: number,
  photo: File
): Promise<PhotoResponse> => {
  try {
    // Validate file size (max 10MB per API spec)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (photo.size > maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(photo.type)) {
      throw new Error(
        `File type ${photo.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Use RESTful endpoint: POST /api/v1/equipment-assignments/{id}/photos
    const response = await api.upload<ApiResponse<PhotoResponse>>(
      endpoints.equipmentAssignments.photos(equipmentId),
      photo,
      {},
      'photo' // Field name must be 'photo' per API spec
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to upload photo');
    }

    return response.data;
  } catch (error) {
    console.error(`[Equipment Service] Failed to upload photo for equipment ${equipmentId}:`, error);
    throw error;
  }
};

/**
 * Upload equipment assignment signature using RESTful endpoint with JSON
 */
export const uploadEquipmentSignature = async (
  equipmentId: number,
  signatureDataUrl: string,
  signedBy: string,
  action: string,
  notes?: string
): Promise<SignatureResponse> => {
  try {
    // Prepare request body per API spec
    const requestBody = {
      signature: signatureDataUrl, // Base64 data URL
      signed_by: signedBy,
      signed_at: new Date().toISOString(),
      action: action,
      notes: notes || undefined, // Optional
    };

    // Use RESTful endpoint: POST /api/v1/equipment-assignments/{id}/signatures
    // API expects JSON, not multipart/form-data
    const response = await api.post<ApiResponse<SignatureResponse>>(
      endpoints.equipmentAssignments.signatures(equipmentId),
      requestBody
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to upload signature');
    }

    return response.data;
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
