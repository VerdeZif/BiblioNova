import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

// Nueva clave para no reutilizar cantidades del antiguo carrito simulado.
const STORAGE_KEY = "biblionova_cart_v2";

// Validar y recuperar los productos guardados.
function cargarCarritoGuardado() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
        .filter((item) => {
          return (
              item &&
              item.id !== undefined &&
              item.id !== null &&
              Number.isInteger(Number(item.quantity)) &&
              Number(item.quantity) > 0 &&
              Number.isFinite(Number(item.price)) &&
              Number(item.price) >= 0
          );
        })
        .map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
          stockVenta: Math.max(
              0,
              Number(item.stockVenta) || 0
          ),
        }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(cargarCarritoGuardado);

  // Persistir el carrito.
  useEffect(() => {
    try {
      localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(items)
      );
    } catch (error) {
      console.error("No se pudo guardar el carrito:", error);
    }
  }, [items]);

  // Agregar un libro.
  const addToCart = (book, quantity = 1) => {
    const amount = Number(quantity);
    const stock = Number(book?.stockVenta);
    const id = book?.id;

    // Validaciones del producto.
    if (
        id === undefined ||
        id === null ||
        String(id).trim() === "" ||
        !Number.isInteger(amount) ||
        amount <= 0 ||
        !Number.isInteger(stock) ||
        stock <= 0 ||
        book.saleable !== true ||
        !Number.isFinite(Number(book.price)) ||
        Number(book.price) < 0
    ) {
      return false;
    }

    const existing = items.find(
        (item) => String(item.id) === String(id)
    );

    const currentQuantity = existing
        ? Number(existing.quantity)
        : 0;

    // No permitir superar el stock conocido.
    if (currentQuantity + amount > stock) {
      return false;
    }

    setItems((current) => {
      const existingCurrent = current.find(
          (item) => String(item.id) === String(id)
      );

      const quantityCurrent = existingCurrent
          ? Number(existingCurrent.quantity)
          : 0;

      // Comprobación adicional dentro de la actualización.
      if (quantityCurrent + amount > stock) {
        return current;
      }

      if (existingCurrent) {
        return current.map((item) =>
            String(item.id) === String(id)
                ? {
                  ...item,
                  title: book.title,
                  author: book.author,
                  image: book.image,
                  price: Number(book.price),
                  stockVenta: stock,
                  quantity: quantityCurrent + amount,
                }
                : item
        );
      }

      return [
        ...current,
        {
          id,
          title: book.title,
          author: book.author,
          image: book.image,
          price: Number(book.price),
          stockVenta: stock,
          quantity: amount,
        },
      ];
    });

    return true;
  };

  // Eliminar un producto.
  const removeFromCart = (id) => {
    setItems((current) =>
        current.filter(
            (item) => String(item.id) !== String(id)
        )
    );
  };

  // Modificar la cantidad de un producto.
  const updateQuantity = (id, quantity) => {
    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount < 0) {
      return false;
    }

    if (amount === 0) {
      removeFromCart(id);
      return true;
    }

    const item = items.find(
        (product) => String(product.id) === String(id)
    );

    if (!item) {
      return false;
    }

    const stock = Number(item.stockVenta);

    // No permitir cantidades superiores al stock conocido.
    if (!Number.isInteger(stock) || amount > stock) {
      return false;
    }

    setItems((current) =>
        current.map((product) =>
            String(product.id) === String(id)
                ? {
                  ...product,
                  quantity: amount,
                }
                : product
        )
    );

    return true;
  };

  // Vaciar el carrito.
  const clearCart = () => {
    setItems([]);
  };

  // Total de unidades.
  const totalItems = useMemo(
      () =>
          items.reduce(
              (sum, item) => sum + Number(item.quantity || 0),
              0
          ),
      [items]
  );

  // Subtotal estimado.
  const totalPrice = useMemo(
      () =>
          items.reduce(
              (sum, item) =>
                  sum +
                  Number(item.price || 0) *
                  Number(item.quantity || 0),
              0
          ),
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
    throw new Error(
        "useCart debe usarse dentro de CartProvider"
    );
  }

  return context;
}