import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PaymentMethodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  if (!orderId) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-secondary p-6 rounded shadow">
          <p className="text-lg text-gray-700">
            No order ID found. Please place an order first.
          </p>
        </div>
      </div>
    );
  }

  const handleStripe = () => {
    navigate(`/payment/stripe?orderId=${orderId}`);
  };

  const handlePayPal = () => {
    navigate(`/payment/paypal?orderId=${orderId}`);
  };

  // const handleApplePay = () => {
  //   navigate(`/payment/applepay?orderId=${orderId}`);
  // };

  return (
    <div className="bg-background min-h-screen flex p-4 justify-center">
      <div className="h-full max-w-lg w-full bg-secondary p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Select Payment Method
        </h2>
        <p className="mb-6 text-gray-700">Order ID: {orderId}</p>

        <div className="space-y-3">
          <Button
            onClick={handleStripe}
            className="w-full bg-purple-500 hover:bg-purple-400 text-white"
          >
            Pay with Card
          </Button>
          {/* <Button
            onClick={handlePayPal}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
          >
            Pay with PayPal
          </Button> */}
          {/* <Button
            onClick={handleApplePay}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Pay with Apple Pay
          </Button> */}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;
