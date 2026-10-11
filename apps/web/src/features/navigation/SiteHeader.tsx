import { LeftSidebar } from './LeftSidebar';
import { NavigationBrandLink } from './NavigationBrandLink';
import { RightSidebar } from './RightSidebar';

export function SiteHeader({ onLoginIntent }: { onLoginIntent: () => void }) {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="header-leading" data-header-slot="leading">
            <LeftSidebar />
          </div>
          <NavigationBrandLink className="header-home" dataHeaderSlot="brand" />
          <div className="header-trailing" data-header-slot="trailing">
            <RightSidebar onLoginIntent={onLoginIntent} />
          </div>
        </div>
      </header>
    </>
  );
}
