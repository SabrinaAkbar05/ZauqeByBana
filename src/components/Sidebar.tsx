'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  UtensilsCrossed,
  FileText,
  ReceiptText,
  CreditCard,
  Wallet,
  UserCog,
  Settings2,
  LogOut,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import { signOut } from '@/app/actions';
import type { Profile } from '@/lib/auth';
import { BrandLogo } from './BrandLogo';

const sections = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: UsersRound },
  { href: '/events', label: 'Events & Bookings', icon: CalendarDays },
  { href: '/packages', label: 'Service Packages', icon: UtensilsCrossed },
  { href: '/quotes', label: 'Quotations', icon: FileText, owner: true },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText, owner: true },
  { href: '/payments', label: 'Payments', icon: CreditCard, owner: true },
  { href: '/expenses', label: 'Expenses', icon: Wallet, owner: true },
  { href: '/team', label: 'Team Access', icon: UserCog, owner: true },
  { href: '/settings', label: 'Settings', icon: Settings2, owner: true },
];

export function Sidebar({
  profile,
  businessName,
}: {
  profile: Profile;
  businessName: string;
}) {
  const pathname = usePathname();
  const initial = (profile.full_name || profile.email).slice(0, 1).toUpperCase();

  return (
    <aside className="sidebar" aria-label="Desktop Navigation">
      <Link href="/dashboard" className="brand-header-link" title="ZAUQÉ BY BANA Dashboard">
        <BrandLogo size="md" showText={true} tagline={true} />
      </Link>

      <div className="side-company" title={businessName || 'ZAUQÉ BY BANA'}>
        <span className="company-dot" />
        <span>{businessName || 'ZAUQÉ BY BANA'}</span>
        <ChevronRight size={14} />
      </div>

      <div className="nav-title">WORKSPACE</div>

      <nav className="nav-items" aria-label="Main Navigation">
        {sections
          .filter((s) => !s.owner || profile.role === 'owner')
          .map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                href={href}
                key={href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="side-bottom">
        <div className="person">
          <span className="avatar">{initial}</span>
          <span className="person-info">
            <strong>{profile.full_name || profile.email}</strong>
            <small>{profile.role === 'owner' ? 'Business Owner' : 'Staff Member'}</small>
          </span>
        </div>

        <Link href="/set-password" className="signout">
          <KeyRound size={17} />
          <span>Change password</span>
        </Link>

        <form action={signOut}>
          <button className="signout signout-danger" type="submit">
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
