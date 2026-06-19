import { UserRole } from '../types/auth';

/**
 * Get the appropriate redirect path based on user role
 * @param role - User role
 * @returns Redirect path
 */
export function getRedirectPathByRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
    case 'DOCTOR':
    case 'RECEPTIONIST':
    case 'CASHIER':
    case 'TECHNICIAN':
      return '/dashboard';
    case 'PATIENT':
      return '/';
    default:
      return '/';
  }
}

/**
 * Check if user role should use sidebar layout
 * @param role - User role
 * @returns True if should use sidebar layout
 */
export function shouldUseSidebarLayout(role: UserRole): boolean {
  const staffRoles: UserRole[] = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'TECHNICIAN'];
  return staffRoles.includes(role);
}

/**
 * Check if user role should use main layout
 * @param role - User role
 * @returns True if should use main layout
 */
export function shouldUseMainLayout(role: UserRole): boolean {
  return role === 'PATIENT';
}
