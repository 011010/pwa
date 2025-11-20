/**
 * Permissions Hook
 *
 * Provides role-based access control for the application.
 * Determines what features users can access based on their role.
 */

import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  // Check if user is admin (admin or super_admin role)
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

  // Everyone else is considered an employee
  const isEmployee = !isAdmin;

  return {
    isAdmin,
    isEmployee,

    // Admin permissions
    canAccessAdminFeatures: isAdmin,
    canManageEquipmentOutputs: isAdmin,
    canUploadPhotosAnytime: isAdmin,
    canViewAllEmployees: isAdmin,
    canViewEquipmentOutputsList: isAdmin,

    // Employee permissions
    canViewOwnEquipment: true,
    canViewProfile: true,

    // User info
    user,
  };
};

export default usePermissions;
