import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { useEffect, Suspense, createElement } from "react";
import routes from "./config";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

const RouteLoader = () => createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
  createElement('div', { className: 'text-center' },
    createElement('div', { className: 'w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' }),
    createElement('p', { className: 'text-gray-600' }, 'Loading page...')
  )
);

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  }, [navigate]);
  
  return createElement(Suspense, { fallback: createElement(RouteLoader) }, element);
}
