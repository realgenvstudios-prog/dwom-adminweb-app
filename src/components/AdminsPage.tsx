import React, { useState, useEffect } from "react";
import adminsService, { type Admin, type AdminMetrics, type AdminActivity, type AdminAccessAlert } from "../services/adminsService";

const roles = [
  "All",
  "Super Admin",
  "Operations",
  "Warehouse",
  "Riders",
  "Finance",
  "Marketing",
  "Support",
  "Viewer",
];
const statuses = ["All", "Active", "Pending", "Suspended"];

const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [alerts, setAlerts] = useState<AdminAccessAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", phone: "", role: "", zones: "" });
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const statusColors = {
    Active: "bg-green-100 text-green-700",
    Pending: "bg-gray-100 text-gray-700",
    Suspended: "bg-red-100 text-red-700",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [adminsData, metricsData, activityData, alertsData] = await Promise.all([
        adminsService.getAllAdmins(),
        adminsService.getAdminMetrics(),
        adminsService.getAdminActivity(),
        adminsService.getAccessAlerts(),
      ]);

      setAdmins(adminsData);
      setMetrics(metricsData);
      setActivity(activityData);
      setAlerts(alertsData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = admins.filter((a) =>
    (roleFilter === "All" || a.role === roleFilter) &&
    (statusFilter === "All" || a.status === statusFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search))
  );
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminsService.inviteAdmin({
        name: invite.name,
        email: invite.email,
        phone: invite.phone,
        role: invite.role,
        zones: invite.zones,
      });
      setShowModal(false);
      setInvite({ name: "", email: "", phone: "", role: "", zones: "" });
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to invite admin:", error);
      alert("Failed to invite admin");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admins & Access Control</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 py-2 shadow-sm transition"
              onClick={() => setShowModal(true)}
            >
              Invite Admin
            </button>
            <select
              className="border rounded-lg px-4 py-2 min-w-[140px] text-base"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            >
              {roles.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select
              className="border rounded-lg px-4 py-2 min-w-[120px] text-base"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              className="border rounded-lg px-4 py-2 min-w-[200px] flex-1 text-base"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading admins...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Admins Table */}
            <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Admin Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Phone</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 pr-4 font-medium">Zones Assigned</th>
                      <th className="py-2 pr-4 font-medium">Last Login</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((a) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-blue-50 transition">
                        <td className="py-2 pr-4 font-medium">{a.name}</td>
                        <td className="py-2 pr-4">{a.email}</td>
                        <td className="py-2 pr-4">{a.phone}</td>
                        <td className="py-2 pr-4">{a.role}</td>
                        <td className="py-2 pr-4">{a.zones}</td>
                        <td className="py-2 pr-4">{a.lastLogin}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[a.status as keyof typeof statusColors]}`}>{a.status}</span>
                        </td>
                        <td className="py-2 pr-4 flex gap-2">
                          <button className="text-blue-600 hover:underline text-xs" onClick={() => console.log('View', a)}>View</button>
                          <button className="text-gray-600 hover:underline text-xs" onClick={() => console.log('Edit', a)}>Edit</button>
                          <button className="text-red-500 hover:underline text-xs" onClick={() => console.log('Disable', a)}>Disable</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  Rows per page: <span className="font-medium">{rowsPerPage}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Summary & Activity */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Role Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Role Summary</h3>
              <div className="space-y-2">
                {metrics && Object.entries(metrics.roleCounts).map(([role, count]) => (
                  <button
                    key={role}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded hover:bg-blue-50 transition text-sm ${roleFilter === role ? 'bg-blue-100 font-semibold' : ''}`}
                    onClick={() => { setRoleFilter(role); setPage(1); }}
                  >
                    <span>{role}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">{count}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Recent Admin Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Admin Activity</h3>
              <div className="space-y-3 text-sm text-gray-700">
                {activity.length > 0 ? (
                  activity.map((a, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs text-gray-400 min-w-[80px]">{a.time}</span>
                      <span>{a.text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-xs">No activity yet</p>
                )}
              </div>
            </div>
            {/* Access Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Access Alerts</h3>
              <ul className="space-y-2 text-sm">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <li key={alert.id} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400 inline-block"></span>
                      <span className="text-gray-700">{alert.message}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-xs">No alerts</p>
                )}
              </ul>
            </div>
          </div>
          </div>
        )}
        {/* Invite Admin Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold mb-4">Invite Admin</h2>
              <form
                className="space-y-4"
                onSubmit={handleInvite}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full"
                    value={invite.name}
                    onChange={e => setInvite({ ...invite, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full"
                    type="email"
                    value={invite.email}
                    onChange={e => setInvite({ ...invite, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full"
                    value={invite.phone}
                    onChange={e => setInvite({ ...invite, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    className="border rounded-lg px-4 py-2 w-full"
                    value={invite.role}
                    onChange={e => setInvite({ ...invite, role: e.target.value })}
                    required
                  >
                    <option value="">Select role…</option>
                    {roles.filter(r => r !== "All").map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zones</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full"
                    value={invite.zones}
                    onChange={e => setInvite({ ...invite, zones: e.target.value })}
                    placeholder="e.g. East Legon, Airport"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminsPage;
