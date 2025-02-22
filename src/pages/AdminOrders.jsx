import React, { useEffect, useState } from "react";
import adminApi from "../services/adminApi";
import ClipLoader from "react-spinners/ClipLoader";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loadingOrderId, setLoadingOrderId] = useState(null); // Track loading state for specific orders

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminApi.get("/admin/orders/pending");
      console.log("Fetched orders:", response.data);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  const markAsReady = async (orderId) => {
    setLoadingOrderId(orderId); // Set loading state for the clicked order
    try {
      await adminApi.put(`/admin/orders/${orderId}/ready`);
      fetchOrders();
    } catch (error) {
      console.error("Error marking order as ready:", error);
    } finally {
      setLoadingOrderId(null); // Remove loading state
    }
  };

  return (
    <div className="admin-orders">
      <h2>Order Queue</h2>
      {orders.length > 0 ? (
        orders.map((order) => (
          <div key={order.id} className="order-card">
            <h3>Order #{order.id}</h3>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.orderDate).toLocaleString()}
            </p>
            <p>
              <strong>Customer:</strong> {order.customerName} (
              {order.customerEmail})
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Payment:</strong> {order.paymentStatus}
            </p>
            <p>
              <strong>Subtotal:</strong> ${order.subTotal?.toFixed(2)}
            </p>
            <p>
              <strong>Service Fee:</strong> ${order.serviceFee?.toFixed(2)}
            </p>
            <p>
              <strong>Tax:</strong> ${order.tax?.toFixed(2)}
            </p>
            <p>
              <strong>Total:</strong> ${order.totalAmount?.toFixed(2)}
            </p>
            <p>
              <strong>Special Notes:</strong> {order.specialNotes || "None"}
            </p>

            <h4>Items:</h4>
            {order.items ? (
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} x {item.quantity} @ ${item.price.toFixed(2)}
                    {item.customizations?.length > 0 && (
                      <ul>
                        {item.customizations.map((customization, idx) => (
                          <li key={idx}>
                            {customization.name} (+ $
                            {customization.price.toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No items found for this order.</p>
            )}

            <button
              onClick={() => markAsReady(order.id)}
              className="order-ready-button"
              disabled={loadingOrderId === order.id}
            >
              {loadingOrderId === order.id ? (
                <ClipLoader color="#ffffff" size={20} />
              ) : (
                "Order is Ready For Pickup"
              )}
            </button>
          </div>
        ))
      ) : (
        <p>No pending orders found.</p>
      )}
    </div>
  );
}

export default AdminOrders;
