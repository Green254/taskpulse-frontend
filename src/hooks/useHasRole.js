import { useAuth } from '../contexts/AuthContext';

export default function useHasRole(roleName) {
  const { user } = useAuth();
  return user?.roles?.some((r) => r.name === roleName);
}
