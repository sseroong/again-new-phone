export default defineNuxtPlugin(() => {
  const cartStore = useCartStore();
  cartStore.loadFromStorage();
});
