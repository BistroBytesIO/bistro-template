import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Apple, Wallet } from "lucide-react";

const PaymentMethodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    supportsApplePay: false,
    supportsGooglePay: false
  });

  useEffect(() => {
    // Detect device and payment method support
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isAndroid = /android/i.test(userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      // Check for Apple Pay support
      let supportsApplePay = false;
      if (window.ApplePaySession && ApplePaySession.canMakePayments) {
        supportsApplePay = ApplePaySession.canMakePayments();
      }

      // Check for Google Pay support
      let supportsGooglePay = false;
      if (window.google && window.google.payments && window.google.payments.api) {
        supportsGooglePay = true;
      }

      setDeviceInfo({
        isIOS,
        isAndroid,
        isMobile,
        supportsApplePay,
        supportsGooglePay
      });
    };

    detectDevice();
  }, []);

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

  const handleApplePay = () => {
    navigate(`/payment/applepay?orderId=${orderId}`);
  };

  const handleGooglePay = () => {
    navigate(`/payment/googlepay?orderId=${orderId}`);
  };

  return (
    <div className="bg-background min-h-screen flex p-4 justify-center">
      <div className="h-full max-w-lg w-full bg-secondary p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Select Payment Method
        </h2>
        <p className="mb-6 text-gray-700">Order ID: {orderId}</p>

        <div className="space-y-3">
          {/* Apple Pay - Show only on iOS devices or if Apple Pay is supported */}
          {(deviceInfo.isIOS || deviceInfo.supportsApplePay) && (
            <Button
              onClick={handleApplePay}
              className="w-full bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-3 py-4"
            >
              <Apple size={20} />
              <span className="font-medium">Pay with Apple Pay</span>
            </Button>
          )}

          {/* Google Pay - Show only on Android devices or if Google Pay is supported */}
          {(deviceInfo.isAndroid || deviceInfo.supportsGooglePay) && (
            <Button
              onClick={handleGooglePay}
              className="w-full bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 py-4"
            >
              <Wallet size={20} className="text-blue-500" />
              <span className="font-medium">Pay with Google Pay</span>
            </Button>
          )}

          {/* Credit Card Payment */}
          <Button
            onClick={handleStripe}
            className="w-full bg-primary hover:bg-primary-foreground hover:text-primary text-white flex items-center justify-center gap-3 py-4"
          >
            <CreditCard size={20} />
            <span className="font-medium">Pay with Card</span>
          </Button>

          {/* Mobile-specific message */}
          {deviceInfo.isMobile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Smartphone size={16} />
                <p className="text-sm">
                  {deviceInfo.isIOS && deviceInfo.supportsApplePay && "Apple Pay available for faster checkout"}
                  {deviceInfo.isAndroid && deviceInfo.supportsGooglePay && "Google Pay available for faster checkout"}
                  {!deviceInfo.supportsApplePay && !deviceInfo.supportsGooglePay && "Mobile payment options may be limited on this device"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;