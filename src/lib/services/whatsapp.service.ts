import { Order } from '@/types';
import { getSiteUrl } from '@/lib/constants/site';

export type WhatsAppTemplateType =
  | 'ORDER_RECEIPT'
  | 'STATUS_UPDATE'
  | 'DISPATCH_TRACKING'
  | 'ORDER_CANCELLED'
  | 'CUSTOM';

export interface WhatsAppMessageOptions {
  templateType?: WhatsAppTemplateType;
  customMessage?: string;
  courierPartner?: string;
  trackingNumber?: string;
  estDeliveryDays?: string;
  useWebUrl?: boolean;
}

export class WhatsAppService {
  /**
   * ZERO-COST & ULTRA-FAST WHATSAPP INTEGRATION SERVICE FOR ADMIN
   *
   * Formats Indian mobile numbers cleanly:
   * - 10 digits e.g. 9876543210 -> 919876543210
   * - Strips hyphens, spaces, leading zeros, or + prefixes
   */
  public static formatWhatsAppPhone(mobile: string): string {
    if (!mobile) return '';

    // Strip everything except numbers
    let digits = mobile.replace(/\D/g, '');

    // Handle leading 0 (e.g. 09876543210 -> 9876543210)
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // Standard 10-digit Indian mobile number -> prepend country code 91
    if (digits.length === 10) {
      return `91${digits}`;
    }

    // Already includes country code e.g. 919876543210
    return digits;
  }

  /**
   * Generate formatted WhatsApp text message for CUSTOMER
   */
  public static generateMessageText(order: Order, options: WhatsAppMessageOptions = {}): string {
    const templateType = options.templateType || 'ORDER_RECEIPT';
    const formattedPhone = this.formatWhatsAppPhone(order.customer_mobile);
    const trackingUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/track-order?id=${order.id}`
      : `${getSiteUrl()}/track-order?id=${order.id}`;

    switch (templateType) {
      case 'ORDER_RECEIPT': {
        const itemsList = order.items && order.items.length > 0
          ? order.items.map((i) => `• ${i.product_name} - ${i.quantity} ${i.quantity === 1 ? 'Pc' : 'Pcs'} - ₹${i.total_price.toLocaleString('en-IN')}`).join('\n')
          : '• Sivakasi Crackers Combo';

        return `🎆 *ORDER CONFIRMATION - VAILI PYRO PARK* 🎆

Dear ${order.customer_name},
Thank you for your order! Here are your order details:

📦 *Order Number:* ${order.order_number}
📅 *Date:* ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
📌 *Status:* ${order.status}

*Ordered Items:*
${itemsList}

*Financial Summary:*
• Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}
• Delivery Fee: ${order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee.toLocaleString('en-IN')}`}
• *Grand Total: ₹${order.grand_total.toLocaleString('en-IN')}*

📍 *Shipping Address:*
${order.shipping_address}, ${order.city}, ${order.state} - ${order.pincode}

Track your order status live here:
${trackingUrl}

We are preparing your Sivakasi crackers for safe dispatch!
Need assistance? Reply directly to this message.`;
      }

      case 'STATUS_UPDATE': {
        return `🎆 *ORDER STATUS UPDATE: ${order.order_number}* 🎆

Dear ${order.customer_name},
Your Sivakasi fireworks order status has been updated to:

*Current Status:* ➡️ *${order.status}*

📦 Order ID: ${order.order_number}
💰 Total Amount: ₹${order.grand_total.toLocaleString('en-IN')}

Track your order anytime:
${trackingUrl}

Thank you for choosing Vaili Pyro Park!`;
      }

      case 'DISPATCH_TRACKING': {
        const courier = options.courierPartner || order.courier_partner || 'ST Courier';
        const trackingId = options.trackingNumber || order.tracking_number || 'Assigned on Dispatch';
        const estDelivery = options.estDeliveryDays || order.estimated_delivery || '2-3 Days';

        return `🚚 *DISPATCH & TRACKING UPDATE: ${order.order_number}* 🚚

Dear ${order.customer_name},
Great news! Your Sivakasi crackers order has been dispatched!

*Dispatch Details:*
• Courier Partner: *${courier}*
• Tracking / LR Number: *${trackingId}*
• Est. Delivery: *${estDelivery}*
• Delivery City: *${order.city}, ${order.state}*

Track live status:
${trackingUrl}

Happy & Safe Celebrations with Vaili Pyro Park! 🎆`;
      }

      case 'ORDER_CANCELLED': {
        return `⚠️ *ORDER CANCELLATION NOTICE - ${order.order_number}* ⚠️

Dear ${order.customer_name},
Your order #${order.order_number} for ₹${order.grand_total.toLocaleString('en-IN')} has been cancelled.

${options.customMessage ? `Note: ${options.customMessage}\n\n` : ''}If you have any questions or want to place a new order, feel free to contact us anytime!

Track status:
${trackingUrl}

- Vaili Pyro Park, Sivakasi`;
      }

      case 'CUSTOM': {
        return options.customMessage || `Hi ${order.customer_name}, regarding your order ${order.order_number} from Vaili Pyro Park:`;
      }

      default:
        return `Hi ${order.customer_name}, update regarding order ${order.order_number}.`;
    }
  }

  /**
   * Generate direct WhatsApp URL targeting CUSTOMER
   */
  public static generateCustomerWhatsAppLink(
    order: Order,
    options: WhatsAppMessageOptions = {}
  ): string {
    const formattedPhone = this.formatWhatsAppPhone(order.customer_mobile);
    const text = this.generateMessageText(order, options);
    const encodedText = encodeURIComponent(text);

    if (options.useWebUrl) {
      return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    }

    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }

  /**
   * Backward-compatible store order link generator for storefront confirmation
   */
  public static generateOrderWhatsAppLink(order: Order, storePhoneNumber: string = '919952108746'): string {
    const itemsList = order.items && order.items.length > 0
      ? order.items.map((i) => `• ${i.product_name} - ${i.quantity} ${i.quantity === 1 ? 'Pc' : 'Pcs'} - ₹${i.total_price.toLocaleString('en-IN')}`).join('\n')
      : '';

    const text = `🎆 *NEW CRACKER ORDER: ${order.order_number}* 🎆\n\n*Customer Details:*\n• Name: ${order.customer_name}\n• Phone: ${order.customer_mobile}\n• Shipping Address: ${order.shipping_address}, ${order.city}, ${order.state} - ${order.pincode}\n\n*Ordered Items:*\n${itemsList}\n\n*Financial Summary:*\n• Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}\n• Delivery Fee: ${order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee.toLocaleString('en-IN')}`}\n• *Grand Total: ₹${order.grand_total.toLocaleString('en-IN')}*\n\nThank you for choosing Vaili Pyro Park! Please confirm dispatch timeline.`;

    const encoded = encodeURIComponent(text);
    return `https://wa.me/${storePhoneNumber}?text=${encoded}`;
  }

  /**
   * Customer support inquiry WhatsApp link (e.g. for dispatched order inquiries or general order lookup help)
   */
  public static generateSupportWhatsAppLink(order?: Order | null, message?: string, storePhoneNumber: string = '919952108746'): string {
    const text = message || (order
      ? `Hi Vaili Pyro Park team, I am inquiring regarding my order *#${order.order_number}* (Customer: ${order.customer_name}). Current status: ${order.status}. Could you please assist me?`
      : `Hi Vaili Pyro Park team, I need help locating my fireworks order. Could you please assist me?`);
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${storePhoneNumber}?text=${encoded}`;
  }
}
