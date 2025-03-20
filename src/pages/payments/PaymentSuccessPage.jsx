import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, ShoppingCart, Check, CreditCard, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  // Get current time for estimated pickup
  const now = new Date();
  const estimatedPickupTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Checkout Progress Indicator */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Order Complete</h1>
          
          {/* Responsive checkout progress indicator */}
          <div className="flex flex-wrap items-center justify-center px-2">
            {/* Cart step - completed with success color */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
                <ShoppingCart size={16} />
              </div>
              <div className="ml-2 mr-2 text-green-700">Cart</div>
              <div className="h-px w-6 sm:w-12 bg-green-500 hidden sm:block"></div>
            </div>
            
            {/* Checkout step - completed with success color */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex sm:hidden items-center justify-center">
                <div className="h-6 w-px bg-green-500 mx-1"></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
                <Check size={16} />
              </div>
              <div className="ml-2 mr-2 text-green-700">Checkout</div>
              <div className="h-px w-6 sm:w-12 bg-green-500 hidden sm:block"></div>
            </div>
            
            {/* Payment step - completed with success color */}
            <div className="flex items-center">
              <div className="flex sm:hidden items-center justify-center">
                <div className="h-6 w-px bg-green-500 mx-1"></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
                <CheckCircle size={16} />
              </div>
              <div className="ml-2 text-green-700 font-bold">Complete</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Thank You for Your Order!
          </h2>
          
          <p className="text-center text-gray-600 mb-6">
            Your payment has been processed successfully.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-semibold text-gray-800">#{orderId}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estimated Pickup:</span>
              <div className="flex items-center">
                <Clock size={16} className="text-primary mr-1" />
                <span className="font-semibold text-gray-800">{formatTime(now)} - {formatTime(estimatedPickupTime)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-b py-4 my-4">
            <p className="text-gray-700 text-center">
              You will receive a confirmation email with your order details shortly.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link to="/" className="w-full">
              <Button className="w-full bg-primary text-white hover:bg-primary-foreground hover:text-primary">
                Return to Home
              </Button>
            </Link>
            
            <Link to="/menu" className="w-full">
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                <span>Order More</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;