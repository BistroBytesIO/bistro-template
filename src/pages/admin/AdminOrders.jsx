import React, { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import useWebSocket from "../../hooks/useWebSocket";
import soundService from "../../services/soundService";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";
import { Clock, Check, AlertCircle, Wifi, WifiOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // WebSocket configuration
  const baseUrl = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8080/api';
  console.log('🔧 Admin Orders - Base URL:', baseUrl);
  
  const handleWebSocketMessage = (notification) => {
    console.log('📥 AdminOrders received WebSocket notification:', notification);
    
    // Play sound for new orders
    if (notification.notificationType === 'NEW_ORDER' && soundEnabled) {
      console.log('🔊 Playing cha-ching sound...');
      soundService.playChaChing();
      
      // Show toast notification
      toast.success(
        `New Order #${notification.orderId} from ${notification.customerName}`,
        {
          duration: 6000,
          icon: '🔔',
          style: {
            background: '#10B981',
            color: 'white',
          },
        }
      );
    }
    
    // Refresh orders list
    console.log('🔄 Refreshing orders list...');
    fetchOrders();
  };

  const { isConnected, connectionError } = useWebSocket(
    baseUrl,
    handleWebSocketMessage,
    true // enabled
  );

  useEffect(() => {
    console.log('🚀 AdminOrders component mounted');
    fetchOrders();
  }, []);

  // Update sound service when sound preference changes
  useEffect(() => {
    soundService.setEnabled(soundEnabled);
    console.log('🔊 Sound notifications:', soundEnabled ? 'enabled' : 'disabled');
  }, [soundEnabled]);

  const fetchOrders = async () => {
    console.log('📊 Fetching orders...');
    try {
      const response = await adminApi.get("/admin/orders/pending");
      console.log("✅ Fetched orders:", response.data);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      setOrders([]);
      toast.error("Failed to fetch orders");
    }
  };

  const markAsReady = async (orderId) => {
    setLoadingOrderId(orderId);
    try {
      console.log(`📝 Marking order ${orderId} as ready...`);
      await adminApi.put(`/admin/orders/${orderId}/ready`);
      fetchOrders();
      toast.success(`Order #${orderId} marked as ready!`);
    } catch (error) {
      console.error("Error marking order as ready:", error);
      toast.error("Failed to update order status");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      // Test sound when enabling
      console.log('🎵 Testing sound...');
      soundService.playChaChing();
    }
    toast.success(`Sound notifications ${!soundEnabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Pending Orders ({orders.length})
          </h2>
          
          {/* WebSocket Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi size={16} />
                <span className="text-sm font-medium">Live</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff size={16} />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle Button */}
          <Button
            onClick={toggleSound}
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-2 ${
              soundEnabled 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "text-gray-600 border-gray-300"
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </Button>

          <Button
            onClick={fetchOrders}
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-300"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={20} />
            <div>
              <p className="text-red-800 text-sm font-medium">WebSocket Connection Failed</p>
              <p className="text-red-700 text-xs">{connectionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Display */}
      {orders.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div>
                  <span className="text-gray-500 text-sm">Order #</span>
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
                    <p className="text-sm text-gray-500 mb-1">Payment</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'PAID' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus}
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
                  onClick={() => markAsReady(order.id)}
                  className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 text-white"
                  disabled={loadingOrderId === order.id}
                >
                  {loadingOrderId === order.id ? (
                    <ClipLoader color="#ffffff" size={20} />
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Mark Ready for Pickup
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending orders found.</p>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;