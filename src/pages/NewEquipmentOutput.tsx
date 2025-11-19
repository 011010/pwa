/**
 * New Equipment Output Form Component
 *
 * Form for creating a new equipment output (home office assignment).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { equipmentService } from '../services/equipmentService';
import type { CreateEquipmentOutputData, EquipmentAssignment } from '../types';

export const NewEquipmentOutput: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [equipmentList, setEquipmentList] = useState<EquipmentAssignment[]>([]);
  const [employeeList, setEmployeeList] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [formData, setFormData] = useState<CreateEquipmentOutputData>({
    equipment_inventory_id: 0,
    employee_id: 0,
    output_comments: '',
    output_date: new Date().toISOString().split('T')[0], // Today's date in Y-m-d format
  });

  // Search equipment
  const handleEquipmentSearch = async (query: string) => {
    setEquipmentSearch(query);
    if (!query.trim()) {
      setEquipmentList([]);
      return;
    }

    try {
      setIsLoadingEquipment(true);
      const results = await equipmentService.searchEquipmentAssignments(query);
      setEquipmentList(results);
    } catch (err) {
      console.error('Equipment search failed:', err);
    } finally {
      setIsLoadingEquipment(false);
    }
  };

  // Note: Employee search would require a dedicated employee API endpoint
  // For now, we'll use a simplified approach
  const handleEmployeeSearch = async (query: string) => {
    setEmployeeSearch(query);
    if (!query.trim()) {
      setEmployeeList([]);
      return;
    }

    try {
      setIsLoadingEmployees(true);
      // Get employees from equipment assignments
      const results = await equipmentService.searchEquipmentAssignments(query);
      const uniqueEmployees = results
        .filter((r) => r.metadata?.employee_id && r.metadata?.employee_name)
        .map((r) => ({
          id: r.metadata!.employee_id,
          name: r.metadata!.employee_name,
          email: r.metadata!.employee_email || '',
        }))
        .filter(
          (emp, index, self) => index === self.findIndex((e) => e.id === emp.id)
        );
      setEmployeeList(uniqueEmployees);
    } catch (err) {
      console.error('Employee search failed:', err);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.equipment_inventory_id || !formData.employee_id) {
      setError('Por favor selecciona un equipo y un empleado');
      return;
    }

    if (!formData.output_comments.trim()) {
      setError('Por favor ingresa comentarios sobre la salida del equipo');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await equipmentOutputService.createEquipmentOutput(formData);
      navigate('/equipment-outputs');
    } catch (err: any) {
      console.error('Failed to create equipment output:', err);
      setError(err.message || 'Failed to create equipment output');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/equipment-outputs')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Nueva Salida de Equipo</h1>
              <p className="text-blue-100 text-sm">Asignar equipo para home office</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4"
          >
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Equipment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipo *
            </label>
            <input
              type="text"
              value={equipmentSearch}
              onChange={(e) => handleEquipmentSearch(e.target.value)}
              placeholder="Buscar equipo por serial, nombre, modelo..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isLoadingEquipment && (
              <p className="text-sm text-gray-500 mt-2">Buscando equipos...</p>
            )}
            {equipmentList.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {equipmentList.map((equipment) => (
                  <button
                    key={equipment.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, equipment_inventory_id: equipment.metadata?.equipment_id || equipment.id });
                      setEquipmentSearch(`${equipment.equipment} - ${equipment.serial_number}`);
                      setEquipmentList([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{equipment.equipment}</p>
                    <p className="text-sm text-gray-600">
                      Serial: {equipment.serial_number} | Modelo: {equipment.model}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {formData.equipment_inventory_id > 0 && (
              <p className="text-sm text-green-600 mt-2">✓ Equipo seleccionado</p>
            )}
          </div>

          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empleado *
            </label>
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => handleEmployeeSearch(e.target.value)}
              placeholder="Buscar empleado por nombre o email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isLoadingEmployees && (
              <p className="text-sm text-gray-500 mt-2">Buscando empleados...</p>
            )}
            {employeeList.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {employeeList.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, employee_id: employee.id });
                      setEmployeeSearch(employee.name);
                      setEmployeeList([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    {employee.email && (
                      <p className="text-sm text-gray-600">{employee.email}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            {formData.employee_id > 0 && (
              <p className="text-sm text-green-600 mt-2">✓ Empleado seleccionado</p>
            )}
          </div>

          {/* Output Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Salida *
            </label>
            <input
              type="date"
              value={formData.output_date}
              onChange={(e) => setFormData({ ...formData, output_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Output Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios de Salida *
            </label>
            <textarea
              value={formData.output_comments}
              onChange={(e) => setFormData({ ...formData, output_comments: e.target.value })}
              placeholder="Motivo de la salida, condiciones del equipo, etc..."
              rows={4}
              maxLength={350}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.output_comments.length}/350 caracteres</p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/equipment-outputs')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.equipment_inventory_id || !formData.employee_id || !formData.output_comments.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEquipmentOutput;
