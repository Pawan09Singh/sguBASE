"use client";

import { useState, useEffect } from "react";

interface RoleSwitcherProps {
  roles: string[];
  currentRole: string;
  onSwitch: (role: string) => void;
}

const EXCLUDED = ["SUPERADMIN", "STUDENT"];

export default function RoleSwitcher({ roles, currentRole, onSwitch }: RoleSwitcherProps) {
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    setAvailableRoles(roles.filter(r => !EXCLUDED.includes(r)));
  }, [roles]);

  if (availableRoles.length === 0) return null;

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1">Switch Role</label>
      <select
        value={currentRole}
        onChange={e => onSwitch(e.target.value)}
        className="px-3 py-2 border rounded w-48"
      >
        {availableRoles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
}
