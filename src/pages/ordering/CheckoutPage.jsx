import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../CartContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CheckoutPage = () => {
  const { cart, subtotal } = useContext(CartContext);
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Track errors for required fields
  const [errors, setErrors] = useState({});

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const loaderOverride = {
    display: "block",
    margin: "0 auto",
    borderColor: "red",
  };

  const [serviceFee, setServiceFee] = useState(0.0);
  const [total, setTotal] = useState(subtotal);

  // Calculate service fee on page load
  useState(() => {
    const TAX_RATE = 0.0825; // Texas 8.25% sales tax
    const fee = subtotal * 0.049 + 0.3;
    const tax = subtotal * TAX_RATE;

    setServiceFee(fee.toFixed(2));
    setTotal((subtotal + fee + tax).toFixed(2));
  }, [subtotal]);

  const handleChange = (e) => {
    setUserInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Place order and navigate to payment
  const handlePlaceOrder = async () => {
    // Helper function to scroll to an element by name
    const scrollToField = (fieldName) => {
      const field = document.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.focus();
      }
    };

    // Basic field validation
    if (!userInfo.name.trim()) {
      toast.error("Please enter your name.");
      scrollToField("name");
      return;
    }

    if (!userInfo.email.trim()) {
      toast.error("Please enter your email address.");
      scrollToField("email");
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email.trim())) {
      toast.error("Please enter a valid email address.");
      scrollToField("email");
      return;
    }

    if (!userInfo.phone.trim()) {
      toast.error("Please enter your phone number.");
      scrollToField("phone");
      return;
    }

    // Phone validation regex (basic US phone number pattern)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(userInfo.phone.trim())) {
      toast.error("Please enter a valid 10-digit phone number.");
      scrollToField("phone");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsPlacingOrder(true);
    // Basic validation
    const newErrors = {};
    if (!userInfo.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!userInfo.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!userInfo.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    // If we have any errors, set them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsPlacingOrder(false);
      return;
    }

    // Clear errors if any fields were fixed
    setErrors({});

    // Build the order payload
    const items = cart.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      priceAtOrderTime: item.totalPrice || item.price || 0,
      customizations: item.customizations,
    }));

    const orderPayload = {
      customerId: 999,
      items,
      customerEmail: userInfo.email,
      customerName: userInfo.name,
      specialNotes: userInfo.notes,
    };

    try {
      const res = await api.post("/orders", orderPayload);
      const newOrder = res.data;
      toast.success(`Order #${newOrder.id} placed successfully!`);

      // Navigate to payment method selection
      navigate(`/payment-method?orderId=${newOrder.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error placing order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="bg-background min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Checkout</h2>

        {/* User Info Fields */}
        <div className="grid gap-4 mb-6">
          {/* Name */}
          <div>
            {errors.name && (
              <p className="text-red-500 text-sm mb-1">{errors.name}</p>
            )}
            <label className="block mb-1 font-semibold text-gray-700">
              Name:
            </label>
            <Input
              type="text"
              name="name"
              placeholder="name"
              value={userInfo.name}
              onChange={handleChange}
              // If there's an error, turn border red; else gray
              className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 
              ${errors.name ? "border-red-500" : "border-gray-300"} border`}
            />
          </div>

          {/* Email */}
          <div>
            {errors.email && (
              <p className="text-red-500 text-sm mb-1">{errors.email}</p>
            )}
            <label className="block mb-1 font-semibold text-gray-700">
              Email:
            </label>
            <Input
              type="email"
              name="email"
              placeholder="email"
              value={userInfo.email}
              onChange={handleChange}
              className={`w-full rounded px-3 py-2
              ${errors.email ? "border-red-500" : "border-gray-300"} border`}
            />
          </div>

          {/* Phone */}
          <div>
            {errors.phone && (
              <p className="text-red-500 text-sm mb-1">{errors.phone}</p>
            )}
            <label className="block mb-1 font-semibold text-gray-700">
              Phone:
            </label>
            <Input
              type="text"
              name="phone"
              placeholder="1234567890"
              value={userInfo.phone}
              onChange={handleChange}
              className={`w-full rounded px-3 py-2 ${errors.phone ? "border-red-500" : "border-gray-300"} border`}
            />
          </div>

          {/* Special Notes */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              Special Notes:
            </label>
            <Textarea
              name="notes"
              value={userInfo.notes}
              placeholder="Input message here"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            Order Summary:
          </h4>
          {cart.length === 0 ? (
            <p className="text-gray-700">Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="mb-4">
                  <p className="text-gray-800">
                    <strong>{item.name}</strong> x {item.quantity} @ $
                    {(
                      item.basePrice ||
                      item.price ||
                      0 * item.quantity
                    ).toFixed(2)}
                  </p>
                  {item.customizations && item.customizations.length > 0 && (
                    <ul className="ml-4 mt-1 list-disc list-inside text-gray-600">
                      {item.customizations.map((customization) => (
                        <li key={customization.id}>
                          {customization.name} (+ $
                          {customization.price.toFixed(2)})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              <p className="mt-2 text-gray-800">
                <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
              </p>
              <div>
                <strong>Service Fee:</strong> ${serviceFee}
              </div>
              <div>
                <strong>Tax:</strong> ${(subtotal * 0.0825).toFixed(2)}
              </div>
              <div>
                <strong>Total:</strong> ${total}
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-right">
          <Button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="bg-primary text-background w-full sm:w-auto"
          >
            {isPlacingOrder ? (
              <div className="flex items-center space-x-2">
                <span>Placing Order...</span>
                <ClipLoader
                  color="#ffffff"
                  loading={true}
                  cssOverride={loaderOverride}
                  size={20}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </div>
            ) : (
              "Place Order & Pay"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
