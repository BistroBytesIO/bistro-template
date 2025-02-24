import React, { useContext } from "react";
import { CartContext } from "../../CartContext";
import { Button } from "@/components/ui/button";

const CartPage = () => {
  const {
    cart,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    subtotal,
  } = useContext(CartContext);

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto bg-background shadow p-6 rounded">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Cart</h2>

        {cart.length === 0 ? (
          <p className="text-gray-700">Cart is empty.</p>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <img
                      src={item.imageUrl || "/images/placeholder.png"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h4>
                      <p className="text-gray-700">
                        Price: ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => decrementQuantity(item.id)}
                      className="text-gray-700 hover:bg-secondary"
                    >
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="ghost"
                      onClick={() => incrementQuantity(item.id)}
                      className="text-gray-700 hover:bg-secondary"
                    >
                      +
                    </Button>
                    <Button
                      onClick={() => removeFromCart(item.id)}
                      variant="destructive"
                      className="text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-6" />
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-800">
                Subtotal
              </span>
              <span className="text-xl text-primary font-semibold">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
