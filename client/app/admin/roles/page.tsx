'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface RolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

interface RoleRecord {
  name: string;
  isSystem: boolean;
  permissions: RolePermission[];
}

const INITIAL_ROLES: RoleRecord[] = [
  {
    name: 'Admin',
    isSystem: true,
    permissions: [
      { module: 'Leads', view: true, create: true, edit: true, delete: true, approve: false },
      { module: 'Campaigns', view: true, create: true, edit: true, delete: true, approve: false },
      { module: 'Tickets', view: true, create: true, edit: true, delete: true, approve: true },
      { module: 'Reports', view: true, create: true, edit: true, delete: false, approve: false },
      { module: 'Finance', view: true, create: false, edit: false, delete: false, approve: false },
    ],
  },
  {
    name: 'Sales Manager',
    isSystem: false,
    permissions: [
      { module: 'Leads', view: true, create: true, edit: true, delete: false, approve: true },
      { module: 'Campaigns', view: true, create: false, edit: false, delete: false, approve: false },
      { module: 'Tickets', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Reports', view: true, create: true, edit: false, delete: false, approve: false },
      { module: 'Finance', view: false, create: false, edit: false, delete: false, approve: false },
    ],
  },
  {
    name: 'Sales Executive',
    isSystem: false,
    permissions: [
      { module: 'Leads', view: true, create: true, edit: true, delete: false, approve: false },
      { module: 'Campaigns', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Tickets', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Reports', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Finance', view: false, create: false, edit: false, delete: false, approve: false },
    ],
  },
  {
    name: 'Marketing Head',
    isSystem: false,
    permissions: [
      { module: 'Leads', view: true, create: false, edit: false, delete: false, approve: false },
      { module: 'Campaigns', view: true, create: true, edit: true, delete: true, approve: true },
      { module: 'Tickets', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Reports', view: true, create: true, edit: false, delete: false, approve: false },
      { module: 'Finance', view: false, create: false, edit: false, delete: false, approve: false },
    ],
  },
  {
    name: 'Support Manager',
    isSystem: false,
    permissions: [
      { module: 'Leads', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Campaigns', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Tickets', view: true, create: true, edit: true, delete: true, approve: true },
      { module: 'Reports', view: true, create: true, edit: false, delete: false, approve: false },
      { module: 'Finance', view: false, create: false, edit: false, delete: false, approve: false },
    ],
  },
  {
    name: 'Finance Executive',
    isSystem: false,
    permissions: [
      { module: 'Leads', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Campaigns', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Tickets', view: false, create: false, edit: false, delete: false, approve: false },
      { module: 'Reports', view: true, create: false, edit: false, delete: false, approve: false },
      { module: 'Finance', view: true, create: true, edit: true, delete: false, approve: true },
    ],
  },
];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<RoleRecord>(INITIAL_ROLES[1]); // Default to Sales Manager

  const handleToggle = (moduleName: string, field: keyof Omit<RolePermission, 'module'>) => {
    if (selectedRole.isSystem) return; // Cannot edit Super Admin or Admin roles

    const updatedPermissions = selectedRole.permissions.map(p => {
      if (p.module === moduleName) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    });

    const updatedRole = { ...selectedRole, permissions: updatedPermissions };
    setSelectedRole(updatedRole);

    setRoles(prev => prev.map(r => r.name === selectedRole.name ? updatedRole : r));
  };

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Role Management</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Define access permissions per role level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Roles</h3>
          {roles.map(r => (
            <button
              key={r.name}
              onClick={() => setSelectedRole(r)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition
                ${selectedRole.name === r.name
                  ? 'border-[#2563EB] bg-blue-50/20 text-[#0F172A]'
                  : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.isSystem ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{r.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{r.isSystem ? 'System Defined' : 'Custom Permissions'}</p>
                </div>
              </div>
              {r.isSystem ? (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Locked</span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-mono">Editable</span>
              )}
            </button>
          ))}
        </div>

        {/* Permissions Table Editor */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                {selectedRole.name} Permissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedRole.isSystem ? 'System-locked role rules cannot be edited' : 'Changes apply immediately in JSON format'}
              </p>
            </div>
            {selectedRole.isSystem && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200">
                <ShieldAlert className="w-3.5 h-3.5" /> Read Only
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Module</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-center">View</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-center">Create</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-center">Edit</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-center">Delete</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-center">Approve</th>
                </tr>
              </thead>
              <tbody>
                {selectedRole.permissions.map(p => (
                  <tr key={p.module} className="border-b border-slate-50 hover:bg-slate-50/30">
                    <td className="px-4 py-3.5 text-xs font-bold text-[#0F172A]">{p.module}</td>
                    {/* View */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.view}
                        disabled={selectedRole.isSystem}
                        onChange={() => handleToggle(p.module, 'view')}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563EB] disabled:opacity-55"
                      />
                    </td>
                    {/* Create */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.create}
                        disabled={selectedRole.isSystem}
                        onChange={() => handleToggle(p.module, 'create')}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563EB] disabled:opacity-55"
                      />
                    </td>
                    {/* Edit */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.edit}
                        disabled={selectedRole.isSystem}
                        onChange={() => handleToggle(p.module, 'edit')}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563EB] disabled:opacity-55"
                      />
                    </td>
                    {/* Delete */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.delete}
                        disabled={selectedRole.isSystem}
                        onChange={() => handleToggle(p.module, 'delete')}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563EB] disabled:opacity-55"
                      />
                    </td>
                    {/* Approve */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.approve}
                        disabled={selectedRole.isSystem}
                        onChange={() => handleToggle(p.module, 'approve')}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563EB] disabled:opacity-55"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold text-[#0F172A] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Live JSONB Output
            </h4>
            <pre className="text-[10px] font-mono text-slate-600 bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
              {JSON.stringify(selectedRole.permissions, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
