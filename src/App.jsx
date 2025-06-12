import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Toaster } from "react-hot-toast";
import AppLayout from "./layout/AppLayout";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAllOrders from "./pages/admin/AdminAllOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginPage from "./pages/admin/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./AuthContext";
import ScrollToTop from "./components/ScrollToTop";

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
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
        </Routes>
      </AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
    </BrowserRouter>
  );
}

export default AppRoutes;