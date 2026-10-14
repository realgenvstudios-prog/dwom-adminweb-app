import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminApiClient from "../services/apiClient";
import adminsService from "../services/adminsService";
import supportService from "../services/supportService";
import { logger } from "../utils/logger";

interface DeletionRequest {
  status: string;
}

interface AttentionRow {
  label: string;
  count: number;
  path: string;
}

interface NeedsAttentionCardProps {
  outOfStockProducts: number;
}

// Replaces Quick Actions — that card was four buttons that just
// navigated to pages already one click away in the sidebar, with no
// pre-filled state. This instead answers the question the sidebar
// can't: is there anything actually waiting on someone right now,
// pulled from across Support, Data Deletion Requests, Admins, and
// Catalog. Also absorbs what used to be the separate Inventory Alerts
// card's job, now reading the real stockStatus signal instead of the
// Inventory.quantity one (see dashboardService.getProductStats).
const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({ outOfStockProducts }) => {
  const navigate = useNavigate();
  const [pendingDeletions, setPendingDeletions] = useState(0);
  const [openSupportTickets, setOpenSupportTickets] = useState(0);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttentionCounts();
  }, []);

  const fetchAttentionCounts = async () => {
    try {
      setLoading(true);

      const [deletionResult, supportMetrics, adminMetrics] = await Promise.allSettled([
        adminApiClient.get<DeletionRequest[]>('/account/deletion-requests'),
        supportService.getSupportMetrics(),
        adminsService.getAdminMetrics(),
      ]);

      if (deletionResult.status === 'fulfilled') {
        const requests = Array.isArray(deletionResult.value) ? deletionResult.value : [];
        setPendingDeletions(requests.filter((r) => r.status === 'PENDING').length);
      } else {
        logger.error('❌ [NeedsAttentionCard] Failed to fetch deletion requests:', deletionResult.reason);
      }

      if (supportMetrics.status === 'fulfilled') {
        setOpenSupportTickets(supportMetrics.value.openTickets + supportMetrics.value.escalatedTickets);
      } else {
        logger.error('❌ [NeedsAttentionCard] Failed to fetch support metrics:', supportMetrics.reason);
      }

      if (adminMetrics.status === 'fulfilled') {
        setPendingInvites(adminMetrics.value.pendingAdmins);
      } else {
        logger.error('❌ [NeedsAttentionCard] Failed to fetch admin metrics:', adminMetrics.reason);
      }
    } finally {
      setLoading(false);
    }
  };

  const rows: AttentionRow[] = [
    { label: 'Open/escalated support tickets', count: openSupportTickets, path: '/support' },
    { label: 'Products out of stock', count: outOfStockProducts, path: '/catalog' },
    { label: 'Pending data deletion requests', count: pendingDeletions, path: '/data-deletion-requests' },
    { label: 'Pending admin invites', count: pendingInvites, path: '/admins' },
  ].filter((row) => row.count > 0);

  return (
    <div className="bg-white rounded-xl shadow p-6 border">
      <h3 className="text-lg font-semibold mb-4">Needs Attention</h3>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.path}>
              <button
                onClick={() => navigate(row.path)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm text-gray-700">{row.label}</span>
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">{row.count}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Nothing needs attention right now.</p>
      )}
    </div>
  );
};

export default NeedsAttentionCard;
