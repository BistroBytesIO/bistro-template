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
    const [isMobile, setIsMobile] = useState(false);
    const [useNativeGooglePay, setUseNativeGooglePay] = useState(false);
    
    const buttonContainerRef = useRef(null);
    const googlePayClient = useRef(null);

    // Detect mobile device
    useEffect(() => {
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        setIsMobile(mobile);
        
        // Use native Google Pay API on mobile Android devices
        if (mobile && isAndroid) {
            setUseNativeGooglePay(true);
            console.log("📱 Mobile Android detected - using native Google Pay API");
        } else {
            console.log("🖥️ Desktop or non-Android - using Stripe PaymentRequest");
        }
    }, []);

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

    // Initialize payment
    useEffect(() => {
        if (!orderTotal || orderTotal < 0.50) return;

        if (useNativeGooglePay) {
            initializeNativeGooglePay();
        } else {
            initializeStripeGooglePay();
        }
    }, [orderTotal, useNativeGooglePay]);

    // Initialize native Google Pay API
    const initializeNativeGooglePay = async () => {
        try {
            setIsLoading(true);
            console.log("🔧 Initializing native Google Pay API");

            // Create payment intent
            const res = await api.post(`/orders/${orderId}/pay/googlepay`, {
                paymentMethod: "googlePay",
                amount: orderTotal,
                currency: "USD",
                description: `Order #${orderId}`,
            });

            const { clientSecret: secret } = res.data;
            setClientSecret(secret);

            // Load Google Pay API
            await loadGooglePayAPI();
            
            // Check if Google Pay is available
            const isReadyToPay = await googlePayClient.current.isReadyToPay({
                apiVersion: 2,
                apiVersionMinor: 0,
                allowedPaymentMethods: [{
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER']
                    },
                    tokenizationSpecification: {
                        type: 'PAYMENT_GATEWAY',
                        parameters: {
                            gateway: 'stripe',
                            'stripe:version': '2020-08-27',
                            'stripe:publishableKey': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
                        }
                    }
                }]
            });

            if (isReadyToPay.result) {
                setCanMakePayment(true);
                console.log("✅ Native Google Pay is available!");
            } else {
                throw new Error("Google Pay is not available on this device");
            }
        } catch (err) {
            console.error("❌ Native Google Pay initialization error:", err);
            setError(err.message || "Failed to initialize Google Pay");
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize Stripe Google Pay
    const initializeStripeGooglePay = async () => {
        try {
            setIsLoading(true);
            console.log(`🏁 Initializing Stripe Google Pay for order ${orderId}`);

            // Create payment intent
            const res = await api.post(`/orders/${orderId}/pay/googlepay`, {
                paymentMethod: "googlePay",
                amount: orderTotal,
                currency: "USD",
                description: `Order #${orderId}`,
            });

            const { clientSecret: secret } = res.data;
            setClientSecret(secret);

            const stripe = await stripePromise;

            // Create payment request
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
                requestShipping: false,
                disableLink: true,
                allowRedirects: 'never',
            });

            const canMake = await pr.canMakePayment();
                
            if (canMake) {
                setCanMakePayment(true);
                setPaymentRequest(pr);
                console.log("✅ Stripe Google Pay is available!");

                // Handle payment method event
                pr.on("paymentmethod", handleStripePayment);
            } else {
                throw new Error("Google Pay is not available on this device or browser");
            }
        } catch (err) {
            console.error("❌ Stripe Google Pay initialization error:", err);
            setError(err.message || "Failed to initialize Google Pay");
        } finally {
            setIsLoading(false);
        }
    };

    // Load Google Pay API
    const loadGooglePayAPI = () => {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.payments) {
                googlePayClient.current = new window.google.payments.api.PaymentsClient({
                    environment: 'TEST' // Change to 'PRODUCTION' for live
                });
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://pay.google.com/gp/p/js/pay.js';
            script.onload = () => {
                googlePayClient.current = new window.google.payments.api.PaymentsClient({
                    environment: 'TEST' // Change to 'PRODUCTION' for live
                });
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Handle native Google Pay button click
    const handleNativeGooglePay = async () => {
        if (!googlePayClient.current) return;

        try {
            setPaymentStatus("processing");
            console.log("🔄 Starting native Google Pay flow");

            const paymentDataRequest = {
                apiVersion: 2,
                apiVersionMinor: 0,
                allowedPaymentMethods: [{
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER']
                    },
                    tokenizationSpecification: {
                        type: 'PAYMENT_GATEWAY',
                        parameters: {
                            gateway: 'stripe',
                            'stripe:version': '2020-08-27',
                            'stripe:publishableKey': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
                        }
                    }
                }],
                merchantInfo: {
                    merchantId: 'bistro-template-payments',
                    merchantName: 'Bistro Template'
                },
                transactionInfo: {
                    totalPriceStatus: 'FINAL',
                    totalPrice: orderTotal.toString(),
                    currencyCode: 'USD'
                }
            };

            const paymentData = await googlePayClient.current.loadPaymentData(paymentDataRequest);
            console.log("✅ Google Pay data received");

            // Process payment with Stripe
            await processNativeGooglePayPayment(paymentData);

        } catch (err) {
            console.error("❌ Native Google Pay error:", err);
            setPaymentStatus("error");
            if (err.statusCode === 'CANCELED') {
                setError("Payment was cancelled");
            } else {
                setError("Payment failed. Please try again.");
            }
        }
    };

    // Process native Google Pay payment
    const processNativeGooglePayPayment = async (paymentData) => {
        try {
            const stripe = await stripePromise;
            
            // Confirm payment with Stripe
            const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: {
                        token: paymentData.paymentMethodData.tokenizationData.token
                    }
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === "succeeded") {
                console.log("✅ Native Google Pay payment succeeded!");
                
                await api.post(`/orders/${orderId}/confirmPayment/stripe`, {
                    name: paymentData.paymentMethodData?.info?.billingAddress?.name,
                    email: paymentData.email,
                });

                setPaymentStatus("success");
                clearCart();

                setTimeout(() => {
                    navigate(`/payment-success?orderId=${orderId}`);
                }, 1500);
            } else {
                throw new Error("Payment was not successful");
            }
        } catch (err) {
            console.error("❌ Native Google Pay processing error:", err);
            setPaymentStatus("error");
            setError(err.message || "Payment processing failed");
        }
    };

    // Handle Stripe payment
    const handleStripePayment = async (ev) => {
        console.log("💳 Stripe payment method selected:", ev.paymentMethod.type);
        
        // Check if this is Link instead of Google Pay
        if (ev.paymentMethod.type === 'link') {
            console.log("⚠️ Stripe Link detected - rejecting");
            ev.complete("fail");
            setError("Google Pay is required. Please ensure Google Pay is set up on your device.");
            return;
        }
        
        setPaymentStatus("processing");

        try {
            const stripe = await stripePromise;
            const { paymentIntent, error } = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: ev.paymentMethod.id },
                { handleActions: false }
            );

            if (error) {
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
            console.error("❌ Stripe payment processing error:", err);
            ev.complete("fail");
            setPaymentStatus("error");
            setError("An error occurred while processing payment");
        }
    };

    // Force button styling for Stripe elements
    useEffect(() => {
        if (!useNativeGooglePay && canMakePayment && paymentRequest && buttonContainerRef.current) {
            const styleTimeout = setTimeout(() => {
                const stripeElements = buttonContainerRef.current.querySelectorAll('.StripeElement, input, button, iframe');
                
                stripeElements.forEach((el, index) => {
                    if (el.tagName === 'IFRAME' || 
                        el.style.display === 'none' || 
                        el.offsetWidth === 0 || 
                        el.offsetHeight === 0 ||
                        index > 0) {
                        return;
                    }
                    
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
                    
                    el.removeAttribute('aria-hidden');
                    el.setAttribute('aria-label', 'Pay with Google Pay');
                    el.offsetHeight;
                });
                
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
    }, [useNativeGooglePay, canMakePayment, paymentRequest]);

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
                            <p className="text-gray-600">
                                {useNativeGooglePay ? "Setting up native Google Pay..." : "Setting up Google Pay..."}
                            </p>
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
                            <p className="text-gray-600">
                                {useNativeGooglePay 
                                    ? "Complete the payment in Google Pay" 
                                    : "Please complete the payment in the popup"
                                }
                            </p>
                        </div>
                    )}

                    {/* Payment Buttons */}
                    {!isLoading && !error && paymentStatus === "idle" && canMakePayment && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <p className="text-gray-600 mb-2">
                                    Use your saved payment methods for quick checkout
                                </p>
                                <p className="text-sm text-gray-500">
                                    Amount: ${orderTotal.toFixed(2)}
                                </p>
                                {useNativeGooglePay && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        Using native Google Pay for better mobile experience
                                    </p>
                                )}
                            </div>

                            {/* Native Google Pay Button for Mobile */}
                            {useNativeGooglePay && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={handleNativeGooglePay}
                                        disabled={paymentStatus === "processing"}
                                        className="native-google-pay-button"
                                        style={{
                                            width: '280px',
                                            height: '48px',
                                            background: 'linear-gradient(135deg, #4285f4 0%, #34a853 25%, #fbbc05 50%, #ea4335 75%)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            fontFamily: 'Roboto, Arial, sans-serif',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                        }}
                                    >
                                        <Wallet size={20} />
                                        Buy with Google Pay
                                    </button>
                                </div>
                            )}

                            {/* Stripe PaymentRequestButtonElement for Desktop */}
                            {!useNativeGooglePay && paymentRequest && (
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
                                            }}
                                            onClick={(event) => {
                                                console.log("🖱️ PaymentRequestButtonElement clicked");
                                            }}
                                            onError={(error) => {
                                                console.error("❌ PaymentRequestButtonElement error:", error);
                                            }}
                                        />
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
                    )}

                    {/* Not Available State */}
                    {!isLoading && !error && !canMakePayment && (
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
                </div>

                {/* Debug Information */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs space-y-1">
                        <p><strong>Debug Info:</strong></p>
                        <p>Order Total: ${orderTotal}</p>
                        <p>Can Make Payment: {canMakePayment.toString()}</p>
                        <p>Payment Status: {paymentStatus}</p>
                        <p>Is Mobile: {isMobile.toString()}</p>
                        <p>Use Native Google Pay: {useNativeGooglePay.toString()}</p>
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