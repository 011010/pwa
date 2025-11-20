/**
 * Home Office Approval Service
 *
 * Checks if an employee has an approved home office request
 * from the productivity system (external system integration).
 */

import { api } from './api';
import { endpoints } from '../config/environment';
import type { ApiResponse } from '../types';

/**
 * Home Office Approval Status from Productivity System
 */
export interface HomeOfficeApproval {
  has_approved_request: boolean;
  request_id?: number;
  start_date?: string;
  end_date?: string;
  status?: 'approved' | 'pending' | 'rejected';
  approval_date?: string;
}

/**
 * Check if the current user has an approved home office request
 */
export const checkHomeOfficeApproval = async (): Promise<HomeOfficeApproval> => {
  try {
    const response = await api.get<ApiResponse<HomeOfficeApproval>>(
      endpoints.homeOffice.checkApproval
    );

    if (!response.success) {
      console.warn('[Home Office Service] Approval check failed:', response.message);
      // Return default state (no approval) on error
      return { has_approved_request: false };
    }

    return response.data;
  } catch (error) {
    console.error('[Home Office Service] Failed to check approval:', error);
    // Return default state (no approval) on error
    return { has_approved_request: false };
  }
};

/**
 * Check approval for a specific employee (admin only)
 */
export const checkEmployeeHomeOfficeApproval = async (
  employeeId: number
): Promise<HomeOfficeApproval> => {
  try {
    const response = await api.get<ApiResponse<HomeOfficeApproval>>(
      endpoints.homeOffice.approvalByEmployee(employeeId)
    );

    if (!response.success) {
      console.warn(
        `[Home Office Service] Approval check failed for employee ${employeeId}:`,
        response.message
      );
      return { has_approved_request: false };
    }

    return response.data;
  } catch (error) {
    console.error(
      `[Home Office Service] Failed to check approval for employee ${employeeId}:`,
      error
    );
    return { has_approved_request: false };
  }
};

export const homeOfficeApprovalService = {
  checkHomeOfficeApproval,
  checkEmployeeHomeOfficeApproval,
};

export default homeOfficeApprovalService;
