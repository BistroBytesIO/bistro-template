import React, { useEffect, useState } from "react";
import adminApi from "../services/adminApi";
import ClipLoader from "react-spinners/ClipLoader";

function AdminReadyForPickup() {
  const [orders, setOrders] = useState([]);
  const [loadingOrderId, setLoadingOrderId] = useState(null); // Track loading state for specific orders

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminApi.get("/admin/orders/readyForPickup");
      console.log("Fetched READY orders:", response.data);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching 'ready_for_pickup' orders:", error);
      setOrders([]);
    }
  };

  const markAsPickedUp = async (orderId) => {
    setLoadingOrderId(orderId);
    try {
      await adminApi.put(`/admin/orders/${orderId}/completed`);
      fetchOrders();
    } catch (error) {
      console.error("Error marking order as picked up:", error);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Ready for Pickup</h2>
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="border rounded p-4 mb-4">
              <h3 className="text-xl font-semibold mb-2">Order #{order.id}</h3>
              <p className="mb-1">
                <strong>Date:</strong>{" "}
                {new Date(order.orderDate).toLocaleString()}
              </p>
              <p className="mb-1">
                <strong>Customer:</strong> {order.customerName} (
                {order.customerEmail})
              </p>
              <p className="mb-1">
                <strong>Status:</strong> {order.status}
              </p>
              <p className="mb-1">
                <strong>Payment:</strong> {order.paymentStatus}
              </p>
              <p className="mb-1">
                <strong>Subtotal:</strong> ${order.subTotal?.toFixed(2)}
              </p>
              <p className="mb-1">
                <strong>Service Fee:</strong> ${order.serviceFee?.toFixed(2)}
              </p>
              <p className="mb-1">
                <strong>Tax:</strong> ${order.tax?.toFixed(2)}
              </p>
              <p className="mb-1">
                <strong>Total:</strong> ${order.totalAmount?.toFixed(2)}
              </p>
              <p className="mb-2">
                <strong>Special Notes:</strong> {order.specialNotes || "None"}
              </p>

              <h4 className="font-medium mb-1">Items:</h4>
              {order.items ? (
                <ul className="list-disc ml-5 mb-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="mb-1">
                      {item.name} x {item.quantity} @ ${item.price.toFixed(2)}
                      {item.customizations?.length > 0 && (
                        <ul className="list-disc ml-5 mt-1">
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
                <p className="mb-2">No items found for this order.</p>
              )}

              <button
                onClick={() => markAsPickedUp(order.id)}
                disabled={loadingOrderId === order.id}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-2"
              >
                {loadingOrderId === order.id ? (
                  <ClipLoader color="#ffffff" size={20} />
                ) : (
                  "Mark as Picked Up"
                )}
              </button>
            </div>
          ))
        ) : (
          <p>No ready-for-pickup orders found.</p>
        )}
      </div>
    </div>
  );
}

export default AdminReadyForPickup;
