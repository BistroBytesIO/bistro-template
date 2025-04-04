import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../CartContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Check, ShoppingCart } from "lucide-react";

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

  const [serviceFee, setServiceFee] = useState(0.0);
  const [taxAmount, setTaxAmount] = useState(0.0);
  const [total, setTotal] = useState(subtotal);

  // Calculate service fee and tax on page load or when subtotal changes
  useEffect(() => {
    const TAX_RATE = 0.0825; // Texas 8.25% sales tax
    const fee = subtotal * 0.029 + 0.3;
    const tax = subtotal * TAX_RATE;

    setServiceFee(fee);
    setTaxAmount(tax);
    setTotal(subtotal + fee + tax);
  }, [subtotal]);

  const handleChange = (e) => {
    setUserInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    
    // Clear error for this field when user types
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  // Helper function to scroll to an element by name
  const scrollToField = (fieldName) => {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      field.focus();
    }
  };

  // Place order and navigate to payment
  const handlePlaceOrder = async () => {
    // Basic field validation
    const newErrors = {};
    
    if (!userInfo.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!userInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInfo.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    
    if (!userInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Phone validation regex (basic US phone number pattern)
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(userInfo.phone.trim())) {
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // If we have any errors, set them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first error field
      scrollToField(Object.keys(newErrors)[0]);
      return;
    }

    setIsPlacingOrder(true);

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
      <div className="max-w-6xl mx-auto">
        {/* Checkout Progress Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Checkout</h1>
          
          {/* Responsive checkout progress indicator */}
          <div className="flex flex-wrap items-center justify-center px-2">
            {/* Cart step */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                <ShoppingCart size={16} />
              </div>
              <div className="ml-2 mr-2 text-gray-800">Cart</div>
              <div className="h-px w-6 sm:w-12 bg-primary hidden sm:block"></div>
            </div>
            
            {/* Checkout step */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex sm:hidden items-center justify-center">
                <div className="h-6 w-px bg-primary mx-1"></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                <Check size={16} />
              </div>
              <div className="ml-2 mr-2 font-bold text-primary">Checkout</div>
              <div className="h-px w-6 sm:w-12 bg-gray-300 hidden sm:block"></div>
            </div>
            
            {/* Payment step */}
            <div className="flex items-center">
              <div className="flex sm:hidden items-center justify-center">
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600">
                <CreditCard size={16} />
              </div>
              <div className="ml-2 text-gray-500">Payment</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Customer Info Form */}
          <div className="bg-white p-6 rounded-lg shadow flex-1">
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b">Customer Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Name<span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="First and last name"
                  value={userInfo.name}
                  onChange={handleChange}
                  className={`w-full ${errors.name ? "border-red-500 ring-1 ring-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Email<span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  value={userInfo.email}
                  onChange={handleChange}
                  className={`w-full ${errors.email ? "border-red-500 ring-1 ring-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Phone<span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="phone"
                  placeholder="1234567890"
                  value={userInfo.phone}
                  onChange={handleChange}
                  className={`w-full ${errors.phone ? "border-red-500 ring-1 ring-red-500" : ""}`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Special Notes
                </label>
                <Textarea
                  name="notes"
                  placeholder="Allergies, preparation preferences, etc."
                  value={userInfo.notes}
                  onChange={handleChange}
                  className="w-full resize-none h-24"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow md:w-1/3 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Order Summary</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 py-4">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {/* Order items scrollable container - taller on mobile, shorter on desktop */}
                <div className="max-h-[50vh] md:max-h-64 overflow-y-auto pr-2 border rounded-md border-gray-100">
                  <div className="p-2">
                    {cart.map((item) => (
                      <div key={item.cartItemId} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="pr-4">
                          <p className="font-medium text-gray-800">
                            {item.name} <span className="text-gray-600">x{item.quantity}</span>
                          </p>
                          
                          {item.customizations && item.customizations.length > 0 && (
                            <div className="mt-1 ml-3 text-sm text-gray-600">
                              {item.customizations.map((customization, idx) => (
                                <div key={idx}>
                                  • {customization.name}
                                  {customization.price > 0 && (
                                    <span className="text-primary"> 
                                      (+${customization.price.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-right">
                          ${((item.totalPrice || item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8.25%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cart.length === 0}
                  className="mt-4 w-full text-lg py-3 bg-primary text-white hover:bg-primary-foreground hover:text-primary sticky bottom-0"
                >
                  {isPlacingOrder ? (
                    <div className="flex items-center justify-center gap-2">
                      <ClipLoader color="#ffffff" size={20} />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Place Order & Continue to Payment"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;