import { create } from 'zustand';
import { MOCK_ADMINS, type AdminRecord } from './mockData';

interface TenantStore {
  admins: AdminRecord[];
  addTenant: (tenantData: {
    company: string;
    companyEmail: string;
    name: string;
    email: string;
    phone: string;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    status: 'Active' | 'Inactive' | 'Blocked';
    adminId: string;
    passwordGenerated: string;
  }) => void;
  updateAdmin: (id: string, updated: Partial<AdminRecord>) => void;
  deleteAdmin: (id: string) => void;
  blockAdmin: (id: string) => void;
  setAdmins: (admins: AdminRecord[]) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  admins: [...MOCK_ADMINS],
  addTenant: (tenantData) => set((state) => {
    const newId = `admin-${String(state.admins.length + 1).padStart(3, '0')}`;
    const newAdmin: AdminRecord = {
      id: newId,
      adminId: tenantData.adminId,
      name: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone,
      company: tenantData.company,
      plan: tenantData.plan,
      status: tenantData.status,
      joinedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLogin: 'Never logged in',
      avatar: tenantData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'T',
      permissions: {
        canManageUsers: true,
        canManageLeads: true,
        canManageCampaigns: true,
        canManageTickets: true,
        canViewReports: true,
        canManageFinance: true,
      },
      activityLog: [
        { action: 'Tenant workspace provisioned', timestamp: new Date().toLocaleString() }
      ],
      performance: { usersManaged: 0, reportsGenerated: 0 }
    };
    return { admins: [newAdmin, ...state.admins] };
  }),
  updateAdmin: (id, updated) => set((state) => ({
    admins: state.admins.map((a) => a.id === id ? { ...a, ...updated } : a)
  })),
  deleteAdmin: (id) => set((state) => ({
    admins: state.admins.filter((a) => a.id !== id)
  })),
  blockAdmin: (id) => set((state) => ({
    admins: state.admins.map((a) => a.id === id ? { ...a, status: a.status === 'Blocked' ? 'Active' : 'Blocked' } : a)
  })),
  setAdmins: (admins) => set({ admins }),
}));
