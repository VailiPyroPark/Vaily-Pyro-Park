'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, DeliveryZone } from '@/types';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number, product?: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  selectedZone: DeliveryZone;
  setSelectedZone: (zone: DeliveryZone) => void;
  subtotal: number;
  totalMrp: number;
  savings: number;
  itemCount: number;
  minOrderThreshold: number;
  remainingForMinOrder: number;
  isMinOrderReached: boolean;
  deliveryFee: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'vaily_pyro_cart_v1';
const ZONE_STORAGE_KEY = 'vaily_pyro_zone_v1';

// Default zone used before DB zones are loaded or if none saved in localStorage
const DEFAULT_ZONE: DeliveryZone = {
  id: 'zone-tn',
  zone_name: 'Tamil Nadu (Home Zone)',
  state_codes: ['TN', 'Tamil Nadu'],
  min_order_amount: 3000,
  delivery_fee: 0,
  estimated_days: '2-3 Days',
  is_active: true,
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useStoreSettings();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(DEFAULT_ZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart and selected zone from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedZone = localStorage.getItem(ZONE_STORAGE_KEY);
      if (savedZone) {
        setSelectedZone(JSON.parse(savedZone));
      }
    } catch (e) {
      console.error('Failed to load cart or zone from storage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart & selected zone to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        localStorage.setItem(ZONE_STORAGE_KEY, JSON.stringify(selectedZone));
      } catch (e) {
        console.error('Failed to save cart or zone to storage', e);
      }
    }
  }, [cart, selectedZone, isLoaded]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + quantity;
        if (newQty <= 0) {
          return updated.filter((item) => item.product.id !== product.id);
        }
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        if (quantity <= 0) return prevCart;
        return [...prevCart, { product, quantity }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number, product?: Product) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.product.id !== productId);
      }
      const existingIndex = prevCart.findIndex((item) => item.product.id === productId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      }
      if (product) {
        return [...prevCart, { product, quantity }];
      }
      return prevCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Dynamically sync selectedZone with settings on load and when settings change
  useEffect(() => {
    if (settings) {
      setSelectedZone((prev) => {
        const isTN = prev.id === 'zone-tn' || prev.zone_name.toLowerCase().includes('tamil');
        const expectedMin = isTN ? settings.min_order_tamil_nadu : settings.min_order_other_states;
        if (expectedMin && expectedMin > 0 && prev.min_order_amount !== expectedMin) {
          return { ...prev, min_order_amount: expectedMin };
        }
        return prev;
      });
    }
  }, [settings.min_order_tamil_nadu, settings.min_order_other_states]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const totalMrp = cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
  const savings = Math.max(0, totalMrp - subtotal);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isTN = selectedZone.id === 'zone-tn' || selectedZone.zone_name.toLowerCase().includes('tamil');
  const minOrderThreshold = isTN
    ? (settings.min_order_tamil_nadu || 3000)
    : (selectedZone.min_order_amount || settings.min_order_other_states || 5000);
  const remainingForMinOrder = Math.max(0, minOrderThreshold - subtotal);
  const isMinOrderReached = subtotal >= minOrderThreshold;
  const deliveryFee = isMinOrderReached ? selectedZone.delivery_fee : 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        selectedZone,
        setSelectedZone,
        subtotal,
        totalMrp,
        savings,
        itemCount,
        minOrderThreshold,
        remainingForMinOrder,
        isMinOrderReached,
        deliveryFee,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
