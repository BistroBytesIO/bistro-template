import React, { useState, useCallback, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    ExpressCheckoutElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { CartContext } from "../../CartContext";
import api from "../../services/api";
import { AlertCircle, CheckCircle, Loader2, CreditCard, Apple, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const ExpressCheckoutPayment = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");

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
                        onClick={() => window.location.href = '/menu'}
                        className="w-full bg-primary text-white"
                    >
                        Browse Menu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                mode: 'payment',
                amount: 1000, // This will be updated when we fetch the order
                currency: 'usd',
                appearance: {
                    theme: 'stripe',
                    variables: {
                        borderRadius: '6px',
                        colorPrimary: 'hsl(var(--primary))'
                    }
                }
            }}
        >
            <ExpressCheckoutForm orderId={orderId} />
        </Elements>
    );
};

const ExpressCheckoutForm = ({ orderId }) => {
    const { clearCart } = useContext(CartContext);
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("idle");
    const [orderDetails, setOrderDetails] = useState(null);
    const [clientSecret, setClientSecret] = useState("");

    // Device detection for mobile-specific handling
    const [deviceInfo] = useState(() => {
        const userAgent = navigator.userAgent;
        return {
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/i.test(userAgent),
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
            isChrome: /chrome/i.test(userAgent)
        };
    });

    // Fetch order details and create payment intent
    useEffect(() => {
        const initializePayment = async () => {
            try {
                setIsLoading(true);
                console.log('🚀 Initializing ExpressCheckout for order:', orderId);

                // Fetch order details
                const orderResponse = await api.get(`/orders/${orderId}`);
                const order = orderResponse.data.order;
                setOrderDetails(order);

                if (!order || !order.totalAmount) {
                    throw new Error("Order details not found");
                }

                const totalAmount = parseFloat(order.totalAmount);
                console.log('💰 Order total:', totalAmount);

                if (totalAmount < 0.50) {
                    throw new Error(`Order amount ($${totalAmount.toFixed(2)}) is below minimum charge amount of $0.50`);
                }

                // Create payment intent for ExpressCheckout
                const paymentResponse = await api.post(`/orders/${orderId}/pay/stripe`, {
                    paymentMethod: "express_checkout",
                    amount: totalAmount,
                    currency: "USD",
                    description: `Order #${orderId}`,
                });

                const { clientSecret: secret } = paymentResponse.data;
                setClientSecret(secret);
                console.log('✅ Payment intent created successfully');

            } catch (err) {
                console.error('❌ Initialization error:', err);
                setError(err.response?.data?.message || err.message || "Failed to initialize payment");
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            initializePayment();
        }
    }, [orderId]);

    // Handle payment confirmation
    const onConfirm = useCallback(async (event) => {
        if (!stripe || !elements || !clientSecret) {
            console.error('❌ Stripe not ready or missing client secret');
            return;
        }

        console.log('💳 ExpressCheckout payment initiated');
        setIsProcessing(true);
        setPaymentStatus("processing");
        setError("");

        try {
            // Submit elements to validate
            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw submitError;
            }

            // Confirm payment with ExpressCheckoutElement
            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success?orderId=${orderId}`
                },
                redirect: 'if_required' // Prevents unnecessary redirects on mobile
            });

            if (confirmError) {
                throw confirmError;
            }

            // If we reach here, payment succeeded
            console.log('✅ Payment succeeded!');

            // Confirm payment on backend
            await api.post(`/orders/${orderId}/confirmPayment/stripe`, {
                name: orderDetails?.customerName,
                email: orderDetails?.customerEmail,
                phone: orderDetails?.customerPhone,
            });

            setPaymentStatus("success");
            clearCart();

            // Small delay to show success state
            setTimeout(() => {
                navigate(`/payment-success?orderId=${orderId}`);
            }, 1500);

        } catch (err) {
            console.error('❌ Payment error:', err);
            handlePaymentError(err);
        }
    }, [stripe, elements, clientSecret, orderId, orderDetails, navigate, clearCart]);

    // Enhanced error handling for mobile payments
    const handlePaymentError = (error) => {
        console.error('Payment error details:', error);

        let userMessage = "Something went wrong. Please try again.";

        if (error.type === 'card_error') {
            switch (error.code) {
                case 'card_declined':
                    userMessage = 'Your payment was declined. Please try a different payment method.';
                    break;
                case 'insufficient_funds':
                    userMessage = 'Insufficient funds. Please check your account balance or try a different card.';
                    break;
                case 'expired_card':
                    userMessage = 'Your card has expired. Please use a different payment method.';
                    break;
                case 'incorrect_cvc':
                    userMessage = 'The security code is incorrect. Please try again.';
                    break;
                case 'processing_error':
                    userMessage = 'An error occurred while processing your payment. Please try again.';
                    break;
                default:
                    userMessage = error.message || 'There was an issue with your payment method.';
            }
        } else if (error.type === 'authentication_error') {
            userMessage = 'Authentication failed. Please try again or use a different payment method.';
        } else if (error.type === 'api_error') {
            userMessage = 'A technical error occurred. Please try again in a moment.';
        } else if (error.message) {
            userMessage = error.message;
        }

        setError(userMessage);
        setPaymentStatus("error");
        setIsProcessing(false);
    };

    const handleBackToPaymentMethods = () => {
        navigate(`/payment-method?orderId=${orderId}`);
    };

    const handleRetry = () => {
        setError("");
        setPaymentStatus("idle");
        setIsProcessing(false);
    };

    if (isLoading) {
        return (
            <div className="bg-background min-h-screen py-10 px-4">
                <div className="max-w-lg mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Express Checkout</h2>
                        <p className="text-gray-600">Order ID: {orderId}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
                            <p className="text-gray-600">Setting up payment options...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen py-10 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex space-x-2">
                            <Apple size={24} className="text-gray-700" />
                            <Wallet size={24} className="text-blue-500" />
                            <CreditCard size={24} className="text-gray-700" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Express Checkout</h2>
                    <p className="text-gray-600 mt-1">Order ID: {orderId}</p>
                    {orderDetails && (
                        <p className="text-lg font-semibold text-primary mt-2">
                            Total: ${parseFloat(orderDetails.totalAmount).toFixed(2)}
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Error State */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="text-red-600 mr-2" size={20} />
                                <div>
                                    <p className="text-red-800 text-sm font-medium">Payment Error</p>
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    onClick={handleRetry}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={handleBackToPaymentMethods}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-300 text-red-600"
                                >
                                    Different Method
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
                    {isProcessing && paymentStatus === "processing" && (
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Processing Payment...
                            </h3>
                            <p className="text-gray-600">
                                {deviceInfo.isMobile ?
                                    "Complete the payment using your device's authentication" :
                                    "Please complete the payment process"
                                }
                            </p>
                        </div>
                    )}

                    {/* ExpressCheckout Element */}
                    {!error && paymentStatus === "idle" && !isProcessing && (
                        <>
                            <div className="text-center mb-6">
                                <p className="text-gray-600 mb-2">
                                    Pay quickly with your saved payment methods
                                </p>
                                {deviceInfo.isMobile && (
                                    <p className="text-sm text-gray-500">
                                        {deviceInfo.isIOS ? "Touch ID, Face ID, or" : "Fingerprint or"} PIN may be required
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <ExpressCheckoutElement
                                    options={{
                                        buttonHeight: deviceInfo.isMobile ? 48 : 40,
                                        buttonTheme: {
                                            applePay: 'black',
                                            googlePay: 'black',
                                            paypal: 'blue'
                                        },
                                        layout: {
                                            maxRows: deviceInfo.isMobile ? 3 : 2,
                                            maxColumns: deviceInfo.isMobile ? 1 : 2,
                                            overflow: 'auto'
                                        },
                                        paymentMethodOrder: deviceInfo.isIOS ?
                                            ['applePay', 'googlePay', 'link', 'paypal'] :
                                            deviceInfo.isAndroid ?
                                                ['googlePay', 'applePay', 'link', 'paypal'] :
                                                ['applePay', 'googlePay', 'link', 'paypal']
                                    }}
                                    onConfirm={onConfirm}
                                    onCancel={() => {
                                        console.log('Payment cancelled by user');
                                        setPaymentStatus("idle");
                                    }}
                                    onLoadError={(error) => {
                                        console.error('ExpressCheckout load error:', error);
                                        setError('Failed to load payment options. Please try a different payment method.');
                                    }}
                                />
                            </div>

                            <div className="border-t pt-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-3">
                                        Or choose a different payment method
                                    </p>
                                    <Button
                                        onClick={handleBackToPaymentMethods}
                                        variant="outline"
                                        className="w-full border-gray-300 text-gray-700"
                                    >
                                        More Payment Options
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Device Info for Debugging (Development Only) */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs space-y-1">
                        <p><strong>Debug Info:</strong></p>
                        <p>Device: {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</p>
                        <p>iOS: {deviceInfo.isIOS.toString()}</p>
                        <p>Android: {deviceInfo.isAndroid.toString()}</p>
                        <p>Safari: {deviceInfo.isSafari.toString()}</p>
                        <p>Chrome: {deviceInfo.isChrome.toString()}</p>
                        <p>Client Secret: {clientSecret ? "Set" : "Not Set"}</p>
                        <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
                    </div>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 text-center">
                        <strong>Secure Payment:</strong> Your payment information is processed securely
                        and never stored on our servers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpressCheckoutPayment;