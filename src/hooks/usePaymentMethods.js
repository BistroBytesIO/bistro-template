// Enhanced usePaymentMethods.js with better Google Pay detection
import { useState, useEffect } from 'react';

const PaymentDetection = {
    /**
     * Detect device type and capabilities
     */
    getDeviceInfo: () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroid = /android/i.test(userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        const isChrome = /chrome/i.test(userAgent);
        const isFirefox = /firefox/i.test(userAgent);
        const isEdge = /edg/i.test(userAgent);
        const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';

        return {
            isIOS,
            isAndroid,
            isMobile,
            isSafari,
            isChrome,
            isFirefox,
            isEdge,
            isHTTPS,
            userAgent
        };
    },

    /**
     * Check Apple Pay availability
     */
    checkApplePaySupport: async () => {
        try {
            // Check if ApplePaySession is available
            if (!window.ApplePaySession) {
                return { supported: false, reason: 'ApplePaySession not available' };
            }

            // Check if Apple Pay is supported on this device
            if (!ApplePaySession.supportsVersion(3)) {
                return { supported: false, reason: 'Apple Pay version not supported' };
            }

            // Check if the user can make payments
            const canMakePayments = ApplePaySession.canMakePayments();
            if (!canMakePayments) {
                return { supported: false, reason: 'Cannot make Apple Pay payments' };
            }

            return {
                supported: true,
                hasActiveCard: canMakePayments,
                reason: 'Apple Pay is available'
            };
        } catch (error) {
            return { supported: false, reason: error.message };
        }
    },

    /**
     * Enhanced Google Pay detection for HTTPS environments
     */
    checkGooglePaySupport: async () => {
        try {
            // Check if we're on HTTPS (required for Google Pay)
            if (location.protocol !== 'https:' && !location.hostname.includes('localhost')) {
                return { supported: false, reason: 'Google Pay requires HTTPS connection' };
            }

            // Check if PaymentRequest is available
            if (!window.PaymentRequest) {
                return { supported: false, reason: 'PaymentRequest API not available' };
            }

            // Test Google Pay availability with proper configuration
            const googlePayConfig = {
                environment: 'TEST', // 'PRODUCTION' for live
                apiVersion: 2,
                apiVersionMinor: 0,
                merchantInfo: {
                    merchantName: 'Bistro Template',
                    merchantId: 'bistro-template-payments'
                },
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
            };

            // Method 1: Try Google Pay API directly (if available)
            if (window.google && window.google.payments && window.google.payments.api) {
                try {
                    const paymentsClient = new window.google.payments.api.PaymentsClient({
                        environment: googlePayConfig.environment
                    });

                    const isReadyToPayRequest = {
                        apiVersion: googlePayConfig.apiVersion,
                        apiVersionMinor: googlePayConfig.apiVersionMinor,
                        allowedPaymentMethods: googlePayConfig.allowedPaymentMethods
                    };

                    const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
                    return {
                        supported: response.result,
                        reason: response.result ? 'Google Pay is ready' : 'Google Pay not ready'
                    };
                } catch (error) {
                    console.log('Google Pay API check failed:', error);
                    // Fall through to PaymentRequest method
                }
            }

            // Method 2: Use PaymentRequest API
            const supportedInstruments = [{
                supportedMethods: 'https://google.com/pay',
                data: googlePayConfig
            }];

            const details = {
                total: {
                    label: 'Test Payment',
                    amount: { currency: 'USD', value: '0.01' }
                }
            };

            try {
                const paymentRequest = new PaymentRequest(supportedInstruments, details);
                const canMakePayment = await paymentRequest.canMakePayment();

                return {
                    supported: canMakePayment,
                    reason: canMakePayment ? 'Google Pay is available via PaymentRequest' : 'Google Pay not available - check if signed into Google account and have payment methods saved'
                };
            } catch (error) {
                console.log('PaymentRequest Google Pay check failed:', error);

                // Method 3: Basic device and browser check as fallback
                const deviceInfo = PaymentDetection.getDeviceInfo();
                const likelySupported = (deviceInfo.isAndroid || deviceInfo.isChrome) && deviceInfo.isHTTPS;

                return {
                    supported: likelySupported,
                    reason: likelySupported ? 'Google Pay likely supported (please ensure you\'re signed into Google account)' : 'Google Pay not supported on this device/browser'
                };
            }
        } catch (error) {
            return { supported: false, reason: error.message };
        }
    },

    /**
     * Get comprehensive payment support information
     */
    getPaymentSupport: async () => {
        const deviceInfo = PaymentDetection.getDeviceInfo();

        console.log('🔍 Device Detection:', {
            isAndroid: deviceInfo.isAndroid,
            isChrome: deviceInfo.isChrome,
            isHTTPS: deviceInfo.isHTTPS,
            userAgent: deviceInfo.userAgent
        });

        // Run checks in parallel
        const [applePaySupport, googlePaySupport] = await Promise.all([
            PaymentDetection.checkApplePaySupport(),
            PaymentDetection.checkGooglePaySupport()
        ]);

        console.log('💳 Payment Support Results:', {
            applePay: applePaySupport,
            googlePay: googlePaySupport
        });

        return {
            deviceInfo,
            applePay: applePaySupport,
            googlePay: googlePaySupport,
            recommendations: PaymentDetection.getRecommendations(deviceInfo, applePaySupport, googlePaySupport)
        };
    },

    /**
     * Get payment method recommendations based on device and support
     */
    getRecommendations: (deviceInfo, applePaySupport, googlePaySupport) => {
        const recommendations = [];

        // Apple Pay recommendations
        if (deviceInfo.isIOS && applePaySupport.supported) {
            recommendations.push({
                method: 'apple_pay',
                priority: 1,
                reason: 'Native Apple Pay support on iOS device'
            });
        } else if (deviceInfo.isSafari && applePaySupport.supported) {
            recommendations.push({
                method: 'apple_pay',
                priority: 2,
                reason: 'Apple Pay available in Safari'
            });
        }

        // Google Pay recommendations
        if (deviceInfo.isAndroid && googlePaySupport.supported) {
            recommendations.push({
                method: 'google_pay',
                priority: 1,
                reason: 'Native Google Pay support on Android device'
            });
        } else if ((deviceInfo.isChrome || deviceInfo.isFirefox || deviceInfo.isEdge) && googlePaySupport.supported) {
            recommendations.push({
                method: 'google_pay',
                priority: 2,
                reason: 'Google Pay available in supported browser'
            });
        }

        // Always recommend card as fallback
        recommendations.push({
            method: 'card',
            priority: 99,
            reason: 'Universal card payment support'
        });

        return recommendations.sort((a, b) => a.priority - b.priority);
    },

    /**
     * Debug function to help troubleshoot payment detection
     */
    debugPaymentSupport: async () => {
        console.group('🔧 Payment Method Debug Information');

        const deviceInfo = PaymentDetection.getDeviceInfo();
        console.log('Device Info:', deviceInfo);

        console.log('Browser APIs Available:', {
            PaymentRequest: !!window.PaymentRequest,
            ApplePaySession: !!window.ApplePaySession,
            GooglePayAPI: !!(window.google && window.google.payments && window.google.payments.api)
        });

        console.log('Environment:', {
            protocol: location.protocol,
            hostname: location.hostname,
            isHTTPS: deviceInfo.isHTTPS
        });

        const support = await PaymentDetection.getPaymentSupport();
        console.log('Payment Support Results:', support);

        console.groupEnd();
        return support;
    }
};

