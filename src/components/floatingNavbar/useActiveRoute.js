import { useLocation, useSearchParams } from 'react-router-dom';

const matchesPath = (pathname, path) => {
  if (!path) return false;
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
};

export const useActiveRoute = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const isItemActive = (item) => {
    if (matchesPath(pathname, item.path)) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => matchesPath(pathname, sub.path));
    }
    return false;
  };

  // Para items contextuales (ej. tabs de Gestión Semanal): activo si su key
  // matchea el query param, o si es el default y el param no está seteado.
  const isContextualItemActive = (item, paramKey, defaultKey) => {
    const current = searchParams.get(paramKey) || defaultKey;
    return current === item.key;
  };

  return { pathname, isItemActive, isContextualItemActive };
};
