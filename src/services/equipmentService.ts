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

export const equipmentService = {
  getEquipmentAssignments,
  getEquipmentAssignmentById,
  getAssignmentStats,
  searchEquipmentAssignments,
  getEmployeeAssignments,
  getEquipmentHistory,
};

export default equipmentService;
