'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
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
  KeyRound,
  ChevronRight,
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

export function MobileNav({
  profile,
  businessName,
}: {
  profile: Profile;
  businessName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const initial = (profile.full_name || profile.email).slice(0, 1).toUpperCase();

  return (
    <>
      {/* Compact Top Header on Mobile */}
      <header className="mobile-top-bar" aria-label="Mobile Navigation">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation drawer"
          aria-expanded={isOpen}
        >
          <Menu size={22} />
        </button>

        <BrandLogo size="sm" showText={true} tagline={false} href="/dashboard" />

        <div className="top-avatar" title={profile.full_name || profile.email}>
          {initial}
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`mobile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      {/* Slide-out Drawer */}
      <aside
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Mobile Menu"
        aria-hidden={!isOpen}
      >
        <div className="mobile-drawer-header">
          <BrandLogo size="md" showText={true} tagline={true} />
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="side-company">
          <span className="company-dot" />
          <span>{businessName || 'ZAUQÉ BY BANA'}</span>
          <ChevronRight size={14} />
        </div>

        <div className="nav-title">WORKSPACE</div>

        <nav className="nav-items" aria-label="Navigation links">
          {sections
            .filter((s) => !s.owner || profile.role === 'owner')
            .map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  href={href}
                  key={href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
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

          <Link
            href="/set-password"
            className="signout"
            onClick={() => setIsOpen(false)}
          >
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
    </>
  );
}
