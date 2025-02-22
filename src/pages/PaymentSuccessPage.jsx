import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Payment Successful!
        </h2>

        {orderId && (
          <p className="text-lg text-gray-700 mb-2">
            <span className="font-medium">Your Order ID:</span>{" "}
            <span className="text-primary">{orderId}</span>
          </p>
        )}

        <p className="text-gray-600 mb-6">
          Thank you for your payment. You will receive a confirmation email with
          further details shortly.
        </p>

        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md shadow hover:bg-primary-dark transition-colors duration-200"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
