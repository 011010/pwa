import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { AssetCard } from '../components/AssetCard';
import { BottomNav } from '../components/BottomNav';
import type { EquipmentAssignment, Asset } from '../types';

export const EmployeeEquipment: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeName = (location.state as any)?.employeeName || 'Employee';

  useEffect(() => {
    const fetchEmployeeEquipment = async () => {
      if (!employeeId) return;

      try {
        setIsLoading(true);
        const data = await equipmentService.getEmployeeAssignments(parseInt(employeeId));
        setAssignments(data);
      } catch (err: any) {
        console.error('Failed to fetch employee equipment:', err);
        setError(err.message || 'Failed to load employee equipment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeEquipment();
  }, [employeeId]);

  // Convert EquipmentAssignment to Asset format
  const convertToAsset = (assignment: EquipmentAssignment): Asset => {
    const hasAssignment = assignment.metadata?.employee_name &&
                         assignment.metadata?.employee_name.trim() !== '' &&
                         assignment.metadata?.employee_name !== 'N/A';
    const isRetired = assignment.metadata?.equipment_status === 'BAJAS';

    let status: 'in_use' | 'available' | 'maintenance' | 'retired' = 'available';
    if (isRetired) {
      status = 'retired';
    } else if (hasAssignment) {
      status = 'in_use';
    }

    return {
      id: assignment.id,
      code: assignment.serial_number,
      name: assignment.equipment,
      model: assignment.model,
      serial_number: assignment.serial_number,
      status,
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
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employeeName}</h1>
              <p className="text-sm text-gray-600">Equipment Assigned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4"
          >
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : assignments.length > 0 ? (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{assignments.length}</span> equipment(s) assigned to this person
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <AssetCard
                  key={assignment.id}
                  asset={convertToAsset(assignment)}
                  onClick={() => navigate(`/equipment/${assignment.id}`)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment assigned</h3>
            <p className="text-gray-600">This employee has no equipment assigned</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default EmployeeEquipment;
