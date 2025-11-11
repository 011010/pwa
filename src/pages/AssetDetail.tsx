import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { assetsService } from '../services/assetsService';
import { equipmentService } from '../services/equipmentService';
import { storageService, type StoredPhoto, type StoredSignature } from '../services/storageService';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { SignaturePad } from '../components/SignaturePad';
import { BottomNav } from '../components/BottomNav';
import type { Asset, AssetStatus, EquipmentAssignment } from '../types';

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { queueOperation, isOnline } = useOfflineQueue();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [signatures, setSignatures] = useState<StoredSignature[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ status: AssetStatus; location: string; comments: string }>({
    status: 'available',
    location: '',
    comments: ''
  });

  // Determine if we're viewing equipment assignment or regular asset
  const isEquipmentRoute = location.pathname.startsWith('/equipment/');

  // Convert EquipmentAssignment to Asset format
  const convertEquipmentToAsset = (assignment: EquipmentAssignment): Asset => {
    const hasAssignment = assignment.metadata?.employee_name &&
                         assignment.metadata?.employee_name.trim() !== '' &&
                         assignment.metadata?.employee_name !== 'N/A';
    const isRetired = assignment.metadata?.equipment_status === 'BAJAS';

    let status: AssetStatus = 'available';
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
        name: assignment.metadata?.employee_name || '',
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

  /**
   * Fetch asset data and load photos/signatures
   */
  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        if (isEquipmentRoute) {
          // Fetch from equipment-assignments endpoint
          const equipmentData = await equipmentService.getEquipmentAssignmentById(Number(id));
          const assetData = convertEquipmentToAsset(equipmentData);
          setAsset(assetData);
          setFormData({ status: assetData.status, location: assetData.location, comments: assetData.comments || '' });
        } else {
          // Fetch from regular assets endpoint
          const data = await assetsService.getAssetById(Number(id));
          setAsset(data);
          setFormData({ status: data.status, location: data.location, comments: data.comments || '' });
        }

        // Load photos and signatures from local storage
        const loadedPhotos = await storageService.getPhotos(Number(id));
        const loadedSignatures = await storageService.getSignatures(Number(id));
        setPhotos(loadedPhotos);
        setSignatures(loadedSignatures);
      } catch (error) {
        console.error('[AssetDetail] Failed to fetch asset:', error);
        setAsset(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAsset();
  }, [id, isEquipmentRoute]);

  /**
   * Show success message with auto-hide
   */
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * Show error message with auto-hide
   */
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleUpdate = async () => {
    if (!asset) return;
    try {
      if (isOnline) {
        await assetsService.updateAsset(asset.id, formData);
      } else {
        await queueOperation('update', asset.id, formData);
      }
      setIsEditing(false);
      showSuccess('Asset updated successfully');
    } catch (error) {
      console.error('[AssetDetail] Failed to update asset:', error);
      showError('Failed to update asset');
    }
  };

  /**
   * Handle photo capture and save to IndexedDB
   */
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !asset) return;

    try {
      // Save photo to IndexedDB
      const savedPhoto = await storageService.savePhoto(asset.id, file);

      // Update local state
      setPhotos(prev => [...prev, savedPhoto]);

      // Close modal
      setShowPhoto(false);

      // Show success message
      showSuccess('Photo saved successfully');

      // Try to upload to server if online
      if (isOnline) {
        try {
          await assetsService.uploadAssetPhoto(asset.id, file);
          await storageService.markPhotoAsUploaded(savedPhoto.id);
          console.log('[AssetDetail] Photo uploaded to server');
        } catch (uploadError) {
          console.error('[AssetDetail] Failed to upload photo to server:', uploadError);
          // Photo is still saved locally, no need to show error
        }
      } else {
        await queueOperation('photo', asset.id, { file });
      }
    } catch (error) {
      console.error('[AssetDetail] Failed to save photo:', error);
      showError('Failed to save photo');
    }
  };

  /**
   * Handle signature save to IndexedDB
   */
  const handleSignatureSave = async (signature: string) => {
    if (!asset) return;

    try {
      // Save signature to IndexedDB
      const savedSignature = await storageService.saveSignature(
        asset.id,
        signature,
        'Current User', // TODO: Get from auth context
        'received'
      );

      // Update local state
      setSignatures(prev => [...prev, savedSignature]);

      // Close modal
      setShowSignature(false);

      // Show success message
      showSuccess('Signature saved successfully');

      // Try to upload to server if online
      if (isOnline) {
        try {
          const signatureData = {
            signature,
            signed_by: 'Current User',
            signed_at: new Date().toISOString(),
            action: 'received',
          };
          await assetsService.uploadAssetSignature(asset.id, signatureData);
          await storageService.markSignatureAsUploaded(savedSignature.id);
          console.log('[AssetDetail] Signature uploaded to server');
        } catch (uploadError) {
          console.error('[AssetDetail] Failed to upload signature to server:', uploadError);
          // Signature is still saved locally, no need to show error
        }
      } else {
        await queueOperation('signature', asset.id, { signature });
      }
    } catch (error) {
      console.error('[AssetDetail] Failed to save signature:', error);
      showError('Failed to save signature');
    }
  };

  /**
   * Delete photo from storage
   */
  const handleDeletePhoto = async (photoId: string) => {
    try {
      await storageService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      showSuccess('Photo deleted');
    } catch (error) {
      console.error('[AssetDetail] Failed to delete photo:', error);
      showError('Failed to delete photo');
    }
  };

  /**
   * Delete signature from storage
   */
  const handleDeleteSignature = async (signatureId: string) => {
    try {
      await storageService.deleteSignature(signatureId);
      setSignatures(prev => prev.filter(s => s.id !== signatureId));
      showSuccess('Signature deleted');
    } catch (error) {
      console.error('[AssetDetail] Failed to delete signature:', error);
      showError('Failed to delete signature');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Equipment not found</h2>
        <p className="text-gray-600 mb-4">The equipment you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => {
                // Navigate to appropriate page based on context
                const prevPath = location.state?.from;
                if (prevPath?.startsWith('/employee-equipment/')) {
                  navigate(prevPath);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="mr-3 p-2 -ml-2 text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
              <p className="text-sm text-gray-600 font-mono">{asset.code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {/* Asset Info Card */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Information</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-600">Model:</span> <span className="font-medium ml-2">{asset.model}</span></div>
            <div><span className="text-gray-600">Serial:</span> <span className="font-medium ml-2">{asset.serial_number}</span></div>
            <div><span className="text-gray-600">Category:</span> <span className="font-medium ml-2">{asset.category}</span></div>
            <div><span className="text-gray-600">Status:</span> <span className="font-medium ml-2">{asset.status}</span></div>
            <div><span className="text-gray-600">Location:</span> <span className="font-medium ml-2">{asset.location}</span></div>
            {asset.assigned_to && (
              <div><span className="text-gray-600">Assigned to:</span> <span className="font-medium ml-2">{asset.assigned_to.name}</span></div>
            )}
          </div>
        </div>

        {/* Photos Section */}
        {photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-lg font-semibold mb-4">Photos ({photos.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.dataUrl}
                    alt="Equipment photo"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(photo.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures Section */}
        {signatures.length > 0 && (
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-lg font-semibold mb-4">Signatures ({signatures.length})</h2>
            <div className="space-y-4">
              {signatures.map((signature) => (
                <div key={signature.id} className="border rounded-lg p-4 relative group">
                  <img
                    src={signature.dataUrl}
                    alt="Signature"
                    className="w-full h-32 object-contain bg-gray-50 rounded"
                  />
                  <button
                    onClick={() => handleDeleteSignature(signature.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Signed by: {signature.signedBy}</p>
                    <p>Date: {new Date(signature.signedAt).toLocaleString()}</p>
                    <p>Action: {signature.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-lg font-semibold mb-4">Update Asset</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comments</label>
                <textarea value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions - Enhanced button visibility with better styling */}
        <div className="bg-white rounded-lg shadow-soft p-4 space-y-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors border border-blue-200"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="flex-1 text-left">Edit Asset Information</span>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setShowPhoto(true)}
            className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors border border-green-200"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1 text-left">Add Photo {photos.length > 0 && `(${photos.length})`}</span>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setShowSignature(true)}
            className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg transition-colors border border-purple-200"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="flex-1 text-left">Digital Signature {signatures.length > 0 && `(${signatures.length})`}</span>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg h-96">
            <SignaturePad onSave={handleSignatureSave} onClear={() => setShowSignature(false)} />
          </div>
        </div>
      )}

      {/* Photo Input Modal - Enhanced styling */}
      {showPhoto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Capture Photo</h3>
              <button
                onClick={() => setShowPhoto(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-600">Click to capture photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </label>
            </div>
            <button
              onClick={() => setShowPhoto(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AssetDetail;
