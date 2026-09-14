import { DeliveryZone, OrderItem, Product } from '@/types';
import { ProductService } from './product.service';

export interface CheckoutPayloadItem {
  product_id: string;
  quantity: number;
}

export interface CalculatedPricingResult {
  items: OrderItem[];
  subtotal: number;
  totalMrp: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  minOrderThreshold: number;
  isMinOrderMet: boolean;
  zoneName: string;
}

// Hard-coded fallback zones — only used if Supabase is unreachable at checkout time
const FALLBACK_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-tn',
    zone_name: 'Tamil Nadu (Home Zone)',
    state_codes: ['TN', 'Tamil Nadu'],
    min_order_amount: 3000,
    delivery_fee: 0,
    estimated_days: '2-3 Days',
    is_active: true,
  },
  {
    id: 'zone-south',
    zone_name: 'South India',
    state_codes: ['PY', 'KL', 'KA', 'AP', 'TS', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
    min_order_amount: 4000,
    delivery_fee: 150,
    estimated_days: '3-4 Days',
    is_active: true,
  },
  {
    id: 'zone-rest',
    zone_name: 'Rest of India',
    state_codes: ['ALL'],
    min_order_amount: 5000,
    delivery_fee: 250,
    estimated_days: '5-7 Days',
    is_active: true,
  },
];

export class PricingService {
  /**
   * Fetch active delivery zones (leveraging 60-min cached zones from ProductService).
   */
  static async fetchDeliveryZones(): Promise<DeliveryZone[]> {
    try {
      const zones = await ProductService.getDeliveryZones();
      return zones && zones.length > 0 ? zones : FALLBACK_DELIVERY_ZONES;
    } catch {
      return FALLBACK_DELIVERY_ZONES;
    }
  }

  /**
   * Recalculates exact order price using live catalog products & DB delivery zones.
   * Client-sent unit prices or totals are strictly IGNORED.
   */
  static calculateOrderPricing(
    clientItems: CheckoutPayloadItem[],
    stateCode: string,
    products: Product[] = [],
    zones: DeliveryZone[] = FALLBACK_DELIVERY_ZONES,
    customSettings?: {
      min_order_tamil_nadu?: number;
      min_order_other_states?: number;
      state_min_order_overrides?: Record<string, number>;
    }
  ): CalculatedPricingResult {
    const isTamilNadu =
      stateCode.trim().toLowerCase() === 'tn' ||
      stateCode.trim().toLowerCase() === 'tamil nadu';

    const zone =
      zones.find((z) =>
        z.state_codes.some((code) => code.toLowerCase() === stateCode.toLowerCase())
      ) ?? zones[zones.length - 1];

    // Determine effective minimum order threshold
    let minOrderThreshold = zone.min_order_amount;

    if (customSettings) {
      const stateOverride = customSettings.state_min_order_overrides?.[stateCode];
      if (typeof stateOverride === 'number' && stateOverride > 0) {
        minOrderThreshold = stateOverride;
      } else if (isTamilNadu && typeof customSettings.min_order_tamil_nadu === 'number' && customSettings.min_order_tamil_nadu > 0) {
        minOrderThreshold = customSettings.min_order_tamil_nadu;
      } else if (!isTamilNadu && typeof customSettings.min_order_other_states === 'number' && customSettings.min_order_other_states > 0) {
        // If zone has its own DB amount, honor it unless default other states applies
        minOrderThreshold = zone.id === 'zone-south' ? zone.min_order_amount : customSettings.min_order_other_states;
      }
    }

    let subtotal = 0;
    let totalMrp = 0;
    const validatedItems: OrderItem[] = [];

    for (const clientItem of clientItems) {
      const dbProduct = products.find((p) => p.id === clientItem.product_id);

      const sellingPrice = dbProduct ? dbProduct.selling_price : 100;
      const mrpPrice = dbProduct ? dbProduct.mrp : 150;
      const productName = dbProduct ? dbProduct.name : 'Sivakasi Fireworks Item';

      const qty = Math.max(1, clientItem.quantity);
      const lineSelling = sellingPrice * qty;
      const lineMrp = mrpPrice * qty;

      subtotal += lineSelling;
      totalMrp += lineMrp;

      validatedItems.push({
        product_id: clientItem.product_id,
        product_name: productName,
        unit_price: sellingPrice,
        quantity: qty,
        total_price: lineSelling,
        image_url: dbProduct?.image_url,
      });
    }

    const isMinOrderMet = subtotal >= minOrderThreshold;
    const deliveryFee = isMinOrderMet ? zone.delivery_fee : 0;
    const discountAmount = Math.max(0, totalMrp - subtotal);
    const grandTotal = subtotal + deliveryFee;

    return {
      items: validatedItems,
      subtotal,
      totalMrp,
      discountAmount,
      deliveryFee,
      grandTotal,
      minOrderThreshold,
      isMinOrderMet,
      zoneName: isTamilNadu ? 'Tamil Nadu' : zone.zone_name,
    };
  }
}
