// Cart logic — same behaviour as the original CartProvider (persisted in localStorage).
(function () {
  const STORAGE_KEY = "pharmahub-cart";
  let items = [];
  try {
    items = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    items = [];
  }
  const listeners = new Set();

  function commit(next) {
    items = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
    listeners.forEach((fn) => fn());
  }

  window.Cart = {
    get items() { return items; },
    get total() { return items.reduce((s, i) => s + i.price * i.quantity, 0); },
    get count() { return items.reduce((s, i) => s + i.quantity, 0); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    addItem(item, quantity) {
      const existing = items.find((i) => i.medicineId === item.medicineId);
      if (existing) {
        commit(items.map((i) =>
          i.medicineId === item.medicineId
            ? Object.assign({}, i, { quantity: Math.min(i.quantity + quantity, i.maxQuantity), maxQuantity: item.maxQuantity })
            : i));
      } else {
        commit(items.concat([Object.assign({}, item, { quantity: Math.min(quantity, item.maxQuantity) })]));
      }
    },
    updateQuantity(medicineId, quantity) {
      commit(quantity <= 0
        ? items.filter((i) => i.medicineId !== medicineId)
        : items.map((i) => i.medicineId === medicineId
            ? Object.assign({}, i, { quantity: Math.min(quantity, i.maxQuantity) })
            : i));
    },
    removeItem(medicineId) { commit(items.filter((i) => i.medicineId !== medicineId)); },
    clear() { commit([]); },
  };
})();
