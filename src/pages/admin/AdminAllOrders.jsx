// Enhanced AdminAllOrders with All Orders tab
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import AdminOrders from "./AdminOrders";
import AdminReadyForPickup from "./AdminReadyForPickup";
import AllOrders from "./AllOrders";

const AdminAllOrders = () => {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Order Management</h1>

        {/* Enhanced Tab Navigation with 3 tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === "orders"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("orders")}
            >
              Pending Orders
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === "pickup"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("pickup")}
            >
              Ready For Pickup
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === "all"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("all")}
            >
              All Orders
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "pickup" && <AdminReadyForPickup />}
        {activeTab === "all" && <AllOrders />}
      </div>
    </div>
  );
};

export default AdminAllOrders;