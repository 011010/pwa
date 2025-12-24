/**
 * New Equipment Output Form Component
 *
 * Modern 5-step form for creating equipment outputs (home office assignment).
 * Flow:
 *   1. Select employee
 *   2. Select multiple equipment
 *   3. Add departure details (date, comments for all equipment)
 *   4. Add equipment photos (shared for all equipment)
 *   5. Add digital signature (shared for all equipment)
 *
 * All selected equipment will share the same comments, photos, and signature.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { equipmentService } from '../services/equipmentService';
import SignaturePad from '../components/SignaturePad';
import type { EquipmentAssignment } from '../types';

interface SelectedEmployee {
  id: number;
  name: string;
  email: string;
}

interface SelectedEquipment {
  equipment_inventory_id: number;
  name: string;
  serial_number: string;
  model: string;
}

export const NewEquipmentOutput: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 1: Select employee, 2: Select equipment, 3: Details, 4: Photos, 5: Signature

  // Employee selection
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeList, setEmployeeList] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);

  // Equipment selection
  const [equipmentList, setEquipmentList] = useState<EquipmentAssignment[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<SelectedEquipment[]>([]);

  // Departure details (shared for all equipment)
  const [outputDate, setOutputDate] = useState(new Date().toISOString().split('T')[0]);
  const [outputComments, setOutputComments] = useState('');

  // Photos and signature (shared for all equipment)
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Common
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search employees
  const handleEmployeeSearch = async (query: string) => {
    setEmployeeSearch(query);
    if (!query.trim()) {
      setEmployeeList([]);
      return;
    }

    try {
      setIsLoadingEmployees(true);
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

  // Load employee equipment
  const loadEmployeeEquipment = async (employeeId: number) => {
    try {
      setIsLoadingEquipment(true);
      const results = await equipmentService.getEmployeeAssignments(employeeId);
      setEquipmentList(results);
    } catch (err) {
      console.error('Failed to load employee equipment:', err);
      setEquipmentList([]);
    } finally {
      setIsLoadingEquipment(false);
    }
  };

  const handleEmployeeSelect = (employee: { id: number; name: string; email: string }) => {
    setSelectedEmployee(employee);
    setEmployeeSearch(employee.name);
    setEmployeeList([]);
    // Load employee's equipment
    loadEmployeeEquipment(employee.id);
    setStep(2);
  };

  const handleEquipmentAdd = (equipment: EquipmentAssignment) => {
    const equipmentId = equipment.metadata?.equipment_id || equipment.id;

    // Check if already added
    if (selectedEquipments.some(e => e.equipment_inventory_id === equipmentId)) {
      alert('Este equipo ya fue agregado');
      return;
    }

    setSelectedEquipments([
      ...selectedEquipments,
      {
        equipment_inventory_id: equipmentId,
        name: equipment.equipment,
        serial_number: equipment.serial_number,
        model: equipment.model,
      }
    ]);
    // Don't clear equipment list - allow selecting multiple equipment
  };

  const handleEquipmentRemove = (equipmentId: number) => {
    setSelectedEquipments(selectedEquipments.filter(e => e.equipment_inventory_id !== equipmentId));
  };

  // Photo handlers
  const handlePhotoCapture = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      console.log('[NewEquipmentOutput] Photo captured, base64 length:', base64?.length);
      setPhotos([...photos, base64]);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Signature handlers
  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignaturePad(false);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      setError('Por favor selecciona un empleado');
      return;
    }

    if (selectedEquipments.length === 0) {
      setError('Por favor selecciona al menos un equipo');
      return;
    }

    if (!outputComments.trim()) {
      setError('Por favor agrega comentarios de salida');
      return;
    }

    if (photos.length === 0) {
      setError('Por favor agrega al menos una foto');
      return;
    }

    if (!signature) {
      setError('Por favor agrega la firma digital');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('[NewEquipmentOutput] Creating outputs:', {
        equipmentCount: selectedEquipments.length,
        hasPhoto: !!photos[0],
        photoLength: photos[0]?.length,
        hasSignature: !!signature,
        signatureLength: signature?.length,
        employee: selectedEmployee.email,
      });

      // Create one output per equipment with shared comments, photo, and signature
      const results = await Promise.allSettled(
        selectedEquipments.map(equipment =>
          equipmentOutputService.createEquipmentOutput({
            equipment_inventory_id: equipment.equipment_inventory_id,
            employee_id: selectedEmployee.id,
            employee_email: selectedEmployee.email,
            output_comments: outputComments,
            output_date: outputDate,
            output_photo: photos[0], // Use first photo
            output_signature: signature,
          })
        )
      );

      // Check for any failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('[NewEquipmentOutput] Some outputs failed:', failures);
        setError(`Failed to create ${failures.length} of ${selectedEquipments.length} outputs`);
        return;
      }

      // Log successful creations
      const successes = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      console.log('[NewEquipmentOutput] Created outputs:', successes.map(s => ({
        id: s.value?.id,
        hasPhoto: !!s.value?.output_photo,
        photoLength: s.value?.output_photo?.length
      })));

      navigate('/equipment-outputs');
    } catch (err: any) {
      console.error('Failed to create equipment outputs:', err);
      setError(err.message || 'Failed to create equipment outputs');
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
              <h1 className="text-2xl font-bold">New Equipment Departure</h1>
              <p className="text-blue-100 text-sm">
                {step === 1 && 'Step 1: Select employee'}
                {step === 2 && 'Step 2: Select equipment'}
                {step === 3 && 'Step 3: Departure details'}
                {step === 4 && 'Step 4: Equipment photos'}
                {step === 5 && 'Step 5: Digital signature'}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 4 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 5 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>
      </div>

      {/* Content */}
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

        <AnimatePresence mode="wait">
          {/* Step 1: Select Employee */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select employee</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search employee
                </label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => handleEmployeeSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {isLoadingEmployees && (
                  <p className="text-sm text-gray-500 mt-2">Looking for employees...</p>
                )}
                {employeeList.length > 0 && (
                  <div className="mt-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    {employeeList.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => handleEmployeeSelect(employee)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        {employee.email && (
                          <p className="text-sm text-gray-600">{employee.email}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Equipment */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Selected Employee Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Selected employee</p>
                    <p className="text-lg font-semibold text-blue-900">{selectedEmployee?.name}</p>
                    {selectedEmployee?.email && (
                      <p className="text-sm text-blue-700">{selectedEmployee.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmployee(null);
                      setEmployeeSearch('');
                      setStep(1);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Equipment List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Equipment</h2>

                {isLoadingEquipment ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading equipment...</p>
                  </div>
                ) : equipmentList.length > 0 ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select equipment that will be used for home office
                    </label>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      {equipmentList.map((equipment) => {
                        const equipmentId = equipment.metadata?.equipment_id || equipment.id;
                        const isSelected = selectedEquipments.some(e => e.equipment_inventory_id === equipmentId);

                        return (
                          <button
                            key={equipment.id}
                            type="button"
                            onClick={() => !isSelected && handleEquipmentAdd(equipment)}
                            disabled={isSelected}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                              isSelected
                                ? 'bg-green-50 cursor-default'
                                : 'hover:bg-blue-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{equipment.equipment}</p>
                                <p className="text-sm text-gray-600">
                                  Serial: {equipment.serial_number} | Model: {equipment.model}
                                </p>
                              </div>
                              {isSelected && (
                                <span className="ml-2 text-green-600 flex-shrink-0">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="font-medium">This employee has no assigned equipment.</p>
                    <p className="text-sm mt-1">You cannot create outputs for this employee.</p>
                  </div>
                )}

                {/* Selected Equipment List */}
                {selectedEquipments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selected equipments ({selectedEquipments.length})
                    </p>
                    {selectedEquipments.map((equipment) => (
                      <div
                        key={equipment.equipment_inventory_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{equipment.name}</p>
                          <p className="text-sm text-gray-600">Serial: {equipment.serial_number}</p>
                        </div>
                        <button
                          onClick={() => handleEquipmentRemove(equipment.equipment_inventory_id)}
                          className="ml-3 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={outputDate}
                  onChange={(e) => setOutputDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (selectedEquipments.length === 0) {
                      setError('Please select at least one equipment');
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Next: Departure Details
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Departure Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Departure Details</h2>
                <p className="text-sm text-gray-600">
                  Add the departure date and comments for all selected equipment.
                </p>
              </div>

              {/* Selected Equipment Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected equipment ({selectedEquipments.length})
                </p>
                <div className="space-y-1">
                  {selectedEquipments.map((equipment) => (
                    <p key={equipment.equipment_inventory_id} className="text-sm text-gray-600">
                      • {equipment.name} ({equipment.serial_number})
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date *
                </label>
                <input
                  type="date"
                  value={outputDate}
                  onChange={(e) => setOutputDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Comments *
                </label>
                <textarea
                  value={outputComments}
                  onChange={(e) => setOutputComments(e.target.value)}
                  placeholder="Describe the reason for departure, equipment conditions, etc..."
                  rows={4}
                  maxLength={350}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {outputComments.length}/350 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (!outputComments.trim()) {
                      setError('Please add departure comments');
                      return;
                    }
                    setError(null);
                    setStep(4);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Next: Add Photos
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Equipment Photos */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Equipment Photos</h2>
                <p className="text-sm text-gray-600">
                  Add at least one photo of the equipment being assigned.
                </p>
              </div>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => handleDeletePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Photo Button */}
              <button
                onClick={handlePhotoCapture}
                type="button"
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
              >
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-600">
                  {photos.length > 0 ? 'Add another photo' : 'Click to take photo'}
                </p>
              </button>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (photos.length === 0) {
                      setError('Please add at least one photo');
                      return;
                    }
                    setError(null);
                    setStep(5);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Next: Add Signature
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Digital Signature */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Digital Signature</h2>
                <p className="text-sm text-gray-600">
                  Add employee's digital signature to authorize the equipment departure.
                </p>
              </div>

              {/* Signature Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Signature *
                </label>
                {signature ? (
                  <div>
                    <img
                      src={signature}
                      alt="Signature"
                      className="w-full max-w-md h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200 p-2 mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => setSignature(null)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove signature
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors group"
                  >
                    <svg className="w-10 h-10 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <p className="text-sm text-gray-600">Click to sign digitally</p>
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(4)}
                  disabled={isSubmitting}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !signature}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating departures...' : `Create ${selectedEquipments.length} Departure${selectedEquipments.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file input for photos */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg h-96 transition-colors">
            <SignaturePad
              onSave={handleSignatureSave}
              onClear={() => setShowSignaturePad(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewEquipmentOutput;
