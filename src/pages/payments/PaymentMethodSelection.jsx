import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Apple, Wallet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";

const PaymentMethodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");
  
  const {
    isLoading,
    error,
    availableMethods,
    deviceInfo,
    hasApplePay,
    hasGooglePay,
    hasMobilePayments,
    isMobile,
    getRecommendedMethod
  } = usePaymentMethods();

  if (!orderId) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-secondary p-6 rounded shadow">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle size={20} />
            <p className="text-lg font-semibold">Order Not Found</p>
          </div>
          <p className="text-gray-700 mb-4">
            No order ID found. Please place an order first.
          </p>
          <Button 
            onClick={() => navigate('/menu')}
            className="w-full bg-primary text-white"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  const handlePaymentMethod = (methodId) => {
    switch (methodId) {
      case 'apple_pay':
        navigate(`/payment/applepay?orderId=${orderId}`);
        break;
      case 'google_pay':
        navigate(`/payment/googlepay?orderId=${orderId}`);
        break;
      case 'card':
      default:
        navigate(`/payment/stripe?orderId=${orderId}`);
        break;
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      Apple: Apple,
      Wallet: Wallet,
      CreditCard: CreditCard
    };
    const IconComponent = icons[iconName] || CreditCard;
    return <IconComponent size={20} />;
  };

  return (
    <div className="bg-background min-h-screen flex p-4 justify-center">
      <div className="h-full max-w-lg w-full bg-secondary p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Select Payment Method
        </h2>
        <p className="mb-6 text-gray-700">Order ID: {orderId}</p>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
            <p className="text-gray-600">Detecting available payment methods...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle size={16} />
              <p className="font-semibold">Detection Error</p>
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Methods */}
        {!isLoading && (
          <div className="space-y-3">
            {availableMethods.map((method) => (
              <div key={method.id} className="relative">
                <Button
                  onClick={() => handlePaymentMethod(method.id)}
                  className={`w-full flex items-center justify-between gap-3 py-4 px-6 text-left ${
                    method.id === 'apple_pay' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : method.id === 'google_pay'
                      ? 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50'
                      : 'bg-primary hover:bg-primary-foreground hover:text-primary text-white'
                  }`}
                  disabled={!method.available}
                >
                  <div className="flex items-center gap-3">
                    {getIconComponent(method.icon)}
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className={`text-sm ${
                        method.id === 'google_pay' ? 'text-gray-600' : 'opacity-80'
                      }`}>
                        {method.description}
                      </div>
                    </div>
                  </div>
                  {method.recommended && (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  )}
                </Button>
                
                {method.requiresSetup && (
                  <div className="mt-1 px-3 text-xs text-amber-600">
                    ⚠️ Setup required in Wallet app
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Device Information */}
        {!isLoading && isMobile && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Smartphone size={16} />
              <p className="font-semibold">Mobile Device Detected</p>
            </div>
            <div className="text-sm text-blue-700">
              {hasMobilePayments ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={12} />
                    <span>Fast mobile payments available</span>
                  </div>
                  {hasApplePay && (
                    <div className="text-xs opacity-80">
                      • Apple Pay: Touch ID or Face ID authentication
                    </div>
                  )}
                  {hasGooglePay && (
                    <div className="text-xs opacity-80">
                      • Google Pay: Saved payment methods
                    </div>
                  )}
                </div>
              ) : (
                <p>Mobile payment options may be limited on this device</p>
              )}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            🔒 All payments are processed securely. Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;