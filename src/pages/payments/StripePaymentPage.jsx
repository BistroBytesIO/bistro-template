import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { CartContext } from "../../CartContext";
import api from "../../services/api";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, CreditCard, LockKeyhole } from "lucide-react";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

const elementStyle = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

const StripePaymentPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <SplitPaymentForm />
    </Elements>
  );
};

const SplitPaymentForm = () => {
  const { subtotal, clearCart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  const stripe = useStripe();
  const elements = useElements();

  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const body = {
          paymentMethod: "STRIPE",
          amount: subtotal,
          currency: "USD",
          description: `Order #${orderId}`,
        };
        console.log("cost", body.amount);
        const res = await api.post(`/orders/${orderId}/pay/stripe`, body);
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        setError("Failed to initialize payment. Please try again.");
        console.error(err);
      }
    };

    if (orderId) {
      fetchPaymentIntent();
    }
  }, [orderId, subtotal]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setIsConfirming(true);
      setError("");

      const { paymentIntent, error: stripeError } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardNumberElement),
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        setIsConfirming(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        api.post(`/orders/${orderId}/confirmPayment/stripe`);
        navigate(`/payment-success?orderId=${orderId}`);
      } else {
        setError("Payment was not successful. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      clearCart();
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-background min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Checkout Progress Indicator */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Payment</h1>
          
          {/* Responsive checkout progress indicator */}
          <div className="flex flex-wrap items-center justify-center px-2">
            {/* Cart step - completed */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                <ShoppingCart size={16} />
              </div>
              <div className="ml-2 mr-2 text-gray-800">Cart</div>
              <div className="h-px w-6 sm:w-12 bg-primary hidden sm:block"></div>
            </div>
            
            {/* Checkout step - completed */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex sm:hidden items-center justify-center">
                <div className="h-6 w-px bg-primary mx-1"></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                <Check size={16} />
              </div>
              <div className="ml-2 mr-2 text-gray-800">Checkout</div>
              <div className="h-px w-6 sm:w-12 bg-primary hidden sm:block"></div>
            </div>
            
            {/* Payment step */}
            <div className="flex items-center">
              <div className="flex sm:hidden items-center justify-center">
                <div className="h-6 w-px bg-primary mx-1"></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                <CreditCard size={16} />
              </div>
              <div className="ml-2 font-bold text-primary">Payment</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-4 text-gray-700">
            <LockKeyhole className="mr-2 text-green-600" size={20} />
            <span>Secure payment processing</span>
          </div>
          
          {orderId && (
            <p className="text-center text-gray-700 mb-4">
              Order #{orderId}
            </p>
          )}

          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-medium text-center text-gray-800 mb-1">
              Payment Details
            </h2>
            <p className="text-center text-gray-600 text-sm mb-0">
              Please enter your card information to complete your purchase
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {!clientSecret && (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex space-x-4 items-center">
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          )}

          {clientSecret && (
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700">
                  Card Number
                </label>
                <div className="border border-gray-300 rounded px-3 py-3 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                  <CardNumberElement options={elementStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold text-gray-700">
                    Expiration Date
                  </label>
                  <div className="border border-gray-300 rounded px-3 py-3 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <CardExpiryElement options={elementStyle} />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-gray-700">
                    CVC
                  </label>
                  <div className="border border-gray-300 rounded px-3 py-3 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <CardCvcElement options={elementStyle} />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!stripe || isConfirming}
                className="w-full mt-6 py-3 text-lg bg-primary text-white hover:bg-primary-foreground hover:text-primary"
              >
                {isConfirming ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </div>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripePaymentPage;