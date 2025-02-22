import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const PayPalPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paypalRef = useRef(null);

  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  useEffect(() => {
    // For real usage, you often create an "order" in PayPal via your backend
    // then pass that PayPal order ID to the button's createOrder function.
    // Here, we do a simplified approach that uses the client-side integration only.

    if (window.paypal) {
      window.paypal
        .Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  description: `Order #${orderId}`,
                  amount: {
                    currency_code: "USD",
                    value: "10.00", // fetch real total from your backend ideally
                  },
                },
              ],
            });
          },
          onApprove: async (data, actions) => {
            const order = await actions.order.capture();
            console.log("PayPal order captured:", order);
            navigate(`/payment-success?orderId=${orderId}`);
          },
          onError: (err) => {
            console.error("PayPal error:", err);
            alert("Payment failed, please try again.");
          },
        })
        .render(paypalRef.current);
    }
  }, [orderId, navigate]);

  if (!orderId) {
    return (
      <div className="bg-orange-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-6 rounded shadow">
          <p className="text-gray-700">
            No order ID found. Please place an order first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Pay with PayPal
        </h2>
        <p className="mb-6 text-gray-700">Order ID: {orderId}</p>

        <div ref={paypalRef} className="flex justify-center" />
      </div>
    </div>
  );
};

export default PayPalPaymentPage;
