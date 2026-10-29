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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: UsersRound },
  { href: '/events', label: 'Events & Bookings', icon: CalendarDays },
  { href: '/packages', label: 'Service Packages', icon: UtensilsCrossed },
  { href: '/quotes', label: 'Quotations', icon: FileText, owner: true },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText, owner: true },
  { href: '/payments', label: 'Payments', icon: CreditCard, owner: true },
  { href: '/expenses', label: 'Expenses', icon: Wallet, owner: true },
  { href: '/team', label: 'Team Management', icon: UserCog, owner: true },
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

  // Lock background scroll on both body and html when mobile drawer is open (prevents iOS Safari scroll leak)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

      {/* Backdrop (Darkened and blurred overlay to keep dashboard visible beneath) */}
      <div
        className={`mobile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      {/* Slide-out Drawer */}
      <aside
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation Drawer"
        aria-hidden={!isOpen}
      >
        {/* Drawer Header with Branded Logo & Close Button */}
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand" onClick={() => setIsOpen(false)}>
            <BrandLogo size="md" showText={true} tagline={true} href="/dashboard" />
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="mobile-drawer-body">
          <div className="mobile-side-company" title={businessName || 'ZAUQÉ BY BANA'}>
            <span className="company-dot" />
            <span>{businessName || 'ZAUQÉ BY BANA'}</span>
            <ChevronRight size={14} style={{ color: '#C9A46A', opacity: 0.75 }} />
          </div>

          <div className="mobile-nav-title">WORKSPACE</div>

          {/* Navigation Items (Icons aligned left, followed by labels, row height ~48-52px) */}
          <nav className="mobile-nav-items" aria-label="Mobile navigation links">
            {sections
              .filter((s) => !s.owner || profile.role === 'owner')
              .map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    href={href}
                    key={href}
                    className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} className="mobile-nav-icon" />
                    <span className="mobile-nav-label">{label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Bottom Account & Sign Out Options */}
          <div className="mobile-drawer-footer">
            <div className="mobile-person">
              <span className="avatar">{initial}</span>
              <span className="mobile-person-info">
                <strong>{profile.full_name || profile.email}</strong>
                <small>{profile.role === 'owner' ? 'Business Owner' : 'Staff Member'}</small>
              </span>
            </div>

            <Link
              href="/set-password"
              className="mobile-action-btn"
              onClick={() => setIsOpen(false)}
            >
              <KeyRound size={19} className="mobile-action-icon" />
              <span>Change Password</span>
            </Link>

            <form action={signOut} style={{ margin: 0 }}>
              <button className="mobile-action-btn danger" type="submit">
                <LogOut size={19} className="mobile-action-icon" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
