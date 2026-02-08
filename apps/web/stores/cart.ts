import { defineStore } from 'pinia';

interface CartItem {
  productId: string;
  addedAt: string;
}

interface CartItemWithProduct extends CartItem {
  product: any;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    isLoading: false,
  }),

  getters: {
    itemCount: (state): number => state.items.length,

    hasProduct: (state) => (productId: string): boolean => {
      return state.items.some(item => item.productId === productId);
    },

    productIds: (state): string[] => {
      return state.items.map(item => item.productId);
    },
  },

  actions: {
    addItem(productId: string): boolean {
      if (this.hasProduct(productId)) {
        const toast = useToast();
        toast.add({
          title: '이미 장바구니에 담긴 상품입니다',
          color: 'amber',
          icon: 'i-heroicons-information-circle',
        });
        return false;
      }

      this.items.push({
        productId,
        addedAt: new Date().toISOString(),
      });
      this.saveToStorage();

      const toast = useToast();
      toast.add({
        title: '장바구니에 담았습니다',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      });
      return true;
    },

    removeItem(productId: string): boolean {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.productId !== productId);
      if (this.items.length < initialLength) {
        this.saveToStorage();
        return true;
      }
      return false;
    },

    removeItems(productIds: string[]) {
      this.items = this.items.filter(item => !productIds.includes(item.productId));
      this.saveToStorage();
    },

    clearCart() {
      this.items = [];
      this.saveToStorage();
    },

    saveToStorage() {
      localStorage.setItem('cart', JSON.stringify(this.items));
    },

    loadFromStorage() {
      const stored = localStorage.getItem('cart');
      if (stored) {
        try {
          this.items = JSON.parse(stored);
        } catch {
          this.items = [];
        }
      }
    },

    async fetchCartWithProducts(): Promise<CartItemWithProduct[]> {
      if (this.items.length === 0) return [];

      this.isLoading = true;
      try {
        const config = useRuntimeConfig();
        const apiBase = config.public.apiBaseUrl as string;

        const productPromises = this.items.map(item =>
          $fetch<any>(`${apiBase}/products/${item.productId}`).catch(() => null),
        );
        const products = await Promise.all(productPromises);

        const cartWithProducts: CartItemWithProduct[] = [];
        const unavailableIds: string[] = [];

        this.items.forEach((item, index) => {
          const product = products[index];
          if (product) {
            cartWithProducts.push({ ...item, product });
          } else {
            unavailableIds.push(item.productId);
          }
        });

        // 삭제된 상품 자동 제거
        if (unavailableIds.length > 0) {
          this.removeItems(unavailableIds);
          const toast = useToast();
          toast.add({
            title: `${unavailableIds.length}개 상품이 삭제되어 장바구니에서 제거되었습니다`,
            color: 'amber',
            icon: 'i-heroicons-information-circle',
          });
        }

        return cartWithProducts;
      } catch {
        return [];
      } finally {
        this.isLoading = false;
      }
    },
  },
});
