import React, { createContext, useState, useMemo } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Generate a unique cart item ID based on menu item ID and customizations
  const generateCartItemId = (item) => {
    const baseId = item.id;
    
    // If no customizations, just use the base ID
    if (!item.customizations || item.customizations.length === 0) {
      return baseId.toString();
    }
    
    // Sort customization IDs to ensure consistent ordering
    const customizationIds = item.customizations
      .map(c => c.id)
      .sort()
      .join("-");
      
    // Combine base ID with customization IDs
    return `${baseId}-${customizationIds}`;
  };

  // 1. Add or Increment with unique cart item ID
  const addToCart = (item) => {
    const cartItemId = generateCartItemId(item);
    
    setCart((prevCart) => {
      // Find existing item with matching unique ID
      const existingItemIndex = prevCart.findIndex(
        (ci) => ci.cartItemId === cartItemId
      );
      
      if (existingItemIndex >= 0) {
        // Item exists, create a new array with updated quantity
        return prevCart.map((ci, index) =>
          index === existingItemIndex
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      } else {
        // New item, add to cart with unique cart item ID
        return [...prevCart, { 
          ...item, 
          cartItemId,
          quantity: 1 
        }];
      }
    });
  };

  // 2. Increment Quantity - now using cartItemId
  const incrementQuantity = (cartItemId) => {
    setCart((prevCart) =>
      prevCart.map((ci) =>
        ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + 1 } : ci
      )
    );
  };

  // 3. Decrement Quantity - now using cartItemId
  const decrementQuantity = (cartItemId) => {
    setCart(
      (prevCart) =>
        prevCart
          .map((ci) => {
            if (ci.cartItemId === cartItemId) {
              const newQty = ci.quantity - 1;
              return newQty > 0 ? { ...ci, quantity: newQty } : ci;
            }
            return ci;
          })
          .filter((ci) => ci.quantity > 0) // remove items that drop to 0
    );
  };

  // 4. Remove Item - now using cartItemId
  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.cartItemId !== cartItemId));
  };

  // 5. Clear Cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (item.totalPrice || item.price || 0) * (item.quantity || 1),
      0
    );
  }, [cart]);

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