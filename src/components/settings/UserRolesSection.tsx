import SaveButton from "./SaveButton";

interface UserRolesSectionProps {
  adminUsers: Array<{ name: string; email: string; role: string; lastActive: string }>;
  roleTemplates: string[];
  permissionsMatrix: Array<{ role: string; permissions: string[] }>;
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

// User & Roles Management — admin user list, role templates, and
// permissions matrix are UI-only mock data (not backend-synced). Split
// out of the former monolithic SettingsPage.
export default function UserRolesSection({
  adminUsers,
  roleTemplates,
  permissionsMatrix,
  saving, settingsLoaded, onSave,
}: UserRolesSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-semibold mb-2">User & Roles Management</h2>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-medium">Admin Users</span>
          {/* <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold" onClick={handleAddAdmin}>Add Admin</button> */}
        </div>
        <table className="min-w-full text-left text-sm mb-2">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((a, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium">{a.name}</td>
                <td className="py-2 pr-4">{a.email}</td>
                <td className="py-2 pr-4">{a.role}</td>
                <td className="py-2 pr-4">{a.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Role Templates:</span>
          {roleTemplates.map(r => (
            <span key={r} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">{r}</span>
          ))}
          {/* <button className="ml-auto px-4 py-2 rounded bg-blue-100 text-blue-700 text-sm font-medium" onClick={handleManageRoles}>Manage Roles</button> */}
        </div>
        {/* Permissions Matrix Modal (UI only) */}
        <div className="mt-4">
          <span className="text-sm font-medium mb-2 block">Permissions Matrix</span>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {permissionsMatrix.map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 border font-semibold">{row.role}</td>
                    <td className="p-2 border">{row.permissions.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <SaveButton saving={saving} settingsLoaded={settingsLoaded} onSave={onSave} />
    </div>
  );
}
