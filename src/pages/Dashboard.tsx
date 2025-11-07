import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { equipmentService } from '../services/equipmentService';
import { AssetCard } from '../components/AssetCard';
import { BottomNav } from '../components/BottomNav';
import type { EquipmentAssignment, Asset } from '../types';

type StatusFilter = 'all' | 'in_use' | 'available' | 'retired';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing } = useOfflineQueue();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [allCounts, setAllCounts] = useState({ all: 0, in_use: 0, available: 0, retired: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch all equipment counts on mount
   * Uses pagination with API's maximum allowed per_page value (100)
   * to efficiently count all equipment across multiple requests
   */
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // First, make a request with per_page=1 to get the total count from meta
        const initialResponse = await equipmentService.getEquipmentAssignments({
          per_page: 1,
          page: 1,
        });

        const totalRecords = initialResponse.meta?.total || 0;

        // If there are no records, set all counts to 0
        if (totalRecords === 0) {
          setAllCounts({ all: 0, in_use: 0, available: 0, retired: 0 });
          return;
        }

        // API has a maximum per_page limit of 100
        // We'll fetch all pages concurrently for better performance
        const perPageLimit = 100;
        let allEquipment: EquipmentAssignment[] = [];

        // Calculate how many requests we need
        const totalPages = Math.ceil(totalRecords / perPageLimit);

        console.log(`[Dashboard] Fetching ${totalRecords} records across ${totalPages} pages...`);

        // Fetch all pages concurrently for better performance
        const fetchPromises = [];
        for (let page = 1; page <= totalPages; page++) {
          fetchPromises.push(
            equipmentService.getEquipmentAssignments({
              per_page: perPageLimit,
              page: page,
            })
          );
        }

        // Wait for all requests to complete
        const responses = await Promise.all(fetchPromises);

        // Combine all data
        responses.forEach((response) => {
          allEquipment = allEquipment.concat(response.data);
        });

        console.log(`[Dashboard] Fetched ${allEquipment.length} equipment records`);

        // Calculate counts based on assignment status
        const counts = {
          all: totalRecords, // Use the total from meta for accuracy
          in_use: 0, // Has employee_name/email (assigned)
          available: 0, // No employee_name/email (not assigned)
          retired: 0, // Status BAJAS
        };

        // Count each category
        allEquipment.forEach((assignment) => {
          const hasAssignment = assignment.metadata?.employee_name &&
                                assignment.metadata?.employee_name.trim() !== '' &&
                                assignment.metadata?.employee_name !== 'N/A';
          const status = assignment.metadata?.equipment_status;

          if (status === 'BAJAS') {
            counts.retired++;
          } else if (hasAssignment) {
            counts.in_use++;
          } else {
            counts.available++;
          }
        });

        setAllCounts(counts);
        console.log('[Dashboard] Equipment counts loaded:', counts);
      } catch (error) {
        console.error('[Dashboard] Failed to fetch equipment counts:', error);
        // Set counts to 0 on error to avoid showing incorrect data
        setAllCounts({ all: 0, in_use: 0, available: 0, retired: 0 });
      }
    };

    fetchCounts();
  }, []);

  /**
   * Fetch assignments based on filter, page, and search query
   * Uses server-side search to query across all pages when searching
   */
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Build query parameters
        const params: any = {
          per_page: 50,
          page: currentPage,
        };

        // If there's a search query, add it to params
        // This will search across ALL pages on the server
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
          console.log(`[Dashboard] Searching for: "${searchQuery.trim()}"`);
        }

        // If filtering by retired, use status parameter
        if (statusFilter === 'retired') {
          params.status = 'BAJAS';
        }

        // Get equipment assignments
        const response = await equipmentService.getEquipmentAssignments(params);

        // Filter client-side based on assignment status
        // (only when not searching, as search returns all matches)
        let filteredData = response.data;

        if (!searchQuery.trim()) {
          // Only apply client-side filtering when not searching
          if (statusFilter === 'in_use') {
            // In use = has employee_name/email AND not retired
            filteredData = response.data.filter(
              (a) => a.metadata?.employee_name &&
                     a.metadata?.employee_name.trim() !== '' &&
                     a.metadata?.employee_name !== 'N/A' &&
                     a.metadata?.equipment_status !== 'BAJAS'
            );
          } else if (statusFilter === 'available') {
            // Available = no employee_name/email AND not retired
            filteredData = response.data.filter(
              (a) => (!a.metadata?.employee_name ||
                      a.metadata?.employee_name.trim() === '' ||
                      a.metadata?.employee_name === 'N/A') &&
                     a.metadata?.equipment_status !== 'BAJAS'
            );
          }
          // For 'all' and 'retired', use API response as-is
        } else {
          // When searching, show all results regardless of filter
          // The search already returns relevant matches
          console.log(`[Dashboard] Found ${filteredData.length} search results`);
        }

        setAssignments(filteredData);

        // Set pagination info from meta
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1);
        }
      } catch (error: any) {
        console.error('[Dashboard] Failed to fetch equipment assignments:', error);

        // Show detailed error message
        const errorMsg = error.errors
          ? `Validation error: ${JSON.stringify(error.errors)}`
          : error.message || 'Failed to load equipment';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [statusFilter, currentPage, searchQuery]); // Re-fetch when filter, page, or search changes

  // Reset to page 1 when filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Convert EquipmentAssignment to Asset format for AssetCard
  const convertToAsset = (assignment: EquipmentAssignment): Asset => {
    // Determine status based on assignment using employee_name from metadata
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
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
          <div className="flex items-center gap-2 text-sm">
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

          {/* Search */}
          <div className="relative mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filters */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('in_use')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === 'in_use'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Use ({allCounts.in_use})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Available ({allCounts.available})
            </button>
            <button
              onClick={() => setStatusFilter('retired')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === 'retired'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Retired ({allCounts.retired})
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
        ) : assignments.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <AssetCard
                  key={assignment.id}
                  asset={convertToAsset(assignment)}
                  onClick={() => navigate(`/equipment/${assignment.id}`)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <span className="ml-4 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-600">{searchQuery ? 'Try adjusting your search' : 'No active assignments'}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
