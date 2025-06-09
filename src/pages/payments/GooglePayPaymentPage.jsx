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
    const [clientSecret, setClientSecret] = useState("");
    
    const buttonContainerRef = useRef(null);

    // Fetch order details
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
                    console.log(`💰 Order total: $${total.toFixed(2)}`);
                    
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

    // Initialize Google Pay
    useEffect(() => {
        if (!orderTotal || orderTotal < 0.50) return;

        const initializeGooglePay = async () => {
            try {
                setIsLoading(true);
                console.log(`🏁 Initializing Google Pay for order ${orderId} with total ${orderTotal.toFixed(2)}`);

                // Detect if we're on mobile
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isAndroid = /Android/i.test(navigator.userAgent);
                console.log(`📱 Device detection - Mobile: ${isMobile}, Android: ${isAndroid}`);

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

                const stripe = await stripePromise;

                // Create payment request with mobile-specific settings
                const requestOptions = {
                    country: "US",
                    currency: "usd",
                    total: {
                        label: `Bistro Order #${orderId}`,
                        amount: Math.round(orderTotal * 100),
                    },
                    requestPayerName: true,
                    requestPayerEmail: true,
                    requestPayerPhone: true,
                    requestShipping: false,
                };

                // On mobile, be more explicit about disabling other payment methods
                if (isMobile) {
                    // More aggressive Link disabling for mobile
                    requestOptions.disableLink = true;
                    requestOptions.allowRedirects = 'never';
                    console.log("📱 Mobile detected - disabling Stripe Link and redirects");
                } else {
                    requestOptions.disableLink = true;
                }

                const pr = stripe.paymentRequest(requestOptions);

                console.log("🔍 Checking Google Pay availability...");
                
                // Check what payment methods are specifically available
                const canMake = await pr.canMakePayment();
                console.log("📱 Google Pay availability result:", canMake);
                
                // Additional check for Google Pay specifically
                if (canMake && canMake.googlePay === false && isMobile) {
                    console.log("❌ Google Pay not available on mobile, trying alternative approach");
                    throw new Error("Google Pay is not available on this mobile device. Please ensure you're signed into Google and have payment methods saved in Google Pay.");
                }
                
                if (canMake) {
                    setCanMakePayment(true);
                    setPaymentRequest(pr);
                    console.log("✅ Google Pay is available!");

                    // Handle payment method event
                    pr.on("paymentmethod", async (ev) => {
                        console.log("💳 Payment method selected:", ev.paymentMethod.type);
                        console.log("Full payment method details:", ev.paymentMethod);
                        
                        // Check if this is actually Google Pay and not Link
                        if (ev.paymentMethod.type === 'link' && isMobile) {
                            console.log("⚠️ Stripe Link detected instead of Google Pay - rejecting");
                            ev.complete("fail");
                            setError("Google Pay is required for mobile payments. Please ensure Google Pay is set up on your device.");
                            return;
                        }
                        
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
    }, [orderId, orderTotal, navigate, clearCart]);

    // Force button styling after it renders
    useEffect(() => {
        if (canMakePayment && paymentRequest && buttonContainerRef.current) {
            // Wait a bit for the Stripe element to render
            const styleTimeout = setTimeout(() => {
                const stripeElements = buttonContainerRef.current.querySelectorAll('.StripeElement, input, button, iframe');
                
                console.log("🎨 Found Stripe elements to style:", stripeElements.length);
                
                stripeElements.forEach((el, index) => {
                    console.log(`Checking element ${index}:`, el.tagName, el.className, el.id);
                    
                    // Only style the main visible button element (usually the first div or the input)
                    // Skip iframes and hidden elements
                    if (el.tagName === 'IFRAME' || 
                        el.style.display === 'none' || 
                        el.offsetWidth === 0 || 
                        el.offsetHeight === 0 ||
                        index > 0) { // Only style the first element
                        console.log(`Skipping element ${index} (${el.tagName})`);
                        return;
                    }
                    
                    console.log(`Styling main button element ${index}:`, el.tagName);
                    
                    // Force the element to be visible and properly sized
                    el.style.cssText = `
                        height: 48px !important;
                        min-height: 48px !important;
                        width: 280px !important;
                        max-width: 280px !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        border: none !important;
                        border-radius: 4px !important;
                        cursor: pointer !important;
                        position: relative !important;
                        background: #000 !important;
                        color: white !important;
                        font-size: 16px !important;
                        font-weight: 500 !important;
                        text-align: center !important;
                        line-height: 48px !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                        transform: translateZ(0) !important;
                        z-index: 1000 !important;
                        margin: 0 auto !important;
                    `;
                    
                    // Remove problematic attributes
                    el.removeAttribute('aria-hidden');
                    el.setAttribute('aria-label', 'Pay with Google Pay');
                    
                    // Force a repaint
                    el.offsetHeight;
                });
                
                // Apply additional styling to the container
                if (buttonContainerRef.current) {
                    buttonContainerRef.current.style.cssText = `
                        width: 100% !important;
                        min-height: 64px !important;
                        max-height: 64px !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        padding: 8px !important;
                        background: transparent !important;
                        overflow: hidden !important;
                    `;
                }
            }, 1000);

            return () => clearTimeout(styleTimeout);
        }
    }, [canMakePayment, paymentRequest]);

    const handleBackToPaymentMethods = () => {
        navigate(`/payment-method?orderId=${orderId}`);
    };

    const handleRetry = () => {
        setError("");
        setPaymentStatus("idle");
        window.location.reload();
    };

    return (
        <div className="bg-background min-h-screen py-10 px-4">
            {/* Add CSS to force hide Stripe Link and force Google Pay appearance */}
            <style>{`
                /* Hide Stripe Link elements */
                .StripeElement iframe[src*="link"],
                .StripeElement div[data-testid*="link"],
                button[aria-label*="Link"],
                button[aria-label*="link"],
                div[class*="Link"],
                div[class*="link"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    width: 0 !important;
                }
                
                /* Force Google Pay styling */
                .google-pay-button-container .StripeElement button,
                .google-pay-button-container .StripeElement input,
                .google-pay-button-container .StripeElement div[role="button"] {
                    background: #000 !important;
                    background-image: none !important;
                    color: white !important;
                }
                
                /* Hide any element containing "link" text */
                .StripeElement *:not(script):not(style) {
                    font-family: inherit !important;
                }
                
                /* Force Google Pay text if Link appears */
                .google-pay-button-container .StripeElement button::before,
                .google-pay-button-container .StripeElement input::before,
                .google-pay-button-container .StripeElement div[role="button"]::before {
                    content: "Buy with G Pay" !important;
                    position: absolute !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    color: white !important;
                    font-weight: bold !important;
                    z-index: 1000 !important;
                    pointer-events: none !important;
                }
            `}</style>
            
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
                            <p className="text-gray-600">Please complete the payment in the Google Pay popup</p>
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
                                    <div className="flex justify-center">
                                        <div 
                                            ref={buttonContainerRef}
                                            className="google-pay-button-container"
                                            style={{
                                                width: '100%',
                                                maxWidth: '300px',
                                                minHeight: '64px',
                                                maxHeight: '64px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                padding: '8px',
                                                border: '1px dashed #ccc',
                                                borderRadius: '8px',
                                                backgroundColor: '#f8f9fa',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}
                                        >
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
                                                onReady={(event) => {
                                                    console.log("✅ PaymentRequestButtonElement onReady fired");
                                                    console.log("Available payment methods:", event);
                                                    
                                                    // Log what payment methods are available
                                                    if (event && event.availablePaymentMethods) {
                                                        console.log("Available methods:", event.availablePaymentMethods);
                                                    }
                                                }}
                                                onClick={(event) => {
                                                    console.log("🖱️ PaymentRequestButtonElement clicked");
                                                    console.log("Click event:", event);
                                                }}
                                                onError={(error) => {
                                                    console.error("❌ PaymentRequestButtonElement error:", error);
                                                }}
                                            />
                                        </div>
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
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs space-y-1">
                        <p><strong>Debug Info:</strong></p>
                        <p>Order Total: ${orderTotal}</p>
                        <p>Can Make Payment: {canMakePayment.toString()}</p>
                        <p>Payment Status: {paymentStatus}</p>
                        <p>Client Secret: {clientSecret ? "Set" : "Not Set"}</p>
                        <p>User Agent: {navigator.userAgent.substring(0, 80)}...</p>
                        <p>Platform: {navigator.platform}</p>
                        <p>Viewport: {window.innerWidth}x{window.innerHeight}</p>
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