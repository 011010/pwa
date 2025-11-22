/**
 * Equipment Output Service (Home Office Management)
 *
 * Handles equipment output operations for home office management.
 * This service interacts with the equipment-outputs endpoint.
 */

import { api } from './api';
import { endpoints } from '../config/environment';
import type {
  EquipmentOutput,
  CreateEquipmentOutputData,
  UpdateEquipmentOutputData,
  EquipmentOutputStats,
  ApiResponse,
} from '../types';

/**
 * Params for fetching equipment outputs
 */
export interface EquipmentOutputsParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  equipment_id?: number;
  email?: string;
  date_from?: string; // Format: Y-m-d (e.g., 2025-11-01)
  date_to?: string;
  is_active?: boolean; // true: only active, false: only returned
  search?: string; // Search in employee name, serial, model
}

/**
 * Fetch equipment outputs list with pagination and filters
 */
export const getEquipmentOutputs = async (
  params?: EquipmentOutputsParams
): Promise<ApiResponse<EquipmentOutput[]>> => {
  try {
    const response = await api.get<ApiResponse<EquipmentOutput[]>>(
      endpoints.equipmentOutputs.list,
      params
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch equipment outputs');
    }

    return response;
  } catch (error) {
    console.error('[Equipment Output Service] Failed to fetch outputs:', error);
    throw error;
  }
};

/**
 * Fetch single equipment output by ID
 */
export const getEquipmentOutputById = async (
  id: number
): Promise<EquipmentOutput> => {
  try {
    const response = await api.get<ApiResponse<EquipmentOutput>>(
      endpoints.equipmentOutputs.detail(id)
    );

    if (!response.success) {
      throw new Error(response.message || 'Equipment output not found');
    }

    return response.data;
  } catch (error) {
    console.error(`[Equipment Output Service] Failed to fetch output ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new equipment output (assign equipment for home office)
 */
export const createEquipmentOutput = async (
  data: CreateEquipmentOutputData
): Promise<EquipmentOutput> => {
  try {
    const response = await api.post<ApiResponse<EquipmentOutput>>(
      endpoints.equipmentOutputs.create,
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to create equipment output');
    }

    return response.data;
  } catch (error) {
    console.error('[Equipment Output Service] Failed to create output:', error);
    throw error;
  }
};

/**
 * Update equipment output (mark as returned)
 */
export const updateEquipmentOutput = async (
  id: number,
  data: UpdateEquipmentOutputData
): Promise<EquipmentOutput> => {
  try {
    const response = await api.put<ApiResponse<EquipmentOutput>>(
      endpoints.equipmentOutputs.update(id),
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update equipment output');
    }

    return response.data;
  } catch (error) {
    console.error(`[Equipment Output Service] Failed to update output ${id}:`, error);
    throw error;
  }
};

/**
 * Get equipment output statistics
 */
export const getEquipmentOutputStats = async (
  params?: EquipmentOutputsParams
): Promise<EquipmentOutputStats> => {
  try {
    const response = await api.get<ApiResponse<EquipmentOutputStats>>(
      endpoints.equipmentOutputs.stats,
      params
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }

    return response.data;
  } catch (error) {
    console.error('[Equipment Output Service] Failed to fetch stats:', error);
    throw error;
  }
};

/**
 * Get active equipment outputs for an employee
 */
export const getActiveOutputsByEmployee = async (
  employeeId: number
): Promise<EquipmentOutput[]> => {
  try {
    const response = await api.get<ApiResponse<EquipmentOutput[]>>(
      endpoints.equipmentOutputs.activeByEmployee(employeeId)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch employee outputs');
    }

    return response.data;
  } catch (error) {
    console.error('[Equipment Output Service] Failed to fetch employee outputs:', error);
    throw error;
  }
};

/**
 * Get equipment outputs for current user (by email)
 */
export const getMyEquipmentOutputs = async (
  userEmail: string
): Promise<EquipmentOutput[]> => {
  try {
    const response = await getEquipmentOutputs({
      email: userEmail,
      per_page: 100
    });
    return response.data;
  } catch (error) {
    console.error('[Equipment Output Service] Failed to fetch user outputs:', error);
    throw error;
  }
};

/**
 * Search equipment outputs
 */
export const searchEquipmentOutputs = async (
  query: string
): Promise<EquipmentOutput[]> => {
  try {
    const response = await getEquipmentOutputs({
      search: query,
      per_page: 100
    });
    return response.data;
  } catch (error) {
    console.error('[Equipment Output Service] Search failed:', error);
    throw error;
  }
};

export const equipmentOutputService = {
  getEquipmentOutputs,
  getEquipmentOutputById,
  createEquipmentOutput,
  updateEquipmentOutput,
  getEquipmentOutputStats,
  getActiveOutputsByEmployee,
  searchEquipmentOutputs,
  getMyEquipmentOutputs,
};

export default equipmentOutputService;
