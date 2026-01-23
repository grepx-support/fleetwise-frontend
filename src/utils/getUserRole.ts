export const getPrimaryRole = (user: any): string => {
  const roles = user?.roles;
  if (!Array.isArray(roles) || roles.length === 0) {
    return 'guest';
  }
  const firstRole = roles[0];
  // Handle string role
  if (typeof firstRole === 'string') {
    return firstRole.toLowerCase();
  }
  // Handle object role
  if (typeof firstRole === 'object' && firstRole !== null) {
    return (firstRole.name || firstRole.role || 'guest').toLowerCase();
  }
  return 'guest';
};