import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "biblionova_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  
const addToCart = (book, quantity = 1) => {
  const amount = Math.max(
    1,
    Math.floor(Number(quantity) || 1)
  );

  // Declaramos stock ANTES de utilizarlo
  const stock = Math.max(
    0,
    Number(book.stockVenta ?? 99)
  );

  setItems((current) => {
    // No agregar libros sin stock
    if (stock <= 0) return current;

    const existing = current.find(
      (item) => item.id === book.id
    );

    if (existing) {
      return current.map((item) =>
        item.id === book.id
          ? {
              ...item,
              stockVenta: stock,
              quantity: Math.min(
                stock,
                item.quantity + amount
              ),
            }
          : item
      );
    }

    return [
      ...current,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        image: book.image,
        price: book.price,
        quantity: Math.min(amount, stock),
        stockVenta: stock,
      },
    ];
  });
};


  const removeFromCart = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount)) return;

    if (amount <= 0) {
      removeFromCart(id);
      return;
    }

    setItems((current) =>
      current.map((item) =>
item.id === id
  ? {
      ...item,
      quantity: Math.min(
        amount,
        Math.max(0, Number(item.stockVenta ?? 99))
      ),
    }
  : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
