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

const stripePromise = loadStripe(
  "pk_test_51Qh2TACsY3eILNq5VJbPkcUQIouI2qA94JXochuGyrSx9xA0BvYs0h5U1jDZzW5aMIiE99m5P3A91VGcp7KINEbL00rCB0HoX8"
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
  }, [orderId]);

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
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Checkout with Card
        </h2>

        {error && (
          <p className="bg-red-50 border border-red-200 text-red-600 p-2 rounded mb-4">
            {error}
          </p>
        )}

        {!clientSecret && (
          <p className="text-gray-700">Loading payment details...</p>
        )}

        {clientSecret && (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Card Number
              </label>
              <div className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2">
                <CardNumberElement options={elementStyle} />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Expiration Date
              </label>
              <div className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2">
                <CardExpiryElement options={elementStyle} />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                CVC
              </label>
              <div className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2">
                <CardCvcElement options={elementStyle} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!stripe || isConfirming}
              className="bg-primary text-background w-full"
            >
              {isConfirming ? "Processing..." : "Confirm Payment"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StripePaymentPage;
