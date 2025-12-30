import React, { useState } from 'react';

interface RolePermission {
  role: string;
  permissions: string[];
}

interface ManageRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageRolesModal: React.FC<ManageRolesModalProps> = ({ isOpen, onClose }) => {
  const [roles, setRoles] = useState<RolePermission[]>([
    {
      role: 'Admin',
      permissions: ['Orders', 'Products', 'Riders', 'Warehouse', 'Finance', 'Support', 'Users', 'Settings'],
    },
    {
      role: 'Manager',
      permissions: ['Orders', 'Products', 'Riders', 'Warehouse'],
    },
    {
      role: 'Finance',
      permissions: ['Finance', 'Billing', 'Reports'],
    },
    {
      role: 'Warehouse',
      permissions: ['Inventory', 'Warehouse', 'Orders'],
    },
    {
      role: 'Support',
      permissions: ['Support', 'Customers', 'Orders'],
    },
  ]);

  const allPermissions = [
    'Orders',
    'Products',
    'Riders',
    'Warehouse',
    'Finance',
    'Billing',
    'Support',
    'Customers',
    'Inventory',
    'Users',
    'Settings',
    'Reports',
  ];

  const togglePermission = (roleIndex: number, permission: string) => {
    const newRoles = [...roles];
    const permissions = newRoles[roleIndex].permissions;
    const index = permissions.indexOf(permission);
    
    if (index > -1) {
      permissions.splice(index, 1);
    } else {
      permissions.push(permission);
    }
    
    setRoles(newRoles);
  };

  const handleSave = () => {
    console.log('Saving role permissions:', roles);
    // TODO: Call API to save role permissions
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Manage Role Permissions</h2>

        <div className="space-y-6">
          {roles.map((roleData, roleIndex) => (
            <div key={roleData.role} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">{roleData.role}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allPermissions.map(permission => (
                  <label key={permission} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleData.permissions.includes(permission)}
                      onChange={() => togglePermission(roleIndex, permission)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageRolesModal;
