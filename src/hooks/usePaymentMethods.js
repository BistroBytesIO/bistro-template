// src/hooks/usePaymentMethods.js
import { useState, useEffect } from 'react';

/**
 * Utility functions for detecting payment method availability
 */
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

        return {
            isIOS,
            isAndroid,
            isMobile,
            isSafari,
            isChrome,
            isFirefox,
            isEdge,
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
     * Check Google Pay availability using Payment Request API
     */
    checkGooglePaySupport: async () => {
        try {
            // Check if PaymentRequest is available
            if (!window.PaymentRequest) {
                return { supported: false, reason: 'PaymentRequest API not available' };
            }

            // Basic payment method for testing
            const supportedInstruments = [{
                supportedMethods: 'basic-card'
            }];

            const details = {
                total: {
                    label: 'Test',
                    amount: { currency: 'USD', value: '0.01' }
                }
            };

            try {
                const paymentRequest = new PaymentRequest(supportedInstruments, details);
                const canMakePayment = await paymentRequest.canMakePayment();

                return {
                    supported: canMakePayment,
                    reason: canMakePayment ? 'Google Pay is available' : 'Google Pay not available'
                };
            } catch (error) {
                return { supported: false, reason: error.message };
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

        // Run checks in parallel
        const [applePaySupport, googlePaySupport] = await Promise.all([
            PaymentDetection.checkApplePaySupport(),
            PaymentDetection.checkGooglePaySupport()
        ]);

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
                    recommended: false,
                    requiresSetup: false
                });

                // Sort by priority
                methods.sort((a, b) => a.priority - b.priority);
                setAvailableMethods(methods);

            } catch (error) {
                console.error('Error detecting payment methods:', error);
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
        isAndroid: paymentSupport.deviceInfo?.isAndroid || false
    };
};