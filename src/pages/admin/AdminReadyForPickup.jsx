// Enhanced AdminReadyForPickup.jsx
import React, { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import ClipLoader from "react-spinners/ClipLoader";
import { Clock, CheckCircle, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminReadyForPickup() {
  const [orders, setOrders] = useState([]);
  const [loadingOrderId, setLoadingOrderId] = useState(null);

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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Ready For Pickup ({orders.length})
        </h2>
        <Button
          onClick={fetchOrders}
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-300"
        >
          Refresh
        </Button>
      </div>

      {orders.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="bg-green-50 p-4 border-b flex justify-between items-center">
                <div>
                  <span className="text-gray-600 text-sm">Order #</span>
                  <span className="font-bold text-gray-800 ml-1">{order.id}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="text-gray-500 mr-1" />
                  <span className="text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Customer</p>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-gray-500 text-sm">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={12} className="mr-1" />
                      Ready For Pickup
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <div className="bg-gray-50 rounded p-3 mb-3 max-h-48 overflow-y-auto">
                    {order.items ? (
                      <ul className="space-y-2">
                        {order.items.map((item, index) => (
                          <li key={index} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between">
                              <span className="font-medium">{item.name} × {item.quantity}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {item.customizations?.length > 0 && (
                              <ul className="mt-1 pl-4 text-xs text-gray-600">
                                {item.customizations.map((customization, idx) => (
                                  <li key={idx}>
                                    • {customization.name}
                                    {+customization.price > 0 && ` (+$${customization.price.toFixed(2)})`}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No items found for this order.</p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="flex justify-between text-sm mb-4 pb-2 border-b">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${order.subTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Service Fee:</span>
                  <span>${order.serviceFee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tax:</span>
                  <span>${order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-md font-bold mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>${order.totalAmount?.toFixed(2)}</span>
                </div>

                {/* Special Notes */}
                {order.specialNotes && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded p-3 text-sm">
                    <p className="font-medium flex items-center text-yellow-800">
                      <AlertCircle size={14} className="mr-1" />
                      Special Notes:
                    </p>
                    <p className="text-gray-700 mt-1">{order.specialNotes}</p>
                  </div>
                )}
              </div>

              {/* Order Actions */}
              <div className="p-4 bg-gray-50 border-t">
                <Button
                  onClick={() => markAsPickedUp(order.id)}
                  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loadingOrderId === order.id}
                >
                  {loadingOrderId === order.id ? (
                    <ClipLoader color="#ffffff" size={20} />
                  ) : (
                    <>
                      <ShoppingBag size={18} className="mr-2" />
                      Mark as Picked Up
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No orders ready for pickup.</p>
        </div>
      )}
    </div>
  );
}

export default AdminReadyForPickup;