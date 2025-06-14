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

  // 6. Update Cart Item - for editing customizations
  const updateCartItem = (cartItemId, updatedItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(ci => ci.cartItemId === cartItemId);
      if (!existingItem) return prevCart;

      const newCartItemId = generateCartItemId(updatedItem);

      // If the new customizations match an existing item (other than the one being edited)
      const matchingItemIndex = prevCart.findIndex(
        ci => ci.cartItemId === newCartItemId && ci.cartItemId !== cartItemId
      );

      if (matchingItemIndex >= 0) {
        // Merge quantities and remove the old item
        return prevCart
          .map((ci, index) => {
            if (index === matchingItemIndex) {
              return {
                ...ci,
                quantity: ci.quantity + existingItem.quantity
              };
            }
            return ci;
          })
          .filter(ci => ci.cartItemId !== cartItemId);
      }

      // Otherwise, update the item with new customizations
      return prevCart.map(ci => {
        if (ci.cartItemId === cartItemId) {
          return {
            ...updatedItem,
            cartItemId: newCartItemId,
            quantity: existingItem.quantity
          };
        }
        return ci;
      });
    });
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
        updateCartItem,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};