export const usePaymentMethods = () => {
    const [paymentSupport, setPaymentSupport] = useState({
        isLoading: true,
        deviceInfo: null,
        applePay: { supported: false, reason: 'Checking...' },
        googlePay: { supported: false, reason: 'Checking...' },
        recommendations: [],
        error: null
    });

    const [availableMethods, setAvailableMethods] = useState([]);

    useEffect(() => {
        const detectPaymentMethods = async () => {
            try {
                setPaymentSupport(prev => ({ ...prev, isLoading: true, error: null }));

                // Enable debug logging in development
                if (import.meta.env.DEV) {
                    await PaymentDetection.debugPaymentSupport();
                }

                const support = await PaymentDetection.getPaymentSupport();

                setPaymentSupport({
                    isLoading: false,
                    ...support,
                    error: null
                });

                // Build available methods array
                const methods = [];

                // Add Apple Pay if supported
                if (support.applePay.supported) {
                    methods.push({
                        id: 'apple_pay',
                        name: 'Apple Pay',
                        icon: 'Apple',
                        description: 'Pay with Touch ID or Face ID',
                        priority: support.deviceInfo.isIOS ? 1 : 2,
                        available: true,
                        recommended: support.deviceInfo.isIOS,
                        requiresSetup: !support.applePay.hasActiveCard
                    });
                }

                // Add Google Pay if supported
                if (support.googlePay.supported) {
                    methods.push({
                        id: 'google_pay',
                        name: 'Google Pay',
                        icon: 'Wallet',
                        description: 'Pay with your saved Google payment methods',
                        priority: support.deviceInfo.isAndroid ? 1 : 2,
                        available: true,
                        recommended: support.deviceInfo.isAndroid,
                        requiresSetup: false
                    });
                }

                // Always add card payment
                methods.push({
                    id: 'card',
                    name: 'Credit/Debit Card',
                    icon: 'CreditCard',
                    description: 'Pay with your credit or debit card',
                    priority: 99,
                    available: true,
                    recommended: methods.length === 0, // Recommended if no mobile payments
                    requiresSetup: false
                });

                // Sort by priority
                methods.sort((a, b) => a.priority - b.priority);
                setAvailableMethods(methods);

                // Log results for debugging
                console.log('🎯 Available Payment Methods:', methods);

            } catch (error) {
                console.error('❌ Error detecting payment methods:', error);
                setPaymentSupport(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error.message
                }));

                // Fallback to card only
                setAvailableMethods([{
                    id: 'card',
                    name: 'Credit/Debit Card',
                    icon: 'CreditCard',
                    description: 'Pay with your credit or debit card',
                    priority: 1,
                    available: true,
                    recommended: true,
                    requiresSetup: false
                }]);
            }
        };

        detectPaymentMethods();
    }, []);

    const refreshPaymentMethods = async () => {
        await detectPaymentMethods();
    };

    const isMethodAvailable = (methodId) => {
        return availableMethods.some(method => method.id === methodId && method.available);
    };

    const getRecommendedMethod = () => {
        return availableMethods.find(method => method.recommended) || availableMethods[0];
    };

    const getMethodInfo = (methodId) => {
        return availableMethods.find(method => method.id === methodId);
    };

    return {
        // State
        isLoading: paymentSupport.isLoading,
        error: paymentSupport.error,
        deviceInfo: paymentSupport.deviceInfo,
        availableMethods,

        // Support details
        applePaySupport: paymentSupport.applePay,
        googlePaySupport: paymentSupport.googlePay,

        // Helper functions
        refreshPaymentMethods,
        isMethodAvailable,
        getRecommendedMethod,
        getMethodInfo,

        // Convenience flags
        hasApplePay: paymentSupport.applePay.supported,
        hasGooglePay: paymentSupport.googlePay.supported,
        hasMobilePayments: paymentSupport.applePay.supported || paymentSupport.googlePay.supported,
        isMobile: paymentSupport.deviceInfo?.isMobile || false,
        isIOS: paymentSupport.deviceInfo?.isIOS || false,
        isAndroid: paymentSupport.deviceInfo?.isAndroid || false,
        isHTTPS: paymentSupport.deviceInfo?.isHTTPS || false
    };
};