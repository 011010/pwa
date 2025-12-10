/**
 * Create Home Office Component
 *
 * Allows employees to create a new home office equipment output.
 * Process: Select equipment → Add comments → Take photos → Sign → Submit
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { storageService } from '../services/storageService';
import { SignaturePad } from '../components/SignaturePad';
import type { EquipmentAssignment } from '../types';

export const CreateHomeOffice: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [myEquipment, setMyEquipment] = useState<EquipmentAssignment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [outputDate, setOutputDate] = useState(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyEquipment();
  }, [user]);

  const fetchMyEquipment = async () => {
    if (!user?.email) return;

    try {
      const response = await equipmentService.getEquipmentAssignments({
        email: user.email,
        per_page: 100
      });
      setMyEquipment(response.data);
    } catch (err: any) {
      console.error('Failed to fetch equipment:', err);
      setError('No se pudieron cargar tus equipos');
    }
  };

  const handleEquipmentSelect = (equipmentId: number) => {
    setSelectedEquipmentId(equipmentId);
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);

      // Reset input to allow multiple captures
      event.target.value = '';
    } catch (err) {
      console.error('Failed to read photo:', err);
      alert('Error al cargar la foto');
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignaturePad(false);
  };

  const handleSubmit = async () => {
    if (!selectedEquipmentId || !user) {
      alert('Por favor selecciona un equipo');
      return;
    }

    if (!comments.trim()) {
      alert('Por favor agrega comentarios');
      return;
    }

    if (photos.length === 0) {
      alert('Por favor toma al menos una foto del equipo');
      return;
    }

    if (!signature) {
      alert('Por favor firma la solicitud');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const selectedEquipment = myEquipment.find(eq => eq.id === selectedEquipmentId);
      if (!selectedEquipment) throw new Error('Equipment not found');

      const payload = {
        equipment_inventory_id: selectedEquipment.metadata.equipment_id,
        employee_id: user.id,
        employee_email: user.email,
        output_date: outputDate,
        output_comments: comments,
        output_photo: photos[0],
        output_signature: signature
      };

      console.log('[CreateHomeOffice] Creating equipment output:', {
        equipment_inventory_id: payload.equipment_inventory_id,
        employee_id: payload.employee_id,
        employee_email: payload.employee_email,
        output_date: payload.output_date,
        hasPhoto: !!photos[0],
        hasSignature: !!signature,
        totalPhotos: photos.length
      });

      const createdOutput = await equipmentOutputService.createEquipmentOutput(payload);

      // Save additional photos to IndexedDB if any
      if (photos.length > 1) {
        for (let i = 1; i < photos.length; i++) {
          const blob = await fetch(photos[i]).then(r => r.blob());
          const file = new File([blob], `output_photo_${i}.png`, { type: 'image/png' });
          await storageService.savePhoto(createdOutput.id, file);
        }
      }

      alert('¡Solicitud de home office creada exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[CreateHomeOffice] Failed to create home office:', err);
      setError(err.message || 'Error al crear la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEquipment = myEquipment.find(eq => eq.id === selectedEquipmentId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Nueva Solicitud Home Office</h1>
              <p className="text-purple-100 text-sm">Paso {step} de 4</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-purple-800/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Select Equipment */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Selecciona el equipo
              </h2>
              <p className="text-gray-600 mb-6">
                Elige qué equipo llevarás a home office
              </p>

              <div className="space-y-3">
                {myEquipment.map((equipment) => (
                  <button
                    key={equipment.id}
                    onClick={() => handleEquipmentSelect(equipment.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedEquipmentId === equipment.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
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
                      {selectedEquipmentId === equipment.id && (
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedEquipmentId}
                className="mt-6 w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* Step 2: Add Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Detalles de la solicitud
              </h2>
              <p className="text-gray-600 mb-6">
                Proporciona información sobre el home office
              </p>

              {selectedEquipment && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 mb-1">Equipo seleccionado:</p>
                  <p className="font-semibold text-gray-900">{selectedEquipment.equipment}</p>
                  <p className="text-sm text-gray-600">Serial: {selectedEquipment.serial_number}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de salida
                  </label>
                  <input
                    type="date"
                    value={outputDate}
                    onChange={(e) => setOutputDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios *
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    maxLength={350}
                    rows={4}
                    placeholder="Describe el motivo del home office..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {comments.length}/350 caracteres
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!comments.trim()}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Take Photos */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Fotos del equipo *
              </h2>
              <p className="text-gray-600 mb-6">
                Toma fotos del estado actual del equipo (mínimo 1)
              </p>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
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
                className="w-full mb-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors group"
              >
                <svg className="w-10 h-10 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-600">
                  {photos.length > 0 ? 'Agregar otra foto' : 'Toca para tomar foto'}
                </p>
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={photos.length === 0}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Signature and Submit */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Firma *
              </h2>
              <p className="text-gray-600 mb-6">
                Firma digitalmente para confirmar la solicitud
              </p>

              {signature ? (
                <div className="mb-6">
                  <img
                    src={signature}
                    alt="Signature"
                    className="w-full max-w-md mx-auto h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200 p-2"
                  />
                  <button
                    onClick={() => setSignature(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium block mx-auto"
                  >
                    Eliminar firma
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="w-full mb-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors group"
                >
                  <svg className="w-10 h-10 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p className="text-sm text-gray-600">Toca para firmar digitalmente</p>
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!signature || isLoading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creando...' : 'Crear Solicitud'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
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

export default CreateHomeOffice;
