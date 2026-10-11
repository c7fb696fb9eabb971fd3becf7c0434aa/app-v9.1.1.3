import { useLocation } from 'react-router-dom';
import { StudioDeployments, StudioWorkspace } from '../features/studio';

export function StudioPage() {
  const location = useLocation();
  if (location.pathname.replace(/\/+$/, '') === '/studio/deployments') {
    return <StudioDeployments />;
  }
  return <StudioWorkspace />;
}
