import React, { useContext } from "react";
import { CartContext } from "../CartContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { X, Plus, Minus } from "lucide-react";

const MiniCart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cart,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    subtotal,
  } = useContext(CartContext);

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <div
      className={`fixed top-0 bg-background right-0 h-full w-80 shadow-lg z-50
                  transform transition-transform duration-300
                  ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Your Cart</h3>
          <Button variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <p>Cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center mb-4"
              >
                <div>
                  <strong>{item.name}</strong>
                  <p className="text-primary">
                    ${(item.totalPrice || item.price || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    className="hover:bg-secondary"
                    variant="ghost"
                    size="sm"
                    onClick={() => decrementQuantity(item.id)}
                  >
                    <Minus />
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    className="hover:bg-secondary"
                    variant="ghost"
                    size="sm"
                    onClick={() => incrementQuantity(item.id)}
                  >
                    <Plus />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <strong>Subtotal:</strong>
            <span>${isNaN(subtotal) ? "0.00" : subtotal.toFixed(2)}</span>
          </div>
          <Button onClick={handleCheckout} className="w-full text-background">
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MiniCart;
