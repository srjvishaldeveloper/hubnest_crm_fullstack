'use client';

import { useAuthStore } from '../../store/authStore';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard — renders children only when the current user's role
 * is included in `allowedRoles`. Super Admin always passes.
 */
export default function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || '';

  if (role === 'Super Admin' || allowedRoles.includes(role)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
