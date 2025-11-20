/**
 * My Equipment Detail Page
 *
 * Shows equipment output details and allows uploading photos on specific dates:
 * - Output photos: Only on output_date (equipment leaving for home office)
 * - Input photos: Only on input_date (equipment returning to office)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { equipmentOutputService } from '../services/equipmentOutputService';
import type { EquipmentOutput } from '../types';

interface EquipmentPhoto {
  id: string;
  type: 'output' | 'input';
  dataUrl: string;
  uploadedAt: string;
  uploaded: boolean;
}

export const MyEquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [output, setOutput] = useState<EquipmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Photos
  const [outputPhotos, setOutputPhotos] = useState<EquipmentPhoto[]>([]);
  const [inputPhotos, setInputPhotos] = useState<EquipmentPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoType, setPhotoType] = useState<'output' | 'input' | null>(null);

  useEffect(() => {
    if (id) {
      fetchDetail();
      loadPhotos();
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

  const loadPhotos = () => {
    if (!id) return;

    // Load photos from localStorage (simpler than IndexedDB for now)
    const storedPhotos = localStorage.getItem(`equipment_output_photos_${id}`);
    if (storedPhotos) {
      try {
        const photos: EquipmentPhoto[] = JSON.parse(storedPhotos);
        setOutputPhotos(photos.filter(p => p.type === 'output'));
        setInputPhotos(photos.filter(p => p.type === 'input'));
      } catch (err) {
        console.error('Failed to parse photos:', err);
      }
    }
  };

  const savePhotos = (photos: EquipmentPhoto[]) => {
    if (!id) return;
    localStorage.setItem(`equipment_output_photos_${id}`, JSON.stringify(photos));
  };

  const canUploadOutputPhoto = (): boolean => {
    if (!output) return false;
    const today = new Date().toISOString().split('T')[0];
    const outputDate = new Date(output.output_date).toISOString().split('T')[0];
    return today === outputDate;
  };

  const canUploadInputPhoto = (): boolean => {
    if (!output || !output.input_date) return false;
    const today = new Date().toISOString().split('T')[0];
    const inputDate = new Date(output.input_date).toISOString().split('T')[0];
    return today === inputDate;
  };

  const handlePhotoCapture = (type: 'output' | 'input') => {
    setPhotoType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !photoType || !id) return;

    try {
      setUploadingPhoto(true);

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        const newPhoto: EquipmentPhoto = {
          id: `photo_${id}_${photoType}_${Date.now()}`,
          type: photoType,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploaded: false,
        };

        // Add to appropriate list
        const allPhotos = [...outputPhotos, ...inputPhotos, newPhoto];
        if (photoType === 'output') {
          setOutputPhotos([...outputPhotos, newPhoto]);
        } else {
          setInputPhotos([...inputPhotos, newPhoto]);
        }

        // Save to localStorage
        savePhotos(allPhotos);

        // TODO: Upload to server
        alert(`Foto de ${photoType === 'output' ? 'salida' : 'entrada'} guardada correctamente`);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to save photo:', err);
      alert('Error al guardar la foto');
    } finally {
      setUploadingPhoto(false);
      setPhotoType(null);
      if (event.target) event.target.value = '';
    }
  };

  const handleDeletePhoto = (photoId: string, type: 'output' | 'input') => {
    if (!window.confirm('¿Eliminar esta foto?')) return;

    if (type === 'output') {
      const updated = outputPhotos.filter(p => p.id !== photoId);
      setOutputPhotos(updated);
      savePhotos([...updated, ...inputPhotos]);
    } else {
      const updated = inputPhotos.filter(p => p.id !== photoId);
      setInputPhotos(updated);
      savePhotos([...outputPhotos, ...updated]);
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
        minute: '2-digit',
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
            onClick={() => navigate('/my-equipment')}
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
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/my-equipment')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Detalle de Equipo</h1>
              <p className="text-purple-100 text-sm">Home Office</p>
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
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className={`p-4 rounded-lg ${output.is_active ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              output.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
            }`}>
              {output.is_active ? 'En Home Office' : 'Devuelto'}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Fecha de salida:</span>{' '}
              <span className="text-gray-900">{formatDate(output.output_date)}</span>
            </div>
            {output.input_date && (
              <div>
                <span className="font-medium text-gray-700">Fecha de devolución:</span>{' '}
                <span className="text-gray-900">{formatDate(output.input_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Output Comments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Comentarios de Salida</h3>
          <p className="text-gray-700 text-sm">{output.output_comments}</p>
        </div>

        {/* Input Comments */}
        {output.input_comments && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Comentarios de Devolución</h3>
            <p className="text-gray-700 text-sm">{output.input_comments}</p>
          </div>
        )}

        {/* Output Photos Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Fotos de Salida ({outputPhotos.length})</h3>
            {canUploadOutputPhoto() && (
              <button
                onClick={() => handlePhotoCapture('output')}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tomar Foto
              </button>
            )}
          </div>

          {!canUploadOutputPhoto() && output.is_active && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Las fotos de salida solo pueden subirse el día de la salida ({new Date(output.output_date).toLocaleDateString('es-ES')})
              </p>
            </div>
          )}

          {outputPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {outputPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.dataUrl}
                    alt="Foto de salida"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id, 'output')}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(photo.uploadedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No hay fotos de salida</p>
            </div>
          )}
        </div>

        {/* Input Photos Section */}
        {output.input_date && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Fotos de Entrada ({inputPhotos.length})</h3>
              {canUploadInputPhoto() && (
                <button
                  onClick={() => handlePhotoCapture('input')}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tomar Foto
                </button>
              )}
            </div>

            {!canUploadInputPhoto() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Las fotos de entrada solo pueden subirse el día de la devolución ({new Date(output.input_date).toLocaleDateString('es-ES')})
                </p>
              </div>
            )}

            {inputPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {inputPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt="Foto de entrada"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id, 'input')}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.uploadedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No hay fotos de entrada</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEquipmentDetail;
