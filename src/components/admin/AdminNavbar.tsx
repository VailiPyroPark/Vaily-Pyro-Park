'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AdminNotificationBell } from './AdminNotificationBell';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { UserMenuDropdown } from './UserMenuDropdown';

interface AdminNavbarProps {
  userEmail: string;
  isMobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  onSignOutClick: () => void;
}

export function AdminNavbar({
  userEmail,
  isMobileNavOpen,
  onToggleMobileNav,
  onSignOutClick,
}: AdminNavbarProps) {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/admin/orders/')) {
      return 'Order Details';
    }
    switch (path) {
      case '/admin':
        return 'Dashboard';
      case '/admin/orders':
        return 'Orders';
      case '/admin/billing':
        return 'Billing & POS';
      case '/admin/products':
        return 'Products';
      case '/admin/banners':
        return 'Hero Banner';
      case '/admin/categories':
        return 'Categories';
      case '/admin/discount':
        return 'Global Discount';
      case '/admin/settings':
        return 'Store Settings';
      case '/admin/notifications':
        return 'Notifications';
      case '/admin/profile':
        return 'Profile';
      default:
        return 'Admin';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs gap-2">
      {/* Left Side: Mobile Toggle & Simple Page Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onToggleMobileNav}
          className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors md:hidden cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <h1 className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight truncate">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right Side Utilities: PWA Install + Order Notifications + User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* PWA Install Button */}
        <PwaInstallPrompt />

        {/* Real-Time Order Notifications Bell */}
        <AdminNotificationBell />

        {/* User Profile Menu */}
        <UserMenuDropdown userEmail={userEmail} onSignOutClick={onSignOutClick} />
      </div>
    </header>
  );
}
