// File: src/App.jsx
import './aws-config'; // Initialize AWS Amplify configuration
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { CartProvider } from "./CartContext";
import { MiniCartProvider } from "./context/MiniCartContext";
import { AuthProvider as CognitoAuthProvider } from "./contexts/AuthContext";
import { AuthProvider } from "./AuthContext"; // Your existing admin auth

// Layout
import AppLayout from "./layout/AppLayout";

// Pages
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/ordering/MenuPage";
import CartPage from "./pages/ordering/CartPage";
import CheckoutPage from "./pages/ordering/CheckoutPage";
import PaymentMethodSelection from "./pages/payments/PaymentMethodSelection";
import ExpressCheckoutPayment from "./pages/payments/ExpressCheckoutPayment";
import StripePaymentPage from "./pages/payments/StripePaymentPage";
import PayPalPaymentPage from "./pages/payments/PayPalPaymentPage";
import ApplePayPaymentPage from "./pages/payments/ApplePayPaymentPage";
import GooglePayPaymentPage from "./pages/payments/GooglePayPaymentPage";
import PaymentSuccessPage from "./pages/payments/PaymentSuccessPage";

// Auth Pages
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import RewardsPage from "./pages/RewardsPage";

// Admin Pages
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAllOrders from "./pages/admin/AdminAllOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginPage from "./pages/admin/LoginPage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <CognitoAuthProvider>
        <CartProvider>
          <MiniCartProvider>
            <AuthProvider>
              <ScrollToTop />
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route
                    path="/payment-method"
                    element={<PaymentMethodSelection />}
                  />
                  {/* New ExpressCheckout route - Primary recommendation */}
                  <Route path="/payment/express-checkout" element={<ExpressCheckoutPayment />} />
                  {/* Legacy payment routes - Still supported */}
                  <Route path="/payment/stripe" element={<StripePaymentPage />} />
                  <Route path="/payment/paypal" element={<PayPalPaymentPage />} />
                  <Route path="/payment/applepay" element={<ApplePayPaymentPage />} />
                  <Route path="/payment/googlepay" element={<GooglePayPaymentPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/orders"
                    element={
                      <ProtectedRoute>
                        <AdminAllOrders />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                
                {/* Auth Routes (outside AppLayout - no navbar) */}
                <Route path="/auth/signin" element={<SignInPage />} />
                <Route path="/auth/signup" element={<SignUpPage />} />
              </Routes>
            </AuthProvider>
          </MiniCartProvider>
        </CartProvider>
      </CognitoAuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
    </BrowserRouter>
  );
}

export default App;