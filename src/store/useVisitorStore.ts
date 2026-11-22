"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BuyerInfo, CartItem, OrderNote, Product } from "@/types";

interface VisitorState {
  cart: CartItem[];
  savedOrders: OrderNote[];
  buyerProfile: BuyerInfo;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  addToCart: (product: Product) => void;
  updateQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  saveOrderNote: (order: OrderNote) => void;
  removeOrderNote: (orderId: string) => void;
  clearOrders: () => void;
  setBuyerProfile: (profile: BuyerInfo) => void;
}

export const useVisitorStore = create<VisitorState>()(
  persist(
    (set) => ({
      cart: [],
      savedOrders: [],
      buyerProfile: {
        name: "",
        phone: "",
        address: "",
        notes: "",
      },
      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      addToCart: (product) =>
        set((state) => {
          if (!product.is_available) return state;
          const existing = state.cart.find((i) => i.productId === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.productId === product.id
                  ? { ...item, qty: item.qty + 1 }
                  : item
              ),
            };
          }
          const newItem: CartItem = {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            imageUrl: product.images[0] || "/assets/products/kc-001.png",
            qty: 1,
          };
          return { cart: [...state.cart, newItem] };
        }),
      updateQty: (productId, delta) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.productId === productId
                ? { ...item, qty: item.qty + delta }
                : item
            )
            .filter((item) => item.qty > 0),
        })),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        })),
      clearCart: () => set({ cart: [] }),
      saveOrderNote: (order) =>
        set((state) => ({
          savedOrders: [order, ...state.savedOrders],
        })),
      removeOrderNote: (orderId) =>
        set((state) => ({
          savedOrders: state.savedOrders.filter((o) => o.orderId !== orderId),
        })),
      clearOrders: () => set({ savedOrders: [] }),
      setBuyerProfile: (profile) => set({ buyerProfile: profile }),
    }),
    {
      name: "odiyuki-visitor-storage",
      partialize: (state) => ({
        cart: state.cart,
        savedOrders: state.savedOrders,
        buyerProfile: state.buyerProfile,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
