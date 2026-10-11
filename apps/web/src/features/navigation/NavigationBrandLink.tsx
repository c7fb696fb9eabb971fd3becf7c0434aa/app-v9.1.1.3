import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../../config';
import { Icon } from '../../components/Icon';
import { useAuth } from '../auth';

export function NavigationBrandLink({
  className,
  dataHeaderSlot,
  onClick,
}: {
  className: string;
  dataHeaderSlot?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { user } = useAuth();

  return (
    <Link
      className={`navigation-brand-link ${className}`}
      to={user ? APP_ROUTES.home : APP_ROUTES.publicHome}
      aria-label="GreenDocs home"
      data-header-slot={dataHeaderSlot}
      onClick={onClick}
    >
      <span className="brand-mark navigation-brand-mark">
        <Icon name="brand" />
      </span>
    </Link>
  );
}
