'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Order } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { AudioService } from '@/lib/services/audio.service';
import { NotificationService } from '@/lib/services/notification.service';

export interface AdminNotificationItem {
  id: string;
  orderNumber: string;
  customerName: string;
  grandTotal: number;
  city: string;
  timestamp: string;
  read: boolean;
  order: Partial<Order>;
}

export interface AdminNotificationToast {
  id: string;
  title: string;
  message: string;
  orderNumber: string;
  grandTotal: number;
  order: Partial<Order>;
}

interface AdminNotificationContextType {
  notifications: AdminNotificationItem[];
  unreadCount: number;
  toasts: AdminNotificationToast[];
  isMuted: boolean;
  permissionState: NotificationPermission;
  toggleMute: () => void;
  requestPermission: () => Promise<void>;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  testSoundAlert: () => void;
  notifyNewOrder: (order: Partial<Order>) => void;
  notifyOrderCancelled: (order: Partial<Order>, reason?: string, cancelledBy?: string) => void;
  refreshNotifications: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

const NOTIFICATION_STORAGE_KEY = 'vpp_admin_notifications_v1';

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [toasts, setToasts] = useState<AdminNotificationToast[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notifyNewOrder = useCallback(
    (order: Partial<Order>) => {
      if (!order.order_number) return;

      const grandTotalNum = Number(order.grand_total) || 0;
      const orderObj: Partial<Order> = {
        ...order,
        grand_total: grandTotalNum,
      };

      const newItem: AdminNotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderNumber: order.order_number,
        customerName: order.customer_name || 'Customer',
        grandTotal: grandTotalNum,
        city: order.city || 'Tamil Nadu',
        timestamp: order.created_at || new Date().toISOString(),
        read: false,
        order: orderObj,
      };

      setNotifications((prev) => {
        const exists = prev.some((n) => n.orderNumber === order.order_number);
        if (exists) return prev;
        const updated = [newItem, ...prev];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated.slice(0, 40)));
          } catch {}
        }
        return updated;
      });

      // 1. Play Web Audio API Chime
      AudioService.playNewOrderChime();

      // 2. Trigger Native Push Notification
      NotificationService.showOrderNotification(orderObj);

      // 3. Show In-App Visual Toast
      const toastId = `toast-${Date.now()}`;
      const newToast: AdminNotificationToast = {
        id: toastId,
        title: '🎆 NEW ORDER RECEIVED!',
        message: `Order #${order.order_number} by ${order.customer_name || 'Customer'} (₹${grandTotalNum.toLocaleString('en-IN')})`,
        orderNumber: order.order_number,
        grandTotal: grandTotalNum,
        order: orderObj,
      };

      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        dismissToast(toastId);
      }, 6000);
    },
    [dismissToast]
  );

  const notifyOrderCancelled = useCallback(
    (order: Partial<Order>, reason?: string, cancelledBy?: string) => {
      if (!order.order_number) return;

      const grandTotalNum = Number(order.grand_total) || 0;
      const orderObj: Partial<Order> = {
        ...order,
        grand_total: grandTotalNum,
        status: 'CANCELLED',
      };

      const newItem: AdminNotificationItem = {
        id: `notif-cancel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderNumber: order.order_number,
        customerName: order.customer_name || 'Customer',
        grandTotal: grandTotalNum,
        city: order.city || 'Tamil Nadu',
        timestamp: new Date().toISOString(),
        read: false,
        order: orderObj,
      };

      setNotifications((prev) => {
        const updated = [newItem, ...prev.filter((n) => n.orderNumber !== order.order_number)];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated.slice(0, 40)));
          } catch {}
        }
        return updated;
      });

      // 1. Play alert sound
      AudioService.playNewOrderChime();

      // 2. In-App Visual Toast
      const toastId = `toast-cancel-${Date.now()}`;
      const newToast: AdminNotificationToast = {
        id: toastId,
        title: '⚠️ ORDER CANCELLED!',
        message: `Order #${order.order_number} cancelled by ${cancelledBy || 'Customer'}${reason ? `: "${reason}"` : ''}`,
        orderNumber: order.order_number,
        grandTotal: grandTotalNum,
        order: orderObj,
      };

      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        dismissToast(toastId);
      }, 7000);
    },
    [dismissToast]
  );

  // Sync latest orders from DB into notification items
  const syncOrdersWithNotifications = useCallback(
    async (triggerAlertForNew = false) => {
      try {
        const supabase = createClient();
        const { data: recentOrders, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(40);

        if (error || !recentOrders) return;

        setNotifications((prev) => {
          const existingMap = new Map<string, AdminNotificationItem>();
          prev.forEach((n) => {
            if (n.orderNumber) existingMap.set(n.orderNumber, n);
          });

          const updatedList: AdminNotificationItem[] = [];
          const now = Date.now();

          for (const order of recentOrders) {
            const grandTotalNum = Number(order.grand_total) || 0;
            const orderObj: Partial<Order> = {
              ...order,
              grand_total: grandTotalNum,
              subtotal: Number(order.subtotal) || 0,
              delivery_fee: Number(order.delivery_fee) || 0,
              discount_amount: Number(order.discount_amount) || 0,
            };

            if (existingMap.has(order.order_number)) {
              // Preserve existing notification (especially read status)
              const existing = existingMap.get(order.order_number)!;
              updatedList.push({
                ...existing,
                grandTotal: grandTotalNum,
                order: orderObj,
              });
            } else {
              // New order found in DB that wasn't in local state
              const isPending = order.status === 'PENDING';
              const newItem: AdminNotificationItem = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                orderNumber: order.order_number,
                customerName: order.customer_name || 'Customer',
                grandTotal: grandTotalNum,
                city: order.city || 'Tamil Nadu',
                timestamp: order.created_at || new Date().toISOString(),
                read: !isPending, // Pending orders marked unread by default
                order: orderObj,
              };
              updatedList.push(newItem);

              // If triggerAlertForNew is true and order was created in last 10 minutes, sound alert & toast
              if (triggerAlertForNew) {
                const orderTime = new Date(order.created_at || Date.now()).getTime();
                if (now - orderTime < 10 * 60 * 1000) {
                  AudioService.playNewOrderChime();
                  NotificationService.showOrderNotification(orderObj);
                  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
                  const newToast: AdminNotificationToast = {
                    id: toastId,
                    title: '🎆 NEW ORDER RECEIVED!',
                    message: `Order #${order.order_number} by ${order.customer_name || 'Customer'} (₹${grandTotalNum.toLocaleString('en-IN')})`,
                    orderNumber: order.order_number,
                    grandTotal: grandTotalNum,
                    order: orderObj,
                  };
                  setToasts((t) => [...t, newToast]);
                  setTimeout(() => dismissToast(toastId), 6000);
                }
              }
            }
          }

          // Sort by timestamp descending
          updatedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const sliced = updatedList.slice(0, 40);

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(sliced));
            } catch {}
          }

          return sliced;
        });
      } catch (err) {
        console.error('Error syncing notifications from DB:', err);
      }
    },
    [dismissToast]
  );

  // Load initial state from localStorage and trigger DB sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMuted(AudioService.isMuted());
      setPermissionState(NotificationService.getPermissionState());

      try {
        const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (saved) {
          const parsed: AdminNotificationItem[] = JSON.parse(saved);
          const clean = parsed.filter((n) => !n.orderNumber?.includes('TEST'));
          setNotifications(clean);
        }
      } catch (e) {
        console.error('Error loading saved notifications:', e);
      }

      // Sync recent DB orders into notifications list immediately
      syncOrdersWithNotifications(false);
    }
  }, [syncOrdersWithNotifications]);

  // Subscribe to Supabase Realtime, BroadcastChannel & Polling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supabase = createClient();

    // 1. Realtime DB listener for order inserts and updates
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new) {
            notifyNewOrder(payload.new as Partial<Order>);
            syncOrdersWithNotifications(false);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as Partial<Order>;
            if (updated.status === 'CANCELLED') {
              notifyOrderCancelled(updated, updated.admin_notes, 'Customer');
            }
            syncOrdersWithNotifications(false);
          }
        }
      )
      .subscribe();

    // 2. BroadcastChannel for cross-tab instant notification when checkout completes or cancellation occurs
    let broadcastChannel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('vpp_orders_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
          notifyNewOrder(event.data.order);
        } else if (event.data?.type === 'ORDER_CANCELLED' && event.data?.order) {
          notifyOrderCancelled(event.data.order, event.data.reason, event.data.cancelledBy);
          syncOrdersWithNotifications(false);
        } else if (event.data?.type === 'ORDER_STATUS_CHANGED') {
          syncOrdersWithNotifications(false);
        }
      };
    }

    // 3. Storage event fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vpp_last_created_order' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          notifyNewOrder(parsed);
        } catch {}
      } else if (e.key === 'vpp_last_cancelled_order' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          notifyOrderCancelled(parsed, parsed.admin_notes, 'Customer');
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Polling fallback every 15s to guarantee no orders are missed
    const interval = setInterval(() => {
      syncOrdersWithNotifications(true);
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [notifyNewOrder, notifyOrderCancelled, syncOrdersWithNotifications]);

  const refreshNotifications = useCallback(async () => {
    await syncOrdersWithNotifications(false);
  }, [syncOrdersWithNotifications]);

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    AudioService.setMuted(nextState);
  };

  const saveNotifications = (items: AdminNotificationItem[]) => {
    setNotifications(items);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items.slice(0, 40)));
      } catch (e) {
        console.error('Error saving notifications:', e);
      }
    }
  };

  const requestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermissionState(res);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const testSoundAlert = () => {
    AudioService.playNewOrderChime();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AdminNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        isMuted,
        permissionState,
        toggleMute,
        requestPermission,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        testSoundAlert,
        notifyNewOrder,
        notifyOrderCancelled,
        refreshNotifications,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotification() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotification must be used within an AdminNotificationProvider');
  }
  return context;
}
