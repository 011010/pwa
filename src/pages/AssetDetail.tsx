import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assetsService } from '../services/assetsService';
import { equipmentService } from '../services/equipmentService';
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
      } catch (error) {
        console.error('Failed to fetch asset:', error);
        setAsset(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAsset();
  }, [id, isEquipmentRoute]);

  const handleUpdate = async () => {
    if (!asset) return;
    try {
      if (isOnline) {
        await assetsService.updateAsset(asset.id, formData);
      } else {
        await queueOperation('update', asset.id, formData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !asset) return;
    try {
      if (isOnline) {
        await assetsService.uploadAssetPhoto(asset.id, file);
      } else {
        await queueOperation('photo', asset.id, { file });
      }
      setShowPhoto(false);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  const handleSignatureSave = async (signature: string) => {
    if (!asset) return;
    const signatureData = {
      signature,
      signed_by: 'Current User',
      signed_at: new Date().toISOString(),
      action: 'received',
    };
    try {
      if (isOnline) {
        await assetsService.uploadAssetSignature(asset.id, signatureData);
      } else {
        await queueOperation('signature', asset.id, signatureData);
      }
      setShowSignature(false);
    } catch (error) {
      console.error('Failed to save signature:', error);
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
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
            <span className="flex-1 text-left">Add Photo</span>
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
            <span className="flex-1 text-left">Digital Signature</span>
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
