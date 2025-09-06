"use client";

import { useState } from "react";

interface UserEditModalProps {
  user: {
    id: string;
    name: string;
    email: string;
    uid: string;
    roles: string[];
    status: string;
    department?: string;
    createdAt: string;
  };
  allRoles: string[];
  onClose: () => void;
  onSave: (userId: string, newStatus: string, newRoles: string[]) => void;
}

export default function UserEditModal({ user, allRoles, onClose, onSave }: UserEditModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);
  const [status, setStatus] = useState(user.status);

  const handleRoleChange = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = () => {
    onSave(user.id, status, selectedRoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit User: {user.name}</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Account Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Roles</label>
          <div className="flex flex-wrap gap-2">
            {allRoles.map((role) => (
              <label key={role} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => handleRoleChange(role)}
                  disabled={role === "SUPERADMIN" || role === "STUDENT"}
                />
                <span>{role}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
