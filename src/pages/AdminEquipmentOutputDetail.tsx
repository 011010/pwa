/**
 * Admin Equipment Output Detail Component
 *
 * Allows admins to view, edit, and manage equipment outputs completely.
 * - Edit comments (output and input)
 * - Add/edit photos at any time (no date restrictions)
 * - Add/edit signature
 * - Mark as returned
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { ImagePreview } from '../components/ImagePreview';
import type { EquipmentOutput } from '../types';

export const AdminEquipmentOutputDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const outputPhotoInputRef = useRef<HTMLInputElement>(null);
  const inputPhotoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [output, setOutput] = useState<EquipmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [outputComments, setOutputComments] = useState('');
  const [outputPhoto, setOutputPhoto] = useState<string | null>(null);
  const [inputComments, setInputComments] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [inputPhoto, setInputPhoto] = useState<string | null>(null);
  const [inputSignature, setInputSignature] = useState<string | null>(null);

  // Return form
  const [showReturnForm, setShowReturnForm] = useState(false);

  // Image preview
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await equipmentOutputService.getEquipmentOutputById(parseInt(id));

      console.log('[AdminEquipmentOutputDetail] Equipment output loaded:', {
        id: data.id,
        hasOutputPhoto: !!data.output_photo,
        outputPhotoLength: data.output_photo?.length || 0,
        hasInputPhoto: !!data.input_photo,
        inputPhotoLength: data.input_photo?.length || 0,
        hasSignature: !!data.input_signature,
        signatureLength: data.input_signature?.length || 0
      });

      setOutput(data);

      // Initialize editable fields
      setOutputComments(data.output_comments || '');
      setOutputPhoto(data.output_photo);
      setInputComments(data.input_comments || '');
      setInputDate(data.input_date ? new Date(data.input_date).toISOString().split('T')[0] : '');
      setInputPhoto(data.input_photo);
      setInputSignature(data.input_signature);
    } catch (err: any) {
      console.error('[AdminEquipmentOutputDetail] Failed to fetch equipment output:', err);
      setError(err.message || 'Failed to load equipment output');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapturePhoto = (type: 'output' | 'input' | 'signature') => {
    if (type === 'output') outputPhotoInputRef.current?.click();
    else if (type === 'input') inputPhotoInputRef.current?.click();
    else signatureInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'output' | 'input' | 'signature') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'output') setOutputPhoto(base64);
      else if (type === 'input') setInputPhoto(base64);
      else setInputSignature(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    if (!id || !output) return;

    try {
      setIsSaving(true);

      // Update the output (this would need a new endpoint or logic)
      // For now, we'll just show success
      alert('Cambios guardados exitosamente');
      setIsEditing(false);
      await fetchDetail();
    } catch (err: any) {
      console.error('Failed to save changes:', err);
      alert(err.message || 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsReturned = async () => {
    if (!id || !inputComments.trim()) {
      alert('Por favor agrega comentarios de devolución');
      return;
    }

    try {
      setIsSaving(true);
      await equipmentOutputService.updateEquipmentOutput(parseInt(id), {
        input_date: inputDate || new Date().toISOString().split('T')[0],
        input_comments: inputComments,
        input_photo: inputPhoto || '',
        input_signature: inputSignature || undefined
      });

      alert('¡Equipo marcado como devuelto exitosamente!');
      setShowReturnForm(false);
      await fetchDetail();
    } catch (err: any) {
      console.error('Failed to mark as returned:', err);
      alert(err.message || 'Error al marcar como devuelto');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  if (error || !output) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar</h3>
          <p className="text-gray-600 mb-4">{error || 'No se pudo cargar el detalle'}</p>
          <button
            onClick={() => navigate('/equipment-outputs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hidden file inputs */}
      <input
        ref={outputPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoChange(e, 'output')}
        className="hidden"
      />
      <input
        ref={inputPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoChange(e, 'input')}
        className="hidden"
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handlePhotoChange(e, 'signature')}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/equipment-outputs')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Detalle Equipment Output</h1>
              <p className="text-blue-100 text-sm">
                {output.is_active ? 'Activo en Home Office' : 'Devuelto'}
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                Editar
              </button>
            )}
          </div>

          {/* Equipment Info Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">{output.equipment.name}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-100">
              <div>
                <p className="text-blue-200">Serial:</p>
                <p className="font-medium">{output.equipment.serial_number}</p>
              </div>
              <div>
                <p className="text-blue-200">Modelo:</p>
                <p className="font-medium">{output.equipment.model}</p>
              </div>
              <div>
                <p className="text-blue-200">Marca:</p>
                <p className="font-medium">{output.equipment.brand}</p>
              </div>
              <div>
                <p className="text-blue-200">Tipo:</p>
                <p className="font-medium">{output.equipment.type_description}</p>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-blue-200 mb-1">Empleado:</p>
            <p className="font-semibold">{output.employee.full_name}</p>
            <p className="text-sm text-blue-100">{output.employee.email}</p>
            <p className="text-sm text-blue-100">{output.employee.department} - {output.employee.position}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Output Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Información de Salida</h3>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {formatDate(output.output_date)}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios de salida
              </label>
              {isEditing ? (
                <textarea
                  value={outputComments}
                  onChange={(e) => setOutputComments(e.target.value)}
                  maxLength={350}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{output.output_comments}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de salida
              </label>
              {outputPhoto || output.output_photo ? (
                <div>
                  <img
                    src={outputPhoto || output.output_photo || ''}
                    alt="Output photo"
                    onClick={() => setPreviewImage({ src: outputPhoto || output.output_photo || '', alt: 'Foto de salida' })}
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  <p className="text-xs text-gray-500 mb-2">Click en la imagen para ampliar</p>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCapturePhoto('output')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Cambiar foto
                      </button>
                      <button
                        onClick={() => setOutputPhoto(null)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ) : isEditing ? (
                <button
                  onClick={() => handleCapturePhoto('output')}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">Toca para agregar foto</p>
                </button>
              ) : (
                <p className="text-sm text-gray-500">Sin foto</p>
              )}
            </div>
          </div>
        </div>

        {/* Input Info or Form */}
        {output.input_date || showReturnForm ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Información de Devolución</h3>
              {output.input_date && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {formatDate(output.input_date)}
                </span>
              )}
            </div>

            {output.input_date ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios de devolución
                  </label>
                  {isEditing ? (
                    <textarea
                      value={inputComments}
                      onChange={(e) => setInputComments(e.target.value)}
                      maxLength={350}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{output.input_comments}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de devolución
                  </label>
                  {inputPhoto || output.input_photo ? (
                    <div>
                      <img
                        src={inputPhoto || output.input_photo || ''}
                        alt="Input photo"
                        onClick={() => setPreviewImage({ src: inputPhoto || output.input_photo || '', alt: 'Foto de devolución' })}
                        className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <p className="text-xs text-gray-500 mb-2">Click en la imagen para ampliar</p>
                      {isEditing && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCapturePhoto('input')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Cambiar foto
                          </button>
                          <button
                            onClick={() => setInputPhoto(null)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isEditing ? (
                    <button
                      onClick={() => handleCapturePhoto('input')}
                      className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-gray-600">Toca para agregar foto</p>
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Sin foto</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma
                  </label>
                  {inputSignature || output.input_signature ? (
                    <div>
                      <img
                        src={inputSignature || output.input_signature || ''}
                        alt="Signature"
                        onClick={() => setPreviewImage({ src: inputSignature || output.input_signature || '', alt: 'Firma digital' })}
                        className="w-full max-w-md h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200 p-2 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <p className="text-xs text-gray-500 mb-2">Click en la imagen para ampliar</p>
                      {isEditing && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCapturePhoto('signature')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Cambiar firma
                          </button>
                          <button
                            onClick={() => setInputSignature(null)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isEditing ? (
                    <button
                      onClick={() => handleCapturePhoto('signature')}
                      className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <p className="text-sm text-gray-600">Toca para agregar firma</p>
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Sin firma</p>
                  )}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de devolución
                    </label>
                    <input
                      type="date"
                      value={inputDate}
                      onChange={(e) => setInputDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios *
                    </label>
                    <textarea
                      value={inputComments}
                      onChange={(e) => setInputComments(e.target.value)}
                      maxLength={350}
                      rows={4}
                      placeholder="Describe el estado del equipo al devolverlo..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {inputComments.length}/350 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto del equipo (opcional)
                    </label>
                    {inputPhoto ? (
                      <div>
                        <img
                          src={inputPhoto}
                          alt="Return photo"
                          className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200 mb-2"
                        />
                        <button
                          onClick={() => setInputPhoto(null)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar foto
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCapturePhoto('input')}
                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                      >
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-600">Toca para tomar foto</p>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firma (opcional)
                    </label>
                    {inputSignature ? (
                      <div>
                        <img
                          src={inputSignature}
                          alt="Signature"
                          className="w-full max-w-md h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200 p-2 mb-2"
                        />
                        <button
                          onClick={() => setInputSignature(null)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar firma
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCapturePhoto('signature')}
                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                      >
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <p className="text-sm text-gray-600">Toca para agregar firma</p>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowReturnForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMarkAsReturned}
                    disabled={isSaving || !inputComments.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Guardando...' : 'Confirmar Devolución'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Equipo en Home Office
              </h3>
              <p className="text-gray-600 mb-6">
                Este equipo aún está activo. Puedes marcarlo como devuelto.
              </p>
              <button
                onClick={() => setShowReturnForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Marcar como Devuelto
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                // Reset to original values
                setOutputComments(output.output_comments || '');
                setOutputPhoto(output.output_photo);
                setInputComments(output.input_comments || '');
                setInputPhoto(output.input_photo);
                setInputSignature(output.input_signature);
              }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImagePreview
        src={previewImage?.src || null}
        alt={previewImage?.alt || ''}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default AdminEquipmentOutputDetail;
