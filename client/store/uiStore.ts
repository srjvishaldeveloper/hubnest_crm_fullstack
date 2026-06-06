import { create } from 'zustand';

interface SuperAdminUIState {
  showAddTenantModal: boolean;
  setShowAddTenantModal: (show: boolean) => void;
}

export const useSuperAdminUIStore = create<SuperAdminUIState>((set) => ({
  showAddTenantModal: false,
  setShowAddTenantModal: (show) => set({ showAddTenantModal: show }),
}));
