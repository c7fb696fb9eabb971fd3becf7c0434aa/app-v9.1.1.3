import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
