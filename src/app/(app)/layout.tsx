import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { db, profile } = await requireUser();
  const { data: business } = await db
    .from('businesses')
    .select('name')
    .limit(1)
    .maybeSingle();

  const businessName = business?.name || 'ZAUQÉ BY BANA';
  const initial = (profile.full_name || profile.email).slice(0, 1).toUpperCase();

  return (
    <div className="app-shell">
      {/* Desktop Fixed Sidebar */}
      <Sidebar profile={profile} businessName={businessName} />

      {/* Main Workspace Area */}
      <div className="workspace">
        {/* Mobile Header with Hamburger Drawer */}
        <MobileNav profile={profile} businessName={businessName} />

        {/* Desktop Topbar */}
        <header className="topbar" aria-label="Workspace Header">
          <div>
            <span className="topbar-caption">ZAUQÉ BY BANA</span>
            <span className="topbar-location">Events • Catering • Experiences</span>
          </div>

          <div className="topbar-right">
            <span className="live-dot" />
            <span>Workspace active</span>
            <div
              className="top-avatar"
              title={`${profile.full_name || profile.email} (${profile.role})`}
            >
              {initial}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="workspace-main">{children}</main>

        {/* Branded Footer */}
        <footer className="footer">
          ZAUQÉ BY BANA · Bespoke Catering &amp; Signature Event Production
        </footer>
      </div>
    </div>
  );
}
