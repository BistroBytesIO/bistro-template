import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { CartContext } from "../../CartContext";
import api from "../../services/api";
import { Wallet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

const GooglePayPaymentPage = () => {
    return (
        <Elements stripe={stripePromise}>
            <GooglePayForm />
        </Elements>
    );
};

const GooglePayForm = () => {
    const { subtotal, clearCart } = useContext(CartContext);
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");

    const [paymentRequest, setPaymentRequest] = useState(null);
    const [canMakePayment, setCanMakePayment] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("idle");
    const [orderTotal, setOrderTotal] = useState(0);
    const [hasCreatedIntent, setHasCreatedIntent] = useState(false);
    const [buttonElementReady, setButtonElementReady] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    
    const buttonTimeoutRef = useRef(null);
    const mountTimeoutRef = useRef(null);

    // Fetch order details to get the actual total
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError("No order ID found");
                setIsLoading(false);
                return;
            }

            try {
                console.log(`📊 Fetching order details for order ${orderId}`);
                const response = await api.get(`/orders/${orderId}`);
                const order = response.data.order;
                
                if (order && order.totalAmount) {
                    const total = parseFloat(order.totalAmount);
                    setOrderTotal(total);
                    console.log(`💰 Order total from backend: $${total.toFixed(2)}`);
                    
                    if (total < 0.50) {
                        setError(`Order amount ($${total.toFixed(2)}) is below minimum charge amount of $0.50`);
                        setIsLoading(false);
                        return;
                    }
                } else {
                    throw new Error("Order total not found");
                }
            } catch (err) {
                console.error("Error fetching order details:", err);
                if (subtotal && subtotal >= 0.50) {
                    setOrderTotal(subtotal);
                    console.log(`💰 Using cart subtotal as fallback: $${subtotal.toFixed(2)}`);
                } else {
                    setError("Unable to determine order total or amount too low");
                    setIsLoading(false);
                    return;
                }
            }
        };

        fetchOrderDetails();
    }, [orderId, subtotal]);

    useEffect(() => {
        if (!orderTotal || orderTotal < 0.50 || hasCreatedIntent) {
            return;
        }

        const initializeGooglePay = async () => {
            try {
                setIsLoading(true);
                console.log(`🏁 Initializing Google Pay for order ${orderId} with total $${orderTotal.toFixed(2)}`);

                // Create payment intent with Stripe
                const res = await api.post(`/orders/${orderId}/pay/googlepay`, {
                    paymentMethod: "googlePay",
                    amount: orderTotal,
                    currency: "USD",
                    description: `Order #${orderId}`,
                });

                const { clientSecret: secret } = res.data;
                setClientSecret(secret);
                console.log("✅ Google Pay PaymentIntent created successfully");
                setHasCreatedIntent(true);

                const stripe = await stripePromise;

                // Create payment request for Google Pay
                const pr = stripe.paymentRequest({
                    country: "US",
                    currency: "usd",
                    total: {
                        label: `Bistro Order #${orderId}`,
                        amount: Math.round(orderTotal * 100),
                    },
                    requestPayerName: true,
                    requestPayerEmail: true,
                    requestPayerPhone: true,
                });

                console.log("🔍 Checking Google Pay availability...");
                
                const canMake = await pr.canMakePayment();
                console.log("📱 Google Pay availability result:", canMake);
                
                if (canMake) {
                    setCanMakePayment(true);
                    setPaymentRequest(pr);
                    console.log("✅ Google Pay is available!");

                    // Set a timeout to show fallback if button doesn't render
                    buttonTimeoutRef.current = setTimeout(() => {
                        if (!buttonElementReady) {
                            console.log("⚠️ PaymentRequestButtonElement didn't render, showing fallback");
                            setShowFallback(true);
                        }
                    }, 3000); // Wait 3 seconds for button to render

                    // Handle payment method event
                    pr.on("paymentmethod", async (ev) => {
                        console.log("💳 Google Pay payment method selected");
                        setPaymentStatus("processing");

                        try {
                            const { paymentIntent, error } = await stripe.confirmCardPayment(
                                secret,
                                {
                                    payment_method: ev.paymentMethod.id
                                },
                                { handleActions: false }
                            );

                            if (error) {
                                console.error("❌ Payment confirmation error:", error);
                                ev.complete("fail");
                                setPaymentStatus("error");
                                setError(error.message || "Payment failed");
                                return;
                            }

                            if (paymentIntent.status === "requires_action") {
                                console.log("🔐 Payment requires additional authentication");
                                const { error: actionError } = await stripe.confirmCardPayment(secret);
                                if (actionError) {
                                    ev.complete("fail");
                                    setPaymentStatus("error");
                                    setError(actionError.message || "Payment failed");
                                    return;
                                }
                            }

                            if (paymentIntent.status === "succeeded") {
                                console.log("✅ Payment succeeded!");
                                
                                await api.post(`/orders/${orderId}/confirmPayment/stripe`, {
                                    name: ev.paymentMethod?.billing_details?.name,
                                    email: ev.paymentMethod?.billing_details?.email,
                                    phone: ev.paymentMethod?.billing_details?.phone,
                                });

                                ev.complete("success");
                                setPaymentStatus("success");
                                clearCart();

                                setTimeout(() => {
                                    navigate(`/payment-success?orderId=${orderId}`);
                                }, 1500);
                            } else {
                                ev.complete("fail");
                                setPaymentStatus("error");
                                setError("Payment was not successful");
                            }
                        } catch (err) {
                            console.error("❌ Payment processing error:", err);
                            ev.complete("fail");
                            setPaymentStatus("error");
                            setError("An error occurred while processing payment");
                        }
                    });
                } else {
                    throw new Error("Google Pay is not available on this device or browser. Make sure you're signed into your Google account and have payment methods saved.");
                }
            } catch (err) {
                console.error("❌ Google Pay initialization error:", err);
                setError(err.response?.data?.message || err.message || "Failed to initialize Google Pay");
            } finally {
                setIsLoading(false);
            }
        };

        initializeGooglePay();

        return () => {
            if (buttonTimeoutRef.current) {
                clearTimeout(buttonTimeoutRef.current);
            }
            if (mountTimeoutRef.current) {
                clearTimeout(mountTimeoutRef.current);
            }
        };
    }, [orderId, orderTotal, navigate, clearCart, hasCreatedIntent]);

    // Handle fallback Google Pay button click
    const handleFallbackGooglePay = async () => {
        if (!paymentRequest) return;
        
        try {
            console.log("🔄 Triggering Google Pay via fallback method");
            setPaymentStatus("processing");
            await paymentRequest.show();
        } catch (err) {
            console.error("❌ Fallback Google Pay error:", err);
            setPaymentStatus("error");
            setError("Failed to open Google Pay. Please try a different payment method.");
        }
    };

    const handleBackToPaymentMethods = () => {
        navigate(`/payment-method?orderId=${orderId}`);
    };

    const handleRetry = () => {
        setError("");
        setPaymentStatus("idle");
        setHasCreatedIntent(false);
        setCanMakePayment(false);
        setPaymentRequest(null);
        setButtonElementReady(false);
        setShowFallback(false);
        if (buttonTimeoutRef.current) {
            clearTimeout(buttonTimeoutRef.current);
        }
    };

    // Component to track if PaymentRequestButtonElement mounted
    const PaymentRequestButton = () => {
        const buttonRef = useRef(null);

        useEffect(() => {
            // Check if button element actually rendered
            mountTimeoutRef.current = setTimeout(() => {
                if (buttonRef.current) {
                    const hasButton = buttonRef.current.querySelector('button') || 
                                    buttonRef.current.querySelector('.StripeElement');
                    if (hasButton) {
                        console.log("✅ PaymentRequestButtonElement rendered successfully");
                        setButtonElementReady(true);
                        if (buttonTimeoutRef.current) {
                            clearTimeout(buttonTimeoutRef.current);
                        }
                    } else {
                        console.log("⚠️ PaymentRequestButtonElement container exists but no button found");
                        setShowFallback(true);
                    }
                } else {
                    console.log("⚠️ PaymentRequestButtonElement container not found");
                    setShowFallback(true);
                }
            }, 1000);

            return () => {
                if (mountTimeoutRef.current) {
                    clearTimeout(mountTimeoutRef.current);
                }
            };
        }, []);

        return (
            <div ref={buttonRef} className="payment-request-button-container">
                <PaymentRequestButtonElement
                    options={{
                        paymentRequest,
                        style: {
                            paymentRequestButton: {
                                type: "buy",
                                theme: "dark",
                                height: "48px",
                            },
                        },
                    }}
                    onReady={() => {
                        console.log("✅ PaymentRequestButtonElement onReady fired");
                        setButtonElementReady(true);
                        if (buttonTimeoutRef.current) {
                            clearTimeout(buttonTimeoutRef.current);
                        }
                    }}
                    onClick={(event) => {
                        console.log("🖱️ PaymentRequestButtonElement clicked");
                    }}
                />
            </div>
        );
    };

    return (
        <div className="bg-background min-h-screen py-10 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-white rounded-full p-2 mr-2 shadow-sm">
                            <Wallet size={28} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Google Pay</h2>
                    </div>
                    <p className="text-gray-600">Order ID: {orderId}</p>
                    <p className="text-lg font-semibold text-primary mt-2">
                        Total: ${orderTotal ? orderTotal.toFixed(2) : (subtotal?.toFixed(2) || "0.00")}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
                            <p className="text-gray-600">Setting up Google Pay...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="text-center py-8">
                            <AlertCircle className="mx-auto mb-4 text-red-500" size={32} />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Google Pay Unavailable
                            </h3>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <div className="space-y-3">
                                <Button
                                    onClick={handleRetry}
                                    variant="outline"
                                    className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={handleBackToPaymentMethods}
                                    className="w-full bg-primary text-white hover:bg-primary-foreground hover:text-primary"
                                >
                                    Choose Different Payment Method
                                </Button>
                            </div>
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

                    {/* Google Pay Button */}
                    {!isLoading && !error && paymentStatus === "idle" && (
                        <>
                            {canMakePayment && paymentRequest ? (
                                <div className="space-y-4">
                                    <div className="text-center mb-6">
                                        <p className="text-gray-600 mb-2">
                                            Use your saved payment methods for quick checkout
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Amount: ${orderTotal.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Stripe's PaymentRequestButtonElement */}
                                    {!showFallback && (
                                        <div className="flex justify-center">
                                            <PaymentRequestButton />
                                        </div>
                                    )}

                                    {/* Fallback Google Pay Button */}
                                    {showFallback && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <p className="text-sm text-yellow-800 text-center">
                                                    The Google Pay button didn't load automatically. 
                                                    Click below to open Google Pay manually.
                                                </p>
                                            </div>
                                            
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={handleFallbackGooglePay}
                                                    className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                    disabled={paymentStatus === "processing"}
                                                >
                                                    <Wallet size={20} />
                                                    {paymentStatus === "processing" ? "Opening..." : "Pay with Google Pay"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

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
                                        Google Pay Not Available
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Google Pay is not available on this device or browser.
                                        Make sure you have Google Pay set up and are using a supported browser.
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

                {/* Debug Information */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                        <p><strong>Debug Info:</strong></p>
                        <p>Order Total: ${orderTotal}</p>
                        <p>Cart Subtotal: ${subtotal}</p>
                        <p>Has Created Intent: {hasCreatedIntent.toString()}</p>
                        <p>Can Make Payment: {canMakePayment.toString()}</p>
                        <p>Payment Status: {paymentStatus}</p>
                        <p>Button Element Ready: {buttonElementReady.toString()}</p>
                        <p>Show Fallback: {showFallback.toString()}</p>
                        <p>User Agent: {navigator.userAgent}</p>
                    </div>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 text-center">
                        <strong>Secure Payment:</strong> Your payment information is processed securely
                        through Google Pay and never stored on our servers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GooglePayPaymentPage;