import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Smartphone, 
  Apple, 
  Wallet, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Zap
} from "lucide-react";

const PaymentMethodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [availableMethods, setAvailableMethods] = useState([]);
  const [error, setError] = useState(null);

  // Safely get orderId from URL params
  const orderId = React.useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get("orderId");
    } catch (err) {
      console.error("Error parsing URL params:", err);
      return null;
    }
  }, [location.search]);

  useEffect(() => {
    const detectCapabilities = () => {
      try {
        const userAgent = navigator.userAgent || "";
        
        // Safe device detection with fallbacks
        const info = {
          isIOS: /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream,
          isAndroid: /Android/i.test(userAgent),
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
          isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
          isChrome: /chrome/i.test(userAgent),
          isHTTPS: (typeof window !== 'undefined' && window.location) ? 
                   (window.location.protocol === 'https:' || window.location.hostname === 'localhost') : false
        };

        setDeviceInfo(info);

        // Build available payment methods
        const methods = [];

        // ExpressCheckout - Always add as primary option
        methods.push({
          id: 'express_checkout',
          name: 'Express Checkout',
          icon: 'Zap',
          description: 'Apple Pay, Google Pay, and more',
          priority: 1,
          available: true,
          recommended: true,
          features: ['Fast checkout', 'Secure authentication', 'Multiple payment methods']
        });

        // Regular card payment - Always available
        methods.push({
          id: 'card',
          name: 'Credit/Debit Card',
          icon: 'CreditCard',
          description: 'Pay with your credit or debit card',
          priority: 2,
          available: true,
          recommended: false,
          features: ['Universal acceptance', 'Manual entry']
        });

        // Apple Pay detection with error handling
        let applePayAvailable = false;
        try {
          applePayAvailable = !!(window.ApplePaySession && 
                               typeof window.ApplePaySession.canMakePayments === 'function' &&
                               window.ApplePaySession.canMakePayments());
        } catch (e) {
          console.log("Apple Pay detection failed:", e);
          applePayAvailable = false;
        }

        // Google Pay detection with error handling
        let googlePayAvailable = false;
        try {
          googlePayAvailable = info.isHTTPS && typeof window.PaymentRequest !== 'undefined';
        } catch (e) {
          console.log("Google Pay detection failed:", e);
          googlePayAvailable = false;
        }

        // Legacy Apple Pay option (for specific Apple Pay only)
        if (info.isIOS || info.isSafari) {
          methods.push({
            id: 'apple_pay_only',
            name: 'Apple Pay Only',
            icon: 'Apple',
            description: 'Apple Pay with Touch ID or Face ID',
            priority: 3,
            available: applePayAvailable,
            recommended: false,
            features: ['iOS only', 'Touch/Face ID authentication'],
            legacy: true
          });
        }

        // Legacy Google Pay option (for specific Google Pay only)
        if (info.isAndroid || info.isChrome) {
          methods.push({
            id: 'google_pay_only',
            name: 'Google Pay Only',
            icon: 'Wallet',
            description: 'Google Pay with saved payment methods',
            priority: 3,
            available: googlePayAvailable,
            recommended: false,
            features: ['Android/Chrome optimized', 'Saved payment methods'],
            legacy: true
          });
        }

        setAvailableMethods(methods.sort((a, b) => a.priority - b.priority));
        setIsLoading(false);
        
      } catch (err) {
        console.error("Error in detectCapabilities:", err);
        setError("Failed to detect payment capabilities");
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(detectCapabilities, 100);
    return () => clearTimeout(timer);
  }, []);

  // Safe icon rendering
  const renderIcon = (iconName) => {
    const iconMap = {
      'Zap': <Zap size={20} />,
      'CreditCard': <CreditCard size={20} />,
      'Apple': <Apple size={20} />,
      'Wallet': <Wallet size={20} />
    };
    
    return iconMap[iconName] || <CreditCard size={20} />;
  };

  const handlePaymentMethod = (methodId) => {
    try {
      switch (methodId) {
        case 'express_checkout':
          navigate(`/payment/express-checkout?orderId=${orderId}`);
          break;
        case 'apple_pay_only':
          navigate(`/payment/applepay?orderId=${orderId}`);
          break;
        case 'google_pay_only':
          navigate(`/payment/googlepay?orderId=${orderId}`);
          break;
        case 'card':
        default:
          navigate(`/payment/stripe?orderId=${orderId}`);
          break;
      }
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Failed to navigate to payment page");
    }
  };

  // Error boundary for the component
  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-6 rounded shadow border border-red-200">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle size={20} />
            <p className="text-lg font-semibold">Error Loading Payment Options</p>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white"
            >
              Retry
            </Button>
            <Button 
              onClick={() => navigate('/menu')}
              variant="outline"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Missing order ID
  if (!orderId) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-6 rounded shadow">
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

  return (
    <div className="bg-background min-h-screen flex p-4 justify-center">
      <div className="h-full max-w-lg w-full bg-white p-6 rounded shadow">
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

        {/* Payment Methods */}
        {!isLoading && (
          <div className="space-y-4">
            {availableMethods.filter(method => !method.legacy).map((method) => (
              <div key={method.id} className="relative">
                <Button
                  onClick={() => handlePaymentMethod(method.id)}
                  className={`w-full flex items-start justify-between gap-3 py-6 px-6 text-left h-auto ${
                    method.id === 'express_checkout'
                      ? 'bg-primary hover:bg-primary/90 text-white border-2 border-primary' 
                      : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200'
                  }`}
                  disabled={!method.available}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {renderIcon(method.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{method.name}</div>
                      <div className={`text-sm ${
                        method.id === 'express_checkout' ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {method.description}
                      </div>
                      {method.features && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {method.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full ${
                                method.id === 'express_checkout'
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {method.recommended && (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full self-start">
                      Recommended
                    </div>
                  )}
                </Button>
              </div>
            ))}

            {/* Legacy Options (Collapsed) */}
            {availableMethods.some(method => method.legacy && method.available) && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 p-2 border border-gray-200 rounded bg-gray-50">
                  More payment options (legacy)
                </summary>
                <div className="mt-2 space-y-2">
                  {availableMethods.filter(method => method.legacy && method.available).map((method) => (
                    <Button
                      key={method.id}
                      onClick={() => handlePaymentMethod(method.id)}
                      className="w-full flex items-center justify-between gap-3 py-3 px-4 text-left bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {renderIcon(method.icon)}
                        <div>
                          <div className="font-medium text-sm">{method.name}</div>
                          <div className="text-xs text-gray-500">{method.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Device Information */}
        {!isLoading && deviceInfo.isMobile && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Smartphone size={16} />
              <p className="font-semibold">Mobile Device Detected</p>
            </div>
            <div className="text-sm text-blue-700">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={12} />
                <span>Express Checkout provides the best mobile experience</span>
              </div>
              <div className="text-xs opacity-80 ml-4">
                • Supports {deviceInfo.isIOS ? 'Apple Pay with Touch/Face ID' : deviceInfo.isAndroid ? 'Google Pay with fingerprint' : 'mobile wallets'}
                <br />
                • Faster checkout with saved payment methods
                <br />
                • Enhanced security with device authentication
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            🔒 All payments are processed securely. Your payment information is never stored on our servers.
          </p>
        </div>

        {/* Debug Info (Development Only) */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs space-y-1">
            <p><strong>Debug Info:</strong></p>
            <p>Device: {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</p>
            <p>iOS: {deviceInfo.isIOS?.toString() || 'false'}</p>
            <p>Android: {deviceInfo.isAndroid?.toString() || 'false'}</p>
            <p>HTTPS: {deviceInfo.isHTTPS?.toString() || 'false'}</p>
            <p>Apple Pay: {typeof window !== 'undefined' && window.ApplePaySession ? 'Available' : 'Not Available'}</p>
            <p>Payment Request API: {typeof window !== 'undefined' && window.PaymentRequest ? 'Available' : 'Not Available'}</p>
            <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent?.substring(0, 50) + '...' : 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelection;