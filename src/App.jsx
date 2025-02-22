import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentMethodSelection from "./pages/PaymentMethodSelection";
import StripePaymentPage from "./pages/StripePaymentPage";
import PayPalPaymentPage from "./pages/PayPalPaymentPage";
import ApplePayPaymentPage from "./pages/ApplePayPaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import { Toaster } from "react-hot-toast";
import AppLayout from "./layout/AppLayout";
import AdminOrders from "./pages/AdminOrders";
import AdminAllOrders from "./pages/AdminAllOrders";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./AuthContext";

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="/payment/stripe" element={<StripePaymentPage />} />
            <Route path="/payment/paypal" element={<PayPalPaymentPage />} />
            <Route path="/payment/applepay" element={<ApplePayPaymentPage />} />
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
                  {/* <AdminOrders /> */}
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
