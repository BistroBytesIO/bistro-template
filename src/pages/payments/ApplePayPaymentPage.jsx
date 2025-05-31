import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { CartContext } from "../../CartContext";
import api from "../../services/api";
import { Apple, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

const ApplePayPaymentPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <ApplePayForm />
    </Elements>
  );
};

const ApplePayForm = () => {
  const { subtotal, clearCart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, processing, success, error

  useEffect(() => {
    if (!orderId) {
      setError("No order ID found");
      setIsLoading(false);
      return;
    }

    const initializeApplePay = async () => {
      try {
        setIsLoading(true);
        
        // Check if Apple Pay is available
        if (!window.ApplePaySession) {
          throw new Error("Apple Pay is not available on this device");
        }

        if (!ApplePaySession.canMakePayments()) {
          throw new Error("Apple Pay is not set up on this device");
        }

        // Create payment intent with Stripe
        const res = await api.post(`/orders/${orderId}/pay/stripe`, {
          paymentMethod: "applePay",
          amount: subtotal,
          currency: "USD",
          description: `Order #${orderId}`,
        });

        const { clientSecret } = res.data;
        const stripe = await stripePromise;

        // Create payment request
        const pr = stripe.paymentRequest({
          country: "US",
          currency: "usd",
          total: {
            label: `Bistro Order #${orderId}`,
            amount: Math.round(subtotal * 100), // Convert to cents
          },
          requestPayerName: true,
          requestPayerEmail: true,
          requestPayerPhone: true,
        });

        // Check if payment request can be made
        const canMake = await pr.canMakePayment();
        if (canMake) {
          setCanMakePayment(true);
          setPaymentRequest(pr);

          // Handle payment method event
          pr.on("paymentmethod", async (ev) => {
            setPaymentStatus("processing");
            
            try {
              const { paymentIntent, error } = await stripe.confirmCardPayment(
                clientSecret,
                { 
                  payment_method: ev.paymentMethod.id 
                },
                { handleActions: false }
              );

              if (error) {
                console.error("Payment confirmation error:", error);
                ev.complete("fail");
                setPaymentStatus("error");
                setError(error.message || "Payment failed");
                return;
              }

              if (paymentIntent.status === "requires_action") {
                const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
                if (actionError) {
                  ev.complete("fail");
                  setPaymentStatus("error");
                  setError(actionError.message || "Payment failed");
                  return;
                }
              }

              if (paymentIntent.status === "succeeded") {
                // Confirm payment on backend
                await api.post(`/orders/${orderId}/confirmPayment/stripe`, {
                  name: ev.paymentMethod?.billing_details?.name,
                  email: ev.paymentMethod?.billing_details?.email,
                  phone: ev.paymentMethod?.billing_details?.phone,
                });

                ev.complete("success");
                setPaymentStatus("success");
                clearCart();
                
                // Small delay to show success state
                setTimeout(() => {
                  navigate(`/payment-success?orderId=${orderId}`);
                }, 1500);
              } else {
                ev.complete("fail");
                setPaymentStatus("error");
                setError("Payment was not successful");
              }
            } catch (err) {
              console.error("Payment processing error:", err);
              ev.complete("fail");
              setPaymentStatus("error");
              setError("An error occurred while processing payment");
            }
          });
        } else {
          throw new Error("Apple Pay is not available for this transaction");
        }
      } catch (err) {
        console.error("Apple Pay initialization error:", err);
        setError(err.message || "Failed to initialize Apple Pay");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApplePay();
  }, [orderId, subtotal, navigate, clearCart]);

  const handleBackToPaymentMethods = () => {
    navigate(`/payment-method?orderId=${orderId}`);
  };

  return (
    <div className="bg-background min-h-screen py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Apple size={32} className="mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Apple Pay</h2>
          </div>
          <p className="text-gray-600">Order ID: {orderId}</p>
          <p className="text-lg font-semibold text-primary mt-2">
            Total: ${subtotal?.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
              <p className="text-gray-600">Setting up Apple Pay...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={32} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Apple Pay Unavailable
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={handleBackToPaymentMethods}
                className="bg-primary text-white hover:bg-primary-foreground hover:text-primary"
              >
                Choose Different Payment Method
              </Button>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={32} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600">Redirecting to confirmation page...</p>
            </div>
          )}

          {/* Processing State */}
          {paymentStatus === "processing" && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Processing Payment...
              </h3>
              <p className="text-gray-600">Please wait while we process your payment</p>
            </div>
          )}

          {/* Apple Pay Button */}
          {!isLoading && !error && paymentStatus === "idle" && (
            <>
              {canMakePayment && paymentRequest ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-2">
                      Touch ID or Face ID required for secure payment
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <PaymentRequestButtonElement
                      options={{ 
                        paymentRequest,
                        style: {
                          paymentRequestButton: {
                            type: "buy",
                            theme: "black",
                            height: "48px",
                          },
                        },
                      }}
                      className="apple-pay-button"
                    />
                  </div>

                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={handleBackToPaymentMethods}
                      className="text-gray-600 border-gray-300"
                    >
                      Use Different Payment Method
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto mb-4 text-yellow-500" size={32} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Apple Pay Not Available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Apple Pay is not available on this device or browser.
                  </p>
                  <Button
                    onClick={handleBackToPaymentMethods}
                    className="bg-primary text-white hover:bg-primary-foreground hover:text-primary"
                  >
                    Choose Different Payment Method
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Secure Payment:</strong> Your payment information is processed securely 
            through Apple Pay and never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplePayPaymentPage;