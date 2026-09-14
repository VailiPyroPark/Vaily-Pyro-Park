'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  SlidersHorizontal,
  Bell,
  User,
  ChevronRight,
  Plus,
  ArrowLeft,
  X,
  Zap,
  Percent,
  Settings,
  Image as ImageLucide,
} from 'lucide-react';
import { useAdminNotification } from '@/context/AdminNotificationContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface AdminSidebarProps {
  userEmail: string;
  onSignOutClick: () => void;
  onNavClick?: () => void;
}

export function AdminSidebar({ userEmail, onSignOutClick, onNavClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useAdminNotification();
  const { settings } = useStoreSettings();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/banners', label: 'Hero Banner', icon: ImageLucide },
    { href: '/admin/categories', label: 'Categories', icon: SlidersHorizontal },
    { href: '/admin/discount', label: 'Discount', icon: Percent },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { href: '/admin/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-full md:w-64 bg-white text-slate-900 shrink-0 border-r border-slate-200/90 h-full flex flex-col justify-between p-4 shadow-2xs">
      <div>
        {/* Brand Header */}
        <div className="pb-4 border-b border-slate-100 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/logo.png"
              alt={`${settings.store_name} Logo`}
              width={36}
              height={36}
              className="w-9 h-9 object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="font-bold text-sm text-slate-900 tracking-tight block truncate max-w-[140px]" title={settings.store_name}>
                {settings.store_name}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider block -mt-0.5">
                Admin Panel
              </span>
            </div>
          </div>

          {onNavClick && (
            <button
              onClick={onNavClick}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 md:hidden transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Add Product Button */}
        <Link
          href="/admin/products"
          onClick={onNavClick}
          className="w-full mb-4 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer border border-amber-400/60"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs translate-x-0.5'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && item.badge > 0 ? (
                    <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER SECTION: EXCLUSIVELY STOREFRONT LINK */}
      <div className="pt-4 border-t border-slate-100">
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Store</span>
        </Link>
      </div>
    </aside>
  );
}
