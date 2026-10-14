import { Link } from "react-router-dom";
import { getRoleAccessMatrix } from "../../config/permissions";

// Read-only reference for what each role can see, driven by the same
// config ProtectedRoute/Layout actually enforce (src/config/permissions.ts)
// — replaces a previous version that showed fictional admin names and a
// permissions matrix with roles that didn't even match the real backend
// taxonomy, none of it backend-synced or actually enforced. Real admin
// user management (invite, assign role, suspend) lives on /admins.
export default function UserRolesSection() {
  const matrix = getRoleAccessMatrix();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Role Access Matrix</h2>
        <Link to="/admins" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Manage admin users →
        </Link>
      </div>
      <p className="text-sm text-gray-500">
        What each role can see in this dashboard. Super Admin always has full access.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border text-left">Role</th>
              <th className="p-2 border text-left">Accessible pages</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.role}>
                <td className="p-2 border font-semibold whitespace-nowrap">{row.role}</td>
                <td className="p-2 border">
                  {row.role === 'Super Admin' ? 'All pages' : row.pages.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
