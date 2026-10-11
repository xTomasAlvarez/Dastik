import { create } from 'zustand';

export interface CartItem {
  varianteId: number;
  productoId: number;
  nombreProducto: string;
  marca: string;
  talle: string;
  color: string;
  codigoBarras: string;
  precioUnitario: number;
  cantidad: number;
  stockFisico: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cantidad'>, cantidad?: number) => void;
  removeItem: (varianteId: number) => void;
  updateQuantity: (varianteId: number, cantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (newItem, cantidad = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.varianteId === newItem.varianteId
      );

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingIndex];
        const nuevaCantidad = Math.min(
          existingItem.cantidad + cantidad,
          existingItem.stockFisico
        );

        updatedItems[existingIndex] = {
          ...existingItem,
          cantidad: nuevaCantidad,
        };

        return { items: updatedItems };
      }

      const initialQty = Math.min(cantidad, newItem.stockFisico);
      return {
        items: [
          ...state.items,
          {
            ...newItem,
            cantidad: initialQty > 0 ? initialQty : 1,
          },
        ],
      };
    });
  },

  removeItem: (varianteId) => {
    set((state) => ({
      items: state.items.filter((i) => i.varianteId !== varianteId),
    }));
  },

  updateQuantity: (varianteId, cantidad) => {
    set((state) => {
      if (cantidad <= 0) {
        return {
          items: state.items.filter((i) => i.varianteId !== varianteId),
        };
      }

      return {
        items: state.items.map((item) => {
          if (item.varianteId === varianteId) {
            const cappedQty = Math.min(cantidad, item.stockFisico);
            return { ...item, cantidad: cappedQty };
          }
          return item;
        }),
      };
    });
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.precioUnitario * item.cantidad,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.cantidad, 0);
  },
}));
