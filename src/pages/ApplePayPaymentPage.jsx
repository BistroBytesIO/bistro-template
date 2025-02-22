import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import api from "../services/api";

const stripePromise = loadStripe(
  "pk_test_51Qh2TACsY3eILNq5VJbPkcUQIouI2qA94JXochuGyrSx9xA0BvYs0h5U1jDZzW5aMIiE99m5P3A91VGcp7KINEbL00rCB0HoX8"
);

const ApplePayPaymentPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <ApplePayForm />
    </Elements>
  );
};

const ApplePayForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchPaymentIntent = async () => {
      try {
        const res = await api.post(`/orders/${orderId}/pay`, {
          paymentMethod: "applePay",
        });
        const { clientSecret, amount } = res.data;

        const stripe = await stripePromise;
        const pr = stripe.paymentRequest({
          country: "US",
          currency: "usd",
          total: {
            label: `Order #${orderId}`,
            amount: amount,
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        pr.canMakePayment().then((result) => {
          if (result) {
            setCanMakePayment(true);
          }
        });

        pr.on("paymentmethod", async (ev) => {
          const { paymentIntent, error } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (error) {
            ev.complete("fail");
          } else {
            if (paymentIntent.status === "requires_action") {
              const { error: errorAction } =
                await stripe.confirmCardPayment(clientSecret);
              if (errorAction) {
                ev.complete("fail");
                return;
              }
              ev.complete("success");
              navigate(`/payment-success?orderId=${orderId}`);
            } else if (paymentIntent.status === "succeeded") {
              ev.complete("success");
              navigate(`/payment-success?orderId=${orderId}`);
            }
          }
        });

        setPaymentRequest(pr);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPaymentIntent();
  }, [orderId, navigate]);

  return (
    <div>
      <h2>Pay with Apple Pay</h2>
      <p>Order ID: {orderId}</p>
      {!paymentRequest && <p>Loading Apple Pay request...</p>}
      {paymentRequest && canMakePayment ? (
        <PaymentRequestButtonElement
          options={{ paymentRequest }}
          style={{
            paymentRequestButton: {
              theme: "dark",
              height: "64px",
            },
          }}
        />
      ) : (
        <p>Apple Pay is not available on this device/browser.</p>
      )}
    </div>
  );
};

export default ApplePayPaymentPage;
