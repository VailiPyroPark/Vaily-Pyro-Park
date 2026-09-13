import { Order } from '@/types';

export class NotificationService {
  /**
   * Check if browser Notification API is supported
   */
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Current notification permission state
   */
  public static getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request push notification permission from user
   */
  public static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (e) {
      console.error('Notification permission request error:', e);
      return 'denied';
    }
  }

  /**
   * Trigger native browser push notification for new order
   */
  public static showOrderNotification(order: Partial<Order>): void {
    if (!this.isSupported()) return;
    if (Notification.permission !== 'granted') return;

    try {
      const title = `🎆 NEW ORDER: ${order.order_number || 'VPP-2026'}`;
      const itemCount = order.items?.length || 1;
      const formattedTotal = (order.grand_total || 0).toLocaleString('en-IN');
      const body = `Customer: ${order.customer_name || 'Valued Customer'}\nTotal: ₹${formattedTotal} (${itemCount} items)\nLocation: ${order.city || 'Tamil Nadu'}`;

      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `order-${order.id || order.order_number}`,
      });

      notification.onclick = () => {
        window.focus();
        if (window.location.pathname !== '/admin/orders') {
          window.location.href = '/admin/orders';
        }
      };
    } catch (e) {
      console.warn('Native notification error:', e);
    }
  }
}
