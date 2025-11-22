/**
 * Employee Dashboard Component
 *
 * Shows employee's assigned equipment and their active home office equipment outputs.
 * Allows employees to create new equipment outputs and manage photos.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { equipmentService } from '../services/equipmentService';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { BottomNav } from '../components/BottomNav';
import type { EquipmentAssignment, EquipmentOutput } from '../types';

export const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing } = useOfflineQueue();
  const navigate = useNavigate();

  // Employee's assigned equipment
  const [myEquipment, setMyEquipment] = useState<EquipmentAssignment[]>([]);

  // Employee's active home office outputs
  const [homeOfficeOutputs, setHomeOfficeOutputs] = useState<EquipmentOutput[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'equipment' | 'homeoffice'>('equipment');

  useEffect(() => {
    fetchEmployeeData();
  }, [user]);

  const fetchEmployeeData = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch employee's assigned equipment and home office outputs in parallel
      const [equipmentResponse, outputsResponse] = await Promise.all([
        equipmentService.getEquipmentAssignments({
          email: user.email,
          per_page: 100
        }),
        equipmentOutputService.getEquipmentOutputs({
          email: user.email,
          per_page: 100
        })
      ]);

      setMyEquipment(equipmentResponse.data);

      // Filter only active outputs on client side
      const activeOutputs = outputsResponse.data.filter(output => output.is_active);
      setHomeOfficeOutputs(activeOutputs);
    } catch (err: any) {
      console.error('[Employee Dashboard] Failed to fetch data:', err);
      setError(err.message || 'Failed to load your equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHomeOffice = () => {
    navigate('/create-home-office');
  };

  const handleViewOutput = (outputId: number) => {
    navigate(`/home-office/${outputId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Espacio</h1>
              <p className="text-sm text-gray-600">
                Hola, {user?.full_name || (user?.lastnames ? `${user.name} ${user.lastnames}` : user?.name)}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <div className={`flex items-center px-2 py-1 rounded ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
            {pendingCount > 0 && (
              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'equipment'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Mis Equipos ({myEquipment.length})
            </button>
            <button
              onClick={() => setActiveTab('homeoffice')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'homeoffice'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Home Office ({homeOfficeOutputs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'equipment' ? (
              <motion.div
                key="equipment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {myEquipment.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myEquipment.map((equipment) => (
                      <div
                        key={equipment.id}
                        className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {equipment.equipment}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Serial: {equipment.serial_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              Modelo: {equipment.model}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Asignado
                          </span>
                        </div>
                        {equipment.comments && (
                          <p className="text-sm text-gray-500 mt-2">
                            {equipment.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes equipos asignados</h3>
                    <p className="text-gray-600">Contacta a tu administrador si necesitas equipo</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="homeoffice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Create Home Office Button */}
                <div className="mb-6">
                  <button
                    onClick={handleCreateHomeOffice}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear Solicitud Home Office
                  </button>
                </div>

                {homeOfficeOutputs.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {homeOfficeOutputs.map((output) => (
                      <div
                        key={output.id}
                        onClick={() => handleViewOutput(output.id)}
                        className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {output.equipment.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Serial: {output.equipment.serial_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              Modelo: {output.equipment.model}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Activo
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Fecha salida:</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(output.output_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Estado:</p>
                              <p className="font-medium text-green-600">
                                En home office
                              </p>
                            </div>
                          </div>

                          {output.output_comments && (
                            <p className="text-sm text-gray-600 mt-3">
                              {output.output_comments}
                            </p>
                          )}

                          <div className="mt-4 flex items-center gap-2">
                            {output.output_photo && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Foto salida
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No tienes equipos en home office
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Crea una solicitud para llevar equipo a casa
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default EmployeeDashboard;
