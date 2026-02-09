import React, { useState, useEffect, useRef } from "react";
import apiClient from "../services/apiClient";

interface DeletionRequest {
  id: number;
  phoneNumber: string;
  email: string;
  reason?: string;
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  scheduledDeletionDate?: string;
  completedAt?: string;
  notes?: string;
  approvedBy?: string;
}

const DataDeletionRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionType, setActionType] = useState<'approve' | 'verify' | 'complete' | 'reject' | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchDeletionRequests();
  }, []);

  const fetchDeletionRequests = async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🗑️ [DeletionRequests] Fetching deletion requests...');
      
      const response = await apiClient.get<DeletionRequest[]>('/account/deletion-requests');
      console.log('🗑️ [DeletionRequests] Response:', response);
      
      if (!Array.isArray(response)) {
        console.error('❌ [DeletionRequests] Expected array, got:', typeof response);
        setError('Invalid response from server');
        setRequests([]);
        return;
      }

      console.log(`✅ [DeletionRequests] Fetched ${response.length} requests`);
      setRequests(response);
    } catch (err: any) {
      console.error('❌ [DeletionRequests] Error:', err);
      setError(err.message || 'Failed to fetch deletion requests');
      setRequests([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleActionClick = (request: DeletionRequest, type: 'approve' | 'verify' | 'complete' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes("");
    setShowModal(true);
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setLoading(true);
      
      const endpoint = `/account/deletion-requests/${selectedRequest.id}/${actionType}`;
      const payload = {
        notes: adminNotes,
        actionDate: new Date().toISOString(),
      };

      console.log(`🔄 [DeletionRequests] ${actionType}ing request:`, payload);
      
      const response = await apiClient.put<DeletionRequest>(endpoint, payload);
      
      console.log(`✅ [DeletionRequests] Request ${actionType}ed:`, response);
      
      // Update the request in the list
      setRequests(requests.map(r => r.id === response.id ? response : r));
      
      setShowModal(false);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
      
      // Refresh the list
      fetchDeletionRequests();
    } catch (err: any) {
      console.error('❌ [DeletionRequests] Error updating request:', err);
      setError(err.message || `Failed to ${actionType} request`);
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColors: Record<string, string> = {
    "PENDING": "bg-yellow-100 text-yellow-700",
    "VERIFIED": "bg-blue-100 text-blue-700",
    "APPROVED": "bg-purple-100 text-purple-700",
    "COMPLETED": "bg-green-100 text-green-700",
    "REJECTED": "bg-red-100 text-red-700"
  };

  const statusLabels: Record<string, string> = {
    "PENDING": "Pending Verification",
    "VERIFIED": "Verified",
    "APPROVED": "Approved for Deletion",
    "COMPLETED": "Completed",
    "REJECTED": "Rejected"
  };

  const filtered = requests.filter(r =>
    (selectedStatus === "All" || r.status === selectedStatus) &&
    (r.phoneNumber.includes(search) ||
      r.email.toLowerCase().includes(search.toLowerCase()))
  );

  const statusOptions = ["PENDING", "VERIFIED", "APPROVED", "COMPLETED", "REJECTED", "All"];

  const getStatusBadgeClass = (status: string) => {
    return `inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const getActionButtons = (request: DeletionRequest) => {
    const buttons = [];

    if (request.status === 'PENDING') {
      buttons.push(
        <button
          key="verify"
          onClick={() => handleActionClick(request, 'verify')}
          className="px-3 py-1 text-xs font-semibold rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors mr-2"
        >
          Verify
        </button>,
        <button
          key="reject"
          onClick={() => handleActionClick(request, 'reject')}
          className="px-3 py-1 text-xs font-semibold rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Reject
        </button>
      );
    }

    if (request.status === 'VERIFIED') {
      buttons.push(
        <button
          key="approve"
          onClick={() => handleActionClick(request, 'approve')}
          className="px-3 py-1 text-xs font-semibold rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        >
          Approve
        </button>
      );
    }

    if (request.status === 'APPROVED') {
      buttons.push(
        <button
          key="complete"
          onClick={() => handleActionClick(request, 'complete')}
          className="px-3 py-1 text-xs font-semibold rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          Mark Complete
        </button>
      );
    }

    return buttons.length > 0 ? buttons : <span className="text-gray-500 text-xs">No actions</span>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Deletion Requests</h1>
        <p className="text-gray-600">Manage user account and data deletion requests</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search by Phone or Email
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={fetchDeletionRequests}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm font-semibold">Total Requests</p>
          <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm font-semibold">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{requests.filter(r => r.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm font-semibold">Approved</p>
          <p className="text-3xl font-bold text-purple-600">{requests.filter(r => r.status === 'APPROVED').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm font-semibold">Completed</p>
          <p className="text-3xl font-bold text-green-600">{requests.filter(r => r.status === 'COMPLETED').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm font-semibold">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{requests.filter(r => r.status === 'REJECTED').length}</p>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading deletion requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">No deletion requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Requested On</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Scheduled Deletion</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((request, index) => (
                  <tr key={request.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm text-gray-900">{request.phoneNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{request.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.requestedAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getStatusBadgeClass(request.status)}>
                        {statusLabels[request.status] || request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {request.scheduledDeletionDate ? formatDate(request.scheduledDeletionDate) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getActionButtons(request)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Actions */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {actionType === 'verify' && 'Verify Request'}
              {actionType === 'approve' && 'Approve Deletion'}
              {actionType === 'complete' && 'Mark as Complete'}
              {actionType === 'reject' && 'Reject Request'}
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600"><strong>Phone:</strong> {selectedRequest.phoneNumber}</p>
              <p className="text-sm text-gray-600"><strong>Email:</strong> {selectedRequest.email}</p>
              <p className="text-sm text-gray-600"><strong>Requested:</strong> {formatDate(selectedRequest.requestedAt)}</p>
              {selectedRequest.reason && (
                <p className="text-sm text-gray-600"><strong>Reason:</strong> {selectedRequest.reason}</p>
              )}
            </div>

            <textarea
              placeholder="Add notes about this action (optional)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none mb-4 resize-none"
              rows={3}
            />

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDeletionRequestsPage;
