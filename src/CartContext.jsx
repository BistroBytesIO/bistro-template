import React, { createContext, useState, useMemo } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  // cart is an array of { id, name, price, quantity, ... }

  // 1. Add or Increment
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (ci) =>
          ci.id === item.id &&
          JSON.stringify(ci.customizations) ===
            JSON.stringify(item.customizations),
      );
      if (existingItem) {
        return prevCart.map((ci) =>
          ci.id === item.id &&
          JSON.stringify(ci.customizations) ===
            JSON.stringify(item.customizations)
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
        );
      } else {
        // new item, set initial quantity to 1
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  // 2. Increment Quantity
  const incrementQuantity = (itemId) => {
    setCart((prevCart) =>
      prevCart.map((ci) =>
        ci.id === itemId ? { ...ci, quantity: ci.quantity + 1 } : ci,
      ),
    );
  };

  // 3. Decrement Quantity
  const decrementQuantity = (itemId) => {
    setCart(
      (prevCart) =>
        prevCart
          .map((ci) => {
            if (ci.id === itemId) {
              const newQty = ci.quantity - 1;
              return newQty > 0 ? { ...ci, quantity: newQty } : ci;
            }
            return ci;
          })
          .filter((ci) => ci.quantity > 0), // remove items that drop to 0
    );
  };

  // 4. Remove Item
  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.id !== itemId));
  };

  // 5. Clear Cart
  const clearCart = () => {
    setCart([]);
  };

  // (Optional) Subtotal computed in context or in the component
  // useMemo for performance if the cart might be large
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (item.totalPrice || item.price || 0) * (item.quantity || 1),
      0,
    );
  }, [cart]);

  // Provide these functions and state to the entire app
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        incrementQuantity,
        decrementQuantity,
        removeFromCart,
        clearCart,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
