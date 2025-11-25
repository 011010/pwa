/**
 * Home Office Detail Component
 *
 * Shows equipment output details and allows marking as returned with photo and signature.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { equipmentOutputService } from '../services/equipmentOutputService';
import type { EquipmentOutput } from '../types';

export const HomeOfficeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [output, setOutput] = useState<EquipmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Return form
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputComments, setInputComments] = useState('');
  const [inputPhoto, setInputPhoto] = useState<string | null>(null);
  const [inputSignature, setInputSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setOutput(data);
    } catch (err: any) {
      console.error('Failed to fetch equipment output:', err);
      setError(err.message || 'Failed to load equipment output');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoCapture = () => {
    photoInputRef.current?.click();
  };

  const handleSignatureCapture = () => {
    signatureInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setInputPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setInputSignature(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReturn = async () => {
    if (!inputComments.trim()) {
      alert('Por favor agrega comentarios');
      return;
    }

    if (!id) return;

    try {
      setIsSubmitting(true);
      await equipmentOutputService.updateEquipmentOutput(parseInt(id), {
        input_date: inputDate,
        input_comments: inputComments,
        input_photo: inputPhoto || '',
        input_signature: inputSignature || undefined
      });

      alert('¡Equipo marcado como devuelto exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to mark as returned:', err);
      alert(err.message || 'Error al marcar como devuelto');
    } finally {
      setIsSubmitting(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept="image/*"
        onChange={handleSignatureChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white">
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
              <h1 className="text-2xl font-bold">Detalle Home Office</h1>
              <p className="text-purple-100 text-sm">
                {output.is_active ? 'Activo' : 'Devuelto'}
              </p>
            </div>
          </div>

          {/* Equipment Info Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">{output.equipment.name}</h2>
            <div className="space-y-1 text-sm text-purple-100">
              <p>Serial: {output.equipment.serial_number}</p>
              <p>Modelo: {output.equipment.model}</p>
              <p>Marca: {output.equipment.brand}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Output Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Información de Salida</h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Fecha de salida:</p>
              <p className="font-medium text-gray-900">{formatDate(output.output_date)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Comentarios:</p>
              <p className="text-gray-900">{output.output_comments}</p>
            </div>

            {output.output_photo && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Foto de salida:</p>
                <img
                  src={output.output_photo}
                  alt="Output photo"
                  className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Return Info or Form */}
        {output.input_date ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Información de Devolución</h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Fecha de devolución:</p>
                <p className="font-medium text-gray-900">{formatDate(output.input_date)}</p>
              </div>

              {output.input_comments && (
                <div>
                  <p className="text-sm text-gray-500">Comentarios:</p>
                  <p className="text-gray-900">{output.input_comments}</p>
                </div>
              )}

              {output.input_photo && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Foto de devolución:</p>
                  <img
                    src={output.input_photo}
                    alt="Input photo"
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              {output.input_signature && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Firma:</p>
                  <img
                    src={output.input_signature}
                    alt="Signature"
                    className="w-full max-w-md h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200 p-2"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {!showReturnForm ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-purple-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Equipo en Home Office
                </h3>
                <p className="text-gray-600 mb-6">
                  Este equipo aún está activo. ¿Deseas marcarlo como devuelto?
                </p>
                <button
                  onClick={() => setShowReturnForm(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Marcar como Devuelto
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Devolución</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de devolución
                    </label>
                    <input
                      type="date"
                      value={inputDate}
                      onChange={(e) => setInputDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        onClick={handlePhotoCapture}
                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors"
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
                        onClick={handleSignatureCapture}
                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors"
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
                    onClick={handleSubmitReturn}
                    disabled={isSubmitting || !inputComments.trim()}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Guardando...' : 'Confirmar Devolución'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeOfficeDetail;
