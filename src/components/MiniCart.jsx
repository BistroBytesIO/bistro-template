import React, { useContext, useState } from "react";
import { CartContext } from "../CartContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { X, Plus, Minus, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import CustomizationModal from "./CustomizationModal";

const MiniCart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cart,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    subtotal,
    updateCartItem,
  } = useContext(CartContext);

  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleUpdateCartItem = (updatedItem) => {
    updateCartItem(editingItem.cartItemId, updatedItem);
    handleCloseModal();
  };

  return (
    <div
      className={`fixed top-0 bg-background right-0 h-full w-96 shadow-lg z-50
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

        <div className="flex-1 overflow-y-auto pr-2">
          {cart.length === 0 ? (
            <p>Cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="border-b pb-3 mb-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{item.name}</p>
                    <p className="text-primary">
                      ${(item.totalPrice || item.price || 0).toFixed(2)}
                    </p>

                    {item.customizations && item.customizations.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-secondary">
                        {item.customizations.map((customization, idx) => (
                          <div key={idx} className="text-sm text-gray-600 whitespace-normal">
                            • {customization.name}
                            {customization.price > 0 && (
                              <span className="text-primary"> (+${customization.price.toFixed(2)})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        className="hover:bg-secondary h-7 w-7 p-0"
                        variant="ghost"
                        size="sm"
                        onClick={() => decrementQuantity(item.cartItemId)}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="text-center w-6">{item.quantity}</span>
                      <Button
                        className="hover:bg-secondary h-7 w-7 p-0"
                        variant="ghost"
                        size="sm"
                        onClick={() => incrementQuantity(item.cartItemId)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {item.customizations && item.customizations.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 size={14} className="mr-1" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        onClick={() => removeFromCart(item.cartItemId)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
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

      {isModalOpen && editingItem && (
        <CustomizationModal
          menuItemId={editingItem.id}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleUpdateCartItem}
          existingCustomizations={editingItem.customizations}
        />
      )}
    </div>
  );
};

export default MiniCart;